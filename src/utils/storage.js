// Pure helpers over a user record's `progress` object — no persistence
// here. Persistence now lives on the server (see server/index.js and
// src/utils/api.js); these just compute the next value, which the caller
// then both applies to local state and PUTs to the API.

export function todayIso() {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

// Days unlock sequentially: Day N is available only once Day N-1 has been
// PASSED with a perfect score — finishing a day with a lower score does not
// unlock the next one.
export function unlockedDay(user) {
  let streak = 0
  for (let d = 1; d <= 7; d++) {
    if (user.progress[d]?.passed) streak++
    else break
  }
  return Math.min(7, streak + 1)
}

export function isDayAvailable(user, day) {
  return day <= unlockedDay(user)
}

export function dayProgress(user, day) {
  return (
    user.progress[day] || {
      completed: false,
      answers: {},
      score: 0,
      total: 0,
      revealed: false,
    }
  )
}

export function saveDayResult(user, day, { answers, score, total }) {
  return {
    ...user,
    progress: {
      ...user.progress,
      [day]: {
        completed: true,
        passed: score === total,
        answers,
        score,
        total,
        revealed: user.progress[day]?.revealed || false,
      },
    },
  }
}

// Saves an in-progress (not yet submitted) set of answers, so a partially
// finished day can show its progress on the dashboard and be picked back
// up later. Never overwrites an already-completed day.
export function saveInProgressAnswers(user, day, answers) {
  const existing = user.progress[day]
  if (existing?.completed) return user
  return {
    ...user,
    progress: {
      ...user.progress,
      [day]: { ...existing, answers, completed: false },
    },
  }
}

export function restartDay(user, day) {
  const nextProgress = { ...user.progress }
  delete nextProgress[day]
  return { ...user, progress: nextProgress }
}

export function markRevealed(user, day) {
  return {
    ...user,
    progress: {
      ...user.progress,
      [day]: { ...dayProgress(user, day), revealed: true },
    },
  }
}

// "Passed" days — a perfect score, which is what actually counts toward
// badges, progression, and the grand prize.
export function passedDayCount(user) {
  return [1, 2, 3, 4, 5, 6, 7].filter((d) => user.progress[d]?.passed).length
}

export function allDaysCompleted(user) {
  return passedDayCount(user) === 7
}

export function markGrandPrizeRevealed(user) {
  return { ...user, grandPrizeRevealed: true }
}
