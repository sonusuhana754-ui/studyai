import AsyncStorage from '@react-native-async-storage/async-storage'

const EVENTS_KEY = '@studyai:learning_events'
const REVISION_KEY = '@studyai:revision_queue'
const MAX_EVENTS = 500

export type LearningEventType =
  | 'solve'
  | 'quiz_correct'
  | 'quiz_wrong'
  | 'hint_reveal'
  | 'flashcard_miss'
  | 'flashcard_known'

export interface LearningEvent {
  id: string
  type: LearningEventType
  topic: string
  subject: string
  tags?: string[]
  createdAt: string
}

export interface RevisionItem {
  id: string
  topic: string
  subject: string
  nextReviewAt: string
  intervalDays: number
  ease: number
}

export interface LearningInsight {
  id: string
  message: string
  severity: 'info' | 'focus'
  topic?: string
  subject?: string
}

async function loadEvents(): Promise<LearningEvent[]> {
  const raw = await AsyncStorage.getItem(EVENTS_KEY)
  return raw ? JSON.parse(raw) : []
}

async function saveEvents(events: LearningEvent[]): Promise<void> {
  await AsyncStorage.setItem(EVENTS_KEY, JSON.stringify(events.slice(0, MAX_EVENTS)))
}

export async function recordLearningEvent(
  event: Omit<LearningEvent, 'id' | 'createdAt'>
): Promise<void> {
  const events = await loadEvents()
  events.unshift({
    ...event,
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    createdAt: new Date().toISOString(),
  })
  await saveEvents(events)
}

export async function scheduleRevision(topic: string, subject: string, known: boolean): Promise<void> {
  const raw = await AsyncStorage.getItem(REVISION_KEY)
  const items: RevisionItem[] = raw ? JSON.parse(raw) : []
  const key = `${subject}::${topic}`.toLowerCase()
  const idx = items.findIndex((i) => `${i.subject}::${i.topic}`.toLowerCase() === key)

  if (idx === -1) {
    items.push({
      id: Date.now().toString(),
      topic,
      subject,
      nextReviewAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      intervalDays: 1,
      ease: 2.5,
    })
  } else {
    const item = items[idx]
    if (known) {
      item.intervalDays = Math.min(30, Math.round(item.intervalDays * item.ease))
      item.ease = Math.min(3, item.ease + 0.1)
    } else {
      item.intervalDays = 1
      item.ease = Math.max(1.3, item.ease - 0.2)
    }
    item.nextReviewAt = new Date(Date.now() + item.intervalDays * 86400000).toISOString()
    items[idx] = item
  }

  await AsyncStorage.setItem(REVISION_KEY, JSON.stringify(items))
}

export async function getDueRevisionItems(): Promise<RevisionItem[]> {
  const raw = await AsyncStorage.getItem(REVISION_KEY)
  const items: RevisionItem[] = raw ? JSON.parse(raw) : []
  const now = Date.now()
  return items.filter((i) => new Date(i.nextReviewAt).getTime() <= now)
}

export async function getDueRevisionCount(): Promise<number> {
  return (await getDueRevisionItems()).length
}

function groupByTopic(events: LearningEvent[]) {
  const map = new Map<string, { topic: string; subject: string; hints: number; wrong: number; solves: number }>()
  for (const e of events) {
    const k = `${e.subject}::${e.topic}`.toLowerCase()
    const cur = map.get(k) ?? { topic: e.topic, subject: e.subject, hints: 0, wrong: 0, solves: 0 }
    if (e.type === 'hint_reveal') cur.hints += 1
    if (e.type === 'quiz_wrong' || e.type === 'flashcard_miss') cur.wrong += 1
    if (e.type === 'solve') cur.solves += 1
    map.set(k, cur)
  }
  return [...map.values()]
}

export async function getLearningInsights(): Promise<LearningInsight[]> {
  const events = await loadEvents()
  const insights: LearningInsight[] = []
  const grouped = groupByTopic(events)

  const hintHeavy = grouped
    .filter((g) => g.hints >= 3 && g.hints > g.solves)
    .sort((a, b) => b.hints - a.hints)
    .slice(0, 2)

  for (const g of hintHeavy) {
    insights.push({
      id: `hint-${g.topic}`,
      message: `You often need extra hints on "${g.topic}" — try a short video lesson or flashcards.`,
      severity: 'focus',
      topic: g.topic,
      subject: g.subject,
    })
  }

  const weak = grouped
    .filter((g) => g.wrong >= 2)
    .sort((a, b) => b.wrong - a.wrong)
    .slice(0, 2)

  for (const g of weak) {
    insights.push({
      id: `weak-${g.topic}`,
      message: `Quiz/flashcard misses cluster on "${g.topic}" — schedule focused revision.`,
      severity: 'focus',
      topic: g.topic,
      subject: g.subject,
    })
  }

  const due = await getDueRevisionCount()
  if (due > 0) {
    insights.push({
      id: 'revision-due',
      message: `${due} topic${due === 1 ? '' : 's'} due for spaced revision today.`,
      severity: 'info',
    })
  }

  const recentHints = events.filter((e) => e.type === 'hint_reveal').length
  const recentSolves = events.filter((e) => e.type === 'solve').length
  if (recentSolves >= 5 && recentHints / Math.max(recentSolves, 1) > 2) {
    insights.push({
      id: 'doubt-pattern',
      message:
        'You reveal many hints before finishing — slow down and try one step yourself before the next hint.',
      severity: 'info',
    })
  }

  if (insights.length === 0 && recentSolves > 0) {
    insights.push({
      id: 'on-track',
      message: 'Keep going — solve a few more problems to unlock personalized weakness detection.',
      severity: 'info',
    })
  }

  return insights.slice(0, 4)
}

export async function getRecentEvents(limit = 40): Promise<LearningEvent[]> {
  const events = await loadEvents()
  return events.slice(0, limit)
}

export interface KnowledgeNode {
  id: string
  label: string
  subject: string
  mastery: number
  links: string[]
}

export async function getKnowledgeGraph(): Promise<KnowledgeNode[]> {
  const grouped = groupByTopic(await loadEvents())
  return grouped.map((g) => {
    const mastery = Math.min(
      100,
      Math.round((g.solves * 20 + Math.max(0, 3 - g.wrong) * 10) / Math.max(g.solves + g.wrong, 1))
    )
    return {
      id: `${g.subject}-${g.topic}`,
      label: g.topic,
      subject: g.subject,
      mastery,
      links: guessLinks(g.topic, g.subject),
    }
  })
}

function guessLinks(topic: string, subject: string): string[] {
  const t = topic.toLowerCase()
  const links: string[] = []
  if (/quadratic|algebra|equation/.test(t)) links.push('Linear equations', 'Graphing')
  if (/integration|derivative|calculus/.test(t)) links.push('Limits', 'Applications in physics')
  if (/photosynthesis|cell/.test(t)) links.push('Ecology', 'Chemistry of life')
  if (/newton|force|motion/.test(t)) links.push('Kinematics', 'Energy')
  if (subject.toLowerCase() === 'mathematics' && links.length === 0) links.push('Practice problems', 'Exam prep')
  return links.slice(0, 3)
}

export interface ErrorPattern {
  pattern: string
  topic: string
  subject: string
  severity: 'high' | 'medium'
}

export async function getErrorPatterns(): Promise<ErrorPattern[]> {
  const grouped = groupByTopic(await loadEvents())
  const patterns: ErrorPattern[] = []
  for (const g of grouped) {
    if (g.hints >= 2 && g.hints >= g.solves) {
      patterns.push({
        pattern: 'Conceptual gap — relies on hints before finishing',
        topic: g.topic,
        subject: g.subject,
        severity: 'high',
      })
    }
    if (g.wrong >= 2) {
      patterns.push({
        pattern: 'Repeated quiz/flashcard mistakes',
        topic: g.topic,
        subject: g.subject,
        severity: g.wrong >= 4 ? 'high' : 'medium',
      })
    }
  }
  return patterns.slice(0, 6)
}
