import express from "express";
import { createLecturer, getLecturers } from "../controllers/lecturer.controller.js";
import { protect, authorize } from "../middlewares/auth.middleware.js";

const router = express.Router();

router.post("/", protect, authorize("Admin"), createLecturer);
router.get("/", protect, authorize("Admin", "lecturer"), getLecturers);  

export default router;

