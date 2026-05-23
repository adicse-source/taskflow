"use strict";

// ===== App data =====
const TASK_KEY = "taskflow_adi_tasks_v1";
const THEME_KEY = "taskflow_adi_theme_v1";

const statusInfo = {
  todo: {
    label: "To Do",
    listId: "todoList",
    countId: "todoCount"
  },
  progress: {
    label: "In Progress",
    listId: "progressList",
    countId: "progressCount"
  },
  done: {
    label: "Done",
    listId: "doneList",
    countId: "doneCount"
  }
};

let tasks = [];
let filters = {
  search: "",
  status: "all",
  priority: "all"
};
let draggedTaskId = null;
let activeTouchDrag = null;

const els = {};

document.addEventListener("DOMContentLoaded", initApp);

function initApp() {
  cacheElements();
  els.body.classList.remove("sidebar-open");
  loadTheme();
  tasks = loadTasks();
  bindEvents();
  updateClock();
  setInterval(updateClock, 1000);
  renderApp();
  showToast("TaskFlow is ready");
}

function cacheElements() {
  els.html = document.documentElement;
  els.body = document.body;
  els.sidebar = document.getElementById("sidebar");
  els.sidebarScrim = document.getElementById("sidebarScrim");
  els.menuToggle = document.getElementById("menuToggle");
  els.searchInput = document.getElementById("searchInput");
  els.statusFilter = document.getElementById("statusFilter");
  els.priorityFilter = document.getElementById("priorityFilter");
  els.themeToggle = document.getElementById("themeToggle");
  els.themeText = document.querySelector(".theme-text");
  els.notifyBtn = document.getElementById("notifyBtn");
  els.board = document.getElementById("board");
  els.toastStack = document.getElementById("toastStack");
  els.modal = document.getElementById("taskModal");
  els.taskForm = document.getElementById("taskForm");
  els.modalTitle = document.getElementById("modalTitle");
  els.taskId = document.getElementById("taskId");
  els.taskTitle = document.getElementById("taskTitle");
  els.taskNote = document.getElementById("taskNote");
  els.taskDue = document.getElementById("taskDue");
  els.taskPriority = document.getElementById("taskPriority");
  els.taskStatus = document.getElementById("taskStatus");
  els.addButtons = [
    document.getElementById("addTaskTop"),
    document.getElementById("addTaskBtn"),
    document.getElementById("fabAdd")
  ];
  els.resetDemo = document.getElementById("resetDemo");
  els.liveTime = document.getElementById("liveTime");
  els.liveDate = document.getElementById("liveDate");
  els.sideDate = document.getElementById("sideDate");
  els.totalTasks = document.getElementById("totalTasks");
  els.doneTasks = document.getElementById("doneTasks");
  els.pendingTasks = document.getElementById("pendingTasks");
  els.productivityLabel = document.getElementById("productivityLabel");
  els.productivityText = document.getElementById("productivityText");
  els.productivityRing = document.getElementById("productivityRing");
  els.completedPercent = document.getElementById("completedPercent");
  els.pendingPercent = document.getElementById("pendingPercent");
  els.completedRing = document.getElementById("completedRing");
  els.pendingRing = document.getElementById("pendingRing");
  els.completedRingText = document.getElementById("completedRingText");
  els.pendingRingText = document.getElementById("pendingRingText");
  els.weeklyChart = document.getElementById("weeklyChart");
  els.weekSummary = document.getElementById("weekSummary");
}

function bindEvents() {
  els.addButtons.forEach((button) => {
    if (button) {
      button.addEventListener("click", () => openTaskModal());
    }
  });

  els.taskForm.addEventListener("submit", handleTaskSubmit);
  els.searchInput.addEventListener("input", handleSearch);
  els.statusFilter.addEventListener("change", handleStatusFilter);
  els.priorityFilter.addEventListener("change", handlePriorityFilter);
  els.themeToggle.addEventListener("click", toggleTheme);
  els.notifyBtn.addEventListener("click", showTaskAlert);
  els.menuToggle.addEventListener("click", openSidebar);
  els.sidebarScrim.addEventListener("click", closeSidebar);
  els.resetDemo.addEventListener("click", resetSampleTasks);

  document.querySelectorAll("[data-close-modal]").forEach((item) => {
    item.addEventListener("click", closeTaskModal);
  });

  document.querySelectorAll(".side-link").forEach((link) => {
    link.addEventListener("click", () => {
      document.querySelectorAll(".side-link").forEach((navItem) => navItem.classList.remove("active"));
      link.classList.add("active");
      closeSidebar();
    });
  });

  document.querySelectorAll(".board-column").forEach((column) => {
    column.addEventListener("dragover", handleColumnDragOver);
    column.addEventListener("dragleave", handleColumnDragLeave);
    column.addEventListener("drop", handleColumnDrop);
  });

  els.board.addEventListener("click", handleBoardClick);
  document.addEventListener("keydown", handleShortcuts);
  document.addEventListener("click", addRipple);
}

// ===== Local storage =====
function loadTasks() {
  try {
    const savedTasks = localStorage.getItem(TASK_KEY);
    if (savedTasks) {
      const parsedTasks = JSON.parse(savedTasks);
      if (Array.isArray(parsedTasks)) {
        return parsedTasks;
      }
    }
  } catch (error) {
    console.warn("Task data could not be read.", error);
  }

  const sampleTasks = createSampleTasks();
  saveTasks(sampleTasks);
  return sampleTasks;
}

function saveTasks(nextTasks = tasks) {
  try {
    localStorage.setItem(TASK_KEY, JSON.stringify(nextTasks));
  } catch (error) {
    console.warn("Task data could not be saved.", error);
    showToast("Storage is full. Some data may not save.");
  }
}

function createSampleTasks() {
  const now = new Date();
  return [
    {
      id: makeId(),
      title: "Plan portfolio updates",
      note: "Make a short list of pages and sections to improve.",
      dueDate: toDateInput(addDays(now, 1)),
      priority: "high",
      status: "todo",
      createdAt: addDays(now, -5).toISOString(),
      updatedAt: addDays(now, -5).toISOString(),
      completedAt: ""
    },
    {
      id: makeId(),
      title: "Create task board design",
      note: "Keep cards clean, clear, and easy to move.",
      dueDate: toDateInput(addDays(now, 2)),
      priority: "medium",
      status: "progress",
      createdAt: addDays(now, -4).toISOString(),
      updatedAt: addDays(now, -2).toISOString(),
      completedAt: ""
    },
    {
      id: makeId(),
      title: "Check mobile layout",
      note: "Test the dashboard on a small phone screen.",
      dueDate: toDateInput(addDays(now, 3)),
      priority: "medium",
      status: "todo",
      createdAt: addDays(now, -3).toISOString(),
      updatedAt: addDays(now, -1).toISOString(),
      completedAt: ""
    },
    {
      id: makeId(),
      title: "Build chart cards",
      note: "Show completed, pending, and weekly progress.",
      dueDate: toDateInput(addDays(now, -1)),
      priority: "low",
      status: "done",
      createdAt: addDays(now, -6).toISOString(),
      updatedAt: addDays(now, -1).toISOString(),
      completedAt: addDays(now, -1).toISOString()
    },
    {
      id: makeId(),
      title: "Save data in browser",
      note: "Use local storage so tasks stay after refresh.",
      dueDate: toDateInput(now),
      priority: "high",
      status: "done",
      createdAt: addDays(now, -2).toISOString(),
      updatedAt: now.toISOString(),
      completedAt: now.toISOString()
    }
  ];
}

// ===== Rendering =====
function renderApp() {
  renderTasks();
  renderStats();
  renderCharts();
}

function renderTasks() {
  const visibleTasks = getVisibleTasks();
  const statusCounts = {
    todo: 0,
    progress: 0,
    done: 0
  };

  Object.keys(statusInfo).forEach((status) => {
    const list = document.getElementById(statusInfo[status].listId);
    list.innerHTML = "";

    const columnTasks = visibleTasks.filter((task) => task.status === status);
    statusCounts[status] = columnTasks.length;

    if (columnTasks.length === 0) {
      list.appendChild(createEmptyState(status));
      return;
    }

    columnTasks.forEach((task) => {
      list.appendChild(createTaskCard(task));
    });
  });

  Object.keys(statusInfo).forEach((status) => {
    document.getElementById(statusInfo[status].countId).textContent = statusCounts[status];
  });
}

function createTaskCard(task) {
  const card = document.createElement("article");
  card.className = "task-card";
  card.draggable = true;
  card.dataset.id = task.id;
  card.innerHTML = `
    <div class="task-top">
      <h4>${escapeHtml(task.title)}</h4>
      <button class="drag-handle" type="button" aria-label="Drag task">
        <span></span><span></span><span></span><span></span><span></span><span></span>
      </button>
    </div>
    <p class="task-note">${escapeHtml(task.note || "No note added yet.")}</p>
    <div class="task-meta">
      <span class="priority-badge priority-${task.priority}">${formatPriority(task.priority)}</span>
      <span class="due-pill">${formatDueDate(task.dueDate)}</span>
    </div>
    <div class="task-actions">
      <button class="task-action" type="button" data-action="edit">Edit</button>
      <button class="task-action delete" type="button" data-action="delete">Delete</button>
    </div>
  `;

  card.addEventListener("dragstart", handleTaskDragStart);
  card.addEventListener("dragend", handleTaskDragEnd);

  const handle = card.querySelector(".drag-handle");
  handle.addEventListener("pointerdown", (event) => startTouchDrag(event, task.id, card));

  return card;
}

function createEmptyState(status) {
  const empty = document.createElement("div");
  empty.className = "empty-state";
  
  let svgIcon = '';
  if (status === 'todo') svgIcon = '<path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/>';
  else if (status === 'in-progress') svgIcon = '<circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>';
  else if (status === 'done') svgIcon = '<path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/>';

  empty.innerHTML = `
    <div style="display:flex; flex-direction:column; align-items:center; gap:16px; opacity: 0.5; padding: 32px 0;">
      <svg xmlns="http://www.w3.org/2000/svg" width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1" stroke-linecap="round" stroke-linejoin="round">
        ${svgIcon}
      </svg>
      <p class="empty-text">No tasks in ${statusInfo[status].label}</p>
    </div>
  `;
  return empty;
}

function renderStats() {
  const total = tasks.length;
  const completed = tasks.filter((task) => task.status === "done").length;
  const pending = total - completed;
  const productivity = total ? Math.round((completed / total) * 100) : 0;

  els.totalTasks.textContent = total;
  els.doneTasks.textContent = completed;
  els.pendingTasks.textContent = pending;
  els.productivityLabel.textContent = `${productivity}%`;
  els.productivityText.textContent = `${productivity}%`;
  updateRing(els.productivityRing, productivity, "var(--green)");
}

function renderCharts() {
  const total = tasks.length;
  const completed = tasks.filter((task) => task.status === "done").length;
  const pending = total - completed;
  const completedValue = total ? Math.round((completed / total) * 100) : 0;
  const pendingValue = total ? Math.round((pending / total) * 100) : 0;

  els.completedPercent.textContent = `${completedValue}%`;
  els.pendingPercent.textContent = `${pendingValue}%`;
  els.completedRingText.textContent = `${completedValue}%`;
  els.pendingRingText.textContent = `${pendingValue}%`;
  updateRing(els.completedRing, completedValue, "var(--green)");
  updateRing(els.pendingRing, pendingValue, "var(--purple)");
  renderWeeklyChart();
}

function renderWeeklyChart() {
  const data = getWeeklyData();
  const maxValue = Math.max(1, ...data.map((item) => item.count));

  els.weeklyChart.innerHTML = "";
  data.forEach((item, index) => {
    const height = item.count === 0 ? 12 : Math.max(18, Math.round((item.count / maxValue) * 100));
    const bar = document.createElement("div");
    bar.className = "bar-item";
    bar.innerHTML = `
      <div class="bar-fill" data-value="${item.count}" style="height: ${height}%; animation-delay: ${index * 60}ms"></div>
      <span class="bar-label">${item.label}</span>
    `;
    els.weeklyChart.appendChild(bar);
  });

  const weekTotal = data.reduce((sum, item) => sum + item.count, 0);
  els.weekSummary.textContent = `${weekTotal} updates`;
}

function getVisibleTasks() {
  const searchText = filters.search.trim().toLowerCase();

  return tasks.filter((task) => {
    const matchesSearch =
      task.title.toLowerCase().includes(searchText) ||
      (task.note || "").toLowerCase().includes(searchText);
    const matchesStatus = filters.status === "all" || task.status === filters.status;
    const matchesPriority = filters.priority === "all" || task.priority === filters.priority;
    return matchesSearch && matchesStatus && matchesPriority;
  });
}

// ===== Task actions =====
function handleTaskSubmit(event) {
  event.preventDefault();

  const title = els.taskTitle.value.trim();
  if (!title) {
    showToast("Please add a task title");
    els.taskTitle.focus();
    return;
  }

  const id = els.taskId.value;
  const selectedStatus = els.taskStatus.value;
  const now = new Date().toISOString();

  if (id) {
    tasks = tasks.map((task) => {
      if (task.id !== id) {
        return task;
      }

      return {
        ...task,
        title,
        note: els.taskNote.value.trim(),
        dueDate: els.taskDue.value,
        priority: els.taskPriority.value,
        status: selectedStatus,
        updatedAt: now,
        completedAt: selectedStatus === "done" ? task.completedAt || now : ""
      };
    });
    showToast("Task updated");
  } else {
    tasks.unshift({
      id: makeId(),
      title,
      note: els.taskNote.value.trim(),
      dueDate: els.taskDue.value,
      priority: els.taskPriority.value,
      status: selectedStatus,
      createdAt: now,
      updatedAt: now,
      completedAt: selectedStatus === "done" ? now : ""
    });
    showToast("Task added");
  }

  saveTasks();
  renderApp();
  closeTaskModal();
}

function handleBoardClick(event) {
  const button = event.target.closest("[data-action]");
  if (!button) {
    return;
  }

  const card = button.closest(".task-card");
  const task = tasks.find((item) => item.id === card.dataset.id);
  if (!task) {
    return;
  }

  if (button.dataset.action === "edit") {
    openTaskModal(task);
    return;
  }

  if (button.dataset.action === "delete") {
    if (confirm("Are you sure you want to delete this task? This action cannot be undone.")) {
      tasks = tasks.filter((item) => item.id !== task.id);
      saveTasks();
      renderApp();
      showToast("Task deleted");
    }
  }
}

function moveTaskToStatus(taskId, nextStatus) {
  const task = tasks.find((item) => item.id === taskId);
  if (!task || !statusInfo[nextStatus]) {
    return;
  }

  if (task.status === nextStatus) {
    clearColumnHighlights();
    return;
  }

  task.status = nextStatus;
  task.updatedAt = new Date().toISOString();
  task.completedAt = nextStatus === "done" ? task.updatedAt : "";
  saveTasks();
  renderApp();
  showToast(`Moved to ${statusInfo[nextStatus].label}`);
}

function resetSampleTasks() {
  const shouldReset = tasks.length === 0 || window.confirm("Load sample tasks? This will replace your board.");
  if (!shouldReset) {
    return;
  }

  tasks = createSampleTasks();
  saveTasks();
  renderApp();
  showToast("Sample tasks loaded");
}

// ===== Modal =====
function openTaskModal(task = null) {
  els.taskForm.reset();
  els.taskId.value = task ? task.id : "";
  els.modalTitle.textContent = task ? "Edit task" : "Add task";

  if (task) {
    els.taskTitle.value = task.title;
    els.taskNote.value = task.note || "";
    els.taskDue.value = task.dueDate || "";
    els.taskPriority.value = task.priority;
    els.taskStatus.value = task.status;
  } else {
    els.taskDue.value = toDateInput(addDays(new Date(), 1));
    els.taskPriority.value = "medium";
    els.taskStatus.value = "todo";
  }

  els.modal.classList.remove("is-hidden");
  setTimeout(() => els.taskTitle.focus(), 60);
}

function closeTaskModal() {
  els.modal.classList.add("is-hidden");
}

// ===== Drag and drop =====
function handleTaskDragStart(event) {
  draggedTaskId = event.currentTarget.dataset.id;
  event.currentTarget.classList.add("dragging");
  event.dataTransfer.effectAllowed = "move";
  event.dataTransfer.setData("text/plain", draggedTaskId);
}

function handleTaskDragEnd(event) {
  event.currentTarget.classList.remove("dragging");
  draggedTaskId = null;
  clearColumnHighlights();
}

function handleColumnDragOver(event) {
  event.preventDefault();
  event.currentTarget.classList.add("drag-over");
}

function handleColumnDragLeave(event) {
  if (!event.currentTarget.contains(event.relatedTarget)) {
    event.currentTarget.classList.remove("drag-over");
  }
}

function handleColumnDrop(event) {
  event.preventDefault();
  const taskId = draggedTaskId || event.dataTransfer.getData("text/plain");
  const status = event.currentTarget.dataset.status;
  clearColumnHighlights();
  moveTaskToStatus(taskId, status);
}

function clearColumnHighlights() {
  document.querySelectorAll(".board-column").forEach((column) => column.classList.remove("drag-over"));
}

function startTouchDrag(event, taskId, card) {
  if (event.pointerType === "mouse") {
    return;
  }

  event.preventDefault();
  if (activeTouchDrag) {
    stopTouchDrag();
  }

  const ghost = card.cloneNode(true);
  ghost.classList.add("task-ghost");
  ghost.removeAttribute("draggable");
  document.body.appendChild(ghost);
  card.classList.add("touch-source");

  activeTouchDrag = {
    taskId,
    card,
    ghost,
    lastColumn: null
  };

  moveTouchGhost(event.clientX, event.clientY);
  window.addEventListener("pointermove", handleTouchMove, { passive: false });
  window.addEventListener("pointerup", handleTouchEnd, { once: true });
  window.addEventListener("pointercancel", handleTouchEnd, { once: true });
}

function handleTouchMove(event) {
  if (!activeTouchDrag) {
    return;
  }

  event.preventDefault();
  moveTouchGhost(event.clientX, event.clientY);

  const target = document.elementFromPoint(event.clientX, event.clientY);
  const column = target ? target.closest(".board-column") : null;
  clearColumnHighlights();

  if (column) {
    column.classList.add("drag-over");
    activeTouchDrag.lastColumn = column;
  } else {
    activeTouchDrag.lastColumn = null;
  }
}

function handleTouchEnd() {
  if (!activeTouchDrag) {
    return;
  }

  const nextStatus = activeTouchDrag.lastColumn ? activeTouchDrag.lastColumn.dataset.status : "";
  const taskId = activeTouchDrag.taskId;
  stopTouchDrag();

  if (nextStatus) {
    moveTaskToStatus(taskId, nextStatus);
  }
}

function stopTouchDrag() {
  if (!activeTouchDrag) {
    return;
  }

  activeTouchDrag.card.classList.remove("touch-source");
  activeTouchDrag.ghost.remove();
  activeTouchDrag = null;
  clearColumnHighlights();
  window.removeEventListener("pointermove", handleTouchMove);
}

function moveTouchGhost(x, y) {
  if (!activeTouchDrag) {
    return;
  }

  activeTouchDrag.ghost.style.left = `${x}px`;
  activeTouchDrag.ghost.style.top = `${y}px`;
}

// ===== Filters and search =====
function handleSearch(event) {
  filters.search = event.target.value;
  renderTasks();
}

function handleStatusFilter(event) {
  filters.status = event.target.value;
  renderTasks();
}

function handlePriorityFilter(event) {
  filters.priority = event.target.value;
  renderTasks();
}

// ===== Theme =====
function loadTheme() {
  const savedTheme = localStorage.getItem(THEME_KEY) || "dark";
  setTheme(savedTheme);
}

function toggleTheme() {
  const nextTheme = els.html.dataset.theme === "dark" ? "light" : "dark";
  setTheme(nextTheme);
  localStorage.setItem(THEME_KEY, nextTheme);
  showToast(`${capitalize(nextTheme)} mode on`);
}

function setTheme(theme) {
  els.html.dataset.theme = theme;
  els.themeText.textContent = theme === "dark" ? "Dark" : "Light";
}

// ===== Navigation and keyboard =====
function openSidebar() {
  els.body.classList.add("sidebar-open");
}

function closeSidebar() {
  els.body.classList.remove("sidebar-open");
}

function handleShortcuts(event) {
  const isTyping = ["INPUT", "TEXTAREA", "SELECT"].includes(document.activeElement.tagName);

  if (event.key === "Escape") {
    closeTaskModal();
    closeSidebar();
    return;
  }

  if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") {
    event.preventDefault();
    els.searchInput.focus();
    return;
  }

  if (!isTyping && event.key.toLowerCase() === "n") {
    event.preventDefault();
    openTaskModal();
  }
}

// ===== Clock and alerts =====
function updateClock() {
  const now = new Date();
  const time = now.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit"
  });
  const date = now.toLocaleDateString([], {
    weekday: "long",
    month: "short",
    day: "numeric"
  });

  els.liveTime.textContent = time;
  els.liveDate.textContent = date;
  els.sideDate.textContent = date;
}

function showTaskAlert() {
  const pending = tasks.filter((task) => task.status !== "done").length;
  const complete = tasks.length - pending;
  showToast(`${complete} done and ${pending} open tasks`);
}

function showToast(message) {
  const toast = document.createElement("div");
  toast.className = "toast";
  toast.textContent = message;
  els.toastStack.appendChild(toast);

  setTimeout(() => {
    toast.classList.add("is-leaving");
    toast.addEventListener("animationend", () => toast.remove(), { once: true });
  }, 2600);
}

function addRipple(event) {
  const target = event.target.closest("[data-ripple]");
  if (!target) {
    return;
  }

  const rect = target.getBoundingClientRect();
  const ripple = document.createElement("span");
  ripple.className = "ripple";
  ripple.style.left = `${event.clientX - rect.left}px`;
  ripple.style.top = `${event.clientY - rect.top}px`;
  target.appendChild(ripple);
  ripple.addEventListener("animationend", () => ripple.remove(), { once: true });
}

// ===== Chart helpers =====
function updateRing(element, value, color) {
  element.style.setProperty("--value", `${Math.round(value * 3.6)}deg`);
  element.style.setProperty("--ring-color", color);
}

function getWeeklyData() {
  const today = new Date();
  const days = [];

  for (let index = 6; index >= 0; index -= 1) {
    const day = addDays(today, -index);
    const key = toDateInput(day);
    const label = day.toLocaleDateString([], { weekday: "short" }).slice(0, 3);
    const count = tasks.filter((task) => {
      const updateDay = task.updatedAt ? toDateInput(new Date(task.updatedAt)) : "";
      const completeDay = task.completedAt ? toDateInput(new Date(task.completedAt)) : "";
      return updateDay === key || completeDay === key;
    }).length;

    days.push({ label, count });
  }

  return days;
}

// ===== Small helpers =====
function makeId() {
  return `task-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function addDays(date, days) {
  const nextDate = new Date(date);
  nextDate.setDate(nextDate.getDate() + days);
  return nextDate;
}

function toDateInput(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function formatDueDate(value) {
  if (!value) {
    return "No due date";
  }

  const date = new Date(`${value}T00:00:00`);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const diff = Math.round((date - today) / 86400000);
  if (diff === 0) {
    return "Due today";
  }

  if (diff === 1) {
    return "Due tomorrow";
  }

  if (diff < 0) {
    return `${Math.abs(diff)} day late`;
  }

  return date.toLocaleDateString([], {
    month: "short",
    day: "numeric"
  });
}

function formatPriority(priority) {
  return capitalize(priority);
}

function capitalize(text) {
  return text.charAt(0).toUpperCase() + text.slice(1);
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
