process.env.DATABASE_STORAGE = ':memory:';

import { sequelize, ExamResult, Student, Exam } from '../../models';
import { JasperImporter } from '../../controllers/importController';

beforeEach(async () => {
  await sequelize.sync({ force: true });
});

afterAll(async () => {
  await sequelize.close();
});

async function getStoredResult(studentNumber: string, testId: string) {
  return ExamResult.findOne({
    include: [
      { model: Student, as: 'student', where: { studentNumber } },
      { model: Exam, as: 'exam', where: { testId } },
    ],
    raw: true,
  });
}

test('normalizeResult returns normalized structured result for valid XML object', () => {
  const raw = {
    'scanned-on': '2024-01-01T00:00:00Z',
    'first-name': 'Jane',
    'last-name': 'Austen',
    'student-number': '521585128',
    'test-id': '1234',
    'summary-marks': {
      'available': '20',
      'obtained': '13',
    },
    answer: {
      'question': '1',
      'marks-available': '1',
      'marks-awarded': '1',
      '#text': 'A',
    },
  };

  const normalized = JasperImporter.normalizeResult(raw);

  expect(normalized).toEqual({
    scannedOn: new Date('2024-01-01T00:00:00Z'),
    firstName: 'Jane',
    lastName: 'Austen',
    studentNumber: '521585128',
    testId: '1234',
    marksAvailable: 20,
    marksObtained: 13,
    answers: [
      {
        question: 1,
        marksAvailable: 1,
        marksAwarded: 1,
        value: 'A',
      },
    ],
  });
});

test('parseMarkrXml parses valid document and rejects invalid documents', () => {
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<mcq-test-results>
  <mcq-test-result scanned-on="2024-01-01T00:00:00Z">
    <first-name>Jane</first-name>
    <last-name>Austen</last-name>
    <student-number>521585128</student-number>
    <test-id>1234</test-id>
    <summary-marks available="20" obtained="13" />
  </mcq-test-result>
</mcq-test-results>`;

  const parsed = JasperImporter.parseMarkrXml(xml);
  expect(parsed).toHaveLength(1);
  expect(parsed[0].testId).toBe('1234');
  expect(parsed[0].marksAvailable).toBe(20);
  expect(parsed[0].marksObtained).toBe(13);

  expect(() => JasperImporter.parseMarkrXml('<invalid></invalid>')).toThrow('Invalid XML format');
});

test('importResults stores records and keeps the highest available for duplicate student scans', async () => {
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<mcq-test-results>
  <mcq-test-result scanned-on="2024-01-01T00:00:00Z">
    <first-name>Jane</first-name>
    <last-name>Austen</last-name>
    <student-number>521585128</student-number>
    <test-id>1234</test-id>
    <summary-marks available="23" obtained="13" />
  </mcq-test-result>
  <mcq-test-result scanned-on="2024-01-01T00:05:00Z">
    <first-name>Jane</first-name>
    <last-name>Austen</last-name>
    <student-number>521585128</student-number>
    <test-id>1234</test-id>
    <summary-marks available="20" obtained="17" />
  </mcq-test-result>
</mcq-test-results>`;

  const imported = await JasperImporter.importResults(xml);
  expect(imported).toBe(2);

  const stored = await getStoredResult('521585128', '1234');

  expect(stored).not.toBeNull();
  expect(stored?.marksObtained).toBe(17);
  // included associations are available on the instance; cast to any for the test
  expect((stored as any)['exam.marksAvailable']).toBe(23);
});

test('importResults stores records and keeps the highest obtained for duplicate student scans (same marks available)', async () => {
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<mcq-test-results>
  <mcq-test-result scanned-on="2024-01-01T00:00:00Z">
    <first-name>Jane</first-name>
    <last-name>Austen</last-name>
    <student-number>521585128</student-number>
    <test-id>1234</test-id>
    <summary-marks available="20" obtained="13" />
  </mcq-test-result>
  <mcq-test-result scanned-on="2024-01-01T00:05:00Z">
    <first-name>Jane</first-name>
    <last-name>Austen</last-name>
    <student-number>521585128</student-number>
    <test-id>1234</test-id>
    <summary-marks available="20" obtained="17" />
  </mcq-test-result>
</mcq-test-results>`;

  const imported = await JasperImporter.importResults(xml);
  expect(imported).toBe(2);

  const stored = await getStoredResult('521585128', '1234');

  expect(stored).not.toBeNull();
  expect(stored?.marksObtained).toBe(17);
  // included associations are available on the instance; cast to any for the test
  expect((stored as any)['exam.marksAvailable']).toBe(20);
});

test('importResults stores records and keeps the highest obtained for duplicate student scans (higher marks available)', async () => {
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<mcq-test-results>
  <mcq-test-result scanned-on="2024-01-01T00:00:00Z">
    <first-name>Jane</first-name>
    <last-name>Austen</last-name>
    <student-number>521585128</student-number>
    <test-id>1234</test-id>
    <summary-marks available="20" obtained="13" />
  </mcq-test-result>
  <mcq-test-result scanned-on="2024-01-01T00:05:00Z">
    <first-name>Jane</first-name>
    <last-name>Austen</last-name>
    <student-number>521585128</student-number>
    <test-id>1234</test-id>
    <summary-marks available="24" obtained="17" />
  </mcq-test-result>
</mcq-test-results>`;

  const imported = await JasperImporter.importResults(xml);
  expect(imported).toBe(2);

  const stored = await getStoredResult('521585128', '1234');
  
  expect(stored).not.toBeNull();
  expect(stored?.marksObtained).toBe(17);
  // included associations are available on the instance; cast to any for the test
  expect((stored as any)['exam.marksAvailable']).toBe(24);
});

test('importResults stores records and keeps the highest available for duplicate student scans (higher marks obtained)', async () => {
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<mcq-test-results>
  <mcq-test-result scanned-on="2024-01-01T00:00:00Z">
    <first-name>Jane</first-name>
    <last-name>Austen</last-name>
    <student-number>521585128</student-number>
    <test-id>1234</test-id>
    <summary-marks available="25" obtained="13" />
  </mcq-test-result>
  <mcq-test-result scanned-on="2024-01-01T00:05:00Z">
    <first-name>Jane</first-name>
    <last-name>Austen</last-name>
    <student-number>521585128</student-number>
    <test-id>1234</test-id>
    <summary-marks available="20" obtained="17" />
  </mcq-test-result>
</mcq-test-results>`;

  const imported = await JasperImporter.importResults(xml);
  expect(imported).toBe(2);

  const stored = await getStoredResult('521585128', '1234');

  expect(stored).not.toBeNull();
  expect(stored?.marksObtained).toBe(17);
  // included associations are available on the instance; cast to any for the test
  expect((stored as any)['exam.marksAvailable']).toBe(25);
});
