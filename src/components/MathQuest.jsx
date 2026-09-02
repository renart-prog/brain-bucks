import { useState } from 'react'
import { Input, Button, Typography, Message } from '@arco-design/web-react'
import { MATH_QUESTS } from '../data/mathQuests'

const { Title, Paragraph, Text } = Typography

function renderBold(text) {
  return text.split('**').map((part, i) => (i % 2 === 1 ? <strong key={i}>{part}</strong> : part))
}

function QuestCard({ quest, index }) {
  const [value, setValue] = useState('')
  const [result, setResult] = useState(null) // null | true | false

  function checkAnswer() {
    const trimmed = value.trim()
    if (!trimmed) {
      Message.warning('Enter your answer first!')
      return
    }
    const solved = trimmed === quest.answer
    setResult(solved)
  }

  return (
    <div className="quest-card">
      <Title heading={5} className="quest-card-title">
        {index + 1}. {quest.title} <span className="quest-card-type">({quest.type})</span>
      </Title>

      <Paragraph className="quest-card-line">
        <Text bold>Goal:</Text> <em>{quest.goal}</em>
      </Paragraph>

      {quest.clues.map((clue, i) => (
        <Paragraph className="quest-card-line" key={i}>
          <Text bold>Clue {i + 1}:</Text> {renderBold(clue)}
        </Paragraph>
      ))}

      <Paragraph className="quest-card-line">
        <Text bold>Question:</Text> <em>{quest.question}</em>
      </Paragraph>

      <div className="quest-card-answer">
        <Input
          placeholder="Your answer"
          value={value}
          onChange={(v) => {
            setValue(v)
            setResult(null)
          }}
          onPressEnter={checkAnswer}
          style={{ maxWidth: 220 }}
        />
        <Button type="primary" onClick={checkAnswer}>
          Check Answer
        </Button>
      </div>

      {result === true && (
        <Text className="quest-card-feedback quest-card-feedback-success">
          &#128275; Vault unlocked! The code was {quest.answer}. Great detective work!
        </Text>
      )}
      {result === false && (
        <Text className="quest-card-feedback quest-card-feedback-error">
          Not quite — walk back through the clues and try again.
        </Text>
      )}
    </div>
  )
}

export default function MathQuest({ onBack }) {
  return (
    <div className="page-container">
      <button className="lesson-back" onClick={onBack} aria-label="Back to Math Adventure">
        &larr; Back
      </button>

      <div className="section-header">
        <Title heading={1} className="section-title">
          Math Quest
        </Title>
        <span className="tag-pill tag-pill-teal">Bonus Puzzles</span>
      </div>
      <Paragraph className="quest-intro">
        A logic puzzle to stretch your brain. Read every clue carefully — the code is always hiding in plain sight!
      </Paragraph>

      {MATH_QUESTS.map((quest, i) => (
        <QuestCard quest={quest} index={i} key={quest.id} />
      ))}
    </div>
  )
}
