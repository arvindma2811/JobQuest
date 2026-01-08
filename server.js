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
});

// CALCULATE SCORE
app.post("/tests/calculate-score", async (req, res) => {
  const { user_id, test_id } = req.body;

  const questions = await db.query(
    "SELECT * FROM questions WHERE test_id = $1",
    [test_id]
  );

  const answers = await db.query(
    `SELECT ua.*, q.correct_option, q.correct_answer, q.type
     FROM user_answers ua
     JOIN questions q ON ua.question_id = q.id
     WHERE ua.user_id = $1 AND q.test_id = $2`,
    [user_id, test_id]
  );

  let correct = 0;

  for (const a of answers.rows) {
    if (a.type === "mcq" && a.selected_option === a.correct_option) correct++;
    if (a.type === "text" && a.answer_text) {
      const sim = stringSimilarity.compareTwoStrings(
        a.answer_text.toLowerCase(),
        a.correct_answer.toLowerCase()
      );
      if (sim >= 0.5) correct++;
    }
  }

  const score = (correct / questions.rows.length) * 100;

  await db.query(
    `INSERT INTO test_scores (user_id, test_id, score, total_questions, correct_answers, completed_at)
     VALUES ($1,$2,$3,$4,$5,CURRENT_TIMESTAMP)
     ON CONFLICT (user_id, test_id)
     DO UPDATE SET
       score = EXCLUDED.score,
       total_questions = EXCLUDED.total_questions,
       correct_answers = EXCLUDED.correct_answers,
       completed_at = CURRENT_TIMESTAMP`,
    [user_id, test_id, score, questions.rows.length, correct]
  );

  res.json({ score: score.toFixed(2) });
});

/* ---------------- STATIC & PROFILE ---------------- */

app.get("/profile", (req, res) => {
  if (!req.session.user) return res.status(401).json({ error: "Not logged in" });
  res.json(req.session.user);
});

app.get("/logout", (req, res) => {
  req.session.destroy(() => res.redirect("/login.html"));
});

/* ---------------- START SERVER ---------------- */

app.listen(PORT, () =>
  console.log(`🚀 Server running on port ${PORT}`)
);
