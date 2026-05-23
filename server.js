const express = require('express');
const compression = require('compression');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;
const startTime = Date.now();

// Middleware
app.use(compression());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Health endpoint for uptime monitoring
app.get('/api/health', (req, res) => {
  const uptimeMs = Date.now() - startTime;
  const uptimeSec = Math.floor(uptimeMs / 1000);
  const hours = Math.floor(uptimeSec / 3600);
  const minutes = Math.floor((uptimeSec % 3600) / 60);
  const seconds = uptimeSec % 60;

  res.json({
    status: 'ok',
    uptime: `${hours}h ${minutes}m ${seconds}s`,
    uptimeMs,
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

// SPA fallback — serve index.html for all non-API routes
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Self-ping to prevent free-tier sleep (every 4 minutes)
const SELF_PING_INTERVAL = 4 * 60 * 1000;
setInterval(() => {
  const http = require('http');
  const url = `http://localhost:${PORT}/api/health`;
  http.get(url, (res) => {
    let data = '';
    res.on('data', chunk => data += chunk);
    res.on('end', () => {
      console.log(`[Pinger] Self-ping OK at ${new Date().toISOString()}`);
    });
  }).on('error', (err) => {
    console.log(`[Pinger] Self-ping failed: ${err.message}`);
  });
}, SELF_PING_INTERVAL);

app.listen(PORT, () => {
  console.log(`\n  ⚡ Summer Study Hub running at http://localhost:${PORT}\n`);
});
