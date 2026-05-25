/**
 * Math-Aware OCR System
 * 
 * Handles mathematical equation recognition with LaTeX output
 * Combines Tesseract for text + specialized math recognition
 */

import Tesseract from 'tesseract.js'

export interface MathOCRResult {
  text: string
  latex: string
  confidence: number
  equations: Array<{
    text: string
    latex: string
    bbox: { x: number; y: number; width: number; height: number }
  }>
  hasEquations: boolean
  hasDiagrams: boolean
}

/**
 * Enhanced OCR that detects and parses mathematical equations
 */
export async function recognizeMathFromImage(
  imageUri: string
): Promise<MathOCRResult> {
  try {
    // Step 1: Run Tesseract OCR
    const result = await Tesseract.recognize(imageUri, 'eng', {
      logger: (m) => console.log('[Tesseract]', m),
    })

    const rawText = result.data.text
    const confidence = result.data.confidence

    // Step 2: Detect mathematical expressions
    const words = (result.data as { words?: unknown[] }).words ?? []
    const equations = detectMathExpressions(rawText, words)

    // Step 3: Convert to LaTeX
    const latex = convertToLaTeX(rawText, equations)

    // Step 4: Detect diagrams
    const hasDiagrams = await detectDiagrams(imageUri)

    return {
      text: rawText,
      latex,
      confidence,
      equations,
      hasEquations: equations.length > 0,
      hasDiagrams,
    }
  } catch (error) {
    console.error('[MathOCR] Error:', error)
    throw new Error('Failed to recognize math from image')
  }
}

/**
 * Detect mathematical expressions in OCR text
 */
function detectMathExpressions(
  text: string,
  words: any[]
): Array<{ text: string; latex: string; bbox: any }> {
  const equations: Array<{ text: string; latex: string; bbox: any }> = []

  // Math patterns to detect
  const mathPatterns = [
    // Equations with = sign
    /([a-zA-Z0-9\s\+\-\*\/\^\(\)]+)\s*=\s*([a-zA-Z0-9\s\+\-\*\/\^\(\)]+)/g,
    // Fractions (detected as "a/b")
    /(\d+)\s*\/\s*(\d+)/g,
    // Powers (x^2, x^n)
    /([a-zA-Z])\s*\^\s*(\d+|[a-zA-Z])/g,
    // Square roots
    /√\s*(\d+|[a-zA-Z])/g,
    // Integrals
    /∫\s*(.+?)\s*d([a-zA-Z])/g,
    // Summations
    /Σ\s*(.+)/g,
  ]

  mathPatterns.forEach((pattern) => {
    let match
    while ((match = pattern.exec(text)) !== null) {
      const matchedText = match[0]
      const latex = convertExpressionToLaTeX(matchedText)
      
      equations.push({
        text: matchedText,
        latex,
        bbox: { x: 0, y: 0, width: 0, height: 0 }, // TODO: Get actual bbox from words
      })
    }
  })

  return equations
}

/**
 * Convert mathematical expression to LaTeX
 */
function convertExpressionToLaTeX(expr: string): string {
  let latex = expr

  // Replace common math symbols
  latex = latex.replace(/\^(\d+)/g, '^{$1}') // Powers
  latex = latex.replace(/\/(\d+)/g, '\\frac{}{$1}') // Fractions (simplified)
  latex = latex.replace(/√(\d+)/g, '\\sqrt{$1}') // Square roots
  latex = latex.replace(/∫/g, '\\int') // Integrals
  latex = latex.replace(/Σ/g, '\\sum') // Summations
  latex = latex.replace(/π/g, '\\pi') // Pi
  latex = latex.replace(/∞/g, '\\infty') // Infinity
  latex = latex.replace(/≤/g, '\\leq') // Less than or equal
  latex = latex.replace(/≥/g, '\\geq') // Greater than or equal
  latex = latex.replace(/≠/g, '\\neq') // Not equal
  latex = latex.replace(/×/g, '\\times') // Multiplication
  latex = latex.replace(/÷/g, '\\div') // Division

  return latex
}

/**
 * Convert full text to LaTeX format
 */
function convertToLaTeX(text: string, equations: any[]): string {
  let latex = text

  // Replace detected equations with LaTeX versions
  equations.forEach((eq) => {
    latex = latex.replace(eq.text, `$${eq.latex}$`)
  })

  return latex
}

/**
 * Detect if image contains diagrams/graphs
 * Uses simple heuristics - can be enhanced with ML model
 */
async function detectDiagrams(imageUri: string): Promise<boolean> {
  // TODO: Implement diagram detection
  // Could use:
  // 1. Edge detection (OpenCV)
  // 2. Line detection (Hough transform)
  // 3. ML model (YOLO for diagram detection)
  
  // For now, return false
  return false
}

/**
 * Enhanced math recognition using MathPix-like approach
 * This is a placeholder for future integration with MathPix API
 * or a custom ML model
 */
export async function recognizeMathWithML(
  imageBase64: string
): Promise<{ latex: string; confidence: number }> {
  // TODO: Integrate with MathPix API or custom model
  // For now, return empty result
  
  // Example MathPix API call (requires API key):
  /*
  const response = await fetch('https://api.mathpix.com/v3/text', {
    method: 'POST',
    headers: {
      'app_id': 'YOUR_APP_ID',
      'app_key': 'YOUR_APP_KEY',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      src: `data:image/jpeg;base64,${imageBase64}`,
      formats: ['latex_simplified'],
    }),
  })
  
  const data = await response.json()
  return {
    latex: data.latex_simplified,
    confidence: data.confidence,
  }
  */
  
  return {
    latex: '',
    confidence: 0,
  }
}

/**
 * Preprocess image for better OCR accuracy
 */
export async function preprocessImageForOCR(
  imageUri: string
): Promise<string> {
  // TODO: Implement image preprocessing
  // 1. Convert to grayscale
  // 2. Increase contrast
  // 3. Denoise
  // 4. Binarization (threshold)
  // 5. Deskew
  
  // For now, return original URI
  return imageUri
}

/**
 * Detect handwritten vs printed text
 */
export function detectHandwriting(text: string, confidence: number): boolean {
  // Heuristic: Low confidence often indicates handwriting
  // Can be enhanced with ML model
  return confidence < 70
}

/**
 * Clean up OCR text (remove noise, fix common errors)
 */
export function cleanOCRText(text: string): string {
  let cleaned = text

  // Remove extra whitespace
  cleaned = cleaned.replace(/\s+/g, ' ').trim()

  // Fix common OCR errors (never replace 0→O — breaks math like 10, 40)
  cleaned = cleaned.replace(/\|/g, 'I')
  cleaned = cleaned.replace(/\[/g, '(')
  cleaned = cleaned.replace(/\]/g, ')')
  cleaned = cleaned.replace(/√/g, 'sqrt(')

  // Fix equation spacing
  cleaned = cleaned.replace(/(\d)\s*([+\-*/=])\s*(\d)/g, '$1 $2 $3')

  return cleaned
}

/**
 * Extract equations from mixed text
 */
export function extractEquations(text: string): string[] {
  const equations: string[] = []

  // Pattern: anything with = sign and numbers/variables
  const equationPattern = /[a-zA-Z0-9\s\+\-\*\/\^\(\)]+\s*=\s*[a-zA-Z0-9\s\+\-\*\/\^\(\)]+/g
  
  let match
  while ((match = equationPattern.exec(text)) !== null) {
    equations.push(match[0].trim())
  }

  return equations
}

/**
 * Validate if OCR result is a valid mathematical expression
 */
export function validateMathExpression(expr: string): boolean {
  // Check for balanced parentheses
  let balance = 0
  for (const char of expr) {
    if (char === '(') balance++
    if (char === ')') balance--
    if (balance < 0) return false
  }
  if (balance !== 0) return false

  // Check for valid characters
  const validPattern = /^[a-zA-Z0-9\s\+\-\*\/\^\(\)=√∫Σπ∞≤≥≠×÷\.]+$/
  return validPattern.test(expr)
}
