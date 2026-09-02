import { useEffect, useState } from 'react'
import { Typography, Popconfirm, Button } from '@arco-design/web-react'
import { IconLock, IconCheck, IconExclamation } from '@arco-design/web-react/icon'
import { DAYS } from '../data/questions'
import { DAY_THEME } from '../data/dayTheme'
import { BADGES } from '../data/badges'
import { APP_NAME } from '../data/brand'
import { MATH_QUOTES } from '../data/quotes'
import { fetchActivitySubmissions, fetchDayQuestionOverrides } from '../utils/api'
import { PLACE_PRIZES } from '../data/prizes'
import ActivityUploadModal from './ActivityUploadModal'

const { Title, Text } = Typography

const PLACE_ORDINAL = { 1: '1st', 2: '2nd', 3: '3rd' }

const FUN_ACTIVITIES = [
  { key: 'art-studio', title: 'Art Studio', sub: 'Paint your colorful worlds and win!', image: '/images/art-studio.png' },
  { key: 'rhyme-beats', title: 'Rhyme & Beats', sub: 'Sing and record to win!', image: '/images/rhyme-beats.png' },
  { key: 'story-time', title: 'StoryTime', sub: 'Write magical stories and win!', image: '/images/story-time.png' },
]

export default function Dashboard({
  state,
  profile,
  unlockedDayNum,
  onOpenDay,
  onRestartDay,
  onOpenCollection,
  onOpenMathQuest,
  onSwitchUser,
}) {
  const passedDays = Object.keys(state.progress).filter((d) => state.progress[d]?.passed).length

  const [submittedActivities, setSubmittedActivities] = useState(new Set())
  const [wins, setWins] = useState([])
  const [dayOverrides, setDayOverrides] = useState({})
  const [activeActivity, setActiveActivity] = useState(null)

  function refreshSubmittedActivities() {
    fetchActivitySubmissions({ username: profile.username }).then((rows) => {
      const wonActivities = new Set(rows.filter((r) => r.place).map((r) => r.activity))
      // The green "submitted" check is only meaningful while a result is still
      // pending — once an activity is won, the win banner below takes over.
      setSubmittedActivities(new Set(rows.filter((r) => !wonActivities.has(r.activity)).map((r) => r.activity)))
      setWins(
        FUN_ACTIVITIES.filter((a) => wonActivities.has(a.key)).map((a) => ({
          activity: a.key,
          title: a.title,
          place: rows.find((r) => r.activity === a.key && r.place)?.place,
        }))
      )
    })
  }

  useEffect(() => {
    fetchDayQuestionOverrides().then(setDayOverrides)
    refreshSubmittedActivities()
  }, [profile.username])

  return (
    <div className="page-container">
      <div className="brand-row">
        <img src="/images/bb-logo.svg" alt={APP_NAME} className="brand-logo" />
      </div>

      {/* Welcome banner */}
      <div className="welcome-banner">
        <div className="welcome-left">
          {profile.picture ? (
            <img src={profile.picture} alt={profile.username} className="profile-avatar" />
          ) : (
            <span className="welcome-avatar" role="img" aria-label={profile.username}>
              🧑
            </span>
          )}
          <div>
            <Title heading={2} className="welcome-title">
              Welcome {profile.username}
            </Title>
            <Text className="welcome-subtitle">
              &#11088; {passedDays} of 7 days complete this week &mdash; keep going!
            </Text>
          </div>
        </div>

        <div className="welcome-divider" />

        <div className="welcome-badges">
          <div className="badge-row">
            {BADGES.map((badge, idx) => {
              const day = idx + 1
              const unlocked = !!state.progress[day]?.passed
              return (
                <div className="badge-item" key={badge.id}>
                  <img
                    src={badge.image}
                    alt={badge.name}
                    className="badge-img"
                    style={{ filter: unlocked ? 'none' : 'grayscale(1) opacity(0.4)' }}
                  />
                </div>
              )
            })}
          </div>
          <div className="badge-actions">
            <span className="badge-teaser">Earn all badges and get a surprise!!</span>
            <button className="see-all-btn" onClick={onOpenCollection}>
              Dashboard &rarr;
            </button>
          </div>
        </div>
      </div>

      {wins.map((win) => (
        <div key={win.activity} className="fun-win-banner">
          🎉 Congratulations! You got <strong>{PLACE_ORDINAL[win.place]} place</strong> in {win.title} &mdash; you
          win <strong>${PLACE_PRIZES[win.place].toFixed(2)}</strong>! Added to your total earned.
        </div>
      ))}

      {/* Math Adventure */}
      <div className="section-header">
        <Title heading={1} className="section-title">
          Math Adventure
        </Title>
        <span className="tag-pill tag-pill-teal">Daily Path</span>
      </div>

      <div className="day-row">
        {DAYS.map(({ day, questions }) => {
          const progress = state.progress[day]
          const completed = !!progress?.completed
          const passed = !!progress?.passed
          const available = day <= unlockedDayNum
          const theme = DAY_THEME[day]
          const answeredCount = Object.values(progress?.answers || {}).filter(
            (v) => v !== undefined && v !== ''
          ).length
          const questionCount = dayOverrides[day]?.length ?? questions.length
          const inProgress = !completed && answeredCount > 0
          const inProgressPct = inProgress ? Math.round((answeredCount / questionCount) * 100) : 0

          return (
            <div
              key={day}
              className={`day-card ${!available ? 'day-card-locked' : ''} ${inProgress ? 'day-card-in-progress' : ''}`}
              onClick={() => available && onOpenDay(day)}
            >
              <div className="day-card-art">
                <img src={theme.image} alt={theme.short} className="day-card-img" />
                {!available && (
                  <span className="day-card-lock">
                    <IconLock />
                  </span>
                )}
                {passed && (
                  <span className="day-card-check">
                    <IconCheck />
                  </span>
                )}
                {completed && !passed && (
                  <span className="day-card-retry">
                    <IconExclamation />
                  </span>
                )}
                {inProgress && <span className="day-card-progress-badge">{inProgressPct}%</span>}
              </div>
              <div className="day-card-footer">
                <Text className="day-card-label" style={{ color: theme.color }}>
                  Day {day}
                </Text>
                <Text className="day-card-sub">&ldquo;{MATH_QUOTES[(day - 1) % MATH_QUOTES.length]}&rdquo;</Text>
                {inProgress ? (
                  <>
                    <div className="day-card-progress-track">
                      <div className="day-card-progress-fill" style={{ width: `${inProgressPct}%` }} />
                    </div>
                    <Text className="day-card-count day-card-count-progress">
                      {answeredCount}/{questionCount} answered &mdash; keep going!
                    </Text>
                  </>
                ) : completed && !passed ? (
                  <Text className="day-card-count day-card-count-warn">
                    {progress.score}/{progress.total} &mdash; needs 100% to pass
                  </Text>
                ) : (
                  <Text className="day-card-count">{questionCount} questions</Text>
                )}
                {completed && (
                  <Popconfirm
                    title={`Restart Day ${day}?`}
                    content="This clears your answers and score for this day so you can take the paper again."
                    onOk={() => onRestartDay(day)}
                  >
                    <Button
                      className="day-card-restart"
                      type="text"
                      size="mini"
                      onClick={(e) => e.stopPropagation()}
                    >
                      Restart
                    </Button>
                  </Popconfirm>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {/* Fun activities */}
      <div className="section-header">
        <Title heading={1} className="section-title">
          Fun Activities
        </Title>
        <span className="tag-pill tag-pill-blue">Creative Space</span>
      </div>

      <div className="activity-row">
        {FUN_ACTIVITIES.map((activity) => (
          <button
            type="button"
            className="activity-card"
            key={activity.key}
            onClick={() => setActiveActivity(activity.key)}
          >
            <div className="activity-card-art">
              <img src={activity.image} alt={activity.title} className="activity-card-img" />
              {submittedActivities.has(activity.key) && (
                <span className="day-card-check">
                  <IconCheck />
                </span>
              )}
            </div>
            <div className="activity-card-footer">
              <Text className="activity-card-title">{activity.title}</Text>
              <Text className="activity-card-sub">{activity.sub}</Text>
            </div>
          </button>
        ))}
      </div>

      <div className="app-footer">
        <span>
          {APP_NAME} &copy; 2026
        </span>
        <button className="reset-link" onClick={onSwitchUser}>
          Switch user
        </button>
      </div>

      <button className="quest-float" onClick={onOpenMathQuest}>
        <span className="quest-float-bubble">Ready for today&rsquo;s quest? &#128640;</span>
        <img src="/images/quest.png" alt="mascot" className="quest-float-avatar" />
      </button>

      <ActivityUploadModal
        visible={!!activeActivity}
        activity={activeActivity}
        username={profile.username}
        onClose={() => setActiveActivity(null)}
        onSubmitted={refreshSubmittedActivities}
      />
    </div>
  )
}
