import dotenv from "dotenv";
import { DatabaseSync } from "node:sqlite";
import path from "path";
import { fileURLToPath } from "url";
import { syncUserAvatar } from "./avatar.js";

dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dbPath = path.join(__dirname, "spider.db");
const db = new DatabaseSync(dbPath);

let activeWebAppUrl = process.env.WEBAPP_URL || "http://localhost:3000";

export function setWebAppUrl(url) {
  if (url) activeWebAppUrl = url;
}

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const API_BASE = `https://api.telegram.org/bot${BOT_TOKEN}`;

async function tgCall(method, payload = {}) {
  try {
    const res = await fetch(`${API_BASE}/${method}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    const data = await res.json();
    return data;
  } catch (err) {
    console.error(`Telegram API error on ${method}:`, err.message);
    return { ok: false, error: err.message };
  }
}

// Set up Bot Menu Button (bottom-left "Open" button in chat)
export async function setupBotMenu() {
  if (!BOT_TOKEN) return;
  console.log(`🤖 Configuring Telegram Bot Menu Button pointing to: ${activeWebAppUrl}`);
  
  if (activeWebAppUrl.startsWith("https://")) {
    const res = await tgCall("setChatMenuButton", {
      menu_button: {
        type: "web_app",
        text: "Open",
        web_app: { url: activeWebAppUrl }
      }
    });
    console.log("✅ Chat Menu Button 'Open' configured:", res.ok ? "Success" : res.description);
  } else {
    console.log("ℹ️ WebApp URL is not HTTPS. Telegram requires HTTPS for WebApp menu buttons.");
  }

  // Register commands
  await tgCall("setMyCommands", {
    commands: [
      { command: "start", description: "Launch Spider Web Network & Menu" },
      { command: "play", description: "Play Spider Tic-Tac-Toe & Earn" },
      { command: "wallet", description: "Connect Telegram TON Wallet (@wallet)" },
      { command: "profile", description: "View your Spider XP & Web Level" },
      { command: "rank", description: "Check Global Leaderboard Rankings" },
      { command: "help", description: "How to play and earn rewards" }
    ]
  });
}

// User registration / retrieval in spider.db
function getOrCreateBotUser(tgUser, refCode) {
  let user = db.prepare("SELECT * FROM users WHERE tg_id = ?").get(String(tgUser.id));
  if (!user) {
    const uniqueRefCode = "SPIDER" + Math.floor(1000 + Math.random() * 9000);
    const res = db.prepare(`
      INSERT INTO users (tg_id, username, first_name, points, stars, level, streak, ref_code, referred_by)
      VALUES (?, ?, ?, 0, 0, 1, 0, ?, ?)
    `).run(
      String(tgUser.id),
      tgUser.username || "",
      tgUser.first_name || "",
      uniqueRefCode,
      refCode || ""
    );
    user = db.prepare("SELECT * FROM users WHERE id = ?").get(res.lastInsertRowid);

    // If referred by someone, award bonus to the referrer!
    if (refCode) {
      const referrer = db.prepare("SELECT * FROM users WHERE ref_code = ?").get(refCode);
      if (referrer) {
        db.prepare("UPDATE users SET stars = stars + 50, points = points + 100 WHERE id = ?").run(referrer.id);
        db.prepare(`
          INSERT INTO transactions (user_id, type, amount, description)
          VALUES (?, 'referral_bonus', '+100 XP +50 Stars', ?)
        `).run(referrer.id, `Invited @${tgUser.username || tgUser.first_name}`);
      }
    }
  } else if (tgUser.username && user.username !== tgUser.username) {
    db.prepare("UPDATE users SET username = ? WHERE id = ?").run(tgUser.username, user.id);
    user.username = tgUser.username;
  }
  return user;
}

// Generate the rich keyboard (matching screenshot layout)
function buildMainKeyboard() {
  const isHttps = activeWebAppUrl.startsWith("https://");

  const playButton = isHttps
    ? { text: "🚀 PLAY NOW", web_app: { url: activeWebAppUrl } }
    : { text: "🚀 PLAY NOW (Link)", url: activeWebAppUrl };

  const profileButton = isHttps
    ? { text: "👤 Profile", web_app: { url: activeWebAppUrl } }
    : { text: "👤 Profile", callback_data: "cmd_profile" };

  return {
    inline_keyboard: [
      [playButton],
      [
        { text: "🎯 Tasks & Missions", callback_data: "cmd_tasks" },
        { text: "🎮 Games (Tic-Tac-Toe)", callback_data: "cmd_games" }
      ],
      [
        { text: "🏆 Rankings", callback_data: "cmd_rank" },
        { text: "🎁 Daily Claim", callback_data: "cmd_daily" }
      ],
      [
        profileButton,
        { text: "👛 TON Wallet (@wallet)", callback_data: "cmd_wallet" }
      ],
      [
        { text: "📢 Join TG Channel", url: "https://t.me/SpiderWebNetwork_ann" },
        { text: "💬 Join TG Group", url: "https://t.me/SpiderWebNetwork_chat" }
      ],
      [
        { text: "𝕏 Follow our X", url: "https://twitter.com" }
      ]
    ]
  };
}

// Handle Incoming Telegram Message
async function handleMessage(msg) {
  const chatId = msg.chat.id;
  const from = msg.from;
  const text = msg.text || "";

  if (from?.id) {
    syncUserAvatar(from.id, null, db).catch(() => {});
  }

  if (text.startsWith("/start")) {
    const parts = text.split(" ");
    const refCode = parts.length > 1 ? parts[1].replace("ref_", "") : "";
    
    const user = getOrCreateBotUser(from, refCode);

    const welcomeText = 
`🕷️ *SPIDER WEB NETWORK*
_Play • Earn • Connect • Collect_

🕸️ *Web Level:* ${user.level ?? 1}
⭐ *XP Points:* ${Number(user.points ?? 0).toLocaleString()}
🌟 *Stars Balance:* ${Number(user.stars ?? 0).toLocaleString()}
🔥 *14-Day Streak:* Day ${user.streak ?? 0}

🎮 *Spider Tic-Tac-Toe Arena:* Open and challenge the AI to earn daily XP!
💎 *NFT Collectibles:* 4 cyber-spider tiers live on TON.

_Click *PLAY NOW* or the *Open* button below to launch the Mini App!_`;

    await tgCall("sendMessage", {
      chat_id: chatId,
      text: welcomeText,
      parse_mode: "Markdown",
      reply_markup: buildMainKeyboard()
    });
  } else if (text === "/play") {
    await tgCall("sendMessage", {
      chat_id: chatId,
      text: "🕷️ *Ready to earn?* Launch the Spider Mini App now!",
      parse_mode: "Markdown",
      reply_markup: buildMainKeyboard()
    });
  } else if (text === "/profile") {
    sendProfileInfo(chatId, from);
  } else if (text === "/rank") {
    sendRankingInfo(chatId);
  } else if (text.startsWith("/wallet")) {
    const parts = text.trim().split(/\s+/);
    const user = getOrCreateBotUser(from);
    if (parts.length > 1) {
      const candidate = parts[1];
      const res = saveUserTonWallet(user, candidate);
      if (res.ok) {
        await tgCall("sendMessage", {
          chat_id: chatId,
          text: `💎 *TON WALLET CONNECTED!*
━━━━━━━━━━━━━━━━━━━━
💼 *Address:*
\`${res.address}\`

⚡ *Network:* The Open Network (TON)
👛 *Supported:* Telegram @wallet, Tonkeeper, MyTonWallet
⭐ *Bonus Awarded:* +100 XP & +25 Stars Credited!
━━━━━━━━━━━━━━━━━━━━
_Your TON address is linked and synchronized across the Web App!_`,
          parse_mode: "Markdown",
          reply_markup: buildMainKeyboard()
        });
      } else {
        await tgCall("sendMessage", {
          chat_id: chatId,
          text: `⚠️ *Invalid TON Address Format*\n\nTON addresses start with *UQ* or *EQ* and are 48 characters long (or raw format \`0:...\`).\n\n_Example:_\n\`UQAA...k9x\` or \`EQBk...v7z\``,
          parse_mode: "Markdown"
        });
      }
    } else {
      await sendWalletInfo(chatId, from);
    }
  } else if (/^[EU]Q[a-zA-Z0-9_-]{46}$/.test(text.trim()) || /^-?[0-9]:[a-fA-F0-9]{64}$/.test(text.trim())) {
    // Direct pasted TON address
    const user = getOrCreateBotUser(from);
    const res = saveUserTonWallet(user, text.trim());
    if (res.ok) {
      await tgCall("sendMessage", {
        chat_id: chatId,
        text: `💎 *TON WALLET CONNECTED!*
━━━━━━━━━━━━━━━━━━━━
💼 *Address:*
\`${res.address}\`

⚡ *Network:* The Open Network (TON)
👛 *Supported:* Telegram @wallet, Tonkeeper, MyTonWallet
⭐ *Bonus Awarded:* +100 XP & +25 Stars Credited!
━━━━━━━━━━━━━━━━━━━━
_Your official TON wallet is saved in the network!_`,
        parse_mode: "Markdown",
        reply_markup: buildMainKeyboard()
      });
    }
  } else if (text === "/help") {
    await tgCall("sendMessage", {
      chat_id: chatId,
      text: 
`🕷️ *SPIDER WEB NETWORK HELP*

• *Play Games:* Play Spider Tic-Tac-Toe to earn up to +50 XP and +10 Stars per win (5 matches daily).
• *Daily Streak:* Check in every day to advance your 14-day streak and unlock bonus gifts.
• *Frens:* Share your invite link to earn +50 Stars per friend.
• *TON Wallet:* Type \`/wallet\` or send your TON address starting with *UQ* or *EQ* to link your official Telegram @wallet or Tonkeeper.`,
      parse_mode: "Markdown",
      reply_markup: buildMainKeyboard()
    });
  }
}

function saveUserTonWallet(user, rawAddress) {
  const clean = rawAddress.trim();
  const tonRegex = /^[EU]Q[a-zA-Z0-9_-]{46}$/;
  const tonRawRegex = /^-?[0-9]:[a-fA-F0-9]{64}$/;
  if (!tonRegex.test(clean) && !tonRawRegex.test(clean)) return { ok: false };

  db.prepare("UPDATE users SET wallet_address = ?, wallet_connected = 1 WHERE id = ?").run(clean, user.id);

  // Complete wallet task
  const walletTask = db.prepare("SELECT * FROM tasks WHERE type = 'wallet' AND active = 1").get();
  if (walletTask) {
    const existing = db.prepare("SELECT * FROM completions WHERE user_id = ? AND task_id = ?").get(user.id, walletTask.id);
    if (!existing || !existing.claimed) {
      if (!existing) {
        db.prepare("INSERT INTO completions (user_id, task_id, progress, claimed) VALUES (?, ?, 1, 1)").run(user.id, walletTask.id);
      } else {
        db.prepare("UPDATE completions SET progress = 1, claimed = 1 WHERE user_id = ? AND task_id = ?").run(user.id, walletTask.id);
      }
      db.prepare("UPDATE users SET points = points + ?, stars = stars + ? WHERE id = ?").run(walletTask.xp_reward, walletTask.stars_reward, user.id);
      db.prepare("INSERT INTO transactions (user_id, type, amount, description) VALUES (?, 'wallet', ?, ?)").run(
        user.id,
        `+${walletTask.xp_reward} XP`,
        `Connected TON Wallet: ${clean.slice(0, 6)}...${clean.slice(-4)}`
      );
    }
  }

  const updated = db.prepare("SELECT * FROM users WHERE id = ?").get(user.id);
  return { ok: true, user: updated, address: clean };
}

async function sendWalletInfo(chatId, from) {
  const user = getOrCreateBotUser(from);
  if (user.wallet_address) {
    const text = 
`💎 *OFFICIAL TELEGRAM TON WALLET*
━━━━━━━━━━━━━━━━━━━━
✅ *Status:* Connected
💼 *TON Address:*
\`${user.wallet_address}\`

💰 *TON Balance:* *${user.ton_balance || 0} TON*
💵 *USDT (TON Jetton):* *${user.usdt_balance || 0} USD₮*
⚡ *Network:* The Open Network (TON)
👛 *Provider:* Telegram @wallet / Tonkeeper
━━━━━━━━━━━━━━━━━━━━
_To change, reply with a new address or type:_
\`/wallet YOUR_NEW_ADDRESS\``;

    await tgCall("sendMessage", {
      chat_id: chatId,
      text,
      parse_mode: "Markdown",
      reply_markup: {
        inline_keyboard: [
          [
            { text: "✏️ Change Address", callback_data: "cmd_ton_prompt" },
            { text: "❌ Disconnect", callback_data: "cmd_ton_disconnect" }
          ],
          [
            { text: "👛 Open @wallet Bot", url: "https://t.me/wallet" }
          ],
          [
            activeWebAppUrl.startsWith("https://")
              ? { text: "🚀 Open in Mini App", web_app: { url: activeWebAppUrl } }
              : { text: "🚀 Open in Mini App", url: activeWebAppUrl }
          ]
        ]
      }
    });
  } else {
    const text = 
`💎 *CONNECT TELEGRAM TON WALLET*
━━━━━━━━━━━━━━━━━━━━
Link your TON wallet (Telegram's official @wallet or Tonkeeper) to receive network rewards and trade collectibles on TON!

📌 *How to connect:*
1️⃣ Open Telegram's official *@wallet* (@wallet) or Tonkeeper.
2️⃣ Tap *Receive* and copy your TON address (starts with *UQ* or *EQ*).
3️⃣ Send it in this chat, or type:
\`/wallet YOUR_TON_ADDRESS\`

💡 Or open the Mini App and connect directly with 1 tap via *TonConnect*!

🎁 *Reward:* Earn *+100 XP & +25 Stars ⭐* upon connecting!`;

    await tgCall("sendMessage", {
      chat_id: chatId,
      text,
      parse_mode: "Markdown",
      reply_markup: {
        inline_keyboard: [
          [
            { text: "👛 Open Telegram @wallet", url: "https://t.me/wallet" }
          ],
          [
            activeWebAppUrl.startsWith("https://")
              ? { text: "🚀 Connect via TonConnect UI", web_app: { url: activeWebAppUrl } }
              : { text: "🚀 Connect via TonConnect UI", url: activeWebAppUrl }
          ]
        ]
      }
    });
  }
}

// Handle Callback Queries (when buttons are clicked)
async function handleCallbackQuery(cb) {
  const chatId = cb.message.chat.id;
  const data = cb.data;
  const from = cb.from;

  await tgCall("answerCallbackQuery", { callback_query_id: cb.id });

  if (data === "cmd_profile") {
    await sendProfileInfo(chatId, from);
  } else if (data === "cmd_rank") {
    await sendRankingInfo(chatId);
  } else if (data === "cmd_tasks") {
    await tgCall("sendMessage", {
      chat_id: chatId,
      text: `🎯 *Tasks & Missions are live in the Mini App!*\n\n• Login Daily: +20 XP\n• Play 3 Games: +50 XP\n• Invite 1 Friend: +50 XP +10 Stars\n• Connect TON Wallet: +100 XP +25 Stars\n\nLaunch the app to claim your rewards!`,
      parse_mode: "Markdown",
      reply_markup: buildMainKeyboard()
    });
  } else if (data === "cmd_games") {
    await tgCall("sendMessage", {
      chat_id: chatId,
      text: `🎮 *Spider Tic-Tac-Toe*\n\nChallenge the Spider AI on the 3x3 board. Win matches to level up your Web Rank!`,
      parse_mode: "Markdown",
      reply_markup: buildMainKeyboard()
    });
  } else if (data === "cmd_daily") {
    const user = getOrCreateBotUser(from);
    await tgCall("sendMessage", {
      chat_id: chatId,
      text: `🎁 *Daily Streak Status:* Day ${user.streak ?? 0} of 14\n\nLaunch the Mini App to claim today's gift bonus!`,
      parse_mode: "Markdown",
      reply_markup: buildMainKeyboard()
    });
  } else if (data === "cmd_wallet") {
    await sendWalletInfo(chatId, from);
  } else if (data === "cmd_ton_prompt" || data === "cmd_tron_prompt") {
    await tgCall("sendMessage", {
      chat_id: chatId,
      text: `💼 *Send your new TON address*\n\nPlease reply with your TON address (starts with \`UQ\` or \`EQ\`) or send:\n\`/wallet YOUR_TON_ADDRESS\``,
      parse_mode: "Markdown"
    });
  } else if (data === "cmd_ton_disconnect" || data === "cmd_tron_disconnect") {
    const user = getOrCreateBotUser(from);
    db.prepare("UPDATE users SET wallet_address = '', wallet_connected = 0 WHERE id = ?").run(user.id);
    await tgCall("sendMessage", {
      chat_id: chatId,
      text: `❌ *TON Wallet Disconnected*\n\nYour wallet address has been unlinked. You can reconnect anytime by sending a new address or typing \`/wallet\`.`,
      parse_mode: "Markdown",
      reply_markup: buildMainKeyboard()
    });
  }
}

async function sendProfileInfo(chatId, from) {
  const user = getOrCreateBotUser(from);
  const text = 
`👤 *PLAYER PROFILE*
━━━━━━━━━━━━━━━━━━
• *User:* @${user.username || user.first_name || 'SpiderMaster'}
• *Telegram ID:* \`${user.tg_id}\`
• *Web Level:* ${user.level ?? 1}
• *XP Points:* ${Number(user.points ?? 0).toLocaleString()}
• *Stars:* ${Number(user.stars ?? 0).toLocaleString()} ⭐
• *Referral Code:* \`${user.ref_code || ''}\`
• *Wallet:* \`${user.wallet_address || 'Not connected'}\`
━━━━━━━━━━━━━━━━━━`;

  await tgCall("sendMessage", {
    chat_id: chatId,
    text,
    parse_mode: "Markdown",
    reply_markup: buildMainKeyboard()
  });
}

async function sendRankingInfo(chatId) {
  const topUsers = db.prepare(`
    SELECT u.username, u.first_name, u.points,
           (SELECT COUNT(*) FROM users r WHERE r.referred_by = u.ref_code) AS referral_count
    FROM users u ORDER BY points DESC LIMIT 5
  `).all();
  let rankText = `🏆 *TOP GLOBAL LEADERBOARD*\n━━━━━━━━━━━━━━━━━━\n`;
  topUsers.forEach((u, i) => {
    const crown = i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : ` ${i + 1}.`;
    const frens = u.referral_count ? ` _(${u.referral_count} Frens)_` : "";
    rankText += `${crown} @${u.username || u.first_name || 'SpiderPlayer'}: *${Number(u.points).toLocaleString()} XP*${frens}\n`;
  });
  rankText += `━━━━━━━━━━━━━━━━━━\n_Check the Mini App for Top Friends & Top Referrals tabs!_`;

  await tgCall("sendMessage", {
    chat_id: chatId,
    text: rankText,
    parse_mode: "Markdown",
    reply_markup: buildMainKeyboard()
  });
}

// Long Polling Loop
let lastUpdateId = 0;
let isPolling = false;

export async function startBotPolling() {
  if (!BOT_TOKEN) {
    console.warn("⚠️ TELEGRAM_BOT_TOKEN not provided. Bot polling skipped.");
    return;
  }
  if (isPolling) return;
  isPolling = true;

  console.log("🤖 Spider Web Network Telegram Bot started polling...");
  await setupBotMenu();

  while (isPolling) {
    try {
      const res = await tgCall(`getUpdates?offset=${lastUpdateId + 1}&timeout=20`);
      if (res.ok && Array.isArray(res.result)) {
        for (const update of res.result) {
          lastUpdateId = update.update_id;
          if (update.message) {
            await handleMessage(update.message);
          } else if (update.callback_query) {
            await handleCallbackQuery(update.callback_query);
          }
        }
      }
    } catch (err) {
      console.error("Polling loop error:", err.message);
      await new Promise(r => setTimeout(r, 3000));
    }
  }
}
