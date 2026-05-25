
import AsyncStorage from '@react-native-async-storage/async-storage'

const HISTORY_KEY = '@studyai:history'

export interface HistoryItem {
  id: string
  type: 'video_explainer' | 'scan' | 'flashcards' | 'quiz'
  topic: string
  subject?: string
  createdAt: string
  metadata?: any
}

export async function saveHistoryItem(item: Omit<HistoryItem, 'id' | 'createdAt'>): Promise<HistoryItem> {
  const newItem: HistoryItem = {
    ...item,
    id: Date.now().toString(),
    createdAt: new Date().toISOString()
  }
  
  const current = await getHistory()
  current.unshift(newItem)
  await AsyncStorage.setItem(HISTORY_KEY, JSON.stringify(current))
  return newItem
}

export async function getHistory(): Promise<HistoryItem[]> {
  const data = await AsyncStorage.getItem(HISTORY_KEY)
  return data ? JSON.parse(data) : []
}

export async function clearHistory(): Promise<void> {
  await AsyncStorage.removeItem(HISTORY_KEY)
}

export interface FlashcardSet {
  id: string
  topic: string
  subject: string
  difficulty: 'easy' | 'medium' | 'hard'
  flashcards: any[]
  createdAt: string
}

const FLASHCARDS_KEY = '@studyai:flashcards'

export async function saveFlashcardSet(set: Omit<FlashcardSet, 'id' | 'createdAt'>): Promise<FlashcardSet> {
  const newSet: FlashcardSet = {
    ...set,
    id: Date.now().toString(),
    createdAt: new Date().toISOString()
  }
  
  const current = await getFlashcardSets()
  current.unshift(newSet)
  await AsyncStorage.setItem(FLASHCARDS_KEY, JSON.stringify(current))
  return newSet
}

export async function getFlashcardSets(): Promise<FlashcardSet[]> {
  const data = await AsyncStorage.getItem(FLASHCARDS_KEY)
  return data ? JSON.parse(data) : []
}

export interface QuizScore {
  id: string
  topic: string
  subject: string
  difficulty: 'easy' | 'medium' | 'hard'
  score: number
  totalQuestions: number
  createdAt: string
}

const QUIZ_SCORES_KEY = '@studyai:quiz_scores'

export async function saveQuizScore(score: Omit<QuizScore, 'id' | 'createdAt'>): Promise<QuizScore> {
  const newScore: QuizScore = {
    ...score,
    id: Date.now().toString(),
    createdAt: new Date().toISOString()
  }
  
  const current = await getQuizScores()
  current.unshift(newScore)
  await AsyncStorage.setItem(QUIZ_SCORES_KEY, JSON.stringify(current))
  return newScore
}

export async function getQuizScores(): Promise<QuizScore[]> {
  const data = await AsyncStorage.getItem(QUIZ_SCORES_KEY)
  return data ? JSON.parse(data) : []
}

