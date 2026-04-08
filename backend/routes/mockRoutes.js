import express from "express";
import getMockTest from "../controllers/mockController.js";

const router = express.Router();

router.get("/:testId", getMockTest);

export default router;
