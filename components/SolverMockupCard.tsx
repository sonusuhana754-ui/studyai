import { View, StyleSheet } from 'react-native'
import { Text } from '@/components/ui/Text'
import { ACCENT, ACCENT_DIM, BORDER } from '@/lib/theme'

const STEPS = [
  { n: '1', text: 'Factor: (2x - 1)(x + 3) = 0' },
  { n: '2', text: 'Set each factor to zero' },
  { n: '3', text: 'Solutions: x = ½ or x = -3' },
]

type Props = {
  compact?: boolean
}

/** Browser-window math solver preview — landing hero graphic */
export function SolverMockupCard({ compact }: Props) {
  return (
    <View style={[s.card, compact && s.cardCompact]}>
      <View style={s.chrome}>
        <View style={[s.dot, { backgroundColor: '#ff5f57' }]} />
        <View style={[s.dot, { backgroundColor: '#febc2e' }]} />
        <View style={[s.dot, { backgroundColor: '#28c840' }]} />
      </View>
      <View style={[s.body, compact && s.bodyCompact]}>
        <Text style={[s.problem, compact && s.problemCompact]}>
          Solve: 2x² + 5x - 3 = 0
        </Text>
        {STEPS.map((step) => (
          <View key={step.n} style={s.step}>
            <View style={[s.stepNum, compact && s.stepNumCompact]}>
              <Text style={s.stepNumText}>{step.n}</Text>
            </View>
            <Text style={[s.stepText, compact && s.stepTextCompact]}>{step.text}</Text>
          </View>
        ))}
      </View>
    </View>
  )
}

const s = StyleSheet.create({
  card: {
    width: '100%',
    maxWidth: 420,
    backgroundColor: 'rgba(18,24,42,0.92)',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: BORDER,
    overflow: 'hidden',
    shadowColor: ACCENT,
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.15,
    shadowRadius: 24,
    elevation: 8,
  },
  cardCompact: {
    maxWidth: '100%',
    borderRadius: 16,
  },
  chrome: {
    flexDirection: 'row',
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.06)',
  },
  dot: { width: 10, height: 10, borderRadius: 5 },
  body: { padding: 20, gap: 16 },
  bodyCompact: { padding: 14, gap: 12 },
  problem: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '700',
    letterSpacing: -0.3,
  },
  problemCompact: { fontSize: 16 },
  step: { flexDirection: 'row', gap: 12, alignItems: 'flex-start' },
  stepNum: {
    width: 26,
    height: 26,
    borderRadius: 8,
    backgroundColor: ACCENT_DIM,
    borderWidth: 1,
    borderColor: 'rgba(34,211,238,0.35)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepNumCompact: { width: 22, height: 22, borderRadius: 6 },
  stepNumText: {
    color: ACCENT,
    fontSize: 12,
    fontWeight: '800',
  },
  stepText: {
    color: 'rgba(255,255,255,0.72)',
    fontSize: 15,
    lineHeight: 22,
    flex: 1,
  },
  stepTextCompact: { fontSize: 13, lineHeight: 18 },
})
