/**
 * One-time migration: tags existing problems as examType: "CAT"
 * by their MongoDB ObjectIds.
 *
 * HOW TO USE:
 *   1. Fill in the `CAT_IDS` array below with the _id strings of
 *      the problems you want to mark as CAT questions.
 *   2. Run:  node scripts/tagCATProblems.js
 *
 * The script is safe to re-run — it only updates listed documents.
 */

import mongoose from "mongoose";
import dotenv from "dotenv";
dotenv.config();

import Problem from "../models/Problem.js";

// ─────────────────────────────────────────────────────────────
// ✏️  EDIT THIS LIST — paste the ObjectIds of your CAT problems
// ─────────────────────────────────────────────────────────────
const CAT_IDS = [
  // "64f3a1c2e4b0a12345678901",
  // "64f3a1c2e4b0a12345678902",
  // … add more as needed
];

// ─────────────────────────────────────────────────────────────
// Alternatively pass --all to tag EVERY problem as CAT (dev use)
// ─────────────────────────────────────────────────────────────
const TAG_ALL = process.argv.includes("--all");

async function run() {
  await mongoose.connect(process.env.MONGO_URI);
  console.log("Connected to MongoDB ✅\n");

  if (TAG_ALL) {
    const result = await Problem.updateMany({}, { $set: { examType: "CAT" } });
    console.log(`✅ Tagged ALL ${result.modifiedCount} problems as examType: "CAT"`);
    process.exit(0);
  }

  if (CAT_IDS.length === 0) {
    console.warn(
      "⚠️  CAT_IDS array is empty.\n" +
      "    Add ObjectIds to the array in this script, or run with --all to tag every problem."
    );
    process.exit(0);
  }

  const objectIds = CAT_IDS.map((id) => new mongoose.Types.ObjectId(id));

  const result = await Problem.updateMany(
    { _id: { $in: objectIds } },
    { $set: { examType: "CAT" } }
  );

  console.log(`✅ Tagged ${result.modifiedCount} of ${CAT_IDS.length} problems as examType: "CAT"`);

  // Report any IDs that weren't found
  const found = await Problem.find({ _id: { $in: objectIds } }).select("_id title");
  const foundIds = new Set(found.map((p) => p._id.toString()));
  for (const id of CAT_IDS) {
    if (!foundIds.has(id)) {
      console.warn(`  ⚠️  Not found: ${id}`);
    } else {
      const p = found.find((f) => f._id.toString() === id);
      console.log(`  ✔  ${id} → "${p.title}"`);
    }
  }

  process.exit(0);
}

run().catch((err) => {
  console.error("Migration failed:", err);
  process.exit(1);
});
