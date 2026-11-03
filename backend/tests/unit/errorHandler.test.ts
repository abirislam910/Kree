import { MulterError } from 'multer';
import express from 'express';
import request from 'supertest';
import errorHandler from '../../src/core/middleware/errorHandler.js';
import { ValidationError, InternalServerError, ExternalAPIError } from '../../src/core/errorTypes.js';

// Runs the handler inside a tiny Express app so it gets real req/res objects.
function appThatThrows (err: unknown): express.Express {
    const app = express();
    app.get('/', () => {
        throw err;
    });
    app.use(errorHandler);
    return app;
}

describe('errorHandler middleware', () => {
    beforeEach(() => {
        jest.spyOn(console, 'error').mockImplementation(() => {});
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });

    it.each<[string, unknown, number, string]>([
        ['exposed AppErrors with their message', new ValidationError('Invalid prompt'), 422, 'Invalid prompt'],
        ['upstream failures as 502', new ExternalAPIError('OpenAI down'), 502, 'OpenAI down'],
        ['non-exposed AppErrors with a generic message', new InternalServerError('db password wrong'), 500, 'An unexpected error occurred.'],
        ['Multer errors as 422 with the field', new MulterError('LIMIT_UNEXPECTED_FILE', 'photo'), 422, 'Unexpected field: photo'],
        ['Multer errors without a field as 422', new MulterError('LIMIT_PART_COUNT'), 422, 'Too many parts'],
        ['plain Errors as opaque 500s', new Error('stack trace details'), 500, 'An unexpected error occurred.'],
        ['thrown non-Error values as opaque 500s', 'just a string', 500, 'An unexpected error occurred.'],
    ])('responds to %s', async (_, err, status, message) => {
        const res = await request(appThatThrows(err)).get('/');

        expect(res.status).toBe(status);
        expect(res.body).toEqual({ error: { message } });
    });

    it('keeps the status and message of Express body-parser errors', async () => {
        const app = express();
        app.use(express.json());
        app.post('/', (_req, res) => { res.sendStatus(200); });
        app.use(errorHandler);

        const res = await request(app).post('/').set('Content-Type', 'application/json').send('{"not json');

        expect(res.status).toBe(400);
        expect(res.body).toEqual({ error: { message: expect.stringContaining('JSON') } });
    });
});
