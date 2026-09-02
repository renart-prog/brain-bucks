import express from 'express'
import cors from 'cors'
import crypto from 'node:crypto'
import { existsSync } from 'node:fs'
import { DatabaseSync } from 'node:sqlite'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

// Loads .env in local dev; in production the host platform sets these
// directly, so a missing .env file here is expected and fine to ignore.
try {
  process.loadEnvFile()
} catch {
  // no .env file present — rely on the platform's own env vars
}

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const db = new DatabaseSync(path.join(__dirname, 'brainbucks.db'))

const ADMIN_USERNAME = process.env.ADMIN_USERNAME
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD
const ACTIVITIES = ['art-studio', 'rhyme-beats', 'story-time']
const WEEK_MS = 7 * 24 * 60 * 60 * 1000

// In-memory admin session tokens — cleared on server restart, which is fine
// for this app's scale (the admin just logs in again).
const activeAdminTokens = new Set()

function isAdminAuthorized(req) {
  const auth = req.headers.authorization || ''
  return auth.startsWith('Bearer ') && activeAdminTokens.has(auth.slice(7))
}

function requireAdmin(req, res, next) {
  if (!isAdminAuthorized(req)) return res.status(401).json({ error: 'unauthorized' })
  next()
}

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    username TEXT PRIMARY KEY,
    picture TEXT,
    start_date TEXT NOT NULL,
    progress TEXT NOT NULL DEFAULT '{}',
    grand_prize_revealed INTEGER NOT NULL DEFAULT 0,
    updated_at TEXT NOT NULL
  )
`)

db.exec(`
  CREATE TABLE IF NOT EXISTS activity_submissions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT NOT NULL,
    activity TEXT NOT NULL,
    text_content TEXT,
    file_name TEXT,
    mime_type TEXT,
    data TEXT,
    created_at TEXT NOT NULL
  )
`)

// Lightweight migration: `place` was added after this table already shipped,
// so ALTER TABLE may fail with "duplicate column" on a database that already has it.
try {
  db.exec('ALTER TABLE activity_submissions ADD COLUMN place INTEGER')
} catch {
  // column already exists
}

db.exec(`
  CREATE TABLE IF NOT EXISTS day_questions (
    day INTEGER PRIMARY KEY,
    questions TEXT NOT NULL,
    updated_at TEXT NOT NULL
  )
`)

function todayIso() {
  return new Date().toISOString().slice(0, 10)
}

function rowToUser(row) {
  if (!row) return null
  return {
    username: row.username,
    picture: row.picture || null,
    startDate: row.start_date,
    progress: JSON.parse(row.progress),
    grandPrizeRevealed: !!row.grand_prize_revealed,
  }
}

const getStmt = db.prepare('SELECT * FROM users WHERE username = ?')
const upsertStmt = db.prepare(`
  INSERT INTO users (username, picture, start_date, progress, grand_prize_revealed, updated_at)
  VALUES (?, ?, ?, ?, ?, ?)
  ON CONFLICT(username) DO UPDATE SET
    picture = excluded.picture,
    start_date = excluded.start_date,
    progress = excluded.progress,
    grand_prize_revealed = excluded.grand_prize_revealed,
    updated_at = excluded.updated_at
`)
const deleteStmt = db.prepare('DELETE FROM users WHERE username = ?')
const listStmt = db.prepare('SELECT username, updated_at FROM users ORDER BY updated_at DESC')

const insertSubmissionStmt = db.prepare(`
  INSERT INTO activity_submissions (username, activity, text_content, file_name, mime_type, data, created_at)
  VALUES (?, ?, ?, ?, ?, ?, ?)
`)
const getSubmissionStmt = db.prepare('SELECT * FROM activity_submissions WHERE id = ?')
const deleteSubmissionsByUserStmt = db.prepare('DELETE FROM activity_submissions WHERE username = ?')
const latestSubmissionStmt = db.prepare(
  'SELECT created_at FROM activity_submissions WHERE username = ? AND activity = ? ORDER BY created_at DESC LIMIT 1'
)
const setSubmissionPlaceStmt = db.prepare('UPDATE activity_submissions SET place = ? WHERE id = ?')
const clearSubmissionPlaceStmt = db.prepare(
  'UPDATE activity_submissions SET place = NULL WHERE activity = ? AND place = ? AND id != ?'
)

const getDayQuestionsStmt = db.prepare('SELECT * FROM day_questions WHERE day = ?')
const listDayQuestionsStmt = db.prepare('SELECT * FROM day_questions ORDER BY day')
const upsertDayQuestionsStmt = db.prepare(`
  INSERT INTO day_questions (day, questions, updated_at)
  VALUES (?, ?, ?)
  ON CONFLICT(day) DO UPDATE SET
    questions = excluded.questions,
    updated_at = excluded.updated_at
`)
const deleteDayQuestionsStmt = db.prepare('DELETE FROM day_questions WHERE day = ?')

function dayQuestionsRow(row) {
  if (!row) return null
  return {
    day: row.day,
    questions: JSON.parse(row.questions),
    updatedAt: row.updated_at,
  }
}

function validateQuestions(questions) {
  if (!Array.isArray(questions) || questions.length === 0) return 'questions must be a non-empty array'
  for (const q of questions) {
    if (!q || typeof q.prompt !== 'string' || !q.prompt.trim()) return 'every question needs a prompt'
    if (!['mc', 'tf', 'num'].includes(q.type)) return 'question type must be mc, tf, or num'
    if (q.type === 'mc') {
      if (!Array.isArray(q.options) || q.options.length < 2) return 'multiple-choice questions need at least 2 options'
      if (!Number.isInteger(q.correct) || q.correct < 0 || q.correct >= q.options.length) {
        return 'multiple-choice correct answer must be a valid option index'
      }
    } else if (q.type === 'tf') {
      if (typeof q.correct !== 'boolean') return 'true/false correct answer must be a boolean'
    } else if (q.type === 'num') {
      if (typeof q.correct !== 'number' || !Number.isFinite(q.correct)) return 'numeric correct answer must be a number'
    }
  }
  return null
}

function submissionRow(row) {
  if (!row) return null
  return {
    id: row.id,
    username: row.username,
    activity: row.activity,
    textContent: row.text_content,
    fileName: row.file_name,
    mimeType: row.mime_type,
    data: row.data,
    createdAt: row.created_at,
    place: row.place ?? null,
  }
}

const app = express()
app.use(cors())
app.use(express.json({ limit: '15mb' }))

app.get('/api/users', requireAdmin, (req, res) => {
  res.json(listStmt.all())
})

app.get('/api/users/:username', (req, res) => {
  const user = rowToUser(getStmt.get(req.params.username))
  if (!user) return res.status(404).json({ error: 'not_found' })
  res.json(user)
})

// Upsert with merge semantics: any field omitted from the body keeps its
// existing stored value, so callers can PUT a partial update (e.g. just a
// new `progress` object) without clobbering the rest of the record.
app.put('/api/users/:username', (req, res) => {
  const username = req.params.username.trim()
  if (!username) return res.status(400).json({ error: 'username_required' })

  const existing = rowToUser(getStmt.get(username))
  const body = req.body || {}

  const merged = {
    picture: body.picture !== undefined ? body.picture : existing?.picture ?? null,
    startDate: body.startDate ?? existing?.startDate ?? todayIso(),
    progress: body.progress !== undefined ? body.progress : existing?.progress ?? {},
    grandPrizeRevealed:
      body.grandPrizeRevealed !== undefined ? body.grandPrizeRevealed : existing?.grandPrizeRevealed ?? false,
  }

  upsertStmt.run(
    username,
    merged.picture,
    merged.startDate,
    JSON.stringify(merged.progress),
    merged.grandPrizeRevealed ? 1 : 0,
    new Date().toISOString()
  )

  res.json({ username, ...merged })
})

app.delete('/api/users/:username', requireAdmin, (req, res) => {
  const username = req.params.username.trim()
  deleteStmt.run(username)
  // Fun activity submissions belong to the same account as login, so
  // deleting the account clears their submissions (and any place they won) too.
  deleteSubmissionsByUserStmt.run(username)
  res.json({ ok: true })
})

app.post('/api/admin/login', (req, res) => {
  const { username, password } = req.body || {}
  if (!ADMIN_USERNAME || !ADMIN_PASSWORD) {
    return res.status(500).json({ error: 'admin_not_configured' })
  }
  if (username === ADMIN_USERNAME && password === ADMIN_PASSWORD) {
    const token = crypto.randomBytes(24).toString('hex')
    activeAdminTokens.add(token)
    return res.json({ ok: true, token })
  }
  res.status(401).json({ error: 'invalid_credentials' })
})

app.post('/api/activities/:activity/submissions', (req, res) => {
  const { activity } = req.params
  if (!ACTIVITIES.includes(activity)) return res.status(400).json({ error: 'invalid_activity' })

  const { username, textContent, fileName, mimeType, data } = req.body || {}
  if (!username || !username.trim()) return res.status(400).json({ error: 'username_required' })
  const trimmedUsername = username.trim()

  // Fun activity submissions belong to the same account as login — no
  // submitting for a username that isn't a registered/logged-in user.
  if (!getStmt.get(trimmedUsername)) return res.status(404).json({ error: 'user_not_found' })

  const latest = latestSubmissionStmt.get(trimmedUsername, activity)
  if (latest) {
    const nextAvailableAt = new Date(new Date(latest.created_at).getTime() + WEEK_MS)
    if (nextAvailableAt.getTime() > Date.now()) {
      return res.status(429).json({ error: 'already_submitted_this_week', nextAvailableAt: nextAvailableAt.toISOString() })
    }
  }

  const createdAt = new Date().toISOString()
  const result = insertSubmissionStmt.run(
    trimmedUsername,
    activity,
    textContent ?? null,
    fileName ?? null,
    mimeType ?? null,
    data ?? null,
    createdAt
  )
  res.status(201).json(submissionRow(getSubmissionStmt.get(Number(result.lastInsertRowid))))
})

app.get('/api/activities/submissions', (req, res) => {
  const { username, activity } = req.query
  // A kid fetching their own username's submissions needs no admin token;
  // the unfiltered admin-wide listing (every user's submissions) does.
  if (!username && !isAdminAuthorized(req)) return res.status(401).json({ error: 'unauthorized' })

  const clauses = []
  const params = []
  if (username) {
    clauses.push('username = ?')
    params.push(username)
  }
  if (activity) {
    clauses.push('activity = ?')
    params.push(activity)
  }
  const where = clauses.length ? `WHERE ${clauses.join(' AND ')}` : ''
  const rows = db
    .prepare(`SELECT * FROM activity_submissions ${where} ORDER BY created_at DESC`)
    .all(...params)
    .map(submissionRow)

  res.json(
    rows.map((row) => ({
      id: row.id,
      username: row.username,
      activity: row.activity,
      hasText: !!row.textContent,
      fileName: row.fileName,
      mimeType: row.mimeType,
      hasFile: !!row.data,
      createdAt: row.createdAt,
      place: row.place,
    }))
  )
})

app.get('/api/activities/submissions/:id', (req, res) => {
  const submission = submissionRow(getSubmissionStmt.get(Number(req.params.id)))
  if (!submission) return res.status(404).json({ error: 'not_found' })
  res.json(submission)
})

app.put('/api/activities/submissions/:id/place', requireAdmin, (req, res) => {
  const id = Number(req.params.id)
  const existing = getSubmissionStmt.get(id)
  if (!existing) return res.status(404).json({ error: 'not_found' })

  const { place } = req.body || {}
  if (place !== null && ![1, 2, 3].includes(place)) {
    return res.status(400).json({ error: 'place must be 1, 2, 3, or null' })
  }

  if (place !== null) {
    clearSubmissionPlaceStmt.run(existing.activity, place, id)
  }
  setSubmissionPlaceStmt.run(place, id)
  res.json(submissionRow(getSubmissionStmt.get(id)))
})

app.get('/api/day-questions', (req, res) => {
  const overrides = {}
  for (const row of listDayQuestionsStmt.all().map(dayQuestionsRow)) {
    overrides[row.day] = row.questions
  }
  res.json(overrides)
})

app.get('/api/day-questions/:day', (req, res) => {
  const record = dayQuestionsRow(getDayQuestionsStmt.get(Number(req.params.day)))
  if (!record) return res.status(404).json({ error: 'not_found' })
  res.json(record)
})

app.put('/api/day-questions/:day', requireAdmin, (req, res) => {
  const day = Number(req.params.day)
  const { questions } = req.body || {}
  const error = validateQuestions(questions)
  if (error) return res.status(400).json({ error })

  const withIds = questions.map((q, idx) => ({
    id: q.id || `d${day}-c${idx}`,
    type: q.type,
    topic: q.topic || `L${day}`,
    prompt: q.prompt,
    ...(q.type === 'mc' ? { options: q.options } : {}),
    correct: q.correct,
  }))

  upsertDayQuestionsStmt.run(day, JSON.stringify(withIds), new Date().toISOString())
  res.json(dayQuestionsRow(getDayQuestionsStmt.get(day)))
})

app.delete('/api/day-questions/:day', requireAdmin, (req, res) => {
  deleteDayQuestionsStmt.run(Number(req.params.day))
  res.json({ ok: true })
})

// In production (after `npm run build`), serve the built frontend from this
// same process — no separate static host or reverse proxy needed. In dev,
// `dist/` doesn't exist, so this is a no-op and Vite's own server handles
// the frontend instead.
const distPath = path.join(__dirname, '../dist')
if (existsSync(distPath)) {
  app.use(express.static(distPath))
  // Plain middleware, not a routed path — Express 5's path-to-regexp no
  // longer accepts a bare '*' wildcard route pattern.
  app.use((req, res) => {
    if (req.path.startsWith('/api/')) return res.status(404).json({ error: 'not_found' })
    res.sendFile(path.join(distPath, 'index.html'))
  })
}

const PORT = process.env.PORT || 4000
app.listen(PORT, () => {
  console.log(`BrainBucks API listening on http://localhost:${PORT}`)
})
