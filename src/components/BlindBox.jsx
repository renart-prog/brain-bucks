import { useState } from 'react'
import { Modal, Button, Typography, Space } from '@arco-design/web-react'

const { Title, Paragraph } = Typography

export default function BlindBox({ visible, badge, score, total, onClose }) {
  const [opened, setOpened] = useState(false)

  function handleAfterClose() {
    setOpened(false)
  }

  return (
    <Modal
      visible={visible}
      footer={null}
      closable={opened}
      maskClosable={opened}
      onCancel={onClose}
      afterClose={handleAfterClose}
      style={{ width: 360 }}
    >
      <div style={{ textAlign: 'center', padding: '12px 0' }}>
        {!opened ? (
          <>
            <Title heading={5}>Paper finished!</Title>
            <Paragraph>
              You scored {score} / {total}. Open your blind box to reveal today&rsquo;s badge.
            </Paragraph>
            <div
              onClick={() => setOpened(true)}
              style={{
                width: 140,
                height: 140,
                margin: '16px auto',
                borderRadius: 16,
                background: 'linear-gradient(135deg, #7c5fe0, #F300BF)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                boxShadow: '0 8px 24px rgba(243, 0, 191, 0.35)',
                border: '2px solid #00D2FF',
              }}
            >
              <span style={{ fontSize: 42 }}>&#127873;</span>
            </div>
            <Button type="primary" onClick={() => setOpened(true)}>
              Open blind box
            </Button>
          </>
        ) : (
          <>
            <img src={badge.image} alt={badge.name} style={{ width: 140, height: 140, margin: '0 auto 12px', display: 'block' }} />
            <Title heading={5} style={{ marginBottom: 4 }}>
              {badge.name}
            </Title>
            <Paragraph style={{ marginTop: 8 }}>{badge.blurb}</Paragraph>
            <Space>
              <Button type="primary" onClick={onClose}>
                Nice!
              </Button>
            </Space>
          </>
        )}
      </div>
    </Modal>
  )
}
