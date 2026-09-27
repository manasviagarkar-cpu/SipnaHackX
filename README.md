# MaaSaathi — Multilingual Maternity & Newborn Care Companion

> **"A simple multilingual companion for safer pregnancy and newborn care."**

MaaSaathi is a maternal and newborn health-awareness companion web application for pregnant women, new mothers, and caregivers. It helps users track pregnancy weeks, log symptoms, manage checkup appointments, access health-awareness guidance, generate caregiver summaries, and ask an AI assistant awareness questions in English or Hindi.

---

## 🏛️ Local Architecture for Hackathon

```text
Browser frontend (localhost:3000)
    ↓
Node.js + Express backend (localhost:3000)
    ↓
MySQL Server (localhost:3306 - maasaathi_db)
    ↓
Optional Gemini or Groq API (server-side keys only)
```

- **Database Engine**: Local MySQL Server (port 3306).
- **Database Management Tool**: MySQL Workbench (used to create and inspect `maasaathi_db`).
- **Resilience**: The browser maintains a local demo copy in `localStorage` for continuity. If MySQL is temporarily offline, the application gracefully operates in **Local Demo Mode** without data loss.

---

## ⚠️ Important Medical & Safety Disclaimer

**MaaSaathi is a prototype for awareness and demonstration purposes only.**

- It does **not** diagnose medical conditions or interpret clinical test reports.
- It does **not** replace a qualified obstetrician, pediatrician, or healthcare professional.
- It does **not** prescribe medicines or calculate drug dosages.
- It provides general health-awareness information and structured summaries for discussions with doctors.

**In case of warning signs (heavy bleeding, sudden severe pain, high fever, or reduced fetal movement), contact emergency services (112 in India) or visit the nearest hospital immediately.**

---

## 💻 Local Setup Guide (MySQL & Express)

Follow this exact local setup flow to run MaaSaathi:

### 1. Install MySQL Server and MySQL Workbench
Download and install MySQL Community Server and MySQL Workbench from the official MySQL website:
- [MySQL Community Downloads](https://dev.mysql.com/downloads/)

### 2. Start the MySQL Server
Ensure the MySQL Server service is running locally on port `3306`.
- **Windows**: Open `services.msc` and ensure **MySQL80** (or similar) is Running, or start via Command Prompt / PowerShell:
  ```powershell
  net start MySQL80
  ```

### 3. Open MySQL Workbench
Launch **MySQL Workbench** and open your local MySQL connection (typically `localhost:3306` with user `root`).

### 4. Run `server/mysql-schema.sql`
In MySQL Workbench:
1. Go to **File** → **Open SQL Script...**
2. Select `server/mysql-schema.sql` from this repository.
3. Click the ⚡ **Execute** (lightning bolt) icon to run the script.
4. This creates the `maasaathi_db` database, InnoDB tables with utf8mb4 encoding, and seeds the default demo user (`user_id = 1`).
5. Refresh the **Schemas** panel in Workbench to inspect `maasaathi_db` and its tables.

### 5. Copy `.env.example` to `.env`
In your project root:
```bash
cp .env.example .env
```
*(On Windows Command Prompt: `copy .env.example .env`)*

### 6. Add the Local MySQL Password
Edit `.env` and set your local MySQL password:
```env
PORT=3000

DB_HOST=127.0.0.1
DB_PORT=3306
DB_NAME=maasaathi_db
DB_USER=root
DB_PASSWORD=YOUR_LOCAL_MYSQL_PASSWORD
```

### 7. Add the Gemini or Groq API Key (Optional)
If you have an API key, add it to `.env`:
```env
AI_PROVIDER=gemini
GEMINI_API_KEY=your_gemini_api_key_here
GEMINI_MODEL=gemini-1.5-flash

# Or for Groq:
# AI_PROVIDER=groq
# GROQ_API_KEY=your_groq_api_key_here
# GROQ_MODEL=llama-3.1-8b-instant
```
*Note: If no API key is provided, MaaSaathi automatically provides safe demo responses clearly marked as `[Demo response: AI key not configured on server]`.*

### 8. Install Dependencies and Start the Server
```bash
npm install
npm start
```
The console will report:
- `MaaSaathi MySQL database connected` (when credentials are valid)
- `🌸 MaaSaathi server running on http://localhost:3000`

### 9. Open in Browser
Open your browser and navigate to:
```text
http://localhost:3000
```

---

## 🔧 Troubleshooting

### 1. MySQL Access Denied (`ER_ACCESS_DENIED_ERROR`)
- **Cause**: Incorrect MySQL username or password in `.env`.
- **Fix**: Open `.env` and check `DB_USER` and `DB_PASSWORD`. Test logging into MySQL Workbench with those exact credentials. Remember to restart the Node server after modifying `.env`.

### 2. MySQL Server Not Running (`ECONNREFUSED` / `ETIMEDOUT`)
- **Cause**: MySQL Windows service has not been started.
- **Fix**: Open Windows Services (`services.msc`), find **MySQL80** (or your version name), and click **Start**. Alternatively run `net start MySQL80` in an administrative shell.

### 3. Port 3306 Already in Use
- **Cause**: Another service (such as MariaDB, XAMPP, or another MySQL instance) is bound to port 3306.
- **Fix**: Stop the conflicting service, or configure MySQL to run on a different port (e.g., 3307) and update `DB_PORT=3307` in your `.env` file.

### 4. Gemini API Key Missing
- **Behavior**: MaaSaathi does **not** crash. It gracefully returns safe maternal health awareness demo responses with the notice: `[Demo response: AI key not configured on server]`.
- **Fix**: Obtain a free API key from [Google AI Studio](https://aistudio.google.com/), add `GEMINI_API_KEY=your_key` to `.env`, and restart the server.

### 5. AI Provider Unavailable (`503` / Network Timeout)
- **Behavior**: If the external AI service experiences rate-limiting or downtime, MaaSaathi returns a fallback awareness response and reminds the mother to speak with a healthcare professional.
- **Fix**: Check your internet connection or switch `AI_PROVIDER=groq` in `.env`.

---

## 🗄️ MySQL Database Schema (`maasaathi_db`)

The database uses InnoDB engine and utf8mb4 encoding across 9 tables:

| Table | Description | Primary Key |
|---|---|---|
| `users` | Mother profile (name, edd, status, doctor, hospital, emergency contact, language) | `id` (INT) |
| `appointments` | Prenatal checkups, anomaly scans, dates, times, clinics, notes, done flag | `id` (VARCHAR) |
| `symptom_logs` | Daily logged symptoms, JSON tags array, and user notes | `id` (VARCHAR) |
| `doctor_questions` | Questions saved for upcoming consultations with asked flag | `id` (VARCHAR) |
| `checklists` | Hospital bag, baby, and postpartum packing items | `id` (VARCHAR) |
| `kick_sessions` | Fetal movement tracking sessions (kicks count, duration in minutes) | `id` (VARCHAR) |
| `chat_messages` | Consultation conversation history with AI role and message text | `id` (INT) |
| `app_settings` | User hydration target, glasses drank, water date, language setting | `id` (INT) |
| `clinical_records` | Saved health records, lab reports, ultrasound vitals, and blood pressure | `id` (VARCHAR) |

---

## 🔌 API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/health` | Service health check (`{ ok: true, service: "MaaSaathi backend", database: "mysql" }`) |
| `GET` | `/api/db/status` | Honest MySQL connection status, database name, and record metrics |
| `GET` | `/api/records/all` | Fetch complete bundle for user (`userId=user_default` maps to `1`) |
| `POST` | `/api/records/sync` | Synchronize frontend state to MySQL using parameterized SQL queries |
| `POST` | `/api/user/profile` | Update mother profile fields in MySQL |
| `GET` / `POST` | `/api/appointments` | List or insert doctor appointments |
| `PUT` / `DELETE` | `/api/appointments/:id` | Update status/notes or delete appointment |
| `GET` / `POST` | `/api/clinical-records` | List or insert clinical lab records |
| `DELETE` | `/api/clinical-records/:id` | Delete clinical lab record |
| `POST` | `/api/symptoms` | Log daily symptoms and health tags |
| `POST` | `/api/kicks` | Save kick counter session |
| `POST` | `/api/chat` | AI consultation via server-side Gemini/Groq (or safe demo response) |
| `GET` | `/api/care-summary` | Retrieve structured One-Page Care Summary from MySQL for testing |
| `GET` | `/api/export` | Download full JSON database backup |
| `POST` | `/api/import` | Restore database records from backup file |

---

## 📋 Caregiver Relay / One-Page Care Summary

The Caregiver Relay feature converts saved pregnancy information into a printable one-page summary for a doctor or trusted family member.

- **Offline-First**: Generates directly in the browser from `localStorage` even if MySQL is temporarily unavailable.
- **Includes**: Mother name or Demo User, pregnancy status, current week, EDD, city, doctor, delivery hospital, emergency contact, recent symptoms, upcoming appointments, doctor questions, selected language, timestamp, and safety disclaimers.
- **Actions**:
  - **Create Care Summary**: View styled sheet modal.
  - **Download Summary**: Downloads plain text file `maasaathi-care-summary.txt`.
  - **Print Summary**: Opens native browser print dialog for paper or PDF export.

---

## 📁 Repository Structure

```text
IBM_SipnaHackX/
├── index.html              ← Multilingual frontend (English & Hindi)
├── package.json            ← Dependencies (express, mysql2, cors, dotenv, node-fetch)
├── .env.example            ← Safe environment variables template
├── .gitignore              ← Excludes node_modules/ and .env
├── server/
│   ├── index.js            ← Express server, API routes & server-side AI integration
│   ├── database.js         ← Promise-based MySQL connection pool & persistence layer
│   └── mysql-schema.sql    ← MySQL schema creation and demo seed script for Workbench
└── README.md               ← Local setup, architecture, and troubleshooting documentation
```
