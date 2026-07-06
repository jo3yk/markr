import { Router } from 'express';
import { EsmeAggregator } from '../controllers/resultsController';

const router = Router();

router.get('/:testId/aggregate', async (req, res) => {
  const { testId } = req.params;
  const summary = await EsmeAggregator.aggregateTestResults(testId);

  if (!summary) {
    return res.status(404).json({ error: 'Not found' });
  }

  return res.json(summary);
});

router.get('/:testId/histogram', async (req, res) => {
  const { testId } = req.params;
  const histogram = await EsmeAggregator.histogramTestResults(testId);

  if (!histogram) {
    return res.status(404).json({ error: 'Not found' });
  }

  return res.json(histogram);
});

export default router;
