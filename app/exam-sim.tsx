/** Exam simulator — timed quiz with pressure mode. Reuses /quiz with exam flag. */
import { useEffect } from 'react'
import { router } from 'expo-router'

export default function ExamSimEntry() {
  useEffect(() => {
    router.replace({ pathname: '/quiz', params: { examMode: '1' } })
  }, [])
  return null
}
