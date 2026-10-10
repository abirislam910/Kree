const { MulterError } = require('multer');
const errorHandler = require('../../core/middleware/errorHandler.js');
const { ValidationError, InternalServerError, ExternalAPIError } = require('../../core/errorTypes.js');

function mockResponse() {
    const res = {};
    res.status = jest.fn(() => res);
    res.json = jest.fn(() => res);
    return res;
}

describe('errorHandler middleware', () => {
    beforeEach(() => {
        jest.spyOn(console, 'error').mockImplementation(() => {});
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });

    it('returns the status and message of exposed AppErrors', () => {
        const res = mockResponse();
        errorHandler(new ValidationError('Invalid prompt'), {}, res, jest.fn());

        expect(res.status).toHaveBeenCalledWith(422);
        expect(res.json).toHaveBeenCalledWith({ error: { message: 'Invalid prompt' } });
    });

    it('passes through 502 for upstream failures', () => {
        const res = mockResponse();
        errorHandler(new ExternalAPIError('OpenAI down'), {}, res, jest.fn());

        expect(res.status).toHaveBeenCalledWith(502);
        expect(res.json).toHaveBeenCalledWith({ error: { message: 'OpenAI down' } });
    });

    it('hides the message of non-exposed errors', () => {
        const res = mockResponse();
        errorHandler(new InternalServerError('db password wrong'), {}, res, jest.fn());

        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.json).toHaveBeenCalledWith({ error: { message: 'An unexpected error occurred.' } });
    });

    it('maps Multer upload errors to 422 with the offending field', () => {
        const res = mockResponse();
        errorHandler(new MulterError('LIMIT_UNEXPECTED_FILE', 'photo'), {}, res, jest.fn());

        expect(res.status).toHaveBeenCalledWith(422);
        expect(res.json).toHaveBeenCalledWith({ error: { message: 'Unexpected field: photo' } });
    });

    it('maps Multer errors without a field to 422', () => {
        const res = mockResponse();
        errorHandler(new MulterError('LIMIT_PART_COUNT'), {}, res, jest.fn());

        expect(res.status).toHaveBeenCalledWith(422);
        expect(res.json).toHaveBeenCalledWith({ error: { message: 'Too many parts' } });
    });

    it('treats plain Errors as opaque 500s', () => {
        const res = mockResponse();
        errorHandler(new Error('stack trace details'), {}, res, jest.fn());

        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.json).toHaveBeenCalledWith({ error: { message: 'An unexpected error occurred.' } });
    });
});
