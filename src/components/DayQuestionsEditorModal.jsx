import { useEffect, useState } from 'react'
import { Modal, Button, Typography, Input, Select, Radio, InputNumber, Popconfirm, Message } from '@arco-design/web-react'
import { fetchDayQuestions, saveDayQuestions, deleteDayQuestions } from '../utils/api'
import { DAYS } from '../data/questions'

const { Title, Text } = Typography
const { TextArea } = Input
const RadioGroup = Radio.Group

let keySeq = 0
function nextKey() {
  keySeq += 1
  return `row-${keySeq}`
}

function blankRow(type = 'mc') {
  if (type === 'mc') return { _key: nextKey(), type, prompt: '', options: ['', ''], correct: 0 }
  if (type === 'tf') return { _key: nextKey(), type, prompt: '', correct: false }
  return { _key: nextKey(), type, prompt: '', correct: 0 }
}

function fromStored(question) {
  return { ...question, _key: nextKey() }
}

function validate(rows) {
  if (rows.length === 0) return "Add at least one question."
  for (const [idx, row] of rows.entries()) {
    if (!row.prompt.trim()) return `Question ${idx + 1} needs a prompt.`
    if (row.type === 'mc') {
      const filled = row.options.filter((o) => o.trim())
      if (filled.length < 2) return `Question ${idx + 1} needs at least 2 answer options.`
      if (!row.options[row.correct]?.trim()) return `Question ${idx + 1} needs a correct option chosen.`
    }
    if (row.type === 'num' && (typeof row.correct !== 'number' || Number.isNaN(row.correct))) {
      return `Question ${idx + 1} needs a numeric correct answer.`
    }
  }
  return null
}

export default function DayQuestionsEditorModal({ visible, day, onClose, onSaved }) {
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [isOverride, setIsOverride] = useState(false)

  useEffect(() => {
    if (!visible || !day) return
    setLoading(true)
    fetchDayQuestions(day)
      .then((record) => {
        if (record) {
          setIsOverride(true)
          setRows(record.questions.map(fromStored))
        } else {
          setIsOverride(false)
          const builtIn = DAYS.find((d) => d.day === day)
          setRows((builtIn?.questions || []).map(fromStored))
        }
      })
      .catch(() => Message.error('Could not load this day’s questions.'))
      .finally(() => setLoading(false))
  }, [visible, day])

  function updateRow(index, patch) {
    setRows((prev) => prev.map((r, i) => (i === index ? { ...r, ...patch } : r)))
  }

  function changeType(index, type) {
    setRows((prev) => prev.map((r, i) => (i === index ? { ...blankRow(type), _key: r._key, prompt: r.prompt } : r)))
  }

  function addRow() {
    setRows((prev) => [...prev, blankRow()])
  }

  function removeRow(index) {
    setRows((prev) => prev.filter((_, i) => i !== index))
  }

  function updateOption(index, optIndex, text) {
    setRows((prev) =>
      prev.map((r, i) => (i === index ? { ...r, options: r.options.map((o, oi) => (oi === optIndex ? text : o)) } : r))
    )
  }

  function addOption(index) {
    setRows((prev) => prev.map((r, i) => (i === index ? { ...r, options: [...r.options, ''] } : r)))
  }

  function removeOption(index, optIndex) {
    setRows((prev) =>
      prev.map((r, i) => {
        if (i !== index) return r
        const options = r.options.filter((_, oi) => oi !== optIndex)
        const correct = r.correct >= options.length ? 0 : r.correct
        return { ...r, options, correct }
      })
    )
  }

  async function handleSave() {
    const error = validate(rows)
    if (error) {
      Message.warning(error)
      return
    }
    setSaving(true)
    try {
      await saveDayQuestions(
        day,
        rows.map(({ _key, ...rest }) => rest)
      )
      Message.success(`Day ${day} questions saved.`)
      onSaved?.()
      onClose()
    } catch (e) {
      Message.error(e.message || 'Could not save these questions.')
    } finally {
      setSaving(false)
    }
  }

  async function handleRevert() {
    setSaving(true)
    try {
      await deleteDayQuestions(day)
      const builtIn = DAYS.find((d) => d.day === day)
      setRows((builtIn?.questions || []).map(fromStored))
      setIsOverride(false)
      Message.success(`Day ${day} reverted to the built-in questions.`)
      onSaved?.()
    } catch {
      Message.error('Could not revert this day.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal visible={visible} footer={null} onCancel={onClose} style={{ width: 640 }}>
      <Title heading={5}>Day {day} questions</Title>
      <Text className="submission-modal-meta">
        {isOverride ? 'Using a custom question set for this day.' : 'Currently using the built-in question set.'}
      </Text>

      {!loading && (
        <div className="question-editor-list">
          {rows.map((row, index) => (
            <div key={row._key} className="question-editor-row">
              <div className="question-editor-row-head">
                <Text className="question-editor-row-num">Q{index + 1}</Text>
                <Select
                  size="small"
                  style={{ width: 140 }}
                  value={row.type}
                  onChange={(v) => changeType(index, v)}
                >
                  <Select.Option value="mc">Multiple choice</Select.Option>
                  <Select.Option value="tf">True / False</Select.Option>
                  <Select.Option value="num">Numeric</Select.Option>
                </Select>
                <Button size="small" status="danger" onClick={() => removeRow(index)}>
                  Remove
                </Button>
              </div>

              <TextArea
                placeholder="Question prompt"
                value={row.prompt}
                onChange={(v) => updateRow(index, { prompt: v })}
                autoSize={{ minRows: 1, maxRows: 3 }}
              />

              {row.type === 'mc' && (
                <div className="question-editor-options">
                  <RadioGroup value={row.correct} onChange={(v) => updateRow(index, { correct: v })}>
                    {row.options.map((opt, optIndex) => (
                      <div key={optIndex} className="question-editor-option-row">
                        <Radio value={optIndex} />
                        <Input
                          size="small"
                          placeholder={`Option ${optIndex + 1}`}
                          value={opt}
                          onChange={(v) => updateOption(index, optIndex, v)}
                        />
                        {row.options.length > 2 && (
                          <Button size="mini" type="text" onClick={() => removeOption(index, optIndex)}>
                            &times;
                          </Button>
                        )}
                      </div>
                    ))}
                  </RadioGroup>
                  <Button size="mini" type="text" onClick={() => addOption(index)}>
                    + Add option
                  </Button>
                </div>
              )}

              {row.type === 'tf' && (
                <RadioGroup value={row.correct} onChange={(v) => updateRow(index, { correct: v })}>
                  <Radio value={true}>True</Radio>
                  <Radio value={false}>False</Radio>
                </RadioGroup>
              )}

              {row.type === 'num' && (
                <InputNumber
                  size="small"
                  style={{ width: 160 }}
                  placeholder="Correct answer"
                  value={row.correct}
                  onChange={(v) => updateRow(index, { correct: v })}
                />
              )}
            </div>
          ))}

          <Button onClick={addRow}>+ Add question</Button>
        </div>
      )}

      <div className="question-editor-actions">
        <Button type="primary" loading={saving} onClick={handleSave}>
          Save
        </Button>
        {isOverride && (
          <Popconfirm
            title={`Revert Day ${day} to the built-in questions?`}
            content="This discards your custom question set for this day."
            onOk={handleRevert}
          >
            <Button status="danger" loading={saving}>
              Revert to built-in
            </Button>
          </Popconfirm>
        )}
      </div>
    </Modal>
  )
}
