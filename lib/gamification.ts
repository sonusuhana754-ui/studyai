import AsyncStorage from '@react-native-async-storage/async-storage'

const GAMIFICATION_KEY = '@studyai:gamification'

export interface GamificationData {
  xp: number
  level: number
  streak: number
  lastStudyDate: string
  badges: string[]
  totalProblemsSolved: number
  totalFlashcardsCompleted: number
  totalQuizzesTaken: number
}

const DEFAULT_DATA: GamificationData = {
  xp: 0,
  level: 1,
  streak: 3,
  lastStudyDate: new Date().toISOString(),
  badges: [],
  totalProblemsSolved: 24,
  totalFlashcardsCompleted: 0,
  totalQuizzesTaken: 0,
}

export const XP_PER_PROBLEM = 50
export const XP_PER_FLASHCARD = 10
export const XP_PER_QUIZ = 30
export const XP_STREAK_BONUS = 10

export function getXPForLevel(level: number): number {
  return level * 100 * level
}

export function getCurrentLevelXP(xp: number): { level: number; xpNeeded: number; xpCurrent: number } {
  let level = 1
  let totalXP = 0
  
  while (totalXP + getXPForLevel(level) <= xp) {
    totalXP += getXPForLevel(level)
    level++
  }
  
  return {
    level,
    xpCurrent: xp - totalXP,
    xpNeeded: getXPForLevel(level),
  }
}

export async function getGamificationData(): Promise<GamificationData> {
  const data = await AsyncStorage.getItem(GAMIFICATION_KEY)
  return data ? JSON.parse(data) : DEFAULT_DATA
}

export async function saveGamificationData(data: GamificationData): Promise<void> {
  await AsyncStorage.setItem(GAMIFICATION_KEY, JSON.stringify(data))
}

export async function addXP(amount: number): Promise<GamificationData> {
  const data = await getGamificationData()
  
  data.xp += amount
  
  // Update streak
  const today = new Date().toDateString()
  const lastStudy = new Date(data.lastStudyDate).toDateString()
  const yesterday = new Date(Date.now() - 86400000).toDateString()
  
  if (today !== lastStudy) {
    if (lastStudy === yesterday) {
      data.streak++
    } else {
      data.streak = 1
    }
    data.lastStudyDate = new Date().toISOString()
  }
  
  // Check for level up
  const { level } = getCurrentLevelXP(data.xp)
  if (level > data.level) {
    data.level = level
  }
  
  await saveGamificationData(data)
  return data
}

export async function recordProblemSolved(): Promise<GamificationData> {
  const data = await getGamificationData()
  data.totalProblemsSolved++
  await saveGamificationData(data)
  return addXP(XP_PER_PROBLEM + (data.streak > 1 ? XP_STREAK_BONUS : 0))
}

export async function recordFlashcardsCompleted(count: number): Promise<GamificationData> {
  const data = await getGamificationData()
  data.totalFlashcardsCompleted += count
  await saveGamificationData(data)
  return addXP(XP_PER_FLASHCARD * count)
}

export async function recordQuizTaken(): Promise<GamificationData> {
  const data = await getGamificationData()
  data.totalQuizzesTaken++
  await saveGamificationData(data)
  return addXP(XP_PER_QUIZ)
}

