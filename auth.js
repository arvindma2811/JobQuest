const express = require("express");
const multer = require("multer");
const path = require("path");
const mysql = require("mysql2");
const router = express.Router();

const db = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "1234",
  database: "jobquest",
});

// Configure file uploads
const storage = multer.diskStorage({
  destination: "./uploads/",
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  },
});
const upload = multer({ storage });

// === Register ===
router.post("/register", upload.single("profile_pic"), (req, res) => {
  const { username, email, password } = req.body;
  const profile_pic = req.file ? `/uploads/${req.file.filename}` : null;

  if (!username || !email || !password) {
    return res.send("<script>alert('Please fill all fields'); window.location='/register.html';</script>");
  }

  db.query("SELECT * FROM users WHERE email = ? OR username = ?", [email, username], (err, result) => {
    if (err) throw err;
    if (result.length > 0) {
      return res.send("<script>alert('Email or Username already registered'); window.location='/register.html';</script>");
    }

    db.query(
      "INSERT INTO users (username, email, password, profile_pic) VALUES (?, ?, ?, ?)",
      [username, email, password, profile_pic],
      (err2) => {
        if (err2) throw err2;
        res.redirect("/login.html");
      }
    );
  });
});

// === Login ===
router.post("/login", (req, res) => {
  const { email, password } = req.body;

  db.query("SELECT * FROM users WHERE email = ? AND password = ?", [email, password], (err, result) => {
    if (err) throw err;

    if (result.length > 0) {
      const user = result[0];
      req.session.user = {
        id: user.id,
        username: user.username,
        email: user.email,
        profile_pic: user.profile_pic,
      };
      res.redirect("/index.html");
    } else {
      res.send("<script>alert('Invalid email or password'); window.location='/login.html';</script>");
    }
  });
});

module.exports = router;
