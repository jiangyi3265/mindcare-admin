import test from 'node:test'
import assert from 'node:assert/strict'
import { buildAssessmentPayload } from '../src/views/mindcare/content/assessmentPayload.js'

const base = {
  id: 'rses-10', title: 'Rosenberg自尊量表', category: '自我认知',
  count: 2, minutes: 4, questions: ['原题1', '原题2'],
  options: ['不同意', '同意'], optionValues: [0, 1],
  sourceName: 'Rosenberg', sourceUrl: 'https://example.org/rses',
  license: '公共领域', version: '原始版', period: '过去两周',
  interpretation: '反向题已换算，不设未经验证的临界值。',
  isExploratory: false, instrumentType: 'self-esteem',
  scoring: { type: 'sum', maxScore: 2, displayMax: 2, label: 'RSES总分', reverseItems: [1], customKey: 'retain' },
  crisisRules: { direction: 'none', customKey: 'retain' }
}

const form = {
  contentKey: base.id, title: base.title, category: base.category,
  summary: '更新后的介绍', minutes: 4, questions: [...base.questions],
  options: [...base.options], optionValues: [...base.optionValues],
  sourceName: base.sourceName, sourceUrl: base.sourceUrl,
  license: base.license, version: base.version,
  scoringType: 'sum', scoreMax: 2,
  crisisDirection: 'none', crisisThreshold: 0,
  crisisAnswerIndex: -1, crisisAnswerMin: 1, crisisReason: ''
}

test('editing a sourced assessment retains reverse scoring and non-editable metadata', () => {
  const result = buildAssessmentPayload(base, form)
  assert.equal(result.description, '更新后的介绍')
  assert.deepEqual(result.scoring.reverseItems, [1])
  assert.equal(result.scoring.label, 'RSES总分')
  assert.equal(result.scoring.customKey, 'retain')
  assert.equal(result.period, '过去两周')
  assert.equal(result.interpretation, base.interpretation)
  assert.equal(result.instrumentType, 'self-esteem')
  assert.equal(result.crisisRules.customKey, 'retain')
  assert.equal(result.isExploratory, false)
  assert.deepEqual(base.questions, ['原题1', '原题2'])
})

test('editing an exploratory questionnaire retains its nonstandard marker', () => {
  const result = buildAssessmentPayload({ ...base, isExploratory: true, interpretation: '不产生标准分数。' }, form)
  assert.equal(result.isExploratory, true)
  assert.equal(result.interpretation, '不产生标准分数。')
})

test('removing an item-triggered risk rule does not leave stale item indexes', () => {
  const source = { ...base, crisisRules: { direction: 'high', threshold: 10, answerIndex: 1, answerMin: 1, customKey: 'retain' } }
  const result = buildAssessmentPayload(source, form)
  assert.equal(result.crisisRules.direction, 'none')
  assert.equal(result.crisisRules.level, 'normal')
  assert.equal('answerIndex' in result.crisisRules, false)
  assert.equal('answerMin' in result.crisisRules, false)
  assert.equal(result.crisisRules.customKey, 'retain')
})
