import Attendance from "../models/Attendance.js";
import Course from "../models/Course.js";
import Lecturer from "../models/Lecturer.js";
import { Parser } from "json2csv";
import PDFDocument from "pdfkit";

export const markAttendance = async (req, res) => {
  try {
    const { courseId, records } = req.body;

    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({ message: "Course not found" });
    }

    const lecturer = await Lecturer.findOne({ user: req.user._id });

    if (!lecturer) {
      return res.status(403).json({ message: "Lecturer profile not found" });
    }

    if (course.lecturer.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Unauthorized course access" });
  }

   const exists = await Attendance.findOne({ course: courseId, date: today });
      if (exists) {
      return res.status(400).json({
        message: "Attendance already marked for today"});
      }

       const attendance = await Attendance.create({
      course: courseId,
      date: today,
      records: records.map(r => ({
        student: r.studentId,
        status: r.status
      })),
      markedBy: req.user._id
    });

    res.status(201).json({
      message: "Attendance marked successfully",
      attendance
    });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
}

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

export const exportAttendanceCSV = async (req, res) => {
  try {
    const { courseId } = req.params;

    const attendance = await Attendance.find({ course: courseId })
      .populate("records.student", "name email");

    let data = [];

    attendance.forEach(a => {
      a.records.forEach(r => {
        data.push({
          name: r.student.name,
          email: r.student.email,
          date: a.date,
          status: r.status
        });
      });
    });

    const parser = new Parser({
      fields: ["name", "email", "date", "status"]
    });

    const csv = parser.parse(data);

    res.header("Content-Type", "text/csv");
    res.attachment("attendance.csv");
    res.send(csv);

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const exportAttendancePDF = async (req, res) => {
  try {
    const { courseId } = req.params;

    const attendance = await Attendance.find({ course: courseId })
      .populate("records.student", "name email")
      .populate("course", "title code");

    const doc = new PDFDocument({ margin: 30 });

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      'attachment; filename="attendance.pdf"'
    );

    doc.pipe(res);

    // Title
    doc.fontSize(18).text("Attendance Report", { align: "center" });
    doc.moveDown();

    if (attendance.length > 0) {
      doc.fontSize(12).text(
        `Course: ${attendance[0].course.title} (${attendance[0].course.code})`
      );
    }

    doc.moveDown();

    attendance.forEach(a => {
      doc.fontSize(12).text(`Date: ${a.date}`);
      doc.moveDown(0.5);

      a.records.forEach(r => {
        doc.text(
          `${r.student.name} (${r.student.email}) - ${r.status}`
        );
      });

      doc.moveDown();
    });

    doc.end();

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
