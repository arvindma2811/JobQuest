const express = require("express");
const router = express.Router();
const db = require("./db");
const multer = require("multer");
const stringSimilarity = require("string-similarity");

// storage for voice recordings
const storage = multer.diskStorage({
  destination: "./uploads/tests/",
  filename: (req, file, cb) => {
    cb(null, Date.now() + "-" + file.originalname);
  },
});

const upload = multer({ storage });

// ---------------------
// Fetch all available tests
// ---------------------
router.get("/list", async (req, res) => {
  try {
    const result = await db.query("SELECT * FROM tests");
    res.json(result.rows);
  } catch (error) {
    console.error("❌ Error fetching tests:", error);
    res.status(500).json({ error: error.message });
  }
});

// ---------------------
// Fetch questions inside a test
// ---------------------
router.get("/:test_id/questions", async (req, res) => {
  try {
    const result = await db.query(
      "SELECT * FROM questions WHERE test_id = $1",
      [req.params.test_id]
    );
    res.json(result.rows);
  } catch (error) {
    console.error("❌ Error fetching questions:", error);
    res.status(500).json({ error: error.message });
  }
});

// ---------------------
// Save MCQ/TEXT answers
// ---------------------
router.post("/submit", async (req, res) => {
  try {
    const { user_id, question_id, answer_text, is_mcq } = req.body;

    if (!user_id || !question_id || !answer_text) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    if (is_mcq) {
      await db.query(
        "INSERT INTO user_answers (user_id, question_id, selected_option) VALUES ($1,$2,$3)",
        [user_id, question_id, answer_text]
      );
    } else {
      await db.query(
        "INSERT INTO user_answers (user_id, question_id, answer_text) VALUES ($1,$2,$3)",
        [user_id, question_id, answer_text]
      );
    }

    res.json({ success: true });
  } catch (error) {
    console.error("❌ Error saving answer:", error);
    res.status(500).json({ error: error.message });
  }
});

// -------------------------
// Calculate Test Score
// -------------------------
router.post("/calculate-score", async (req, res) => {
  try {
    const { user_id, test_id } = req.body;

    const qRes = await db.query(
      "SELECT * FROM questions WHERE test_id = $1",
      [test_id]
    );

    if (qRes.rows.length === 0) {
      return res.status(404).json({ error: "No questions found" });
    }

    const aRes = await db.query(
      `SELECT ua.*, q.correct_option, q.correct_answer, q.type
       FROM user_answers ua
       JOIN questions q ON ua.question_id = q.id
       WHERE ua.user_id = $1 AND q.test_id = $2`,
      [user_id, test_id]
    );

    let correct = 0;

    for (const a of aRes.rows) {
      if (a.type === "mcq" && a.selected_option === a.correct_option) {
        correct++;
      }

      if (a.type === "text" && a.answer_text && a.correct_answer) {
        const sim = stringSimilarity.compareTwoStrings(
          a.answer_text.toLowerCase().trim(),
          a.correct_answer.toLowerCase().trim()
        );
        if (sim >= 0.5) correct++;
      }
    }

    const total = qRes.rows.length;
    const score = (correct / total) * 100;

    await db.query(
      `INSERT INTO test_scores
       (user_id, test_id, score, total_questions, correct_answers, completed_at)
       VALUES ($1,$2,$3,$4,$5,CURRENT_TIMESTAMP)
       ON CONFLICT (user_id, test_id)
       DO UPDATE SET
         score = EXCLUDED.score,
         total_questions = EXCLUDED.total_questions,
         correct_answers = EXCLUDED.correct_answers,
         completed_at = CURRENT_TIMESTAMP`,
      [user_id, test_id, score, total, correct]
    );

    res.json({
      success: true,
      score: score.toFixed(2),
      percentage: score.toFixed(2),
      correctAnswers: correct,
      totalQuestions: total,
    });
  } catch (error) {
    console.error("❌ Error calculating score:", error);
    res.status(500).json({ error: error.message });
  }
});

// -------------------------
// Get User Test Scores
// -------------------------
router.get("/user-scores/:user_id", async (req, res) => {
  try {
    const result = await db.query(
      `SELECT ts.*, t.title, t.description, t.difficulty
       FROM test_scores ts
       JOIN tests t ON ts.test_id = t.id
       WHERE ts.user_id = $1
       ORDER BY ts.completed_at DESC`,
      [req.params.user_id]
    );

    res.json(result.rows);
  } catch (error) {
    console.error("❌ Error fetching scores:", error);
    res.status(500).json({ error: error.message });
  }
});

// -------------------------
// Check if test is completed
// -------------------------
router.get("/check-completion/:user_id/:test_id", async (req, res) => {
  try {
    const result = await db.query(
      "SELECT * FROM test_scores WHERE user_id = $1 AND test_id = $2",
      [req.params.user_id, req.params.test_id]
    );

    res.json({
      completed: result.rows.length > 0,
      score: result.rows.length > 0 ? result.rows[0].score : null,
    });
  } catch (error) {
    console.error("❌ Error checking completion:", error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
