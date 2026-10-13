(() => {
  "use strict";

  const STORAGE_KEY = "ledgerly-expense-tracker-v1";
  const BUDGET_CATEGORIES = ["Food", "Transport", "Shopping", "Bills"];
  const CATEGORIES = {
    expense: ["Food", "Transport", "Shopping", "Bills", "Health", "Entertainment", "Travel", "Other"],
    income: ["Salary", "Freelance", "Investment", "Gift", "Other"]
  };
  const CATEGORY_ICONS = {
    Food: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 3v7M4.5 3v4a2.5 2.5 0 0 0 5 0V3M7 9.5V21M16 3v18M16 3c2 2.5 3 5.2 3 8h-3"/></svg>',
    Transport: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 16V7a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v9M5 12h14M7 16v3m10-3v3M5 19h14"/><circle cx="8" cy="9" r="1"/><circle cx="16" cy="9" r="1"/></svg>',
    Shopping: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 8h14l-1 12H6L5 8Z"/><path d="M9 8V6a3 3 0 0 1 6 0v2"/></svg>',
    Bills: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 3h12v18l-3-2-3 2-3-2-3 2V3Z"/><path d="M9 8h6M9 12h6M9 16h3"/></svg>',
    Health: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 20s-8-4.5-8-11a4.5 4.5 0 0 1 8-2.8A4.5 4.5 0 0 1 20 9c0 6.5-8 11-8 11Z"/><path d="M9 12h6M12 9v6"/></svg>',
    Entertainment: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m8 5 12 7-12 7V5Z"/><path d="M4 5v14"/></svg>',
    Travel: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 13.5 21 7l-7 14-2.2-6.8L3 13.5Z"/><path d="m11.8 14.2 4.5-4.5"/></svg>',
    Salary: '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="6" width="18" height="13" rx="2"/><path d="M3 10h18M8 15h3"/></svg>',
    Freelance: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 20V9l8-5 8 5v11M8 20v-6h8v6M3 20h18"/></svg>',
    Investment: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m4 16 5-5 4 3 7-8M15 6h5v5"/></svg>',
    Gift: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 10h16v11H4zM3 6h18v4H3zM12 6v15"/><path d="M12 6H8.5a2.5 2.5 0 1 1 2.5-2c0 .7.4 1.4 1 2ZM12 6h3.5a2.5 2.5 0 1 0-2.5-2c0 .7-.4 1.4-1 2Z"/></svg>',
    Other: '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="5" cy="12" r="1"/><circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/></svg>'
  };
  const CURRENCIES = {
    PKR: { locale: "en-PK", currency: "PKR" },
    USD: { locale: "en-US", currency: "USD" },
    EUR: { locale: "de-DE", currency: "EUR" },
    GBP: { locale: "en-GB", currency: "GBP" },
    INR: { locale: "en-IN", currency: "INR" },
    AED: { locale: "en-AE", currency: "AED" }
  };
  const today = new Date();
  const monthInput = document.querySelector("#month-select");
  const currencyInput = document.querySelector("#currency-select");
  const dialog = document.querySelector("#transaction-dialog");
  const form = document.querySelector("#transaction-form");
  const toast = document.querySelector("#toast");
  let state = { transactions: [], budgets: {}, currency: "PKR" };
  let toastTimer;
  let budgetEditor = null;

  function localDate(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  }

  function isValidTransaction(item) {
    return item && typeof item.id === "string" && typeof item.description === "string" &&
      typeof item.category === "string" && ["expense", "income"].includes(item.type) &&
      Number.isFinite(item.amount) && item.amount > 0 &&
      typeof item.date === "string" && /^\d{4}-\d{2}-\d{2}$/.test(item.date) &&
      typeof item.notes === "string";
  }

  function loadState() {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (!saved) return;
      const parsed = JSON.parse(saved);
      if (!parsed || !Array.isArray(parsed.transactions) || !parsed.budgets || typeof parsed.budgets !== "object") {
        throw new Error("Saved tracker data has an unexpected format.");
      }
      if (!parsed.transactions.every(isValidTransaction)) {
        throw new Error("Some saved transactions are invalid and were not loaded.");
      }
      const budgets = {};
      for (const category of BUDGET_CATEGORIES) {
        const value = Number(parsed.budgets[category]);
        if (Number.isFinite(value) && value >= 0) budgets[category] = value;
      }
      state = {
        transactions: parsed.transactions,
        budgets,
        currency: Object.hasOwn(CURRENCIES, parsed.currency) ? parsed.currency : "PKR"
      };
    } catch (error) {
      state = { transactions: [], budgets: {}, currency: "PKR" };
      showToast(`Could not load saved data: ${error.message}`, true);
    }
  }

  function saveState() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
      return true;
    } catch (error) {
      showToast(`Could not save data on this device: ${error.message}`, true);
      return false;
    }
  }

  function showToast(message, isError = false) {
    window.clearTimeout(toastTimer);
    toast.textContent = message;
    toast.classList.toggle("error", isError);
    toast.classList.add("visible");
    toastTimer = window.setTimeout(() => toast.classList.remove("visible"), 3400);
  }

  function formatMoney(value, compact = false) {
    const config = CURRENCIES[state.currency] || CURRENCIES.PKR;
    try {
      return new Intl.NumberFormat(config.locale, {
        style: "currency",
        currency: config.currency,
        maximumFractionDigits: 0,
        notation: compact && Math.abs(value) >= 1000000 ? "compact" : "standard"
      }).format(value);
    } catch {
      return `${state.currency} ${Number(value).toLocaleString("en")}`;
    }
  }

  function formatDate(date) {
    const parsed = new Date(`${date}T12:00:00`);
    if (Number.isNaN(parsed.getTime())) return date;
    return new Intl.DateTimeFormat("en", { month: "short", day: "numeric", year: "numeric" }).format(parsed);
  }

  function escapeHtml(value) {
    return String(value).replace(/[&<>"']/g, character => ({
      "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
    })[character]);
  }

  function monthKey(date) {
    return date.slice(0, 7);
  }

  function monthLabel(key, options = { month: "long", year: "numeric" }) {
    return new Intl.DateTimeFormat("en", options).format(new Date(`${key}-15T12:00:00`));
  }

  function selectedMonth() {
    return monthInput.value || localDate(today).slice(0, 7);
  }

  function monthTransactions(key = selectedMonth()) {
    return state.transactions.filter(item => monthKey(item.date) === key);
  }

  function renderMonthOptions(preferredMonth = null) {
    const currentYear = today.getFullYear();
    const currentMonth = today.getMonth();
    const selected = preferredMonth || monthInput.value || localDate(today).slice(0, 7);
    const months = new Set();
    for (let offset = -11; offset <= 0; offset += 1) {
      const date = new Date(currentYear, currentMonth + offset, 1);
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
      months.add(key);
    }
    state.transactions.forEach(item => months.add(monthKey(item.date)));
    const options = [...months].sort().map(key => `<option value="${key}">${monthLabel(key)}</option>`);
    monthInput.innerHTML = options.join("");
    monthInput.value = months.has(selected) ? selected : localDate(today).slice(0, 7);
  }

  function setCategories(select, categories, selected) {
    select.innerHTML = categories.map(category => `<option value="${escapeHtml(category)}">${escapeHtml(category)}</option>`).join("");
    if (selected && categories.includes(selected)) select.value = selected;
  }

  function renderCategoryFilter() {
    const select = document.querySelector("#category-filter");
    const current = select.value;
    const categories = [...new Set(state.transactions.map(item => item.category))].sort((a, b) => a.localeCompare(b));
    select.innerHTML = '<option value="all">All categories</option>' + categories.map(category =>
      `<option value="${escapeHtml(category)}">${escapeHtml(category)}</option>`
    ).join("");
    if (categories.includes(current)) select.value = current;
  }

  function renderStats() {
    const transactions = monthTransactions();
    const income = transactions.filter(item => item.type === "income");
    const expenses = transactions.filter(item => item.type === "expense");
    const incomeTotal = income.reduce((sum, item) => sum + item.amount, 0);
    const expenseTotal = expenses.reduce((sum, item) => sum + item.amount, 0);
    document.querySelector("#balance-total").textContent = formatMoney(incomeTotal - expenseTotal);
    document.querySelector("#income-total").textContent = formatMoney(incomeTotal);
    document.querySelector("#expense-total").textContent = formatMoney(expenseTotal);
    document.querySelector("#income-count").textContent = `${income.length} ${income.length === 1 ? "entry" : "entries"}`;
    document.querySelector("#expense-count").textContent = `${expenses.length} ${expenses.length === 1 ? "entry" : "entries"}`;
    document.querySelector("#amount-currency").textContent = state.currency;
    document.querySelector("#chart-period").textContent = monthLabel(selectedMonth(), { month: "short", year: "numeric" });
  }

  function renderTransactions() {
    const search = document.querySelector("#search-input").value.trim().toLowerCase();
    const type = document.querySelector("#type-filter").value;
    const category = document.querySelector("#category-filter").value;
    const transactions = monthTransactions().filter(item =>
      (!search || `${item.description} ${item.category} ${item.notes}`.toLowerCase().includes(search)) &&
      (type === "all" || item.type === type) &&
      (category === "all" || item.category === category)
    ).sort((a, b) => b.date.localeCompare(a.date) || b.id.localeCompare(a.id));
    const body = document.querySelector("#transaction-rows");
    body.innerHTML = transactions.map(item => {
      const description = escapeHtml(item.description);
      const notes = item.notes ? `<div class="transaction-note">${escapeHtml(item.notes)}</div>` : "";
      const amount = `${item.type === "income" ? "+" : "−"}${formatMoney(item.amount)}`;
      return `<tr class="transaction-row">
        <td><div class="transaction-name"><span class="transaction-icon ${item.type === "income" ? "income" : ""}">${CATEGORY_ICONS[item.category] || CATEGORY_ICONS.Other}</span><div><div class="transaction-name-text">${description}</div>${notes}</div></div></td>
        <td><span class="category-pill">${escapeHtml(item.category)}</span></td>
        <td>${formatDate(item.date)}</td>
        <td class="amount-cell"><span class="amount-value ${item.type}">${amount}</span></td>
        <td><div class="row-actions"><button class="icon-button edit-transaction" type="button" data-id="${escapeHtml(item.id)}" aria-label="Edit ${description}"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="m14 5 5 5M4 20l4-.8L19 8a2.1 2.1 0 0 0-3-3L5 16l-1 4Z"/></svg></button><button class="icon-button delete delete-transaction" type="button" data-id="${escapeHtml(item.id)}" aria-label="Delete ${description}"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 7h16M10 11v6M14 11v6M6 7l1 14h10l1-14M9 7V4h6v3"/></svg></button></div></td>
      </tr>`;
    }).join("");
    const empty = transactions.length === 0;
    document.querySelector("#empty-state").classList.toggle("visible", empty);
    document.querySelector("#transaction-count").textContent = `Showing ${transactions.length} ${transactions.length === 1 ? "transaction" : "transactions"}`;
  }

  function renderChart() {
    const svg = document.querySelector("#flow-chart");
    const width = Math.max(svg.clientWidth, 300);
    const height = 178;
    const left = 40;
    const right = 12;
    const top = 9;
    const bottom = 25;
    const chartHeight = height - top - bottom;
    const chartWidth = width - left - right;
    const year = Number(selectedMonth().slice(0, 4));
    const monthly = Array.from({ length: 12 }, (_, month) => {
      const prefix = `${year}-${String(month + 1).padStart(2, "0")}`;
      const items = state.transactions.filter(item => monthKey(item.date) === prefix);
      return {
        income: items.filter(item => item.type === "income").reduce((sum, item) => sum + item.amount, 0),
        expense: items.filter(item => item.type === "expense").reduce((sum, item) => sum + item.amount, 0)
      };
    });
    const max = Math.max(...monthly.flatMap(item => [item.income, item.expense]), 1);
    const scaleMax = max === 1 ? 100 : max * 1.15;
    const pointsFor = key => monthly.map((item, index) => {
      const x = left + (chartWidth * index / 11);
      const y = top + chartHeight - (item[key] / scaleMax * chartHeight);
      return [x, y];
    });
    const drawLine = (points, color) => {
      const path = points.map(([x, y], index) => `${index === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`).join(" ");
      return `<path d="${path}" fill="none" stroke="${color}" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>` +
        points.map(([x, y]) => `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="2.7" fill="#fff" stroke="${color}" stroke-width="1.8"/>`).join("");
    };
    const labels = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const grid = [0, 1, 2, 3].map(index => {
      const y = top + chartHeight * index / 3;
      const value = scaleMax * (3 - index) / 3;
      return `<line x1="${left}" y1="${y.toFixed(1)}" x2="${width - right}" y2="${y.toFixed(1)}" stroke="#f0f2f6" stroke-width="1"/><text x="${left - 7}" y="${(y + 3).toFixed(1)}" text-anchor="end" fill="#a3adba" font-size="8">${formatCompact(value)}</text>`;
    }).join("");
    const monthLabels = labels.map((label, index) => {
      const x = left + chartWidth * index / 11;
      return `<text x="${x.toFixed(1)}" y="${height - 5}" text-anchor="middle" fill="#a3adba" font-size="8">${label}</text>`;
    }).join("");
    svg.setAttribute("viewBox", `0 0 ${width} ${height}`);
    svg.innerHTML = `${grid}${drawLine(pointsFor("income"), "#43bd8a")}${drawLine(pointsFor("expense"), "#a39af2")}${monthLabels}`;
    const yearTotal = monthly.reduce((sum, item) => sum + item.income + item.expense, 0);
    const summary = yearTotal ? `Year to date · ${formatMoney(monthly.reduce((sum, item) => sum + item.income, 0))} income · ${formatMoney(monthly.reduce((sum, item) => sum + item.expense, 0))} spent` : "Add a transaction to start seeing your money flow.";
    document.querySelector("#chart-summary").textContent = summary;
  }

  function formatCompact(value) {
    if (value >= 1000000) return `${(value / 1000000).toFixed(1).replace(/\.0$/, "")}m`;
    if (value >= 1000) return `${Math.round(value / 1000)}k`;
    return String(Math.round(value));
  }

  function renderBudgets() {
    const list = document.querySelector("#budget-list");
    const expenses = monthTransactions().filter(item => item.type === "expense");
    const categories = BUDGET_CATEGORIES.filter(category => Number(state.budgets[category]) > 0);
    if (categories.length === 0) {
      list.innerHTML = '<div class="budget-empty">Your month is a blank canvas. Set a category budget to give each dollar a direction.</div>';
      document.querySelector("#budget-insight").textContent = "Give your monthly spending a little structure.";
      return;
    }
    list.innerHTML = categories.map(category => {
      const budget = Number(state.budgets[category]);
      const spent = expenses.filter(item => item.category === category).reduce((sum, item) => sum + item.amount, 0);
      const percentage = budget > 0 ? spent / budget * 100 : 0;
      const width = Math.min(percentage, 100);
      return `<div class="budget-item"><div class="budget-item-head"><span class="budget-category"><span class="category-icon">${CATEGORY_ICONS[category]}</span>${category}</span><span class="budget-amount"><strong>${formatMoney(spent)}</strong> / ${formatMoney(budget)}</span></div><div class="progress-track" role="progressbar" aria-label="${category} budget used" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${Math.min(Math.round(percentage), 100)}"><div class="progress-fill ${percentage > 100 ? "over" : ""}" style="width:${width}%"></div></div></div>`;
    }).join("");
    const over = categories.filter(category => {
      const spent = expenses.filter(item => item.category === category).reduce((sum, item) => sum + item.amount, 0);
      return spent > Number(state.budgets[category]);
    });
    document.querySelector("#budget-insight").textContent = over.length
      ? `${over.join(", ")} ${over.length === 1 ? "is" : "are"} over budget. A quick review can help you rebalance.`
      : "You’re on track. Keep giving every rupee a thoughtful place.";
  }

  function render() {
    renderStats();
    renderCategoryFilter();
    renderTransactions();
    renderBudgets();
    renderChart();
  }

  function openForm(transaction = null) {
    form.reset();
    document.querySelector("#form-error").textContent = "";
    document.querySelector("#transaction-id").value = transaction ? transaction.id : "";
    document.querySelector("#dialog-title").textContent = transaction ? "Edit transaction" : "Add transaction";
    document.querySelector("#save-label").textContent = transaction ? "Save changes" : "Save transaction";
    document.querySelector("#description-input").value = transaction ? transaction.description : "";
    document.querySelector("#amount-input").value = transaction ? String(transaction.amount) : "";
    document.querySelector("#date-input").value = transaction ? transaction.date : localDate(today);
    document.querySelector("#notes-input").value = transaction ? transaction.notes : "";
    const type = transaction ? transaction.type : "expense";
    form.querySelector(`input[name="type"][value="${type}"]`).checked = true;
    setCategories(document.querySelector("#category-input"), CATEGORIES[type], transaction && transaction.category);
    document.querySelector("#amount-currency").textContent = state.currency;
    dialog.showModal();
    document.querySelector("#description-input").focus();
  }

  function resetBudgetFields() {
    const content = BUDGET_CATEGORIES.map(category =>
      `<label class="form-field"><span>${category} monthly limit <b>${state.currency}</b></span><input type="number" min="0" max="1000000000000" step="0.01" inputmode="decimal" data-budget-category="${category}" value="${Number(state.budgets[category]) || ""}" placeholder="0 (off)"></label>`
    ).join("");
    return `<div class="form-grid">${content}</div>`;
  }

  function manageBudgets() {
    const footer = document.querySelector("#budget-insight");
    const manage = document.querySelector("#manage-budgets");
    if (budgetEditor) {
      document.querySelectorAll("[data-budget-category]").forEach(input => {
        const category = input.dataset.budgetCategory;
        const value = Number(input.value);
        if (Number.isFinite(value) && value > 0) state.budgets[category] = value;
        else delete state.budgets[category];
      });
      if (saveState()) showToast("Monthly budgets saved on this device.");
      budgetEditor.cancel.remove();
      budgetEditor = null;
      manage.innerHTML = '<span>Manage</span> <span aria-hidden="true">↗</span>';
      renderBudgets();
      return;
    }
    budgetEditor = {
      priorInsight: footer.textContent,
      cancel: document.createElement("button")
    };
    document.querySelector("#budget-list").innerHTML = resetBudgetFields();
    footer.textContent = "Set an amount, or leave it at 0 to turn that budget off.";
    budgetEditor.cancel.className = "text-button";
    budgetEditor.cancel.type = "button";
    budgetEditor.cancel.textContent = "Cancel";
    manage.textContent = "Save";
    manage.after(budgetEditor.cancel);
    budgetEditor.cancel.addEventListener("click", () => {
      const priorInsight = budgetEditor.priorInsight;
      budgetEditor.cancel.remove();
      budgetEditor = null;
      manage.innerHTML = '<span>Manage</span> <span aria-hidden="true">↗</span>';
      renderBudgets();
      footer.textContent = priorInsight;
    }, { once: true });
  }

  function exportCsv() {
    const data = monthTransactions().sort((a, b) => a.date.localeCompare(b.date));
    if (!data.length) {
      showToast("There are no transactions in this month to export.", true);
      return;
    }
    const csvCell = value => `"${String(value).replace(/"/g, '""')}"`;
    const rows = [["Date", "Type", "Description", "Category", "Amount", "Currency", "Notes"]];
    for (const item of data) rows.push([item.date, item.type, item.description, item.category, item.amount, state.currency, item.notes]);
    const csv = "\uFEFF" + rows.map(row => row.map(csvCell).join(",")).join("\r\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = `ledgerly-${selectedMonth()}.csv`;
    document.body.append(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
    showToast("Your monthly transactions were exported.");
  }

  function bindEvents() {
    document.querySelector("#add-transaction").addEventListener("click", () => openForm());
    document.querySelector("#empty-add").addEventListener("click", () => openForm());
    document.querySelector(".close-dialog").addEventListener("click", () => dialog.close());
    document.querySelector(".cancel-dialog").addEventListener("click", () => dialog.close());
    document.querySelector("#month-select").addEventListener("change", render);
    document.querySelector("#currency-select").addEventListener("change", event => {
      state.currency = event.target.value;
      if (saveState()) showToast(`Currency display set to ${state.currency}. No currency conversion is applied.`);
      render();
    });
    for (const selector of ["#search-input", "#type-filter", "#category-filter"]) {
      document.querySelector(selector).addEventListener(selector === "#search-input" ? "input" : "change", renderTransactions);
    }
    document.querySelector("#manage-budgets").addEventListener("click", manageBudgets);
    document.querySelector("#export-csv").addEventListener("click", exportCsv);
    form.querySelectorAll('input[name="type"]').forEach(input => input.addEventListener("change", event => {
      setCategories(document.querySelector("#category-input"), CATEGORIES[event.target.value]);
    }));
    form.addEventListener("submit", event => {
      event.preventDefault();
      const error = document.querySelector("#form-error");
      const amountInput = document.querySelector("#amount-input");
      const amount = Number(amountInput.value);
      if (!Number.isFinite(amount) || amount <= 0 || amount > 1000000000000) {
        error.textContent = "Enter an amount greater than 0 and no more than 1 trillion.";
        amountInput.focus();
        return;
      }
      const date = document.querySelector("#date-input").value;
      if (!date || Number.isNaN(new Date(`${date}T12:00:00`).getTime())) {
        error.textContent = "Choose a valid transaction date.";
        document.querySelector("#date-input").focus();
        return;
      }
      const id = document.querySelector("#transaction-id").value;
      const existing = state.transactions.find(item => item.id === id);
      const transaction = {
        id: existing ? existing.id : (crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(16).slice(2)}`),
        description: document.querySelector("#description-input").value.trim(),
        amount,
        type: form.querySelector('input[name="type"]:checked').value,
        category: document.querySelector("#category-input").value,
        date,
        notes: document.querySelector("#notes-input").value.trim()
      };
      if (!transaction.description) {
        error.textContent = "Add a short description for this transaction.";
        document.querySelector("#description-input").focus();
        return;
      }
      if (existing) state.transactions = state.transactions.map(item => item.id === id ? transaction : item);
      else state.transactions.push(transaction);
      if (!saveState()) return;
      dialog.close();
      renderMonthOptions(transaction.date.slice(0, 7));
      render();
      showToast(existing ? "Transaction updated." : "Transaction saved on this device.");
    });
    document.querySelector("#transaction-rows").addEventListener("click", event => {
      const button = event.target.closest("button[data-id]");
      if (!button) return;
      const transaction = state.transactions.find(item => item.id === button.dataset.id);
      if (!transaction) return;
      if (button.classList.contains("edit-transaction")) {
        openForm(transaction);
      } else if (button.classList.contains("delete-transaction")) {
        const confirmed = window.confirm(`Delete "${transaction.description}"? This cannot be undone.`);
        if (!confirmed) return;
        state.transactions = state.transactions.filter(item => item.id !== transaction.id);
        if (saveState()) {
          render();
          showToast("Transaction deleted.");
        }
      }
    });
    dialog.addEventListener("click", event => {
      if (event.target === dialog) dialog.close();
    });
    window.addEventListener("resize", renderChart);
  }

  loadState();
  renderMonthOptions();
  currencyInput.value = state.currency;
  bindEvents();
  render();
})();
