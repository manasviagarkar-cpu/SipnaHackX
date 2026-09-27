/**
 * MaaSaathi — MySQL Persistence Layer
 *
 * Replaces JSON file storage with MySQL connection pool and parameterized queries.
 * Connects to local MySQL Server (localhost:3306) and maps default user 'user_default' to id 1.
 */

const mysql = require('mysql2/promise');

let pool = null;
let isDbConnected = false;

const DB_CONFIG = {
  host: process.env.DB_HOST || '127.0.0.1',
  port: parseInt(process.env.DB_PORT, 10) || 3306,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'maasaathi_db',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  dateStrings: true
};

/**
 * Resolves frontend userId (e.g. 'user_default') to database integer id (1)
 */
function resolveUserId(rawUserId) {
  if (!rawUserId || rawUserId === 'user_default') return 1;
  const parsed = parseInt(rawUserId, 10);
  return isNaN(parsed) ? 1 : parsed;
}

/**
 * Create tables if they do not exist
 */
async function createTables(dbPool) {
  await dbPool.query(`
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
  `);

  await dbPool.query(`
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
  `);

  await dbPool.query(`
    CREATE TABLE IF NOT EXISTS symptom_logs (
      id VARCHAR(100) PRIMARY KEY,
      user_id INT NOT NULL,
      symptom_date DATE NULL,
      tags_json TEXT NULL,
      notes TEXT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT fk_symptoms_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `);

  await dbPool.query(`
    CREATE TABLE IF NOT EXISTS doctor_questions (
      id VARCHAR(100) PRIMARY KEY,
      user_id INT NOT NULL,
      question TEXT NOT NULL,
      asked TINYINT(1) NOT NULL DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT fk_questions_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `);

  await dbPool.query(`
    CREATE TABLE IF NOT EXISTS checklists (
      id VARCHAR(100) PRIMARY KEY,
      user_id INT NOT NULL,
      category VARCHAR(100) NOT NULL,
      label TEXT NOT NULL,
      done TINYINT(1) NOT NULL DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT fk_checklists_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `);

  await dbPool.query(`
    CREATE TABLE IF NOT EXISTS kick_sessions (
      id VARCHAR(100) PRIMARY KEY,
      user_id INT NOT NULL,
      session_date DATE NULL,
      kicks INT NOT NULL DEFAULT 0,
      duration_minutes INT NOT NULL DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT fk_kicks_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `);

  await dbPool.query(`
    CREATE TABLE IF NOT EXISTS chat_messages (
      id INT AUTO_INCREMENT PRIMARY KEY,
      user_id INT NOT NULL,
      role VARCHAR(50) NOT NULL,
      message_text TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT fk_chat_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `);

  await dbPool.query(`
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
  `);

  await dbPool.query(`
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
  `);
}

/**
 * Seed demo user and default data if empty
 */
async function seedDemoData(dbPool) {
  // 1. Ensure User 1 exists
  const [users] = await dbPool.query('SELECT id FROM users WHERE id = 1');
  if (users.length === 0) {
    await dbPool.query(`
      INSERT INTO users (id, name, status, edd, city, doctor_name, hospital_name, emergency_contact_name, emergency_contact_phone, language)
      VALUES (1, 'Olivia Sharma', 'pregnant', DATE_ADD(CURDATE(), INTERVAL 112 DAY), 'Mumbai', 'Dr. Meera Joshi, MD (OB/GYN)', 'Apollo Cradle Maternity Hospital', 'Rajesh Sharma (Spouse)', '+91 98765 43210', 'en')
    `);
  }

  // 2. Settings for User 1
  const [sets] = await dbPool.query('SELECT COUNT(*) as c FROM app_settings WHERE user_id = 1');
  if (sets[0].c === 0) {
    await dbPool.query(`
      INSERT INTO app_settings (user_id, language, water_glasses, water_date)
      VALUES (1, 'en', 6, CURDATE())
    `);
  }

  // 3. Appointments
  const [appts] = await dbPool.query('SELECT COUNT(*) as c FROM appointments WHERE user_id = 1');
  if (appts[0].c === 0) {
    await dbPool.query(`
      INSERT INTO appointments (id, user_id, title, appointment_date, appointment_time, doctor, clinic, type, notes, done) VALUES
      ('apt-1', 1, 'Routine 24-Week Anomaly Scan & Glucose Check', DATE_ADD(CURDATE(), INTERVAL 5 DAY), '10:30 AM', 'Dr. Meera Joshi', 'Apollo Cradle - Clinic #204', 'Prenatal Checkup', 'Review fetal anatomy scan, hemoglobin count, and discuss safe iron supplements.', 0),
      ('apt-0', 1, 'First Trimester NT Scan & Dual Marker', DATE_SUB(CURDATE(), INTERVAL 75 DAY), '11:00 AM', 'Dr. Meera Joshi', 'Apollo Cradle Maternity', 'Ultrasound Scan', 'Fetal nasal bone visualized. NT 1.2mm (Normal). Low risk on dual marker screening.', 1)
    `);
  }

  // 4. Symptoms
  const [syms] = await dbPool.query('SELECT COUNT(*) as c FROM symptom_logs WHERE user_id = 1');
  if (syms[0].c === 0) {
    await dbPool.query(`
      INSERT INTO symptom_logs (id, user_id, symptom_date, tags_json, notes) VALUES
      ('sym-1', 1, CURDATE(), '["Back pain", "Fatigue", "Happy"]', 'Mild evening lower back ache after desk work.')
    `);
  }

  // 5. Questions for Doctor
  const [dqs] = await dbPool.query('SELECT COUNT(*) as c FROM doctor_questions WHERE user_id = 1');
  if (dqs[0].c === 0) {
    await dbPool.query(`
      INSERT INTO doctor_questions (id, user_id, question, asked) VALUES
      ('dq-1', 1, 'Is my baby weight gaining according to 50th percentile?', 0),
      ('dq-2', 1, 'Can I continue gentle prenatal yoga in trimester 2?', 1)
    `);
  }

  // 6. Checklists
  const [chks] = await dbPool.query('SELECT COUNT(*) as c FROM checklists WHERE user_id = 1');
  if (chks[0].c === 0) {
    await dbPool.query(`
      INSERT INTO checklists (id, user_id, category, label, done) VALUES
      ('hb1', 1, 'hospital', 'Aadhaar / ID Card & Maternity Insurance papers', 1),
      ('hb2', 1, 'hospital', 'Previous Ultrasounds & Doctor prescription file', 1),
      ('hb3', 1, 'hospital', 'Comfortable maternity robes & nursing bras (3x)', 1),
      ('hb4', 1, 'baby', 'Soft newborn cotton clothes (washed) & swaddles', 0),
      ('hb5', 1, 'baby', 'Newborn diapers & gentle wet wipes', 0),
      ('hb6', 1, 'postpartum', 'Postpartum pads & soothing nipple balm', 0)
    `);
  }

  // 7. Kick Sessions
  const [kicks] = await dbPool.query('SELECT COUNT(*) as c FROM kick_sessions WHERE user_id = 1');
  if (kicks[0].c === 0) {
    await dbPool.query(`
      INSERT INTO kick_sessions (id, user_id, session_date, kicks, duration_minutes) VALUES
      ('ks-1', 1, CURDATE(), 10, 18)
    `);
  }

  // 8. Clinical Records
  const [crs] = await dbPool.query('SELECT COUNT(*) as c FROM clinical_records WHERE user_id = 1');
  if (crs[0].c === 0) {
    await dbPool.query(`
      INSERT INTO clinical_records (id, user_id, type, record_date, week, result, status) VALUES
      ('cr-1', 1, 'Ultrasound Report', '2025-01-15', '12th Week', 'Single active fetus, CRL 58mm, FHR 156 bpm', 'Normal'),
      ('cr-2', 1, 'Glucose Screening (OGTT)', '2025-02-10', '20th Week', 'Fasting: 82 mg/dL, 2-Hr: 118 mg/dL', 'Normal'),
      ('cr-3', 1, 'Urine Test (Protein/pH)', '2025-02-22', '23rd Week', 'pH 5.2, Protein: Nil, Sugar: Nil', 'Normal'),
      ('cr-4', 1, 'Blood Pressure Monitoring', '2025-02-25', '24th Week', '116 / 74 mmHg', 'Normal')
    `);
  }
}

/**
 * Initialize MySQL Connection & Database
 */
async function initializeDatabase() {
  const host = DB_CONFIG.host;
  const port = DB_CONFIG.port;
  const user = DB_CONFIG.user;
  const password = DB_CONFIG.password;
  const database = DB_CONFIG.database;

  try {
    // 1. Try to ensure database exists on server
    try {
      const initConn = await mysql.createConnection({ host, port, user, password });
      await initConn.query(`CREATE DATABASE IF NOT EXISTS \`${database}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`);
      await initConn.end();
    } catch (e) {
      // Ignore if user lacks CREATE DATABASE privilege and database is already created via Workbench
    }

    // 2. Create the reusable promise connection pool
    pool = mysql.createPool(DB_CONFIG);

    // Verify connectivity
    const testConn = await pool.getConnection();
    testConn.release();

    // 3. Create tables if not exist
    await createTables(pool);

    // 4. Seed demo user and default data if tables are empty
    await seedDemoData(pool);

    isDbConnected = true;
    console.log('MaaSaathi MySQL database connected');
    return true;
  } catch (err) {
    isDbConnected = false;
    console.error('MaaSaathi MySQL connection failed');
    return false;
  }
}

const db = {
  init: initializeDatabase,
  initializeDatabase,

  isConnected() {
    return isDbConnected && pool !== null;
  },

  getPool() {
    return pool;
  },

  /**
   * System & Database Status
   */
  async getStats() {
    if (!isDbConnected || !pool) {
      throw new Error('MySQL connection unavailable');
    }

    const [userCount] = await pool.query('SELECT COUNT(*) as c FROM users');
    const [aptCount] = await pool.query('SELECT COUNT(*) as c FROM appointments WHERE user_id = 1');
    const [symCount] = await pool.query('SELECT COUNT(*) as c FROM symptom_logs WHERE user_id = 1');
    const [kickCount] = await pool.query('SELECT COUNT(*) as c FROM kick_sessions WHERE user_id = 1');
    const [dqCount] = await pool.query('SELECT COUNT(*) as c FROM doctor_questions WHERE user_id = 1');
    const [chkCount] = await pool.query('SELECT COUNT(*) as c FROM checklists WHERE user_id = 1');
    const [chatCount] = await pool.query('SELECT COUNT(*) as c FROM chat_messages WHERE user_id = 1');
    const [crCount] = await pool.query('SELECT COUNT(*) as c FROM clinical_records WHERE user_id = 1');

    return {
      status: 'connected',
      engine: 'MySQL',
      database: DB_CONFIG.database,
      host: DB_CONFIG.host,
      port: DB_CONFIG.port,
      counts: {
        users: userCount[0]?.c || 0,
        appointments: aptCount[0]?.c || 0,
        clinicalRecords: crCount[0]?.c || 0,
        symptomLogs: symCount[0]?.c || 0,
        kickSessions: kickCount[0]?.c || 0,
        doctorQuestions: dqCount[0]?.c || 0,
        checklists: chkCount[0]?.c || 0,
        chatMessages: chatCount[0]?.c || 0
      }
    };
  },

  /**
   * Retrieve all data for a specific user
   */
  async getAllUserData(rawUserId = 'user_default') {
    if (!isDbConnected || !pool) {
      throw new Error('MySQL connection unavailable');
    }
    const userId = resolveUserId(rawUserId);

    // Profile
    const [users] = await pool.query('SELECT * FROM users WHERE id = ?', [userId]);
    const u = users[0] || {};
    const profile = {
      name: u.name || 'Olivia Sharma',
      status: u.status || 'pregnant',
      edd: u.edd || null,
      city: u.city || 'Mumbai',
      doctorName: u.doctor_name || '',
      hospitalName: u.hospital_name || '',
      ec_name: u.emergency_contact_name || '',
      ec_phone: u.emergency_contact_phone || '',
      emergency_contact_name: u.emergency_contact_name || '',
      emergency_contact_phone: u.emergency_contact_phone || '',
      language: u.language || 'en'
    };

    // Settings
    const [settingsRows] = await pool.query('SELECT * FROM app_settings WHERE user_id = ?', [userId]);
    const s = settingsRows[0] || {};
    const settings = {
      language: s.language || u.language || 'en'
    };
    const waterGlasses = typeof s.water_glasses === 'number' ? s.water_glasses : 6;
    const waterDate = s.water_date || new Date().toISOString().split('T')[0];

    // Appointments
    const [apts] = await pool.query(
      'SELECT * FROM appointments WHERE user_id = ? ORDER BY appointment_date ASC, created_at DESC',
      [userId]
    );
    const appointments = apts.map(a => ({
      id: a.id,
      title: a.title,
      date: a.appointment_date,
      appointment_date: a.appointment_date,
      time: a.appointment_time,
      appointment_time: a.appointment_time,
      doctor: a.doctor,
      clinic: a.clinic,
      type: a.type,
      notes: a.notes,
      done: Boolean(a.done)
    }));

    // Clinical Records
    const [crs] = await pool.query(
      'SELECT * FROM clinical_records WHERE user_id = ? ORDER BY record_date DESC, created_at DESC',
      [userId]
    );
    const clinicalRecords = crs.map(c => ({
      id: c.id,
      type: c.type,
      date: c.record_date,
      week: c.week,
      result: c.result,
      status: c.status
    }));

    // Symptom Logs
    const [syms] = await pool.query(
      'SELECT * FROM symptom_logs WHERE user_id = ? ORDER BY symptom_date DESC, created_at DESC',
      [userId]
    );
    const symptomLogs = syms.map(sym => {
      let tags = [];
      try {
        tags = JSON.parse(sym.tags_json || '[]');
      } catch (e) {
        tags = sym.tags_json ? [sym.tags_json] : [];
      }
      return {
        id: sym.id,
        date: sym.symptom_date,
        tags,
        notes: sym.notes || ''
      };
    });

    // Kick Sessions
    const [kicks] = await pool.query(
      'SELECT * FROM kick_sessions WHERE user_id = ? ORDER BY session_date DESC, created_at DESC',
      [userId]
    );
    const kickSessions = kicks.map(k => ({
      id: k.id,
      date: k.session_date,
      kicks: k.kicks,
      durationMinutes: k.duration_minutes
    }));

    // Doctor Questions
    const [dqs] = await pool.query(
      'SELECT * FROM doctor_questions WHERE user_id = ? ORDER BY created_at DESC',
      [userId]
    );
    const doctorQuestions = dqs.map(q => ({
      id: q.id,
      question: q.question,
      asked: Boolean(q.asked)
    }));

    // Checklists
    const [chks] = await pool.query(
      'SELECT * FROM checklists WHERE user_id = ? ORDER BY created_at ASC',
      [userId]
    );
    const checklists = chks.map(c => ({
      id: c.id,
      category: c.category,
      cat: c.category,
      label: c.label,
      done: Boolean(c.done)
    }));

    // Chat Messages
    const [msgs] = await pool.query(
      'SELECT * FROM chat_messages WHERE user_id = ? ORDER BY created_at ASC LIMIT 100',
      [userId]
    );
    const chatMessages = msgs.map(m => ({
      id: m.id,
      role: m.role,
      content: m.message_text,
      message_text: m.message_text,
      created_at: m.created_at
    }));

    return {
      profile,
      appointments,
      clinicalRecords,
      symptomLogs,
      kickSessions,
      waterGlasses,
      waterDate,
      doctorQuestions,
      checklists,
      chatMessages,
      settings
    };
  },

  /**
   * Sync complete user data state from frontend
   */
  async syncUserData(rawUserId = 'user_default', payload = {}) {
    if (!isDbConnected || !pool) {
      throw new Error('MySQL connection unavailable');
    }
    const userId = resolveUserId(rawUserId);

    // 1. Profile
    if (payload.profile) {
      await this.updateProfile(userId, payload.profile);
    }

    // 2. Settings (water, language)
    const lang = payload.settings?.language || payload.profile?.language || 'en';
    const waterGlasses = typeof payload.waterGlasses === 'number' ? payload.waterGlasses : null;
    const waterDate = payload.waterDate || null;

    await pool.query(
      `INSERT INTO app_settings (user_id, language, water_glasses, water_date)
       VALUES (?, ?, COALESCE(?, 0), COALESCE(?, CURDATE()))
       ON DUPLICATE KEY UPDATE
         language = VALUES(language),
         water_glasses = COALESCE(?, water_glasses),
         water_date = COALESCE(?, water_date)`,
      [userId, lang, waterGlasses, waterDate, waterGlasses, waterDate]
    );

    // 3. Appointments
    if (Array.isArray(payload.appointments)) {
      for (const a of payload.appointments) {
        await this.addAppointment(userId, a);
      }
    }

    // 4. Clinical records
    if (Array.isArray(payload.clinicalRecords)) {
      for (const cr of payload.clinicalRecords) {
        await this.addClinicalRecord(userId, cr);
      }
    }

    // 5. Symptom logs
    if (Array.isArray(payload.symptomLogs)) {
      for (const s of payload.symptomLogs) {
        const id = s.id || ('sym_' + (s.date || Date.now()));
        const dateVal = s.symptom_date || s.date || null;
        const tagsJson = JSON.stringify(s.tags || []);
        await pool.query(
          `INSERT INTO symptom_logs (id, user_id, symptom_date, tags_json, notes)
           VALUES (?, ?, ?, ?, ?)
           ON DUPLICATE KEY UPDATE
             symptom_date = VALUES(symptom_date),
             tags_json = VALUES(tags_json),
             notes = VALUES(notes)`,
          [id, userId, dateVal, tagsJson, s.notes || '']
        );
      }
    }

    // 6. Doctor questions
    if (Array.isArray(payload.doctorQuestions)) {
      for (const q of payload.doctorQuestions) {
        const id = q.id || ('dq_' + Date.now());
        await pool.query(
          `INSERT INTO doctor_questions (id, user_id, question, asked)
           VALUES (?, ?, ?, ?)
           ON DUPLICATE KEY UPDATE
             question = VALUES(question),
             asked = VALUES(asked)`,
          [id, userId, q.question || '', q.asked ? 1 : 0]
        );
      }
    }

    // 7. Checklists
    if (Array.isArray(payload.checklists)) {
      for (const chk of payload.checklists) {
        const id = chk.id || ('chk_' + Date.now());
        const cat = chk.category || chk.cat || 'hospital';
        await pool.query(
          `INSERT INTO checklists (id, user_id, category, label, done)
           VALUES (?, ?, ?, ?, ?)
           ON DUPLICATE KEY UPDATE
             category = VALUES(category),
             label = VALUES(label),
             done = VALUES(done)`,
          [id, userId, cat, chk.label || '', chk.done ? 1 : 0]
        );
      }
    }

    // 8. Kick sessions
    if (Array.isArray(payload.kickSessions)) {
      for (const k of payload.kickSessions) {
        const id = k.id || ('ks_' + (k.date || Date.now()));
        const dateVal = k.session_date || k.date || null;
        const kicks = typeof k.kicks === 'number' ? k.kicks : 0;
        const duration = typeof k.durationMinutes === 'number' ? k.durationMinutes : (typeof k.duration_minutes === 'number' ? k.duration_minutes : 0);
        await pool.query(
          `INSERT INTO kick_sessions (id, user_id, session_date, kicks, duration_minutes)
           VALUES (?, ?, ?, ?, ?)
           ON DUPLICATE KEY UPDATE
             session_date = VALUES(session_date),
             kicks = VALUES(kicks),
             duration_minutes = VALUES(duration_minutes)`,
          [id, userId, dateVal, kicks, duration]
        );
      }
    }

    return await this.getAllUserData(userId);
  },

  /**
   * Update Profile
   */
  async updateProfile(rawUserId = 'user_default', p = {}) {
    if (!isDbConnected || !pool) {
      throw new Error('MySQL connection unavailable');
    }
    const userId = resolveUserId(rawUserId);

    await pool.query(
      `INSERT INTO users (id, name, status, edd, city, doctor_name, hospital_name, emergency_contact_name, emergency_contact_phone, language)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE
         name = COALESCE(VALUES(name), name),
         status = COALESCE(VALUES(status), status),
         edd = COALESCE(VALUES(edd), edd),
         city = COALESCE(VALUES(city), city),
         doctor_name = COALESCE(VALUES(doctor_name), doctor_name),
         hospital_name = COALESCE(VALUES(hospital_name), hospital_name),
         emergency_contact_name = COALESCE(VALUES(emergency_contact_name), emergency_contact_name),
         emergency_contact_phone = COALESCE(VALUES(emergency_contact_phone), emergency_contact_phone),
         language = COALESCE(VALUES(language), language)`,
      [
        userId,
        p.name || 'Olivia Sharma',
        p.status || 'pregnant',
        p.edd || null,
        p.city || null,
        p.doctor_name || p.doctorName || null,
        p.hospital_name || p.hospitalName || null,
        p.emergency_contact_name || p.ec_name || null,
        p.emergency_contact_phone || p.ec_phone || null,
        p.language || 'en'
      ]
    );

    return p;
  },

  /**
   * Appointments CRUD
   */
  async getAppointments(rawUserId = 'user_default') {
    if (!isDbConnected || !pool) throw new Error('MySQL connection unavailable');
    const userId = resolveUserId(rawUserId);
    const [rows] = await pool.query(
      'SELECT * FROM appointments WHERE user_id = ? ORDER BY appointment_date ASC, created_at DESC',
      [userId]
    );
    return rows.map(a => ({
      id: a.id,
      title: a.title,
      date: a.appointment_date,
      appointment_date: a.appointment_date,
      time: a.appointment_time,
      appointment_time: a.appointment_time,
      doctor: a.doctor,
      clinic: a.clinic,
      type: a.type,
      notes: a.notes,
      done: Boolean(a.done)
    }));
  },

  async addAppointment(rawUserId = 'user_default', a = {}) {
    if (!isDbConnected || !pool) throw new Error('MySQL connection unavailable');
    const userId = resolveUserId(rawUserId);
    const id = a.id || 'apt_' + Date.now();
    const dateVal = a.appointment_date || a.date || null;
    const timeVal = a.appointment_time || a.time || null;
    const doneVal = a.done ? 1 : 0;

    await pool.query(
      `INSERT INTO appointments (id, user_id, title, appointment_date, appointment_time, doctor, clinic, type, notes, done)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE
         title = VALUES(title),
         appointment_date = VALUES(appointment_date),
         appointment_time = VALUES(appointment_time),
         doctor = VALUES(doctor),
         clinic = VALUES(clinic),
         type = VALUES(type),
         notes = VALUES(notes),
         done = VALUES(done)`,
      [
        id,
        userId,
        a.title || 'Prenatal Checkup',
        dateVal,
        timeVal,
        a.doctor || null,
        a.clinic || null,
        a.type || 'Checkup',
        a.notes || null,
        doneVal
      ]
    );

    return { ...a, id, done: Boolean(doneVal) };
  },

  async updateAppointment(rawUserId = 'user_default', id, updates = {}) {
    if (!isDbConnected || !pool) throw new Error('MySQL connection unavailable');
    const userId = resolveUserId(rawUserId);
    const [existing] = await pool.query('SELECT * FROM appointments WHERE id = ? AND user_id = ?', [id, userId]);
    if (!existing.length) throw new Error('Appointment not found');

    const curr = existing[0];
    const title = updates.title !== undefined ? updates.title : curr.title;
    const dateVal = updates.appointment_date !== undefined ? updates.appointment_date : (updates.date !== undefined ? updates.date : curr.appointment_date);
    const timeVal = updates.appointment_time !== undefined ? updates.appointment_time : (updates.time !== undefined ? updates.time : curr.appointment_time);
    const doctor = updates.doctor !== undefined ? updates.doctor : curr.doctor;
    const clinic = updates.clinic !== undefined ? updates.clinic : curr.clinic;
    const type = updates.type !== undefined ? updates.type : curr.type;
    const notes = updates.notes !== undefined ? updates.notes : curr.notes;
    const done = updates.done !== undefined ? (updates.done ? 1 : 0) : curr.done;

    await pool.query(
      `UPDATE appointments
       SET title = ?, appointment_date = ?, appointment_time = ?, doctor = ?, clinic = ?, type = ?, notes = ?, done = ?
       WHERE id = ? AND user_id = ?`,
      [title, dateVal, timeVal, doctor, clinic, type, notes, done, id, userId]
    );

    return {
      id,
      title,
      date: dateVal,
      appointment_date: dateVal,
      time: timeVal,
      appointment_time: timeVal,
      doctor,
      clinic,
      type,
      notes,
      done: Boolean(done)
    };
  },

  async deleteAppointment(rawUserId = 'user_default', id) {
    if (!isDbConnected || !pool) throw new Error('MySQL connection unavailable');
    const userId = resolveUserId(rawUserId);
    await pool.query('DELETE FROM appointments WHERE id = ? AND user_id = ?', [id, userId]);
    return { success: true, deletedId: id };
  },

  /**
   * Clinical Records
   */
  async getClinicalRecords(rawUserId = 'user_default') {
    if (!isDbConnected || !pool) throw new Error('MySQL connection unavailable');
    const userId = resolveUserId(rawUserId);
    const [rows] = await pool.query(
      'SELECT * FROM clinical_records WHERE user_id = ? ORDER BY record_date DESC, created_at DESC',
      [userId]
    );
    return rows.map(c => ({
      id: c.id,
      type: c.type,
      date: c.record_date,
      week: c.week,
      result: c.result,
      status: c.status
    }));
  },

  async addClinicalRecord(rawUserId = 'user_default', record = {}) {
    if (!isDbConnected || !pool) throw new Error('MySQL connection unavailable');
    const userId = resolveUserId(rawUserId);
    const id = record.id || 'cr_' + Date.now();
    await pool.query(
      `INSERT INTO clinical_records (id, user_id, type, record_date, week, result, status)
       VALUES (?, ?, ?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE
         type = VALUES(type),
         record_date = VALUES(record_date),
         week = VALUES(week),
         result = VALUES(result),
         status = VALUES(status)`,
      [
        id,
        userId,
        record.type || 'Lab Report',
        record.date || record.record_date || null,
        record.week || null,
        record.result || null,
        record.status || 'Normal'
      ]
    );
    return { ...record, id };
  },

  async deleteClinicalRecord(rawUserId = 'user_default', id) {
    if (!isDbConnected || !pool) throw new Error('MySQL connection unavailable');
    const userId = resolveUserId(rawUserId);
    await pool.query('DELETE FROM clinical_records WHERE id = ? AND user_id = ?', [id, userId]);
    return { success: true, deletedId: id };
  },

  /**
   * Symptom Logging
   */
  async addSymptomLog(rawUserId = 'user_default', log = {}) {
    if (!isDbConnected || !pool) throw new Error('MySQL connection unavailable');
    const userId = resolveUserId(rawUserId);
    const id = log.id || 'sym_' + Date.now();
    const dateVal = log.symptom_date || log.date || new Date().toISOString().split('T')[0];
    const tagsJson = JSON.stringify(log.tags || []);
    await pool.query(
      `INSERT INTO symptom_logs (id, user_id, symptom_date, tags_json, notes)
       VALUES (?, ?, ?, ?, ?)`,
      [id, userId, dateVal, tagsJson, log.notes || '']
    );
    return { ...log, id, date: dateVal };
  },

  /**
   * Kick Sessions
   */
  async addKickSession(rawUserId = 'user_default', session = {}) {
    if (!isDbConnected || !pool) throw new Error('MySQL connection unavailable');
    const userId = resolveUserId(rawUserId);
    const id = session.id || 'ks_' + Date.now();
    const dateVal = session.session_date || session.date || new Date().toISOString().split('T')[0];
    const kicks = typeof session.kicks === 'number' ? session.kicks : 10;
    const duration = typeof session.durationMinutes === 'number' ? session.durationMinutes : (typeof session.duration_minutes === 'number' ? session.duration_minutes : 20);

    await pool.query(
      `INSERT INTO kick_sessions (id, user_id, session_date, kicks, duration_minutes)
       VALUES (?, ?, ?, ?, ?)`,
      [id, userId, dateVal, kicks, duration]
    );
    return { ...session, id, date: dateVal, durationMinutes: duration };
  },

  /**
   * Chat History Logging
   */
  async addChatMessage(rawUserId = 'user_default', msg = {}) {
    if (!isDbConnected || !pool) return msg;
    try {
      const userId = resolveUserId(rawUserId);
      const role = msg.role || 'user';
      const text = msg.message_text || msg.text || msg.content || '';
      await pool.query(
        `INSERT INTO chat_messages (user_id, role, message_text) VALUES (?, ?, ?)`,
        [userId, role, text]
      );
    } catch (e) {
      console.error('Failed to log chat message to MySQL:', e.message);
    }
    return msg;
  },

  /**
   * Full Database Export / Backup
   */
  async exportData(rawUserId = 'user_default') {
    const data = await this.getAllUserData(rawUserId);
    return {
      app: 'MaaSaathi',
      exported_at: new Date().toISOString(),
      user_id: rawUserId,
      database_engine: 'MySQL',
      database_name: DB_CONFIG.database,
      data
    };
  },

  /**
   * Full Database Import / Restore
   */
  async importData(rawUserId = 'user_default', importedData) {
    if (!importedData || !importedData.data) {
      throw new Error('Invalid backup file format');
    }
    return await this.syncUserData(rawUserId, importedData.data);
  },

  /**
   * Caregiver Relay / One-Page Care Summary retrieval from MySQL
   */
  async getCareSummaryData(rawUserId = 'user_default', lang = 'en') {
    const isHi = lang === 'hi';
    const userData = await this.getAllUserData(rawUserId);
    const p = userData.profile || {};
    const appointments = (userData.appointments || []).filter(a => !a.done);
    const symptoms = (userData.symptomLogs || []).slice(0, 5);
    const questions = userData.doctorQuestions || [];

    return {
      userName: p.name || (isHi ? 'डेमो यूजर' : 'Demo User'),
      pregnancyStatus: p.status || 'pregnant',
      edd: p.edd || null,
      city: p.city || null,
      doctorName: p.doctorName || null,
      hospitalName: p.hospitalName || null,
      emergencyContact: {
        name: p.ec_name || null,
        phone: p.ec_phone || null
      },
      recentSymptoms: symptoms,
      upcomingAppointments: appointments,
      doctorQuestions: questions,
      language: isHi ? 'Hindi (हिंदी)' : 'English',
      selectedLanguage: isHi ? 'Hindi (हिंदी)' : 'English',
      generatedAt: new Date().toISOString(),
      disclaimer: isHi
        ? 'यह सारांश जागरूकता और योग्य स्वास्थ्यकर्मी से चर्चा के लिए है। यह निदान, दवा की सलाह या आपातकालीन उपचार नहीं है। किसी संभावित खतरे के संकेत पर तुरंत योग्य स्वास्थ्यकर्मी या स्थानीय आपातकालीन सेवा से संपर्क करें।'
        : 'This summary is for awareness and discussion with a qualified healthcare professional. It is not a diagnosis, prescription or emergency treatment. If there is a possible warning sign, contact a qualified healthcare professional or local emergency service immediately.',
      demoDisclaimer: isHi
        ? 'डेमो मोड: यहां दिखाए गए नाम, अपॉइंटमेंट, अस्पताल और स्वास्थ्य रिकॉर्ड केवल प्रस्तुति के लिए नमूना डेटा हैं।'
        : 'Demo mode: Names, appointments, hospitals and health records shown here are sample data for presentation only.'
    };
  }
};

module.exports = db;
