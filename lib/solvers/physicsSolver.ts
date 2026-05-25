/**
 * Physics Solver
 * 
 * Specialized solver for physics problems with unit handling
 */

export interface PhysicsSolution {
  steps: Array<{
    step: number
    action: string
    formula: string
    calculation: string
    explanation: string
  }>
  answer: string
  units: string
  concept: string
}

// Physics constants
export const CONSTANTS = {
  g: { value: 9.8, unit: 'm/s²', name: 'Gravitational acceleration' },
  G: { value: 6.674e-11, unit: 'N⋅m²/kg²', name: 'Gravitational constant' },
  c: { value: 3e8, unit: 'm/s', name: 'Speed of light' },
  h: { value: 6.626e-34, unit: 'J⋅s', name: 'Planck constant' },
  k: { value: 1.381e-23, unit: 'J/K', name: 'Boltzmann constant' },
  e: { value: 1.602e-19, unit: 'C', name: 'Elementary charge' },
  ε0: { value: 8.854e-12, unit: 'F/m', name: 'Permittivity of free space' },
  μ0: { value: 1.257e-6, unit: 'H/m', name: 'Permeability of free space' },
}

/**
 * Solve kinematics problem
 */
export function solveKinematics(params: {
  type: 'velocity' | 'acceleration' | 'displacement' | 'time'
  given: Record<string, number>
}): PhysicsSolution {
  const { type, given } = params
  const steps: PhysicsSolution['steps'] = []
  
  // Step 1: Identify given values
  steps.push({
    step: 1,
    action: 'Identify given values',
    formula: '',
    calculation: Object.entries(given).map(([k, v]) => `${k} = ${v}`).join(', '),
    explanation: 'List all known quantities',
  })
  
  let answer = ''
  let units = ''
  let concept = ''
  
  switch (type) {
    case 'velocity':
      // v = u + at or v = s/t
      if ('u' in given && 'a' in given && 't' in given) {
        const v = given.u + given.a * given.t
        steps.push({
          step: 2,
          action: 'Apply first equation of motion',
          formula: 'v = u + at',
          calculation: `v = ${given.u} + ${given.a} × ${given.t} = ${v}`,
          explanation: 'Final velocity = initial velocity + acceleration × time',
        })
        answer = v.toFixed(2)
        units = 'm/s'
        concept = 'First equation of motion'
      } else if ('s' in given && 't' in given) {
        const v = given.s / given.t
        steps.push({
          step: 2,
          action: 'Calculate average velocity',
          formula: 'v = s/t',
          calculation: `v = ${given.s} / ${given.t} = ${v}`,
          explanation: 'Velocity = displacement / time',
        })
        answer = v.toFixed(2)
        units = 'm/s'
        concept = 'Average velocity'
      }
      break
    
    case 'acceleration':
      // a = (v - u) / t
      if ('v' in given && 'u' in given && 't' in given) {
        const a = (given.v - given.u) / given.t
        steps.push({
          step: 2,
          action: 'Calculate acceleration',
          formula: 'a = (v - u) / t',
          calculation: `a = (${given.v} - ${given.u}) / ${given.t} = ${a}`,
          explanation: 'Acceleration = change in velocity / time',
        })
        answer = a.toFixed(2)
        units = 'm/s²'
        concept = 'Uniform acceleration'
      }
      break
    
    case 'displacement':
      // s = ut + (1/2)at²
      if ('u' in given && 't' in given && 'a' in given) {
        const s = given.u * given.t + 0.5 * given.a * given.t * given.t
        steps.push({
          step: 2,
          action: 'Apply second equation of motion',
          formula: 's = ut + ½at²',
          calculation: `s = ${given.u} × ${given.t} + ½ × ${given.a} × ${given.t}² = ${s}`,
          explanation: 'Displacement with constant acceleration',
        })
        answer = s.toFixed(2)
        units = 'm'
        concept = 'Second equation of motion'
      }
      break
    
    case 'time':
      // t = (v - u) / a
      if ('v' in given && 'u' in given && 'a' in given) {
        const t = (given.v - given.u) / given.a
        steps.push({
          step: 2,
          action: 'Calculate time',
          formula: 't = (v - u) / a',
          calculation: `t = (${given.v} - ${given.u}) / ${given.a} = ${t}`,
          explanation: 'Time = change in velocity / acceleration',
        })
        answer = t.toFixed(2)
        units = 's'
        concept = 'Time calculation'
      }
      break
  }
  
  return {
    steps,
    answer,
    units,
    concept,
  }
}

/**
 * Solve force problems (Newton's laws)
 */
export function solveForce(params: {
  type: 'force' | 'mass' | 'acceleration'
  given: Record<string, number>
}): PhysicsSolution {
  const { type, given } = params
  const steps: PhysicsSolution['steps'] = []
  
  steps.push({
    step: 1,
    action: 'Identify given values',
    formula: '',
    calculation: Object.entries(given).map(([k, v]) => `${k} = ${v}`).join(', '),
    explanation: 'List all known quantities',
  })
  
  let answer = ''
  let units = ''
  
  switch (type) {
    case 'force':
      // F = ma
      if ('m' in given && 'a' in given) {
        const F = given.m * given.a
        steps.push({
          step: 2,
          action: 'Apply Newton\'s second law',
          formula: 'F = ma',
          calculation: `F = ${given.m} × ${given.a} = ${F}`,
          explanation: 'Force = mass × acceleration',
        })
        answer = F.toFixed(2)
        units = 'N'
      }
      break
    
    case 'mass':
      // m = F/a
      if ('F' in given && 'a' in given) {
        const m = given.F / given.a
        steps.push({
          step: 2,
          action: 'Calculate mass',
          formula: 'm = F/a',
          calculation: `m = ${given.F} / ${given.a} = ${m}`,
          explanation: 'Mass = force / acceleration',
        })
        answer = m.toFixed(2)
        units = 'kg'
      }
      break
    
    case 'acceleration':
      // a = F/m
      if ('F' in given && 'm' in given) {
        const a = given.F / given.m
        steps.push({
          step: 2,
          action: 'Calculate acceleration',
          formula: 'a = F/m',
          calculation: `a = ${given.F} / ${given.m} = ${a}`,
          explanation: 'Acceleration = force / mass',
        })
        answer = a.toFixed(2)
        units = 'm/s²'
      }
      break
  }
  
  return {
    steps,
    answer,
    units,
    concept: 'Newton\'s second law of motion',
  }
}

/**
 * Solve energy problems
 */
export function solveEnergy(params: {
  type: 'kinetic' | 'potential' | 'work' | 'power'
  given: Record<string, number>
}): PhysicsSolution {
  const { type, given } = params
  const steps: PhysicsSolution['steps'] = []
  
  steps.push({
    step: 1,
    action: 'Identify given values',
    formula: '',
    calculation: Object.entries(given).map(([k, v]) => `${k} = ${v}`).join(', '),
    explanation: 'List all known quantities',
  })
  
  let answer = ''
  let units = ''
  let concept = ''
  
  switch (type) {
    case 'kinetic':
      // KE = (1/2)mv²
      if ('m' in given && 'v' in given) {
        const KE = 0.5 * given.m * given.v * given.v
        steps.push({
          step: 2,
          action: 'Calculate kinetic energy',
          formula: 'KE = ½mv²',
          calculation: `KE = ½ × ${given.m} × ${given.v}² = ${KE}`,
          explanation: 'Kinetic energy = half × mass × velocity squared',
        })
        answer = KE.toFixed(2)
        units = 'J'
        concept = 'Kinetic energy'
      }
      break
    
    case 'potential':
      // PE = mgh
      if ('m' in given && 'h' in given) {
        const g = given.g || CONSTANTS.g.value
        const PE = given.m * g * given.h
        steps.push({
          step: 2,
          action: 'Calculate potential energy',
          formula: 'PE = mgh',
          calculation: `PE = ${given.m} × ${g} × ${given.h} = ${PE}`,
          explanation: 'Potential energy = mass × gravity × height',
        })
        answer = PE.toFixed(2)
        units = 'J'
        concept = 'Gravitational potential energy'
      }
      break
    
    case 'work':
      // W = Fd
      if ('F' in given && 'd' in given) {
        const W = given.F * given.d
        steps.push({
          step: 2,
          action: 'Calculate work done',
          formula: 'W = Fd',
          calculation: `W = ${given.F} × ${given.d} = ${W}`,
          explanation: 'Work = force × displacement',
        })
        answer = W.toFixed(2)
        units = 'J'
        concept = 'Work done'
      }
      break
    
    case 'power':
      // P = W/t
      if ('W' in given && 't' in given) {
        const P = given.W / given.t
        steps.push({
          step: 2,
          action: 'Calculate power',
          formula: 'P = W/t',
          calculation: `P = ${given.W} / ${given.t} = ${P}`,
          explanation: 'Power = work / time',
        })
        answer = P.toFixed(2)
        units = 'W'
        concept = 'Power'
      }
      break
  }
  
  return {
    steps,
    answer,
    units,
    concept,
  }
}

/**
 * Solve electricity problems
 */
export function solveElectricity(params: {
  type: 'voltage' | 'current' | 'resistance' | 'power'
  given: Record<string, number>
}): PhysicsSolution {
  const { type, given } = params
  const steps: PhysicsSolution['steps'] = []
  
  steps.push({
    step: 1,
    action: 'Identify given values',
    formula: '',
    calculation: Object.entries(given).map(([k, v]) => `${k} = ${v}`).join(', '),
    explanation: 'List all known quantities',
  })
  
  let answer = ''
  let units = ''
  
  switch (type) {
    case 'voltage':
      // V = IR
      if ('I' in given && 'R' in given) {
        const V = given.I * given.R
        steps.push({
          step: 2,
          action: 'Apply Ohm\'s law',
          formula: 'V = IR',
          calculation: `V = ${given.I} × ${given.R} = ${V}`,
          explanation: 'Voltage = current × resistance',
        })
        answer = V.toFixed(2)
        units = 'V'
      }
      break
    
    case 'current':
      // I = V/R
      if ('V' in given && 'R' in given) {
        const I = given.V / given.R
        steps.push({
          step: 2,
          action: 'Calculate current',
          formula: 'I = V/R',
          calculation: `I = ${given.V} / ${given.R} = ${I}`,
          explanation: 'Current = voltage / resistance',
        })
        answer = I.toFixed(2)
        units = 'A'
      }
      break
    
    case 'resistance':
      // R = V/I
      if ('V' in given && 'I' in given) {
        const R = given.V / given.I
        steps.push({
          step: 2,
          action: 'Calculate resistance',
          formula: 'R = V/I',
          calculation: `R = ${given.V} / ${given.I} = ${R}`,
          explanation: 'Resistance = voltage / current',
        })
        answer = R.toFixed(2)
        units = 'Ω'
      }
      break
    
    case 'power':
      // P = VI or P = I²R or P = V²/R
      if ('V' in given && 'I' in given) {
        const P = given.V * given.I
        steps.push({
          step: 2,
          action: 'Calculate power',
          formula: 'P = VI',
          calculation: `P = ${given.V} × ${given.I} = ${P}`,
          explanation: 'Power = voltage × current',
        })
        answer = P.toFixed(2)
        units = 'W'
      } else if ('I' in given && 'R' in given) {
        const P = given.I * given.I * given.R
        steps.push({
          step: 2,
          action: 'Calculate power',
          formula: 'P = I²R',
          calculation: `P = ${given.I}² × ${given.R} = ${P}`,
          explanation: 'Power = current squared × resistance',
        })
        answer = P.toFixed(2)
        units = 'W'
      }
      break
  }
  
  return {
    steps,
    answer,
    units,
    concept: 'Ohm\'s law and electrical power',
  }
}

/**
 * Main physics solver - routes to appropriate method
 */
export async function solvePhysics(
  problemType: string,
  given: Record<string, number>
): Promise<PhysicsSolution> {
  const type = problemType.toLowerCase()
  
  // Kinematics
  if (['velocity', 'speed', 'acceleration', 'displacement', 'distance', 'time'].includes(type)) {
    return solveKinematics({ type: type as any, given })
  }
  
  // Forces
  if (['force', 'mass', 'weight'].includes(type)) {
    return solveForce({ type: type as any, given })
  }
  
  // Energy
  if (['kinetic', 'potential', 'work', 'power', 'energy'].includes(type)) {
    return solveEnergy({ type: type as any, given })
  }
  
  // Electricity
  if (['voltage', 'current', 'resistance', 'ohm'].includes(type)) {
    return solveElectricity({ type: type as any, given })
  }
  
  throw new Error(`Unknown physics problem type: ${problemType}`)
}
