import express from 'express';


//establish router
const router = express.Router();


router.post('/', async (req, res, next)=>{
    console.log(req.body);
  }
);

export default router;