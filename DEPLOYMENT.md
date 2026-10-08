# Render Deployment Guide — SPIDER Web Network

## Why Render Works
- Runs a persistent Node 22+ server process (`node server.js`).
- Native HTTPS URL (`https://spider-web-network.onrender.com`).
- Telegram bot polling runs continuously.
- Health endpoint (`/health`) available for 24/7 keep-alive.

---

## 🚀 1-Click / Blueprint Setup Steps

### 1. Push to GitHub
Make sure the latest code with `render.yaml` is pushed to GitHub:
`https://github.com/ankitxdev-me/Telegram_MiniApp`

### 2. Connect to Render
1. Go to **[render.com](https://render.com)** and log in with GitHub.
2. Click **New +** → **Blueprint** (or **Web Service**).
3. Connect your repository: `ankitxdev-me/Telegram_MiniApp`.
4. Render will read `render.yaml` automatically and configure:
   - **Environment**: Node
   - **Build Command**: `npm install`
   - **Start Command**: `node server.js`
   - **Node Version**: `22.12.0`

### 3. Add Environment Variables
In the Render dashboard under **Environment**:
| Key | Value | Description |
|---|---|---|
| `TELEGRAM_BOT_TOKEN` | `8819908073:AAFdozj8rEd-zHhGP_b_2g0u7OQKbt3Inj8` | Your Telegram Bot Token |
| `ADMIN_PASSWORD` | `spider123` | Password for `/admin` panel |

> **Note:** Do NOT set `WEBAPP_URL`. Render automatically provides `RENDER_EXTERNAL_URL`, which `server.js` detects automatically to configure the Telegram Bot Menu Button and TonConnect manifest!

---

## ⚡ How to Run 24/7 Without Sleep (100% Free)

Render's free tier sleeps after 15 minutes of inactivity. To keep your app & Telegram bot awake **24/7 without ever sleeping**:

1. Go to **[UptimeRobot](https://uptimerobot.com)** (100% Free).
2. Sign up and click **Add New Monitor**.
3. Configure the monitor:
   - **Monitor Type**: `HTTP(s)`
   - **Friendly Name**: `Spider MiniApp KeepAlive`
   - **URL**: `https://<YOUR-RENDER-APP-NAME>.onrender.com/health`
   - **Monitoring Interval**: `5 minutes`
4. Click **Create Monitor**.

That's it! UptimeRobot sends a lightweight ping to `/health` every 5 minutes. Render stays awake permanently, so your Telegram bot will respond instantly 24/7.
