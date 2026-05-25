import { Solution, SocraticResponse, SolutionStep } from './gemini'

const LATEX_COMMANDS =
  'frac|sqrt|cdot|times|div|left|right|pm|leq|geq|neq|infty|alpha|beta|theta|pi|text'

/**
 * LLMs emit LaTeX with single backslashes; JSON requires \\frac not \frac (\f = form feed).
 * Only doubles backslashes that are not already escaped.
 */
function repairLatexEscapesInJson(json: string): string {
  const re = new RegExp(`(?<!\\\\)\\\\(${LATEX_COMMANDS})`, 'g')
  return json.replace(re, '\\\\$1')
}

/** True if `{` at index starts a JSON object (not LaTeX like `\frac{`). */
function isJsonObjectStart(text: string, index: number): boolean {
  let i = index + 1
  while (i < text.length && /\s/.test(text[i])) i++
  const next = text[i]
  return next === '"' || next === '}'
}

function braceMatchObject(text: string, start: number): string | null {
  let depth = 0
  let inString = false
  let escaped = false
  for (let i = start; i < text.length; i++) {
    const c = text[i]
    if (inString) {
      if (escaped) {
        escaped = false
        continue
      }
      if (c === '\\') {
        escaped = true
        continue
      }
      if (c === '"') inString = false
      continue
    }
    if (c === '"') {
      inString = true
      continue
    }
    if (c === '{') depth++
    if (c === '}') {
      depth--
      if (depth === 0) return text.substring(start, i + 1)
    }
  }
  return null
}

function extractJsonObject(text: string): string | null {
  let clean = text.trim()
  clean = clean.replace(/^\uFEFF/, '')
  clean = clean.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim()

  // Prefer `{"key":` — never treat `\frac{` as JSON start
  const keyStarts = [
    /\{\s*"(?:answer|steps|subject|topic|opening_question|hints|title|summary|days)"/gi,
    /\{\s*"/g,
  ]
  for (const re of keyStarts) {
    re.lastIndex = 0
    let m: RegExpExecArray | null
    while ((m = re.exec(clean)) !== null) {
      const slice = braceMatchObject(clean, m.index)
      if (slice) return slice
    }
  }

  let pos = 0
  while (pos < clean.length) {
    const start = clean.indexOf('{', pos)
    if (start === -1) break
    if (isJsonObjectStart(clean, start)) {
      const slice = braceMatchObject(clean, start)
      if (slice) return slice
    }
    pos = start + 1
  }

  const start = clean.indexOf('{')
  const end = clean.lastIndexOf('}')
  if (start !== -1 && end > start && isJsonObjectStart(clean, start)) {
    return clean.substring(start, end + 1)
  }
  return null
}

/**
 * Parse JSON from LLM output with LaTeX-safe cleanup.
 */
export function parseJsonFromLLM<T>(text: string): T | null {
  if (!text?.trim()) return null

  const slice = extractJsonObject(text)
  if (!slice) return null

  const attempts = [
    slice,
    repairLatexEscapesInJson(slice),
    slice.replace(/,\s*([}\]])/g, '$1'),
    repairLatexEscapesInJson(slice).replace(/,\s*([}\]])/g, '$1'),
  ]

  for (const candidate of attempts) {
    try {
      return JSON.parse(candidate) as T
    } catch {
      // try next repair
    }
  }

  console.error('[aiUtils] JSON parse failed after repairs. Snippet:', slice.slice(0, 200))
  return null
}

const VALID_SUBJECTS = new Set([
  'math', 'physics', 'chemistry', 'history', 'biology',
  'economics', 'geography', 'literature', 'computer_science', 'other',
])

const VALID_DIFFICULTIES = new Set(['easy', 'medium', 'hard'])

function normalizeSteps(raw: unknown): SolutionStep[] {
  if (!Array.isArray(raw)) return []
  return raw
    .map((s, i) => {
      if (!s || typeof s !== 'object') return null
      const step = s as Record<string, unknown>
      const math = step.math != null ? String(step.math) : undefined
      const action = String(
        step.action ?? step.title ?? (math ? 'Work through the expression' : `Step ${i + 1}`)
      )
      const explanation = String(
        step.explanation ?? step.detail ?? math ?? ''
      )
      return {
        step: typeof step.step === 'number' ? step.step : i + 1,
        action,
        explanation,
        math,
      }
    })
    .filter(Boolean) as SolutionStep[]
}

export function normalizeSolution(raw: unknown): Solution | null {
  if (!raw || typeof raw !== 'object') return null
  const o = raw as Record<string, unknown>

  const steps = normalizeSteps(o.steps)
  const answer = String(o.answer ?? o.final_answer ?? '').trim()
  if (!answer || steps.length === 0) return null

  const subjectRaw = String(o.subject ?? 'other').toLowerCase().replace(/\s+/g, '_')
  const subject = VALID_SUBJECTS.has(subjectRaw)
    ? subjectRaw
    : subjectRaw.includes('math') || subjectRaw.includes('stat')
      ? 'math'
      : subjectRaw.includes('phys')
        ? 'physics'
        : subjectRaw.includes('chem')
          ? 'chemistry'
          : subjectRaw.includes('bio') || subjectRaw.includes('zool') || subjectRaw.includes('botan')
            ? 'biology'
            : subjectRaw.includes('econ') || subjectRaw.includes('account') || subjectRaw.includes('commerce')
              ? 'economics'
              : subjectRaw.includes('geo')
                ? 'geography'
                : subjectRaw.includes('hist') || subjectRaw.includes('politic')
                  ? 'history'
                  : 'other'
  const diffRaw = String(o.difficulty ?? 'medium').toLowerCase()
  const difficulty = (VALID_DIFFICULTIES.has(diffRaw) ? diffRaw : 'medium') as Solution['difficulty']

  return {
    subject,
    topic: String(o.topic ?? o.title ?? 'Problem'),
    difficulty,
    steps,
    answer,
    concept: String(o.concept ?? o.key_concept ?? 'See steps above.'),
    fun_fact: String(o.fun_fact ?? o.funFact ?? ''),
    real_world_use: o.real_world_use != null ? String(o.real_world_use) : undefined,
  }
}

export function normalizeSocratic(raw: unknown): SocraticResponse | null {
  if (!raw || typeof raw !== 'object') return null
  const o = raw as Record<string, unknown>
  const hints = Array.isArray(o.hints) ? o.hints.map(h => String(h)) : []
  const opening = String(o.opening_question ?? o.openingQuestion ?? '').trim()
  if (!opening || hints.length === 0) return null

  return {
    subject: String(o.subject ?? 'other'),
    topic: String(o.topic ?? 'Problem'),
    difficulty: String(o.difficulty ?? 'medium'),
    opening_question: opening,
    hints,
    concept: String(o.concept ?? ''),
  }
}

const REFUSAL_PATTERN =
  /no\s+(equation|solution|problem|image)|not\s+(provided|available|given)|cannot\s+(see|read|solve)|image\s+is\s+not|without\s+a\s+given/i

export function isValidSolution(
  s: Solution | null,
  problemText?: string
): s is Solution {
  if (!s?.answer || !Array.isArray(s.steps) || s.steps.length === 0) return false

  const blob = [s.answer, s.concept, ...s.steps.map((x) => x.explanation), ...s.steps.map((x) => x.action)]
    .join(' ')
    .toLowerCase()

  if (REFUSAL_PATTERN.test(blob)) return false
  if (s.answer.trim().length < 1) return false

  if (problemText && /\\frac|\\sqrt|√/i.test(problemText)) {
    if (/arithmetic/i.test(s.topic)) return false
    if (/^\d+\.?\d*$/.test(s.answer.trim()) && !/sqrt|√|\/|frac/i.test(s.answer)) {
      return false
    }
  }

  return true
}
