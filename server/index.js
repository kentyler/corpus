/**
 * Corpus server entry point
 *
 * Creates pg pool, loads secrets, initializes schema, starts Express.
 */

const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
const config = require('./config');
const { initSchema } = require('./schema');
const { createApp } = require('./app');

async function main() {
  // Create database connection pool
  const pool = new Pool(config.database);

  // Verify connection
  try {
    const result = await pool.query('SELECT NOW()');
    console.log('Database connected:', result.rows[0].now);
  } catch (err) {
    console.error('Database connection failed:', err.message);
    console.error('Check your config.js settings or DATABASE_URL environment variable.');
    process.exit(1);
  }

  // Load secrets
  let secrets = {};
  const secretsPath = path.join(__dirname, '..', 'secrets.json');
  try {
    const content = fs.readFileSync(secretsPath, 'utf8');
    secrets = JSON.parse(content);
    console.log('Secrets loaded');
  } catch (err) {
    console.warn('No secrets.json found — LLM features will be disabled.');
  }

  // Initialize database schema
  await initSchema(pool);

  // Settings directory
  const settingsDir = path.join(__dirname, '..', 'settings');

  // Create and start Express app
  const app = createApp(pool, secrets, settingsDir);
  const port = config.server.port;

  app.listen(port, () => {
    console.log(`Corpus server running on http://localhost:${port}`);
  });
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
