process.env.DATABASE_STORAGE = ':memory:';

import { sequelize, ExamResult } from '../../models';
import { EsmeAggregator, listTests } from '../../controllers/resultsController';

beforeAll(async () => {
  await sequelize.sync({ force: true });
});

afterAll(async () => {
  await sequelize.close();
});

test('aggregateTestResults computes summary statistics correctly', async () => {
  await ExamResult.bulkCreate([
    {
      testId: '9999',
      studentNumber: 'S1',
      firstName: 'A',
      lastName: 'One',
      scannedOn: new Date('2024-01-01T00:00:00Z'),
      marksAvailable: 20,
      marksObtained: 10,
    },
    {
      testId: '9999',
      studentNumber: 'S2',
      firstName: 'B',
      lastName: 'Two',
      scannedOn: new Date('2024-01-01T00:00:00Z'),
      marksAvailable: 20,
      marksObtained: 20,
    },
  ]);

  const summary = await EsmeAggregator.aggregateTestResults('9999');
  // use approximate comparisons for floating point results
  expect(summary).toEqual({
    count: 2,
    mean: 75,
    stddev: 25,
    min: 50,
    max: 100,
    p25: 62.5,
    p50: 75,
    p75: 87.5,
  });
});

test('histogramTestResults returns fixed bins and handles perfect scores', async () => {
  await ExamResult.bulkCreate([
    {
      testId: '8888',
      studentNumber: 'H1',
      firstName: 'X',
      lastName: 'One',
      scannedOn: new Date('2024-01-01T00:00:00Z'),
      marksAvailable: 10,
      marksObtained: 1,
    },
    {
      testId: '8888',
      studentNumber: 'H2',
      firstName: 'Y',
      lastName: 'Two',
      scannedOn: new Date('2024-01-01T00:00:00Z'),
      marksAvailable: 10,
      marksObtained: 9,
    },
    {
      testId: '8888',
      studentNumber: 'H3',
      firstName: 'Z',
      lastName: 'Three',
      scannedOn: new Date('2024-01-01T00:00:00Z'),
      marksAvailable: 20,
      marksObtained: 20,
    },
  ]);

  const histogram = await EsmeAggregator.histogramTestResults('8888');
  expect(histogram).toEqual({
    total: 3,
    bins: [
      { lower_pct: 0, upper_pct: 10, count: 0 },
      { lower_pct: 10, upper_pct: 20, count: 1 },
      { lower_pct: 20, upper_pct: 30, count: 0 },
      { lower_pct: 30, upper_pct: 40, count: 0 },
      { lower_pct: 40, upper_pct: 50, count: 0 },
      { lower_pct: 50, upper_pct: 60, count: 0 },
      { lower_pct: 60, upper_pct: 70, count: 0 },
      { lower_pct: 70, upper_pct: 80, count: 0 },
      { lower_pct: 80, upper_pct: 90, count: 0 },
      { lower_pct: 90, upper_pct: 100, count: 2 },
    ],
  });
});

test('listTests returns ordered list and counts students correctly', async () => {
  await sequelize.sync({ force: true });
  await ExamResult.bulkCreate([
    {
      testId: 'b000',
      studentNumber: 'B1',
      firstName: 'B',
      lastName: 'One',
      scannedOn: new Date('2024-01-01T00:00:00Z'),
      marksAvailable: 10,
      marksObtained: 7,
    },
    {
      testId: 'a000',
      studentNumber: 'A1',
      firstName: 'A',
      lastName: 'One',
      scannedOn: new Date('2024-01-01T00:00:00Z'),
      marksAvailable: 20,
      marksObtained: 15,
    },
  ]);

  const tests = await listTests();
  expect(tests).toEqual([
    { test_id: 'a000', student_count: 1, marks_available: 20 },
    { test_id: 'b000', student_count: 1, marks_available: 10 },
  ]);
});
