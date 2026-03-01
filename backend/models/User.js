import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
  name: String,
  email: String,
  password: String,
  role: {
    type: String,
    default: "user"
  },

  solvedProblems: [{
    problemId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Problem"
    },
    difficulty: String,
    solvedAt: {
      type: Date,
      default: Date.now
    }
  }],

  stats: {
    totalSolved: { type: Number, default: 0 },
    easySolved: { type: Number, default: 0 },
    mediumSolved: { type: Number, default: 0 },
    hardSolved: { type: Number, default: 0 },
    xp: { type: Number, default: 0 },
    streak: { type: Number, default: 0 },
    maxStreak: { type: Number, default: 0 },
    lastSolvedDate: { type: String, default: "" }
  }

}, { timestamps: true });

export default mongoose.model("User", userSchema);