import express from "express";
import cors from "cors";
import healthRoutes from "./routes/health.js";
import uploadRoutes from "./routes/upload.routes.js";

const app = express();

//allowing react and express to communicate
app.use(cors({
  origin: "http://localhost:5173", // React dev server
  credentials: true
}));

app.use(express.json()); // middleware for parsing json

app.use("/api",healthRoutes);

app.use('/api/upload', uploadRoutes); //all uploads go through this route

app.listen(3000, () => {
  console.log("API running on http://localhost:3000");
});
