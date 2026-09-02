import { useEffect, useState } from 'react'
import { Typography } from '@arco-design/web-react'
import BackBar from './BackBar'
import { BADGES } from '../data/badges'
import { BADGE_NAMES } from '../data/badgeNames'
import { WEEKS, WEEKLY_REWARD } from '../data/weeks'
import { PLACE_PRIZES } from '../data/prizes'
import { fetchActivitySubmissions } from '../utils/api'

const { Title, Text } = Typography

export default function Collection({ state, onBack }) {
  const [activityEarnings, setActivityEarnings] = useState(0)

  useEffect(() => {
    fetchActivitySubmissions({ username: state.username }).then((rows) => {
      const total = rows.reduce((sum, r) => sum + (PLACE_PRIZES[r.place] || 0), 0)
      setActivityEarnings(total)
    })
  }, [state.username])

  const weekStats = WEEKS.map((w) => {
    const passedCount = w.active ? w.days.filter((d) => state.progress[d]?.passed).length : 0
    return { ...w, passedCount, rewardUnlocked: passedCount === w.days.length }
  })
  const totalEarned = weekStats.filter((w) => w.rewardUnlocked).length * WEEKLY_REWARD + activityEarnings

  return (
    <div className="progress-page">
      <div className="progress-sticky-header">
        <BackBar title="Collection" onBack={onBack} />

        <Title heading={4} className="badge-collection-title badge-collection-title-centered">
          {state.username}&rsquo;s Progress
        </Title>
        <Text className="badge-collection-sub badge-collection-sub-centered">
          Finish a written practice with a perfect score to unlock the next badge and earn your weekly surprise!
        </Text>

        <div className="money-banner">
          <span className="money-banner-icon" role="img" aria-label="wallet">
            &#128091;
          </span>
          <div>
            <Text className="money-banner-label">Total earned so far</Text>
            <Text className="money-banner-amount">${totalEarned.toFixed(2)}</Text>
          </div>
        </div>
      </div>

      <div className="progress-scroll-body">
        {weekStats.map((w) => (
          <div className="week-block" key={w.week}>
            <Text className="week-label">
              Week {w.week} &middot; {w.passedCount}/{w.days.length} badges
            </Text>
            <div className="week-row">
              {w.days.map((day) => {
                const badge = BADGES[day - 1]
                const label = BADGE_NAMES[day - 1]
                const unlocked = w.active && !!state.progress[day]?.passed
                return (
                  <div className="badge-collection-card" key={badge.id}>
                    <img
                      src={badge.image}
                      alt={label.name}
                      className="badge-collection-img"
                      style={{ filter: unlocked ? 'none' : 'grayscale(1) opacity(0.4)' }}
                    />
                    <Text
                      className="badge-collection-name"
                      style={{ color: unlocked ? label.color : 'var(--text-secondary)' }}
                    >
                      {label.name.toUpperCase()}
                    </Text>
                  </div>
                )
              })}
              <div className={`mystery-box-card ${w.rewardUnlocked ? 'mystery-box-unlocked' : ''}`}>
                <span className="mystery-box-icon" role="img" aria-label="credit card">
                  &#128179;
                </span>
                <Text className="mystery-box-label">Mystery Box</Text>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
