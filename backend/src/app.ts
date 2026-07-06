import express from 'express';
import importRoutes from './routes/importRoutes';
import resultsRoutes from './routes/resultsRoutes';
import testsRoutes from './routes/testsRoutes';
import helmet from 'helmet';
import cors from 'cors';
import { errorHandler } from './middleware/errorHandler';

const app = express();

// Parse JSON bodies for normal API traffic and raw XML for the import endpoint.
app.use(express.json());
app.use(express.text({ type: 'text/xml+markr', limit: '1mb' }));

// 1. Set security HTTP headers (must come first)
app.use(helmet());

// 2. Configure and enable Cross-Origin Resource Sharing
const corsOptions = {
  origin: process.env.CORS_ORIGIN ?? 'http://localhost:5173', 
  optionsSuccessStatus: 200
};
app.use(cors(corsOptions));

app.get('/', (_req, res) => {
  res.json({ status: 'ok', message: 'Markr backend API' });
});

app.use('/import', importRoutes);
app.use('/results', resultsRoutes);
app.use('/tests', testsRoutes);

// Centralized error-handling middleware (must be after all routes)
app.use(errorHandler);

export default app;
