import jwt from 'jsonwebtoken';
import { eq } from 'drizzle-orm';
import { db } from '../db/db.js';
import { refresh_tokens, users } from '../db/schema.js';

export const handleAccessTokenGeneration = async (refreshToken: string) => {

  try{

    //verify refresh token
    jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET);

    //get the refresh token from the database
    const [activeRefresh] = await db.select().from(refresh_tokens).where(eq(refresh_tokens.token, refreshToken));

    //check if it exists, returns a failure if none
    if(!activeRefresh){
      const error = new Error('Token not found');
      (error as any).status = 401;
      throw error;
    }

    //get the owner of the refresh token
    const [user] = await db.select().from(users).where(eq(users.id, activeRefresh.user_id));

    //check if user exists
    if (!user) {
      const error = new Error('User does not exist');
      (error as any).status = 401;
      throw error;
    }

    //generate new access token
    const newAccessToken = jwt.sign(
      {id: user.id, email: user.email, role: user.role},
      process.env.JWT_SECRET,
      {expiresIn: '15m'}
    );

    return newAccessToken;

  }catch (error: any) {
    // If it's one of our custom 401 errors, or a JWT error, keep it as is
    if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
      error.status = 401; // Attach a 401 so the controller knows what to do
    }
    // Re-throw the original object so the Controller/Middleware gets all the details
    throw error; 
  }

};
