import { View, StyleSheet } from 'react-native'
import { Text } from '@/components/ui/Text'
import { ACCENT, TEXT_TERTIARY } from '@/lib/theme'

type Props = { children: string; style?: object }

/** Cyber-style section header with accent bar */
export function SectionLabel({ children, style }: Props) {
  return (
    <View style={[s.row, style]}>
      <View style={s.bar} />
      <Text style={s.text}>{children}</Text>
      <View style={s.dots}>
        <View style={[s.dot, { opacity: 1 }]} />
        <View style={[s.dot, { opacity: 0.5 }]} />
        <View style={[s.dot, { opacity: 0.25 }]} />
      </View>
    </View>
  )
}

const s = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 4,
  },
  bar: {
    width: 3,
    height: 14,
    borderRadius: 2,
    backgroundColor: ACCENT,
    shadowColor: ACCENT,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 6,
  },
  text: {
    flex: 1,
    fontSize: 11,
    fontWeight: '800',
    color: TEXT_TERTIARY,
    letterSpacing: 1.4,
    textTransform: 'uppercase',
    fontFamily: 'monospace',
  },
  dots: { flexDirection: 'row', gap: 4 },
  dot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: ACCENT,
  },
})
