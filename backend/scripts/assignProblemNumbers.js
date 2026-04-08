/**
 * One-time migration: assigns permanent numbers to all existing problems
 * that don't have one yet, ordered by their creation date (oldest = #1).
 *
 * Run once with: node scripts/assignProblemNumbers.js
 */

import mongoose from "mongoose";
import dotenv from "dotenv";
dotenv.config();

import Problem from "../models/Problem.js";

async function run() {
  await mongoose.connect(process.env.MONGO_URI);
  console.log("Connected to MongoDB ✅");

  // Only fetch problems that have no number yet, sorted oldest-first
  const problems = await Problem.find({ number: { $exists: false } }).sort({ createdAt: 1 });

  if (problems.length === 0) {
    console.log("All problems already have numbers. Nothing to do.");
    process.exit(0);
  }

  // Find the current highest number so we don't collide with existing ones
  const last = await Problem.findOne({ number: { $exists: true } }).sort({ number: -1 });
  let nextNumber = last && last.number ? last.number + 1 : 1;

  for (const problem of problems) {
    await Problem.findByIdAndUpdate(problem._id, { number: nextNumber });
    console.log(`  #${nextNumber} → ${problem.title}`);
    nextNumber++;
  }

  console.log(`\n✅ Done! Assigned numbers to ${problems.length} problems.`);
  process.exit(0);
}

run().catch((err) => {
  console.error("Migration failed:", err);
  process.exit(1);
});
