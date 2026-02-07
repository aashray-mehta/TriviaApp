import { Request, Response, NextFunction } from 'express';

/**
 * Global error handler.
 * Catches any unhandled errors thrown in route handlers and returns
 * a safe JSON error response instead of leaking stack traces.
 */
export function errorHandler(
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  // Handle malformed JSON body
  if ((err as any).type === 'entity.parse.failed') {
    res.status(400).json({ error: 'Malformed JSON in request body' });
    return;
  }

  // Handle payload too large
  if ((err as any).type === 'entity.too.large') {
    res.status(413).json({ error: 'Request body too large' });
    return;
  }

  console.error('Unhandled error:', err.message);
  res.status(500).json({ error: 'Internal server error' });
}
