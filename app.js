const app = {
    data: {
        tasks: [],
        categories: [],
        entries: [], // { taskId, date, status }
        view: 'dashboard',
        currentDate: new Date(),
        historyMonth: new Date()
    },

    init() {
        this.loadData();
        this.render();
        this.setupEventListeners();
    },

    loadData() {
        const storedTasks = localStorage.getItem('dtt_tasks');
        const storedCategories = localStorage.getItem('dtt_categories');
        const storedEntries = localStorage.getItem('dtt_entries');

        if (storedTasks) {
            this.data.tasks = JSON.parse(storedTasks);
            this.data.categories = JSON.parse(storedCategories);
            this.data.entries = JSON.parse(storedEntries);
        } else {
            // Seed demo data
            this.seedData();
        }
    },

    saveData() {
        localStorage.setItem('dtt_tasks', JSON.stringify(this.data.tasks));
        localStorage.setItem('dtt_categories', JSON.stringify(this.data.categories));
        localStorage.setItem('dtt_entries', JSON.stringify(this.data.entries));
        this.render();
    },

    seedData() {
        this.data.categories = [
            { id: 1, name: 'Work', color: '#3b82f6' },
            { id: 2, name: 'Personal', color: '#10b981' },
            { id: 3, name: 'Health', color: '#ef4444' }
        ];
        this.data.tasks = [
            { id: 1, title: 'Morning Standup', category_id: 1, notification_time: '09:00', recurring_days: ['mon', 'tue', 'wed', 'thu', 'fri'] },
            { id: 2, title: 'Gym', category_id: 3, notification_time: '18:00', recurring_days: ['mon', 'wed', 'fri'] },
            { id: 3, title: 'Read', category_id: 2, notification_time: '21:00', recurring_days: null }
        ];
        this.data.entries = [];
        this.saveData();
    },

    setupEventListeners() {
        // Modal closing on escape
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.closeModal('task-modal');
                this.closeModal('categories-modal');
            }
        });
    },

    // --- Navigation & Views ---

    setView(viewName) {
        this.data.view = viewName;
        document.getElementById('view-dashboard').classList.toggle('hidden', viewName !== 'dashboard');
        document.getElementById('view-history').classList.toggle('hidden', viewName !== 'history');
        
        // Update Nav
        const dashboardLink = document.getElementById('nav-dashboard');
        const historyLink = document.getElementById('nav-history');
        
        if (viewName === 'dashboard') {
            dashboardLink.className = 'border-primary text-gray-900 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium';
            historyLink.className = 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium';
        } else {
            dashboardLink.className = 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium';
            historyLink.className = 'border-primary text-gray-900 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium';
        }

        this.render();
    },

    // --- Rendering ---

    render() {
        if (this.data.view === 'dashboard') {
            this.renderDashboard();
        } else {
            this.renderHistory();
        }
    },

    renderDashboard() {
        const todayStr = this.formatDate(this.data.currentDate);
        const dayOfWeek = this.data.currentDate.toLocaleDateString('en-US', { weekday: 'short' }).toLowerCase();

        document.getElementById('current-date').textContent = this.data.currentDate.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

        // Filter tasks for today
        const todaysTasks = this.data.tasks.filter(task => {
            if (!task.recurring_days) return true;
            return task.recurring_days.includes(dayOfWeek);
        });

        const tasksContainer = document.getElementById('tasks-container');
        tasksContainer.innerHTML = '';

        let completedCount = 0;
        let totalCount = 0;

        if (todaysTasks.length === 0) {
            tasksContainer.innerHTML = '<div class="p-8 text-center text-gray-500">No tasks for today. Enjoy!</div>';
        } else {
            todaysTasks.forEach(task => {
                const category = this.data.categories.find(c => c.id == task.category_id) || { name: 'Unknown', color: '#ccc' };
                const entry = this.data.entries.find(e => e.taskId == task.id && e.date === todayStr);
                const status = entry ? entry.status : null; // null, 'complete', 'incomplete', 'exempt'

                // Calculating stats
                if (status !== 'exempt') {
                    totalCount++;
                    if (status === 'complete') completedCount++;
                }

                // Render Task Row
                const row = document.createElement('div');
                row.className = 'p-6 flex items-center justify-between hover:bg-gray-50 transition-colors group';
                row.innerHTML = `
                    <div class="flex items-center flex-1">
                        <button onclick="app.toggleTask(${task.id})" class="flex-shrink-0 mr-4 focus:outline-none transition-transform active:scale-95">
                            ${this.getStatusIcon(status)}
                        </button>
                        <div>
                            <span class="text-sm font-bold px-2 py-0.5 rounded text-white" style="background-color: ${category.color}">${category.name}</span>
                            <h3 class="text-lg font-medium text-gray-900 mt-1">${task.title}</h3>
                            <div class="text-sm text-gray-500 flex items-center gap-2 mt-0.5">
                                ${task.notification_time ? `<span>⏰ ${task.notification_time}</span>` : ''}
                                ${task.recurring_days ? '<span class="text-xs bg-gray-100 px-1.5 py-0.5 rounded">Recurring</span>' : ''}
                            </div>
                        </div>
                    </div>
                    <div class="flex items-center opacity-0 group-hover:opacity-100 transition-opacity space-x-2">
                        <button onclick="app.editTask(${task.id})" class="p-2 text-gray-400 hover:text-blue-500 transition-colors" title="Edit">
                            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"></path></svg>
                        </button>
                        <button onclick="app.deleteTask(${task.id})" class="p-2 text-gray-400 hover:text-red-500 transition-colors" title="Delete">
                            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                        </button>
                    </div>
                `;
                tasksContainer.appendChild(row);
            });
        }

        // Update Progress Bar
        const percentage = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;
        document.getElementById('progress-percentage').textContent = `${percentage}%`;
        document.getElementById('progress-bar').style.width = `${percentage}%`;
    },

    getStatusIcon(status) {
        if (status === 'complete') {
            return `<div class="w-8 h-8 rounded-full bg-green-500 flex items-center justify-center text-white shadow-sm"><svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg></div>`;
        } else if (status === 'incomplete') {
            return `<div class="w-8 h-8 rounded-full bg-red-100 border-2 border-red-500 flex items-center justify-center text-red-500 shadow-sm"><svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg></div>`;
        } else if (status === 'exempt') {
            return `<div class="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-gray-400 shadow-sm"><svg class="w-5 h-5 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636"></path></svg></div>`;
        } else {
            return `<div class="w-8 h-8 rounded-full border-2 border-gray-300 hover:border-primary transition-colors bg-white shadow-sm"></div>`;
        }
    },

    renderHistory() {
        const year = this.data.historyMonth.getFullYear();
        const month = this.data.historyMonth.getMonth();
        const monthName = this.data.historyMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
        
        document.getElementById('history-month-label').textContent = monthName;

        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);
        const daysInMonth = lastDay.getDate();
        const startDayOfWeek = firstDay.getDay(); // 0 = Sun

        const grid = document.getElementById('calendar-grid');
        grid.innerHTML = '';

        // Empty cells for offset
        for (let i = 0; i < startDayOfWeek; i++) {
            grid.appendChild(document.createElement('div'));
        }

        const today = new Date();
        today.setHours(0,0,0,0);

        for (let day = 1; day <= daysInMonth; day++) {
            const current = new Date(year, month, day);
            const dateStr = this.formatDate(current);
            const dayOfWeek = current.toLocaleDateString('en-US', { weekday: 'short' }).toLowerCase();

            // Calculate daily stats
            const expectedTasks = this.data.tasks.filter(t => !t.recurring_days || t.recurring_days.includes(dayOfWeek)).length;
            
            const dayEntries = this.data.entries.filter(e => e.date === dateStr);
            const completed = dayEntries.filter(e => e.status === 'complete').length;
            const exempt = dayEntries.filter(e => e.status === 'exempt').length;

            const effectiveTotal = Math.max(0, expectedTasks - exempt);
            let percentage = 0;
            if (effectiveTotal > 0) {
                percentage = Math.round((completed / effectiveTotal) * 100);
            } else if (expectedTasks > 0 && exempt === expectedTasks) {
                percentage = 100;
            }

            // Cell Styles
            let bgColor = 'bg-gray-50';
            let textColor = 'text-gray-700';
            let borderColor = 'border-transparent';

            if (current > today) {
                bgColor = 'bg-white';
                textColor = 'text-gray-300';
                borderColor = 'border-gray-100';
            } else if (expectedTasks > 0) {
                if (percentage === 100) {
                    bgColor = 'bg-emerald-50';
                    textColor = 'text-emerald-700';
                    borderColor = 'border-emerald-100';
                } else if (percentage >= 50) {
                    bgColor = 'bg-amber-50';
                    textColor = 'text-amber-700';
                    borderColor = 'border-amber-100';
                } else {
                    bgColor = 'bg-rose-50';
                    textColor = 'text-rose-700';
                    borderColor = 'border-rose-100';
                }
            }

            const cell = document.createElement('div');
            cell.className = `h-24 p-2 rounded-xl border ${borderColor} flex flex-col justify-between ${bgColor} transition-colors relative group`;
            cell.innerHTML = `
                <span class="text-sm font-medium ${textColor}">${day}</span>
                ${(current <= today && expectedTasks > 0) ? `<div class="text-right"><span class="text-xs font-bold ${textColor}">${percentage}%</span></div>` : ''}
            `;
            grid.appendChild(cell);
        }
    },

    // --- Actions ---

    toggleTask(taskId) {
        const dateStr = this.formatDate(this.data.currentDate);
        let entryIndex = this.data.entries.findIndex(e => e.taskId == taskId && e.date === dateStr);
        
        // Default to complete logic
        let newStatus = 'complete';

        if (entryIndex > -1) {
            const currentStatus = this.data.entries[entryIndex].status;
            // If already complete, toggle to null (incomplete)
            // If anything else (including old statuses), toggle to complete
            if (currentStatus === 'complete') {
                newStatus = null;
            }
        }

        if (newStatus === null) {
            if (entryIndex > -1) this.data.entries.splice(entryIndex, 1);
        } else {
            if (entryIndex > -1) {
                this.data.entries[entryIndex].status = newStatus;
            } else {
                this.data.entries.push({ taskId, date: dateStr, status: newStatus });
            }
        }

        this.saveData();
    },

    openModal(modalId) {
        document.getElementById(modalId).classList.remove('hidden');
        if (modalId === 'categories-modal') this.renderCategoriesList();
        if (modalId === 'task-modal') {
             // Reset form if opening new
             if (!document.getElementById('task-id').value) {
                document.getElementById('task-form').reset();
                this.populateCategorySelect();
             }
        }
    },

    closeModal(modalId) {
        document.getElementById(modalId).classList.add('hidden');
        if (modalId === 'task-modal') {
            document.getElementById('task-form').reset();
            document.getElementById('task-id').value = '';
            document.getElementById('task-modal-title').innerText = 'New Task';
        }
        if (modalId === 'categories-modal') {
             document.getElementById('category-id').value = '';
             document.getElementById('category-name').value = '';
             document.getElementById('category-form-title').innerText = 'Add New Category';
        }
    },

    saveTask(e) {
        e.preventDefault();
        const id = document.getElementById('task-id').value;
        const title = document.getElementById('task-title').value;
        const categoryId = document.getElementById('task-category').value;
        const time = document.getElementById('task-time').value;
        
        const checkboxes = document.querySelectorAll('input[name="recurrence"]:checked');
        const recurrence = checkboxes.length > 0 ? Array.from(checkboxes).map(cb => cb.value) : null;

        if (id) {
            // Edit
            const task = this.data.tasks.find(t => t.id == id);
            if (task) {
                task.title = title;
                task.category_id = categoryId;
                task.notification_time = time;
                task.recurring_days = recurrence;
            }
        } else {
            // New
            const newTask = {
                id: Date.now(),
                title,
                category_id: categoryId,
                notification_time: time,
                recurring_days: recurrence
            };
            this.data.tasks.push(newTask);
        }

        this.saveData();
        this.closeModal('task-modal');
    },

    editTask(id) {
        const task = this.data.tasks.find(t => t.id == id);
        if (!task) return;

        document.getElementById('task-id').value = task.id;
        document.getElementById('task-title').value = task.title;
        document.getElementById('task-time').value = task.notification_time || '';
        document.getElementById('task-modal-title').innerText = 'Edit Task';
        
        this.populateCategorySelect(task.category_id);
        
        // Check checkboxes
        const checkboxes = document.querySelectorAll('input[name="recurrence"]');
        checkboxes.forEach(cb => cb.checked = false);
        if (task.recurring_days) {
            task.recurring_days.forEach(day => {
                const cb = document.querySelector(`input[name="recurrence"][value="${day}"]`);
                if (cb) cb.checked = true;
            });
        }

        this.openModal('task-modal');
    },

    deleteTask(id) {
        if (!confirm('Are you sure you want to delete this task?')) return;
        this.data.tasks = this.data.tasks.filter(t => t.id != id);
        this.saveData();
    },

    populateCategorySelect(selectedId = null) {
        const select = document.getElementById('task-category');
        select.innerHTML = '';
        this.data.categories.forEach(cat => {
            const option = document.createElement('option');
            option.value = cat.id;
            option.textContent = cat.name;
            if (selectedId && cat.id == selectedId) option.selected = true;
            select.appendChild(option);
        });
    },

    saveCategory(e) {
        e.preventDefault();
        const id = document.getElementById('category-id').value;
        const name = document.getElementById('category-name').value;
        const color = document.getElementById('category-color').value;

        if (id) {
            const cat = this.data.categories.find(c => c.id == id);
            if (cat) {
                 cat.name = name;
                 cat.color = color;
            }
        } else {
            const newCat = {
                id: Date.now(),
                name,
                color
            };
            this.data.categories.push(newCat);
        }

        // Reset form to Add mode
        document.getElementById('category-id').value = '';
        document.getElementById('category-name').value = '';
        document.getElementById('category-form-title').innerText = 'Add New Category';

        this.saveData();
        this.renderCategoriesList(); // Re-render list
        this.render(); // Re-render dashboard colors
    },

    renderCategoriesList() {
        const list = document.getElementById('categories-list');
        list.innerHTML = '';
        
        this.data.categories.forEach(cat => {
            const item = document.createElement('div');
            item.className = 'flex items-center justify-between p-2 bg-gray-50 rounded';
            item.innerHTML = `
                <div class="flex items-center gap-2">
                    <div class="w-4 h-4 rounded-full" style="background-color: ${cat.color}"></div>
                    <span class="text-sm font-medium text-gray-700">${cat.name}</span>
                </div>
                <div class="flex gap-1">
                    <button onclick="app.editCategory(${cat.id})" class="text-xs text-blue-600 hover:underline">Edit</button>
                    <button onclick="app.deleteCategory(${cat.id})" class="text-xs text-red-600 hover:underline">Delete</button>
                </div>
            `;
            list.appendChild(item);
        });
    },

    editCategory(id) {
        const cat = this.data.categories.find(c => c.id == id);
        if (!cat) return;
        
        document.getElementById('category-id').value = cat.id;
        document.getElementById('category-name').value = cat.name;
        document.getElementById('category-color').value = cat.color;
        document.getElementById('category-form-title').innerText = 'Edit Category';
    },

    deleteCategory(id) {
         if (this.data.categories.length <= 1) {
             alert('You must have at least one category.');
             return;
         }
         if (!confirm('Delete this category? Tasks associated with it may display incorrectly.')) return;
         this.data.categories = this.data.categories.filter(c => c.id != id);
         this.saveData();
         this.renderCategoriesList();
    },

    changeMonth(delta) {
        this.data.historyMonth.setMonth(this.data.historyMonth.getMonth() + delta);
        this.renderHistory();
    },

    formatDate(date) {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    }
};

// Start
app.init();
