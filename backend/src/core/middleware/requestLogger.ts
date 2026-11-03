import type { NextFunction, Request, Response } from 'express';

export default function requestLogger (req: Request, _res: Response, next: NextFunction): void {
    console.log(`Incoming Request: ${req.method} ${req.url}`);
    next();
}
