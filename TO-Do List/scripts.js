const LS_KEY = "pro_todo_v1";
const THEME_KEY = "pro_todo_theme_v1";

/* ---------- DOM ---------- */
const taskInput = document.getElementById("taskInput");
const addBtn = document.getElementById("addBtn");
const deadlineInput = document.getElementById("deadlineInput");
const prioritySelect = document.getElementById("prioritySelect");

const taskList = document.getElementById("taskList");
const stats = document.getElementById("stats");

const searchInput = document.getElementById("searchInput");
const filters = document.querySelectorAll(".filters button");

const markAllBtn = document.getElementById("markAllBtn");
const clearCompletedBtn = document.getElementById("clearCompletedBtn");
const clearAllBtn = document.getElementById("clearAllBtn");

const themeToggle = document.getElementById("themeToggle");

/* Edit modal */
const editModal = document.getElementById("editModal");
const editText = document.getElementById("editText");
const editDeadline = document.getElementById("editDeadline");
const editPriority = document.getElementById("editPriority");
const saveEditBtn = document.getElementById("saveEdit");
const cancelEditBtn = document.getElementById("cancelEdit");

let tasks = []; // {id, text, done, deadline (yyyy-mm-dd|null), priority, created}
let currentFilter = "all";
let editingId = null;

/* ---------- Utilities ---------- */
const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2,6);

const todayISO = () => {
  const d = new Date();
  d.setHours(0,0,0,0);
  return d.toISOString().slice(0,10);
};

const isOverdue = (deadline) => {
  if (!deadline) return false;
  return deadline < todayISO();
};

const dueIsToday = (deadline) => {
  if (!deadline) return false;
  return deadline === todayISO();
};

const save = () => {
  localStorage.setItem(LS_KEY, JSON.stringify(tasks));
};

const load = () => {
  const raw = localStorage.getItem(LS_KEY);
  tasks = raw ? JSON.parse(raw) : [];
};

/* Theme persistence */
const applyTheme = (theme) => {
  if (theme === "dark") {
    document.body.classList.add("dark");
    themeToggle.textContent = "☀️";
  } else {
    document.body.classList.remove("dark");
    themeToggle.textContent = "🌙";
  }
  localStorage.setItem(THEME_KEY, theme);
};
const loadTheme = () => {
  const t = localStorage.getItem(THEME_KEY) || "light";
  applyTheme(t);
};

/* ---------- Rendering ---------- */
const render = () => {
  // apply search & filter
  const q = searchInput.value.trim().toLowerCase();
  taskList.innerHTML = "";

  const filtered = tasks.filter(task => {
    if (currentFilter === "active" && task.done) return false;
    if (currentFilter === "completed" && !task.done) return false;
    if (currentFilter === "today" && !dueIsToday(task.deadline)) return false;
    if (currentFilter === "overdue" && !isOverdue(task.deadline)) return false;
    if (q && !task.text.toLowerCase().includes(q)) return false;
    return true;
  });

  filtered.forEach((task, index) => {
    const li = document.createElement("li");
    li.className = "task-item";
    li.draggable = true;
    li.dataset.id = task.id;
    if (task.done) li.classList.add("completed");
    if (isOverdue(task.deadline) && !task.done) li.classList.add("overdue");

    // create inner HTML
    li.innerHTML = `
      <div class="left">
        <div class="checkbox ${task.done ? "checked": ""}" data-action="toggle">${task.done ? "✓" : ""}</div>
        <div class="task-meta">
          <div class="task-title" title="${escapeHtml(task.text)}">${escapeHtml(task.text)}</div>
          <div class="task-sub">
            ${task.deadline ? formatDateNice(task.deadline) + (dueIsToday(task.deadline) ? " • Today" : "") : ""}
            ${task.deadline ? " • " : ""} <span class="muted">${task.created ? "Added " + timeAgo(task.created) : ""}</span>
          </div>
        </div>
      </div>

      <div class="badges">
        <div class="badge ${task.priority}">${task.priority}</div>
      </div>

      <div class="actions">
        <button class="icon-btn" data-action="edit" title="Edit (double click)">✎</button>
        <button class="icon-btn" data-action="delete" title="Delete">🗑</button>
      </div>
    `;

    // add event delegation handlers
    li.querySelectorAll("[data-action]").forEach(btn => {
      btn.addEventListener("click", (e) => {
        const action = btn.dataset.action;
        if (action === "toggle") toggleDone(task.id);
        if (action === "edit") openEdit(task.id);
        if (action === "delete") deleteTask(task.id, li);
      });
    });

    // double-click to edit
    li.addEventListener("dblclick", () => openEdit(task.id));

    // Drag & drop handlers
    li.addEventListener("dragstart", (e) => {
      li.classList.add("dragging");
      e.dataTransfer.effectAllowed = "move";
      e.dataTransfer.setData("text/plain", task.id);
    });
    li.addEventListener("dragend", () => {
      li.classList.remove("dragging");
    });

    taskList.appendChild(li);
    // small add animation
    li.animate([{opacity:0, transform:"translateY(8px)"},{opacity:1, transform:"translateY(0)"}], {duration:280, easing:"cubic-bezier(.2,.9,.3,1)"});
  });

  updateStats();
};

const escapeHtml = (s) => {
  return String(s).replace(/[&<>"']/g, (m) => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
};

const formatDateNice = (iso) => {
  if(!iso) return "";
  const d = new Date(iso + "T00:00:00");
  return d.toLocaleDateString(undefined, {month:"short", day:"numeric"});
};

const timeAgo = (isoTs) => {
  const diff = Date.now() - new Date(isoTs).getTime();
  const d = Math.floor(diff / (1000*60*60*24));
  if (d <= 0) return "today";
  if (d === 1) return "1 day ago";
  if (d < 7) return `${d} days ago`;
  const w = Math.floor(d/7);
  return `${w} week${w>1?"s":""} ago`;
};

const updateStats = () => {
  const total = tasks.length;
  const done = tasks.filter(t => t.done).length;
  stats.textContent = `${total} task${total!==1?"s":""} • ${done} done`;
};

/* ---------- Actions ---------- */
const addTask = (text, deadline = null, priority="normal") => {
  const trimmed = text.trim();
  if (!trimmed) return;
  const newTask = {
    id: uid(),
    text: trimmed,
    done: false,
    deadline: deadline || null,
    priority: priority || "normal",
    created: new Date().toISOString()
  };
  tasks.unshift(newTask);
  save();
  render();
};

const toggleDone = (id) => {
  tasks = tasks.map(t => t.id === id ? {...t, done: !t.done} : t);
  save();
  render();
  celebrateIfAllDone();
};

const deleteTask = (id, el=null) => {
  // animation
  if (el) {
    el.style.transition = "opacity .35s, transform .35s";
    el.style.opacity = "0";
    el.style.transform = "translateX(40px)";
    setTimeout(() => {
      tasks = tasks.filter(t => t.id !== id);
      save();
      render();
    }, 350);
  } else {
    tasks = tasks.filter(t => t.id !== id);
    save();
    render();
  }
};

const openEdit = (id) => {
  const t = tasks.find(x => x.id === id);
  if (!t) return;
  editingId = id;
  editText.value = t.text;
  editDeadline.value = t.deadline || "";
  editPriority.value = t.priority || "normal";
  editModal.classList.add("show");
  editModal.setAttribute("aria-hidden", "false");
  setTimeout(() => editText.focus(), 60);
};

const closeEdit = () => {
  editingId = null;
  editModal.classList.remove("show");
  editModal.setAttribute("aria-hidden", "true");
};

const saveEdit = () => {
  if (!editingId) return;
  tasks = tasks.map(t => t.id === editingId ? {...t, text: editText.value.trim(), deadline: editDeadline.value || null, priority: editPriority.value} : t);
  save();
  render();
  closeEdit();
};

const markAllComplete = () => {
  tasks = tasks.map(t => ({...t, done: true}));
  save();
  render();
  celebrateIfAllDone();
};

const clearCompleted = () => {
  tasks = tasks.filter(t => !t.done);
  save();
  render();
};

const clearAll = () => {
  tasks = [];
  save();
  render();
};

/* ---------- Filters / Search ---------- */
filters.forEach(btn => {
  btn.addEventListener("click", () => {
    filters.forEach(b => b.classList.remove("active"));
    btn.classList.add("active");
    currentFilter = btn.dataset.filter;
    render();
  });
});
searchInput.addEventListener("input", () => render());

/* ---------- Drag & Drop reordering ---------- */
taskList.addEventListener("dragover", (e) => {
  e.preventDefault();
  const afterEl = getDragAfterElement(taskList, e.clientY);
  const dragging = document.querySelector(".dragging");
  if (!dragging) return;
  if (!afterEl) taskList.appendChild(dragging);
  else taskList.insertBefore(dragging, afterEl);
});

taskList.addEventListener("drop", () => {
  // rebuild tasks order from DOM
  const ids = Array.from(taskList.children).map(li => li.dataset.id);
  tasks = ids.map(id => tasks.find(t => t.id === id)).filter(Boolean);
  save();
  render();
});

function getDragAfterElement(container, y) {
  const draggableElements = [...container.querySelectorAll('.task-item:not(.dragging)')];
  return draggableElements.reduce((closest, child) => {
    const box = child.getBoundingClientRect();
    const offset = y - box.top - box.height / 2;
    if (offset < 0 && offset > closest.offset) {
      return { offset: offset, element: child };
    } else {
      return closest;
    }
  }, { offset: Number.NEGATIVE_INFINITY }).element;
}

/* ---------- Confetti celebration ---------- */
const celebrateIfAllDone = () => {
  if (tasks.length > 0 && tasks.every(t => t.done)) {
    // launch confetti
    try {
      confetti({
        particleCount: 120,
        spread: 100,
        origin: { y: 0.2 }
      });
    } catch (e){ console.warn("Confetti not loaded", e); }
  }
};

/* ---------- Events ---------- */
addBtn.addEventListener("click", () => {
  addTask(taskInput.value, deadlineInput.value || null, prioritySelect.value);
  taskInput.value = "";
  deadlineInput.value = "";
  prioritySelect.value = "normal";
});

taskInput.addEventListener("keypress", (e) => {
  if (e.key === "Enter") addBtn.click();
});

markAllBtn.addEventListener("click", markAllComplete);
clearCompletedBtn.addEventListener("click", clearCompleted);
clearAllBtn.addEventListener("click", () => {
  if (!confirm("Clear ALL tasks?")) return;
  clearAll();
});

/* Edit modal actions */
saveEditBtn.addEventListener("click", saveEdit);
cancelEditBtn.addEventListener("click", closeEdit);
editModal.addEventListener("click", (e) => { if (e.target === editModal) closeEdit(); });
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") closeEdit();
});

/* Theme toggle */
themeToggle.addEventListener("click", () => {
  const isDark = document.body.classList.toggle("dark");
  themeToggle.textContent = isDark ? "☀️" : "🌙";
  localStorage.setItem(THEME_KEY, isDark ? "dark" : "light");
});

/* helper - small utility to initialize and render */
(function init(){
  load();
  loadTheme();
  render();

  // sample tasks if empty (comment or remove in production)
  if (tasks.length === 0) {
    // prefill a couple of examples for demo; comment out if you don't want them
    tasks = [
      { id: uid(), text: "Finish project brief", done:false, deadline: null, priority:"high", created: new Date().toISOString() },
      { id: uid(), text: "Email stakeholders", done:false, deadline: todayISO(), priority:"normal", created: new Date().toISOString() },
      { id: uid(), text: "Plan next week's sprint", done:false, deadline: null, priority:"low", created: new Date().toISOString() }
    ];
    save();
    render();
  }
})();
