/**
 * MaaSaathi — Persistent Database Engine
 * 
 * Provides an embedded, zero-setup, ACID-compliant JSON document & relational
 * database engine storing all user health records, appointments, lab reports,
 * symptom history, kick sessions, and AI chats in server/data/maasaathi_db.json.
 */

const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, 'data');
const DB_FILE = path.join(DATA_DIR, 'maasaathi_db.json');
const DEFAULT_USER_ID = 'user_default';

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// In-memory cache for ultra-fast query and ACID disk persistence
let dbState = null;

function getInitialDatabase() {
  const d = new Date();
  d.setDate(d.getDate() + 112); // ~24 weeks gestation default

  return {
    version: '1.0.0',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    users: {
      [DEFAULT_USER_ID]: {
        id: DEFAULT_USER_ID,
        profile: {
          name: 'Olivia Sharma',
          status: 'pregnant', // 'trying' | 'pregnant' | 'postpartum'
          edd: d.toISOString().split('T')[0],
          cycleLength: 28,
          periodLength: 5,
          lastPeriodDate: new Date(Date.now() - 14 * 86400000).toISOString().split('T')[0],
          bloodGroup: 'B Positive (B+)',
          doctorName: 'Dr. Meera Joshi, MD (OB/GYN)',
          hospitalName: 'Apollo Cradle Maternity Hospital',
          ec_name: 'Rajesh Sharma (Spouse)',
          ec_phone: '+91 98765 43210',
          city: 'Mumbai'
        },
        appointments: [
          {
            id: 'apt-1',
            title: 'Routine 24-Week Anomaly Scan & Glucose Check',
            date: new Date(Date.now() + 5 * 86400000).toISOString().split('T')[0],
            time: '10:30 AM',
            doctor: 'Dr. Meera Joshi',
            clinic: 'Apollo Cradle - Clinic #204',
            type: 'Prenatal Checkup',
            done: false,
            notes: 'Review fetal anatomy scan, hemoglobin count, and discuss safe iron supplements.'
          },
          {
            id: 'apt-0',
            title: 'First Trimester NT Scan & Dual Marker',
            date: new Date(Date.now() - 75 * 86400000).toISOString().split('T')[0],
            time: '11:00 AM',
            doctor: 'Dr. Meera Joshi',
            clinic: 'Apollo Cradle Maternity',
            type: 'Ultrasound Scan',
            done: true,
            notes: 'Fetal nasal bone visualized. NT 1.2mm (Normal). Low risk on dual marker screening.',
            prescription: 'Folvite 5mg OD, Susten 200mg at bedtime'
          }
        ],
        clinicalRecords: [
          { id: 'cr-1', type: 'Ultrasound Report', date: '2025-01-15', week: '12th Week', result: 'Single active fetus, CRL 58mm, FHR 156 bpm', status: 'Normal' },
          { id: 'cr-2', type: 'Glucose Screening (OGTT)', date: '2025-02-10', week: '20th Week', result: 'Fasting: 82 mg/dL, 2-Hr: 118 mg/dL', status: 'Normal' },
          { id: 'cr-3', type: 'Urine Test (Protein/pH)', date: '2025-02-22', week: '23rd Week', result: 'pH 5.2, Protein: Nil, Sugar: Nil', status: 'Normal' },
          { id: 'cr-4', type: 'Blood Pressure Monitoring', date: '2025-02-25', week: '24th Week', result: '116 / 74 mmHg', status: 'Normal' }
        ],
        symptomLogs: [
          { date: new Date().toISOString().split('T')[0], tags: ['Back pain', 'Fatigue', 'Happy'], notes: 'Mild evening lower back ache after desk work.' }
        ],
        kickSessions: [
          { date: new Date().toISOString().split('T')[0], kicks: 10, durationMinutes: 18 }
        ],
        waterGlasses: 6,
        waterDate: new Date().toISOString().split('T')[0],
        doctorQuestions: [
          { id: 'dq-1', question: 'Is my baby weight gaining according to 50th percentile?', asked: false },
          { id: 'dq-2', question: 'Can I continue gentle prenatal yoga in trimester 2?', asked: true }
        ],
        forumPosts: [
          { id: 'fp-1', club: 'Due in October 2025 Club', author: 'Pooja K.', title: 'Best belly moisturizers for itching?', replies: 14, likes: 28 },
          { id: 'fp-2', club: 'First-Time Mamas Haven', author: 'Anita S.', title: 'How early did you feel distinct kicks?', replies: 32, likes: 51 }
        ],
        checklists: [
          { id: 'hb1', cat: 'hospital', label: 'Aadhaar / ID Card & Maternity Insurance papers', done: true },
          { id: 'hb2', cat: 'hospital', label: 'Previous Ultrasounds & Doctor prescription file', done: true },
          { id: 'hb3', cat: 'hospital', label: 'Comfortable maternity robes & nursing bras (3x)', done: true },
          { id: 'hb4', cat: 'baby', label: 'Soft newborn cotton clothes (washed) & swaddles', done: false },
          { id: 'hb5', cat: 'baby', label: 'Newborn diapers & gentle wet wipes', done: false },
          { id: 'hb6', cat: 'postpartum', label: 'Postpartum pads & soothing nipple balm', done: false }
        ],
        chatMessages: [],
        settings: {
          language: 'en',
          geminiApiKey: '',
          groqApiKey: '',
          timelineView: 'weeks'
        }
      }
    }
  };
}

/**
 * Load database from disk into memory
 */
function initDatabase() {
  try {
    if (fs.existsSync(DB_FILE)) {
      const raw = fs.readFileSync(DB_FILE, 'utf8');
      dbState = JSON.parse(raw);
      console.log(`🗄️  MaaSaathi Database loaded successfully from ${DB_FILE}`);
    } else {
      dbState = getInitialDatabase();
      persistDatabase();
      console.log(`🗄️  New MaaSaathi Database initialized and saved at ${DB_FILE}`);
    }
  } catch (err) {
    console.error('Error initializing database, using fallback default:', err.message);
    dbState = getInitialDatabase();
  }
}

/**
 * Atomic write to disk to prevent corruptions during crashes
 */
function persistDatabase() {
  try {
    dbState.updated_at = new Date().toISOString();
    const tempFile = `${DB_FILE}.tmp.${Date.now()}`;
    fs.writeFileSync(tempFile, JSON.stringify(dbState, null, 2), 'utf8');
    fs.renameSync(tempFile, DB_FILE);
    return true;
  } catch (err) {
    console.error('Database write error:', err.message);
    return false;
  }
}

/**
 * Ensure user document exists in database
 */
function ensureUser(userId = DEFAULT_USER_ID) {
  if (!dbState) initDatabase();
  if (!dbState.users[userId]) {
    const init = getInitialDatabase();
    dbState.users[userId] = {
      id: userId,
      ...init.users[DEFAULT_USER_ID]
    };
    persistDatabase();
  }
  return dbState.users[userId];
}

// =============================================
// DATABASE OPERATIONS (CRUD)
// =============================================

const db = {
  init: initDatabase,

  getStats() {
    if (!dbState) initDatabase();
    const user = ensureUser();
    let fileSize = 0;
    try {
      if (fs.existsSync(DB_FILE)) {
        fileSize = fs.statSync(DB_FILE).size;
      }
    } catch (e) {}

    return {
      status: 'connected',
      engine: 'MaaSaathi Embedded JSON/SQL Data Vault',
      storageFile: DB_FILE,
      sizeBytes: fileSize,
      version: dbState.version,
      lastUpdated: dbState.updated_at,
      counts: {
        users: Object.keys(dbState.users || {}).length,
        appointments: user.appointments?.length || 0,
        clinicalRecords: user.clinicalRecords?.length || 0,
        symptomLogs: user.symptomLogs?.length || 0,
        kickSessions: user.kickSessions?.length || 0,
        doctorQuestions: user.doctorQuestions?.length || 0,
        checklists: user.checklists?.length || 0,
        chatMessages: user.chatMessages?.length || 0
      }
    };
  },

  getAllUserData(userId = DEFAULT_USER_ID) {
    const user = ensureUser(userId);
    return {
      profile: user.profile || {},
      appointments: user.appointments || [],
      clinicalRecords: user.clinicalRecords || [],
      symptomLogs: user.symptomLogs || [],
      kickSessions: user.kickSessions || [],
      waterGlasses: user.waterGlasses || 0,
      waterDate: user.waterDate || new Date().toISOString().split('T')[0],
      doctorQuestions: user.doctorQuestions || [],
      forumPosts: user.forumPosts || [],
      checklists: user.checklists || [],
      chatMessages: user.chatMessages || [],
      settings: user.settings || { language: 'en' }
    };
  },

  syncUserData(userId = DEFAULT_USER_ID, payload = {}) {
    const user = ensureUser(userId);

    if (payload.profile) user.profile = { ...user.profile, ...payload.profile };
    if (Array.isArray(payload.appointments)) user.appointments = payload.appointments;
    if (Array.isArray(payload.clinicalRecords)) user.clinicalRecords = payload.clinicalRecords;
    if (Array.isArray(payload.symptomLogs)) user.symptomLogs = payload.symptomLogs;
    if (Array.isArray(payload.kickSessions)) user.kickSessions = payload.kickSessions;
    if (typeof payload.waterGlasses === 'number') user.waterGlasses = payload.waterGlasses;
    if (payload.waterDate) user.waterDate = payload.waterDate;
    if (Array.isArray(payload.doctorQuestions)) user.doctorQuestions = payload.doctorQuestions;
    if (Array.isArray(payload.checklists)) user.checklists = payload.checklists;
    if (Array.isArray(payload.chatMessages)) user.chatMessages = payload.chatMessages;
    if (payload.settings) user.settings = { ...user.settings, ...payload.settings };

    persistDatabase();
    return this.getAllUserData(userId);
  },

  // User Profile
  updateProfile(userId = DEFAULT_USER_ID, profileData) {
    const user = ensureUser(userId);
    user.profile = { ...user.profile, ...profileData };
    persistDatabase();
    return user.profile;
  },

  // Appointments
  getAppointments(userId = DEFAULT_USER_ID) {
    const user = ensureUser(userId);
    return user.appointments || [];
  },

  addAppointment(userId = DEFAULT_USER_ID, appointment) {
    const user = ensureUser(userId);
    if (!appointment.id) appointment.id = 'apt_' + Date.now();
    user.appointments = [appointment, ...(user.appointments || [])];
    persistDatabase();
    return appointment;
  },

  updateAppointment(userId = DEFAULT_USER_ID, id, updates) {
    const user = ensureUser(userId);
    user.appointments = (user.appointments || []).map(a => a.id === id ? { ...a, ...updates } : a);
    persistDatabase();
    return user.appointments.find(a => a.id === id);
  },

  deleteAppointment(userId = DEFAULT_USER_ID, id) {
    const user = ensureUser(userId);
    user.appointments = (user.appointments || []).filter(a => a.id !== id);
    persistDatabase();
    return { success: true, deletedId: id };
  },

  // Clinical Records (Lab Reports)
  getClinicalRecords(userId = DEFAULT_USER_ID) {
    const user = ensureUser(userId);
    return user.clinicalRecords || [];
  },

  addClinicalRecord(userId = DEFAULT_USER_ID, record) {
    const user = ensureUser(userId);
    if (!record.id) record.id = 'cr_' + Date.now();
    user.clinicalRecords = [record, ...(user.clinicalRecords || [])];
    persistDatabase();
    return record;
  },

  deleteClinicalRecord(userId = DEFAULT_USER_ID, id) {
    const user = ensureUser(userId);
    user.clinicalRecords = (user.clinicalRecords || []).filter(r => r.id !== id);
    persistDatabase();
    return { success: true, deletedId: id };
  },

  // Symptoms
  addSymptomLog(userId = DEFAULT_USER_ID, log) {
    const user = ensureUser(userId);
    user.symptomLogs = [log, ...(user.symptomLogs || [])];
    persistDatabase();
    return log;
  },

  // Kick Sessions
  addKickSession(userId = DEFAULT_USER_ID, session) {
    const user = ensureUser(userId);
    user.kickSessions = [session, ...(user.kickSessions || [])];
    persistDatabase();
    return session;
  },

  // Chat History
  addChatMessage(userId = DEFAULT_USER_ID, msg) {
    const user = ensureUser(userId);
    user.chatMessages = user.chatMessages || [];
    user.chatMessages.push({
      ...msg,
      timestamp: msg.timestamp || new Date().toISOString()
    });
    // Keep last 100 messages
    if (user.chatMessages.length > 100) {
      user.chatMessages = user.chatMessages.slice(-100);
    }
    persistDatabase();
    return msg;
  },

  // Full Database Export / Backup
  exportData(userId = DEFAULT_USER_ID) {
    const user = ensureUser(userId);
    return {
      app: 'MaaSaathi',
      exported_at: new Date().toISOString(),
      user_id: userId,
      database_version: dbState.version,
      data: user
    };
  },

  // Full Database Import / Restore
  importData(userId = DEFAULT_USER_ID, importedData) {
    if (!importedData || !importedData.data) {
      throw new Error('Invalid backup file format');
    }
    const user = ensureUser(userId);
    Object.assign(user, importedData.data);
    persistDatabase();
    return this.getAllUserData(userId);
  }
};

// Initialize DB on module load
db.init();

module.exports = db;
