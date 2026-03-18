
import { eq } from 'drizzle-orm';
import { db } from '../db/db.js';
import { users } from '../db/schema.js';

export const UserRepository = {

  async selectUserByEmail(email: string){
    const [result] = await db.select().from(users).where(eq(users.email, email));
    return result || null;
  }

};