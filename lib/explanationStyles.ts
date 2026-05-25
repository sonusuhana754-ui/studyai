export type ExplanationStyleId =
  | 'friendly'
  | 'exam'
  | 'visual'
  | 'shortcut'
  | 'beginner'
  | 'jee'
  | 'neet'
  | 'professor'

export type ExplanationStyle = {
  id: ExplanationStyleId
  label: string
  emoji: string
  description: string
}

export const EXPLANATION_STYLES: ExplanationStyle[] = [
  { id: 'friendly', label: 'Friendly tutor', emoji: '🙂', description: 'Warm, encouraging, simple language' },
  { id: 'exam', label: 'Exam teacher', emoji: '📝', description: 'Strict marking scheme, exam traps' },
  { id: 'visual', label: 'Visual learner', emoji: '👁️', description: 'Diagrams, analogies, spatial intuition' },
  { id: 'shortcut', label: 'Shortcuts', emoji: '⚡', description: 'Fast tricks and pattern recognition' },
  { id: 'beginner', label: 'Beginner', emoji: '🌱', description: 'No jargon, tiny steps' },
  { id: 'jee', label: 'IIT-JEE', emoji: '🎯', description: 'Competitive depth, clever methods' },
  { id: 'neet', label: 'NEET', emoji: '🩺', description: 'NCERT-aligned, high-yield facts' },
  { id: 'professor', label: 'Professor', emoji: '🎓', description: 'Rigorous, theory-first' },
]

const STYLE_PROMPTS: Record<ExplanationStyleId, string> = {
  friendly:
    'Explain like a supportive private tutor. Use encouraging tone, relatable examples, and check understanding.',
  exam:
    'Explain like a strict board-exam teacher. Mention common mistakes, marking points, and what examiners expect.',
  visual:
    'Explain for a visual learner. Use spatial analogies, "picture this" descriptions, and graph/shape intuition.',
  shortcut:
    'Focus on fast solution patterns, tricks, and when to apply them. Flag similar problem types.',
  beginner:
    'Assume zero prior knowledge. Define every term, use the smallest possible steps, avoid jargon.',
  jee:
    'Explain at IIT-JEE level: elegant methods, multiple approaches, time-saving insights, competition traps.',
  neet:
    'Explain at NEET level: NCERT alignment, high-yield facts, clinical/real-life links where relevant.',
  professor:
    'Explain like a university professor: precise definitions, why the method works, and deeper theory.',
}

export function getStylePromptModifier(styleId: ExplanationStyleId): string {
  return STYLE_PROMPTS[styleId] ?? STYLE_PROMPTS.friendly
}

export const DEFAULT_EXPLANATION_STYLE: ExplanationStyleId = 'friendly'
