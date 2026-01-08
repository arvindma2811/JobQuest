const express = require("express");
const path = require("path");
const session = require("express-session");
const multer = require("multer");
const bcrypt = require("bcrypt");
const { body, validationResult } = require('express-validator');
const db = require("./db");
const stringSimilarity = require('string-similarity');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Configure file uploads
const storage = multer.diskStorage({
  destination: "./uploads/",
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  },
});
const upload = multer({ storage });

// Configure test file uploads
const testStorage = multer.diskStorage({
  destination: "./uploads/tests/",
  filename: (req, file, cb) => {
    cb(null, Date.now() + "-" + file.originalname);
  }
});
const testUpload = multer({ storage: testStorage });

app.use(express.json());
app.use(express.static("public"));
app.use(express.urlencoded({ extended: true }));
app.use(
  session({
    secret: process.env.SESSION_SECRET || "1234",
    resave: false,
    saveUninitialized: false,
  })
);

// === AUTH ROUTES ===

// Register
app.post("/register", upload.single("profile_pic"), [
  body('username').isLength({ min: 3 }).withMessage('Username must be at least 3 characters'),
  body('email').isEmail().normalizeEmail().withMessage('Invalid email address'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters')
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.send(`<script>alert('${errors.array()[0].msg}'); window.location='/register.html';</script>`);
  }

  const { username, email, password } = req.body;
  const profile_pic = req.file ? `/uploads/${req.file.filename}` : null;

  try {
    const [existingUser] = await db.query("SELECT * FROM users WHERE email = ? OR username = ?", [email, username]);
    if (existingUser.length > 0) {
      return res.send("<script>alert('Email or Username already registered'); window.location='/register.html';</script>");
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    await db.query(
      "INSERT INTO users (username, email, password, profile_pic) VALUES (?, ?, ?, ?)",
      [username, email, hashedPassword, profile_pic]
    );

    res.redirect("/login.html");
  } catch (error) {
    console.error("Registration error:", error);
    res.send("<script>alert('Registration failed'); window.location='/register.html';</script>");
  }
});

// Login
app.post("/login", [
  body('email').isEmail().normalizeEmail().withMessage('Invalid email address'),
  body('password').notEmpty().withMessage('Password is required')
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.send(`<script>alert('${errors.array()[0].msg}'); window.location='/login.html';</script>`);
  }

  const { email, password } = req.body;

  try {
    const [users] = await db.query("SELECT * FROM users WHERE email = ?", [email]);

    if (users.length === 0) {
      return res.send("<script>alert('Invalid email or password'); window.location='/login.html';</script>");
    }

    const user = users[0];
    const isValidPassword = await bcrypt.compare(password, user.password);

    if (!isValidPassword) {
      return res.send("<script>alert('Invalid email or password'); window.location='/login.html';</script>");
    }

    req.session.user = {
      id: user.id,
      username: user.username,
      email: user.email,
      profile_pic: user.profile_pic,
    };
    res.redirect("/index.html");
  } catch (error) {
    console.error("Login error:", error);
    res.send("<script>alert('Login failed'); window.location='/login.html';</script>");
  }
});

// === TEST ROUTES ===

// Fetch all available tests
app.get("/tests/list", async (req, res) => {
  try {
    const [rows] = await db.query("SELECT * FROM tests");
    res.json(rows);
  } catch (error) {
    console.error("❌ Error fetching tests:", error);
    res.status(500).json({ error: error.message });
  }
});

// Fetch questions inside a test
app.get("/tests/:test_id/questions", async (req, res) => {
  try {
    const [rows] = await db.query(
      "SELECT * FROM questions WHERE test_id = ?",
      [req.params.test_id]
    );
    console.log(`✅ Fetched ${rows.length} questions for test ${req.params.test_id}`);
    res.json(rows);
  } catch (error) {
    console.error("❌ Error fetching questions:", error);
    res.status(500).json({ error: error.message });
  }
});

// Save MCQ/TEXT answers
app.post("/tests/submit", async (req, res) => {
  try {
    const { user_id, test_id, question_id, answer_text, is_mcq } = req.body;

    if (!user_id || !question_id || !answer_text) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    if (is_mcq) {
      // For MCQ, store in selected_option column
      await db.query(
        "INSERT INTO user_answers (user_id, question_id, selected_option) VALUES (?,?,?)",
        [user_id, question_id, answer_text]
      );
    } else {
      // For text, store in answer_text column
      await db.query(
        "INSERT INTO user_answers (user_id, question_id, answer_text) VALUES (?,?,?)",
        [user_id, question_id, answer_text]
      );
    }

    console.log(`✅ Answer saved for user ${user_id}, question ${question_id}`);
    res.json({ success: true });
  } catch (error) {
    console.error("❌ Error saving answer:", error);
    res.status(500).json({ error: error.message });
  }
});

// Save VOICE answers
app.post("/tests/submit/voice", testUpload.single("audio"), async (req, res) => {
  try {
    const { user_id, test_id, question_id } = req.body;

    if (!req.file) {
      return res.status(400).json({ error: "No audio file provided" });
    }

    await db.query(
      "INSERT INTO user_answers (user_id, question_id, audio_file) VALUES (?,?,?)",
      [user_id, question_id, req.file.filename]
    );

    res.json({ success: true, file: req.file.filename });
  } catch (error) {
    console.error("❌ Error saving voice answer:", error);
    res.status(500).json({ error: error.message });
  }
});

// Calculate Test Score
app.post("/tests/calculate-score", async (req, res) => {
  try {
    const { user_id, test_id } = req.body;

    if (!user_id || !test_id) {
      return res.status(400).json({ error: "Missing user_id or test_id" });
    }

    // Get all questions for the test
    const [questions] = await db.query(
      "SELECT * FROM questions WHERE test_id = ?",
      [test_id]
    );

    if (questions.length === 0) {
      return res.status(404).json({ error: "No questions found for this test" });
    }

    // Get all user answers for this test
    const [userAnswers] = await db.query(
      "SELECT * FROM user_answers WHERE user_id = ? AND question_id IN (SELECT id FROM questions WHERE test_id = ?)",
      [user_id, test_id]
    );

    let correctAnswers = 0;
    const similarityThreshold = 0.5; // 50% similarity threshold for text answers

    // Grade each answer
    for (const answer of userAnswers) {
      const question = questions.find(q => q.id === answer.question_id);

      if (!question) continue;

      if (question.type === "mcq") {
        // For MCQ, check if selected option matches correct option
        if (answer.selected_option === question.correct_option) {
          correctAnswers++;
        }
      } else if (question.type === "text") {
        // For text, use similarity matching
        if (answer.answer_text && question.correct_answer) {
          const similarity = stringSimilarity.compareTwoStrings(
            answer.answer_text.toLowerCase().trim(),
            question.correct_answer.toLowerCase().trim()
          );

          // Award points if similarity is above threshold
          if (similarity >= similarityThreshold) {
            correctAnswers++;
          }
        }
      }
    }

    // Calculate percentage score
    const score = (correctAnswers / questions.length) * 100;

    // Save/update score in database
    await db.query(
      `INSERT INTO test_scores (user_id, test_id, score, total_questions, correct_answers, completed_at)
       VALUES (?, ?, ?, ?, ?, NOW())
       ON DUPLICATE KEY UPDATE
       score = VALUES(score),
       total_questions = VALUES(total_questions),
       correct_answers = VALUES(correct_answers),
       completed_at = NOW()`,
      [user_id, test_id, score, questions.length, correctAnswers]
    );

    console.log(`✅ Test scored: User ${user_id}, Test ${test_id}, Score ${score.toFixed(2)}%`);

    res.json({
      success: true,
      score: score.toFixed(2),
      correctAnswers,
      totalQuestions: questions.length,
      percentage: score.toFixed(2)
    });
  } catch (error) {
    console.error("❌ Error calculating score:", error);
    res.status(500).json({ error: error.message });
  }
});

// Get User Test Scores
app.get("/tests/user-scores/:user_id", async (req, res) => {
  try {
    const { user_id } = req.params;

    const [scores] = await db.query(
      `SELECT ts.*, t.title, t.description, t.difficulty
       FROM test_scores ts
       JOIN tests t ON ts.test_id = t.id
       WHERE ts.user_id = ?
       ORDER BY ts.completed_at DESC`,
      [user_id]
    );

    res.json(scores);
  } catch (error) {
    console.error("❌ Error fetching scores:", error);
    res.status(500).json({ error: error.message });
  }
});

// Check if test is completed
app.get("/tests/check-completion/:user_id/:test_id", async (req, res) => {
  try {
    const { user_id, test_id } = req.params;

    const [result] = await db.query(
      "SELECT * FROM test_scores WHERE user_id = ? AND test_id = ?",
      [user_id, test_id]
    );

    res.json({
      completed: result.length > 0,
      score: result.length > 0 ? result[0].score : null
    });
  } catch (error) {
    console.error("❌ Error checking completion:", error);
    res.status(500).json({ error: error.message });
  }
});

// Get Detailed Test Results
app.get("/tests/detailed-results/:user_id/:test_id", async (req, res) => {
  try {
    const { user_id, test_id } = req.params;

    console.log(`📋 Fetching detailed results for user ${user_id}, test ${test_id}`);

    // Get test info
    const [testInfo] = await db.query(
      "SELECT * FROM tests WHERE id = ?",
      [test_id]
    );

    if (testInfo.length === 0) {
      return res.status(404).json({ error: "Test not found" });
    }

    // Get all questions for the test
    const [questions] = await db.query(
      "SELECT * FROM questions WHERE test_id = ?",
      [test_id]
    );

    // Get all user answers for this test
    const [userAnswers] = await db.query(
      "SELECT * FROM user_answers WHERE user_id = ? AND question_id IN (SELECT id FROM questions WHERE test_id = ?)",
      [user_id, test_id]
    );

    // Get test score
    const [scores] = await db.query(
      "SELECT * FROM test_scores WHERE user_id = ? AND test_id = ?",
      [user_id, test_id]
    );

    if (scores.length === 0) {
      return res.status(404).json({ error: "Test not completed" });
    }

    console.log(`✅ Found ${questions.length} questions and ${userAnswers.length} user answers`);

    const scoreData = scores[0];
    const similarityThreshold = 0.5;

    // Grade each answer and attach correctness info
    const answersWithGrade = userAnswers.map(answer => {
      const question = questions.find(q => q.id === answer.question_id);
      let isCorrect = false;
      let similarityScore = 0;

      if (!question) return { ...answer, is_correct: false };

      if (question.type === "mcq") {
        isCorrect = answer.selected_option === question.correct_option;
      } else if (question.type === "text") {
        if (answer.answer_text && question.correct_answer) {
          similarityScore = stringSimilarity.compareTwoStrings(
            answer.answer_text.toLowerCase().trim(),
            question.correct_answer.toLowerCase().trim()
          );
          isCorrect = similarityScore >= similarityThreshold;
        }
      }

      return {
        ...answer,
        is_correct: isCorrect,
        similarity_score: similarityScore
      };
    });

    res.json({
      testInfo: testInfo[0],
      questions: questions,
      userAnswers: answersWithGrade,
      score: parseFloat(scoreData.score),
      totalQuestions: scoreData.total_questions,
      correctAnswers: scoreData.correct_answers
    });
  } catch (error) {
    console.error("❌ Error fetching detailed results:", error);
    res.status(500).json({ error: error.message });
  }
});

// API routes (for backward compatibility)
app.get("/api/list", async (req, res) => {
  try {
    const [rows] = await db.query("SELECT * FROM tests");
    res.json(rows);
  } catch (error) {
    console.error("❌ Error fetching tests:", error);
    res.status(500).json({ error: error.message });
  }
});

app.get("/api/:test_id/questions", async (req, res) => {
  try {
    const [rows] = await db.query(
      "SELECT * FROM questions WHERE test_id = ?",
      [req.params.test_id]
    );
    console.log(`✅ Fetched ${rows.length} questions for test ${req.params.test_id}`);
    res.json(rows);
  } catch (error) {
    console.error("❌ Error fetching questions:", error);
    res.status(500).json({ error: error.message });
  }
});

app.post("/api/submit", async (req, res) => {
  try {
    const { user_id, test_id, question_id, answer_text, is_mcq } = req.body;

    if (!user_id || !question_id || !answer_text) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    if (is_mcq) {
      // For MCQ, store in selected_option column
      await db.query(
        "INSERT INTO user_answers (user_id, question_id, selected_option) VALUES (?,?,?)",
        [user_id, question_id, answer_text]
      );
    } else {
      // For text, store in answer_text column
      await db.query(
        "INSERT INTO user_answers (user_id, question_id, answer_text) VALUES (?,?,?)",
        [user_id, question_id, answer_text]
      );
    }

    console.log(`✅ Answer saved for user ${user_id}, question ${question_id}`);
    res.json({ success: true });
  } catch (error) {
    console.error("❌ Error saving answer:", error);
    res.status(500).json({ error: error.message });
  }
});

app.post("/api/calculate-score", async (req, res) => {
  try {
    const { user_id, test_id } = req.body;

    if (!user_id || !test_id) {
      return res.status(400).json({ error: "Missing user_id or test_id" });
    }

    // Get all questions for the test
    const [questions] = await db.query(
      "SELECT * FROM questions WHERE test_id = ?",
      [test_id]
    );

    if (questions.length === 0) {
      return res.status(404).json({ error: "No questions found for this test" });
    }

    // Get all user answers for this test
    const [userAnswers] = await db.query(
      "SELECT * FROM user_answers WHERE user_id = ? AND question_id IN (SELECT id FROM questions WHERE test_id = ?)",
      [user_id, test_id]
    );

    let correctAnswers = 0;
    const similarityThreshold = 0.5; // 50% similarity threshold for text answers

    // Grade each answer
    for (const answer of userAnswers) {
      const question = questions.find(q => q.id === answer.question_id);

      if (!question) continue;

      if (question.type === "mcq") {
        // For MCQ, check if selected option matches correct option
        if (answer.selected_option === question.correct_option) {
          correctAnswers++;
        }
      } else if (question.type === "text") {
        // For text, use similarity matching
        if (answer.answer_text && question.correct_answer) {
          const similarity = stringSimilarity.compareTwoStrings(
            answer.answer_text.toLowerCase().trim(),
            question.correct_answer.toLowerCase().trim()
          );

          // Award points if similarity is above threshold
          if (similarity >= similarityThreshold) {
            correctAnswers++;
          }
        }
      }
    }

    // Calculate percentage score
    const score = (correctAnswers / questions.length) * 100;

    // Save/update score in database
    await db.query(
      `INSERT INTO test_scores (user_id, test_id, score, total_questions, correct_answers, completed_at)
       VALUES (?, ?, ?, ?, ?, NOW())
       ON DUPLICATE KEY UPDATE
       score = VALUES(score),
       total_questions = VALUES(total_questions),
       correct_answers = VALUES(correct_answers),
       completed_at = NOW()`,
      [user_id, test_id, score, questions.length, correctAnswers]
    );

    console.log(`✅ Test scored: User ${user_id}, Test ${test_id}, Score ${score.toFixed(2)}%`);

    res.json({
      success: true,
      score: score.toFixed(2),
      correctAnswers,
      totalQuestions: questions.length,
      percentage: score.toFixed(2)
    });
  } catch (error) {
    console.error("❌ Error calculating score:", error);
    res.status(500).json({ error: error.message });
  }
});

// Serve static files (LAST)
app.use(express.static(path.join(__dirname, "public")));
app.use("/uploads", express.static("uploads"));

// ✅ Route guard - if not logged in, redirect to login
app.get("/", (req, res) => {
  if (!req.session.user) {
    return res.redirect("/login.html");
  }
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

// ✅ Profile data route (for front-end JS)
app.get("/profile", (req, res) => {
  if (!req.session.user) {
    return res.status(401).json({ error: "Not logged in" });
  }
  res.json(req.session.user);
});

// ✅ Logout route
app.get("/logout", (req, res) => {
  req.session.destroy(() => {
    res.redirect("/login.html");
  });
});


app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
