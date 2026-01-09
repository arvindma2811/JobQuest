-- PostgreSQL version of JobQuest database schema
-- Run this in Neon SQL Editor

-- NOTE:
-- PostgreSQL does NOT use CREATE DATABASE here.
-- Neon already creates the database for you.

-- USERS TABLE
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  username VARCHAR(100) NOT NULL UNIQUE,
  email VARCHAR(255) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  profile_pic VARCHAR(512) DEFAULT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- TESTS TABLE
CREATE TABLE IF NOT EXISTS tests (
  id SERIAL PRIMARY KEY,
  title VARCHAR(255),
  description TEXT,
  difficulty VARCHAR(50) DEFAULT 'medium',
  time_limit INT,   -- in minutes
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- QUESTIONS TABLE
CREATE TABLE IF NOT EXISTS questions (
  id SERIAL PRIMARY KEY,
  test_id INT,
  question_text TEXT,
  type VARCHAR(20) DEFAULT 'mcq',  -- replaced ENUM
  option_a VARCHAR(255),
  option_b VARCHAR(255),
  option_c VARCHAR(255),
  option_d VARCHAR(255),
  correct_option VARCHAR(50),
  correct_answer TEXT,
  CONSTRAINT fk_test
    FOREIGN KEY (test_id)
    REFERENCES tests(id)
    ON DELETE CASCADE
);

-- USER ANSWERS TABLE
CREATE TABLE IF NOT EXISTS user_answers (
  id SERIAL PRIMARY KEY,
  user_id INT,
  question_id INT,
  selected_option VARCHAR(50),
  answer_text TEXT,
  audio_file VARCHAR(255),
  submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_user
    FOREIGN KEY (user_id)
    REFERENCES users(id)
    ON DELETE CASCADE,
  CONSTRAINT fk_question
    FOREIGN KEY (question_id)
    REFERENCES questions(id)
    ON DELETE CASCADE
);

-- ANSWERS TABLE
CREATE TABLE IF NOT EXISTS answers (
  id SERIAL PRIMARY KEY,
  user_id INT,
  test_id INT,
  question_id INT,
  answer_text TEXT,
  audio_file VARCHAR(255),
  submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_user_ans
    FOREIGN KEY (user_id)
    REFERENCES users(id)
    ON DELETE CASCADE,
  CONSTRAINT fk_test_ans
    FOREIGN KEY (test_id)
    REFERENCES tests(id)
    ON DELETE CASCADE,
  CONSTRAINT fk_question_ans
    FOREIGN KEY (question_id)
    REFERENCES questions(id)
    ON DELETE CASCADE
);

-- TEST SCORES TABLE
CREATE TABLE IF NOT EXISTS test_scores (
  id SERIAL PRIMARY KEY,
  user_id INT,
  test_id INT,
  score DECIMAL(5,2),
  total_questions INT,
  correct_answers INT,
  completed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT unique_user_test UNIQUE (user_id, test_id),
  CONSTRAINT fk_user_score
    FOREIGN KEY (user_id)
    REFERENCES users(id)
    ON DELETE CASCADE,
  CONSTRAINT fk_test_score
    FOREIGN KEY (test_id)
    REFERENCES tests(id)
    ON DELETE CASCADE
);
