import express from 'express';
import type { NextFunction, Request, Response } from 'express';
import { verifyToken } from '../middlewares/auth.middleware.js';
import { verifyAdmin } from '../middlewares/adminAuthz.middleware.js';
import { AdminService, AdminError } from '../services/admin.service.js';

const router = express.Router();

router.use(verifyToken, verifyAdmin);

function parseId(value: unknown) {
  if (typeof value !== 'string' || !/^\d+$/.test(value)) return null;
  const id = Number(value);
  return Number.isSafeInteger(id) && id >= 1 ? id : null;
}

function sendAdminError(
  error: unknown,
  res: Response,
  next: NextFunction,
) {
  if (error instanceof AdminError) {
    return res.status(error.status).json({ message: error.message });
  }
  return next(error);
}

router.get('/stats', async (_req, res, next) => {
  try {
    return res.status(200).json(await AdminService.getStats());
  } catch (error) {
    return sendAdminError(error, res, next);
  }
});

router.get('/users', async (req, res, next) => {
  try {
    return res.status(200).json(
      await AdminService.getUsers({
        role: req.query.role,
        verified: req.query.verified,
        page: req.query.page,
        limit: req.query.limit,
      }),
    );
  } catch (error) {
    return sendAdminError(error, res, next);
  }
});

router.post('/users', async (req: Request, res: Response, next) => {
  try {
    await AdminService.createUser(req.body);
    return res.status(201).json({ success: true });
  } catch (error) {
    return sendAdminError(error, res, next);
  }
});

router.patch('/users/:id', async (req: Request, res: Response, next) => {
  const id = parseId(req.params.id);
  if (id === null) {
    return res.status(400).json({ message: 'Invalid user ID' });
  }
  try {
    await AdminService.updateUser(id, req.body);
    return res.status(200).json({ success: true });
  } catch (error) {
    return sendAdminError(error, res, next);
  }
});

router.post('/users/:id/suspend', async (req: Request, res: Response, next) => {
  const id = parseId(req.params.id);
  if (id === null) return res.status(400).json({ message: 'Invalid user ID' });
  try {
    await AdminService.suspendUser(id);
    return res.status(200).json({ success: true });
  } catch (error) {
    return sendAdminError(error, res, next);
  }
});

router.post('/users/:id/unsuspend', async (req: Request, res: Response, next) => {
  const id = parseId(req.params.id);
  if (id === null) return res.status(400).json({ message: 'Invalid user ID' });
  try {
    await AdminService.unsuspendUser(id);
    return res.status(200).json({ success: true });
  } catch (error) {
    return sendAdminError(error, res, next);
  }
});

router.delete('/users/:id', async (req: Request, res: Response, next) => {
  const id = parseId(req.params.id);
  if (id === null) return res.status(400).json({ message: 'Invalid user ID' });
  try {
    await AdminService.deleteUser(id);
    return res.status(200).json({ success: true });
  } catch (error) {
    return sendAdminError(error, res, next);
  }
});

router.get('/exams', async (req, res, next) => {
  try {
    return res.status(200).json(
      await AdminService.getExams({
        page: req.query.page,
        limit: req.query.limit,
        sort: req.query.sort,
      }),
    );
  } catch (error) {
    return sendAdminError(error, res, next);
  }
});

export default router;
