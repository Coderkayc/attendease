import Course from "../models/Course.js";
import Student from "../models/Student.js";
import Lecturer from "../models/Lecturer.js";

export const createCourse = async (req, res) => {
  try {
    const { title, code, lecturer } = req.body;
    const exists = await Course.findOne({ code });
    if (exists) return res.status(400).json({ message: "Course code exists" });

    const course = await Course.create({ title, code, lecturer });
    res.status(201).json(course);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getCourses = async (req, res) => {
    try {
        const courses = await Course.find().populate("lecturer", "name email").populate("students", "name email");
        res.status(200).json(courses);
    } catch (error) {
        res.status(500).json({ message: "Failed to retrieve courses", error: error.message });
    }
};   

export const getMyCourses = async (req, res) => {
  try {
    const lecturerId = req.user.lecturerId || req.user._id;

    const courses = await Course.find({ lecturer: lecturerId })
      .populate("students", "name email");

    res.status(200).json(courses);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getCourseAttendance = async (req, res) => {
  const { courseId } = req.params;

  const attendance = await Attendance.find({ course: courseId })
    .populate("records.student", "name email")
    .populate("markedBy", "name email");

  res.status(200).json(attendance);
};

export const getMyAttendance = async (req, res) => {
  const studentId = req.user._id;

  const attendance = await Attendance.find({
    "records.student": studentId
  })
    .populate("course", "title code");

  const formatted = attendance.map(a => {
    const record = a.records.find(
      r => r.student.toString() === studentId.toString()
    );

    return {
      course: a.course,
      date: a.date,
      status: record.status
    };
  });

  res.status(200).json(formatted);
};

export const getAttendanceSummary = async (req, res) => {
  const { courseId, studentId } = req.params;

  const attendance = await Attendance.find({ course: courseId });

  let present = 0;
  let total = 0;

  attendance.forEach(a => {
    const record = a.records.find(
      r => r.student.toString() === studentId
    );

    if (record) {
      total++;
      if (record.status === "present") present++;
    }
  });

  const percentage = total === 0 ? 0 : ((present / total) * 100).toFixed(2);

  res.status(200).json({
    totalClasses: total,
    present,
    absent: total - present,
    attendancePercentage: `${percentage}%`
  });
};

export const enrollStudent = async (req, res) => {
  try {
    const { courseId, studentId } = req.body;

    console.log("Incoming studentId:", studentId);

    const course = await Course.findById(courseId);
    if (!course)
      return res.status(404).json({ message: "Course not found" });

    const student = await Student.findById(studentId);

    console.log("Student found:", student);

    if (!student)
      return res.status(400).json({ message: "Invalid student" });

    if (course.students.includes(studentId))
      return res.status(400).json({ message: "Student already enrolled" });

    course.students.push(studentId);
    await course.save();

    res.status(200).json({ message: "Student enrolled successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const assignLecturer = async (req, res) => {
  try {
    const { courseId, lecturerId } = req.body;

    console.log("Incoming lecturerId:", lecturerId);

    const course = await Course.findById(courseId);
    if (!course)
      return res.status(404).json({ message: "Course not found" });

    const lecturer = await Lecturer.findById(lecturerId);
    console.log("Lecturer found:", lecturer);

    if (!lecturer)
      return res.status(400).json({ message: "Invalid lecturer" });

    course.lecturer = lecturer._id;
    await course.save();

    res.status(200).json({ message: "Lecturer assigned successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};



