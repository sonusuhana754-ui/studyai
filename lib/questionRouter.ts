/**
 * Intelligent Question Routing System
 * 
 * Analyzes questions and routes them to the most appropriate solver
 * This is the SECRET SAUCE that makes Gauth-like systems accurate
 */

const GROQ_API_KEY = process.env.EXPO_PUBLIC_GROQ_API_KEY

export interface QuestionClassification {
  subject: 'math' | 'physics' | 'chemistry' | 'biology' | 'history' | 'literature' | 'economics' | 'geography' | 'coding' | 'other'
  subTopic: string
  difficulty: 'easy' | 'medium' | 'hard'
  questionType: 'calculation' | 'conceptual' | 'proof' | 'essay' | 'multiple_choice' | 'true_false'
  requiredSolver: 'symbolic' | 'llm' | 'hybrid' | 'retrieval' | 'physics' | 'chemistry'
  confidence: number
  keywords: string[]
  estimatedSolveTime: number // in seconds
}

/**
 * Classify a question to determine the best solving approach
 */
export async function classifyQuestion(
  questionText: string,
  imageAnalysis?: { hasEquations: boolean; hasDiagrams: boolean; latex?: string }
): Promise<QuestionClassification> {
  try {
    // Quick heuristic classification (fast path)
    const heuristicResult = classifyWithHeuristics(questionText, imageAnalysis)
    
    // If confidence is high enough, return immediately
    if (heuristicResult.confidence > 0.85) {
      return heuristicResult
    }

    // Otherwise, use AI for more accurate classification
    const aiResult = await classifyWithAI(questionText, imageAnalysis)
    
    // Combine heuristic and AI results
    return {
      ...aiResult,
      confidence: (heuristicResult.confidence + aiResult.confidence) / 2,
    }
  } catch (error) {
    console.error('[QuestionRouter] Classification error:', error)
    // Fallback to heuristic classification
    return classifyWithHeuristics(questionText, imageAnalysis)
  }
}

/**
 * Fast heuristic-based classification
 */
function classifyWithHeuristics(
  questionText: string,
  imageAnalysis?: { hasEquations: boolean; hasDiagrams: boolean }
): QuestionClassification {
  const text = questionText.toLowerCase()
  
  // Subject detection patterns
  const subjectPatterns = {
    math: [
      /solve|equation|calculate|find x|integrate|differentiate|derivative|limit|sum|product/i,
      /algebra|geometry|calculus|trigonometry|statistics|probability/i,
      /\d+\s*[\+\-\*\/\^]\s*\d+/,
      /x\s*=|y\s*=|f\(x\)/i,
    ],
    physics: [
      /force|velocity|acceleration|energy|momentum|friction|gravity/i,
      /newton|joule|watt|volt|ampere|ohm/i,
      /motion|mechanics|thermodynamics|electromagnetism|optics/i,
    ],
    chemistry: [
      /molecule|atom|element|compound|reaction|balance|equation/i,
      /acid|base|ph|oxidation|reduction|catalyst/i,
      /H2O|CO2|NaCl|chemical formula/i,
    ],
    biology: [
      /cell|dna|rna|protein|enzyme|photosynthesis|respiration/i,
      /organism|species|evolution|genetics|ecosystem/i,
    ],
    history: [
      /when did|who was|what year|century|war|empire|revolution/i,
      /ancient|medieval|modern|independence|battle/i,
    ],
    literature: [
      /author|poem|novel|story|character|theme|metaphor/i,
      /shakespeare|poetry|prose|literature/i,
    ],
    economics: [
      /supply|demand|market|price|inflation|gdp|economy/i,
      /fiscal|monetary|trade|investment|profit|loss/i,
    ],
    geography: [
      /country|capital|continent|ocean|mountain|river|climate/i,
      /latitude|longitude|map|location/i,
    ],
    coding: [
      /code|program|function|algorithm|debug|syntax|compile/i,
      /python|javascript|java|c\+\+|html|css/i,
    ],
  }

  // Detect subject
  let subject: QuestionClassification['subject'] = 'other'
  let maxMatches = 0

  for (const [subj, patterns] of Object.entries(subjectPatterns)) {
    const matches = patterns.filter(pattern => pattern.test(text)).length
    if (matches > maxMatches) {
      maxMatches = matches
      subject = subj as QuestionClassification['subject']
    }
  }

  // If image has equations, likely math/physics/chemistry
  if (imageAnalysis?.hasEquations && subject === 'other') {
    subject = 'math'
  }

  // Detect question type
  let questionType: QuestionClassification['questionType'] = 'conceptual'
  if (/solve|calculate|find|compute|determine/i.test(text)) {
    questionType = 'calculation'
  } else if (/prove|show that|demonstrate/i.test(text)) {
    questionType = 'proof'
  } else if (/explain|describe|discuss|what is|why/i.test(text)) {
    questionType = 'essay'
  } else if (/choose|select|which of the following/i.test(text)) {
    questionType = 'multiple_choice'
  } else if (/true or false|is it true/i.test(text)) {
    questionType = 'true_false'
  }

  // Detect difficulty
  let difficulty: QuestionClassification['difficulty'] = 'medium'
  const complexityIndicators = {
    easy: [/basic|simple|elementary|fundamental/i],
    hard: [/advanced|complex|prove|derive|analyze|evaluate/i, /integral|differential|matrix|theorem/i],
  }

  if (complexityIndicators.easy.some(pattern => pattern.test(text))) {
    difficulty = 'easy'
  } else if (complexityIndicators.hard.some(pattern => pattern.test(text))) {
    difficulty = 'hard'
  }

  // Determine required solver
  let requiredSolver: QuestionClassification['requiredSolver'] = 'llm'
  
  if (subject === 'math' && questionType === 'calculation') {
    requiredSolver = 'symbolic'
  } else if (subject === 'physics') {
    requiredSolver = 'physics'
  } else if (subject === 'chemistry') {
    requiredSolver = 'chemistry'
  } else if (subject === 'math' && questionType === 'proof') {
    requiredSolver = 'hybrid'
  } else if (questionType === 'essay' || questionType === 'conceptual') {
    requiredSolver = 'llm'
  }

  // Extract keywords
  const keywords = extractKeywords(text)

  // Estimate solve time
  const estimatedSolveTime = estimateSolveTime(difficulty, questionType, subject)

  // Calculate confidence based on pattern matches
  const confidence = Math.min(0.95, 0.5 + (maxMatches * 0.15))

  return {
    subject,
    subTopic: keywords[0] || 'general',
    difficulty,
    questionType,
    requiredSolver,
    confidence,
    keywords,
    estimatedSolveTime,
  }
}

/**
 * AI-powered classification using LLM
 */
async function classifyWithAI(
  questionText: string,
  imageAnalysis?: { hasEquations: boolean; hasDiagrams: boolean }
): Promise<QuestionClassification> {
  if (!GROQ_API_KEY) {
    throw new Error('GROQ_API_KEY not set')
  }

  const prompt = `Classify this academic question. Return ONLY valid JSON, no other text.

Question: "${questionText}"

${imageAnalysis ? `Image analysis: Has equations: ${imageAnalysis.hasEquations}, Has diagrams: ${imageAnalysis.hasDiagrams}` : ''}

Return this exact JSON structure:
{
  "subject": "math|physics|chemistry|biology|history|literature|economics|geography|coding|other",
  "subTopic": "specific topic name",
  "difficulty": "easy|medium|hard",
  "questionType": "calculation|conceptual|proof|essay|multiple_choice|true_false",
  "requiredSolver": "symbolic|llm|hybrid|retrieval|physics|chemistry",
  "confidence": 0.95,
  "keywords": ["keyword1", "keyword2"],
  "estimatedSolveTime": 30
}

Rules:
- subject: primary academic subject
- subTopic: specific topic within subject (e.g., "quadratic equations", "Newton's laws")
- difficulty: based on complexity and required knowledge
- questionType: what kind of answer is expected
- requiredSolver: 
  * symbolic = exact math calculation (algebra, calculus)
  * llm = conceptual explanation
  * hybrid = both calculation and explanation
  * retrieval = can be answered from knowledge base
  * physics = physics-specific solver with units
  * chemistry = chemistry-specific solver with formulas
- confidence: 0-1 how confident you are
- keywords: 3-5 key terms
- estimatedSolveTime: seconds to solve (10-300)`

  const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${GROQ_API_KEY}`,
    },
    body: JSON.stringify({
      model: 'llama-3.3-70b-versatile',
      messages: [
        { role: 'system', content: 'You are an expert at classifying academic questions. Return only valid JSON.' },
        { role: 'user', content: prompt },
      ],
      temperature: 0.1,
      max_tokens: 512,
    }),
  })

  if (!response.ok) {
    throw new Error(`AI classification failed: ${response.status}`)
  }

  const data = await response.json()
  const text = data?.choices?.[0]?.message?.content

  if (!text) {
    throw new Error('Empty AI response')
  }

  // Parse JSON from response
  const cleaned = text.trim().replace(/```json\n?/g, '').replace(/```/g, '').trim()
  const start = cleaned.indexOf('{')
  const end = cleaned.lastIndexOf('}')
  
  if (start === -1 || end === -1) {
    throw new Error('No JSON found in AI response')
  }

  const result = JSON.parse(cleaned.substring(start, end + 1))
  return result
}

/**
 * Extract important keywords from question text
 */
function extractKeywords(text: string): string[] {
  // Remove common words
  const stopWords = new Set([
    'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for',
    'of', 'with', 'by', 'from', 'is', 'are', 'was', 'were', 'be', 'been',
    'what', 'when', 'where', 'why', 'how', 'which', 'who', 'whom',
  ])

  const words = text
    .toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .split(/\s+/)
    .filter(word => word.length > 3 && !stopWords.has(word))

  // Count frequency
  const frequency: Record<string, number> = {}
  words.forEach(word => {
    frequency[word] = (frequency[word] || 0) + 1
  })

  // Sort by frequency and return top 5
  return Object.entries(frequency)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([word]) => word)
}

/**
 * Estimate time to solve based on question characteristics
 */
function estimateSolveTime(
  difficulty: string,
  questionType: string,
  subject: string
): number {
  let baseTime = 30 // seconds

  // Adjust for difficulty
  if (difficulty === 'easy') baseTime = 15
  if (difficulty === 'hard') baseTime = 60

  // Adjust for question type
  if (questionType === 'calculation') baseTime *= 0.8
  if (questionType === 'proof') baseTime *= 1.5
  if (questionType === 'essay') baseTime *= 2

  // Adjust for subject
  if (subject === 'math' || subject === 'physics') baseTime *= 1.2

  return Math.round(baseTime)
}

/**
 * Route question to appropriate solver based on classification
 */
export function routeToSolver(
  classification: QuestionClassification
): {
  solverType: string
  priority: number
  fallbackSolvers: string[]
} {
  const { requiredSolver, difficulty, confidence } = classification

  // Priority: 1 (highest) to 5 (lowest)
  let priority = 3

  if (confidence > 0.9) priority = 1
  else if (confidence > 0.7) priority = 2
  else if (confidence < 0.5) priority = 4

  // Define fallback chain
  const fallbackChains: Record<string, string[]> = {
    symbolic: ['hybrid', 'llm'],
    physics: ['hybrid', 'llm'],
    chemistry: ['hybrid', 'llm'],
    hybrid: ['llm', 'retrieval'],
    llm: ['retrieval'],
    retrieval: ['llm'],
  }

  return {
    solverType: requiredSolver,
    priority,
    fallbackSolvers: fallbackChains[requiredSolver] || ['llm'],
  }
}

/**
 * Determine if question should be escalated to human tutor
 */
export function shouldEscalateToHuman(
  classification: QuestionClassification,
  aiConfidence: number
): boolean {
  // Escalate if:
  // 1. Classification confidence is low
  if (classification.confidence < 0.5) return true

  // 2. AI solving confidence is low
  if (aiConfidence < 0.6) return true

  // 3. Question is very hard and requires proof
  if (classification.difficulty === 'hard' && classification.questionType === 'proof') {
    return true
  }

  // 4. Subject is not well-supported
  if (classification.subject === 'other') return true

  return false
}
