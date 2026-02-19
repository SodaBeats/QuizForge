import type { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

interface UserPayload {
  id: number;
  email: string;
  role: string;
}

export const verifyToken = (req: Request, res: Response, next: NextFunction) => {

  //get token from header
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if(!token){
    return res.status(401).json({message: 'Access Denied'});
  }
  try{
    // decodes the payload (id, email, role) using the secret key and assign it to verified.
    const verified = jwt.verify(token, process.env.JWT_SECRET) as UserPayload;

    //assign (id, email, role) to the request object. (req.user)
    req.user = verified;
    next();
  }
  catch(err){
    //if token is expired or fake, send 401
    //This is what triggers the silentRefresh()
    res.status(401).json({ message: "Invalid Token" });
  }

};
