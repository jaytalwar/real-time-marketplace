class AppError extends Error {
    constructor(message, statusCode = 500) {
        super(message);
        this.statusCode = statusCode;
        this.isAppError = true;
        Error.captureStackTrace(this, this.constructor);
    }
}

export default AppError;
