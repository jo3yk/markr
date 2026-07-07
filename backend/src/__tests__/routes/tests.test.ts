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

test('GET /tests returns all known tests ordered by test_id', async () => {
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
  
    const exam1 = await Exam.create({
      testId: '5678',
      marksAvailable: 10
    });

    const exam2 = await Exam.create({
      testId: '1234',
      marksAvailable: 20
    });

  
  await ExamResult.bulkCreate([
    {
      examId: exam1.id,
      studentId: student1.id,
      scannedOn: new Date('2024-01-01T00:00:00Z'),
      marksObtained: 7,
    },
    {
      examId: exam2.id,
      studentId: student2.id,
      scannedOn: new Date('2024-01-01T00:00:00Z'),
      marksObtained: 15,
    },
    {
      examId: exam2.id,
      studentId: student3.id,
      scannedOn: new Date('2024-01-01T00:00:00Z'),
      marksObtained: 13,
    },
  ]);

  const res = await request(app).get('/tests');

  expect(res.status).toBe(200);
  expect(res.body).toEqual({
    tests: [
      { test_id: '1234', student_count: 2, marks_available: 20 },
      { test_id: '5678', student_count: 1, marks_available: 10 },
    ],
  });
});

test('GET /tests returns empty list when no tests exist', async () => {
  await sequelize.sync({ force: true });

  const res = await request(app).get('/tests');

  expect(res.status).toBe(200);
  expect(res.body).toEqual({ tests: [] });
});
