
import React, { useState, useEffect, useRef } from 'react'
import { View, Text, StyleSheet, Pressable, ScrollView, TextInput } from 'react-native'
import { router, useLocalSearchParams } from 'expo-router'
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context'
import { useToast } from '@/contexts/ToastContext'
import { LinearGradient } from 'expo-linear-gradient'
import { Ionicons } from '@expo/vector-icons'
import { Text as UIText } from '@/components/ui/Text'
import { Card } from '@/components/ui/Card'
import { ACCENT, BG, TEXT_SECONDARY } from '@/lib/theme'
import { generateQuizQuestions } from '@/lib/gemini'
import { getHistory, HistoryItem, saveQuizScore, getQuizScores, QuizScore } from '@/lib/history'
import { recordLearningEvent, scheduleRevision } from '@/lib/learningMemory'
import { SubjectPicker } from '@/components/SubjectPicker'
const DIFFICULTIES = ['easy', 'medium', 'hard'] as const;
const DIFFICULTY_LABELS = ['Easy', 'Medium', 'Hard'] as const;

type SourceType = 'topic' | 'scan' | 'video_explainer' | 'document'

export default function QuizScreen() {
  const insets = useSafeAreaInsets()
  const { showToast } = useToast()
  const params = useLocalSearchParams<{ topic?: string; subject?: string; examMode?: string }>()
  const isExamMode = params.examMode === '1'
  const [source, setSource] = useState<SourceType>('topic')
  const [topic, setTopic] = useState(params.topic ?? '')
  const [subject, setSubject] = useState(params.subject ?? 'Mathematics')
  const [difficulty, setDifficulty] = useState<'easy' | 'medium' | 'hard'>('medium')
  const [history, setHistory] = useState<HistoryItem[]>([])
  const [selectedHistoryItem, setSelectedHistoryItem] = useState<HistoryItem | null>(null)
  const [loading, setLoading] = useState(false)
  const [quizQuestions, setQuizQuestions] = useState<any[]>([])
  const [currentQuestion, setCurrentQuestion] = useState(0)
  const [selectedOption, setSelectedOption] = useState<number | null>(null)
  const [showResult, setShowResult] = useState(false)
  const [score, setScore] = useState(0)
  const [correctCount, setCorrectCount] = useState(0)
  const [quizMeta, setQuizMeta] = useState<{ topic: string; subject: string; difficulty: typeof DIFFICULTIES[number] }>({ topic: '', subject: 'Mathematics', difficulty: 'medium' })
  const [pastScores, setPastScores] = useState<QuizScore[]>([])
  const [timeLeft, setTimeLeft] = useState(30)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    loadHistory()
    loadPastScores()
  }, [])

  const loadHistory = async () => {
    try {
      const data = await getHistory()
      setHistory(data.filter(h => h.type === 'video_explainer' || h.type === 'scan'))
    } catch (e) {
      console.error('Failed to load history:', e)
    }
  }

  const loadPastScores = async () => {
    try {
      const data = await getQuizScores()
      setPastScores(data)
    } catch (e) {
      console.error('Failed to load past scores:', e)
    }
  }

  const generateQuiz = async () => {
    let actualTopic = topic
    let actualSubject = subject

    if (selectedHistoryItem) {
      actualTopic = selectedHistoryItem.topic
      actualSubject = selectedHistoryItem.subject || subject
    }

    if (!actualTopic.trim()) return

    setQuizMeta({ topic: actualTopic, subject: actualSubject, difficulty })
    setLoading(true)
    try {
      const data = await generateQuizQuestions(actualSubject, difficulty, 10, actualTopic)
      if (!data?.questions?.length) {
        throw new Error('No questions generated')
      }
      setQuizQuestions(data.questions)
      setCurrentQuestion(0)
      setSelectedOption(null)
      setShowResult(false)
      setScore(0)
      setCorrectCount(0)
    } catch (e) {
      console.error('Failed to generate quiz:', e)
      showToast('Could not generate quiz. Check your connection or API keys.', 'error')
    } finally {
      setLoading(false)
    }
  }

  const finishQuiz = async () => {
    try {
      await saveQuizScore({
        topic: quizMeta.topic,
        subject: quizMeta.subject,
        difficulty: quizMeta.difficulty,
        score,
        totalQuestions: quizQuestions.length
      })
      await loadPastScores()
    } catch (e) {
      console.error('Failed to save quiz score:', e)
    }
    setShowResult(true)
  }

  const handleAnswer = (index: number) => {
    if (selectedOption !== null) return
    setSelectedOption(index)
    
    const q = quizQuestions[currentQuestion]
    let isCorrect = false
    if (q.type === 'mcq' && index === q.correct_index) isCorrect = true
    if (q.type === 'true_false' && (index === 0) === q.correct) isCorrect = true
    if (isCorrect) {
      setScore(s => s + 10)
      setCorrectCount(c => c + 1)
    }
    recordLearningEvent({
      type: isCorrect ? 'quiz_correct' : 'quiz_wrong',
      topic: quizMeta.topic,
      subject: quizMeta.subject,
    }).catch(() => {})
    scheduleRevision(quizMeta.topic, quizMeta.subject, isCorrect).catch(() => {})
  }

  const nextQuestion = () => {
    if (currentQuestion < quizQuestions.length - 1) {
      setCurrentQuestion(c => c + 1)
      setSelectedOption(null)
    } else {
      finishQuiz()
    }
  }

  if (loading) {
    return (
      <SafeAreaView style={[s.container, { paddingTop: insets.top }]}>
        <View style={s.header}>
          <Pressable onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </Pressable>
        </View>
        <View style={s.loadingContainer}>
          <View style={s.spinner} />
          <UIText style={s.loadingText}>Generating quiz...</UIText>
        </View>
      </SafeAreaView>
    )
  }

  useEffect(() => {
    if (!isExamMode || quizQuestions.length === 0 || showResult || selectedOption !== null) {
      if (timerRef.current) clearInterval(timerRef.current)
      return
    }
    setTimeLeft(30)
    timerRef.current = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) {
          if (timerRef.current) clearInterval(timerRef.current)
          return 0
        }
        return t - 1
      })
    }, 1000)
    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [currentQuestion, quizQuestions.length, showResult, isExamMode, selectedOption])

  if (quizQuestions.length > 0 && !showResult) {
    const q = quizQuestions[currentQuestion]
    const progressPct = ((currentQuestion + (selectedOption !== null ? 1 : 0)) / quizQuestions.length) * 100
    return (
      <SafeAreaView style={[s.container, { paddingTop: insets.top }]}>
        <View style={s.header}>
          <Pressable onPress={() => setQuizQuestions([])}>
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </Pressable>
          <UIText style={s.headerTitle}>
            {currentQuestion + 1} / {quizQuestions.length}
          </UIText>
          <UIText style={[s.scoreText, isExamMode && timeLeft <= 10 && { color: '#f97316' }]}>
            {isExamMode ? `${timeLeft}s` : `${score} pts`}
          </UIText>
        </View>
        <View style={s.quizProgressWrap}>
          <View style={s.quizProgressTrack}>
            <View style={[s.quizProgressFill, { width: `${progressPct}%` }]} />
          </View>
          <UIText style={s.quizTopicLabel} numberOfLines={1}>{quizMeta.topic}</UIText>
        </View>

        <ScrollView style={s.scrollContent} contentContainerStyle={s.scrollContentInner}>
          <Card style={s.questionCard}>
            <UIText style={s.questionText}>{q.question}</UIText>
          </Card>

          {q.type === 'mcq' && q.options?.map((option: string, i: number) => (
            <Pressable
              key={i}
              onPress={() => handleAnswer(i)}
              disabled={selectedOption !== null}
              style={[
                s.optionButton,
                selectedOption === i && (i === q.correct_index ? s.optionCorrect : s.optionWrong)
              ]}
            >
              <UIText style={s.optionText}>{option}</UIText>
              {selectedOption === i && (
                <Ionicons
                  name={i === q.correct_index ? 'checkmark-circle' : 'close-circle'}
                  size={24}
                  color={i === q.correct_index ? '#4ade80' : '#f87171'}
                />
              )}
            </Pressable>
          ))}

          {q.type === 'true_false' && (
            <View style={s.trueFalseRow}>
              <Pressable
                onPress={() => handleAnswer(0)}
                disabled={selectedOption !== null}
                style={[
                  s.trueFalseButton,
                  selectedOption === 0 && (q.correct ? s.optionCorrect : s.optionWrong)
                ]}
              >
                <UIText style={s.trueFalseText}>True</UIText>
              </Pressable>
              <Pressable
                onPress={() => handleAnswer(1)}
                disabled={selectedOption !== null}
                style={[
                  s.trueFalseButton,
                  selectedOption === 1 && (!q.correct ? s.optionCorrect : s.optionWrong)
                ]}
              >
                <UIText style={s.trueFalseText}>False</UIText>
              </Pressable>
            </View>
          )}

          {selectedOption !== null && (
            <Card style={s.explanationCard}>
              <UIText style={s.explanationLabel}>Explanation:</UIText>
              <UIText style={s.explanationText}>{q.explanation}</UIText>
            </Card>
          )}
        </ScrollView>

        {selectedOption !== null && (
          <View style={s.footer}>
            <Pressable onPress={nextQuestion} style={s.nextButton}>
              <LinearGradient
                colors={[ACCENT, '#0d9488']}
                style={s.nextButtonGrad}
              >
                <UIText style={s.nextButtonText}>
                  {currentQuestion < quizQuestions.length - 1 ? 'Next Question' : 'Finish Quiz'}
                </UIText>
              </LinearGradient>
            </Pressable>
          </View>
        )}
      </SafeAreaView>
    )
  }

  if (showResult) {
    return (
      <SafeAreaView style={[s.container, { paddingTop: insets.top }]}>
        <View style={s.header}>
          <Pressable onPress={() => { setQuizQuestions([]); setShowResult(false) }}>
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </Pressable>
        </View>
        <View style={s.resultContainer}>
          <Text style={s.resultEmoji}>
            {correctCount >= quizQuestions.length * 0.8 ? '🏆' : correctCount >= quizQuestions.length * 0.5 ? '🎉' : '💪'}
          </Text>
          <UIText style={s.resultTitle}>Quiz Complete!</UIText>
          <UIText style={s.resultScore}>{correctCount}/{quizQuestions.length} correct</UIText>
          <UIText style={s.resultSub}>{score} points · {Math.round((correctCount / quizQuestions.length) * 100)}%</UIText>
          <View style={s.resultActions}>
            <Pressable onPress={() => { setQuizQuestions([]); setShowResult(false); generateQuiz() }} style={s.resetButton}>
              <UIText style={s.resetButtonText}>Try again</UIText>
            </Pressable>
            <Pressable onPress={() => { setQuizQuestions([]); setShowResult(false) }} style={s.resetButtonPrimary}>
              <LinearGradient colors={[ACCENT, '#0d9488']} style={s.resetButtonGrad}>
                <UIText style={s.resetButtonPrimaryText}>New quiz</UIText>
              </LinearGradient>
            </Pressable>
          </View>
        </View>
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView style={[s.container, { paddingTop: insets.top }]}>
      <View style={s.header}>
        <Pressable onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </Pressable>
        <UIText style={s.headerTitle}>{isExamMode ? 'Exam Simulator' : 'Quiz Generator'}</UIText>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={s.scrollContent} contentContainerStyle={s.scrollContentInner}>
        {isExamMode && (
          <View style={s.examBanner}>
            <UIText style={s.examBannerText}>
              ⏱️ Exam mode: answer under time pressure. Wrong answers cost points.
            </UIText>
          </View>
        )}
        <UIText style={s.sectionTitle}>Source</UIText>
        <View style={s.sourceRow}>
          {(['topic', 'video_explainer', 'scan', 'document'] as SourceType[]).map((type) => (
            <Pressable
              key={type}
              onPress={() => {
                setSource(type)
                if (type !== 'video_explainer' && type !== 'scan') setSelectedHistoryItem(null)
              }}
              style={[s.sourceChip, source === type && s.sourceChipActive]}
            >
              <Ionicons
                name={type === 'topic' ? 'create' : type === 'video_explainer' ? 'play-circle' : type === 'scan' ? 'camera' : 'document-text'}
                size={20}
                color={source === type ? '#000' : '#888'}
              />
              <UIText style={[s.sourceChipText, source === type && s.sourceChipTextActive]}>
                {type === 'topic' ? 'Topic' : type === 'video_explainer' ? 'Video Explainer' : type === 'scan' ? 'Scan' : 'Document'}
              </UIText>
            </Pressable>
          ))}
        </View>

        {(source === 'video_explainer' || source === 'scan') && history.length > 0 && (
          <>
            <UIText style={s.sectionTitle}>From History</UIText>
            {history.filter(h => h.type === source).map((item) => (
              <Pressable
                key={item.id}
                onPress={() => setSelectedHistoryItem(item)}
                style={[s.historyCard, selectedHistoryItem?.id === item.id && s.historyCardActive]}
              >
                <Ionicons
                  name={item.type === 'video_explainer' ? 'play-circle' : 'camera'}
                  size={24}
                  color={selectedHistoryItem?.id === item.id ? '#000' : ACCENT}
                />
                <View style={s.historyContent}>
                  <UIText style={[s.historyTitle, selectedHistoryItem?.id === item.id && s.historyTitleActive]}>{item.topic}</UIText>
                  <UIText style={[s.historyDate, selectedHistoryItem?.id === item.id && s.historyDateActive]}>
                    {new Date(item.createdAt).toLocaleDateString()}
                  </UIText>
                </View>
              </Pressable>
            ))}
          </>
        )}

        {source === 'topic' && (
          <>
            <UIText style={s.sectionTitle}>Topic</UIText>
            <TextInput
              style={s.topicInput}
              placeholder="Enter a topic (e.g., Photosynthesis)"
              placeholderTextColor="#555"
              value={topic}
              onChangeText={setTopic}
            />
            <UIText style={s.sectionTitle}>Subject</UIText>
            <SubjectPicker value={subject} onChange={setSubject} />
          </>
        )}

        {pastScores.length > 0 && (
          <>
            <UIText style={s.sectionTitle}>Past Scores</UIText>
            {pastScores.map((item) => (
              <Card key={item.id} style={s.scoreCard}>
                <View style={s.scoreCardLeft}>
                  <UIText style={s.scoreCardTopic}>{item.topic}</UIText>
                  <UIText style={s.scoreCardMeta}>
                    {item.subject} • {item.difficulty.charAt(0).toUpperCase() + item.difficulty.slice(1)} • {new Date(item.createdAt).toLocaleDateString()}
                  </UIText>
                </View>
                <View style={s.scoreCardRight}>
                  <UIText style={s.scoreCardScore}>{item.score} pts</UIText>
                  <UIText style={s.scoreCardQuestions}>
                    {Math.round((item.score / (item.totalQuestions * 10)) * 100)}%
                  </UIText>
                </View>
              </Card>
            ))}
          </>
        )}

        <UIText style={s.sectionTitle}>Difficulty</UIText>
        <View style={s.difficultyRow}>
          {DIFFICULTIES.map((diff, i) => (
            <Pressable
              key={diff}
              onPress={() => setDifficulty(diff)}
              style={[s.difficultyChip, difficulty === diff && s.difficultyChipActive]}
            >
              <UIText style={[s.difficultyChipText, difficulty === diff && s.difficultyChipTextActive]}>
                {DIFFICULTY_LABELS[i]}
              </UIText>
            </Pressable>
          ))}
        </View>
      </ScrollView>

      <View style={s.footer}>
        <Pressable
          onPress={generateQuiz}
          disabled={loading || (!topic.trim() && !selectedHistoryItem)}
          style={[s.generateButton, (!topic.trim() && !selectedHistoryItem) && s.generateButtonDisabled]}
        >
          <LinearGradient
            colors={[ACCENT, '#0d9488']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={s.generateButtonGrad}
          >
            <UIText style={s.generateButtonText}>Generate Quiz</UIText>
          </LinearGradient>
        </Pressable>
      </View>
    </SafeAreaView>
  )
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: BG },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  headerTitle: { fontSize: 18, fontWeight: '700', color: '#fff' },
  scoreText: { fontSize: 16, fontWeight: '700', color: ACCENT },
  scrollContent: { flex: 1 },
  scrollContentInner: { padding: 20, gap: 16, paddingBottom: 100 },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 20,
  },
  spinner: {
    width: 48,
    height: 48,
    borderRadius: 999,
    borderWidth: 4,
    borderColor: 'rgba(255,255,255,0.1)',
    borderTopColor: ACCENT,
  },
  loadingText: { fontSize: 16, color: '#fff', fontWeight: '600' },
  quizProgressWrap: { paddingHorizontal: 20, paddingBottom: 8, gap: 6 },
  quizProgressTrack: {
    height: 6,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.1)',
    overflow: 'hidden',
  },
  quizProgressFill: {
    height: '100%',
    borderRadius: 999,
    backgroundColor: ACCENT,
  },
  quizTopicLabel: { fontSize: 12, color: TEXT_SECONDARY, fontWeight: '600' },
  examBanner: {
    padding: 12,
    borderRadius: 12,
    backgroundColor: 'rgba(249,115,22,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(249,115,22,0.35)',
  },
  examBannerText: { fontSize: 13, color: '#fdba74', lineHeight: 18 },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: TEXT_SECONDARY,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  sourceRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  sourceChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 999,
    backgroundColor: '#1a1a1a',
    borderWidth: 1,
    borderColor: '#333',
  },
  sourceChipActive: {
    backgroundColor: ACCENT,
    borderColor: ACCENT,
  },
  sourceChipText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#888',
  },
  sourceChipTextActive: {
    color: '#000',
    fontWeight: '700',
  },
  historyCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
    borderRadius: 16,
    backgroundColor: '#1a1a1a',
    borderWidth: 1,
    borderColor: '#333',
  },
  historyCardActive: {
    backgroundColor: ACCENT,
    borderColor: ACCENT,
  },
  historyContent: { flex: 1 },
  historyTitle: { fontSize: 15, fontWeight: '600', color: '#fff' },
  historyTitleActive: { color: '#000', fontWeight: '700' },
  historyDate: { fontSize: 12, color: TEXT_SECONDARY },
  historyDateActive: { color: '#333', fontWeight: '600' },
  topicInput: {
    backgroundColor: '#111',
    borderWidth: 0.5,
    borderColor: '#2a2a2a',
    borderRadius: 12,
    padding: 14,
    color: '#fff',
    fontSize: 15,
  },
  subjectsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  subjectChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: '#1a1a1a',
    borderWidth: 1,
    borderColor: '#333',
  },
  subjectChipActive: {
    backgroundColor: ACCENT,
    borderColor: ACCENT,
  },
  subjectChipText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#888',
  },
  subjectChipTextActive: {
    color: '#000',
    fontWeight: '700',
  },
  difficultyRow: {
    flexDirection: 'row',
    gap: 12,
  },
  difficultyChip: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: '#1a1a1a',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#333',
  },
  difficultyChipActive: {
    borderColor: ACCENT,
  },
  difficultyChipText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#888',
  },
  difficultyChipTextActive: {
    color: ACCENT,
    fontWeight: '700',
  },
  questionCard: {
    backgroundColor: 'rgba(26,26,26,0.8)',
    padding: 20,
  },
  questionText: {
    fontSize: 22,
    color: '#fff',
    fontWeight: '700',
    lineHeight: 30,
  },
  optionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#1a1a1a',
    borderWidth: 1,
    borderColor: '#333',
    borderRadius: 16,
    padding: 16,
  },
  optionCorrect: {
    borderColor: '#4ade80',
    backgroundColor: 'rgba(74, 222, 128, 0.1)',
  },
  optionWrong: {
    borderColor: '#f87171',
    backgroundColor: 'rgba(248, 113, 113, 0.1)',
  },
  optionText: {
    flex: 1,
    fontSize: 16,
    color: '#fff',
    fontWeight: '600',
  },
  trueFalseRow: {
    flexDirection: 'row',
    gap: 12,
  },
  trueFalseButton: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 16,
    backgroundColor: '#1a1a1a',
    borderWidth: 1,
    borderColor: '#333',
    alignItems: 'center',
  },
  trueFalseText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
  },
  explanationCard: {
    backgroundColor: 'rgba(26,26,26,0.6)',
    padding: 16,
    gap: 8,
  },
  explanationLabel: {
    fontSize: 12,
    color: TEXT_SECONDARY,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  explanationText: {
    fontSize: 15,
    color: '#fff',
    lineHeight: 22,
  },
  footer: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  nextButton: { borderRadius: 14, overflow: 'hidden' },
  nextButtonGrad: { paddingVertical: 16, alignItems: 'center' },
  nextButtonText: { fontSize: 16, fontWeight: '700', color: '#000' },
  generateButton: { borderRadius: 14, overflow: 'hidden' },
  generateButtonDisabled: { opacity: 0.4 },
  generateButtonGrad: { paddingVertical: 16, alignItems: 'center' },
  generateButtonText: { fontSize: 16, fontWeight: '700', color: '#000' },
  resultContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
    gap: 20,
  },
  resultEmoji: { fontSize: 72 },
  resultTitle: { fontSize: 32, fontWeight: '800', color: '#fff' },
  resultScore: { fontSize: 40, fontWeight: '800', color: '#fff' },
  resultSub: { fontSize: 16, color: ACCENT, fontWeight: '700' },
  resultActions: { flexDirection: 'row', gap: 12, marginTop: 8 },
  resetButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 14,
    backgroundColor: '#1a1a1a',
    borderWidth: 1,
    borderColor: '#333',
    alignItems: 'center',
  },
  resetButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
  },
  resetButtonPrimary: { flex: 1, borderRadius: 14, overflow: 'hidden' },
  resetButtonGrad: { paddingVertical: 14, alignItems: 'center' },
  resetButtonPrimaryText: { fontSize: 16, fontWeight: '700', color: '#000' },
  scoreCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 14,
    backgroundColor: 'rgba(26,26,26,0.6)',
  },
  scoreCardLeft: {
    flex: 1,
    gap: 4,
  },
  scoreCardTopic: {
    fontSize: 15,
    fontWeight: '700',
    color: '#fff',
  },
  scoreCardMeta: {
    fontSize: 12,
    color: TEXT_SECONDARY,
    fontWeight: '500',
  },
  scoreCardRight: {
    alignItems: 'flex-end',
    gap: 2,
  },
  scoreCardScore: {
    fontSize: 18,
    fontWeight: '800',
    color: ACCENT,
  },
  scoreCardQuestions: {
    fontSize: 12,
    color: TEXT_SECONDARY,
    fontWeight: '600',
  },
})

