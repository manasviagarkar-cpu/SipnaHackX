# MaaSaathi — Multilingual Maternity Companion

> **"A simple multilingual companion for safer pregnancy and newborn care."**

MaaSaathi is a health-awareness and healthcare-access web application for pregnant women and new mothers. It helps users track pregnancy, log symptoms, manage appointments, access awareness content, and ask an AI assistant questions in their preferred language.

---

## ⚠️ Important Disclaimer

**MaaSaathi is a hackathon prototype for educational and demonstration purposes only.**

- It does **not** diagnose medical conditions.
- It does **not** replace a qualified healthcare professional.
- It does **not** prescribe medicines or provide treatment plans.
- It uses **localStorage** for data storage — not suitable for sensitive production healthcare data.
- Demo hospital data is **fictional** — do not use for real emergencies.

**In an emergency, always contact local emergency services (112 in India) or go to the nearest hospital.**

---

## 🚀 Features

| Feature | Status |
|---|---|
| Pregnancy week & trimester calculator | ✅ |
| Home dashboard with daily guidance | ✅ |
| Symptom log with warning-word detection | ✅ |
| Appointment & reminder calendar | ✅ |
| Kick counter (session-based) | ✅ |
| Contraction timer | ✅ |
| Hospital bag & to-do checklists | ✅ |
| Baby feeding & growth tracker | ✅ |
| Pregnancy health awareness cards | ✅ |
| Vaccination awareness cards | ✅ |
| Maternal nutrition guidance | ✅ |
| Newborn care awareness | ✅ |
| Emergency contacts & demo hospital resources | ✅ |
| AI chatbot (demo + live Gemini/Groq) | ✅ |
| English ↔ Hindi language toggle | ✅ |
| localStorage persistence (survives refresh) | ✅ |
| Export all data as JSON | ✅ |
| Mobile-first responsive design | ✅ |

---

## 📦 Installation & Running

### Option A: Open directly in browser (Recommended for demo)

```
Double-click index.html
OR
Open with any web browser (Chrome, Firefox, Edge)
```

No build tools, no installation, no dependencies required.

### Option B: Serve via XAMPP (already installed on this machine)

1. Copy the project folder to `C:\xampp\htdocs\maasaathi\`
2. Start Apache in XAMPP Control Panel
3. Open `http://localhost/maasaathi/index.html`

### Option C: With live AI backend (Node.js required)

If Node.js is available:

```bash
npm install
npm run dev
```

The server reads environment variables from `.env`:
```
AI_PROVIDER=gemini
GEMINI_API_KEY=your-key-here
GEMINI_MODEL=gemini-1.5-flash
```

Then `/api/chat` becomes available. Without the server, the app uses demo responses automatically.

---

## 🤖 How to Configure Gemini AI

1. Get an API key from [Google AI Studio](https://aistudio.google.com/app/apikey)
2. Copy `.env.example` to `.env`
3. Set `GEMINI_API_KEY=your-key`
4. Run the Node.js server: `node server/index.js`
5. Open the app — it will use live Gemini responses

### How to Configure Groq instead

1. Get an API key from [Groq Console](https://console.groq.com)
2. Set in `.env`:
   ```
   AI_PROVIDER=groq
   GROQ_API_KEY=your-key
   GROQ_MODEL=llama-3.1-8b-instant
   ```

**Without any API key configured**, the app uses safe, pre-written demo responses — the app remains fully usable.

---

## 💾 How localStorage Persistence Works

All user data is saved in the browser's `localStorage` under the key `maasaathi_data_v1`. The data structure is a single JSON object containing:

```json
{
  "profile": { "name": "...", "edd": "...", "language": "en" },
  "symptoms": [...],
  "appointments": [...],
  "kickSessions": [...],
  "contractionSessions": [...],
  "checklists": {...},
  "babyData": { "profiles": [], "feedings": [], "weights": [] },
  "chatMessages": [...],
  "reminders": [...],
  "settings": { "language": "en" }
}
```

Data is saved after every create/edit/delete action. It persists across browser refreshes and browser restarts on the same device.

**Limitation**: localStorage is device-specific and not suitable for sensitive healthcare data in production. A real deployment would require a secure server-side database with proper authentication and encryption.

---

## 🧠 How the AI Receives User Context

Before each AI request, `buildUserContext()` assembles a minimal context object:

```json
{
  "language": "en",
  "name": "Anita",
  "pregnancyStatus": "pregnant",
  "estimatedDueDate": "2026-12-01",
  "currentWeek": 24,
  "upcomingAppointment": {
    "title": "Antenatal Checkup",
    "date": "2026-09-03"
  },
  "recentSymptoms": [...]
}
```

This context is sent with every question to `/api/chat`. The AI's system prompt instructs it to personalize responses based only on what is present in this context — it never invents data.

---

## 🛡️ Emergency Safety Rules

The app implements a **deterministic safety layer** that runs before and independently of the AI:

**Warning words checked** include: `severe bleeding`, `chest pain`, `difficulty breathing`, `fainting`, `seizure`, `severe headache`, `reduced fetal movement`, `severe abdominal pain`, `high fever`, and Hindi equivalents.

When a warning word is detected:
1. A bright red **Emergency Card** is shown immediately above or alongside the AI response
2. The card says: *"This may need urgent professional attention. MaaSaathi cannot diagnose symptoms."*
3. Buttons for Emergency Call (112), Emergency Contact, and Hospital Resources are shown prominently
4. The AI may still provide a general awareness response, but the emergency action is always visible

The AI's system prompt also instructs it to never diagnose symptoms and to always refer to emergency services if warning signs are described.

---

## 🌐 How to Add Another Language

1. Add a new key to the `T` object in `index.html`:
   ```javascript
   const T = {
     en: { ... },
     hi: { ... },
     mr: {          // ← new Marathi translations
       nav_home: 'मुख्यपृष्ठ',
       emergency_btn: 'आता मदत मिळवा',
       // ... all keys
     }
   };
   ```
2. Add the language option to the profile form select.
3. Add awareness content to `KNOWLEDGE` for the new language key.
4. Add daily tips to `DAILY_TIPS` for the new language key.
5. Update the `toggleLanguage()` function to cycle through all languages.

---

## 🏥 How to Replace Demo Hospital Data with Verified Data

The demo resources are defined in `DEMO_RESOURCES` array in `index.html`:

```javascript
const DEMO_RESOURCES = [
  {
    icon: '🏥',
    name: 'Real Hospital Name',
    city: 'City, State',
    address: 'Full verified address',
    phone: 'Verified phone number',
    hours: 'Verified hours',
    directions: 'https://maps.google.com/?q=latitude,longitude'
  },
  // ... more hospitals
];
```

**Before replacing demo data**:
- Verify all phone numbers are current and correct
- Verify hospital addresses using official sources
- Verify opening hours
- Confirm emergency services availability
- Add the "Demo resource data" notice label to production data if unverified
- Consider using a backend database with admin-managed resource records for real deployment

---

## 🗑️ How Users Delete Their Data

### From the app:
1. Go to **Profile** → **Settings** (or navigate to Settings)
2. Tap **"Clear All Data"**
3. Confirm the deletion prompt
4. All data is removed from localStorage immediately

### Manually:
1. Open browser DevTools (F12)
2. Go to Application → Local Storage
3. Delete the `maasaathi_data_v1` key

### Export before deleting:
Users can tap **"Export Data"** in Settings to download a JSON file of all their data before clearing.

---

## 🗄️ Patient Health Database Architecture

MaaSaathi includes an embedded, persistent Database Engine designed for zero-friction local deployments while offering enterprise-grade ACID integrity:

- **Storage Location**: `server/data/maasaathi_db.json`
- **Database Engine**: `server/database.js`
- **Dual-Layer Architecture**:
  1. **In-Memory & Server Database**: Atomic disk writes with backup recovery.
  2. **Browser LocalStorage Cache**: Instant zero-latency rendering with background synchronization.
  3. **Offline Resilience**: Automatically operates offline and syncs pending records whenever server connection is re-established.

### 📋 Database Collections & Records Stored:
- **User Profiles**: Gestation week, EDD, cycle metrics, blood group, attending OB/GYN, hospital, emergency contacts.
- **Doctor Appointments**: Checkup dates, times, ultrasound findings, prescriptions, and notes.
- **Clinical Lab Vault**: Ultrasound reports, OGTT glucose screenings, urine tests, hemoglobin, blood pressure readings.
- **Symptom History**: Daily symptom tags, severity notes, and logged timestamps.
- **Fetal Kick Sessions**: Session durations, kick counts, and timestamps.
- **Doctor Questions**: Questions marked as asked/unasked for upcoming visits.
- **Hospital Bag Checklists**: Packed / pending maternity & newborn items.
- **Consultation History**: AI chat logs and doctor guidance recommendations.

---

## 🔌 Database REST API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/db/status` | Database health check, record counts, and storage stats |
| `GET` | `/api/records/all` | Fetch complete user data bundle from database |
| `POST` | `/api/records/sync` | Batch synchronization between frontend and database |
| `POST` | `/api/user/profile` | Update active user profile |
| `GET` / `POST` | `/api/appointments` | List or create doctor appointments |
| `PUT` / `DELETE` | `/api/appointments/:id` | Update or delete appointment by ID |
| `GET` / `POST` | `/api/clinical-records` | List or store clinical lab reports |
| `DELETE` | `/api/clinical-records/:id` | Delete clinical lab report |
| `POST` | `/api/symptoms` | Log daily symptoms and health tags |
| `POST` | `/api/kicks` | Save baby kick counter session |
| `GET` | `/api/export` | Download full JSON database backup |
| `POST` | `/api/import` | Restore database from JSON backup file |

---

## 📁 File Structure

```
IBM_SipnaHackX/
├── index.html          ← Complete frontend application with DB Vault UI
├── server/
│   ├── index.js        ← Express server, AI chat & REST API endpoints
│   ├── database.js     ← Persistent ACID database engine & schema manager
│   └── data/           ← Persistent database directory
│       └── maasaathi_db.json ← Patient records database file
├── .env.example        ← Environment variable template
└── README.md           ← Complete documentation
```

---

## 🔒 Privacy & Security Notes

- No data is sent to any server unless a live AI API key is configured
- In demo mode, all data stays in the browser
- No analytics, no tracking, no external requests (except Google Fonts and the optional AI API)
- API keys are never stored in localStorage or exposed to the browser
- The backend server uses environment variables only

---

## 🎯 Hackathon Acceptance Criteria Status

| # | Criteria | Status |
|---|---|---|
| 1 | Profile creation with language selection | ✅ |
| 2 | Due date → auto pregnancy week | ✅ |
| 3 | Symptom log | ✅ |
| 4 | Appointments, milestones, reminders, checklists | ✅ |
| 5 | Kick counter + contraction timer | ✅ |
| 6 | Baby profile + feeding + growth | ✅ |
| 7 | Awareness content (pregnancy, vaccination, nutrition, newborn) | ✅ |
| 8 | Emergency contacts + demo hospital resources | ✅ |
| 9 | AI chat (demo mode + live API) | ✅ |
| 10 | AI uses only relevant profile data | ✅ |
| 11 | Warning signs → visible emergency escalation | ✅ |
| 12 | Data persists after refresh | ✅ |
| 13 | Users cannot access other users' data (localStorage is per-browser) | ✅ |
| 14 | Mobile-first, works at 375px | ✅ |
| 15 | Demo uses fictional data | ✅ |

---

*MaaSaathi — Built for the IBM SipnaHackX Hackathon. This prototype requires medical-content review and verified healthcare resources before any real-world deployment.*
