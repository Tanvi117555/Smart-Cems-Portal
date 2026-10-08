-- College Event Management System (CEMS) Database Schema
-- Compatible with MySQL 8.0+

CREATE DATABASE IF NOT EXISTS `cems_db` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE `cems_db`;

-- 1. Departments Table
CREATE TABLE IF NOT EXISTS `departments` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `name` VARCHAR(100) NOT NULL UNIQUE,
  `code` VARCHAR(20) NOT NULL UNIQUE,
  `description` TEXT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- 2. Categories Table
CREATE TABLE IF NOT EXISTS `categories` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `name` VARCHAR(100) NOT NULL UNIQUE,
  `slug` VARCHAR(100) NOT NULL UNIQUE,
  `icon` VARCHAR(50) DEFAULT 'Calendar',
  `description` TEXT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- 3. Users Table (Admins, Faculty, Students)
CREATE TABLE IF NOT EXISTS `users` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `name` VARCHAR(150) NOT NULL,
  `email` VARCHAR(150) NOT NULL UNIQUE,
  `password_hash` VARCHAR(255) NOT NULL,
  `role` ENUM('admin', 'faculty', 'student') NOT NULL DEFAULT 'student',
  `phone` VARCHAR(30) NULL,
  `department_id` INT NULL,
  `avatar` VARCHAR(255) NULL,
  `status` ENUM('active', 'inactive', 'suspended') DEFAULT 'active',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (`department_id`) REFERENCES `departments`(`id`) ON DELETE SET NULL
) ENGINE=InnoDB;

-- 4. Students Extension Table
CREATE TABLE IF NOT EXISTS `students` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `user_id` INT NOT NULL UNIQUE,
  `student_id` VARCHAR(50) NOT NULL UNIQUE,
  `department_id` INT NULL,
  `year` VARCHAR(20) NOT NULL DEFAULT '3rd Year',
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`department_id`) REFERENCES `departments`(`id`) ON DELETE SET NULL
) ENGINE=InnoDB;

-- 5. Faculty Extension Table
CREATE TABLE IF NOT EXISTS `faculty` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `user_id` INT NOT NULL UNIQUE,
  `faculty_id` VARCHAR(50) NOT NULL UNIQUE,
  `department_id` INT NULL,
  `designation` VARCHAR(100) DEFAULT 'Assistant Professor',
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`department_id`) REFERENCES `departments`(`id`) ON DELETE SET NULL
) ENGINE=InnoDB;

-- 6. Events Table
CREATE TABLE IF NOT EXISTS `events` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `title` VARCHAR(200) NOT NULL,
  `description` TEXT NOT NULL,
  `category_id` INT NOT NULL,
  `department_id` INT NULL,
  `organizer_id` INT NOT NULL,
  `image` VARCHAR(255) NULL,
  `date` DATE NOT NULL,
  `start_time` VARCHAR(20) NOT NULL,
  `end_time` VARCHAR(20) NOT NULL,
  `venue` VARCHAR(150) NOT NULL,
  `room_number` VARCHAR(50) NULL,
  `building` VARCHAR(100) NULL,
  `max_participants` INT NOT NULL DEFAULT 100,
  `registration_fee` DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  `is_paid` BOOLEAN NOT NULL DEFAULT FALSE,
  `qr_code_image` VARCHAR(255) NULL,
  `registration_start` DATE NOT NULL,
  `registration_end` DATE NOT NULL,
  `status` ENUM('draft', 'pending', 'approved', 'rejected', 'published', 'completed', 'cancelled') NOT NULL DEFAULT 'pending',
  `rejection_reason` TEXT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (`category_id`) REFERENCES `categories`(`id`),
  FOREIGN KEY (`department_id`) REFERENCES `departments`(`id`) ON DELETE SET NULL,
  FOREIGN KEY (`organizer_id`) REFERENCES `users`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB;

-- 7. Event Rules Table
CREATE TABLE IF NOT EXISTS `event_rules` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `event_id` INT NOT NULL,
  `rule_text` TEXT NOT NULL,
  `rule_order` INT DEFAULT 1,
  FOREIGN KEY (`event_id`) REFERENCES `events`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB;

-- 8. Event Schedule Table
CREATE TABLE IF NOT EXISTS `event_schedule` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `event_id` INT NOT NULL,
  `schedule_time` VARCHAR(50) NOT NULL,
  `activity` VARCHAR(200) NOT NULL,
  `description` TEXT NULL,
  `schedule_order` INT DEFAULT 1,
  FOREIGN KEY (`event_id`) REFERENCES `events`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB;

-- 9. Registrations Table
CREATE TABLE IF NOT EXISTS `registrations` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `registration_id` VARCHAR(50) NOT NULL UNIQUE,
  `event_id` INT NOT NULL,
  `student_id` INT NOT NULL,
  `is_team` BOOLEAN DEFAULT FALSE,
  `team_name` VARCHAR(100) NULL,
  `team_members` JSON NULL,
  `status` ENUM('pending', 'confirmed', 'rejected', 'cancelled') NOT NULL DEFAULT 'confirmed',
  `registered_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`event_id`) REFERENCES `events`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`student_id`) REFERENCES `users`(`id`) ON DELETE CASCADE,
  UNIQUE KEY `unique_event_student` (`event_id`, `student_id`)
) ENGINE=InnoDB;

-- 10. Payments Table
CREATE TABLE IF NOT EXISTS `payments` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `registration_id` INT NOT NULL UNIQUE,
  `amount` DECIMAL(10,2) NOT NULL,
  `transaction_id` VARCHAR(100) NOT NULL,
  `screenshot_path` VARCHAR(255) NULL,
  `status` ENUM('pending', 'verified', 'rejected') NOT NULL DEFAULT 'pending',
  `verified_by` INT NULL,
  `verified_at` TIMESTAMP NULL,
  `rejection_reason` TEXT NULL,
  `submitted_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`registration_id`) REFERENCES `registrations`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`verified_by`) REFERENCES `users`(`id`) ON DELETE SET NULL
) ENGINE=InnoDB;

-- 11. Feedback Forms Table
CREATE TABLE IF NOT EXISTS `feedback_forms` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `event_id` INT NOT NULL UNIQUE,
  `title` VARCHAR(200) NOT NULL,
  `description` TEXT NULL,
  `is_active` BOOLEAN DEFAULT TRUE,
  `created_by` INT NOT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`event_id`) REFERENCES `events`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`created_by`) REFERENCES `users`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB;

-- 12. Feedback Questions Table
CREATE TABLE IF NOT EXISTS `feedback_questions` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `form_id` INT NOT NULL,
  `question_text` TEXT NOT NULL,
  `question_type` ENUM('rating', 'short_text', 'long_text', 'multiple_choice', 'checkbox', 'yes_no') NOT NULL,
  `options_json` JSON NULL,
  `is_required` BOOLEAN DEFAULT TRUE,
  `question_order` INT DEFAULT 1,
  FOREIGN KEY (`form_id`) REFERENCES `feedback_forms`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB;

-- 13. Feedback Responses Table
CREATE TABLE IF NOT EXISTS `feedback_responses` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `form_id` INT NOT NULL,
  `student_id` INT NOT NULL,
  `submitted_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`form_id`) REFERENCES `feedback_forms`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`student_id`) REFERENCES `users`(`id`) ON DELETE CASCADE,
  UNIQUE KEY `unique_student_form` (`form_id`, `student_id`)
) ENGINE=InnoDB;

-- 14. Feedback Answers Table
CREATE TABLE IF NOT EXISTS `feedback_answers` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `response_id` INT NOT NULL,
  `question_id` INT NOT NULL,
  `answer_text` TEXT NOT NULL,
  FOREIGN KEY (`response_id`) REFERENCES `feedback_responses`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`question_id`) REFERENCES `feedback_questions`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB;

-- 15. Gallery Table
CREATE TABLE IF NOT EXISTS `gallery` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `event_id` INT NOT NULL,
  `image_path` VARCHAR(255) NOT NULL,
  `caption` VARCHAR(255) NULL,
  `uploaded_by` INT NOT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`event_id`) REFERENCES `events`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`uploaded_by`) REFERENCES `users`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB;

-- 16. Notifications Table
CREATE TABLE IF NOT EXISTS `notifications` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `user_id` INT NOT NULL,
  `title` VARCHAR(200) NOT NULL,
  `message` TEXT NOT NULL,
  `type` ENUM('info', 'success', 'warning', 'reminder') DEFAULT 'info',
  `link` VARCHAR(255) NULL,
  `is_read` BOOLEAN DEFAULT FALSE,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB;
