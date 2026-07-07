import { Router } from 'express';
import { listTests } from '../controllers/resultsController';
import { asyncHandler } from '../middleware/errorHandler';

const router = Router();

router.get('/', asyncHandler(async (_req, res) => {
  const tests = await listTests();
  return res.json({ tests });
}));

export default router;
