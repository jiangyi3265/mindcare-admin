/** Keep imported scale metadata (for example reverse-scored items and
 * interpretation notes) when the visual editor changes its exposed fields. */
export function buildAssessmentPayload(basePayload, form) {
  const base = basePayload && typeof basePayload === 'object' && !Array.isArray(basePayload) ? basePayload : {}
  const baseRules = base.crisisRules && typeof base.crisisRules === 'object' ? base.crisisRules : {}
  const crisisRules = {
    ...baseRules,
    direction: form.crisisDirection,
    threshold: form.crisisThreshold,
    level: form.crisisDirection === 'none' ? 'normal' :
      baseRules.direction === form.crisisDirection && baseRules.level ? baseRules.level : 'high',
    reason: form.crisisReason
  }
  if (form.crisisDirection !== 'none' && Number(form.crisisAnswerIndex) >= 0) {
    crisisRules.answerIndex = Number(form.crisisAnswerIndex)
    crisisRules.answerMin = Number(form.crisisAnswerMin)
  } else {
    delete crisisRules.answerIndex
    delete crisisRules.answerMin
  }

  const baseScoring = base.scoring && typeof base.scoring === 'object' ? base.scoring : {}
  const scoring = {
    ...baseScoring,
    type: form.scoringType,
    maxScore: form.scoreMax,
    displayMax: Number(baseScoring.maxScore) === Number(form.scoreMax) && baseScoring.displayMax != null
      ? baseScoring.displayMax : form.scoreMax,
    label: baseScoring.type === form.scoringType && baseScoring.label
      ? baseScoring.label : (form.scoringType === 'sum' ? '原始总分' : '状态指数')
  }

  return {
    ...base,
    id: form.contentKey,
    title: form.title,
    category: form.category,
    description: form.summary,
    count: form.questions.length,
    minutes: form.minutes,
    questions: form.questions,
    options: form.options,
    optionValues: form.optionValues,
    sourceName: form.sourceName,
    sourceUrl: form.sourceUrl,
    license: form.license,
    version: form.version,
    scoring,
    crisisRules
  }
}
