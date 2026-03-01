# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Corpus is a standalone append-only note-taking system with multi-model LLM integration. You write entries and the system reads each new entry against all prior entries, responding with what changed, connected, or was revealed. It functions as a "second reader's marginalia" rather than a chatbot.

## Architecture

- **Backend**: Node.js/Express on port **3002**, PostgreSQL (`corpus` database) with pgvector
- **Frontend**: ClojureScript/Reagent single-page app

```
server/
├── index.js              # Entry point (loads secrets, initializes DB, starts Express)
├── config.js             # DB/server config (port 3002)
├── app.js                # Express app factory
├── schema.js             # PostgreSQL schema initialization
├── routes/
│   ├── notes.js          # Core API: entries, responses, search, sampling
│   ├── config.js         # Settings read/write (LLM registry)
│   └── events.js         # Event log
└── lib/
    ├── llm-router.js     # Multi-provider LLM caller + secretary routing
    ├── embeddings.js     # OpenAI/Google embedding APIs
    └── events.js         # Event logging
ui/
├── src/app/
│   ├── core.cljs         # App entry point
│   ├── state.cljs        # Reagent state atom
│   ├── views/            # UI components (notes, LLM registry)
│   ├── transforms/       # Pure state transformations
│   ├── flows/            # Async flow sequences
│   └── effects/http.cljs # HTTP effect layer
└── resources/public/     # Compiled static assets served by Express
settings/
└── config.json           # LLM registry (models, secretary designation)
```

## Commands

```bash
# Server
cd server && npm install
cd server && npm start          # Production: node index.js
cd server && npm run dev        # Watch mode: node --watch index.js
npm test                        # Jest tests from root (cd server && npx jest --forceExit)

# UI (requires Java for ClojureScript)
cd ui && npm install
cd ui && npx shadow-cljs compile app    # Build once
cd ui && npx shadow-cljs watch app      # Watch/dev mode
```

Start script: `start-server.ps1` loads `secrets.json`, sets PGPASSWORD, starts server on port 3002.

## Secretary Routing

The secretary model (Claude Opus 4.6, `is_secretary: true` in `settings/config.json`) decides for each entry:

1. **Which models respond** — based on complexity and need for diverse perspectives
2. **Corpus sampling strategy** — how to select prior context:
   - `similarity`: semantically closest entries (default)
   - `distance`: most distant (surface contradictions)
   - `random`: maximum surprise
   - `time_range`: entries from specific period
   - `mixed`: combine strategies

## API Routes (server/routes/notes.js)

| Method | Route | Purpose |
|--------|-------|---------|
| `POST /api/notes` | Create entry + embed + secretary routing + LLM responses |
| `POST /api/notes/log` | Silent log (no response layer) |
| `POST /api/notes/search` | Semantic search with text fallback |
| `GET /api/notes` | Recent entries (default 200) |
| `GET /api/notes/:id` | Single entry + all responses |
| `POST /api/notes/:id/regenerate` | Re-generate with different model/temperature/sampling |
| `POST /api/notes/:id/followup` | Append follow-up Q&A |

## LLM Registry (settings/config.json)

Four models: Claude Opus 4.6 (secretary), Claude Sonnet 4.6, GPT-5.2, Gemini 3.1 Pro. Registry is editable via the UI's config page or directly in `settings/config.json`.

## Configuration

`secrets.json` (required at project root):
```json
{
  "database": { "password": "..." },
  "anthropic": { "api_key": "..." },
  "openai": { "api_key": "..." },
  "gemini": { "api_key": "..." }
}
```
Only database password is required. Without LLM keys, entries save but no responses are generated.

## Key Files

| File | When to read |
|------|-------------|
| `server/routes/notes.js` | Entry creation, embedding, response orchestration |
| `server/lib/llm-router.js` | Secretary routing, multi-provider LLM calls |
| `settings/config.json` | Model registry, secretary designation |
| `server/schema.js` | Database schema (corpus_entries, retrievals) |
| `ui/src/app/state.cljs` | Frontend state management |
| `ui/src/app/views/` | UI components |
