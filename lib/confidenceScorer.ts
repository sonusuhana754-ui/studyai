/**
 * AI Confidence Scoring System
 * 
 * This is CRITICAL for production AI tutoring systems
 * Determines when to trust AI vs escalate to human tutors
 */

import { Solution, SocraticResponse } from './gemini'
import { QuestionClassification } from './questionRouter'

export interface ConfidenceScore {
  overall: number // 0-1
  breakdown: {
    ocrQuality: number
    questionClassification: number
    solutionAccuracy: number
    stepLogic: number
    answerVerification: number
  }
  shouldEscalate: boolean
  escalationReason?: string
  trustLevel: 'high' | 'medium' | 'low' | 'very_low'
  recommendations: string[]
}

/**
 * Calculate comprehensive confidence score for a solution
 */
export async function calculateConfidence(
  question: string,
  solution: Solution | SocraticResponse,
  classification: QuestionClassification,
  ocrData?: { confidence: number; hasEquations: boolean }
): Promise<ConfidenceScore> {
  // 1. OCR Quality Score
  const ocrQuality = ocrData ? ocrData.confidence / 100 : 1.0

  // 2. Question Classification Confidence
  const questionClassification = classification.confidence

  // 3. Solution Accuracy Score
  const solutionAccuracy = await evaluateSolutionAccuracy(solution, classification)

  // 4. Step Logic Score (for answer mode)
  const stepLogic = 'steps' in solution 
    ? evaluateStepLogic(solution.steps)
    : 0.8 // Socratic mode gets default score

  // 5. Answer Verification Score
  const answerVerification = await verifyAnswer(question, solution, classification)

  // Calculate weighted overall score
  const weights = {
    ocrQuality: 0.15,
    questionClassification: 0.20,
    solutionAccuracy: 0.30,
    stepLogic: 0.20,
    answerVerification: 0.15,
  }

  const overall = 
    ocrQuality * weights.ocrQuality +
    questionClassification * weights.questionClassification +
    solutionAccuracy * weights.solutionAccuracy +
    stepLogic * weights.stepLogic +
    answerVerification * weights.answerVerification

  // Determine trust level
  let trustLevel: ConfidenceScore['trustLevel']
  if (overall >= 0.85) trustLevel = 'high'
  else if (overall >= 0.70) trustLevel = 'medium'
  else if (overall >= 0.50) trustLevel = 'low'
  else trustLevel = 'very_low'

  // Determine if should escalate
  const { shouldEscalate, reason } = determineEscalation(
    overall,
    {
      ocrQuality,
      questionClassification,
      solutionAccuracy,
      stepLogic,
      answerVerification,
    },
    classification
  )

  // Generate recommendations
  const recommendations = generateRecommendations(
    {
      ocrQuality,
      questionClassification,
      solutionAccuracy,
      stepLogic,
      answerVerification,
    },
    classification
  )

  return {
    overall,
    breakdown: {
      ocrQuality,
      questionClassification,
      solutionAccuracy,
      stepLogic,
      answerVerification,
    },
    shouldEscalate,
    escalationReason: reason,
    trustLevel,
    recommendations,
  }
}

/**
 * Evaluate solution accuracy based on various factors
 */
async function evaluateSolutionAccuracy(
  solution: Solution | SocraticResponse,
  classification: QuestionClassification
): Promise<number> {
  let score = 0.7 // Base score

  // Check if solution has required fields
  if ('steps' in solution) {
    // Answer mode
    if (!solution.steps || solution.steps.length === 0) {
      score -= 0.3
    } else {
      // More steps generally indicate more thorough solution
      const stepCount = solution.steps.length
      if (stepCount >= 2 && stepCount <= 6) {
        score += 0.1
      }

      // Check if steps have explanations
      const hasExplanations = solution.steps.every(step => step.explanation && step.explanation.length > 10)
      if (hasExplanations) score += 0.1

      // Check if math steps have formulas
      if (classification.subject === 'math' || classification.subject === 'physics') {
        const hasMath = solution.steps.some(step => step.math && step.math.length > 0)
        if (hasMath) score += 0.1
      }
    }

    // Check if answer exists and is not empty
    if (!solution.answer || solution.answer.trim().length === 0) {
      score -= 0.2
    }

    // Check if concept explanation exists
    if (!solution.concept || solution.concept.length < 20) {
      score -= 0.1
    }
  } else {
    // Socratic mode
    if (!solution.opening_question || solution.opening_question.length < 10) {
      score -= 0.2
    }

    if (!solution.hints || solution.hints.length < 2) {
      score -= 0.2
    }
  }

  // Ensure score is between 0 and 1
  return Math.max(0, Math.min(1, score))
}

/**
 * Evaluate logical consistency of solution steps
 */
function evaluateStepLogic(steps: any[]): number {
  if (!steps || steps.length === 0) return 0

  let score = 0.7 // Base score

  // Check step numbering is sequential
  const isSequential = steps.every((step, index) => step.step === index + 1)
  if (isSequential) score += 0.1

  // Check each step has action and explanation
  const hasRequiredFields = steps.every(
    step => step.action && step.explanation && 
    step.action.length > 5 && step.explanation.length > 10
  )
  if (hasRequiredFields) score += 0.1

  // Check for logical flow (each step should build on previous)
  // This is a simple heuristic - can be enhanced with NLP
  const hasLogicalFlow = steps.length >= 2
  if (hasLogicalFlow) score += 0.1

  return Math.min(1, score)
}

/**
 * Verify answer using multiple methods
 */
async function verifyAnswer(
  question: string,
  solution: Solution | SocraticResponse,
  classification: QuestionClassification
): Promise<number> {
  // For now, use heuristic verification
  // In production, you would:
  // 1. Solve with multiple models and compare
  // 2. Use symbolic solver to verify math
  // 3. Check against known answer database

  let score = 0.7 // Base score

  // Check answer format is appropriate for question type
  if ('answer' in solution) {
    const answer = solution.answer

    if (classification.questionType === 'calculation') {
      // Should contain numbers
      const hasNumbers = /\d+/.test(answer)
      if (hasNumbers) score += 0.15

      // Should not be too long (calculations have concise answers)
      if (answer.length < 100) score += 0.15
    } else if (classification.questionType === 'essay' || classification.questionType === 'conceptual') {
      // Should be reasonably detailed
      if (answer.length > 50) score += 0.15
      if (answer.length > 100) score += 0.15
    }
  }

  return Math.min(1, score)
}

/**
 * Determine if solution should be escalated to human tutor
 */
function determineEscalation(
  overall: number,
  breakdown: ConfidenceScore['breakdown'],
  classification: QuestionClassification
): { shouldEscalate: boolean; reason?: string } {
  // Escalate if overall confidence is too low
  if (overall < 0.60) {
    return {
      shouldEscalate: true,
      reason: 'Overall confidence too low',
    }
  }

  // Escalate if OCR quality is poor
  if (breakdown.ocrQuality < 0.50) {
    return {
      shouldEscalate: true,
      reason: 'Poor image quality - unable to read question clearly',
    }
  }

  // Escalate if question classification is uncertain
  if (breakdown.questionClassification < 0.50) {
    return {
      shouldEscalate: true,
      reason: 'Unable to determine question type with confidence',
    }
  }

  // Escalate if solution accuracy is questionable
  if (breakdown.solutionAccuracy < 0.60) {
    return {
      shouldEscalate: true,
      reason: 'Solution quality below acceptable threshold',
    }
  }

  // Escalate hard proof questions (these often need human expertise)
  if (classification.difficulty === 'hard' && classification.questionType === 'proof') {
    if (overall < 0.80) {
      return {
        shouldEscalate: true,
        reason: 'Complex proof question requires expert verification',
      }
    }
  }

  // Don't escalate
  return { shouldEscalate: false }
}

/**
 * Generate recommendations for improving confidence
 */
function generateRecommendations(
  breakdown: ConfidenceScore['breakdown'],
  classification: QuestionClassification
): string[] {
  const recommendations: string[] = []

  if (breakdown.ocrQuality < 0.70) {
    recommendations.push('Try retaking the photo with better lighting')
    recommendations.push('Ensure the question is clearly visible and in focus')
  }

  if (breakdown.questionClassification < 0.70) {
    recommendations.push('Try rephrasing the question more clearly')
    recommendations.push('Include more context about what you need help with')
  }

  if (breakdown.solutionAccuracy < 0.70) {
    recommendations.push('Consider trying Socratic mode for step-by-step guidance')
    recommendations.push('Verify the answer using alternative methods')
  }

  if (breakdown.stepLogic < 0.70) {
    recommendations.push('Review each step carefully for logical consistency')
  }

  if (classification.difficulty === 'hard') {
    recommendations.push('Consider consulting with a human tutor for complex problems')
  }

  return recommendations
}

/**
 * Compare multiple solutions and return consensus
 */
export async function findConsensus(
  solutions: Solution[]
): Promise<{
  consensus: Solution | null
  confidence: number
  agreement: number // 0-1, how much solutions agree
}> {
  if (solutions.length === 0) {
    return { consensus: null, confidence: 0, agreement: 0 }
  }

  if (solutions.length === 1) {
    return { consensus: solutions[0], confidence: 0.7, agreement: 1.0 }
  }

  // Compare answers
  const answers = solutions.map(s => s.answer.toLowerCase().trim())
  const uniqueAnswers = new Set(answers)

  // Calculate agreement
  const agreement = 1 - (uniqueAnswers.size - 1) / solutions.length

  // If all agree, high confidence
  if (uniqueAnswers.size === 1) {
    return {
      consensus: solutions[0],
      confidence: 0.95,
      agreement: 1.0,
    }
  }

  // If majority agrees, medium confidence
  const answerCounts: Record<string, number> = {}
  answers.forEach(ans => {
    answerCounts[ans] = (answerCounts[ans] || 0) + 1
  })

  const maxCount = Math.max(...Object.values(answerCounts))
  const majorityAnswer = Object.keys(answerCounts).find(
    ans => answerCounts[ans] === maxCount
  )

  const consensusSolution = solutions.find(
    s => s.answer.toLowerCase().trim() === majorityAnswer
  )

  return {
    consensus: consensusSolution || solutions[0],
    confidence: 0.6 + (agreement * 0.3),
    agreement,
  }
}

/**
 * Log confidence scores for analytics
 */
export async function logConfidenceScore(
  questionId: string,
  score: ConfidenceScore,
  userId?: string
): Promise<void> {
  // TODO: Implement logging to database
  // This data is valuable for:
  // 1. Improving AI models
  // 2. Identifying weak areas
  // 3. Training data for confidence prediction
  
  console.log('[ConfidenceScore]', {
    questionId,
    overall: score.overall,
    trustLevel: score.trustLevel,
    shouldEscalate: score.shouldEscalate,
  })
}
