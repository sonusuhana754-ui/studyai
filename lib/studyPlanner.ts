import { parseJsonFromLLM } from './aiUtils'
import { groqJsonCompletion } from './gemini'

export interface StudyPlanDay {
  day: string
  focus: string
  tasks: string[]
  minutes: number
}

export interface StudyPlan {
  title: string
  summary: string
  days: StudyPlanDay[]
  weak_topics: string[]
  tips: string[]
}

const DAY_NAMES = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

function toTasks(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.map((t) => String(t).trim()).filter(Boolean)
  }
  if (typeof value === 'string' && value.trim()) {
    return value.split(/\n|;/).map((t) => t.trim()).filter(Boolean)
  }
  return []
}

function normalizeStudyPlan(raw: unknown, input: {
  examName: string
  hoursPerDay: number
  subjects: string[]
}): StudyPlan | null {
  if (!raw || typeof raw !== 'object') return null
  const o = raw as Record<string, unknown>

  const minutesTarget = Math.round(input.hoursPerDay * 60)
  let daysRaw = o.days ?? o.schedule ?? o.weekly_plan ?? o.plan

  if (!Array.isArray(daysRaw) && daysRaw && typeof daysRaw === 'object') {
    daysRaw = Object.entries(daysRaw as Record<string, unknown>).map(([day, val]) => {
      if (val && typeof val === 'object') {
        const d = val as Record<string, unknown>
        return { day, ...d }
      }
      return { day, focus: String(val), tasks: [] }
    })
  }

  if (!Array.isArray(daysRaw)) return null

  const days: StudyPlanDay[] = daysRaw.slice(0, 7).map((item, i) => {
    const d = (item && typeof item === 'object' ? item : {}) as Record<string, unknown>
    const tasks = toTasks(d.tasks ?? d.activities ?? d.items ?? d.sessions)
    const minutes = Number(d.minutes ?? d.duration ?? d.duration_minutes) || minutesTarget
    return {
      day: String(d.day ?? d.name ?? DAY_NAMES[i] ?? `Day ${i + 1}`),
      focus: String(d.focus ?? d.topic ?? d.subject ?? input.subjects[i % input.subjects.length] ?? 'Review'),
      tasks: tasks.length > 0 ? tasks : [`Review ${input.subjects[0] ?? 'core topics'}`, 'Practice 10 problems', 'Quick recap notes'],
      minutes,
    }
  })

  if (days.length === 0) return null

  while (days.length < 7) {
    const i = days.length
    days.push({
      day: DAY_NAMES[i] ?? `Day ${i + 1}`,
      focus: input.subjects[i % input.subjects.length] ?? 'Mixed review',
      tasks: ['Revision', 'Practice set', 'Self-test'],
      minutes: minutesTarget,
    })
  }

  const weak = o.weak_topics ?? o.weakTopics ?? o.weak_areas
  const tips = o.tips ?? o.advice ?? o.recommendations

  return {
    title: String(o.title ?? `${input.examName} Study Plan`),
    summary: String(o.summary ?? o.overview ?? `A 7-day plan for ${input.examName}.`),
    days,
    weak_topics: Array.isArray(weak) ? weak.map(String) : [],
    tips: Array.isArray(tips) ? tips.map(String) : typeof tips === 'string' ? [tips] : [],
  }
}

export function buildFallbackStudyPlan(input: {
  examName: string
  examDate: string
  hoursPerDay: number
  subjects: string[]
  weakTopics?: string
}): StudyPlan {
  const subjects = input.subjects.length ? input.subjects : ['General']
  const mins = Math.round(input.hoursPerDay * 60)
  const weak = input.weakTopics
    ? input.weakTopics.split(',').map((s) => s.trim()).filter(Boolean)
    : []

  const days: StudyPlanDay[] = DAY_NAMES.map((day, i) => {
    const subject = subjects[i % subjects.length]
    const isWeakDay = weak.length > 0 && i % 2 === 0
    return {
      day,
      focus: isWeakDay ? `Weak area: ${weak[i % weak.length]}` : subject,
      minutes: mins,
      tasks: isWeakDay
        ? [
            `Drill ${weak[i % weak.length]} — theory (20 min)`,
            'Worked examples (25 min)',
            'Timed practice (15 min)',
          ]
        : [
            `${subject}: read + notes (25 min)`,
            'Practice problems (25 min)',
            'Review mistakes (10 min)',
          ],
    }
  })

  return {
    title: `${input.examName} — 7-Day Plan`,
    summary: `Personalized schedule until ${input.examDate}. ~${input.hoursPerDay}h/day across ${subjects.join(', ')}. (Offline template — AI was unavailable.)`,
    days,
    weak_topics: weak,
    tips: [
      'Do hardest topics when you are most alert.',
      'End each session with a 5-minute recap.',
      'Retry missed problems the next day.',
    ],
  }
}

export async function generateStudyPlan(input: {
  examName: string
  examDate: string
  hoursPerDay: number
  subjects: string[]
  weakTopics?: string
}): Promise<StudyPlan> {
  const subjects = input.subjects.length ? input.subjects : ['Mathematics', 'Science']

  const prompt = `Create a realistic 7-day study plan as a single JSON object.

Exam: ${input.examName}
Exam date: ${input.examDate}
Hours per day: ${input.hoursPerDay}
Subjects: ${subjects.join(', ')}
Weak areas: ${input.weakTopics || 'not specified'}

Return exactly this shape:
{
  "title": "string",
  "summary": "string",
  "days": [
    {
      "day": "Mon",
      "focus": "string",
      "tasks": ["specific task 1", "specific task 2"],
      "minutes": ${Math.round(input.hoursPerDay * 60)}
    }
  ],
  "weak_topics": ["string"],
  "tips": ["string"]
}

Rules:
- Exactly 7 entries in "days" (Mon through Sun)
- "tasks" must be an array of strings (3-4 tasks per day)
- Rotate subjects; extra time on weak areas
- "minutes" per day ≈ ${Math.round(input.hoursPerDay * 60)}
- Be specific (chapter names, problem counts, techniques)`

  try {
    const text = await groqJsonCompletion(prompt, 2048, 0.35)
    const parsed = parseJsonFromLLM<unknown>(text)
    const normalized = normalizeStudyPlan(parsed, {
      examName: input.examName,
      hoursPerDay: input.hoursPerDay,
      subjects,
    })
    if (normalized?.days?.length) return normalized
    console.warn('[studyPlanner] Could not normalize AI plan, using fallback')
  } catch (e) {
    console.warn('[studyPlanner] AI failed:', e)
    if (e instanceof Error && /EXPO_PUBLIC_GROQ_API_KEY/i.test(e.message)) throw e
  }

  return buildFallbackStudyPlan({ ...input, subjects })
}
