/**
 * MaaSaathi — AI Backend & Patient Health Database Server
 * Provides:
 *   - /api/chat endpoint for Gemini and Groq AI consultations
 *   - /api/db/* and /api/records/* endpoints for persistent patient records database
 *   - /api/appointments, /api/clinical-records, /api/symptoms, /api/export, /api/import
 * 
 * Usage:
 *   npm install express cors node-fetch dotenv
 *   node server/index.js
 */

require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const express = require('express');
const cors = require('cors');
const path = require('path');
const db = require('./database');

const app = express();
const PORT = process.env.PORT || 3000;
const AI_PROVIDER = (process.env.AI_PROVIDER || 'gemini').toLowerCase();

app.use(cors());
app.use(express.json({ limit: '2mb' }));

// Serve the static app from the parent directory
app.use(express.static(path.join(__dirname, '..')));

// =============================================
// DATABASE REST API ENDPOINTS
// =============================================

// 1. Database status & health
app.get('/api/db/status', (req, res) => {
  try {
    const stats = db.getStats();
    res.json(stats);
  } catch (err) {
    res.status(500).json({ error: 'Failed to retrieve database status', details: err.message });
  }
});

// 2. Fetch all user data
app.get('/api/records/all', (req, res) => {
  try {
    const userId = req.query.userId || 'user_default';
    const data = db.getAllUserData(userId);
    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch records', details: err.message });
  }
});

// 3. Batch Sync user records from frontend
app.post('/api/records/sync', (req, res) => {
  try {
    const userId = req.body.userId || 'user_default';
    const payload = req.body.data || req.body;
    const syncedData = db.syncUserData(userId, payload);
    res.json({ success: true, message: 'Database successfully synced', data: syncedData });
  } catch (err) {
    res.status(500).json({ error: 'Failed to sync database', details: err.message });
  }
});

// 4. Update Profile
app.post('/api/user/profile', (req, res) => {
  try {
    const userId = req.body.userId || 'user_default';
    const profile = db.updateProfile(userId, req.body.profile || req.body);
    res.json({ success: true, profile });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update profile', details: err.message });
  }
});

// 5. Appointments CRUD
app.get('/api/appointments', (req, res) => {
  try {
    const userId = req.query.userId || 'user_default';
    const appointments = db.getAppointments(userId);
    res.json({ success: true, appointments });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch appointments', details: err.message });
  }
});

app.post('/api/appointments', (req, res) => {
  try {
    const userId = req.body.userId || 'user_default';
    const appointment = db.addAppointment(userId, req.body.appointment || req.body);
    res.status(201).json({ success: true, appointment });
  } catch (err) {
    res.status(500).json({ error: 'Failed to create appointment', details: err.message });
  }
});

app.put('/api/appointments/:id', (req, res) => {
  try {
    const userId = req.body.userId || 'user_default';
    const updated = db.updateAppointment(userId, req.params.id, req.body);
    res.json({ success: true, appointment: updated });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update appointment', details: err.message });
  }
});

app.delete('/api/appointments/:id', (req, res) => {
  try {
    const userId = req.query.userId || 'user_default';
    const result = db.deleteAppointment(userId, req.params.id);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete appointment', details: err.message });
  }
});

// 6. Clinical Lab Records CRUD
app.get('/api/clinical-records', (req, res) => {
  try {
    const userId = req.query.userId || 'user_default';
    const records = db.getClinicalRecords(userId);
    res.json({ success: true, records });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch clinical records', details: err.message });
  }
});

app.post('/api/clinical-records', (req, res) => {
  try {
    const userId = req.body.userId || 'user_default';
    const record = db.addClinicalRecord(userId, req.body.record || req.body);
    res.status(201).json({ success: true, record });
  } catch (err) {
    res.status(500).json({ error: 'Failed to save clinical record', details: err.message });
  }
});

app.delete('/api/clinical-records/:id', (req, res) => {
  try {
    const userId = req.query.userId || 'user_default';
    const result = db.deleteClinicalRecord(userId, req.params.id);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete clinical record', details: err.message });
  }
});

// 7. Symptoms & Kicks
app.post('/api/symptoms', (req, res) => {
  try {
    const userId = req.body.userId || 'user_default';
    const log = db.addSymptomLog(userId, req.body.log || req.body);
    res.status(201).json({ success: true, log });
  } catch (err) {
    res.status(500).json({ error: 'Failed to save symptom log', details: err.message });
  }
});

app.post('/api/kicks', (req, res) => {
  try {
    const userId = req.body.userId || 'user_default';
    const session = db.addKickSession(userId, req.body.session || req.body);
    res.status(201).json({ success: true, session });
  } catch (err) {
    res.status(500).json({ error: 'Failed to save kick session', details: err.message });
  }
});

// 8. Export Database Backup
app.get('/api/export', (req, res) => {
  try {
    const userId = req.query.userId || 'user_default';
    const backup = db.exportData(userId);
    res.setHeader('Content-Disposition', `attachment; filename=maasaathi_backup_${Date.now()}.json`);
    res.setHeader('Content-Type', 'application/json');
    res.send(JSON.stringify(backup, null, 2));
  } catch (err) {
    res.status(500).json({ error: 'Failed to export database backup', details: err.message });
  }
});

// 9. Import Database Backup
app.post('/api/import', (req, res) => {
  try {
    const userId = req.body.userId || 'user_default';
    const restored = db.importData(userId, req.body.backup || req.body);
    res.json({ success: true, message: 'Database successfully restored', data: restored });
  } catch (err) {
    res.status(400).json({ error: 'Failed to import backup', details: err.message });
  }
});

// =============================================
// SYSTEM PROMPT — MaaSaathi AI Safety Rules
// =============================================
const SYSTEM_PROMPT = `You are MaaSaathi, a multilingual pregnancy and newborn-care awareness assistant. Respond in the user's selected language using short, simple, respectful sentences. Use only approved awareness content and the structured user context provided in the request. You may explain pregnancy health awareness, vaccination awareness, maternal nutrition, newborn care, appointments, reminders, and app features.

You must not diagnose a disease, interpret a medical test, prescribe medicine, recommend a dosage, guarantee that a symptom is safe, or replace a doctor. If the user describes a possible warning sign, do not diagnose it. Say that it may need urgent professional attention, advise contacting a qualified healthcare professional or local emergency services, and tell the user to open the Get Help Now page. Do not invent hospitals, phone numbers, sources, or medical facts. If you do not know the answer, say so clearly and recommend speaking with a qualified healthcare professional. End every response with one practical next action.`;

// =============================================
// /api/chat endpoint
// =============================================
app.post('/api/chat', async (req, res) => {
  const { message, context, language, userId } = req.body;

  if (!message || typeof message !== 'string' || message.length > 1000) {
    return res.status(400).json({ error: 'Invalid request' });
  }

  // Build context string for the AI
  let contextStr = '';
  if (context) {
    if (context.name) contextStr += `User name: ${context.name}. `;
    if (context.pregnancyStatus) contextStr += `Status: ${context.pregnancyStatus}. `;
    if (context.currentWeek) contextStr += `Pregnancy week: ${context.currentWeek}. `;
    if (context.estimatedDueDate) contextStr += `Estimated due date: ${context.estimatedDueDate}. `;
    if (context.upcomingAppointment) contextStr += `Next appointment: ${context.upcomingAppointment.title} on ${context.upcomingAppointment.date}. `;
    if (context.recentSymptoms?.length) contextStr += `Recent symptoms: ${context.recentSymptoms.map(s => s.description).join(', ')}. `;
  }

  const languageInstr = language === 'hi'
    ? 'Respond in Hindi (हिंदी) using simple, clear sentences.'
    : 'Respond in English using simple, clear sentences.';

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
    try {
      db.addChatMessage(userId || 'user_default', { role: 'user', text: message });
      db.addChatMessage(userId || 'user_default', { role: 'assistant', text: reply });
    } catch (e) {
      console.error('Failed to log chat to DB:', e.message);
    }

    return res.json({ reply });
  } catch (err) {
    console.error('AI call failed:', err.message);
    return res.status(503).json({ error: 'AI service temporarily unavailable. Please try again.' });
  }
});

// =============================================
// Gemini API call
// =============================================
async function callGemini(prompt) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error('GEMINI_API_KEY not configured');

  const model = process.env.GEMINI_MODEL || 'gemini-1.5-flash';
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

  const body = {
    system_instruction: { parts: [{ text: SYSTEM_PROMPT }] },
    contents: [{ role: 'user', parts: [{ text: prompt }] }],
    generationConfig: { maxOutputTokens: 512, temperature: 0.4 }
  };

  const { default: fetch } = await import('node-fetch');
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Gemini API error ${res.status}`);
  }

  const data = await res.json();
  return data?.candidates?.[0]?.content?.parts?.[0]?.text || 'I was unable to generate a response. Please try again.';
}

// =============================================
// Groq API call (OpenAI-compatible)
// =============================================
async function callGroq(prompt) {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) throw new Error('GROQ_API_KEY not configured');

  const model = process.env.GROQ_MODEL || 'llama-3.1-8b-instant';
  const url = 'https://api.groq.com/openai/v1/chat/completions';

  const body = {
    model,
    messages: [
      { role: 'system', content: SYSTEM_PROMPT },
      { role: 'user', content: prompt }
    ],
    max_tokens: 512,
    temperature: 0.4
  };

  const { default: fetch } = await import('node-fetch');
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
    body: JSON.stringify(body)
  });

  if (!res.ok) throw new Error(`Groq API error ${res.status}`);

  const data = await res.json();
  return data?.choices?.[0]?.message?.content || 'I was unable to generate a response. Please try again.';
}

// =============================================
// Serve index.html for all other routes
// =============================================
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`\n🌸 MaaSaathi server running on http://localhost:${PORT}`);
  console.log(`   🗄️  Database: Connected (server/data/maasaathi_db.json)`);
  console.log(`   AI Provider: ${AI_PROVIDER.toUpperCase()}`);
  console.log(`   API Key: ${process.env[AI_PROVIDER.toUpperCase()+'_API_KEY'] ? '✅ Configured' : '❌ Not configured (demo mode)'}`);
  console.log(`\n   Open http://localhost:${PORT} in your browser\n`);
});
