import { Modal, Button, Typography } from '@arco-design/web-react'
import { GRAND_PRIZE } from '../data/bonusRewards'

const { Title, Paragraph, Text } = Typography

export default function GrandPrizeModal({ visible, username, onClose }) {
  return (
    <Modal visible={visible} footer={null} onCancel={onClose} maskClosable style={{ width: 380 }}>
      <div style={{ textAlign: 'center', padding: '8px 0' }}>
        <div style={{ fontSize: 52 }}>&#127881;</div>
        <Title heading={4} style={{ marginBottom: 4 }}>
          All 7 days complete, {username}!
        </Title>
        <Paragraph>
          You finished every written practice this week. You&rsquo;ve earned a real-world grand prize.
        </Paragraph>
        <div
          style={{
            margin: '4px 0 20px',
            padding: 14,
            borderRadius: 12,
            background: 'rgba(0, 210, 255, 0.08)',
            border: '1px solid #00D2FF',
          }}
        >
          <Text bold style={{ display: 'block', marginBottom: 6 }}>
            &#127873; Grand prize
          </Text>
          <a className="prize-link" href={GRAND_PRIZE.url} target="_blank" rel="noopener noreferrer">
            {GRAND_PRIZE.label}
          </a>
        </div>
        <Button type="primary" onClick={onClose}>
          Amazing!
        </Button>
      </div>
    </Modal>
  )
}
