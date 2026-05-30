require('dotenv').config();
const express = require('express');
const compression = require('compression');
const path = require('path');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// Models
const User = require('./models/User');
const Progress = require('./models/Progress');

const app = express();
const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'summer_study_hub_super_secret_key_2026';
const startTime = Date.now();

// Middleware
app.use(compression());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Database Connection with Graceful Fallback
let isDbConnected = false;
const MONGODB_URI = process.env.MONGODB_URI;

if (MONGODB_URI) {
  mongoose.connect(MONGODB_URI)
    .then(() => {
      console.log('  🟢 Connected to MongoDB Atlas successfully.');
      isDbConnected = true;
    })
    .catch(err => {
      console.error('  🔴 MongoDB connection failed:', err.message);
      console.log('  ⚠️ Server running. DB-dependent features will return warning states.');
    });
} else {
  console.log('  ⚠️ MONGODB_URI is not set in environment. Running in Local Storage mode.');
}

// JWT Authentication Middleware
const authenticateJWT = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (authHeader) {
    const token = authHeader.split(' ')[1];
    jwt.verify(token, JWT_SECRET, (err, user) => {
      if (err) return res.status(403).json({ error: 'Session expired. Please log in again.' });
      req.user = user;
      next();
    });
  } else {
    res.status(401).json({ error: 'Access denied. Authorization token missing.' });
  }
};

// ── HEALTH & STATUS ENDPOINT ──
app.get('/api/health', (req, res) => {
  const uptimeMs = Date.now() - startTime;
  const uptimeSec = Math.floor(uptimeMs / 1000);
  const hours = Math.floor(uptimeSec / 3600);
  const minutes = Math.floor((uptimeSec % 3600) / 60);
  const seconds = uptimeSec % 60;

  res.json({
    status: 'ok',
    database: isDbConnected ? 'connected' : 'disconnected (local storage active)',
    uptime: `${hours}h ${minutes}m ${seconds}s`,
    timestamp: new Date().toISOString(),
    version: '1.1.0'
  });
});

// ── AUTHENTICATION API ──

// Register
app.post('/api/auth/register', async (req, res) => {
  if (!isDbConnected) {
    return res.status(503).json({ error: 'Database offline. Registration is temporarily unavailable.' });
  }

  const { username, password } = req.body;
  if (!username || !password || username.trim().length < 3 || password.length < 5) {
    return res.status(400).json({ error: 'Username (min 3 chars) and Password (min 5 chars) are required.' });
  }

  try {
    const existingUser = await User.findOne({ username: username.toLowerCase().trim() });
    if (existingUser) {
      return res.status(400).json({ error: 'Username is already taken.' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = new User({
      username: username.toLowerCase().trim(),
      password: hashedPassword
    });

    await user.save();

    // Create empty progress card for user
    const progress = new Progress({ userId: user._id });
    await progress.save();

    const token = jwt.sign({ id: user._id, username: user.username }, JWT_SECRET, { expiresIn: '30d' });
    res.status(201).json({ token, username: user.username });
  } catch (err) {
    res.status(500).json({ error: 'Server error during registration.' });
  }
});

// Login
app.post('/api/auth/login', async (req, res) => {
  if (!isDbConnected) {
    return res.status(503).json({ error: 'Database offline. Login is temporarily unavailable.' });
  }

  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ error: 'Username and Password are required.' });
  }

  try {
    const user = await User.findOne({ username: username.toLowerCase().trim() });
    if (!user) {
      return res.status(400).json({ error: 'Invalid username or password.' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ error: 'Invalid username or password.' });
    }

    const token = jwt.sign({ id: user._id, username: user.username }, JWT_SECRET, { expiresIn: '30d' });
    res.json({ token, username: user.username });
  } catch (err) {
    res.status(500).json({ error: 'Server error during login.' });
  }
});

// ── PROGRESS STORAGE API ──

// Load Progress
app.get('/api/progress', authenticateJWT, async (req, res) => {
  if (!isDbConnected) {
    return res.status(503).json({ error: 'Database offline.' });
  }

  try {
    let progress = await Progress.findOne({ userId: req.user.id });
    if (!progress) {
      progress = new Progress({ userId: req.user.id });
      await progress.save();
    }
    res.json(progress);
  } catch (err) {
    res.status(500).json({ error: 'Server error fetching progress.' });
  }
});

// Save / Sync Progress
app.post('/api/progress', authenticateJWT, async (req, res) => {
  if (!isDbConnected) {
    return res.status(503).json({ error: 'Database offline.' });
  }

  const { completed, streak, bestStreak, lastActiveDate, xp, heatmap, notes, theme, studySessions, subjects, customResources } = req.body;

  try {
    const progress = await Progress.findOneAndUpdate(
      { userId: req.user.id },
      {
        $set: {
          completed: completed || {},
          streak: streak || 0,
          bestStreak: bestStreak || 0,
          lastActiveDate: lastActiveDate || null,
          xp: xp || 0,
          heatmap: heatmap || {},
          notes: notes || {},
          theme: theme || 'cyber',
          studySessions: studySessions || [],
          subjects: subjects || ['DSA', 'ML'],
          customResources: customResources || []
        }
      },
      { new: true, upsert: true }
    );
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Server error saving progress.' });
  }
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
      // Periodic ping logged silently
    });
  }).on('error', (err) => {
    console.log(`[Pinger] Self-ping failed: ${err.message}`);
  });
}, SELF_PING_INTERVAL);

app.listen(PORT, () => {
  console.log(`\n  ⚡ Summer Study Hub running at http://localhost:${PORT}\n`);
});
