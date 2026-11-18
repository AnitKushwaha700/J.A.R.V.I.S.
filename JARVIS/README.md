# JARVIS V2 — Monorepo

> An intelligent personal assistant platform built with NestJS, Next.js, and React Native in a Turborepo monorepo.

## Architecture

```
jarvis-v2/
├── apps/
│   ├── backend/          # NestJS REST API (Port 3001)
│   ├── web/              # Next.js web app (Port 3000) [Phase 2]
│   └── mobile/           # React Native / Expo app [Phase 3]
├── packages/
│   └── shared-types/     # Shared TypeScript types
├── docker/
│   └── docker-compose.yml
├── .github/
│   └── workflows/ci.yml
├── package.json          # Turborepo root
└── turbo.json
```

## Prerequisites

- **Node.js** >= 20.0.0
- **npm** >= 10.0.0
- **Docker** & **Docker Compose** (for local PostgreSQL + Redis)
- **Git**

## Quick Start

### 1. Clone & Install

```bash
git clone <your-repo-url>
cd jarvis-v2
npm install
```

### 2. Configure Environment

```bash
cp .env.example .env
# Edit .env and fill in your API keys and secrets
```

Required secrets:
| Variable | Description |
|---|---|
| `DATABASE_URL` | PostgreSQL connection string |
| `JWT_SECRET` | At least 32 random characters |
| `REFRESH_TOKEN_SECRET` | At least 32 random characters |
| `GEMINI_API_KEY` | From https://aistudio.google.com/apikey |
| `GROQ_API_KEY` | From https://console.groq.com/keys |

### 3. Start Infrastructure (Docker)

```bash
cd docker
docker compose up -d postgres redis
# Wait ~10 seconds for postgres to be healthy
```

### 4. Run Prisma Migrations

```bash
cd apps/backend
npm run prisma:migrate
```

### 5. Start the Backend

```bash
# From the monorepo root:
npm run backend:dev

# Or from apps/backend:
npm run dev
```

The API will be live at: **http://localhost:3001/api**

Health check: `GET http://localhost:3001/api/health`

---

## API Endpoints (Phase 1)

### Auth
| Method | Path | Description |
|---|---|---|
| POST | `/api/auth/register` | Create new account |
| POST | `/api/auth/login` | Login, receive tokens |
| POST | `/api/auth/refresh` | Rotate refresh token |
| POST | `/api/auth/logout` | Invalidate refresh token |

### Users
| Method | Path | Description |
|---|---|---|
| GET | `/api/users/me` | Get current user profile |
| PATCH | `/api/users/me/preferences` | Update preferences |
| GET | `/api/users/me/usage` | Get today's AI usage stats |

### Health
| Method | Path | Description |
|---|---|---|
| GET | `/api/health` | Service health check |

---

## Development Commands

```bash
# Run everything (all apps in parallel via Turborepo)
npm run dev

# Backend only
npm run backend:dev

# Type-check all packages
npm run typecheck

# Run all tests
npm run test

# Prisma Studio (database GUI)
cd apps/backend && npm run prisma:studio

# Full Docker stack (including backend container)
cd docker && docker compose up -d
```

---

## AI Provider Setup

JARVIS V2 uses a **free-tier-first** multi-provider strategy:

| Provider | Free Tier | Setup |
|---|---|---|
| Google Gemini | 15 req/min | https://aistudio.google.com/apikey |
| Groq Cloud | ~14,400 req/day | https://console.groq.com/keys |
| OpenRouter | Free models available | https://openrouter.ai/keys |
| Ollama (local) | Unlimited | Install from https://ollama.com |

---

## Roadmap

- **Phase 1 (Current)** — Monorepo scaffold, NestJS backend, auth, Prisma schema
- **Phase 2** — AI module (multi-provider streaming), conversations, voice (Edge TTS), memory
- **Phase 3** — Next.js web app with real-time chat UI
- **Phase 4** — React Native mobile app
- **Phase 5** — Tool execution engine, knowledge base, RAG

---

## Tech Stack

| Layer | Technology |
|---|---|
| Monorepo | Turborepo + npm workspaces |
| Backend | NestJS 11, Passport, Prisma 6 |
| Database | PostgreSQL 16 (pgvector for future embeddings) |
| Cache | Redis 7 |
| Auth | JWT (argon2 password hashing, refresh token rotation) |
| AI | Gemini 2.0 Flash, Groq (Llama), OpenRouter, Ollama |
| Voice | Edge TTS (msedge-tts) |
| Types | Shared TypeScript package (`@jarvis/shared-types`) |
| CI | GitHub Actions |
| Container | Docker + Docker Compose |
