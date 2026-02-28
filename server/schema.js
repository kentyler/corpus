/**
 * Database schema initialization for Corpus
 *
 * Creates the shared schema, events table, corpus tables,
 * and pgvector extension.
 */

const SCHEMA_SQL = `
-- Shared schema
CREATE SCHEMA IF NOT EXISTS shared;

-- pgvector extension for embeddings
CREATE EXTENSION IF NOT EXISTS vector;

-- ============================================================
-- Events - application event log
-- ============================================================
CREATE TABLE IF NOT EXISTS shared.events (
    id SERIAL PRIMARY KEY,
    event_type VARCHAR(50) NOT NULL,
    source VARCHAR(100),
    database_id VARCHAR(100),
    user_id VARCHAR(100),
    session_id UUID,
    message TEXT,
    details JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_events_type ON shared.events(event_type);
CREATE INDEX IF NOT EXISTS idx_events_created ON shared.events(created_at);

-- ============================================================
-- Corpus Entries - append-only notes corpus (human + LLM interleaved)
-- Global. parent_id links LLM responses to their triggering human entry.
-- ============================================================
CREATE TABLE IF NOT EXISTS shared.corpus_entries (
    id SERIAL PRIMARY KEY,
    entry_type VARCHAR(10) NOT NULL CHECK (entry_type IN ('human', 'llm')),
    content TEXT NOT NULL,
    parent_id INTEGER REFERENCES shared.corpus_entries(id),
    created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_corpus_created ON shared.corpus_entries(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_corpus_parent ON shared.corpus_entries(parent_id) WHERE parent_id IS NOT NULL;

-- Add model_name column for multi-LLM support
ALTER TABLE shared.corpus_entries ADD COLUMN IF NOT EXISTS model_name TEXT;

-- Add embedding column for semantic retrieval (pgvector, 1536 dims)
ALTER TABLE shared.corpus_entries ADD COLUMN IF NOT EXISTS embedding vector(1536);

-- Add response-condition columns
ALTER TABLE shared.corpus_entries ADD COLUMN IF NOT EXISTS temperature REAL;
ALTER TABLE shared.corpus_entries ADD COLUMN IF NOT EXISTS sampling_strategy VARCHAR(30);
ALTER TABLE shared.corpus_entries ADD COLUMN IF NOT EXISTS routing_reasoning TEXT;

-- Expand entry_type to include 'system'
DO $$
BEGIN
  ALTER TABLE shared.corpus_entries DROP CONSTRAINT IF EXISTS corpus_entries_entry_type_check;
EXCEPTION WHEN undefined_object THEN NULL;
END $$;
ALTER TABLE shared.corpus_entries ADD CONSTRAINT corpus_entries_entry_type_check
  CHECK (entry_type IN ('human', 'llm', 'system'));

-- Unified corpus columns: medium, author, recipients, thread_id, session_id, subject, metadata
ALTER TABLE shared.corpus_entries ADD COLUMN IF NOT EXISTS medium VARCHAR(20) DEFAULT 'note';
ALTER TABLE shared.corpus_entries ADD COLUMN IF NOT EXISTS author TEXT;
ALTER TABLE shared.corpus_entries ADD COLUMN IF NOT EXISTS recipients TEXT;
ALTER TABLE shared.corpus_entries ADD COLUMN IF NOT EXISTS thread_id INTEGER REFERENCES shared.corpus_entries(id);
ALTER TABLE shared.corpus_entries ADD COLUMN IF NOT EXISTS session_id TEXT;
ALTER TABLE shared.corpus_entries ADD COLUMN IF NOT EXISTS subject TEXT;
ALTER TABLE shared.corpus_entries ADD COLUMN IF NOT EXISTS metadata JSONB;

-- Partial indexes for unified corpus
CREATE INDEX IF NOT EXISTS idx_corpus_medium ON shared.corpus_entries(medium) WHERE medium != 'note';
CREATE INDEX IF NOT EXISTS idx_corpus_thread ON shared.corpus_entries(thread_id) WHERE thread_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_corpus_session ON shared.corpus_entries(session_id) WHERE session_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_corpus_author ON shared.corpus_entries(author) WHERE author IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_corpus_medium_created ON shared.corpus_entries(medium, created_at DESC) WHERE medium IS NOT NULL;

-- ============================================================
-- Corpus Retrieval Log - tracks which entries were sent as context
-- ============================================================
CREATE TABLE IF NOT EXISTS shared.corpus_retrievals (
    id SERIAL PRIMARY KEY,
    entry_id INTEGER NOT NULL REFERENCES shared.corpus_entries(id),
    strategy VARCHAR(30) NOT NULL DEFAULT 'similarity',
    created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_corpus_retrievals_entry ON shared.corpus_retrievals(entry_id);

CREATE TABLE IF NOT EXISTS shared.corpus_retrieval_entries (
    retrieval_id INTEGER NOT NULL REFERENCES shared.corpus_retrievals(id),
    corpus_entry_id INTEGER NOT NULL REFERENCES shared.corpus_entries(id),
    rank SMALLINT NOT NULL,
    PRIMARY KEY (retrieval_id, corpus_entry_id)
);
CREATE INDEX IF NOT EXISTS idx_corpus_retrieval_entries_corpus ON shared.corpus_retrieval_entries(corpus_entry_id);
`;

/**
 * Initialize the database schema.
 * @param {Pool} pool - PostgreSQL connection pool
 */
async function initSchema(pool) {
  try {
    await pool.query(SCHEMA_SQL);
    console.log('Schema initialized');
  } catch (err) {
    console.error('Schema initialization failed:', err.message);
    throw err;
  }
}

module.exports = { initSchema };
