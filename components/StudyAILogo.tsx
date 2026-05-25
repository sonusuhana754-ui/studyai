import { View, StyleSheet } from 'react-native'
import { Text } from '@/components/ui/Text'
import { ACCENT } from '@/lib/theme'
import { APP_NAME } from '@/lib/constants'

type Props = { size?: 'sm' | 'md' | 'lg' }

/** Cyan star + StudyAI wordmark */
export function StudyAILogo({ size = 'md' }: Props) {
  const starSize = size === 'lg' ? 26 : size === 'sm' ? 18 : 22
  const nameSize = size === 'lg' ? 20 : size === 'sm' ? 16 : 18
  return (
    <View style={s.row}>
      <Text style={[s.star, { fontSize: starSize }]}>✦</Text>
      <Text style={[s.name, { fontSize: nameSize }]}>{APP_NAME}</Text>
    </View>
  )
}

const s = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  star: { color: ACCENT, fontWeight: '800' },
  name: { color: '#fff', fontWeight: '700', letterSpacing: -0.3 },
})
