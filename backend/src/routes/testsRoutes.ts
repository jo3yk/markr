import { Router } from 'express';
import { listTests } from '../controllers/resultsController';

const router = Router();

router.get('/', async (_req, res) => {
  const tests = await listTests();
  return res.json({ tests });
});

export default router;
