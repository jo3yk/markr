import { Router } from 'express';
import { JasperImporter } from '../controllers/importController';

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
    return res.status(400).json({ error: 'Invalid XML format' });
  }
});

export default router;
