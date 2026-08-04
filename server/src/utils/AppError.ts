export class AppError extends Error {
  public readonly statusCode: number;
  public readonly isOperational: boolean;

  constructor(message: string, statusCode: number, isOperational = true) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    Object.setPrototypeOf(this, AppError.prototype);
    Error.captureStackTrace(this, this.constructor);
  }

  static badRequest(msg: string) { return new AppError(msg, 400); }
  static unauthorized(msg: string) { return new AppError(msg, 401); }
  static forbidden(msg: string) { return new AppError(msg, 403); }
  static notFound(msg: string) { return new AppError(msg, 404); }
  static conflict(msg: string) { return new AppError(msg, 409); }
}
