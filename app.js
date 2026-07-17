/* Zenith Task Manager - Logic & State */

document.addEventListener('DOMContentLoaded', () => {
  // --- STATE MANAGEMENT ---
  let tasks = [];
  let filterState = {
    search: '',
    status: 'all', // 'all' | 'active' | 'completed'
    category: 'all', // 'all' | specific category name
    priority: 'all', // 'all' | 'high' | 'medium' | 'low'
    sort: 'createdAt-desc' // default
  };
  let editingTaskId = null;
  let undoStack = [];

  // Seed data for a premium first-time experience
  const defaultTasks = [
    {
      id: 'seed-1',
      title: '🚀 Launch Zenith Task Manager dashboard',
      description: 'Explore all options, including dark/light modes, categorization, filters, and priority rankings.',
      category: 'Work',
      priority: 'high',
      dueDate: getRelativeDateString(0), // Today
      completed: false,
      createdAt: Date.now() - 3600000 * 2
    },
    {
      id: 'seed-2',
      title: '🍎 Buy fresh groceries for the week',
      description: 'Grab spinach, apples, almond milk, and salmon from the organic farmer\'s market.',
      category: 'Personal',
      priority: 'medium',
      dueDate: getRelativeDateString(1), // Tomorrow
      completed: false,
      createdAt: Date.now() - 3600000
    },
    {
      id: 'seed-3',
      title: '🏋️‍♂️ Evening cardio & strength training session',
      description: 'Focus on core strength, mobility movements, and a 20-minute high-intensity run.',
      category: 'Health',
      priority: 'low',
      dueDate: getRelativeDateString(-1), // Yesterday (overdue by default for demonstration)
      completed: false,
      createdAt: Date.now() - 3600000 * 5
    },
    {
      id: 'seed-4',
      title: '🎨 Review website design wireframes',
      description: 'Inspect layout grids, font pairings, contrast ratios, and dark theme consistency.',
      category: 'Work',
      priority: 'high',
      dueDate: getRelativeDateString(2), 
      completed: true,
      createdAt: Date.now() - 3600000 * 10
    }
  ];

  // Helper: Get local date offset by days
  function getRelativeDateString(daysOffset) {
    const d = new Date();
    d.setDate(d.getDate() + daysOffset);
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  }

  // --- DOM SELECTORS ---
  const themeToggle = document.getElementById('theme-toggle');
  const openAddModalBtn = document.getElementById('open-add-modal');
  const modalOverlay = document.getElementById('task-modal');
  const modalTitle = document.getElementById('modal-title');
  const closeModalBtn = document.getElementById('close-modal');
  const cancelTaskBtn = document.getElementById('cancel-task-btn');
  const taskForm = document.getElementById('task-form');
  const taskIdInput = document.getElementById('task-id');
  const taskTitleInput = document.getElementById('task-title-input');
  const titleError = document.getElementById('title-error');
  const taskDescInput = document.getElementById('task-desc-input');
  const taskCategoryInput = document.getElementById('task-category-input');
  const taskPriorityInput = document.getElementById('task-priority-input');
  const taskDuedateInput = document.getElementById('task-duedate-input');
  
  const tasksContainer = document.getElementById('tasks-container');
  const emptyState = document.getElementById('empty-state');
  const emptyCreateBtn = document.getElementById('empty-create-btn');
  
  const searchInput = document.getElementById('search-input');
  const clearSearchBtn = document.getElementById('clear-search');
  const statusTabs = document.getElementById('status-tabs');
  const priorityFilter = document.getElementById('priority-filter');
  const sortSelect = document.getElementById('sort-select');
  
  const categoryFilterList = document.getElementById('category-filter-list');
  const toastContainer = document.getElementById('toast-container');

  // Stats selectors
  const progressCircle = document.getElementById('progress-circle');
  const progressPercentText = document.getElementById('progress-percent');
  const completedCountText = document.getElementById('completed-count');
  const totalCountText = document.getElementById('total-count');
  const activeCountText = document.getElementById('active-count');
  const statCompletedCountText = document.getElementById('stat-completed-count');

  // --- INITIALIZATION ---
  function init() {
    initTheme();
    loadTasks();
    setupEventListeners();
    render();
  }

  // --- THEME MANAGEMENT ---
  function initTheme() {
    const savedTheme = localStorage.getItem('zenith_theme') || 'dark';
    document.documentElement.setAttribute('data-theme', savedTheme);
  }

  function toggleTheme() {
    const currentTheme = document.documentElement.getAttribute('data-theme');
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('zenith_theme', newTheme);
    showToast(`Switched to ${newTheme === 'dark' ? 'Dark' : 'Light'} Mode`, 'info');
  }

  // --- LOCAL STORAGE & DATA LOADING ---
  function loadTasks() {
    const savedData = localStorage.getItem('zenith_tasks');
    if (savedData) {
      try {
        tasks = JSON.parse(savedData);
      } catch (e) {
        console.error('Failed to parse saved tasks, loading default seed data.', e);
        tasks = [...defaultTasks];
        saveTasks();
      }
    } else {
      // First run: Seed data
      tasks = [...defaultTasks];
      saveTasks();
    }
  }

  function saveTasks() {
    localStorage.setItem('zenith_tasks', JSON.stringify(tasks));
  }

  // --- EVENT LISTENERS REGISTRATION ---
  function setupEventListeners() {
    // Theme toggle
    themeToggle.addEventListener('click', toggleTheme);

    // Modal triggers
    openAddModalBtn.addEventListener('click', () => openModal());
    emptyCreateBtn.addEventListener('click', () => openModal());
    closeModalBtn.addEventListener('click', closeModal);
    cancelTaskBtn.addEventListener('click', closeModal);
    
    // Close modal on overlay click
    modalOverlay.addEventListener('click', (e) => {
      if (e.target === modalOverlay) closeModal();
    });

    // Form Submission
    taskForm.addEventListener('submit', handleFormSubmit);

    // Live search
    searchInput.addEventListener('input', (e) => {
      filterState.search = e.target.value.trim().toLowerCase();
      clearSearchBtn.style.display = filterState.search ? 'flex' : 'none';
      render();
    });

    // Clear search
    clearSearchBtn.addEventListener('click', () => {
      searchInput.value = '';
      filterState.search = '';
      clearSearchBtn.style.display = 'none';
      render();
      searchInput.focus();
    });

    // Status Tab Filtering
    statusTabs.addEventListener('click', (e) => {
      const tabButton = e.target.closest('.tab-btn');
      if (!tabButton) return;
      
      statusTabs.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
      tabButton.classList.add('active');
      
      filterState.status = tabButton.dataset.tab;
      render();
    });

    // Select filtering
    priorityFilter.addEventListener('change', (e) => {
      filterState.priority = e.target.value;
      render();
    });

    sortSelect.addEventListener('change', (e) => {
      filterState.sort = e.target.value;
      render();
    });

    // Category Sidebar filter click delegation
    categoryFilterList.addEventListener('click', (e) => {
      const item = e.target.closest('.category-item');
      if (!item) return;
      
      filterState.category = item.dataset.category;
      render();
    });

    // Task Item Event Delegation (Check, Delete, Edit)
    tasksContainer.addEventListener('click', (e) => {
      const card = e.target.closest('.task-card');
      if (!card) return;
      
      const taskId = card.dataset.id;
      
      // Checkbox Toggle Completed
      if (e.target.closest('.custom-checkbox') || e.target.closest('.task-checkbox-container')) {
        e.preventDefault(); // Stop double activation
        toggleTaskCompleted(taskId);
      }
      // Edit button click
      else if (e.target.closest('.edit-btn')) {
        openModal(taskId);
      }
      // Delete button click
      else if (e.target.closest('.delete-btn')) {
        deleteTask(taskId);
      }
    });

    // Accessibility: ESC key to close modal
    window.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && modalOverlay.style.display === 'flex') {
        closeModal();
      }
    });
  }

  // --- CRUD CONTROLLERS ---

  // 1. Create & Update Modal Helpers
  function openModal(taskId = null) {
    // Reset Form Errors
    taskForm.classList.remove('submitted');
    taskTitleInput.parentNode.classList.remove('invalid');

    if (taskId) {
      // Edit Mode
      editingTaskId = taskId;
      const task = tasks.find(t => t.id === taskId);
      if (!task) return;

      modalTitle.textContent = 'Edit Task';
      taskIdInput.value = task.id;
      taskTitleInput.value = task.title;
      taskDescInput.value = task.description || '';
      taskCategoryInput.value = task.category || '';
      taskPriorityInput.value = task.priority || 'medium';
      taskDuedateInput.value = task.dueDate || '';
    } else {
      // Create Mode
      editingTaskId = null;
      modalTitle.textContent = 'Create Task';
      taskForm.reset();
      taskIdInput.value = '';
      taskPriorityInput.value = 'medium';
      // Default due date to today
      taskDuedateInput.value = getRelativeDateString(0);
    }

    modalOverlay.style.display = 'flex';
    document.body.style.overflow = 'hidden'; // Lock background scroll
    taskTitleInput.focus();
  }

  function closeModal() {
    modalOverlay.style.display = 'none';
    document.body.style.overflow = 'auto'; // Unlock scroll
    editingTaskId = null;
  }

  // Form Submit Handler (Save Task)
  function handleFormSubmit(e) {
    e.preventDefault();
    taskForm.classList.add('submitted');

    const title = taskTitleInput.value.trim();
    const description = taskDescInput.value.trim();
    const category = taskCategoryInput.value.trim() || 'General';
    const priority = taskPriorityInput.value;
    const dueDate = taskDuedateInput.value;

    // Validation
    if (!title) {
      taskTitleInput.parentNode.classList.add('invalid');
      taskTitleInput.focus();
      return;
    }

    if (editingTaskId) {
      // Update Task
      const taskIndex = tasks.findIndex(t => t.id === editingTaskId);
      if (taskIndex !== -1) {
        tasks[taskIndex] = {
          ...tasks[taskIndex],
          title,
          description,
          category,
          priority,
          dueDate
        };
        saveTasks();
        showToast('Task updated successfully', 'success');
      }
    } else {
      // Create Task
      const newTask = {
        id: 'task_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9),
        title,
        description,
        category,
        priority,
        dueDate,
        completed: false,
        createdAt: Date.now()
      };
      tasks.push(newTask);
      saveTasks();
      showToast('Task created successfully', 'success');
    }

    closeModal();
    render();
  }

  // 2. Toggle Complete
  function toggleTaskCompleted(taskId) {
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;
    
    task.completed = !task.completed;
    saveTasks();
    render();

    if (task.completed) {
      showToast(`Task completed! 🎉`, 'success');
    } else {
      showToast(`Task set to active`, 'info');
    }
  }

  // 3. Delete Task
  function deleteTask(taskId) {
    const taskIndex = tasks.findIndex(t => t.id === taskId);
    if (taskIndex === -1) return;

    const task = tasks[taskIndex];
    
    // Find item card in DOM to apply removal animation
    const card = tasksContainer.querySelector(`[data-id="${taskId}"]`);
    if (card) {
      card.classList.add('removing');
      
      // Wait for exit animation to complete before removing from state and rendering
      card.addEventListener('animationend', () => {
        // Push to undo stack
        undoStack.push({ task, index: taskIndex });
        
        // Remove from state
        tasks.splice(taskIndex, 1);
        saveTasks();
        render();

        // Show toast with Undo action
        showToast(`Deleted task: "${task.title.substring(0, 20)}${task.title.length > 20 ? '...' : ''}"`, 'warning', () => {
          // Undo handler callback
          const restored = undoStack.pop();
          if (restored) {
            tasks.splice(restored.index, 0, restored.task);
            saveTasks();
            render();
            showToast('Task restored', 'success');
          }
        });
      }, { once: true });
    }
  }

  // --- RENDER FUNCTIONS ---
  function render() {
    const filteredTasks = filterAndSortTasks();
    
    renderTaskList(filteredTasks);
    renderSidebarCategories();
    updateStatistics();
  }

  // Process filters and sorting rules
  function filterAndSortTasks() {
    let result = [...tasks];

    // 1. Text Search Filter
    if (filterState.search) {
      result = result.filter(t => 
        t.title.toLowerCase().includes(filterState.search) || 
        t.description.toLowerCase().includes(filterState.search)
      );
    }

    // 2. Completion Status Filter
    if (filterState.status === 'active') {
      result = result.filter(t => !t.completed);
    } else if (filterState.status === 'completed') {
      result = result.filter(t => t.completed);
    }

    // 3. Category Filter
    if (filterState.category !== 'all') {
      result = result.filter(t => t.category.toLowerCase() === filterState.category.toLowerCase());
    }

    // 4. Priority Filter
    if (filterState.priority !== 'all') {
      result = result.filter(t => t.priority === filterState.priority);
    }

    // 5. Sorting Rules
    result.sort((a, b) => {
      const [field, direction] = filterState.sort.split('-');
      const dirMultiplier = direction === 'asc' ? 1 : -1;

      if (field === 'createdAt') {
        return (a.createdAt - b.createdAt) * dirMultiplier;
      }

      if (field === 'dueDate') {
        // Handle empty due dates (push them to the end of the list)
        if (!a.dueDate && !b.dueDate) return 0;
        if (!a.dueDate) return 1; // a is empty, send to bottom
        if (!b.dueDate) return -1; // b is empty, send to bottom
        
        return a.dueDate.localeCompare(b.dueDate) * dirMultiplier;
      }

      if (field === 'priority') {
        const priorityWeight = { high: 3, medium: 2, low: 1 };
        return (priorityWeight[a.priority] - priorityWeight[b.priority]) * dirMultiplier;
      }

      return 0;
    });

    return result;
  }

  // Create task cards in DOM
  function renderTaskList(filteredTasks) {
    tasksContainer.innerHTML = '';

    if (filteredTasks.length === 0) {
      emptyState.style.display = 'flex';
      tasksContainer.style.display = 'none';
      return;
    }

    emptyState.style.display = 'none';
    tasksContainer.style.display = 'grid';

    const fragment = document.createDocumentFragment();
    const todayStr = getRelativeDateString(0);

    filteredTasks.forEach(task => {
      const card = document.createElement('div');
      card.className = `task-card${task.completed ? ' completed' : ''}`;
      card.dataset.id = task.id;

      // Determine Due Date relative state (e.g. overdue, due today)
      let dueClass = '';
      let dueText = '';
      
      if (task.dueDate) {
        dueText = formatDisplayDate(task.dueDate);
        
        if (!task.completed) {
          if (task.dueDate < todayStr) {
            dueClass = ' due-overdue';
            dueText = `Overdue: ${dueText}`;
          } else if (task.dueDate === todayStr) {
            dueClass = ' due-today';
            dueText = `Today: ${dueText}`;
          }
        }
      }

      card.innerHTML = `
        <div class="task-checkbox-container">
          <button class="custom-checkbox" aria-label="Toggle completed status">
            <svg width="12" height="10" viewBox="0 0 12 10" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
              <polyline points="1.5 6 4.5 9 10.5 1.5"></polyline>
            </svg>
          </button>
        </div>
        
        <div class="task-body">
          <div class="task-header-row">
            <h4 class="task-title">${escapeHTML(task.title)}</h4>
          </div>
          ${task.description ? `<p class="task-desc">${escapeHTML(task.description)}</p>` : ''}
          
          <div class="task-meta-row">
            <span class="meta-tag priority-tag priority-${task.priority}">
              ${task.priority}
            </span>
            <span class="meta-tag">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2v20"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
              ${escapeHTML(task.category)}
            </span>
            ${task.dueDate ? `
              <span class="meta-tag${dueClass}">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="18" height="18" x="3" y="4" rx="2" ry="2"/><line x1="16" x2="16" y1="2" y2="6"/><line x1="8" x2="8" y1="2" y2="6"/><line x1="3" x2="21" y1="10" y2="10"/></svg>
                ${dueText}
              </span>
            ` : ''}
          </div>
        </div>

        <div class="task-actions">
          <button class="action-btn edit-btn" aria-label="Edit task">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/><path d="m15 5 4 4"/></svg>
          </button>
          <button class="action-btn delete-btn" aria-label="Delete task">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>
          </button>
        </div>
      `;

      fragment.appendChild(card);
    });

    tasksContainer.appendChild(fragment);
  }

  // Populate dynamic category counts in Sidebar
  function renderSidebarCategories() {
    // 1. Calculate categories and counts
    const categoryCounts = {};
    tasks.forEach(t => {
      const cat = t.category ? t.category.trim() : 'General';
      categoryCounts[cat] = (categoryCounts[cat] || 0) + 1;
    });

    categoryFilterList.innerHTML = '';
    
    // Always include "All" category at top
    const allItem = document.createElement('li');
    allItem.className = `category-item${filterState.category === 'all' ? ' active' : ''}`;
    allItem.dataset.category = 'all';
    allItem.innerHTML = `
      <span>All Categories</span>
      <span class="category-count">${tasks.length}</span>
    `;
    categoryFilterList.appendChild(allItem);

    // Render sorted list of categories
    Object.keys(categoryCounts).sort().forEach(cat => {
      const item = document.createElement('li');
      item.className = `category-item${filterState.category.toLowerCase() === cat.toLowerCase() ? ' active' : ''}`;
      item.dataset.category = cat;
      item.innerHTML = `
        <span>${escapeHTML(cat)}</span>
        <span class="category-count">${categoryCounts[cat]}</span>
      `;
      categoryFilterList.appendChild(item);
    });
  }

  // Update visual graphs & metadata numbers
  function updateStatistics() {
    const total = tasks.length;
    const completed = tasks.filter(t => t.completed).length;
    const active = total - completed;

    // 1. Text elements
    totalCountText.textContent = total;
    completedCountText.textContent = completed;
    activeCountText.textContent = active;
    statCompletedCountText.textContent = completed;

    // 2. Circular progress calculation
    const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;
    progressPercentText.textContent = `${percentage}%`;

    // 3. SVG Stroke Dashoffset manipulation
    const radius = parseFloat(progressCircle.getAttribute('r'));
    const circumference = 2 * Math.PI * radius; // ~314.16
    
    progressCircle.style.strokeDasharray = `${circumference}`;
    const offset = circumference - (percentage / 100) * circumference;
    progressCircle.style.strokeDashoffset = `${offset}`;
  }

  // --- HELPER UTILITIES ---

  // Date formatter (e.g. YYYY-MM-DD to "Jul 17, 2026")
  function formatDisplayDate(dateStr) {
    if (!dateStr) return '';
    const parts = dateStr.split('-');
    if (parts.length !== 3) return dateStr;
    
    const date = new Date(parts[0], parts[1] - 1, parts[2]);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  }

  // Simple HTML escaping to prevent XSS injection
  function escapeHTML(str) {
    if (!str) return '';
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  // --- CUSTOM TOAST SYSTEM ---
  function showToast(message, type = 'info', undoActionCallback = null) {
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    
    // Choose icon based on type
    let iconSvg = '';
    if (type === 'success') {
      iconSvg = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>';
    } else if (type === 'warning') {
      iconSvg = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" x2="12" y1="8" y2="12"/><line x1="12" x2="12.01" y1="16" y2="16"/></svg>';
    } else {
      iconSvg = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/></svg>';
    }

    toast.innerHTML = `
      <div class="toast-content">
        <span class="toast-icon">${iconSvg}</span>
        <span class="toast-text">${escapeHTML(message)}</span>
      </div>
      ${undoActionCallback ? '<button class="toast-btn">Undo</button>' : ''}
    `;

    toastContainer.appendChild(toast);

    // Hook undo click listener
    if (undoActionCallback) {
      const undoBtn = toast.querySelector('.toast-btn');
      undoBtn.addEventListener('click', () => {
        undoActionCallback();
        removeToast(toast);
      });
    }

    // Auto remove after 4.5 seconds
    const timeoutId = setTimeout(() => {
      removeToast(toast);
    }, 4500);

    // Manual removal helper
    function removeToast(toastEl) {
      clearTimeout(timeoutId);
      if (toastEl.parentNode) {
        toastEl.classList.add('hiding');
        // Wait for sliding out animation
        toastEl.addEventListener('transitionend', () => {
          if (toastEl.parentNode) toastEl.parentNode.removeChild(toastEl);
        });
      }
    }
  }

  // --- BOOTSTRAP ---
  init();
});
