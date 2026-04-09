import mongoose from "mongoose";

const examSessionSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    // Ordered list of question ObjectIds served to this user
    questions: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Problem",
      },
    ],

    /*
     * answers: { "<questionId>": "<selectedOption>" }
     * Stored as a plain Mixed object for flexible key-value access.
     */
    answers: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },

    startTime: {
      type: Date,
      default: Date.now,
    },

    endTime: {
      type: Date,
      default: null,
    },

    // Duration in seconds (populated on submit)
    duration: {
      type: Number,
      default: null,
    },

    status: {
      type: String,
      enum: ["ongoing", "completed"],
      default: "ongoing",
    },

    // Result snapshot (populated on submit)
    score: {
      type: Number,
      default: null,
    },
    totalQuestions: {
      type: Number,
      default: 20,
    },
    correctCount: {
      type: Number,
      default: null,
    },
    incorrectCount: {
      type: Number,
      default: null,
    },
    skippedCount: {
      type: Number,
      default: null,
    },
  },
  { timestamps: true }
);

const ExamSession = mongoose.model("ExamSession", examSessionSchema);
export default ExamSession;
