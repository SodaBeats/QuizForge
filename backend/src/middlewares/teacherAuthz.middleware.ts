import type { Request, Response, NextFunction } from 'express';

export const verifyTeacher = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  if (req.user.role !== 'teacher')
    return res
      .status(403)
      .json({ success: false, message: 'Forbidden action' });

  if (req.user.status === 'suspended')
    return res
      .status(403)
      .json({ success: false, message: 'Account Suspended' });

  next();
};
