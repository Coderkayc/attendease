import Lecturer from "../models/Lecturer.js";

export const createLecturer = async (req, res) => {
  try {
    const l = await Lecturer.create(req.body);
    res.json(l);
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
};

export const getLecturers = async (req, res) => {
  try {
    const list = await Lecturer.find().sort({ name: 1 });
    res.json(list);
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
};