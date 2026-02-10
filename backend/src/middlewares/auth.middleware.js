import jwt from 'jsonwebtoken';

export const verifyToken = (req, res, next) => {
  //get token from header
  const authHeader = req.headers['Authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if(!token){
    return res.status(401).json({message: 'Access Denied'});
  }
  try{
    //verify token using secret key
    const verified = jwt.verify(token, process.env.JWT_SECRET);
    req.user = verified;
    next();
  }
  catch(err){
    //if token is expired or fake, send 401
    //This is what triggers the silentRefresh()
    res.status(401).json({ message: "Invalid Token" });
  }

};
