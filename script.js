/**
 * TASKFLOW — Premium Mobile Task Manager
 * Pure Vanilla JS, ES6+, LocalStorage persistence
 */

// ============================================================
// STATE
// ============================================================

const State = {
  tasks: [],
  projects: [],
  settings: {
    name: 'Criador',
    email: 'el333rosa@gmail.com',
    timezone: 'UTC-5 (EST)',
    language: 'English',
    darkMode: true,
    notifications: true,
    weekStart: 0
  },
  currentTab: 'home',
  navHistory: [],
  calendarDate: new Date(),
  selectedCalDay: null,
};

// ============================================================
// LOCAL STORAGE
// ============================================================

const Storage = {
  save() {
    try {
      localStorage.setItem('tf_tasks', JSON.stringify(State.tasks));
      localStorage.setItem('tf_projects', JSON.stringify(State.projects));
      localStorage.setItem('tf_settings', JSON.stringify(State.settings));
    } catch(e) { console.warn('Storage save failed', e); }
  },
  load() {
    try {
      const tasks = localStorage.getItem('tf_tasks');
      const projects = localStorage.getItem('tf_projects');
      const settings = localStorage.getItem('tf_settings');
      if (tasks) State.tasks = JSON.parse(tasks);
      if (projects) State.projects = JSON.parse(projects);
      if (settings) State.settings = { ...State.settings, ...JSON.parse(settings) };
    } catch(e) { console.warn('Storage load failed', e); }
  },
  clear() {
    localStorage.removeItem('tf_tasks');
    localStorage.removeItem('tf_projects');
    localStorage.removeItem('tf_settings');
  }
};

// ============================================================
// UTILITIES
// ============================================================

const Utils = {
  id() {
    return Date.now().toString(36) + Math.random().toString(36).slice(2);
  },

  formatDate(dateStr) {
    if (!dateStr) return '';
    const d = new Date(dateStr + 'T00:00:00');
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  },

  today() {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
  },

  monthLabel(date) {
    return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
  },

  dayLabel(date) {
    return date.toLocaleDateString('en-US', { weekday: 'long', day: 'numeric', month: 'long' });
  },

  priorityColor(p) {
    const map = { urgent: '#ef4444', high: '#f97316', medium: '#facc15', low: '#4ade80' };
    return map[p] || map.medium;
  },

  getProjectById(id) {
    return State.projects.find(p => p.id === id);
  },

  getTasksForDate(dateStr) {
    return State.tasks.filter(t => t.dueDate === dateStr);
  },

  getInitials(name) {
    return (name || 'U').split(' ').map(w => w[0]).join('').slice(0,2).toUpperCase();
  }
};

// ============================================================
// RENDER — HOME
// ============================================================

const RenderHome = {
  render() {
    this.renderGreeting();
    this.renderAICard();
    this.renderPriorityTasks();
    this.renderStats();
    this.renderAllTasks();
  },

  renderGreeting() {
    document.getElementById('greeting-name').textContent = State.settings.name + '!';
    // Date display
    const d = new Date();
    document.getElementById('ai-date').textContent =
      d.getDate() + ' ' + d.toLocaleDateString('en-US', { month: 'short' });
  },

  renderAICard() {
    const today = Utils.today();
    const todayTasks = State.tasks.filter(t => t.dueDate === today || !t.dueDate);
    document.getElementById('today-task-count').textContent = todayTasks.length;
  },

  renderPriorityTasks() {
    const container = document.getElementById('priority-tasks-list');
    // Show top 5 high-priority uncompleted tasks
    const priority = State.tasks
      .filter(t => !t.completed && (t.priority === 'urgent' || t.priority === 'high'))
      .concat(State.tasks.filter(t => !t.completed && t.priority !== 'urgent' && t.priority !== 'high'))
      .slice(0, 5);

    if (priority.length === 0) {
      container.innerHTML = '<div class="priority-empty">All caught up! 🎉</div>';
      return;
    }

    container.innerHTML = priority.map(task => `
      <div class="priority-item" onclick="App.toggleTask('${task.id}')">
        <div class="priority-check ${task.completed ? 'checked' : ''}">
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="3">
            <polyline points="20 6 9 17 4 12"/>
          </svg>
        </div>
        <span class="priority-label ${task.completed ? 'done' : ''}">${task.title}</span>
      </div>
    `).join('');
  },

  renderStats() {
    const total = State.tasks.length;
    const completed = State.tasks.filter(t => t.completed).length;
    const pct = total ? Math.round(completed / total * 100) : 0;
    const inProgress = total - completed;

    document.getElementById('completion-pct').textContent = pct + '%';
    document.getElementById('completed-stat').textContent = `${completed}/${total} task`;
    document.getElementById('inprogress-stat').textContent = inProgress + ' task';

    // Draw donut
    this.drawDonut(pct);
    // Draw mini bars
    this.renderMiniBars();
  },

  drawDonut(pct) {
    const canvas = document.getElementById('donut-canvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const cx = 45, cy = 45, r = 34;
    ctx.clearRect(0, 0, 90, 90);

    // Track
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(255,255,255,0.06)';
    ctx.lineWidth = 8;
    ctx.stroke();

    // Progress
    const start = -Math.PI / 2;
    const end = start + (Math.PI * 2 * pct / 100);
    const gradient = ctx.createLinearGradient(cx - r, cy, cx + r, cy);
    gradient.addColorStop(0, '#22d3ee');
    gradient.addColorStop(1, '#4ade80');
    ctx.beginPath();
    ctx.arc(cx, cy, r, start, end);
    ctx.strokeStyle = gradient;
    ctx.lineWidth = 8;
    ctx.lineCap = 'round';
    ctx.stroke();
  },

  renderMiniBars() {
    const container = document.getElementById('mini-bars');
    const days = 7;
    const today = new Date();
    const bars = [];

    for (let i = days - 1; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      const dateStr = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
      const count = State.tasks.filter(t => t.dueDate === dateStr && t.completed).length;
      bars.push({ count, isToday: i === 0 });
    }

    const max = Math.max(...bars.map(b => b.count), 1);
    container.innerHTML = bars.map(b => {
      const h = Math.max(8, (b.count / max) * 44);
      return `<div class="mini-bar ${b.isToday ? 'active' : ''}" style="height:${h}px"></div>`;
    }).join('');
  },

  renderAllTasks() {
    const container = document.getElementById('all-tasks-list');
    if (State.tasks.length === 0) {
      container.innerHTML = `
        <div class="empty-state">
          <div class="empty-state-icon">📋</div>
          <div class="empty-state-text">No tasks yet. Tap + to add one!</div>
        </div>`;
      return;
    }

    // Sort: incomplete first, then by priority
    const sorted = [...State.tasks].sort((a, b) => {
      if (a.completed !== b.completed) return a.completed ? 1 : -1;
      const p = { urgent: 0, high: 1, medium: 2, low: 3 };
      return (p[a.priority] || 2) - (p[b.priority] || 2);
    });

    container.innerHTML = sorted.map(task => {
      const proj = task.projectId ? Utils.getProjectById(task.projectId) : null;
      return `
        <div class="task-card ${task.completed ? 'completed' : ''}" onclick="App.toggleTask('${task.id}')">
          <div class="task-card-top">
            <span class="task-priority-tag ${task.priority}">${task.priority.charAt(0).toUpperCase() + task.priority.slice(1)}</span>
            ${proj ? `<span class="task-meeting">${proj.name}</span>` : ''}
          </div>
          <div class="task-card-name">${task.title}</div>
          <div class="task-card-meta">
            <div class="task-meta-left">
              ${task.dueDate ? `<span class="task-due">Due: ${Utils.formatDate(task.dueDate)}</span>` : ''}
            </div>
            <div style="display:flex;gap:6px">
              <button class="task-action-btn" onclick="event.stopPropagation(); App.editTask('${task.id}')">✏️</button>
              <button class="task-action-btn delete" onclick="event.stopPropagation(); App.deleteTask('${task.id}')">🗑</button>
            </div>
          </div>
        </div>
      `;
    }).join('');
  }
};

// ============================================================
// RENDER — CALENDAR
// ============================================================

const RenderCalendar = {
  render() {
    this.renderMonthGrid();
    if (State.selectedCalDay) {
      this.renderDayTasks(State.selectedCalDay);
    } else {
      // default to today
      State.selectedCalDay = Utils.today();
      this.renderDayTasks(State.selectedCalDay);
    }
  },

  renderMonthGrid() {
    document.getElementById('cal-month-label').textContent = Utils.monthLabel(State.calendarDate);

    const year = State.calendarDate.getFullYear();
    const month = State.calendarDate.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const prevDays = new Date(year, month, 0).getDate();
    const today = Utils.today();

    const weekdays = ['S','M','T','W','T','F','S'];
    document.getElementById('cal-weekdays').innerHTML =
      weekdays.map(d => `<div class="cal-weekday">${d}</div>`).join('');

    let cells = '';

    // Previous month days
    for (let i = firstDay - 1; i >= 0; i--) {
      const d = prevDays - i;
      cells += `<div class="cal-day-cell other-month"><div class="cal-day-num">${d}</div></div>`;
    }

    // Current month
    for (let d = 1; d <= daysInMonth; d++) {
      const dateStr = `${year}-${String(month+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
      const isToday = dateStr === today;
      const isSelected = dateStr === State.selectedCalDay;
      const hasTasks = State.tasks.some(t => t.dueDate === dateStr);
      cells += `
        <div class="cal-day-cell ${isToday ? 'today' : ''} ${isSelected ? 'selected' : ''}"
             onclick="RenderCalendar.selectDay('${dateStr}')">
          <div class="cal-day-num">${d}</div>
          ${hasTasks ? '<div class="cal-day-dot"></div>' : '<div style="width:5px;height:5px"></div>'}
        </div>`;
    }

    // Fill remaining
    const total = Math.ceil((firstDay + daysInMonth) / 7) * 7;
    const remaining = total - firstDay - daysInMonth;
    for (let d = 1; d <= remaining; d++) {
      cells += `<div class="cal-day-cell other-month"><div class="cal-day-num">${d}</div></div>`;
    }

    document.getElementById('cal-day-strip').innerHTML = cells;
  },

  selectDay(dateStr) {
    State.selectedCalDay = dateStr;
    this.renderMonthGrid();
    this.renderDayTasks(dateStr);
  },

  renderDayTasks(dateStr) {
    const date = new Date(dateStr + 'T00:00:00');
    document.getElementById('cal-day-title').textContent = Utils.dayLabel(date);

    const tasks = Utils.getTasksForDate(dateStr);
    document.getElementById('cal-day-meta').textContent =
      `${tasks.length} Task${tasks.length !== 1 ? 's' : ''}`;

    const container = document.getElementById('cal-tasks-list');
    if (tasks.length === 0) {
      container.innerHTML = `
        <div class="empty-state">
          <div class="empty-state-icon">📅</div>
          <div class="empty-state-text">No tasks for this day</div>
        </div>`;
      return;
    }

    // Generate time slots with tasks
    container.innerHTML = tasks.map((task, i) => {
      const hour = 9 + i;
      const timeLabel = `${hour}:00 ${hour < 12 ? 'AM' : 'PM'}`;
      const proj = task.projectId ? Utils.getProjectById(task.projectId) : null;

      return `
        <div class="cal-time-block">
          <div class="cal-time-label">${timeLabel}</div>
          <div class="cal-task-item priority-${task.priority}">
            <div class="cal-task-priority ${task.priority}">${task.priority.charAt(0).toUpperCase() + task.priority.slice(1)}</div>
            <div class="cal-task-name">${task.title}</div>
            <div class="cal-task-time-info">
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
              ${timeLabel} - ${hour+1}:00 ${(hour+1) < 12 ? 'AM' : 'PM'}
            </div>
            ${task.dueDate ? `<div class="cal-task-due">Due Date: ${Utils.formatDate(task.dueDate)}</div>` : ''}
            ${proj ? `<div class="cal-task-badge">${proj.name}</div>` : ''}
          </div>
        </div>
      `;
    }).join('');
  }
};

// ============================================================
// RENDER — ANALYTICS
// ============================================================

const RenderAnalytics = {
  render() {
    const tasks = State.tasks;
    const total = tasks.length;
    const completed = tasks.filter(t => t.completed).length;
    const pending = total - completed;
    const perf = total ? Math.round(completed / total * 100) : 0;

    document.getElementById('a-total').textContent = total;
    document.getElementById('a-perf').textContent = perf + '%';
    document.getElementById('a-comp').textContent = completed;
    document.getElementById('a-pend').textContent = pending;

    this.drawWeeklyChart();
    this.renderPriorityBars();
    this.renderProjectBars();
  },

  drawWeeklyChart() {
    const canvas = document.getElementById('weekly-chart');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const W = canvas.parentElement.clientWidth - 32;
    canvas.width = W;
    const H = 120;
    ctx.clearRect(0, 0, W, H);

    const today = new Date();
    const days = [];
    const labels = ['M','T','W','T','F','S','S'];

    for (let i = 6; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      const dateStr = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
      const count = State.tasks.filter(t => t.dueDate === dateStr).length;
      days.push({ label: labels[6-i] || d.toLocaleDateString('en-US',{weekday:'short'})[0], count });
    }

    const max = Math.max(...days.map(d => d.count), 1);
    const barW = Math.floor((W - 20) / 7) - 6;
    const barMaxH = H - 36;

    days.forEach((day, i) => {
      const x = 10 + i * ((W - 20) / 7) + 3;
      const barH = Math.max(4, (day.count / max) * barMaxH);
      const y = H - 20 - barH;

      // Gradient bar
      const grad = ctx.createLinearGradient(0, y, 0, H - 20);
      grad.addColorStop(0, '#22d3ee');
      grad.addColorStop(1, 'rgba(34,211,238,0.2)');

      ctx.beginPath();
      ctx.roundRect(x, y, barW, barH, [4, 4, 0, 0]);
      ctx.fillStyle = grad;
      ctx.fill();

      // Label
      ctx.fillStyle = 'rgba(255,255,255,0.4)';
      ctx.font = '11px DM Sans, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(day.label, x + barW / 2, H - 4);
    });
  },

  renderPriorityBars() {
    const container = document.getElementById('priority-bars');
    const priorities = [
      { key: 'urgent', label: 'Urgent', color: '#ef4444' },
      { key: 'high', label: 'High', color: '#f97316' },
      { key: 'medium', label: 'Medium', color: '#facc15' },
      { key: 'low', label: 'Low', color: '#4ade80' },
    ];
    const total = Math.max(State.tasks.length, 1);

    container.innerHTML = priorities.map(p => {
      const count = State.tasks.filter(t => t.priority === p.key).length;
      const pct = Math.round(count / total * 100);
      return `
        <div class="priority-bar-row">
          <span class="priority-bar-label">${p.label}</span>
          <div class="priority-bar-track">
            <div class="priority-bar-fill" style="width:${pct}%;background:${p.color}"></div>
          </div>
          <span class="priority-bar-count">${count}</span>
        </div>`;
    }).join('');
  },

  renderProjectBars() {
    const container = document.getElementById('project-bars');
    if (State.projects.length === 0) {
      container.innerHTML = '<div class="empty-state-text" style="font-size:12px;color:var(--text-muted)">No projects yet</div>';
      return;
    }
    const total = Math.max(State.tasks.length, 1);

    container.innerHTML = State.projects.map(proj => {
      const count = State.tasks.filter(t => t.projectId === proj.id).length;
      const pct = Math.round(count / total * 100);
      return `
        <div class="priority-bar-row">
          <span class="priority-bar-label" style="white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${proj.name}</span>
          <div class="priority-bar-track">
            <div class="priority-bar-fill" style="width:${pct}%;background:${proj.color}"></div>
          </div>
          <span class="priority-bar-count">${count}</span>
        </div>`;
    }).join('');
  }
};

// ============================================================
// RENDER — PROFILE
// ============================================================

const RenderProfile = {
  render() {
    document.getElementById('profile-name-display').textContent = State.settings.name;
    document.getElementById('profile-email-display').textContent = State.settings.email;
    document.getElementById('profile-avatar').textContent = Utils.getInitials(State.settings.name);

    const total = State.tasks.length;
    const completed = State.tasks.filter(t => t.completed).length;
    const perf = total ? Math.round(completed / total * 100) : 0;

    document.getElementById('profile-total-proj').textContent = State.projects.length;
    document.getElementById('profile-perf').textContent = perf + '%';
    document.getElementById('profile-ongoing').textContent = State.projects.filter(p =>
      State.tasks.some(t => t.projectId === p.id && !t.completed)
    ).length;
    document.getElementById('profile-absence').textContent =
      State.tasks.filter(t => !t.completed && t.dueDate && t.dueDate < Utils.today()).length;

    // Project shortcuts in menu
    const menuList = document.getElementById('project-menu-list');
    if (State.projects.length === 0) {
      menuList.innerHTML = '<div class="menu-item" style="color:var(--text-muted);font-size:13px">No projects yet</div>';
    } else {
      menuList.innerHTML = State.projects.slice(0,3).map(proj => `
        <button class="menu-item" onclick="App.navigate('project-detail', '${proj.id}')">
          <div style="width:8px;height:8px;border-radius:50%;background:${proj.color};flex-shrink:0;margin-right:4px"></div>
          <span>${proj.name}</span>
          <svg class="chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 18l6-6-6-6"/></svg>
        </button>`).join('');
    }
  }
};

// ============================================================
// RENDER — PROJECTS
// ============================================================

const RenderProjects = {
  render() {
    const container = document.getElementById('projects-list');
    if (State.projects.length === 0) {
      container.innerHTML = `
        <div class="empty-state">
          <div class="empty-state-icon">📁</div>
          <div class="empty-state-text">No projects yet. Tap + to create one!</div>
        </div>`;
      return;
    }

    container.innerHTML = State.projects.map(proj => {
      const taskCount = State.tasks.filter(t => t.projectId === proj.id).length;
      const doneCount = State.tasks.filter(t => t.projectId === proj.id && t.completed).length;
      return `
        <div class="project-card" onclick="App.navigate('project-detail', '${proj.id}')">
          <div class="project-color-dot" style="background:${proj.color}20">
            <div style="width:16px;height:16px;border-radius:5px;background:${proj.color}"></div>
          </div>
          <div class="project-info">
            <div class="project-name">${proj.name}</div>
            <div class="project-meta">${taskCount} tasks · ${doneCount} completed</div>
          </div>
          <button class="project-delete" onclick="event.stopPropagation(); App.deleteProject('${proj.id}')">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/>
            </svg>
          </button>
        </div>`;
    }).join('');
  },

  renderDetail(projectId) {
    const proj = Utils.getProjectById(projectId);
    if (!proj) return;

    document.getElementById('project-detail-title').textContent = proj.name;

    const tasks = State.tasks.filter(t => t.projectId === proj.id);
    const completed = tasks.filter(t => t.completed).length;
    const pending = tasks.length - completed;
    const pct = tasks.length ? Math.round(completed / tasks.length * 100) : 0;

    const container = document.getElementById('project-detail-content');
    container.innerHTML = `
      <div class="project-header card" style="margin-bottom:14px;padding:20px;display:flex;align-items:center;gap:14px">
        <div class="project-header-dot" style="width:52px;height:52px;border-radius:18px;background:${proj.color}20;display:flex;align-items:center;justify-content:center;flex-shrink:0">
          <div style="width:24px;height:24px;border-radius:8px;background:${proj.color}"></div>
        </div>
        <div>
          <div style="font-family:'Syne',sans-serif;font-size:20px;font-weight:800;letter-spacing:-0.4px">${proj.name}</div>
          <div style="font-size:12px;color:var(--text-muted);margin-top:4px">Created ${Utils.formatDate(proj.createdAt)}</div>
        </div>
      </div>

      <div class="project-stats-grid">
        <div class="project-stat-item">
          <div class="project-stat-val" style="color:var(--cyan)">${tasks.length}</div>
          <div class="project-stat-label">Total</div>
        </div>
        <div class="project-stat-item">
          <div class="project-stat-val" style="color:var(--green)">${completed}</div>
          <div class="project-stat-label">Done</div>
        </div>
        <div class="project-stat-item">
          <div class="project-stat-val" style="color:var(--orange)">${pending}</div>
          <div class="project-stat-label">Pending</div>
        </div>
      </div>

      <div style="margin-bottom:14px">
        <div style="display:flex;justify-content:space-between;font-size:12px;color:var(--text-muted);margin-bottom:6px">
          <span>Progress</span><span>${pct}%</span>
        </div>
        <div style="height:6px;background:rgba(255,255,255,0.06);border-radius:3px;overflow:hidden">
          <div style="height:100%;width:${pct}%;background:${proj.color};border-radius:3px;transition:width 0.5s"></div>
        </div>
      </div>

      <div style="font-family:'Syne',sans-serif;font-size:14px;font-weight:700;margin-bottom:10px">Tasks</div>
      <div id="project-task-list">
        ${tasks.length === 0
          ? '<div class="empty-state"><div class="empty-state-icon">📋</div><div class="empty-state-text">No tasks in this project</div></div>'
          : tasks.map(task => `
            <div class="task-card ${task.completed ? 'completed' : ''}" style="margin-bottom:10px" onclick="App.toggleTask('${task.id}'); RenderProjects.renderDetail('${proj.id}')">
              <div class="task-card-top">
                <span class="task-priority-tag ${task.priority}">${task.priority}</span>
              </div>
              <div class="task-card-name">${task.title}</div>
              ${task.dueDate ? `<div class="task-due" style="font-size:11.5px;color:var(--text-muted)">Due: ${Utils.formatDate(task.dueDate)}</div>` : ''}
            </div>`).join('')
        }
      </div>
    `;
  }
};

// ============================================================
// RENDER — SETTINGS
// ============================================================

const RenderSettings = {
  loadFields() {
    const s = State.settings;
    const name = document.getElementById('settings-name');
    const email = document.getElementById('settings-email');
    const darkmode = document.getElementById('settings-darkmode');
    const notifs = document.getElementById('settings-notifications');
    const weekstart = document.getElementById('settings-weekstart');

    if (name) name.value = s.name;
    if (email) email.value = s.email;
    if (darkmode) darkmode.checked = s.darkMode;
    if (notifs) notifs.checked = s.notifications;
    if (weekstart) weekstart.value = s.weekStart;
  }
};

// ============================================================
// APP CONTROLLER
// ============================================================

const App = {

  // ── Init ──
  init() {
    Storage.load();
    this.seedDefaultData();
    this.renderCurrentTab();
    this.setupCalendarNav();
    this.updateTaskModal();

    // Calendar: default to today
    State.selectedCalDay = Utils.today();
  },

  seedDefaultData() {
    // Only seed if empty
    if (State.tasks.length > 0) return;

    const today = Utils.today();
    const tomorrow = (() => {
      const d = new Date();
      d.setDate(d.getDate() + 1);
      return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
    })();

    State.projects = [
      { id: 'p1', name: 'Design', color: '#22d3ee', createdAt: today },
      { id: 'p2', name: 'Marketing', color: '#f97316', createdAt: today },
    ];

    State.tasks = [
      { id: 't1', title: 'Design Assets Export', completed: true, priority: 'high', projectId: 'p1', createdAt: today, dueDate: today },
      { id: 't2', title: 'HR Catch-Up Call', completed: false, priority: 'medium', projectId: null, createdAt: today, dueDate: today },
      { id: 't3', title: 'Marketing Huddle', completed: false, priority: 'low', projectId: 'p2', createdAt: today, dueDate: today },
      { id: 't4', title: 'Onboarding Call', completed: false, priority: 'urgent', projectId: null, createdAt: today, dueDate: tomorrow },
      { id: 't5', title: 'Wp Setup & Deliver', completed: false, priority: 'high', projectId: 'p1', createdAt: today, dueDate: tomorrow },
    ];

    Storage.save();
  },

  // ── Tab navigation ──
  switchTab(tab, btn) {
    // Hide all main screens, deactivate nav
    ['home','calendar','analytics','profile'].forEach(t => {
      const s = document.getElementById(`screen-${t}`);
      if (s) s.classList.remove('active');
    });
    document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));

    // Close sub-screens
    document.querySelectorAll('.sub-screen').forEach(s => s.classList.remove('active'));
    State.navHistory = [];

    State.currentTab = tab;
    const screen = document.getElementById(`screen-${tab}`);
    if (screen) screen.classList.add('active');
    if (btn) btn.classList.add('active');

    // FAB visibility
    const fab = document.getElementById('fab');
    if (tab === 'analytics' || tab === 'profile') {
      fab.classList.add('hidden');
    } else {
      fab.classList.remove('hidden');
    }

    this.renderCurrentTab();
  },

  renderCurrentTab() {
    switch(State.currentTab) {
      case 'home': RenderHome.render(); break;
      case 'calendar': RenderCalendar.render(); break;
      case 'analytics': setTimeout(() => RenderAnalytics.render(), 50); break;
      case 'profile': RenderProfile.render(); break;
    }
  },

  // ── Sub-screen navigation ──
  navigate(screen, param) {
    State.navHistory.push(State.currentTab === 'profile' ? 'profile' : 'back');

    // Deactivate current active screen
    document.querySelectorAll('.screen.active').forEach(s => s.classList.remove('active'));

    const target = document.getElementById(`screen-${screen}`);
    if (target) {
      target.classList.add('active');
      // Load data for specific screens
      if (screen === 'account-settings') RenderSettings.loadFields();
      if (screen === 'projects') RenderProjects.render();
      if (screen === 'project-detail' && param) RenderProjects.renderDetail(param);
    }
    State.navHistory.push(screen);
  },

  goBack() {
    if (State.navHistory.length > 0) {
      const current = document.querySelectorAll('.screen.active');
      current.forEach(s => s.classList.remove('active'));
      State.navHistory.pop();
    }
    // Return to profile
    const profileScreen = document.getElementById('screen-profile');
    if (profileScreen) profileScreen.classList.add('active');
    RenderProfile.render();
  },

  // ── Task CRUD ──
  openTaskModal(editId) {
    const modal = document.getElementById('task-modal-overlay');
    const titleEl = document.getElementById('modal-title');
    const editIdEl = document.getElementById('task-edit-id');
    const titleInput = document.getElementById('task-title-input');
    const dateInput = document.getElementById('task-date-input');
    const priorityInput = document.getElementById('task-priority-input');
    const projectInput = document.getElementById('task-project-input');

    // Populate project dropdown
    projectInput.innerHTML = '<option value="">No Project</option>' +
      State.projects.map(p => `<option value="${p.id}">${p.name}</option>`).join('');

    if (editId) {
      const task = State.tasks.find(t => t.id === editId);
      if (task) {
        titleEl.textContent = 'Edit Task';
        editIdEl.value = task.id;
        titleInput.value = task.title;
        dateInput.value = task.dueDate || '';
        priorityInput.value = task.priority || 'medium';
        projectInput.value = task.projectId || '';
      }
    } else {
      titleEl.textContent = 'New Task';
      editIdEl.value = '';
      titleInput.value = '';
      dateInput.value = Utils.today();
      priorityInput.value = 'medium';
      projectInput.value = '';
    }

    modal.classList.add('open');
    setTimeout(() => titleInput.focus(), 300);
  },

  closeTaskModal(event) {
    if (event && event.target !== document.getElementById('task-modal-overlay')) return;
    document.getElementById('task-modal-overlay').classList.remove('open');
  },

  saveTask() {
    const title = document.getElementById('task-title-input').value.trim();
    if (!title) { this.toast('Task title is required!'); return; }

    const editId = document.getElementById('task-edit-id').value;
    const dueDate = document.getElementById('task-date-input').value;
    const priority = document.getElementById('task-priority-input').value;
    const projectId = document.getElementById('task-project-input').value || null;

    if (editId) {
      const task = State.tasks.find(t => t.id === editId);
      if (task) {
        task.title = title;
        task.dueDate = dueDate;
        task.priority = priority;
        task.projectId = projectId;
        this.toast('Task updated ✓');
      }
    } else {
      State.tasks.unshift({
        id: Utils.id(),
        title,
        completed: false,
        priority,
        projectId,
        createdAt: Utils.today(),
        dueDate
      });
      this.toast('Task added ✓');
    }

    Storage.save();
    document.getElementById('task-modal-overlay').classList.remove('open');
    this.renderCurrentTab();
    if (State.currentTab === 'calendar') RenderCalendar.render();
  },

  editTask(id) {
    this.openTaskModal(id);
  },

  deleteTask(id) {
    if (!confirm('Delete this task?')) return;
    State.tasks = State.tasks.filter(t => t.id !== id);
    Storage.save();
    this.renderCurrentTab();
    this.toast('Task deleted');
  },

  toggleTask(id) {
    const task = State.tasks.find(t => t.id === id);
    if (task) {
      task.completed = !task.completed;
      Storage.save();
      this.renderCurrentTab();
    }
  },

  toggleAllTasks() {
    const allDone = State.tasks.every(t => t.completed);
    State.tasks.forEach(t => t.completed = !allDone);
    Storage.save();
    RenderHome.render();
  },

  // ── Project CRUD ──
  showNewProjectModal() {
    const modal = document.getElementById('project-modal-overlay');
    document.getElementById('project-name-input').value = '';
    // Reset color selection
    document.querySelectorAll('.color-swatch').forEach((s, i) => {
      s.classList.toggle('selected', i === 0);
    });
    modal.classList.add('open');
    setTimeout(() => document.getElementById('project-name-input').focus(), 300);
  },

  closeProjectModal(event) {
    if (event && event.target !== document.getElementById('project-modal-overlay')) return;
    document.getElementById('project-modal-overlay').classList.remove('open');
  },

  saveProject() {
    const name = document.getElementById('project-name-input').value.trim();
    if (!name) { this.toast('Project name is required!'); return; }

    const selectedColor = document.querySelector('.color-swatch.selected');
    const color = selectedColor ? selectedColor.dataset.color : '#4ade80';

    State.projects.push({
      id: Utils.id(),
      name,
      color,
      createdAt: Utils.today()
    });

    Storage.save();
    document.getElementById('project-modal-overlay').classList.remove('open');
    RenderProjects.render();
    this.updateTaskModal();
    this.toast('Project created ✓');
  },

  deleteProject(id) {
    if (!confirm('Delete this project? Tasks will be unassigned.')) return;
    State.projects = State.projects.filter(p => p.id !== id);
    State.tasks.forEach(t => { if (t.projectId === id) t.projectId = null; });
    Storage.save();
    RenderProjects.render();
    this.toast('Project deleted');
  },

  updateTaskModal() {
    const projectInput = document.getElementById('task-project-input');
    if (projectInput) {
      projectInput.innerHTML = '<option value="">No Project</option>' +
        State.projects.map(p => `<option value="${p.id}">${p.name}</option>`).join('');
    }
  },

  // ── Settings ──
  saveSettings() {
    State.settings.name = document.getElementById('settings-name').value.trim() || State.settings.name;
    State.settings.email = document.getElementById('settings-email').value.trim() || State.settings.email;
    State.settings.darkMode = document.getElementById('settings-darkmode').checked;
    State.settings.notifications = document.getElementById('settings-notifications').checked;
    State.settings.weekStart = parseInt(document.getElementById('settings-weekstart').value);

    const tz = document.getElementById('settings-timezone');
    if (tz) State.settings.timezone = tz.value;
    const lang = document.getElementById('settings-language');
    if (lang) State.settings.language = lang.value;

    Storage.save();
    this.toast('Settings saved ✓');

    // Update profile display
    document.getElementById('greeting-name').textContent = State.settings.name + '!';
  },

  // ── Search / Notifications (UI only) ──
  showSearch() {
    this.toast('🔍 Search coming soon');
  },

  showNotifications() {
    this.toast('🔔 No new notifications');
  },

  // ── Calendar nav setup ──
  setupCalendarNav() {
    document.getElementById('cal-prev').addEventListener('click', () => {
      State.calendarDate.setMonth(State.calendarDate.getMonth() - 1);
      RenderCalendar.renderMonthGrid();
    });
    document.getElementById('cal-next').addEventListener('click', () => {
      State.calendarDate.setMonth(State.calendarDate.getMonth() + 1);
      RenderCalendar.renderMonthGrid();
    });
    document.getElementById('cal-day-prev').addEventListener('click', () => {
      if (!State.selectedCalDay) return;
      const d = new Date(State.selectedCalDay + 'T00:00:00');
      d.setDate(d.getDate() - 1);
      const newDate = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
      RenderCalendar.selectDay(newDate);
    });
    document.getElementById('cal-day-next').addEventListener('click', () => {
      if (!State.selectedCalDay) return;
      const d = new Date(State.selectedCalDay + 'T00:00:00');
      d.setDate(d.getDate() + 1);
      const newDate = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
      RenderCalendar.selectDay(newDate);
    });

    // Color picker
    document.getElementById('color-picker').addEventListener('click', e => {
      const swatch = e.target.closest('.color-swatch');
      if (!swatch) return;
      document.querySelectorAll('.color-swatch').forEach(s => s.classList.remove('selected'));
      swatch.classList.add('selected');
    });

    // Analytics period selector
    document.getElementById('analytics-period').addEventListener('change', () => {
      RenderAnalytics.render();
    });
  },

  // ── Toast ──
  toast(message, duration = 2200) {
    const el = document.getElementById('toast');
    el.textContent = message;
    el.classList.add('visible');
    setTimeout(() => el.classList.remove('visible'), duration);
  }
};

// ============================================================
// BOOT
// ============================================================

document.addEventListener('DOMContentLoaded', () => {
  App.init();
});
