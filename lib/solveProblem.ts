/**
 * Central solve pipeline: image-first for photos → validated text → exact math → LLM
 */

import { recognizeMathFromImage, cleanOCRText } from './mathOCR'
import { solveWithGemini, Solution, SocraticResponse } from './gemini'
import { isValidSolution, normalizeSolution, normalizeSocratic, parseJsonFromLLM } from './aiUtils'
import {
  isComputationalMath,
  solveWithMathEngine,
  getMathEngineHint,
} from './mathSolver'
import { isTrustworthyMathExtraction, needsAdvancedSolver } from './mathExtraction'
import { extractQuestionForDisplay, hasPhotoSolve } from './vision'
import { ensureImageBase64 } from './imageBase64'
import { solveSurdProblemWithGroq } from './groqVision'
import { ExplanationStyleId, DEFAULT_EXPLANATION_STYLE } from './explanationStyles'

export interface SolveProblemInput {
  questionText?: string
  imageUri?: string
  imageBase64?: string
  mode?: 'answer' | 'socratic'
  explanationStyle?: ExplanationStyleId
}

export interface SolveProblemResult {
  result: Solution | SocraticResponse
  extractedText?: string
  source: 'typed' | 'ocr' | 'vision' | 'exact-math' | 'image-solve'
}

export async function resolveQuestionText(
  questionText: string,
  imageUri?: string,
  imageBase64?: string
): Promise<{ text: string; source: SolveProblemResult['source'] }> {
  const typed = questionText.trim()
  const hasImage = !!(imageUri || imageBase64)

  if (hasImage) {
    if (typed) {
      return { text: typed, source: 'typed' }
    }

    if (imageBase64 && hasPhotoSolve()) {
      const latex = await extractQuestionForDisplay(imageBase64, imageUri)
      if (latex) {
        return { text: latex, source: 'vision' }
      }
    }

    if (imageUri) {
      try {
        const ocr = await recognizeMathFromImage(imageUri)
        const cleaned = cleanOCRText(ocr.text).trim()
        if (cleaned.length >= 5 && isTrustworthyMathExtraction(cleaned)) {
          return { text: cleaned, source: 'ocr' }
        }
      } catch (e) {
        console.warn('[solveProblem] OCR failed:', e)
      }
    }

    throw new Error(
      'Could not read the photo clearly. Retake the picture or type the problem on the fix screen.'
    )
  }

  if (typed.length >= 2) {
    return { text: typed, source: 'typed' }
  }

  throw new Error('Enter a problem or scan a photo.')
}

async function solveAdvancedMath(
  problemText: string,
  imageBase64: string | undefined,
  imageUri: string | undefined
): Promise<Solution> {
  let lastRaw = ''
  for (let attempt = 0; attempt < 2; attempt++) {
    const raw = await solveSurdProblemWithGroq(problemText, imageBase64, imageUri)
    lastRaw = raw
    const parsed = parseJsonFromLLM<Solution>(raw)
    const solution = normalizeSolution(parsed)
    if (isValidSolution(solution, problemText)) return solution
  }
  console.warn('[solveProblem] Advanced math parse failed:', lastRaw.slice(0, 300))
  throw new Error('Could not parse the solution. Please scan again.')
}

async function solveWithLLM(
  text: string,
  imageBase64: string | undefined,
  imageUri: string | undefined,
  mode: 'answer' | 'socratic',
  solveFromImage = false,
  explanationStyle: ExplanationStyleId = DEFAULT_EXPLANATION_STYLE
): Promise<Solution | SocraticResponse> {
  if (mode === 'answer' && needsAdvancedSolver(text)) {
    return solveAdvancedMath(text, imageBase64, imageUri)
  }

  const trustedText = isTrustworthyMathExtraction(text)
  const hint =
    mode === 'answer' && trustedText && isComputationalMath(text)
      ? getMathEngineHint(text)
      : null

  let raw = await solveWithGemini(text, imageBase64, mode, {
    verifiedHint: hint ?? undefined,
    preferImageSolve: solveFromImage,
    untrustedText: solveFromImage && !trustedText,
    imageUri,
    problemText: text,
    explanationStyle,
  })

  if (mode === 'answer') {
    let solution = normalizeSolution(raw)
    if (!isValidSolution(solution, text)) {
      if (needsAdvancedSolver(text)) {
        return solveAdvancedMath(text, imageBase64, imageUri)
      }
      raw = await solveWithGemini(
        `Re-solve from the IMAGE. Nested roots and fractions. Return ONLY valid JSON with exact surd answer.`,
        imageBase64,
        mode,
        {
          preferImageSolve: solveFromImage,
          untrustedText: true,
          imageUri,
          problemText: text,
          explanationStyle,
        }
      )
      solution = normalizeSolution(raw)
    }
    if (!isValidSolution(solution, text)) {
      throw new Error('Could not generate a valid solution. Please try again.')
    }

    if (trustedText && !needsAdvancedSolver(text)) {
      const exact = solveWithMathEngine(text)
      if (exact && !answersMatch(solution.answer, exact.answer)) {
        const simpleLinear =
          /linear|arithmetic|percent/i.test(exact.topic) || /^x\s*=/.test(exact.answer)
        if (simpleLinear) {
          return exact
        }
      }
    }
    return solution
  }

  let socratic = normalizeSocratic(raw)
  if (!socratic) {
    raw = await solveWithGemini(text, imageBase64, mode, {
      preferImageSolve: solveFromImage,
      imageUri,
      problemText: text,
      explanationStyle,
    })
    socratic = normalizeSocratic(raw)
  }
  if (!socratic) {
    throw new Error('Could not generate learning hints. Please try again.')
  }
  return socratic
}

function answersMatch(a: string, b: string): boolean {
  const norm = (s: string) =>
    s.toLowerCase().replace(/\s/g, '').replace(/≈/g, '=')
  const na = norm(a)
  const nb = norm(b)
  if (na === nb) return true
  if (na.includes(nb) || nb.includes(na)) return true
  const numsA = a.match(/-?\d+\.?\d*/g)?.map(Number) ?? []
  const numsB = b.match(/-?\d+\.?\d*/g)?.map(Number) ?? []
  if (numsA.length && numsA.length === numsB.length) {
    return numsA.every((n, i) => Math.abs(n - numsB[i]) < 0.01)
  }
  return false
}

export async function solveProblem(input: SolveProblemInput): Promise<SolveProblemResult> {
  const mode = input.mode ?? 'answer'
  const hasImage = !!(input.imageUri || input.imageBase64)
  const userTyped = (input.questionText ?? '').trim()

  let imageBase64: string | undefined
  if (hasImage) {
    imageBase64 = await ensureImageBase64(input.imageBase64, input.imageUri)
  }

  if (hasImage && imageBase64 && hasPhotoSolve()) {
    let displayText = userTyped
    if (!displayText) {
      displayText = (await extractQuestionForDisplay(imageBase64, input.imageUri)) || ''
    }

    if (mode === 'answer' && needsAdvancedSolver(displayText)) {
      const result = await solveAdvancedMath(displayText, imageBase64, input.imageUri)
      return {
        result,
        extractedText: displayText,
        source: 'image-solve',
      }
    }

    const result = await solveWithLLM(
      displayText,
      imageBase64,
      input.imageUri,
      mode,
      true,
      input.explanationStyle ?? DEFAULT_EXPLANATION_STYLE
    )

    if (mode === 'answer') {
      const sol = result as Solution
      if (!isValidSolution(sol, displayText)) {
        throw new Error('Could not solve this photo. Try again or type the problem manually.')
      }
    }

    return {
      result,
      extractedText: displayText || '(read from photo)',
      source: 'image-solve',
    }
  }

  if (hasImage && !hasPhotoSolve()) {
    throw new Error(
      'Photo solving needs EXPO_PUBLIC_GROQ_API_KEY in .env (Groq vision). Restart the app after saving .env.'
    )
  }

  let text = userTyped
  let source: SolveProblemResult['source'] = 'typed'

  if (hasImage) {
    const resolved = await resolveQuestionText(userTyped, input.imageUri, imageBase64)
    text = resolved.text
    source = resolved.source
  } else if (!userTyped) {
    throw new Error('Enter a problem or scan a photo.')
  }

  if (
    mode === 'answer' &&
    !needsAdvancedSolver(text) &&
    isTrustworthyMathExtraction(text) &&
    isComputationalMath(text)
  ) {
    const exact = solveWithMathEngine(text)
    if (exact) {
      return { result: exact, extractedText: text, source: 'exact-math' }
    }
  }

  const result = await solveWithLLM(
    text,
    imageBase64,
    input.imageUri,
    mode,
    hasImage,
    input.explanationStyle ?? DEFAULT_EXPLANATION_STYLE
  )
  return { result, extractedText: text, source }
}
