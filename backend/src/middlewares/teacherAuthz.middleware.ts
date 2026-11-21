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

  // A valid login is not enough for a teacher: an admin has to flip
  // is_verified first (the frontend parks these accounts on
  // /awaiting-verification).
  if (!req.user.isVerified)
    return res
      .status(403)
      .json({ success: false, message: 'Awaiting verification' });

  next();
};
