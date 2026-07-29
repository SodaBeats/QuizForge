import type { Request, Response, NextFunction } from 'express';

export const verifyTeacher = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  if (req.user.role !== 'teacher')
    return res
      .status(401)
      .json({ success: false, message: 'Unauthorized action' });

  next();
};
