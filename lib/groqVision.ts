/**
 * Groq vision (Llama 4 Scout) — photo read & solve when Gemini is unavailable.
 */

import { detectImageMimeType, stripBase64Prefix } from './imageBase64'

const GROQ_API_KEY = process.env.EXPO_PUBLIC_GROQ_API_KEY
const VISION_MODEL = 'meta-llama/llama-4-scout-17b-16e-instruct'

const MAX_BASE64_CHARS = 3_500_000 // Groq limit ~4MB

export function hasGroqVision(): boolean {
  return !!GROQ_API_KEY
}

function dataUrl(imageBase64: string, uri?: string): string {
  const raw = stripBase64Prefix(imageBase64)
  const mime = detectImageMimeType(raw, uri)
  return `data:${mime};base64,${raw}`
}

function shrinkBase64IfNeeded(base64: string): string {
  const raw = stripBase64Prefix(base64)
  if (raw.length <= MAX_BASE64_CHARS) return raw
  console.warn('[groqVision] Image large; truncating may fail — use a closer crop')
  return raw.slice(0, MAX_BASE64_CHARS)
}

function parseGroqError(status: number, body: string): string {
  try {
    const j = JSON.parse(body)
    const msg = j?.error?.message ?? body
    if (status === 429) return 'Groq rate limit reached. Wait a minute and try again.'
    if (status === 413) return 'Photo is too large. Crop closer to the problem and retry.'
    return msg
  } catch {
    return body || `Groq API error (${status})`
  }
}

async function groqVisionChat(
  imageBase64: string,
  textPrompt: string,
  uri?: string,
  maxTokens = 4096
): Promise<string> {
  if (!GROQ_API_KEY) {
    throw new Error('EXPO_PUBLIC_GROQ_API_KEY is not set')
  }

  const url = dataUrl(shrinkBase64IfNeeded(imageBase64), uri)

  const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${GROQ_API_KEY}`,
    },
    body: JSON.stringify({
      model: VISION_MODEL,
      messages: [
        {
          role: 'user',
          content: [
            { type: 'image_url', image_url: { url } },
            { type: 'text', text: textPrompt },
          ],
        },
      ],
      temperature: 0.1,
      max_completion_tokens: maxTokens,
      response_format: { type: 'json_object' },
    }),
  })

  if (!response.ok) {
    const errText = await response.text()
    throw new Error(parseGroqError(response.status, errText))
  }

  const data = await response.json()
  const text = data?.choices?.[0]?.message?.content
  if (!text?.trim()) throw new Error('Empty response from Groq vision')
  return text.trim()
}

const EXTRACT_LATEX_PROMPT = `Read the math problem in this image. Return ONE line of LaTeX only.
Use \\sqrt{} for roots, \\frac{a}{b} for fractions. Example: \\frac{\\sqrt{7+4\\sqrt{3}}}{7+\\sqrt{3}} = ?
No markdown, no explanation.`

export async function extractQuestionFromImageGroq(
  imageBase64: string,
  uri?: string
): Promise<string> {
  let text = await groqVisionChat(imageBase64, EXTRACT_LATEX_PROMPT, uri, 512)
  text = text.replace(/^```(?:latex)?\n?/i, '').replace(/```$/i, '').trim()
  return text
}

export async function solveFromImageWithGroq(
  imageBase64: string,
  prompt: string,
  uri?: string
): Promise<string> {
  const prefix = `The problem is in the image above. Read it and solve it. Do NOT say the image is missing.\n\n`
  return groqVisionChat(imageBase64, prefix + prompt, uri, 4096)
}

const SURD_SOLVE_PROMPT = `You are an expert mathematician. Solve this expression exactly.

Rules:
- Simplify nested square roots (e.g. if 7+4√3 = (√3+2)² then √(7+4√3) = √3+2)
- For fractions with radicals, rationalize when standard
- Show 3-5 clear steps with "math" field showing algebra
- "answer" must be the simplified exact form (use √ or sqrt notation), NOT a wrong decimal
- Return ONLY one valid JSON object (no markdown fences)
- In JSON strings, escape backslashes: write \\\\frac and \\\\sqrt (double backslashes)
- Each step needs: step, action, explanation, math

`

export async function solveSurdProblemWithGroq(
  problemLatex: string,
  imageBase64?: string,
  uri?: string
): Promise<string> {
  const prompt = `${SURD_SOLVE_PROMPT}\nProblem:\n${problemLatex}`
  if (imageBase64) {
    return solveFromImageWithGroq(imageBase64, prompt, uri)
  }
  if (!GROQ_API_KEY) throw new Error('EXPO_PUBLIC_GROQ_API_KEY is not set')
  const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${GROQ_API_KEY}`,
    },
    body: JSON.stringify({
      model: 'llama-3.3-70b-versatile',
      messages: [
        {
          role: 'system',
          content:
            'Return only valid JSON. Escape LaTeX backslashes (\\\\frac). Double-check radical simplification.',
        },
        { role: 'user', content: prompt },
      ],
      temperature: 0.05,
      max_tokens: 2048,
      response_format: { type: 'json_object' },
    }),
  })
  if (!response.ok) {
    const errText = await response.text()
    throw new Error(parseGroqError(response.status, errText))
  }
  const data = await response.json()
  const text = data?.choices?.[0]?.message?.content
  if (!text?.trim()) throw new Error('Empty response from Groq')
  return text.trim()
}

export function isGeminiQuotaError(err: unknown): boolean {
  const msg = String(err instanceof Error ? err.message : err)
  return /429|quota|RESOURCE_EXHAUSTED|rate.?limit/i.test(msg)
}
