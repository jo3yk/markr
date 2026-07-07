// Ensure in-memory DB before models load
process.env.DATABASE_STORAGE = ':memory:';

import request from 'supertest';
import app from '../../app';
import { sequelize, ExamResult, Exam, Student } from '../../models';

beforeAll(async () => {
  await sequelize.sync({ force: true });
});

afterAll(async () => {
  await sequelize.close();
});

test('GET /results/:testId/histogram returns ten fixed bins with counts', async () => {
  const exam = await Exam.create({
    testId: '4444',
    marksAvailable: 20
  });

  const student1 = await Student.create({
    studentNumber: 'U1',
    firstName: 'One',
    lastName: 'U'
  });

  const student2 = await Student.create({
    studentNumber: 'U2',
    firstName: 'Two',
    lastName: 'U'
  });

  const student3 = await Student.create({
    studentNumber: 'U3',
    firstName: 'Three',
    lastName: 'U'
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

  const res = await request(app).get('/results/4444/histogram');

  expect(res.status).toBe(200);
  expect(res.body).toHaveProperty('bins');
  expect(res.body).toHaveProperty('total', 3);
  expect(res.body.bins).toHaveLength(10);
  expect(res.body.bins[0]).toEqual({ lower_pct: 0, upper_pct: 10, count: 1 });
  expect(res.body.bins[4]).toEqual({ lower_pct: 40, upper_pct: 50, count: 1 });
  expect(res.body.bins[9]).toEqual({ lower_pct: 90, upper_pct: 100, count: 1 });
});

test('GET /results/:testId/histogram returns 404 for unknown test', async () => {
  const res = await request(app).get('/results/nope/histogram');
  expect(res.status).toBe(404);
  expect(res.body).toEqual({ error: 'Not found' });
});
