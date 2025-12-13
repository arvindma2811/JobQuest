-- Run these SQL commands in your MySQL to create the database and users table:
CREATE DATABASE IF NOT EXISTS jobquest;
USE jobquest;
CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(100) NOT NULL UNIQUE,
  email VARCHAR(255) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  profile_pic VARCHAR(512) DEFAULT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE tests (
  id INT AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(255),
  description TEXT,
  difficulty VARCHAR(50) DEFAULT 'medium',
  time_limit INT,   -- in minutes
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE questions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  test_id INT,
  question_text TEXT,
  type ENUM('mcq', 'text', 'voice') DEFAULT 'mcq',
  option_a VARCHAR(255),
  option_b VARCHAR(255),
  option_c VARCHAR(255),
  option_d VARCHAR(255),
  correct_option VARCHAR(50),  -- for MCQ (A, B, C, D)
  correct_answer TEXT,          -- for text/voice answers
  FOREIGN KEY(test_id) REFERENCES tests(id)
);

CREATE TABLE user_answers (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT,
  question_id INT,
  selected_option VARCHAR(50),  -- for MCQ answers
  answer_text TEXT,             -- for text answers
  audio_file VARCHAR(255),      -- for voice answers
  submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY(user_id) REFERENCES users(id),
  FOREIGN KEY(question_id) REFERENCES questions(id)
);

CREATE TABLE answers (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT,
  test_id INT,
  question_id INT,
  answer_text TEXT,            -- for MCQ/Text
  audio_file VARCHAR(255),     -- for voice answers
  submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY(user_id) REFERENCES users(id),
  FOREIGN KEY(test_id) REFERENCES tests(id),
  FOREIGN KEY(question_id) REFERENCES questions(id)
);

CREATE TABLE test_scores (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT,
  test_id INT,
  score DECIMAL(5, 2),
  total_questions INT,
  correct_answers INT,
  completed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY unique_user_test (user_id, test_id),
  FOREIGN KEY(user_id) REFERENCES users(id),
  FOREIGN KEY(test_id) REFERENCES tests(id)
);
