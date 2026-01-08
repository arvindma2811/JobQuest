const express = require("express");
const multer = require("multer");
const path = require("path");
const bcrypt = require("bcrypt");
const db = require("./db");
const router = express.Router();

// Configure file uploads
const storage = multer.diskStorage({
  destination: "./uploads/",
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  },
});
const upload = multer({ storage });

// === Register ===
router.post("/register", upload.single("profile_pic"), async (req, res) => {
  const { username, email, password } = req.body;
  const profile_pic = req.file ? `/uploads/${req.file.filename}` : null;

  if (!username || !email || !password) {
    return res.send("<script>alert('Please fill all fields'); window.location='/register.html';</script>");
  }

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

// === Login ===
router.post("/login", async (req, res) => {
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

module.exports = router;
