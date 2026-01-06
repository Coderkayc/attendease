import express from "express";
import {
  createCourse,
  getMyCourses,
  getCourseAttendance,
  getMyAttendance,
  getAttendanceSummary,
  enrollStudent,
  assignLecturer,
} from "../controllers/course.controller.js";
import { protect, authorize } from "../middlewares/auth.middleware.js";

const router = express.Router();

router.post("/", protect, authorize("Admin"), createCourse);
router.get("/my-courses", protect, authorize("lecturer"), getMyCourses);
router.get(
  "/attendance/course/:courseId",
  protect,
  authorize("lecturer", "admin"),
  getCourseAttendance
);
router.get("/attendance/me", protect, authorize("student"), getMyAttendance);
router.get(
  "/attendance-summary/:courseId/:studentId",
  protect,
  authorize("lecturer", "admin"),
  getAttendanceSummary
);  
router.post("/enroll", protect, authorize("admin", "lecturer"), enrollStudent);
router.post("/assign-lecturer", protect, authorize("admin"), assignLecturer);

export default router;
