let habits = JSON.parse(localStorage.getItem("habits")) || [];
let history = JSON.parse(localStorage.getItem("history")) || [];

// ===== DATE (no UI impact if element not present) =====
function showDate() {
  let el = document.getElementById("dateText");
  if (!el) return;

  let now = new Date();
  let options = { weekday: 'long', day: 'numeric', month: 'long' };
  el.innerText = now.toLocaleDateString("en-IN", options);
}

// ===== WEEK SYSTEM =====
function getCurrentWeek() {
  let now = new Date();
  let firstJan = new Date(now.getFullYear(), 0, 1);
  let days = Math.floor((now - firstJan) / (24 * 60 * 60 * 1000));
  return Math.ceil((days + firstJan.getDay() + 1) / 7);
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
      h.days = [0,0,0,0,0,0,0];
      h.streak = 0;
      h.totalDone = 0;
    });

    saveData();
  }

  localStorage.setItem("week", currentWeek);
}

// ===== STORAGE =====
function saveData() {
  localStorage.setItem("habits", JSON.stringify(habits));
}

// ===== ADD =====
function addHabit() {
  let input = document.getElementById("habitInput");
  if (!input.value.trim()) return;

  habits.push({
    name: input.value,
    days: [0,0,0,0,0,0,0],
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
  habits.splice(i, 1);
  saveData();
  render();
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
  tbody.innerHTML = "";

  habits.forEach((h, i) => {
    let row = `<tr><td>${h.name}</td>`;

    h.days.forEach((d, j) => {
      row += `<td>
        <input type="checkbox" ${d ? "checked":""}
        onchange="toggleDay(${i},${j})">
      </td>`;
    });

    row += `<td>${h.streak}</td>`;
    row += `<td>${h.bestStreak}</td>`;
    row += `<td><button onclick="deleteHabit(${i})">X</button></td>`;
    row += "</tr>";

    tbody.innerHTML += row;
  });

  updateAll();
}

// ===== UPDATE =====
function updateAll() {
  let daily = [0,0,0,0,0,0,0];
  let total = 0, done = 0;

  habits.forEach(h => {
    h.days.forEach((d,i)=>{
      daily[i]+=d;
      total++;
      done+=d;
    });
  });

  let percent = total ? Math.round((done/total)*100) : 0;

  document.getElementById("percentText").innerText = percent + "%";
  
  let xp = done * 10;
  document.getElementById("xpText").innerText =
    `XP: ${xp} | Level: ${Math.floor(xp/100)}`;

  let list = document.getElementById("achievements");
  list.innerHTML = "";
  habits.forEach(h=>{
    if(h.streak>=7) list.innerHTML += `<li>🔥 ${h.name} streak</li>`;
  });

  if (percent === 100) showConfetti();

  new Chart(document.getElementById("donutChart"), {
    type:'doughnut',
    data:{labels:["Done","Left"],datasets:[{data:[percent,100-percent]}]}
  });

  new Chart(document.getElementById("lineChart"), {
    type:'line',
    data:{labels:["M","T","W","T","F","S","S"],datasets:[{data:daily}]}
  });
}

// ===== CONFETTI =====
function showConfetti() {
  for (let i = 0; i < 40; i++) {
    let c = document.createElement("div");
    c.className = "confetti";
    c.style.left = Math.random()*100+"vw";
    document.body.appendChild(c);
    setTimeout(()=>c.remove(),3000);
  }
}

// ===== THEME =====
function toggleTheme() {
  document.body.classList.toggle("dark");
}

// ===== INIT =====
checkNewWeek();
showDate();
render();