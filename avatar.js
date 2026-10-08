import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const avatarsDir = path.join(__dirname, "public", "avatars");

// Ensure directory exists
if (!fs.existsSync(avatarsDir)) {
  fs.mkdirSync(avatarsDir, { recursive: true });
}

/**
 * Downloads and caches a Telegram user's profile photo locally.
 * Returns the local URL (e.g. '/avatars/12345.jpg') or fallback.
 */
export async function syncUserAvatar(tgId, webAppPhotoUrl, db) {
  if (!tgId || String(tgId) === "spidermaster_local") return null;

  const avatarPath = path.join(avatarsDir, `${tgId}.jpg`);
  const relativeUrl = `/avatars/${tgId}.jpg`;

  // 1. If file exists and is less than 3 days old, ensure DB has it and return
  if (fs.existsSync(avatarPath)) {
    try {
      const stats = fs.statSync(avatarPath);
      if (Date.now() - stats.mtimeMs < 3 * 24 * 60 * 60 * 1000) {
        if (db) {
          db.prepare("UPDATE users SET avatar_url = ? WHERE tg_id = ?").run(relativeUrl, String(tgId));
        }
        return relativeUrl;
      }
    } catch {}
  }

  // 2. Fetch using Telegram Bot API getUserProfilePhotos
  const botToken = process.env.TELEGRAM_BOT_TOKEN;
  if (botToken) {
    try {
      const res = await fetch(`https://api.telegram.org/bot${botToken}/getUserProfilePhotos?user_id=${tgId}&limit=1`);
      const data = await res.json();
      if (data.ok && data.result?.photos?.length > 0) {
        const photoArr = data.result.photos[0];
        // Take highest resolution (last element)
        const fileId = photoArr[photoArr.length - 1].file_id;
        const fileRes = await fetch(`https://api.telegram.org/bot${botToken}/getFile?file_id=${fileId}`);
        const fileData = await fileRes.json();
        if (fileData.ok && fileData.result?.file_path) {
          const imgRes = await fetch(`https://api.telegram.org/file/bot${botToken}/${fileData.result.file_path}`);
          if (imgRes.ok) {
            const buffer = Buffer.from(await imgRes.arrayBuffer());
            fs.writeFileSync(avatarPath, buffer);
            if (db) {
              db.prepare("UPDATE users SET avatar_url = ? WHERE tg_id = ?").run(relativeUrl, String(tgId));
            }
            return relativeUrl;
          }
        }
      }
    } catch (err) {
      console.warn("Avatar sync error from Bot API for", tgId, err.message);
    }
  }

  // 3. Fallback to webAppPhotoUrl from initData if provided
  if (webAppPhotoUrl && webAppPhotoUrl.startsWith("http")) {
    try {
      const imgRes = await fetch(webAppPhotoUrl);
      if (imgRes.ok) {
        const buffer = Buffer.from(await imgRes.arrayBuffer());
        fs.writeFileSync(avatarPath, buffer);
        if (db) {
          db.prepare("UPDATE users SET avatar_url = ? WHERE tg_id = ?").run(relativeUrl, String(tgId));
        }
        return relativeUrl;
      }
    } catch (err) {
      console.warn("Avatar sync error from webAppPhotoUrl for", tgId, err.message);
    }
  }

  return null;
}
