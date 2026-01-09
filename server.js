const express = require("express");
const path = require("path");
const session = require("express-session");
const multer = require("multer");
const bcrypt = require("bcrypt");
const { body, validationResult } = require("express-validator");
const db = require("./db");
const stringSimilarity = require("string-similarity");

const app = express();
const PORT = process.env.PORT || 3000;

/* ---------------- MIDDLEWARE ---------------- */

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static("public"));

app.use(
  session({
    secret: process.env.JWT_SECRET || "jobquest_secret",
    resave: false,
    saveUninitialized: false,
  })
);

/* ---------------- FILE UPLOADS ---------------- */

const storage = multer.diskStorage({
  destination: "./uploads/",
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  },
});
const upload = multer({ storage });

/* ---------------- AUTH ROUTES ---------------- */

// REGISTER
app.post(
  "/register",
  upload.single("profile_pic"),
  [
    body("username").isLength({ min: 3 }),
    body("email").isEmail(),
    body("password").isLength({ min: 6 }),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.send(
        "<script>alert('Invalid input'); window.location='/register.html'</script>"
      );
    }

    const { username, email, password } = req.body;
    const profile_pic = req.file ? `/uploads/${req.file.filename}` : null;

    try {
      const existing = await db.query(
        "SELECT 1 FROM users WHERE email = $1 OR username = $2",
        [email, username]
      );

      if (existing.rows.length > 0) {
        return res.send(
          "<script>alert('Email or Username already exists'); window.location='/register.html'</script>"
        );
      }

      const hashed = await bcrypt.hash(password, 10);

      await db.query(
        "INSERT INTO users (username, email, password, profile_pic) VALUES ($1,$2,$3,$4)",
        [username, email, hashed, profile_pic]
      );

      res.redirect("/login.html");
    } catch (err) {
      console.error("Registration error:", err);
      res.send(
        "<script>alert('Registration failed'); window.location='/register.html'</script>"
      );
    }
  }
);

// LOGIN
app.post(
  "/login",
  [body("email").isEmail(), body("password").notEmpty()],
  async (req, res) => {
    const { email, password } = req.body;

    try {
      const result = await db.query(
        "SELECT * FROM users WHERE email = $1",
        [email]
      );

      if (result.rows.length === 0) {
        return res.send(
          "<script>alert('Invalid credentials'); window.location='/login.html'</script>"
        );
      }

      const user = result.rows[0];
      const valid = await bcrypt.compare(password, user.password);

      if (!valid) {
        return res.send(
          "<script>alert('Invalid credentials'); window.location='/login.html'</script>"
        );
      }

      req.session.user = {
        id: user.id,
        username: user.username,
        email: user.email,
        profile_pic: user.profile_pic,
      };

      res.redirect("/index.html");
    } catch (err) {
      console.error("Login error:", err);
      res.send(
        "<script>alert('Login failed'); window.location='/login.html'</script>"
      );
    }
  }
);

/* ---------------- TEST ROUTES ---------------- */

app.get("/tests/list", async (req, res) => {
  const result = await db.query("SELECT * FROM tests");
  res.json(result.rows);
});

app.get("/tests/:test_id/questions", async (req, res) => {
  const result = await db.query(
    "SELECT * FROM questions WHERE test_id = $1",
    [req.params.test_id]
  );
  res.json(result.rows);
});

// SAVE ANSWERS
app.post("/tests/submit", async (req, res) => {
  const { user_id, question_id, answer_text, is_mcq } = req.body;

  try {
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
  } catch (err) {
    console.error("Answer submit error:", err);
    res.status(500).json({ error: "Failed to save answer" });
  }
});

// CALCULATE SCORE
app.post("/tests/calculate-score", async (req, res) => {
  try {
    const { user_id, test_id } = req.body;

    const qRes = await db.query(
      "SELECT * FROM questions WHERE test_id = $1",
      [test_id]
    );

    if (qRes.rows.length === 0) {
      return res.status(400).json({ error: "No questions found" });
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
      if (a.type === "mcq" && a.selected_option === a.correct_option) correct++;

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
  } catch (err) {
    console.error("Score calculation error:", err);
    res.status(500).json({ error: "Score calculation failed" });
  }
});

// ANALYSIS PAGE DATA
app.get("/tests/user-scores/:user_id", async (req, res) => {
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
  } catch (err) {
    console.error("Analysis load error:", err);
    res.status(500).json({ error: "Failed to load tests" });
  }
});

/* ---------------- PROFILE & LOGOUT ---------------- */

app.get("/profile", (req, res) => {
  if (!req.session.user)
    return res.status(401).json({ error: "Not logged in" });
  res.json(req.session.user);
});

app.get("/logout", (req, res) => {
  req.session.destroy(() => res.redirect("/login.html"));
});

// Check if a test is completed by a user
app.get('/tests/check-completion/:user_id/:test_id', async (req, res) => {
  try {
    const { user_id, test_id } = req.params;
    const result = await db.query(
      'SELECT score FROM test_scores WHERE user_id = $1 AND test_id = $2',
      [user_id, test_id]
    );

    if (result.rows.length === 0) return res.json({ completed: false, score: null });

    return res.json({ completed: true, score: result.rows[0].score });
  } catch (err) {
    console.error('Check completion error:', err);
    res.status(500).json({ error: 'Failed to check completion' });
  }
});

// Detailed results for a user's test attempt (no raw solutions returned)
app.get('/tests/detailed-results/:user_id/:test_id', async (req, res) => {
  try {
    const { user_id, test_id } = req.params;

    // load test meta
    const testRes = await db.query('SELECT id, title, description, difficulty FROM tests WHERE id = $1', [test_id]);
    if (testRes.rows.length === 0) return res.status(404).json({ error: 'Test not found' });
    const testInfo = testRes.rows[0];

    // load questions for the test
    const qRes = await db.query('SELECT id, question_text, type, option_a, option_b, option_c, option_d FROM questions WHERE test_id = $1 ORDER BY id', [test_id]);
    const questions = qRes.rows;

    // load user's answers
    const aRes = await db.query(
      'SELECT * FROM user_answers WHERE user_id = $1 AND question_id IN (SELECT id FROM questions WHERE test_id = $2)',
      [user_id, test_id]
    );
    const userAnswersRaw = aRes.rows;

    // load score record if exists
    const scoreRes = await db.query('SELECT score, total_questions, correct_answers, completed_at FROM test_scores WHERE user_id = $1 AND test_id = $2', [user_id, test_id]);
    const scoreRecord = scoreRes.rows[0] || null;

    // assemble userAnswers mapping and calculate correctness where possible
    const userAnswers = userAnswersRaw.map(a => ({ ...a }));

    // For text answers, compute similarity if the question has a correct_answer stored in DB
    // We intentionally do NOT return the stored correct answers or solutions here.
    for (const ua of userAnswers) {
      // find question to get type and correct fields if needed
      const q = questions.find(qi => qi.id === ua.question_id);
      if (!q) continue;

      ua.question_type = q.type;

      if (q.type === 'text' && ua.answer_text && ua.answer_text.trim() !== '') {
        // If questions table includes a correct_answer column, we can compute similarity without returning the correct_answer
        try {
          const caRes = await db.query('SELECT correct_answer FROM questions WHERE id = $1', [ua.question_id]);
          const correct = caRes.rows[0] && caRes.rows[0].correct_answer ? caRes.rows[0].correct_answer : null;
          if (correct) {
            const sim = stringSimilarity.compareTwoStrings(ua.answer_text.toLowerCase().trim(), correct.toLowerCase().trim());
            ua.similarity_score = sim; // expose similarity so client can show match percentage
            ua.is_correct = sim >= 0.5;
          } else {
            ua.similarity_score = null;
            ua.is_correct = null;
          }
        } catch (e) {
          ua.similarity_score = null;
          ua.is_correct = null;
        }
      } else if (q.type === 'mcq') {
        // For MCQ, compute correctness by comparing to stored correct_option without returning it
        try {
          const coRes = await db.query('SELECT correct_option FROM questions WHERE id = $1', [ua.question_id]);
          const correctOpt = coRes.rows[0] && coRes.rows[0].correct_option ? coRes.rows[0].correct_option : null;
          if (correctOpt) ua.is_correct = ua.selected_option === correctOpt;
          else ua.is_correct = null;
        } catch (e) {
          ua.is_correct = null;
        }
      }
    }

    // return only what's needed by the front-end: test meta, questions (without answers/solutions), user's answers and score summary
    res.json({
      testInfo,
      questions,
      userAnswers,
      score: scoreRecord ? parseFloat(scoreRecord.score) : null,
      totalQuestions: scoreRecord ? scoreRecord.total_questions : questions.length,
      correctAnswers: scoreRecord ? scoreRecord.correct_answers : userAnswers.filter(a => a.is_correct).length
    });
  } catch (err) {
    console.error('Detailed results error:', err);
    res.status(500).json({ error: 'Failed to load detailed results' });
  }
});
/* ---------------- START SERVER ---------------- */

app.listen(PORT, () =>
  console.log(`🚀 Server running on port ${PORT}`)
);
