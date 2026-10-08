-- College Event Management System (CEMS) Realistic Sample Seed Data
USE `cems_db`;

-- Clear existing data in reverse dependency order
SET FOREIGN_KEY_CHECKS = 0;
TRUNCATE TABLE `notifications`;
TRUNCATE TABLE `gallery`;
TRUNCATE TABLE `feedback_answers`;
TRUNCATE TABLE `feedback_responses`;
TRUNCATE TABLE `feedback_questions`;
TRUNCATE TABLE `feedback_forms`;
TRUNCATE TABLE `payments`;
TRUNCATE TABLE `registrations`;
TRUNCATE TABLE `event_schedule`;
TRUNCATE TABLE `event_rules`;
TRUNCATE TABLE `events`;
TRUNCATE TABLE `faculty`;
TRUNCATE TABLE `students`;
TRUNCATE TABLE `users`;
TRUNCATE TABLE `categories`;
TRUNCATE TABLE `departments`;
SET FOREIGN_KEY_CHECKS = 1;

-- 1. Departments
INSERT INTO `departments` (`id`, `name`, `code`, `description`) VALUES
(1, 'Computer Science & Engineering', 'CSE', 'Department of Computer Science and Engineering, focusing on Software, AI, and Systems.'),
(2, 'Information Technology', 'IT', 'Department of Information Technology, specializing in Cloud, Web, and Cybersecurity.'),
(3, 'Electronics & Telecommunication', 'EXTC', 'Department of Electronics and Telecommunication Engineering, hardware and embedded systems.'),
(4, 'Mechanical Engineering', 'MECH', 'Department of Mechanical Engineering, robotics, CAD/CAM, and automotive dynamics.'),
(5, 'Biotechnology', 'BIOTECH', 'Department of Biotechnology, bio-informatics, genetics, and pharmaceutical engineering.'),
(6, 'Management & Business Studies', 'BMS', 'Department of Management Studies, finance, marketing, and entrepreneurship.');

-- 2. Categories
INSERT INTO `categories` (`id`, `name`, `slug`, `icon`, `description`) VALUES
(1, 'Technical', 'technical', 'Code', 'Coding, hackathons, robotics, developer bootcamps, and technical showcases.'),
(2, 'Cultural', 'cultural', 'Music', 'Music, dance, drama, fashion shows, and campus celebrations.'),
(3, 'Sports', 'sports', 'Trophy', 'Football, cricket, basketball, track & field, and indoor tournaments.'),
(4, 'Arts & Media', 'arts', 'Palette', 'Photography, sketching, graphic design, and creative exhibitions.'),
(5, 'Academic', 'academic', 'GraduationCap', 'Symposiums, paper presentations, guest lectures, and research summits.'),
(6, 'Competitions', 'competitions', 'Flame', 'Debates, quizzes, business pitches, and problem-solving contests.');

-- 3. Users (Passwords hashed for 'Password@123': $2a$10$rMDvXw8P2Q4o3e5K6R7Z0uW1e2f3g4h5i6j7k8l9m0n1o2p3q4r5s)
-- We will also use bcrypt in JavaScript to ensure exact match for 'Admin@123', 'Faculty@123', 'Student@123'
INSERT INTO `users` (`id`, `name`, `email`, `password_hash`, `role`, `phone`, `department_id`, `avatar`, `status`) VALUES
(1, 'Dr. Rajesh Deshmukh (Admin)', 'admin@cems.edu', '$2a$10$wEeVq0pM8v8y7dI/k73Hn.8rO4YgR7dD4/Wd2t3qf0V2/o6iK2kCe', 'admin', '+91 9876543210', 1, 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=300', 'active'),
(2, 'Dr. Priya Sharma', 'faculty.cs@cems.edu', '$2a$10$wEeVq0pM8v8y7dI/k73Hn.8rO4YgR7dD4/Wd2t3qf0V2/o6iK2kCe', 'faculty', '+91 9876543211', 1, 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=300', 'active'),
(3, 'Prof. Rajesh Kumar', 'rajesh.kumar@cems.edu', '$2a$10$wEeVq0pM8v8y7dI/k73Hn.8rO4YgR7dD4/Wd2t3qf0V2/o6iK2kCe', 'faculty', '+91 9876543212', 2, 'https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&q=80&w=300', 'active'),
(4, 'Dr. Ananya Sen', 'ananya.sen@cems.edu', '$2a$10$wEeVq0pM8v8y7dI/k73Hn.8rO4YgR7dD4/Wd2t3qf0V2/o6iK2kCe', 'faculty', '+91 9876543213', 2, 'https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&q=80&w=300', 'active'),
(5, 'Coach Vikram Singh', 'vikram.singh@cems.edu', '$2a$10$wEeVq0pM8v8y7dI/k73Hn.8rO4YgR7dD4/Wd2t3qf0V2/o6iK2kCe', 'faculty', '+91 9876543214', 4, 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=300', 'active'),
(6, 'Alex Johnson', 'student.alex@cems.edu', '$2a$10$wEeVq0pM8v8y7dI/k73Hn.8rO4YgR7dD4/Wd2t3qf0V2/o6iK2kCe', 'student', '+91 9876543220', 1, 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&q=80&w=300', 'active'),
(7, 'Sneha Patel', 'sneha.patel@cems.edu', '$2a$10$wEeVq0pM8v8y7dI/k73Hn.8rO4YgR7dD4/Wd2t3qf0V2/o6iK2kCe', 'student', '+91 9876543221', 2, 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&q=80&w=300', 'active'),
(8, 'Rohan Gupta', 'rohan.gupta@cems.edu', '$2a$10$wEeVq0pM8v8y7dI/k73Hn.8rO4YgR7dD4/Wd2t3qf0V2/o6iK2kCe', 'student', '+91 9876543222', 4, 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=300', 'active'),
(9, 'Maya Nair', 'maya.nair@cems.edu', '$2a$10$wEeVq0pM8v8y7dI/k73Hn.8rO4YgR7dD4/Wd2t3qf0V2/o6iK2kCe', 'student', '+91 9876543223', 5, 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=300', 'active'),
(10, 'Aarav Verma', 'aarav.verma@cems.edu', '$2a$10$wEeVq0pM8v8y7dI/k73Hn.8rO4YgR7dD4/Wd2t3qf0V2/o6iK2kCe', 'student', '+91 9876543224', 3, 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&q=80&w=300', 'active');

-- 4. Students Extension
INSERT INTO `students` (`id`, `user_id`, `student_id`, `department_id`, `year`) VALUES
(1, 6, 'STU2023CSE045', 1, '3rd Year'),
(2, 7, 'STU2024IT082', 2, '2nd Year'),
(3, 8, 'STU2022MECH019', 4, '4th Year'),
(4, 9, 'STU2025BIO003', 5, '1st Year'),
(5, 10, 'STU2023EXTC051', 3, '3rd Year');

-- 5. Faculty Extension
INSERT INTO `faculty` (`id`, `user_id`, `faculty_id`, `department_id`, `designation`) VALUES
(1, 2, 'FAC-CS-101', 1, 'Associate Professor & HOD'),
(2, 3, 'FAC-IT-104', 2, 'Assistant Professor'),
(3, 4, 'FAC-CUL-205', 2, 'Cultural Committee Lead'),
(4, 5, 'FAC-SPT-301', 4, 'Director of Physical Education');

-- 6. Events (12 Realistic Events across all categories and states)
INSERT INTO `events` (`id`, `title`, `description`, `category_id`, `department_id`, `organizer_id`, `image`, `date`, `start_time`, `end_time`, `venue`, `room_number`, `building`, `max_participants`, `registration_fee`, `is_paid`, `qr_code_image`, `registration_start`, `registration_end`, `status`, `rejection_reason`) VALUES
(1, 'CodeFest 2026: 24-Hour National Hackathon', 'A high-intensity 24-hour hackathon bringing together the sharpest minds to build AI, Web3, and Cloud solutions for real-world civic challenges. Cash prizes up to ₹1,50,000 + mentorship opportunities.', 1, 1, 2, 'https://images.unsplash.com/photo-1504384308090-c894fdcc538d?auto=format&fit=crop&q=80&w=1200', '2026-10-15', '09:00 AM', '09:00 AM (Next Day)', 'Main Campus Auditorium & Innovation Labs', 'Lab 301-304', 'APJ Abdul Kalam Block', 200, 250.00, TRUE, 'https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=upi://pay?pa=cems.fest@upi&pn=CodeFest2026&am=250', '2026-09-01', '2026-10-10', 'published', NULL),

(2, 'RoboWars: Combat Robotics Championship', 'Prepare for mechanical carnage! Custom-built 15kg & 30kg combat bots battle in an armored bulletproof arena. Dual weapon systems, flippers, and spinners compete for the coveted Titan Cup.', 1, 4, 3, 'https://images.unsplash.com/photo-1485827404703-89b55fcc595e?auto=format&fit=crop&q=80&w=1200', '2026-10-22', '10:00 AM', '05:30 PM', 'University Open Ground Arena', 'Ground Arena', 'Mechanical Block Quadrangle', 120, 500.00, TRUE, 'https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=upi://pay?pa=cems.fest@upi&pn=RoboWars2026&am=500', '2026-09-05', '2026-10-18', 'published', NULL),

(3, 'Tarang 2026: Annual Inter-College Cultural Fest', 'A 3-day extravaganza of music bands, western and folk dance battles, fashion parade, dramatic arts, and live celebrity star-night. The largest youth cultural festival in the state.', 2, 2, 4, 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&q=80&w=1200', '2026-11-05', '04:00 PM', '10:00 PM', 'Central Amphitheater & Open Air Theater', 'Main Stage', 'Student Activity Center', 500, 0.00, FALSE, NULL, '2026-09-10', '2026-11-01', 'published', NULL),

(4, 'Spardha 2026: Inter-University Sports Meet', 'Annual athletic championship featuring 100m/400m sprint, Football 7v7, Cricket T20, Volleyball, and Badminton singles and doubles. Medals, trophies, and university certificates for all podium finishers.', 3, 4, 5, 'https://images.unsplash.com/photo-1461896836934-ffe607ba8211?auto=format&fit=crop&q=80&w=1200', '2026-10-28', '08:00 AM', '06:00 PM', 'University Sports Complex', 'Stadium & Courts', 'Sports Directorate', 350, 100.00, TRUE, 'https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=upi://pay?pa=cems.fest@upi&pn=Spardha2026&am=100', '2026-09-01', '2026-10-25', 'published', NULL),

(5, 'LensCraft: National Photography & Film Contest', 'Showcase your creative vision! Themes: "Street Stories", "Campus Life in Monochrome", and "Macro Flora". Professional judges from the Film Institute will review entries with exhibition on campus.', 4, 2, 4, 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&fit=crop&q=80&w=1200', '2026-10-18', '11:00 AM', '04:00 PM', 'Art Gallery & Visual Arts Studio', 'Gallery A', 'Media & Arts Complex', 80, 0.00, FALSE, NULL, '2026-09-01', '2026-10-15', 'published', NULL),

(6, 'NextGen Web: Full-Stack React & Node Bootcamp', 'A practical hands-on workshop on building production-grade web applications with modern tools, REST APIs, Tailwind CSS, and cloud deployments. Perfect for aspiring developers.', 1, 1, 2, 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?auto=format&fit=crop&q=80&w=1200', '2026-10-12', '10:00 AM', '04:00 PM', 'Seminar Hall 2', 'Hall 204', 'APJ Abdul Kalam Block', 100, 150.00, TRUE, 'https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=upi://pay?pa=cems.fest@upi&pn=NextGenWeb&am=150', '2026-09-01', '2026-10-09', 'published', NULL),

(7, 'AI & Quantum Frontiers: International Symposium', 'Renowned scientists and industry research leads from Microsoft, Google, and IBM explore the convergence of generative models, neuromorphic computing, and quantum fault tolerance.', 5, 1, 2, 'https://images.unsplash.com/photo-1488229297570-58520851e868?auto=format&fit=crop&q=80&w=1200', '2026-11-12', '09:30 AM', '05:00 PM', 'Sir CV Raman Memorial Auditorium', 'Auditorium A', 'Science & Research Block', 250, 0.00, FALSE, NULL, '2026-09-15', '2026-11-05', 'published', NULL),

(8, 'Manthan 2026: National Parliamentary Debate', 'Three rounds of rigorous parliamentary debating on international diplomacy, technological governance, and economic equity. Adjudicated by national debate alumni.', 6, 6, 3, 'https://images.unsplash.com/photo-1475721027785-f74eccf877e2?auto=format&fit=crop&q=80&w=1200', '2026-10-30', '10:00 AM', '06:00 PM', 'Council Hall', 'Room 102', 'Administrative Wing', 64, 0.00, FALSE, NULL, '2026-09-01', '2026-10-26', 'published', NULL),

(9, 'E-Summit 2026: Startup Pitch & Angel Conclave', 'Got a high-impact product idea? Pitch in front of leading angel investors and venture capitalists. Win initial seed grants, incubation support, and free cloud credits.', 6, 6, 3, 'https://images.unsplash.com/photo-1515187029135-18ee286d815b?auto=format&fit=crop&q=80&w=1200', '2026-11-18', '09:00 AM', '06:00 PM', 'Incubation & Innovation Hub', 'Demo Deck', 'Startup Incubator Center', 150, 300.00, TRUE, 'https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=upi://pay?pa=cems.fest@upi&pn=ESummit2026&am=300', '2026-09-10', '2026-11-10', 'published', NULL),

(10, 'Rhythms of India: Classical Symphony Showcase', 'An evening celebrating classical Hindustani and Carnatic vocals, sitar ensembles, and Bharatanatyam performances by student maestros and visiting gurus.', 2, 2, 4, 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&q=80&w=1200', '2026-11-25', '06:00 PM', '09:30 PM', 'University Heritage Hall', 'Main Stage', 'Heritage Block', 300, 0.00, FALSE, NULL, '2026-09-20', '2026-11-20', 'pending', NULL),

(11, 'CyberShield 2026: Live Campus CTF', 'Capture The Flag hacking tournament covering web exploitation, reverse engineering, cryptography, and network forensics. Individual and duo participation.', 1, 2, 3, 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?auto=format&fit=crop&q=80&w=1200', '2026-12-05', '09:00 AM', '09:00 PM', 'Cybersecurity Lab', 'Lab 201', 'IT Complex', 100, 0.00, FALSE, NULL, '2026-10-01', '2026-11-28', 'draft', NULL),

(12, 'EcoDesign 2026: Sustainable Green Prototype Expo', 'Green campus prototypes and zero-waste civil engineering design exhibition. Entries must show lifecycle carbon reduction.', 1, 4, 3, 'https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?auto=format&fit=crop&q=80&w=1200', '2026-10-08', '10:00 AM', '04:00 PM', 'Engineering Workshops', 'Shop 4', 'Mechanical Wing', 50, 0.00, FALSE, NULL, '2026-09-01', '2026-10-01', 'rejected', 'The proposal lacked required safety clearance for high-voltage battery storage inside the indoor workshop. Please resubmit with fire marshal NOC.');

-- 7. Event Rules
INSERT INTO `event_rules` (`event_id`, `rule_text`, `rule_order`) VALUES
(1, 'Valid College / University ID card is strictly mandatory for entry.', 1),
(1, 'Teams must consist of 2 to 4 members. Inter-college teams are welcome.', 2),
(1, 'All code commits must be made to the designated GitHub repository during the 24-hour window.', 3),
(1, 'Use of pre-existing commercial codebases is prohibited; open-source libraries and APIs are permitted.', 4),
(1, 'Participants must bring their own laptops, chargers, and extension cords.', 5),

(2, 'Robots must strictly adhere to weight specifications (15kg or 30kg) within a 2% margin of error.', 1),
(2, 'Only radio-controlled bots on approved 2.4GHz frequency bands are permitted.', 2),
(2, 'Flame throwers, liquid projectiles, and radio jamming equipment are strictly banned.', 3),
(2, 'Safety check and weapon lockout test are mandatory before every bout.', 4),

(3, 'Each performance must adhere strictly to the allotted time limit of 8 minutes.', 1),
(3, 'Pre-recorded audio tracks must be submitted to the AV console 2 hours before the event.', 2),
(3, 'Vulgarity, offensive political remarks, or indecent gestures will result in immediate disqualification.', 3),

(4, 'Participants must report in proper sports attire and footwear 30 minutes prior to match schedule.', 1),
(4, 'The referee’s and tournament director’s decisions are final and binding.', 2),
(4, 'First-aid and medical staff will be stationed on-field throughout all fixtures.', 3);

-- 8. Event Schedule
INSERT INTO `event_schedule` (`event_id`, `schedule_time`, `activity`, `description`, `schedule_order`) VALUES
(1, '08:30 AM', 'Check-in & Badge Collection', 'ID verification, swag distribution, and system connection.', 1),
(1, '09:30 AM', 'Opening Keynote & Problem Statements', 'Official briefing by industry sponsors and hackathon guidelines.', 2),
(1, '10:00 AM', 'Hacking Begins', 'Clocks start ticking. Mentors do initial checkpoint rounds.', 3),
(1, '01:00 PM', 'Networking Lunch', 'Buffet lunch served in the campus cafeteria.', 4),
(1, '06:30 PM', 'Checkpoint 1: Architecture Review', 'Mentors provide technical feedback on progress and scope.', 5),
(1, '12:00 AM', 'Midnight Fuel & Mini Game Break', 'Late-night snacks, energy drinks, and fun challenges.', 6),
(1, '08:00 AM', 'Code Freeze & Presentation Upload', 'Final commits pushed to GitHub and deck submitted.', 7),
(1, '09:00 AM', 'Grand Finale Pitch & Prize Distribution', 'Top 10 teams pitch live to the jury panel.', 8),

(2, '09:30 AM', 'Robot Scrutiny & Weigh-in', 'Verification of weight, fail-safe switch, and weapon clearance.', 1),
(2, '10:30 AM', 'Preliminary League Matches', 'Group stage 3-minute combat rounds in the arena.', 2),
(2, '02:00 PM', 'Quarterfinals & Semifinals', 'High-impact knockout brackets.', 3),
(2, '04:30 PM', 'The Championship Final & Crown Ceremony', 'Grand final bout followed by trophy and cash prize ceremony.', 4);

-- 9. Sample Registrations
INSERT INTO `registrations` (`id`, `registration_id`, `event_id`, `student_id`, `is_team`, `team_name`, `team_members`, `status`, `registered_at`) VALUES
(1, 'REG-2026-00101', 1, 6, TRUE, 'ByteBusters', '["Alex Johnson (Lead)", "Karan Sharma", "Ritika Roy", "Sameer Khan"]', 'confirmed', '2026-09-08 10:15:00'),
(2, 'REG-2026-00102', 1, 7, TRUE, 'CyberKnights', '["Sneha Patel (Lead)", "Dev Mehta", "Ananya Joshi"]', 'confirmed', '2026-09-09 14:30:00'),
(3, 'REG-2026-00103', 2, 8, TRUE, 'TitanForge', '["Rohan Gupta", "Aditya Rao"]', 'confirmed', '2026-09-10 11:20:00'),
(4, 'REG-2026-00104', 3, 6, FALSE, NULL, NULL, 'confirmed', '2026-09-11 16:45:00'),
(5, 'REG-2026-00105', 4, 10, FALSE, NULL, NULL, 'confirmed', '2026-09-12 09:00:00'),
(6, 'REG-2026-00106', 5, 9, FALSE, NULL, NULL, 'confirmed', '2026-09-12 15:10:00'),
(7, 'REG-2026-00107', 6, 7, FALSE, NULL, NULL, 'confirmed', '2026-09-13 11:00:00');

-- 10. Sample Payments
INSERT INTO `payments` (`id`, `registration_id`, `amount`, `transaction_id`, `screenshot_path`, `status`, `verified_by`, `verified_at`) VALUES
(1, 1, 250.00, 'UPI/20260908/948271049281', 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?auto=format&fit=crop&q=80&w=400', 'verified', 2, '2026-09-08 12:00:00'),
(2, 2, 250.00, 'UPI/20260909/781920394851', 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?auto=format&fit=crop&q=80&w=400', 'verified', 2, '2026-09-09 16:00:00'),
(3, 3, 500.00, 'UPI/20260910/182940294819', 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?auto=format&fit=crop&q=80&w=400', 'pending', NULL, NULL),
(4, 5, 100.00, 'UPI/20260912/829104829183', 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?auto=format&fit=crop&q=80&w=400', 'verified', 5, '2026-09-12 11:30:00'),
(5, 7, 150.00, 'UPI/20260913/592810394821', 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?auto=format&fit=crop&q=80&w=400', 'pending', NULL, NULL);

-- 11. Feedback Form for CodeFest
INSERT INTO `feedback_forms` (`id`, `event_id`, `title`, `description`, `is_active`, `created_by`) VALUES
(1, 1, 'CodeFest 2026 Participant Feedback Survey', 'Help us enhance upcoming hackathons by providing your honest experience and suggestions.', TRUE, 2);

-- 12. Feedback Questions
INSERT INTO `feedback_questions` (`id`, `form_id`, `question_text`, `question_type`, `options_json`, `is_required`, `question_order`) VALUES
(1, 1, 'Overall, how would you rate your CodeFest 2026 hackathon experience?', 'rating', NULL, TRUE, 1),
(2, 1, 'How satisfied were you with the technical mentorship and support provided?', 'rating', NULL, TRUE, 2),
(3, 1, 'Which problem statement track did your team build for?', 'multiple_choice', '["AI & Machine Learning", "Web3 & Decentralized Tech", "Civic & Smart Cities", "HealthTech & Bio", "Open Innovation"]', TRUE, 3),
(4, 1, 'Did the venue facilities (WiFi, power, food) meet your expectations?', 'yes_no', '["Yes", "No"]', TRUE, 4),
(5, 1, 'What was the single best highlight of this event?', 'short_text', NULL, FALSE, 5),
(6, 1, 'Any suggestions or features you want to see in the next edition?', 'long_text', NULL, FALSE, 6);

-- 13. Feedback Responses
INSERT INTO `feedback_responses` (`id`, `form_id`, `student_id`, `submitted_at`) VALUES
(1, 1, 6, '2026-09-12 18:00:00'),
(2, 1, 7, '2026-09-12 19:30:00');

-- 14. Feedback Answers
INSERT INTO `feedback_answers` (`id`, `response_id`, `question_id`, `answer_text`) VALUES
(1, 1, 1, '5'),
(2, 1, 2, '5'),
(3, 1, 3, 'AI & Machine Learning'),
(4, 1, 4, 'Yes'),
(5, 1, 5, 'The 2 AM mentor checkpoint was extremely valuable in pivoting our model architecture.'),
(6, 1, 6, 'Keep the food court open longer and add more quiet nap pods.'),
(7, 2, 1, '4'),
(8, 2, 2, '4'),
(9, 2, 3, 'Civic & Smart Cities'),
(10, 2, 4, 'Yes'),
(11, 2, 5, 'Great networking with judges from top tech firms.'),
(12, 2, 6, 'More power extension boxes for large teams.');

-- 15. Gallery Photos
INSERT INTO `gallery` (`id`, `event_id`, `image_path`, `caption`, `uploaded_by`) VALUES
(1, 1, 'https://images.unsplash.com/photo-1515187029135-18ee286d815b?auto=format&fit=crop&q=80&w=800', 'Opening Ceremony and Team Keynote in Main Auditorium', 2),
(2, 1, 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&q=80&w=800', 'Teams collaborating late night on AI prototype', 2),
(3, 1, 'https://images.unsplash.com/photo-1531482615713-2afd69097998?auto=format&fit=crop&q=80&w=800', 'Jury panel evaluating final code submissions', 2),
(4, 2, 'https://images.unsplash.com/photo-1485827404703-89b55fcc595e?auto=format&fit=crop&q=80&w=800', 'Titan robot spinning drum weapon test', 3),
(5, 3, 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&q=80&w=800', 'Live rock band performance at Tarang Fest', 4),
(6, 4, 'https://images.unsplash.com/photo-1526676037777-05a232554f77?auto=format&fit=crop&q=80&w=800', '400m Track and Field Relay Finals', 5);

-- 16. In-App Notifications
INSERT INTO `notifications` (`id`, `user_id`, `title`, `message`, `type`, `link`, `is_read`) VALUES
(1, 6, 'Registration Confirmed!', 'Your team "ByteBusters" is registered for CodeFest 2026. Registration ID: REG-2026-00101.', 'success', '/student/registrations', TRUE),
(2, 6, 'Payment Verified', 'Your payment of ₹250 for CodeFest 2026 has been successfully verified by Dr. Priya Sharma.', 'success', '/student/registrations', TRUE),
(3, 6, 'Reminder: CodeFest 2026 Starts Tomorrow', 'CodeFest 2026 starts tomorrow at 09:00 AM in the APJ Abdul Kalam Block. Don’t forget your College ID.', 'reminder', '/events/1', FALSE),
(4, 2, 'New Registration Submitted', 'Alex Johnson has registered team "ByteBusters" for CodeFest 2026 with payment proof.', 'info', '/faculty/registrations', FALSE),
(5, 1, 'Pending Event Approval', 'Dr. Ananya Sen submitted a new event: "Rhythms of India" for administrative approval.', 'warning', '/admin/events', FALSE);
