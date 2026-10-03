export class AppError extends Error {
  constructor(code, status = 500, message = 'An unexpected error occurred', details) {
    super(message);
    this.name = 'AppError';
    this.code = code;
    this.status = status;
    this.details = details;
    this.isOperational = true;
    Error.captureStackTrace?.(this, AppError);
  }
}
