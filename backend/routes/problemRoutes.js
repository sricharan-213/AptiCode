import express from "express";
import authMiddleware from "../middleware/authMiddleware.js";
import adminMiddleware from "../middleware/adminMiddleware.js";
import {
  getAllProblems,
  getProblemById,
  createProblem,
  updateProblem,
  deleteProblem,
} from "../controllers/problemController.js";

const router = express.Router();

router.get("/", getAllProblems);
router.get("/:id", getProblemById);
router.post("/", authMiddleware, adminMiddleware, createProblem);
router.put("/:id", authMiddleware, adminMiddleware, updateProblem);
router.delete("/:id", authMiddleware, adminMiddleware, deleteProblem);

export default router;