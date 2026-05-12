class AppError extends Error {
    constructor(message, statusCode, expose, options = {}) {
        super(message, options);
        this.statusCode = statusCode;
        this.expose = expose;
    }
}

class ValidationError extends AppError {
    constructor(message, options = {}) {
        super(message, 422, true, options);
    }
}

class UnauthorizedError extends AppError {
    constructor(message, options = {}) {
        super(message, 401, true, options);
    }
}

class ForbiddenError extends AppError {
    constructor(message, options = {}) {
        super(message, 403, true, options);
    }
}

class NotFoundError extends AppError {
    constructor(message, options = {}) {
        super(message, 404, true, options);
    }
}

class ConflictError extends AppError {
    constructor(message, options = {}) {
        super(message, 409, true, options);
    }
}

class InternalServerError extends AppError {
    constructor(message, options = {}) {
        super(message, 500, false, options);
    }
}

class ExternalAPIError extends AppError {
    constructor(message, options = {}) {
        super(message, 502, true, options);
    }
}

module.exports = {
    AppError,
    ValidationError,
    UnauthorizedError,
    ForbiddenError,
    NotFoundError,
    ConflictError,
    InternalServerError,
    ExternalAPIError
};