
import express from "express";
import {
  markAttendance,
  getCourseAttendance,
  getStudentAttendance,
  getStudentReport,
  getCourseAttendanceReport,
  exportCourseAttendanceCSV,
  exportAttendanceCSV,
  exportAttendancePDF
} from "../controllers/attendance.controller.js";
import { protect, authorize } from "../middlewares/auth.middleware.js";

const router = express.Router();

router.post("/mark", protect, authorize("lecturer"), markAttendance);
router.get("/course/:courseId", protect, authorize("lecturer", "admin"), getCourseAttendance);
router.get("/student/:studentId", protect, authorize("student", "admin"), getStudentAttendance);
router.get("/student/:studentId/report", protect, authorize("student", "admin"), getStudentReport);
router.get("/course/:courseId/report", protect, authorize("lecturer", "admin"), getCourseAttendanceReport);
router.get("/course/:courseId/export", protect, authorize("lecturer", "admin"), exportCourseAttendanceCSV);
router.get("/attendance/export/csv/:courseId", protect, authorize("lecturer", "admin"), exportAttendanceCSV);
router.get("/attendance/export/pdf/:courseId", protect, authorize("lecturer", "admin"), exportAttendancePDF);

export default router
