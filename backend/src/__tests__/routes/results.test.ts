// Ensure in-memory DB before models load
process.env.DATABASE_STORAGE = ':memory:';

import request from 'supertest';
import app from '../../app';
import { sequelize, ExamResult, Student, Exam } from '../../models';

beforeAll(async () => {
  await sequelize.sync({ force: true });
});

afterAll(async () => {
  await sequelize.close();
});

test('GET /results/:testId/aggregate returns correct summary percentages', async () => {
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
      testId: '1234',
      marksAvailable: 20
    });
  
  await ExamResult.bulkCreate([
    {
      examId: exam.id,
      studentId: student1.id,
      scannedOn: new Date('2024-01-01T00:00:00Z'),
      marksObtained: 13,
    },
    {
      examId: exam.id,
      studentId: student2.id,
      scannedOn: new Date('2024-01-01T00:00:00Z'),
      marksObtained: 15,
    },
  ]);

  const res = await request(app).get('/results/1234/aggregate');

  expect(res.status).toBe(200);
  expect(res.body).toEqual({
    mean: 70,
    stddev: 5,
    min: 65,
    max: 75,
    p25: 67.5,
    p50: 70,
    p75: 72.5,
    count: 2,
  });
});

test('GET /results/:testId/aggregate returns 404 for unknown test', async () => {
  const res = await request(app).get('/results/does-not-exist/aggregate');
  expect(res.status).toBe(404);
  expect(res.body).toEqual({ error: 'Not found' });
});
