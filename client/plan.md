# 🤖 TalkMe-AI — Personal Jarvis AI Agent Plan

> **Tagline:** *"Your Free Personal AI Agent — Always On, Always Helpful."*
> **Vision:** A Jarvis-like AI agent that talks, teaches, coaches, and solves — completely free, on any device.

---

## 📌 1. What Is This Project?

TalkMe-AI is a **voice-first personal AI agent** that works like Jarvis from Iron Man.
It runs in the browser — no app download needed — and is 100% free using free-tier APIs.

### ✅ What It Can Do (Full Feature List)

| Category | Features |
|----------|----------|
| 🗣️ **Voice Agent** | Talk in any language, instant voice reply, barge-in, silence detection |
| 🎓 **English Coach** | Grammar fix, vocabulary, pronunciation tips, CEFR level tracking |
| 💼 **Interview Prep** | Mock HR/Tech interviews, feedback, sample answers |
| 💻 **Coding Tutor** | Solve coding problems, explain concepts, debug code |
| 🧑‍🏫 **AI Teacher** | Any subject — Math, Science, History, etc. |
| 🚀 **Career Advisor** | Resume tips, career roadmaps, skill gap analysis |
| 🌐 **Multilingual** | Hindi, Tamil, Telugu, Bangla, English + 50+ langs |
| 📱 **Mobile + Desktop** | PWA — installable, works offline shell |
| 🔒 **100% Free** | Gemini free tier, no credit card, no paywall |

---

## 🎯 2. Core Principles

- ✅ **Immediate Response** — Voice reply starts in < 1 second
- ✅ **Free Forever** — Gemini Flash free tier (1500 req/day)
- ✅ **Voice First** — Speak → AI speaks back (like a real agent)
- ✅ **Any Language** — Understands and replies in your language
- ✅ **Zero Friction** — No login required to start, just open and talk
- ✅ **Mobile + Desktop** — PWA, installable on phone home screen

---

## 🏗️ 3. Architecture Overview

```
USER (Browser — Mobile or Desktop)
   🎤 Mic → Web Speech API → Live Transcript
   ↓ (1.5s silence OR Enter)
   📝 POST /api/chat (Next.js Streaming)
   ↓
   🤖 Gemini 2.0 Flash (Free) → Streaming Response
   ↓
   🔊 SpeechSynthesis API → Instant voice reply
   ↓
   📝 Feedback Panel (grammar, code, career tips)
   ↓
   💾 MongoDB Atlas (free 512MB) — saves conversation

FREE APIs USED:
┌──────────────────┬────────────────────────┬──────────────────┐
│ Service          │ Free Limit             │ What It Does     │
├──────────────────┼────────────────────────┼──────────────────┤
│ Gemini 2.0 Flash │ 1500 req/day, 15 RPM   │ AI Brain         │
│ Web Speech API   │ Unlimited (browser)    │ Voice Input      │
│ SpeechSynthesis  │ Unlimited (browser)    │ Voice Output     │
│ MongoDB Atlas    │ 512MB free             │ Chat History     │
│ Upstash Redis    │ 10K cmds/day           │ Rate Limiting    │
│ Vercel           │ 100GB/mo free          │ Hosting          │
│ better-auth      │ Free (self-hosted)     │ Auth (optional)  │
└──────────────────┴────────────────────────┴──────────────────┘
Total Cost: ₹0/month
```

---

## 🧠 4. AI Agent Modes (Jarvis Personas)

| Mode | Persona | What It Does | Trigger |
|------|---------|-------------|---------|
| 🎙️ **Free Talk** | Friendly AI | General conversation | "Let's talk" |
| 🎓 **English Coach** | Strict coach | Grammar, fluency, vocabulary | "Fix my English" |
| 💼 **Interview Prep** | HR Manager | Mock interviews + feedback | "Interview me" |
| 💻 **Coding Tutor** | Senior Dev | DSA, debug, explain code | "Help me code" |
| 🧑‍🏫 **AI Teacher** | Professor | Any subject teaching | "Teach me" |
| 🚀 **Career Advisor** | Mentor | Resume, roadmap, skills | "Career advice" |
| 🌍 **Translate** | Interpreter | Live translation | "Translate" |
| 🧘 **Daily Standup** | PM | Plan your day, set goals | "Plan my day" |

---

## 🎤 5. Voice Agent — How It Works

### Input Flow
```
User taps mic button
   ↓
Web Speech API starts (continuous: true, interimResults: true)
   ↓
Live transcript shown word-by-word
   ↓
1.5 seconds of silence → auto-submit (hands-free!)
OR user presses Enter/Stop
   ↓
POST /api/chat with { message, mode, history, language }
```

### Output Flow (Immediate < 500ms)
```
Gemini streams response token-by-token
   ↓
Sentence splitter: split on ". " "! " "? "
   ↓
First sentence → SpeechSynthesis.speak() immediately!
   ↓
Continue streaming + speaking sentence by sentence
   ↓
User speaks → AI pauses (barge-in)
   ↓
Parse full JSON at stream end → show feedback panel
```

### Barge-In (Jarvis feel)
```typescript
recognition.onresult = (event) => {
  const transcript = event.results[event.resultIndex][0].transcript;
  if (speechSynthesis.speaking && transcript.length > 2) {
    speechSynthesis.cancel(); // AI stops talking immediately
  }
};
```

---

## 💻 6. Coding Problem Solver

### User Flow
1. User says: *"How do I find the longest palindrome in a string?"*
2. AI detects it's a coding question
3. AI responds with:
   - ✅ Plain English explanation (spoken)
   - ✅ Step-by-step approach
   - ✅ Clean code (Python/JS/Java/C++)
   - ✅ Time & Space complexity
   - ✅ Example input/output

### Special Coding UI
- Syntax-highlighted code block
- Copy code button
- "Explain this line" button (future)
- Language selector (Python, JS, Java, C++)

---

## 🎓 7. English Coach Features

### Grammar Correction (Real-time)
```json
{
  "wrong": "I am go to market yesterday",
  "right": "I went to the market yesterday",
  "why": "Past event → use Simple Past tense",
  "severity": "high"
}
```

### Vocabulary Enhancement
```json
{
  "youSaid": "very good",
  "better": "exceptional / outstanding",
  "example": "Your performance was exceptional!"
}
```

### Interview Prep Flow
```
AI: "Tell me about yourself."
User: [speaks]
AI: "Good start! Your answer lacks a clear conclusion.
     Try ending with: 'I'm excited to bring my skills to your team.'
     Grammar score: 72%. Here are 2 corrections..."
```

### CEFR Level Tracking
- A1 → A2 → B1 → B2 → C1 → C2
- Auto-detected from speech complexity
- Shown as badge in UI

---

## 🚀 8. Career Advisor Features

AI acts as a senior career mentor with context about Indian job market:

### Example Conversation
```
User: "I'm a 2nd year CSE student. What should I do for placements?"
AI: "Here's your 6-month roadmap:
     ► Month 1-2: DSA — LeetCode 150 problems
     ► Month 3: System Design basics
     ► Month 4: 2 solid GitHub projects
     ► Month 5: Apply + resume polish
     ► Month 6: Daily mock interviews
     
     Best tech stack: React + Node.js + MongoDB
     OR Java + Spring Boot + MySQL
     
     Want me to quiz you on DSA today?"
```

---

## 🌍 9. Multilingual Support

Web Speech API supports 50+ languages natively.
Gemini 2.0 Flash supports all major languages.

| Language | Voice Input | Voice Output |
|----------|-------------|-------------|
| English | ✅ | ✅ |
| Hindi | ✅ | ✅ |
| Tamil | ✅ | ✅ |
| Telugu | ✅ | ✅ |
| Bengali | ✅ | ✅ |
| Marathi | ✅ | ✅ |
| Spanish | ✅ | ✅ |
| French | ✅ | ✅ |

---

## 🗂️ 10. Folder Structure

```
client/src/
├── app/
│   ├── page.tsx                    # Landing page
│   ├── layout.tsx                  # Root layout + PWA
│   ├── (agent)/
│   │   ├── chat/page.tsx           # Main voice chat ← START HERE
│   │   ├── dashboard/page.tsx      # Stats + streak
│   │   ├── history/page.tsx        # Past conversations
│   │   ├── coding/page.tsx         # Code editor + AI
│   │   ├── career/page.tsx         # Career advisor
│   │   └── settings/page.tsx       # Lang, voice, theme
│   └── api/
│       ├── chat/route.ts           # AI endpoint (streaming)
│       ├── session/route.ts        # Anonymous sessions
│       └── history/route.ts        # Conversation history
│
├── features/
│   ├── voice/
│   │   ├── hooks/
│   │   │   ├── useSpeechRecognition.ts
│   │   │   ├── useSpeechSynthesis.ts
│   │   │   └── useSilenceDetector.ts
│   │   └── components/
│   │       ├── VoiceOrb.tsx         # Animated orb
│   │       ├── LiveTranscript.tsx
│   │       └── Waveform.tsx
│   │
│   ├── agent/
│   │   ├── prompts/
│   │   │   ├── system.ts            # Master system prompt
│   │   │   ├── english-coach.ts
│   │   │   ├── interview.ts
│   │   │   ├── coding.ts
│   │   │   ├── teacher.ts
│   │   │   └── career.ts
│   │   └── services/gemini.ts       # Gemini client
│   │
│   └── chat/
│       └── components/
│           ├── ChatBubble.tsx
│           ├── CodeBlock.tsx        # Syntax highlighted
│           └── FeedbackPanel.tsx
│
├── lib/
│   ├── db.ts                        # MongoDB connection
│   ├── session.ts                   # Cookie sessions
│   ├── rate-limit.ts                # Upstash Redis
│   └── utils.ts
│
└── models/
    ├── Session.ts
    ├── Conversation.ts
    └── Message.ts
```

---

## 🔑 11. Free API Setup Guide

### Step 1: Gemini API (AI Brain) — FREE
```
→ Go to: https://aistudio.google.com/apikey
→ Click "Create API Key"
→ Copy key → add to .env.local
→ Model: gemini-2.0-flash
→ Free: 1500 requests/day, 15 RPM
```

### Step 2: MongoDB Atlas (Database) — FREE
```
→ Go to: https://cloud.mongodb.com
→ Create free M0 cluster (512MB forever free)
→ Create database user
→ Copy connection string → add to .env.local
```

### Step 3: Upstash Redis (Rate Limiting) — FREE
```
→ Go to: https://upstash.com
→ Create free Redis database
→ 10,000 commands/day free
→ Copy REST URL + Token → add to .env.local
```

### Step 4: Vercel (Hosting) — FREE
```
→ Go to: https://vercel.com
→ Connect GitHub repo
→ Add environment variables
→ Deploy! Auto-deploys on every git push
```

### .env.local
```env
# AI (FREE)
GEMINI_API_KEY=your_key_here

# Database (FREE)
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/talkme

# Rate Limiting (FREE)
UPSTASH_REDIS_REST_URL=https://xxx.upstash.io
UPSTASH_REDIS_REST_TOKEN=your_token

# Session Security
SESSION_SECRET=min_32_chars_random_string_here

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

---

## 📅 12. Week-by-Week Build Plan

### ✅ Week 1 — Core Voice Agent (Days 1–7)
**Goal: Talk to AI, AI talks back immediately**

| Day | Task | Output |
|-----|------|--------|
| 1 | .env setup, MongoDB connect, Session model | DB working |
| 2 | `/api/chat` route with Gemini streaming | Text AI response |
| 3 | `useSpeechRecognition` hook (mic → text) | Voice input |
| 4 | `useSpeechSynthesis` + sentence splitter | AI speaks back |
| 5 | Silence detector (1.5s → auto-send) | Hands-free mode |
| 6 | Barge-in + VoiceOrb animated component | Jarvis feel |
| 7 | Basic chat page UI + test on mobile | MVP working |

**✅ Milestone: Full voice conversation loop**

---

### ✅ Week 2 — English Coach Mode (Days 8–14)
**Goal: Real-time grammar + vocabulary correction**

| Day | Task | Output |
|-----|------|--------|
| 8 | Structured coach prompt + Zod schema | JSON AI response |
| 9 | FeedbackPanel component | Grammar shown |
| 10 | Vocabulary suggestions UI | Better words shown |
| 11 | CEFR level badge | Level displayed |
| 12 | Interview prep mode | HR interview flow |
| 13 | Confidence score display | Score shown |
| 14 | Mobile testing all English features | Mobile working |

**✅ Milestone: Real-time English coaching**

---

### ✅ Week 3 — Coding Tutor (Days 15–21)
**Goal: AI solves coding problems, shows code**

| Day | Task | Output |
|-----|------|--------|
| 15 | Coding mode system prompt | AI explains code |
| 16 | CodeBlock component (syntax highlight) | Code displayed |
| 17 | Multi-language support (Py/JS/Java/C++) | Language selector |
| 18 | DSA problem detection + O(n) display | Complexity shown |
| 19 | Step-by-step explanation flow | Clear explanations |
| 20 | Code copy button | Usability feature |
| 21 | Full coding mode polish + test | Coding AI ready |

**✅ Milestone: Voice coding assistant**

---

### ✅ Week 4 — Career + Teacher + Multilingual (Days 22–28)
**Goal: Career advice, teaching, all languages**

| Day | Task | Output |
|-----|------|--------|
| 22 | Career advisor system prompt | Career roadmaps |
| 23 | AI Teacher mode (any subject) | Multi-subject |
| 24 | Language picker UI + settings | Language selector |
| 25 | Web Speech API language switching | Hindi/Tamil/etc. |
| 26 | AI auto-detects user language | Auto-language |
| 27 | All 8 modes fully working | Mode switcher |
| 28 | Conversation history page | History saved |

**✅ Milestone: Full personal AI agent**

---

### ✅ Week 5 — Dashboard + Progress (Days 29–35)
**Goal: Track growth, keep users coming back**

| Day | Task | Output |
|-----|------|--------|
| 29 | Dashboard with streak counter | Streak working |
| 30 | Progress charts | Visual progress |
| 31 | Mistake pattern tracking | Common errors |
| 32 | Daily challenges | Daily goals |
| 33 | XP points + achievements | Gamification |
| 34 | Word bank (saved vocabulary) | Vocab list |
| 35 | Settings (lang, voice, theme) | Full settings |

**✅ Milestone: Retention features ready**

---

### ✅ Week 6 — PWA + Deploy + Launch (Days 36–42)
**Goal: Live on internet, installable on mobile**

| Day | Task | Output |
|-----|------|--------|
| 36 | PWA manifest + service worker | Installable on phone |
| 37 | PWA icons (192px, 512px) | Native app look |
| 38 | Rate limiting (Upstash Redis) | Abuse prevention |
| 39 | Error boundaries + fallbacks | Graceful errors |
| 40 | Landing page (beautiful, animated) | Wow first impression |
| 41 | SEO meta + OG image | Social sharing |
| 42 | Deploy to Vercel 🚀 | LIVE! |

**✅ Milestone: App is LIVE and installable**

---

## 🎨 13. UI Design Plan

### Voice Orb (Main Element)
```
◉ ◉ ◉ ◉ ◉
Pulsing indigo gradient animation
— Idle: slow pulse
— Listening: fast, bright pulse + waveform
— AI Speaking: rainbow shimmer animation
— Thinking: spinning ring
```

### Design System
```
Colors:
  --bg:        #0F0F1A   (deep dark background)
  --surface:   #1A1A2E   (card background)
  --primary:   #6366F1   (indigo — voice orb)
  --secondary: #8B5CF6   (purple — AI messages)
  --success:   #10B981   (emerald — correct)
  --error:     #F43F5E   (rose — grammar error)
  --warning:   #F59E0B   (amber — streak)
  --glass:     rgba(255,255,255,0.05) (glassmorphism)

Typography: Inter + Outfit (Google Fonts)

Effects:
  - Voice orb: pulsing gradient animation (Framer Motion)
  - Messages: fade + slide in
  - Typing indicator: animated 3 dots
  - Code blocks: VS Code dark theme
  - Mode cards: glassmorphism + glow on hover
  - Feedback panel: slide up from bottom (mobile)
```

---

## 🤖 14. Master AI Prompt

```typescript
const SYSTEM_PROMPT = `
You are TalkMe AI — a personal AI agent like Jarvis.
You help with: English learning, interview prep, coding, career advice.

CURRENT MODE: {mode}
USER LANGUAGE: {language}  
USER LEVEL: {level}

RULES:
1. Reply in user's language (unless they ask for English)
2. Keep spoken reply SHORT — 2-3 sentences for voice
3. For coding: always include working code + complexity
4. For English mode: ALWAYS return JSON with grammar fixes
5. Be encouraging, friendly, like a smart friend
6. Career advice: specific to Indian job market

RESPONSE FORMAT (JSON):
{
  "reply": "spoken response — short and natural",
  "displayText": "full formatted markdown text",
  "code": { "language": "python", "content": "..." },
  "grammarFixes": [{ "wrong": "", "right": "", "why": "" }],
  "betterWords": [{ "youSaid": "", "better": "", "example": "" }],
  "confidenceScore": 0-100,
  "cefrLevel": "B1",
  "careerTip": "...",
  "encouragement": "Keep going!"
}
`;
```

---

## 💰 15. Free Tier Math

| Service | Free Limit | Your Usage | Cost |
|---------|-----------|------------|------|
| Gemini | 1500 req/day | ~75 users × 20 msg | ₹0 |
| MongoDB | 512MB | ~500K messages | ₹0 |
| Upstash | 10K cmd/day | Rate checks | ₹0 |
| Vercel | 100GB/mo | Static + API | ₹0 |
| Web Speech | Unlimited | Voice I/O | ₹0 |
| **Total** | — | — | **₹0** |

### Scaling (When Popular)
1. **0–75 users/day:** 100% free ✅
2. **75–300 users/day:** Rotate multiple Gemini keys
3. **300–1000 users/day:** Gemini paid (~$0.075/1M tokens)
4. Cache common questions → save 40% API calls

---

## 📱 16. PWA Setup

### manifest.json
```json
{
  "name": "TalkMe AI — Your Personal Jarvis",
  "short_name": "TalkMe AI",
  "description": "Voice AI agent for learning, coding & career",
  "start_url": "/chat",
  "display": "standalone",
  "background_color": "#0F0F1A",
  "theme_color": "#6366F1",
  "icons": [
    { "src": "/icons/icon-192.png", "sizes": "192x192" },
    { "src": "/icons/icon-512.png", "sizes": "512x512" }
  ]
}
```

### Mobile Benefits
- ✅ Add to Home Screen → looks like native app
- ✅ Full screen, no browser chrome
- ✅ Works offline (shell cached)
- ✅ Fast loading (cached assets)

---

## 🔐 17. Security Checklist

- [ ] Gemini key only in API routes (never `NEXT_PUBLIC_`)
- [ ] `.env.local` in `.gitignore`
- [ ] Rate limit: 20 messages/user/day (Upstash)
- [ ] Zod validation on all inputs
- [ ] Input limit: 1000 characters max
- [ ] HTTPS enforced (Vercel automatic)
- [ ] Session IDs are random UUIDs

---

## 🚀 18. Start TODAY

### Install Missing Package
```bash
cd c:\Users\kushw\Future-Projects\TalkMe-AI\client
npm install @upstash/redis highlight.js
```

### File Creation Order (Follow This)
```
Day 1:
1. src/lib/db.ts              ← MongoDB connection
2. src/lib/session.ts         ← Cookie sessions
3. src/models/Session.ts
4. src/models/Conversation.ts
5. src/app/api/session/route.ts
6. src/app/api/chat/route.ts  ← Gemini streaming

Day 2:
7. src/features/agent/prompts/system.ts
8. src/features/voice/hooks/useSpeechRecognition.ts
9. src/features/voice/hooks/useSpeechSynthesis.ts
10. src/features/voice/hooks/useSilenceDetector.ts

Day 3:
11. src/features/voice/components/VoiceOrb.tsx
12. src/app/(agent)/chat/page.tsx  ← MAIN UI
```

### Day 3 Test (Your First Jarvis Moment!)
- [ ] Open browser, click mic
- [ ] Say: "Hello, who are you?"
- [ ] AI says: "I'm TalkMe AI, your personal assistant!"
- [ ] 🎉

---

## 📊 19. Success Metrics

| Metric | Week 1 | Month 1 | Month 3 |
|--------|--------|---------|---------|
| Voice loop | ✅ | ✅ | ✅ |
| Modes | 1 | 8 | 10+ |
| Users | you | 50+ | 500+ |
| Session length | - | 8 min | 12 min |
| PWA installs | 0 | 20 | 200+ |
| Monthly cost | ₹0 | ₹0 | ₹0 |

---

## ✅ 20. Final MVP Checklist

**Voice**
- [ ] Mic works in Chrome + Mobile Chrome
- [ ] Live transcript visible
- [ ] 1.5s silence → auto-send
- [ ] AI speaks back immediately
- [ ] Barge-in works (user can interrupt AI)

**AI Features**
- [ ] English grammar correction
- [ ] Vocabulary suggestions
- [ ] Interview prep mode
- [ ] Coding problem solver with code
- [ ] Career roadmap advisor
- [ ] Hindi + regional language support

**App Quality**
- [ ] Dark glassmorphism UI (premium look)
- [ ] PWA installable on Android
- [ ] Anonymous sessions (no login needed)
- [ ] Conversation history saved
- [ ] Dashboard with streak counter
- [ ] Stunning landing page
- [ ] Deployed on Vercel

---

> 💡 **Mantra:** *"Talk, Learn, Grow — Your Personal Jarvis, Forever Free."*

**Last Updated:** 2026-10-14 | **Status:** 🔨 Building | **License:** MIT
