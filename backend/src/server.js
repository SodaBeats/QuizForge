import express from "express";
import cors from "cors";
import healthRoutes from "./routes/health.js";

const app = express();

app.use(cors({
  origin: "http://localhost:5173", // React dev server
  credentials: true
}));

app.use(express.json());

app.use("/api",healthRoutes);

app.get("/api/health", (req, res) => {
  res.json({ status: "ok" });
});

app.listen(3000, () => {
  console.log("API running on http://localhost:3000");
});
