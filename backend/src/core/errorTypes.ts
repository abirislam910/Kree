export class AppError extends Error {
    readonly statusCode: number;
    readonly expose: boolean;

    constructor(message: string, statusCode: number, expose: boolean, options: ErrorOptions = {}) {
        super(message, options);
        this.statusCode = statusCode;
        this.expose = expose;
    }
}

export class ValidationError extends AppError {
    constructor(message: string, options: ErrorOptions = {}) {
        super(message, 422, true, options);
    }
}

export class UnauthorizedError extends AppError {
    constructor(message: string, options: ErrorOptions = {}) {
        super(message, 401, true, options);
    }
}

export class ForbiddenError extends AppError {
    constructor(message: string, options: ErrorOptions = {}) {
        super(message, 403, true, options);
    }
}

export class NotFoundError extends AppError {
    constructor(message: string, options: ErrorOptions = {}) {
        super(message, 404, true, options);
    }
}

export class ConflictError extends AppError {
    constructor(message: string, options: ErrorOptions = {}) {
        super(message, 409, true, options);
    }
}

export class TooManyRequestsError extends AppError {
    constructor(message: string, options: ErrorOptions = {}) {
        super(message, 429, true, options);
    }
}

export class InternalServerError extends AppError {
    constructor(message: string, options: ErrorOptions = {}) {
        super(message, 500, false, options);
    }
}

export class ExternalAPIError extends AppError {
    constructor(message: string, options: ErrorOptions = {}) {
        super(message, 502, true, options);
    }
}
