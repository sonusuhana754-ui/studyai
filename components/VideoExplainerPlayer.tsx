import { useEffect, useRef, useState, useMemo, useCallback } from 'react'
import { View, Text, StyleSheet, Pressable, Dimensions } from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import { Ionicons } from '@expo/vector-icons'
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withRepeat,
  withSequence,
  Easing,
  FadeIn,
  FadeOut,
  SlideInDown,
} from 'react-native-reanimated'
import { Text as UIText } from '@/components/ui/Text'
import { ACCENT } from '@/lib/theme'
import {
  speakNarration,
  stopNarration,
  estimateSpeechDuration,
  isSpeechAvailable,
} from '@/lib/explainerSpeech'

const { width: SW } = Dimensions.get('window')
const PLAYER_H = Math.min(SW * 1.05, 420)

const BG_COLORS: Record<string, readonly [string, string, string]> = {
  purple: ['#4c1d95', '#7c3aed', '#2e1065'],
  teal: ['#0f766e', '#14b8a6', '#042f2e'],
  amber: ['#b45309', '#fbbf24', '#78350f'],
  coral: ['#c2410c', '#fb923c', '#7c2d12'],
  blue: ['#1d4ed8', '#60a5fa', '#1e3a8a'],
}

export type ExplainerScene = {
  id?: number
  title: string
  narration: string
  key_points?: string[]
  emoji?: string
  bg_color?: string
  duration_seconds: number
}

type Props = {
  title: string
  scenes: ExplainerScene[]
  onComplete: () => void
}

function formatTime(sec: number) {
  const s = Math.max(0, Math.ceil(sec))
  const m = Math.floor(s / 60)
  const r = s % 60
  return `${m}:${r.toString().padStart(2, '0')}`
}

export function VideoExplainerPlayer({ title, scenes, onComplete }: Props) {
  const totalScenes = scenes.length
  const [sceneIndex, setSceneIndex] = useState(0)
  const [isPlaying, setIsPlaying] = useState(true)
  const [voiceOn, setVoiceOn] = useState(true)
  const [voiceReady, setVoiceReady] = useState(false)
  const [elapsedInScene, setElapsedInScene] = useState(0)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const completedRef = useRef(false)

  const finish = useCallback(() => {
    if (completedRef.current) return
    completedRef.current = true
    stopNarration()
    setIsPlaying(false)
    onComplete()
  }, [onComplete])

  const scene = scenes[sceneIndex]
  const narration = scene?.narration ?? ''
  const voiceActive = voiceOn && voiceReady && narration.length > 0
  const speechDuration = useMemo(
    () => (voiceActive ? estimateSpeechDuration(narration) : scene?.duration_seconds ?? 10),
    [voiceActive, narration, scene?.duration_seconds]
  )
  const duration = voiceActive ? speechDuration : (scene?.duration_seconds ?? 10)
  const sceneProgress = Math.min(1, elapsedInScene / duration)
  const totalDuration = useMemo(
    () =>
      scenes.reduce((a, sc) => {
        const n = sc.narration ?? ''
        const d =
          voiceOn && voiceReady && n.length > 0
            ? estimateSpeechDuration(n)
            : (sc.duration_seconds ?? 10)
        return a + d
      }, 0),
    [scenes, voiceOn, voiceReady]
  )
  const elapsedTotal =
    scenes.slice(0, sceneIndex).reduce((a, sc) => a + (sc.duration_seconds ?? 10), 0) + elapsedInScene
  const totalProgress = totalDuration > 0 ? (elapsedTotal / totalDuration) * 100 : 0

  const colors = BG_COLORS[scene?.bg_color ?? 'teal'] ?? BG_COLORS.teal

  const captionWords = useMemo(
    () => (scene?.narration ?? '').split(/\s+/).filter(Boolean),
    [scene?.narration, sceneIndex]
  )
  const visibleWordCount = Math.max(1, Math.floor(sceneProgress * captionWords.length))
  const captionText = captionWords.slice(0, visibleWordCount).join(' ')

  const kenBurns = useSharedValue(1)
  const orb1 = useSharedValue(0)
  const orb2 = useSharedValue(0)
  const pulse = useSharedValue(1)

  useEffect(() => {
    isSpeechAvailable().then(setVoiceReady)
    return () => stopNarration()
  }, [])

  const advanceScene = useCallback(() => {
    setSceneIndex((idx) => {
      if (idx < totalScenes - 1) {
        setElapsedInScene(0)
        return idx + 1
      }
      finish()
      return idx
    })
  }, [totalScenes, finish])

  useEffect(() => {
    if (!isPlaying || !voiceActive) {
      stopNarration()
      return
    }
    speakNarration(narration, { onDone: advanceScene })
    return () => stopNarration()
  }, [sceneIndex, isPlaying, voiceActive, narration, advanceScene])

  useEffect(() => {
    kenBurns.value = 1
    kenBurns.value = withTiming(1.12, { duration: (duration || 10) * 1000, easing: Easing.linear })
    orb1.value = withRepeat(withTiming(1, { duration: 4000, easing: Easing.inOut(Easing.sin) }), -1, true)
    orb2.value = withRepeat(withTiming(1, { duration: 5500, easing: Easing.inOut(Easing.sin) }), -1, true)
    pulse.value = withRepeat(
      withSequence(withTiming(1.15, { duration: 600 }), withTiming(1, { duration: 600 })),
      -1,
      true
    )
    setElapsedInScene(0)
  }, [sceneIndex, duration])

  useEffect(() => {
    if (isPlaying && scene) {
      timerRef.current = setInterval(() => {
        setElapsedInScene((prev) => {
          const next = prev + 0.1
          if (voiceActive) {
            return Math.min(next, duration)
          }
          if (next >= duration) {
            if (sceneIndex < totalScenes - 1) {
              setSceneIndex((i) => i + 1)
              return 0
            }
            finish()
            return duration
          }
          return next
        })
      }, 100)
    } else if (timerRef.current) {
      clearInterval(timerRef.current)
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [isPlaying, sceneIndex, duration, scene, totalScenes, finish, voiceActive])

  const goScene = (delta: number) => {
    const next = sceneIndex + delta
    if (next < 0 || next >= totalScenes) return
    stopNarration()
    setSceneIndex(next)
    setElapsedInScene(0)
  }

  const togglePlay = () => {
    setIsPlaying((playing) => {
      if (playing) stopNarration()
      return !playing
    })
  }

  const toggleVoice = () => {
    stopNarration()
    setVoiceOn((v) => !v)
    setElapsedInScene(0)
  }

  const visualStyle = useAnimatedStyle(() => ({
    transform: [{ scale: kenBurns.value }],
  }))
  const orb1Style = useAnimatedStyle(() => ({
    transform: [
      { translateX: orb1.value * 24 },
      { translateY: orb1.value * -18 },
      { scale: 1 + orb1.value * 0.2 },
    ],
  }))
  const orb2Style = useAnimatedStyle(() => ({
    transform: [
      { translateX: orb2.value * -20 },
      { translateY: orb2.value * 22 },
      { scale: 1 + orb2.value * 0.15 },
    ],
  }))
  const pulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulse.value }],
    opacity: 0.35 + pulse.value * 0.15,
  }))

  if (!scene) return null

  return (
    <View style={st.wrap}>
      <View style={st.player}>
        <LinearGradient colors={colors} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={StyleSheet.absoluteFill} />

        <Animated.View style={[st.orb, st.orbA, orb1Style]} />
        <Animated.View style={[st.orb, st.orbB, orb2Style]} />
        <Animated.View style={[st.orb, st.orbC, pulseStyle]} />

        <LinearGradient
          colors={['transparent', 'rgba(0,0,0,0.55)', 'rgba(0,0,0,0.85)']}
          style={st.vignetteBottom}
        />
        <LinearGradient
          colors={['rgba(0,0,0,0.45)', 'transparent']}
          style={st.vignetteTop}
        />

        <View style={st.topBar}>
          <View style={st.liveBadge}>
            <View style={st.liveDot} />
            <UIText style={st.liveText}>AI LESSON</UIText>
          </View>
          <UIText style={st.topTime}>
            {formatTime(elapsedTotal)} / {formatTime(totalDuration)}
          </UIText>
        </View>

        <View style={st.visualStage}>
          <Animated.View style={[st.emojiWrap, visualStyle]} key={`emoji-${sceneIndex}`}>
            <Text style={st.emoji}>{scene.emoji || '🎬'}</Text>
          </Animated.View>
        </View>

        <Animated.View
          entering={SlideInDown.duration(400).springify()}
          style={st.lowerThird}
          key={`title-${sceneIndex}`}
        >
          <UIText style={st.sceneChapter}>
            Scene {sceneIndex + 1} · {title}
          </UIText>
          <UIText style={st.sceneTitle}>{scene.title}</UIText>
        </Animated.View>

        <View style={st.subtitleBox}>
          <UIText style={st.subtitleText}>
            {captionText}
            {visibleWordCount < captionWords.length && (
              <UIText style={st.subtitleCursor}> |</UIText>
            )}
          </UIText>
        </View>

        {isPlaying && (
          <Animated.View entering={FadeIn} exiting={FadeOut} style={st.waveRow}>
            {[0, 1, 2, 3, 4].map((i) => (
              <Animated.View key={i} style={[st.waveBar, { height: 8 + (i % 3) * 6 }]} />
            ))}
            <UIText style={st.narratingLabel}>
              {voiceActive ? 'Speaking…' : 'Playing…'}
            </UIText>
          </Animated.View>
        )}
      </View>

      <View style={st.timelineWrap}>
        <View style={st.timelineTrack}>
          <View style={[st.timelineFill, { width: `${totalProgress}%` }]} />
        </View>
        <View style={st.sceneDots}>
          {scenes.map((_, i) => (
            <Pressable
              key={i}
              onPress={() => {
                stopNarration()
                setSceneIndex(i)
                setElapsedInScene(0)
              }}
              hitSlop={6}
            >
              <View
                style={[
                  st.dot,
                  i === sceneIndex && st.dotActive,
                  i < sceneIndex && st.dotDone,
                ]}
              />
            </Pressable>
          ))}
        </View>
      </View>

      <View style={st.controls}>
        <Pressable
          onPress={() => goScene(-1)}
          disabled={sceneIndex === 0}
          style={[st.ctrlBtn, sceneIndex === 0 && st.ctrlDisabled]}
        >
          <Ionicons name="play-skip-back" size={22} color="#fff" />
        </Pressable>

        <Pressable onPress={togglePlay} style={st.playMain}>
          <LinearGradient colors={[ACCENT, '#0d9488']} style={st.playMainGrad}>
            <Ionicons name={isPlaying ? 'pause' : 'play'} size={28} color="#fff" />
          </LinearGradient>
        </Pressable>

        <Pressable
          onPress={() => {
            if (sceneIndex >= totalScenes - 1) finish()
            else goScene(1)
          }}
          style={st.ctrlBtn}
        >
          <Ionicons name="play-skip-forward" size={22} color="#fff" />
        </Pressable>

        {voiceReady && (
          <Pressable onPress={toggleVoice} style={[st.voiceBtn, voiceOn && st.voiceBtnOn]}>
            <Ionicons
              name={voiceOn ? 'volume-high' : 'volume-mute'}
              size={22}
              color={voiceOn ? ACCENT : '#888'}
            />
          </Pressable>
        )}
      </View>

      {!isPlaying && scene.key_points && scene.key_points.length > 0 && (
        <Animated.View entering={FadeIn.duration(300)} style={st.chipsRow}>
          {scene.key_points.map((pt, i) => (
            <View key={i} style={st.chip}>
              <UIText style={st.chipText}>{pt}</UIText>
            </View>
          ))}
        </Animated.View>
      )}
    </View>
  )
}

const st = StyleSheet.create({
  wrap: { gap: 12 },
  player: {
    width: '100%',
    height: PLAYER_H,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: '#000',
  },
  orb: {
    position: 'absolute',
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.12)',
  },
  orbA: { width: 180, height: 180, top: -40, right: -30 },
  orbB: { width: 140, height: 140, bottom: 80, left: -40 },
  orbC: { width: 100, height: 100, top: '40%', right: '20%' },
  vignetteBottom: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: '55%',
  },
  vignetteTop: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    height: 80,
  },
  topBar: {
    position: 'absolute',
    top: 12,
    left: 14,
    right: 14,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    zIndex: 2,
  },
  liveBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
    backgroundColor: 'rgba(0,0,0,0.45)',
  },
  liveDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#ef4444',
  },
  liveText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#fff',
    letterSpacing: 1,
  },
  topTime: {
    fontSize: 12,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.85)',
    fontVariant: ['tabular-nums'],
  },
  visualStage: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 36,
    paddingBottom: 100,
  },
  emojiWrap: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  emoji: {
    fontSize: 96,
    textShadowColor: 'rgba(0,0,0,0.4)',
    textShadowOffset: { width: 0, height: 8 },
    textShadowRadius: 24,
  },
  lowerThird: {
    position: 'absolute',
    left: 14,
    right: 14,
    bottom: 72,
    zIndex: 2,
  },
  sceneChapter: {
    fontSize: 11,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.65)',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  sceneTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#fff',
    lineHeight: 28,
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 8,
  },
  subtitleBox: {
    position: 'absolute',
    left: 12,
    right: 12,
    bottom: 14,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: 'rgba(0,0,0,0.72)',
    zIndex: 3,
  },
  subtitleText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#fff',
    lineHeight: 22,
    textAlign: 'center',
  },
  subtitleCursor: {
    color: ACCENT,
    fontWeight: '800',
  },
  waveRow: {
    position: 'absolute',
    top: 48,
    right: 14,
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 3,
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: 'rgba(0,0,0,0.35)',
  },
  waveBar: {
    width: 3,
    borderRadius: 2,
    backgroundColor: ACCENT,
  },
  narratingLabel: {
    marginLeft: 6,
    fontSize: 10,
    color: 'rgba(255,255,255,0.8)',
    fontWeight: '600',
  },
  timelineWrap: { paddingHorizontal: 4, gap: 8 },
  timelineTrack: {
    height: 4,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.12)',
    overflow: 'hidden',
  },
  timelineFill: {
    height: '100%',
    borderRadius: 999,
    backgroundColor: ACCENT,
  },
  sceneDots: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  dotActive: {
    width: 20,
    backgroundColor: ACCENT,
  },
  dotDone: { backgroundColor: 'rgba(255,255,255,0.5)' },
  controls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 20,
    paddingVertical: 4,
    flexWrap: 'wrap',
  },
  voiceBtn: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255,255,255,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 4,
  },
  voiceBtnOn: {
    backgroundColor: 'rgba(14, 165, 164, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(14, 165, 164, 0.35)',
  },
  ctrlBtn: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255,255,255,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  ctrlDisabled: { opacity: 0.35 },
  playMain: { borderRadius: 36, overflow: 'hidden' },
  playMainGrad: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    justifyContent: 'center',
    paddingHorizontal: 8,
  },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  chipText: { fontSize: 12, color: 'rgba(255,255,255,0.75)', fontWeight: '500' },
})
