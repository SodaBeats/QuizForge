
import { eq } from 'drizzle-orm';
import { db } from '../db/db.js';
import { refresh_tokens } from '../db/schema.js';

export const RefreshTokenRepository = {

  async insertRefreshToken(userId: number, token: string, expiresAt: Date){
    await db.insert(refresh_tokens).values({
      user_id: userId,
      token: token,
      expires_at: expiresAt,
    });
  },

  async deleteRefreshToken(token: string){
    await db.delete(refresh_tokens).where(eq(refresh_tokens.token, token));
  }
};