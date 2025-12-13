const express = require("express");
const path = require("path");
const session = require("express-session");
const mysql = require("mysql2");
const authRoutes = require("./auth");
const testRoutes = require("./tests");

const app = express();
const PORT = 3000;

// MySQL connection
const db = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "1234",
  database: "jobquest",
});

db.connect(err => {
  if (err) throw err;
  console.log("✅ MySQL Connected");
});

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(
  session({
    secret: "1234",
    resave: false,
    saveUninitialized: false,
  })
);

// Auth routes (must be before static files)
app.use("/", authRoutes);

// Tests API routes (must be before static files)
app.use("/tests", testRoutes);
app.use("/api", testRoutes);

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

app.listen(PORT, () => console.log(`🚀 Server running on http://localhost:${PORT}`));
