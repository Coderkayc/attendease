import Lecturer from "../models/Lecturer.js";

export const createLecturer = async (req, res) => {
  try {
    const { userId, staffId, department } = req.body;

    const lecturer = await Lecturer.create({
      user: userId,  
      staffId,
      department
    });

    res.status(201).json({
      message: "Lecturer profile created successfully",
      lecturer
    });
  } catch (error) {
    res.status(400).json({ msg: error.message });
  }
};

export const getLecturer = async (req, res) => {
  try {
    const { userId } = req.params;

    const lecturer = await Lecturer.findOne({ user: userId })
      .populate("user", "name email role");

    if (!lecturer) {
      return res.status(404).json({
        message: "Lecturer profile not found"
      });
    }

    res.status(200).json(lecturer);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};