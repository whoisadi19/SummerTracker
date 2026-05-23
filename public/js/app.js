/* ═══════════════════════════════════════════════════════════════
   SUMMER STUDY HUB — Core Application Logic
   ═══════════════════════════════════════════════════════════════ */

// ── STATE ──
const STORAGE_KEY = 'summerStudyHub_v1';
let appState = loadState();

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch (e) {}
  return { completed: {}, theme: 'cyber', streak: 0, lastActiveDate: null, bestStreak: 0 };
}

function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(appState));
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
}

// ── NAVIGATION ──
let currentView = 'dashboard';

function navigate(view) {
  currentView = view;
  document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
  document.getElementById('view-' + view).classList.add('active');

  document.querySelectorAll('.nav-item, .mob-nav-item').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.view === view);
  });

  // Re-render the view
  if (view === 'dashboard') renderDashboard();
  else if (view === 'schedule') renderSchedule();
  else if (view === 'checklist') renderChecklist();
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

// ── PROGRESS CALCULATIONS ──
function getProgress() {
  let dsaTotal = 0, dsaDone = 0;
  let mlTotal = 0, mlDone = 0;

  if (typeof CHECKLIST_DATA !== 'undefined') {
    CHECKLIST_DATA.dsa.forEach(week => {
      week.units.forEach(unit => {
        unit.items.forEach(item => {
          dsaTotal++;
          if (appState.completed[item.id]) dsaDone++;
        });
      });
    });

    CHECKLIST_DATA.ml.forEach(week => {
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
  if (typeof CHECKLIST_DATA === 'undefined') return { total: 0, done: 0 };
  const weekData = CHECKLIST_DATA[type].find(w => w.week === weekNum);
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

// ── STREAK ──
function updateStreak() {
  const todayStr = new Date().toISOString().split('T')[0];

  if (appState.lastActiveDate === todayStr) return; // Already counted today

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

// ── PROGRESS RING ANIMATION ──
function setRingProgress(id, pct) {
  const circle = document.getElementById(id);
  if (!circle) return;
  const circumference = 2 * Math.PI * 52; // r=52
  const offset = circumference - (pct / 100) * circumference;
  circle.style.strokeDashoffset = offset;
}

// ── RENDER: DASHBOARD ──
function renderDashboard() {
  const info = getTodayInfo();
  const progress = getProgress();

  // Greeting
  document.getElementById('greetingTitle').textContent = `${getGreeting()}, Aditya`;

  if (info.isFuture) {
    document.getElementById('greetingSub').textContent = `Starts in ${Math.abs(info.dayIndex)} days · Get ready!`;
  } else if (info.isPast) {
    document.getElementById('greetingSub').textContent = `Plan complete! 🎉`;
  } else {
    document.getElementById('greetingSub').textContent = `Day ${info.dayIndex + 1} of ${TOTAL_DAYS} · Week ${info.weekIndex + 1}`;
  }

  // Streak
  document.getElementById('streakCount').textContent = appState.streak || 0;

  // Progress rings
  document.getElementById('ringPctDsa').textContent = progress.dsa.pct + '%';
  document.getElementById('ringPctMl').textContent = progress.ml.pct + '%';
  document.getElementById('ringPctOverall').textContent = progress.overall.pct + '%';

  setRingProgress('ringFillDsa', progress.dsa.pct);
  setRingProgress('ringFillMl', progress.ml.pct);
  setRingProgress('ringFillOverall', progress.overall.pct);

  // Today's agenda
  const todayCards = document.getElementById('todayCards');
  const todayDateEl = document.getElementById('todayDate');
  todayDateEl.textContent = formatDate(new Date());

  if (typeof SCHEDULE_DATA !== 'undefined' && info.isActive && info.weekIndex < SCHEDULE_DATA.length) {
    const week = SCHEDULE_DATA[info.weekIndex];
    const dayInWeek = info.dayIndex % 7;

    if (week.days && week.days[dayInWeek]) {
      const day = week.days[dayInWeek];
      todayCards.innerHTML = `
        <div class="today-card">
          <div class="today-dot dsa"></div>
          <div>
            <div class="today-card-label dsa">DSA</div>
            <div class="today-card-text">${day.dsa}</div>
          </div>
        </div>
        <div class="today-card">
          <div class="today-dot ml"></div>
          <div>
            <div class="today-card-label ml">ML</div>
            <div class="today-card-text">${day.ml}</div>
          </div>
        </div>
        <div class="today-card">
          <div class="today-dot os"></div>
          <div>
            <div class="today-card-label os">Open Source</div>
            <div class="today-card-text">${day.os}</div>
          </div>
        </div>
      `;
    } else {
      todayCards.innerHTML = `<div class="today-empty"><div class="today-empty-emoji">📋</div>No specific tasks for today</div>`;
    }
  } else if (info.isFuture) {
    todayCards.innerHTML = `<div class="today-empty"><div class="today-empty-emoji">🚀</div>Your plan starts May 24. Get ready!</div>`;
  } else {
    todayCards.innerHTML = `<div class="today-empty"><div class="today-empty-emoji">🎉</div>Summer plan complete! Amazing work.</div>`;
  }

  // Quick stats
  document.getElementById('statDsaDone').textContent = progress.dsa.done;
  document.getElementById('statMlDone').textContent = progress.ml.done;
  document.getElementById('statCurrentWeek').textContent = info.isActive ? info.weekIndex + 1 : (info.isPast ? '✓' : '—');
  document.getElementById('statDaysLeft').textContent = info.daysLeft;
}

// ── RENDER: SCHEDULE ──
function renderSchedule() {
  if (typeof SCHEDULE_DATA === 'undefined') return;

  const container = document.getElementById('scheduleWeeks');
  const info = getTodayInfo();
  let html = '';

  // Group by phase
  const phases = [
    { num: 1, title: 'Build the <span class="c-dsa">Foundation</span>', sub: 'C++ basics, STL, Recursion · Andrew Ng Course 1 · First open source PR', weeks: [1, 2, 3] },
    { num: 2, title: 'Level <span class="c-ml">Up</span>', sub: 'Binary Search, Strings, Linked Lists · Andrew Ng Course 2 · Consistent PRs', weeks: [4, 5, 6] }
  ];

  phases.forEach((phase, pi) => {
    html += `
      <div class="phase-header">
        <div class="phase-label">Phase ${phase.num} · Weeks ${phase.weeks[0]}–${phase.weeks[phase.weeks.length - 1]}</div>
        <div class="phase-title">${phase.title}</div>
        <div class="phase-sub">${phase.sub}</div>
      </div>
      <div class="schedule-weeks">
    `;

    phase.weeks.forEach(wNum => {
      const week = SCHEDULE_DATA.find(w => w.week === wNum);
      if (!week) return;

      const isCurrent = info.isActive && info.weekIndex === wNum - 1;
      const isOpen = isCurrent;

      html += `
        <div class="wcard${isOpen ? ' open' : ''}${isCurrent ? ' current-week' : ''}" id="sched-w${wNum}">
          <div class="wcard-head" onclick="toggleScheduleWeek('sched-w${wNum}')">
            <div class="wcard-left">
              <div class="wnum">Week ${String(wNum).padStart(2, '0')}</div>
              <div>
                <div class="wtitle">${week.title}</div>
                <div class="wdates">${week.dates}</div>
              </div>
            </div>
            <div class="wcard-right">
              <div class="wtags">
                ${week.tags.map(t => `<span class="wtag ${t.type}">${t.label}</span>`).join('')}
              </div>
              <div class="chevron">▾</div>
            </div>
          </div>
          <div class="wcard-body">
            <div class="wtargets">
              ${week.targets.dsa ? `<div class="tcard dsa"><div class="tcard-label">DSA Target</div><ul>${week.targets.dsa.map(t => `<li>${t}</li>`).join('')}</ul></div>` : ''}
              ${week.targets.ml ? `<div class="tcard ml"><div class="tcard-label">ML Target</div><ul>${week.targets.ml.map(t => `<li>${t}</li>`).join('')}</ul></div>` : ''}
              ${week.targets.os ? `<div class="tcard os"><div class="tcard-label">Open Source</div><ul>${week.targets.os.map(t => `<li>${t}</li>`).join('')}</ul></div>` : ''}
            </div>
            <div class="days-label">Daily Breakdown</div>
            <div class="day-rows">
              ${week.days.map((day, di) => {
                const isToday = isCurrent && (info.dayIndex % 7 === di);
                return `
                  <div class="day-row${isToday ? ' today-row' : ''}">
                    <div class="day-name">${day.name}</div>
                    <div class="day-cell dsa"><div class="day-cell-label">DSA</div><div class="day-cell-val">${day.dsa}</div></div>
                    <div class="day-cell ml"><div class="day-cell-label">ML</div><div class="day-cell-val">${day.ml}</div></div>
                    <div class="day-cell os"><div class="day-cell-label">Open Source</div><div class="day-cell-val">${day.os}</div></div>
                  </div>
                `;
              }).join('')}
            </div>
          </div>
        </div>
      `;
    });

    html += '</div>';

    if (pi < phases.length - 1) {
      html += '<hr class="phase-divider">';
    }
  });

  container.innerHTML = html;
}

function toggleScheduleWeek(id) {
  document.getElementById(id).classList.toggle('open');
}

// ── RENDER: CHECKLIST ──
let currentChecklistTab = 'dsa';

function renderChecklist() {
  if (typeof CHECKLIST_DATA === 'undefined') return;

  const progress = getProgress();

  // Update progress bars
  document.getElementById('clDsaNum').textContent = `${progress.dsa.done} / ${progress.dsa.total}`;
  document.getElementById('clMlNum').textContent = `${progress.ml.done} / ${progress.ml.total}`;
  document.getElementById('clDsaBar').style.width = progress.dsa.pct + '%';
  document.getElementById('clMlBar').style.width = progress.ml.pct + '%';

  renderChecklistContent();
}

function renderChecklistContent() {
  if (typeof CHECKLIST_DATA === 'undefined') return;

  const data = CHECKLIST_DATA[currentChecklistTab];
  const container = document.getElementById('clContent');
  const info = getTodayInfo();
  let html = '';

  data.forEach((weekData, wi) => {
    const wp = getWeekProgress(currentChecklistTab, weekData.week);
    const isCurrentWeek = info.isActive && info.weekIndex === weekData.week - 1;
    const isOpen = isCurrentWeek || weekData.week === 1;

    html += `
      <div class="cl-week${isOpen ? ' open' : ''}" id="cl-${currentChecklistTab}-w${weekData.week}">
        <div class="cl-week-header" onclick="toggleChecklistWeek('cl-${currentChecklistTab}-w${weekData.week}')">
          <div class="cl-week-label">Week ${weekData.week}</div>
          <div class="cl-week-dates">${weekData.dates}</div>
          <div class="cl-week-prog ${currentChecklistTab}">${wp.done}/${wp.total}</div>
          <div class="cl-week-chevron">▾</div>
        </div>
        <div class="cl-week-rule"></div>
        <div class="cl-week-body">
    `;

    weekData.units.forEach(unit => {
      html += `<div class="cl-unit-label">${unit.title}</div><div class="cl-item-list">`;

      unit.items.forEach(item => {
        const isDone = appState.completed[item.id];
        const tags = (item.tags || []).map(t => {
          let cls = 'lc';
          const tl = t.toLowerCase();
          if (tl === 'critical') cls = 'critical';
          else if (tl === 'hard') cls = 'hard';
          else if (tl.startsWith('key')) cls = 'key';
          else if (tl.startsWith('lc')) cls = 'lc';
          return `<span class="cl-item-tag ${cls}">${t}</span>`;
        }).join('');

        html += `
          <div class="cl-item${isDone ? ' done' : ''}" onclick="toggleItem('${item.id}', this)">
            <div class="cl-checkbox ${currentChecklistTab}"><span class="cl-checkmark">✓</span></div>
            <div class="cl-item-text">${item.text}</div>
            ${tags}
          </div>
        `;
      });

      html += '</div>';
    });

    html += '</div></div>';
  });

  container.innerHTML = html;
}

function switchChecklistTab(tab) {
  currentChecklistTab = tab;
  document.querySelectorAll('.cl-tab').forEach(t => t.classList.toggle('active', t.dataset.tab === tab));
  renderChecklistContent();
}

function toggleChecklistWeek(id) {
  document.getElementById(id).classList.toggle('open');
}

function toggleItem(id, el) {
  const isDone = !appState.completed[id];
  appState.completed[id] = isDone || undefined;
  if (!isDone) delete appState.completed[id];

  // Update streak on completion
  if (isDone) updateStreak();

  saveState();

  // Toggle visual state
  el.classList.toggle('done', isDone);

  // Update progress numbers
  updateChecklistProgress();

  // Update dashboard if visible
  if (currentView === 'dashboard') renderDashboard();
}

function updateChecklistProgress() {
  const progress = getProgress();
  document.getElementById('clDsaNum').textContent = `${progress.dsa.done} / ${progress.dsa.total}`;
  document.getElementById('clMlNum').textContent = `${progress.ml.done} / ${progress.ml.total}`;
  document.getElementById('clDsaBar').style.width = progress.dsa.pct + '%';
  document.getElementById('clMlBar').style.width = progress.ml.pct + '%';

  // Update week progress counters
  if (typeof CHECKLIST_DATA !== 'undefined') {
    CHECKLIST_DATA[currentChecklistTab].forEach(weekData => {
      const wp = getWeekProgress(currentChecklistTab, weekData.week);
      const el = document.querySelector(`#cl-${currentChecklistTab}-w${weekData.week} .cl-week-prog`);
      if (el) el.textContent = `${wp.done}/${wp.total}`;
    });
  }
}

// ── RESET ──
function resetAllProgress() {
  if (!confirm('Reset all progress? This cannot be undone.')) return;
  appState.completed = {};
  appState.streak = 0;
  appState.lastActiveDate = null;
  saveState();
  renderChecklist();
  showToast('Progress reset');
}

// ── EXPORT / IMPORT ──
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

// ── TOAST ──
function showToast(message) {
  const container = document.getElementById('toastContainer');
  const toast = document.createElement('div');
  toast.className = 'toast';
  toast.textContent = message;
  container.appendChild(toast);
  setTimeout(() => toast.remove(), 3000);
}

// ── BOOT ──
function init() {
  initTheme();
  renderDashboard();

  // Check if data is loaded
  if (typeof CHECKLIST_DATA === 'undefined' || typeof SCHEDULE_DATA === 'undefined') {
    console.warn('Data not loaded yet. Some features may not work.');
  }
}

// Wait for DOM
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
