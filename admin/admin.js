/* ==========================================================
   SPIDER ADMIN DASHBOARD - CLIENT SCRIPT
   Matching Section 10 of Architecture Spec
   ========================================================== */

const appRoot = document.querySelector("#admin-app");
let adminPass = sessionStorage.getItem("spider_admin_pass") || "spider123";
let currentView = "dashboard";

async function adminApi(path, options = {}) {
  const headers = {
    "Content-Type": "application/json",
    "x-admin-password": adminPass
  };
  const res = await fetch(path, { ...options, headers });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Admin API request failed");
  return data;
}

function renderLogin() {
  appRoot.innerHTML = `
    <div class="login-wrap">
      <div class="login-card">
        <div class="login-brand">
          <img src="/assets/spider_logo.jpg" alt="Spider Admin" />
          <h2>SPIDER ADMIN</h2>
        </div>
        <p style="color:var(--text-muted); font-size:13px; margin-bottom:20px;">
          Enter master administrator key to manage Web Network
        </p>
        <input id="adminPassInput" class="admin-input" type="password" placeholder="Admin Password (default: spider123)" value="spider123" />
        <button class="btn-admin-primary" id="loginBtn">Authenticate</button>
      </div>
    </div>
  `;

  document.querySelector("#loginBtn").onclick = async () => {
    adminPass = document.querySelector("#adminPassInput").value;
    try {
      await adminApi("/api/admin/stats");
      sessionStorage.setItem("spider_admin_pass", adminPass);
      renderLayout();
    } catch (e) {
      alert("Authentication error: " + e.message);
    }
  };
}

function renderLayout() {
  appRoot.innerHTML = `
    <div class="admin-layout">
      <!-- Sidebar -->
      <aside class="admin-sidebar">
        <div class="sidebar-logo">
          <img src="/assets/spider_logo.jpg" alt="Logo" />
          <span class="sidebar-logo-text">SPIDER ADMIN</span>
        </div>
        <nav class="sidebar-nav">
          <button class="sidebar-item ${currentView === 'dashboard' ? 'active' : ''}" data-nav="dashboard">
            <i class="fa-solid fa-chart-pie"></i> <span>Dashboard</span>
          </button>
          <button class="sidebar-item ${currentView === 'users' ? 'active' : ''}" data-nav="users">
            <i class="fa-solid fa-users"></i> <span>Users</span>
          </button>
          <button class="sidebar-item ${currentView === 'tasks' ? 'active' : ''}" data-nav="tasks">
            <i class="fa-solid fa-list-check"></i> <span>Tasks</span>
          </button>
          <button class="sidebar-item ${currentView === 'rewards' ? 'active' : ''}" data-nav="rewards">
            <i class="fa-solid fa-gift"></i> <span>Rewards</span>
          </button>
          <button class="sidebar-item ${currentView === 'games' ? 'active' : ''}" data-nav="games">
            <i class="fa-solid fa-gamepad"></i> <span>Games</span>
          </button>
          <button class="sidebar-item" data-nav="referrals">
            <i class="fa-solid fa-user-plus"></i> <span>Referrals</span>
          </button>
          <button class="sidebar-item" data-nav="leaderboard">
            <i class="fa-solid fa-trophy"></i> <span>Leaderboard</span>
          </button>
          <button class="sidebar-item" data-nav="nfts">
            <i class="fa-solid fa-gem"></i> <span>NFT Collections</span>
          </button>
          <button class="sidebar-item" data-nav="settings">
            <i class="fa-solid fa-gear"></i> <span>Settings</span>
          </button>
        </nav>
        <div class="sidebar-footer">
          <button class="sidebar-item" id="adminLogoutBtn">
            <i class="fa-solid fa-right-from-bracket"></i> <span>Logout</span>
          </button>
        </div>
      </aside>

      <!-- Main Content Area -->
      <main class="admin-main" id="adminViewContainer">
        <!-- Rendered by view functions -->
      </main>
    </div>
  `;

  // Bind nav clicks
  document.querySelectorAll("[data-nav]").forEach(btn => {
    btn.onclick = () => {
      currentView = btn.dataset.nav;
      renderLayout();
      if (currentView === "dashboard") loadDashboardView();
      if (currentView === "users") loadUsersView();
      if (currentView === "tasks") loadTasksView();
      if (currentView === "rewards") loadRewardsView();
      if (currentView === "games") loadGamesView();
      if (currentView === "referrals") loadReferralsView();
      if (currentView === "leaderboard") loadLeaderboardView();
      if (currentView === "nfts") loadNFTsView();
      if (currentView === "settings") loadSettingsView();
    };
  });

  document.querySelector("#adminLogoutBtn").onclick = () => {
    sessionStorage.clear();
    adminPass = "";
    renderLogin();
  };

  // Load active view
  if (currentView === "dashboard") loadDashboardView();
  else if (currentView === "tasks") loadTasksView();
  else if (currentView === "users") loadUsersView();
  else loadDashboardView();
}

// 1. DASHBOARD VIEW (Matching screenshot with SVG charts & stats)
async function loadDashboardView() {
  const container = document.querySelector("#adminViewContainer");
  container.innerHTML = `<div style="text-align:center; padding:50px; color:var(--text-muted);"><i class="fa-solid fa-spinner fa-spin fa-2x"></i></div>`;

  try {
    const stats = await adminApi("/api/admin/stats");
    const users = await adminApi("/api/admin/users");

    container.innerHTML = `
      <div class="admin-top-bar">
        <div class="top-bar-title">
          <h1>Network Overview</h1>
          <p>Real-time analytics and user activities across Spider Web Network</p>
        </div>
        <div class="top-bar-actions">
          <a href="/" target="_blank" class="btn-pill-action">
            <i class="fa-solid fa-mobile-screen"></i> Launch Mini App
          </a>
          <button class="btn-pill-action" onclick="loadDashboardView()">
            <i class="fa-solid fa-rotate"></i> Refresh
          </button>
        </div>
      </div>

      <!-- 4 Top KPI Cards -->
      <div class="admin-kpi-grid">
        <div class="kpi-card">
          <span class="kpi-label">Total Users</span>
          <strong class="kpi-value">${Number(stats.total_users).toLocaleString()}</strong>
        </div>
        <div class="kpi-card">
          <span class="kpi-label">Active Users</span>
          <strong class="kpi-value" style="color:var(--accent-green);">${Number(stats.active_users).toLocaleString()}</strong>
        </div>
        <div class="kpi-card">
          <span class="kpi-label">Total Rewards</span>
          <strong class="kpi-value" style="color:var(--primary-purple);">${Number(stats.total_rewards_xp).toLocaleString()} XP</strong>
        </div>
        <div class="kpi-card">
          <span class="kpi-label">Total Volume</span>
          <strong class="kpi-value" style="color:var(--accent-gold);">$${Number(stats.total_volume_usdt).toLocaleString()} USDT</strong>
        </div>
      </div>

      <!-- Charts Row -->
      <div class="analytics-charts-row">
        <!-- Area Chart: Users Overview -->
        <div class="chart-card">
          <div class="chart-card-head">
            <h3>Users Overview</h3>
            <span class="chart-badge">+24.8% vs last month</span>
          </div>
          <div class="chart-container-svg">
            <svg viewBox="0 0 500 160" preserveAspectRatio="none">
              <defs>
                <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stop-color="#9d4edd" stop-opacity="0.45"/>
                  <stop offset="100%" stop-color="#9d4edd" stop-opacity="0.0"/>
                </linearGradient>
              </defs>
              <path d="M 0 130 C 50 110, 80 140, 120 100 C 160 60, 200 90, 240 70 C 280 50, 320 80, 360 40 C 400 60, 440 30, 500 20 L 500 160 L 0 160 Z" fill="url(#areaGradient)"/>
              <path d="M 0 130 C 50 110, 80 140, 120 100 C 160 60, 200 90, 240 70 C 280 50, 320 80, 360 40 C 400 60, 440 30, 500 20" fill="none" stroke="#ba53fc" stroke-width="3"/>
            </svg>
          </div>
        </div>

        <!-- Donut Chart: Top Countries -->
        <div class="chart-card">
          <div class="chart-card-head">
            <h3>Top Countries</h3>
          </div>
          <div class="donut-wrap">
            <svg class="donut-svg-center" viewBox="0 0 42 42">
              <circle cx="21" cy="21" r="15.915" fill="transparent" stroke="#1d152e" stroke-width="5.5"></circle>
              <!-- India 45% (cyan/blue) -->
              <circle cx="21" cy="21" r="15.915" fill="transparent" stroke="#3b82f6" stroke-width="5.5" stroke-dasharray="45 55" stroke-dashoffset="25"></circle>
              <!-- Indonesia 20% (teal) -->
              <circle cx="21" cy="21" r="15.915" fill="transparent" stroke="#00f5d4" stroke-width="5.5" stroke-dasharray="20 80" stroke-dashoffset="80"></circle>
              <!-- Pakistan 15% (green) -->
              <circle cx="21" cy="21" r="15.915" fill="transparent" stroke="#10b981" stroke-width="5.5" stroke-dasharray="15 85" stroke-dashoffset="60"></circle>
              <!-- Others 20% (purple) -->
              <circle cx="21" cy="21" r="15.915" fill="transparent" stroke="#9d4edd" stroke-width="5.5" stroke-dasharray="20 80" stroke-dashoffset="45"></circle>
            </svg>
            <div class="donut-legend">
              <div class="legend-item">
                <span><span class="legend-color" style="background:#3b82f6;"></span> India</span>
                <strong>45%</strong>
              </div>
              <div class="legend-item">
                <span><span class="legend-color" style="background:#00f5d4;"></span> Indonesia</span>
                <strong>20%</strong>
              </div>
              <div class="legend-item">
                <span><span class="legend-color" style="background:#10b981;"></span> Pakistan</span>
                <strong>15%</strong>
              </div>
              <div class="legend-item">
                <span><span class="legend-color" style="background:#9d4edd;"></span> Others</span>
                <strong>20%</strong>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Recent Users Table -->
      <div class="table-card">
        <div class="chart-card-head">
          <h3>Recent Users</h3>
          <span style="font-size:12px; color:var(--text-muted);">${users.length} registered accounts in DB</span>
        </div>
        <div class="table-responsive">
          <table class="admin-data-table">
            <thead>
              <tr>
                <th>User</th>
                <th>Wallet</th>
                <th>Brought By</th>
                <th>Web Level</th>
                <th>XP</th>
                <th>Joined At</th>
              </tr>
            </thead>
            <tbody>
              ${renderUserTableRows(users)}
            </tbody>
          </table>
        </div>
      </div>
    `;
  } catch (e) {
    container.innerHTML = `<p style="color:var(--accent-danger);">Error loading dashboard: ${e.message}</p>`;
  }
}

function renderUserTableRows(dbUsers) {
  if (!dbUsers.length) {
    return `<tr><td colspan="6" style="text-align:center; padding:20px; color:var(--text-muted);">No users in database yet.</td></tr>`;
  }

  const dbRows = dbUsers.map(u => {
    const hasWallet = Boolean(u.wallet_address);
    const walletDisplay = hasWallet 
      ? `<code style="color:var(--accent-cyan);">${escapeHTML(u.wallet_address)}</code>`
      : `<span style="color:var(--text-dim); font-size:11px;">Not connected</span>`;

    const avatarUrl = u.avatar_url || (u.tg_id ? `/avatars/${u.tg_id}.jpg` : '/assets/spider_avatar.jpg');
    return `
      <tr>
        <td class="user-name-cell" style="display:flex; align-items:center; gap:8px;">
          <img src="${avatarUrl}" style="width:28px; height:28px; border-radius:50%; object-fit:cover; border:1px solid var(--border-glass);" onerror="this.src='/assets/spider_avatar.jpg'" />
          <div>
            <b>@${escapeHTML(u.username || u.first_name || u.tg_id)}</b>
            ${u.first_name && u.username ? `<span style="font-size:11px; color:var(--text-muted); display:block;">${escapeHTML(u.first_name)}</span>` : ''}
          </div>
        </td>
        <td>${walletDisplay}</td>
        <td>${u.referred_by ? `@${escapeHTML(u.referred_by)}` : '<span style="color:var(--text-dim);">-</span>'}</td>
        <td><span class="badge-level">Lv ${u.level || 1}</span></td>
        <td><b class="text-gold">${Number(u.points || 0).toLocaleString()} XP</b></td>
        <td>${u.created_at ? u.created_at.slice(0, 10) : 'Today'}</td>
      </tr>
    `;
  }).join("");

  return dbRows;
}

// 2. TASKS MANAGEMENT VIEW
async function loadTasksView() {
  const container = document.querySelector("#adminViewContainer");
  container.innerHTML = `<div style="text-align:center; padding:50px;"><i class="fa-solid fa-spinner fa-spin fa-2x"></i></div>`;

  try {
    const tasks = await adminApi("/api/admin/tasks");

    container.innerHTML = `
      <div class="admin-top-bar">
        <div class="top-bar-title">
          <h1>Task & Mission Manager</h1>
          <p>Create, update, or remove interactive quests across Telegram Mini App</p>
        </div>
      </div>

      <!-- Add New Task Form -->
      <div class="chart-card" style="margin-bottom:24px;">
        <h3 style="margin-bottom:14px;">Add New Network Task</h3>
        <div class="task-form-grid">
          <input id="taskTitle" class="admin-input" placeholder="Task Title (e.g. Join Community Chat)" />
          <input id="taskReward" class="admin-input" type="number" placeholder="XP Reward (e.g. 50)" value="50" />
          <input id="taskStars" class="admin-input" type="number" placeholder="Stars Reward (e.g. 10)" value="0" />
          <select id="taskCategory" class="admin-input">
            <option value="daily">Daily Mission</option>
            <option value="weekly">Weekly Quest</option>
            <option value="special">Special Airdrop Task</option>
          </select>
          <select id="taskType" class="admin-input">
            <option value="telegram">Telegram Channel / Bot</option>
            <option value="twitter">X / Twitter</option>
            <option value="game">Gaming Activity</option>
            <option value="referral">Invite Friends</option>
            <option value="wallet">TON Wallet</option>
          </select>
          <input id="taskTarget" class="admin-input" placeholder="Target / URL (e.g. @SpiderWebNet)" />
          <input id="taskDesc" class="admin-input full-span" placeholder="Short description for users" />
        </div>
        <button class="btn-admin-primary" id="saveTaskBtn" style="width:200px;">Create Task</button>
      </div>

      <!-- Tasks List Table -->
      <div class="table-card">
        <div class="chart-card-head">
          <h3>Active Missions (${tasks.length})</h3>
        </div>
        <div class="table-responsive">
          <table class="admin-data-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Title</th>
                <th>Category</th>
                <th>Type</th>
                <th>XP Reward</th>
                <th>Stars</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              ${tasks.map(t => `
                <tr>
                  <td>#${t.id}</td>
                  <td><b>${escapeHTML(t.title)}</b></td>
                  <td><span class="badge-level">${t.category}</span></td>
                  <td>${t.type}</td>
                  <td style="color:var(--accent-cyan); font-weight:700;">+${t.xp_reward} XP</td>
                  <td class="text-gold">+${t.stars_reward} ⭐</td>
                  <td>${t.active ? '<span style="color:var(--accent-green)">Active</span>' : '<span style="color:var(--text-muted)">Paused</span>'}</td>
                  <td>
                    <button class="btn-toggle-sm" onclick="toggleTask(${t.id})">${t.active ? 'Pause' : 'Activate'}</button>
                    <button class="btn-danger-sm" onclick="deleteTask(${t.id})">Delete</button>
                  </td>
                </tr>
              `).join("")}
            </tbody>
          </table>
        </div>
      </div>
    `;

    document.querySelector("#saveTaskBtn").onclick = async () => {
      const title = document.querySelector("#taskTitle").value;
      const xp = document.querySelector("#taskReward").value;
      const stars = document.querySelector("#taskStars").value;
      const category = document.querySelector("#taskCategory").value;
      const type = document.querySelector("#taskType").value;
      const target = document.querySelector("#taskTarget").value;
      const description = document.querySelector("#taskDesc").value;

      if (!title) return alert("Task title is required");

      try {
        await adminApi("/api/admin/tasks", {
          method: "POST",
          body: JSON.stringify({
            title, xp_reward: xp, stars_reward: stars,
            category, type, target, description
          })
        });
        loadTasksView();
      } catch (e) {
        alert(e.message);
      }
    };
  } catch (e) {
    container.innerHTML = `<p style="color:var(--accent-danger);">Error: ${e.message}</p>`;
  }
}

window.deleteTask = async function(id) {
  if (confirm("Are you sure you want to delete this task?")) {
    await adminApi(`/api/admin/tasks/${id}`, { method: "DELETE" });
    loadTasksView();
  }
};

window.toggleTask = async function(id) {
  await adminApi(`/api/admin/tasks/${id}/toggle`, { method: "POST" });
  loadTasksView();
};

// 3. USERS MANAGEMENT VIEW
async function loadUsersView() {
  const container = document.querySelector("#adminViewContainer");
  const users = await adminApi("/api/admin/users");

  container.innerHTML = `
    <div class="admin-top-bar">
      <div class="top-bar-title">
        <h1>User Management</h1>
        <p>Database player records, XP balances and connected TON wallets</p>
      </div>
    </div>
    <div class="table-card">
      <div class="table-responsive">
        <table class="admin-data-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Username</th>
              <th>First Name</th>
              <th>Telegram ID</th>
              <th>XP Points</th>
              <th>Stars</th>
              <th>Web Level</th>
              <th>Wallet</th>
            </tr>
          </thead>
          <tbody>
            ${users.map(u => `
              <tr>
                <td>#${u.id}</td>
                <td class="user-name-cell">@${escapeHTML(u.username || 'user')}</td>
                <td>${escapeHTML(u.first_name || '')}</td>
                <td><code>${u.tg_id}</code></td>
                <td style="color:var(--accent-cyan); font-weight:700;">${Number(u.points).toLocaleString()} XP</td>
                <td class="text-gold">${u.stars} ⭐</td>
                <td><span class="badge-level">Lv ${u.level}</span></td>
                <td><code>${u.wallet_address || 'Not connected'}</code></td>
              </tr>
            `).join("")}
          </tbody>
        </table>
      </div>
    </div>
  `;
}

// 4. PLACEHOLDER VIEWS FOR OTHER ADMIN FEATURES
function loadRewardsView() {
  document.querySelector("#adminViewContainer").innerHTML = `
    <div class="admin-top-bar"><h1>Reward Management</h1></div>
    <div class="chart-card"><p>Configured daily streak bonuses: Day 1 (+55 XP) up to Day 14 (+120 XP + 50 Stars + Rare NFT ticket). Daily limit: 1 claim per 24 hours.</p></div>
  `;
}

function loadGamesView() {
  document.querySelector("#adminViewContainer").innerHTML = `
    <div class="admin-top-bar"><h1>Game Settings: Spider Tic-Tac-Toe</h1></div>
    <div class="chart-card">
      <p><b>Match Limit:</b> 5 matches per day per player.</p>
      <p style="margin-top:8px;"><b>Win Reward:</b> +50 XP, +10 Stars</p>
      <p style="margin-top:8px;"><b>Draw Reward:</b> +10 XP</p>
      <p style="margin-top:8px;"><b>Loss Reward:</b> +5 XP</p>
    </div>
  `;
}

function loadReferralsView() {
  document.querySelector("#adminViewContainer").innerHTML = `
    <div class="admin-top-bar"><h1>Referral System</h1></div>
    <div class="chart-card"><p>Referral commission rate: 10 Stars per invited friend. 2-tier referral tracking enabled via Telegram start parameters.</p></div>
  `;
}

async function loadLeaderboardView() {
  const container = document.querySelector("#adminViewContainer");
  container.innerHTML = `<div style="text-align:center; padding:50px;"><i class="fa-solid fa-spinner fa-spin fa-2x"></i></div>`;
  try {
    const data = await adminApi("/api/leaderboard?type=global");
    const list = data.list || [];
    const tabs = ["global", "referrals"];
    const renderRow = (u, i) => {
      const crown = i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : `#${i+1}`;
      const avatarUrl = u.avatar_url || (u.tg_id ? `/avatars/${u.tg_id}.jpg` : "/assets/spider_avatar.jpg");
      return `
        <tr>
          <td style="text-align:center; font-weight:800; font-size:16px;">${crown}</td>
          <td style="display:flex; align-items:center; gap:8px;">
            <img src="${avatarUrl}" style="width:30px; height:30px; border-radius:50%; object-fit:cover; border:1px solid var(--border-glass);" onerror="this.src='/assets/spider_avatar.jpg'" />
            <div>
              <b>@${escapeHTML(u.username || u.first_name || "Player")}</b>
              ${u.first_name && u.username ? `<span style="font-size:11px; color:var(--text-muted); display:block;">${escapeHTML(u.first_name)}</span>` : ""}
            </div>
          </td>
          <td><b class="text-gold">${Number(u.points || 0).toLocaleString()} XP</b></td>
          <td><i class="fa-solid fa-star" style="color:var(--accent-gold);"></i> ${Number(u.stars || 0).toLocaleString()}</td>
          <td><span style="font-size:12px; color:var(--accent-cyan);">${u.referral_count || 0} Frens</span></td>
          <td>Lv ${u.level || 1}</td>
        </tr>
      `;
    };

    container.innerHTML = `
      <div class="admin-top-bar"><h1>Leaderboard Rankings</h1></div>
      <div class="chart-card" style="margin-bottom:16px;">
        <p>Top Global Ranks calculated by Points (XP) descending — synchronized with Telegram Bot and Mini App leaderboards.</p>
      </div>
      <div class="table-card">
        <div class="chart-card-head"><h3>Top 50 Players by XP</h3></div>
        <div class="table-responsive">
          <table class="admin-data-table">
            <thead>
              <tr>
                <th>Rank</th><th>Player</th><th>XP</th><th>Stars</th><th>Frens</th><th>Level</th>
              </tr>
            </thead>
            <tbody>
              ${list.map((u, i) => renderRow(u, i)).join("") || `<tr><td colspan="6" style="text-align:center; padding:20px; color:var(--text-muted);">No players yet.</td></tr>`}
            </tbody>
          </table>
        </div>
      </div>
    `;
  } catch (e) {
    container.innerHTML = `<p style="color:var(--accent-danger); padding:20px;">Error loading leaderboard: ${e.message}</p>`;
  }
}

function loadNFTsView() {
  document.querySelector("#adminViewContainer").innerHTML = `
    <div class="admin-top-bar"><h1>NFT Hub & TON Marketplace</h1></div>
    <div class="chart-card"><p>Cybernetic Spider Collection: 4 tiers (Common 80 USDT, Rare 120 USDT, Epic 250 USDT, Legendary 500 USDT). Integrated with TON Connect non-custodial wallets.</p></div>
  `;
}

function loadSettingsView() {
  document.querySelector("#adminViewContainer").innerHTML = `
    <div class="admin-top-bar"><h1>System Settings & Bot Tokens</h1></div>
    <div class="chart-card">
      <p><b>Node Environment:</b> ${window.location.hostname === "localhost" ? "Development (Local Mode)" : "Production"}</p>
      <p style="margin-top:8px;"><b>Telegram HMAC Validation:</b> WebAppData HMAC-SHA256 signature verification</p>
      <p style="margin-top:8px;"><b>Database:</b> SQLite (spider.db)</p>
    </div>
  `;
}

function escapeHTML(str) {
  return String(str ?? "").replace(/[&<>"']/g, m => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
  }[m]));
}

// Initial Boot
(async () => {
  if (!adminPass) return renderLogin();
  try {
    await adminApi("/api/admin/stats");
    renderLayout();
  } catch (e) {
    renderLogin();
  }
})();