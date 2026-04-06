import User from "../models/User.js";
import Problem from "../models/Problem.js";

/* ─── helpers ─── */

/** Format seconds → "1m 23s" */
const fmtSecs = (s) => {
  if (!s && s !== 0) return null;
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return m > 0 ? `${m}m ${sec}s` : `${sec}s`;
};

const DIFFICULTY_WEIGHT = { Easy: 1, Medium: 2, Hard: 3 };

/**
 * Recalculate rankScore from all solved problems.
 * score = Σ weight × clamp(globalAvg / userTime, 0.1, 2.0)
 * Problems without timeTaken or without globalAvg still count
 * using their weight × 1.0 (neutral efficiency).
 */
const calcRankScore = async (solvedProblems) => {
  let score = 0;
  for (const sp of solvedProblems) {
    const weight = DIFFICULTY_WEIGHT[sp.difficulty] || 1;
    if (sp.timeTaken && sp.timeTaken > 0) {
      const prob = await Problem.findById(sp.problemId).select("totalSubmissions totalTimeSpent");
      if (prob && prob.totalSubmissions > 0) {
        const globalAvg = prob.totalTimeSpent / prob.totalSubmissions;
        const efficiency = Math.min(2.0, Math.max(0.1, globalAvg / sp.timeTaken));
        score += weight * efficiency;
      } else {
        score += weight * 1.0; // no global data yet → neutral
      }
    } else {
      score += weight * 1.0; // no timing data → neutral
    }
  }
  return Math.round(score * 100) / 100;
};

/* ─────────────────────────────────────────────
   GET /me — get logged-in user with ranks
───────────────────────────────────────────── */
export const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id)
      .select("-password")
      .populate("solvedProblems.problemId", "title number");

    if (!user) return res.status(404).json({ message: "User not found" });

    // Overall Rank (by totalSolved)
    const betterOverall = await User.countDocuments({ "stats.totalSolved": { $gt: user.stats.totalSolved } });
    const overallRank = betterOverall + 1;

    // Difficulty ranks
    const betterEasy   = await User.countDocuments({ "stats.easySolved":   { $gt: user.stats.easySolved } });
    const betterMedium = await User.countDocuments({ "stats.mediumSolved": { $gt: user.stats.mediumSolved } });
    const betterHard   = await User.countDocuments({ "stats.hardSolved":   { $gt: user.stats.hardSolved } });

    // Rank Score rank
    const betterScore  = await User.countDocuments({ "stats.rankScore": { $gt: user.stats.rankScore } });
    const scoreRank    = betterScore + 1;

    res.json({
      user,
      ranks: {
        overallRank,
        easyRank:   betterEasy   + 1,
        mediumRank: betterMedium + 1,
        hardRank:   betterHard   + 1,
        scoreRank,
      },
    });
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch user data" });
  }
};

/* ─────────────────────────────────────────────
   POST /solve/:problemId — mark problem solved
   Body: { timeTaken: <number in seconds> }
───────────────────────────────────────────── */
export const solveProblem = async (req, res) => {
  try {
    const user    = await User.findById(req.user.id);
    const problem = await Problem.findById(req.params.problemId);

    if (!problem) return res.status(404).json({ message: "Problem not found" });

    // ── Already solved? ──
    const existing = user.solvedProblems.find(
      (p) => p.problemId.toString() === problem._id.toString()
    );
    if (existing) {
      return res.status(400).json({
        message: "Already solved",
        timeTaken: existing.timeTaken,
        timeTakenFormatted: fmtSecs(existing.timeTaken),
      });
    }

    // ── Accept timeTaken from body ──
    const timeTaken = req.body.timeTaken && req.body.timeTaken > 0
      ? Math.round(req.body.timeTaken)
      : null;

    // ── Update Problem global stats ──
    let globalAvgTime = null;
    if (timeTaken) {
      problem.totalSubmissions += 1;
      problem.totalTimeSpent   += timeTaken;
      await problem.save();
      globalAvgTime = Math.round(problem.totalTimeSpent / problem.totalSubmissions);
    }

    const fastSolve = timeTaken && globalAvgTime ? timeTaken < globalAvgTime : false;

    // ── Push solved record ──
    user.solvedProblems.push({
      problemId:  problem._id,
      difficulty: problem.difficulty,
      timeTaken,
    });

    // ── Update stats counters & XP ──
    user.stats.totalSolved += 1;
    if (problem.difficulty === "Easy") {
      user.stats.easySolved   += 1;
      user.stats.xp           += 10;
    } else if (problem.difficulty === "Medium") {
      user.stats.mediumSolved += 1;
      user.stats.xp           += 20;
    } else if (problem.difficulty === "Hard") {
      user.stats.hardSolved   += 1;
      user.stats.xp           += 40;
    }

    // ── Recalculate avg times per difficulty ──
    const timed = (diff) =>
      user.solvedProblems.filter((p) => p.difficulty === diff && p.timeTaken);

    const avgOf = (arr) =>
      arr.length ? Math.round(arr.reduce((s, p) => s + p.timeTaken, 0) / arr.length) : null;

    user.stats.avgEasyTime   = avgOf(timed("Easy"));
    user.stats.avgMediumTime = avgOf(timed("Medium"));
    user.stats.avgHardTime   = avgOf(timed("Hard"));

    // ── Streak logic ──
    const todayStr = new Date().toISOString().split("T")[0];
    const lastDate = user.stats.lastSolvedDate || "";
    if (lastDate !== todayStr) {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = yesterday.toISOString().split("T")[0];
      user.stats.streak = lastDate === yesterdayStr ? user.stats.streak + 1 : 1;
      user.stats.lastSolvedDate = todayStr;
    }
    if (user.stats.streak > (user.stats.maxStreak || 0)) {
      user.stats.maxStreak = user.stats.streak;
    }

    // ── Recalculate rank score ──
    user.stats.rankScore = await calcRankScore(user.solvedProblems);

    await user.save();

    res.json({
      message: "Problem solved!",
      stats:              user.stats,
      timeTaken,
      timeTakenFormatted: fmtSecs(timeTaken),
      globalAvgTime,
      globalAvgFormatted: fmtSecs(globalAvgTime),
      fastSolve,
    });
  } catch (error) {
    console.error("solveProblem error:", error);
    res.status(500).json({ message: "Error updating solve" });
  }
};
