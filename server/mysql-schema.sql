-- ============================================================================
-- MaaSaathi — MySQL Database Schema
-- Architecture: Express (localhost:3000) -> MySQL (localhost:3306)
-- Engine: InnoDB | Character Set: utf8mb4
-- ============================================================================

CREATE DATABASE IF NOT EXISTS maasaathi_db
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE maasaathi_db;

-- 1. users
CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL DEFAULT 'Olivia Sharma',
  status VARCHAR(50) NOT NULL DEFAULT 'pregnant',
  edd DATE NULL,
  city VARCHAR(100) NULL DEFAULT 'Mumbai',
  doctor_name VARCHAR(255) NULL DEFAULT 'Dr. Meera Joshi, MD (OB/GYN)',
  hospital_name VARCHAR(255) NULL DEFAULT 'Apollo Cradle Maternity Hospital',
  emergency_contact_name VARCHAR(255) NULL DEFAULT 'Rajesh Sharma (Spouse)',
  emergency_contact_phone VARCHAR(50) NULL DEFAULT '+91 98765 43210',
  language VARCHAR(10) NOT NULL DEFAULT 'en',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. appointments
CREATE TABLE IF NOT EXISTS appointments (
  id VARCHAR(100) PRIMARY KEY,
  user_id INT NOT NULL,
  title VARCHAR(255) NOT NULL,
  appointment_date DATE NULL,
  appointment_time VARCHAR(50) NULL,
  doctor VARCHAR(255) NULL,
  clinic VARCHAR(255) NULL,
  type VARCHAR(100) NULL,
  notes TEXT NULL,
  done TINYINT(1) NOT NULL DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_appointments_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. symptom_logs
CREATE TABLE IF NOT EXISTS symptom_logs (
  id VARCHAR(100) PRIMARY KEY,
  user_id INT NOT NULL,
  symptom_date DATE NULL,
  tags_json TEXT NULL,
  notes TEXT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_symptoms_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 4. doctor_questions
CREATE TABLE IF NOT EXISTS doctor_questions (
  id VARCHAR(100) PRIMARY KEY,
  user_id INT NOT NULL,
  question TEXT NOT NULL,
  asked TINYINT(1) NOT NULL DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_questions_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 5. checklists
CREATE TABLE IF NOT EXISTS checklists (
  id VARCHAR(100) PRIMARY KEY,
  user_id INT NOT NULL,
  category VARCHAR(100) NOT NULL,
  label TEXT NOT NULL,
  done TINYINT(1) NOT NULL DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_checklists_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 6. kick_sessions
CREATE TABLE IF NOT EXISTS kick_sessions (
  id VARCHAR(100) PRIMARY KEY,
  user_id INT NOT NULL,
  session_date DATE NULL,
  kicks INT NOT NULL DEFAULT 0,
  duration_minutes INT NOT NULL DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_kicks_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 7. chat_messages
CREATE TABLE IF NOT EXISTS chat_messages (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  role VARCHAR(50) NOT NULL,
  message_text TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_chat_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 8. app_settings
CREATE TABLE IF NOT EXISTS app_settings (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL UNIQUE,
  language VARCHAR(10) NOT NULL DEFAULT 'en',
  water_glasses INT NOT NULL DEFAULT 0,
  water_date DATE NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_settings_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 9. clinical_records (Supports lab reports and clinical vitals)
CREATE TABLE IF NOT EXISTS clinical_records (
  id VARCHAR(100) PRIMARY KEY,
  user_id INT NOT NULL,
  type VARCHAR(255) NULL,
  record_date DATE NULL,
  week VARCHAR(50) NULL,
  result TEXT NULL,
  status VARCHAR(50) NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_clinical_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- Default Demo User (user_id = 1)
-- ============================================================================
INSERT INTO users (id, name, status, edd, city, doctor_name, hospital_name, emergency_contact_name, emergency_contact_phone, language)
VALUES (1, 'Olivia Sharma', 'pregnant', DATE_ADD(CURDATE(), INTERVAL 112 DAY), 'Mumbai', 'Dr. Meera Joshi, MD (OB/GYN)', 'Apollo Cradle Maternity Hospital', 'Rajesh Sharma (Spouse)', '+91 98765 43210', 'en')
ON DUPLICATE KEY UPDATE name=VALUES(name);

-- Default Settings for Demo User
INSERT INTO app_settings (user_id, language, water_glasses, water_date)
VALUES (1, 'en', 6, CURDATE())
ON DUPLICATE KEY UPDATE user_id=VALUES(user_id);

-- Sample Appointments for Demo User
INSERT IGNORE INTO appointments (id, user_id, title, appointment_date, appointment_time, doctor, clinic, type, notes, done) VALUES
('apt-1', 1, 'Routine 24-Week Anomaly Scan & Glucose Check', DATE_ADD(CURDATE(), INTERVAL 5 DAY), '10:30 AM', 'Dr. Meera Joshi', 'Apollo Cradle - Clinic #204', 'Prenatal Checkup', 'Review fetal anatomy scan, hemoglobin count, and discuss safe iron supplements.', 0),
('apt-0', 1, 'First Trimester NT Scan & Dual Marker', DATE_SUB(CURDATE(), INTERVAL 75 DAY), '11:00 AM', 'Dr. Meera Joshi', 'Apollo Cradle Maternity', 'Ultrasound Scan', 'Fetal nasal bone visualized. NT 1.2mm (Normal). Low risk on dual marker screening.', 1);

-- Sample Symptoms for Demo User
INSERT IGNORE INTO symptom_logs (id, user_id, symptom_date, tags_json, notes) VALUES
('sym-1', 1, CURDATE(), '["Back pain", "Fatigue", "Happy"]', 'Mild evening lower back ache after desk work.');

-- Sample Questions for Demo User
INSERT IGNORE INTO doctor_questions (id, user_id, question, asked) VALUES
('dq-1', 1, 'Is my baby weight gaining according to 50th percentile?', 0),
('dq-2', 1, 'Can I continue gentle prenatal yoga in trimester 2?', 1);

-- Sample Kick Session for Demo User
INSERT IGNORE INTO kick_sessions (id, user_id, session_date, kicks, duration_minutes) VALUES
('ks-1', 1, CURDATE(), 10, 18);

-- Sample Checklists for Demo User
INSERT IGNORE INTO checklists (id, user_id, category, label, done) VALUES
('hb1', 1, 'hospital', 'Aadhaar / ID Card & Maternity Insurance papers', 1),
('hb2', 1, 'hospital', 'Previous Ultrasounds & Doctor prescription file', 1),
('hb3', 1, 'hospital', 'Comfortable maternity robes & nursing bras (3x)', 1),
('hb4', 1, 'baby', 'Soft newborn cotton clothes (washed) & swaddles', 0),
('hb5', 1, 'baby', 'Newborn diapers & gentle wet wipes', 0),
('hb6', 1, 'postpartum', 'Postpartum pads & soothing nipple balm', 0);

-- Sample Clinical Records for Demo User
INSERT IGNORE INTO clinical_records (id, user_id, type, record_date, week, result, status) VALUES
('cr-1', 1, 'Ultrasound Report', '2025-01-15', '12th Week', 'Single active fetus, CRL 58mm, FHR 156 bpm', 'Normal'),
('cr-2', 1, 'Glucose Screening (OGTT)', '2025-02-10', '20th Week', 'Fasting: 82 mg/dL, 2-Hr: 118 mg/dL', 'Normal'),
('cr-3', 1, 'Urine Test (Protein/pH)', '2025-02-22', '23rd Week', 'pH 5.2, Protein: Nil, Sugar: Nil', 'Normal'),
('cr-4', 1, 'Blood Pressure Monitoring', '2025-02-25', '24th Week', '116 / 74 mmHg', 'Normal');
