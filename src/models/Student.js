import mongoose from "mongoose";

const studentSchema = new mongoose.Schema(
  {
    user: { type: String, required: true },
    matric: { type: String, required: true, unique: true },
    department: { type: String, default: "computer science" },
    level: { type: String },
  },
  { timestamps: true }
);

export default mongoose.model("Student", studentSchema);