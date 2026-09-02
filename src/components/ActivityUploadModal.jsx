import { useEffect, useRef, useState } from 'react'
import { Modal, Button, Typography, Input, Message } from '@arco-design/web-react'
import { fetchActivitySubmissions, fetchActivitySubmission, submitActivity } from '../utils/api'
import { resizeImageToDataUrl, fileToDataUrl, assertFileSize } from '../utils/imageResize'
import FilePreview from './FilePreview'

const { Title, Text } = Typography
const { TextArea } = Input

const WEEK_MS = 7 * 24 * 60 * 60 * 1000

const ACTIVITY_CONFIG = {
  'art-studio': { title: 'Art Studio', accept: 'image/*', prompt: 'Upload a photo of your drawing or painting!' },
  'rhyme-beats': { title: 'Rhyme & Beats', accept: 'audio/*', prompt: 'Upload a recording of your song or rhyme!' },
  'story-time': { title: 'StoryTime', accept: null, prompt: 'Write your story below, or attach a file!' },
}

export default function ActivityUploadModal({ visible, activity, username, onClose, onSubmitted }) {
  const [lastSubmission, setLastSubmission] = useState(null)
  const [nextAvailableAt, setNextAvailableAt] = useState(null)
  const [textContent, setTextContent] = useState('')
  const [pendingFile, setPendingFile] = useState(null)
  const [submitting, setSubmitting] = useState(false)
  const fileInputRef = useRef(null)
  const config = ACTIVITY_CONFIG[activity]
  const locked = !!nextAvailableAt && nextAvailableAt.getTime() > Date.now()

  useEffect(() => {
    if (!visible || !activity) return
    setTextContent('')
    setPendingFile(null)
    fetchActivitySubmissions({ username, activity })
      .then((list) => {
        setNextAvailableAt(list.length ? new Date(new Date(list[0].createdAt).getTime() + WEEK_MS) : null)
        return list.length ? fetchActivitySubmission(list[0].id) : null
      })
      .then(setLastSubmission)
      .catch(() => setLastSubmission(null))
  }, [visible, activity, username])

  async function handleFileChange(e) {
    const file = e.target.files?.[0]
    e.target.value = '' // allow re-picking the same file to fire onChange again
    if (!file) return
    if (!assertFileSize(file)) {
      Message.error('File is too large — please choose a smaller file (max 8MB).')
      return
    }
    try {
      const data = file.type.startsWith('image/') ? await resizeImageToDataUrl(file, 1600) : await fileToDataUrl(file)
      setPendingFile({ fileName: file.name, mimeType: file.type, data })
    } catch {
      Message.error('Could not load that file — try a different one.')
    }
  }

  async function handleSubmit() {
    const trimmedText = textContent.trim()
    if (!pendingFile && !trimmedText) {
      Message.warning('Add something to submit first!')
      return
    }

    setSubmitting(true)
    try {
      await submitActivity(activity, {
        username,
        textContent: trimmedText || undefined,
        fileName: pendingFile?.fileName,
        mimeType: pendingFile?.mimeType,
        data: pendingFile?.data,
      })
      Message.success('Submitted! Great job.')
      onSubmitted?.()
      onClose()
    } catch (e) {
      if (e.message === 'already_submitted_this_week') {
        setNextAvailableAt(new Date(e.nextAvailableAt))
        Message.warning('You already submitted this activity this week.')
      } else {
        Message.error('Could not submit — check that the server is running and try again.')
      }
    } finally {
      setSubmitting(false)
    }
  }

  if (!config) return null

  return (
    <Modal visible={visible} footer={null} onCancel={onClose} style={{ width: 480 }}>
      <Title heading={5}>{config.title}</Title>
      <Text className="activity-modal-prompt">{config.prompt}</Text>

      {lastSubmission && (
        <div className="activity-modal-last">
          <Text className="activity-modal-last-label">Your last submission</Text>
          <FilePreview
            mimeType={lastSubmission.mimeType}
            data={lastSubmission.data}
            fileName={lastSubmission.fileName}
            textContent={lastSubmission.textContent}
          />
        </div>
      )}

      {locked ? (
        <div className="activity-modal-locked">
          You can submit {config.title} once a week. Come back on{' '}
          <strong>{nextAvailableAt.toLocaleDateString()}</strong> to submit again.
        </div>
      ) : (
        <>
          {activity === 'story-time' && (
            <TextArea
              placeholder="Once upon a time..."
              value={textContent}
              onChange={setTextContent}
              rows={5}
              style={{ marginTop: 12 }}
            />
          )}

          {pendingFile && (
            <div className="activity-modal-pending">
              <Text className="activity-modal-last-label">Ready to submit</Text>
              <FilePreview mimeType={pendingFile.mimeType} data={pendingFile.data} fileName={pendingFile.fileName} />
            </div>
          )}

          {config.accept && (
            <input
              ref={fileInputRef}
              type="file"
              accept={config.accept}
              style={{ display: 'none' }}
              onChange={handleFileChange}
            />
          )}
          {activity === 'story-time' && (
            <input ref={fileInputRef} type="file" style={{ display: 'none' }} onChange={handleFileChange} />
          )}

          <div style={{ display: 'flex', gap: 12, marginTop: 16 }}>
            <Button onClick={() => fileInputRef.current?.click()}>
              {activity === 'story-time' ? 'Attach a file (optional)' : 'Choose file'}
            </Button>
            <Button type="primary" loading={submitting} onClick={handleSubmit}>
              Submit
            </Button>
          </div>
        </>
      )}
    </Modal>
  )
}
