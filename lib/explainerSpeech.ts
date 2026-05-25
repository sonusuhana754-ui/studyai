import { Platform } from 'react-native'
import * as Speech from 'expo-speech'

const SPEECH_RATE = 0.92
const SPEECH_PITCH = 1.0

let speaking = false
let fallbackTimer: ReturnType<typeof setTimeout> | null = null

export function estimateSpeechDuration(text: string, rate = SPEECH_RATE): number {
  const words = text.trim().split(/\s+/).filter(Boolean).length
  if (words === 0) return 6
  // ~150 WPM at rate 1.0; scale by rate
  const seconds = (words / 2.5) / Math.max(rate, 0.5)
  return Math.min(90, Math.max(4, seconds))
}

export async function isSpeechAvailable(): Promise<boolean> {
  try {
    if (Platform.OS === 'web') {
      return typeof window !== 'undefined' && 'speechSynthesis' in window
    }
    return true
  } catch {
    return false
  }
}

function clearFallback() {
  if (fallbackTimer) {
    clearTimeout(fallbackTimer)
    fallbackTimer = null
  }
}

export function stopNarration(): void {
  clearFallback()
  try {
    Speech.stop()
  } catch {
    // ignore
  }
  speaking = false
}

export type SpeakOptions = {
  onDone?: () => void
  onStart?: () => void
  rate?: number
  language?: string
}

/**
 * Speak explainer narration. Uses device TTS (Web Speech API on web).
 * Includes a timer fallback when onDone does not fire (known web quirk).
 */
export function speakNarration(text: string, options?: SpeakOptions): void {
  const trimmed = text?.trim()
  if (!trimmed) {
    options?.onDone?.()
    return
  }

  stopNarration()

  const rate = options?.rate ?? SPEECH_RATE
  const estMs = estimateSpeechDuration(trimmed, rate) * 1000 + 800

  let doneCalled = false
  const finish = () => {
    if (doneCalled) return
    doneCalled = true
    clearFallback()
    speaking = false
    options?.onDone?.()
  }

  fallbackTimer = setTimeout(finish, estMs)

  if (Platform.OS === 'web' && typeof window !== 'undefined') {
    try {
      window.speechSynthesis?.resume?.()
    } catch {
      // ignore
    }
  }

  speaking = true
  Speech.speak(trimmed, {
    language: options?.language ?? 'en-US',
    rate,
    pitch: SPEECH_PITCH,
    onStart: () => options?.onStart?.(),
    onDone: finish,
    onStopped: () => {
      speaking = false
      clearFallback()
    },
    onError: () => finish(),
  })
}

export function isNarrating(): boolean {
  return speaking
}
