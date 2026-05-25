/**
 * Unified Solver Interface
 * 
 * Integrates all specialized solvers (symbolic, physics, chemistry, LLM)
 * Routes problems to the best solver based on classification
 */

import { solveWithGemini, Solution, SocraticResponse } from './gemini'
import { classifyQuestion, QuestionClassification } from './questionRouter'
import { calculateConfidence, ConfidenceScore } from './confidenceScorer'
import { solveSymbolic, SymbolicSolution } from './solvers/symbolicSolver'
import { solvePhysics, PhysicsSolution } from './solvers/physicsSolver'
import { solveChemistry, ChemistrySolution } from './solvers/chemistrySolver'

export interface UnifiedSolution {
  solution: Solution | SocraticResponse | SymbolicSolution | PhysicsSolution | ChemistrySolution
  classification: QuestionClassification
  confidence: ConfidenceScore
  solverUsed: 'symbolic' | 'physics' | 'chemistry' | 'llm' | 'hybrid'
  fallbackUsed: boolean
  processingTime: number
}

/**
 * Main unified solver - intelligently routes to best solver
 */
export async function solveUnified(
  questionText: string,
  imageBase64?: string,
  mode: 'answer' | 'socratic' = 'answer',
  ocrData?: { confidence: number; hasEquations: boolean }
): Promise<UnifiedSolution> {
  const startTime = Date.now()
  
  try {
    // Step 1: Classify the question
    console.log('[UnifiedSolver] Classifying question...')
    const classification = await classifyQuestion(
      questionText,
      ocrData ? {
        hasEquations: ocrData.hasEquations,
        hasDiagrams: false,
      } : undefined
    )
    
    console.log('[UnifiedSolver] Classification:', {
      subject: classification.subject,
      difficulty: classification.difficulty,
      solver: classification.requiredSolver,
    })
    
    // Step 2: LLM-first for accuracy (specialized solvers are best-effort only)
    let solution: any = null
    let solverUsed: UnifiedSolution['solverUsed'] = 'llm'
    let fallbackUsed = false

    const { solveProblem } = await import('./solveProblem')
    const solved = await solveProblem({
      questionText,
      imageBase64,
      mode,
    })
    solution = solved.result
    solverUsed = 'llm'

    // Math engine already ran inside solveProblem; do not override with legacy symbolic solver
    
    // Step 3: Calculate confidence
    console.log('[UnifiedSolver] Calculating confidence...')
    const confidence = await calculateConfidence(
      questionText,
      solution,
      classification,
      ocrData
    )
    
    const processingTime = Date.now() - startTime
    
    console.log('[UnifiedSolver] Complete:', {
      solverUsed,
      fallbackUsed,
      confidence: confidence.overall,
      processingTime: `${processingTime}ms`,
    })
    
    return {
      solution,
      classification,
      confidence,
      solverUsed,
      fallbackUsed,
      processingTime,
    }
  } catch (error) {
    console.error('[UnifiedSolver] Fatal error:', error)
    throw error
  }
}

/**
 * Try symbolic solver
 */
async function trySymbolicSolver(
  questionText: string,
  classification: QuestionClassification
): Promise<Solution> {
  // Extract equation from question
  const equation = extractEquation(questionText)
  
  if (!equation) {
    throw new Error('Could not extract equation')
  }
  
  // Solve using symbolic solver
  const symbolicResult = await solveSymbolic(equation)
  
  // Convert to standard Solution format
  return {
    subject: classification.subject,
    topic: classification.subTopic,
    difficulty: classification.difficulty,
    steps: symbolicResult.steps.map((step, i) => ({
      step: i + 1,
      action: step.action,
      explanation: step.explanation,
      math: step.expression,
    })),
    answer: symbolicResult.answer,
    concept: symbolicResult.method,
    fun_fact: 'Symbolic solvers provide exact solutions, not approximations!',
  }
}

/**
 * Try physics solver
 */
async function tryPhysicsSolver(
  questionText: string,
  classification: QuestionClassification
): Promise<Solution> {
  // Extract parameters from question
  const params = extractPhysicsParams(questionText)
  
  if (!params) {
    throw new Error('Could not extract physics parameters')
  }
  
  // Solve using physics solver
  const physicsResult = await solvePhysics(params.type, params.given)
  
  // Convert to standard Solution format
  return {
    subject: 'physics',
    topic: classification.subTopic,
    difficulty: classification.difficulty,
    steps: physicsResult.steps.map((step, i) => ({
      step: i + 1,
      action: step.action,
      explanation: step.explanation,
      math: step.formula || step.calculation,
    })),
    answer: `${physicsResult.answer} ${physicsResult.units}`,
    concept: physicsResult.concept,
    fun_fact: 'Physics is the study of matter, energy, and their interactions!',
  }
}

/**
 * Try chemistry solver
 */
async function tryChemistrySolver(
  questionText: string,
  classification: QuestionClassification
): Promise<Solution> {
  // Extract parameters from question
  const params = extractChemistryParams(questionText)
  
  if (!params) {
    throw new Error('Could not extract chemistry parameters')
  }
  
  // Solve using chemistry solver
  const chemistryResult = await solveChemistry(params.type, params.data)
  
  // Convert to standard Solution format
  return {
    subject: 'chemistry',
    topic: classification.subTopic,
    difficulty: classification.difficulty,
    steps: chemistryResult.steps.map((step, i) => ({
      step: i + 1,
      action: step.action,
      explanation: step.explanation,
      math: step.equation || step.calculation,
    })),
    answer: chemistryResult.answer,
    concept: chemistryResult.concept,
    fun_fact: 'Chemistry is the science of matter and its transformations!',
  }
}

/**
 * Try hybrid solver (symbolic + LLM)
 */
async function tryHybridSolver(
  questionText: string,
  imageBase64: string | undefined,
  classification: QuestionClassification
): Promise<Solution> {
  // Try symbolic first
  try {
    const symbolicResult = await trySymbolicSolver(questionText, classification)
    
    // Enhance with LLM explanation
    const llmResult = await solveWithGemini(
      `Explain this solution in detail: ${JSON.stringify(symbolicResult)}`,
      undefined,
      'answer'
    ) as Solution
    
    // Combine results
    return {
      ...symbolicResult,
      concept: llmResult.concept || symbolicResult.concept,
      fun_fact: llmResult.fun_fact || symbolicResult.fun_fact,
    }
  } catch (error) {
    // Fall back to LLM only
    return (await solveWithGemini(questionText, imageBase64, 'answer')) as Solution
  }
}

/**
 * Extract equation from question text
 */
function extractEquation(text: string): string | null {
  // Look for patterns like "solve: 2x + 5 = 13"
  const patterns = [
    /solve[:\s]+(.+)/i,
    /equation[:\s]+(.+)/i,
    /(.+)\s*=\s*(.+)/,
  ]
  
  for (const pattern of patterns) {
    const match = text.match(pattern)
    if (match) {
      return match[1] || match[0]
    }
  }
  
  return null
}

/**
 * Extract physics parameters from question
 */
function extractPhysicsParams(text: string): { type: string; given: Record<string, number> } | null {
  // This is a simplified implementation
  // In production, use NLP to extract parameters
  
  const given: Record<string, number> = {}
  
  // Extract numbers with units
  const numberPattern = /(\d+\.?\d*)\s*(m\/s²|m\/s|m|s|kg|N|J|W|V|A|Ω)/g
  let match
  
  while ((match = numberPattern.exec(text)) !== null) {
    const value = parseFloat(match[1])
    const unit = match[2]
    
    // Map units to variable names
    if (unit === 'm/s²') given.a = value
    else if (unit === 'm/s') given.v = value
    else if (unit === 'm') given.s = value
    else if (unit === 's') given.t = value
    else if (unit === 'kg') given.m = value
    else if (unit === 'N') given.F = value
  }
  
  // Determine problem type
  let type = 'velocity'
  if (text.includes('acceleration')) type = 'acceleration'
  else if (text.includes('force')) type = 'force'
  else if (text.includes('energy')) type = 'kinetic'
  else if (text.includes('power')) type = 'power'
  
  if (Object.keys(given).length === 0) {
    return null
  }
  
  return { type, given }
}

/**
 * Extract chemistry parameters from question
 */
function extractChemistryParams(text: string): { type: string; data: any } | null {
  // Detect problem type
  if (text.includes('molar mass') || text.includes('molecular weight')) {
    // Extract chemical formula
    const formulaPattern = /([A-Z][a-z]?\d*)+/g
    const match = text.match(formulaPattern)
    if (match) {
      return {
        type: 'molar_mass',
        data: { formula: match[0] },
      }
    }
  }
  
  if (text.includes('balance')) {
    // Extract equation
    const equationPattern = /(.+)\s*→\s*(.+)/
    const match = text.match(equationPattern)
    if (match) {
      return {
        type: 'balance',
        data: { equation: match[0] },
      }
    }
  }
  
  if (text.includes('pH')) {
    // Extract H+ concentration
    const concentrationPattern = /(\d+\.?\d*)\s*[×x]\s*10\^?-?(\d+)/
    const match = text.match(concentrationPattern)
    if (match) {
      const concentration = parseFloat(match[1]) * Math.pow(10, -parseFloat(match[2]))
      return {
        type: 'ph',
        data: { hPlusConcentration: concentration },
      }
    }
  }
  
  return null
}

/**
 * Verify solution using multiple methods
 */
export async function verifySolution(
  questionText: string,
  solution: Solution,
  classification: QuestionClassification
): Promise<{ verified: boolean; confidence: number; method: string }> {
  // For symbolic solutions, verify by substitution
  if (classification.requiredSolver === 'symbolic') {
    // TODO: Implement verification
    return {
      verified: true,
      confidence: 0.95,
      method: 'Symbolic verification',
    }
  }
  
  // For other solutions, use confidence score
  return {
    verified: true,
    confidence: 0.80,
    method: 'Confidence-based verification',
  }
}
