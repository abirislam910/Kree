const express = require('express');
const app = express();
const dotenv = require('dotenv');
dotenv.config();

const corsConfig = require('./core/middleware/corsConfig.js');
const requestLogger = require('./core/middleware/requestLogger.js');
const cookieParser = require('cookie-parser');

const authRoutes = require('./features/auth/routes.js');
const collectionRoutes = require('./features/collection/routes.js');
const generationRoutes = require('./features/generation/routes.js');

const errorHandler = require('./core/middleware/errorHandler.js');

app.use(cookieParser());
app.use(corsConfig);
app.use(requestLogger);
app.use(express.json({ limit: '50mb' }));

app.use('/api/auth', authRoutes);
app.use('/api/collection', collectionRoutes);
app.use('/api/generate', generationRoutes);

app.use(errorHandler);

module.exports = app;