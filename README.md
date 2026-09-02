# BrainBucks

*Your daily quest to earn while you learn!*

A 7-day written-practice app built with the [Arco Design](https://arco.design) React component
library, skinned to the KidsMath design system (dark navy palette, Gabarito/Rubik type). Covers
the same skills as Lessons 1–7 of *Saxon Math Course 2* (Hake). All questions and teaching notes
are original — not copied from the textbook.

## Run it

```
npm install
npm run dev
```

This starts **both** the Vite frontend and the API server together. Open the printed `localhost`
URL (the Vite one, typically `http://localhost:5173`) in your browser.

To run just one side (e.g. for debugging): `npm run dev:client` (Vite only) or `npm run dev:server`
(API only, on port 4000 — the frontend's `/api/*` requests are proxied there by Vite in dev, see
`vite.config.js`).

## Accounts & data

Profiles now live in a small SQLite database (`server/brainbucks.db`, created automatically on
first run — via Node's built-in `node:sqlite`, no native build step required) instead of the
browser's `localStorage`. The "Setup Your Profile" screen doubles as a lightweight login:
- Typing an existing username pulls that user's saved progress, badges, and picture back up.
- Typing a new username creates a fresh record.

This means the same username picks up right where it left off even from a different browser or
after clearing site data — and different usernames on the same machine each get their own separate
progress. The "Switch user" link in the dashboard footer just returns to that screen; it doesn't
delete anything.

The API is a small Express server in `server/index.js`:
- `GET /api/users/:username` — fetch a user's record (404 if it doesn't exist)
- `PUT /api/users/:username` — partial update (create-or-merge; omitted fields keep their current
  stored value)
- `DELETE /api/users/:username` — remove a user and cascade-delete their Fun Activity submissions
  (wired to the "Delete" button in the admin dashboard)

## Admin console

Log in on the same "Setup Your Profile" screen using the admin credentials configured in `.env`
(see **Setup** below) to reach a separate admin dashboard instead of the kid dashboard. From
there you can:
- Write/edit each day's actual graded test questions (multiple-choice, true/false, numeric),
  replacing the built-in question bank for that day, or revert back to it.
- View every Fun Activity submission (Art Studio, Rhyme & Beats, StoryTime) and award 1st/2nd/3rd
  place, which shows the winner a congratulations banner (with the matching cash-prize amount —
  see `src/data/prizes.js`) on their dashboard.
- Delete a user account (this also deletes that user's Fun Activity submissions).

Admin routes require a session token issued at login (`POST /api/admin/login`), sent as
`Authorization: Bearer <token>` on every admin-only request; the token lives only in memory and
is cleared on logout or page refresh. Regular kid accounts have no such gate — usernames alone
are the login, matching the "just type your name" experience this app is designed around.

## Setup

Copy `.env.example` to `.env` and fill in real values before running the app:
```
cp .env.example .env
```
- `ADMIN_USERNAME` / `ADMIN_PASSWORD` — the admin console's login credentials (server-side only).
- `VITE_ADMIN_USERNAME` — must match `ADMIN_USERNAME`; this one is baked into the built frontend
  so the login screen knows which typed username should reveal the password field. (The password
  itself is never sent to the browser until it's typed and submitted.)

`.env` is gitignored — never commit real credentials. `.env.example` documents the shape with
placeholder values only.

## Deployment

This is a small full-stack app (Vite-built React frontend + an Express/SQLite backend), not a
static site — it needs a host that runs a persistent Node process and keeps a file
(`server/brainbucks.db`) around between requests. A plain static host (GitHub Pages, Netlify
static, Vercel's static tier) will **not** work on its own. Any Node host with a persistent disk
does: Render, Railway, Fly.io, or a plain VPS.

`node server/index.js` (i.e. `npm start`) serves *both* the API and the built frontend from one
process once `dist/` exists — no separate static host or reverse proxy required. Steps:

1. Set `ADMIN_USERNAME`, `ADMIN_PASSWORD`, and `VITE_ADMIN_USERNAME` as environment variables on
   the host (do **not** commit `.env`). `VITE_ADMIN_USERNAME` must be set *before* the build step
   below, since Vite inlines it into the built JS at build time, not at runtime.
2. Build command: `npm install && npm run build`
3. Start command: `npm start`
4. `PORT` is read from the environment automatically — most hosts set this for you.
5. Make sure `server/`'s directory lives on a **persistent** disk/volume for `brainbucks.db` — a
   host that wipes the filesystem between deploys or restarts will lose all user data.

## How it works

- **Days unlock sequentially, and only on a perfect score.** Day 1 is always available; Day 2
  unlocks only once Day 1 is passed with 100%, Day 3 once Day 2 is passed, and so on. A day that's
  finished with any wrong answers stays unpassed — no badge, and the next day stays locked — until
  it's restarted and passed.
- **A "New Concept" lesson opens before each test** — a short original teaching note (with a tip
  and key terms) covering that day's skill. A "Start today's test" button then opens the practice.
  The test's own back button returns here, not straight to the dashboard.
- **25 questions per day**, mixing that day's new topic with a cumulative review of previous days
  (the same "spiral review" style the textbook uses). The progress bar tracks *correct* answers,
  not just filled-in ones, and only reaches 100% when every answer is actually right. Answers are
  marked "Correct" / "Not quite" without revealing the right answer, so a missed question can be
  reasoned through again on a retry instead of just copied.
- **A perfect score opens a blind box** revealing that day's badge — Warm-Up Wizard through Grand
  Math Master, in fixed day order.
- **Finishing all 7 days** unlocks a real-world grand prize link, shown once in a celebration modal.
- Progress is saved server-side per username (see **Accounts & data** below), not just in one
  browser.

## Assets

- Day-mascot and badge art in `public/images/` are supplied assets (not generated by this app).
- `Fun Activities` (Art Studio, Rhyme & Beats, StoryTime) are shown as "Coming Soon" — visual
  placeholders matching the reference design, not implemented features.
