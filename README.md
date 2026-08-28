# Questlog

A habit/daily/to-do tracker with RPG mechanics (level, XP, HP, gold, a reward shop) — a "vibe coded" take on Habitica. It's a Progressive Web App: no App Store, no build tools, install it straight to your phone or desktop home screen.

## How the mechanics work
- **Habits** — repeatable, no schedule. `+` gives XP and gold; `−` costs HP. No guilt, just momentum.
- **Dailies** — reset each day. Finish them before the day rolls over or you take HP damage overnight (checked next time you open the app). Keeping a daily builds a visible streak.
- **To-Dos** — one-off quests. Complete and they disappear, with a bigger XP/gold payout.
- **Shop** — set your own real-world rewards (a show, takeout, an hour of guitar) and price them in gold you actually earned.
- **Level/HP/Gold** — persisted locally on your device via `localStorage`. Nothing leaves your phone; there's no server.

## Run it locally right now
No install needed — just serve the folder over HTTP (PWAs won't install from a bare `file://` page):
```
cd questlog
python3 -m http.server 8080
```
Then open `http://localhost:8080` on the same device.

## Install to your phone (the real goal)
PWAs need HTTPS to install outside localhost. Easiest free option — **GitHub Pages**:
1. Create a new GitHub repo, push this `questlog` folder to it.
2. Repo Settings → Pages → Deploy from branch → `main` / root.
3. GitHub gives you a URL like `https://yourname.github.io/questlog/`.
4. Open that URL on your phone:
   - **iPhone (Safari):** Share button → "Add to Home Screen."
   - **Android (Chrome):** menu (⋮) → "Install app" or "Add to Home screen."
5. It now launches full-screen like a native app, works offline, and keeps its own icon.

Netlify or Vercel work the same way if you'd rather drag-and-drop deploy than use Git.

## Install on desktop
Open the hosted URL in Chrome/Edge → look for the install icon (⊕) in the address bar → Install. It runs in its own window from then on.

## Customizing
- Colors/fonts: `style.css` (top `:root` block — swap the hex values).
- XP curve, HP scaling, streak damage, reward payouts: the constants and formulas near the top of `app.js` (`xpToNext`, `maxHpFor`, and the numbers in `onListClick`).
- Starter tasks: `defaultState()` in `app.js` — only used the very first time the app runs on a device.

## Known limitations (day-one vibe-coded scope)
- Single device, single character — no accounts, no sync between phone and desktop.
- Daily-miss penalty is checked on next app open, not via a background job while the app is closed.
- No party/guild/social layer.

Good next steps if you want to keep building: add iCloud/Firebase sync so your character follows you across devices, or a "boss battle" mode where a shared goal only clears once the whole family/party checks off their dailies.
