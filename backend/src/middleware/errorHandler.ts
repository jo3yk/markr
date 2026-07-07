import { Request, Response, NextFunction } from 'express';

export class MarkrError extends Error {
  public statusCode: number;

  constructor(message: string, statusCode: number) {
    super(message);
    this.statusCode = statusCode;
    
    // Ensure the prototype chain is correctly restored
    this.name = this.constructor.name;
    Object.setPrototypeOf(this, new.target.prototype);
    Error.captureStackTrace(this, this.constructor);
  }
}

export const errorHandler = (
  err: Error | MarkrError,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  // If response headers are already sent, delegate to the default Express handler
  if (res.headersSent) {
    return next(err);
  }

  const statusCode = err instanceof MarkrError ? err.statusCode : 400; // Per the spec, return a 400 on any kind of error (even if it should be a 5xx)
  const responseMessage = err instanceof MarkrError ? err.message : 'Internal Server Error';

  // Log the error for server-side visibility (TODO: proper logging for production)
  console.error(`[Error] ${statusCode} - ${err.message}`);

  res.status(statusCode).json({
    success: false,
    status: statusCode,
    message: responseMessage,
    // Only reveal stack traces in development mode
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
};

/**
 * Wraps an async route handler to forward errors to the error middleware.
 * This prevents unhandled promise rejections from escaping the request handler.
 */
export const asyncHandler = (
  fn: (req: Request, res: Response, next: NextFunction) => Promise<any>
) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};
