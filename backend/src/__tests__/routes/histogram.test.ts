// Ensure in-memory DB before models load
process.env.DATABASE_STORAGE = ':memory:';

import request from 'supertest';
import app from '../../app';
import { sequelize, ExamResult } from '../../models';

beforeAll(async () => {
  await sequelize.sync({ force: true });
});

afterAll(async () => {
  await sequelize.close();
});

test('GET /results/:testId/histogram returns ten fixed bins with counts', async () => {
  await ExamResult.bulkCreate([
    {
      testId: '4444',
      studentNumber: 'U1',
      firstName: 'One',
      lastName: 'U',
      scannedOn: new Date('2024-01-01T00:00:00Z'),
      marksAvailable: 10,
      marksObtained: 1,
    },
    {
      testId: '4444',
      studentNumber: 'U2',
      firstName: 'Two',
      lastName: 'U',
      scannedOn: new Date('2024-01-01T00:00:00Z'),
      marksAvailable: 10,
      marksObtained: 9,
    },
    {
      testId: '4444',
      studentNumber: 'U3',
      firstName: 'Three',
      lastName: 'U',
      scannedOn: new Date('2024-01-01T00:00:00Z'),
      marksAvailable: 20,
      marksObtained: 20,
    },
  ]);

  const res = await request(app).get('/results/4444/histogram');

  expect(res.status).toBe(200);
  expect(res.body).toHaveProperty('bins');
  expect(res.body).toHaveProperty('total', 3);
  expect(res.body.bins).toHaveLength(10);
  expect(res.body.bins[0]).toEqual({ lower_pct: 0, upper_pct: 10, count: 0 });
  expect(res.body.bins[1]).toEqual({ lower_pct: 10, upper_pct: 20, count: 1 });
  expect(res.body.bins[9]).toEqual({ lower_pct: 90, upper_pct: 100, count: 2 });
});

test('GET /results/:testId/histogram returns 404 for unknown test', async () => {
  const res = await request(app).get('/results/nope/histogram');
  expect(res.status).toBe(404);
  expect(res.body).toEqual({ error: 'Not found' });
});
