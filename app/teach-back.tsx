import { useState } from 'react'
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
import { Card } from '@/components/ui/Card'
import { ACCENT, BG, TEXT_SECONDARY } from '@/lib/theme'
import { askGroq } from '@/lib/aiChat'
import { recordLearningEvent } from '@/lib/learningMemory'

export default function TeachBackScreen() {
  const insets = useSafeAreaInsets()
  const params = useLocalSearchParams<{ topic?: string; subject?: string }>()
  const [topic, setTopic] = useState(params.topic ?? '')
  const [explanation, setExplanation] = useState('')
  const [feedback, setFeedback] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const evaluate = async () => {
    if (!topic.trim() || !explanation.trim()) {
      Alert.alert('Fill in both fields', 'Topic and your explanation are required.')
      return
    }
    setLoading(true)
    setFeedback(null)
    try {
      const result = await askGroq(
        'You evaluate student teach-back explanations. Return JSON only: {"score":0-100,"strengths":"","gaps":"","tip":""}',
        `Topic: ${topic}\nStudent explanation:\n${explanation}`
      )
      setFeedback(result)
      await recordLearningEvent({
        type: 'solve',
        topic: topic.trim(),
        subject: params.subject ?? 'General',
        tags: ['teach-back'],
      })
    } catch (e) {
      Alert.alert('Evaluation failed', e instanceof Error ? e.message : 'Try again')
    } finally {
      setLoading(false)
    }
  }

  return (
    <View style={[s.root, { paddingTop: insets.top }]}>
      <View style={s.header}>
        <Pressable onPress={() => router.back()} style={s.back}>
          <Ionicons name="arrow-back" size={22} color="#fff" />
        </Pressable>
        <UIText style={s.title}>Teach Back</UIText>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView contentContainerStyle={s.content}>
        <UIText style={s.hint}>
          Explain the concept in your own words. The AI checks clarity and gaps — proven to boost retention.
        </UIText>
        <UIText style={s.label}>Topic</UIText>
        <TextInput
          style={s.input}
          value={topic}
          onChangeText={setTopic}
          placeholder="e.g. Photosynthesis"
          placeholderTextColor="#555"
        />
        <UIText style={s.label}>Your explanation</UIText>
        <TextInput
          style={[s.input, s.inputTall]}
          value={explanation}
          onChangeText={setExplanation}
          placeholder="Teach it like you would to a friend…"
          placeholderTextColor="#555"
          multiline
        />
        <Pressable onPress={evaluate} disabled={loading} style={[s.btn, loading && s.btnOff]}>
          <LinearGradient colors={[ACCENT, '#0d9488']} style={s.btnGrad}>
            <UIText style={s.btnText}>{loading ? 'Evaluating…' : 'Get AI feedback'}</UIText>
          </LinearGradient>
        </Pressable>
        {feedback && (
          <Card style={s.feedback}>
            <UIText style={s.feedbackTitle}>Feedback</UIText>
            <UIText style={s.feedbackBody}>{feedback}</UIText>
          </Card>
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
  content: { padding: 20, gap: 10, paddingBottom: 40 },
  hint: { fontSize: 14, color: TEXT_SECONDARY, lineHeight: 20 },
  label: { fontSize: 12, fontWeight: '700', color: TEXT_SECONDARY, marginTop: 8 },
  input: {
    backgroundColor: '#111',
    borderWidth: 1,
    borderColor: '#2a2a2a',
    borderRadius: 12,
    padding: 14,
    color: '#fff',
  },
  inputTall: { minHeight: 120, textAlignVertical: 'top' },
  btn: { borderRadius: 14, overflow: 'hidden', marginTop: 8 },
  btnOff: { opacity: 0.6 },
  btnGrad: { paddingVertical: 16, alignItems: 'center' },
  btnText: { fontWeight: '700', color: '#000' },
  feedback: { marginTop: 16, padding: 16, gap: 8 },
  feedbackTitle: { fontSize: 16, fontWeight: '700', color: ACCENT },
  feedbackBody: { fontSize: 14, color: '#fff', lineHeight: 22 },
})
