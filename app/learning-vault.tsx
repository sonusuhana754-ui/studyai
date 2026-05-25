import { useEffect, useState } from 'react'
import { View, ScrollView, StyleSheet, Pressable } from 'react-native'
import { router } from 'expo-router'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import { Text as UIText } from '@/components/ui/Text'
import { Card } from '@/components/ui/Card'
import { ACCENT, BG, TEXT_SECONDARY } from '@/lib/theme'
import { getRecentEvents, getErrorPatterns, LearningEvent, ErrorPattern } from '@/lib/learningMemory'
import { getHistory, HistoryItem } from '@/lib/history'

export default function LearningVaultScreen() {
  const insets = useSafeAreaInsets()
  const [events, setEvents] = useState<LearningEvent[]>([])
  const [patterns, setPatterns] = useState<ErrorPattern[]>([])
  const [history, setHistory] = useState<HistoryItem[]>([])

  useEffect(() => {
    Promise.all([getRecentEvents(30), getErrorPatterns(), getHistory()]).then(
      ([e, p, h]) => {
        setEvents(e)
        setPatterns(p)
        setHistory(h.slice(0, 15))
      }
    )
  }, [])

  return (
    <View style={[s.root, { paddingTop: insets.top }]}>
      <View style={s.header}>
        <Pressable onPress={() => router.back()} style={s.back}>
          <Ionicons name="arrow-back" size={22} color="#fff" />
        </Pressable>
        <UIText style={s.title}>Learning Vault</UIText>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView contentContainerStyle={s.content}>
        {patterns.length > 0 && (
          <>
            <UIText style={s.section}>Error patterns</UIText>
            {patterns.map((p, i) => (
              <Card key={i} style={s.patternCard}>
                <UIText style={s.patternTopic}>{p.topic}</UIText>
                <UIText style={s.patternText}>{p.pattern}</UIText>
              </Card>
            ))}
          </>
        )}

        <UIText style={s.section}>Recent activity</UIText>
        {events.length === 0 && history.length === 0 ? (
          <UIText style={s.empty}>Your vault fills as you study.</UIText>
        ) : (
          events.map((e) => (
            <View key={e.id} style={s.eventRow}>
              <UIText style={s.eventType}>{e.type.replace(/_/g, ' ')}</UIText>
              <UIText style={s.eventTopic}>{e.topic}</UIText>
              <UIText style={s.eventDate}>{new Date(e.createdAt).toLocaleString()}</UIText>
            </View>
          ))
        )}

        {history.length > 0 && (
          <>
            <UIText style={[s.section, { marginTop: 16 }]}>Saved sessions</UIText>
            {history.map((h) => (
              <Card key={h.id} style={s.histCard}>
                <UIText style={s.histType}>{h.type}</UIText>
                <UIText style={s.histTopic}>{h.topic}</UIText>
              </Card>
            ))}
          </>
        )}
      </ScrollView>
    </View>
  )
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: BG },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  back: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#1a1a1a',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: { flex: 1, textAlign: 'center', fontSize: 18, fontWeight: '700', color: '#fff' },
  content: { padding: 20, paddingBottom: 40 },
  section: {
    fontSize: 12,
    fontWeight: '700',
    color: TEXT_SECONDARY,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 10,
  },
  patternCard: { marginBottom: 8, padding: 12, gap: 4 },
  patternTopic: { fontSize: 15, fontWeight: '700', color: ACCENT },
  patternText: { fontSize: 13, color: '#fff' },
  eventRow: {
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#222',
    gap: 2,
  },
  eventType: { fontSize: 11, color: TEXT_SECONDARY, textTransform: 'capitalize' },
  eventTopic: { fontSize: 14, color: '#fff', fontWeight: '600' },
  eventDate: { fontSize: 11, color: '#666' },
  empty: { color: TEXT_SECONDARY },
  histCard: { marginBottom: 8, padding: 12, gap: 2 },
  histType: { fontSize: 11, color: TEXT_SECONDARY },
  histTopic: { fontSize: 14, color: '#fff', fontWeight: '600' },
})
