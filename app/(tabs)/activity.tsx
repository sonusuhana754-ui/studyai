import { View, ScrollView, StyleSheet, Pressable } from 'react-native'
import { router } from 'expo-router'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { LinearGradient } from 'expo-linear-gradient'
import { Text as UIText } from '@/components/ui/Text'
import { Card } from '@/components/ui/Card'
import { ACCENT, BG, TEXT_SECONDARY } from '@/lib/theme'
import { TAB_BAR_CLEARANCE } from '@/components/TabBar'
import { LEARNING_FEATURES } from '@/lib/learningFeatures'
import { FeatureToolsGrid } from '@/components/FeatureToolsGrid'
import { TechBackground } from '@/components/TechBackground'
import { TechChipGraphic } from '@/components/TechChipGraphic'
import { SectionLabel } from '@/components/SectionLabel'

/** Study tab — hub for quiz, exam sim, and all practice tools */
export default function StudyHubScreen() {
  const insets = useSafeAreaInsets()

  const practice = LEARNING_FEATURES.filter((f) =>
    ['quiz', 'exam', 'flashcards', 'teach', 'planner'].includes(f.id)
  )

  return (
    <View style={s.root}>
      <TechBackground />
      <ScrollView
        contentContainerStyle={[
          s.content,
          { paddingTop: insets.top + 12, paddingBottom: TAB_BAR_CLEARANCE + 24 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <View style={s.titleRow}>
          <TechChipGraphic size={52} />
          <View style={s.titleText}>
            <UIText style={s.tag}>PRACTICE MODULE</UIText>
            <UIText style={s.title}>Study Center</UIText>
          </View>
        </View>
        <UIText style={s.sub}>Practice, test yourself, and build long-term memory</UIText>

        <LinearGradient
          colors={['rgba(249,115,22,0.2)', 'rgba(244,114,182,0.08)', 'rgba(5,8,16,0.5)']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={s.heroOuter}
        >
          <Card style={s.heroInner}>
            <UIText style={s.heroLabel}>Recommended</UIText>
            <UIText style={s.heroTitle}>Exam Simulator</UIText>
            <UIText style={s.heroSub}>Timed questions with pressure — like the real exam</UIText>
            <Pressable onPress={() => router.push('/exam-sim')} style={s.heroBtn}>
              <LinearGradient
                colors={['#fb923c', '#f97316']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={s.heroBtnGrad}
              >
                <UIText style={s.heroBtnText}>Start exam mode →</UIText>
              </LinearGradient>
            </Pressable>
          </Card>
        </LinearGradient>

        <SectionLabel>Quick practice</SectionLabel>
        <View style={s.grid}>
          {practice.map((f) => (
            <Pressable
              key={f.id}
              onPress={() => router.push(f.route as any)}
              style={({ pressed }) => [
                s.cell,
                { borderColor: `${f.color}44` },
                pressed && { opacity: 0.9, transform: [{ scale: 0.98 }] },
              ]}
            >
              <View style={[s.cellDot, { backgroundColor: f.color }]} />
              <UIText style={s.cellEmoji}>{f.emoji}</UIText>
              <UIText style={[s.cellTitle, { color: f.color }]}>{f.title}</UIText>
            </Pressable>
          ))}
        </View>

        <SectionLabel>All tools</SectionLabel>
        <FeatureToolsGrid />
      </ScrollView>
    </View>
  )
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: BG },
  content: { paddingHorizontal: 20, gap: 12 },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 14, marginTop: 4 },
  titleText: { flex: 1, gap: 2 },
  tag: {
    fontSize: 10,
    fontWeight: '800',
    color: ACCENT,
    letterSpacing: 2,
    fontFamily: 'monospace',
  },
  title: { fontSize: 28, fontWeight: '900', color: '#fff', letterSpacing: -0.5 },
  sub: { fontSize: 14, color: TEXT_SECONDARY, marginBottom: 4 },
  heroOuter: {
    borderRadius: 18,
    padding: 1,
    borderWidth: 1,
    borderColor: 'rgba(249,115,22,0.35)',
  },
  heroInner: {
    padding: 18,
    gap: 8,
    backgroundColor: 'transparent',
    borderWidth: 0,
  },
  heroLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: '#fb923c',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  heroTitle: { fontSize: 20, fontWeight: '800', color: '#fff' },
  heroSub: { fontSize: 14, color: TEXT_SECONDARY },
  heroBtn: { marginTop: 8, alignSelf: 'flex-start', borderRadius: 10, overflow: 'hidden' },
  heroBtnGrad: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 10 },
  heroBtnText: { fontSize: 14, fontWeight: '800', color: '#1a0a00' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  cell: {
    width: '48%',
    padding: 14,
    borderRadius: 14,
    backgroundColor: 'rgba(10,18,40,0.8)',
    borderWidth: 1,
    gap: 6,
    overflow: 'hidden',
  },
  cellDot: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  cellEmoji: { fontSize: 24 },
  cellTitle: { fontSize: 14, fontWeight: '700' },
})
