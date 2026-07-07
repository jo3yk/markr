import { Router } from 'express';
import { JasperImporter } from '../controllers/importController';
import { MarkrError } from '../middleware/errorHandler';

const router = Router();

router.post('/', async (req, res) => {
  const contentType = req.get('content-type') ?? '';
  if (!contentType.startsWith('text/xml+markr')) {
    return res.status(400).json({ error: 'Content-Type must be text/xml+markr' });
  }

  const xml = typeof req.body === 'string' ? req.body : '';
  if (!xml.trim()) {
    return res.status(400).json({ error: 'Empty request body' });
  }

  try {
    const imported = await JasperImporter.importResults(xml);
    return res.json({ imported });
  } catch (error) {
    if (error instanceof Error && error.message === 'Invalid XML format') {
      return res.status(400).json({ error: 'Invalid XML format' });
    }
    if (error instanceof MarkrError) {
      return res.status(error.statusCode).json({ error: error.message})
    }
    return res.status(400).json({error: 'Internal server error'});
  }
});

export default router;
