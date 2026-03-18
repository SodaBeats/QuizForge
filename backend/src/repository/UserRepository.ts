
import { eq } from 'drizzle-orm';
import type {InferInsertModel} from 'drizzle-orm';
import { db } from '../db/db.js';
import { users } from '../db/schema.js';

type UserRegistrationData = Omit<InferInsertModel<typeof users>, 'id' | 'user_id' | 'created_at' | 'updated_at'>;

export const UserRepository = {

  async selectUserByEmail(email: string){
    const [result] = await db.select().from(users).where(eq(users.email, email));
    return result || null;
  },

  async checkEmailUniqeness(email: string){
    const result = await db.select().from(users).where(eq(users.email, email));
    return result;
  },

  async registerUser(data: UserRegistrationData){
    await db.insert(users).values(data);
  },

};