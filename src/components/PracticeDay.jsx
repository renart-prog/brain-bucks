import { useRef, useState } from 'react'
import { Card, Button, Radio, Input, Typography, Progress, Space, Tag, Message } from '@arco-design/web-react'
import { IconLeft } from '@arco-design/web-react/icon'
import { LESSON_TITLES } from '../data/questions'

const { Title, Paragraph, Text } = Typography
const RadioGroup = Radio.Group

function normalize(v) {
  return String(v).trim().toLowerCase()
}

function isCorrect(q, value) {
  if (value === undefined || value === null || value === '') return false
  if (q.type === 'num') {
    const n = Number(value)
    return !Number.isNaN(n) && n === q.correct
  }
  if (q.type === 'tf') {
    return normalize(value) === normalize(q.correct)
  }
  if (q.type === 'mc') {
    return Number(value) === q.correct
  }
  return false
}

export default function PracticeDay({ dayData, onSubmit, onProgress, onBack, initialProgress }) {
  const alreadyCompleted = !!initialProgress?.completed
  const [answers, setAnswers] = useState(initialProgress?.answers || {})
  const [submitted, setSubmitted] = useState(alreadyCompleted)
  const progressTimer = useRef(null)

  const total = dayData.questions.length
  const answeredCount = Object.keys(answers).filter((k) => answers[k] !== undefined && answers[k] !== '').length
  const correctCount = dayData.questions.filter((q) => isCorrect(q, answers[q.id])).length

  function setAnswer(id, value) {
    setAnswers((a) => {
      const next = { ...a, [id]: value }
      if (onProgress) {
        clearTimeout(progressTimer.current)
        progressTimer.current = setTimeout(() => onProgress(next), 500)
      }
      return next
    })
  }

  function handleSubmit() {
    if (answeredCount < total) {
      Message.warning(`Answer all ${total} questions before finishing the paper (${answeredCount}/${total} so far).`)
      return
    }
    let score = 0
    dayData.questions.forEach((q) => {
      if (isCorrect(q, answers[q.id])) score += 1
    })
    setSubmitted(true)
    onSubmit({ answers, score, total })
  }

  return (
    <div style={{ maxWidth: 720, margin: '0 auto' }}>
      <button className="lesson-back" onClick={onBack} aria-label="Back to Math Adventure">
        <IconLeft /> Back
      </button>
      <Card style={{ marginBottom: 16 }}>
        <Title heading={5} style={{ marginBottom: 4 }}>
          Day {dayData.day} &middot; Written Practice
        </Title>
        <Paragraph style={{ marginBottom: 8 }}>{LESSON_TITLES[dayData.lesson]}</Paragraph>
        <Progress percent={Math.round((correctCount / total) * 100)} status="success" showText />
      </Card>

      <Space direction="vertical" size={16} style={{ width: '100%' }}>
        {dayData.questions.map((q, idx) => (
          <Card key={q.id} bordered>
            <Space align="start" style={{ width: '100%' }}>
              <Tag className="tag-demon-num">{idx + 1}</Tag>
              <div style={{ flex: 1 }}>
                <Text className="question-prompt" style={{ display: 'block', marginBottom: 10 }}>{q.prompt}</Text>
                {q.type === 'mc' && (
                  <RadioGroup
                    direction="vertical"
                    disabled={submitted}
                    value={answers[q.id]}
                    onChange={(v) => setAnswer(q.id, v)}
                  >
                    {q.options.map((opt, i) => (
                      <Radio key={i} value={i}>
                        {opt}
                      </Radio>
                    ))}
                  </RadioGroup>
                )}
                {q.type === 'tf' && (
                  <RadioGroup
                    disabled={submitted}
                    value={answers[q.id]}
                    onChange={(v) => setAnswer(q.id, v)}
                  >
                    <Radio value={true}>True</Radio>
                    <Radio value={false}>False</Radio>
                  </RadioGroup>
                )}
                {q.type === 'num' && (
                  <Input
                    style={{ maxWidth: 200 }}
                    disabled={submitted}
                    placeholder="Your answer"
                    value={answers[q.id] ?? ''}
                    onChange={(v) => setAnswer(q.id, v)}
                  />
                )}
                {submitted && (
                  <Text
                    style={{ display: 'block', marginTop: 8 }}
                    type={isCorrect(q, answers[q.id]) ? 'success' : 'error'}
                  >
                    {isCorrect(q, answers[q.id]) ? 'Correct' : 'Not quite — give it another try next time'}
                  </Text>
                )}
              </div>
            </Space>
          </Card>
        ))}
      </Space>

      {!submitted && (
        <div style={{ textAlign: 'center', margin: '24px 0 48px' }}>
          <Button type="primary" size="large" onClick={handleSubmit}>
            Finish the paper
          </Button>
        </div>
      )}
      {alreadyCompleted && (
        <div style={{ textAlign: 'center', margin: '8px 0 48px' }}>
          <Text type="secondary">
            You already finished this paper: {initialProgress.score}/{initialProgress.total} correct.
          </Text>
          {initialProgress.score < initialProgress.total && (
            <Text style={{ display: 'block', marginTop: 4 }} type="warning">
              You need a perfect score to earn today&rsquo;s badge and unlock Day {dayData.day + 1}. Restart the day
              from the dashboard to try again!
            </Text>
          )}
        </div>
      )}
    </div>
  )
}
