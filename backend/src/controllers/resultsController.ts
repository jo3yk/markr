import { sequelize, ExamResult } from '../models';

function quantile(sorted: number[], q: number) {
  if (sorted.length === 0) return 0;
  const pos = (sorted.length - 1) * q;
  const lower = Math.floor(pos);
  const upper = Math.ceil(pos);
  if (lower === upper) return sorted[lower];
  const weight = pos - lower;
  return sorted[lower] + weight * (sorted[upper] - sorted[lower]);
}

function roundValue(value: number) {
  return Math.round(value * 1000) / 1000;
}

function buildHistogram(percentages: number[]) {
  // The dashboard expects ten fixed buckets spanning 0–100 percent.
  const bins = Array.from({ length: 10 }, (_, index) => ({
    lower_pct: index * 10,
    upper_pct: index * 10 + 10,
    count: 0,
  }));

  for (const value of percentages) {
    const normalized = Math.max(0, Math.min(100, value));
    const index = normalized === 100 ? 9 : Math.floor(normalized / 10);
    bins[index].count += 1;
  }

  return { bins, total: percentages.length };
}

function mapPercentages(results: any[]) {
  return results.map((result) => {
    if (result.marksAvailable === 0) return 0;
    return (result.marksObtained / result.marksAvailable) * 100;
  });
}

export class EsmeAggregator {
  static async fetchResultsForTest(testId: string) {
    return ExamResult.findAll({ where: { testId }, raw: true });
  }

  static async aggregateTestResults(testId: string) {
    const results = await EsmeAggregator.fetchResultsForTest(testId);
    if (!results.length) return null;

    // Convert stored marks into percentage values before computing summary stats.
    const percentages = mapPercentages(results);
    const sorted = percentages.slice().sort((a, b) => a - b);
    const count = percentages.length;
    const mean = percentages.reduce((sum, pct) => sum + pct, 0) / count;
    const variance = percentages.reduce((sum, pct) => sum + Math.pow(pct - mean, 2), 0) / count;
    const stddev = Math.sqrt(variance);

    return {
      mean: roundValue(mean),
      stddev: roundValue(stddev),
      min: roundValue(sorted[0]),
      max: roundValue(sorted.at(-1)!),
      p25: roundValue(quantile(sorted, 0.25)),
      p50: roundValue(quantile(sorted, 0.5)),
      p75: roundValue(quantile(sorted, 0.75)),
      count,
    }; 
  }

  static async histogramTestResults(testId: string) {
    const results = await EsmeAggregator.fetchResultsForTest(testId);
    if (!results.length) return null;
    const percentages = mapPercentages(results);
    return buildHistogram(percentages);
  }
}

export async function listTests() {
  // Group by test to expose the landing-page summary data without iterating in application code.
  const tests = await ExamResult.findAll({
    attributes: [
      ['testId', 'test_id'],
      [sequelize.fn('COUNT', sequelize.col('id')), 'student_count'],
      [sequelize.fn('MAX', sequelize.col('marksAvailable')), 'marks_available'],
    ],
    group: ['testId'],
    order: [['testId', 'ASC']],
    raw: true,
  });

  return tests.map((test: any) => ({
    test_id: test.test_id,
    student_count: Number(test.student_count),
    marks_available: Number(test.marks_available),
  }));
}
