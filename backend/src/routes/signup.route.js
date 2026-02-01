import express from 'express';
import { db } from '../db/db.js';
import { users } from '../db/schema.js';
import bcrypt from 'bcrypt';
import { signupValidator } from '../middlewares/signupValidator.middleware.js';

const router = express.Router();

router.post('/', 
  signupValidator,
  async (req, res, next)=>{

  if (!req.body?.email || !req.body?.password){
    res.status(500).json({success: false, message: 'Please fill required input'});
    return;
  }

  try{
    const [user] = await db.insert(users).values({
      first_name: req.body.first_name,
      last_name: req.body.last_name,
      email: req.body.email,
      password_hash: await bcrypt.hash(password, 10)
    })
  }catch(error){
    next(error);
  }

});

export default router;