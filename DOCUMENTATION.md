# Design Documentation — GuardianAI

## 1. Project Overview

GuardianAI is a neighborhood safety platform focused on community safety and digital wellness. The core problem: people are overwhelmed by scattered safety information across news sites and social media, leading to either alert fatigue or unnecessary anxiety.

This app solves that by aggregating local safety data and using AI to filter noise from signal — turning messy community reports into calm, actionable safety digests.

The app is built in React, uses OpenAI GPT-3.5 for AI features, and is themed around cybersecurity with a dark mode interface. Every AI feature has a complete rule-based fallback, so the app works fully without an API key.

---

## 2. Target Audience

I designed for three specific user groups. Here's how each is served:

### Neighborhood Groups
**Need:** Track local trends without social media toxicity  
**Solution:** The Dashboard tab filters out noise (venting, off-topic posts) and shows only verified incidents with severity levels. The 7-Day Trend Chart tracks patterns. The Threat Radar gives a visual overview of all neighborhoods at once.

### Remote Workers
**Need:** Local network security and home safety awareness  
**Solution:** The Scam Scanner lets them paste suspicious emails/texts for instant analysis. Digital threat alerts cover phishing, data breaches, and ransomware. The AI Chat answers specific security questions.

### Elderly Users
**Need:** Simplified, non-scary alerts about scams and hazards  
**Solution:** The Elderly Mode toggle (👁️ A+ button in navbar) increases all font sizes across the app for readability. The language throughout is calm and empowering — never alarming. Action checklists give clear, simple steps.

---

## 3. Architecture

```
┌─────────────────────────────────────────────┐
│              User Interface                  │
│              App.jsx (640 lines)             │
│                                              │
│   ┌──────────┐  ┌───────────┐  ┌──────────┐ │
│   │Dashboard │  │Threat     │  │Scam      │ │
│   │Tab       │  │Radar Tab  │  │Scanner   │ │
│   ├──────────┤  ├───────────┤  ├──────────┤ │
│   │Safe      │  │Reports    │  │Locations │ │
│   │Circles   │  │Tab (CRUD) │  │Tab       │ │
│   └──────────┘  └───────────┘  └──────────┘ │
│                                              │
│   ┌──────────────────┐  ┌─────────────────┐  │
│   │Floating AI Chat  │  │Elderly Mode     │  │
│   └──────────────────┘  └─────────────────┘  │
└──────────────┬──────────────────┬────────────┘
               │                  │
    ┌──────────▼──────────┐  ┌───▼────────────┐
    │   helpers.js        │  │   styles.js    │
    │                     │  │                │
    │ • getAIDigest()     │  │ • colors       │
    │ • detectScamAI()    │  │ • glass        │
    │ • getAIForecast()   │  │ • input/label  │
    │ • askAssistant()    │  │ • sevConfig    │
    │ • ruleBasedFilter() │  │ • elderlyMode  │
    │ • ruleBasedScamChk()│  └────────────────┘
    │ • ruleBasedForecast│
    │ • calcSafetyScore() │
    │ • getTrendData()    │
    └──────────┬──────────┘
               │
    ┌──────────▼──────────┐
    │  sample_incidents   │
    │  .json (25 records) │
    └─────────────────────┘
```

### Why this structure?
- **App.jsx** — Single component handles all UI. For a 5-hour challenge, splitting into 15 component files adds overhead without benefit. Everything is in tabs, easy to navigate.
- **helpers.js** — All business logic extracted here. AI calls, rule-based fallbacks, scoring, trend calculation. This makes the logic testable independent of React.
- **styles.js** — Design tokens (colors, glassmorphism, input styles) in one file. Change `colors.green` once, it updates everywhere.
- **sample_incidents.json** — Synthetic data layer. 25 records, each with id, type, raw text, location, and date.

### Data flow
1. App loads 25 incidents from JSON into React state
2. User selects a location → safety score and trend chart update
3. User clicks "Analyze Threats" → app calls OpenAI API (or falls back to rule-based filter)
4. Filtered results render as cards with severity badges, summaries, and action steps
5. User can create/edit/delete/search reports — all update the same state array

---

## 4. Design Choices

### Cybersecurity Theme
- **Colors:** Dark background (#0a0f0a), matrix green (#00ff88), cyan (#00e5ff), purple (#a855f7)
- **Typography:** JetBrains Mono monospace font — gives a "terminal" feel
- **Cards:** Glassmorphism with semi-transparent backgrounds, subtle borders, backdrop blur
- **Background effects:** Binary rain (0s and 1s falling), hex grid pattern, floating security icons (🔒🛡️), circuit board traces with SVG, scan-line animation
- **Why:** The theme reinforces the security/safety purpose of the app. Users instantly understand this is a security tool.

### Calm, Empowering Tone
- Never says "DANGER" or "WARNING" in alarming ways
- Safety scores feel informative, not scary (74/100 reads as "mostly safe")
- Every alert comes with actionable steps the user can take
- Noise filtering removes panicky community posts, only showing verified information
- This directly addresses the **Anxiety Reduction** success metric

### Elderly-Friendly Mode
- A single toggle (👁️ A+ in navbar) increases font sizes across every element
- Bigger buttons, more readable text, higher contrast
- Serves the elderly target audience directly

### Location-Based Everything
- Dashboard, safety score, trend chart — all filtered by selected location
- 10 Buffalo NY neighborhoods as default locations
- Users can add custom locations too
- This addresses the **Contextual Relevance** success metric

---

## 5. AI Integration — Detailed Breakdown

### How AI is used (4 capabilities)

| Capability | Feature | What the AI does | Fallback |
|-----------|---------|-----------------|----------|
| **Summarize** | Dashboard filter | Reads all reports, generates 1-sentence summaries | Keeps original text |
| **Categorize** | Dashboard filter | Assigns severity (high/medium/low), separates noise from signal | Regex keyword matching |
| **Extract** | Scam Scanner | Identifies red flags, verdict, confidence from suspicious text | Pattern matching (urgency, financial bait, phishing words) |
| **Forecast** | Threat Radar | Predicts next 7 days of threats per location | Statistical analysis of incident counts and types |

### Fallback design philosophy
Instead of showing "AI unavailable" errors, every feature has a **complete rule-based alternative** that produces useful results. The UI shows a clear badge ("Rule-based" vs "AI-powered") so users always know which method was used. This means:
- Judges can test every feature immediately without an API key
- The app never breaks if the API is down
- Users aren't left with zero information if AI fails

### API key handling
- Key stored in `.env` file as `REACT_APP_OPENAI_KEY`
- `.env` is in `.gitignore` — never committed
- `.env.example` contains placeholder text only
- If key is missing, app silently uses fallbacks

---

## 6. Feature Deep Dives

### Threat Radar (standout feature)
An interactive SVG radar visualization that shows ALL neighborhoods at once:
- Each neighborhood is a node positioned around a central hub
- **Node size** scales with incident count
- **Node color** indicates risk: green (low), amber (medium), red (high)
- **Pulse rings** animate around medium/high risk areas
- **Connection lines** from each node to the center hub
- **Rotating sweep line** like a real radar display
- **Labels** show location name, report count, and safety score

Below the radar: AI Threat Forecast button that generates 7-day predictions, showing overall trend, top risk area, and an AI insight. This combines visual impact with practical predictive value.

### Safety Score Algorithm
```
Base score: 95
For each incident at the location:
  - Calculate recency (1.0 for today, 0.2 for 7+ days old)
  - Determine severity weight:
      breach/ransomware = 12 points
      phishing/scam/fake = 8 points
      other = 5 points
  - Penalty = severity × recency
Final score: max(5, min(95, 95 - total_penalty))
```
Displayed as an animated SVG arc gauge with color gradient.

### Emergency Broadcast
"I NEED HELP" and "I'M SAFE" buttons that work without typing a name (defaults to "EMERGENCY"). One tap sends to ALL Safe Circles simultaneously. Designed for real emergencies where typing isn't practical.

---

## 7. Testing Strategy

7 unit tests in `App.test.js`:

| Test | Type | What it verifies |
|------|------|-----------------|
| `ruleBasedFilter` keeps actionable alerts | Happy path | Phishing/breach reports are preserved |
| `ruleBasedFilter` removes off-topic noise | Edge case | Posts about pizza/coffee are filtered out |
| `ruleBasedFilter` assigns correct severity | Happy path | "breach" → high, "phishing" → medium |
| `ruleBasedScamCheck` detects scam patterns | Happy path | Messages with "act now" + "gift card" → SCAM |
| `ruleBasedScamCheck` handles legit messages | Edge case | Normal text → LEGITIMATE |
| `calcSafetyScore` returns high for safe area | Happy path | Location with no incidents → 95 |
| `calcSafetyScore` returns low for risky area | Edge case | Location with recent breaches → lower score |

**Why I focused on `helpers.js`:** This is where the logic lives. If filtering breaks, users see wrong data. If scoring breaks, safety scores are misleading. UI rendering is less likely to have subtle bugs.

---

## 8. Data Design

25 synthetic incident reports in `sample_incidents.json`. Each record:
```json
{
  "id": 1,
  "type": "digital",
  "raw": "Phishing emails targeting KeyBank customers in Elmwood Village area",
  "location": "Elmwood Village",
  "date": "2026-03-03"
}
```

**Design decisions:**
- Set in **Buffalo, NY** with real neighborhoods (Elmwood Village, Allentown, North Buffalo, etc.)
- Mix of **digital** (phishing, ransomware, scams) and **physical** (theft, break-ins, suspicious activity)
- Some intentionally **noisy** records ("LOL anyone else love the new coffee shop?") to test the AI filter
- Dates span **5 days** (March 3-7) so the trend chart has meaningful variation
- All hand-written — no scraped data

---

## 9. Tradeoffs & Decisions

### Client-side only — no backend
I skipped building a backend. Data lives in `useState` and resets on refresh. This freed up time to build 4 AI features, the threat radar, and the cybersecurity theme. For a demo, this works fine. Production would need PostgreSQL + Express.

### GPT-3.5 instead of GPT-4
3.5 is 10x cheaper and responds faster. For summarizing community posts and checking scam patterns, the quality gap doesn't justify the cost. If this were production, I'd probably use 4 for the scam scanner where accuracy matters more.

### No real encryption
Safe Circles shows "encrypted" badges but uses no actual encryption. Web Crypto API would take significant time to implement correctly, and the feature was lower priority than AI + visualization. I made this explicit in the UI rather than pretending it's secure.

### No authentication
No login system — everyone sees the same data. I prioritized the AI features and radar visualization over auth infrastructure, since this is a single-user demo.

### Inline styles over CSS framework
Tailwind or styled-components would scale better in a larger app, but inline styles with shared tokens in `styles.js` were the fastest path to a consistent theme. For a single-component app with one design system, it works.

### Rule-based fallbacks over "try again" errors
Instead of showing "AI unavailable, try again later", I built complete rule-based alternatives. More work upfront, but it means the app is 100% functional for anyone testing it, whether they have an API key or not.

---

## 10. Security Practices

| Practice | Implementation |
|----------|---------------|
| API key protection | `.env` file, listed in `.gitignore`, never committed |
| `.env.example` | Contains placeholder text `your_openai_api_key_here` only |
| No real user data | All 25 records are synthetic/hand-written |
| No tracking | No analytics, no cookies, no external tracking scripts |
| Client-side only | No backend server storing or transmitting user data |
| Input sanitization | React's built-in XSS protection via JSX escaping |

---

## 11. Responsible AI

GuardianAI uses AI to help communities stay safe, but AI must be used responsibly. Here's how we approach ethical considerations, security, and limitations:

### Ethical Considerations
- **Calm, non-alarmist language** — AI-generated summaries and alerts are designed to inform, not frighten. We deliberately avoid fear-based messaging that could cause unnecessary panic in communities.
- **No profiling or discrimination** — The system reports on incidents by location and type only. It never profiles individuals, demographics, or communities. Safety scores reflect incident data, not judgments about neighborhoods or people.
- **Human oversight** — AI outputs are clearly labeled. Users always see whether results are "AI-powered" or "Rule-based," empowering them to apply their own judgment rather than blindly trusting automated analysis.
- **Inclusive design** — Elderly Mode ensures the platform is accessible to older adults who are disproportionately targeted by scams. The app serves all community members, not just tech-savvy users.

### Bias Awareness
- **Training data limitations** — GPT-3.5 may carry biases from its training data. Scam detection and threat categorization could reflect biases in how security incidents are reported in training corpora.
- **Synthetic test data** — Our 25 sample incidents are hand-written to be balanced across digital and physical threat types, avoiding over-representation of any category.
- **Rule-based fallbacks as bias mitigation** — When AI is unavailable, the rule-based alternatives use transparent, auditable keyword matching. Users can inspect exactly why a report was categorized a certain way.

### Transparency
- **Clear AI labeling** — Every AI-generated result displays a visible badge indicating whether it was produced by AI or by rule-based logic. Users are never misled about the source of analysis.
- **No black-box decisions** — Safety scores use a documented, deterministic algorithm (base score minus recency-weighted severity penalties). The formula is explained in this documentation and produces consistent, reproducible results.
- **Open source** — The entire codebase is available for inspection on GitHub. Nothing is hidden behind proprietary services.

### Data Privacy & Security
- **No personal data collection** — The app collects zero personal information. All incident data is synthetic.
- **No tracking** — No analytics, cookies, or external tracking scripts are used.
- **API key protection** — OpenAI API keys are stored in `.env` files excluded from version control via `.gitignore`.
- **Client-side processing** — All data processing happens in the browser. No user data is sent to external servers (except OpenAI API calls for AI features, which contain only incident text — never user information).
- **Input sanitization** — React's built-in JSX escaping protects against XSS attacks.

### Known Limitations
- **AI accuracy is not guaranteed** — GPT-3.5 may occasionally miscategorize threats, miss scam patterns, or generate inaccurate forecasts. Users should treat AI outputs as supplementary information, not definitive assessments.
- **No real-time data** — The app works with static sample data and does not connect to live incident feeds or emergency services.
- **No encryption** — Safe Circles displays "encrypted" badges for UI demonstration purposes, but does not implement actual end-to-end encryption. Users should not share sensitive personal information through this feature.
- **Single-user demo** — There is no authentication or authorization system. In a production environment, role-based access control would be essential to prevent misuse.
- **Geographic scope** — Current data is limited to Buffalo, NY neighborhoods. The system has not been tested for scalability across broader regions.

---

## 12. What I'd Build Next

If I had more time:
- **PostgreSQL backend** — persistent data so reports don't disappear on refresh
- **Real E2E encryption** — Web Crypto API for Safe Circles messages
- **Push notifications** — alert users when new incidents match their area
- **Geolocation API** — auto-detect user's neighborhood instead of dropdown
- **Community voting** — let users upvote/verify reports to crowdsource accuracy
- **PWA** — offline access and mobile-app-like experience
- **Admin dashboard** — moderation tools for community managers
