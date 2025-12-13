const express = require("express");
const router = express.Router();
const db = require("./db");
const multer = require("multer");
const stringSimilarity = require('string-similarity');

// storage for voice recordings
const storage = multer.diskStorage({
    destination: "./uploads/tests/",
    filename: (req, file, cb) => {
        cb(null, Date.now() + "-" + file.originalname);
    }
});

const upload = multer({ storage: storage });

// ---------------------
// Fetch all available tests
// ---------------------
router.get("/list", async (req, res) => {
    try {
        const [rows] = await db.query("SELECT * FROM tests");
        res.json(rows);
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

// ---------------------
// Save MCQ/TEXT answers
// ---------------------
router.post("/submit", async (req, res) => {
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

// -------------------------
// Save VOICE answers
// -------------------------
router.post("/submit/voice", upload.single("audio"), async (req, res) => {
    try {
        const { user_id, test_id, question_id } = req.body;

        if (!req.file) {
            return res.status(400).json({ error: "No audio file provided" });
        }

        await db.query(
            "INSERT INTO answers (user_id, test_id, question_id, audio_file) VALUES (?,?,?,?)",
            [user_id, test_id, question_id, req.file.filename]
        );

        res.json({ success: true, file: req.file.filename });
    } catch (error) {
        console.error("❌ Error saving voice answer:", error);
        res.status(500).json({ error: error.message });
    }
});

// -------------------------
// Calculate Test Score
// -------------------------
router.post("/calculate-score", async (req, res) => {
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

// -------------------------
// Get User Test Scores
// -------------------------
router.get("/user-scores/:user_id", async (req, res) => {
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

// -------------------------
// Check if test is completed
// -------------------------
router.get("/check-completion/:user_id/:test_id", async (req, res) => {
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

// -------------------------
// Get Detailed Test Results (for results page)
// -------------------------
router.get("/detailed-results/:user_id/:test_id", async (req, res) => {
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

module.exports = router;
