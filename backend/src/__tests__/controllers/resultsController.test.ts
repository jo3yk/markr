process.env.DATABASE_STORAGE = ':memory:';

import { sequelize, ExamResult, Student, Exam } from '../../models';
import { EsmeAggregator, listTests } from '../../controllers/resultsController';

beforeEach(async () => {
  await sequelize.sync({ force: true });
});

afterAll(async () => {
  await sequelize.close();
});

test('aggregateTestResults computes summary statistics correctly', async () => {
  const student1 = await Student.create({
    studentNumber: 'S1',
    firstName: 'A',
    lastName: 'One'
  });

  const student2 = await Student.create({
    studentNumber: 'S2',
    firstName: 'B',
    lastName: 'Two'
  });

  const exam = await Exam.create({
    testId: '9999',
    marksAvailable: 20
  });
  
  await ExamResult.bulkCreate([
    {
      examId: exam.id,
      studentId: student1.id,
      scannedOn: new Date('2024-01-01T00:00:00Z'),
      marksObtained: 10,
    },
    {
      examId: exam.id,
      studentId: student2.id,
      scannedOn: new Date('2024-01-01T00:00:00Z'),
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
  const student1 = await Student.create({
    studentNumber: 'S1',
    firstName: 'A',
    lastName: 'One'
  });

  const student2 = await Student.create({
    studentNumber: 'S2',
    firstName: 'B',
    lastName: 'Two'
  });

  const student3 = await Student.create({
    studentNumber: 'S3',
    firstName: 'B',
    lastName: 'Two'
  });

  const exam = await Exam.create({
    testId: '8888',
    marksAvailable: 20
  });
  
  await ExamResult.bulkCreate([
    {
      examId: exam.id,
      studentId: student1.id,
      scannedOn: new Date('2024-01-01T00:00:00Z'),
      marksObtained: 1,
    },
    {
      examId: exam.id,
      studentId: student2.id,
      scannedOn: new Date('2024-01-01T00:00:00Z'),
      marksObtained: 9,
    },
    {
      examId: exam.id,
      studentId: student3.id,
      scannedOn: new Date('2024-01-01T00:00:00Z'),
      marksObtained: 20,
    },
  ]);

  const histogram = await EsmeAggregator.histogramTestResults('8888');
  expect(histogram).toEqual({
    total: 3,
    bins: [
      { lower_pct: 0, upper_pct: 10, count: 1 },
      { lower_pct: 10, upper_pct: 20, count: 0 },
      { lower_pct: 20, upper_pct: 30, count: 0 },
      { lower_pct: 30, upper_pct: 40, count: 0 },
      { lower_pct: 40, upper_pct: 50, count: 1 },
      { lower_pct: 50, upper_pct: 60, count: 0 },
      { lower_pct: 60, upper_pct: 70, count: 0 },
      { lower_pct: 70, upper_pct: 80, count: 0 },
      { lower_pct: 80, upper_pct: 90, count: 0 },
      { lower_pct: 90, upper_pct: 100, count: 1 },
    ],
  });
});

test('listTests returns ordered list and counts students correctly', async () => {
  const student1 = await Student.create({
    studentNumber: 'S1',
    firstName: 'A',
    lastName: 'One'
  });

  const student2 = await Student.create({
    studentNumber: 'S2',
    firstName: 'B',
    lastName: 'Two'
  });

  const exam1 = await Exam.create({
    testId: 'b000',
    marksAvailable: 10
  });

  const exam2 = await Exam.create({
    testId: 'a000',
    marksAvailable: 20
  });

  await ExamResult.bulkCreate([
    {
      studentId: student1.id,
      examId: exam1.id,
      scannedOn: new Date('2024-01-01T00:00:00Z'),
      marksObtained: 7,
    },
    {
      studentId: student2.id,
      examId: exam2.id,
      scannedOn: new Date('2024-01-01T00:00:00Z'),
      marksObtained: 15,
    },
  ]);

  const tests = await listTests();
  expect(tests).toEqual([
    { test_id: 'a000', student_count: 1, marks_available: 20 },
    { test_id: 'b000', student_count: 1, marks_available: 10 },
  ]);
});
