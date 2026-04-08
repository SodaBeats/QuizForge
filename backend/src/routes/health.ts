import express from "express";

const router = express.Router();

router.get("/health", (req, res) => {
  return res.json({ status: "ok" });
});

export default router;