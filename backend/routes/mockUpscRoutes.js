import express from "express";
import authMiddleware from "../middleware/authMiddleware.js";
import {
  getUPSCQuestions,
  startExam,
  submitExam,
} from "../controllers/mockUpscController.js";

const router = express.Router();

// GET  /api/mock-upsc/upsc    → load section-split questions (auth required)
router.get("/upsc", authMiddleware, getUPSCQuestions);

// POST /api/mock-upsc/start   → alias (auth required)
router.post("/start", authMiddleware, startExam);

// POST /api/mock-upsc/submit  → server-side scoring (auth required)
router.post("/submit", authMiddleware, submitExam);

export default router;
