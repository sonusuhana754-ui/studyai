import { useState, useEffect } from 'react'
import {
  View,
  ScrollView,
  StyleSheet,
  Pressable,
  TextInput,
  Alert,
} from 'react-native'
import { router, useLocalSearchParams } from 'expo-router'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { LinearGradient } from 'expo-linear-gradient'
import { Ionicons } from '@expo/vector-icons'
import { Text as UIText } from '@/components/ui/Text'
import { ACCENT, BG, TEXT_SECONDARY } from '@/lib/theme'
import { getHistory, HistoryItem } from '@/lib/history'
import { SubjectPicker } from '@/components/SubjectPicker'

const EXAMPLES = [
  'Quadratic Equations',
  'Photosynthesis',
  'Newton\'s Laws',
  'The French Revolution',
]

export default function FlashcardsTopicScreen() {
  const insets = useSafeAreaInsets()
  const params = useLocalSearchParams<{ topic?: string }>()
  const [topic, setTopic] = useState(params.topic ?? '')
  const [subject, setSubject] = useState('Mathematics')
  const [difficulty, setDifficulty] = useState<'easy' | 'medium' | 'hard'>('medium')
  const [history, setHistory] = useState<HistoryItem[]>([])
  const [selectedHistory, setSelectedHistory] = useState<HistoryItem | null>(null)

  useEffect(() => {
    getHistory().then((items) => {
      setHistory(items.filter((h) => h.type === 'scan' || h.type === 'video_explainer'))
    })
  }, [])

  const start = () => {
    const finalTopic = selectedHistory?.topic ?? topic.trim()
    if (!finalTopic) {
      Alert.alert('Enter a topic', 'Type a topic or pick one from your history.')
      return
    }
    router.push({
      pathname: '/flashcards',
      params: {
        topic: finalTopic,
        subject: selectedHistory?.subject ?? subject,
        difficulty,
      },
    })
  }

  return (
    <View style={[s.root, { paddingTop: insets.top }]}>
      <View style={s.header}>
        <Pressable onPress={() => router.back()} hitSlop={8} style={s.backBtn}>
          <Ionicons name="arrow-back" size={22} color="#fff" />
        </Pressable>
        <UIText style={s.headerTitle}>Flashcards</UIText>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={s.content}
        showsVerticalScrollIndicator={false}
      >
        <UIText style={s.label}>Topic</UIText>
        <TextInput
          style={s.input}
          placeholder="e.g. Quadratic Equations"
          placeholderTextColor="#555"
          value={topic}
          onChangeText={(t) => {
            setTopic(t)
            setSelectedHistory(null)
          }}
        />

        <UIText style={s.label}>Subject</UIText>
        <SubjectPicker value={subject} onChange={setSubject} />

        <UIText style={s.label}>Difficulty</UIText>
        <View style={s.diffRow}>
          {(['easy', 'medium', 'hard'] as const).map((d) => (
            <Pressable
              key={d}
              onPress={() => setDifficulty(d)}
              style={[s.diffChip, difficulty === d && s.diffChipActive]}
            >
              <UIText style={[s.diffText, difficulty === d && s.diffTextActive]}>
                {d.charAt(0).toUpperCase() + d.slice(1)}
              </UIText>
            </Pressable>
          ))}
        </View>

        {history.length > 0 && (
          <>
            <UIText style={s.label}>From your history</UIText>
            {history.slice(0, 6).map((item) => (
              <Pressable
                key={item.id}
                onPress={() => {
                  setSelectedHistory(item)
                  setTopic(item.topic)
                  if (item.subject) setSubject(item.subject)
                }}
                style={[s.historyCard, selectedHistory?.id === item.id && s.historyCardActive]}
              >
                <Ionicons
                  name={item.type === 'scan' ? 'camera' : 'play-circle'}
                  size={22}
                  color={selectedHistory?.id === item.id ? '#000' : ACCENT}
                />
                <View style={{ flex: 1 }}>
                  <UIText style={[s.historyTitle, selectedHistory?.id === item.id && s.historyTitleActive]}>
                    {item.topic}
                  </UIText>
                  <UIText style={s.historyMeta}>{item.subject ?? 'General'}</UIText>
                </View>
              </Pressable>
            ))}
          </>
        )}

        <UIText style={s.label}>Quick picks</UIText>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.examplesScroll}>
          {EXAMPLES.map((ex) => (
            <Pressable
              key={ex}
              onPress={() => {
                setTopic(ex)
                setSelectedHistory(null)
              }}
              style={s.exampleChip}
            >
              <UIText style={s.exampleText}>{ex}</UIText>
            </Pressable>
          ))}
        </ScrollView>
      </ScrollView>

      <View style={[s.footer, { paddingBottom: insets.bottom + 16 }]}>
        <Pressable
          onPress={start}
          disabled={!topic.trim() && !selectedHistory}
          style={[s.startBtn, !topic.trim() && !selectedHistory && s.startBtnDisabled]}
        >
          <LinearGradient colors={[ACCENT, '#0d9488']} style={s.startGrad}>
            <Ionicons name="flash" size={20} color="#000" />
            <UIText style={s.startText}>Start flashcard session</UIText>
          </LinearGradient>
        </Pressable>
      </View>
    </View>
  )
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: BG },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#1a1a1a',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: { fontSize: 18, fontWeight: '700', color: '#fff' },
  content: { padding: 20, gap: 14, paddingBottom: 24 },
  label: {
    fontSize: 12,
    fontWeight: '700',
    color: TEXT_SECONDARY,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginTop: 4,
  },
  input: {
    backgroundColor: '#111',
    borderWidth: 1,
    borderColor: '#2a2a2a',
    borderRadius: 12,
    padding: 14,
    color: '#fff',
    fontSize: 15,
  },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: '#1a1a1a',
    borderWidth: 1,
    borderColor: '#333',
  },
  chipActive: { backgroundColor: ACCENT, borderColor: ACCENT },
  chipText: { fontSize: 13, color: '#888', fontWeight: '500' },
  chipTextActive: { color: '#000', fontWeight: '700' },
  diffRow: { flexDirection: 'row', gap: 10 },
  diffChip: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: '#1a1a1a',
    borderWidth: 1,
    borderColor: '#333',
    alignItems: 'center',
  },
  diffChipActive: { borderColor: ACCENT },
  diffText: { fontSize: 14, color: '#888', fontWeight: '600' },
  diffTextActive: { color: ACCENT, fontWeight: '700' },
  historyCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
    borderRadius: 14,
    backgroundColor: '#1a1a1a',
    borderWidth: 1,
    borderColor: '#333',
  },
  historyCardActive: { backgroundColor: ACCENT, borderColor: ACCENT },
  historyTitle: { fontSize: 15, fontWeight: '600', color: '#fff' },
  historyTitleActive: { color: '#000', fontWeight: '700' },
  historyMeta: { fontSize: 12, color: TEXT_SECONDARY, marginTop: 2 },
  examplesScroll: { flexGrow: 0 },
  exampleChip: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: '#111',
    borderWidth: 1,
    borderColor: '#2a2a2a',
    marginRight: 8,
  },
  exampleText: { fontSize: 13, color: '#888' },
  footer: { paddingHorizontal: 20, paddingTop: 8 },
  startBtn: { borderRadius: 14, overflow: 'hidden' },
  startBtnDisabled: { opacity: 0.45 },
  startGrad: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
  },
  startText: { fontSize: 16, fontWeight: '700', color: '#000' },
})
