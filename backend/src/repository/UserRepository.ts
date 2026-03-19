
import { eq } from 'drizzle-orm';
import type {InferInsertModel} from 'drizzle-orm';
import { db } from '../db/db.js';
import { users } from '../db/schema.js';

type UserRegistrationData = Omit<InferInsertModel<typeof users>, 'id' | 'user_id' | 'created_at' | 'updated_at'>;

export const UserRepository = {

  //find user by email
  async selectUserByEmail(email: string){
    const [result] = await db.select().from(users).where(eq(users.email, email));
    return result ?? null;
  },

  //select a user by email (unique)
  async checkEmailUniqeness(email: string){
    const result = await db.select().from(users).where(eq(users.email, email));
    return result;
  },

  //register user
  async registerUser(data: UserRegistrationData){
    await db.insert(users).values(data);
  },

  //find user by refresh token
  async findRefreshTokenOwner(tokenUserId: number){
    const [result] = await db.select().from(users).where(eq(users.id, tokenUserId));
    return result;
  }

};