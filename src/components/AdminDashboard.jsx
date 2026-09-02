import { useEffect, useState } from 'react'
import { Typography, Button, Select, Popconfirm, Message } from '@arco-design/web-react'
import { IconEdit } from '@arco-design/web-react/icon'
import {
  fetchActivitySubmissions,
  fetchActivitySubmission,
  fetchDayQuestionOverrides,
  setSubmissionPlace,
  fetchUsers,
  deleteUser,
} from '../utils/api'
import { DAY_THEME } from '../data/dayTheme'
import { APP_NAME } from '../data/brand'
import DayQuestionsEditorModal from './DayQuestionsEditorModal'
import SubmissionModal from './SubmissionModal'

const { Title, Text } = Typography

const DAYS_1_TO_7 = [1, 2, 3, 4, 5, 6, 7]

const ACTIVITY_SECTIONS = [
  { key: 'art-studio', title: 'Art Studio' },
  { key: 'rhyme-beats', title: 'Rhyme & Beats' },
  { key: 'story-time', title: 'StoryTime' },
]

const PLACE_LABELS = { 1: '1st place', 2: '2nd place', 3: '3rd place' }

export default function AdminDashboard({ onSwitchUser }) {
  const [users, setUsers] = useState([])
  const [submissions, setSubmissions] = useState([])
  const [dayOverrides, setDayOverrides] = useState({})
  const [editingDay, setEditingDay] = useState(null)
  const [activeSubmission, setActiveSubmission] = useState(null)

  function refreshUsers() {
    fetchUsers().then(setUsers)
  }

  function refreshSubmissions() {
    fetchActivitySubmissions().then(setSubmissions)
  }

  function refreshDayOverrides() {
    fetchDayQuestionOverrides().then(setDayOverrides)
  }

  useEffect(() => {
    refreshUsers()
    refreshSubmissions()
    refreshDayOverrides()
  }, [])

  async function handleViewSubmission(id) {
    const full = await fetchActivitySubmission(id)
    setActiveSubmission(full)
  }

  async function handlePlaceChange(id, place) {
    try {
      await setSubmissionPlace(id, place ?? null)
      refreshSubmissions()
    } catch {
      // leave the select as-is; refreshSubmissions() below re-syncs from the server on next load
    }
  }

  async function handleDeleteUser(username) {
    try {
      await deleteUser(username)
      Message.success(`Deleted ${username}.`)
      refreshUsers()
    } catch {
      Message.error('Could not delete that user.')
    }
  }

  return (
    <div className="page-container">
      <div className="brand-row">
        <img src="/images/bb-logo.svg" alt={APP_NAME} className="brand-logo" />
      </div>

      <div className="section-header">
        <Title heading={1} className="section-title">
          Users
        </Title>
      </div>

      <div className="admin-submission-section">
        {users.length === 0 ? (
          <Text className="admin-submission-empty">No users yet.</Text>
        ) : (
          users.map((u) => (
            <div key={u.username} className="admin-submission-row">
              <Text className="admin-submission-user">{u.username}</Text>
              <Text className="admin-submission-time">
                Last active {new Date(u.updated_at).toLocaleString()}
              </Text>
              <Popconfirm
                title={`Delete ${u.username}?`}
                content="This permanently removes their profile and test progress. This can't be undone."
                onOk={() => handleDeleteUser(u.username)}
              >
                <button className="admin-submission-view admin-submission-delete">Delete</button>
              </Popconfirm>
            </div>
          ))
        )}
      </div>

      <div className="section-header">
        <Title heading={1} className="section-title">
          Daily Test Questions
        </Title>
      </div>

      <div className="day-row">
        {DAYS_1_TO_7.map((day) => {
          const theme = DAY_THEME[day]
          const hasCustomQuestions = !!dayOverrides[day]
          return (
            <div key={day} className="day-card admin-day-card">
              <div className="day-card-art">
                <img src={theme.image} alt={theme.short} className="day-card-img" />
                {hasCustomQuestions && (
                  <span className="day-card-sheet-btn" title="Custom questions in use">
                    <IconEdit />
                  </span>
                )}
              </div>
              <div className="day-card-footer">
                <Text className="day-card-label" style={{ color: theme.color }}>
                  Day {day}
                </Text>
                <Text className="day-card-count">
                  {hasCustomQuestions ? 'Custom questions' : 'Built-in questions'}
                </Text>
                <div className="admin-day-card-actions">
                  <Button size="mini" onClick={() => setEditingDay(day)}>
                    Edit questions
                  </Button>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      <div className="section-header">
        <Title heading={1} className="section-title">
          Fun Activity Submissions
        </Title>
      </div>

      {ACTIVITY_SECTIONS.map((section) => {
        const rows = submissions.filter((s) => s.activity === section.key)
        return (
          <div key={section.key} className="admin-submission-section">
            <Text className="admin-submission-section-title">{section.title}</Text>
            {rows.length === 0 ? (
              <Text className="admin-submission-empty">No submissions yet.</Text>
            ) : (
              rows.map((row) => (
                <div key={row.id} className="admin-submission-row">
                  <Text className="admin-submission-user">{row.username}</Text>
                  <Text className="admin-submission-time">{new Date(row.createdAt).toLocaleString()}</Text>
                  <Select
                    size="mini"
                    style={{ width: 110 }}
                    placeholder="Place"
                    value={row.place ?? undefined}
                    allowClear
                    onChange={(v) => handlePlaceChange(row.id, v)}
                    onClear={() => handlePlaceChange(row.id, null)}
                  >
                    {[1, 2, 3].map((p) => (
                      <Select.Option key={p} value={p}>
                        {PLACE_LABELS[p]}
                      </Select.Option>
                    ))}
                  </Select>
                  <button className="admin-submission-view" onClick={() => handleViewSubmission(row.id)}>
                    View
                  </button>
                </div>
              ))
            )}
          </div>
        )
      })}

      <div className="app-footer">
        <span>
          {APP_NAME} Admin &copy; 2026
        </span>
        <button className="reset-link" onClick={onSwitchUser}>
          Log out
        </button>
      </div>

      <DayQuestionsEditorModal
        visible={!!editingDay}
        day={editingDay}
        onClose={() => setEditingDay(null)}
        onSaved={refreshDayOverrides}
      />
      <SubmissionModal
        visible={!!activeSubmission}
        submission={activeSubmission}
        onClose={() => setActiveSubmission(null)}
      />
    </div>
  )
}
