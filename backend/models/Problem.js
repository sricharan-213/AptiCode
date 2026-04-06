import mongoose from "mongoose";

const problemSchema = new mongoose.Schema({
  number: {
    type: Number,
    unique: true,
  },
  title: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    required: true,
  },
  options: {
    type: [String],
    required: true,
  },
  correctOption: {
    type: String,
    required: true,
  },
  difficulty: {
    type: String,
    enum: ["Easy", "Medium", "Hard"],
    required: true,
  },
  topic: {
    type: String,
    required: true,
  },
  author: {
    type: String,
  },
  reference: {
    type: String,
  },
  // Global timing data for rank score calculation
  totalSubmissions: { type: Number, default: 0 },
  totalTimeSpent:   { type: Number, default: 0 },  // sum of all timeTaken (seconds)
}, { timestamps: true });

const Problem = mongoose.model("Problem", problemSchema);

export default Problem;