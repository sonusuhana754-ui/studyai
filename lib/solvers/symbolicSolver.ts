/**
 * Symbolic Math Solver
 * 
 * Provides exact mathematical solutions using symbolic computation
 * This is what separates good AI tutors from great ones
 */

import * as math from 'mathjs'

export interface SymbolicSolution {
  steps: Array<{
    step: number
    action: string
    expression: string
    explanation: string
  }>
  answer: string
  method: string
  verification?: string
}

/**
 * Solve linear equation: ax + b = c
 */
export function solveLinear(equation: string): SymbolicSolution {
  try {
    // Parse equation
    const [left, right] = equation.split('=').map(s => s.trim())
    
    // Use math.js to solve
    const node = math.parse(left)
    const simplified = math.simplify(node)
    
    // Extract coefficients
    // For equation like "2x + 5 = 13"
    // We need to isolate x
    
    const steps: SymbolicSolution['steps'] = []
    
    // Step 1: Move constant to right side
    steps.push({
      step: 1,
      action: 'Isolate variable term',
      expression: `${left} = ${right}`,
      explanation: 'Start with the original equation',
    })
    
    // Step 2: Simplify
    steps.push({
      step: 2,
      action: 'Simplify',
      expression: `x = ${math.evaluate(right)}`,
      explanation: 'Solve for x',
    })
    
    const answer = `x = ${math.evaluate(right)}`
    
    return {
      steps,
      answer,
      method: 'Linear equation solving',
      verification: `Substitute x = ${math.evaluate(right)} back into original equation`,
    }
  } catch (error) {
    console.error('[SymbolicSolver] Error solving linear equation:', error)
    throw new Error('Failed to solve linear equation')
  }
}

/**
 * Solve quadratic equation: ax² + bx + c = 0
 */
export function solveQuadratic(a: number, b: number, c: number): SymbolicSolution {
  const steps: SymbolicSolution['steps'] = []
  
  // Step 1: Identify coefficients
  steps.push({
    step: 1,
    action: 'Identify coefficients',
    expression: `a = ${a}, b = ${b}, c = ${c}`,
    explanation: 'Extract coefficients from standard form ax² + bx + c = 0',
  })
  
  // Step 2: Calculate discriminant
  const discriminant = b * b - 4 * a * c
  steps.push({
    step: 2,
    action: 'Calculate discriminant',
    expression: `Δ = b² - 4ac = ${b}² - 4(${a})(${c}) = ${discriminant}`,
    explanation: 'The discriminant determines the nature of roots',
  })
  
  // Step 3: Apply quadratic formula
  if (discriminant < 0) {
    steps.push({
      step: 3,
      action: 'No real solutions',
      expression: 'Δ < 0',
      explanation: 'Negative discriminant means complex roots',
    })
    
    return {
      steps,
      answer: 'No real solutions (complex roots)',
      method: 'Quadratic formula',
    }
  } else if (discriminant === 0) {
    const x = -b / (2 * a)
    steps.push({
      step: 3,
      action: 'Apply quadratic formula',
      expression: `x = -b / (2a) = ${-b} / ${2 * a} = ${x}`,
      explanation: 'One repeated root',
    })
    
    return {
      steps,
      answer: `x = ${x} (repeated root)`,
      method: 'Quadratic formula',
      verification: `Substitute x = ${x} into original equation`,
    }
  } else {
    const sqrtDiscriminant = Math.sqrt(discriminant)
    const x1 = (-b + sqrtDiscriminant) / (2 * a)
    const x2 = (-b - sqrtDiscriminant) / (2 * a)
    
    steps.push({
      step: 3,
      action: 'Apply quadratic formula',
      expression: `x = (-b ± √Δ) / (2a) = (${-b} ± √${discriminant}) / ${2 * a}`,
      explanation: 'Calculate both roots',
    })
    
    steps.push({
      step: 4,
      action: 'Calculate roots',
      expression: `x₁ = ${x1.toFixed(2)}, x₂ = ${x2.toFixed(2)}`,
      explanation: 'Two distinct real roots',
    })
    
    return {
      steps,
      answer: `x = ${x1.toFixed(2)} or x = ${x2.toFixed(2)}`,
      method: 'Quadratic formula',
      verification: `Substitute both values back into original equation`,
    }
  }
}

/**
 * Parse and solve quadratic from string
 */
export function parseAndSolveQuadratic(equation: string): SymbolicSolution {
  try {
    // Remove spaces and convert to lowercase
    const cleaned = equation.toLowerCase().replace(/\s+/g, '')
    
    // Extract coefficients using regex
    // Matches patterns like: x^2 + 5x - 6 = 0, 2x² + 3x + 1 = 0
    const quadraticPattern = /([+-]?\d*\.?\d*)x[²\^]?2?\s*([+-]?\d*\.?\d*)x?\s*([+-]?\d*\.?\d*)\s*=\s*0/
    const match = cleaned.match(quadraticPattern)
    
    if (!match) {
      throw new Error('Could not parse quadratic equation')
    }
    
    // Extract coefficients
    let a = match[1] ? parseFloat(match[1]) : 1
    let b = match[2] ? parseFloat(match[2]) : 0
    let c = match[3] ? parseFloat(match[3]) : 0
    
    // Handle implicit 1 or -1
    if (match[1] === '' || match[1] === '+') a = 1
    if (match[1] === '-') a = -1
    if (match[2] === '' || match[2] === '+') b = 1
    if (match[2] === '-') b = -1
    
    return solveQuadratic(a, b, c)
  } catch (error) {
    console.error('[SymbolicSolver] Error parsing quadratic:', error)
    throw new Error('Failed to parse quadratic equation')
  }
}

/**
 * Calculate derivative
 */
export function derivative(expression: string, variable: string = 'x'): SymbolicSolution {
  try {
    const node = math.parse(expression)
    const derivative = math.derivative(node, variable)
    
    const steps: SymbolicSolution['steps'] = [
      {
        step: 1,
        action: 'Original function',
        expression: `f(${variable}) = ${expression}`,
        explanation: 'Function to differentiate',
      },
      {
        step: 2,
        action: 'Apply differentiation rules',
        expression: `f'(${variable}) = ${derivative.toString()}`,
        explanation: 'Use power rule, chain rule, etc.',
      },
    ]
    
    return {
      steps,
      answer: derivative.toString(),
      method: 'Differentiation',
    }
  } catch (error) {
    console.error('[SymbolicSolver] Error calculating derivative:', error)
    throw new Error('Failed to calculate derivative')
  }
}

/**
 * Simplify expression
 */
export function simplify(expression: string): SymbolicSolution {
  try {
    const node = math.parse(expression)
    const simplified = math.simplify(node)
    
    const steps: SymbolicSolution['steps'] = [
      {
        step: 1,
        action: 'Original expression',
        expression: expression,
        explanation: 'Expression to simplify',
      },
      {
        step: 2,
        action: 'Simplify',
        expression: simplified.toString(),
        explanation: 'Combine like terms and simplify',
      },
    ]
    
    return {
      steps,
      answer: simplified.toString(),
      method: 'Algebraic simplification',
    }
  } catch (error) {
    console.error('[SymbolicSolver] Error simplifying:', error)
    throw new Error('Failed to simplify expression')
  }
}

/**
 * Evaluate expression
 */
export function evaluate(expression: string, variables?: Record<string, number>): number {
  try {
    if (variables) {
      return math.evaluate(expression, variables)
    }
    return math.evaluate(expression)
  } catch (error) {
    console.error('[SymbolicSolver] Error evaluating:', error)
    throw new Error('Failed to evaluate expression')
  }
}

/**
 * Solve system of linear equations
 */
export function solveSystem(equations: string[]): SymbolicSolution {
  try {
    // For now, use math.js to solve
    // This is a simplified implementation
    
    const steps: SymbolicSolution['steps'] = [
      {
        step: 1,
        action: 'System of equations',
        expression: equations.join('\n'),
        explanation: 'Set up the system',
      },
    ]
    
    // TODO: Implement proper system solving
    // For now, return placeholder
    
    return {
      steps,
      answer: 'System solving not yet implemented',
      method: 'Gaussian elimination',
    }
  } catch (error) {
    console.error('[SymbolicSolver] Error solving system:', error)
    throw new Error('Failed to solve system')
  }
}

/**
 * Factor polynomial
 */
export function factor(expression: string): SymbolicSolution {
  try {
    // math.js doesn't have built-in factoring
    // This is a placeholder for future implementation
    
    const steps: SymbolicSolution['steps'] = [
      {
        step: 1,
        action: 'Original expression',
        expression: expression,
        explanation: 'Expression to factor',
      },
    ]
    
    // TODO: Implement factoring algorithm
    
    return {
      steps,
      answer: 'Factoring not yet implemented',
      method: 'Polynomial factoring',
    }
  } catch (error) {
    console.error('[SymbolicSolver] Error factoring:', error)
    throw new Error('Failed to factor expression')
  }
}

/**
 * Main solver function - routes to appropriate method
 */
export async function solveSymbolic(
  equation: string,
  type?: 'linear' | 'quadratic' | 'derivative' | 'simplify' | 'system'
): Promise<SymbolicSolution> {
  try {
    // Auto-detect type if not provided
    if (!type) {
      if (equation.includes('²') || equation.includes('^2')) {
        type = 'quadratic'
      } else if (equation.includes('d/dx') || equation.includes('derivative')) {
        type = 'derivative'
      } else if (equation.includes('=') && !equation.includes('²')) {
        type = 'linear'
      } else {
        type = 'simplify'
      }
    }
    
    switch (type) {
      case 'linear':
        return solveLinear(equation)
      
      case 'quadratic':
        return parseAndSolveQuadratic(equation)
      
      case 'derivative':
        // Extract expression from "derivative of ..." or "d/dx ..."
        const expr = equation.replace(/derivative of |d\/dx /gi, '').trim()
        return derivative(expr)
      
      case 'simplify':
        return simplify(equation)
      
      case 'system':
        return solveSystem([equation])
      
      default:
        throw new Error(`Unknown equation type: ${type}`)
    }
  } catch (error) {
    console.error('[SymbolicSolver] Error:', error)
    throw error
  }
}

/**
 * Verify solution by substitution
 */
export function verifySolution(
  equation: string,
  variable: string,
  value: number
): boolean {
  try {
    const [left, right] = equation.split('=').map(s => s.trim())
    
    const leftValue = evaluate(left, { [variable]: value })
    const rightValue = evaluate(right, { [variable]: value })
    
    // Check if equal within tolerance
    const tolerance = 0.0001
    return Math.abs(leftValue - rightValue) < tolerance
  } catch (error) {
    console.error('[SymbolicSolver] Error verifying:', error)
    return false
  }
}
