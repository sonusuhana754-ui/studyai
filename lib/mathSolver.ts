/**
 * Deterministic math engine — exact answers via mathjs before/alongside LLM.
 */

import * as math from 'mathjs'
import { Solution, SolutionStep } from './gemini'
import { isEngineSolvable } from './mathExtraction'

const MATH_KEYWORDS =
  /solve|equation|calculate|evaluate|simplify|factor|expand|integrate|differentiate|derivative|find\s+x|find\s+y|\d+\s*[\+\-\*\/\^×÷]\s*\d+|x\s*[=\+\-]|=\s*\d|x\^|x²|sqrt|log|sin|cos|tan|%/i

const NON_MATH_HINT =
  /who was|when did|explain why|describe|essay|capital of|war of|author of|poem|historical/i

export function isComputationalMath(text: string): boolean {
  const t = text.trim()
  if (!t || NON_MATH_HINT.test(t)) return false
  return MATH_KEYWORDS.test(t) || /[0-9].*[=+\-*/^]/.test(t) || /[a-z]\s*=/.test(t)
}

/** Normalize OCR / unicode math for parsing */
export function normalizeMathText(text: string): string {
  return text
    .replace(/[×·]/g, '*')
    .replace(/÷/g, '/')
    .replace(/−/g, '-')
    .replace(/²/g, '^2')
    .replace(/³/g, '^3')
    .replace(/√\s*\(/g, 'sqrt(')
    .replace(/√(\d+)/g, 'sqrt($1)')
    .replace(/(\d)([a-zA-Z])/g, '$1*$2')
    .replace(/\)(\d)/g, ')*$1')
    .replace(/\s+/g, ' ')
    .trim()
}

function extractEquation(text: string): string | null {
  const normalized = normalizeMathText(text)
  const patterns = [
    /(?:solve|find|evaluate|calculate)[:\s]+(.+)/i,
    /(?:equation)[:\s]+(.+)/i,
    /^(.+\s*=\s*.+)$/m,
  ]
  for (const p of patterns) {
    const m = normalized.match(p)
    if (m?.[1]?.includes('=') || (m?.[1] && /[a-z]/i.test(m[1]))) return m[1].trim()
    if (m?.[0]?.includes('=')) return m[0].trim()
  }
  const eq = normalized.match(/[^.?!]*=\s*[^.?!]+/)
  return eq ? eq[0].trim() : null
}

function detectVariables(expr: string): string[] {
  const reserved = new Set([
    'sin', 'cos', 'tan', 'log', 'ln', 'sqrt', 'abs', 'exp', 'pi', 'e',
  ])
  const matches = expr.match(/[a-zA-Z]+/g) ?? []
  return [...new Set(matches.filter((v) => !reserved.has(v.toLowerCase()) && v.length === 1))]
}

function toMathJsExpr(side: string): string {
  let s = normalizeMathText(side)
  s = s.replace(/(\d)([a-zA-Z])/g, '$1*$2')
  return s
}

function formatNumber(n: number): string {
  if (!Number.isFinite(n)) return String(n)
  const rounded = Math.round(n * 1e10) / 1e10
  if (Math.abs(rounded - Math.round(rounded)) < 1e-9) return String(Math.round(rounded))
  return String(rounded)
}

function parseQuadraticCoeffs(equation: string): { a: number; b: number; c: number } | null {
  const s = normalizeMathText(equation).replace(/\s/g, '').replace(/\*/g, '').toLowerCase()
  const patterns = [
    /^([+-]?\d*\.?\d*)x\^2([+-]\d*\.?\d*)x?([+-]?\d*\.?\d*)=0$/,
    /^([+-]?\d*\.?\d*)x²([+-]\d*\.?\d*)x?([+-]?\d*\.?\d*)=0$/,
    /^([+-]?\d*\.?\d*)x\^2([+-]\d*\.?\d*)x?([+-]?\d*\.?\d*)$/,
  ]
  for (const p of patterns) {
    const m = s.match(p)
    if (m) return coeffFromMatch(m)
  }
  return null
}

function coeffFromMatch(m: RegExpMatchArray): { a: number; b: number; c: number } {
  const parseCoef = (s: string | undefined, defaultOne = true): number => {
    if (!s || s === '' || s === '+') return defaultOne ? 1 : 0
    if (s === '-') return defaultOne ? -1 : 0
    return parseFloat(s)
  }
  return {
    a: parseCoef(m[1]),
    b: parseCoef(m[2], false),
    c: parseCoef(m[3], false),
  }
}

function solveQuadraticExact(a: number, b: number, c: number): Solution | null {
  const steps: SolutionStep[] = [
    {
      step: 1,
      action: 'Identify standard form',
      explanation: 'Quadratic equation ax² + bx + c = 0',
      math: `${a}x² + ${b}x + ${c} = 0`,
    },
  ]
  const disc = b * b - 4 * a * c
  steps.push({
    step: 2,
    action: 'Discriminant',
    explanation: 'Δ = b² − 4ac determines the number of real roots',
    math: `Δ = (${b})² - 4(${a})(${c}) = ${formatNumber(disc)}`,
  })

  if (disc < 0) {
    return {
      subject: 'math',
      topic: 'Quadratic equations',
      difficulty: 'medium',
      steps: [
        ...steps,
        {
          step: 3,
          action: 'Complex roots',
          explanation: 'Δ < 0, so there are no real solutions',
          math: 'Roots are complex',
        },
      ],
      answer: 'No real solutions (complex roots)',
      concept: 'Negative discriminant means complex roots',
      fun_fact: '',
    }
  }

  const sqrtD = Math.sqrt(disc)
  const x1 = (-b + sqrtD) / (2 * a)
  const x2 = (-b - sqrtD) / (2 * a)

  steps.push({
    step: 3,
    action: 'Quadratic formula',
    explanation: 'x = (−b ± √Δ) / (2a)',
    math: `x = (${-b} ± √${formatNumber(disc)}) / (2×${a})`,
  })
  steps.push({
    step: 4,
    action: 'Compute roots',
    explanation: 'Evaluate both branches',
    math:
      disc === 0
        ? `x = ${formatNumber(x1)} (double root)`
        : `x₁ = ${formatNumber(x1)}, x₂ = ${formatNumber(x2)}`,
  })

  const answer =
    disc === 0
      ? `x = ${formatNumber(x1)}`
      : Math.abs(x1 - x2) < 1e-9
        ? `x = ${formatNumber(x1)}`
        : `x = ${formatNumber(x1)} or x = ${formatNumber(x2)}`

  return {
    subject: 'math',
    topic: 'Quadratic equations',
    difficulty: 'medium',
    steps,
    answer,
    concept: 'Use the quadratic formula when factoring is difficult',
    fun_fact: '',
  }
}

function solveLinearSystem(equation: string): Solution | null {
  const parts = equation.split('=').map((p) => p.trim())
  if (parts.length !== 2) return null

  const vars = detectVariables(parts[0] + parts[1])
  const v = vars[0] ?? 'x'
  if (vars.length > 1) return null

  const leftExpr = toMathJsExpr(parts[0])
  const rightExpr = toMathJsExpr(parts[1])

  try {
    const scope0: Record<string, number> = { [v]: 0 }
    const scope1: Record<string, number> = { [v]: 1 }
    const L0 = Number(math.evaluate(leftExpr, scope0))
    const L1 = Number(math.evaluate(leftExpr, scope1))
    const R0 = Number(math.evaluate(rightExpr, scope0))
    const R1 = Number(math.evaluate(rightExpr, scope1))

    // (left - right) = a*v + b, so a = (L1-R1)-(L0-R0), b = L0-R0
    const a = L1 - L0 - (R1 - R0)
    const b = L0 - R0

    if (!Number.isFinite(a) || !Number.isFinite(b)) return null
    if (Math.abs(a) < 1e-12) return null

    const num = -b / a
    const expr = `(${leftExpr}) - (${rightExpr})`

    const steps: SolutionStep[] = [
      {
        step: 1,
        action: 'Rearrange',
        explanation: 'Bring all terms to one side',
        math: `${expr} = 0`,
      },
      {
        step: 2,
        action: 'Linear form',
        explanation: `This is linear in ${v}: coefficient = ${formatNumber(a)}, constant = ${formatNumber(b)}`,
        math: `${formatNumber(a)}·${v} + ${formatNumber(b)} = 0`,
      },
      {
        step: 3,
        action: 'Solve',
        explanation: `Divide both sides by ${formatNumber(a)}`,
        math: `${v} = ${formatNumber(-b)}/${formatNumber(a)} = ${formatNumber(num)}`,
      },
    ]

    const checkScope: Record<string, number> = { [v]: num }
    const check = Number(math.evaluate(`(${leftExpr}) - (${rightExpr})`, checkScope))
    if (Math.abs(check) > 0.05) return null

    steps.push({
      step: 4,
      action: 'Verify',
      explanation: 'Substitute into the original equation',
      math: 'Left side ≈ right side ✓',
    })

    return {
      subject: 'math',
      topic: 'Linear equations',
      difficulty: 'easy',
      steps,
      answer: `${v} = ${formatNumber(num)}`,
      concept: 'For ax + b = 0, the solution is x = −b/a',
      fun_fact: '',
    }
  } catch {
    return null
  }
}

function solveArithmetic(text: string): Solution | null {
  const normalized = normalizeMathText(text)
  let expr = normalized
    .replace(/(?:what is|calculate|evaluate|compute|find)\s*/gi, '')
    .replace(/[?%.]/g, ' ')
    .trim()

  const percentMatch = expr.match(/(\d+\.?\d*)\s*%\s*of\s*(\d+\.?\d*)/i)
  if (percentMatch) {
    const pct = parseFloat(percentMatch[1])
    const base = parseFloat(percentMatch[2])
    const result = (pct / 100) * base
    return {
      subject: 'math',
      topic: 'Percentages',
      difficulty: 'easy',
      steps: [
        {
          step: 1,
          action: 'Convert percent',
          explanation: 'Percent means per hundred',
          math: `${pct}% = ${pct}/100 = ${formatNumber(pct / 100)}`,
        },
        {
          step: 2,
          action: 'Multiply',
          explanation: `Find ${pct}% of ${base}`,
          math: `${formatNumber(pct / 100)} × ${base} = ${formatNumber(result)}`,
        },
      ],
      answer: formatNumber(result),
      concept: 'Percent of a number = (percent/100) × number',
      fun_fact: '',
    }
  }

  // Never strip LaTeX/radicals into bogus arithmetic
  if (/\\frac|\\sqrt|√|sqrt\s*\(/i.test(text)) return null

  // Pure numeric expression
  const numericOnly = expr.replace(/[^0-9+\-*/().^%\s]/g, '').trim()
  if (numericOnly.length < 3) return null
  if (numericOnly.replace(/[\d+\-*/().^%\s]/g, '').length > 0) return null

  try {
    const scope = {}
    const result = math.evaluate(normalizeMathText(numericOnly), scope)
    const num = typeof result === 'number' ? result : Number(result)
    if (!Number.isFinite(num)) return null

    return {
      subject: 'math',
      topic: 'Arithmetic',
      difficulty: 'easy',
      steps: [
        {
          step: 1,
          action: 'Evaluate expression',
          explanation: 'Compute using order of operations (PEMDAS)',
          math: `${numericOnly} = ${formatNumber(num)}`,
        },
      ],
      answer: formatNumber(num),
      concept: 'Follow order of operations',
      fun_fact: '',
    }
  } catch {
    return null
  }
}

/**
 * Attempt an exact symbolic/numeric solution. Returns null if unsupported.
 */
export function solveWithMathEngine(questionText: string): Solution | null {
  const text = questionText.trim()
  if (!isComputationalMath(text) || !isEngineSolvable(text)) return null

  const equation = extractEquation(text) ?? text

  // Linear / single variable equation (try before quadratic — avoids mis-classification)
  if (equation.includes('=')) {
    const linear = solveLinearSystem(equation)
    if (linear) return linear
  }

  // Quadratic = 0
  const quad = parseQuadraticCoeffs(equation)
  if (quad && quad.a !== 0) {
    const q = solveQuadraticExact(quad.a, quad.b, quad.c)
    if (q) return q
  }

  // Quadratic not in standard form: try moving to = 0
  if (equation.includes('=') && /x\^2|x²|x\*\*2/i.test(equation)) {
    const parts = equation.split('=')
    if (parts.length === 2) {
      const zeroForm = `${parts[0].trim()}-(${parts[1].trim()})=0`
      const quad2 = parseQuadraticCoeffs(zeroForm.replace(/\s/g, '') + '=0')
      if (quad2 && quad2.a !== 0) {
        const q = solveQuadraticExact(quad2.a, quad2.b, quad2.c)
        if (q) return q
      }
    }
  }

  // Arithmetic / percent
  const arith = solveArithmetic(text)
  if (arith) return arith

  return null
}

/** Build hint string for LLM from engine (when partial) */
export function getMathEngineHint(questionText: string): string | null {
  if (!isEngineSolvable(questionText)) return null
  const solved = solveWithMathEngine(questionText)
  if (!solved) return null
  return `Verified exact answer: ${solved.answer}. Show steps that arrive at this answer.`
}
