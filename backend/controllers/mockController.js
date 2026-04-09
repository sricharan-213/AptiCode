import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ── Strictly server-side file – never exposed publicly ──────────
const QUESTIONS_PATH = path.join(__dirname, "../scripts/cat_sample_questions.json");
const CAT_CORRECT   = 3;
const CAT_WRONG     = -1;
const EXAM_DURATION = 3600; // 60 minutes in seconds

// ─── Load + filter from local JSON ─────────────────────────────
const loadCATQuestions = () => {
  const raw = fs.readFileSync(QUESTIONS_PATH, "utf-8");
  const all = JSON.parse(raw);
  return all.filter((q) => q.type === "CAT_SAMPLE");
};

const SECTIONS    = ["VARC", "DILR", "QA"];
const PER_SECTION = 10;

// ─── GET /api/mock-cat/cat ─────────────────────────────────────
// Returns sections WITHOUT correctOption – safe for frontend
export const getCATQuestions = (req, res) => {
  try {
    const questions = loadCATQuestions();

    const sections = SECTIONS.map((name) => {
      const qs = questions
        .filter((q) => q.section === name)
        .slice(0, PER_SECTION)
        // Strip the answer before sending to client
        .map(({ correctOption, _id, ...rest }, idx) => ({
          ...rest,
          id: `${name}_${idx}`, // stable string id for answer keying
        }));
      return { name, questions: qs };
    });

    res.json({ sections, duration: EXAM_DURATION });
  } catch (err) {
    console.error("getCATQuestions error:", err);
    res.status(500).json({ message: "Failed to load CAT questions from server." });
  }
};

// ─── POST /api/mock-cat/submit ─────────────────────────────────
// Body: { answers: { "VARC_0": "selectedOptionText", ... } }
// Scoring is 100% server-side using the local JSON
export const submitExam = (req, res) => {
  try {
    const { answers = {} } = req.body;
    const questions = loadCATQuestions();

    let totalCorrect = 0, totalIncorrect = 0, totalSkipped = 0, totalScore = 0;
    const sectionBreakdown = [];
    const results = [];

    SECTIONS.forEach((name) => {
      const qs = questions
        .filter((q) => q.section === name)
        .slice(0, PER_SECTION);

      let sCorrect = 0, sIncorrect = 0, sSkipped = 0, sScore = 0;

      qs.forEach((q, idx) => {
        const key        = `${name}_${idx}`;
        const userAnswer = answers[key] || null;
        let status, marks;

        if (!userAnswer) {
          status = "skipped";   marks = 0;          sSkipped++;
        } else if (userAnswer === q.correctOption) {
          status = "correct";   marks = CAT_CORRECT; sCorrect++;
        } else {
          status = "incorrect"; marks = CAT_WRONG;   sIncorrect++;
        }

        sScore += marks;
        results.push({
          id:            key,
          section:       name,
          title:         q.title,
          description:   q.description,
          correctOption: q.correctOption,
          userAnswer,
          status,
          marks,
        });
      });

      totalCorrect   += sCorrect;
      totalIncorrect += sIncorrect;
      totalSkipped   += sSkipped;
      totalScore     += sScore;

      sectionBreakdown.push({
        name,
        score:     sScore,
        correct:   sCorrect,
        incorrect: sIncorrect,
        skipped:   sSkipped,
        total:     qs.length,
        maxScore:  qs.length * CAT_CORRECT,
      });
    });

    const totalQ   = SECTIONS.length * PER_SECTION;
    const maxScore = totalQ * CAT_CORRECT;

    res.json({
      score:          totalScore,
      maxScore,
      percentage:     parseFloat(Math.max(0, (totalScore / maxScore) * 100).toFixed(2)),
      correctCount:   totalCorrect,
      incorrectCount: totalIncorrect,
      skippedCount:   totalSkipped,
      totalQuestions: totalQ,
      sectionBreakdown,
      results,
    });
  } catch (err) {
    console.error("submitExam error:", err);
    res.status(500).json({ message: "Failed to submit exam." });
  }
};

// ─── POST /api/mock-cat/start (backward-compat alias) ──────────
export const startExam = getCATQuestions;
