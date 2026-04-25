let habits = JSON.parse(localStorage.getItem("habits")) || [];
let history = JSON.parse(localStorage.getItem("history")) || [];
let chartInstances = { donut: null, line: null };

// ===== DATE =====
function showDate() {
  let el = document.getElementById("dateText");
  if (!el) return;

  let now = new Date();
  let options = { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' };
  el.innerText = now.toLocaleDateString("en-US", options);
}

// ===== WEEK SYSTEM =====
function getCurrentWeek() {
  let now = new Date();
  let firstJan = new Date(now.getFullYear(), 0, 1);
  let days = Math.floor((now - firstJan) / (24 * 60 * 60 * 1000));
  return Math.ceil((days + firstJan.getDay() + 1) / 7);
}

function updateWeekBadge() {
  let weekBadge = document.getElementById("weekBadge");
  if (weekBadge) {
    weekBadge.innerText = `Week ${getCurrentWeek()}`;
  }
}

function checkNewWeek() {
  let currentWeek = getCurrentWeek();
  let savedWeek = localStorage.getItem("week");

  if (savedWeek && savedWeek != currentWeek) {
    // save previous week
    history.push({
      week: savedWeek,
      habits: JSON.parse(JSON.stringify(habits)) // deep copy
    });

    localStorage.setItem("history", JSON.stringify(history));

    // reset habits
    habits.forEach(h => {
      h.days = [0, 0, 0, 0, 0, 0, 0];
      h.streak = 0;
      h.totalDone = 0;
    });

    saveData();
  }

  localStorage.setItem("week", currentWeek);
  updateWeekBadge();
}

// ===== STORAGE =====
function saveData() {
  localStorage.setItem("habits", JSON.stringify(habits));
}

// ===== ADD =====
function addHabit() {
  let input = document.getElementById("habitInput");
  if (!input.value.trim()) {
    alert("Please enter a habit name!");
    return;
  }

  if (habits.length >= 20) {
    alert("Maximum 20 habits allowed!");
    return;
  }

  habits.push({
    name: input.value.trim(),
    days: [0, 0, 0, 0, 0, 0, 0],
    streak: 0,
    bestStreak: 0,
    totalDone: 0
  });

  input.value = "";
  saveData();
  render();
}

// ===== DELETE =====
function deleteHabit(i) {
  if (confirm(`Delete "${habits[i].name}"?`)) {
    habits.splice(i, 1);
    saveData();
    render();
  }
}

// ===== TOGGLE =====
function toggleDay(h, d) {
  let habit = habits[h];
  habit.days[d] ^= 1;

  let streak = 0;
  for (let i = 6; i >= 0; i--) {
    if (habit.days[i]) streak++;
    else break;
  }

  habit.streak = streak;
  habit.bestStreak = Math.max(habit.bestStreak, streak);
  habit.totalDone = habit.days.filter(x => x).length;

  saveData();
  render();
}

// ===== RENDER =====
function render() {
  let tbody = document.querySelector("#habitTable tbody");
  if (!tbody) return;
  
  tbody.innerHTML = "";

  if (habits.length === 0) {
    tbody.innerHTML = `<tr><td colspan="11" style="padding: 30px; opacity: 0.5;">No habits yet. Add one to get started! 🚀</td></tr>`;
    updateAll();
    return;
  }

  habits.forEach((h, i) => {
    let row = `<tr><td style="text-align: left; font-weight: 500;">${h.name}</td>`;

    h.days.forEach((d, j) => {
      row += `<td>
        <input type="checkbox" ${d ? "checked" : ""}
        onchange="toggleDay(${i},${j})">
      </td>`;
    });

    row += `<td><span class="streak-badge">${h.streak}</span></td>`;
    row += `<td><span class="trophy-badge">🏆 ${h.bestStreak}</span></td>`;
    row += `<td><button onclick="deleteHabit(${i})" style="background: linear-gradient(135deg, #f093fb, #f5576c); padding: 5px 10px; font-size: 12px;">❌</button></td>`;
    row += "</tr>";

    tbody.innerHTML += row;
  });

  updateAll();
}

// ===== UPDATE =====
function updateAll() {
  let daily = [0, 0, 0, 0, 0, 0, 0];
  let total = 0, done = 0;

  habits.forEach(h => {
    h.days.forEach((d, i) => {
      daily[i] += d;
      total++;
      done += d;
    });
  });

  let percent = total ? Math.round((done / total) * 100) : 0;

  let percentEl = document.getElementById("percentText");
  if (percentEl) {
    percentEl.innerText = percent + "%";
  }

  let xpEl = document.getElementById("xpText");
  if (xpEl) {
    let xp = done * 10;
    let level = Math.floor(xp / 100);
    xpEl.innerText = `XP: ${xp} | Level: ${level}`;
    
    let xpFill = document.getElementById("xpFill");
    if (xpFill) {
      let xpInLevel = (xp % 100);
      xpFill.style.width = xpInLevel + "%";
    }
  }

  // Update achievements
  let list = document.getElementById("achievements");
  if (list) {
    list.innerHTML = "";
    habits.forEach(h => {
      if (h.streak >= 7) {
        list.innerHTML += `<li>🔥 <strong>${h.name}</strong> - ${h.streak} day streak!</li>`;
      }
    });
    if (habits.filter(h => h.streak >= 7).length === 0) {
      list.innerHTML = `<li style="opacity: 0.5;">Start building streaks! 💪</li>`;
    }
  }

  // Update analytics
  updateAnalytics();

  // Confetti on 100%
  if (percent === 100 && done > 0) {
    showConfetti();
  }

  // Update charts
  updateCharts(daily, percent);
}

// ===== UPDATE CHARTS =====
function updateCharts(daily, percent) {
  let donutEl = document.getElementById("donutChart");
  let lineEl = document.getElementById("lineChart");

  if (donutEl && donutEl.getContext) {
    if (chartInstances.donut) {
      chartInstances.donut.destroy();
    }
    chartInstances.donut = new Chart(donutEl, {
      type: 'doughnut',
      data: {
        labels: ["Completed", "Remaining"],
        datasets: [{
          data: [percent, 100 - percent],
          backgroundColor: ['#667eea', 'rgba(102, 126, 234, 0.2)'],
          borderColor: ['#667eea', 'rgba(102, 126, 234, 0.3)'],
          borderWidth: 2
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: true,
        plugins: {
          legend: {
            labels: {
              color: document.body.classList.contains('dark') ? '#e0e0e0' : '#000'
            }
          }
        }
      }
    });
  }

  if (lineEl && lineEl.getContext) {
    if (chartInstances.line) {
      chartInstances.line.destroy();
    }
    chartInstances.line = new Chart(lineEl, {
      type: 'line',
      data: {
        labels: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
        datasets: [{
          label: 'Habits Completed',
          data: daily,
          borderColor: '#667eea',
          backgroundColor: 'rgba(102, 126, 234, 0.1)',
          borderWidth: 3,
          fill: true,
          tension: 0.4,
          pointBackgroundColor: '#667eea',
          pointBorderColor: '#fff',
          pointBorderWidth: 2,
          pointRadius: 5
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: true,
        plugins: {
          legend: {
            labels: {
              color: document.body.classList.contains('dark') ? '#e0e0e0' : '#000'
            }
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            ticks: {
              color: document.body.classList.contains('dark') ? '#e0e0e0' : '#000'
            },
            grid: {
              color: 'rgba(102, 126, 234, 0.1)'
            }
          },
          x: {
            ticks: {
              color: document.body.classList.contains('dark') ? '#e0e0e0' : '#000'
            },
            grid: {
              color: 'rgba(102, 126, 234, 0.1)'
            }
          }
        }
      }
    });
  }
}

// ===== CONFETTI =====
function showConfetti() {
  const colors = ['#ffd700', '#ff69b4', '#00bfff', '#32cd32', '#ff4500'];
  for (let i = 0; i < 50; i++) {
    let c = document.createElement("div");
    c.className = "confetti";
    c.style.left = Math.random() * 100 + "vw";
    c.style.background = colors[Math.floor(Math.random() * colors.length)];
    c.style.delay = (Math.random() * 0.3) + "s";
    document.body.appendChild(c);
    setTimeout(() => c.remove(), 3300);
  }
}

// ===== THEME =====
function toggleTheme() {
  document.body.classList.toggle("dark");
  localStorage.setItem("theme", document.body.classList.contains("dark") ? "dark" : "light");
  
  // Redraw charts to update colors
  let daily = [0, 0, 0, 0, 0, 0, 0];
  let done = 0, total = 0;
  habits.forEach(h => {
    h.days.forEach((d, i) => {
      daily[i] += d;
      total++;
      done += d;
    });
  });
  let percent = total ? Math.round((done / total) * 100) : 0;
  updateCharts(daily, percent);
}

// ===== PAGES =====
function showPage(pageName) {
  // Hide all pages
  document.querySelectorAll('.page').forEach(page => {
    page.classList.remove('active');
  });

  // Show selected page
  document.getElementById(pageName).classList.add('active');

  // Update sidebar active
  document.querySelectorAll('.sidebar li').forEach(li => {
    li.classList.remove('active');
  });
  event.target.classList.add('active');

  if (pageName === 'analytics') {
    updateAnalytics();
  }
}

// ===== ANALYTICS =====
function updateAnalytics() {
  let totalHabits = habits.length;
  let todayIndex = new Date().getDay() === 0 ? 6 : new Date().getDay() - 1;
  let completedToday = habits.filter(h => h.days[todayIndex]).length;
  let bestStreak = Math.max(...habits.map(h => h.bestStreak), 0);
  let weeksTracked = history.length + 1;

  document.getElementById('totalHabits').innerText = totalHabits;
  document.getElementById('completedToday').innerText = completedToday;
  document.getElementById('bestStreak').innerText = bestStreak;
  document.getElementById('weeksTracked').innerText = weeksTracked;

  // History
  let historyList = document.getElementById('historyList');
  historyList.innerHTML = '';

  if (history.length === 0) {
    historyList.innerHTML = '<p style="opacity: 0.5; text-align: center;">No history yet. Complete a week!</p>';
    return;
  }

  history.slice().reverse().forEach((weekData, idx) => {
    let totalCompleted = weekData.habits.reduce((sum, h) => sum + h.totalDone, 0);
    let totalPossible = weekData.habits.length * 7;
    let percentage = totalPossible ? Math.round((totalCompleted / totalPossible) * 100) : 0;

    historyList.innerHTML += `
      <div class="history-item">
        <div style="display: flex; justify-content: space-between; align-items: center;">
          <strong>Week ${weekData.week}</strong>
          <span style="background: rgba(102, 126, 234, 0.3); padding: 5px 10px; border-radius: 8px; font-size: 12px;">${percentage}%</span>
        </div>
        <p style="font-size: 12px; opacity: 0.7; margin-top: 5px;">${weekData.habits.length} habits tracked</p>
      </div>
    `;
  });
}

// ===== CLEAR DATA =====
function confirmClearData() {
  if (confirm("⚠️ Are you sure? This will delete ALL data. This cannot be undone!")) {
    if (confirm("Really sure? Type 'YES' to confirm.")) {
      habits = [];
      history = [];
      localStorage.clear();
      alert("✅ All data cleared!");
      location.reload();
    }
  }
}

// ===== INIT =====
window.addEventListener('DOMContentLoaded', function() {
  // Load theme
  if (localStorage.getItem("theme") === "dark") {
    document.body.classList.add("dark");
  }

  checkNewWeek();
  showDate();
  render();

  // Allow Enter key to add habit
  let habitInput = document.getElementById("habitInput");
  if (habitInput) {
    habitInput.addEventListener('keypress', function(e) {
      if (e.key === 'Enter') {
        addHabit();
      }
    });
  }
});

// Update date and week every minute
setInterval(() => {
  showDate();
  updateWeekBadge();
}, 60000);