import User from "../models/User.js";
import Problem from "../models/Problem.js";

// GET /me — get logged-in user with ranks
export const getMe = async (req, res) => {
    try {
        const user = await User.findById(req.user.id)
            .select("-password")
            .populate("solvedProblems.problemId", "title");

        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        // 🔥 Overall Rank
        const betterOverall = await User.countDocuments({
            "stats.totalSolved": { $gt: user.stats.totalSolved },
        });
        const overallRank = betterOverall + 1;

        // 🔥 Easy Rank
        const betterEasy = await User.countDocuments({
            "stats.easySolved": { $gt: user.stats.easySolved },
        });
        const easyRank = betterEasy + 1;

        // 🔥 Medium Rank
        const betterMedium = await User.countDocuments({
            "stats.mediumSolved": { $gt: user.stats.mediumSolved },
        });
        const mediumRank = betterMedium + 1;

        // 🔥 Hard Rank
        const betterHard = await User.countDocuments({
            "stats.hardSolved": { $gt: user.stats.hardSolved },
        });
        const hardRank = betterHard + 1;

        res.json({
            user,
            ranks: {
                overallRank,
                easyRank,
                mediumRank,
                hardRank,
            },
        });
    } catch (error) {
        res.status(500).json({ message: "Failed to fetch user data" });
    }
};

// POST /solve/:problemId — mark a problem as solved
export const solveProblem = async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        const problem = await Problem.findById(req.params.problemId);

        if (!problem)
            return res.status(404).json({ message: "Problem not found" });

        // Check if already solved
        const alreadySolved = user.solvedProblems.some(
            (p) => p.problemId.toString() === problem._id.toString()
        );

        if (alreadySolved) {
            return res.status(400).json({ message: "Already solved" });
        }

        // Add solved problem
        user.solvedProblems.push({
            problemId: problem._id,
            difficulty: problem.difficulty,
        });

        // Update stats
        user.stats.totalSolved += 1;

        if (problem.difficulty === "Easy") {
            user.stats.easySolved += 1;
            user.stats.xp += 10;
        } else if (problem.difficulty === "Medium") {
            user.stats.mediumSolved += 1;
            user.stats.xp += 20;
        } else if (problem.difficulty === "Hard") {
            user.stats.hardSolved += 1;
            user.stats.xp += 40;
        }

        // Update streak
        const todayStr = new Date().toISOString().split("T")[0];
        const lastDate = user.stats.lastSolvedDate || "";

        if (lastDate === todayStr) {
            // Already solved today, streak stays the same
        } else {
            // Check if last solve was yesterday
            const yesterday = new Date();
            yesterday.setDate(yesterday.getDate() - 1);
            const yesterdayStr = yesterday.toISOString().split("T")[0];

            if (lastDate === yesterdayStr) {
                user.stats.streak += 1;
            } else {
                user.stats.streak = 1; // Reset streak
            }

            user.stats.lastSolvedDate = todayStr;
        }

        // Track max streak
        if (user.stats.streak > (user.stats.maxStreak || 0)) {
            user.stats.maxStreak = user.stats.streak;
        }

        await user.save();

        res.json({ message: "Problem solved!", stats: user.stats });
    } catch (error) {
        res.status(500).json({ message: "Error updating solve" });
    }
};
