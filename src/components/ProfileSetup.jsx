import { useRef, useState } from 'react'
import { Input, Button, Message } from '@arco-design/web-react'
import { IconUpload } from '@arco-design/web-react/icon'
import { resizeImageToDataUrl } from '../utils/imageResize'
import { fetchUser, saveUser, adminLogin } from '../utils/api'
import { todayIso } from '../utils/storage'
import { APP_NAME, ADMIN_USERNAME } from '../data/brand'

export default function ProfileSetup({ onComplete }) {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [picture, setPicture] = useState(null)
  const [loading, setLoading] = useState(false)
  const fileInputRef = useRef(null)
  const isAdminUsername = username.trim() === ADMIN_USERNAME

  async function handleFileChange(e) {
    const file = e.target.files?.[0]
    if (!file) return
    try {
      const dataUrl = await resizeImageToDataUrl(file)
      setPicture(dataUrl)
    } catch {
      Message.error('Could not load that picture — try a different file.')
    }
  }

  async function handleContinue() {
    const trimmed = username.trim()
    if (!trimmed) {
      Message.warning('Enter a username to start your quest!')
      return
    }

    if (trimmed === ADMIN_USERNAME) {
      setLoading(true)
      try {
        const ok = await adminLogin(trimmed, password)
        if (ok) {
          onComplete({ username: ADMIN_USERNAME, isAdmin: true })
        } else {
          Message.error('Incorrect admin password.')
        }
      } catch {
        Message.error('Could not reach the BrainBucks server. Make sure it is running (npm run dev) and try again.')
      } finally {
        setLoading(false)
      }
      return
    }

    setLoading(true)
    try {
      const existing = await fetchUser(trimmed)
      let user
      if (existing) {
        // Returning user — pull their saved progress. Only touch their
        // stored picture if they picked a new one just now.
        user = picture ? await saveUser(trimmed, { picture }) : existing
        Message.success(`Welcome back, ${trimmed}!`)
      } else {
        user = await saveUser(trimmed, {
          picture,
          startDate: todayIso(),
          progress: {},
          grandPrizeRevealed: false,
        })
      }
      onComplete(user)
    } catch {
      Message.error('Could not reach the BrainBucks server. Make sure it is running (npm run dev) and try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="onboarding-page">
      <img src="/images/bb-logo.svg" alt={APP_NAME} className="onboarding-logo" />

      <div className="onboarding-card">
        <h2 className="onboarding-title">Setup Your Profile</h2>

        <Input
          className="onboarding-input"
          placeholder="Username"
          value={username}
          onChange={setUsername}
          onPressEnter={handleContinue}
          maxLength={24}
          disabled={loading}
        />

        {isAdminUsername ? (
          <Input.Password
            className="onboarding-input"
            placeholder="Password"
            value={password}
            onChange={setPassword}
            onPressEnter={handleContinue}
            disabled={loading}
          />
        ) : (
          <>
            <button
              className="onboarding-upload"
              onClick={() => fileInputRef.current?.click()}
              type="button"
              disabled={loading}
            >
              {picture ? (
                <img src={picture} alt="Your profile" className="onboarding-upload-img" />
              ) : (
                <>
                  <IconUpload style={{ fontSize: 24 }} />
                  <span>Upload picture</span>
                </>
              )}
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              style={{ display: 'none' }}
              onChange={handleFileChange}
            />
          </>
        )}

        <Button className="onboarding-start-btn" type="primary" long loading={loading} onClick={handleContinue}>
          {isAdminUsername ? 'Log in' : 'Start Quest'}
        </Button>
      </div>
    </div>
  )
}
