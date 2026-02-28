/**
 * Express app factory for Corpus
 *
 * Simplified — no schema routing, no X-Database-ID header.
 * Just cors, JSON parsing, static files, and three route mounts.
 */

const express = require('express');
const cors = require('cors');
const path = require('path');
const { logEvent } = require('./lib/events');

function createApp(pool, secrets, settingsDir) {
  const app = express();

  // Middleware
  app.use(cors());
  app.use(express.json({ limit: '10mb' }));

  // Serve static files from ui/resources/public/
  const publicDir = path.join(__dirname, '..', 'ui', 'resources', 'public');
  app.use(express.static(publicDir));

  // API routes
  app.use('/api/notes', require('./routes/notes')(pool, secrets, settingsDir));
  app.use('/api/config', require('./routes/config')(settingsDir, pool));
  app.use('/api/events', require('./routes/events')(pool, logEvent));

  // Fallback to index.html for SPA routing
  app.get('*', (req, res) => {
    res.sendFile(path.join(publicDir, 'index.html'));
  });

  return app;
}

module.exports = { createApp };
