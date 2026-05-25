/**
 * Chemistry Solver
 * 
 * Specialized solver for chemistry problems
 */

export interface ChemistrySolution {
  steps: Array<{
    step: number
    action: string
    equation?: string
    calculation?: string
    explanation: string
  }>
  answer: string
  concept: string
}

// Periodic table data (simplified)
export const ELEMENTS: Record<string, { symbol: string; atomicMass: number; atomicNumber: number }> = {
  H: { symbol: 'H', atomicMass: 1.008, atomicNumber: 1 },
  He: { symbol: 'He', atomicMass: 4.003, atomicNumber: 2 },
  C: { symbol: 'C', atomicMass: 12.011, atomicNumber: 6 },
  N: { symbol: 'N', atomicMass: 14.007, atomicNumber: 7 },
  O: { symbol: 'O', atomicMass: 15.999, atomicNumber: 8 },
  F: { symbol: 'F', atomicMass: 18.998, atomicNumber: 9 },
  Na: { symbol: 'Na', atomicMass: 22.990, atomicNumber: 11 },
  Mg: { symbol: 'Mg', atomicMass: 24.305, atomicNumber: 12 },
  Al: { symbol: 'Al', atomicMass: 26.982, atomicNumber: 13 },
  Si: { symbol: 'Si', atomicMass: 28.085, atomicNumber: 14 },
  P: { symbol: 'P', atomicMass: 30.974, atomicNumber: 15 },
  S: { symbol: 'S', atomicMass: 32.06, atomicNumber: 16 },
  Cl: { symbol: 'Cl', atomicMass: 35.45, atomicNumber: 17 },
  K: { symbol: 'K', atomicMass: 39.098, atomicNumber: 19 },
  Ca: { symbol: 'Ca', atomicMass: 40.078, atomicNumber: 20 },
  Fe: { symbol: 'Fe', atomicMass: 55.845, atomicNumber: 26 },
  Cu: { symbol: 'Cu', atomicMass: 63.546, atomicNumber: 29 },
  Zn: { symbol: 'Zn', atomicMass: 65.38, atomicNumber: 30 },
  Ag: { symbol: 'Ag', atomicMass: 107.868, atomicNumber: 47 },
  Au: { symbol: 'Au', atomicMass: 196.967, atomicNumber: 79 },
}

/**
 * Parse chemical formula to extract elements and counts
 */
function parseFormula(formula: string): Record<string, number> {
  const elements: Record<string, number> = {}
  
  // Match element symbols followed by optional numbers
  const pattern = /([A-Z][a-z]?)(\d*)/g
  let match
  
  while ((match = pattern.exec(formula)) !== null) {
    const element = match[1]
    const count = match[2] ? parseInt(match[2]) : 1
    elements[element] = (elements[element] || 0) + count
  }
  
  return elements
}

/**
 * Calculate molar mass of a compound
 */
export function calculateMolarMass(formula: string): ChemistrySolution {
  const steps: ChemistrySolution['steps'] = []
  
  // Step 1: Parse formula
  const elements = parseFormula(formula)
  steps.push({
    step: 1,
    action: 'Parse chemical formula',
    equation: formula,
    explanation: `Identify elements: ${Object.entries(elements).map(([e, c]) => `${e}${c > 1 ? c : ''}`).join(', ')}`,
  })
  
  // Step 2: Look up atomic masses
  const masses: string[] = []
  let totalMass = 0
  
  for (const [element, count] of Object.entries(elements)) {
    if (!ELEMENTS[element]) {
      throw new Error(`Unknown element: ${element}`)
    }
    const atomicMass = ELEMENTS[element].atomicMass
    const mass = atomicMass * count
    totalMass += mass
    masses.push(`${element}: ${atomicMass} × ${count} = ${mass.toFixed(3)}`)
  }
  
  steps.push({
    step: 2,
    action: 'Calculate molar mass',
    calculation: masses.join('\n'),
    explanation: 'Multiply atomic mass by number of atoms for each element',
  })
  
  // Step 3: Sum total
  steps.push({
    step: 3,
    action: 'Sum total molar mass',
    calculation: `Total = ${totalMass.toFixed(3)} g/mol`,
    explanation: 'Add all individual masses',
  })
  
  return {
    steps,
    answer: `${totalMass.toFixed(3)} g/mol`,
    concept: 'Molar mass calculation',
  }
}

/**
 * Balance chemical equation (simplified)
 */
export function balanceEquation(equation: string): ChemistrySolution {
  const steps: ChemistrySolution['steps'] = []
  
  // Parse equation
  const [reactants, products] = equation.split('→').map(s => s.trim())
  
  steps.push({
    step: 1,
    action: 'Identify reactants and products',
    equation: `${reactants} → ${products}`,
    explanation: 'Separate the equation into reactants and products',
  })
  
  // This is a simplified implementation
  // Real balancing requires solving a system of linear equations
  
  steps.push({
    step: 2,
    action: 'Count atoms on each side',
    explanation: 'List the number of each type of atom on both sides',
  })
  
  steps.push({
    step: 3,
    action: 'Balance equation',
    explanation: 'Adjust coefficients to balance atoms (simplified)',
  })
  
  // TODO: Implement proper equation balancing algorithm
  
  return {
    steps,
    answer: 'Equation balancing algorithm not yet fully implemented',
    concept: 'Law of conservation of mass',
  }
}

/**
 * Calculate pH from H+ concentration
 */
export function calculatePH(hPlusConcentration: number): ChemistrySolution {
  const steps: ChemistrySolution['steps'] = []
  
  steps.push({
    step: 1,
    action: 'Given H⁺ concentration',
    calculation: `[H⁺] = ${hPlusConcentration} M`,
    explanation: 'Concentration of hydrogen ions',
  })
  
  const pH = -Math.log10(hPlusConcentration)
  
  steps.push({
    step: 2,
    action: 'Apply pH formula',
    equation: 'pH = -log₁₀[H⁺]',
    calculation: `pH = -log₁₀(${hPlusConcentration}) = ${pH.toFixed(2)}`,
    explanation: 'pH is the negative logarithm of H⁺ concentration',
  })
  
  // Determine if acidic, neutral, or basic
  let nature = ''
  if (pH < 7) nature = 'acidic'
  else if (pH === 7) nature = 'neutral'
  else nature = 'basic'
  
  steps.push({
    step: 3,
    action: 'Interpret pH value',
    calculation: `pH = ${pH.toFixed(2)} (${nature})`,
    explanation: `pH < 7: acidic, pH = 7: neutral, pH > 7: basic`,
  })
  
  return {
    steps,
    answer: `pH = ${pH.toFixed(2)} (${nature})`,
    concept: 'pH scale and acidity',
  }
}

/**
 * Calculate molarity
 */
export function calculateMolarity(params: {
  moles?: number
  mass?: number
  molarMass?: number
  volume: number // in liters
}): ChemistrySolution {
  const steps: ChemistrySolution['steps'] = []
  
  let moles = params.moles || 0
  
  // If mass is given, calculate moles
  if (params.mass && params.molarMass) {
    moles = params.mass / params.molarMass
    steps.push({
      step: 1,
      action: 'Calculate moles from mass',
      equation: 'n = mass / molar mass',
      calculation: `n = ${params.mass} / ${params.molarMass} = ${moles.toFixed(3)} mol`,
      explanation: 'Convert mass to moles using molar mass',
    })
  } else {
    steps.push({
      step: 1,
      action: 'Given moles',
      calculation: `n = ${moles} mol`,
      explanation: 'Number of moles of solute',
    })
  }
  
  const molarity = moles / params.volume
  
  steps.push({
    step: 2,
    action: 'Calculate molarity',
    equation: 'M = n / V',
    calculation: `M = ${moles.toFixed(3)} / ${params.volume} = ${molarity.toFixed(3)} M`,
    explanation: 'Molarity = moles / volume (in liters)',
  })
  
  return {
    steps,
    answer: `${molarity.toFixed(3)} M`,
    concept: 'Molarity (concentration)',
  }
}

/**
 * Stoichiometry calculations
 */
export function stoichiometry(params: {
  givenMoles: number
  givenCoefficient: number
  targetCoefficient: number
}): ChemistrySolution {
  const steps: ChemistrySolution['steps'] = []
  
  steps.push({
    step: 1,
    action: 'Identify given information',
    calculation: `Given: ${params.givenMoles} mol with coefficient ${params.givenCoefficient}`,
    explanation: 'Start with known quantity',
  })
  
  const targetMoles = (params.givenMoles * params.targetCoefficient) / params.givenCoefficient
  
  steps.push({
    step: 2,
    action: 'Apply mole ratio',
    equation: `n₂ = n₁ × (coefficient₂ / coefficient₁)`,
    calculation: `n₂ = ${params.givenMoles} × (${params.targetCoefficient} / ${params.givenCoefficient}) = ${targetMoles.toFixed(3)} mol`,
    explanation: 'Use coefficients from balanced equation as mole ratio',
  })
  
  return {
    steps,
    answer: `${targetMoles.toFixed(3)} mol`,
    concept: 'Stoichiometry and mole ratios',
  }
}

/**
 * Main chemistry solver
 */
export async function solveChemistry(
  problemType: string,
  params: any
): Promise<ChemistrySolution> {
  const type = problemType.toLowerCase()
  
  switch (type) {
    case 'molar_mass':
    case 'molarmass':
      return calculateMolarMass(params.formula)
    
    case 'balance':
    case 'balance_equation':
      return balanceEquation(params.equation)
    
    case 'ph':
      return calculatePH(params.hPlusConcentration)
    
    case 'molarity':
      return calculateMolarity(params)
    
    case 'stoichiometry':
      return stoichiometry(params)
    
    default:
      throw new Error(`Unknown chemistry problem type: ${problemType}`)
  }
}
