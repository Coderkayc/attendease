import mongoose from "mongoose";    

   const lecturerSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
    unique: true
  },
  staffId: {
    type: String,
    required: true,
    unique: true
  },
  department: {
    type: String,
    required: true
  }
});

{ timestamps: true };

export default mongoose.model("Lecturer", lecturerSchema);