import Problem from "../models/Problem.js";

// GET all problems
export const getAllProblems = async (req, res) => {
    try {
        const problems = await Problem.find();
        res.json(problems);
    } catch (error) {
        res.status(500).json({ message: "Error fetching problems" });
    }
};

// GET single problem by ID
export const getProblemById = async (req, res) => {
    try {
        const problem = await Problem.findById(req.params.id);

        if (!problem) {
            return res.status(404).json({ message: "Problem not found" });
        }

        res.json(problem);
    } catch (error) {
        res.status(500).json({ message: "Error fetching problem" });
    }
};

// POST create a new problem (admin only)
export const createProblem = async (req, res) => {
    try {
        const newProblem = new Problem(req.body);
        const savedProblem = await newProblem.save();
        res.status(201).json(savedProblem);
    } catch (error) {
        res.status(400).json({ message: "Error creating problem" });
    }
};

// PUT update a problem (admin only)
export const updateProblem = async (req, res) => {
    try {
        const updated = await Problem.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true, runValidators: true }
        );

        if (!updated) {
            return res.status(404).json({ message: "Problem not found" });
        }

        res.json(updated);
    } catch (error) {
        res.status(400).json({ message: "Error updating problem" });
    }
};

// DELETE a problem (admin only)
export const deleteProblem = async (req, res) => {
    try {
        const deleted = await Problem.findByIdAndDelete(req.params.id);

        if (!deleted) {
            return res.status(404).json({ message: "Problem not found" });
        }

        res.json({ message: "Problem deleted successfully" });
    } catch (error) {
        res.status(500).json({ message: "Error deleting problem" });
    }
};
