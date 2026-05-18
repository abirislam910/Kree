const cors = require('cors');

const ORIGIN = process.env.FRONTEND_URL || 'http://localhost:3000';

module.exports = cors({
        credentials: true,
        allowedHeaders: ['Authorization', 'Content-Type'],
        methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
        origin: ORIGIN,
    });