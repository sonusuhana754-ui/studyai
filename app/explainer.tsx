
import { useState, useEffect, useCallback } from 'react'
import { View, Text, StyleSheet, Pressable, ScrollView } from 'react-native'
import { router, useLocalSearchParams } from 'expo-router'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { LinearGradient } from 'expo-linear-gradient'
import { Ionicons } from '@expo/vector-icons'
import { Text as UIText } from '@/components/ui/Text'
import { Card } from '@/components/ui/Card'
import { VideoExplainerPlayer } from '@/components/VideoExplainerPlayer'
import { ACCENT, BG, TEXT_SECONDARY } from '@/lib/theme'
import { generateExplainer, isGroqRateLimitError } from '@/lib/gemini'
import { saveHistoryItem } from '@/lib/history'

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: BG },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
    flex: 1,
    textAlign: 'center',
    marginHorizontal: 12,
  },
  body: { paddingHorizontal: 16, paddingBottom: 24, gap: 8 },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 20,
    padding: 24,
  },
  spinner: {
    width: 48,
    height: 48,
    borderRadius: 999,
    borderWidth: 4,
    borderColor: 'rgba(255,255,255,0.1)',
    borderTopColor: ACCENT,
  },
  loadingText: { fontSize: 16, color: '#fff', fontWeight: '600', textAlign: 'center' },
  loadingSub: { fontSize: 14, color: TEXT_SECONDARY, textAlign: 'center' },
  errorEmoji: { fontSize: 48 },
  retryBtn: {
    marginTop: 16,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  retryBtnSecondary: {
    marginTop: 8,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
  },
  retryBtnText: { color: '#fff', fontWeight: '600' },
  fallbackBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    padding: 12,
    borderRadius: 12,
    backgroundColor: 'rgba(251,191,36,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(251,191,36,0.25)',
  },
  fallbackBannerText: {
    flex: 1,
    fontSize: 13,
    color: '#fde68a',
    lineHeight: 18,
  },
  hookCard: {
    backgroundColor: 'rgba(26,26,26,0.7)',
    padding: 14,
    gap: 4,
  },
  hookLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: TEXT_SECONDARY,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  hookText: { fontSize: 14, color: 'rgba(255,255,255,0.85)', lineHeight: 20 },
  completeWrap: { flex: 1, padding: 24, gap: 16, justifyContent: 'center' },
  completeEmoji: { fontSize: 56, textAlign: 'center' },
  completeTitle: { fontSize: 24, fontWeight: '800', color: '#fff', textAlign: 'center' },
  summaryCard: { padding: 16 },
  summaryText: { fontSize: 15, color: '#fff', lineHeight: 22 },
  completeActions: { gap: 12, marginTop: 8 },
  completeBtnOutline: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    backgroundColor: 'rgba(255,255,255,0.04)',
  },
  completeBtnOutlineText: { fontSize: 16, fontWeight: '600', color: '#fff' },
  completeBtnPrimary: { borderRadius: 14, overflow: 'hidden' },
  completeBtnGrad: { paddingVertical: 16, alignItems: 'center' },
  completeBtnPrimaryText: { fontSize: 16, fontWeight: '700', color: '#000' },
})

export default function ExplainerScreen() {
  const insets = useSafeAreaInsets()
  const params = useLocalSearchParams<{ topic?: string; subject?: string; context?: string }>()

  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [isFallbackLesson, setIsFallbackLesson] = useState(false)
  const [explainer, setExplainer] = useState<any>(null)
  const [showComplete, setShowComplete] = useState(false)

  const loadLesson = async () => {
    if (!params.topic || !params.subject || !params.context) {
      setLoadError('Missing topic or subject.')
      setLoading(false)
      return
    }
    setLoading(true)
    setLoadError(null)
    setIsFallbackLesson(false)
    setShowComplete(false)
    try {
      const data = await generateExplainer(
        params.topic as string,
        params.subject as string,
        params.context as string
      )
      setExplainer(data)
      setIsFallbackLesson(!!data._fallback)
      if (!data._fallback) {
        await saveHistoryItem({
          type: 'video_explainer',
          topic: params.topic as string,
          subject: params.subject as string,
        })
      }
    } catch (error) {
      console.error(error)
      if (isGroqRateLimitError(error)) {
        setLoadError('Groq rate limit — wait about a minute, then tap Retry.')
      } else {
        setLoadError(
          error instanceof Error ? error.message : 'Could not generate the explainer.'
        )
      }
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadLesson()
  }, [params.topic, params.subject, params.context])

  const handleComplete = useCallback(() => setShowComplete(true), [])

  if (loading) {
    return (
      <View style={[s.root, { paddingTop: insets.top }]}>
        <View style={s.header}>
          <Pressable onPress={() => router.back()} hitSlop={8}>
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </Pressable>
          <UIText style={s.headerTitle}>Preparing video…</UIText>
          <View style={{ width: 24 }} />
        </View>
        <View style={s.loadingContainer}>
          <View style={s.spinner} />
          <UIText style={s.loadingText}>Generating your lesson</UIText>
          <UIText style={s.loadingSub}>Writing scenes, narration & visuals</UIText>
        </View>
      </View>
    )
  }

  if (loadError || !explainer?.scenes?.length) {
    return (
      <View style={[s.root, { paddingTop: insets.top }]}>
        <View style={s.header}>
          <Pressable onPress={() => router.back()} hitSlop={8}>
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </Pressable>
          <View style={{ flex: 1 }} />
        </View>
        <View style={s.loadingContainer}>
          <Text style={s.errorEmoji}>⚠️</Text>
          <UIText style={s.loadingText}>{loadError ?? 'Something went wrong'}</UIText>
          <Pressable onPress={loadLesson} style={s.retryBtn}>
            <UIText style={s.retryBtnText}>Retry</UIText>
          </Pressable>
          <Pressable onPress={() => router.back()} style={s.retryBtnSecondary}>
            <UIText style={s.retryBtnText}>Go back</UIText>
          </Pressable>
        </View>
      </View>
    )
  }

  if (showComplete) {
    return (
      <View style={[s.root, { paddingTop: insets.top }]}>
        <View style={s.header}>
          <Pressable onPress={() => router.back()} hitSlop={8}>
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </Pressable>
          <UIText style={s.headerTitle} numberOfLines={1}>Lesson complete</UIText>
          <View style={{ width: 24 }} />
        </View>
        <View style={s.completeWrap}>
          <Text style={s.completeEmoji}>🎬</Text>
          <UIText style={s.completeTitle}>{explainer?.title}</UIText>
          <Card style={s.summaryCard}>
            <UIText style={s.summaryText}>{explainer?.summary}</UIText>
          </Card>
          <View style={s.completeActions}>
            <Pressable
              onPress={() =>
                router.push({ pathname: '/quiz', params: { topic: params.topic, subject: params.subject } })
              }
              style={s.completeBtnOutline}
            >
              <Ionicons name="help-circle" size={20} color={ACCENT} />
              <UIText style={s.completeBtnOutlineText}>Take a quiz</UIText>
            </Pressable>
            <Pressable
              onPress={() =>
                router.push({ pathname: '/flashcards-topic', params: { topic: params.topic } })
              }
              style={s.completeBtnOutline}
            >
              <Ionicons name="flash" size={20} color="#fbbf24" />
              <UIText style={s.completeBtnOutlineText}>Flashcards</UIText>
            </Pressable>
            <Pressable onPress={() => router.back()} style={s.completeBtnPrimary}>
              <LinearGradient colors={[ACCENT, '#0d9488']} style={s.completeBtnGrad}>
                <UIText style={s.completeBtnPrimaryText}>Done</UIText>
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
        <UIText style={s.headerTitle} numberOfLines={1}>
          {explainer?.title || 'Video lesson'}
        </UIText>
        <Pressable onPress={handleComplete} hitSlop={8}>
          <Ionicons name="checkmark-done" size={22} color={ACCENT} />
        </Pressable>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.body}>
        {isFallbackLesson && (
          <View style={s.fallbackBanner}>
            <Ionicons name="information-circle" size={18} color="#fbbf24" />
            <UIText style={s.fallbackBannerText}>
              Outline mode — wait a minute and regenerate for the full AI-narrated lesson.
            </UIText>
          </View>
        )}

        {explainer?.hook ? (
          <Card style={s.hookCard}>
            <UIText style={s.hookLabel}>About this lesson</UIText>
            <UIText style={s.hookText}>{explainer.hook}</UIText>
          </Card>
        ) : null}

        <VideoExplainerPlayer
          title={explainer.title}
          scenes={explainer.scenes}
          onComplete={handleComplete}
        />

        <UIText style={{ fontSize: 12, color: TEXT_SECONDARY, textAlign: 'center', marginTop: 4 }}>
          Voice narration plays automatically · Tap 🔊 to mute · Pause for key points
        </UIText>
      </ScrollView>
    </View>
  )
}
