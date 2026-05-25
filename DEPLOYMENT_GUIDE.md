# 📺 KAMTV STANDALONE EXPORT & RENDER DEPLOYMENT MANUAL

This directory is an entirely isolated, premium Node.js + React build containing **only KamTV**! 
Deploying this in a separate GitHub repository guarantees **zero visual changes or interference** to your main ECOMIG Portal.

---

## 🚀 STEP-BY-STEP EXPORT DIRECTIVES

### Step 1: Initialize separate repository on your computer or GitHub
1. Create a brand new folder on your computer named `kamtv`.
2. Copy all files inside this `/standalone-kamtv` directory (and the `/assets` or other public files you'd like) into your new computer folder.
3. Open your computer terminal in that folder and run:
   ```bash
   git init
   git add .
   git commit -m "feat: initial commit for standalone KamTV"
   ```
4. Create a new repository on your GitHub account named `kam-tv`.
5. Link and push your local repository:
   ```bash
   git remote add origin https://github.com/YOUR_USERNAME/kam-tv.git
   git branch -M main
   git push -u origin main
   ```

---

## 🌐 STEP 2: LAUNCH LIVE ON RENDER (`https://kam-tv.onrender.com`)

Render offers a fast-track build setup perfect for this standalone package:
1. Log into your [Render Console](https://render.com).
2. Click **New +** > Select **Web Service**.
3. Link your newly created GitHub repository (`kam-tv`).
4. Apply the following settings exactly in the configuration form:
   - **Name:** `kam-tv`
   - **Language:** `Node`
   - **Build Command:** `npm install && npm run build`
   - **Start Command:** `node dist/server.cjs`
5. Click **Deploy Web Service** button at the bottom of the page.
6. Render will compile your React app and start the Express server immediately. Within 2 minutes, your standalone television platform will be globally active at **`https://kam-tv.onrender.com`**!

---

## 🛡️ CORE HIGHLIGHTS OF KAMTV STANDALONE
- **Military Camouflage Grid:** Styled with pure green military camo layers that act as an eye-safe, tactical container theme.
- **Dynamic Camera Filters:** Toggle Night Vision, calibration HUD matrices, camera swaps, and mute controls instantly.
- **Zero Dependencies Interference:** Uses its own isolated `package.json` setup, meaning updates to ECOMIG Portal will never affect your standalone site!
