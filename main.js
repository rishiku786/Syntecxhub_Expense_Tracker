/* ═══════════════════════════════════════════════════════════
   MERGED MAIN FILE - All JavaScript Combined
   ═══════════════════════════════════════════════════════════ */

/* ═══════════════════════════════════════════════════════════
   STORAGE — localStorage CRUD with Per-User Isolation
   ═══════════════════════════════════════════════════════════ */

const USERS_KEY = 'expTracker_users';
const SESSION_KEY = 'expTracker_session';

function getAllUsers() {
  try {
    return JSON.parse(localStorage.getItem(USERS_KEY)) || {};
  } catch {
    return {};
  }
}

function saveAllUsers(users) {
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
}

function userExists(username) {
  const users = getAllUsers();
  return username.toLowerCase() in users;
}

function createUser(userData) {
  const users = getAllUsers();
  const key = userData.username.toLowerCase();

  if (users[key]) return false;

  users[key] = {
    name: userData.name,
    username: userData.username,
    password: userData.password,
    balance: Number(userData.balance) || 0,
    budgets: {},
    createdAt: new Date().toISOString()
  };

  saveAllUsers(users);
  localStorage.setItem(`expTracker_txn_${key}`, JSON.stringify([]));

  return true;
}

function validateUser(username, password) {
  const users = getAllUsers();
  const key = username.toLowerCase();
  const user = users[key];

  if (user && user.password === password) {
    return { ...user, username: key };
  }
  return null;
}

function saveSession(username) {
  localStorage.setItem(SESSION_KEY, username.toLowerCase());
}

function getSession() {
  return localStorage.getItem(SESSION_KEY);
}

function clearSession() {
  localStorage.removeItem(SESSION_KEY);
}

function getCurrentUser() {
  const username = getSession();
  if (!username) return null;

  const users = getAllUsers();
  const user = users[username];
  return user ? { ...user, username } : null;
}

function updateBalance(username, newBalance) {
  const users = getAllUsers();
  const key = username.toLowerCase();
  if (users[key]) {
    users[key].balance = newBalance;
    saveAllUsers(users);
  }
}

function getBalance(username) {
  const users = getAllUsers();
  const key = username.toLowerCase();
  return users[key]?.balance || 0;
}

function getTransactions(username) {
  try {
    const key = `expTracker_txn_${username.toLowerCase()}`;
    return JSON.parse(localStorage.getItem(key)) || [];
  } catch {
    return [];
  }
}

function addTransaction(username, transaction) {
  const key = `expTracker_txn_${username.toLowerCase()}`;
  const transactions = getTransactions(username);
  transactions.unshift(transaction);
  localStorage.setItem(key, JSON.stringify(transactions));
}

function deleteTransaction(username, transactionId) {
  const key = `expTracker_txn_${username.toLowerCase()}`;
  const transactions = getTransactions(username);
  const index = transactions.findIndex(t => t.id === transactionId);

  if (index === -1) return null;

  const [deleted] = transactions.splice(index, 1);
  localStorage.setItem(key, JSON.stringify(transactions));
  return deleted;
}

function clearAllTransactions(username) {
  const key = `expTracker_txn_${username.toLowerCase()}`;
  localStorage.setItem(key, JSON.stringify([]));
}

function updateTransaction(username, updatedTransaction) {
  const key = `expTracker_txn_${username.toLowerCase()}`;
  const transactions = getTransactions(username);
  const index = transactions.findIndex(t => t.id === updatedTransaction.id);

  if (index === -1) return false;

  transactions[index] = updatedTransaction;
  localStorage.setItem(key, JSON.stringify(transactions));
  return true;
}

function getBudgets(username) {
  const users = getAllUsers();
  const key = username.toLowerCase();
  return users[key]?.budgets || {};
}

function setBudget(username, category, limit) {
  const users = getAllUsers();
  const key = username.toLowerCase();
  if (users[key]) {
    if (!users[key].budgets) users[key].budgets = {};
    users[key].budgets[category] = limit;
    saveAllUsers(users);
  }
}

function getTheme() {
  return localStorage.getItem('expTracker_theme') || 'dark';
}

function saveTheme(theme) {
  localStorage.setItem('expTracker_theme', theme);
}

/* ═══════════════════════════════════════════════════════════
   UTILS — Helper Functions
   ═══════════════════════════════════════════════════════════ */

function formatCurrency(amount) {
  const num = Number(amount);
  if (isNaN(num)) return '₹0';
  return '₹' + num.toLocaleString('en-IN', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2
  });
}

function formatDate(dateInput) {
  const date = new Date(dateInput);
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
                  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const day = String(date.getDate()).padStart(2, '0');
  const month = months[date.getMonth()];
  const year = date.getFullYear();
  return `${day} ${month} ${year}`;
}

function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).substr(2, 9);
}

function debounce(fn, delay = 300) {
  let timer;
  return function (...args) {
    clearTimeout(timer);
    timer = setTimeout(() => fn.apply(this, args), delay);
  };
}

const CATEGORIES = {
  food:          { emoji: '🍔', name: 'Food',          color: 'var(--cat-food)' },
  transport:     { emoji: '🚗', name: 'Transport',     color: 'var(--cat-transport)' },
  shopping:      { emoji: '🛍', name: 'Shopping',      color: 'var(--cat-shopping)' },
  health:        { emoji: '💊', name: 'Health',         color: 'var(--cat-health)' },
  entertainment: { emoji: '🎮', name: 'Entertainment', color: 'var(--cat-entertainment)' },
  education:     { emoji: '📚', name: 'Education',     color: 'var(--cat-education)' },
  bills:         { emoji: '🧾', name: 'Bills',         color: 'var(--cat-bills)' },
  other:         { emoji: '📦', name: 'Other',         color: 'var(--cat-other)' },
  income:        { emoji: '💰', name: 'Income',        color: 'var(--cat-income)' }
};

function clamp(num, min, max) {
  return Math.min(Math.max(num, min), max);
}

function getRelativeTime(dateInput) {
  const date = new Date(dateInput);
  const now = new Date();
  const diffMs = now - date;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return formatDate(dateInput);
}

function toDateInputValue(dateInput) {
  const date = new Date(dateInput);
  return date.toISOString().split('T')[0];
}

function transactionsToCSV(transactions) {
  const headers = ['Date', 'Type', 'Category', 'Description', 'Amount'];
  const rows = transactions.map(t => [
    formatDate(t.date),
    t.type,
    CATEGORIES[t.category]?.name || t.category,
    `"${t.description.replace(/"/g, '""')}"`,
    t.type === 'income' ? `+${t.amount}` : `-${t.amount}`
  ]);
  return [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
}

function downloadCSV(csvContent, filename = 'transactions.csv') {
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/* ═══════════════════════════════════════════════════════════
   UI — DOM Helpers, Modals, Toasts, Theme Toggle
   ═══════════════════════════════════════════════════════════ */

const TOAST_ICONS = {
  success: '✅',
  error: '❌',
  warning: '⚠️',
  info: 'ℹ️'
};

function openModal(modalId) {
  const overlay = document.getElementById(modalId);
  if (!overlay) return;

  overlay.classList.add('active');
  document.body.style.overflow = 'hidden';

  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) closeModal(modalId);
  });
}

function closeModal(modalId) {
  const overlay = document.getElementById(modalId);
  if (!overlay) return;

  overlay.classList.remove('active');
  document.body.style.overflow = '';
}

function closeAllModals() {
  document.querySelectorAll('.modal-overlay.active').forEach(overlay => {
    overlay.classList.remove('active');
  });
  document.body.style.overflow = '';
}

function showToast(title, message, type = 'success', duration = 4000) {
  const container = document.getElementById('toast-container');
  if (!container) return;

  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.innerHTML = `
    <span class="toast-icon">${TOAST_ICONS[type]}</span>
    <div class="toast-content">
      <div class="toast-title">${title}</div>
      ${message ? `<div class="toast-message">${message}</div>` : ''}
    </div>
    <button class="toast-close" onclick="this.closest('.toast').remove()">✕</button>
    <div class="toast-progress" style="animation-duration: ${duration}ms"></div>
  `;

  container.appendChild(toast);

  setTimeout(() => {
    if (toast.parentNode) {
      toast.classList.add('toast-removing');
      setTimeout(() => toast.remove(), 300);
    }
  }, duration);
}

function initTheme() {
  const theme = getTheme();
  document.documentElement.setAttribute('data-theme', theme);
  updateThemeIcon(theme);
}

function toggleTheme() {
  const current = document.documentElement.getAttribute('data-theme');
  const next = current === 'dark' ? 'light' : 'dark';

  document.documentElement.setAttribute('data-theme', next);
  saveTheme(next);
  updateThemeIcon(next);
}

function updateThemeIcon(theme) {
  const toggleEl = document.getElementById('theme-toggle');
  if (!toggleEl) return;
  const thumb = toggleEl.querySelector('.toggle-thumb');
  if (thumb) {
    thumb.textContent = theme === 'dark' ? '🌙' : '☀️';
  }
}

function showConfirm(message, icon, onConfirm, confirmText = 'Confirm', confirmClass = 'btn-danger') {
  const overlay = document.getElementById('confirm-modal');
  const body = overlay.querySelector('.confirm-body');
  const confirmBtn = document.getElementById('confirm-action-btn');

  body.querySelector('.confirm-icon').textContent = icon;
  body.querySelector('.confirm-text').textContent = message;

  confirmBtn.textContent = confirmText;
  confirmBtn.className = `btn ${confirmClass}`;

  const newBtn = confirmBtn.cloneNode(true);
  confirmBtn.parentNode.replaceChild(newBtn, confirmBtn);
  newBtn.id = 'confirm-action-btn';

  newBtn.addEventListener('click', () => {
    onConfirm();
    closeModal('confirm-modal');
  });

  openModal('confirm-modal');
}

function initRipples() {
  document.addEventListener('click', (e) => {
    const btn = e.target.closest('.btn:not(.btn-icon):not(.btn-ghost)');
    if (!btn) return;

    const ripple = document.createElement('span');
    ripple.className = 'ripple';
    const rect = btn.getBoundingClientRect();
    const size = Math.max(rect.width, rect.height);
    ripple.style.width = ripple.style.height = size + 'px';
    ripple.style.left = (e.clientX - rect.left - size / 2) + 'px';
    ripple.style.top = (e.clientY - rect.top - size / 2) + 'px';

    btn.appendChild(ripple);
    setTimeout(() => ripple.remove(), 600);
  });
}

function showView(viewName) {
  const authView = document.getElementById('auth-view');
  const dashboardView = document.getElementById('dashboard-view');

  if (viewName === 'auth') {
    if (dashboardView) dashboardView.classList.add('hidden');
    if (authView) {
      authView.classList.remove('hidden');
      authView.style.animation = 'fadeIn 0.4s ease forwards';
    }
  } else if (viewName === 'dashboard') {
    if (authView) authView.classList.add('hidden');
    if (dashboardView) {
      dashboardView.classList.remove('hidden');
      dashboardView.style.animation = 'fadeIn 0.4s ease forwards';
    }
  }
}

/* ═══════════════════════════════════════════════════════════
   AUTH — Sign Up, Sign In, Logout
   ═══════════════════════════════════════════════════════════ */

let onAuthSuccess = null;
let onLogout = null;

function initAuth(callbacks) {
  onAuthSuccess = callbacks.onAuthSuccess;
  onLogout = callbacks.onLogout;

  setupForms();
  setupToggle();
}

function isLoggedIn() {
  return !!getSession();
}

function authLogout() {
  clearSession();
  if (onLogout) onLogout();
}

function setupForms() {
  const signupForm = document.getElementById('signup-form');
  const signinForm = document.getElementById('signin-form');

  if (signupForm) {
    signupForm.addEventListener('submit', handleSignup);
  }

  if (signinForm) {
    signinForm.addEventListener('submit', handleSignin);
  }

  const passwordInput = document.getElementById('signup-password');
  if (passwordInput) {
    passwordInput.addEventListener('input', updatePasswordStrength);
  }
}

function setupToggle() {
  const showSignin = document.getElementById('show-signin');
  const showSignup = document.getElementById('show-signup');
  const signupSection = document.getElementById('signup-section');
  const signinSection = document.getElementById('signin-section');

  if (showSignin) {
    showSignin.addEventListener('click', (e) => {
      e.preventDefault();
      signupSection.classList.add('hidden');
      signinSection.classList.remove('hidden');
      clearErrors();
      animateFormSwitch(signinSection);
    });
  }

  if (showSignup) {
    showSignup.addEventListener('click', (e) => {
      e.preventDefault();
      signinSection.classList.add('hidden');
      signupSection.classList.remove('hidden');
      clearErrors();
      animateFormSwitch(signupSection);
    });
  }
}

function animateFormSwitch(section) {
  const form = section.querySelector('.auth-form');
  if (form) {
    form.style.animation = 'none';
    form.offsetHeight;
    form.style.animation = '';
    const groups = form.querySelectorAll('.form-group, .auth-submit, .auth-toggle');
    groups.forEach(g => {
      g.style.animation = 'none';
      g.offsetHeight;
      g.style.animation = '';
    });
  }
}

function handleSignup(e) {
  e.preventDefault();
  clearErrors();

  const name = document.getElementById('signup-name').value.trim();
  const username = document.getElementById('signup-username').value.trim();
  const password = document.getElementById('signup-password').value;
  const balance = document.getElementById('signup-balance').value;

  if (!name || name.length < 2) {
    showError('signup-error', 'Please enter your full name (at least 2 characters)');
    shakeInput('signup-name');
    return;
  }

  if (!username || username.length < 3) {
    showError('signup-error', 'Username must be at least 3 characters');
    shakeInput('signup-username');
    return;
  }

  if (/[^a-zA-Z0-9_]/.test(username)) {
    showError('signup-error', 'Username can only contain letters, numbers, and underscores');
    shakeInput('signup-username');
    return;
  }

  if (userExists(username)) {
    showError('signup-error', 'This username is already taken. Try a different one.');
    shakeInput('signup-username');
    return;
  }

  if (!password || password.length < 6) {
    showError('signup-error', 'Password must be at least 6 characters');
    shakeInput('signup-password');
    return;
  }

  if (balance === '' || Number(balance) < 0) {
    showError('signup-error', 'Starting balance must be ₹0 or more');
    shakeInput('signup-balance');
    return;
  }

  const submitBtn = document.getElementById('signup-submit');
  submitBtn.classList.add('btn-loading');

  setTimeout(() => {
    const success = createUser({ name, username, password, balance: Number(balance) });

    submitBtn.classList.remove('btn-loading');

    if (success) {
      saveSession(username);
      if (onAuthSuccess) onAuthSuccess();
    } else {
      showError('signup-error', 'Something went wrong. Please try again.');
    }
  }, 600);
}

function handleSignin(e) {
  e.preventDefault();
  clearErrors();

  const username = document.getElementById('signin-username').value.trim();
  const password = document.getElementById('signin-password').value;

  if (!username) {
    showError('signin-error', 'Please enter your username');
    shakeInput('signin-username');
    return;
  }

  if (!password) {
    showError('signin-error', 'Please enter your password');
    shakeInput('signin-password');
    return;
  }

  const submitBtn = document.getElementById('signin-submit');
  submitBtn.classList.add('btn-loading');

  setTimeout(() => {
    const user = validateUser(username, password);

    submitBtn.classList.remove('btn-loading');

    if (user) {
      saveSession(username);
      if (onAuthSuccess) onAuthSuccess();
    } else {
      showError('signin-error', 'Invalid username or password. Please try again.');
      shakeInput('signin-username');
      shakeInput('signin-password');
    }
  }, 600);
}

function updatePasswordStrength(e) {
  const password = e.target.value;
  const bars = document.querySelectorAll('.strength-bar');

  let strength = 0;
  if (password.length >= 6) strength++;
  if (password.length >= 8 && /[A-Z]/.test(password)) strength++;
  if (/[0-9]/.test(password) && /[^a-zA-Z0-9]/.test(password)) strength++;

  bars.forEach((bar, i) => {
    bar.classList.remove('active', 'weak', 'medium', 'strong');
    if (i < strength) {
      bar.classList.add('active');
      if (strength === 1) bar.classList.add('weak');
      else if (strength === 2) bar.classList.add('medium');
      else bar.classList.add('strong');
    }
  });
}

function showError(elementId, message) {
  const el = document.getElementById(elementId);
  if (el) {
    el.querySelector('.error-text').textContent = message;
    el.classList.add('visible');
  }
}

function clearErrors() {
  document.querySelectorAll('.auth-error').forEach(el => {
    el.classList.remove('visible');
  });
  document.querySelectorAll('.form-input').forEach(el => {
    el.classList.remove('input-error');
  });
}

function shakeInput(inputId) {
  const input = document.getElementById(inputId);
  if (input) {
    input.classList.add('input-error');
    setTimeout(() => input.classList.remove('input-error'), 1000);
  }
}

/* ═══════════════════════════════════════════════════════════
   WALLET — Balance Management
   ═══════════════════════════════════════════════════════════ */

function walletGetBalance() {
  const user = getCurrentUser();
  return user ? user.balance : 0;
}

function canAfford(amount) {
  return walletGetBalance() >= amount;
}

function addMoney(amount) {
  const user = getCurrentUser();
  if (!user) return 0;

  const newBalance = user.balance + amount;
  updateBalance(user.username, newBalance);
  return newBalance;
}

function deductMoney(amount) {
  const user = getCurrentUser();
  if (!user) return false;

  if (user.balance < amount) return false;

  const newBalance = user.balance - amount;
  updateBalance(user.username, newBalance);
  return newBalance;
}

function updateBalanceDisplay() {
  const user = getCurrentUser();
  if (!user) return;

  const balance = user.balance;
  const balanceElements = document.querySelectorAll('[data-balance]');

  balanceElements.forEach(el => {
    const currentText = el.textContent.replace(/[₹,\s]/g, '');
    const currentVal = Number(currentText) || 0;
    animateCounter(el, currentVal, balance, 500);
  });
}

function updateAllStats(transactions) {
  const user = getCurrentUser();
  if (!user) return;

  updateBalanceDisplay();

  const totalIncome = transactions
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0);

  const incomeEl = document.getElementById('total-income');
  if (incomeEl) {
    const currentVal = parseStatValue(incomeEl.textContent);
    animateCounter(incomeEl, currentVal, totalIncome, 500);
  }

  const totalExpense = transactions
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0);

  const expenseEl = document.getElementById('total-expense');
  if (expenseEl) {
    const currentVal = parseStatValue(expenseEl.textContent);
    animateCounter(expenseEl, currentVal, totalExpense, 500);
  }

  const countEl = document.getElementById('txn-count');
  if (countEl) {
    countEl.textContent = transactions.length;
  }
}

function animateCounter(element, start, end, duration) {
  if (start === end) {
    element.textContent = formatCurrency(end);
    return;
  }

  element.classList.add('balance-updating');

  const startTime = performance.now();
  const diff = end - start;

  function update(currentTime) {
    const elapsed = currentTime - startTime;
    const progress = Math.min(elapsed / duration, 1);

    const eased = 1 - Math.pow(1 - progress, 3);
    const current = start + diff * eased;

    element.textContent = formatCurrency(Math.round(current));

    if (progress < 1) {
      requestAnimationFrame(update);
    } else {
      element.textContent = formatCurrency(end);
      element.classList.remove('balance-updating');
    }
  }

  requestAnimationFrame(update);
}

function parseStatValue(text) {
  return Number(text.replace(/[₹,\s]/g, '')) || 0;
}

/* ═══════════════════════════════════════════════════════════
   CHARTS — Chart.js Pie & Bar Charts
   ═══════════════════════════════════════════════════════════ */

let pieChart = null;
let barChart = null;

function updateCharts(transactions) {
  updatePieChart(transactions);
  updateBarChart(transactions);
}

function destroyCharts() {
  if (pieChart) { pieChart.destroy(); pieChart = null; }
  if (barChart) { barChart.destroy(); barChart = null; }
}

function updatePieChart(transactions) {
  const canvas = document.getElementById('pie-chart');
  if (!canvas) return;

  const expenses = transactions.filter(t => t.type === 'expense');

  const categoryTotals = {};
  expenses.forEach(t => {
    categoryTotals[t.category] = (categoryTotals[t.category] || 0) + t.amount;
  });

  const categories = Object.keys(categoryTotals);

  if (categories.length === 0) {
    if (pieChart) { pieChart.destroy(); pieChart = null; }
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = getComputedStyle(document.documentElement).getPropertyValue('--text-tertiary').trim();
    ctx.font = '14px Inter, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('No expense data yet', canvas.width / 2, canvas.height / 2);
    return;
  }

  const labels = categories.map(c => CATEGORIES[c]?.name || c);
  const data = categories.map(c => categoryTotals[c]);
  const colors = categories.map(c => {
    const style = getComputedStyle(document.documentElement);
    return style.getPropertyValue(`--cat-${c}`).trim() || '#888';
  });

  const chartData = {
    labels,
    datasets: [{
      data,
      backgroundColor: colors,
      borderColor: 'transparent',
      borderWidth: 0,
      hoverBorderWidth: 3,
      hoverBorderColor: 'rgba(255,255,255,0.3)',
      borderRadius: 4,
      spacing: 3
    }]
  };

  const config = {
    type: 'doughnut',
    data: chartData,
    options: {
      responsive: true,
      maintainAspectRatio: true,
      cutout: '65%',
      plugins: {
        legend: {
          position: 'bottom',
          labels: {
            padding: 16,
            usePointStyle: true,
            pointStyleWidth: 10,
            color: getComputedStyle(document.documentElement).getPropertyValue('--text-secondary').trim(),
            font: {
              family: 'Inter, sans-serif',
              size: 11,
              weight: 500
            }
          }
        },
        tooltip: {
          backgroundColor: 'rgba(0,0,0,0.8)',
          titleFont: { family: 'Inter, sans-serif', weight: 600 },
          bodyFont: { family: 'Inter, sans-serif' },
          padding: 12,
          cornerRadius: 10,
          callbacks: {
            label: function(context) {
              const total = context.dataset.data.reduce((a, b) => a + b, 0);
              const percentage = ((context.parsed / total) * 100).toFixed(1);
              return ` ${context.label}: ${formatCurrency(context.parsed)} (${percentage}%)`;
            }
          }
        }
      },
      animation: {
        animateRotate: true,
        animateScale: true,
        duration: 800,
        easing: 'easeOutQuart'
      }
    }
  };

  if (pieChart) {
    pieChart.data = chartData;
    pieChart.update('active');
  } else {
    pieChart = new Chart(canvas, config);
  }
}

function updateBarChart(transactions) {
  const canvas = document.getElementById('bar-chart');
  if (!canvas) return;

  const days = [];
  const dayLabels = [];
  const incomeData = [];
  const expenseData = [];

  for (let i = 6; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    date.setHours(0, 0, 0, 0);
    days.push(date);

    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    dayLabels.push(i === 0 ? 'Today' : i === 1 ? 'Yesterday' : dayNames[date.getDay()]);

    const dayStart = new Date(date);
    const dayEnd = new Date(date);
    dayEnd.setHours(23, 59, 59, 999);

    const dayIncome = transactions
      .filter(t => t.type === 'income' && new Date(t.date) >= dayStart && new Date(t.date) <= dayEnd)
      .reduce((sum, t) => sum + t.amount, 0);

    const dayExpense = transactions
      .filter(t => t.type === 'expense' && new Date(t.date) >= dayStart && new Date(t.date) <= dayEnd)
      .reduce((sum, t) => sum + t.amount, 0);

    incomeData.push(dayIncome);
    expenseData.push(dayExpense);
  }

  const hasData = incomeData.some(v => v > 0) || expenseData.some(v => v > 0);

  if (!hasData) {
    if (barChart) { barChart.destroy(); barChart = null; }
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = getComputedStyle(document.documentElement).getPropertyValue('--text-tertiary').trim();
    ctx.font = '14px Inter, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('No data for the last 7 days', canvas.width / 2, canvas.height / 2);
    return;
  }

  const chartData = {
    labels: dayLabels,
    datasets: [
      {
        label: 'Income',
        data: incomeData,
        backgroundColor: getComputedStyle(document.documentElement).getPropertyValue('--color-success').trim() + '88',
        borderColor: getComputedStyle(document.documentElement).getPropertyValue('--color-success').trim(),
        borderWidth: 2,
        borderRadius: 6,
        borderSkipped: false
      },
      {
        label: 'Expense',
        data: expenseData,
        backgroundColor: getComputedStyle(document.documentElement).getPropertyValue('--color-danger').trim() + '88',
        borderColor: getComputedStyle(document.documentElement).getPropertyValue('--color-danger').trim(),
        borderWidth: 2,
        borderRadius: 6,
        borderSkipped: false
      }
    ]
  };

  const config = {
    type: 'bar',
    data: chartData,
    options: {
      responsive: true,
      maintainAspectRatio: true,
      plugins: {
        legend: {
          position: 'top',
          align: 'end',
          labels: {
            padding: 16,
            usePointStyle: true,
            pointStyleWidth: 10,
            color: getComputedStyle(document.documentElement).getPropertyValue('--text-secondary').trim(),
            font: {
              family: 'Inter, sans-serif',
              size: 11,
              weight: 500
            }
          }
        },
        tooltip: {
          backgroundColor: 'rgba(0,0,0,0.8)',
          titleFont: { family: 'Inter, sans-serif', weight: 600 },
          bodyFont: { family: 'Inter, sans-serif' },
          padding: 12,
          cornerRadius: 10,
          callbacks: {
            label: function(context) {
              return ` ${context.dataset.label}: ${formatCurrency(context.parsed.y)}`;
            }
          }
        }
      },
      scales: {
        x: {
          grid: { display: false },
          ticks: {
            color: getComputedStyle(document.documentElement).getPropertyValue('--text-tertiary').trim(),
            font: { family: 'Inter, sans-serif', size: 11 }
          },
          border: { display: false }
        },
        y: {
          beginAtZero: true,
          grid: {
            color: getComputedStyle(document.documentElement).getPropertyValue('--glass-border').trim()
          },
          ticks: {
            color: getComputedStyle(document.documentElement).getPropertyValue('--text-tertiary').trim(),
            font: { family: 'Inter, sans-serif', size: 11 },
            callback: function(value) {
              return '₹' + value.toLocaleString('en-IN');
            }
          },
          border: { display: false }
        }
      },
      animation: {
        duration: 800,
        easing: 'easeOutQuart'
      }
    }
  };

  if (barChart) {
    barChart.data = chartData;
    barChart.update('active');
  } else {
    barChart = new Chart(canvas, config);
  }
}

/* ═══════════════════════════════════════════════════════════
   FILTERS — Filter, Search, Date Range
   ═══════════════════════════════════════════════════════════ */

let allTransactions = [];
let onFilterChange = null;
let activeType = 'all';
let activeCategory = 'all';
let searchQuery = '';
let dateFrom = '';
let dateTo = '';

function initFilters(callback) {
  onFilterChange = callback;
  setupFilterPills();
  setupSearch();
  setupDateRange();
}

function setTransactions(transactions) {
  allTransactions = transactions;
  applyFilters();
}

function getActiveFilterText() {
  let text = activeType === 'all' ? 'All' : activeType === 'income' ? 'Income' : 'Expense';
  if (activeCategory !== 'all') text += ` > ${activeCategory}`;
  if (searchQuery) text += ` matching "${searchQuery}"`;
  return text;
}

function setupFilterPills() {
  document.querySelectorAll('[data-filter-type]').forEach(pill => {
    pill.addEventListener('click', () => {
      activeType = pill.dataset.filterType;
      updateActivePills();
      applyFilters();
    });
  });

  document.querySelectorAll('[data-filter-category]').forEach(pill => {
    pill.addEventListener('click', () => {
      activeCategory = pill.dataset.filterCategory;
      updateActiveCategoryPills();
      applyFilters();
    });
  });
}

function updateActivePills() {
  document.querySelectorAll('[data-filter-type]').forEach(pill => {
    pill.classList.toggle('active', pill.dataset.filterType === activeType);
  });
  activeCategory = 'all';
  updateActiveCategoryPills();
}

function updateActiveCategoryPills() {
  document.querySelectorAll('[data-filter-category]').forEach(pill => {
    pill.classList.toggle('active', pill.dataset.filterCategory === activeCategory);
  });
}

function setupSearch() {
  const searchInput = document.getElementById('search-input');
  if (!searchInput) return;

  const debouncedSearch = debounce((value) => {
    searchQuery = value.toLowerCase().trim();
    applyFilters();
  }, 250);

  searchInput.addEventListener('input', (e) => {
    debouncedSearch(e.target.value);
  });
}

function setupDateRange() {
  const fromInput = document.getElementById('date-from');
  const toInput = document.getElementById('date-to');

  if (fromInput) {
    fromInput.addEventListener('change', (e) => {
      dateFrom = e.target.value;
      applyFilters();
    });
  }

  if (toInput) {
    toInput.addEventListener('change', (e) => {
      dateTo = e.target.value;
      applyFilters();
    });
  }
}

function applyFilters() {
  let filtered = [...allTransactions];

  if (activeType !== 'all') {
    filtered = filtered.filter(t => t.type === activeType);
  }

  if (activeCategory !== 'all') {
    filtered = filtered.filter(t => t.category === activeCategory);
  }

  if (searchQuery) {
    filtered = filtered.filter(t =>
      t.description.toLowerCase().includes(searchQuery) ||
      t.category.toLowerCase().includes(searchQuery)
    );
  }

  if (dateFrom) {
    const from = new Date(dateFrom);
    from.setHours(0, 0, 0, 0);
    filtered = filtered.filter(t => new Date(t.date) >= from);
  }

  if (dateTo) {
    const to = new Date(dateTo);
    to.setHours(23, 59, 59, 999);
    filtered = filtered.filter(t => new Date(t.date) <= to);
  }

  const countEl = document.getElementById('filter-count');
  if (countEl) {
    countEl.textContent = `${filtered.length} transaction${filtered.length !== 1 ? 's' : ''}`;
  }

  if (onFilterChange) onFilterChange(filtered);
}

function resetFilters() {
  activeType = 'all';
  activeCategory = 'all';
  searchQuery = '';
  dateFrom = '';
  dateTo = '';

  const searchInput = document.getElementById('search-input');
  if (searchInput) searchInput.value = '';

  const fromInput = document.getElementById('date-from');
  if (fromInput) fromInput.value = '';

  const toInput = document.getElementById('date-to');
  if (toInput) toInput.value = '';

  updateActivePills();
  updateActiveCategoryPills();
  applyFilters();
}

/* ═══════════════════════════════════════════════════════════
   TRANSACTION — Add/Delete Income & Expense
   ═══════════════════════════════════════════════════════════ */

let onTransactionsChange = null;

function initTransaction(callback) {
  onTransactionsChange = callback;
  setupModals();
}

function getAllTransactions() {
  const user = getCurrentUser();
  return user ? getTransactions(user.username) : [];
}

function setupModals() {
  const incomeForm = document.getElementById('income-form');
  if (incomeForm) {
    incomeForm.addEventListener('submit', handleAddIncome);
  }

  const incomeAmountInput = document.getElementById('income-amount');
  if (incomeAmountInput) {
    incomeAmountInput.addEventListener('input', () => {
      const preview = document.getElementById('income-preview');
      const val = Number(incomeAmountInput.value);
      if (val > 0) {
        preview.textContent = `${formatCurrency(val)} will be added to your wallet`;
        preview.className = 'amount-preview income-preview';
      } else {
        preview.textContent = 'Enter an amount';
        preview.className = 'amount-preview';
      }
    });
  }

  const expenseForm = document.getElementById('expense-form');
  if (expenseForm) {
    expenseForm.addEventListener('submit', handleAddExpense);
  }

  const expenseAmountInput = document.getElementById('expense-amount');
  if (expenseAmountInput) {
    expenseAmountInput.addEventListener('input', () => {
      const preview = document.getElementById('expense-preview');
      const val = Number(expenseAmountInput.value);
      const balance = walletGetBalance();
      if (val > 0) {
        if (val > balance) {
          preview.textContent = `Insufficient funds! Balance: ${formatCurrency(balance)}`;
          preview.className = 'amount-preview expense-preview';
        } else {
          preview.textContent = `${formatCurrency(val)} will be deducted | Remaining: ${formatCurrency(balance - val)}`;
          preview.className = 'amount-preview expense-preview';
        }
      } else {
        preview.textContent = `Current balance: ${formatCurrency(balance)}`;
        preview.className = 'amount-preview';
      }
    });
  }

  document.querySelectorAll('.category-item').forEach(item => {
    item.addEventListener('click', () => {
      document.querySelectorAll('.category-item').forEach(i => i.classList.remove('selected'));
      item.classList.add('selected');
    });
  });

  const clearAllBtn = document.getElementById('clear-all-btn');
  if (clearAllBtn) {
    clearAllBtn.addEventListener('click', handleClearAll);
  }

  const editForm = document.getElementById('edit-form');
  if (editForm) {
    editForm.addEventListener('submit', handleEditTransactionSubmit);
  }

  const editAmountInput = document.getElementById('edit-amount');
  if (editAmountInput) {
    editAmountInput.addEventListener('input', () => {
      const preview = document.getElementById('edit-preview');
      const val = Number(editAmountInput.value);
      const type = document.getElementById('edit-type').value;
      const id = document.getElementById('edit-id').value;
      
      const transactions = getAllTransactions();
      const oldTxn = transactions.find(t => t.id === id);
      if (!oldTxn) return;

      const balance = walletGetBalance();

      if (val > 0) {
        if (type === 'income') {
          const diff = val - oldTxn.amount;
          if (diff >= 0) {
            preview.textContent = `New Income: ${formatCurrency(val)} | Wallet will increase by ${formatCurrency(diff)}`;
            preview.className = 'amount-preview income-preview';
          } else {
            const absDiff = Math.abs(diff);
            if (balance < absDiff) {
              preview.textContent = `Insufficient funds! Wallet needs to decrease by ${formatCurrency(absDiff)} but balance is only ${formatCurrency(balance)}`;
              preview.className = 'amount-preview expense-preview';
            } else {
              preview.textContent = `New Income: ${formatCurrency(val)} | Wallet will decrease by ${formatCurrency(absDiff)}`;
              preview.className = 'amount-preview expense-preview';
            }
          }
        } else {
          const diff = val - oldTxn.amount;
          if (diff <= 0) {
            preview.textContent = `New Expense: ${formatCurrency(val)} | Wallet will save ${formatCurrency(Math.abs(diff))}`;
            preview.className = 'amount-preview income-preview';
          } else {
            if (balance < diff) {
              preview.textContent = `Insufficient funds! Need ${formatCurrency(diff)} more | Balance: ${formatCurrency(balance)}`;
              preview.className = 'amount-preview expense-preview';
            } else {
              preview.textContent = `New Expense: ${formatCurrency(val)} | Wallet will decrease by ${formatCurrency(diff)}`;
              preview.className = 'amount-preview expense-preview';
            }
          }
        }
      } else {
        preview.textContent = `Old Amount: ${formatCurrency(oldTxn.amount)}`;
        preview.className = 'amount-preview';
      }
    });
  }
}

function handleAddIncome(e) {
  e.preventDefault();

  const amountInput = document.getElementById('income-amount');
  const descInput = document.getElementById('income-description');

  const amount = Number(amountInput.value);
  const description = descInput.value.trim();

  if (!amount || amount <= 0) {
    showToast('Invalid Amount', 'Please enter a valid amount greater than ₹0', 'error');
    amountInput.classList.add('input-error');
    setTimeout(() => amountInput.classList.remove('input-error'), 1000);
    return;
  }

  if (!description) {
    showToast('Description Required', 'Please describe where this income came from', 'error');
    descInput.classList.add('input-error');
    setTimeout(() => descInput.classList.remove('input-error'), 1000);
    return;
  }

  const user = getCurrentUser();
  if (!user) return;

  const transaction = {
    id: generateId(),
    type: 'income',
    category: 'income',
    amount: amount,
    description: description,
    date: new Date().toISOString()
  };

  addTransaction(user.username, transaction);
  addMoney(amount);

  amountInput.value = '';
  descInput.value = '';
  document.getElementById('income-preview').textContent = 'Enter an amount';
  document.getElementById('income-preview').className = 'amount-preview';

  closeModal('income-modal');

  showToast('Income Added! 💰', `${formatCurrency(amount)} added to your wallet`, 'success');

  if (onTransactionsChange) onTransactionsChange();
}

function handleAddExpense(e) {
  e.preventDefault();

  const amountInput = document.getElementById('expense-amount');
  const descInput = document.getElementById('expense-description');
  const selectedCategory = document.querySelector('#expense-form .category-item.selected');

  const amount = Number(amountInput.value);
  const description = descInput.value.trim();

  if (!selectedCategory) {
    showToast('Select Category', 'Please select an expense category', 'error');
    return;
  }

  if (!amount || amount <= 0) {
    showToast('Invalid Amount', 'Please enter a valid amount greater than ₹0', 'error');
    amountInput.classList.add('input-error');
    setTimeout(() => amountInput.classList.remove('input-error'), 1000);
    return;
  }

  if (!description) {
    showToast('Description Required', 'Please describe what you spent on', 'error');
    descInput.classList.add('input-error');
    setTimeout(() => descInput.classList.remove('input-error'), 1000);
    return;
  }

  if (!canAfford(amount)) {
    showToast('Insufficient Funds! 💸', `You need ${formatCurrency(amount)} but only have ${formatCurrency(walletGetBalance())}`, 'error');
    amountInput.classList.add('input-error');
    setTimeout(() => amountInput.classList.remove('input-error'), 1000);
    return;
  }

  const user = getCurrentUser();
  if (!user) return;

  const category = selectedCategory.dataset.category;

  const transaction = {
    id: generateId(),
    type: 'expense',
    category: category,
    amount: amount,
    description: description,
    date: new Date().toISOString()
  };

  addTransaction(user.username, transaction);
  deductMoney(amount);

  amountInput.value = '';
  descInput.value = '';
  document.querySelectorAll('.category-item').forEach(i => i.classList.remove('selected'));
  document.getElementById('expense-preview').textContent = 'Select category & enter amount';
  document.getElementById('expense-preview').className = 'amount-preview';

  closeModal('expense-modal');

  checkBudgetWarning(user.username, category);

  const catInfo = CATEGORIES[category];
  showToast('Expense Recorded! 📝', `${catInfo.emoji} ${catInfo.name}: ${formatCurrency(amount)}`, 'info');

  if (onTransactionsChange) onTransactionsChange();
}

function deleteTransactionHandler(transactionId) {
  const user = getCurrentUser();
  if (!user) return;

  showConfirm(
    'Are you sure you want to delete this transaction? Your balance will be adjusted accordingly.',
    '🗑️',
    () => {
      const deleted = deleteTransaction(user.username, transactionId);
      if (deleted) {
        if (deleted.type === 'income') {
          deductMoney(deleted.amount);
        } else {
          addMoney(deleted.amount);
        }

        const cardEl = document.querySelector(`[data-txn-id="${transactionId}"]`);
        if (cardEl) {
          cardEl.classList.add('card-removing');
          setTimeout(() => {
            if (onTransactionsChange) onTransactionsChange();
          }, 400);
        } else {
          if (onTransactionsChange) onTransactionsChange();
        }

        showToast('Deleted', 'Transaction removed & balance adjusted', 'success');
      }
    },
    'Delete',
    'btn-danger'
  );
}

function handleClearAll() {
  const user = getCurrentUser();
  if (!user) return;

  const transactions = getAllTransactions();
  if (transactions.length === 0) {
    showToast('No Transactions', 'There are no transactions to clear', 'info');
    return;
  }

  showConfirm(
    `This will permanently delete all ${transactions.length} transactions. Your balance will be reset to your current amount. This cannot be undone!`,
    '⚠️',
    () => {
      clearAllTransactions(user.username);

      if (onTransactionsChange) onTransactionsChange();
      showToast('All Clear! 🧹', 'Transaction history has been cleared', 'success');
    },
    'Clear All',
    'btn-danger'
  );
}

function checkBudgetWarning(username, category) {
  const budgets = getBudgets(username);
  const limit = budgets[category];

  if (!limit) return;

  const transactions = getTransactions(username);
  const spent = transactions
    .filter(t => t.type === 'expense' && t.category === category)
    .reduce((sum, t) => sum + t.amount, 0);

  const percentage = (spent / limit) * 100;
  const catInfo = CATEGORIES[category];

  if (percentage >= 100) {
    showToast(
      'Budget Exceeded! 🚨',
      `${catInfo.emoji} ${catInfo.name}: You've spent ${formatCurrency(spent)} of ${formatCurrency(limit)} limit`,
      'error',
      6000
    );
  } else if (percentage >= 80) {
    showToast(
      'Budget Warning! ⚠️',
      `${catInfo.emoji} ${catInfo.name}: ${Math.round(percentage)}% used (${formatCurrency(spent)} / ${formatCurrency(limit)})`,
      'warning',
      5000
    );
  }
}

function renderList(transactions) {
  const listEl = document.getElementById('transaction-list');
  if (!listEl) return;

  if (transactions.length === 0) {
    listEl.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">📭</div>
        <div class="empty-title">No transactions yet</div>
        <div class="empty-description">Start by adding your first income or expense to track your finances.</div>
      </div>
    `;
    return;
  }

  listEl.innerHTML = transactions.map((txn, index) => {
    const catInfo = CATEGORIES[txn.category] || CATEGORIES.other;
    const isIncome = txn.type === 'income';
    const amountClass = isIncome ? 'income' : 'expense';
    const amountPrefix = isIncome ? '+' : '-';
    const iconBg = isIncome ? 'var(--color-success-bg)' : `${catInfo.color}22`;
    const delay = Math.min(index * 0.05, 0.5);

    return `
      <div class="transaction-card" data-txn-id="${txn.id}" style="animation-delay: ${delay}s">
        <div class="txn-icon" style="background: ${iconBg}">
          ${catInfo.emoji}
        </div>
        <div class="txn-info">
          <div class="txn-category">${catInfo.name}</div>
          <div class="txn-description" title="${txn.description}">${txn.description}</div>
        </div>
        <div class="txn-right">
          <div class="txn-amount ${amountClass}">${amountPrefix}${formatCurrency(txn.amount)}</div>
          <div class="txn-date">${formatDate(txn.date)}</div>
        </div>
        <button class="txn-edit btn-icon" data-tooltip="Edit" onclick="window.ExpenseTracker.editTransaction('${txn.id}')" style="margin-right: 4px;">
          ✏️
        </button>
        <button class="txn-delete btn-icon btn-icon-danger" data-tooltip="Delete" onclick="window.ExpenseTracker.deleteTransaction('${txn.id}')">
          🗑️
        </button>
      </div>
    `;
  }).join('');
}

function editTransaction(transactionId) {
  const user = getCurrentUser();
  if (!user) return;

  const transactions = getAllTransactions();
  const txn = transactions.find(t => t.id === transactionId);
  if (!txn) return;

  document.getElementById('edit-id').value = txn.id;
  document.getElementById('edit-type').value = txn.type;

  const amountInput = document.getElementById('edit-amount');
  const descInput = document.getElementById('edit-description');
  amountInput.value = txn.amount;
  descInput.value = txn.description;

  amountInput.classList.remove('input-error');
  descInput.classList.remove('input-error');
  document.querySelectorAll('#edit-form .category-item').forEach(i => i.classList.remove('selected'));

  const categoryGroup = document.getElementById('edit-category-group');
  const preview = document.getElementById('edit-preview');

  if (txn.type === 'income') {
    if (categoryGroup) categoryGroup.style.display = 'none';
    if (preview) {
      preview.textContent = `Old Income: ${formatCurrency(txn.amount)}`;
      preview.className = 'amount-preview';
    }
  } else {
    if (categoryGroup) categoryGroup.style.display = 'block';
    
    const catItem = document.querySelector(`#edit-form .category-item[data-category="${txn.category}"]`);
    if (catItem) catItem.classList.add('selected');

    if (preview) {
      preview.textContent = `Old Expense: ${formatCurrency(txn.amount)}`;
      preview.className = 'amount-preview';
    }
  }

  openModal('edit-modal');
}

function handleEditTransactionSubmit(e) {
  e.preventDefault();

  const id = document.getElementById('edit-id').value;
  const type = document.getElementById('edit-type').value;
  const amountInput = document.getElementById('edit-amount');
  const descInput = document.getElementById('edit-description');
  const amount = Number(amountInput.value);
  const description = descInput.value.trim();

  if (!amount || amount <= 0) {
    showToast('Invalid Amount', 'Please enter a valid amount greater than ₹0', 'error');
    amountInput.classList.add('input-error');
    setTimeout(() => amountInput.classList.remove('input-error'), 1000);
    return;
  }

  if (!description) {
    showToast('Description Required', 'Please enter a description', 'error');
    descInput.classList.add('input-error');
    setTimeout(() => descInput.classList.remove('input-error'), 1000);
    return;
  }

  const user = getCurrentUser();
  if (!user) return;

  const transactions = getAllTransactions();
  const oldTxn = transactions.find(t => t.id === id);
  if (!oldTxn) return;

  let category = oldTxn.category;
  if (type === 'expense') {
    const selectedCategory = document.querySelector('#edit-form .category-item.selected');
    if (!selectedCategory) {
      showToast('Select Category', 'Please select an expense category', 'error');
      return;
    }
    category = selectedCategory.dataset.category;
  }

  if (type === 'expense' && amount > walletGetBalance() + oldTxn.amount) {
    showToast('Insufficient Funds', 'Not enough balance for this expense', 'error');
    amountInput.classList.add('input-error');
    setTimeout(() => amountInput.classList.remove('input-error'), 1000);
    return;
  }

  const diff = amount - oldTxn.amount;

  if (type === 'income') {
    if (diff > 0) {
      addMoney(diff);
    } else if (diff < 0) {
      deductMoney(Math.abs(diff));
    }
  } else {
    if (diff > 0) {
      deductMoney(diff);
    } else if (diff < 0) {
      addMoney(Math.abs(diff));
    }
  }

  const updatedTxn = {
    ...oldTxn,
    amount,
    description,
    category
  };

  updateTransaction(user.username, updatedTxn);

  closeModal('edit-modal');
  showToast('Updated! 📝', 'Transaction updated successfully', 'success');

  if (onTransactionsChange) onTransactionsChange();
}

/* ═══════════════════════════════════════════════════════════
   APP — Main Entry Point & Initialization
   ═══════════════════════════════════════════════════════════ */

document.addEventListener('DOMContentLoaded', () => {
  initTheme();
  initRipples();

  initAuth({
    onAuthSuccess: () => enterDashboard(),
    onLogout: () => exitDashboard()
  });

  if (isLoggedIn()) {
    enterDashboard();
  } else {
    showView('auth');
  }

  setupGlobalListeners();
  setupKeyboardShortcuts();
});

function enterDashboard() {
  const user = getCurrentUser();
  if (!user) return;

  showView('dashboard');

  const greetingEl = document.getElementById('user-greeting');
  if (greetingEl) {
    greetingEl.innerHTML = `Hey, <span class="user-name">${user.name}</span>! 👋`;
  }

  initTransaction(() => {
    refreshDashboard();
  });

  initFilters((filteredList) => {
    renderList(filteredList);
  });

  refreshDashboard();
}

function exitDashboard() {
  destroyCharts();
  showView('auth');
}

function refreshDashboard() {
  const transactions = getAllTransactions();

  updateAllStats(transactions);
  setTransactions(transactions);
  updateCharts(transactions);
  updateInsights(transactions);
  updateBudgetsDisplay();
}

function setupGlobalListeners() {
  const logoutBtn = document.getElementById('logout-btn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', () => {
      showConfirm(
        'Are you sure you want to logout?',
        '👋',
        () => authLogout(),
        'Logout',
        'btn-danger'
      );
    });
  }

  const themeToggle = document.getElementById('theme-toggle');
  if (themeToggle) {
    themeToggle.addEventListener('click', () => {
      toggleTheme();
      setTimeout(() => {
        destroyCharts();
        updateCharts(getAllTransactions());
      }, 100);
    });
  }

  const addIncomeBtn = document.getElementById('add-income-btn');
  if (addIncomeBtn) {
    addIncomeBtn.addEventListener('click', () => {
      openModal('income-modal');
    });
  }

  const addExpenseBtn = document.getElementById('add-expense-btn');
  if (addExpenseBtn) {
    addExpenseBtn.addEventListener('click', () => {
      const balance = walletGetBalance();
      const preview = document.getElementById('expense-preview');
      if (preview) {
        preview.textContent = `Current balance: ${formatCurrency(balance)}`;
        preview.className = 'amount-preview';
      }
      openModal('expense-modal');
    });
  }

  document.querySelectorAll('[data-close-modal]').forEach(btn => {
    btn.addEventListener('click', () => {
      closeModal(btn.dataset.closeModal);
    });
  });

  const exportBtn = document.getElementById('export-csv-btn');
  if (exportBtn) {
    exportBtn.addEventListener('click', () => {
      const transactions = getAllTransactions();
      if (transactions.length === 0) {
        showToast('No Data', 'No transactions to export', 'info');
        return;
      }
      const csv = transactionsToCSV(transactions);
      const user = getCurrentUser();
      downloadCSV(csv, `${user.name}_transactions.csv`);
      showToast('Exported! 📥', 'CSV file downloaded successfully', 'success');
    });
  }

  const manageBudgetsBtn = document.getElementById('manage-budgets-btn');
  if (manageBudgetsBtn) {
    manageBudgetsBtn.addEventListener('click', () => {
      const categorySelect = document.getElementById('budget-category');
      const limitInput = document.getElementById('budget-limit');
      if (categorySelect) categorySelect.value = '';
      if (limitInput) limitInput.value = '';
      openModal('budget-modal');
    });
  }

  const budgetForm = document.getElementById('budget-form');
  if (budgetForm) {
    budgetForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const categorySelect = document.getElementById('budget-category');
      const limitInput = document.getElementById('budget-limit');
      const category = categorySelect.value;
      const limit = Number(limitInput.value);

      if (!category) {
        showToast('Category Required', 'Please select a category', 'error');
        return;
      }

      if (limitInput.value === '' || isNaN(limit) || limit < 0) {
        showToast('Invalid Limit', 'Budget limit must be ₹0 or more', 'error');
        return;
      }

      const user = getCurrentUser();
      if (user) {
        setBudget(user.username, category, limit);
        closeModal('budget-modal');
        showToast('Budget Updated! 🎯', `Budget for ${CATEGORIES[category].name} set to ${formatCurrency(limit)}`, 'success');
        refreshDashboard();
      }
    });
  }
}

function setupKeyboardShortcuts() {
  document.addEventListener('keydown', (e) => {
    if (!isLoggedIn()) return;

    if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

    if (e.ctrlKey && e.key === 'i') {
      e.preventDefault();
      openModal('income-modal');
    }

    if (e.ctrlKey && e.key === 'e') {
      e.preventDefault();
      const balance = walletGetBalance();
      const preview = document.getElementById('expense-preview');
      if (preview) {
        preview.textContent = `Current balance: ${formatCurrency(balance)}`;
        preview.className = 'amount-preview';
      }
      openModal('expense-modal');
    }

    if (e.key === 'Escape') {
      closeAllModals();
    }
  });
}

function updateInsights(transactions) {
  const insightsEl = document.getElementById('insights-list');
  if (!insightsEl) return;

  const insights = generateInsights(transactions);

  if (insights.length === 0) {
    insightsEl.innerHTML = `
      <div class="insight-item">
        <span class="insight-icon">💡</span>
        <span class="insight-text">Add some transactions to see spending insights here!</span>
      </div>
    `;
    return;
  }

  insightsEl.innerHTML = insights.map(insight => `
    <div class="insight-item">
      <span class="insight-icon">${insight.icon}</span>
      <span class="insight-text">${insight.text}</span>
    </div>
  `).join('');
}

function generateInsights(transactions) {
  const insights = [];
  const expenses = transactions.filter(t => t.type === 'expense');
  const incomes = transactions.filter(t => t.type === 'income');

  if (transactions.length === 0) return insights;

  insights.push({
    icon: '📊',
    text: `You have <strong>${transactions.length}</strong> transactions so far.`
  });

  if (expenses.length > 0) {
    const categoryTotals = {};
    expenses.forEach(t => {
      categoryTotals[t.category] = (categoryTotals[t.category] || 0) + t.amount;
    });

    const topCategory = Object.entries(categoryTotals).sort((a, b) => b[1] - a[1])[0];
    const catInfo = CATEGORIES[topCategory[0]];
    insights.push({
      icon: catInfo.emoji,
      text: `Your highest spending is on <strong>${catInfo.name}</strong> at <strong>${formatCurrency(topCategory[1])}</strong>.`
    });

    const avgExpense = expenses.reduce((sum, t) => sum + t.amount, 0) / expenses.length;
    insights.push({
      icon: '📈',
      text: `Your average expense is <strong>${formatCurrency(Math.round(avgExpense))}</strong> per transaction.`
    });
  }

  if (incomes.length > 0 && expenses.length > 0) {
    const totalIncome = incomes.reduce((sum, t) => sum + t.amount, 0);
    const totalExpense = expenses.reduce((sum, t) => sum + t.amount, 0);
    const savingsRate = ((totalIncome - totalExpense) / totalIncome * 100).toFixed(0);

    if (savingsRate > 0) {
      insights.push({
        icon: '🎯',
        text: `You're saving <strong>${savingsRate}%</strong> of your income. ${savingsRate > 30 ? 'Great job! 🎉' : 'Try to save more!'}`
      });
    } else {
      insights.push({
        icon: '⚠️',
        text: `You're spending more than you earn! Time to cut back.`
      });
    }
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayExpenses = expenses.filter(t => new Date(t.date) >= today);
  if (todayExpenses.length > 0) {
    const todayTotal = todayExpenses.reduce((sum, t) => sum + t.amount, 0);
    insights.push({
      icon: '📅',
      text: `You've spent <strong>${formatCurrency(todayTotal)}</strong> today across <strong>${todayExpenses.length}</strong> transaction${todayExpenses.length > 1 ? 's' : ''}.`
    });
  }

  return insights.slice(0, 5);
}

function updateBudgetsDisplay() {
  const budgetsListEl = document.getElementById('budgets-list');
  if (!budgetsListEl) return;

  const user = getCurrentUser();
  if (!user) return;

  const budgets = getBudgets(user.username);
  const transactions = getAllTransactions();
  const expenses = transactions.filter(t => t.type === 'expense');

  const categories = ['food', 'transport', 'shopping', 'health', 'entertainment', 'education', 'bills', 'other'];
  
  let hasBudgets = false;
  let html = '';

  categories.forEach(cat => {
    const limit = budgets[cat];
    if (limit && limit > 0) {
      hasBudgets = true;
      const spent = expenses.filter(t => t.category === cat).reduce((sum, t) => sum + t.amount, 0);
      const percent = Math.min((spent / limit) * 100, 100);
      const catInfo = CATEGORIES[cat];
      
      let progressClass = '';
      if (percent >= 100) progressClass = 'danger';
      else if (percent >= 80) progressClass = 'warning';

      html += `
        <div class="budget-item">
          <div class="budget-item-header">
            <span class="budget-label">${catInfo.emoji} ${catInfo.name}</span>
            <span class="budget-amount">${formatCurrency(spent)} / ${formatCurrency(limit)}</span>
          </div>
          <div class="budget-progress">
            <div class="progress-fill ${progressClass}" style="width: ${percent}%"></div>
          </div>
        </div>
      `;
    }
  });

  if (!hasBudgets) {
    budgetsListEl.innerHTML = `
      <div class="empty-state" style="padding: var(--space-4) 0;">
        <div class="empty-icon" style="font-size: 2rem; margin-bottom: var(--space-2);">🎯</div>
        <div class="empty-title" style="font-size: var(--fs-sm);">No budgets set</div>
        <div class="empty-description" style="font-size: var(--fs-xs); max-width: 200px; margin: 0 auto;">Set monthly limits for your categories to track spending limits.</div>
      </div>
    `;
  } else {
    budgetsListEl.innerHTML = html;
  }
}

window.ExpenseTracker = {
  deleteTransaction: (id) => deleteTransactionHandler(id),
  editTransaction: (id) => editTransaction(id)
};
