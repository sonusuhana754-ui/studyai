import { parseJsonFromLLM, normalizeSolution, isValidSolution } from './aiUtils'
import { isComputationalMath } from './mathSolver'
import {
  hasGeminiVision,
  hasPhotoSolve,
  solveFromImageWithVision,
  callGeminiText,
} from './vision'
import { isGeminiQuotaError } from './groqVision'
import { ExplanationStyleId, getStylePromptModifier, DEFAULT_EXPLANATION_STYLE } from './explanationStyles'

const GROQ_API_KEY = process.env.EXPO_PUBLIC_GROQ_API_KEY
const GEMINI_API_KEY = process.env.EXPO_PUBLIC_GEMINI_API_KEY ?? process.env.EXPO_PUBLIC_GOOGLE_GEMINI_API_KEY

if (!GROQ_API_KEY && !GEMINI_API_KEY && __DEV__) {
  console.warn('Neither EXPO_PUBLIC_GROQ_API_KEY nor EXPO_PUBLIC_GEMINI_API_KEY is set in .env')
}

export interface SolutionStep {
  step: number
  action: string
  explanation: string
  math?: string
}

export interface Solution {
  subject: string
  topic: string
  difficulty: 'easy' | 'medium' | 'hard'
  steps: SolutionStep[]
  answer: string
  concept: string
  fun_fact: string
  real_world_use?: string
}

export interface SocraticResponse {
  subject: string
  topic: string
  difficulty: string
  opening_question: string
  hints: string[]
  concept: string
}

const ANSWER_PROMPT = `You are an expert, highly accurate tutor. Solve this problem step-by-step with perfect accuracy.

CRITICAL: Return ONLY a valid JSON object, no other text. No markdown, no backticks, no extra commentary.

EXAMPLE JSON FORMAT (MATCH THIS EXACTLY):
{
  "subject": "math",
  "topic": "Quadratic Equations",
  "difficulty": "medium",
  "steps": [
    {
      "step": 1,
      "action": "Identify the equation type",
      "explanation": "This is a quadratic equation in standard form ax² + bx + c = 0",
      "math": "2x² + 5x - 3 = 0, where a=2, b=5, c=-3"
    },
    {
      "step": 2,
      "action": "Apply quadratic formula",
      "explanation": "Calculate discriminant first, then both roots",
      "math": "x = [-b ± √(b²-4ac)]/(2a) = [-5 ± √(25+24)]/4"
    },
    {
      "step": 3,
      "action": "Compute final solutions",
      "explanation": "Calculate both the positive and negative cases",
      "math": "x = (-5 + 7)/4 = 0.5 OR x = (-5 - 7)/4 = -3"
    }
  ],
  "answer": "x = 0.5 or x = -3",
  "concept": "Quadratic equations have up to two solutions found via factoring, completing the square, or quadratic formula",
  "fun_fact": "Brahmagupta described the quadratic formula in 628 CE",
  "real_world_use": "Parabolic motion in physics uses quadratic equations to predict projectile height."
}

STRICT RULES:
- subject: math | physics | chemistry | history | biology | economics | geography | literature | other
- difficulty: easy | medium | hard
- 2-5 accurate, detailed steps
- math field: include formula/equation for each step (or omit if not applicable)
- DOUBLE-CHECK ALL CALCULATIONS FOR ACCURACY
- Make explanations educational and clear
- Include "real_world_use": one sentence on career/engineering/coding relevance
- RETURN ONLY THE JSON OBJECT, NO OTHER TEXT`

const MATH_ANSWER_PROMPT = `You are an expert mathematician. Solve with 100% arithmetic accuracy.

PROCESS (do this mentally before answering):
1. Parse the problem precisely (identify equation type, variables, operations).
2. Solve step-by-step on paper; re-check each line of algebra.
3. Substitute your answer back into the original equation to verify.
4. Only then output JSON.

CRITICAL: Return ONLY a valid JSON object. No markdown, no backticks.

Use the same JSON schema as this example:
{
  "subject": "math",
  "topic": "Linear equations",
  "difficulty": "easy",
  "steps": [
    { "step": 1, "action": "Subtract 5 from both sides", "explanation": "Isolate the x term", "math": "2x = 14 - 6 = 8" },
    { "step": 2, "action": "Divide by 2", "explanation": "Solve for x", "math": "x = 8/2 = 4" }
  ],
  "answer": "x = 4",
  "concept": "Use inverse operations to isolate the variable",
  "fun_fact": "",
  "real_world_use": "Used in optimization and curve fitting."
}

RULES:
- subject must be "math" for math problems
- Every "math" field must show the actual computation, not just a description
- The "answer" field must match your verified result exactly
- If the problem has two solutions, list both in "answer"
- DOUBLE-CHECK: no sign errors, no order-of-operations mistakes
- For nested square roots: simplify inner radicals first (e.g. if 7+4√3 = (√3+2)² then √(7+4√3)=√3+2)
- For fractions with radicals: rationalize the denominator when appropriate
- NEVER treat OCR garbage like "7+43" as 7+43 unless the image clearly shows addition
- Include real_world_use when relevant
- RETURN ONLY JSON`

const SOCRATIC_PROMPT = `You are a Socratic tutor. Never reveal the final answer. Guide the student to discover it themselves with thoughtful questions.

Return ONLY a valid JSON object, no other text. No markdown, no backticks, no extra commentary.

EXAMPLE JSON FORMAT:
{
  "subject": "math",
  "topic": "Quadratic Equations",
  "difficulty": "medium",
  "opening_question": "What is the highest power of x in this equation? What type of equation is that?",
  "hints": [
    "Can you identify a, b, and c in the standard form ax² + bx + c = 0?",
    "What are the three common methods to solve quadratic equations?",
    "If you factor this, what two numbers multiply to a×c and add to b?"
  ],
  "concept": "Quadratic equations"
}

RULES:
- Never reveal the answer
- Guide with questions only
- 3-5 progressive hints (micro-hints → partial method → next step only — never the final answer)
- Each hint slightly more specific than the last
- subject: math | physics | chemistry | history | biology | economics | geography | literature | other
- RETURN ONLY THE JSON OBJECT, NO OTHER TEXT`

const GROQ_MODELS = ['llama-3.3-70b-versatile', 'llama-3.1-8b-instant'] as const

function parseGroqHttpError(status: number, body: string): string {
  try {
    const j = JSON.parse(body)
    const msg = j?.error?.message ?? body
    if (status === 429) {
      return 'Groq rate limit reached. Wait 30–60 seconds and try again, or upgrade your Groq plan.'
    }
    if (status === 413) return 'Request too large. Try a shorter topic.'
    return typeof msg === 'string' ? msg : `Groq API error (${status})`
  } catch {
    return body || `Groq API error (${status})`
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

export function isGroqRateLimitError(err: unknown): boolean {
  const msg = String(err instanceof Error ? err.message : err)
  return /429|rate.?limit/i.test(msg)
}

async function callGroqOnce(
  model: string,
  userContent: string,
  maxTokens: number,
  temperature: number,
  jsonMode: boolean
): Promise<string> {
  const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${GROQ_API_KEY}`,
    },
    body: JSON.stringify({
      model,
      messages: [
        {
          role: 'system',
          content:
            'You are an expert tutor. Return only valid JSON. Double-check all math and facts before responding.',
        },
        { role: 'user', content: userContent },
      ],
      temperature,
      max_tokens: maxTokens,
      ...(jsonMode ? { response_format: { type: 'json_object' } } : {}),
    }),
  })

  if (!response.ok) {
    const errorData = await response.text()
    console.error('[Groq]', model, response.status, errorData.slice(0, 300))
    const err = new Error(parseGroqHttpError(response.status, errorData))
    ;(err as Error & { status?: number }).status = response.status
    throw err
  }

  const data = await response.json()
  const text = data?.choices?.[0]?.message?.content
  if (!text?.trim()) throw new Error('Empty response from AI')
  return text.trim()
}

async function callGroq(
  userContent: string,
  maxTokens = 2048,
  temperature = 0.15,
  options?: { jsonMode?: boolean; models?: readonly string[] }
): Promise<string> {
  if (!GROQ_API_KEY) {
    throw new Error('EXPO_PUBLIC_GROQ_API_KEY is not set')
  }

  const models = options?.models ?? GROQ_MODELS
  const jsonMode = options?.jsonMode ?? false
  let lastError: Error | null = null

  for (const model of models) {
    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        return await callGroqOnce(model, userContent, maxTokens, temperature, jsonMode)
      } catch (e) {
        lastError = e instanceof Error ? e : new Error(String(e))
        const status = (lastError as Error & { status?: number }).status
        if (status === 429 && attempt < 2) {
          await sleep(1500 * (attempt + 1))
          continue
        }
        if (status === 429) break
        throw lastError
      }
    }
  }

  throw lastError ?? new Error('Groq request failed')
}

/** Groq chat with JSON mode, retries, and model fallback — for planners, quizzes, etc. */
export async function groqJsonCompletion(
  userContent: string,
  maxTokens = 2048,
  temperature = 0.3
): Promise<string> {
  return callGroq(userContent, maxTokens, temperature, { jsonMode: true })
}

export function buildFallbackExplainer(topic: string, subject: string) {
  const t = topic.trim()
  const scenes = [
    {
      id: 1,
      title: `Introducing ${t}`,
      narration: `Welcome! Today we explore ${t} in ${subject}. By the end you'll see how the pieces connect.`,
      key_points: ['Big-picture overview', 'Why this topic matters'],
      emoji: '🎬',
      bg_color: 'teal',
      duration_seconds: 10,
    },
    {
      id: 2,
      title: 'Core ideas',
      narration: `Every topic has building blocks. For ${t}, focus on definitions, cause and effect, and the vocabulary experts use.`,
      key_points: ['Key terms', 'Main relationships'],
      emoji: '🧩',
      bg_color: 'purple',
      duration_seconds: 10,
    },
    {
      id: 3,
      title: 'How it works',
      narration: `Walk through the process step by step. Ask: what comes first, what changes next, and what is the result?`,
      key_points: ['Step-by-step flow', 'Common patterns'],
      emoji: '⚙️',
      bg_color: 'amber',
      duration_seconds: 10,
    },
    {
      id: 4,
      title: 'Real examples',
      narration: `Apply ${t} to a concrete example. Connecting theory to practice makes it stick.`,
      key_points: ['Worked example', 'Tips to remember'],
      emoji: '💡',
      bg_color: 'coral',
      duration_seconds: 10,
    },
    {
      id: 5,
      title: 'Review & next steps',
      narration: `Recap the main ideas about ${t}. Quiz yourself, make flashcards, and scan a practice problem to go deeper.`,
      key_points: ['Summary', 'Practice suggestions'],
      emoji: '✅',
      bg_color: 'blue',
      duration_seconds: 10,
    },
  ]
  return {
    title: t,
    hook: `A quick tour of ${t}`,
    scenes,
    total_scenes: scenes.length,
    summary: `Review the five scenes on ${t}, then practice with Quiz and Flashcards in the app.`,
    _fallback: true,
  }
}

export async function solveWithGemini(
  questionText: string,
  imageBase64?: string,
  mode: 'answer' | 'socratic' = 'answer',
  options?: {
    verifiedHint?: string
    preferImageSolve?: boolean
    untrustedText?: boolean
    imageUri?: string
    problemText?: string
    explanationStyle?: ExplanationStyleId
  }
): Promise<Solution | SocraticResponse> {
  const isMath =
    mode === 'answer' &&
    (options?.preferImageSolve || isComputationalMath(questionText))
  const styleMod = getStylePromptModifier(options?.explanationStyle ?? DEFAULT_EXPLANATION_STYLE)
  const basePrompt =
    mode === 'socratic' ? SOCRATIC_PROMPT : isMath ? MATH_ANSWER_PROMPT : ANSWER_PROMPT
  const prompt = `${basePrompt}\n\nTEACHING STYLE:\n${styleMod}`
  const hintLine = options?.verifiedHint
    ? `\n\nVERIFIED RESULT (your steps must arrive at this): ${options.verifiedHint}`
    : ''
  const ocrHint =
    questionText?.trim() && !options?.untrustedText
      ? `\nTranscription from photo (verify against image):\n${questionText}`
      : ''
  const problemLine = options?.preferImageSolve
    ? `Look at the IMAGE and solve the math problem shown there. Do NOT invent a different problem.${ocrHint}${hintLine}
If you see nested square roots (vinculum over 7+4√3) and a fraction bar, solve THAT expression — not basic arithmetic.`
    : questionText?.trim()
      ? `Problem to solve:\n${questionText}${hintLine}`
      : 'Solve the problem shown in the image.'

  // When user scanned a photo, always solve from the image — no typing required
  const useVision = !!imageBase64 && hasPhotoSolve() && !!options?.preferImageSolve

  if (useVision && imageBase64) {
    let lastVisionError: Error | null = null
    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        const visionText = await solveFromImageWithVision(
          imageBase64,
          mode,
          `${prompt}\n\n${problemLine}`,
          options?.imageUri
        )
        const parsed = parseJsonFromLLM<Solution | SocraticResponse>(visionText)
        if (mode === 'answer') {
          const solution = normalizeSolution(parsed)
          if (isValidSolution(solution, options?.problemText ?? questionText)) return solution
          lastVisionError = new Error('Could not parse a valid solution from the photo')
          continue
        }
        if (parsed) return parsed
      } catch (e) {
        lastVisionError = e instanceof Error ? e : new Error(String(e))
        console.warn('[solveWithGemini] Vision attempt failed:', e)
      }
    }
    throw (
      lastVisionError ??
      new Error(
        'Photo solve failed. Set EXPO_PUBLIC_GROQ_API_KEY in .env, restart Expo, and try again.'
      )
    )
  }

  if (isMath && hasGeminiVision() && !options?.preferImageSolve) {
    try {
      const text = await callGeminiText(`${prompt}\n\n${problemLine}`, 0.05)
      const parsed = parseJsonFromLLM<Solution | SocraticResponse>(text)
      if (parsed) return parsed
    } catch (e) {
      if (!isGeminiQuotaError(e)) {
        console.warn('[solveWithGemini] Gemini math failed, falling back to Groq:', e)
      }
    }
  }

  const userMessage = `${prompt}\n\n${problemLine}`
  const text = await callGroq(userMessage, 2048, isMath ? 0.05 : 0.15)
  const parsed = parseJsonFromLLM<Solution | SocraticResponse>(text)
  if (!parsed) {
    throw new Error('AI returned an invalid response. Please try again.')
  }
  return parsed
}

function parseGroqJson<T>(text: string): T {
  const parsed = parseJsonFromLLM<T>(text)
  if (!parsed) throw new Error('Could not parse AI response')
  return parsed
}

export async function generateExplainer(topic: string, subject: string, context: string) {
  const EXPLAINER_PROMPT = `Create a 5-scene educational explainer about "${topic}" (${subject}).
Context: ${context}

Return ONLY this JSON shape (escape backslashes in strings):
{"title":"","hook":"","scenes":[{"id":1,"title":"","narration":"","key_points":["",""],"emoji":"","bg_color":"teal","duration_seconds":8}]}

Rules:
- Exactly 5 scenes, each building on the last
- Narration: vivid documentary tone, include real names/dates/numbers when relevant
- 2-3 key_points per scene
- emoji: one relevant emoji per scene
- bg_color: teal | purple | amber | coral | blue
- duration_seconds: 8-12`

  if (GROQ_API_KEY) {
    try {
      const text = await callGroq(EXPLAINER_PROMPT, 4096, 0.25, { jsonMode: true })
      const result = parseGroqJson<any>(text)
      if (result?.scenes?.length) {
        result.total_scenes = result.scenes.length
        result.summary = result.summary ?? result.hook ?? 'Key takeaways from this lesson'
        return result
      }
    } catch (err) {
      console.warn('[gemini.ts] Groq explainer generate failed, trying Gemini:', err)
    }
  }

  if (GEMINI_API_KEY) {
    try {
      const text = await callGeminiText(EXPLAINER_PROMPT, 0.25)
      const result = parseJsonFromLLM<any>(text)
      if (result?.scenes?.length) {
        result.total_scenes = result.scenes.length
        result.summary = result.summary ?? result.hook ?? 'Key takeaways from this lesson'
        return result
      }
    } catch (geminiErr) {
      console.error('[gemini.ts] Gemini explainer generate failed too:', geminiErr)
    }
  }

  console.warn('[generateExplainer] Fallback to offline template')
  return buildFallbackExplainer(topic, subject)
}

export async function generateFlashcards(topic: string, subject: string, solution: any, difficulty: string = 'medium', count: number = 6) {
  const FLASHCARD_PROMPT = `Generate exactly ${count} flashcards about "${topic}" in ${subject}.
Difficulty: ${difficulty}
Context: ${JSON.stringify(solution).substring(0, 500)}

Return ONLY valid JSON. No markdown, no backticks.

{
  "flashcards": [
    {
      "front": "What is the quadratic formula and when is it used?",
      "back": "x = (-b ± √(b²-4ac)) / 2a. Used to solve any quadratic equation ax² + bx + c = 0 when factoring is difficult.",
      "type": "recall",
      "hint": "Think about the standard form ax² + bx + c = 0"
    }
  ]
}

Make fronts engaging questions, not just "What is X?". Make backs clear and memorable.
type: recall (definition), application (how to use), analysis (why/compare)`

  if (GROQ_API_KEY) {
    try {
      const text = await callGroq(FLASHCARD_PROMPT, 2048, 0.15, { jsonMode: true })
      return parseGroqJson(text)
    } catch (err) {
      console.warn('[gemini.ts] Groq flashcard generate failed, trying Gemini:', err)
    }
  }

  if (GEMINI_API_KEY) {
    const text = await callGeminiText(FLASHCARD_PROMPT, 0.15)
    const data = parseJsonFromLLM(text)
    if (data) return data
  }

  throw new Error('No AI service available for flashcard generation')
}

export async function generateQuizQuestions(
  subject: string,
  difficulty: string,
  count: number,
  topic?: string
) {
  const topicLine = topic?.trim()
    ? `Focus specifically on this topic: "${topic.trim()}". Every question must test knowledge of this topic.`
    : ''

  const QUIZ_PROMPT = `Generate exactly ${count} quiz questions about ${subject === 'All Subjects' ? 'various academic subjects (math, science, history, geography)' : subject} at ${difficulty} difficulty level.
${topicLine}

Return ONLY valid JSON. No markdown, no backticks.

{
  "questions": [
    {
      "type": "mcq",
      "question": "What is the value of x in the equation 2x + 6 = 14?",
      "options": ["2", "4", "6", "8"],
      "correct_index": 1,
      "explanation": "Subtract 6 from both sides: 2x = 8. Divide by 2: x = 4."
    },
    {
      "type": "true_false",
      "question": "The Great Wall of China is visible from space with the naked eye.",
      "correct": false,
      "explanation": "This is a common myth. The wall is too narrow (4-5 meters wide) to be seen from space without aid."
    }
  ]
}

Rules:
- Make 70% MCQ and 30% true/false
- MCQ must always have exactly 4 options
- correct_index is 0-based (0=first option, 1=second, etc.)
- Explanation must be educational, not just "correct because..."
- Questions must be factually accurate and appropriate for ${difficulty} level
- Make questions genuinely interesting and educational
- Return exactly ${count} questions`

  if (GROQ_API_KEY) {
    try {
      const text = await callGroq(QUIZ_PROMPT, 4096, 0.15, { jsonMode: true })
      const data = parseGroqJson<{ questions: unknown[] }>(text)
      if (data?.questions?.length) {
        return data
      }
    } catch (err) {
      console.warn('[gemini.ts] Groq quiz generate failed, trying Gemini:', err)
    }
  }

  if (GEMINI_API_KEY) {
    const text = await callGeminiText(QUIZ_PROMPT, 0.15)
    const data = parseJsonFromLLM<{ questions: unknown[] }>(text)
    if (data?.questions?.length) {
      return data
    }
  }

  throw new Error('No AI service available for quiz generation')
}

