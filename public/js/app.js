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
        theme: appState.theme
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
  const ctx = canvas.getContext('2d');
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

// ── POMODORO ──
let pomoTimer = null;
let pomoTimeLeft = 25 * 60;
let pomoMode = 'work';

function togglePomodoro() {
  const icon = document.getElementById('pomoPlayIcon');
  if (pomoTimer) {
    clearInterval(pomoTimer);
    pomoTimer = null;
    icon.innerHTML = '<polygon points="5 3 19 12 5 21 5 3"></polygon>';
  } else {
    pomoTimer = setInterval(() => {
      pomoTimeLeft--;
      if (pomoTimeLeft <= 0) {
        clearInterval(pomoTimer);
        pomoTimer = null;
        showToast('Session Complete! 🍅');
        if (pomoMode === 'work') { shootConfetti(); appState.xp = (appState.xp||0)+20; saveState(); }
        icon.innerHTML = '<polygon points="5 3 19 12 5 21 5 3"></polygon>';
        renderDashboard(); // Update XP
      }
      updatePomodoroUI();
    }, 1000);
    icon.innerHTML = '<rect x="6" y="4" width="4" height="16"></rect><rect x="14" y="4" width="4" height="16"></rect>';
  }
}

function resetPomodoro() {
  if (pomoTimer) { clearInterval(pomoTimer); pomoTimer = null; }
  document.getElementById('pomoPlayIcon').innerHTML = '<polygon points="5 3 19 12 5 21 5 3"></polygon>';
  pomoTimeLeft = pomoMode === 'work' ? 25 * 60 : 5 * 60;
  updatePomodoroUI();
}

function setPomodoroMode(m) {
  pomoMode = m;
  document.getElementById('pomoMode').textContent = m === 'work' ? 'Work' : 'Break';
  document.querySelectorAll('.pomo-preset').forEach(b => b.classList.remove('active'));
  event.target.classList.add('active');
  resetPomodoro();
}

function updatePomodoroUI() {
  const m = Math.floor(pomoTimeLeft / 60);
  const s = pomoTimeLeft % 60;
  const timeEl = document.getElementById('pomoTime');
  if(timeEl) timeEl.textContent = `${m.toString().padStart(2,'0')}:${s.toString().padStart(2,'0')}`;
  
  const total = pomoMode === 'work' ? 25 * 60 : 5 * 60;
  const pct = ((total - pomoTimeLeft) / total) * 100;
  const ring = document.getElementById('pomoRing');
  if(ring) {
    const circumference = 2 * Math.PI * 90;
    ring.style.strokeDashoffset = circumference - (pct / 100) * circumference;
  }
}

// ── RENDER: DASHBOARD ──
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

  let weekIndex = info.weekIndex;
  let dayInWeek = ((info.dayIndex % 7) + 7) % 7;
  let isPreview = false;

  if (info.isFuture) {
    weekIndex = 0;
    dayInWeek = 0; // Show Week 1 Day 1 as preview
    isPreview = true;
  }

  if (typeof SCHEDULE_DATA !== 'undefined' && (info.isActive || isPreview) && weekIndex < SCHEDULE_DATA.length && weekIndex >= 0) {
    const week = SCHEDULE_DATA[weekIndex];
    if (week.days && week.days[dayInWeek]) {
      const day = week.days[dayInWeek];
      todayCards.innerHTML = `
        ${isPreview ? `<div class="preview-badge" style="grid-column: 1 / -1; background: rgba(0, 229, 255, 0.1); border: 1px dashed var(--accent-dsa); color: var(--accent-dsa); padding: 8px 12px; border-radius: 8px; font-family: 'Outfit', sans-serif; font-size: 13px; text-align: center; margin-bottom: 8px;">⏳ Plan starts soon! Showing Day 1 Preview:</div>` : ''}
        <div class="today-card"><div class="today-dot dsa"></div><div><div class="today-card-label dsa">DSA</div><div class="today-card-text">${day.dsa}</div></div></div>
        <div class="today-card"><div class="today-dot ml"></div><div><div class="today-card-label ml">ML</div><div class="today-card-text">${day.ml}</div></div></div>
        
      `;
    } else {
      todayCards.innerHTML = `<div class="today-empty">📋 No specific tasks for today</div>`;
    }
  } else {
    todayCards.innerHTML = `<div class="today-empty">🚀 Keep up the momentum!</div>`;
  }

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

  renderHeatmap();
  updatePomodoroUI();
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

// ── RESOURCES VIEW ──
let resTab = 'dsa-roadmap';
function switchResourceTab(tab) {
  resTab = tab;
  document.querySelectorAll('#view-resources .cl-tab').forEach(t => t.classList.toggle('active', t.dataset.tab === tab));
  renderResources();
}

function renderResources() {
  const c = document.getElementById('resContent');
  if (resTab === 'dsa-roadmap') {
    c.innerHTML = `
      <div class="res-card">
        <div class="res-card-title">C++ DSA Core Roadmap</div>
        <div style="font-family:'Outfit',sans-serif; color:var(--text-muted); margin-bottom:16px;">
          Your step-by-step path to algorithmic mastery. Click a step to copy its focus prompt.
        </div>
        <div class="res-step">
           <div class="res-step-label">UNIT 1 · Syntax & Logic</div>
           <div style="font-family:'Syne',sans-serif; font-size:16px; color:var(--text-primary);">C++ Basics, Data Types, Control Flow</div>
           <div class="res-step-prompt">"Explain C++ memory management and references for a beginner with code examples."</div>
           <button class="res-copy-btn" onclick="copyText('Explain C++ memory management and references for a beginner with code examples.')">📋 Copy Prompt</button>
        </div>
        <div class="res-step">
           <div class="res-step-label">UNIT 2 · STL & Efficiency</div>
           <div style="font-family:'Syne',sans-serif; font-size:16px; color:var(--text-primary);">C++ Standard Template Library (Vectors, Maps)</div>
           <div class="res-step-prompt">"What are the time complexities of standard STL containers like std::map, std::unordered_map, and std::vector?"</div>
           <button class="res-copy-btn" onclick="copyText('What are the time complexities of standard STL containers like std::map, std::unordered_map, and std::vector?')">📋 Copy Prompt</button>
        </div>
        <div class="res-step">
           <div class="res-step-label">UNIT 3 · Algorithmic Paradigms</div>
           <div style="font-family:'Syne',sans-serif; font-size:16px; color:var(--text-primary);">Recursion & Backtracking Foundation</div>
           <div class="res-step-prompt">"Teach me how to convert an iterative solution to a recursive one in C++, using a tree analogy."</div>
           <button class="res-copy-btn" onclick="copyText('Teach me how to convert an iterative solution to a recursive one in C++, using a tree analogy.')">📋 Copy Prompt</button>
        </div>
      </div>
    `;
  } else {
    c.innerHTML = `
      <div class="res-card">
        <div class="res-card-title">Open Source PR Playbook</div>
        <div style="font-family:'Outfit',sans-serif; color:var(--text-muted); margin-bottom:16px;">
          5-Step Guide to Landing Your First Merged PR
        </div>
        <div class="res-step">
           <div class="res-step-label">STEP 1 · Discovery</div>
           <div style="font-family:'Syne',sans-serif; font-size:16px; color:var(--text-primary);">Find good first issues on GitHub</div>
           <div class="res-step-prompt">"Find me active open source C++ or Python repositories with 'good first issue' tags."</div>
           <button class="res-copy-btn" onclick="copyText('Find me active open source C++ or Python repositories with good first issue tags.')">📋 Copy Prompt</button>
        </div>
        <div class="res-step">
           <div class="res-step-label">STEP 2 · Environment</div>
           <div style="font-family:'Syne',sans-serif; font-size:16px; color:var(--text-primary);">Fork, Clone, and Build</div>
           <div class="res-step-prompt">"git clone [URL]\ncd [repo]\nmkdir build && cd build\ncmake .. && make"</div>
           <button class="res-copy-btn" onclick="copyText('git clone [URL]\\ncd [repo]\\nmkdir build && cd build\\ncmake .. && make')">📋 Copy Prompt</button>
        </div>
        <div class="res-step">
           <div class="res-step-label">STEP 3 · Implementation</div>
           <div style="font-family:'Syne',sans-serif; font-size:16px; color:var(--text-primary);">Write clean, conforming code</div>
           <div class="res-step-prompt">"Review my C++ code snippet against standard LLVM style guidelines before I submit."</div>
           <button class="res-copy-btn" onclick="copyText('Review my C++ code snippet against standard LLVM style guidelines before I submit.')">📋 Copy Prompt</button>
        </div>
      </div>
    `;
  }
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
  
  if (!pingTimer) checkPing();
}

async function checkPing() {
  if (currentView !== 'pinger') {
    clearTimeout(pingTimer);
    pingTimer = null;
    return;
  }
  const start = Date.now();
  try {
    // Ping our own express server health route
    const res = await fetch('/api/health'); 
    const latency = Date.now() - start;
    document.getElementById('pingLatency').textContent = latency + 'ms';
    document.querySelector('.status-indicator').style.background = 'var(--accent-os)';
    logPing(latency);
  } catch (e) {
    document.getElementById('pingLatency').textContent = 'ERROR';
    document.querySelector('.status-indicator').style.background = '#ff3366';
  }
  pingTimer = setTimeout(checkPing, 5000);
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
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
