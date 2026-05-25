import { useState, useEffect, useRef } from 'react'
import { View, Text, StyleSheet, Pressable, Dimensions } from 'react-native'
import { router, useLocalSearchParams } from 'expo-router'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { LinearGradient } from 'expo-linear-gradient'
import { Ionicons } from '@expo/vector-icons'
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  withDelay,
  Easing,
} from 'react-native-reanimated'
import { Text as UIText } from '@/components/ui/Text'
import { Card } from '@/components/ui/Card'
import {
  ACCENT,
  BG,
  TEXT_SECONDARY,
} from '@/lib/theme'
import { generateFlashcards } from '@/lib/gemini'
import { saveFlashcardSet, saveHistoryItem } from '@/lib/history'
import { recordLearningEvent, scheduleRevision } from '@/lib/learningMemory'

const { width: SW, height: SH } = Dimensions.get('window')

const HARDCODED_SOLUTION = {
  subject: 'Mathematics',
  topic: 'Quadratic Equations',
  difficulty: 'medium',
  steps: [
    { step: 1, action: 'Factor the equation', explanation: 'Factor the quadratic into two binomials', math: '(2x - 1)(x + 3) = 0' },
    { step: 2, action: 'Set each factor to zero', explanation: 'Apply the Zero Product Property', math: null },
    { step: 3, action: 'Solve for x', explanation: 'Solve each linear equation', math: 'x = ½ or x = -3' },
  ],
  answer: 'x = ½ or x = -3',
  concept: 'Zero Product Property and factoring quadratics',
  fun_fact: 'Quadratic equations were first solved by ancient Babylonians around 2000 BCE.',
}

const DIFFICULTIES = ['easy', 'medium', 'hard']
const DIFFICULTY_LABELS = ['Easy', 'Medium', 'Hard']

export default function FlashcardsScreen() {
  const insets = useSafeAreaInsets()
  const params = useLocalSearchParams<{
    topic?: string
    solution?: string
    subject?: string
    difficulty?: string
  }>()
  
  const [loading, setLoading] = useState(true)
  const [flashcards, setFlashcards] = useState<any[]>([])
  const [currentCardIndex, setCurrentCardIndex] = useState(0)
  const [isFlipped, setIsFlipped] = useState(false)
  const initialDiff = (() => {
    const d = params.difficulty?.toLowerCase()
    const i = DIFFICULTIES.indexOf(d ?? '')
    return i >= 0 ? i : 1
  })()
  const [difficultyIndex, setDifficultyIndex] = useState(initialDiff)
  const [xp, setXp] = useState(0)
  const [streak, setStreak] = useState(0)
  const [gotRight, setGotRight] = useState(0)
  const [showHint, setShowHint] = useState(false)
  const [xpPopup, setXpPopup] = useState<{ amount: number; id: number } | null>(null)
  const [isComplete, setIsComplete] = useState(false)

  const flipAnim = useSharedValue(0)
  const xpPopupAnim = useSharedValue(0)
  const streakScale = useSharedValue(0)
  const xpScale = useSharedValue(1)

  const currentCard = flashcards[currentCardIndex]

  useEffect(() => {
    if (!params.topic?.trim()) {
      router.replace('/flashcards-topic')
      return
    }
    const loadFlashcards = async () => {
      try {
        const topic = params.topic || 'Quadratic Equations'
        const solution = params.solution ? JSON.parse(params.solution) : HARDCODED_SOLUTION
        const subject = params.subject || HARDCODED_SOLUTION.subject
        const data = await generateFlashcards(topic, subject, solution, DIFFICULTIES[difficultyIndex], 8) as { flashcards: typeof flashcards }
        setFlashcards(data.flashcards ?? [])
      } catch (error) {
        console.error(error)
        setFlashcards([
          { front: 'What is the standard form of a quadratic equation?', back: 'ax² + bx + c = 0, where a ≠ 0', type: 'recall', hint: 'Has an x² term' },
          { front: 'Solve: x² - 9 = 0', back: 'x = 3 or x = -3', type: 'application', hint: 'Difference of squares' },
          { front: 'What property states that if ab = 0, then a = 0 or b = 0?', back: 'Zero Product Property', type: 'recall', hint: 'Useful for factoring' },
          { front: 'Find the roots: x² - 5x + 6 = 0', back: 'x = 2 or x = 3', type: 'application', hint: 'Factor the trinomial' },
          { front: 'What is the discriminant?', back: 'b² - 4ac, tells about the nature of roots', type: 'analysis', hint: 'Part of quadratic formula' },
          { front: 'Solve: 2x² + 5x - 3 = 0', back: 'x = ½ or x = -3', type: 'application', hint: 'Factor into (2x - 1)(x + 3)' },
          { front: 'What is the vertex form of a quadratic?', back: 'y = a(x - h)² + k, vertex at (h,k)', type: 'recall', hint: 'Perfect square' },
          { front: 'How many real roots if discriminant is positive?', back: 'Two distinct real roots', type: 'analysis', hint: 'Quadratic formula' },
        ])
      } finally {
        setLoading(false)
      }
    }
    loadFlashcards()
  }, [difficultyIndex])

  useEffect(() => {
    if (streak >= 2) {
      streakScale.value = withSpring(1, { damping: 14, stiffness: 100 })
    } else {
      streakScale.value = withTiming(0, { duration: 200 })
    }
  }, [streak])

  const flipCard = () => {
    setIsFlipped(!isFlipped)
    flipAnim.value = isFlipped ? 0 : 1
  }

  const handleRating = (gotIt: boolean) => {
    let xpGained
    if (gotIt) {
      const newStreak = streak + 1
      setStreak(newStreak)
      xpGained = newStreak >= 3 ? 20 : 10
      setGotRight(prev => prev + 1)
    } else {
      setStreak(0)
      xpGained = 5
    }
    
    setXp(prev => prev + xpGained)
    
    const popupId = Date.now()
    setXpPopup({ amount: xpGained, id: popupId })
    xpScale.value = withSpring(1.2, { damping: 10, stiffness: 200 })
    xpScale.value = withDelay(100, withSpring(1, { damping: 14, stiffness: 100 }))
    
    setTimeout(() => setXpPopup(null), 1500)

    const topic = params.topic || 'Study session'
    const subject = params.subject || HARDCODED_SOLUTION.subject
    recordLearningEvent({
      type: gotIt ? 'flashcard_known' : 'flashcard_miss',
      topic,
      subject,
    }).catch(() => {})
    scheduleRevision(topic, subject, gotIt).catch(() => {})

    if (currentCardIndex < flashcards.length - 1) {
      setCurrentCardIndex(prev => prev + 1)
      setIsFlipped(false)
      flipAnim.value = 0
      setShowHint(false)
    } else {
      setIsComplete(true)
      const topic = params.topic || 'Study session'
      const subject = params.subject || HARDCODED_SOLUTION.subject
      saveFlashcardSet({
        topic,
        subject,
        difficulty: DIFFICULTIES[difficultyIndex] as 'easy' | 'medium' | 'hard',
        flashcards,
      }).catch(() => {})
      saveHistoryItem({ type: 'flashcards', topic, subject }).catch(() => {})
    }
  }

  const restart = () => {
    setCurrentCardIndex(0)
    setIsFlipped(false)
    flipAnim.value = 0
    setShowHint(false)
    setIsComplete(false)
    setGotRight(0)
  }

  const frontStyle = useAnimatedStyle(() => ({
    transform: [{ perspective: 1000 }, { rotateY: `${flipAnim.value * 180}deg` }],
    opacity: flipAnim.value < 0.5 ? 1 : 0,
  }))

  const backStyle = useAnimatedStyle(() => ({
    transform: [{ perspective: 1000 }, { rotateY: `${(flipAnim.value * 180) + 180}deg` }],
    opacity: flipAnim.value >= 0.5 ? 1 : 0,
  }))

  const streakAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: streakScale.value }]
  }))

  const xpAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: xpScale.value }]
  }))

  if (loading) {
    return (
      <View style={[s.root, { paddingTop: insets.top }]}>
        <View style={s.header}>
          <Pressable onPress={() => router.back()} hitSlop={8}>
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </Pressable>
          <View style={{ flex: 1 }} />
        </View>
        <View style={s.loadingContainer}>
          <View style={s.spinner} />
          <UIText style={s.loadingText}>Generating flashcards...</UIText>
        </View>
      </View>
    )
  }

  if (isComplete) {
    return (
      <View style={[s.root, { paddingTop: insets.top }]}>
        <View style={s.header}>
          <Pressable onPress={() => router.back()} hitSlop={8}>
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </Pressable>
          <View style={{ flex: 1 }} />
        </View>

        <View style={s.completionContainer}>
          <UIText style={s.completionTitle}>Session complete! 🎉</UIText>
          <View style={s.completionStats}>
            <View style={s.completionStat}>
              <UIText style={s.completionStatValue}>{gotRight}/{flashcards.length}</UIText>
              <UIText style={s.completionStatLabel}>Got right</UIText>
            </View>
            <View style={s.completionStat}>
              <Animated.View style={xpAnimatedStyle}>
                <UIText style={s.completionStatValue}>⚡ {xp}</UIText>
              </Animated.View>
              <UIText style={s.completionStatLabel}>XP earned</UIText>
            </View>
          </View>
          <View style={s.completionButtons}>
            <Pressable
              onPress={restart}
              style={({ pressed }) => [s.completionButton, s.completionButtonOutline, pressed && { opacity: 0.85 }]}
            >
              <UIText style={s.completionButtonOutlineText}>Review missed cards</UIText>
            </Pressable>
            <Pressable
              onPress={() => router.back()}
              style={({ pressed }) => [s.completionButton, pressed && { opacity: 0.85, transform: [{ scale: 0.98 }] }]}
            >
              <LinearGradient
                colors={[ACCENT, '#0d9488']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={s.completionButtonGrad}
              >
                <UIText style={s.completionButtonText}>Study new cards</UIText>
              </LinearGradient>
            </Pressable>
          </View>
        </View>
      </View>
    )
  }

  return (
    <View style={[s.root, { paddingTop: insets.top }]}>
      <View style={s.header}>
        <Pressable onPress={() => router.back()} hitSlop={8}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </Pressable>
        <View style={s.headerRight}>
          <UIText style={s.progressText}>
            {currentCardIndex + 1} / {flashcards.length} cards
          </UIText>
          <Animated.View style={xpAnimatedStyle}>
            <UIText style={s.xpText}>⚡ {xp} XP</UIText>
          </Animated.View>
          {streak >= 2 && (
            <Animated.View style={streakAnimatedStyle}>
              <UIText style={s.streakText}>🔥 {streak}</UIText>
            </Animated.View>
          )}
        </View>
      </View>

      <View style={s.progressWrap}>
        <View style={s.progressTrack}>
          <View
            style={[
              s.progressFill,
              { width: `${((currentCardIndex + (isFlipped ? 0.5 : 0)) / Math.max(flashcards.length, 1)) * 100}%` },
            ]}
          />
        </View>
        <UIText style={s.topicLabel} numberOfLines={1}>
          {params.topic}
        </UIText>
      </View>

      <View style={s.difficultyContainer}>
        <UIText style={s.difficultyLabel}>Card difficulty</UIText>
        <View style={s.difficultySlider}>
          {DIFFICULTIES.map((_, index) => (
            <Pressable
              key={index}
              onPress={() => {
                setDifficultyIndex(index)
                setCurrentCardIndex(0)
                setIsFlipped(false)
                flipAnim.value = 0
                setShowHint(false)
                setLoading(true)
              }}
              style={[
                s.difficultyDot,
                index === difficultyIndex && s.difficultyDotActive
              ]}
            />
          ))}
        </View>
        <View style={s.difficultyLabels}>
          {DIFFICULTY_LABELS.map((label, index) => (
            <UIText
              key={index}
              style={[
                s.difficultyLabelText,
                index === difficultyIndex && s.difficultyLabelTextActive
              ]}
            >
              {label}
            </UIText>
          ))}
        </View>
      </View>

      <View style={s.cardContainer}>
        <Pressable onPress={flipCard} style={s.cardPressable}>
          <Animated.View style={[s.card, frontStyle]}>
            <LinearGradient
              colors={['rgba(14, 165, 164, 0.08)', 'transparent']}
              start={{ x: 0, y: 0 }}
              end={{ x: 0, y: 1 }}
              style={s.cardGradient}
            >
              <View style={s.cardInner}>
                <View style={s.typeBadge}>
                  <UIText style={s.typeBadgeText}>
                    {currentCard?.type?.toUpperCase()}
                  </UIText>
                </View>
                <UIText style={s.cardFrontText}>{currentCard?.front}</UIText>
                <UIText style={s.tapHint}>Tap to flip</UIText>
              </View>
            </LinearGradient>
          </Animated.View>

          <Animated.View style={[s.card, s.cardBack, backStyle]}>
            <View style={s.cardInner}>
              <UIText style={s.cardBackText}>{currentCard?.back}</UIText>
              {currentCard?.hint && (
                <Pressable
                  onPress={() => setShowHint(!showHint)}
                  style={s.hintButton}
                >
                  <UIText style={s.hintButtonText}>
                    💡 {showHint ? 'Hide hint' : 'Show hint'}
                  </UIText>
                </Pressable>
              )}
              {showHint && currentCard?.hint && (
                <UIText style={s.hintText}>{currentCard.hint}</UIText>
              )}
            </View>
          </Animated.View>
        </Pressable>
      </View>

      {isFlipped && (
        <View style={s.ratingButtons}>
          <Pressable
            onPress={() => handleRating(false)}
            style={({ pressed }) => [s.ratingButton, s.ratingButtonRed, pressed && { opacity: 0.85, transform: [{ scale: 0.97 }] }]}
          >
            <UIText style={s.ratingButtonTextRed}>😅 Review again</UIText>
          </Pressable>
          <Pressable
            onPress={() => handleRating(true)}
            style={({ pressed }) => [s.ratingButton, pressed && { opacity: 0.85, transform: [{ scale: 0.97 }] }]}
          >
            <LinearGradient
              colors={['#4ade80', '#22c55e']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={s.ratingButtonGrad}
            >
              <UIText style={s.ratingButtonText}>✓ Got it!</UIText>
            </LinearGradient>
          </Pressable>
        </View>
      )}

      {xpPopup && (
        <Animated.View style={s.xpPopup}>
          <UIText style={s.xpPopupText}>+{xpPopup.amount} XP</UIText>
        </Animated.View>
      )}
    </View>
  )
}

const s = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: BG,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  progressText: {
    fontSize: 14,
    color: TEXT_SECONDARY,
    fontWeight: '500',
  },
  xpText: {
    fontSize: 14,
    color: '#fff',
    fontWeight: '700',
  },
  streakText: {
    fontSize: 14,
    color: '#fff',
    fontWeight: '700',
  },
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
  loadingText: {
    fontSize: 16,
    color: '#fff',
    fontWeight: '600',
  },
  progressWrap: {
    paddingHorizontal: 20,
    marginBottom: 12,
    gap: 8,
  },
  progressTrack: {
    height: 6,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.1)',
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 999,
    backgroundColor: ACCENT,
  },
  topicLabel: {
    fontSize: 13,
    color: TEXT_SECONDARY,
    fontWeight: '600',
    textAlign: 'center',
  },
  difficultyContainer: {
    paddingHorizontal: 20,
    marginBottom: 24,
    alignItems: 'center',
  },
  difficultyLabel: {
    fontSize: 14,
    color: TEXT_SECONDARY,
    fontWeight: '500',
    marginBottom: 12,
  },
  difficultySlider: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 8,
  },
  difficultyDot: {
    width: 12,
    height: 12,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  difficultyDotActive: {
    width: 20,
    height: 12,
    backgroundColor: ACCENT,
  },
  difficultyLabels: {
    flexDirection: 'row',
    gap: 40,
  },
  difficultyLabelText: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.4)',
    fontWeight: '500',
  },
  difficultyLabelTextActive: {
    color: '#fff',
    fontWeight: '700',
  },
  cardContainer: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  cardPressable: {
    width: '100%',
    minHeight: 300,
  },
  card: {
    position: 'absolute',
    width: '100%',
    minHeight: 300,
    borderRadius: 24,
    backgroundColor: 'rgba(26,26,26,0.8)',
    borderWidth: 1,
    borderColor: 'rgba(14, 165, 164, 0.2)',
    overflow: 'hidden',
    backfaceVisibility: 'hidden',
  },
  cardBack: {
    backgroundColor: '#1a1a1a',
    borderColor: 'rgba(255,255,255,0.08)',
  },
  cardGradient: {
    flex: 1,
  },
  cardInner: {
    flex: 1,
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
  },
  typeBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: 'rgba(14, 165, 164, 0.15)',
  },
  typeBadgeText: {
    fontSize: 11,
    color: ACCENT,
    fontWeight: '700',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  cardFrontText: {
    fontSize: 26,
    color: '#fff',
    fontWeight: '800',
    textAlign: 'center',
    lineHeight: 34,
  },
  tapHint: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.4)',
    fontWeight: '500',
  },
  cardBackText: {
    fontSize: 22,
    color: '#fff',
    fontWeight: '700',
    textAlign: 'center',
    lineHeight: 30,
  },
  hintButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
  },
  hintButtonText: {
    fontSize: 14,
    color: '#fff',
    fontWeight: '600',
  },
  hintText: {
    fontSize: 15,
    color: 'rgba(255,255,255,0.6)',
    fontStyle: 'italic',
    textAlign: 'center',
  },
  ratingButtons: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 20,
  },
  ratingButton: {
    flex: 1,
    borderRadius: 16,
    overflow: 'hidden',
  },
  ratingButtonRed: {
    backgroundColor: 'rgba(248, 113, 113, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(248, 113, 113, 0.3)',
    paddingVertical: 16,
  },
  ratingButtonGrad: {
    paddingVertical: 16,
    alignItems: 'center',
  },
  ratingButtonText: {
    fontSize: 16,
    color: '#fff',
    fontWeight: '700',
  },
  ratingButtonTextRed: {
    fontSize: 16,
    color: '#fca5a5',
    fontWeight: '700',
    textAlign: 'center',
  },
  xpPopup: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: [{ translateX: -50 }, { translateY: -50 }],
    zIndex: 100,
  },
  xpPopupText: {
    fontSize: 28,
    color: ACCENT,
    fontWeight: '800',
  },
  completionContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
    gap: 24,
  },
  completionTitle: {
    fontSize: 32,
    color: '#fff',
    fontWeight: '800',
    textAlign: 'center',
  },
  completionStats: {
    flexDirection: 'row',
    gap: 40,
  },
  completionStat: {
    alignItems: 'center',
    gap: 4,
  },
  completionStatValue: {
    fontSize: 36,
    color: '#fff',
    fontWeight: '800',
  },
  completionStatLabel: {
    fontSize: 14,
    color: TEXT_SECONDARY,
    fontWeight: '500',
  },
  completionButtons: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  completionButton: {
    minWidth: 160,
    borderRadius: 16,
    overflow: 'hidden',
  },
  completionButtonOutline: {
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
    backgroundColor: 'rgba(255,255,255,0.02)',
    paddingVertical: 14,
    paddingHorizontal: 20,
  },
  completionButtonGrad: {
    paddingVertical: 14,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  completionButtonText: {
    fontSize: 16,
    color: '#fff',
    fontWeight: '700',
  },
  completionButtonOutlineText: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.8)',
    fontWeight: '600',
    textAlign: 'center',
  },
})
