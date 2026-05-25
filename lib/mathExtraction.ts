/**
 * Detect whether text read from OCR/vision is safe to solve (not garbage).
 */

const MATH_MARKERS =
  /[=+\-*/^]|\\sqrt|\\frac|√|sqrt\s*\(|÷|×|\?|x\^|x²|\d+\s*\/\s*\d+/i

/** True when extraction looks like real math, not OCR mush. */
export function isTrustworthyMathExtraction(text: string): boolean {
  const t = text.trim()
  if (t.length < 2) return false
  if (!MATH_MARKERS.test(t)) return false

  // Unbalanced parentheses
  let depth = 0
  for (const c of t) {
    if (c === '(') depth++
    if (c === ')') depth--
    if (depth < 0) return false
  }
  if (depth !== 0) return false

  // Common OCR garbage from roots/fractions
  if (/\(\s*\d+\s+\d+\s*\+/.test(t)) return false // "(7 + 43 7+"
  if (/\d{2,}\s+\d/.test(t) && !/\\sqrt|sqrt|√|\//.test(t)) return false // "43 7" without sqrt
  if (/\+\s*\)/.test(t)) return false
  if (/\(\s*[^)]*\s+\d+\s*\+?\s*\)/.test(t) && !/sqrt|√|\\sqrt/i.test(t)) return false
  if (/^\(?\d+\s*\+\s*\d{2,}\s+\d/.test(t)) return false

  // Stray trailing operators
  if (/[+\-*/]\s*$/.test(t)) return false

  return true
}

/** LaTeX, nested radicals, fractions — must use AI solver, not the basic engine */
export function needsAdvancedSolver(text: string): boolean {
  const t = text.trim()
  if (/\\frac|\\sqrt|\\cdot|\\times|\\div|\\left|\\right/i.test(t)) return true
  if (/√|⁄|÷/.test(t)) return true
  // Nested sqrt like sqrt(7+4*sqrt(3))
  if (/sqrt\s*\([^)]*sqrt/i.test(t)) return true
  if ((t.match(/sqrt/gi) ?? []).length >= 2) return true
  return false
}

/** Only problems the deterministic engine can handle correctly */
export function isEngineSolvable(text: string): boolean {
  if (needsAdvancedSolver(text)) return false
  if (/\\[a-zA-Z]/.test(text)) return false
  return true
}

/** Prefer LaTeX line for UI when available */
export function formatMathForDisplay(latexOrText: string): string {
  const t = latexOrText.trim()
  if (t.startsWith('$') || t.includes('\\sqrt') || t.includes('\\frac')) {
    return t.replace(/^\$+|\$+$/g, '')
  }
  return t
}
