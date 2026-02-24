import express, { type NextFunction, type Request, type Response } from 'express';
import { eq } from 'drizzle-orm';
import { db } from '../db/db.js'
import { uploaded_files } from '../db/schema.js';
import { verifyToken } from '../middlewares/auth.middleware.js';

const router = express.Router();

router.get('/', verifyToken, async(req: Request, res: Response, next: NextFunction)=>{

  try{
    const documents = await db.select({title: uploaded_files.filename})
    .from(uploaded_files)
    .where(eq(uploaded_files.user_id, req.user.id));

    res.status(200).json(documents);
  }catch(err){
    next(err);
  }

});

export default router;