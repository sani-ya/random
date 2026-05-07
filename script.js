/* ═══════════════════════════════════════════════════════════════════
   Bloom Habit Tracker — script.js
═══════════════════════════════════════════════════════════════════ */

// ── Constants ────────────────────────────────────────────────────────
const EMOJIS = ['🌸','🌿','💧','📚','💪','🧘','🎯','✍️','🎨','🏃','🍎','😴','☀️','🌙','🎵','🧹','💊','🐾','🌱','❤️','🦋','⭐','🎭','🏋️'];
const COLORS = ['#E8A0BF','#C8B8E8','#B8D8E8','#B8E8D8','#F8D0B8','#F0C060','#D4A8E8','#A8D8A8','#E8C8A8','#A8C8E8'];
const MOODS  = ['😢','😕','😐','🙂','😄'];
const QUOTES = [
  "Small steps every day lead to big changes. 🌸",
  "You are doing better than you think. ✨",
  "Progress over perfection, always. 🌿",
  "Every expert was once a beginner. 💪",
  "Consistency is the key to transformation. 🗝️",
  "Bloom where you are planted. 🌺",
  "Your future self is cheering for you. 🌟",
  "One habit at a time, one day at a time. 🌈",
];

// ── Storage ──────────────────────────────────────────────────────────
const storage = {
  get: (key, fallback = null) => {
    try { const v = localStorage.getItem(key); return v ? JSON.parse(v) : fallback; } catch { return fallback; }
  },
  set: (key, val) => { try { localStorage.setItem(key, JSON.stringify(val)); } catch {} }
};

// ── State ─────────────────────────────────────────────────────────────
let state = {
  habits:   storage.get('bloom_habits', [
    { id: '1', name: 'Morning Routine', emoji: '☀️', color: '#E8A0BF' },
    { id: '2', name: 'Exercise',        emoji: '💪', color: '#C8B8E8' },
    { id: '3', name: 'Reading',         emoji: '📚', color: '#B8D8E8' },
    { id: '4', name: 'Meditation',      emoji: '🧘', color: '#B8E8D8' },
    { id: '5', name: 'Drink Water',     emoji: '💧', color: '#F8D0B8' },
  ]),
  logs:     storage.get('bloom_logs',   {}),   // { 'YYYY-MM-DD': { habitId: bool, ... } }
  moods:    storage.get('bloom_moods',  {}),   // { 'YYYY-MM-DD': 0-4 }
  water:    storage.get('bloom_water',  {}),   // { 'YYYY-MM-DD': 0-8 }
  journal:  storage.get('bloom_journal',{}),   // { 'YYYY-MM-DD': string }
  theme:    storage.get('bloom_theme',  'light'),
  calDate:  new Date(),
  selectedDay: null,
  editHabit: null,
  activeNav: 'home',
};

const today = () => fmt(new Date());
function fmt(d) {
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
}
function parseDate(s) {
  const [y,m,d] = s.split('-').map(Number);
  return new Date(y, m-1, d);
}
function save() {
  storage.set('bloom_habits',  state.habits);
  storage.set('bloom_logs',    state.logs);
  storage.set('bloom_moods',   state.moods);
  storage.set('bloom_water',   state.water);
  storage.set('bloom_journal', state.journal);
  storage.set('bloom_theme',   state.theme);
}

// ── Selectors ────────────────────────────────────────────────────────
const $ = (s, ctx = document) => ctx.querySelector(s);
const $$ = (s, ctx = document) => [...ctx.querySelectorAll(s)];

// ── Nav ───────────────────────────────────────────────────────────────
function showPage(name) {
  state.activeNav = name;
  $$('.page').forEach(p => p.classList.remove('active'));
  $$('.nav-item').forEach(n => n.classList.remove('active'));
  $(`#page-${name}`).classList.add('active');
  $(`.nav-item[data-page="${name}"]`).classList.add('active');
  if (name === 'home')     renderHome();
  if (name === 'calendar') renderCalendar();
  if (name === 'stats')    renderStats();
  if (name === 'journal')  renderJournal();
}

// ── Habit helpers ────────────────────────────────────────────────────
function isHabitDone(habitId, dateStr = today()) {
  return !!(state.logs[dateStr]?.[habitId]);
}
function toggleHabit(habitId, dateStr = today()) {
  if (!state.logs[dateStr]) state.logs[dateStr] = {};
  state.logs[dateStr][habitId] = !state.logs[dateStr][habitId];
  save();
}
function getStreak(habitId) {
  let streak = 0;
  let d = new Date();
  while (true) {
    const s = fmt(d);
    if (state.logs[s]?.[habitId]) { streak++; d.setDate(d.getDate()-1); }
    else break;
  }
  return streak;
}
function getTodayPct() {
  if (!state.habits.length) return 0;
  const done = state.habits.filter(h => isHabitDone(h.id)).length;
  return Math.round((done / state.habits.length) * 100);
}
function getWeekDays() {
  const days = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(); d.setDate(d.getDate() - i);
    days.push(fmt(d));
  }
  return days;
}

// ─── Confetti ────────────────────────────────────────────────────────
function spawnConfetti() {
  const colors = ['#E8A0BF','#C8B8E8','#B8E8D8','#F0C060','#B8D8E8'];
  for (let i = 0; i < 20; i++) {
    const el = document.createElement('div');
    el.className = 'confetti-piece';
    el.style.cssText = `
      left:${20 + Math.random()*60}vw;
      top:${Math.random()*30}vh;
      background:${colors[Math.floor(Math.random()*colors.length)]};
      animation-delay:${Math.random()*0.4}s;
      border-radius:${Math.random()>0.5?'50%':'2px'};
    `;
    document.body.appendChild(el);
    setTimeout(() => el.remove(), 1200);
  }
}

// ─── Toast ────────────────────────────────────────────────────────────
let toastTimer;
function toast(msg) {
  const t = $('#toast');
  t.textContent = msg;
  t.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.classList.remove('show'), 2200);
}

// ═══════════════════════════════════════════════════════════════════
// HOME PAGE
// ═══════════════════════════════════════════════════════════════════
function renderHome() {
  renderGreeting();
  renderStats();
  renderTodayHabits();
  renderWaterMood();
}

function renderGreeting() {
  const pct = getTodayPct();
  const h = new Date().getHours();
  const greeting = h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening';
  const quote = QUOTES[new Date().getDay() % QUOTES.length];

  $('#greeting-text').textContent = `${greeting}! ✨`;
  $('#greeting-quote').textContent = quote;

  // Ring
  const r = 32, circ = 2 * Math.PI * r;
  const fill = circ - (pct/100)*circ;
  $('#ring-circle').style.strokeDashoffset = fill;
  $('#ring-pct-label').textContent = pct + '%';

  const done = state.habits.filter(h => isHabitDone(h.id)).length;
  $('#progress-text').innerHTML = `<strong>${done} of ${state.habits.length} habits done</strong>Keep it up!`;
}

function renderDashStats() {
  // streak across all habits
  const allStreaks = state.habits.map(h => getStreak(h.id));
  const maxStreak  = allStreaks.length ? Math.max(...allStreaks) : 0;

  // total completed all time
  let totalDays = 0;
  Object.values(state.logs).forEach(dayLog => {
    Object.values(dayLog).forEach(v => { if(v) totalDays++; });
  });

  $('#stat-streak').textContent = maxStreak;
  $('#stat-total').textContent  = totalDays;

  // month completion
  const now = new Date();
  const monthStr = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}`;
  let monthDone = 0, monthPossible = 0;
  for (let d = 1; d <= now.getDate(); d++) {
    const ds = `${monthStr}-${String(d).padStart(2,'0')}`;
    monthPossible += state.habits.length;
    state.habits.forEach(h => { if (state.logs[ds]?.[h.id]) monthDone++; });
  }
  const monthPct = monthPossible ? Math.round((monthDone/monthPossible)*100) : 0;
  $('#stat-month').textContent = monthPct + '%';
}

function renderTodayHabits() {
  const list = $('#today-habits');
  if (!state.habits.length) {
    list.innerHTML = `<div class="empty-state"><div class="empty-icon">🌱</div><p>No habits yet!<br>Tap <strong>+ Add Habit</strong> to start your journey.</p></div>`;
    return;
  }
  list.innerHTML = state.habits.map(h => {
    const done   = isHabitDone(h.id);
    const streak = getStreak(h.id);
    return `
      <div class="habit-item ${done?'done':''}" data-id="${h.id}" onclick="tapHabit('${h.id}', event)">
        <div class="habit-check">
          <span class="habit-check-icon">✓</span>
        </div>
        <span class="habit-emoji">${h.emoji}</span>
        <div class="habit-info">
          <div class="habit-name">${h.name}</div>
          <div class="habit-streak">🔥 ${streak} day${streak!==1?'s':''} streak</div>
        </div>
        <div class="habit-actions">
          <button class="habit-action-btn" onclick="event.stopPropagation(); openEditHabit('${h.id}')" title="Edit">✏️</button>
          <button class="habit-action-btn" onclick="event.stopPropagation(); deleteHabit('${h.id}')" title="Delete">🗑️</button>
        </div>
      </div>`;
  }).join('');
}

function tapHabit(id, event) {
  const wasAllDone = getTodayPct() === 100;
  toggleHabit(id);
  const el = $(`.habit-item[data-id="${id}"]`);

  // Ripple
  const rect = el.getBoundingClientRect();
  const ripple = document.createElement('span');
  ripple.className = 'ripple';
  ripple.style.left = (event.clientX - rect.left - 40) + 'px';
  ripple.style.top  = (event.clientY - rect.top  - 40) + 'px';
  el.appendChild(ripple);
  setTimeout(() => ripple.remove(), 600);

  renderHome();

  const now = getTodayPct() === 100;
  if (!wasAllDone && now) {
    spawnConfetti();
    toast('🎉 All habits done! Amazing!');
  } else if (isHabitDone(id)) {
    toast('✅ Great job!');
  }
}

function renderWaterMood() {
  const t = today();
  const cups = state.water[t] || 0;
  const mood = state.moods[t] ?? null;

  const waterEl = $('#water-cups');
  waterEl.innerHTML = Array.from({length:8},(_,i) =>
    `<span class="water-cup ${i<cups?'filled':''}" onclick="setWater(${i+1})">💧</span>`
  ).join('');

  $$('.mood-btn').forEach((btn, i) => {
    btn.classList.toggle('active', mood === i);
  });
}

window.setWater = (n) => {
  const t = today();
  state.water[t] = state.water[t] === n ? 0 : n;
  save(); renderWaterMood();
  toast(`💧 ${state.water[t]} cups logged!`);
};
window.setMood = (i) => {
  const t = today();
  state.moods[t] = state.moods[t] === i ? null : i;
  save(); renderWaterMood();
  if (state.moods[t] !== null) toast(`${MOODS[i]} Mood saved!`);
};
window.tapHabit = tapHabit;

// ═══════════════════════════════════════════════════════════════════
// CALENDAR PAGE
// ═══════════════════════════════════════════════════════════════════
function renderCalendar() {
  const d  = state.calDate;
  const y  = d.getFullYear();
  const m  = d.getMonth();
  const first = new Date(y, m, 1).getDay();
  const days  = new Date(y, m+1, 0).getDate();
  const todayStr = today();

  $('#cal-month-label').textContent = d.toLocaleDateString('en-US',{month:'long',year:'numeric'});

  // Filter tabs
  renderCalFilterTabs();

  const grid = $('#cal-grid');
  let html = ['Su','Mo','Tu','We','Th','Fr','Sa'].map(l=>`<div class="cal-day-label">${l}</div>`).join('');

  for (let i = 0; i < first; i++) html += '<div class="cal-day empty"></div>';
  for (let day = 1; day <= days; day++) {
    const ds = `${y}-${String(m+1).padStart(2,'0')}-${String(day).padStart(2,'0')}`;
    const isToday = ds === todayStr;
    const isFuture = ds > todayStr;

    let dotHtml = '';
    let cls = 'cal-day';
    if (isToday) cls += ' today today-ring';
    if (isFuture) cls += ' future';

    if (!isFuture && state.habits.length) {
      const filter = state.calFilter || 'all';
      const habitsToCheck = filter === 'all' ? state.habits : state.habits.filter(h=>h.id===filter);
      const done = habitsToCheck.filter(h => state.logs[ds]?.[h.id]).length;
      const total = habitsToCheck.length;
      if (total > 0) {
        if (done === total) cls += ' all-done';
        else if (done > 0) cls += ' some-done';
        dotHtml = `<div class="cal-dots">${habitsToCheck.map(h=>
          `<div class="cal-dot" style="background:${state.logs[ds]?.[h.id]?h.color:'#ddd'}"></div>`
        ).join('')}</div>`;
      }
    }

    html += `<div class="${cls}" onclick="selectCalDay('${ds}')">${day}${dotHtml}</div>`;
  }
  grid.innerHTML = html;

  if (state.selectedDay) renderDayDetail(state.selectedDay);
}

function renderCalFilterTabs() {
  const tabs = $('#filter-tabs');
  const current = state.calFilter || 'all';
  tabs.innerHTML = [
    {id:'all', name:'All Habits', emoji:'🌸'},
    ...state.habits.map(h=>({id:h.id, name:h.name, emoji:h.emoji}))
  ].map(tab=>`
    <button class="filter-tab ${current===tab.id?'active':''}" onclick="setCalFilter('${tab.id}')">
      ${tab.emoji} ${tab.name}
    </button>
  `).join('');
}

window.setCalFilter = (id) => { state.calFilter = id; renderCalendar(); };
window.selectCalDay = (ds) => {
  state.selectedDay = state.selectedDay === ds ? null : ds;
  renderCalendar();
};

function renderDayDetail(ds) {
  const existing = $('#day-detail');
  if (existing) existing.remove();

  if (!state.habits.length) return;
  const date = parseDate(ds);
  const label = date.toLocaleDateString('en-US',{weekday:'long',month:'long',day:'numeric'});
  const isFuture = ds > today();

  const detail = document.createElement('div');
  detail.id = 'day-detail';
  detail.className = 'day-detail';
  detail.innerHTML = `
    <div class="day-detail-title">📅 ${label}</div>
    ${state.habits.map(h => {
      const done = state.logs[ds]?.[h.id];
      return `<div class="day-habit-mini">
        <div class="day-habit-dot" style="background:${done?h.color:'#ddd'}"></div>
        <span style="font-size:15px">${h.emoji}</span>
        <span style="${done?'color:var(--text)':'color:var(--text-soft);text-decoration:line-through'}">${h.name}</span>
        ${!isFuture ? `<span style="margin-left:auto;font-size:13px">${done?'✅':'○'}</span>` : ''}
      </div>`;
    }).join('')}
    ${state.moods[ds] !== undefined ? `<div class="day-habit-mini"><span>Mood:</span><span>${MOODS[state.moods[ds]]}</span></div>` : ''}
    ${state.water[ds] ? `<div class="day-habit-mini"><span>💧</span><span>${state.water[ds]} cups</span></div>` : ''}
    ${state.journal[ds] ? `<div class="day-habit-mini" style="flex-direction:column;align-items:flex-start;gap:4px"><span style="font-size:11px;color:var(--text-soft)">📓 Note</span><span style="font-size:12px;color:var(--text-mid)">${state.journal[ds].slice(0,80)}${state.journal[ds].length>80?'…':''}</span></div>` : ''}
  `;

  // Insert after cal grid
  $('#cal-grid').after(detail);
}

// ═══════════════════════════════════════════════════════════════════
// STATS PAGE
// ═══════════════════════════════════════════════════════════════════
let weekChart = null, moodChart = null;

function renderStats() {
  renderDashStats();
  renderHabitAnalytics();
  renderWeekChart();
  renderMoodChart();
}

function renderHabitAnalytics() {
  const list = $('#habit-analytics-list');
  if (!state.habits.length) {
    list.innerHTML = '<div class="empty-state"><div class="empty-icon">📊</div><p>Add habits to see analytics</p></div>';
    return;
  }
  const now = new Date();
  const days = now.getDate();
  list.innerHTML = state.habits.map(h => {
    let done = 0;
    for (let d = 1; d <= days; d++) {
      const ds = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
      if (state.logs[ds]?.[h.id]) done++;
    }
    const pct = Math.round((done/days)*100);
    return `
      <div class="habit-analytic-row">
        <div class="habit-analytic-header">
          <span class="habit-analytic-name">${h.emoji} ${h.name}</span>
          <span class="habit-analytic-pct">${pct}%</span>
        </div>
        <div class="progress-bar-wrap">
          <div class="progress-bar-fill" style="width:${pct}%;background:linear-gradient(90deg,${h.color},${h.color}99)"></div>
        </div>
        <div style="font-size:11px;color:var(--text-soft);margin-top:3px">${done}/${days} days · 🔥 ${getStreak(h.id)} streak</div>
      </div>`;
  }).join('');
}

function renderWeekChart() {
  const ctx = $('#week-chart');
  if (!ctx) return;
  if (weekChart) { weekChart.destroy(); weekChart = null; }

  const days = getWeekDays();
  const labels = days.map(d => parseDate(d).toLocaleDateString('en-US',{weekday:'short'}));
  const data   = days.map(d => {
    if (!state.habits.length) return 0;
    return state.habits.filter(h => state.logs[d]?.[h.id]).length;
  });

  const isDark = state.theme === 'dark';
  weekChart = new Chart(ctx, {
    type: 'bar',
    data: {
      labels,
      datasets: [{
        label: 'Habits Completed',
        data,
        backgroundColor: days.map((d,i) => d===today()
          ? 'rgba(232,160,191,0.9)'
          : `rgba(200,184,232,${0.4+i*0.07})`),
        borderRadius: 8,
        borderSkipped: false,
      }]
    },
    options: {
      responsive: true, maintainAspectRatio: false,
      plugins: { legend: { display: false } },
      scales: {
        y: {
          beginAtZero: true,
          max: Math.max(state.habits.length, 1),
          ticks: { stepSize: 1, color: isDark?'#705880':'#B0A0BB', font:{size:11} },
          grid:  { color: isDark?'rgba(255,255,255,0.05)':'rgba(200,184,232,0.15)' }
        },
        x: {
          ticks: { color: isDark?'#705880':'#B0A0BB', font:{size:11} },
          grid:  { display: false }
        }
      }
    }
  });
}

function renderMoodChart() {
  const ctx = $('#mood-chart');
  if (!ctx) return;
  if (moodChart) { moodChart.destroy(); moodChart = null; }

  const days = getWeekDays();
  const labels = days.map(d => parseDate(d).toLocaleDateString('en-US',{weekday:'short'}));
  const data   = days.map(d => state.moods[d] !== undefined ? state.moods[d]+1 : null);

  const isDark = state.theme === 'dark';
  moodChart = new Chart(ctx, {
    type: 'line',
    data: {
      labels,
      datasets: [{
        label: 'Mood',
        data,
        borderColor: '#E8A0BF',
        backgroundColor: 'rgba(232,160,191,0.12)',
        pointBackgroundColor: '#E8A0BF',
        pointRadius: 6,
        pointHoverRadius: 8,
        fill: true,
        tension: 0.4,
        spanGaps: true,
      }]
    },
    options: {
      responsive: true, maintainAspectRatio: false,
      plugins: { legend: { display: false } },
      scales: {
        y: {
          min: 0, max: 6,
          ticks: {
            stepSize: 1,
            color: isDark?'#705880':'#B0A0BB',
            callback: v => ['','😢','😕','😐','🙂','😄',''][v],
            font: { size: 12 }
          },
          grid: { color: isDark?'rgba(255,255,255,0.05)':'rgba(200,184,232,0.15)' }
        },
        x: {
          ticks: { color: isDark?'#705880':'#B0A0BB', font:{size:11} },
          grid: { display: false }
        }
      }
    }
  });
}

// ═══════════════════════════════════════════════════════════════════
// JOURNAL PAGE
// ═══════════════════════════════════════════════════════════════════
let journalDate = today();

function renderJournal() {
  const d = parseDate(journalDate);
  const label = d.toLocaleDateString('en-US',{weekday:'long',month:'long',day:'numeric'});
  $('#journal-date-label').textContent = label;
  $('#journal-input').value = state.journal[journalDate] || '';
  $('#journal-chars').textContent = `${(state.journal[journalDate]||'').length} characters`;

  const entries = Object.entries(state.journal)
    .filter(([k,v]) => v && k !== journalDate)
    .sort(([a],[b]) => b.localeCompare(a))
    .slice(0, 10);

  const list = $('#journal-entries');
  list.innerHTML = entries.length ? entries.map(([date,text]) => {
    const d = parseDate(date);
    return `<div class="journal-entry">
      <div class="journal-entry-date">
        ${d.toLocaleDateString('en-US',{weekday:'short',month:'long',day:'numeric',year:'numeric'})}
        ${state.moods[date] !== undefined ? ' · ' + MOODS[state.moods[date]] : ''}
      </div>
      <div class="journal-entry-text">${text.slice(0,200)}${text.length>200?'…':''}</div>
    </div>`;
  }).join('') : '<div class="empty-state" style="padding:20px"><div class="empty-icon">📓</div><p>Your journal entries will appear here</p></div>';
}

window.prevJournalDay = () => {
  const d = parseDate(journalDate);
  d.setDate(d.getDate()-1);
  journalDate = fmt(d);
  renderJournal();
};
window.nextJournalDay = () => {
  const d = parseDate(journalDate);
  if (fmt(d) >= today()) return;
  d.setDate(d.getDate()+1);
  journalDate = fmt(d);
  renderJournal();
};
window.saveJournal = () => {
  const text = $('#journal-input').value.trim();
  if (text) {
    state.journal[journalDate] = text;
    save();
    toast('📓 Entry saved!');
    renderJournal();
  } else {
    delete state.journal[journalDate];
    save();
    toast('Entry cleared');
    renderJournal();
  }
};

$('#journal-input')?.addEventListener('input', () => {
  $('#journal-chars').textContent = `${$('#journal-input').value.length} characters`;
});

// ═══════════════════════════════════════════════════════════════════
// HABIT MODAL
// ═══════════════════════════════════════════════════════════════════
let selectedEmoji = '🌸', selectedColor = '#E8A0BF';

function openAddHabit() {
  state.editHabit = null;
  selectedEmoji = '🌸'; selectedColor = '#E8A0BF';
  $('#modal-title').textContent = 'New Habit ✨';
  $('#habit-name-input').value = '';
  renderEmojiPicker();
  renderColorPicker();
  openModal();
}

window.openEditHabit = (id) => {
  const h = state.habits.find(h=>h.id===id);
  if (!h) return;
  state.editHabit = id;
  selectedEmoji = h.emoji; selectedColor = h.color;
  $('#modal-title').textContent = 'Edit Habit ✏️';
  $('#habit-name-input').value = h.name;
  renderEmojiPicker();
  renderColorPicker();
  openModal();
};

window.deleteHabit = (id) => {
  if (!confirm('Delete this habit?')) return;
  state.habits = state.habits.filter(h=>h.id!==id);
  save(); renderHome(); toast('🗑️ Habit deleted');
};

function renderEmojiPicker() {
  $('#emoji-picker').innerHTML = EMOJIS.map(e =>
    `<span class="emoji-opt ${e===selectedEmoji?'selected':''}" onclick="pickEmoji('${e}')">${e}</span>`
  ).join('');
}
function renderColorPicker() {
  $('#color-picker').innerHTML = COLORS.map(c =>
    `<div class="color-opt ${c===selectedColor?'selected':''}" style="background:${c}" onclick="pickColor('${c}')"></div>`
  ).join('');
}
window.pickEmoji = (e) => { selectedEmoji = e; renderEmojiPicker(); };
window.pickColor = (c) => { selectedColor = c; renderColorPicker(); };

window.saveHabit = () => {
  const name = $('#habit-name-input').value.trim();
  if (!name) { toast('Please enter a habit name'); return; }
  if (state.editHabit) {
    const h = state.habits.find(h=>h.id===state.editHabit);
    if (h) { h.name = name; h.emoji = selectedEmoji; h.color = selectedColor; }
    toast('✅ Habit updated!');
  } else {
    state.habits.push({ id: Date.now().toString(), name, emoji: selectedEmoji, color: selectedColor });
    toast('🌸 Habit added!');
  }
  save(); closeModal(); renderHome();
};

function openModal() {
  $('#modal-overlay').classList.add('open');
  setTimeout(() => $('#habit-name-input').focus(), 300);
}
function closeModal() { $('#modal-overlay').classList.remove('open'); }
window.closeModal = closeModal;
$('#modal-overlay').addEventListener('click', e => { if(e.target===$('#modal-overlay')) closeModal(); });

// ═══════════════════════════════════════════════════════════════════
// THEME
// ═══════════════════════════════════════════════════════════════════
function applyTheme() {
  document.documentElement.setAttribute('data-theme', state.theme);
  $('#theme-btn').textContent = state.theme === 'dark' ? '☀️' : '🌙';
  // Re-render charts on theme change
  if (state.activeNav === 'stats') {
    setTimeout(() => { renderWeekChart(); renderMoodChart(); }, 50);
  }
}
window.toggleTheme = () => {
  state.theme = state.theme === 'dark' ? 'light' : 'dark';
  save(); applyTheme();
};

// ═══════════════════════════════════════════════════════════════════
// INIT
// ═══════════════════════════════════════════════════════════════════
function init() {
  applyTheme();

  // Nav clicks
  $$('.nav-item').forEach(btn => {
    btn.addEventListener('click', () => showPage(btn.dataset.page));
  });

  // Ring setup
  const r = 32, circ = 2*Math.PI*r;
  $('#ring-circle').style.strokeDasharray = circ;
  $('#ring-circle').style.strokeDashoffset = circ;

  // PWA install prompt
  let deferredPrompt;
  window.addEventListener('beforeinstallprompt', e => {
    e.preventDefault();
    deferredPrompt = e;
    $('#install-btn').style.display = 'flex';
  });
  $('#install-btn')?.addEventListener('click', async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    await deferredPrompt.userChoice;
    deferredPrompt = null;
    $('#install-btn').style.display = 'none';
  });

  // Service Worker
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('./service-worker.js').catch(()=>{});
  }

  showPage('home');
}

document.addEventListener('DOMContentLoaded', init);
