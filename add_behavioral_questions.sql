USE jobquest;

-- ===== CREATE TESTS =====
INSERT INTO tests (id, title, description, difficulty, time_limit) VALUES
(1, 'Behavioral Skills & Workplace Decision-Making Assessment', 'Behavioral interview MCQ questions to assess soft skills and decision-making', 'medium', 30),
(2, 'Behavioral Interview: Real-Life Scenario & Reflection Assessment', 'Behavioral interview open-ended questions about real workplace scenarios', 'medium', 45)
ON DUPLICATE KEY UPDATE 
title = VALUES(title),
description = VALUES(description),
difficulty = VALUES(difficulty),
time_limit = VALUES(time_limit);

-- Clear existing questions (optional, uncomment if needed)
-- DELETE FROM questions WHERE test_id IN (1, 2);

-- ===== MCQ QUESTIONS FOR TEST 1 =====
INSERT INTO questions (test_id, question_text, type, option_a, option_b, option_c, option_d, correct_option, correct_answer) VALUES
(1, 'How do you usually handle tight deadlines?', 'mcq', 'I panic but try to finish somehow', 'I break the work into smaller tasks and prioritize', 'I wait until the last moment and rush', 'I ask someone else to complete it', 'B', 'Breaking work into smaller tasks and prioritizing is the most effective approach to meet deadlines'),

(1, 'When working in a team, what role do you naturally take?', 'mcq', 'Leader', 'Planner/Organizer', 'Supporter/Helper', 'I prefer working alone', 'B', 'Being a planner/organizer ensures smooth team collaboration and efficient execution'),

(1, 'How do you react when you receive negative feedback?', 'mcq', 'I get defensive', 'I listen carefully and try to improve', 'I ignore it', 'I feel discouraged and lose confidence', 'B', 'Listening to feedback and using it for improvement shows professional maturity and growth mindset'),

(1, 'How do you approach solving a complex problem?', 'mcq', 'I guess and see what happens', 'I analyze the issue step-by-step', 'I ask someone else to do it', 'I avoid the problem', 'B', 'Step-by-step analysis is the most logical and effective way to solve complex problems'),

(1, 'How do you handle conflicts with team members?', 'mcq', 'I avoid the person', 'I confront aggressively', 'I calmly discuss to understand both sides', 'I complain to my manager immediately', 'C', 'Calm discussion and understanding both perspectives leads to better conflict resolution'),

(1, 'How do you handle multiple tasks at once?', 'mcq', 'Prioritize and schedule', 'Do whatever comes first', 'Leave tasks unfinished', 'Wait for instructions', 'A', 'Prioritizing and scheduling helps manage multiple tasks effectively'),

(1, 'What do you do when you disagree with your manager?', 'mcq', 'Stay silent', 'Politely explain your viewpoint', 'Argue aggressively', 'Ignore the manager decision', 'B', 'Politely explaining your viewpoint shows professionalism and openness to dialogue');

-- ===== TEXT QUESTIONS FOR TEST 2 =====
INSERT INTO questions (test_id, question_text, type, correct_answer) VALUES
(2, 'Tell me about a time when you faced a challenge at work or college. How did you overcome it?', 'text', 'A good answer describes a specific challenge, the actions taken to overcome it, and the positive outcome or lesson learned. It should show problem-solving ability, resilience, and learning from experience.'),

(2, 'Describe a situation where you had to work with a difficult team member. What did you do?', 'text', 'A strong response demonstrates patience, communication skills, empathy, and professional approach to handling interpersonal conflicts. It shows ability to work collaboratively despite differences.'),

(2, 'Give an example of a goal you set and how you achieved it.', 'text', 'This should include a SMART goal, clear steps taken, challenges faced, and the final outcome. Shows goal-setting ability, determination, and follow-through.'),

(2, 'Describe a situation where you made a mistake. What did you learn from it?', 'text', 'A good answer shows accountability, learning from failure, and how the experience led to improvement or better practices going forward. Demonstrates humility and growth mindset.'),

(2, 'Tell me about a time when you had to adapt quickly to a change. What was the outcome?', 'text', 'This response should highlight flexibility, quick thinking, and positive adaptation. Shows resilience and ability to handle uncertainty or unexpected situations.'),

(2, 'Describe a time when you showed leadership even without a formal title.', 'text', 'Should demonstrate initiative, influence, and ability to guide or motivate others. Shows innate leadership qualities and sense of responsibility.'),

(2, 'Tell me about a time you helped someone in your team succeed.', 'text', 'A strong answer shows collaboration, mentoring ability, and commitment to team success. Demonstrates empathy and willingness to support colleagues.'),

(2, 'Explain a situation where you had to manage stress effectively.', 'text', 'This should describe a stressful situation, coping strategies used, and positive outcomes. Shows emotional intelligence and ability to maintain performance under pressure.');

-- ===== TEST 3: HR INTERVIEW ASSESSMENT =====
INSERT INTO tests (id, title, description, difficulty, time_limit) VALUES
(3, 'HR Interview Readiness & Professional Competency Assessment', 'Comprehensive HR interview assessment covering key competencies, communication skills, and professional growth mindset based on industry best practices', 'medium', 0)
ON DUPLICATE KEY UPDATE 
title = VALUES(title),
description = VALUES(description),
difficulty = VALUES(difficulty),
time_limit = VALUES(time_limit);

-- ===== MCQ QUESTIONS FOR TEST 3 =====
INSERT INTO questions (test_id, question_text, type, option_a, option_b, option_c, option_d, correct_option, correct_answer) VALUES
(3, 'What are the five key areas an HR interview focuses on?', 'mcq', 'Technical skills, educational background, salary expectation, punctuality, and dress code', 'Teamwork, leadership, problem-solving, adaptability, and conflict resolution', 'Product knowledge, industry trends, company history, management style, and long-term vision', 'Resume review, personal interests, travel history, favorite hobbies, and pet peeves', 'B', 'Teamwork, leadership, problem-solving, adaptability, and conflict resolution are the core competencies assessed in HR interviews'),

(3, 'Which question is often referred to as the candidate\'s elevator pitch and is typically the first question for freshers?', 'mcq', 'Why should we hire you?', 'Can you tell me something about yourself?', 'Where do you see yourself in 5 years?', 'What are your salary expectations?', 'B', 'The "Tell me about yourself" question is the classic elevator pitch question that allows candidates to introduce themselves professionally'),

(3, 'According to best practices, what is a crucial element to include when answering "What are your strengths?" to make a strong impact?', 'mcq', 'Stating only personal qualities like "I am a good person"', 'Connecting strengths to specific work situations and quantifying achievements', 'Listing three general strengths without examples', 'Mentioning a strength that is completely irrelevant to the job', 'B', 'Connecting strengths to specific work situations and quantifying achievements makes answers compelling and credible'),

(3, 'When responding to "What are your salary expectations?", what key priority should balance the discussion?', 'mcq', 'That the main priority is a high salary', 'That the main priority is finding a role for growth and contribution to the company\'s success', 'That the main priority is a flexible schedule', 'That the main priority is never leaving the company', 'B', 'Balancing salary expectations with growth opportunities shows a candidate\'s genuine interest in career development'),

(3, 'Which soft skill is highlighted as vital in maintaining a harmonious workplace, specifically in handling conflict with a coworker?', 'mcq', 'Technical proficiency', 'Clear communication', 'Graphic design skills', 'Financial analysis', 'B', 'Clear communication is essential for resolving conflicts and maintaining positive workplace relationships');

-- ===== TEXT QUESTIONS FOR TEST 3 =====
INSERT INTO questions (test_id, question_text, type, correct_answer) VALUES
(3, 'How should a candidate strategically answer the tricky question "What are your weaknesses?"?', 'text', 'A candidate should acknowledge a real weakness while highlighting the proactive steps they are taking to improve it. The answer should demonstrate self-awareness and a commitment to growth, such as using time management tools to improve decision-making speed. This approach shows honesty, self-reflection, and a growth mindset.'),

(3, 'What should be demonstrated in your answer to "Why do you want to work here?" to show genuine interest?', 'text', 'The answer should show thorough research on the company by mentioning specific projects or their mission, and align personal values and goals with the company\'s mission. For example, "I admire your company\'s focus on innovation and sustainability, which aligns with my passion for creating sustainable solutions."'),

(3, 'Describe the recommended process for handling multiple tight deadlines.', 'text', 'The recommended process is to list all deadlines, prioritize tasks based on impact and urgency, and use project management software to track progress and ensure transparency. When multiple tasks collide, communicate with stakeholders to manage expectations and reallocate resources if necessary.'),

(3, 'What is the recommended diplomatic approach when you disagree with a decision made by your manager?', 'text', 'The recommended approach is to avoid challenging it outright and instead present data and alternative solutions during a meeting. This balances professionalism with assertiveness, using data-driven arguments to support your ideas while maintaining a collaborative relationship.'),

(3, 'What are three specific "Bonus Tips" for nailing your HR interview beyond just answering the questions?', 'text', 'Key bonus tips include maintaining good body language with proper posture and eye contact, using a confident and professional tone, thorough preparation through research and rehearsal, dressing professionally, being punctual, listening attentively to questions, and showcasing soft skills such as empathy, problem-solving, and teamwork throughout the interview.');

-- ===== TEST 4: S.T.A.R BEHAVIORAL INTERVIEW QUESTIONS =====
INSERT INTO tests (id, title, description, difficulty, time_limit)
VALUES (4, 'S.T.A.R. Method-Based Behavioral Interview Assessment', 'Comprehensive Assessment Based on The S.T.A.R Principle', 'medium', 0)
ON DUPLICATE KEY UPDATE
title = VALUES(title),
description = VALUES(description),
difficulty = VALUES(difficulty),
time_limit = VALUES(time_limit);

INSERT INTO questions (
    test_id, question_text, type,
    option_a, option_b, option_c, option_d,
    correct_option, correct_answer
) VALUES
(4, 'Which part of the STAR method explains the background of the story?', 'mcq',
 'Task', 'Situation', 'Action', 'Result',
 'B', 'Situation'),

(4, 'What is the main purpose of the STAR method in interviews?', 'mcq',
 'To memorise long answers', 'To structure real-life examples clearly', 'To avoid personal experiences', 'To give very short answers',
 'B', 'To structure real-life examples clearly'),

(4, 'Which STAR component explains what you personally did?', 'mcq',
 'Task', 'Action', 'Result', 'Situation',
 'B', 'Action'),

(4, 'Which part of STAR describes the final outcome?', 'mcq',
 'Action', 'Result', 'Situation', 'Task',
 'B', 'Result'),

(4, 'Behavioural interview questions usually start with:', 'mcq',
 'Tell me about a time…', 'What is your name?', 'Define teamwork.', 'What is your biggest strength?',
 'A', 'Tell me about a time…'),

(4, 'Which of the following is a good sign of teamwork?', 'mcq',
 'Working alone always', 'Clear communication', 'Ignoring feedback', 'Blaming members',
 'B', 'Clear communication'),

(4, 'What should you avoid in interview answers?', 'mcq',
 'Eye contact', 'Confident tone', 'Negative comments about past teams', 'Using examples',
 'C', 'Negative comments about past teams'),

(4, 'The best way to show leadership in an interview is by:', 'mcq',
 'Talking loudly', 'Sharing examples where you guided others', 'Criticising team members', 'Giving long answers',
 'B', 'Sharing examples where you guided others'),

(4, 'What is the ideal length of a STAR answer?', 'mcq',
 'One sentence', '1-2 minutes', '10 minutes', '15 minutes',
 'B', '1-2 minutes'),

(4, 'Which action improves interview confidence?', 'mcq',
 'Practising answers aloud', 'Avoiding practice', 'Speaking very fast', 'Memorising essays',
 'A', 'Practising answers aloud'),

(4, 'What should the "Task" part focus on?', 'mcq',
 'Your responsibility', 'The final outcome', 'Team faults', 'Unrelated details',
 'A', 'Your responsibility'),

(4, 'Which is an example of a positive interview habit?', 'mcq',
 'Arriving late', 'Interrupting the interviewer', 'Listening carefully', 'Giving extremely long explanations',
 'C', 'Listening carefully'),

(4, 'What is the best way to highlight your skills?', 'mcq',
 'Real examples', 'Vague statements', 'Guessing answers', 'Giving excuses',
 'A', 'Real examples'),

(4, 'Which behaviour shows professionalism?', 'mcq',
 'Using casual slang', 'Being polite and respectful', 'Checking phone during interview', 'Complaining about past jobs',
 'B', 'Being polite and respectful'),

(4, 'Why do interviewers ask teamwork questions?', 'mcq',
 'To check knowledge', 'To assess how you work with others', 'To test memory', 'To confuse candidates',
 'B', 'To assess how you work with others'),

(4, 'What improves clarity while answering?', 'mcq',
 'Speaking very fast', 'Structured answers', 'Using filler words', 'Avoiding eye contact',
 'B', 'Structured answers'),

(4, 'Which skill is MOST important for resolving conflicts?', 'mcq',
 'Aggressiveness', 'Listening', 'Ignoring the issue', 'Blaming others',
 'B', 'Listening'),

(4, 'In the STAR method, which part should be the shortest?', 'mcq',
 'Situation', 'Action', 'Task', 'Result',
 'A', 'Situation'),

(4, 'What does a "Result" in STAR ideally include?', 'mcq',
 'The problem only', 'Your mistakes', 'Clear outcomes or achievements', 'Personal opinions',
 'C', 'Clear outcomes or achievements'),

(4, 'Which behaviour shows confidence in an interview?', 'mcq',
 'Clear voice and steady posture', 'Avoiding eye contact', 'Giving unclear answers', 'Constantly apologising',
 'A', 'Clear voice and steady posture');


-- ===== TEST 5: ADVANCED BEHAVIORAL DEEP-DIVE =====
INSERT INTO tests (id, title, description, difficulty, time_limit) VALUES
(5, 'Advanced Behavioral Deep-Dive: Conflict Resolution & Project Impact', 'Advanced behavioral interview evaluation based on conflict, impact, and project reflections.', 'medium', 0)
ON DUPLICATE KEY UPDATE 
title = VALUES(title),
description = VALUES(description),
difficulty = VALUES(difficulty),
time_limit = VALUES(time_limit);

INSERT INTO questions 
(test_id, question_text, type, option_a, option_b, option_c, option_d, correct_option, correct_answer) 
VALUES

-- Question 1
(5,
'Which dimension is recommended for a candidate to consider when choosing a conflict story, especially if they are new to behavioral interviews?',
'mcq',
'It should involve minimal emotional content',
'It should involve low-stakes disagreements like code formatting',
'The example should be one where the candidate was correct in their stance',
'The candidate must have been only a peripheral audience member',
'C',
'The example should be one where the candidate was correct in their stance'),

-- Question 2
(5,
'What percentage of a behavioral interview response should typically be spent describing the actions taken?',
'mcq',
'10%',
'20%',
'40%',
'60%',
'D',
'60%'),

-- Question 3
(5,
'What is considered a red flag in a conflict resolution story during an interview?',
'mcq',
'Focusing mainly on a technical achievement or business outcome',
'Trying to understand the other person’s perspective',
'Preserving relationships with colleagues',
'Using objective data to resolve conflict',
'A',
'Focusing mainly on a technical achievement or business outcome'),

-- Question 4
(5,
'When selecting a project to discuss in an interview, which three dimensions should candidates optimize for?',
'mcq',
'Recency, Team Size, and Manager Support',
'Technical Complexity, Time-to-Market, and Learnings',
'Impact, Scope, and Personal Contribution',
'Budget, Ambiguity, and Cross-functional Alignment',
'C',
'Impact, Scope, and Personal Contribution'),

-- Question 5
(5,
'When discussing a project failure or risk, what is the interviewer primarily assessing?',
'mcq',
'Ability to avoid all failure',
'Lack of emotional response',
'Self-awareness and ability to reflect and grow',
'Tendency to blame external factors',
'C',
'Self-awareness and ability to reflect and grow'),

-- Question 6
(5,
'When interviewers ask about a conflict with a co-worker, what are they mainly trying to assess?',
'mcq',
'Only technical problem-solving skills',
'Conflict resolution, communication skills, and scope of responsibility',
'Ability to avoid conflict entirely',
'Knowledge of company policies',
'B',
'Conflict resolution, communication skills, and scope of responsibility'),

-- Question 7
(5,
'How should a Staff or Principal Engineer handle conflicts differently from a junior engineer?',
'mcq',
'By avoiding conflicts completely',
'By escalating every conflict to management',
'By focusing on systemic or organizational solutions',
'By resolving conflicts only within their own team',
'C',
'By focusing on systemic or organizational solutions'),

-- Question 8
(5,
'When telling a long project story in an interview, what technique should be used at the beginning?',
'mcq',
'Start with technical details immediately',
'Explain the final result first',
'Provide a table of contents for the story',
'Ask the interviewer questions before starting',
'C',
'Provide a table of contents for the story'),

-- Question 9
(5,
'When disagreeing with a manager, what is the most critical condition for pushing back?',
'mcq',
'Being emotionally firm',
'Proving the manager wrong publicly',
'Remaining respectful and professional',
'Refusing to commit to the final decision',
'C',
'Remaining respectful and professional'),

-- Question 10
(5,
'To avoid appearing careless when discussing a project failure, what should be included at the start of the story?',
'mcq',
'Details of who caused the failure',
'A believable hypothesis explaining the original decision',
'Only the final negative outcome',
'An apology before explaining the issue',
'B',
'A believable hypothesis explaining the original decision');
