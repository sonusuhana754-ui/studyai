/** Central registry so Home + tabs always show the same feature list */

export type FeatureRoute =
  | '/scan'
  | '/explainer-topic'
  | '/flashcards-topic'
  | '/quiz'
  | '/exam-sim'
  | '/study-planner'
  | '/voice-tutor'
  | '/knowledge-graph'
  | '/learning-vault'
  | '/teach-back'

export type LearningFeature = {
  id: string
  title: string
  subtitle: string
  emoji: string
  route: FeatureRoute
  color: string
}

export const LEARNING_FEATURES: LearningFeature[] = [
  { id: 'scan', title: 'Scan & Solve', subtitle: 'Camera + teacher styles', emoji: '📷', route: '/scan', color: '#0ea5a4' },
  { id: 'explainer', title: 'Video Explainer', subtitle: 'Voice + subtitles', emoji: '🎬', route: '/explainer-topic', color: '#a78bfa' },
  { id: 'flashcards', title: 'Flashcards', subtitle: 'Spaced repetition', emoji: '⚡', route: '/flashcards-topic', color: '#fbbf24' },
  { id: 'quiz', title: 'Quiz Mode', subtitle: 'Practice questions', emoji: '🧠', route: '/quiz', color: '#4ade80' },
  { id: 'exam', title: 'Exam Simulator', subtitle: 'Timed pressure mode', emoji: '⏱️', route: '/exam-sim', color: '#f97316' },
  { id: 'planner', title: 'Study Planner', subtitle: '7-day AI schedule', emoji: '📅', route: '/study-planner', color: '#38bdf8' },
  { id: 'voice', title: 'Voice Tutor', subtitle: 'Ask anything aloud', emoji: '🎙️', route: '/voice-tutor', color: '#ec4899' },
  { id: 'graph', title: 'Knowledge Graph', subtitle: 'Concept connections', emoji: '🗺️', route: '/knowledge-graph', color: '#818cf8' },
  { id: 'vault', title: 'Learning Vault', subtitle: 'Your study memory', emoji: '📚', route: '/learning-vault', color: '#94a3b8' },
  { id: 'teach', title: 'Teach Back', subtitle: 'Explain to the AI', emoji: '🎓', route: '/teach-back', color: '#2dd4bf' },
]
