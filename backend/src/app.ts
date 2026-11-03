// Must be the first import: middleware below reads env vars when loaded.
import 'dotenv/config';
import express from 'express';
import cookieParser from 'cookie-parser';

import corsConfig from './core/middleware/corsConfig.js';
import requestLogger from './core/middleware/requestLogger.js';
import errorHandler from './core/middleware/errorHandler.js';

import authRoutes from './features/auth/routes.js';
import collectionRoutes from './features/collection/routes.js';
import generationRoutes from './features/generation/routes.js';

const app = express();

app.use(cookieParser());
app.use(corsConfig);
app.use(requestLogger);
app.use(express.json({ limit: '50mb' }));

app.use('/api/auth', authRoutes);
app.use('/api/collection', collectionRoutes);
app.use('/api/generate', generationRoutes);

app.use(errorHandler);

export default app;
