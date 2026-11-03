import type { NextFunction, Request, Response } from 'express';
import { MulterError } from 'multer';
import { AppError, ValidationError } from '../errorTypes.js';
import { isRecord } from '../../lib/guards.js';
import type { ErrorResponseBody } from '../../lib/types.js';

const GENERIC_MESSAGE = 'An unexpected error occurred.';

interface HttpErrorDetails {
    statusCode: number;
    message: string;
}

// Errors from Express's own middleware (e.g. a malformed JSON body) aren't
// AppErrors but carry `statusCode` and `expose` the same way.
function describeError (err: unknown): HttpErrorDetails {
    if (err instanceof MulterError) {
        const validation = new ValidationError(err.field ? `${err.message}: ${err.field}` : err.message, { cause: err });
        return { statusCode: validation.statusCode, message: validation.message };
    }
    if (err instanceof AppError) {
        return { statusCode: err.statusCode, message: err.expose ? err.message : GENERIC_MESSAGE };
    }
    if (err instanceof Error && isRecord(err) && typeof err['statusCode'] === 'number') {
        return { statusCode: err['statusCode'], message: err['expose'] === true ? err.message : GENERIC_MESSAGE };
    }
    return { statusCode: 500, message: GENERIC_MESSAGE };
}

export default function errorHandler (err: unknown, _req: Request, res: Response<ErrorResponseBody>, _next: NextFunction): void {
    console.error(err);
    const { statusCode, message } = describeError(err);
    res.status(statusCode).json({ error: { message } });
}
