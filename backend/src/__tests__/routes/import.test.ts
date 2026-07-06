// Ensure in-memory DB before models load
process.env.DATABASE_STORAGE = ':memory:';

import request from 'supertest';
import app from '../../app';
import { sequelize, ExamResult } from '../../models';

beforeEach(async () => {
  await sequelize.sync({ force: true });
});

afterAll(async () => {
  await sequelize.close();
});

test('POST /import accepts valid XML and returns imported count', async () => {
  const xml = `<?xml version="1.0"?>
  <mcq-test-results>
    <mcq-test-result scanned-on="2017-12-04T12:12:10+11:00">
      <first-name>Jane</first-name>
      <last-name>Austen</last-name>
      <student-number>521585128</student-number>
      <test-id>1234</test-id>
      <summary-marks available="20" obtained="13" />
    </mcq-test-result>
  </mcq-test-results>`;

  const res = await request(app)
    .post('/import')
    .set('Content-Type', 'text/xml+markr')
    .send(xml);

  expect(res.status).toBe(200);
  expect(res.body).toHaveProperty('imported', 1);
});

test('duplicates in a single request keep the highest marks and available', async () => {
  const xml = `<?xml version="1.0"?>
  <mcq-test-results>
    <mcq-test-result scanned-on="2017-12-04T12:12:10+11:00">
      <first-name>Dup</first-name>
      <last-name>User</last-name>
      <student-number>ABC123</student-number>
      <test-id>555</test-id>
      <summary-marks available="20" obtained="8" />
    </mcq-test-result>
    <mcq-test-result scanned-on="2017-12-04T12:13:10+11:00">
      <first-name>Dup</first-name>
      <last-name>User</last-name>
      <student-number>ABC123</student-number>
      <test-id>555</test-id>
      <summary-marks available="22" obtained="12" />
    </mcq-test-result>
  </mcq-test-results>`;

  const res = await request(app)
    .post('/import')
    .set('Content-Type', 'text/xml+markr')
    .send(xml);

  expect(res.status).toBe(200);
  expect(res.body).toHaveProperty('imported', 2);

  const row = await ExamResult.findOne({ where: { studentNumber: 'ABC123', testId: '555' } });
  expect(row).not.toBeNull();
  expect(row!.marksObtained).toBe(12);
  expect(row!.marksAvailable).toBe(22);
});

test('duplicates across multiple requests keep the highest values', async () => {
  const xml1 = `<?xml version="1.0"?>
  <mcq-test-results>
    <mcq-test-result scanned-on="2017-12-04T12:12:10+11:00">
      <first-name>Cross</first-name>
      <last-name>User</last-name>
      <student-number>X1</student-number>
      <test-id>999</test-id>
      <summary-marks available="20" obtained="5" />
    </mcq-test-result>
  </mcq-test-results>`;

  const xml2 = `<?xml version="1.0"?>
  <mcq-test-results>
    <mcq-test-result scanned-on="2017-12-04T12:14:10+11:00">
      <first-name>Cross</first-name>
      <last-name>User</last-name>
      <student-number>X1</student-number>
      <test-id>999</test-id>
      <summary-marks available="21" obtained="15" />
    </mcq-test-result>
  </mcq-test-results>`;

  const r1 = await request(app).post('/import').set('Content-Type', 'text/xml+markr').send(xml1);
  expect(r1.status).toBe(200);
  expect(r1.body).toHaveProperty('imported', 1);

  const r2 = await request(app).post('/import').set('Content-Type', 'text/xml+markr').send(xml2);
  expect(r2.status).toBe(200);
  expect(r2.body).toHaveProperty('imported', 1);

  const row = await ExamResult.findOne({ where: { studentNumber: 'X1', testId: '999' } });
  expect(row).not.toBeNull();
  expect(row!.marksObtained).toBe(15);
  expect(row!.marksAvailable).toBe(21);
});

test('reject entire document when a result is missing required fields', async () => {
  const xml = `<?xml version="1.0"?>
  <mcq-test-results>
    <mcq-test-result scanned-on="2017-12-04T12:12:10+11:00">
      <first-name>Good</first-name>
      <last-name>One</last-name>
      <student-number>S1</student-number>
      <test-id>111</test-id>
      <summary-marks available="20" obtained="10" />
    </mcq-test-result>
    <mcq-test-result scanned-on="2017-12-04T12:12:11+11:00">
      <first-name>Bad</first-name>
      <last-name>Missing</last-name>
      <!-- missing student-number -->
      <test-id>111</test-id>
      <summary-marks available="20" obtained="5" />
    </mcq-test-result>
  </mcq-test-results>`;

  const res = await request(app).post('/import').set('Content-Type', 'text/xml+markr').send(xml);
  expect(res.status).toBe(400);
  expect(res.body).toHaveProperty('error');

  const rows = await ExamResult.findAll({ where: { testId: '111' } });
  expect(rows.length).toBe(0);
});
