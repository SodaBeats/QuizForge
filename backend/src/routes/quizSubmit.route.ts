import express from 'express';
import { verifyToken } from '../middlewares/auth.middleware.js';
import { getScore } from '../services/getScore.service.js';

const router = express.Router();

router.post('/', verifyToken, (req, res, next)=> {
  const {questions, answers, quiz} = req.body;
  const score = getScore(questions, answers);
});




export default router;