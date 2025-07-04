 const users = {
    "admin": "admin135",
    "user": "password"
  };

  let currentUser = null;

  function login() {
    const username = document.getElementById("usernameInput").value.trim();
    const password = document.getElementById("passwordInput").value;

    if(users[username] && users[username] === password) {
      currentUser = username;
      localStorage.setItem("loggedInUser", currentUser);
      showApp();
      clearLoginForm();
      document.getElementById("loginError").textContent = "";
    } else {
      document.getElementById("loginError").textContent = "Invalid username or password!";
    }
  }

  function logout() {
    currentUser = null;
    localStorage.removeItem("loggedInUser");
    document.getElementById("app").style.display = "none";
    document.getElementById("loginPage").style.display = "block";
  }

  function showApp() {
    document.getElementById("loginPage").style.display = "none";
    document.getElementById("app").style.display = "block";
    loadExpenses();
  }

  window.onload = () => {
    const loggedIn = localStorage.getItem("loggedInUser");
    if(loggedIn && users[loggedIn]) {
      currentUser = loggedIn;
      showApp();
    }
  };

  // Password toggle
  const togglePassword = document.getElementById('togglePassword');
  const passwordInput = document.getElementById('passwordInput');

  togglePassword.addEventListener('click', () => {
    const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
    passwordInput.setAttribute('type', type);
    togglePassword.textContent = type === 'password' ? '' : '';
  });

  function clearLoginForm() {
    document.getElementById("usernameInput").value = "";
    document.getElementById("passwordInput").value = "";
  }

  // ---- Expense Manager ----
  const expenseForm = document.getElementById("expenseForm");
  const expenseTableBody = document.getElementById("expenseTableBody");
  const totalAmountSpan = document.getElementById("totalAmount");
  const monthlyReportDiv = document.getElementById("monthlyReport");

  let expenses = [];
  let editIndex = -1;

  expenseForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const date = document.getElementById("date").value;
    const item = document.getElementById("item").value.trim();
    const quantity = parseFloat(document.getElementById("quantity").value);
    const unit = document.getElementById("unit").value;
    const amount = parseFloat(document.getElementById("amount").value);

    if(!date || !item || isNaN(quantity) || quantity <= 0 || isNaN(amount) || amount <= 0) {
      alert("Please fill all fields correctly.");
      return;
    }

    if(editIndex === -1) {
      expenses.push({ date, item, quantity, unit, amount });
    } else {
      expenses[editIndex] = { date, item, quantity, unit, amount };
      editIndex = -1;
      expenseForm.querySelector("button[type=submit]").textContent = "Add";
    }

    saveExpenses();
    loadExpenses();
    expenseForm.reset();
  });

  function saveExpenses() {
    localStorage.setItem(`expenses_${currentUser}`, JSON.stringify(expenses));
  }

  function loadExpenses() {
    expenses = JSON.parse(localStorage.getItem(`expenses_${currentUser}`)) || [];
    renderExpenses();
  }

  function renderExpenses(filterText = "") {
    expenseTableBody.innerHTML = "";
    let total = 0;
    let filtered = expenses;

    if(filterText) {
      const lower = filterText.toLowerCase();
      filtered = expenses.filter(e =>
        e.item.toLowerCase().includes(lower) ||
        e.date.includes(lower)
      );
    }

    filtered.forEach((exp, i) => {
      const pricePerUnit = exp.amount / exp.quantity;
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>${i + 1}</td>
        <td>${exp.date}</td>
        <td>${exp.item}</td>
        <td>${exp.quantity.toFixed(2)}</td>
        <td>${exp.unit}</td>
        <td>₹${exp.amount.toFixed(2)}</td>
        <td>₹${pricePerUnit.toFixed(2)}</td>
        <td class="actions">
          <button class="edit" onclick="editExpense(${i})">Edit</button>
          <button class="delete" onclick="deleteExpense(${i})">Delete</button>
        </td>
      `;
      expenseTableBody.appendChild(tr);
      total += exp.amount;
    });

    totalAmountSpan.textContent = total.toFixed(2);
    updateMonthlyReport();
    updateChart();
  }

  function editExpense(index) {
    const exp = expenses[index];
    document.getElementById("date").value = exp.date;
    document.getElementById("item").value = exp.item;
    document.getElementById("quantity").value = exp.quantity;
    document.getElementById("unit").value = exp.unit;
    document.getElementById("amount").value = exp.amount;
    editIndex = index;
    expenseForm.querySelector("button[type=submit]").textContent = "Update";
  }

  function deleteExpense(index) {
    if(confirm("Are you sure you want to delete this expense?")) {
      expenses.splice(index, 1);
      saveExpenses();
      loadExpenses();
    }
  }

  function filterExpenses() {
    const searchText = document.getElementById("searchBar").value.trim();
    renderExpenses(searchText);
  }

  // Monthly report (group by month)
  function updateMonthlyReport() {
    const monthlyTotals = {};
    expenses.forEach(exp => {
      const m = exp.date.slice(0,7); // yyyy-mm
      monthlyTotals[m] = (monthlyTotals[m] || 0) + exp.amount;
    });

    let reportHtml = "<h2>Monthly Expenses</h2>";
    for(const month in monthlyTotals) {
      reportHtml += `<div>${month}: ₹${monthlyTotals[month].toFixed(2)}</div>`;
    }
    monthlyReportDiv.innerHTML = reportHtml;
  }

  // Chart.js for monthly expenses
  let chart = null;
  function updateChart() {
    const monthlyTotals = {};
    expenses.forEach(exp => {
      const m = exp.date.slice(0,7);
      monthlyTotals[m] = (monthlyTotals[m] || 0) + exp.amount;
    });

    const labels = Object.keys(monthlyTotals).sort();
    const data = labels.map(l => monthlyTotals[l]);

    const ctx = document.getElementById('monthlyChart').getContext('2d');

    if(chart) chart.destroy();

    chart = new Chart(ctx, {
      type: 'bar',
      data: {
        labels,
        datasets: [{
          label: 'Monthly Expenses (₹)',
          data,
          backgroundColor: 'rgba(0,123,255,0.7)'
        }]
      },
      options: {
        responsive: true,
        scales: {
          y: { beginAtZero: true }
        }
      }
    });
  }

  // Export PDF with table + totals + monthly report
  function exportPDF() {
    const table = document.createElement('table');
    table.style.width = '100%';
    table.style.borderCollapse = 'collapse';

    const thead = document.createElement('thead');
    thead.innerHTML = `
      <tr style="background:#007bff; color:#fff;">
        <th style="border:1px solid #ddd; padding:8px;">S.No</th>
        <th style="border:1px solid #ddd; padding:8px;">Date</th>
        <th style="border:1px solid #ddd; padding:8px;">Item</th>
        <th style="border:1px solid #ddd; padding:8px;">Qty</th>
        <th style="border:1px solid #ddd; padding:8px;">Unit</th>
        <th style="border:1px solid #ddd; padding:8px;">Amount (₹)</th>
        <th style="border:1px solid #ddd; padding:8px;">Price/Unit (₹)</th>
      </tr>
    `;

    const tbody = document.createElement('tbody');
    expenses.forEach((exp, i) => {
      const pricePerUnit = exp.amount / exp.quantity;
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td style="border:1px solid #ddd; padding:6px; text-align:center;">${i + 1}</td>
        <td style="border:1px solid #ddd; padding:6px; text-align:center;">${exp.date}</td>
        <td style="border:1px solid #ddd; padding:6px; text-align:left;">${exp.item}</td>
        <td style="border:1px solid #ddd; padding:6px; text-align:center;">${exp.quantity.toFixed(2)}</td>
        <td style="border:1px solid #ddd; padding:6px; text-align:center;">${exp.unit}</td>
        <td style="border:1px solid #ddd; padding:6px; text-align:center;">₹${exp.amount.toFixed(2)}</td>
        <td style="border:1px solid #ddd; padding:6px; text-align:center;">₹${pricePerUnit.toFixed(2)}</td>
      `;
      tbody.appendChild(tr);
    });

    // Create totals row
    const totalRow = document.createElement('tr');
    const totalAmount = expenses.reduce((sum, e) => sum + e.amount, 0);
    totalRow.innerHTML = `
      <td colspan="5" style="border:1px solid #ddd; padding:8px; text-align:right; font-weight:bold;">Total</td>
      <td style="border:1px solid #ddd; padding:8px; text-align:center; font-weight:bold;">₹${totalAmount.toFixed(2)}</td>
      <td></td>
    `;
    tbody.appendChild(totalRow);

    thead.style.border = "1px solid #ddd";
    tbody.style.border = "1px solid #ddd";

    table.appendChild(thead);
    table.appendChild(tbody);

    // Monthly report for PDF
    const monthlyTotals = {};
    expenses.forEach(exp => {
      const m = exp.date.slice(0,7);
      monthlyTotals[m] = (monthlyTotals[m] || 0) + exp.amount;
    });

    const monthlyReportDivPdf = document.createElement('div');
    monthlyReportDivPdf.style.marginTop = '20px';
    monthlyReportDivPdf.style.fontWeight = 'bold';
    monthlyReportDivPdf.textContent = "Monthly Expenses:";

    for(const month in monthlyTotals) {
      const monthDiv = document.createElement('div');
      monthDiv.textContent = `${month}: ₹${monthlyTotals[month].toFixed(2)}`;
      monthlyReportDivPdf.appendChild(monthDiv);
    }

    // Container for PDF content
    const container = document.createElement('div');
    container.appendChild(table);
    container.appendChild(monthlyReportDivPdf);

    // Export using html2pdf
    html2pdf().from(container).set({
      margin: 10,
      filename: 'expense-report.pdf',
      html2canvas: { scale: 2 },
      jsPDF: { orientation: 'landscape' }
    }).save();
  }