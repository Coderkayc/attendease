import express from "express";
import { createStudent, getStudents, updateStudent, deleteStudent} from "../controllers/student.controller.js";
import { protect, authorize } from "../middlewares/auth.middleware.js";

const router = express.Router();

router.post("/", protect, authorize("admin"), createStudent);
router.get("/", protect, authorize("admin", "lecturer"), getStudents);
router.put("/:id", protect, authorize("admin"), updateStudent);
router.delete("/:id", protect, authorize("admin"), deleteStudent);

export default router;
