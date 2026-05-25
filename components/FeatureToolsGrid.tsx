import { View, ScrollView, StyleSheet, Pressable, Dimensions } from 'react-native'
import { router } from 'expo-router'
import { Text } from '@/components/ui/Text'
import { LEARNING_FEATURES } from '@/lib/learningFeatures'
import { BORDER } from '@/lib/theme'

const { width: SW } = Dimensions.get('window')
const CELL_W = (SW - 40 - 10) / 2

type Props = {
  onPress?: () => void
}

export function FeatureToolsGrid({ onPress }: Props) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={st.row}
    >
      {LEARNING_FEATURES.map((f) => (
        <Pressable
          key={f.id}
          onPress={() => {
            onPress?.()
            router.push(f.route as any)
          }}
          style={({ pressed }) => [
            st.cell,
            { borderColor: `${f.color}40` },
            pressed && st.cellPressed,
          ]}
        >
          <View style={[st.dot, { backgroundColor: f.color }]} />
          <Text style={st.emoji}>{f.emoji}</Text>
          <Text style={[st.title, { color: f.color }]}>{f.title}</Text>
          <Text style={st.sub} numberOfLines={2}>
            {f.subtitle}
          </Text>
        </Pressable>
      ))}
    </ScrollView>
  )
}

const st = StyleSheet.create({
  row: { gap: 10, paddingVertical: 4 },
  cell: {
    width: CELL_W,
    minHeight: 108,
    padding: 14,
    borderRadius: 14,
    backgroundColor: 'rgba(10,18,40,0.85)',
    borderWidth: 1,
    borderColor: BORDER,
    overflow: 'hidden',
  },
  dot: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  cellPressed: { opacity: 0.88, transform: [{ scale: 0.98 }] },
  emoji: { fontSize: 26, marginBottom: 6 },
  title: { fontSize: 14, fontWeight: '700', marginBottom: 4 },
  sub: { fontSize: 11, color: 'rgba(255,255,255,0.55)', lineHeight: 15 },
})
