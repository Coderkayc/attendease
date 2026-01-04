import mongoose from "mongoose";    

const lecturerSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    email: { type: String, required: true, unique: true },
    department: { type: String, default: "computer science" },
}, { timestamps: true });

export default mongoose.model("Lecturer", lecturerSchema);