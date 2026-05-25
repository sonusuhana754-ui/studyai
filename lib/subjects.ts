/**
 * Academic streams and subjects — single source for pickers across the app.
 */

export type AcademicStreamId =
  | 'science'
  | 'engineering'
  | 'commerce'
  | 'arts'
  | 'medical'
  | 'law'
  | 'general'

export interface SubjectItem {
  /** Stable id for storage / AI slug hints */
  id: string
  label: string
  color: string
}

export interface AcademicStream {
  id: AcademicStreamId
  label: string
  emoji: string
  subjects: SubjectItem[]
}

const c = {
  math: '#3b82f6',
  physics: '#8b5cf6',
  chem: '#10b981',
  bio: '#22c55e',
  cs: '#06b6d4',
  hist: '#f59e0b',
  geo: '#84cc16',
  econ: '#14b8a6',
  bus: '#f97316',
  eng: '#6366f1',
  acc: '#eab308',
  lit: '#ec4899',
  other: '#94a3b8',
}

function sub(id: string, label: string, color: string): SubjectItem {
  return { id, label, color }
}

export const ACADEMIC_STREAMS: AcademicStream[] = [
  {
    id: 'science',
    label: 'Science',
    emoji: '🔬',
    subjects: [
      sub('mathematics', 'Mathematics', c.math),
      sub('physics', 'Physics', c.physics),
      sub('chemistry', 'Chemistry', c.chem),
      sub('biology', 'Biology', c.bio),
      sub('botany', 'Botany', c.bio),
      sub('zoology', 'Zoology', c.bio),
      sub('computer_science', 'Computer Science', c.cs),
      sub('environmental_science', 'Environmental Science', c.bio),
      sub('statistics', 'Statistics', c.math),
    ],
  },
  {
    id: 'engineering',
    label: 'Engineering',
    emoji: '⚙️',
    subjects: [
      sub('engineering_mathematics', 'Engineering Mathematics', c.math),
      sub('engineering_physics', 'Engineering Physics', c.physics),
      sub('engineering_chemistry', 'Engineering Chemistry', c.chem),
      sub('electrical_engineering', 'Electrical Engineering', c.eng),
      sub('electronics', 'Electronics & Communication', c.eng),
      sub('mechanical_engineering', 'Mechanical Engineering', c.eng),
      sub('civil_engineering', 'Civil Engineering', c.eng),
      sub('cse', 'Computer Science & Engineering', c.cs),
      sub('information_technology', 'Information Technology', c.cs),
      sub('chemical_engineering', 'Chemical Engineering', c.chem),
      sub('biotechnology', 'Biotechnology', c.bio),
      sub('aerospace_engineering', 'Aerospace Engineering', c.eng),
      sub('data_structures', 'Data Structures & Algorithms', c.cs),
      sub('engineering_drawing', 'Engineering Drawing', c.eng),
      sub('thermodynamics', 'Thermodynamics', c.physics),
      sub('fluid_mechanics', 'Fluid Mechanics', c.physics),
      sub('strength_of_materials', 'Strength of Materials', c.eng),
      sub('control_systems', 'Control Systems', c.eng),
      sub('digital_electronics', 'Digital Electronics', c.eng),
      sub('signals_systems', 'Signals & Systems', c.eng),
      sub('machine_design', 'Machine Design', c.eng),
      sub('power_systems', 'Power Systems', c.eng),
    ],
  },
  {
    id: 'commerce',
    label: 'Commerce',
    emoji: '📊',
    subjects: [
      sub('accountancy', 'Accountancy', c.acc),
      sub('business_studies', 'Business Studies', c.bus),
      sub('economics', 'Economics', c.econ),
      sub('statistics', 'Statistics', c.math),
      sub('commercial_mathematics', 'Commercial Mathematics', c.math),
      sub('entrepreneurship', 'Entrepreneurship', c.bus),
      sub('business_law', 'Business Law', c.bus),
      sub('finance_banking', 'Finance & Banking', c.econ),
      sub('marketing', 'Marketing', c.bus),
      sub('cost_accounting', 'Cost Accounting', c.acc),
      sub('income_tax', 'Income Tax', c.acc),
      sub('gst', 'GST & Indirect Tax', c.acc),
      sub('corporate_accounting', 'Corporate Accounting', c.acc),
      sub('financial_management', 'Financial Management', c.econ),
      sub('auditing', 'Auditing', c.acc),
      sub('company_law', 'Company Law', c.bus),
      sub('insurance', 'Insurance', c.econ),
      sub('stock_market', 'Stock Market & Investments', c.econ),
    ],
  },
  {
    id: 'arts',
    label: 'Arts & Humanities',
    emoji: '📚',
    subjects: [
      sub('history', 'History', c.hist),
      sub('geography', 'Geography', c.geo),
      sub('political_science', 'Political Science', c.hist),
      sub('sociology', 'Sociology', c.hist),
      sub('psychology', 'Psychology', c.lit),
      sub('philosophy', 'Philosophy', c.lit),
      sub('english', 'English', c.lit),
      sub('hindi', 'Hindi', c.lit),
      sub('literature', 'Literature', c.lit),
      sub('economics', 'Economics', c.econ),
      sub('home_science', 'Home Science', c.other),
      sub('fine_arts', 'Fine Arts', c.lit),
      sub('physical_education', 'Physical Education', c.other),
      sub('mass_communication', 'Mass Communication', c.lit),
    ],
  },
  {
    id: 'medical',
    label: 'Medical / NEET',
    emoji: '🩺',
    subjects: [
      sub('physics', 'Physics', c.physics),
      sub('chemistry', 'Chemistry', c.chem),
      sub('biology', 'Biology', c.bio),
      sub('botany', 'Botany', c.bio),
      sub('zoology', 'Zoology', c.bio),
      sub('anatomy', 'Anatomy', c.bio),
      sub('physiology', 'Physiology', c.bio),
      sub('biochemistry', 'Biochemistry', c.chem),
      sub('microbiology', 'Microbiology', c.bio),
      sub('genetics', 'Genetics', c.bio),
      sub('pharmacology', 'Pharmacology', c.chem),
      sub('pathology', 'Pathology', c.bio),
      sub('community_medicine', 'Community Medicine', c.bio),
    ],
  },
  {
    id: 'law',
    label: 'Law',
    emoji: '⚖️',
    subjects: [
      sub('constitutional_law', 'Constitutional Law', c.hist),
      sub('criminal_law', 'Criminal Law', c.hist),
      sub('contract_law', 'Contract Law', c.bus),
      sub('tort_law', 'Tort Law', c.bus),
      sub('family_law', 'Family Law', c.hist),
      sub('property_law', 'Property Law', c.bus),
      sub('corporate_law', 'Corporate Law', c.bus),
      sub('international_law', 'International Law', c.hist),
      sub('legal_reasoning', 'Legal Reasoning', c.other),
    ],
  },
  {
    id: 'general',
    label: 'General',
    emoji: '🎓',
    subjects: [
      sub('general_knowledge', 'General Knowledge', c.other),
      sub('reasoning', 'Logical Reasoning', c.math),
      sub('quantitative_aptitude', 'Quantitative Aptitude', c.math),
      sub('verbal_ability', 'Verbal Ability', c.lit),
      sub('current_affairs', 'Current Affairs', c.hist),
      sub('computer_awareness', 'Computer Awareness', c.cs),
      sub('english_grammar', 'English Grammar', c.lit),
    ],
  },
]

/** Flat list — unique by label (first occurrence wins) */
export const ALL_SUBJECTS: SubjectItem[] = (() => {
  const seen = new Set<string>()
  const out: SubjectItem[] = []
  for (const stream of ACADEMIC_STREAMS) {
    for (const s of stream.subjects) {
      if (seen.has(s.label)) continue
      seen.add(s.label)
      out.push(s)
    }
  }
  return out.sort((a, b) => a.label.localeCompare(b.label))
})()

export const ALL_SUBJECT_LABELS = ALL_SUBJECTS.map((s) => s.label)

export const DEFAULT_STREAM_ID: AcademicStreamId = 'science'

export function getStream(id: AcademicStreamId): AcademicStream {
  return ACADEMIC_STREAMS.find((s) => s.id === id) ?? ACADEMIC_STREAMS[0]
}

export function getSubjectByLabel(label: string): SubjectItem | undefined {
  return ALL_SUBJECTS.find((s) => s.label === label)
}

export function getSubjectColor(label: string): string {
  return getSubjectByLabel(label)?.color ?? c.other
}

/** Map display label → AI solution subject slug */
export function labelToAiSubjectSlug(label: string): string {
  const item = getSubjectByLabel(label)
  if (!item) return 'other'
  const id = item.id
  if (id.includes('math') || id === 'statistics' || id === 'quantitative_aptitude') return 'math'
  if (id.includes('physics') || id === 'thermodynamics' || id === 'fluid_mechanics') return 'physics'
  if (id.includes('chem') || id === 'biochemistry') return 'chemistry'
  if (id.includes('bio') || id.includes('botany') || id.includes('zoology') || id.includes('anatomy')) return 'biology'
  if (id === 'history' || id.includes('political') || id.includes('geography')) return id === 'geography' ? 'geography' : 'history'
  if (id.includes('econ') || id.includes('finance') || id.includes('account') || id.includes('commerce')) return 'economics'
  if (id.includes('english') || id.includes('literature') || id.includes('hindi') || id === 'verbal_ability') return 'literature'
  if (id.includes('computer') || id.includes('cse') || id === 'data_structures') return 'other'
  return 'other'
}

export const AI_SUBJECT_SLUGS = [
  'math', 'physics', 'chemistry', 'biology', 'history',
  'geography', 'economics', 'literature', 'other',
] as const
