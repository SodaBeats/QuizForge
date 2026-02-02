import express from 'express';
import { db } from '../db/db.js';
import { loginValidator } from '../middlewares/loginValidator.middleware.js';

const router = express.Router();

router.post('/', 
  loginValidator,
  (req, res, next)=>{

    const { email, password } = req.body;

});