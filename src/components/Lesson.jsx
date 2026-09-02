import { Typography, Button } from '@arco-design/web-react'
import { IconRight, IconLeft } from '@arco-design/web-react/icon'
import { LESSON_NOTES } from '../data/lessonNotes'
import { DAY_THEME } from '../data/dayTheme'

const { Title, Paragraph, Text } = Typography

export default function Lesson({ day, onStartTest, onBack }) {
  const note = LESSON_NOTES[day]
  const theme = DAY_THEME[day]

  return (
    <div className="lesson-page">
      <button className="lesson-back" onClick={onBack} aria-label="Back to Math Adventure">
        <IconLeft /> Back
      </button>

      <div className="lesson-banner" style={{ background: theme.color }}>
        <img src={theme.image} alt="" className="lesson-banner-img" />
        <div>
          <Text className="lesson-banner-kicker">New Concept &middot; Day {day}</Text>
          <Title heading={4} className="lesson-banner-title">
            {note.title}
          </Title>
        </div>
      </div>

      <div className="lesson-article">
        {note.intro.map((p, i) => (
          <Paragraph key={i} className="lesson-paragraph">
            {p}
          </Paragraph>
        ))}

        <div className="lesson-terms">
          <Text className="lesson-tip-label">Key Terms</Text>
          <div className="lesson-terms-grid">
            {note.terms.map((t) => (
              <div className="lesson-term-chip" key={t.term}>
                <Text bold className="lesson-term-name">
                  {t.term}
                </Text>
                <Text className="lesson-term-def">{t.def}</Text>
              </div>
            ))}
          </div>
        </div>

        <div className="lesson-tip-card">
          <Text className="lesson-tip-label">{note.tip.label}</Text>
          <Text className="lesson-tip-text">{note.tip.text}</Text>
        </div>

        {note.mistake && (
          <div className="lesson-mistake">
            <Text className="lesson-tip-label lesson-mistake-label">&#9888; {note.mistake.label}</Text>
            <div className="lesson-mistake-sign">{note.mistake.badExample}</div>
            <Paragraph className="lesson-mistake-reason">{note.mistake.reason}</Paragraph>
          </div>
        )}

        <div className="lesson-example">
          <Text className="lesson-tip-label">Example</Text>
          <Paragraph style={{ marginTop: 6, marginBottom: 4 }}>{note.example.prompt}</Paragraph>
          <Text type="secondary">{note.example.solution}</Text>
        </div>
      </div>

      <div style={{ textAlign: 'center', margin: '28px 0 8px' }}>
        <Button type="primary" size="large" onClick={onStartTest}>
          Start today&rsquo;s test <IconRight />
        </Button>
      </div>
    </div>
  )
}
