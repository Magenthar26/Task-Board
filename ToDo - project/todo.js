
const modal = document.getElementById("taskModal");
const taskNameInput = document.getElementById("taskName");
const taskDescInput = document.getElementById("taskDesc");
const taskCommentInput = document.getElementById("taskComment");
const taskDeadlineInput = document.getElementById("taskDeadline");
const taskPassedInput = document.getElementById("taskPassedDeadline");
const taskStartInput = document.getElementById("taskStartDate");
const viewModeSelect = document.getElementById("viewMode");
const board = document.querySelector(".board");
const listViewContainer = document.getElementById("listViewContainer");
const listViewTasks = document.getElementById("listViewTasks");

let draggedTask = null;

function generateTaskId() {
  return 'task_' + Math.random().toString(36).substr(2, 9);
}

function openModal(task = null) {
  modal.style.display = "block";
  if (task) {
    const status = task.parentElement?.getAttribute('data-status') || "Not Started";
    taskNameInput.value = task.querySelector("strong")?.textContent || "";
    taskDescInput.value = task.dataset.desc || "";
    taskCommentInput.value = task.dataset.comment || "";
    taskStartInput.value = task.dataset.start || "";
    taskDeadlineInput.value = task.dataset.deadline || "";
    taskPassedInput.value = task.dataset.passed || "";

    document.querySelectorAll("input[name='taskStatus']").forEach(r => {
      r.checked = (r.value === status);
    });

    draggedTask = task;
  } else {
    taskNameInput.value = "";
    taskDescInput.value = "";
    taskCommentInput.value = "";
    taskStartInput.value = "";
    taskDeadlineInput.value = "";
    taskPassedInput.value = "";

    document.querySelector("input[value='Not Started']").checked = true;
    draggedTask = null;
  }

  const today = new Date().toISOString().split('T')[0];
  taskStartInput.min = taskDeadlineInput.min = taskPassedInput.min = today;
}

function closeModal() {
  modal.style.display = "none";
}

window.onclick = (e) => {
  if (e.target === modal) closeModal();
};

taskDeadlineInput.onchange = () => {
  if (taskDeadlineInput.value) {
    const endDate = new Date(taskDeadlineInput.value);
    const maxPassed = new Date(endDate);
    maxPassed.setDate(maxPassed.getDate() + 4);
    taskPassedInput.min = taskDeadlineInput.value;
    taskPassedInput.max = maxPassed.toISOString().split('T')[0];
    if (taskPassedInput.value < taskPassedInput.min || taskPassedInput.value > taskPassedInput.max) {
      taskPassedInput.value = "";
    }
  }
};


function createTaskElement(data) {
  const task = document.createElement("div");
  task.className = "task";
  task.draggable = true;
  task.dataset.id = data.id || generateTaskId();
  task.dataset.desc = data.desc || "";
  task.dataset.comment = data.comment || "";
  task.dataset.start = data.start || "";
  task.dataset.deadline = data.deadline || "";
  task.dataset.passed = data.passed || "";

  const statusColor = {
    "Scheduled": '#f39c12',
    "In Progress": '#17a2b8',
    "Completed": '#28a745',
    "Pending": '#dc3545',
    "Not Started": '#4a90e2'
  };

  task.innerHTML = `
    <strong>${data.name}</strong>
    <div>
      <span class="toggle-btn" onclick="toggleContent(this)">View Description</span>
      <div class="desc collapsible-content">${data.desc || "No description provided."}</div>
    </div>
    <div>
      <span class="toggle-btn" onclick="toggleContent(this)">View Comments</span>
      <div class="comment collapsible-content">${data.comment || "No comments."}</div>
    </div>
    <div class="dates">
      <div><i class="fas fa-play"></i>Start: ${data.start}</div>
      <div><i class="fas fa-flag-checkered"></i>Deadline: ${data.deadline}</div>
      <div><i class="fas fa-calendar-times"></i>Passed: ${data.passed}</div>
    </div>
    <div style="display:flex; justify-content: space-between; margin-top: 4px; font-size: 0.9rem;">
      <span style="cursor:pointer; color: blue;" onclick="openModal(this.closest('.task'))">✏️ Edit</span>
      <span style="cursor:pointer; color: red;" onclick="deleteTask(this)">🗑️ Delete</span>
    </div>
  `;

  task.style.borderLeftColor = statusColor[data.status] || '#4a90e2';
  task.addEventListener("dragstart", () => task.classList.add("dragging"));
  task.addEventListener("dragend", () => task.classList.remove("dragging"));

  return task;
}

function saveAllTasks() {
  const allTasks = document.querySelectorAll(".column .task, #listViewTasks .task");

  const rawTasks = Array.from(allTasks).map(task => {
    
    let actualStatus = task.parentElement?.getAttribute("data-status");
    if (!actualStatus) {
      const statusGroup = task.closest(".status-group");
      if (statusGroup) {
        const heading = statusGroup.querySelector("h4");
        if (heading) actualStatus = heading.textContent.trim();
      }
    }

    return {
      id: task.dataset.id || generateTaskId(),
      name: task.querySelector("strong")?.textContent || "",
      desc: task.dataset.desc || "",
      comment: task.dataset.comment || "",
      start: task.dataset.start || "",
      deadline: task.dataset.deadline || "",
      passed: task.dataset.passed || "",
      status: actualStatus || "Not Started" 
    };
  });

  const seenIds = new Set();
  const tasksData = [];
  rawTasks.forEach(task => {
    if (!seenIds.has(task.id)) {
      seenIds.add(task.id);
      tasksData.push(task);
    }
  });

  localStorage.setItem("tasks", JSON.stringify(tasksData));
}

function addTask() {
  const name = taskNameInput.value.trim();
  if (!name) return alert("Task name is required!");

  const taskData = {
    name,
    desc: taskDescInput.value.trim(),
    comment: taskCommentInput.value.trim(),
    start: taskStartInput.value,
    deadline: taskDeadlineInput.value,
    passed: taskPassedInput.value,
    status: document.querySelector("input[name='taskStatus']:checked").value,
    id: draggedTask?.dataset.id || generateTaskId()
  };

  const tasks = getUniqueTasksByContent();
  const existingIndex = tasks.findIndex(t => t.id === taskData.id);
  if (existingIndex !== -1) {
    tasks[existingIndex] = taskData;
  } else {
    tasks.push(taskData);
  }

  localStorage.setItem("tasks", JSON.stringify(tasks));

  draggedTask = null;
  closeModal();
  switchViewMode(viewModeSelect.value);
}

function deleteTask(el) {
  const task = el.closest(".task");
  if (task) {
    task.remove();
    saveAllTasks();
  }
}

function toggleContent(btn) {
  const content = btn.nextElementSibling;
  const expanded = content.classList.toggle("expanded");
  btn.textContent = expanded ? btn.textContent.replace("View", "Hide") : btn.textContent.replace("Hide", "View");
}

function getUniqueTasksByContent() {
  const tasks = JSON.parse(localStorage.getItem("tasks") || "[]");
  const seenIds = new Set();
  const unique = [];
  for (const task of tasks) {
    if (!seenIds.has(task.id)) {
      seenIds.add(task.id);
      unique.push(task);
    }
  }
  return unique;
}

function clearBoardTasks() {
  document.querySelectorAll(".column .task").forEach(task => task.remove());
}

function renderListView(tasks) {
  listViewTasks.innerHTML = "";
  const grouped = {};
  tasks.forEach(t => {
    if (!grouped[t.status]) grouped[t.status] = [];
    grouped[t.status].push(t);
  });

  for (const status in grouped) {
    const wrapper = document.createElement("div");
    wrapper.className = "status-group";
    wrapper.innerHTML = `<h4>${status}</h4>`;
    grouped[status].forEach(data => {
      const taskEl = createTaskElement(data);
      taskEl.draggable = false;
      taskEl.style.cursor = "default";
      wrapper.appendChild(taskEl);
    });
    listViewTasks.appendChild(wrapper);
  }
}

function switchViewMode(mode) {
  const tasksData = getUniqueTasksByContent();

  if (mode === "kanban") {
    board.style.display = "flex";
    listViewContainer.style.display = "none";
    clearBoardTasks();
    tasksData.forEach(task => {
      const taskEl = createTaskElement(task);
      const col = document.querySelector(`[data-status="${task.status}"]`);
      if (col) col.appendChild(taskEl);
    });
  } else if (mode === "list") {
    board.style.display = "none";
    listViewContainer.style.display = "block";
    renderListView(tasksData);
  }

  localStorage.setItem("viewMode", mode);
}


document.querySelectorAll(".column").forEach(col => {
  col.addEventListener("dragover", e => {
    e.preventDefault();
    col.classList.add("highlight");
  });
  col.addEventListener("dragleave", () => col.classList.remove("highlight"));
  col.addEventListener("drop", e => {
    e.preventDefault();
    const task = document.querySelector(".dragging");
    if (task) {
      col.appendChild(task);
      col.classList.remove("highlight");
      openModal(task);
      saveAllTasks();
      moveToPendingIfOverdue();
    }
  });
});


function moveToPendingIfOverdue() {
  let hasOverdue = false;
  const tasks = document.querySelectorAll(".task");

  tasks.forEach(task => {
    if (isTaskOverdue(task) && task.parentElement?.getAttribute("data-status") !== "Pending") {
      hasOverdue = true;
    }
  });

  if (hasOverdue) {
    const pendingCol = createPendingColumn();
    tasks.forEach(task => {
      if (isTaskOverdue(task) && task.parentElement?.getAttribute("data-status") !== "Pending") {
        pendingCol.appendChild(task);
      }
    });
    togglePendingColumnVisibility(true);
  } else {
    togglePendingColumnVisibility(false);
  }
  saveAllTasks();
}

function isTaskOverdue(task) {
  const deadline = new Date(task.dataset.deadline);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  deadline.setHours(0, 0, 0, 0);
  return deadline < today;
}

function createPendingColumn() {
  let col = document.querySelector(`[data-status="Pending"]`);
  if (!col) {
    col = document.createElement("div");
    col.className = "column";
    col.dataset.status = "Pending";
    col.innerHTML = `<h3>Pending</h3>`;
    board.appendChild(col);
  }
  return col;
}

function togglePendingColumnVisibility(show) {
  const col = document.querySelector(`[data-status="Pending"]`);
  if (col) col.style.display = show ? "block" : "none";
}


window.addEventListener("load", () => {
  const savedViewMode = localStorage.getItem("viewMode") || "kanban";
  viewModeSelect.value = savedViewMode;
  switchViewMode(savedViewMode);
  moveToPendingIfOverdue();
});

viewModeSelect.addEventListener("change", e => {
  switchViewMode(e.target.value);
});
