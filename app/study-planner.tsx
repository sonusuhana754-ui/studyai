import { useState } from 'react'
import {
  View,
  ScrollView,
  StyleSheet,
  Pressable,
  TextInput,
  Alert,
  ActivityIndicator,
} from 'react-native'
import { router } from 'expo-router'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { LinearGradient } from 'expo-linear-gradient'
import { Ionicons } from '@expo/vector-icons'
import { Text as UIText } from '@/components/ui/Text'
import { Card } from '@/components/ui/Card'
import { ACCENT, BG, TEXT_SECONDARY } from '@/lib/theme'
import { generateStudyPlan, StudyPlan } from '@/lib/studyPlanner'
import { SubjectPicker } from '@/components/SubjectPicker'

export default function StudyPlannerScreen() {
  const insets = useSafeAreaInsets()
  const [examName, setExamName] = useState('')
  const [examDate, setExamDate] = useState('')
  const [hoursPerDay, setHoursPerDay] = useState('2')
  const [selectedSubjects, setSelectedSubjects] = useState<string[]>(['Mathematics', 'Physics'])
  const [weakTopics, setWeakTopics] = useState('')
  const [loading, setLoading] = useState(false)
  const [plan, setPlan] = useState<StudyPlan | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [usedFallback, setUsedFallback] = useState(false)

  const build = async () => {
    if (!examName.trim() || !examDate.trim()) {
      const msg = 'Enter exam name and target date.'
      setError(msg)
      Alert.alert('Missing info', msg)
      return
    }
    if (selectedSubjects.length === 0) {
      const msg = 'Select at least one subject from the list below.'
      setError(msg)
      Alert.alert('Subjects required', msg)
      return
    }
    setLoading(true)
    setError(null)
    setUsedFallback(false)
    try {
      const result = await generateStudyPlan({
        examName: examName.trim(),
        examDate: examDate.trim(),
        hoursPerDay: Math.max(1, Number(hoursPerDay) || 2),
        subjects: selectedSubjects,
        weakTopics: weakTopics.trim(),
      })
      setPlan(result)
      setUsedFallback(result.summary.includes('Offline template'))
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Try again in a moment.'
      setError(msg)
      Alert.alert('Planner failed', msg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <View style={[s.root, { paddingTop: insets.top }]}>
      <View style={s.header}>
        <Pressable onPress={() => router.back()} hitSlop={8} style={s.backBtn}>
          <Ionicons name="arrow-back" size={22} color="#fff" />
        </Pressable>
        <UIText style={s.headerTitle}>AI Study Planner</UIText>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView contentContainerStyle={s.content} showsVerticalScrollIndicator={false}>
        {!plan ? (
          <>
            <UIText style={s.label}>Exam / goal</UIText>
            <TextInput
              style={s.input}
              placeholder="e.g. JEE Main, Board finals"
              placeholderTextColor="#555"
              value={examName}
              onChangeText={setExamName}
            />
            <UIText style={s.label}>Target date</UIText>
            <TextInput
              style={s.input}
              placeholder="e.g. 2026-06-15"
              placeholderTextColor="#555"
              value={examDate}
              onChangeText={setExamDate}
            />
            <UIText style={s.label}>Hours per day</UIText>
            <TextInput
              style={s.input}
              keyboardType="numeric"
              value={hoursPerDay}
              onChangeText={setHoursPerDay}
            />
            <UIText style={s.label}>Subjects — pick your stream</UIText>
            <UIText style={s.hint}>
              Engineering, Commerce, Science, Medical, Arts, Law & more
            </UIText>
            <SubjectPicker
              mode="multi"
              value={selectedSubjects}
              onChange={setSelectedSubjects}
              initialStream="science"
              max={10}
            />
            <UIText style={s.label}>Weak topics (optional)</UIText>
            <TextInput
              style={[s.input, s.inputTall]}
              placeholder="e.g. integration, organic chemistry"
              placeholderTextColor="#555"
              value={weakTopics}
              onChangeText={setWeakTopics}
              multiline
            />
            {error ? (
              <View style={s.errorBox}>
                <UIText style={s.errorText}>{error}</UIText>
              </View>
            ) : null}
            <Pressable onPress={build} disabled={loading} style={[s.btn, loading && s.btnDisabled]}>
              <LinearGradient colors={[ACCENT, '#0d9488']} style={s.btnGrad}>
                {loading ? (
                  <ActivityIndicator color="#041018" />
                ) : (
                  <UIText style={s.btnText}>Generate 7-day plan</UIText>
                )}
              </LinearGradient>
            </Pressable>
          </>
        ) : (
          <>
            {usedFallback ? (
              <View style={s.fallbackBanner}>
                <UIText style={s.fallbackText}>
                  AI was busy — showing a smart template. Tap regenerate to try AI again.
                </UIText>
                <Pressable onPress={build} disabled={loading} style={s.fallbackBtn}>
                  <UIText style={s.fallbackBtnText}>{loading ? 'Generating…' : 'Regenerate with AI'}</UIText>
                </Pressable>
              </View>
            ) : null}
            <UIText style={s.planTitle}>{plan.title}</UIText>
            <UIText style={s.planSummary}>{plan.summary}</UIText>
            {plan.days.map((day, i) => (
              <Card key={i} style={s.dayCard}>
                <View style={s.dayHeader}>
                  <UIText style={s.dayName}>{day.day}</UIText>
                  <UIText style={s.dayMins}>{day.minutes} min</UIText>
                </View>
                <UIText style={s.dayFocus}>{day.focus}</UIText>
                {day.tasks.map((task, j) => (
                  <UIText key={j} style={s.task}>
                    • {task}
                  </UIText>
                ))}
              </Card>
            ))}
            {plan.tips?.length > 0 && (
              <Card style={s.tipsCard}>
                <UIText style={s.tipsLabel}>Tips</UIText>
                {plan.tips.map((tip, i) => (
                  <UIText key={i} style={s.tip}>
                    {tip}
                  </UIText>
                ))}
              </Card>
            )}
            <Pressable
              onPress={() => {
                setPlan(null)
                setError(null)
                setUsedFallback(false)
              }}
              style={s.resetBtn}
            >
              <UIText style={s.resetText}>Create another plan</UIText>
            </Pressable>
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
  content: { padding: 20, gap: 12, paddingBottom: 40 },
  label: {
    fontSize: 12,
    fontWeight: '700',
    color: TEXT_SECONDARY,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginTop: 4,
  },
  hint: { fontSize: 12, color: TEXT_SECONDARY, marginBottom: 4 },
  input: {
    backgroundColor: '#111',
    borderWidth: 1,
    borderColor: '#2a2a2a',
    borderRadius: 12,
    padding: 14,
    color: '#fff',
    fontSize: 15,
  },
  inputTall: { minHeight: 72, textAlignVertical: 'top' },
  btn: { borderRadius: 14, overflow: 'hidden', marginTop: 8 },
  btnDisabled: { opacity: 0.6 },
  btnGrad: { paddingVertical: 16, alignItems: 'center' },
  btnText: { fontSize: 16, fontWeight: '700', color: '#000' },
  planTitle: { fontSize: 22, fontWeight: '800', color: '#fff' },
  planSummary: { fontSize: 14, color: TEXT_SECONDARY, lineHeight: 20, marginBottom: 8 },
  dayCard: { gap: 8, padding: 14 },
  dayHeader: { flexDirection: 'row', justifyContent: 'space-between' },
  dayName: { fontSize: 16, fontWeight: '700', color: ACCENT },
  dayMins: { fontSize: 13, color: TEXT_SECONDARY },
  dayFocus: { fontSize: 14, fontWeight: '600', color: '#fff' },
  task: { fontSize: 13, color: 'rgba(255,255,255,0.75)', lineHeight: 18 },
  tipsCard: { gap: 6, padding: 14 },
  tipsLabel: { fontSize: 12, fontWeight: '700', color: TEXT_SECONDARY },
  tip: { fontSize: 13, color: '#fff', lineHeight: 18 },
  resetBtn: {
    padding: 14,
    alignItems: 'center',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#333',
  },
  resetText: { color: '#fff', fontWeight: '600' },
  errorBox: {
    padding: 12,
    borderRadius: 10,
    backgroundColor: 'rgba(248,113,113,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(248,113,113,0.35)',
  },
  errorText: { color: '#fca5a5', fontSize: 13, lineHeight: 18 },
  fallbackBanner: {
    padding: 12,
    borderRadius: 10,
    backgroundColor: 'rgba(34,211,238,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(34,211,238,0.3)',
    gap: 8,
  },
  fallbackText: { color: TEXT_SECONDARY, fontSize: 13, lineHeight: 18 },
  fallbackBtn: { alignSelf: 'flex-start' },
  fallbackBtnText: { color: ACCENT, fontWeight: '700', fontSize: 14 },
})
