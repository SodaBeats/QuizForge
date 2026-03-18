
import { db } from '../db/db.js';
import { refresh_tokens } from '../db/schema.js';

export const RefreshTokenRepository = {

  async InsertRefreshToken(userId: number, token: string, expiresAt: Date){
    await db.insert(refresh_tokens).values({
      user_id: userId,
      token: token,
      expires_at: expiresAt,
    });
  }
};