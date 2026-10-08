/* ==========================================================
   SPIDER WEB NETWORK - FRONTEND CLIENT APPLICATION
   Full Telegram WebApp SDK Integration & Real-time State
   ========================================================== */

// 1. Initialize Telegram Mini App SDK
const tg = window.Telegram?.WebApp;
if (tg) {
  try {
    tg.ready();
    tg.expand();
    tg.enableClosingConfirmation?.();
  } catch (e) {
    console.warn("Telegram WebApp initialization error:", e);
  }
}

// Global App State
let authToken = localStorage.getItem("spider_token") || null;
let currentUser = null;
let userLanguage = localStorage.getItem("spider_lang") || "en";
let currentTaskFilter = "daily";
let currentNFTFilter = "all";
let currentNFTTab = "explore";
let currentRankTab = "global";

// Multi-Language Dictionary
const translations = {
  en: {
    home: "Home", games: "Games", tasks: "Tasks", frens: "Frens", profile: "Profile",
    webLevel: "Web Level", xpStars: "XP / Stars", dailyReward: "Daily Reward",
    claimDaily: "Claim your daily check-in reward", claim: "Claim", claimed: "Claimed",
    dayStreak: "Day Streak", quickAccess: "Quick Access", nftHub: "NFT Hub",
    topGlobalRank: "Top Global Rank", viewLeaderboard: "View Leaderboard",
    yourTurn: "Your Turn (Spider)", opponentTurn: "Opponent Turn (Web)",
    youWon: "Victory! +50 XP +10 ⭐", youLost: "Defeat! +5 XP", matchDraw: "Draw! +10 XP",
    dailyMatchesLeft: "Daily Matches Left", newMatch: "New Match", matchHistory: "Match History",
    totalFriends: "Total Friends", activeFriends: "Active Friends", refEarnings: "Referral Earnings",
    shareLink: "Share Link", copySuccess: "Copied to clipboard!",
    walletConnected: "Connected", walletDisconnected: "Disconnected",
    buySuccess: "NFT acquired successfully!", insufficientBalance: "Insufficient USDT balance!"
  },
  hi: {
    home: "होम", games: "गेम्स", tasks: "टास्क", frens: "मित्र", profile: "प्रोफाइल",
    webLevel: "वेब लेवल", xpStars: "XP / स्टार्स", dailyReward: "दैनिक इनाम",
    claimDaily: "अपना दैनिक चेक-इन इनाम प्राप्त करें", claim: "प्राप्त करें", claimed: "प्राप्त हुआ",
    dayStreak: "दिन की स्ट्रीक", quickAccess: "त्वरित पहुँच", nftHub: "NFT हब",
    topGlobalRank: "शीर्ष वैश्विक रैंक", viewLeaderboard: "लीडरबोर्ड देखें",
    yourTurn: "आपकी बारी (स्पाइडर)", opponentTurn: "विरोधी की बारी (वेब)",
    youWon: "जीत! +50 XP +10 ⭐", youLost: "हार! +5 XP", matchDraw: "ड्रा! +10 XP",
    dailyMatchesLeft: "दैनिक मैच शेष", newMatch: "नया मैच", matchHistory: "मैच इतिहास",
    totalFriends: "कुल मित्र", activeFriends: "सक्रिय मित्र", refEarnings: "रेफरल कमाई",
    shareLink: "लिंक साझा करें", copySuccess: "क्लिपबोर्ड पर कॉपी किया गया!",
    walletConnected: "जुड़ा हुआ", walletDisconnected: "डिस्कनेक्ट",
    buySuccess: "NFT सफलतापूर्वक खरीदा गया!", insufficientBalance: "अपर्याप्त USDT शेष!"
  },
  ar: {
    home: "الرئيسية", games: "الألعاب", tasks: "المهام", frens: "الأصدقاء", profile: "الملف الشخصي",
    webLevel: "مستوى الويب", xpStars: "نقاط / نجوم", dailyReward: "المكافأة اليومية",
    claimDaily: "استلم مكافأة الدخول اليومية", claim: "مطالبة", claimed: "تم الاستلام",
    dayStreak: "سلسلة الأيام", quickAccess: "الوصول السريع", nftHub: "مركز NFT",
    topGlobalRank: "الترتيب العالمي", viewLeaderboard: "عرض لوحة الصدارة",
    yourTurn: "دورك (العنكبوت)", opponentTurn: "دور الخصم (الشبكة)",
    youWon: "فوز! +50 XP +10 ⭐", youLost: "خسارة! +5 XP", matchDraw: "تعادل! +10 XP",
    dailyMatchesLeft: "المباريات المتبقية اليوم", newMatch: "مباراة جديدة", matchHistory: "سجل المباريات",
    totalFriends: "إجمالي الأصدقاء", activeFriends: "الأصدقاء النشطون", refEarnings: "أرباح الإحالة",
    shareLink: "مشاركة الرابط", copySuccess: "تم النسخ إلى الحافظة!",
    walletConnected: "متصل", walletDisconnected: "غير متصل",
    buySuccess: "تم شراء NFT بنجاح!", insufficientBalance: "رصيد USDT غير كافٍ!"
  },
  es: {
    home: "Inicio", games: "Juegos", tasks: "Tareas", frens: "Amigos", profile: "Perfil",
    webLevel: "Nivel Web", xpStars: "XP / Estrellas", dailyReward: "Recompensa Diaria",
    claimDaily: "Reclama tu recompensa diaria", claim: "Reclamar", claimed: "Reclamado",
    dayStreak: "Racha de Días", quickAccess: "Acceso Rápido", nftHub: "Centro NFT",
    topGlobalRank: "Rango Global", viewLeaderboard: "Ver Clasificación",
    yourTurn: "Tu Turno (Spider)", opponentTurn: "Turno Rival (Web)",
    youWon: "¡Victoria! +50 XP +10 ⭐", youLost: "¡Derrota! +5 XP", matchDraw: "¡Empate! +10 XP",
    dailyMatchesLeft: "Partidas restantes", newMatch: "Nueva Partida", matchHistory: "Historial",
    totalFriends: "Total Amigos", activeFriends: "Amigos Activos", refEarnings: "Ganancias Ref",
    shareLink: "Compartir Enlace", copySuccess: "¡Copiado al portapapeles!",
    walletConnected: "Conectado", walletDisconnected: "Desconectado",
    buySuccess: "¡NFT adquirido con éxito!", insufficientBalance: "¡Saldo de USDT insuficiente!"
  },
  ru: {
    home: "Главная", games: "Игры", tasks: "Задания", frens: "Друзья", profile: "Профиль",
    webLevel: "Веб-уровень", xpStars: "XP / Звезды", dailyReward: "Ежедневная награда",
    claimDaily: "Заберите вашу ежедневную награду", claim: "Забрать", claimed: "Получено",
    dayStreak: "Серия дней", quickAccess: "Быстрый доступ", nftHub: "NFT Хаб",
    topGlobalRank: "Мировой рейтинг", viewLeaderboard: "Таблица лидеров",
    yourTurn: "Ваш ход (Паук)", opponentTurn: "Ход соперника (Паутина)",
    youWon: "Победа! +50 XP +10 ⭐", youLost: "Поражение! +5 XP", matchDraw: "Ничья! +10 XP",
    dailyMatchesLeft: "Матчей осталось", newMatch: "Новый матч", matchHistory: "История матчей",
    totalFriends: "Всего друзей", activeFriends: "Активные друзья", refEarnings: "Доход с рефералов",
    shareLink: "Поделиться ссылкой", copySuccess: "Скопировано в буфер!",
    walletConnected: "Подключено", walletDisconnected: "Отключено",
    buySuccess: "NFT успешно приобретен!", insufficientBalance: "Недостаточно USDT!"
  },
  tr: {
    home: "Ana Sayfa", games: "Oyunlar", tasks: "Görevler", frens: "Arkadaşlar", profile: "Profil",
    webLevel: "Ağ Seviyesi", xpStars: "XP / Yıldızlar", dailyReward: "Günlük Ödül",
    claimDaily: "Günlük giriş ödülünü al", claim: "Al", claimed: "Alındı",
    dayStreak: "Gün Serisi", quickAccess: "Hızlı Erişim", nftHub: "NFT Merkezi",
    topGlobalRank: "Küresel Sıralama", viewLeaderboard: "Liderlik Tablosu",
    yourTurn: "Sıra Sende (Örümcek)", opponentTurn: "Rakip Sırası (Ağ)",
    youWon: "Zafer! +50 XP +10 ⭐", youLost: "Yenilgi! +5 XP", matchDraw: "Berabere! +10 XP",
    dailyMatchesLeft: "Kalan Günlük Maç", newMatch: "Yeni Maç", matchHistory: "Maç Geçmişi",
    totalFriends: "Toplam Arkadaş", activeFriends: "Aktif Arkadaşlar", refEarnings: "Davet Kazancı",
    shareLink: "Bağlantıyı Paylaş", copySuccess: "Panoya kopyalandı!",
    walletConnected: "Bağlandı", walletDisconnected: "Bağlantı Kesildi",
    buySuccess: "NFT başarıyla alındı!", insufficientBalance: "Yetersiz USDT bakiyesi!"
  }
};

function t(key) {
  return translations[userLanguage]?.[key] || translations["en"]?.[key] || key;
}

// DOM Helper Selectors
const $ = sel => document.querySelector(sel);
const $$ = sel => document.querySelectorAll(sel);

// Haptic feedback trigger for Telegram
function triggerHaptic(type = "light") {
  if (tg?.HapticFeedback) {
    if (type === "success") tg.HapticFeedback.notificationOccurred("success");
    else if (type === "warning") tg.HapticFeedback.notificationOccurred("warning");
    else if (type === "heavy") tg.HapticFeedback.impactOccurred("heavy");
    else tg.HapticFeedback.impactOccurred("light");
  }
}

// API Helper
async function api(path, options = {}) {
  const headers = {
    "Content-Type": "application/json",
    ...(authToken ? { Authorization: `Bearer ${authToken}` } : {})
  };

  const response = await fetch(path, { ...options, headers });
  let data = null;
  const text = await response.text();
  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      data = { error: text };
    }
  } else {
    data = {};
  }

  if (!response.ok) {
    throw new Error(data?.error || `Request failed (${response.status})`);
  }
  return data;
}

// Navigation Handler
function navigateTo(screenId) {
  triggerHaptic("light");
  $$(".screen").forEach(s => s.classList.remove("active"));
  const target = $(`#screen-${screenId}`);
  if (target) {
    target.classList.add("active");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  // Update bottom nav highlighting
  $$(".nav-tab").forEach(tab => {
    tab.classList.toggle("active", tab.dataset.go === screenId);
  });

  // Screen specific hooks
  if (screenId === "tasks") loadTasks();
  if (screenId === "games") loadGameHistory();
  if (screenId === "frens") loadFrens();
  if (screenId === "wallet") loadWallet();
  if (screenId === "nft") loadNFTs();
  if (screenId === "leaderboard") loadLeaderboard();
  if (screenId === "profile") syncProfileUI();
}

// Setup Event Listeners
function setupNavigation() {
  document.addEventListener("click", (e) => {
    const goBtn = e.target.closest("[data-go]");
    if (goBtn) {
      e.preventDefault();
      navigateTo(goBtn.dataset.go);
      return;
    }

    const backBtn = e.target.closest(".back-btn");
    if (backBtn) {
      e.preventDefault();
      navigateTo("home");
      return;
    }
  });
}

// ======================== AUTH & INIT ========================
async function initApp() {
  setupNavigation();
  setupSpiderTap();
  setupTicTacToe();
  setupDailyStreak();
  setupLanguageSelector();
  setupLeaderboardTabs();
  setupModals();

  const initData = tg?.initData || "";
  const startParam = tg?.initDataUnsafe?.start_param || "";
  const hasBypass = sessionStorage.getItem("spider_dev_bypass") === "1";

  const gatekeeper = document.querySelector("#telegramGatekeeper");
  const bypassBtn = document.querySelector("#devBypassBtn");

  if (bypassBtn) {
    bypassBtn.onclick = () => {
      sessionStorage.setItem("spider_dev_bypass", "1");
      if (gatekeeper) gatekeeper.style.display = "none";
      authenticateAndLoad(initData, startParam);
    };
  }

  // If outside Telegram client and not bypassed, display Gatekeeper
  if (!initData && !hasBypass) {
    if (gatekeeper) gatekeeper.style.display = "flex";
    return;
  }

  if (gatekeeper) gatekeeper.style.display = "none";
  await authenticateAndLoad(initData, startParam);
}

async function authenticateAndLoad(initData, startParam) {
  try {
    const authRes = await api("/api/auth", {
      method: "POST",
      body: JSON.stringify({ initData, refCode: startParam })
    });

    authToken = authRes.token;
    currentUser = authRes.user;
    localStorage.setItem("spider_token", authToken);

    if (currentUser.language) {
      userLanguage = currentUser.language;
      applyLanguage(userLanguage);
    }

    renderUserHeader();
    syncHomeUI();
  } catch (err) {
    console.warn("Auth Notice:", err.message);
    const tgUser = tg?.initDataUnsafe?.user;
    currentUser = {
      username: tgUser?.username || "SpiderUser",
      first_name: tgUser?.first_name || "SpiderUser",
      points: 0,
      stars: 0,
      level: 1,
      streak: 0,
      ref_code: "SPIDER01",
      ton_balance: 0.0,
      usdt_balance: 0.0,
      matches_left: 5
    };
    renderUserHeader();
    syncHomeUI();
  }
}

function renderUserHeader() {
  if (!currentUser) return;
  const tgUser = tg?.initDataUnsafe?.user;
  const displayName = (tgUser?.first_name ? `${tgUser.first_name} ${tgUser.last_name || ""}`.trim() : null) || currentUser.first_name || "SpiderUser";
  const displayHandle = (tgUser?.username ? `@${tgUser.username}` : null) || (currentUser.username ? `@${currentUser.username}` : `@${currentUser.tg_id || "user"}`);

  $("#headerAvatarBtn")?.classList.remove("skeleton", "skeleton-avatar");
  $("#userHandle").innerHTML = escapeHTML(displayHandle);
  $("#profileName").textContent = displayName;
  $("#profileHandle").textContent = displayHandle;

  // Avatar priority: cached /avatars/{tg_id}.jpg > avatar_url > tg photo_url
  const tgId = currentUser.tg_id;
  let avatarUrl = null;
  if (tgId && String(tgId) !== "spidermaster_local") {
    avatarUrl = `/avatars/${tgId}.jpg`;
  } else {
    avatarUrl = currentUser.avatar_url || tgUser?.photo_url || null;
  }

  const headerImg = $("#headerAvatarImg");
  const fallback = $("#headerAvatarFallback");
  const profileImg = $(".profile-avatar-img");

  if (avatarUrl) {
    const fallbackSrc = currentUser.avatar_url || tgUser?.photo_url;
    if (headerImg) {
      headerImg.onerror = function() {
        if (fallbackSrc && headerImg.src !== fallbackSrc) {
          headerImg.src = fallbackSrc;
        } else {
          headerImg.style.display = "none";
          if (fallback) fallback.style.display = "flex";
        }
      };
      headerImg.src = avatarUrl;
      headerImg.style.display = "block";
      if (fallback) fallback.style.display = "none";
    }
    if (profileImg) {
      profileImg.onerror = function() {
        if (fallbackSrc && profileImg.src !== fallbackSrc) profileImg.src = fallbackSrc;
      };
      profileImg.src = avatarUrl;
    }
  } else {
    if (headerImg) headerImg.style.display = "none";
    if (fallback) fallback.style.display = "flex";
  }
}

async function refreshMe() {
  try {
    currentUser = await api("/api/me");
    syncHomeUI();
    syncProfileUI();
  } catch (e) {
    console.error(e);
  }
}

// ======================== 1. HOME SCREEN ========================
function syncHomeUI() {
  if (!currentUser) return;
  $("#statWebLevel").textContent = currentUser.level || 1;
  $("#statXP").textContent = Number(currentUser.points || 0).toLocaleString();
  
  const nextTarget = Math.max(500, (currentUser.level || 1) * 500);
  $("#profileXPVal").textContent = `${Number(currentUser.points || 0).toLocaleString()} / ${nextTarget.toLocaleString()}`;
  $("#profileLevel").textContent = currentUser.level || 1;
  
  const xpPercent = Math.min(100, Math.max(0, ((currentUser.points % 500) / 500) * 100));
  $("#profileXPBar").style.width = `${xpPercent}%`;

  $("#streakCount").textContent = currentUser.streak || 0;

  // Check if claimed today
  const today = new Date().toISOString().slice(0, 10);
  const hasClaimedToday = (currentUser.last_claim_date === today);

  const claimBtn = $("#claimDailyBtn");
  if (claimBtn) {
    if (hasClaimedToday) {
      claimBtn.disabled = true;
      claimBtn.innerHTML = `<i class="fa-solid fa-circle-check"></i> ${t("claimed")}`;
      claimBtn.classList.add("btn-claimed");
    } else {
      claimBtn.disabled = false;
      claimBtn.innerHTML = t("claim");
      claimBtn.classList.remove("btn-claimed");
    }
  }

  // Update dynamic rank
  const rank = currentUser.global_rank || 1;
  if ($("#homeRankVal")) {
    $("#homeRankVal").textContent = rank;
  }

  renderStreakDots(currentUser.streak || 0, hasClaimedToday);
}

// 14 Day Streak UI Generator
function renderStreakDots(currentStreak, hasClaimedToday = false) {
  const container = $("#streakTrack");
  const profileContainer = $("#profileStreakTrack");
  if (!container) return;

  let html = "";
  for (let day = 1; day <= 14; day++) {
    let isCompleted = false;
    let isCurrent = false;

    if (hasClaimedToday) {
      // If user claimed today, all days through currentStreak are completed
      isCompleted = day <= currentStreak;
      isCurrent = false;
    } else {
      // If user hasn't claimed yet today
      isCompleted = day <= currentStreak;
      isCurrent = (day === (currentStreak + 1)) || (currentStreak === 0 && day === 1);
    }

    const isGiftDay = day === 14;

    const classNames = [
      "streak-dot",
      isCompleted ? "completed" : "",
      isCurrent ? "current" : "",
      isGiftDay ? "gift-day" : ""
    ].filter(Boolean).join(" ");

    const content = isCompleted 
      ? '<i class="fa-solid fa-check"></i>' 
      : (isGiftDay ? '<i class="fa-solid fa-gift"></i>' : day);

    html += `
      <div class="streak-dot-item">
        <div class="${classNames}">${content}</div>
        <span class="streak-day-label">D${day}</span>
      </div>
    `;
  }

  container.innerHTML = html;
  if (profileContainer) profileContainer.innerHTML = html;
}

function setupDailyStreak() {
  $("#claimDailyBtn").onclick = async () => {
    const today = new Date().toISOString().slice(0, 10);
    if (currentUser?.last_claim_date === today) {
      triggerHaptic("warning");
      openModal("Daily Check-in", `
        <div style="text-align:center; padding: 10px;">
          <div style="font-size: 36px; margin-bottom: 8px;">⏳</div>
          <h4 style="margin-bottom:6px; color:var(--text-main);">Already Claimed for Today!</h4>
          <p style="color:var(--text-muted); font-size:13px;">You have already claimed today's reward. Come back tomorrow to advance your streak to <b>Day ${(currentUser.streak || 1) + 1}</b>!</p>
        </div>
      `);
      return;
    }

    triggerHaptic("success");
    try {
      const res = await api("/api/daily-reward", { method: "POST" });
      currentUser = res.user;
      syncHomeUI();
      openModal("Daily Reward Claimed! 🕷️", `
        <div style="text-align:center; padding: 15px 0;">
          <div style="font-size: 48px; margin-bottom: 10px;">🎁</div>
          <h3 style="color:var(--accent-gold); margin-bottom: 8px;">+${res.reward_xp} XP & +${res.reward_stars} Stars!</h3>
          <p style="color:var(--accent-green); font-weight:700; font-size:14px; margin-bottom: 6px;">Day ${res.streak} Completed ✓</p>
          <p style="color:var(--text-muted); font-size:13px;">Keep your streak going tomorrow for greater bonuses.</p>
        </div>
      `);
    } catch (e) {
      triggerHaptic("warning");
      openModal("Daily Check-in", `<p style="text-align:center; padding: 10px;">${escapeHTML(e.message)}</p>`);
    }
  };
}

// Tap-To-Earn on the Spider Emblem with Floating Particles
function setupSpiderTap() {
  const emblem = $("#spiderTapBtn");
  emblem.addEventListener("pointerdown", (e) => {
    triggerHaptic("light");
    currentUser.points = (currentUser.points || 0) + 1;
    $("#statXP").textContent = Number(currentUser.points).toLocaleString();

    // Spawn floating particle
    const rect = emblem.getBoundingClientRect();
    const particle = document.createElement("div");
    particle.className = "tap-particle";
    particle.innerHTML = "+1 XP <i class='fa-solid fa-star'></i>";
    
    // Position relative to click
    const clientX = e.clientX || (rect.left + rect.width / 2);
    const clientY = e.clientY || (rect.top + rect.height / 2);
    particle.style.left = `${clientX - 30}px`;
    particle.style.top = `${clientY - 20}px`;
    
    document.body.appendChild(particle);
    setTimeout(() => particle.remove(), 800);
  });
}

// ======================== 2. GAMES: SPIDER TIC-TAC-TOE ========================
let tttBoard = Array(9).fill(null);
let tttActive = true;
let tttPlayerTurn = true;

function setupTicTacToe() {
  const cells = $$(".ttt-cell");
  cells.forEach(cell => {
    cell.onclick = () => {
      const idx = parseInt(cell.dataset.index);
      if (!tttActive || !tttPlayerTurn || tttBoard[idx]) return;
      
      makePlayerMove(idx);
    };
  });

  $("#newMatchBtn").onclick = resetTicTacToeBoard;

  $("#toggleHistoryBtn").onclick = () => {
    const list = $("#gameHistoryList");
    const chev = $("#histChevron");
    list.classList.toggle("open");
    chev.classList.toggle("fa-chevron-up");
  };
}

function makePlayerMove(idx) {
  triggerHaptic("light");
  tttBoard[idx] = "X";
  updateTTTDisplay();

  const win = checkTTTWinner(tttBoard);
  if (win) {
    finishTTTMatch(win === "X" ? "win" : "loss");
    return;
  }

  if (tttBoard.every(c => c !== null)) {
    finishTTTMatch("draw");
    return;
  }

  // AI Turn
  tttPlayerTurn = false;
  $("#gameStatusText").textContent = t("opponentTurn");
  $("#gameStatusBanner").style.borderColor = "var(--accent-cyan)";

  setTimeout(() => {
    makeAIMove();
  }, 450);
}

function makeAIMove() {
  if (!tttActive) return;
  const bestMove = getBestAIMove(tttBoard);
  if (bestMove !== -1) {
    tttBoard[bestMove] = "O";
    triggerHaptic("light");
    updateTTTDisplay();

    const win = checkTTTWinner(tttBoard);
    if (win) {
      finishTTTMatch(win === "O" ? "loss" : "win");
      return;
    }

    if (tttBoard.every(c => c !== null)) {
      finishTTTMatch("draw");
      return;
    }
  }

  tttPlayerTurn = true;
  $("#gameStatusText").textContent = t("yourTurn");
  $("#gameStatusBanner").style.borderColor = "var(--primary-light)";
}

// Simple smart AI: tries to win, blocks player, or takes strategic cell
function getBestAIMove(board) {
  const emptyIndices = board.map((v, i) => v === null ? i : null).filter(v => v !== null);
  if (emptyIndices.length === 0) return -1;

  // 1. Can AI win immediately?
  for (let idx of emptyIndices) {
    const copy = [...board]; copy[idx] = "O";
    if (checkTTTWinner(copy) === "O") return idx;
  }

  // 2. Can Player win immediately? Block them!
  for (let idx of emptyIndices) {
    const copy = [...board]; copy[idx] = "X";
    if (checkTTTWinner(copy) === "X") return idx;
  }

  // 3. Center
  if (board[4] === null) return 4;

  // 4. Random available
  return emptyIndices[Math.floor(Math.random() * emptyIndices.length)];
}

function checkTTTWinner(b) {
  const lines = [
    [0, 1, 2], [3, 4, 5], [6, 7, 8],
    [0, 3, 6], [1, 4, 7], [2, 5, 8],
    [0, 4, 8], [2, 4, 6]
  ];
  for (let [x, y, z] of lines) {
    if (b[x] && b[x] === b[y] && b[x] === b[z]) {
      return b[x];
    }
  }
  return null;
}

function updateTTTDisplay() {
  const cells = $$(".ttt-cell");
  cells.forEach((cell, i) => {
    const val = tttBoard[i];
    cell.className = "ttt-cell";
    if (val === "X") {
      cell.innerHTML = "🕷️";
      cell.classList.add("cell-player");
    } else if (val === "O") {
      cell.innerHTML = "🕸️";
      cell.classList.add("cell-bot");
    } else {
      cell.innerHTML = "";
    }
  });
}

async function finishTTTMatch(result) {
  tttActive = false;
  if (result === "win") {
    triggerHaptic("success");
    $("#gameStatusText").textContent = t("youWon");
  } else if (result === "loss") {
    triggerHaptic("warning");
    $("#gameStatusText").textContent = t("youLost");
  } else {
    triggerHaptic("light");
    $("#gameStatusText").textContent = t("matchDraw");
  }

  try {
    const res = await api("/api/games/tic-tac-toe", {
      method: "POST",
      body: JSON.stringify({ result })
    });
    currentUser = res.user;
    $("#matchesLeftCount").textContent = `${res.matches_left}/5`;
    syncHomeUI();
    loadGameHistory();
  } catch (e) {
    console.warn("Match record warning:", e.message);
  }
}

function resetTicTacToeBoard() {
  triggerHaptic("light");
  tttBoard = Array(9).fill(null);
  tttActive = true;
  tttPlayerTurn = true;
  $("#gameStatusText").textContent = t("yourTurn");
  $("#gameStatusBanner").style.borderColor = "var(--primary-light)";
  updateTTTDisplay();
}

async function loadGameHistory() {
  try {
    const history = await api("/api/games/history");
    const container = $("#gameHistoryList");
    if (!history.length) {
      container.innerHTML = `<p style="color:var(--text-muted);font-size:12px;padding:8px 0;">No match history yet. Play a match!</p>`;
      return;
    }
    container.innerHTML = history.map(h => `
      <div class="history-row">
        <span><b>${h.result.toUpperCase()}</b> vs ${h.opponent}</span>
        <span style="color:var(--accent-cyan); font-weight:700;">+${h.xp_reward} XP ${h.stars_reward ? `<b class="text-gold">+${h.stars_reward} ⭐</b>` : ''}</span>
      </div>
    `).join("");
  } catch (e) {
    console.warn(e);
  }
}

// ======================== 3. TASKS & MISSIONS ========================
async function loadTasks() {
  try {
    const tasks = await api("/api/tasks");
    const filtered = tasks.filter(t => currentTaskFilter === "all" || t.category === currentTaskFilter);
    const container = $("#tasksList");

    if (!filtered.length) {
      container.innerHTML = `<p style="text-align:center;color:var(--text-muted);padding:20px;">No tasks in this category.</p>`;
      return;
    }

    container.innerHTML = filtered.map(task => {
      const isClaimed = task.claimed === 1;
      const progress = task.progress || 0;
      const target = task.target_count || 1;
      const isReadyToClaim = progress >= target && !isClaimed;

      let actionBtn = "";
      if (isClaimed) {
        actionBtn = `<button class="task-btn-action btn-task-done"><i class="fa-solid fa-check"></i> Done</button>`;
      } else if (isReadyToClaim || task.type === "telegram" || task.type === "twitter" || task.type === "login") {
        actionBtn = `<button class="task-btn-action btn-task-claim" data-claim-task="${task.id}">${t("claim")}</button>`;
      } else {
        actionBtn = `<button class="task-btn-action btn-task-progress">${progress}/${target}</button>`;
      }

      let iconClass = "fa-solid fa-bolt";
      if (task.type === "telegram") iconClass = "fa-brands fa-telegram";
      if (task.type === "twitter") iconClass = "fa-brands fa-x-twitter";
      if (task.type === "game") iconClass = "fa-solid fa-gamepad";
      if (task.type === "referral") iconClass = "fa-solid fa-user-plus";
      if (task.type === "wallet") iconClass = "fa-solid fa-wallet";

      return `
        <div class="task-card-item">
          <div class="task-info-left">
            <div class="task-icon-bubble"><i class="${iconClass}"></i></div>
            <div class="task-text">
              <h4>${escapeHTML(task.title)}</h4>
              <div class="task-meta">
                <span class="task-reward-tag">+${task.xp_reward} XP</span>
                ${task.stars_reward ? `<span class="text-gold">+${task.stars_reward} ⭐</span>` : ""}
              </div>
            </div>
          </div>
          ${actionBtn}
        </div>
      `;
    }).join("");

    // Bind claim buttons
    $$("[data-claim-task]").forEach(btn => {
      btn.onclick = async () => {
        triggerHaptic("success");
        const taskId = btn.dataset.claimTask;
        try {
          const res = await api(`/api/tasks/${taskId}/complete`, { method: "POST" });
          currentUser = res.user;
          syncHomeUI();
          loadTasks();
          openModal("Task Completed! 🎉", `
            <div style="text-align:center; padding: 15px;">
              <h3 style="color:var(--accent-cyan);">+${res.reward_xp} XP Awarded!</h3>
              ${res.reward_stars ? `<p class="text-gold">+${res.reward_stars} Stars added!</p>` : ""}
            </div>
          `);
        } catch (e) {
          alert(e.message);
        }
      };
    });

    // Count completed tasks
    const completedCount = tasks.filter(t => t.claimed === 1).length;
    $("#completedTasksTag").textContent = `${completedCount} Completed`;
    $("#completedCountDisplay").textContent = `${completedCount} >`;
  } catch (e) {
    console.warn(e);
  }
}

// Setup task tabs
$$("[data-task-tab]").forEach(tab => {
  tab.onclick = () => {
    triggerHaptic("light");
    $$("[data-task-tab]").forEach(t => t.classList.remove("active"));
    tab.classList.add("active");
    currentTaskFilter = tab.dataset.taskTab;
    loadTasks();
  };
});

// ======================== 4. FRENS & REFERRAL ========================
async function loadFrens() {
  try {
    const frensData = await api("/api/frens");
    $("#refCodeText").textContent = frensData.referral_code;
    $("#refLinkText").textContent = frensData.referral_link;
    $("#totalFriendsVal").textContent = frensData.total_friends;
    $("#activeFriendsVal").textContent = frensData.active_friends;
    $("#referralEarningsVal").textContent = Number(frensData.referral_earnings).toLocaleString();

    const listEl = $("#refLeaderboardList");
    if (!frensData.leaderboard || frensData.leaderboard.length === 0) {
      listEl.innerHTML = `
        <div style="text-align:center; padding: 25px 12px; color:var(--text-muted);">
          <div style="font-size:32px; margin-bottom:8px;">👥</div>
          <strong style="color:var(--text-main); font-size:14px; display:block; margin-bottom:4px;">No Friends Invited Yet</strong>
          <p style="font-size:12px; line-height:1.4;">Share your invite link above with friends.<br/>You will receive <b style="color:var(--accent-gold);">+100 XP & +50 Stars ⭐</b> for each friend who joins!</p>
        </div>
      `;
    } else {
      listEl.innerHTML = frensData.leaderboard.map((f, i) => {
        const displayName = f.username ? `@${f.username}` : (f.first_name || `Friend #${i + 1}`);
        const avatarSrc = f.avatar_url || (f.tg_id ? `/avatars/${f.tg_id}.jpg` : "/assets/spider_avatar.jpg");
        return `
          <div class="rank-item-card" style="margin-bottom:6px;">
            <div class="rank-item-left">
              <span class="rank-index" style="min-width:20px;">#${i + 1}</span>
              <img src="${avatarSrc}" alt="" class="rank-item-avatar" onerror="this.onerror=null; this.src='/assets/spider_avatar.jpg';" />
              <div style="display:flex; flex-direction:column;">
                <span class="rank-username">${escapeHTML(displayName)}</span>
                ${f.first_name && f.username ? `<span style="font-size:11px; color:var(--text-muted);">${escapeHTML(f.first_name)}</span>` : ""}
              </div>
            </div>
            <div style="text-align:right;">
              <span style="font-size:13px; font-weight:800; color:var(--accent-gold);">${Number(f.points || 0).toLocaleString()} XP</span><br/>
              <span style="font-size:11px; color:var(--text-muted);"><i class="fa-solid fa-star"></i> ${f.stars || 0}</span>
            </div>
          </div>
        `;
      }).join("");
    }

    // Copy actions
    $("#copyCodeBtn").onclick = () => copyText(frensData.referral_code);
    $("#copyLinkBtn").onclick = () => copyText(frensData.referral_link);

    $("#shareTelegramLinkBtn").onclick = () => {
      triggerHaptic("light");
      const shareText = encodeURIComponent("Join me on Spider Web Network! Play games, earn XP and claim rewards 🕷️");
      const shareUrl = encodeURIComponent(frensData.referral_link);
      const tgLink = `https://t.me/share/url?url=${shareUrl}&text=${shareText}`;
      
      if (tg?.openTelegramLink) {
        tg.openTelegramLink(tgLink);
      } else {
        window.open(tgLink, "_blank");
      }
    };
  } catch (e) {
    console.warn("Frens load error:", e);
  }
}

// ======================== 5. TON WALLET (@wallet & Tonkeeper) ========================
let tonConnectUI = null;

function initTonConnect() {
  if (typeof TON_CONNECT_UI !== "undefined" && !tonConnectUI) {
    try {
      const manifestUrl = `${window.location.origin}/tonconnect-manifest.json`;
      tonConnectUI = new TON_CONNECT_UI.TonConnectUI({
        manifestUrl,
        buttonRootId: "ton-connect-btn"
      });

      // Handle official wallet connection (@wallet or Tonkeeper)
      tonConnectUI.onStatusChange(async (wallet) => {
        if (wallet && wallet.account?.address) {
          triggerHaptic("success");
          try {
            const rawAddress = wallet.account.address;
            const res = await api("/api/wallet/connect", {
              method: "POST",
              body: JSON.stringify({
                address: rawAddress,
                wallet_app: wallet.device?.appName || "@wallet"
              })
            });
            currentUser = res.user;
            syncHomeUI();
            loadWallet();
          } catch (err) {
            console.warn("TON Connect auto-link error:", err.message);
          }
        }
      });
    } catch (e) {
      console.warn("TonConnect UI initialization notice:", e);
    }
  }
}

async function loadWallet() {
  initTonConnect();
  try {
    const wallet = await api("/api/wallet");
    const isConnected = Boolean(wallet.connected && wallet.wallet_address);
    
    const connectedView = $("#walletConnectedView");
    const connectForm = $("#walletConnectForm");
    
    if (isConnected) {
      if (connectedView) connectedView.style.display = "block";
      if (connectForm) connectForm.style.display = "none";
      $("#walletAddrTrunc").textContent = wallet.wallet_address;
    } else {
      if (connectedView) connectedView.style.display = "none";
      if (connectForm) connectForm.style.display = "block";
      $("#walletAddrTrunc").textContent = "Not connected";
    }

    $("#tonBalanceVal").textContent = `${wallet.ton_balance ?? 0} TON`;
    $("#usdtBalanceVal").textContent = `${wallet.usdt_balance ?? 0} USDT`;
    if ($("#nftWalletBalance")) $("#nftWalletBalance").textContent = wallet.usdt_balance ?? 0;

    $("#walletStatusBadge").innerHTML = isConnected
      ? `<span class="pulse-dot-green"></span> Connected (@wallet / TON)`
      : `<span style="color:var(--text-muted);">● Not Connected</span>`;

    // Connect TON address button
    const connectBtn = $("#connectTonManualBtn");
    if (connectBtn) {
      connectBtn.onclick = async () => {
        const addrInput = $("#tonAddressInput");
        const address = addrInput?.value?.trim();
        if (!address) {
          alert("Please enter your TON address starting with UQ or EQ (from @wallet or Tonkeeper).");
          return;
        }

        const isUserFriendly = /^[EU]Q[a-zA-Z0-9_-]{46}$/.test(address);
        const isRaw = /^-?[0-9]:[a-fA-F0-9]{64}$/.test(address);
        if (!isUserFriendly && !isRaw) {
          alert("Invalid TON address format! Must start with UQ or EQ (48 characters) or raw 0:... format from Telegram @wallet.");
          return;
        }

        triggerHaptic("success");
        try {
          const res = await api("/api/wallet/connect", {
            method: "POST",
            body: JSON.stringify({ address })
          });
          currentUser = res.user;
          syncHomeUI();
          loadWallet();
          openModal("TON Wallet Connected! 💎", `
            <div style="text-align:center; padding:15px;">
              <div style="font-size:42px; margin-bottom:8px;">💎</div>
              <h3 style="color:var(--accent-green);">TON Wallet Linked!</h3>
              <p style="font-family:var(--font-mono); font-size:12px; margin: 8px 0; color:var(--accent-cyan); word-break:break-all;">${res.wallet_address}</p>
              <p style="color:var(--text-muted); font-size:12px;">Earned <b>+100 XP & +25 Stars ⭐</b> for linking your Telegram TON Wallet!</p>
            </div>
          `);
        } catch (e) {
          alert(e.message);
        }
      };
    }

    // Paste button
    const pasteBtn = $("#pasteTonBtn");
    if (pasteBtn) {
      pasteBtn.onclick = async () => {
        try {
          const text = await navigator.clipboard.readText();
          if (text) $("#tonAddressInput").value = text.trim();
        } catch {
          alert("Please manually paste your address into the input box.");
        }
      };
    }

    // Disconnect button
    const disconnectBtn = $("#disconnectWalletBtn");
    if (disconnectBtn) {
      disconnectBtn.onclick = async () => {
        if (!confirm("Are you sure you want to disconnect this TON wallet?")) return;
        triggerHaptic("warning");
        try {
          if (tonConnectUI?.connected) {
            await tonConnectUI.disconnect();
          }
        } catch {}
        await api("/api/wallet/disconnect", { method: "POST" });
        loadWallet();
      };
    }

    $("#copyWalletAddrBtn").onclick = () => copyText(wallet.wallet_address);

    $("#viewTxHistoryBtn").onclick = () => {
      const txList = (wallet.transactions || []).map(tx => `
        <div style="display:flex; justify-content:space-between; padding:8px 0; border-bottom:1px solid var(--border-light); font-size:13px;">
          <div>
            <b>${escapeHTML(tx.description)}</b>
            <div style="font-size:11px;color:var(--text-muted);">${tx.created_at}</div>
          </div>
          <span style="color:var(--accent-cyan);font-weight:700;">${tx.amount}</span>
        </div>
      `).join("");
      openModal("Transaction History 🧾", txList || "<p style='text-align:center; padding:15px; color:var(--text-muted);'>No transactions recorded yet.</p>");
    };

    $("#sendReceiveBtn").onclick = () => {
      const currentAddr = wallet.wallet_address || "Connect your TON wallet first";
      openModal("The Open Network (TON) Deposit / Receive", `
        <div style="text-align:center; padding: 10px;">
          <div style="background:#fff; padding:15px; border-radius:12px; display:inline-block; margin-bottom:15px;">
            <i class="fa-solid fa-qrcode" style="font-size:110px; color:#000;"></i>
          </div>
          <p style="font-size:12px; color:var(--text-muted); margin-bottom:10px;">Official Telegram TON (@wallet) Address:</p>
          <div style="background:var(--bg-input); padding:8px; border-radius:8px; font-family:var(--font-mono); font-size:12px; word-break:break-all;">
            ${currentAddr}
          </div>
        </div>
      `);
    };
  } catch (e) {
    console.warn("Wallet load error:", e);
  }
}

// ======================== 6. NFT HUB ========================
async function loadNFTs() {
  try {
    const nfts = await api("/api/nfts");
    const container = $("#nftCardsGrid");

    let list = nfts;
    if (currentNFTFilter !== "all") {
      list = list.filter(n => n.rarity.toLowerCase() === currentNFTFilter.toLowerCase());
    }

    if (currentNFTTab === "my_nfts") {
      list = list.filter(n => n.owner_id === currentUser.id);
    }

    if (!list.length) {
      container.innerHTML = `<p style="grid-column:1/-1; text-align:center; color:var(--text-muted); padding:30px;">No NFTs found in this category.</p>`;
      return;
    }

    container.innerHTML = list.map(nft => {
      const isOwned = nft.owner_id === currentUser.id;
      return `
        <div class="nft-card">
          <div class="nft-img-wrap">
            <img src="${nft.image_url}" alt="${nft.name}" class="nft-img" onerror="this.src='/assets/spider_logo.jpg'" />
            <span class="nft-rarity-badge rarity-${nft.rarity}">${nft.rarity}</span>
          </div>
          <div class="nft-info-box">
            <span class="nft-name">${nft.name}</span>
            <div class="nft-price-row">
              <span class="nft-price-tag">${nft.price_usdt} USDT</span>
              <button class="btn-buy-nft" data-buy-nft="${nft.id}" ${isOwned ? "disabled" : ""}>
                ${isOwned ? "Owned" : "Buy"}
              </button>
            </div>
          </div>
        </div>
      `;
    }).join("");

    $$("[data-buy-nft]").forEach(btn => {
      btn.onclick = async () => {
        triggerHaptic("heavy");
        const nftId = btn.dataset.buyNft;
        try {
          const res = await api(`/api/nfts/${nftId}/buy`, { method: "POST" });
          currentUser = res.user;
          syncHomeUI();
          loadNFTs();
          openModal("NFT Purchase Successful! 🎉", `
            <div style="text-align:center; padding:15px;">
              <img src="${res.nft.image_url}" style="width:120px; height:120px; border-radius:12px; margin-bottom:10px; object-fit:cover;" />
              <h3>${res.nft.name}</h3>
              <p style="color:var(--accent-green); font-weight:700;">${res.message}</p>
            </div>
          `);
        } catch (e) {
          triggerHaptic("warning");
          alert(e.message);
        }
      };
    });
  } catch (e) {
    console.warn(e);
  }
}

// Rarity filter pills
$$("[data-rarity]").forEach(pill => {
  pill.onclick = () => {
    triggerHaptic("light");
    $$("[data-rarity]").forEach(p => p.classList.remove("active"));
    pill.classList.add("active");
    currentNFTFilter = pill.dataset.rarity;
    loadNFTs();
  };
});

$$("[data-nft-tab]").forEach(tab => {
  tab.onclick = () => {
    triggerHaptic("light");
    $$("[data-nft-tab]").forEach(t => t.classList.remove("active"));
    tab.classList.add("active");
    currentNFTTab = tab.dataset.nftTab;
    loadNFTs();
  };
});

// ======================== 7. PROFILE SCREEN ========================
function syncProfileUI() {
  if (!currentUser) return;
  $("#profileName").textContent = currentUser.first_name || "SpiderMaster";
  $("#profileHandle").textContent = `@${currentUser.username || "spidermaster"}`;
  $("#profileFriendsCount").textContent = currentUser.total_friends || 128;
  $("#profileGamesCount").textContent = currentUser.total_games || 46;
  $("#profileTasksCount").textContent = currentUser.completed_tasks_count || 82;
  $("#currentLangLabel").textContent = {
    en: "English", hi: "Hindi", ar: "Arabic", es: "Spanish", ru: "Russian", tr: "Turkish"
  }[userLanguage] || "English";
}

// ======================== 8. LANGUAGE SELECTOR ========================
function setupLanguageSelector() {
  $$("[data-lang]").forEach(card => {
    card.onclick = async () => {
      triggerHaptic("light");
      const lang = card.dataset.lang;
      userLanguage = lang;
      localStorage.setItem("spider_lang", lang);
      applyLanguage(lang);

      $$("[data-lang]").forEach(c => c.classList.remove("active"));
      card.classList.add("active");

      try {
        await api("/api/user/language", {
          method: "POST",
          body: JSON.stringify({ lang })
        });
      } catch (e) {}
      
      setTimeout(() => navigateTo("profile"), 300);
    };
  });
}

function applyLanguage(lang) {
  userLanguage = lang;
  // Update core tab labels
  $$(".nav-tab span").forEach(span => {
    const parentGo = span.parentElement.dataset.go;
    if (parentGo && translations[lang]?.[parentGo]) {
      span.textContent = translations[lang][parentGo];
    }
  });
  syncProfileUI();
}

// ======================== 9. GLOBAL RANKING & LEADERBOARDS ========================
let currentLeaderboardTab = "global";

function setupLeaderboardTabs() {
  const tabs = document.querySelectorAll("#screen-leaderboard .pill-tab");
  tabs.forEach(tab => {
    tab.onclick = () => {
      tabs.forEach(t => t.classList.remove("active"));
      tab.classList.add("active");
      currentLeaderboardTab = tab.dataset.rankTab || "global";
      triggerHaptic("light");
      loadLeaderboard(currentLeaderboardTab);
    };
  });

  const refreshBtn = document.querySelector("#refreshLeaderboardBtn");
  if (refreshBtn) {
    refreshBtn.onclick = () => {
      triggerHaptic("medium");
      const icon = refreshBtn.querySelector("i");
      if (icon) icon.classList.add("fa-spin");
      loadLeaderboard(currentLeaderboardTab).finally(() => {
        setTimeout(() => icon?.classList.remove("fa-spin"), 600);
      });
    };
  }
}

async function loadLeaderboard(tab = currentLeaderboardTab) {
  try {
    currentLeaderboardTab = tab;
    // Highlight the active tab button
    document.querySelectorAll("#screen-leaderboard .pill-tab").forEach(t => {
      t.classList.toggle("active", (t.dataset.rankTab || "global") === tab);
    });

    const podium = $("#podiumStage");
    const container = $("#globalRanksList");

    if (podium) {
      podium.innerHTML = `
        <div style="display:flex; justify-content:center; align-items:center; width:100%; height:140px; color:var(--text-muted);">
          <i class="fa-solid fa-spinner fa-spin" style="font-size:24px; color:var(--primary-light);"></i>
        </div>
      `;
    }

    const res = await api(`/api/leaderboard?type=${encodeURIComponent(tab)}`);
    const list = Array.isArray(res) ? res : (res?.list || []);

    const first = list[0];
    const second = list[1];
    const third = list[2];

    const getScoreHtml = (user, isWinner) => {
      if (!user) return "-";
      if (tab === "referrals") {
        return `
          <span class="podium-score ${isWinner ? 'text-gold' : ''}" style="display:flex; align-items:center; justify-content:center; gap:4px;">
            <i class="fa-solid fa-users"></i> ${user.referral_count || 0} Frens
          </span>
          <span style="font-size:10px; color:var(--text-muted);">${Number(user.points || 0).toLocaleString()} XP</span>
        `;
      }
      return `
        <span class="podium-score ${isWinner ? 'text-gold' : ''}">
          ${Number(user.points || 0).toLocaleString()} XP
        </span>
      `;
    };

    if (podium) {
      const renderCol = (user, rank, typeClass, barClass, crownClass, badgeClass) => {
        if (!user) {
          const isFrensTab = tab === "friends";
          return `
            <div class="podium-col ${typeClass}">
              <div class="podium-crown ${crownClass}"><i class="fa-solid fa-crown"></i></div>
              <div class="podium-avatar">
                <div style="width:100%; height:100%; border-radius:50%; background:var(--bg-card-subtle); display:flex; align-items:center; justify-content:center; color:var(--text-dim); border: 2px dashed var(--border-light);">
                  <i class="fa-solid ${isFrensTab ? 'fa-user-plus' : 'fa-user-clock'}" style="font-size:16px;"></i>
                </div>
                <span class="podium-rank-badge ${badgeClass}">${rank}</span>
              </div>
              <strong class="podium-name" style="color:var(--text-dim); font-size:11px;">
                ${isFrensTab ? 'Invite Fren' : 'Challenger'}
              </strong>
              <span class="podium-score">-</span>
              <div class="podium-bar ${barClass}"></div>
            </div>
          `;
        }

        const isWinner = rank === 1;
        // User profile picture: prefer avatar_url, then tg_id cached avatar, then default
        const avatarSrc = user.avatar_url 
          || (user.tg_id && String(user.tg_id) !== "spidermaster_local" ? `/avatars/${user.tg_id}.jpg` : '')
          || (isWinner ? '/assets/spider_avatar.jpg' : '/assets/spider_nft_001.jpg');

        const rawUsername = user.username ? `@${user.username}` : (user.first_name || `Player #${user.id}`);
        const isSelf = (user.username && user.username === currentUser?.username) || 
                       (user.tg_id && user.tg_id === currentUser?.tg_id) || 
                       (user.id && user.id === currentUser?.id);

        return `
          <div class="podium-col ${typeClass}">
            <div class="podium-crown ${crownClass}"><i class="fa-solid fa-crown"></i></div>
            <div class="podium-avatar ${isWinner ? 'avatar-winner' : ''}">
              <img src="${avatarSrc}" alt="${escapeHTML(rawUsername)}" onerror="this.onerror=null; this.src='/assets/spider_avatar.jpg';" />
              <span class="podium-rank-badge ${badgeClass}">${rank}</span>
            </div>
            <strong class="podium-name" title="${escapeHTML(user.first_name || rawUsername)}" ${isSelf ? 'style="color:var(--accent-cyan); font-weight:800;"' : ''}>
              ${escapeHTML(rawUsername)}${isSelf ? '<span class="badge-self-pill">YOU</span>' : ''}
            </strong>
            ${getScoreHtml(user, isWinner)}
            <div class="podium-bar ${barClass}"></div>
          </div>
        `;
      };

      // Podium order: 2nd (Silver, left), 1st (Gold, center), 3rd (Bronze, right)
      podium.innerHTML = `
        ${renderCol(second, 2, "podium-2nd", "bar-silver", "text-silver", "rank-2")}
        ${renderCol(first, 1, "podium-1st", "bar-gold", "text-gold", "rank-1")}
        ${renderCol(third, 3, "podium-3rd", "bar-bronze", "text-bronze", "rank-3")}
      `;
    }

    // Ranks 4 and below
    const ranks = list.slice(3);
    if (!ranks.length) {
      if (tab === "friends" && list.length <= 1) {
        container.innerHTML = `
          <div style="text-align:center; padding: 24px 14px; background:var(--bg-card); border:1px dashed var(--border-glass); border-radius:var(--radius-lg); margin-top:8px;">
            <i class="fa-solid fa-user-group" style="font-size:32px; color:var(--primary-light); margin-bottom:10px;"></i>
            <h4 style="font-size:15px; color:var(--text-main); margin-bottom:4px;">Compete with Friends</h4>
            <p style="font-size:12px; color:var(--text-muted); line-height:1.5; max-width:280px; margin:0 auto 14px;">
              Share your invite link with your Telegram friends! Once they join, they will appear right here on your squad leaderboard.
            </p>
            <button class="btn-primary" style="padding:10px 22px; font-size:13px; font-weight:700;" onclick="navigateTo('frens')">
              <i class="fa-solid fa-paper-plane"></i> Invite Friends (+50 ⭐)
            </button>
          </div>
        `;
      } else if (tab === "referrals" && list.every(u => !u.referral_count)) {
        container.innerHTML = `
          <div style="text-align:center; padding: 24px 14px; background:var(--bg-card); border:1px dashed var(--border-glass); border-radius:var(--radius-lg); margin-top:8px;">
            <i class="fa-solid fa-trophy" style="font-size:32px; color:var(--accent-gold); margin-bottom:10px;"></i>
            <h4 style="font-size:15px; color:var(--text-main); margin-bottom:4px;">Be the #1 Top Referrer!</h4>
            <p style="font-size:12px; color:var(--text-muted); line-height:1.5; max-width:280px; margin:0 auto 14px;">
              Invite friends to the Spider Web Network to earn +50 Stars each and claim the top referral spot!
            </p>
            <button class="btn-primary" style="padding:10px 22px; font-size:13px; font-weight:700;" onclick="navigateTo('frens')">
              <i class="fa-solid fa-share-nodes"></i> Share Invite Link
            </button>
          </div>
        `;
      } else {
        container.innerHTML = `
          <div style="text-align:center; padding: 22px 14px; color:var(--text-muted); font-size:13px;">
            <p>No additional players in this ranking.</p>
            <p style="font-size:12px; margin-top:4px;">Invite your friends to compete with you on the leaderboard!</p>
          </div>
        `;
      }
    } else {
      container.innerHTML = ranks.map((u, i) => {
        const rankNum = i + 4;
        const isSelf = (u.username && u.username === currentUser?.username) || 
                       (u.tg_id && u.tg_id === currentUser?.tg_id) || 
                       (u.id && u.id === currentUser?.id);
        const rawUsername = u.username ? `@${u.username}` : (u.first_name || "Player");
        const avatarSrc = u.avatar_url 
          || (u.tg_id && String(u.tg_id) !== "spidermaster_local" ? `/avatars/${u.tg_id}.jpg` : '')
          || '/assets/spider_avatar.jpg';

        const scoreDisplay = tab === "referrals"
          ? `<div style="text-align:right;">
               <span class="rank-xp-val text-gold" style="display:block;"><i class="fa-solid fa-users"></i> ${u.referral_count || 0} Frens</span>
               <span style="font-size:10px; color:var(--text-muted);">${Number(u.points || 0).toLocaleString()} XP</span>
             </div>`
          : `<span class="rank-xp-val">${Number(u.points || 0).toLocaleString()} XP</span>`;

        return `
          <div class="rank-item-card ${isSelf ? 'highlight-self' : ''}">
            <div class="rank-item-left">
              <span class="rank-index">#${rankNum}</span>
              <img src="${avatarSrc}" alt="" class="rank-item-avatar" onerror="this.onerror=null; this.src='/assets/spider_avatar.jpg';" />
              <div style="display:flex; flex-direction:column;">
                <span class="rank-username">
                  ${escapeHTML(rawUsername)}${isSelf ? '<span class="badge-self-pill">YOU</span>' : ''}
                </span>
                ${u.first_name && u.username ? `<span style="font-size:11px; color:var(--text-muted);">${escapeHTML(u.first_name)}</span>` : ''}
              </div>
            </div>
            ${scoreDisplay}
          </div>
        `;
      }).join("");
    }
  } catch (e) {
    console.warn("Leaderboard error:", e);
  }
}

// ======================== UTILITIES & MODAL ========================
function openModal(title, htmlContent) {
  $("#modalTitle").textContent = title;
  $("#modalBody").innerHTML = htmlContent;
  $("#genericModal").classList.add("open");
}

function setupModals() {
  $("#modalCloseBtn").onclick = () => {
    $("#genericModal").classList.remove("open");
  };
  $("#genericModal").onclick = (e) => {
    if (e.target === $("#genericModal")) {
      $("#genericModal").classList.remove("open");
    }
  };

  $("#notifBtn").onclick = () => {
    openModal("Network Announcements 📢", `
      <div style="font-size:13px; line-height:1.6; padding:10px 0;">
        <div style="margin-bottom:12px; padding-bottom:10px; border-bottom:1px solid var(--border-light);">
          <strong style="color:var(--primary-light);">Season 1 Launch Event</strong>
          <p style="color:var(--text-muted); font-size:12px; margin-top:3px;">Earn 2x XP this weekend by playing Spider Tic-Tac-Toe and completing missions!</p>
        </div>
        <div>
          <strong style="color:var(--accent-gold);">TON Blockchain Wallet Connect</strong>
          <p style="color:var(--text-muted); font-size:12px; margin-top:3px;">Link your non-custodial wallet to receive instant airdrop eligibility.</p>
        </div>
      </div>
    `);
  };

  $("#menuRewardHistBtn").onclick = () => {
    $("#viewTxHistoryBtn")?.click();
  };

  $("#menuSettingsBtn").onclick = () => {
    openModal("Settings ⚙️", `
      <div style="font-size:14px; padding:10px 0;">
        <div style="display:flex; justify-content:space-between; padding:10px 0; border-bottom:1px solid var(--border-light);">
          <span>Sound Effects</span>
          <b style="color:var(--accent-green);">ON</b>
        </div>
        <div style="display:flex; justify-content:space-between; padding:10px 0; border-bottom:1px solid var(--border-light);">
          <span>Haptic Feedback</span>
          <b style="color:var(--accent-green);">ENABLED</b>
        </div>
        <div style="display:flex; justify-content:space-between; padding:10px 0; border-bottom:1px solid var(--border-light);">
          <span>Telegram Sync</span>
          <b style="color:var(--primary-light);">ACTIVE</b>
        </div>
        <div style="margin-top:16px;">
          <button class="btn-danger-sm" id="btnResetAccountModal" style="width:100%; padding:12px; font-weight:700; cursor:pointer;">
            <i class="fa-solid fa-rotate-left"></i> Reset Account Data to 0
          </button>
        </div>
      </div>
    `);

    setTimeout(() => {
      const resetBtn = document.querySelector("#btnResetAccountModal");
      if (resetBtn) {
        resetBtn.onclick = async () => {
          if (confirm("Reset your account XP, stars, streak and progress back to 0?")) {
            try {
              const res = await api("/api/user/reset", { method: "POST" });
              currentUser = res.user;
              syncHomeUI();
              syncProfileUI();
              $("#genericModal").classList.remove("open");
              alert("Your account has been reset to 0!");
            } catch (e) {
              alert(e.message);
            }
          }
        };
      }
    }, 50);
  };
}

function copyText(str) {
  triggerHaptic("success");
  navigator.clipboard.writeText(str).then(() => {
    openModal("Copied!", `<p style="text-align:center; padding:15px; color:var(--accent-green); font-weight:700;">${t("copySuccess")}</p>`);
    setTimeout(() => $("#genericModal").classList.remove("open"), 1200);
  });
}

function escapeHTML(str) {
  return String(str ?? "").replace(/[&<>"']/g, m => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
  }[m]));
}

// Start App
document.addEventListener("DOMContentLoaded", initApp);