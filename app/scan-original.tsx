import React, { useState, useRef } from 'react'
import { 
  View, 
  Text, 
  TouchableOpacity, 
  ScrollView, 
  Image, 
  TextInput, 
  StyleSheet, 
  Alert, 
  ActivityIndicator, 
  Platform, 
  StatusBar, 
} from 'react-native'
import * as ImagePicker from 'expo-image-picker'
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context'
import { router } from 'expo-router'
import { solveWithGemini, Solution, SocraticResponse } from '../lib/gemini'
import { saveHistoryItem } from '@/lib/history'
import { recordProblemSolved } from '@/lib/gamification'
import Animated, {
  FadeIn,
  FadeInDown,
  FadeInUp,
} from 'react-native-reanimated'
import * as Haptics from 'expo-haptics'

type Screen = 'input' | 'preview' | 'solving' | 'solution'
type Mode = 'answer' | 'socratic'
type InputTab = 'camera' | 'text'

const SOLVING_MESSAGES = [
  'Analyzing your problem...',
  'Working through each step...',
  'Building the explanation...',
  'Almost ready...',
]

const SUBJECT_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  math:       { bg: '#1a2a3a', text: '#60a5fa', border: '#1e3a5f' },
  physics:    { bg: '#2a1a3a', text: '#a78bfa', border: '#3a1f5f' },
  chemistry:  { bg: '#1a3a2a', text: '#34d399', border: '#1f5f3a' },
  history:    { bg: '#3a2a0a', text: '#fbbf24', border: '#5f3f0f' },
  biology:    { bg: '#1a3a20', text: '#6ee7b7', border: '#1f5f30' },
  economics:  { bg: '#3a200a', text: '#fb923c', border: '#5f300f' },
  default:    { bg: '#1f1f1f', text: '#9ca3af', border: '#333' },
}

const DIFF_COLORS = {
  easy:   { bg: '#0f2a0f', text: '#4ade80', border: '#1a4a1a' },
  medium: { bg: '#2a1f00', text: '#fbbf24', border: '#4a3500' },
  hard:   { bg: '#2a0f0f', text: '#f87171', border: '#4a1a1a' },
}

export default function ScanScreen() {
  const insets = useSafeAreaInsets()
  const [screen, setScreen] = useState<Screen>('input')
  const [inputTab, setInputTab] = useState<InputTab>('camera')
  const [mode, setMode] = useState<Mode>('answer')
  const [image, setImage] = useState<{ uri: string; base64: string } | null>(null)
  const [typedText, setTypedText] = useState('')
  const [solution, setSolution] = useState<Solution | null>(null)
  const [socratic, setSocratic] = useState<SocraticResponse | null>(null)
  const [solvingMsg, setSolvingMsg] = useState(0)
  const [error, setError] = useState('')
  const [hintsRevealed, setHintsRevealed] = useState(0)
  const msgTimer = useRef<ReturnType<typeof setInterval> | null>(null)

  const handlePress = (action: () => void) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)
    action()
  }

  // ─── Image picker ────────────────────────────────────────
  const pickFromCamera = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync()
    if (status !== 'granted') {
      Alert.alert('Camera permission needed', 'Please allow camera access to scan problems.')
      return
    }
    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.85,
      base64: true,
      allowsEditing: true,
      aspect: [4, 3],
    })
    if (!result.canceled && result.assets[0].base64) {
      setImage({ uri: result.assets[0].uri, base64: result.assets[0].base64 })
      setScreen('preview')
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
    }
  }

  const pickFromGallery = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync()
    if (status !== 'granted') {
      Alert.alert('Gallery permission needed', 'Please allow gallery access.')
      return
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.85,
      base64: true,
      allowsEditing: true,
      aspect: [4, 3],
    })
    if (!result.canceled && result.assets[0].base64) {
      setImage({ uri: result.assets[0].uri, base64: result.assets[0].base64 })
      setScreen('preview')
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
    }
  }

  const startSolvingMessages = () => {
    let i = 0
    msgTimer.current = setInterval(() => {
      i = (i + 1) % SOLVING_MESSAGES.length
      setSolvingMsg(i)
    }, 2000)
  }

  const stopSolvingMessages = () => {
    if (msgTimer.current) clearInterval(msgTimer.current)
  }

  // ─── Solve ───────────────────────────────────────────────
  const solve = async () => {
    const text = typedText.trim()
    if (!text && !image) return

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy)
    setScreen('solving')
    setSolvingMsg(0)
    setError('')
    setSolution(null)
    setSocratic(null)
    startSolvingMessages()

    try {
      const result = await solveWithGemini(text, image?.base64, mode)
      stopSolvingMessages()

      if (mode === 'answer') {
        setSolution(result as Solution)
        await saveHistoryItem({
          type: 'scan',
          topic: (result as Solution).topic,
          subject: (result as Solution).subject,
        })
        await recordProblemSolved()
      } else {
        setSocratic(result as SocraticResponse)
        await saveHistoryItem({
          type: 'scan',
          topic: (result as SocraticResponse).topic,
          subject: (result as SocraticResponse).subject,
        })
        await recordProblemSolved()
      }
      setHintsRevealed(0)
      setScreen('solution')
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
    } catch (err: any) {
      stopSolvingMessages()
      setError(err.message || 'Something went wrong')
      setScreen('preview')
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error)
    }
  }

  const reset = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
    setScreen('input')
    setImage(null)
    setTypedText('')
    setSolution(null)
    setSocratic(null)
    setError('')
  }

  // ─── SCREEN: INPUT ───────────────────────────────────────
  if (screen === 'input') {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="light-content" />

        {/* Header */}
        <Animated.View entering={FadeInDown.duration(600).springify()} style={styles.header}>
          <TouchableOpacity onPress={() => handlePress(() => router.back())} style={styles.backBtn}>
            <Text style={styles.backIcon}>←</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Scan Problem</Text>
          <View style={{ width: 36 }} />
        </Animated.View>

        {/* Input tab toggle */}
        <Animated.View entering={FadeInDown.duration(600).delay(200).springify()} style={styles.tabRow}>
          <TouchableOpacity
            style={[styles.tab, inputTab === 'camera' && styles.tabActive]}
            onPress={() => handlePress(() => setInputTab('camera'))}
          >
            <Text style={[styles.tabText, inputTab === 'camera' && styles.tabTextActive]}>
              📷  Camera / Upload
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, inputTab === 'text' && styles.tabActive]}
            onPress={() => handlePress(() => setInputTab('text'))}
          >
            <Text style={[styles.tabText, inputTab === 'text' && styles.tabTextActive]}>
              ✏️  Type it
            </Text>
          </TouchableOpacity>
        </Animated.View>

        {/* Camera options */}
        {inputTab === 'camera' && (
          <Animated.View entering={FadeInUp.duration(600).delay(300).springify()} style={styles.cameraOptions}>
            <View style={styles.cameraHero}>
              <Text style={styles.cameraHeroEmoji}>📐</Text>
              <Text style={styles.cameraHeroTitle}>Point at any problem</Text>
              <Text style={styles.cameraHeroSub}>
                Math, science, history, economics — any subject
              </Text>
            </View>

            <TouchableOpacity 
              style={styles.primaryBtn} 
              onPress={() => handlePress(pickFromCamera)}
            >
              <Text style={styles.primaryBtnText}>📷   Open Camera</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.secondaryBtn} 
              onPress={() => handlePress(pickFromGallery)}
            >
              <Text style={styles.secondaryBtnText}>🖼   Choose from Gallery</Text>
            </TouchableOpacity>
          </Animated.View>
        )}

        {/* Text input */}
        {inputTab === 'text' && (
          <Animated.View entering={FadeInUp.duration(600).delay(300).springify()} style={styles.textInputArea}>
            <TextInput
              style={styles.problemInput}
              value={typedText}
              onChangeText={setTypedText}
              placeholder="Type your problem here..."
              placeholderTextColor="#444"
              multiline
              textAlignVertical="top"
            />

            {/* Quick examples */}
            <Text style={styles.examplesLabel}>Try an example:</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.examplesRow}>
              {[
                'Solve: 2x² + 5x - 3 = 0',
                'When did the Mughal Empire fall?',
                'Balance: Fe + O₂ → Fe₂O₃',
                'Newton\'s second law explained',
                'Compound interest on ₹10,000 at 8% for 3 years',
              ].map((ex, i) => (
                <TouchableOpacity key={i} style={styles.exampleChip} onPress={() => handlePress(() => setTypedText(ex))}>
                  <Text style={styles.exampleText}>{ex}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            {/* Mode */}
            <View style={styles.modeRow}>
              <TouchableOpacity
                style={[styles.modeBtn, mode === 'answer' && styles.modeBtnActive]}
                onPress={() => handlePress(() => setMode('answer'))}
              >
                <Text style={[styles.modeBtnText, mode === 'answer' && styles.modeBtnTextActive]}>
                  ⚡ Quick Answer
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modeBtn, mode === 'socratic' && styles.modeBtnActive]}
                onPress={() => handlePress(() => setMode('socratic'))}
              >
                <Text style={[styles.modeBtnText, mode === 'socratic' && styles.modeBtnTextActive]}>
                  🤔 Learn Mode
                </Text>
              </TouchableOpacity>
            </View>
            {mode === 'socratic' && (
              <Text style={styles.modeHint}>
                Learn mode guides you with questions instead of revealing the answer
              </Text>
            )}

            <TouchableOpacity
              style={[styles.primaryBtn, !typedText.trim() && styles.btnDisabled]}
              onPress={() => {
                if (typedText.trim()) {
                  setImage(null)
                  solve()
                }
              }}
              disabled={!typedText.trim()}
            >
              <Text style={styles.primaryBtnText}>Solve this →</Text>
            </TouchableOpacity>

            {error ? <Text style={styles.errorText}>{error}</Text> : null}
          </Animated.View>
        )}
      </SafeAreaView>
    )
  }

  // ─── SCREEN: PREVIEW ────────────────────────────────────
  if (screen === 'preview') {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="light-content" />
        <Animated.View entering={FadeInDown.duration(600).springify()} style={styles.header}>
          <TouchableOpacity onPress={() => handlePress(reset)} style={styles.backBtn}>
            <Text style={styles.backIcon}>←</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Ready to solve</Text>
          <TouchableOpacity onPress={() => handlePress(reset)}>
            <Text style={[styles.backIcon, { color: '#666' }]}>Retake</Text>
          </TouchableOpacity>
        </Animated.View>

        {image && (
          <Animated.Image
            entering={FadeIn.duration(600)}
            source={{ uri: image.uri }}
            style={styles.previewImage}
            resizeMode="cover"
          />
        )}

        <Animated.View entering={FadeInUp.duration(600).delay(300).springify()} style={styles.previewBottom}>
          {error ? <Text style={styles.errorText}>{error}</Text> : null}

          <View style={styles.modeRow}>
            <TouchableOpacity
              style={[styles.modeBtn, mode === 'answer' && styles.modeBtnActive]}
              onPress={() => handlePress(() => setMode('answer'))}
            >
              <Text style={[styles.modeBtnText, mode === 'answer' && styles.modeBtnTextActive]}>
                ⚡ Quick Answer
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.modeBtn, mode === 'socratic' && styles.modeBtnActive]}
              onPress={() => handlePress(() => setMode('socratic'))}
            >
              <Text style={[styles.modeBtnText, mode === 'socratic' && styles.modeBtnTextActive]}>
                🤔 Learn Mode
              </Text>
            </TouchableOpacity>
          </View>
          {mode === 'socratic' && (
            <Text style={styles.modeHint}>AI will ask guiding questions, not reveal the answer</Text>
          )}

          <TouchableOpacity style={styles.primaryBtn} onPress={() => handlePress(solve)}>
            <Text style={styles.primaryBtnText}>✦  Solve this problem</Text>
          </TouchableOpacity>
        </Animated.View>
      </SafeAreaView>
    )
  }

  // ─── SCREEN: SOLVING ────────────────────────────────────
  if (screen === 'solving') {
    return (
      <SafeAreaView style={[styles.container, styles.centerContent]}>
        <StatusBar barStyle="light-content" />
        <Animated.Text
          entering={FadeIn.duration(600)}
          style={styles.solveEmoji}
        >
          ✦
        </Animated.Text>
        <ActivityIndicator size="large" color="#14b8a6" style={{ marginTop: 16 }} />
        <Animated.Text
          key={solvingMsg}
          entering={FadeIn.duration(400)}
          style={styles.solvingTitle}
        >
          {SOLVING_MESSAGES[solvingMsg]}
        </Animated.Text>
        <Text style={styles.solvingSubtitle}>AI is analyzing your problem</Text>
        <View style={styles.dotRow}>
          {SOLVING_MESSAGES.map((_, i) => (
            <View key={i} style={[styles.dot, i === solvingMsg && styles.dotActive]} />
          ))}
        </View>
      </SafeAreaView>
    )
  }

  // ─── SCREEN: SOLUTION ────────────────────────────────────
  if (screen === 'solution') {
    const data = solution || socratic;
    if (!data) return null;
    const subj = (data.subject || 'other').toLowerCase();
    const subjColor = SUBJECT_COLORS[subj] || SUBJECT_COLORS.default
    const diff = (data.difficulty || 'medium') as 'easy' | 'medium' | 'hard'
    const diffColor = DIFF_COLORS[diff]

    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="light-content" />

        {/* Header */}
        <Animated.View entering={FadeInDown.duration(600).springify()} style={styles.header}>
          <TouchableOpacity onPress={() => handlePress(reset)} style={styles.backBtn}>
            <Text style={styles.backIcon}>←</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Solution</Text>
          <View style={{ width: 36 }} />
        </Animated.View>

        <ScrollView style={styles.scrollArea} showsVerticalScrollIndicator={false}>

          {/* Subject + difficulty pills */}
          <Animated.View
            entering={FadeInDown.duration(600).delay(200).springify()}
            style={[styles.pillRow, { paddingHorizontal: 16, paddingTop: 8 }]}
          >
            <View style={[styles.pill, { backgroundColor: subjColor.bg, borderColor: subjColor.border }]}>
              <Text style={[styles.pillText, { color: subjColor.text }]}>
                {(data.subject || 'General').charAt(0).toUpperCase() + (data.subject || '').slice(1)}
              </Text>
            </View>
            {solution && (
              <View style={[styles.pill, { backgroundColor: diffColor.bg, borderColor: diffColor.border }]}>
                <Text style={[styles.pillText, { color: diffColor.text }]}>
                  {diff.charAt(0).toUpperCase() + diff.slice(1)}
                </Text>
              </View>
            )}
          </Animated.View>

          <Animated.Text
            entering={FadeInDown.duration(600).delay(300).springify()}
            style={styles.topicTitle}
          >
            {data?.topic ?? ''}
          </Animated.Text>

          {/* ── ANSWER MODE ── */}
          {solution && (
            <>
              {/* Steps */}
              <Text style={styles.sectionLabel}>{solution?.steps?.length ?? 0} steps</Text>
              {solution?.steps?.map((step, i) => (
                <Animated.View
                  key={i}
                  entering={FadeInUp.duration(600).delay(400 + i * 100).springify()}
                  style={styles.stepCard}
                >
                  <View style={styles.stepNumCircle}>
                    <Text style={styles.stepNumText}>{step.step}</Text>
                  </View>
                  <View style={styles.stepContent}>
                    <Text style={styles.stepAction}>{step.action}</Text>
                    <Text style={styles.stepExplain}>{step.explanation}</Text>
                    {step.math && (
                      <View style={styles.mathBox}>
                        <Text style={styles.mathText}>{step.math}</Text>
                      </View>
                    )}
                  </View>
                </Animated.View>
              ))}

              {/* Final answer */}
              <Animated.View
                entering={FadeInUp.duration(600).delay(400 + (solution?.steps?.length || 0) * 100).springify()}
                style={styles.answerCard}
              >
                <Text style={styles.answerLabel}>Final answer</Text>
                <Text style={styles.answerValue}>{solution.answer}</Text>
              </Animated.View>

              {/* Concept */}
              <Animated.View
                entering={FadeInUp.duration(600).delay(500 + (solution?.steps?.length || 0) * 100).springify()}
                style={styles.conceptCard}
              >
                <Text style={styles.conceptLabel}>Key concept</Text>
                <Text style={styles.conceptText}>{solution.concept}</Text>
              </Animated.View>

              {/* Fun fact */}
              {solution.fun_fact && (
                <Animated.View
                  entering={FadeInUp.duration(600).delay(600 + (solution?.steps?.length || 0) * 100).springify()}
                  style={styles.funFactCard}
                >
                  <Text style={styles.funFactLabel}>💡 Did you know?</Text>
                  <Text style={styles.funFactText}>{solution.fun_fact}</Text>
                </Animated.View>
              )}

              {/* Actions */}
              <Animated.View
                entering={FadeInUp.duration(600).delay(700 + (solution?.steps?.length || 0) * 100).springify()}
                style={styles.actionRow}
              >
                <TouchableOpacity
                  style={styles.actionBtnPurple}
                  onPress={() => {
                    const params = new URLSearchParams({
                      topic: solution.topic,
                      subject: solution.subject,
                    })
                    router.push(`/explainer?${params.toString()}` as any)
                  }}
                >
                  <Text style={styles.actionBtnPurpleText}>🎬 Video Explainer</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.actionBtnTeal}
                  onPress={() => {
                    router.push({
                      pathname: '/flashcards' as any,
                      params: {
                        topic: solution.topic,
                        subject: solution.subject,
                        solution: JSON.stringify(solution)
                      }
                    })
                  }}
                >
                  <Text style={styles.actionBtnTealText}>⚡ Flashcards</Text>
                </TouchableOpacity>
              </Animated.View>

              {/* Solve another */}
              <TouchableOpacity style={styles.solveAnotherBtn} onPress={() => handlePress(reset)}>
                <Text style={styles.solveAnotherText}>← Solve another problem</Text>
              </TouchableOpacity>
            </>
          )}

          {/* ── SOCRATIC MODE ── */}
          {socratic && (
            <>
              <Animated.View
                entering={FadeInUp.duration(600).delay(400).springify()}
                style={styles.socraticCard}
              >
                <Text style={styles.socraticLabel}>Start here</Text>
                <Text style={styles.socraticQuestion}>{socratic.opening_question}</Text>
              </Animated.View>

              <Text style={styles.sectionLabel}>Hints (reveal one at a time)</Text>
              {socratic.hints.map((hint, i) => (
                <Animated.View
                  key={i}
                  entering={FadeInUp.duration(600).delay(500 + i * 100).springify()}
                >
                  {i < hintsRevealed ? (
                    <View style={styles.hintRevealed}>
                      <Text style={styles.hintNum}>Hint {i + 1}</Text>
                      <Text style={styles.hintText}>{hint}</Text>
                    </View>
                  ) : i === hintsRevealed ? (
                    <TouchableOpacity
                      style={styles.hintRevealBtn}
                      onPress={() => handlePress(() => setHintsRevealed(h => h + 1))}
                    >
                      <Text style={styles.hintRevealBtnText}>
                        {i === 0 ? 'Show hint 1' : `Show hint ${i + 1}`}
                      </Text>
                    </TouchableOpacity>
                  ) : null}
                </Animated.View>
              ))}

              {hintsRevealed >= socratic.hints.length && (
                <Animated.View
                  entering={FadeInUp.duration(600).delay(600 + socratic.hints.length * 100).springify()}
                >
                  <TouchableOpacity
                    style={[styles.primaryBtn, { marginHorizontal: 16, marginTop: 12 }]}
                    onPress={() => { setMode('answer'); solve() }}
                  >
                    <Text style={styles.primaryBtnText}>Show full solution</Text>
                  </TouchableOpacity>
                </Animated.View>
              )}

              <TouchableOpacity style={styles.solveAnotherBtn} onPress={() => handlePress(reset)}>
                <Text style={styles.solveAnotherText}>← Try a different problem</Text>
              </TouchableOpacity>
            </>
          )}

          <View style={{ height: 40 }} />
        </ScrollView>
      </SafeAreaView>
    )
  }

  return null
}

// ─────────────────────────────────────────────
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0a0a',
  },
  centerContent: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 0.5,
    borderBottomColor: '#1a1a1a',
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#1a1a1a',
    alignItems: 'center',
    justifyContent: 'center',
  },
  backIcon: {
    color: '#fff',
    fontSize: 16,
  },
  headerTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },

  // ── Tab toggle ──
  tabRow: {
    flexDirection: 'row',
    margin: 16,
    backgroundColor: '#111',
    borderRadius: 12,
    padding: 3,
    gap: 3,
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 9,
    alignItems: 'center',
  },
  tabActive: {
    backgroundColor: '#1a1a1a',
  },
  tabText: {
    color: '#555',
    fontSize: 13,
    fontWeight: '500',
  },
  tabTextActive: {
    color: '#fff',
  },

  // ── Camera options ──
  cameraOptions: {
    flex: 1,
    paddingHorizontal: 16,
    gap: 12,
  },
  cameraHero: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  cameraHeroEmoji: {
    fontSize: 48,
  },
  cameraHeroTitle: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '600',
  },
  cameraHeroSub: {
    color: '#555',
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },

  // ── Buttons ──
  primaryBtn: {
    backgroundColor: '#14b8a6',
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: 'center',
    marginBottom: 4,
  },
  primaryBtnText: {
    color: '#000',
    fontSize: 15,
    fontWeight: '700',
  },
  secondaryBtn: {
    backgroundColor: '#111',
    borderWidth: 0.5,
    borderColor: '#2a2a2a',
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: 'center',
    marginBottom: 16,
  },
  secondaryBtnText: {
    color: '#888',
    fontSize: 15,
    fontWeight: '500',
  },
  btnDisabled: {
    opacity: 0.4,
  },

  // ── Text input ──
  textInputArea: {
    flex: 1,
    paddingHorizontal: 16,
    gap: 10,
  },
  problemInput: {
    backgroundColor: '#111',
    borderWidth: 0.5,
    borderColor: '#2a2a2a',
    borderRadius: 14,
    padding: 14,
    color: '#fff',
    fontSize: 14,
    minHeight: 140,
    lineHeight: 22,
  },
  examplesLabel: {
    color: '#444',
    fontSize: 12,
    fontWeight: '500',
  },
  examplesRow: {
    flexGrow: 0,
  },
  exampleChip: {
    backgroundColor: '#111',
    borderWidth: 0.5,
    borderColor: '#2a2a2a',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
  },
  exampleText: {
    color: '#666',
    fontSize: 12,
  },

  // ── Mode toggle ──
  modeRow: {
    flexDirection: 'row',
    backgroundColor: '#111',
    borderRadius: 10,
    padding: 3,
    gap: 3,
  },
  modeBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  modeBtnActive: {
    backgroundColor: '#14b8a6',
  },
  modeBtnText: {
    color: '#555',
    fontSize: 13,
    fontWeight: '500',
  },
  modeBtnTextActive: {
    color: '#000',
    fontWeight: '700',
  },
  modeHint: {
    color: '#444',
    fontSize: 11,
    textAlign: 'center',
  },

  // ── Preview ──
  previewImage: {
    width: '100%',
    height: 260,
    backgroundColor: '#111',
  },
  previewBottom: {
    padding: 16,
    gap: 10,
    flex: 1,
    justifyContent: 'flex-end',
  },

  // ── Solving ──
  solveEmoji: {
    fontSize: 40,
    color: '#14b8a6',
  },
  solvingTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginTop: 16,
  },
  solvingSubtitle: {
    color: '#555',
    fontSize: 13,
    marginTop: 4,
  },
  dotRow: {
    flexDirection: 'row',
    gap: 6,
    marginTop: 20,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#222',
  },
  dotActive: {
    backgroundColor: '#14b8a6',
  },

  // ── Solution ──
  scrollArea: {
    flex: 1,
  },
  pillRow: {
    flexDirection: 'row',
    gap: 6,
  },
  pill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    borderWidth: 0.5,
  },
  pillText: {
    fontSize: 11,
    fontWeight: '600',
  },
  topicTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
    paddingHorizontal: 16,
    marginTop: 6,
    marginBottom: 4,
  },
  sectionLabel: {
    color: '#444',
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    paddingHorizontal: 16,
    marginTop: 12,
    marginBottom: 8,
  },

  // Steps
  stepCard: {
    marginHorizontal: 16,
    marginBottom: 8,
    backgroundColor: '#111',
    borderWidth: 0.5,
    borderColor: '#1f1f1f',
    borderRadius: 14,
    padding: 14,
    flexDirection: 'row',
    gap: 12,
  },
  stepNumCircle: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#1a1a1a',
    borderWidth: 0.5,
    borderColor: '#333',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    marginTop: 2,
  },
  stepNumText: {
    color: '#888',
    fontSize: 11,
    fontWeight: '600',
  },
  stepContent: {
    flex: 1,
  },
  stepAction: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
    lineHeight: 20,
  },
  stepExplain: {
    color: '#666',
    fontSize: 13,
    lineHeight: 19,
    marginTop: 3,
  },
  mathBox: {
    backgroundColor: '#0a1a14',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    marginTop: 8,
    borderLeftWidth: 2,
    borderLeftColor: '#14b8a6',
  },
  mathText: {
    color: '#2dd4bf',
    fontSize: 13,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    lineHeight: 19,
  },

  // Answer
  answerCard: {
    marginHorizontal: 16,
    marginTop: 12,
    backgroundColor: '#0a2e24',
    borderWidth: 1,
    borderColor: 'rgba(20,184,166,0.3)',
    borderRadius: 16,
    padding: 16,
  },
  answerLabel: {
    color: '#14b8a6',
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 4,
  },
  answerValue: {
    color: '#fff',
    fontSize: 22,
    fontWeight: '700',
  },

  // Concept
  conceptCard: {
    marginHorizontal: 16,
    marginTop: 10,
    backgroundColor: '#111',
    borderWidth: 0.5,
    borderColor: '#1f1f1f',
    borderRadius: 12,
    padding: 14,
  },
  conceptLabel: {
    color: '#444',
    fontSize: 10,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 4,
  },
  conceptText: {
    color: '#888',
    fontSize: 13,
    lineHeight: 19,
  },

  // Fun fact
  funFactCard: {
    marginHorizontal: 16,
    marginTop: 10,
    backgroundColor: '#1a0a2e',
    borderWidth: 0.5,
    borderColor: '#2a1a4a',
    borderRadius: 12,
    padding: 14,
  },
  funFactLabel: {
    color: '#a78bfa',
    fontSize: 11,
    fontWeight: '600',
    marginBottom: 4,
  },
  funFactText: {
    color: '#7c6fa0',
    fontSize: 13,
    lineHeight: 19,
  },

  // Action buttons
  actionRow: {
    flexDirection: 'row',
    gap: 10,
    marginHorizontal: 16,
    marginTop: 16,
  },
  actionBtnPurple: {
    flex: 1,
    backgroundColor: '#1a0a2e',
    borderWidth: 0.5,
    borderColor: '#3a1a5a',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  actionBtnPurpleText: {
    color: '#a78bfa',
    fontSize: 13,
    fontWeight: '600',
  },
  actionBtnTeal: {
    flex: 1,
    backgroundColor: '#14b8a6',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  actionBtnTealText: {
    color: '#000',
    fontSize: 13,
    fontWeight: '700',
  },

  // Socratic
  socraticCard: {
    marginHorizontal: 16,
    marginTop: 8,
    backgroundColor: '#2a1f00',
    borderWidth: 0.5,
    borderColor: '#4a3500',
    borderRadius: 14,
    padding: 16,
  },
  socraticLabel: {
    color: '#fbbf24',
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 6,
  },
  socraticQuestion: {
    color: '#fff',
    fontSize: 15,
    lineHeight: 22,
    fontWeight: '500',
  },
  hintRevealed: {
    marginHorizontal: 16,
    marginBottom: 8,
    backgroundColor: '#111',
    borderWidth: 0.5,
    borderColor: '#1f1f1f',
    borderRadius: 12,
    padding: 14,
  },
  hintNum: {
    color: '#444',
    fontSize: 10,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 4,
  },
  hintText: {
    color: '#888',
    fontSize: 13,
    lineHeight: 19,
  },
  hintRevealBtn: {
    marginHorizontal: 16,
    marginBottom: 8,
    borderWidth: 0.5,
    borderColor: '#2a2a2a',
    borderStyle: 'dashed',
    borderRadius: 12,
    padding: 14,
    alignItems: 'center',
  },
  hintRevealBtnText: {
    color: '#555',
    fontSize: 13,
    fontWeight: '500',
  },

  // Bottom
  solveAnotherBtn: {
    alignItems: 'center',
    paddingVertical: 16,
    marginTop: 8,
  },
  solveAnotherText: {
    color: '#444',
    fontSize: 13,
  },
  errorText: {
    color: '#f87171',
    fontSize: 12,
    textAlign: 'center',
    backgroundColor: '#2a0f0f',
    padding: 10,
    borderRadius: 10,
  },
})

