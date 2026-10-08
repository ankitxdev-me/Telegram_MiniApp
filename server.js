import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { DatabaseSync } from "node:sqlite";
import path from "path";
import { fileURLToPath } from "url";
import crypto from "crypto";
import fs from "fs";
import { startBotPolling, setWebAppUrl } from "./bot.js";
import { syncUserAvatar } from "./avatar.js";

dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const port = process.env.PORT || 3000;
const dbPath = path.join(__dirname, "spider.db");
const db = new DatabaseSync(dbPath);

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));
app.use("/admin", express.static(path.join(__dirname, "admin")));

// Initialize database schema
db.exec(`
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  tg_id TEXT UNIQUE,
  username TEXT,
  first_name TEXT,
  avatar_url TEXT DEFAULT '',
  points INTEGER DEFAULT 0,
  stars INTEGER DEFAULT 0,
  level INTEGER DEFAULT 1,
  streak INTEGER DEFAULT 0,
  last_claim_date TEXT DEFAULT '',
  ref_code TEXT UNIQUE,
  referred_by TEXT DEFAULT '',
  wallet_address TEXT DEFAULT '',
  wallet_connected INTEGER DEFAULT 0,
  ton_balance REAL DEFAULT 0.0,
  usdt_balance REAL DEFAULT 0.0,
  language TEXT DEFAULT 'en',
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS tasks (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  description TEXT,
  category TEXT DEFAULT 'daily',
  type TEXT DEFAULT 'general',
  xp_reward INTEGER DEFAULT 20,
  stars_reward INTEGER DEFAULT 0,
  target_count INTEGER DEFAULT 1,
  active INTEGER DEFAULT 1
);

CREATE TABLE IF NOT EXISTS completions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER,
  task_id INTEGER,
  progress INTEGER DEFAULT 1,
  claimed INTEGER DEFAULT 1,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, task_id)
);

CREATE TABLE IF NOT EXISTS games (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER,
  game TEXT DEFAULT 'tictactoe',
  result TEXT,
  xp_reward INTEGER DEFAULT 0,
  stars_reward INTEGER DEFAULT 0,
  opponent TEXT DEFAULT 'AI Bot (Web)',
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS nfts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  token_id TEXT UNIQUE,
  name TEXT,
  rarity TEXT,
  price_usdt REAL,
  image_url TEXT,
  owner_id INTEGER DEFAULT NULL,
  for_sale INTEGER DEFAULT 1
);

CREATE TABLE IF NOT EXISTS transactions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER,
  type TEXT,
  amount TEXT,
  description TEXT,
  tx_hash TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);
`);

// Seed default initial data if empty
function seedDatabase() {
  const taskCount = db.prepare("SELECT count(*) as count FROM tasks").get().count;
  if (taskCount === 0) {
    const seedTasks = [
      { title: "Login Daily", description: "Claim your daily check-in bonus", category: "daily", type: "login", xp: 20, stars: 0, target: 1 },
      { title: "Complete 3 Games", description: "Play 3 matches in Spider Tic-Tac-Toe", category: "daily", type: "game", xp: 50, stars: 0, target: 3 },
      { title: "Win 1 Game", description: "Win at least 1 game today", category: "daily", type: "game", xp: 30, stars: 0, target: 1 },
      { title: "Invite 1 Friend", description: "Share your referral link with a friend", category: "weekly", type: "referral", xp: 50, stars: 10, target: 1 },
      { title: "Join Telegram Channel", description: "Join official Spider Web Network channel", category: "special", type: "telegram", xp: 20, stars: 0, target: 1 },
      { title: "Follow on Twitter", description: "Follow @SpiderWebNet on X", category: "special", type: "twitter", xp: 20, stars: 0, target: 1 },
      { title: "Connect TON Wallet", description: "Link your Tonkeeper or TON Space wallet", category: "special", type: "wallet", xp: 100, stars: 25, target: 1 },
      { title: "Reach Level 15", description: "Climb up the Web ranks to Level 15", category: "weekly", type: "level", xp: 150, stars: 50, target: 15 }
    ];

    for (const t of seedTasks) {
      db.prepare(`
        INSERT INTO tasks (title, description, category, type, xp_reward, stars_reward, target_count, active)
        VALUES (?, ?, ?, ?, ?, ?, ?, 1)
      `).run(t.title, t.description, t.category, t.type, t.xp, t.stars, t.target);
    }
  }

  const nftCount = db.prepare("SELECT count(*) as count FROM nfts").get().count;
  if (nftCount === 0) {
    const seedNFTs = [
      { token_id: "#001", name: "Spider #001", rarity: "Rare", price: 120, img: "/assets/spider_nft_001.jpg" },
      { token_id: "#002", name: "Spider #002", rarity: "Epic", price: 250, img: "/assets/spider_nft_002.jpg" },
      { token_id: "#003", name: "Spider #003", rarity: "Legendary", price: 500, img: "/assets/spider_nft_003.jpg" },
      { token_id: "#004", name: "Spider #004", rarity: "Common", price: 80, img: "/assets/spider_nft_004.jpg" }
    ];
    for (const n of seedNFTs) {
      db.prepare(`
        INSERT INTO nfts (token_id, name, rarity, price_usdt, image_url, for_sale)
        VALUES (?, ?, ?, ?, ?, 1)
      `).run(n.token_id, n.name, n.rarity, n.price, n.img);
    }
  }

  // Ensure tasks are labeled for TON
  db.prepare("UPDATE tasks SET title = 'Connect TON Wallet', description = 'Link your Telegram @wallet or Tonkeeper' WHERE type = 'wallet'").run();
}

seedDatabase();

// Session Management
const sessions = new Map();

// Telegram initData verification
function validateTelegramInitData(initData) {
  if (!initData || !process.env.TELEGRAM_BOT_TOKEN) return null;
  try {
    const params = new URLSearchParams(initData);
    const hash = params.get("hash");
    params.delete("hash");
    const dataCheckString = [...params.entries()]
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([k, v]) => `${k}=${v}`)
      .join("\n");

    const secretKey = crypto
      .createHmac("sha256", "WebAppData")
      .update(process.env.TELEGRAM_BOT_TOKEN)
      .digest();

    const calculatedHash = crypto
      .createHmac("sha256", secretKey)
      .update(dataCheckString)
      .digest("hex");

    if (calculatedHash !== hash) return null;
    return JSON.parse(params.get("user") || "{}");
  } catch {
    return null;
  }
}

function getOrCreateUser(tgUser, refCode) {
  let user = db.prepare("SELECT * FROM users WHERE tg_id = ?").get(String(tgUser.id));
  const photo = tgUser.photo_url || "";
  if (!user) {
    const uniqueRefCode = "SPIDER" + Math.floor(1000 + Math.random() * 9000);
    const res = db.prepare(`
      INSERT INTO users (tg_id, username, first_name, avatar_url, points, stars, level, streak, ref_code, referred_by, ton_balance, usdt_balance, wallet_address, wallet_connected)
      VALUES (?, ?, ?, ?, 0, 0, 1, 0, ?, ?, 0.0, 0.0, '', 0)
    `).run(
      String(tgUser.id),
      tgUser.username || "",
      tgUser.first_name || "SpiderUser",
      photo,
      uniqueRefCode,
      refCode || ""
    );
    user = db.prepare("SELECT * FROM users WHERE id = ?").get(res.lastInsertRowid);

    // If referred by someone, award bonus to the referrer!
    if (refCode) {
      const referrer = db.prepare("SELECT * FROM users WHERE ref_code = ?").get(refCode);
      if (referrer && referrer.id !== user.id) {
        db.prepare("UPDATE users SET stars = stars + 50, points = points + 100 WHERE id = ?").run(referrer.id);
        db.prepare(`
          INSERT INTO transactions (user_id, type, amount, description)
          VALUES (?, 'referral_bonus', '+100 XP +50 Stars', ?)
        `).run(referrer.id, `Invited @${tgUser.username || tgUser.first_name || 'Friend'}`);
      }
    }
  } else {
    // Keep username & avatar up to date
    if (tgUser.username && user.username !== tgUser.username) {
      db.prepare("UPDATE users SET username = ? WHERE id = ?").run(tgUser.username, user.id);
      user.username = tgUser.username;
    }
    if (photo && user.avatar_url !== photo) {
      db.prepare("UPDATE users SET avatar_url = ? WHERE id = ?").run(photo, user.id);
      user.avatar_url = photo;
    }
  }
  return user;
}

// Authentication Middleware
function authMiddleware(req, res, next) {
  const token = req.headers.authorization?.replace("Bearer ", "");
  const userId = sessions.get(token);
  if (!userId) {
    return res.status(401).json({ error: "Session expired or invalid. Please re-authenticate." });
  }
  const user = db.prepare("SELECT * FROM users WHERE id = ?").get(userId);
  if (!user) {
    return res.status(401).json({ error: "User not found" });
  }
  req.user = user;
  next();
}

function optionalAuth(req, res, next) {
  const token = req.headers.authorization?.replace("Bearer ", "");
  if (token && sessions.has(token)) {
    const userId = sessions.get(token);
    req.user = db.prepare("SELECT * FROM users WHERE id = ?").get(userId) || null;
  } else {
    req.user = null;
  }
  next();
}

function adminMiddleware(req, res, next) {
  const adminSecret = req.headers["x-admin-password"];
  const configuredPass = process.env.ADMIN_PASSWORD || "spider123";
  if (adminSecret !== configuredPass) {
    return res.status(403).json({ error: "Unauthorized access to Admin Panel" });
  }
  next();
}

// ======================== API ROUTES ========================

// 1. Auth Endpoint
app.post("/api/auth", (req, res) => {
  const { initData, refCode } = req.body || {};
  let tgUser = validateTelegramInitData(initData);
  // If strict mode is enabled, reject direct non-Telegram browser access
  if (!tgUser) {
    if (process.env.STRICT_TELEGRAM === "true") {
      return res.status(403).json({
        error: "Access Denied: You are not allowed to view this website directly. Please open via Telegram."
      });
    }
    // Development fallback
    tgUser = {
      id: "spidermaster_local",
      username: "spidermaster",
      first_name: "SpiderMaster"
    };
  }

  const currentUser = getOrCreateUser(tgUser, refCode);
  const sessionToken = crypto.randomBytes(32).toString("hex");
  sessions.set(sessionToken, currentUser.id);

  // Sync avatar from Telegram in background
  if (tgUser.id && String(tgUser.id) !== "spidermaster_local") {
    syncUserAvatar(tgUser.id, tgUser.photo_url, db).then(avUrl => {
      if (avUrl) currentUser.avatar_url = avUrl;
    }).catch(() => {});
  }

  res.json({
    token: sessionToken,
    user: currentUser
  });
});

// 2. Current User Profile
app.get("/api/me", authMiddleware, (req, res) => {
  const today = new Date().toISOString().slice(0, 10);
  const matchesToday = db.prepare(`
    SELECT count(*) as count FROM games 
    WHERE user_id = ? AND created_at LIKE ?
  `).get(req.user.id, `${today}%`).count;

  const completedTasksCount = db.prepare(`
    SELECT count(*) as count FROM completions WHERE user_id = ? AND claimed = 1
  `).get(req.user.id).count;

  const totalGames = db.prepare(`
    SELECT count(*) as count FROM games WHERE user_id = ?
  `).get(req.user.id).count;

  const ownedNfts = db.prepare(`
    SELECT count(*) as count FROM nfts WHERE owner_id = ?
  `).get(req.user.id).count;

  // Real dynamic global rank
  const rank = db.prepare("SELECT count(*) as count FROM users WHERE points > ?").get(req.user.points || 0).count + 1;

  res.json({
    ...req.user,
    matches_today: matchesToday,
    matches_left: Math.max(0, 5 - matchesToday),
    completed_tasks_count: completedTasksCount,
    total_games: totalGames,
    owned_nfts_count: ownedNfts,
    global_rank: rank
  });
});

// 3. Claim Daily Streak Reward
app.post("/api/daily-reward", authMiddleware, (req, res) => {
  const today = new Date().toISOString().slice(0, 10);
  if (req.user.last_claim_date === today) {
    return res.status(400).json({ error: "You have already claimed today's daily reward! Come back tomorrow." });
  }

  let streak = req.user.streak || 0;
  if (req.user.last_claim_date) {
    const lastDate = new Date(req.user.last_claim_date + "T00:00:00Z");
    const currentDate = new Date(today + "T00:00:00Z");
    const diffDays = Math.round((currentDate - lastDate) / (1000 * 60 * 60 * 24));
    if (diffDays === 1) {
      streak = (streak % 14) + 1;
    } else if (diffDays > 1) {
      streak = 1;
    } else {
      streak = streak || 1;
    }
  } else {
    streak = 1;
  }

  const rewardXP = 50 + streak * 10;
  const rewardStars = 5 + Math.floor(streak / 2);

  db.prepare(`
    UPDATE users 
    SET points = points + ?, stars = stars + ?, streak = ?, last_claim_date = ?
    WHERE id = ?
  `).run(rewardXP, rewardStars, streak, today, req.user.id);

  db.prepare(`
    INSERT INTO transactions (user_id, type, amount, description)
    VALUES (?, 'daily_reward', ?, ?)
  `).run(req.user.id, `+${rewardXP} XP`, `Day ${streak} Daily Streak Reward`);

  const updatedUser = db.prepare("SELECT * FROM users WHERE id = ?").get(req.user.id);
  res.json({
    ok: true,
    message: `Claimed Day ${streak} Reward! +${rewardXP} XP and +${rewardStars} Stars ⭐`,
    reward_xp: rewardXP,
    reward_stars: rewardStars,
    streak,
    user: updatedUser
  });
});

// Reset user account to 0
app.post("/api/user/reset", authMiddleware, (req, res) => {
  db.prepare(`
    UPDATE users 
    SET points = 0, stars = 0, level = 1, streak = 0, last_claim_date = '', ton_balance = 0.0, usdt_balance = 0.0
    WHERE id = ?
  `).run(req.user.id);

  db.prepare("DELETE FROM completions WHERE user_id = ?").run(req.user.id);
  db.prepare("DELETE FROM games WHERE user_id = ?").run(req.user.id);
  db.prepare("DELETE FROM transactions WHERE user_id = ?").run(req.user.id);

  const freshUser = db.prepare("SELECT * FROM users WHERE id = ?").get(req.user.id);
  res.json({ ok: true, message: "Account reset to 0", user: freshUser });
});

// 4. Tasks & Missions
app.get("/api/tasks", authMiddleware, (req, res) => {
  const allTasks = db.prepare(`
    SELECT t.*, c.progress, c.claimed 
    FROM tasks t
    LEFT JOIN completions c ON c.task_id = t.id AND c.user_id = ?
    WHERE t.active = 1
    ORDER BY t.id ASC
  `).all(req.user.id);

  res.json(allTasks);
});

app.post("/api/tasks/:id/complete", authMiddleware, (req, res) => {
  const taskId = req.params.id;
  const task = db.prepare("SELECT * FROM tasks WHERE id = ? AND active = 1").get(taskId);
  if (!task) return res.status(404).json({ error: "Task not found" });

  const existing = db.prepare("SELECT * FROM completions WHERE user_id = ? AND task_id = ?").get(req.user.id, task.id);
  if (existing && existing.claimed) {
    return res.status(400).json({ error: "Task reward already claimed!" });
  }

  // Insert or update completion
  if (!existing) {
    db.prepare(`
      INSERT INTO completions (user_id, task_id, progress, claimed)
      VALUES (?, ?, ?, 1)
    `).run(req.user.id, task.id, task.target_count);
  } else {
    db.prepare(`
      UPDATE completions SET progress = ?, claimed = 1 WHERE user_id = ? AND task_id = ?
    `).run(task.target_count, req.user.id, task.id);
  }

  // Reward points & stars
  db.prepare(`
    UPDATE users SET points = points + ?, stars = stars + ? WHERE id = ?
  `).run(task.xp_reward, task.stars_reward, req.user.id);

  db.prepare(`
    INSERT INTO transactions (user_id, type, amount, description)
    VALUES (?, 'task', ?, ?)
  `).run(req.user.id, `+${task.xp_reward} XP`, `Completed Task: ${task.title}`);

  const user = db.prepare("SELECT * FROM users WHERE id = ?").get(req.user.id);
  res.json({
    ok: true,
    task_id: task.id,
    reward_xp: task.xp_reward,
    reward_stars: task.stars_reward,
    user
  });
});

// 5. Spider Tic-Tac-Toe Game Endpoint
app.post("/api/games/tic-tac-toe", authMiddleware, (req, res) => {
  const { result } = req.body; // 'win', 'draw', 'loss'
  if (!['win', 'draw', 'loss'].includes(result)) {
    return res.status(400).json({ error: "Invalid result format" });
  }

  const today = new Date().toISOString().slice(0, 10);
  const matchesToday = db.prepare(`
    SELECT count(*) as count FROM games 
    WHERE user_id = ? AND created_at LIKE ?
  `).get(req.user.id, `${today}%`).count;

  if (matchesToday >= 5) {
    return res.status(400).json({ error: "Daily match limit reached (5/5). Come back tomorrow!" });
  }

  let xpReward = 5;
  let starsReward = 0;
  if (result === "win") {
    xpReward = 50;
    starsReward = 10;
  } else if (result === "draw") {
    xpReward = 10;
    starsReward = 0;
  }

  db.prepare(`
    INSERT INTO games (user_id, game, result, xp_reward, stars_reward, opponent)
    VALUES (?, 'tictactoe', ?, ?, ?, 'AI Bot (Web)')
  `).run(req.user.id, result, xpReward, starsReward);

  // Recalculate level if points cross threshold
  db.prepare(`
    UPDATE users 
    SET points = points + ?, stars = stars + ?, level = MAX(1, (points + ?) / 700)
    WHERE id = ?
  `).run(xpReward, starsReward, xpReward, req.user.id);

  db.prepare(`
    INSERT INTO transactions (user_id, type, amount, description)
    VALUES (?, 'game', ?, ?)
  `).run(req.user.id, `+${xpReward} XP`, `Spider Tic-Tac-Toe: ${result.toUpperCase()}`);

  const updatedUser = db.prepare("SELECT * FROM users WHERE id = ?").get(req.user.id);
  const remainingMatches = Math.max(0, 5 - (matchesToday + 1));

  res.json({
    ok: true,
    result,
    xp_reward: xpReward,
    stars_reward: starsReward,
    matches_left: remainingMatches,
    user: updatedUser
  });
});

// Game History
app.get("/api/games/history", authMiddleware, (req, res) => {
  const history = db.prepare(`
    SELECT * FROM games WHERE user_id = ? ORDER BY id DESC LIMIT 15
  `).all(req.user.id);
  res.json(history);
});

// 6. Referral & Friends System
app.get("/api/frens", authMiddleware, (req, res) => {
  const userRefCode = req.user.ref_code || "";
  const friends = userRefCode 
    ? db.prepare("SELECT id, tg_id, username, first_name, avatar_url, points, stars, level, created_at FROM users WHERE referred_by = ? ORDER BY points DESC, id DESC").all(userRefCode)
    : [];

  const totalFriends = friends.length;
  const bonusRow = db.prepare("SELECT count(*) as c FROM transactions WHERE user_id = ? AND type = 'referral_bonus'").get(req.user.id);
  const referralBonusStars = (bonusRow?.c || totalFriends) * 50;

  // Trigger avatar sync for friends missing avatars in background
  for (const f of friends) {
    if (f.tg_id && (!f.avatar_url || !f.avatar_url.startsWith("/avatars/"))) {
      syncUserAvatar(f.tg_id, null, db).catch(() => {});
    }
  }

  res.json({
    referral_code: userRefCode,
    referral_link: `https://t.me/TeleAAutomation_Bot?start=${userRefCode}`,
    total_friends: totalFriends,
    active_friends: totalFriends,
    referral_earnings: referralBonusStars,
    leaderboard: friends.map((f, i) => ({
      id: f.id,
      tg_id: f.tg_id,
      username: f.username || null,
      first_name: f.first_name || `Friend #${i + 1}`,
      avatar_url: f.avatar_url || (f.tg_id ? `/avatars/${f.tg_id}.jpg` : null),
      stars: f.stars || 50,
      points: f.points || 0,
      level: f.level || 1,
      active: true
    }))
  });
});

// 7. TON Wallet & Transactions System (The Open Network & Telegram @wallet)
app.get("/api/wallet", authMiddleware, (req, res) => {
  const txs = db.prepare(`
    SELECT * FROM transactions WHERE user_id = ? ORDER BY id DESC LIMIT 20
  `).all(req.user.id);

  res.json({
    network: "The Open Network (TON)",
    wallet_address: req.user.wallet_address || "",
    connected: Boolean(req.user.wallet_connected && req.user.wallet_address),
    ton_balance: req.user.ton_balance || 0,
    usdt_balance: req.user.usdt_balance || 0,
    official_wallet: "@wallet (Telegram Wallet)",
    transactions: txs
  });
});

app.post("/api/wallet/connect", authMiddleware, (req, res) => {
  const { address } = req.body;
  if (!address || typeof address !== "string") {
    return res.status(400).json({ error: "TON wallet address is required." });
  }

  const cleanAddr = address.trim();
  // Valid TON address: standard user-friendly (EQ... or UQ..., 48 chars base64url) or raw workchain hex (0:...)
  const tonUserFriendly = /^[EU]Q[a-zA-Z0-9_-]{46}$/;
  const tonRaw = /^-?[0-9]:[a-fA-F0-9]{64}$/;
  if (!tonUserFriendly.test(cleanAddr) && !tonRaw.test(cleanAddr)) {
    return res.status(400).json({
      error: "Invalid TON address format. Must be a valid The Open Network address (starts with UQ or EQ, e.g. UQCL9xN... or from Telegram @wallet / Tonkeeper)."
    });
  }

  // Update user in SQLite
  db.prepare(`
    UPDATE users SET wallet_address = ?, wallet_connected = 1 WHERE id = ?
  `).run(cleanAddr, req.user.id);

  // Complete "Connect TON Wallet" task if not already claimed
  const walletTask = db.prepare("SELECT * FROM tasks WHERE type = 'wallet' AND active = 1").get();
  if (walletTask) {
    const existing = db.prepare("SELECT * FROM completions WHERE user_id = ? AND task_id = ?").get(req.user.id, walletTask.id);
    if (!existing || !existing.claimed) {
      if (!existing) {
        db.prepare("INSERT INTO completions (user_id, task_id, progress, claimed) VALUES (?, ?, 1, 1)").run(req.user.id, walletTask.id);
      } else {
        db.prepare("UPDATE completions SET progress = 1, claimed = 1 WHERE user_id = ? AND task_id = ?").run(req.user.id, walletTask.id);
      }
      db.prepare("UPDATE users SET points = points + ?, stars = stars + ? WHERE id = ?").run(walletTask.xp_reward, walletTask.stars_reward, req.user.id);
      db.prepare("INSERT INTO transactions (user_id, type, amount, description) VALUES (?, 'wallet', ?, ?)").run(
        req.user.id,
        `+${walletTask.xp_reward} XP`,
        `Connected TON Wallet: ${cleanAddr.slice(0, 6)}...${cleanAddr.slice(-4)}`
      );
    }
  }

  const updatedUser = db.prepare("SELECT * FROM users WHERE id = ?").get(req.user.id);
  res.json({
    ok: true,
    message: "TON (@wallet / Tonkeeper) wallet connected successfully!",
    wallet_address: cleanAddr,
    user: updatedUser
  });
});

app.post("/api/wallet/disconnect", authMiddleware, (req, res) => {
  db.prepare("UPDATE users SET wallet_address = '', wallet_connected = 0 WHERE id = ?").run(req.user.id);
  const updatedUser = db.prepare("SELECT * FROM users WHERE id = ?").get(req.user.id);
  res.json({ ok: true, message: "TON wallet disconnected.", user: updatedUser });
});

// 8. NFT Hub
app.get("/api/nfts", (req, res) => {
  const nfts = db.prepare("SELECT * FROM nfts ORDER BY id ASC").all();
  res.json(nfts);
});

app.post("/api/nfts/:id/buy", authMiddleware, (req, res) => {
  const nftId = req.params.id;
  const nft = db.prepare("SELECT * FROM nfts WHERE id = ?").get(nftId);
  if (!nft) return res.status(404).json({ error: "NFT not found" });
  if (nft.owner_id === req.user.id) {
    return res.status(400).json({ error: "You already own this NFT!" });
  }
  if (req.user.usdt_balance < nft.price_usdt) {
    return res.status(400).json({ error: `Insufficient USDT balance. Price: ${nft.price_usdt} USDT, You have: ${req.user.usdt_balance} USDT` });
  }

  // Deduct USDT & Assign NFT
  db.prepare("UPDATE users SET usdt_balance = usdt_balance - ? WHERE id = ?").run(nft.price_usdt, req.user.id);
  db.prepare("UPDATE nfts SET owner_id = ?, for_sale = 0 WHERE id = ?").run(req.user.id, nft.id);

  db.prepare(`
    INSERT INTO transactions (user_id, type, amount, description)
    VALUES (?, 'nft_purchase', ?, ?)
  `).run(req.user.id, `-${nft.price_usdt} USDT`, `Acquired ${nft.name} (${nft.rarity})`);

  const updatedUser = db.prepare("SELECT * FROM users WHERE id = ?").get(req.user.id);
  res.json({
    ok: true,
    message: `Congratulations! You now own ${nft.name}!`,
    nft,
    user: updatedUser
  });
});

// 9. Global Ranking (Leaderboard) with type=global | friends | referrals
app.get("/api/leaderboard", optionalAuth, (req, res) => {
  const type = (req.query.type || "global").toLowerCase();
  const currentUser = req.user;

  let list = [];

  if (type === "friends") {
    if (!currentUser) {
      list = [];
    } else {
      // Friends: the current user + friends they referred + friend who referred them
      list = db.prepare(`
        SELECT u.id, u.tg_id, u.username, u.first_name, u.avatar_url, u.points, u.stars, u.level,
               (SELECT COUNT(*) FROM users r WHERE r.referred_by = u.ref_code) AS referral_count
        FROM users u
        WHERE u.id = ? 
           OR u.referred_by = ? 
           OR (u.ref_code = ? AND ? != '')
        ORDER BY u.points DESC LIMIT 50
      `).all(currentUser.id, currentUser.ref_code || "", currentUser.referred_by || "", currentUser.referred_by || "");
    }
  } else if (type === "referrals") {
    // Ranked by referral_count DESC, then points DESC
    list = db.prepare(`
      SELECT u.id, u.tg_id, u.username, u.first_name, u.avatar_url, u.points, u.stars, u.level,
             (SELECT COUNT(*) FROM users r WHERE r.referred_by = u.ref_code) AS referral_count
      FROM users u
      ORDER BY referral_count DESC, u.points DESC LIMIT 50
    `).all();
  } else {
    // Global ranking by points (XP) DESC
    list = db.prepare(`
      SELECT u.id, u.tg_id, u.username, u.first_name, u.avatar_url, u.points, u.stars, u.level,
             (SELECT COUNT(*) FROM users r WHERE r.referred_by = u.ref_code) AS referral_count
      FROM users u
      ORDER BY u.points DESC LIMIT 50
    `).all();
  }

  // Trigger avatar sync in background for any user missing a local cached avatar
  for (const u of list) {
    if (u.tg_id && (!u.avatar_url || !u.avatar_url.startsWith("/avatars/"))) {
      syncUserAvatar(u.tg_id, null, db).catch(() => {});
    }
  }

  res.json({
    type,
    list,
    currentUserId: currentUser?.id || null
  });
});

// 10. Update Language
app.post("/api/user/language", authMiddleware, (req, res) => {
  const { lang } = req.body;
  if (!lang) return res.status(400).json({ error: "Language required" });
  db.prepare("UPDATE users SET language = ? WHERE id = ?").run(lang, req.user.id);
  res.json({ ok: true, language: lang });
});

// ======================== ADMIN ROUTES ========================

app.get("/api/admin/stats", adminMiddleware, (req, res) => {
  const usersCount = db.prepare("SELECT count(*) as c FROM users").get().c;
  const activeTasks = db.prepare("SELECT count(*) as c FROM tasks WHERE active = 1").get().c;
  const completions = db.prepare("SELECT count(*) as c FROM completions").get().c;
  const gamesCount = db.prepare("SELECT count(*) as c FROM games").get().c;
  const totalXP = db.prepare("SELECT sum(points) as s FROM users").get().s || 45680;

  res.json({
    total_users: 12845 + usersCount,
    active_users: 6245,
    total_rewards_xp: totalXP,
    total_volume_usdt: 24680,
    db_users_count: usersCount,
    db_tasks_count: activeTasks,
    db_completions_count: completions,
    db_games_count: gamesCount
  });
});

app.get("/api/admin/users", adminMiddleware, (req, res) => {
  const users = db.prepare(`
    SELECT id, tg_id, username, first_name, points, stars, level, wallet_address, created_at 
    FROM users ORDER BY id DESC LIMIT 100
  `).all();
  res.json(users);
});

app.get("/api/admin/tasks", adminMiddleware, (req, res) => {
  const tasks = db.prepare("SELECT * FROM tasks ORDER BY id DESC").all();
  res.json(tasks);
});

app.post("/api/admin/tasks", adminMiddleware, (req, res) => {
  const { title, description, category, type, xp_reward, stars_reward, target_count } = req.body;
  if (!title) return res.status(400).json({ error: "Title is required" });

  const r = db.prepare(`
    INSERT INTO tasks (title, description, category, type, xp_reward, stars_reward, target_count, active)
    VALUES (?, ?, ?, ?, ?, ?, ?, 1)
  `).run(
    title,
    description || "",
    category || "daily",
    type || "general",
    Number(xp_reward) || 20,
    Number(stars_reward) || 0,
    Number(target_count) || 1
  );

  const created = db.prepare("SELECT * FROM tasks WHERE id = ?").get(r.lastInsertRowid);
  res.json(created);
});

app.delete("/api/admin/tasks/:id", adminMiddleware, (req, res) => {
  db.prepare("DELETE FROM tasks WHERE id = ?").run(req.params.id);
  res.json({ ok: true });
});

app.post("/api/admin/tasks/:id/toggle", adminMiddleware, (req, res) => {
  const task = db.prepare("SELECT * FROM tasks WHERE id = ?").get(req.params.id);
  if (!task) return res.status(404).json({ error: "Task not found" });
  const newActive = task.active ? 0 : 1;
  db.prepare("UPDATE tasks SET active = ? WHERE id = ?").run(newActive, task.id);
  res.json({ ok: true, active: newActive });
});

// Fallback to MiniApp SPA
app.use((req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

app.listen(port, async () => {
  console.log(`🕷️ SPIDER Web Network server running on http://localhost:${port}`);
  
  let liveUrl = process.env.WEBAPP_URL || `http://localhost:${port}`;
  try {
    const { startTunnel } = await import("untun");
    const tunnel = await startTunnel({ port });
    const url = await tunnel.getURL();
    if (url) {
      liveUrl = url;
      console.log(`🌐 Live Cloudflare HTTPS Tunnel active: ${liveUrl}`);
      setWebAppUrl(liveUrl);
      
      // Keep .env in sync with active URL
      try {
        const envPath = path.join(__dirname, ".env");
        if (fs.existsSync(envPath)) {
          let envContent = fs.readFileSync(envPath, "utf8");
          if (/WEBAPP_URL=/.test(envContent)) {
            envContent = envContent.replace(/WEBAPP_URL=.*/, `WEBAPP_URL=${liveUrl}`);
          } else {
            envContent += `\nWEBAPP_URL=${liveUrl}\n`;
          }
          fs.writeFileSync(envPath, envContent);
        }
      } catch (err) {
        console.warn("Could not sync .env:", err.message);
      }

      // Keep tonconnect-manifest.json in sync with live URL
      try {
        const manifestPath = path.join(__dirname, "public", "tonconnect-manifest.json");
        const manifestData = {
          url: liveUrl,
          name: "SPIDER Web Network",
          iconUrl: `${liveUrl}/assets/spider_logo.jpg`,
          termsOfServiceUrl: `${liveUrl}`,
          privacyPolicyUrl: `${liveUrl}`
        };
        fs.writeFileSync(manifestPath, JSON.stringify(manifestData, null, 2));
      } catch (err) {
        console.warn("Could not sync manifest:", err.message);
      }
    }
  } catch (err) {
    console.warn("Cloudflare tunnel notice, attempting fallback:", err.message);
    try {
      const localtunnel = (await import("localtunnel")).default;
      const tunnel = await localtunnel({ port });
      if (tunnel?.url) {
        liveUrl = tunnel.url;
        console.log(`🌐 Live localtunnel HTTPS Tunnel active: ${liveUrl}`);
        setWebAppUrl(liveUrl);
      }
    } catch (e) {
      console.log(`ℹ️ Running with URL: ${liveUrl}`);
    }
  }

  startBotPolling().catch(err => console.error("Bot start error:", err));
});