import type { Request, Response, NextFunction } from 'express';

export const verifyAdmin = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  if (req.user.role !== 'admin') {
    return res
      .status(403)
      .json({ success: false, message: 'Forbidden action' });
  }

  next();
};
