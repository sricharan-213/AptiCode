import express from "express";
import { getExamNews } from "../controllers/newsController.js";

const router = express.Router();

router.get("/", getExamNews);

export default router;
