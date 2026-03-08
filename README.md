<div align="center">

# 🛡️ GuardianAI — AI for Community Safety & Digital Wellness

![React](https://img.shields.io/badge/React_19-61DAFB?style=for-the-badge&logo=react&logoColor=black)
![OpenAI](https://img.shields.io/badge/OpenAI-412991?style=for-the-badge&logo=openai&logoColor=white)
![Jest](https://img.shields.io/badge/Tested_with_Jest-C21325?style=for-the-badge&logo=jest&logoColor=white)
![Node](https://img.shields.io/badge/Node_18+-339933?style=for-the-badge&logo=node.js&logoColor=white)
![License](https://img.shields.io/badge/License-MIT-yellow?style=for-the-badge)

**AI-powered neighborhood safety platform with threat radar, scam detection, and predictive forecasting**

</div>

---

**Candidate Name:** Neha Suram  
**Scenario Chosen:** 3 — Community Safety & Digital Wellness  
**Estimated Time Spent:** ~5 hours  

### 🎥 Demo Video
[![Watch the demo](https://img.shields.io/badge/▶_Watch_Demo-YouTube-red?style=for-the-badge&logo=youtube)](https://youtu.be/a5cmX1ZEMyU)

👉 **[Click here to watch the demo video](https://youtu.be/a5cmX1ZEMyU)**

---

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ and npm installed
- OpenAI API key (get one at https://platform.openai.com/api-keys) — the app works without one too, using rule-based fallbacks

### Run Commands
```bash
git clone https://github.com/Nehareddy0404/guardian-ai.git
cd guardian-ai
npm install

cp .env.example .env
# open .env and paste your OpenAI key

npm start
```

### Test Commands
```bash
npm test -- --watchAll=false
```

All 7 tests pass — covering noise filtering, scam detection, and safety score calculation.

---

## 🏗️ Tech Stack

| Layer | Tech | Why |
|-------|------|-----|
| Frontend | React 19 (CRA) | Fast to prototype, component-based, zero config |
| AI | OpenAI GPT-3.5 Turbo | Cheap, fast, good enough for summarization and scam detection |
| Styling | Inline styles + JS tokens (`styles.js`) | No extra deps, easy to keep dark theme consistent |
| Testing | Jest + React Testing Library | Built into CRA, zero setup |
| Data | Synthetic JSON | 25 hand-written Buffalo NY safety reports |

---

## ✨ Features

### 📝 Core Flow — Create → View → Update → Delete → Search

| Action | How it works |
|--------|-------------|
| **Create** | Click "+ Report" → fill in description, pick type (digital/physical) and location → submit |
| **View** | Dashboard shows safety score, trend chart, filtered alerts. Reports tab shows all reports |
| **Update** | Reports tab → click "Edit" on any report → change text, type, or location → click "Save" |
| **Delete** | Reports tab → click "Delete" → confirm in dialog → report is removed |
| **Search** | Reports tab → type in search bar → filters by keyword, location, or type in real time |

### 🤖 AI Integration (4 capabilities, all with fallbacks)

**1. Noise-to-Signal Filtering (Summarize + Categorize)**  
The core AI feature. GPT-3.5 reads community reports and:
- Filters out noise (venting, off-topic chatter) from real threats
- Assigns severity levels (high / medium / low)
- Generates 1-sentence summaries for each alert
- Creates actionable defense checklists

**Rule-based fallback:** If the API fails or key is missing, the app uses keyword matching — noise words like "lol", "pizza", "omg" get filtered, action words like "phishing", "breach", "scam" get kept. Severity is assigned by regex. The UI shows a clear "Rule-based" badge so users know AI wasn't used.

**2. Scam Scanner (Extract)**  
Paste any suspicious text, email, or SMS. The AI returns:
- Verdict: SCAM / SUSPICIOUS / LEGITIMATE
- Confidence level (High / Medium / Low)
- Red flags found (e.g., "Urgency language: 'act now'", "Financial bait: 'gift card'")
- What to do next (actionable steps)

**Rule-based fallback:** Checks for urgency words, financial bait, phishing indicators. Counts how many flags are found to determine verdict.

**3. Threat Forecast (Forecast)**  
Analyzes incident patterns across ALL locations and predicts the next 7 days:
- Risk level per neighborhood
- Overall trend (increasing / stable / decreasing)
- Top risk area and what threats are emerging
- AI insight — a pattern the AI noticed that might not be obvious

**Rule-based fallback:** Statistical analysis of incident counts, type ratios, severity keywords.

**4. AI Chat Assistant**  
A floating chatbot that knows about recent local incidents. Users can ask things like "is it safe to walk in Elmwood Village tonight?" and get context-aware answers.

### 🌟 Standout Features

| Feature | What it does |
|---------|-------------|
| **📡 Threat Radar** | Interactive SVG radar plotting all neighborhoods as animated nodes — color-coded by risk (green/amber/red), pulsing rings on high-risk areas, rotating sweep line, connection lines to center hub |
| **📊 Safety Score Gauge** | Animated 0-100 arc gauge per location, weighted by incident recency, frequency, and severity |
| **📈 7-Day Trend Chart** | Bar chart showing digital vs. physical incidents per day with actual data dates |
| **🚨 Emergency Broadcast** | One-tap "I NEED HELP" / "I'M SAFE" buttons that instantly broadcast to ALL Safe Circles |
| **👁️ Elderly Mode** | Toggle that increases all font sizes for accessibility — serves the elderly target audience directly |
| **🔒 Safe Circles** | Create groups of trusted contacts, share status updates, encrypted badges on messages |
| **🌐 Cybersecurity Background** | Animated binary rain, hex grid, floating security icons, circuit traces — reinforces the security theme |

---

## 📊 Success Metrics — How Each Is Addressed

### 🧘 Anxiety Reduction — Does the app feel empowering, not alarming?
- **Calm language everywhere** — the app never uses alarming words. Instead of "DANGER", it says "elevated activity detected"
- **Safety scores are encouraging** — showing "74/100" feels informative, not scary
- **Action checklists on every alert** — users get specific steps they can take ("Change passwords", "Enable 2FA", "Report to FTC") instead of just being told something is wrong
- **Noise filtering removes panic** — community reports full of venting and anger get filtered out, leaving only verified actionable information

### 🎯 Contextual Relevance — Are alerts specific to the user's location?
- **Location-based filtering** — dashboard shows data ONLY for the selected neighborhood (Elmwood Village, North Buffalo, etc.)
- **Safety score per location** — each area has its own score based on its specific incidents
- **Trend chart per location** — tracks digital vs physical incidents for that specific area over time
- **Threat radar shows all locations at once** — visual overview of which neighborhoods need attention
- **Type filtering** — users can filter by digital-only or physical-only threats

### 🔐 Trust & Privacy — Is user location data kept secure?
- **API keys in `.env` file** — never committed to git. `.env` is in `.gitignore`
- **`.env.example` has placeholder only** — no real keys in the repo
- **No real user data collected** — uses synthetic dataset only
- **No tracking or analytics** — the app doesn't phone home or send user behavior data anywhere
- **Everything runs client-side** — no backend server storing user data
- **Safe Circles encrypt badge** — messages show encryption indicators (simulated for demo)

### 🧠 AI Application — Is AI used appropriately with clear fallback?
- **4 distinct AI capabilities** — Summarize, Categorize (noise filtering), Extract (scam scanner), and Forecast (threat prediction)
- **Every single AI feature has a complete rule-based fallback** — the app is 100% functional without an API key
- **Clear visual indicators** — when fallback is used, a badge says "Rule-based" instead of "AI-powered"
- **AI errors handled gracefully** — API failures don't crash the app, they silently fall back
- **Appropriate use** — AI is used where it adds real value (understanding messy community posts, detecting scam patterns), not just for decoration

---

## ✅ Minimum Requirements Checklist

| Requirement | Status | Where |
|------------|--------|-------|
| Core flow (Create + View + Update + Search) | ✅ | Dashboard, Reports tab — full CRUD + search |
| AI Integration | ✅ | GPT-3.5 for noise filtering, scam detection, forecasting, chat |
| AI Fallback | ✅ | `ruleBasedFilter()`, `ruleBasedScamCheck()`, `ruleBasedForecast()` in `helpers.js` |
| Input validation | ✅ | Report modal validates text isn't empty, buttons disable when invalid |
| Clear error messages | ✅ | API failures show fallback results with badge, not cryptic errors |
| At least 2 tests | ✅ | 7 tests — happy path AND edge cases for filter, scam check, safety score |
| Synthetic data only | ✅ | `sample_incidents.json` — 25 hand-written reports, no scraped data |
| No API keys committed | ✅ | `.env` in `.gitignore`, `.env.example` has placeholder only |
| README (not boilerplate) | ✅ | This document |

---

## 🤖 AI Disclosure

- **Did I use an AI assistant?** Yes — Claude (Anthropic) was used for code development help
- **How I verified suggestions:** Tested every feature manually in the browser, wrote 7 unit tests, and checked edge cases. When AI-generated code had issues, I fixed them
- **Example of a rejected suggestion:** The AI initially put all helper functions inside the React component, which caused unnecessary re-renders on every state change. I moved them into a separate `helpers.js` module for better performance and testability

---

## ⚖️ Tradeoffs & Prioritization

### What I cut to stay within the time limit
- Real end-to-end encryption for Safe Circles (simulated with badges instead)
- Backend database (using in-memory state — resets on refresh)
- User authentication / login system
- Real geolocation (dropdown selection instead)

### What I'd build next with more time
- PostgreSQL backend so data persists across sessions
- Real E2E encryption using Web Crypto API
- Push notifications for new alerts in your area
- Geolocation API for automatic location detection
- Community upvote/verification system for crowdsourced report validation
- Progressive Web App (PWA) for offline access

### Known limitations
- Data resets on page refresh (no backend persistence)
- AI features need a valid OpenAI API key (rule-based fallbacks work perfectly without one)
- Encryption badges are simulated, not real E2E encryption

---

## 📁 Project Structure

```
community-guardian/
├── public/
│   └── index.html              Page title + meta tags
├── src/
│   ├── App.jsx                 Main component — all tabs, UI, state
│   ├── App.test.js             7 unit tests (filter, scam, scoring)
│   ├── helpers.js              AI API calls + rule-based fallbacks + scoring logic
│   ├── styles.js               Color tokens, glassmorphism, theme config
│   ├── data/
│   │   └── sample_incidents.json   25 synthetic Buffalo NY reports
│   ├── index.js                Entry point
│   └── index.css               Base styles + animations
├── DOCUMENTATION.md            Design documentation (this submission)
├── .env.example                Environment variable template (no real keys)
├── .gitignore                  Includes .env for security
├── package.json
└── README.md
```

---

<div align="center">

Made for safer communities

</div>
