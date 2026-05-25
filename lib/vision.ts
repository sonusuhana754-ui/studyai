/**
 * Photo AI: Groq vision (primary) + Gemini vision (fallback)
 */

import { GoogleGenerativeAI } from '@google/generative-ai'
import { isTrustworthyMathExtraction } from './mathExtraction'
import { detectImageMimeType, stripBase64Prefix } from './imageBase64'
import {
  extractQuestionFromImageGroq,
  hasGroqVision,
  isGeminiQuotaError,
  solveFromImageWithGroq,
} from './groqVision'

const GEMINI_API_KEY =
  process.env.EXPO_PUBLIC_GEMINI_API_KEY ??
  process.env.EXPO_PUBLIC_GOOGLE_GEMINI_API_KEY

const EXTRACT_LATEX_PROMPT = `You are an expert at reading math homework from photos.

Transcribe the MAIN problem exactly as a single LaTeX expression.

RULES (critical):
- Use \\sqrt{...} for EVERY square root, including nested: \\sqrt{7+4\\sqrt{3}}
- Use \\frac{numerator}{denominator} for fractions (long horizontal fraction bar)
- NEVER merge digits: write 4\\sqrt{3}, NOT "43" or "4 3"
- Include all numbers, operators, and = ? if shown
- Return ONE line of LaTeX only, no explanation, no markdown fences
- Example: \\frac{\\sqrt{7+4\\sqrt{3}}}{7+\\sqrt{3}} = ?`

function getGeminiModel() {
  if (!GEMINI_API_KEY) {
    throw new Error('EXPO_PUBLIC_GEMINI_API_KEY is not set')
  }
  const genAI = new GoogleGenerativeAI(GEMINI_API_KEY)
  return genAI.getGenerativeModel({ model: 'gemini-2.0-flash' })
}

function imagePart(imageBase64: string, uri?: string) {
  return {
    inlineData: {
      mimeType: detectImageMimeType(imageBase64, uri),
      data: stripBase64Prefix(imageBase64),
    },
  }
}

async function extractQuestionFromImageGemini(
  imageBase64: string,
  uri?: string
): Promise<string> {
  const model = getGeminiModel()
  const result = await model.generateContent([
    imagePart(imageBase64, uri),
    { text: EXTRACT_LATEX_PROMPT },
  ])
  let text = result.response.text().trim()
  text = text.replace(/^```(?:latex)?\n?/i, '').replace(/```$/i, '').trim()
  return text
}

export async function extractQuestionFromImage(
  imageBase64: string,
  uri?: string
): Promise<string> {
  if (hasGroqVision()) {
    try {
      return await extractQuestionFromImageGroq(imageBase64, uri)
    } catch (e) {
      console.warn('[vision] Groq extract failed, trying Gemini:', e)
    }
  }

  if (GEMINI_API_KEY) {
    return extractQuestionFromImageGemini(imageBase64, uri)
  }

  throw new Error('No vision API available. Set EXPO_PUBLIC_GROQ_API_KEY in .env')
}

const IMAGE_SOLVE_PREFIX = `The homework problem is in the IMAGE attached above. You can see it clearly.
Do NOT say the image is missing or unavailable. Read the math from the picture and solve it.

`

async function solveFromImageWithGemini(
  imageBase64: string,
  prompt: string,
  uri?: string
): Promise<string> {
  const model = getGeminiModel()
  const result = await model.generateContent([
    imagePart(imageBase64, uri),
    { text: IMAGE_SOLVE_PREFIX + prompt },
  ])
  return result.response.text().trim()
}

export async function solveFromImageWithVision(
  imageBase64: string,
  _mode: 'answer' | 'socratic',
  prompt: string,
  uri?: string
): Promise<string> {
  // Groq first — works on free tier; many Gemini keys hit quota limit 0
  if (hasGroqVision()) {
    try {
      return await solveFromImageWithGroq(imageBase64, prompt, uri)
    } catch (e) {
      console.warn('[vision] Groq solve failed:', e)
      if (!GEMINI_API_KEY) throw e
    }
  }

  if (GEMINI_API_KEY) {
    try {
      return await solveFromImageWithGemini(imageBase64, prompt, uri)
    } catch (e) {
      if (isGeminiQuotaError(e)) {
        throw new Error(
          'Google Gemini quota is used up. Photo solve uses Groq — check EXPO_PUBLIC_GROQ_API_KEY and restart the app.'
        )
      }
      throw e
    }
  }

  throw new Error('Set EXPO_PUBLIC_GROQ_API_KEY in .env for photo solving.')
}

export function hasGeminiVision(): boolean {
  return !!GEMINI_API_KEY
}

/** Photo scan available if Groq or Gemini is configured */
export function hasPhotoSolve(): boolean {
  return hasGroqVision() || hasGeminiVision()
}

export async function callGeminiText(prompt: string, temperature = 0.1): Promise<string> {
  if (!GEMINI_API_KEY) {
    throw new Error('EXPO_PUBLIC_GEMINI_API_KEY is not set')
  }
  const genAI = new GoogleGenerativeAI(GEMINI_API_KEY)
  const model = genAI.getGenerativeModel({
    model: 'gemini-2.0-flash',
    generationConfig: { temperature, maxOutputTokens: 4096 },
  })
  const result = await model.generateContent(prompt)
  const text = result.response.text()
  if (!text?.trim()) throw new Error('Empty response from Gemini')
  return text.trim()
}

export async function extractQuestionForDisplay(
  imageBase64: string,
  uri?: string
): Promise<string> {
  try {
    const latex = await extractQuestionFromImage(imageBase64, uri)
    if (isTrustworthyMathExtraction(latex) || latex.includes('\\sqrt') || latex.includes('\\frac')) {
      return latex
    }
    if (latex.length > 5) return latex
  } catch (e) {
    console.warn('[vision] LaTeX extract failed:', e)
  }
  return ''
}
