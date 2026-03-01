import express from "express";
import authMiddleware from "../middleware/authMiddleware.js";
import { getMe, solveProblem } from "../controllers/userController.js";

const router = express.Router();

router.get("/me", authMiddleware, getMe);
router.post("/solve/:problemId", authMiddleware, solveProblem);

export default router;