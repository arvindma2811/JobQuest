-- =========================
-- TEST 6: SELF-IMPROVEMENT, FOCUS & PERSONAL GROWTH
-- =========================

INSERT INTO tests (id, title, description, difficulty, time_limit)
VALUES
(
  6,
  'Self-Improvement, Focus & Personal Growth Assessment',
  'A test covering self-improvement strategies with Q&A and multiple-choice questions on habits, focus, learning, and personal growth.',
  'easy',
  0
)
ON CONFLICT (id) DO UPDATE SET
title = EXCLUDED.title,
description = EXCLUDED.description,
difficulty = EXCLUDED.difficulty,
time_limit = EXCLUDED.time_limit;


-- =========================
-- TEXT QUESTIONS — TEST 6
-- =========================

INSERT INTO questions
(test_id, question_text, type, correct_answer)
VALUES
(
  6,
  'How can someone become better at problem-solving?',
  'text',
  'Break big problems into smaller parts, practice simple problems daily, and review where you got stuck to improve step-by-step.'
),

(
  6,
  'What is an effective way to stay focused for longer?',
  'text',
  'Remove distractions, work in 25–30 minute sessions, and take short breaks. This trains your brain to concentrate better.'
),

(
  6,
  'How can a person improve consistency in their habits?',
  'text',
  'Start with small daily tasks, set a fixed time, and track your progress. Seeing improvement keeps you consistent.'
),

(
  6,
  'What helps someone communicate more clearly?',
  'text',
  'Think before speaking, keep your message simple, and listen actively. This improves clarity and confidence.'
),

(
  6,
  'How can someone learn faster?',
  'text',
  'Use active learning—write notes, explain concepts to yourself, and test what you learned to remember better.'
);


-- =========================
-- MCQ QUESTIONS — TEST 6
-- =========================

INSERT INTO questions
(test_id, question_text, type,
 option_a, option_b, option_c, option_d,
 correct_option, correct_answer)
VALUES

(
  6,
  'What helps you stay disciplined with your goals?',
  'mcq',
  'Random effort',
  'Creating a routine',
  'Depending on luck',
  'Skipping tasks',
  'B',
  'Creating a routine'
),

(
  6,
  'A good way to avoid procrastination is to:',
  'mcq',
  'Wait until the last minute',
  'Start with the easiest task',
  'Leave everything for tomorrow',
  'Work only when forced',
  'B',
  'Start with the easiest task'
),

(
  6,
  'What improves learning retention the most?',
  'mcq',
  'Reading once',
  'Rewriting without understanding',
  'Teaching the concept',
  'Memorizing blindly',
  'C',
  'Teaching the concept'
),

(
  6,
  'Which activity helps reduce mental fatigue?',
  'mcq',
  'Taking mindful breaks',
  'Overworking',
  'Skipping sleep',
  'Multitasking constantly',
  'A',
  'Taking mindful breaks'
),

(
  6,
  'When learning a new skill, you should:',
  'mcq',
  'Practice regularly',
  'Expect perfection immediately',
  'Quit after mistakes',
  'Compare with others',
  'A',
  'Practice regularly'
),

(
  6,
  'What improves personal growth the fastest?',
  'mcq',
  'Continuous learning',
  'Avoiding challenges',
  'Staying in comfort zone',
  'Ignoring feedback',
  'A',
  'Continuous learning'
),

(
  6,
  'Which habit helps in better decision-making?',
  'mcq',
  'Thinking emotionally only',
  'Analyzing pros and cons',
  'Rushing decisions',
  'Asking no questions',
  'B',
  'Analyzing pros and cons'
),

(
  6,
  'What is the best way to improve time management?',
  'mcq',
  'Doing everything at once',
  'Prioritizing tasks',
  'Working randomly',
  'Not planning',
  'B',
  'Prioritizing tasks'
),

(
  6,
  'A good way to build self-discipline is:',
  'mcq',
  'Setting small daily habits',
  'Doing everything at night',
  'Avoiding routines',
  'Working only when motivated',
  'A',
  'Setting small daily habits'
),

(
  6,
  'What increases focus?',
  'mcq',
  'Removing distractions',
  'Using phone constantly',
  'Listening to loud noise',
  'Studying while multitasking',
  'A',
  'Removing distractions'
);
