import { useState, useRef } from 'react'
import {
  View,
  ScrollView,
  StyleSheet,
  Pressable,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from 'react-native'
import { router } from 'expo-router'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import { Text as UIText } from '@/components/ui/Text'
import { ACCENT, BG, TEXT_SECONDARY } from '@/lib/theme'
import { askGroq } from '@/lib/aiChat'
import { speakNarration, stopNarration } from '@/lib/explainerSpeech'

type Msg = { role: 'user' | 'assistant'; text: string }

export default function VoiceTutorScreen() {
  const insets = useSafeAreaInsets()
  const [messages, setMessages] = useState<Msg[]>([
    {
      role: 'assistant',
      text: 'Hi! Ask me anything about your homework — e.g. "Why do we use integration here?"',
    },
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const scrollRef = useRef<ScrollView>(null)

  const send = async () => {
    const q = input.trim()
    if (!q || loading) return
    setInput('')
    const next: Msg[] = [...messages, { role: 'user', text: q }]
    setMessages(next)
    setLoading(true)
    try {
      const reply = await askGroq(
        'You are a patient tutor. Answer in 2-4 short paragraphs. Use examples. Never just give the final answer without explaining why.',
        q
      )
      setMessages([...next, { role: 'assistant', text: reply }])
      speakNarration(reply.slice(0, 500))
    } catch {
      setMessages([
        ...next,
        { role: 'assistant', text: 'Sorry, I could not respond. Check your connection and Groq API key.' },
      ])
    } finally {
      setLoading(false)
      setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100)
    }
  }

  return (
    <KeyboardAvoidingView
      style={[s.root, { paddingTop: insets.top }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={s.header}>
        <Pressable onPress={() => { stopNarration(); router.back() }} style={s.back}>
          <Ionicons name="arrow-back" size={22} color="#fff" />
        </Pressable>
        <UIText style={s.title}>Voice Tutor</UIText>
        <Pressable onPress={() => stopNarration()} hitSlop={8}>
          <Ionicons name="volume-mute" size={22} color="#888" />
        </Pressable>
      </View>

      <ScrollView ref={scrollRef} style={s.chat} contentContainerStyle={s.chatInner}>
        {messages.map((m, i) => (
          <View key={i} style={[s.bubble, m.role === 'user' ? s.bubbleUser : s.bubbleAi]}>
            <UIText style={s.bubbleText}>{m.text}</UIText>
            {m.role === 'assistant' && (
              <Pressable onPress={() => speakNarration(m.text.slice(0, 600))} style={s.speakBtn}>
                <Ionicons name="volume-high" size={16} color={ACCENT} />
                <UIText style={s.speakLabel}>Listen</UIText>
              </Pressable>
            )}
          </View>
        ))}
        {loading && <UIText style={s.typing}>Thinking…</UIText>}
      </ScrollView>

      <View style={[s.inputRow, { paddingBottom: insets.bottom + 8 }]}>
        <TextInput
          style={s.input}
          value={input}
          onChangeText={setInput}
          placeholder="Ask your doubt…"
          placeholderTextColor="#555"
          multiline
        />
        <Pressable onPress={send} style={s.send} disabled={loading}>
          <Ionicons name="send" size={20} color="#000" />
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  )
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: BG },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
  },
  back: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#1a1a1a',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: { flex: 1, fontSize: 18, fontWeight: '700', color: '#fff' },
  chat: { flex: 1 },
  chatInner: { padding: 16, gap: 12 },
  bubble: { maxWidth: '88%', padding: 12, borderRadius: 14, gap: 8 },
  bubbleUser: { alignSelf: 'flex-end', backgroundColor: ACCENT },
  bubbleAi: {
    alignSelf: 'flex-start',
    backgroundColor: '#1a1a1a',
    borderWidth: 1,
    borderColor: '#333',
  },
  bubbleText: { fontSize: 15, color: '#fff', lineHeight: 22 },
  speakBtn: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  speakLabel: { fontSize: 12, color: ACCENT, fontWeight: '600' },
  typing: { color: TEXT_SECONDARY, fontStyle: 'italic' },
  inputRow: {
    flexDirection: 'row',
    padding: 12,
    gap: 8,
    borderTopWidth: 1,
    borderTopColor: '#222',
  },
  input: {
    flex: 1,
    backgroundColor: '#111',
    borderRadius: 12,
    padding: 12,
    color: '#fff',
    maxHeight: 100,
  },
  send: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: ACCENT,
    alignItems: 'center',
    justifyContent: 'center',
  },
})
