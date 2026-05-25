
import React, { useState } from 'react'
import {
  View,
  TextInput,
  StyleSheet,
  Pressable,
  ScrollView,
  Alert,
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { router } from 'expo-router'
import { LinearGradient } from 'expo-linear-gradient'
import { Ionicons } from '@expo/vector-icons'
import { ACCENT, BG, TEXT_SECONDARY } from '@/lib/theme'
import { Text as UIText } from '@/components/ui/Text'
import { SubjectPicker } from '@/components/SubjectPicker'

export default function ExplainerTopicScreen() {
  const insets = useSafeAreaInsets()
  const [topic, setTopic] = useState('')
  const [subject, setSubject] = useState('Mathematics')
  const [isGenerating, setIsGenerating] = useState(false)

  const examples = [
    'The Digestive Process',
    'The Rise and Fall of the Mughal Empire',
    'Photosynthesis Explained',
    'Newton\'s Laws of Motion',
    'The French Revolution',
  ]

  const generate = async () => {
    if (!topic.trim()) {
      Alert.alert('Please enter a topic', 'Tell us what you want to learn about!')
      return
    }
    if (!subject) {
      Alert.alert('Please select a subject', 'Choose the subject this topic belongs to!')
      return
    }

    setIsGenerating(true)
    try {
      router.push({
        pathname: '/explainer',
        params: {
          topic: topic.trim(),
          subject: subject,
          context: `User wants to learn about ${topic.trim()} in ${subject}`,
        },
      })
    } catch (err) {
      console.error(err)
      Alert.alert('Error', 'Something went wrong. Please try again!')
    } finally {
      setIsGenerating(false)
    }
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} hitSlop={8} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color="#fff" />
        </Pressable>
        <UIText style={styles.headerTitle}>Video Explainer</UIText>
        <View style={{ width: 36 }} />
      </View>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>

        <View style={styles.content}>
          <UIText style={styles.label}>What do you want to learn about?</UIText>
          <TextInput
            style={styles.topicInput}
            placeholder="Enter a topic (e.g., The Digestive Process)"
            placeholderTextColor="#444"
            value={topic}
            onChangeText={setTopic}
            multiline
          />

          <UIText style={styles.label}>Choose a subject</UIText>
          <SubjectPicker value={subject} onChange={setSubject} />

          <UIText style={styles.label}>Try an example:</UIText>
          <ScrollView horizontal style={styles.examplesRow} showsHorizontalScrollIndicator={false}>
            {examples.map((ex, i) => (
              <Pressable
                key={i}
                style={styles.exampleChip}
                onPress={() => {
                  setTopic(ex)
                  if (ex.toLowerCase().includes('mughal') || ex.toLowerCase().includes('french')) {
                    setSubject('History')
                  } else if (ex.toLowerCase().includes('digestive') || ex.toLowerCase().includes('photosynthesis')) {
                    setSubject('Biology')
                  } else if (ex.toLowerCase().includes('newton')) {
                    setSubject('Physics')
                  }
                }}
              >
                <UIText style={styles.exampleChipText}>{ex}</UIText>
              </Pressable>
            ))}
          </ScrollView>
        </View>
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: insets.bottom + 16 }]}>
        <Pressable
          style={[styles.generateBtn, (!topic.trim() || !subject || isGenerating) && styles.generateBtnDisabled]}
          onPress={generate}
          disabled={!topic.trim() || !subject || isGenerating}
        >
          <LinearGradient
            colors={[ACCENT, '#0d9488']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.generateBtnGrad}
          >
            <Ionicons name="play-circle" size={22} color="#000" />
            <UIText style={styles.generateBtnText}>
              {isGenerating ? 'Starting...' : 'Generate explainer'}
            </UIText>
          </LinearGradient>
        </Pressable>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: BG,
  },
  scrollView: { flex: 1 },
  scrollContent: { paddingBottom: 24 },
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
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 24,
    gap: 20,
  },
  label: {
    fontSize: 12,
    fontWeight: '700',
    color: TEXT_SECONDARY,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  topicInput: {
    backgroundColor: '#111',
    borderWidth: 0.5,
    borderColor: '#2a2a2a',
    borderRadius: 12,
    padding: 14,
    color: '#fff',
    fontSize: 15,
    minHeight: 80,
    textAlignVertical: 'top',
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
  examplesRow: {
    flexGrow: 0,
  },
  exampleChip: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: '#111',
    borderWidth: 0.5,
    borderColor: '#2a2a2a',
    marginRight: 8,
  },
  exampleChipText: {
    fontSize: 13,
    color: '#666',
  },
  footer: {
    paddingHorizontal: 20,
    paddingBottom: 24,
  },
  generateBtn: {
    borderRadius: 14,
    overflow: 'hidden',
  },
  generateBtnDisabled: {
    opacity: 0.4,
  },
  generateBtnGrad: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
  },
  generateBtnText: {
    color: '#000',
    fontSize: 15,
    fontWeight: '700',
  },
})
