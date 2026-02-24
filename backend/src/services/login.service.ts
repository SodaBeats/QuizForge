import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { db } from '../db/db.js';
import { eq } from 'drizzle-orm';
import { users, refresh_tokens } from '../db/schema.js';

interface Data {
  email: string,
  password: string
};

export const handleLogin = async(data: Data) => {

  const { email, password } = data;

  try{

    //check if the account exists
    const [existingUser] = await db.select().from(users).where(eq(users.email, email));
    if(!existingUser){
      const error = new Error ('Invalid Credentials');
      (error as any).status = 401;
      throw error;
    }

    //check if password is valid
    const isValid = await bcrypt.compare(password, existingUser.password_hash);
    if(!isValid){
      const error = new Error ('Invalid Credentials');
      (error as any).status = 401;
      throw error;
    }

    //generate access token
    const accessToken = jwt.sign(
      {id: existingUser.id, email: existingUser.email, role: existingUser.role},
      process.env.JWT_SECRET,
      {expiresIn: '15m'} //jsonwebtoken would convert this to timestamp
    );

    //generate refresh token
    const refreshToken = jwt.sign(
      {id: existingUser.id},
      process.env.REFRESH_TOKEN_SECRET,
      {expiresIn: '7d'}
    );

    const expiresAt = new Date(Date.now() + 7*24*60*60*1000); // 7 days

    //insert refresh token to database
    await db.insert(refresh_tokens).values({
      user_id: existingUser.id,
      token: refreshToken,
      expires_at: expiresAt,
      revoked: false
    });

    return {
      accessToken: accessToken,
      refreshToken: refreshToken,
      user: {
        id: existingUser.id,
        email: existingUser.email,
        first_name: existingUser.first_name,
        role: existingUser.role
      }
    };
  }
  catch (error){
    throw error;
  }
};