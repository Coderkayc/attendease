import express from "express";
import { createLecturer, getLecturer } from "../controllers/lecturer.controller.js";
import { protect, authorize } from "../middlewares/auth.middleware.js";

const router = express.Router();

router.post("/", protect, authorize("admin"), createLecturer);
router.get("/:userId", protect, authorize("admin", "lecturer"), getLecturer);  

export default router;

