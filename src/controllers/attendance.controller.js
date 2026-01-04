import Attendance from "../models/Attendance.js";
import Course from "../models/Course.js";
import { Parser } from "json2csv";


export const markAttendance = async (req, res) => {
  try {
    const { courseId, records } = req.body;
    const lecturerId = req.user.lecturerId;

    const course = await Course.findOne({
      _id: courseId,
      lecturer: lecturerId,
    });

    if (!course)
      return res.status(403).json({ message: "Unauthorized course access" });

    const today = new Date().setHours(0, 0, 0, 0);

    const attendanceDocs = records.map((r) => ({
      course: courseId,
      student: r.studentId,
      lecturer: lecturerId,
      status: r.status,
      date: today,
    }));

    await Attendance.insertMany(attendanceDocs, { ordered: false });

    res.status(201).json({ message: "Attendance marked successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getCourseAttendance = async (req, res) => {
  try {
    const { courseId } = req.params;

    const course = await Course.findById(courseId).populate("students", "name email");
    if (!course) return res.status(404).json({ message: "Course not found" });

    if (req.user.role === "lecturer" && course.lecturer.toString() !== req.user._id.toString())
      return res.status(403).json({ message: "Not authorized" });

    const attendanceRecords = await Attendance.find({ course: courseId })
      .populate("student", "name email")
      .sort({ date: -1 });

    res.json({ course: course.title, attendance: attendanceRecords });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getStudentAttendance = async (req, res) => {
  try {
    const { studentId } = req.params;

    if (req.user.role === "student" && req.user._id.toString() !== studentId)
      return res.status(403).json({ message: "Not authorized" });

    const attendanceRecords = await Attendance.find({ student: studentId })
      .populate("course", "title code")
      .sort({ date: -1 });

    const summary = {};
    attendanceRecords.forEach((att) => {
      const course = att.course.title;
      if (!summary[course]) summary[course] = { present: 0, total: 0 };
      if (att.status === "present") summary[course].present += 1;
      summary[course].total += 1;
    });

    const percentage = {};
    for (let course in summary) {
      percentage[course] = ((summary[course].present / summary[course].total) * 100).toFixed(2);
    }

    res.json({ attendanceRecords, percentage });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getStudentReport = async (req, res) => {
  try {
    const { studentId } = req.params;

    if (
      req.user.role === "student" &&
      req.user._id.toString() !== studentId
    ) {
      return res.status(403).json({ message: "Access denied" });
    }

    const records = await Attendance.find({ student: studentId })
      .populate("course", "title code")
      .sort({ date: -1 });

    const summary = {};

    records.forEach((rec) => {
      const course = rec.course.title;
      if (!summary[course]) summary[course] = { total: 0, present: 0 };
      summary[course].total++;
      if (rec.status === "present") summary[course].present++;
    });

    const percentage = {};
    for (let course in summary) {
      percentage[course] = (
        (summary[course].present / summary[course].total) *
        100
      ).toFixed(2);
    }

    res.json({ records, percentage });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


export const getCourseAttendanceReport = async (req, res) => {
  try {
    const { courseId } = req.params;
    const { startDate, endDate } = req.query;

    const course = await Course.findById(courseId);
    if (!course)
      return res.status(404).json({ message: "Course not found" });

    if (
      req.user.role === "lecturer" &&
      course.lecturer.toString() !== req.user._id.toString()
    ) {
      return res.status(403).json({ message: "Access denied" });
    }

    const filter = { course: courseId };

    if (startDate && endDate) {
      filter.date = {
        $gte: new Date(startDate),
        $lte: new Date(endDate),
      };
    }

    const records = await Attendance.find(filter)
      .populate("student", "name email")
      .sort({ date: 1 });

    const summary = {};

    records.forEach((rec) => {
      const studentId = rec.student._id;

      if (!summary[studentId]) {
        summary[studentId] = {
          student: rec.student,
          total: 0,
          present: 0,
          absent: 0,
        };
      }

      summary[studentId].total++;
      rec.status === "present"
        ? summary[studentId].present++
        : summary[studentId].absent++;
    });

    res.status(200).json({
      course: {
        title: course.title,
        code: course.code,
      },
      totalRecords: records.length,
      report: Object.values(summary),
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


export const exportCourseAttendanceCSV = async (req, res) => {
  try {
    const { courseId } = req.params;

    const course = await Course.findById(courseId);
    if (!course)
      return res.status(404).json({ message: "Course not found" });

    if (
      req.user.role === "lecturer" &&
      course.lecturer.toString() !== req.user._id.toString()
    ) {
      return res.status(403).json({ message: "Access denied" });
    }

    const records = await Attendance.find({ course: courseId })
      .populate("student", "name email")
      .sort({ date: 1 });

    const data = records.map((r) => ({
      Student: r.student.name,
      Email: r.student.email,
      Date: r.date.toISOString().split("T")[0],
      Status: r.status,
    }));

    const parser = new Parser();
    const csv = parser.parse(data);

    res.header("Content-Type", "text/csv");
    res.attachment(`${course.code}_attendance.csv`);
    return res.send(csv);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const courseAttendanceReport = async (req, res) => {
  try {
    const { courseId } = req.params;
    const lecturerId = req.user.lecturerId;

    const report = await Attendance.find({
      course: courseId,
      lecturer: lecturerId,
    })
      .populate("student", "name matricNumber")
      .sort({ date: -1 });

    res.status(200).json(report);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const studentAttendanceReport = async (req, res) => {
  try {
    const studentId = req.user.studentId;

    const report = await Attendance.find({ student: studentId })
      .populate("course", "title code")
      .sort({ date: -1 });

    res.status(200).json(report);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

