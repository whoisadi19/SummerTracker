/* ═══════════════════════════════════════════════════════════════
   SUMMER STUDY HUB — Core Application Logic
   ═══════════════════════════════════════════════════════════════ */

// ── STATE ──
const STORAGE_KEY = 'summerStudyHub_v1';
let appState = loadState();

function loadState() {
  let state = { 
    completed: {}, theme: 'cyber', streak: 0, bestStreak: 0, lastActiveDate: null, xp: 0, heatmap: {}, notes: {}, checklistData: null
  };
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) state = JSON.parse(raw);
  } catch (e) {}
  
  // Load Auth Session
  const token = localStorage.getItem('ssh_auth_token');
  const username = localStorage.getItem('ssh_auth_username');
  if (token && username) {
    state.user = { token, username };
  } else {
    state.user = null;
  }
  if (!state.subjects) state.subjects = ['DSA', 'ML'];
  if (!state.studySessions) state.studySessions = [];
  return state;
}

function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(appState));
  syncCloudProgress(); // Perform background cloud sync if logged in
}

let isSyncing = false;
async function syncCloudProgress() {
  if (!appState.user || isSyncing) return;
  isSyncing = true;
  try {
    const res = await fetch('/api/progress', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${appState.user.token}`
      },
      body: JSON.stringify({
        completed: appState.completed,
        streak: appState.streak,
        bestStreak: appState.bestStreak,
        lastActiveDate: appState.lastActiveDate,
        xp: appState.xp,
        heatmap: appState.heatmap,
        notes: appState.notes,
        theme: appState.theme,
        studySessions: appState.studySessions,
        subjects: appState.subjects,
        customResources: appState.customResources
      })
    });
    if (res.status === 403) {
      logout(true); // Forced logout for expired session
      showToast('Session expired. Please log in again.');
    }
  } catch (e) {
    console.warn('Cloud database offline or unreachable. Saving locally.');
  } finally {
    isSyncing = false;
  }
}

async function fetchCloudProgress() {
  if (!appState.user) return;
  try {
    const res = await fetch('/api/progress', {
      headers: {
        'Authorization': `Bearer ${appState.user.token}`
      }
    });
    if (res.ok) {
      const cloudData = await res.json();
      
      // Safe merge: take checked items from either local or cloud
      const mergedCompleted = { ...appState.completed, ...(cloudData.completed || {}) };
      
      appState.completed = mergedCompleted;
      appState.streak = Math.max(appState.streak || 0, cloudData.streak || 0);
      appState.bestStreak = Math.max(appState.bestStreak || 0, cloudData.bestStreak || 0);
      appState.xp = Math.max(appState.xp || 0, cloudData.xp || 0);
      
      appState.heatmap = { ...(appState.heatmap || {}), ...(cloudData.heatmap || {}) };
      appState.notes = { ...(appState.notes || {}), ...(cloudData.notes || {}) };
      
      if (cloudData.theme) appState.theme = cloudData.theme;

      // Safe merge studySessions by ID
      const localSessions = appState.studySessions || [];
      const cloudSessions = cloudData.studySessions || [];
      const sessionMap = new Map();
      localSessions.forEach(s => { if (s && s.id) sessionMap.set(s.id, s); });
      cloudSessions.forEach(s => { if (s && s.id) sessionMap.set(s.id, s); });
      appState.studySessions = Array.from(sessionMap.values()).sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));

      // Safe merge subjects using Set
      const localSubjects = appState.subjects || ['DSA', 'ML'];
      const cloudSubjects = cloudData.subjects || [];
      const subjectSet = new Set([...localSubjects, ...cloudSubjects]);
      appState.subjects = Array.from(subjectSet);

      // Safe merge customResources by ID
      const localResources = appState.customResources || [];
      const cloudResources = cloudData.customResources || [];
      const resourceMap = new Map();
      localResources.forEach(r => { if (r && r.id) resourceMap.set(r.id, r); });
      cloudResources.forEach(r => { if (r && r.id) resourceMap.set(r.id, r); });
      appState.customResources = Array.from(resourceMap.values());

      // Save locally and refresh frontend
      localStorage.setItem(STORAGE_KEY, JSON.stringify(appState));
      initTheme();
      renderDashboard();
      if (currentView === 'checklist') renderChecklist();
      else if (currentView === 'schedule') renderSchedule();
      
      renderUserWidget();
    } else if (res.status === 403) {
      logout(true);
    }
  } catch (e) {
    console.warn('Could not fetch cloud data. Running offline in guest mode.');
  }
}

// ── THEME ──
function initTheme() {
  const theme = appState.theme || 'cyber';
  document.documentElement.setAttribute('data-theme', theme);
}

function toggleTheme() {
  const current = document.documentElement.getAttribute('data-theme');
  const next = current === 'cyber' ? 'journal' : 'cyber';
  document.documentElement.setAttribute('data-theme', next);
  appState.theme = next;
  saveState();
  renderHeatmap(); // Re-render to update theme colors
}

// ── SHORTCUTS ──
document.addEventListener('keydown', (e) => {
  if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
  if (e.key === '1') navigate('dashboard');
  if (e.key === '2') navigate('schedule');
  if (e.key === '3') navigate('checklist');
  if (e.key === '4') navigate('resources');
  if (e.key === '5') navigate('pinger');
  if (e.key.toLowerCase() === 'p') togglePomodoro();
  if (e.key.toLowerCase() === 't') toggleTheme();
  if (e.key.toLowerCase() === 's') { 
    e.preventDefault(); 
    navigate('checklist');
    setTimeout(() => document.getElementById('clSearch').focus(), 100); 
  }
});

// ── NAVIGATION ──
let currentView = 'dashboard';

function navigate(view) {
  currentView = view;
  document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
  document.getElementById('view-' + view).classList.add('active');

  document.querySelectorAll('.nav-item, .mob-nav-item').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.view === view);
  });

  if (view === 'dashboard') renderDashboard();
  else if (view === 'schedule') renderSchedule();
  else if (view === 'checklist') renderChecklist();
  else if (view === 'resources') renderResources();
  else if (view === 'pomodoro') renderPomodoroTab();
  else if (view === 'insights') renderInsightsTab();
  else if (view === 'pinger') renderPinger();
}

// ── DATE HELPERS ──
function getTodayInfo() {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const start = new Date(START_DATE);
  const end = new Date(END_DATE);

  const diffMs = today - start;
  const dayIndex = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  const weekIndex = Math.floor(dayIndex / 7);

  const isActive = today >= start && today <= end;
  const isPast = today > end;
  const isFuture = today < start;

  const daysLeft = Math.max(0, Math.ceil((end - today) / (1000 * 60 * 60 * 24)));

  return { today, dayIndex, weekIndex, isActive, isPast, isFuture, daysLeft };
}

function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}

function formatDate(date) {
  const opts = { weekday: 'short', month: 'short', day: 'numeric' };
  return date.toLocaleDateString('en-US', opts);
}

// ── PACING & CURRICULUM HELPERS ──
function getScheduleTargetTasks(dayIndex) {
  const data = getChecklistData();
  if (!data) return 0;

  let target = 0;
  const currentWeekNum = Math.floor(dayIndex / 7) + 1; // 1 to 6
  const currentWeekDay = dayIndex % 7; // 0 to 6

  for (let w = 1; w <= 6; w++) {
    const weekDsa = data.dsa.find(item => item.week === w);
    const weekMl = data.ml.find(item => item.week === w);
    let weekTasksCount = 0;

    if (weekDsa && weekDsa.units) {
      weekDsa.units.forEach(u => {
        if (u.items) weekTasksCount += u.items.length;
      });
    }
    if (weekMl && weekMl.units) {
      weekMl.units.forEach(u => {
        if (u.items) weekTasksCount += u.items.length;
      });
    }

    if (w < currentWeekNum) {
      target += weekTasksCount;
    } else if (w === currentWeekNum) {
      target += Math.round((currentWeekDay / 7) * weekTasksCount);
    }
  }
  return target;
}

function getNextFocusTasks() {
  const data = getChecklistData();
  if (!data) return { nextDsa: null, nextMl: null };

  const dsaWeeks = data.dsa || [];
  const mlWeeks = data.ml || [];

  let nextDsa = null;
  let nextMl = null;

  // Find first incomplete DSA task
  for (const week of dsaWeeks) {
    for (const unit of week.units) {
      for (const item of unit.items) {
        if (!appState.completed || !appState.completed[item.id]) {
          nextDsa = { week: week.week, unitTitle: unit.title, taskText: item.text };
          break;
        }
      }
      if (nextDsa) break;
    }
    if (nextDsa) break;
  }

  // Find first incomplete ML task
  for (const week of mlWeeks) {
    for (const unit of week.units) {
      for (const item of unit.items) {
        if (!appState.completed || !appState.completed[item.id]) {
          nextMl = { week: week.week, unitTitle: unit.title, taskText: item.text };
          break;
        }
      }
      if (nextMl) break;
    }
    if (nextMl) break;
  }

  return { nextDsa, nextMl };
}

function getCurrentWeekPacingInfo(weekNum) {
  const data = getChecklistData();
  if (!data) return { total: 0, done: 0, pct: 0, dates: `Week ${weekNum}` };

  let total = 0;
  let done = 0;
  let dates = `Week ${weekNum}`;

  const dsaWeek = data.dsa.find(w => w.week === weekNum);
  if (dsaWeek) {
    dates = dsaWeek.dates;
    dsaWeek.units.forEach(unit => {
      unit.items.forEach(item => {
        total++;
        if (appState.completed && appState.completed[item.id]) done++;
      });
    });
  }

  const mlWeek = data.ml.find(w => w.week === weekNum);
  if (mlWeek) {
    if (!dsaWeek) dates = mlWeek.dates;
    mlWeek.units.forEach(unit => {
      unit.items.forEach(item => {
        total++;
        if (appState.completed && appState.completed[item.id]) done++;
      });
    });
  }

  return {
    total,
    done,
    pct: total ? Math.round((done / total) * 100) : 0,
    dates
  };
}


// ── PROGRESS & XP ──
function getProgress() {
  let dsaTotal = 0, dsaDone = 0;
  let mlTotal = 0, mlDone = 0;

  if (typeof getChecklistData() !== 'undefined') {
    getChecklistData().dsa.forEach(week => {
      week.units.forEach(unit => {
        unit.items.forEach(item => {
          dsaTotal++;
          if (appState.completed[item.id]) dsaDone++;
        });
      });
    });

    getChecklistData().ml.forEach(week => {
      week.units.forEach(unit => {
        unit.items.forEach(item => {
          mlTotal++;
          if (appState.completed[item.id]) mlDone++;
        });
      });
    });
  }

  const total = dsaTotal + mlTotal;
  const done = dsaDone + mlDone;

  return {
    dsa: { total: dsaTotal, done: dsaDone, pct: dsaTotal ? Math.round((dsaDone / dsaTotal) * 100) : 0 },
    ml: { total: mlTotal, done: mlDone, pct: mlTotal ? Math.round((mlDone / mlTotal) * 100) : 0 },
    overall: { total, done, pct: total ? Math.round((done / total) * 100) : 0 }
  };
}

function getWeekProgress(type, weekNum) {
  if (typeof getChecklistData() === 'undefined') return { total: 0, done: 0 };
  const weekData = getChecklistData()[type].find(w => w.week === weekNum);
  if (!weekData) return { total: 0, done: 0 };

  let total = 0, done = 0;
  weekData.units.forEach(unit => {
    unit.items.forEach(item => {
      total++;
      if (appState.completed[item.id]) done++;
    });
  });
  return { total, done };
}

function updateStreakAndHeatmap() {
  const todayStr = new Date().toISOString().split('T')[0];
  
  if (!appState.heatmap) appState.heatmap = {};
  appState.heatmap[todayStr] = (appState.heatmap[todayStr] || 0) + 1;
  appState.xp = (appState.xp || 0) + 10;

  if (appState.lastActiveDate === todayStr) {
    saveState();
    return;
  }

  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = yesterday.toISOString().split('T')[0];

  if (appState.lastActiveDate === yesterdayStr) {
    appState.streak = (appState.streak || 0) + 1;
  } else if (appState.lastActiveDate !== todayStr) {
    appState.streak = 1;
  }

  appState.lastActiveDate = todayStr;
  if (appState.streak > (appState.bestStreak || 0)) {
    appState.bestStreak = appState.streak;
  }
  saveState();
}

function setRingProgress(id, pct) {
  const circle = document.getElementById(id);
  if (!circle) return;
  const circumference = 2 * Math.PI * 52;
  const offset = circumference - (pct / 100) * circumference;
  circle.style.strokeDashoffset = offset;
}

// ── CONFETTI ──
function shootConfetti() {
  const canvas = document.getElementById('confettiCanvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  
  const particles = [];
  for(let i=0; i<150; i++) {
    particles.push({
      x: canvas.width/2, y: canvas.height/2 + 100,
      r: Math.random()*6+3,
      dx: Math.random()*16-8, dy: Math.random()*-15-5,
      color: ['#00e5ff', '#ff3366', '#fbbf24', '#a855f7', '#4ade80'][Math.floor(Math.random()*5)],
      rot: Math.random()*360
    });
  }
  
  function animate() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    let active = false;
    particles.forEach(p => {
      p.x += p.dx; p.y += p.dy;
      p.dy += 0.4; // gravity
      p.rot += 5;
      if (p.y < canvas.height) active = true;
      
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate((p.rot * Math.PI) / 180);
      ctx.fillStyle = p.color;
      ctx.fillRect(-p.r/2, -p.r/2, p.r, p.r);
      ctx.restore();
    });
    if (active) requestAnimationFrame(animate);
    else ctx.clearRect(0, 0, canvas.width, canvas.height);
  }
  animate();
}

// ── TIMER STATE (POMODORO & CUSTOM) ──
let timerMode = 'pomodoro'; // 'pomodoro' or 'custom'
let timerIsRunning = false;
let timerStartTime = null;
let timerAccumulatedSeconds = 0;
let sessionXpAwarded = 0;
let pomoTimer = null;
let pomoTimeLeft = 25 * 60;
let currentSessionId = null;

function getCustomTargetSeconds() {
  const input = document.getElementById('customTargetMinutes');
  if (input && input.value) {
    const val = parseInt(input.value);
    if (val > 0) return val * 60;
  }
  return 0; // 0 means no limit
}

function updateTimerTick() {
  if (!timerIsRunning) return;
  
  const elapsedInCurrentRun = Math.floor((Date.now() - timerStartTime) / 1000);
  const totalSeconds = timerAccumulatedSeconds + elapsedInCurrentRun;
  
  if (timerMode === 'pomodoro') {
    pomoTimeLeft = 25 * 60 - totalSeconds;
    updateActiveSessionDuration(totalSeconds);
    
    if (pomoTimeLeft <= 0) {
      pomoTimeLeft = 0;
      handleTimerComplete();
    }
  } else {
    // Custom Mode (Count Up)
    pomoTimeLeft = totalSeconds;
    updateActiveSessionDuration(totalSeconds);
    
    const targetSeconds = getCustomTargetSeconds();
    if (targetSeconds > 0 && totalSeconds >= targetSeconds) {
      pomoTimeLeft = targetSeconds;
      handleTimerComplete();
    }
  }
  
  updatePomodoroUI();
}

function updateActiveSessionDuration(totalSeconds) {
  if (!currentSessionId) {
    currentSessionId = 'sess-' + Date.now();
    if (!appState.studySessions) appState.studySessions = [];
    appState.studySessions.push({
      id: currentSessionId,
      subject: pomoActiveSubject,
      duration: 0,
      timestamp: new Date().toISOString()
    });
    
    // Increment heatmap activity count on start
    const dStr = new Date().toISOString().split('T')[0];
    if (!appState.heatmap) appState.heatmap = {};
    appState.heatmap[dStr] = (appState.heatmap[dStr] || 0) + 1;
  }
  
  const sess = appState.studySessions.find(s => s.id === currentSessionId);
  if (sess) {
    sess.duration = totalSeconds;
    
    // Award XP (1 XP every 75 seconds studied, up to 20 XP in 25 mins)
    const expectedXp = Math.floor(totalSeconds / 75);
    const xpDelta = expectedXp - sessionXpAwarded;
    if (xpDelta > 0) {
      appState.xp = (appState.xp || 0) + xpDelta;
      sessionXpAwarded = expectedXp;
      renderDashboard();
    }
  }
  
  // Fast local save
  localStorage.setItem(STORAGE_KEY, JSON.stringify(appState));
  
  // Lightweight server syncing every 15 seconds
  if (totalSeconds % 15 === 0) {
    syncCloudProgress();
  }
}

function handleTimerComplete() {
  timerIsRunning = false;
  clearInterval(pomoTimer);
  pomoTimer = null;
  
  showToast('Session Complete! 🍅');
  shootConfetti();
  
  if (timerMode === 'pomodoro') {
    const sess = appState.studySessions.find(s => s.id === currentSessionId);
    if (sess) {
      const currentXpEarned = Math.floor(sess.duration / 75);
      const remainderXp = 20 - currentXpEarned;
      if (remainderXp > 0) {
        appState.xp = (appState.xp || 0) + remainderXp;
      }
    } else {
      appState.xp = (appState.xp || 0) + 20;
    }
  }
  
  timerAccumulatedSeconds = timerMode === 'pomodoro' ? 25 * 60 : getCustomTargetSeconds();
  currentSessionId = null;
  sessionXpAwarded = 0;
  
  const playSvg = '<polygon points="5 3 19 12 5 21 5 3"></polygon>';
  const icon = document.getElementById('pomoPlayIcon');
  const focusIcon = document.getElementById('focusPlayIcon');
  if (icon) icon.innerHTML = playSvg;
  if (focusIcon) focusIcon.innerHTML = playSvg;
  
  saveState();
  renderDashboard();
  exitFocusMode();
  updatePomodoroUI();
}

function togglePomodoro() {
  const icon = document.getElementById('pomoPlayIcon');
  const focusIcon = document.getElementById('focusPlayIcon');
  const playSvg = '<polygon points="5 3 19 12 5 21 5 3"></polygon>';
  const pauseSvg = '<rect x="6" y="4" width="4" height="16"></rect><rect x="14" y="4" width="4" height="16"></rect>';
  
  if (timerIsRunning) {
    timerIsRunning = false;
    clearInterval(pomoTimer);
    pomoTimer = null;
    
    const elapsedInCurrentRun = Math.floor((Date.now() - timerStartTime) / 1000);
    timerAccumulatedSeconds += elapsedInCurrentRun;
    
    if (icon) icon.innerHTML = playSvg;
    if (focusIcon) focusIcon.innerHTML = playSvg;
    
    saveState();
  } else {
    timerIsRunning = true;
    timerStartTime = Date.now();
    pomoTimer = setInterval(updateTimerTick, 1000);
    
    if (icon) icon.innerHTML = pauseSvg;
    if (focusIcon) focusIcon.innerHTML = pauseSvg;
  }
}

function resetPomodoro() {
  if (pomoTimer) {
    clearInterval(pomoTimer);
    pomoTimer = null;
  }
  
  if (currentSessionId) {
    const sess = (appState.studySessions || []).find(s => s.id === currentSessionId);
    let finalDuration = timerAccumulatedSeconds;
    if (timerIsRunning && timerStartTime) {
      finalDuration += Math.floor((Date.now() - timerStartTime) / 1000);
    }
    
    if (sess) {
      sess.duration = finalDuration;
      if (sess.duration >= 5) {
        const mins = Math.floor(sess.duration / 60);
        const secs = sess.duration % 60;
        showToast(`Saved study session: ${mins}m ${secs}s for ${sess.subject}! 📚`);
      } else {
        appState.studySessions = appState.studySessions.filter(s => s.id !== currentSessionId);
      }
    }
  }
  
  currentSessionId = null;
  timerIsRunning = false;
  timerAccumulatedSeconds = 0;
  sessionXpAwarded = 0;
  
  saveState();
  renderDashboard();
  
  const playSvg = '<polygon points="5 3 19 12 5 21 5 3"></polygon>';
  const icon = document.getElementById('pomoPlayIcon');
  const focusIcon = document.getElementById('focusPlayIcon');
  if (icon) icon.innerHTML = playSvg;
  if (focusIcon) focusIcon.innerHTML = playSvg;
  
  if (timerMode === 'pomodoro') {
    pomoTimeLeft = 25 * 60;
  } else {
    pomoTimeLeft = 0;
  }
  updatePomodoroUI();
}

function setTimerMode(mode) {
  if (timerIsRunning) {
    if (!confirm('This will reset your current study session. Proceed?')) return;
  }
  
  timerMode = mode;
  
  const pomoBtn = document.getElementById('timerModePomo');
  const customBtn = document.getElementById('timerModeCustom');
  const customInputs = document.getElementById('customTimerInputs');
  
  if (pomoBtn) pomoBtn.classList.toggle('active', mode === 'pomodoro');
  if (customBtn) customBtn.classList.toggle('active', mode === 'custom');
  
  if (customInputs) {
    customInputs.style.display = mode === 'custom' ? 'flex' : 'none';
  }
  
  resetPomodoro();
}

function updatePomodoroUI() {
  const m = Math.floor(pomoTimeLeft / 60);
  const s = pomoTimeLeft % 60;
  const timeStr = `${m.toString().padStart(2,'0')}:${s.toString().padStart(2,'0')}`;
  
  const timeEl = document.getElementById('pomoTime');
  if (timeEl) timeEl.textContent = timeStr;
  
  const focusTimeEl = document.getElementById('focusTime');
  if (focusTimeEl) focusTimeEl.textContent = timeStr;
  
  let pct = 0;
  if (timerMode === 'pomodoro') {
    const total = 25 * 60;
    pct = ((total - pomoTimeLeft) / total) * 100;
  } else {
    const targetSeconds = getCustomTargetSeconds();
    if (targetSeconds > 0) {
      pct = (pomoTimeLeft / targetSeconds) * 100;
    } else {
      pct = (pomoTimeLeft % 60) / 60 * 100;
    }
  }
  
  const ring = document.getElementById('pomoRing');
  if (ring) {
    const circumference = 2 * Math.PI * 90;
    ring.style.strokeDashoffset = circumference - (pct / 100) * circumference;
  }
  
  const focusRing = document.getElementById('focusRing');
  if (focusRing) {
    const circumference = 2 * Math.PI * 90;
    focusRing.style.strokeDashoffset = circumference - (pct / 100) * circumference;
  }
}

// ── ACTION: ENTER FOCUS MODE ──
function enterFocusMode() {
  const overlay = document.getElementById('focusOverlay');
  if (!overlay) return;

  const nextDsa = getNextUncheckedTask('dsa');
  const nextMl = getNextUncheckedTask('ml');
  
  const taskTitleEl = document.getElementById('focusTaskTitle');
  const subjectDisplayEl = document.getElementById('focusSubjectDisplay');
  
  if (subjectDisplayEl) {
    subjectDisplayEl.textContent = pomoActiveSubject;
    subjectDisplayEl.className = `focus-subject-badge ${pomoActiveSubject.toLowerCase().replace(/\s+/g, '-')}`;
  }

  if (taskTitleEl) {
    if (pomoActiveSubject.toLowerCase() === 'dsa' && nextDsa) {
      taskTitleEl.textContent = nextDsa.item.text;
    } else if (pomoActiveSubject.toLowerCase() === 'ml' && nextMl) {
      taskTitleEl.textContent = nextMl.item.text;
    } else {
      // Fallback or custom subjects
      const activeTask = getNextUncheckedTask('dsa') || getNextUncheckedTask('ml');
      if (activeTask) {
        taskTitleEl.textContent = activeTask.item.text;
      } else {
        taskTitleEl.textContent = `Focusing on ${pomoActiveSubject} studies`;
      }
    }
  }

  // Display Focus Mode Overlay
  overlay.classList.add('active');
  document.body.style.overflow = 'hidden'; // Lock page scroll
  
  // Keep values updated immediately
  updatePomodoroUI();
}

// ── ACTION: EXIT FOCUS MODE ──
function exitFocusMode() {
  const overlay = document.getElementById('focusOverlay');
  if (!overlay) return;
  
  overlay.classList.remove('active');
  document.body.style.overflow = ''; // Unlock page scroll
}

// ── RENDER: DASHBOARD ──
// ── HELPER: GET NEXT UNCHECKED TASK ──
function getNextUncheckedTask(subject) {
  const data = getChecklistData();
  if (!data || !data[subject]) return null;
  
  for (const weekData of data[subject]) {
    for (const unit of weekData.units) {
      for (const item of unit.items) {
        if (!appState.completed[item.id]) {
          return {
            item: item,
            weekNum: weekData.week,
            unitTitle: unit.title
          };
        }
      }
    }
  }
  return null;
}

// ── ACTION: TOGGLE DASHBOARD ITEM ──
function toggleDashboardItem(id, el, weekNum, subject) {
  // Prevent double clicks during the shifting transition
  if (el) el.style.pointerEvents = 'none';
  
  const isDone = !appState.completed[id];
  appState.completed[id] = isDone || undefined;
  if (!isDone) delete appState.completed[id];

  if (isDone) updateStreakAndHeatmap();

  saveState();
  
  // Instantly apply visual ticked off styles
  el.classList.toggle('done', isDone);
  const checkbox = el.querySelector('.today-checkbox');
  if (checkbox) checkbox.classList.toggle('checked', isDone);
  
  // Sync other views in real time
  updateChecklistProgress();
  if (typeof renderChecklist === 'function' && document.getElementById('view-checklist').classList.contains('active')) {
    renderChecklist();
  }

  // Check week completion for confetti
  const wp = getWeekProgress(subject, weekNum);
  if (isDone && wp.done === wp.total) {
    shootConfetti();
    showToast(`Week ${weekNum} Complete! Incredible! 🎉`);
  }

  // Wait a short moment so they see the checkbox tick off before shifting next item in
  setTimeout(() => {
    renderDashboard();
  }, 800);
}

function renderDashboard() {
  const info = getTodayInfo();
  const progress = getProgress();

  document.getElementById('greetingTitle').textContent = `${getGreeting()}, Aditya`;
  if (info.isFuture) document.getElementById('greetingSub').textContent = `Starts in ${Math.abs(info.dayIndex)} days · Get ready!`;
  else if (info.isPast) document.getElementById('greetingSub').textContent = `Plan complete! 🎉`;
  else document.getElementById('greetingSub').textContent = `Day ${info.dayIndex + 1} of ${TOTAL_DAYS} · Week ${info.weekIndex + 1}`;

  const streak = appState.streak || 0;
  document.getElementById('streakCount').textContent = streak;
  const flameEl = document.getElementById('streakFlame');
  if (flameEl) {
    if (streak >= 14) { flameEl.textContent = '⚡'; flameEl.style.textShadow = '0 0 10px #FFD700'; }
    else if (streak >= 7) { flameEl.textContent = '🔥'; flameEl.style.textShadow = '0 0 10px var(--accent-os)'; }
    else { flameEl.textContent = '🔥'; flameEl.style.textShadow = 'none'; }
  }

  document.getElementById('ringPctDsa').textContent = progress.dsa.pct + '%';
  document.getElementById('ringPctMl').textContent = progress.ml.pct + '%';
  document.getElementById('ringPctOverall').textContent = progress.overall.pct + '%';
  setRingProgress('ringFillDsa', progress.dsa.pct);
  setRingProgress('ringFillMl', progress.ml.pct);
  setRingProgress('ringFillOverall', progress.overall.pct);

  const todayCards = document.getElementById('todayCards');
  const todayDateEl = document.getElementById('todayDate');
  todayDateEl.textContent = formatDate(new Date());

  const nextDsa = getNextUncheckedTask('dsa');
  const nextMl = getNextUncheckedTask('ml');

  let dsaHtml = '';
  if (nextDsa) {
    dsaHtml = `
      <div class="today-card" onclick="toggleDashboardItem('${nextDsa.item.id}', this, ${nextDsa.weekNum}, 'dsa')">
        <div class="today-checkbox dsa"><span class="today-checkmark">✓</span></div>
        <div>
          <div class="today-card-label dsa">DSA · Week ${nextDsa.weekNum} · ${nextDsa.unitTitle.split(' — ')[1] || nextDsa.unitTitle}</div>
          <div class="today-card-text">${nextDsa.item.text}</div>
        </div>
      </div>
    `;
  } else {
    dsaHtml = `
      <div class="today-card done">
        <div class="today-checkbox checked dsa"><span class="today-checkmark">✓</span></div>
        <div>
          <div class="today-card-label dsa">DSA Complete</div>
          <div class="today-card-text">All DSA checklist items are fully completed! 🏆</div>
        </div>
      </div>
    `;
  }

  let mlHtml = '';
  if (nextMl) {
    mlHtml = `
      <div class="today-card" onclick="toggleDashboardItem('${nextMl.item.id}', this, ${nextMl.weekNum}, 'ml')">
        <div class="today-checkbox ml"><span class="today-checkmark">✓</span></div>
        <div>
          <div class="today-card-label ml">ML · Week ${nextMl.weekNum} · ${nextMl.unitTitle.split(' — ')[1] || nextMl.unitTitle}</div>
          <div class="today-card-text">${nextMl.item.text}</div>
        </div>
      </div>
    `;
  } else {
    mlHtml = `
      <div class="today-card done">
        <div class="today-checkbox checked ml"><span class="today-checkmark">✓</span></div>
        <div>
          <div class="today-card-label ml">ML Complete</div>
          <div class="today-card-text">All ML checklist items are fully completed! 🏆</div>
        </div>
      </div>
    `;
  }

  todayCards.innerHTML = dsaHtml + mlHtml;

  document.getElementById('statDsaDone').textContent = progress.dsa.done;
  document.getElementById('statMlDone').textContent = progress.ml.done;
  document.getElementById('statDaysLeft').textContent = info.daysLeft;

  // XP & Level
  const xp = appState.xp || 0;
  const level = Math.floor(xp / 100) + 1;
  const currentXP = xp % 100;
  document.getElementById('statLevel').textContent = level;
  
  if (appState.lastLevel && level > appState.lastLevel) {
    shootConfetti();
    showToast(`Level Up! You reached Level ${level} 🏆`);
  }
  appState.lastLevel = level;

  document.getElementById('xpText').textContent = `${currentXP} / 100 XP`;
  document.getElementById('xpBar').style.width = currentXP + '%';

  // Dynamic Motivation Banner calculations to track schedule pace
  const remaining = progress.overall.total - progress.overall.done;
  const daysCount = Math.max(1, info.daysLeft);
  const tasksPerDay = Math.ceil(remaining / daysCount);
  const motivationDescEl = document.getElementById('motivationDesc');
  
  if (motivationDescEl) {
    if (remaining === 0) {
      motivationDescEl.innerHTML = `
        <div class="insight-container">
          <div class="insight-pacing-text">
            🏆 <strong>Curriculum Fully Completed!</strong> Phenomenal job completing all <strong>${progress.overall.total}</strong> tasks! You've built a stellar foundation in DSA and Machine Learning. Enjoy your summer!
          </div>
        </div>
      `;
    } else if (info.isFuture) {
      motivationDescEl.innerHTML = `
        <div class="insight-container">
          <div class="insight-pacing-text">
            📅 <strong>Preparation Mode:</strong> The summer schedule kicks off in <strong>${Math.abs(info.dayIndex)}</strong> days. To complete all <strong>${progress.overall.total}</strong> tasks on time, your target pace will be <strong>${tasksPerDay}</strong> task${tasksPerDay > 1 ? 's' : ''} per day once we begin.
          </div>
        </div>
      `;
    } else if (info.isPast) {
      motivationDescEl.innerHTML = `
        <div class="insight-container">
          <div class="insight-pacing-text">
            ⌛ <strong>Schedule Concluded:</strong> The formal summer term ended on July 5, 2026. You have <strong>${remaining}</strong> task${remaining > 1 ? 's' : ''} remaining. Try to finish at a pace of <strong>${tasksPerDay}</strong> task${tasksPerDay > 1 ? 's' : ''}/day to wrap up the curriculum!
          </div>
        </div>
      `;
    } else {
      const dayIndexBounded = Math.max(0, Math.min(TOTAL_DAYS - 1, info.dayIndex));
      const targetCompleted = Math.min(progress.overall.total, getScheduleTargetTasks(dayIndexBounded));
      const weekNumBounded = Math.max(1, Math.min(6, info.weekIndex + 1));
      const weekPacing = getCurrentWeekPacingInfo(weekNumBounded);
      const { nextDsa, nextMl } = getNextFocusTasks();

      // Determine coaching narrative & strategy
      let narrativeHtml = "";
      if (progress.overall.done >= targetCompleted) {
        const aheadBy = progress.overall.done - targetCompleted;
        if (aheadBy >= 5) {
          narrativeHtml = `🔥 <strong>Incredible speed!</strong> You are <strong>${aheadBy}</strong> tasks ahead of schedule. Keep this up or take a lighter load today. Maintaining <strong>${tasksPerDay}</strong> task${tasksPerDay > 1 ? 's' : ''}/day will keep you coasting.`;
        } else {
          narrativeHtml = `✨ <strong>Perfect pacing!</strong> You are right on track with your goals (target: <strong>${targetCompleted}</strong>). Keep doing about <strong>${tasksPerDay}</strong> task${tasksPerDay > 1 ? 's' : ''}/day to finish comfortably.`;
        }
      } else {
        const behindBy = targetCompleted - progress.overall.done;
        if (behindBy > 5) {
          narrativeHtml = `⏳ <strong>Let's catch up step-by-step:</strong> You are behind schedule by <strong>${behindBy}</strong> tasks (target: <strong>${targetCompleted}</strong>). To get back on track comfortably, aim for <strong>${tasksPerDay}</strong> tasks/day. Focus on checking off just 1 extra task per session!`;
        } else {
          narrativeHtml = `⏳ <strong>Slightly behind pace:</strong> You are only <strong>${behindBy}</strong> task${behindBy > 1 ? 's' : ''} behind your target of <strong>${targetCompleted}</strong>. Completing <strong>${tasksPerDay}</strong> tasks today will bridge the gap!`;
        }
      }

      // Build Next Steps HTML if tasks are incomplete
      let nextStepsHtml = "";
      if (nextDsa || nextMl) {
        let rows = "";
        if (nextDsa) {
          rows += `
            <div class="insight-next-row">
              <span class="insight-badge dsa">DSA</span>
              <div class="insight-next-content">
                <span class="insight-next-topic">${nextDsa.unitTitle}:</span>
                <span class="insight-next-task">${nextDsa.taskText}</span>
              </div>
            </div>
          `;
        }
        if (nextMl) {
          rows += `
            <div class="insight-next-row">
              <span class="insight-badge ml">ML</span>
              <div class="insight-next-content">
                <span class="insight-next-topic">${nextMl.unitTitle}:</span>
                <span class="insight-next-task">${nextMl.taskText}</span>
              </div>
            </div>
          `;
        }
        nextStepsHtml = `
          <div class="insight-next-focus">
            <div class="insight-next-title">🎯 Recommended Next Focus</div>
            ${rows}
          </div>
        `;
      }

      motivationDescEl.innerHTML = `
        <div class="insight-container">
          <div class="insight-pacing-text">${narrativeHtml}</div>
          
          <div class="insight-progress-section">
            <div class="insight-progress-header">
              <span>📅 Week ${weekNumBounded} Goal (${weekPacing.dates})</span>
              <span class="insight-progress-val">${weekPacing.done} / ${weekPacing.total} Tasks (${weekPacing.pct}%)</span>
            </div>
            <div class="cprog-bar">
              <div class="cprog-fill rev" style="width: ${weekPacing.pct}%;"></div>
            </div>
          </div>

          ${nextStepsHtml}
        </div>
      `;
    }
  }

  renderHeatmap();
  // updatePomodoroUI(); (handled in Pomodoro tab)
}

function renderHeatmap() {
  const grid = document.getElementById('heatmapGrid');
  if (!grid) return;
  
  const start = new Date(START_DATE);
  let html = '';
  for (let i = 0; i < 42; i++) {
    const d = new Date(start);
    d.setDate(d.getDate() + i);
    const dStr = d.toISOString().split('T')[0];
    
    const count = (appState.heatmap || {})[dStr] || 0;
    let lvl = 0;
    if (count > 0) lvl = 1;
    if (count > 2) lvl = 2;
    if (count > 4) lvl = 3;
    
    html += `<div class="heatmap-cell l-${lvl}" title="${formatDate(d)}: ${count} tasks completed (Click to add notes)" onclick="openNotesModal('${dStr}')"></div>`;
  }
  grid.innerHTML = html;
}

// ── DAILY NOTES MODAL ──
let notesTargetDate = null;

function openNotesModal(dateStr = null) {
  notesTargetDate = dateStr || new Date().toISOString().split('T')[0];
  if (!appState.notes) appState.notes = {};
  
  document.getElementById('notesTextarea').value = appState.notes[notesTargetDate] || '';
  document.getElementById('notesModalTitle').innerHTML = `📝 Notes for ${notesTargetDate}`;
  document.getElementById('notesModal').classList.add('open');
  document.getElementById('notesTextarea').focus();
}

function closeNotesModal(e, force=false) {
  if (force || (e && e.target.id === 'notesModal')) {
    document.getElementById('notesModal').classList.remove('open');
  }
}

function saveNotes() {
  const txt = document.getElementById('notesTextarea').value;
  if (!appState.notes) appState.notes = {};
  
  if (txt.trim() === '') delete appState.notes[notesTargetDate];
  else appState.notes[notesTargetDate] = txt;
  
  saveState();
  closeNotesModal(null, true);
  showToast('Notes saved!');
  if(currentView === 'schedule') renderSchedule();
}

// ── RENDER: SCHEDULE ──
function renderSchedule() {
  if (typeof SCHEDULE_DATA === 'undefined') return;
  const container = document.getElementById('scheduleWeeks');
  const info = getTodayInfo();
  let html = '';

  const phases = [
    { num: 1, title: 'Build the <span class="c-dsa">Foundation</span>', sub: 'C++ basics, STL, Recursion · Andrew Ng Course 1 · First open source PR', weeks: [1, 2, 3] },
    { num: 2, title: 'Level <span class="c-ml">Up</span>', sub: 'Binary Search, Strings, Linked Lists · Andrew Ng Course 2 · Consistent PRs', weeks: [4, 5, 6] }
  ];

  const startObj = new Date(START_DATE);

  phases.forEach((phase, pi) => {
    html += `<div class="phase-header"><div class="phase-label">Phase ${phase.num} · Weeks ${phase.weeks[0]}–${phase.weeks[phase.weeks.length - 1]}</div><div class="phase-title">${phase.title}</div><div class="phase-sub">${phase.sub}</div></div><div class="schedule-weeks">`;

    phase.weeks.forEach(wNum => {
      const week = SCHEDULE_DATA.find(w => w.week === wNum);
      if (!week) return;

      const isCurrent = info.isActive && info.weekIndex === wNum - 1;
      const isOpen = isCurrent;

      html += `
        <div class="wcard${isOpen ? ' open' : ''}${isCurrent ? ' current-week' : ''}" id="sched-w${wNum}">
          <div class="wcard-head" onclick="toggleScheduleWeek('sched-w${wNum}')">
            <div class="wcard-left"><div class="wnum">Week ${String(wNum).padStart(2, '0')}</div><div><div class="wtitle">${week.title}</div><div class="wdates">${week.dates}</div></div></div>
            <div class="wcard-right"><div class="wtags">${week.tags.map(t => `<span class="wtag ${t.type}">${t.label}</span>`).join('')}</div><div class="chevron">▾</div></div>
          </div>
          <div class="wcard-body" style="padding: 16px 22px;">
            <div class="days-label" style="font-family: 'JetBrains Mono', monospace; font-size: 10px; font-weight: 600; letter-spacing: 0.2em; text-transform: uppercase; color: var(--text-muted); margin-bottom: 16px;">Weekly Goals</div>
            <div style="display: flex; flex-direction: column; gap: 8px;">
              ${week.targets.dsa ? `
                <div style="margin-bottom: 12px;">
                  <strong style="color: var(--accent-dsa); font-size: 14px; font-family: 'Syne', sans-serif;">DSA:</strong>
                  <ul style="list-style-type: disc; margin-left: 20px; font-size: 13px; color: var(--text-secondary); line-height: 1.5; margin-top: 4px;">
                    ${week.targets.dsa.map(t => `<li>${t}</li>`).join('')}
                  </ul>
                </div>` : ''}
              ${week.targets.ml ? `
                <div>
                  <strong style="color: var(--accent-ml); font-size: 14px; font-family: 'Syne', sans-serif;">ML:</strong>
                  <ul style="list-style-type: disc; margin-left: 20px; font-size: 13px; color: var(--text-secondary); line-height: 1.5; margin-top: 4px;">
                    ${week.targets.ml.map(t => `<li>${t}</li>`).join('')}
                  </ul>
                </div>` : ''}
            </div>
          </div>
        </div>
      `;
    });
    html += '</div>';
    if (pi < phases.length - 1) html += '<hr class="phase-divider">';
  });
  container.innerHTML = html;
}

function toggleScheduleWeek(id) { document.getElementById(id).classList.toggle('open'); }
function toggleChecklistWeek(id) { document.getElementById(id).classList.toggle('open'); }

// ── RENDER: CHECKLIST ──

function getChecklistData() {
  if (!appState.checklistData) {
    if (typeof CHECKLIST_DATA === 'undefined') return null;
    appState.checklistData = JSON.parse(JSON.stringify(CHECKLIST_DATA));
    saveState();
  }
  return appState.checklistData;
}

let currentChecklistTab = 'dsa';
let clFilter = 'all';
let clSearchQuery = '';

function renderChecklist() {
  if (typeof getChecklistData() === 'undefined') return;
  const progress = getProgress();
  document.getElementById('clDsaNum').textContent = `${progress.dsa.done} / ${progress.dsa.total}`;
  document.getElementById('clMlNum').textContent = `${progress.ml.done} / ${progress.ml.total}`;
  document.getElementById('clDsaBar').style.width = progress.dsa.pct + '%';
  document.getElementById('clMlBar').style.width = progress.ml.pct + '%';
  renderChecklistContent();
}

function filterChecklist() {
  clSearchQuery = document.getElementById('clSearch').value.toLowerCase();
  renderChecklistContent();
}

function setFilter(filter, el) {
  clFilter = filter;
  document.querySelectorAll('.cl-chip').forEach(c => c.classList.remove('active'));
  el.classList.add('active');
  renderChecklistContent();
}

function renderChecklistContent() {
  if (typeof getChecklistData() === 'undefined') return;
  const data = getChecklistData()[currentChecklistTab];
  const container = document.getElementById('clContent');
  const info = getTodayInfo();
  let html = '';

  data.forEach((weekData) => {
    const wp = getWeekProgress(currentChecklistTab, weekData.week);
    const isCurrentWeek = info.isActive && info.weekIndex === weekData.week - 1;
    let isOpen = isCurrentWeek || weekData.week === 1;
    if (clFilter !== 'all' || clSearchQuery !== '') isOpen = true; // Auto open if filtering

    let weekHtml = '';
    let itemsFoundInWeek = false;

    weekData.units.forEach(unit => {
      let unitHtml = '';
      unit.items.forEach(item => {
        const isDone = appState.completed[item.id];
        const tags = item.tags || [];
        const tagsLower = tags.map(t => t.toLowerCase());

        // Apply Filters
        if (clFilter === 'critical' && !tagsLower.some(t => t === 'critical' || t === 'hard')) return;
        if (clFilter === 'hard' && !tagsLower.some(t => t === 'hard')) return;
        if (clFilter === 'lc' && !tagsLower.some(t => t.startsWith('lc'))) return;
        if (clFilter === 'incomplete' && isDone) return;
        
        if (clSearchQuery && !item.text.toLowerCase().includes(clSearchQuery) && !tagsLower.some(t => t.includes(clSearchQuery))) return;

        itemsFoundInWeek = true;

        const tagBadges = tags.map(t => {
          let cls = 'lc';
          const tl = t.toLowerCase();
          if (tl === 'critical') cls = 'critical';
          else if (tl === 'hard') cls = 'hard';
          else if (tl.startsWith('key')) cls = 'key';
          return `<span class="cl-item-tag ${cls}">${t}</span>`;
        }).join('');

        unitHtml += `
          <div class="cl-item${isDone ? ' done' : ''}" onclick="toggleItem('${item.id}', this, ${weekData.week})"
               draggable="true" 
               ondragstart="handleDragStart(event, '${currentChecklistTab}', ${weekData.week}, '${unit.title.replace(/'/g, "\'")}', '${item.id}')"
               ondragover="handleDragOver(event)"
               ondragleave="handleDragLeave(event)"
               ondrop="handleDrop(event, '${currentChecklistTab}', ${weekData.week}, '${unit.title.replace(/'/g, "\'")}', '${item.id}')"
               ondragend="handleDragEnd(event)">
            <div class="cl-checkbox ${currentChecklistTab}"><span class="cl-checkmark">✓</span></div>
            <div class="cl-item-text">${item.text}</div>
            ${tagBadges}
            <div class="cl-item-actions">
               <button class="cl-action-btn" onclick="promptEditChecklistItem('${currentChecklistTab}', ${weekData.week}, '${unit.title.replace(/'/g, "\'")}', '${item.id}', event)">✎</button>
               <button class="cl-action-btn" onclick="deleteChecklistItem('${currentChecklistTab}', ${weekData.week}, '${unit.title.replace(/'/g, "\'")}', '${item.id}', event)">✕</button>
            </div>
          </div>
        `;
      });
      if (unitHtml) {
        weekHtml += `<div class="cl-unit-label">${unit.title}</div><div class="cl-item-list">${unitHtml}`;
        weekHtml += `<button class="cl-add-task-btn" onclick="promptAddChecklistItem('${currentChecklistTab}', ${weekData.week}, '${unit.title.replace(/'/g, "\'")}')">+ Add Task</button>`;
        weekHtml += `</div>`;
      }
    });

    if (itemsFoundInWeek) {
      html += `
        <div class="cl-week${isOpen ? ' open' : ''}" id="cl-${currentChecklistTab}-w${weekData.week}">
          <div class="cl-week-header" onclick="toggleChecklistWeek('cl-${currentChecklistTab}-w${weekData.week}')">
            <div class="cl-week-label">Week ${weekData.week}</div>
            <div class="cl-week-dates">${weekData.dates}</div>
            <div class="cl-week-prog ${currentChecklistTab}">${wp.done}/${wp.total}</div>
            <div class="cl-week-chevron">▾</div>
          </div>
          <div class="cl-week-rule"></div>
          <div class="cl-week-body">${weekHtml}</div>
        </div>
      `;
    }
  });

  container.innerHTML = html || `<div style="padding:40px; text-align:center; color:var(--text-muted);">No items match your search.</div>`;
}

function switchChecklistTab(tab) {
  currentChecklistTab = tab;
  document.querySelectorAll('.cl-tab').forEach(t => t.classList.toggle('active', t.dataset.tab === tab));
  renderChecklistContent();
}

function toggleItem(id, el, weekNum) {
  const isDone = !appState.completed[id];
  appState.completed[id] = isDone || undefined;
  if (!isDone) delete appState.completed[id];

  if (isDone) updateStreakAndHeatmap();

  saveState();
  el.classList.toggle('done', isDone);
  updateChecklistProgress();

  // Sync the dashboard view
  if (typeof renderDashboard === 'function') renderDashboard();

  // Check week completion for confetti
  const wp = getWeekProgress(currentChecklistTab, weekNum);
  if (isDone && wp.done === wp.total) {
    shootConfetti();
    showToast(`Week ${weekNum} Complete! Incredible! 🎉`);
  }
}

function updateChecklistProgress() {
  const progress = getProgress();
  document.getElementById('clDsaNum').textContent = `${progress.dsa.done} / ${progress.dsa.total}`;
  document.getElementById('clMlNum').textContent = `${progress.ml.done} / ${progress.ml.total}`;
  document.getElementById('clDsaBar').style.width = progress.dsa.pct + '%';
  document.getElementById('clMlBar').style.width = progress.ml.pct + '%';

  if (typeof getChecklistData() !== 'undefined') {
    getChecklistData()[currentChecklistTab].forEach(weekData => {
      const wp = getWeekProgress(currentChecklistTab, weekData.week);
      const el = document.querySelector(`#cl-${currentChecklistTab}-w${weekData.week} .cl-week-prog`);
      if (el) el.textContent = `${wp.done}/${wp.total}`;
    });
  }
}


// ── EDITABLE CHECKLIST LOGIC ──
function promptAddChecklistItem(tab, weekNum, unitTitle) {
  const text = prompt('Enter new task:');
  if (!text) return;
  const data = getChecklistData();
  const week = data[tab].find(w => w.week === weekNum);
  let unit = week.units.find(u => u.title === unitTitle);
  if (!unit) {
    unit = { title: unitTitle, items: [] };
    week.units.push(unit);
  }
  unit.items.push({ id: 'custom-' + Date.now(), text, tags: ['custom'] });
  saveState();
  renderChecklistContent();
  updateChecklistProgress();
}

function promptEditChecklistItem(tab, weekNum, unitTitle, itemId, e) {
  e.stopPropagation();
  const data = getChecklistData();
  const week = data[tab].find(w => w.week === weekNum);
  const unit = week.units.find(u => u.title === unitTitle);
  const item = unit.items.find(i => i.id === itemId);
  const newText = prompt('Edit task:', item.text);
  if (newText) {
    item.text = newText;
    saveState();
    renderChecklistContent();
  }
}

function deleteChecklistItem(tab, weekNum, unitTitle, itemId, e) {
  e.stopPropagation();
  if (!confirm('Delete this task?')) return;
  const data = getChecklistData();
  const week = data[tab].find(w => w.week === weekNum);
  const unit = week.units.find(u => u.title === unitTitle);
  unit.items = unit.items.filter(i => i.id !== itemId);
  delete appState.completed[itemId];
  saveState();
  renderChecklistContent();
  updateChecklistProgress();
}

let draggedItem = null;
let dragSourceInfo = null;

function handleDragStart(e, tab, weekNum, unitTitle, itemId) {
  draggedItem = e.target;
  dragSourceInfo = { tab, weekNum, unitTitle, itemId };
  e.dataTransfer.effectAllowed = 'move';
  setTimeout(() => e.target.classList.add('dragging'), 0);
}

function handleDragOver(e) {
  e.preventDefault();
  e.dataTransfer.dropEffect = 'move';
  const target = e.target.closest('.cl-item');
  if (target && target !== draggedItem) {
    target.classList.add('drag-over');
  }
}

function handleDragLeave(e) {
  const target = e.target.closest('.cl-item');
  if (target) target.classList.remove('drag-over');
}

function handleDrop(e, targetTab, targetWeekNum, targetUnitTitle, targetItemId) {
  e.preventDefault();
  document.querySelectorAll('.cl-item').forEach(el => el.classList.remove('drag-over'));
  if (draggedItem) draggedItem.classList.remove('dragging');
  
  if (!dragSourceInfo || dragSourceInfo.itemId === targetItemId) return;
  
  const data = getChecklistData();
  // Find source
  const sWeek = data[dragSourceInfo.tab].find(w => w.week === dragSourceInfo.weekNum);
  const sUnit = sWeek.units.find(u => u.title === dragSourceInfo.unitTitle);
  const sIdx = sUnit.items.findIndex(i => i.id === dragSourceInfo.itemId);
  const itemData = sUnit.items[sIdx];
  
  // Find target
  const tWeek = data[targetTab].find(w => w.week === targetWeekNum);
  const tUnit = tWeek.units.find(u => u.title === targetUnitTitle);
  const tIdx = tUnit.items.findIndex(i => i.id === targetItemId);
  
  // Move
  sUnit.items.splice(sIdx, 1);
  tUnit.items.splice(tIdx, 0, itemData);
  
  saveState();
  renderChecklistContent();
}

function handleDragEnd(e) {
  e.target.classList.remove('dragging');
  document.querySelectorAll('.cl-item').forEach(el => el.classList.remove('drag-over'));
}


// ── YPT POMODORO TAB LOGIC ──
let pomoActiveSubject = 'DSA';

function renderPomodoroTab() {
  renderSubjectsList();
  document.getElementById('pomoActiveSubjectDisplay').textContent = pomoActiveSubject;
  updatePomodoroUI();
}

function renderSubjectsList() {
  const container = document.getElementById('pomoSubjectContainer');
  if (!container) return;
  const subjects = appState.subjects || ['DSA', 'ML'];
  
  container.innerHTML = subjects.map(sub => {
    const isDefault = sub === 'DSA' || sub === 'ML';
    return `
      <div class="cl-chip ${sub === pomoActiveSubject ? 'active' : ''}" 
           onclick="selectPomoSubject('${sub}')" 
           style="width:100%; display:flex; justify-content:space-between; align-items:center; padding:12px 16px; border-radius:8px; cursor:pointer; font-family:inherit; font-size:inherit;">
        <span style="display:flex; align-items:center; gap:8px;">📚 ${sub}</span>
        ${!isDefault ? `
          <button class="cl-action-btn" onclick="deleteCustomSubject('${sub}', event)" title="Delete subject" style="color:var(--text-muted); font-size:12px; padding:2px 6px; border-radius:4px; margin-left:8px; line-height:1;">✕</button>
        ` : ''}
      </div>
    `;
  }).join('');
}

function deleteCustomSubject(sub, e) {
  e.stopPropagation();
  if (!confirm(`Delete subject "${sub}"? This will not delete its logged study sessions.`)) return;
  appState.subjects = (appState.subjects || ['DSA', 'ML']).filter(s => s !== sub);
  if (pomoActiveSubject === sub) {
    pomoActiveSubject = 'DSA';
    const displayEl = document.getElementById('pomoActiveSubjectDisplay');
    if (displayEl) displayEl.textContent = 'DSA';
  }
  saveState();
  renderSubjectsList();
  showToast(`Subject "${sub}" deleted!`);
}

function selectPomoSubject(subject) {
  pomoActiveSubject = subject;
  document.getElementById('pomoActiveSubjectDisplay').textContent = subject;
  renderSubjectsList();
  showToast(`Selected Subject: ${subject}`);
}

function addCustomSubject() {
  const input = document.getElementById('pomoNewSubjectInput');
  const name = input.value.trim();
  if (!name) return;
  
  if (!appState.subjects) appState.subjects = ['DSA', 'ML'];
  
  if (appState.subjects.map(s => s.toLowerCase()).includes(name.toLowerCase())) {
    showToast('Subject already exists!');
    return;
  }
  
  appState.subjects.push(name);
  saveState();
  input.value = '';
  renderSubjectsList();
  showToast(`Subject "${name}" added!`);
}

function logStudySession(subject, durationSeconds) {
  if (!appState.studySessions) appState.studySessions = [];
  const session = {
    id: 'sess-' + Date.now(),
    subject,
    duration: durationSeconds,
    timestamp: new Date().toISOString()
  };
  appState.studySessions.push(session);
  
  // Track this on heatmap too (as a completed task!)
  const dStr = new Date().toISOString().split('T')[0];
  if (!appState.heatmap) appState.heatmap = {};
  appState.heatmap[dStr] = (appState.heatmap[dStr] || 0) + 1;
}

// ── STUDY INSIGHTS TAB LOGIC ──
function renderInsightsTab() {
  const sessions = appState.studySessions || [];
  
  // 1. Calculate time distribution
  const totals = {};
  sessions.forEach(s => {
    totals[s.subject] = (totals[s.subject] || 0) + (s.duration / 3600);
  });
  
  const distContainer = document.getElementById('insightsDistributionBars');
  if (distContainer) {
    const keys = Object.keys(totals);
    if (keys.length === 0) {
      distContainer.innerHTML = `<div style="text-align:center; color:var(--text-muted); font-size:13px; padding:20px;">No study sessions tracked yet. Run the timer to collect insights!</div>`;
    } else {
      const maxHours = Math.max(...Object.values(totals), 1);
      distContainer.innerHTML = keys.map(k => {
        const hours = totals[k];
        const pct = (hours / maxHours) * 100;
        let colorClass = 'rev';
        if (k.toLowerCase() === 'dsa') colorClass = 'dsa';
        else if (k.toLowerCase() === 'ml') colorClass = 'ml';
        
        return `
          <div>
            <div style="display:flex; justify-content:space-between; font-size:13px; margin-bottom:4px;">
              <span style="font-weight:700; color:var(--text-primary);">${k}</span>
              <span style="color:var(--text-muted); margin-left:auto;">${hours.toFixed(1)} hrs</span>
            </div>
            <div class="cprog-bar"><div class="cprog-fill ${colorClass}" style="width:${pct}%; background: var(--accent-${colorClass === 'rev' ? 'rev' : colorClass});"></div></div>
          </div>
        `;
      }).join('');
    }
  }
  
  // 2. Study Slots Breakdown
  let morningSess = 0, afternoonSess = 0, eveningSess = 0;
  let morningCount = 0, afternoonCount = 0, eveningCount = 0;
  sessions.forEach(s => {
    const hr = new Date(s.timestamp).getHours();
    const hrs = s.duration / 3600;
    if (hr >= 6 && hr < 12) {
      morningSess += hrs;
      morningCount++;
    } else if (hr >= 12 && hr < 18) {
      afternoonSess += hrs;
      afternoonCount++;
    } else {
      eveningSess += hrs;
      eveningCount++;
    }
  });
  
  document.getElementById('insightSlotMorning').innerHTML = `${morningSess.toFixed(1)}h <div style="font-size:10px; font-weight:normal; color:var(--text-muted); margin-top:2px;">${morningCount} session${morningCount !== 1 ? 's' : ''}</div>`;
  document.getElementById('insightSlotAfternoon').innerHTML = `${afternoonSess.toFixed(1)}h <div style="font-size:10px; font-weight:normal; color:var(--text-muted); margin-top:2px;">${afternoonCount} session${afternoonCount !== 1 ? 's' : ''}</div>`;
  document.getElementById('insightSlotEvening').innerHTML = `${eveningSess.toFixed(1)}h <div style="font-size:10px; font-weight:normal; color:var(--text-muted); margin-top:2px;">${eveningCount} session${eveningCount !== 1 ? 's' : ''}</div>`;
  
  // 3. XP Projections & Averages
  const totalHours = sessions.reduce((acc, s) => acc + (s.duration / 3600), 0);
  document.getElementById('insightTotalHours').textContent = totalHours.toFixed(1) + 'h';
  
  // Calculate Daily Average (over the study period)
  const uniqueDays = new Set(sessions.map(s => s.timestamp.split('T')[0])).size || 1;
  const dailyAvgMin = (totalHours * 60) / uniqueDays;
  document.getElementById('insightDailyAvg').textContent = dailyAvgMin >= 60 ? (dailyAvgMin / 60).toFixed(1) + 'h' : Math.round(dailyAvgMin) + 'm';
  
  // XP MileStone: Level Up is every 100 XP. Timer gives 20 XP per completed work session (25 mins = 0.42 hrs).
  const xp = appState.xp || 0;
  const xpNeeded = 100 - (xp % 100);
  const workSessionsNeeded = Math.ceil(xpNeeded / 20);
  const hoursNeeded = (workSessionsNeeded * 25) / 60;
  document.getElementById('insightMilestoneHours').textContent = hoursNeeded.toFixed(1);

  // Dynamic Level progress bar updating
  const currentXP = xp % 100;
  const xpTextEl = document.getElementById('insightXpText');
  const xpBarEl = document.getElementById('insightXpBar');
  if (xpTextEl) xpTextEl.textContent = `${currentXP} / 100 XP`;
  if (xpBarEl) xpBarEl.style.width = currentXP + '%';
  
  // 4. Session Log
  const logContainer = document.getElementById('insightsSessionLog');
  if (logContainer) {
    if (sessions.length === 0) {
      logContainer.innerHTML = `<div style="text-align:center; color:var(--text-muted); font-size:12px; padding:10px;">No recent sessions logged</div>`;
    } else {
      const reversed = [...sessions].reverse().slice(0, 10);
      logContainer.innerHTML = reversed.map(s => {
        const date = new Date(s.timestamp);
        const dateStr = date.toLocaleDateString(undefined, {month: 'short', day: 'numeric'});
        const timeStr = date.toLocaleTimeString(undefined, {hour: '2-digit', minute:'2-digit'});
        return `
          <div style="display:flex; justify-content:space-between; align-items:center; background:var(--bg-surface-2); padding:8px 12px; border-radius:6px; border:1px solid var(--border); font-size:12px;">
            <div>
              <span style="font-weight:700; color:var(--text-primary);">${s.subject}</span>
              <span style="color:var(--text-muted); font-size:10px; margin-left:6px;">${dateStr} at ${timeStr}</span>
            </div>
            <div style="display:flex; align-items:center; gap:8px;">
              <strong style="color:var(--accent-ml);">${Math.round(s.duration / 60)} mins</strong>
              <button class="cl-action-btn" onclick="deleteStudySession('${s.id}', event)" title="Delete session" style="color:var(--text-muted); font-size:12px; padding:2px 6px; border-radius:4px; margin-left:4px;">✕</button>
            </div>
          </div>
        `;
      }).join('');
    }
  }
}

function deleteStudySession(id, e) {
  e.stopPropagation();
  if (!confirm('Are you sure you want to delete this study session? This will recalculate all study insights.')) return;
  appState.studySessions = (appState.studySessions || []).filter(s => s.id !== id);
  saveState();
  renderInsightsTab();
  if (typeof renderDashboard === 'function') renderDashboard();
  showToast('Study session deleted! 🗑️');
}

// ── RESOURCES VIEW (CUSTOM MANAGER) ──
let resFilter = 'all';

const DEFAULT_RESOURCES = [
  { id: 'default-1', title: "Striver's A2Z DSA Sheet", url: "https://takeuforward.org/strivers-a2z-dsa-course-sheet-2-0-your-path-to-coding-interview-ready/", desc: "The gold standard sheet for DSA tracking and practice.", category: "dsa" },
  { id: 'default-2', title: "Andrew Ng Machine Learning Specialization", url: "https://www.coursera.org/specializations/machine-learning-introduction", desc: "Foundational machine learning concepts, linear regression, neural networks, decision trees.", category: "ml" },
  { id: 'default-3', title: "LeetCode Practice Platform", url: "https://leetcode.com", desc: "Best place to code and practice algorithms with daily challenges.", category: "dsa" }
];

function getResources() {
  if (!appState.customResources) {
    appState.customResources = [...DEFAULT_RESOURCES];
    saveState();
  }
  return appState.customResources;
}

function setResourceFilter(filter, el) {
  resFilter = filter;
  document.querySelectorAll('#resFilterChips .cl-chip').forEach(c => c.classList.remove('active'));
  el.classList.add('active');
  renderResources();
}

function renderResources() {
  const container = document.getElementById('resContent');
  if (!container) return;
  const items = getResources();
  
  const filtered = items.filter(r => resFilter === 'all' || r.category === resFilter);
  
  if (filtered.length === 0) {
    container.innerHTML = `<div style="grid-column: 1/-1; padding:40px; text-align:center; color:var(--text-muted);">No study resources found in this category. Click "+ Add Resource" to make one!</div>`;
    return;
  }
  
  container.innerHTML = filtered.map(item => `
    <div class="res-item-card">
      <span class="res-item-cat">${item.category}</span>
      <h3 class="res-item-title">${item.title}</h3>
      <p class="res-item-desc">${item.desc || 'No description provided.'}</p>
      <div class="res-item-footer">
        <a href="${item.url}" target="_blank" class="res-link-btn">
          <span>Open Resource</span>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="7" y1="17" x2="17" y2="7"/><polyline points="7 7 17 7 17 17"/></svg>
        </a>
        <div class="res-actions">
          <button class="cl-action-btn" onclick="editResource('${item.id}', event)" title="Edit">✎</button>
          <button class="cl-action-btn" onclick="deleteResource('${item.id}', event)" title="Delete" style="color:#ef4444;">✕</button>
        </div>
      </div>
    </div>
  `).join('');
}

function openResourceModal(resource = null) {
  const modal = document.getElementById('resourceModal');
  const title = document.getElementById('resourceModalTitle');
  const idInput = document.getElementById('resourceId');
  const titleInput = document.getElementById('resTitle');
  const urlInput = document.getElementById('resUrl');
  const descText = document.getElementById('resDesc');
  const catSel = document.getElementById('resCategory');

  if (resource) {
    title.textContent = "Edit Study Resource";
    idInput.value = resource.id;
    titleInput.value = resource.title;
    urlInput.value = resource.url;
    descText.value = resource.desc || '';
    catSel.value = resource.category;
  } else {
    title.textContent = "Add Study Resource";
    idInput.value = '';
    titleInput.value = '';
    urlInput.value = '';
    descText.value = '';
    catSel.value = 'dsa';
  }

  modal.classList.add('open');
  titleInput.focus();
}

function closeResourceModal(e, force = false) {
  if (force || (e && e.target.id === 'resourceModal')) {
    document.getElementById('resourceModal').classList.remove('open');
  }
}

function handleResourceSubmit(e) {
  e.preventDefault();
  const id = document.getElementById('resourceId').value;
  const title = document.getElementById('resTitle').value.trim();
  const url = document.getElementById('resUrl').value.trim();
  const desc = document.getElementById('resDesc').value.trim();
  const category = document.getElementById('resCategory').value;

  const items = getResources();

  if (id) {
    // Edit existing
    const item = items.find(r => r.id === id);
    if (item) {
      item.title = title;
      item.url = url;
      item.desc = desc;
      item.category = category;
    }
    showToast('Resource updated!');
  } else {
    // Add new
    const newItem = {
      id: 'res-' + Date.now(),
      title,
      url,
      desc,
      category
    };
    items.push(newItem);
    showToast('Resource added!');
  }

  saveState();
  closeResourceModal(null, true);
  renderResources();
}

function editResource(id, e) {
  e.stopPropagation();
  const items = getResources();
  const item = items.find(r => r.id === id);
  if (item) {
    openResourceModal(item);
  }
}

function deleteResource(id, e) {
  e.stopPropagation();
  if (!confirm('Are you sure you want to delete this resource?')) return;
  appState.customResources = getResources().filter(r => r.id !== id);
  saveState();
  renderResources();
  showToast('Resource deleted!');
}

function copyText(txt) {
  navigator.clipboard.writeText(txt);
  showToast('Copied to clipboard!');
}

// ── PINGER VIEW ──
let pingHistory = [];
let pingTimer = null;

function renderPinger() {
  const c = document.getElementById('pingerContent');
  if(!c.innerHTML.includes('pinger-status-card')) {
    c.innerHTML = `
      <div class="pinger-status-card">
        <div class="status-indicator"></div>
        <div>
          <h3 style="margin:0; font-family:'Syne',sans-serif">SummerStudyHub Backend</h3>
          <div style="font-family:'JetBrains Mono',monospace; font-size:12px; color:var(--text-muted)">Tracking: /api/health</div>
        </div>
        <div style="margin-left:auto; font-family:'JetBrains Mono',monospace; color:var(--accent-dsa); font-size:18px;" id="pingLatency">Checking...</div>
      </div>
      <div class="res-card">
         <div class="res-card-title">Latency Log</div>
         <div id="pingLog" style="font-family:'JetBrains Mono',monospace; font-size:12px; color:var(--text-muted); max-height:200px; overflow-y:auto; margin-bottom:16px;"></div>
         <svg class="latency-chart" viewBox="0 0 400 60" preserveAspectRatio="none">
            <polyline id="latencyPolyline" class="latency-line" points=""></polyline>
         </svg>
      </div>
    `;
  }
  
  if (!pingTimer) {
    pingTimer = setTimeout(checkPing, 0);
  }
}

async function checkPing() {
  if (currentView !== 'pinger') {
    clearTimeout(pingTimer);
    pingTimer = null;
    return;
  }
  
  const start = Date.now();
  try {
    const res = await fetch('/api/health'); 
    if (currentView !== 'pinger') {
      pingTimer = null;
      return;
    }
    const latency = Date.now() - start;
    const latencyEl = document.getElementById('pingLatency');
    if (latencyEl) latencyEl.textContent = latency + 'ms';
    const statusEl = document.querySelector('.status-indicator');
    if (statusEl) statusEl.style.background = 'var(--accent-os)';
    logPing(latency);
  } catch (e) {
    if (currentView !== 'pinger') {
      pingTimer = null;
      return;
    }
    const latencyEl = document.getElementById('pingLatency');
    if (latencyEl) latencyEl.textContent = 'ERROR';
    const statusEl = document.querySelector('.status-indicator');
    if (statusEl) statusEl.style.background = '#ff3366';
  }
  
  if (currentView === 'pinger') {
    pingTimer = setTimeout(checkPing, 5000);
  } else {
    pingTimer = null;
  }
}

function logPing(ms) {
  const log = document.getElementById('pingLog');
  if(!log) return;
  const t = new Date().toLocaleTimeString();
  log.innerHTML = `<div>[${t}] GET /api/health - ${ms}ms</div>` + log.innerHTML;
  
  pingHistory.push(ms);
  if(pingHistory.length > 30) pingHistory.shift();
  
  const poly = document.getElementById('latencyPolyline');
  if(poly) {
    const max = Math.max(...pingHistory, 50);
    const pts = pingHistory.map((v, i) => {
      const x = (i / 29) * 400;
      const y = 60 - ((v / max) * 50);
      return `${x},${y}`;
    }).join(' ');
    poly.setAttribute('points', pts);
  }
}

// ── UTILITIES ──
function resetAllProgress() {
  document.getElementById('resetModal').classList.add('open');
}

function closeResetModal(e, force = false) {
  if (force || (e && e.target.id === 'resetModal')) {
    document.getElementById('resetModal').classList.remove('open');
  }
}

function confirmResetAll() {
  closeResetModal(null, true);
  appState.completed = {};
  appState.streak = 0;
  appState.lastActiveDate = null;
  appState.xp = 0;
  appState.heatmap = {};
  appState.notes = {};
  appState.lastLevel = 1;
  appState.studySessions = [];
  appState.subjects = ['DSA', 'ML'];
  appState.customResources = [...DEFAULT_RESOURCES];
  saveState();
  renderDashboard();
  renderChecklist();
  showToast('Progress reset 🗑️');
}

function exportProgress() {
  const blob = new Blob([JSON.stringify(appState, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `summer-study-hub-backup-${new Date().toISOString().split('T')[0]}.json`;
  a.click();
  URL.revokeObjectURL(url);
  showToast('Progress exported! 💾');
}

function showToast(message) {
  const container = document.getElementById('toastContainer');
  const toast = document.createElement('div');
  toast.className = 'toast';
  toast.textContent = message;
  container.appendChild(toast);
  setTimeout(() => toast.remove(), 3000);
}

// ── AUTH & CLOUD USER INTERFACE ──
let authActiveTab = 'login';

function renderUserWidget() {
  const container = document.getElementById('userWidget');
  if (!container) return;

  if (appState.user) {
    container.innerHTML = `
      <div class="user-btn logged-in" title="Sync Status: Cloud Sync Active">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="user-icon" style="color:var(--accent-os)"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
        <span class="user-name">${appState.user.username}</span>
        <button class="user-logout-btn" onclick="logout()" title="Logout">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
        </button>
      </div>
    `;
  } else {
    container.innerHTML = `
      <button class="user-btn" onclick="openAuthModal()" title="Login or Register to backup progress">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="user-icon" style="color:var(--accent-dsa)"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
        <span class="user-name">Sign In</span>
      </button>
    `;
  }
}

function openAuthModal() {
  document.getElementById('authErrorMsg').textContent = '';
  document.getElementById('authUsername').value = '';
  document.getElementById('authPassword').value = '';
  switchAuthTab('login');
  document.getElementById('authModal').classList.add('open');
  document.getElementById('authUsername').focus();
}

function closeAuthModal(e, force = false) {
  if (force || (e && e.target.id === 'authModal')) {
    document.getElementById('authModal').classList.remove('open');
  }
}

function switchAuthTab(tab) {
  authActiveTab = tab;
  document.getElementById('authTabLogin').classList.toggle('active', tab === 'login');
  document.getElementById('authTabRegister').classList.toggle('active', tab === 'register');
  document.getElementById('authSubmitBtn').textContent = tab === 'login' ? 'Sign In' : 'Create Account';
  document.getElementById('authErrorMsg').textContent = '';
}

async function handleAuthSubmit(e) {
  e.preventDefault();
  const username = document.getElementById('authUsername').value;
  const password = document.getElementById('authPassword').value;
  const errorEl = document.getElementById('authErrorMsg');
  errorEl.textContent = '';

  const url = authActiveTab === 'login' ? '/api/auth/login' : '/api/auth/register';

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });
    
    const data = await res.json();
    if (res.ok) {
      localStorage.setItem('ssh_auth_token', data.token);
      localStorage.setItem('ssh_auth_username', data.username);
      appState.user = { token: data.token, username: data.username };
      
      closeAuthModal(null, true);
      showToast(authActiveTab === 'login' ? 'Logged in successfully!' : 'Account created successfully!');
      
      // Perform guest migration and fetch cloud progress
      await syncCloudProgress();
      await fetchCloudProgress();
      renderUserWidget();
    } else {
      errorEl.textContent = data.error || 'Authentication failed.';
    }
  } catch (err) {
    errorEl.textContent = 'Could not connect to auth service. DB may be offline.';
  }
}

function logout(forced = false) {
  if (forced || confirm('Are you sure you want to sign out? Your progress will remain saved on this device.')) {
    localStorage.removeItem('ssh_auth_token');
    localStorage.removeItem('ssh_auth_username');
    appState.user = null;
    renderUserWidget();
    showToast('Signed out.');
  }
}



// ── BOOT ──
function init() {
  initTheme();
  renderDashboard();
  renderUserWidget();
  
  if (appState.user) {
    fetchCloudProgress();
  }

  if (typeof getChecklistData() === 'undefined' || typeof SCHEDULE_DATA === 'undefined') {
    console.warn('Data not loaded yet. Some features may not work.');
  }

  // Visibility change listener to handle background tab timer counting accurately
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') {
      if (timerIsRunning) {
        updateTimerTick();
      }
    }
  });
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
