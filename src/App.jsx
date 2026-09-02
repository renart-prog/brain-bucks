import { useEffect, useState } from 'react'
import { Message } from '@arco-design/web-react'
import Dashboard from './components/Dashboard'
import Collection from './components/Collection'
import PracticeDay from './components/PracticeDay'
import Lesson from './components/Lesson'
import BlindBox from './components/BlindBox'
import GrandPrizeModal from './components/GrandPrizeModal'
import ProfileSetup from './components/ProfileSetup'
import MathQuest from './components/MathQuest'
import AdminDashboard from './components/AdminDashboard'
import { DAYS } from './data/questions'
import { BADGES } from './data/badges'
import {
  unlockedDay,
  saveDayResult,
  saveInProgressAnswers,
  markRevealed,
  restartDay,
  allDaysCompleted,
  markGrandPrizeRevealed,
} from './utils/storage'
import { saveUser, fetchDayQuestionOverrides, clearAdminToken } from './utils/api'

// Fire-and-forget persistence to the backend — local state (the visible
// source of truth) has already been updated by the time this is called,
// so a slow or failed request never blocks the UI. A failure just means
// this particular change won't have made it to the database.
function persist(username, partial) {
  saveUser(username, partial).catch(() => {
    Message.error("Couldn't save your progress to the server — check that it's still running.")
  })
}

export default function App() {
  const [user, setUser] = useState(null)
  const [view, setView] = useState('dashboard') // 'dashboard' | 'lesson' | 'practice' | 'collection' | 'mathquest'
  const [activeDay, setActiveDay] = useState(null)
  const [box, setBox] = useState({ visible: false, badge: null, score: 0, total: 0 })
  const [grandPrizeQueued, setGrandPrizeQueued] = useState(false)
  const [grandPrizeVisible, setGrandPrizeVisible] = useState(false)
  const [dayOverrides, setDayOverrides] = useState({})

  useEffect(() => {
    fetchDayQuestionOverrides().then(setDayOverrides).catch(() => {})
  }, [])

  const unlockedDayNum = user && !user.isAdmin ? unlockedDay(user) : 1

  function openDay(day) {
    setActiveDay(day)
    const dayInfo = user.progress[day]
    const hasStarted =
      dayInfo?.completed ||
      Object.values(dayInfo?.answers || {}).some((v) => v !== undefined && v !== '')
    // Already-completed days go straight to the review, and a day with
    // some in-progress answers resumes right where it was left off.
    // Everything else reviews the New Concept before the test opens.
    setView(hasStarted ? 'practice' : 'lesson')
  }

  function maybeQueueGrandPrize(next) {
    const earned = allDaysCompleted(next) && !next.grandPrizeRevealed
    if (earned) setGrandPrizeQueued(true)
    return earned
  }

  function handleSubmit({ answers, score, total }) {
    const next = saveDayResult(user, activeDay, { answers, score, total })
    setUser(next)
    persist(next.username, { progress: next.progress })

    if (score === total) {
      setBox({
        visible: true,
        badge: BADGES[activeDay - 1],
        score,
        total,
      })
      maybeQueueGrandPrize(next)
    } else {
      Message.info(`You scored ${score}/${total}. Get every question right to earn today's blind box — restart the day to try again!`)
      if (maybeQueueGrandPrize(next)) {
        setGrandPrizeQueued(false)
        openGrandPrize(next)
      }
    }
  }

  function handleProgress(answers) {
    const next = saveInProgressAnswers(user, activeDay, answers)
    setUser(next)
    persist(next.username, { progress: next.progress })
  }

  function openGrandPrize(current) {
    const revealed = markGrandPrizeRevealed(current)
    setUser(revealed)
    persist(revealed.username, { grandPrizeRevealed: true })
    setGrandPrizeVisible(true)
  }

  function handleRestart(day) {
    const next = restartDay(user, day)
    setUser(next)
    persist(next.username, { progress: next.progress })
    setActiveDay(day)
    setView('lesson')
  }

  function closeBox() {
    const next = markRevealed(user, activeDay)
    setUser(next)
    persist(next.username, { progress: next.progress })
    setBox({ visible: false, badge: null, score: 0, total: 0 })
    setView('dashboard')

    if (grandPrizeQueued) {
      setGrandPrizeQueued(false)
      openGrandPrize(next)
    }
  }

  function handleSwitchUser() {
    clearAdminToken()
    setUser(null)
    setView('dashboard')
    setActiveDay(null)
  }

  const dayData = activeDay
    ? { ...DAYS.find((d) => d.day === activeDay), questions: dayOverrides[activeDay] ?? DAYS.find((d) => d.day === activeDay).questions }
    : null

  if (!user) {
    return (
      <div className="app-root">
        <ProfileSetup onComplete={setUser} />
      </div>
    )
  }

  if (user.isAdmin) {
    return (
      <div className="app-root">
        <AdminDashboard onSwitchUser={handleSwitchUser} />
      </div>
    )
  }

  return (
    <div className="app-root">
      {view === 'dashboard' && (
        <Dashboard
          state={user}
          profile={user}
          unlockedDayNum={unlockedDayNum}
          onOpenDay={openDay}
          onRestartDay={handleRestart}
          onOpenCollection={() => setView('collection')}
          onOpenMathQuest={() => setView('mathquest')}
          onSwitchUser={handleSwitchUser}
        />
      )}
      {view === 'mathquest' && (
        <MathQuest onBack={() => setView('dashboard')} />
      )}
      {view === 'collection' && <Collection state={user} onBack={() => setView('dashboard')} />}
      {view === 'lesson' && activeDay && (
        <div className="page-container">
          <Lesson day={activeDay} onStartTest={() => setView('practice')} onBack={() => setView('dashboard')} />
        </div>
      )}
      {view === 'practice' && dayData && (
        <div className="page-container">
          <PracticeDay
            dayData={dayData}
            onSubmit={handleSubmit}
            onProgress={handleProgress}
            onBack={() => setView('lesson')}
            initialProgress={user.progress[activeDay]}
          />
        </div>
      )}
      <BlindBox visible={box.visible} badge={box.badge} score={box.score} total={box.total} onClose={closeBox} />
      <GrandPrizeModal
        visible={grandPrizeVisible}
        username={user.username}
        onClose={() => setGrandPrizeVisible(false)}
      />
    </div>
  )
}
