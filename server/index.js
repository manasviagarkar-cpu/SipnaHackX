/**
 * MaaSaathi — Express Backend with MySQL Persistence & AI Care Integration
 *
 * Architecture:
 *   Browser frontend
 *       ↓
 *   Node.js + Express backend on localhost:3000
 *       ↓
 *   MySQL Server on localhost:3306 (maasaathi_db)
 *       ↓
 *   Optional Gemini or Groq API (server-side keys only)
 */

require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const express = require('express');
const cors = require('cors');
const path = require('path');
const db = require('./database');

const app = express();
const PORT = process.env.PORT || 3000;
let rawProvider = (process.env.AI_PROVIDER || 'gemini').toLowerCase().trim();
const AI_PROVIDER = rawProvider.includes('groq') ? 'groq' : 'gemini';

app.use(cors());
app.use(express.json({ limit: '2mb' }));

// Serve the static frontend from the parent directory
app.use(express.static(path.join(__dirname, '..')));

// =============================================
// SYSTEM PROMPT — MaaSaathi Safety Rules
// =============================================
const SYSTEM_PROMPT = `You are MaaSaathi, a multilingual pregnancy and newborn-care awareness assistant. Respond in the user's selected language using short, simple, respectful sentences. Use only general awareness information and the structured user context provided in the request. You may explain pregnancy health awareness, vaccination awareness, maternal nutrition, newborn care, appointments, reminders, and app features.

You must not diagnose a disease, interpret a medical test, prescribe medicine, recommend a dosage, guarantee that a symptom is safe, or replace a doctor. If the user describes a possible warning sign, do not diagnose it. Say that it may need urgent professional attention, advise contacting a qualified healthcare professional or local emergency services, and tell the user to open the Emergency Care page. Do not invent hospitals, phone numbers, sources, or medical facts. If you do not know the answer, say so clearly and recommend speaking with a qualified healthcare professional. End every response with one practical next action.`;

// =============================================
// 1. HEALTH & DATABASE STATUS ENDPOINTS
// =============================================

// GET /api/health
app.get('/api/health', (req, res) => {
  res.json({
    ok: true,
    service: 'MaaSaathi backend',
    database: 'mysql'
  });
});

// GET /api/db/status
app.get('/api/db/status', async (req, res) => {
  if (!db.isConnected()) {
    return res.status(503).json({
      status: 'unavailable',
      engine: 'MySQL',
      database: process.env.DB_NAME || 'maasaathi_db',
      error: 'MaaSaathi MySQL connection unavailable. Please check that MySQL Server is running and .env credentials are correct.'
    });
  }

  try {
    const stats = await db.getStats();
    res.json(stats);
  } catch (err) {
    res.status(503).json({
      status: 'error',
      engine: 'MySQL',
      database: process.env.DB_NAME || 'maasaathi_db',
      error: 'Failed to retrieve database status: ' + err.message
    });
  }
});

// =============================================
// 2. USER RECORDS & SYNC ENDPOINTS
// =============================================

// GET /api/records/all
app.get('/api/records/all', async (req, res) => {
  if (!db.isConnected()) {
    return res.status(503).json({ error: 'MySQL database unavailable' });
  }

  try {
    const userId = req.query.userId || 'user_default';
    const data = await db.getAllUserData(userId);
    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch records', details: err.message });
  }
});

// POST /api/records/sync
app.post('/api/records/sync', async (req, res) => {
  if (!db.isConnected()) {
    return res.status(503).json({ error: 'MySQL database unavailable' });
  }

  try {
    const userId = req.body.userId || 'user_default';
    const payload = req.body.data || req.body;
    const syncedData = await db.syncUserData(userId, payload);
    res.json({ success: true, message: 'Database successfully synced to MySQL', data: syncedData });
  } catch (err) {
    res.status(500).json({ error: 'Failed to sync database', details: err.message });
  }
});

// POST /api/user/profile
app.post('/api/user/profile', async (req, res) => {
  if (!db.isConnected()) {
    return res.status(503).json({ error: 'MySQL database unavailable' });
  }

  try {
    const userId = req.body.userId || 'user_default';
    const profile = await db.updateProfile(userId, req.body.profile || req.body);
    res.json({ success: true, profile });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update profile', details: err.message });
  }
});

// =============================================
// 3. APPOINTMENTS CRUD
// =============================================

app.get('/api/appointments', async (req, res) => {
  if (!db.isConnected()) {
    return res.status(503).json({ error: 'MySQL database unavailable' });
  }

  try {
    const userId = req.query.userId || 'user_default';
    const appointments = await db.getAppointments(userId);
    res.json({ success: true, appointments });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch appointments', details: err.message });
  }
});

app.post('/api/appointments', async (req, res) => {
  if (!db.isConnected()) {
    return res.status(503).json({ error: 'MySQL database unavailable' });
  }

  try {
    const userId = req.body.userId || 'user_default';
    const appointment = await db.addAppointment(userId, req.body.appointment || req.body);
    res.status(201).json({ success: true, appointment });
  } catch (err) {
    res.status(500).json({ error: 'Failed to create appointment', details: err.message });
  }
});

app.put('/api/appointments/:id', async (req, res) => {
  if (!db.isConnected()) {
    return res.status(503).json({ error: 'MySQL database unavailable' });
  }

  try {
    const userId = req.body.userId || 'user_default';
    const updated = await db.updateAppointment(userId, req.params.id, req.body);
    res.json({ success: true, appointment: updated });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update appointment', details: err.message });
  }
});

app.delete('/api/appointments/:id', async (req, res) => {
  if (!db.isConnected()) {
    return res.status(503).json({ error: 'MySQL database unavailable' });
  }

  try {
    const userId = req.query.userId || 'user_default';
    const result = await db.deleteAppointment(userId, req.params.id);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete appointment', details: err.message });
  }
});

// =============================================
// 4. CLINICAL LAB RECORDS CRUD
// =============================================

app.get('/api/clinical-records', async (req, res) => {
  if (!db.isConnected()) {
    return res.status(503).json({ error: 'MySQL database unavailable' });
  }

  try {
    const userId = req.query.userId || 'user_default';
    const records = await db.getClinicalRecords(userId);
    res.json({ success: true, records });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch clinical records', details: err.message });
  }
});

app.post('/api/clinical-records', async (req, res) => {
  if (!db.isConnected()) {
    return res.status(503).json({ error: 'MySQL database unavailable' });
  }

  try {
    const userId = req.body.userId || 'user_default';
    const record = await db.addClinicalRecord(userId, req.body.record || req.body);
    res.status(201).json({ success: true, record });
  } catch (err) {
    res.status(500).json({ error: 'Failed to save clinical record', details: err.message });
  }
});

app.delete('/api/clinical-records/:id', async (req, res) => {
  if (!db.isConnected()) {
    return res.status(503).json({ error: 'MySQL database unavailable' });
  }

  try {
    const userId = req.query.userId || 'user_default';
    const result = await db.deleteClinicalRecord(userId, req.params.id);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete clinical record', details: err.message });
  }
});

// =============================================
// 5. SYMPTOMS & KICKS
// =============================================

app.post('/api/symptoms', async (req, res) => {
  if (!db.isConnected()) {
    return res.status(503).json({ error: 'MySQL database unavailable' });
  }

  try {
    const userId = req.body.userId || 'user_default';
    const log = await db.addSymptomLog(userId, req.body.log || req.body);
    res.status(201).json({ success: true, log });
  } catch (err) {
    res.status(500).json({ error: 'Failed to save symptom log', details: err.message });
  }
});

app.post('/api/kicks', async (req, res) => {
  if (!db.isConnected()) {
    return res.status(503).json({ error: 'MySQL database unavailable' });
  }

  try {
    const userId = req.body.userId || 'user_default';
    const session = await db.addKickSession(userId, req.body.session || req.body);
    res.status(201).json({ success: true, session });
  } catch (err) {
    res.status(500).json({ error: 'Failed to save kick session', details: err.message });
  }
});

// =============================================
// 6. DATABASE EXPORT & IMPORT
// =============================================

app.get('/api/export', async (req, res) => {
  if (!db.isConnected()) {
    return res.status(503).json({ error: 'MySQL database unavailable' });
  }

  try {
    const userId = req.query.userId || 'user_default';
    const backup = await db.exportData(userId);
    res.setHeader('Content-Disposition', `attachment; filename=maasaathi_backup_${Date.now()}.json`);
    res.setHeader('Content-Type', 'application/json');
    res.send(JSON.stringify(backup, null, 2));
  } catch (err) {
    res.status(500).json({ error: 'Failed to export database backup', details: err.message });
  }
});

app.post('/api/import', async (req, res) => {
  if (!db.isConnected()) {
    return res.status(503).json({ error: 'MySQL database unavailable' });
  }

  try {
    const userId = req.body.userId || 'user_default';
    const restored = await db.importData(userId, req.body.backup || req.body);
    res.json({ success: true, message: 'Database successfully restored to MySQL', data: restored });
  } catch (err) {
    res.status(400).json({ error: 'Failed to import backup', details: err.message });
  }
});

// =============================================
// 7. CAREGIVER RELAY / ONE-PAGE CARE SUMMARY ENDPOINT
// =============================================

app.get('/api/care-summary', async (req, res) => {
  if (!db.isConnected()) {
    return res.status(503).json({ error: 'MySQL database unavailable' });
  }

  try {
    const userId = req.query.userId || 'user_default';
    const lang = req.query.lang === 'hi' ? 'hi' : 'en';
    const summary = await db.getCareSummaryData(userId, lang);
    res.json({ success: true, summary });
  } catch (err) {
    res.status(500).json({ error: 'Failed to generate care summary', details: err.message });
  }
});

// =============================================
// 8. AI CONSULTATION ENDPOINT (/api/chat)
// =============================================

app.post('/api/chat', async (req, res) => {
  const { message, context, language, userId } = req.body;

  if (!message || typeof message !== 'string' || message.length > 1000) {
    return res.status(400).json({ error: 'Invalid request' });
  }

  const isHindi = language === 'hi';
  const apiKey = AI_PROVIDER === 'gemini' ? process.env.GEMINI_API_KEY : process.env.GROQ_API_KEY;

  // Safe demo fallback if AI API key is not configured on the server
  if (!apiKey || !apiKey.trim()) {
    const demoReply = isHindi
      ? `[डेमो उत्तर: सर्वर पर AI कुंजी कॉन्फ़िगर नहीं है]\n\nनमस्ते! गर्भावस्था के दौरान उचित पोषण, पर्याप्त जलपान और नियमित डॉक्टर परामर्श आवश्यक हैं। किसी भी असहजता या चेतावनी संकेत पर तुरंत अपने योग्य चिकित्सक से संपर्क करें। 🌸`
      : `[Demo response: AI key not configured on server]\n\nDear Maa, every pregnancy journey is unique! Ensure balanced nutrition, drink plenty of water, and attend your scheduled prenatal checkups. For any specific medical concerns or symptoms, always consult your qualified healthcare professional. 🌸`;

    // Optionally log to database if connected
    await db.addChatMessage(userId || 'user_default', { role: 'user', message_text: message });
    await db.addChatMessage(userId || 'user_default', { role: 'assistant', message_text: demoReply });

    return res.json({ reply: demoReply, isDemo: true });
  }

  // Build structured context string for live AI call
  let contextStr = '';
  if (context) {
    if (context.name) contextStr += `User name: ${context.name}. `;
    if (context.pregnancyStatus) contextStr += `Status: ${context.pregnancyStatus}. `;
    if (context.currentWeek) contextStr += `Pregnancy week: ${context.currentWeek}. `;
    if (context.estimatedDueDate) contextStr += `Estimated due date: ${context.estimatedDueDate}. `;
    if (context.upcomingAppointment) contextStr += `Next appointment: ${context.upcomingAppointment.title} on ${context.upcomingAppointment.date}. `;
    if (context.recentSymptoms?.length) contextStr += `Recent symptoms: ${context.recentSymptoms.map(s => s.description).join(', ')}. `;
  }

  const languageInstr = isHindi
    ? 'Respond in Hindi (हिंदी) using simple, respectful sentences.'
    : 'Respond in English using simple, respectful sentences.';

  const fullPrompt = contextStr
    ? `${languageInstr}\n\nUser context: ${contextStr}\n\nUser question: ${message}`
    : `${languageInstr}\n\nUser question: ${message}`;

  try {
    let reply;
    if (AI_PROVIDER === 'gemini') {
      reply = await callGemini(fullPrompt);
    } else if (AI_PROVIDER === 'groq') {
      reply = await callGroq(fullPrompt);
    } else {
      return res.status(500).json({ error: 'Unknown AI provider' });
    }

    // Persist conversation to database
    await db.addChatMessage(userId || 'user_default', { role: 'user', message_text: message });
    await db.addChatMessage(userId || 'user_default', { role: 'assistant', message_text: reply });

    return res.json({ reply, isDemo: false });
  } catch (err) {
    console.error('AI call failed:', err.message);
    const fallbackReply = isHindi
      ? `[डेमो उत्तर: AI सेवा अस्थायी रूप से अनुपलब्ध है]\n\nनमस्ते! गर्भावस्था के दौरान नियमित जांच और स्वस्थ जीवनशैली बनाए रखें। किसी भी चिंता के लिए अपने चिकित्सक से संपर्क करें।`
      : `[Demo response: AI service temporarily unavailable]\n\nDear Maa, please consult your qualified doctor or healthcare professional for personalized guidance.`;
    return res.json({ reply: fallbackReply, isDemo: true, error: err.message });
  }
});

// =============================================
// Gemini API Call (Server-side)
// =============================================
async function callGemini(prompt) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error('GEMINI_API_KEY not configured');

  let model = process.env.GEMINI_MODEL || 'gemini-3.5-flash-lite';
  if (model === 'gemini-1.5-flash' || model === 'gemini-2.5-flash') {
    model = 'gemini-3.5-flash-lite';
  }

  const fetchFn = typeof fetch !== 'undefined' ? fetch : (await import('node-fetch')).default;
  const executeCall = async (modelName) => {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`;
    const body = {
      system_instruction: { parts: [{ text: SYSTEM_PROMPT }] },
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      generationConfig: { maxOutputTokens: 512, temperature: 0.4 }
    };
    return fetchFn(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });
  };

  let res = await executeCall(model);
  if (!res.ok && res.status === 404 && model !== 'gemini-3.5-flash-lite') {
    console.warn(`Model ${model} unavailable, falling back to gemini-3.5-flash-lite`);
    res = await executeCall('gemini-3.5-flash-lite');
  }

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Gemini API error ${res.status}: ${errText}`);
  }

  const data = await res.json();
  return data?.candidates?.[0]?.content?.parts?.[0]?.text || 'I was unable to generate a response. Please try again.';
}

// =============================================
// Groq API Call (Server-side)
// =============================================
async function callGroq(prompt) {
  const rawKey = process.env.GROQ_API_KEY || '';
  // Handle case where user may have accidentally concatenated multiple keys
  const apiKey = rawKey.startsWith('gsk_') ? ('gsk_' + rawKey.slice(4).split('gsk_')[0]) : rawKey;
  if (!apiKey) throw new Error('GROQ_API_KEY not configured');

  let model = process.env.GROQ_MODEL || 'openai/gpt-oss-20b';

  const fetchFn = typeof fetch !== 'undefined' ? fetch : (await import('node-fetch')).default;
  const executeCall = async (modelName) => {
    const url = 'https://api.groq.com/openai/v1/chat/completions';
    const body = {
      model: modelName,
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: prompt }
      ],
      max_tokens: 512,
      temperature: 0.4
    };
    return fetchFn(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
      body: JSON.stringify(body)
    });
  };

  let res = await executeCall(model);
  if (!res.ok && res.status === 404 && model !== 'openai/gpt-oss-20b') {
    console.warn(`Groq model ${model} not found, falling back to openai/gpt-oss-20b`);
    res = await executeCall('openai/gpt-oss-20b');
  }

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Groq API error ${res.status}: ${errText}`);
  }

  const data = await res.json();
  return data?.choices?.[0]?.message?.content || 'I was unable to generate a response. Please try again.';
}


// =============================================
// Catch-all: Serve index.html
// =============================================
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'index.html'));
});

// =============================================
// Start Server & Connect to MySQL
// =============================================
(async () => {
  await db.initializeDatabase();

  app.listen(PORT, () => {
    const hasKey = AI_PROVIDER === 'gemini' ? Boolean(process.env.GEMINI_API_KEY) : Boolean(process.env.GROQ_API_KEY);
    console.log(`\n🌸 MaaSaathi server running on http://localhost:${PORT}`);
    console.log(`   🗄️  Database Engine: MySQL (localhost:${process.env.DB_PORT || 3306})`);
    console.log(`   Database Name: ${process.env.DB_NAME || 'maasaathi_db'}`);
    console.log(`   Database Status: ${db.isConnected() ? '✅ Connected' : '❌ Connection failed'}`);
    console.log(`   AI Provider: ${AI_PROVIDER.toUpperCase()}`);
    console.log(`   AI API Key: ${hasKey ? '✅ Configured' : '⚠️ Not configured (safe demo response mode)'}`);
    console.log(`\n   Open http://localhost:${PORT} in your browser\n`);
  });
})();
