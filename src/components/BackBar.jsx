import { Button, Typography } from '@arco-design/web-react'
import { IconLeft } from '@arco-design/web-react/icon'

const { Text } = Typography

export default function BackBar({ title, onBack }) {
  return (
    <div className="back-bar">
      <Button shape="circle" icon={<IconLeft />} onClick={onBack} />
      <Text className="back-bar-title">{title}</Text>
    </div>
  )
}
