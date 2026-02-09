import express from "express";
import cors from "cors";
import multer from "multer";
import healthRoutes from "./routes/health.js";
import uploadRoutes from "./routes/upload.routes.js";
import questionRoute from './routes/question.route.js';
import signupRoute from './routes/signup.route.js';
import refreshRoute from './routes/refresh.route.js';

const app = express();

//allowing react and express to communicate
app.use(cors({
  origin: "http://localhost:5173", // React dev server
  credentials: true
}));

app.use(express.json()); // middleware for parsing json

app.use("/api",healthRoutes);

app.use('/api/upload', uploadRoutes); //file uploads go through this route
app.use('/api/questions', questionRoute);//manually made question go through this route
//app.use('/api/login', loginRoute);
app.use('/api/signup', signupRoute);
app.use('/auth/refresh', refreshRoute);

app.use((err,req,res,next)=>{
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(413).json({ error: 'File too large (max 5MB)' });
    }
    if (err.code === 'LIMIT_FILE_COUNT') {
      return res.status(400).json({ error: 'Only one file allowed' });
    }
  }

  if (err.code === 'INVALID_FILE_TYPE') {
    return res.status(400).json({ error: err.message });
  }
  console.error(err);
  const status = err.status || 500;
  res.status(status).json({
    message: err.message || 'Internal Server Error',
    error: err.message
  });
});

export default app;
