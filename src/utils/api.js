const BASE = '/api/users'

// Held only in memory — cleared on page refresh or logout, same as the rest
// of this app's session state. Every admin-only request below attaches it.
let adminToken = null
export function clearAdminToken() {
  adminToken = null
}
function adminHeaders() {
  return adminToken ? { Authorization: `Bearer ${adminToken}` } : {}
}

// List of { username, updated_at } for every user — used by the admin dashboard.
export async function fetchUsers() {
  const res = await fetch(BASE, { headers: adminHeaders() })
  if (!res.ok) throw new Error('Failed to load users')
  return res.json()
}

// Returns the user record, or null if that username doesn't exist yet.
export async function fetchUser(username) {
  const res = await fetch(`${BASE}/${encodeURIComponent(username)}`)
  if (res.status === 404) return null
  if (!res.ok) throw new Error('Failed to load user')
  return res.json()
}

export async function deleteUser(username) {
  const res = await fetch(`${BASE}/${encodeURIComponent(username)}`, {
    method: 'DELETE',
    headers: adminHeaders(),
  })
  if (!res.ok) throw new Error('Failed to delete user')
  return res.json()
}

// Partial update — any field you omit keeps its current stored value on
// the server, so this can be called with just `{ progress }`, just
// `{ picture }`, etc. without clobbering the rest of the record.
export async function saveUser(username, partial) {
  const res = await fetch(`${BASE}/${encodeURIComponent(username)}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(partial),
  })
  if (!res.ok) throw new Error('Failed to save user')
  return res.json()
}

// Returns true/false rather than throwing, so a wrong password is a normal
// "try again" outcome rather than an error path. On success, stores the
// session token in memory for subsequent admin-only requests to attach.
export async function adminLogin(username, password) {
  const res = await fetch('/api/admin/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password }),
  })
  if (!res.ok) return false
  const body = await res.json()
  adminToken = body.token
  return true
}

export async function submitActivity(activity, { username, textContent, fileName, mimeType, data }) {
  const res = await fetch(`/api/activities/${activity}/submissions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, textContent, fileName, mimeType, data }),
  })
  if (!res.ok) {
    const body = await res.json().catch(() => null)
    if (res.status === 429 && body?.error === 'already_submitted_this_week') {
      const err = new Error('already_submitted_this_week')
      err.nextAvailableAt = body.nextAvailableAt
      throw err
    }
    throw new Error(body?.error || 'Failed to submit activity')
  }
  return res.json()
}

// Metadata only (no text/file data) — used both by a kid's own dashboard
// (filtered to their username) and by the admin dashboard (unfiltered).
export async function fetchActivitySubmissions({ username, activity } = {}) {
  const params = new URLSearchParams()
  if (username) params.set('username', username)
  if (activity) params.set('activity', activity)
  const query = params.toString()
  const res = await fetch(`/api/activities/submissions${query ? `?${query}` : ''}`, { headers: adminHeaders() })
  if (!res.ok) throw new Error('Failed to load submissions')
  return res.json()
}

// Full record, including text/file data — only fetched when a specific
// submission is actually opened for viewing.
export async function fetchActivitySubmission(id) {
  const res = await fetch(`/api/activities/submissions/${id}`)
  if (res.status === 404) return null
  if (!res.ok) throw new Error('Failed to load submission')
  return res.json()
}

// place: 1, 2, 3, or null to clear. Setting a place automatically clears it
// from whichever other submission in the same activity previously held it.
export async function setSubmissionPlace(id, place) {
  const res = await fetch(`/api/activities/submissions/${id}/place`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', ...adminHeaders() },
    body: JSON.stringify({ place }),
  })
  if (!res.ok) throw new Error('Failed to set place')
  return res.json()
}

// Map of day -> questions, for every day that has an admin-authored override.
// Small enough to fetch in full — every kid's dashboard needs it, not just the admin's.
export async function fetchDayQuestionOverrides() {
  const res = await fetch('/api/day-questions')
  if (!res.ok) throw new Error('Failed to load day questions')
  return res.json()
}

export async function fetchDayQuestions(day) {
  const res = await fetch(`/api/day-questions/${day}`)
  if (res.status === 404) return null
  if (!res.ok) throw new Error('Failed to load day questions')
  return res.json()
}

export async function saveDayQuestions(day, questions) {
  const res = await fetch(`/api/day-questions/${day}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', ...adminHeaders() },
    body: JSON.stringify({ questions }),
  })
  if (!res.ok) throw new Error((await res.json())?.error || 'Failed to save day questions')
  return res.json()
}

export async function deleteDayQuestions(day) {
  const res = await fetch(`/api/day-questions/${day}`, { method: 'DELETE', headers: adminHeaders() })
  if (!res.ok) throw new Error('Failed to revert day questions')
  return res.json()
}
