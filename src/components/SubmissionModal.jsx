import { Modal, Typography } from '@arco-design/web-react'
import FilePreview from './FilePreview'

const { Title, Text } = Typography

const ACTIVITY_LABELS = {
  'art-studio': 'Art Studio',
  'rhyme-beats': 'Rhyme & Beats',
  'story-time': 'StoryTime',
}

export default function SubmissionModal({ visible, submission, onClose }) {
  return (
    <Modal visible={visible} footer={null} onCancel={onClose} style={{ width: 480 }}>
      {submission && (
        <>
          <Title heading={5}>{ACTIVITY_LABELS[submission.activity] || submission.activity}</Title>
          <Text className="submission-modal-meta">
            {submission.username} &middot; {new Date(submission.createdAt).toLocaleString()}
          </Text>
          <FilePreview
            mimeType={submission.mimeType}
            data={submission.data}
            fileName={submission.fileName}
            textContent={submission.textContent}
          />
        </>
      )}
    </Modal>
  )
}
