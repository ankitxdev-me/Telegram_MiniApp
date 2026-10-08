# SPIDER Web Network – Telegram Mini App

A full-stack Telegram Mini App built with **Node.js + SQLite** featuring a tap-to-earn game economy, daily streaks, referral system, global leaderboard, NFT hub, and **TON wallet** integration via TonConnect.

---

## ✨ Features

| Feature | Details |
|---|---|
| 🔐 Auth | Telegram `initData` HMAC-SHA256 validation — no direct browser access |
| 🕷️ Tap & Earn | Spider tap mechanic with XP rewards |
| 🎮 Games | Spider Tic-Tac-Toe AI — up to 5 matches/day for XP |
| 🎁 Daily Streak | 14-day streak calendar with escalating rewards |
| 👥 Referrals | Invite link system — earn +100 XP & +50 Stars per friend |
| 🏆 Leaderboard | 3 tabs: Top Global · Top Friends · Top Referrals — with real profile photos |
| 💎 NFT Hub | 4 rarity tiers (Common / Rare / Epic / Legendary) on TON |
| 👛 TON Wallet | TonConnect UI + Telegram `@wallet` bot + manual `UQ…` / `EQ…` address |
| 🤖 Bot | Inline keyboard, `/start`, `/profile`, `/rank`, `/wallet`, `/help` |
| 🛡️ Admin Panel | `/admin` — stats, users (with avatars), tasks, leaderboard, NFTs |

---

## 🚀 Quick Start

### 1. Clone & Install
```bash
git clone https://github.com/ankitxdev-me/Telegram_MiniApp.git
cd Telegram_MiniApp/SPIDER_Working_MiniApp
npm install
```

### 2. Configure Environment
```bash
cp .env.example .env
# Edit .env:
#   PORT=3000
#   TELEGRAM_BOT_TOKEN=<your_token>
#   ADMIN_PASSWORD=<your_secure_password>
#   WEBAPP_URL=   # left blank; auto-filled by Cloudflare tunnel on startup
```

### 3. Run
```bash
npm start
```

The server:
- Starts on `http://localhost:3000`
- Automatically creates a **Cloudflare HTTPS tunnel** and updates the bot's Menu Button
- Bot begins polling for Telegram updates

### 4. Access
| URL | Description |
|---|---|
| `http://localhost:3000` | Mini App (open via Telegram for full auth) |
| `http://localhost:3000/admin` | Admin Panel (`ADMIN_PASSWORD`) |

---

## 🔑 Environment Variables

| Variable | Required | Description |
|---|---|---|
| `PORT` | No | HTTP port (default `3000`) |
| `TELEGRAM_BOT_TOKEN` | Yes | From [@BotFather](https://t.me/BotFather) |
| `ADMIN_PASSWORD` | Yes | Password for `/admin` panel |
| `WEBAPP_URL` | Auto | Filled automatically by the tunnel on start |
| `STRICT_TELEGRAM` | Optional | Set `true` to block non-Telegram browsers |

---

## 🤖 Bot Commands

| Command | Description |
|---|---|
| `/start` | Welcome + inline keyboard |
| `/profile` | View your XP, stars, level, wallet |
| `/rank` | Top 5 global leaderboard |
| `/wallet` | Connect TON wallet (`@wallet` / Tonkeeper) |
| `/help` | Usage guide |

---

## 🏗️ Project Structure

```
SPIDER_Working_MiniApp/
├── server.js          # Express API + SQLite + tunnel
├── bot.js             # Telegram Bot polling handler
├── avatar.js          # Avatar download & caching helper
├── package.json
├── .env.example
├── public/
│   ├── index.html     # Mini App (all screens)
│   ├── app.js         # Frontend logic
│   ├── style.css      # Styles
│   └── tonconnect-manifest.json
└── admin/
    ├── index.html     # Admin Panel UI
    └── admin.js       # Admin Panel logic
```

---

## 🔗 Links

- **Bot**: [@TeleAAutomation_Bot](https://t.me/TeleAAutomation_Bot)
- **TON Wallet**: [@wallet](https://t.me/wallet)
- **Tonkeeper**: https://tonkeeper.com