# Corpus

An append-only corpus with multi-model LLM integration. You write entries — thoughts, observations, arguments, questions, fragments. The system reads each new entry against everything that came before and responds with what changed, connected, or was revealed.

Not a chatbot. A second reader's marginalia.

## Architecture

- **Frontend**: ClojureScript/Reagent single-page app
- **Backend**: Node.js/Express
- **Database**: PostgreSQL with pgvector for semantic retrieval
- **LLM**: Multi-provider (Anthropic, OpenAI, Google) with secretary routing

## Features

- **Append-only corpus**: Human entries and LLM responses interleaved in a single table
- **Secretary routing**: A designated LLM reads each entry and decides which model(s) should respond and which sampling strategy to use
- **Corpus sampling**: Similarity, distance, random, time-range, and mixed strategies for selecting context
- **Semantic retrieval**: pgvector embeddings (OpenAI or Google) for finding relevant prior entries
- **Retrieval audit log**: Every context selection is logged with strategy and ranked entries
- **LLM Registry**: Add, edit, and manage multiple LLM providers; designate a secretary
- **Response conditions**: Adjust model, temperature, and sampling per response; retry with different settings
- **Graceful degradation**: Works without API keys — entries save, no LLM responses generated

## Setup

### Prerequisites

- Node.js 18+
- PostgreSQL 15+ with [pgvector](https://github.com/pgvector/pgvector) extension
- Java (for shadow-cljs/ClojureScript compilation)

### 1. Create the database

```sql
CREATE DATABASE corpus;
```

### 2. Configure secrets

Copy `secrets.json.example` to `secrets.json` and fill in your values:

```json
{
  "database": {
    "password": "your-postgres-password"
  },
  "anthropic": {
    "api_key": "sk-ant-..."
  },
  "openai": {
    "api_key": "sk-..."
  },
  "gemini": {
    "api_key": "..."
  }
}
```

Only the database password is required. LLM API keys are optional — add whichever providers you want to use.

### 3. Install dependencies

```bash
cd server && npm install
cd ../ui && npm install
```

### 4. Build the frontend

```bash
cd ui && npx shadow-cljs compile app
```

### 5. Start the server

```bash
cd server && node index.js
```

Open http://localhost:3002.

## Project Structure

```
corpus/
  server/
    index.js          # Entry point
    app.js            # Express app factory
    config.js         # Database/server configuration
    schema.js         # PostgreSQL schema initialization
    lib/
      events.js       # Event logging
      llm-router.js   # Multi-provider LLM caller + secretary routing
      embeddings.js   # OpenAI/Google embedding APIs
    routes/
      notes.js        # Core API: CRUD, LLM responses, sampling, regeneration
      config.js       # Settings read/write
      events.js       # Event log endpoints
  ui/
    src/app/
      core.cljs       # App entry point
      state.cljs      # Reagent state atom
      views/
        main.cljs     # Router
        notes.cljs    # Three-pane notes UI
        llm_registry.cljs  # LLM management
      transforms/     # Pure state transforms
      flows/          # Async flow sequences
      effects/        # HTTP effect layer
  settings/
    config.json       # LLM registry configuration
```

## License

MIT
