import { ExamResult, sequelize } from '../models';
import { markrXmlParser } from '../services/xmlParser';

export interface NormalizedAnswer {
  question: number;
  marksAvailable: number;
  marksAwarded: number;
  value: string;
}

export interface NormalizedResult {
  scannedOn: Date;
  firstName: string;
  lastName: string;
  studentNumber: string;
  testId: string;
  marksAvailable: number;
  marksObtained: number;
  answers: NormalizedAnswer[];
}

const xmlParser = markrXmlParser;

function isNotNull<T>(value: T | null): value is T {
  return value !== null;
}

export class JasperImporter {
  static normalizeResult(result: any): NormalizedResult | null {
    if (!result) return null;

    const scannedOn = result['scanned-on'];

    const parsedScannedOn = new Date(scannedOn);
    if (Number.isNaN(parsedScannedOn.getDate())) {
      return null;
    }

    const firstName = result['first-name'];
    const lastName = result['last-name'];
    const studentNumber = result['student-number'];
    const testId = result['test-id'];
    const summaryMarks = result['summary-marks'];

    if (!scannedOn || !firstName || !lastName || !studentNumber || !testId || !summaryMarks) {
      return null;
    }

    const available = Number(summaryMarks['available']);
    const obtained = Number(summaryMarks['obtained']);

    if (!Number.isFinite(available) || !Number.isFinite(obtained)) {
      return null;
    }

    let rawAnswers: any = result['answer'];
    if (rawAnswers && !Array.isArray(rawAnswers)) rawAnswers = [rawAnswers];

    const answers = (rawAnswers ?? []).map((a: any) => {
      const question = Number(a['@_question'] ?? a['question']);
      const marksAvailable = Number(a['@_marks-available'] ?? a['marks-available']);
      const marksAwarded = Number(a['@_marks-awarded'] ?? a['marks-awarded']);
      const value = typeof a === 'string' ? a : (a['#text'] ?? a['text'] ?? '');
      return {
        question,
        marksAvailable,
        marksAwarded,
        value: String(value),
      };
    });

    return {
      scannedOn: parsedScannedOn,
      firstName: String(firstName),
      lastName: String(lastName),
      studentNumber: String(studentNumber),
      testId: String(testId),
      marksAvailable: available,
      marksObtained: obtained,
      answers,
    };
  }

  static parseMarkrXml(xml: string): NormalizedResult[] {
    let parsed;
    try {
      parsed = xmlParser.parse(xml);
    } catch (error) {
      throw new Error('Invalid XML format');
    }

    const resultsContainer = parsed['mcq-test-results'];
    if (!resultsContainer) {
      throw new Error('Invalid XML format');
    }

    let rawResults = resultsContainer['mcq-test-result'];
    if (!rawResults) {
      throw new Error('Invalid XML format');
    }

    if (!Array.isArray(rawResults)) {
      rawResults = [rawResults];
    }

    const normalized: Array<NormalizedResult | null> = rawResults.map((result: any) => JasperImporter.normalizeResult(result));
    if (normalized.includes(null)) {
      throw new Error('Invalid XML format');
    }

    return normalized.filter(isNotNull);
  }

  static async importResults(xml: string): Promise<number> {
    const validResults = JasperImporter.parseMarkrXml(xml);
    let imported = 0;

    // Wrap all database operations in a transaction for atomicity
    await sequelize.transaction(async (t) => {
      // Each record is treated as an upsert so rescans can replace weaker scores without duplication.
      for (const result of validResults) {
        const [existing, created] = await ExamResult.findOrCreate({
          where: {
            testId: result.testId,
            studentNumber: result.studentNumber,
          },
          defaults: {
            testId: result.testId,
            studentNumber: result.studentNumber,
            firstName: result.firstName,
            lastName: result.lastName,
            scannedOn: result.scannedOn,
            marksAvailable: result.marksAvailable,
            marksObtained: result.marksObtained,
          },
          transaction: t,
        });

        if (created) {
          imported += 1;
          continue;
        }

        const shouldUpdate =
          result.marksObtained > existing.marksObtained ||
          result.marksAvailable > existing.marksAvailable;

        if (shouldUpdate) {
          existing.marksObtained = Math.max(existing.marksObtained, result.marksObtained);
          existing.marksAvailable = Math.max(existing.marksAvailable, result.marksAvailable);
          existing.scannedOn = new Date(Math.max(result.scannedOn.getTime(), existing.scannedOn.getTime()));
          existing.firstName = result.firstName;
          existing.lastName = result.lastName;
          await existing.save({ transaction: t });
        }

        imported += 1;
      }
    });

    return imported;
  }
}
