import type { AdminRole } from '../repository/AdminRepository.js';
import { AdminRepository } from '../repository/AdminRepository.js';

export class AdminError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

const roles: AdminRole[] = ['student', 'teacher', 'admin'];

function parsePositiveInteger(value: unknown, fallback: number) {
  if (value === undefined) return fallback;
  if (typeof value !== 'string' || !/^\d+$/.test(value)) return null;
  const parsed = Number(value);
  return Number.isSafeInteger(parsed) && parsed >= 1 ? parsed : null;
}

export const AdminService = {
  getStats() {
    return AdminRepository.getStats();
  },

  async getUsers(query: {
    role?: unknown;
    verified?: unknown;
    page?: unknown;
    limit?: unknown;
  }) {
    let role: AdminRole | undefined;
    if (query.role !== undefined) {
      if (typeof query.role !== 'string' || !roles.includes(query.role as AdminRole)) {
        throw new AdminError(400, 'Invalid role');
      }
      role = query.role as AdminRole;
    }

    let verified: boolean | undefined;
    if (query.verified !== undefined) {
      if (query.verified === 'true') verified = true;
      else if (query.verified === 'false') verified = false;
      else throw new AdminError(400, 'Invalid verified parameter');
    }

    const page = parsePositiveInteger(query.page, 1);
    const limit = parsePositiveInteger(query.limit, 10);
    if (page === null || limit === null) {
      throw new AdminError(400, 'Invalid pagination parameters');
    }

    return AdminRepository.getUsers({ role, verified, page, limit });
  },

  async createUser(body: Record<string, unknown>) {
    const first_name =
      typeof body.first_name === 'string' ? body.first_name.trim() : '';
    const last_name =
      typeof body.last_name === 'string' ? body.last_name.trim() : '';
    const email =
      typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';
    const password = typeof body.password === 'string' ? body.password : '';
    const role = body.role;

    if (!first_name || !last_name || !email || !password || role === undefined) {
      throw new AdminError(400, 'Missing required fields');
    }
    if (typeof role !== 'string' || !roles.includes(role as AdminRole)) {
      throw new AdminError(400, 'Invalid role');
    }

    let is_verified = false;
    if (body.is_verified !== undefined) {
      if (typeof body.is_verified !== 'boolean') {
        throw new AdminError(400, 'Invalid is_verified');
      }
      is_verified = body.is_verified;
    }

    if (await AdminRepository.findByEmail(email)) {
      throw new AdminError(409, 'Email already exists');
    }

    try {
      return await AdminRepository.createUser({
        first_name,
        last_name,
        email,
        password,
        role: role as AdminRole,
        is_verified,
      });
    } catch (error: any) {
      if (error?.cause?.code === '23505' || error?.code === '23505') {
        throw new AdminError(409, 'Email already exists');
      }
      throw error;
    }
  },

  async updateUser(
    id: number,
    body: Record<string, unknown>,
  ) {
    if (!Number.isSafeInteger(id) || id < 1) {
      throw new AdminError(400, 'Invalid user ID');
    }

    const update: { role?: AdminRole; is_verified?: boolean } = {};
    if (body.role !== undefined) {
      if (typeof body.role !== 'string' || !roles.includes(body.role as AdminRole)) {
        throw new AdminError(400, 'Invalid role');
      }
      update.role = body.role as AdminRole;
    }
    if (body.is_verified !== undefined) {
      if (typeof body.is_verified !== 'boolean') {
        throw new AdminError(400, 'Invalid is_verified');
      }
      update.is_verified = body.is_verified;
    }

    const updated = await AdminRepository.updateUser(id, update);
    if (!updated) {
      throw new AdminError(404, 'User not found');
    }
    return updated;
  },

  async suspendUser(id: number) {
    const updated = await AdminRepository.suspendUser(id);
    if (!updated) throw new AdminError(404, 'User not found');
  },

  async unsuspendUser(id: number) {
    const updated = await AdminRepository.unsuspendUser(id);
    if (!updated) throw new AdminError(404, 'User not found');
  },

  async deleteUser(id: number) {
    const deleted = await AdminRepository.deleteUser(id);
    if (!deleted) throw new AdminError(404, 'User not found');
  },

  async getExams(query: { page?: unknown; limit?: unknown; sort?: unknown }) {
    const page = parsePositiveInteger(query.page, 1);
    const limit = parsePositiveInteger(query.limit, 10);
    if (page === null || limit === null) {
      throw new AdminError(400, 'Invalid pagination parameters');
    }
    if (query.sort !== undefined && query.sort !== 'created_at_desc') {
      throw new AdminError(400, 'Invalid sort parameter');
    }
    return AdminRepository.getExams(page, limit);
  },
};
