import express from "express";
import authMiddleware from "../middleware/authMiddleware.js";
import {
  getCATQuestions,
  startExam,
  submitExam,
} from "../controllers/mockController.js";

const router = express.Router();

// GET  /api/mock-cat/cat    → load section-split questions (auth required)
router.get("/cat", authMiddleware, getCATQuestions);

// POST /api/mock-cat/start  → alias (auth required)
router.post("/start", authMiddleware, startExam);

// POST /api/mock-cat/submit → server-side scoring (auth required)
router.post("/submit", authMiddleware, submitExam);

export default router;
