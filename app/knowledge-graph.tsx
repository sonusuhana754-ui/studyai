import { useEffect, useState } from 'react'
import { View, ScrollView, StyleSheet, Pressable } from 'react-native'
import { router } from 'expo-router'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import { Text as UIText } from '@/components/ui/Text'
import { Card } from '@/components/ui/Card'
import { ACCENT, BG, TEXT_SECONDARY } from '@/lib/theme'
import { getKnowledgeGraph, KnowledgeNode } from '@/lib/learningMemory'

export default function KnowledgeGraphScreen() {
  const insets = useSafeAreaInsets()
  const [nodes, setNodes] = useState<KnowledgeNode[]>([])

  useEffect(() => {
    getKnowledgeGraph().then(setNodes)
  }, [])

  return (
    <View style={[s.root, { paddingTop: insets.top }]}>
      <View style={s.header}>
        <Pressable onPress={() => router.back()} style={s.back}>
          <Ionicons name="arrow-back" size={22} color="#fff" />
        </Pressable>
        <UIText style={s.title}>Knowledge Graph</UIText>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView contentContainerStyle={s.content}>
        <UIText style={s.hint}>
          Topics you have studied and how they connect. Solve more problems to grow your graph.
        </UIText>

        {nodes.length === 0 ? (
          <Card style={s.empty}>
            <UIText style={s.emptyText}>No topics yet. Scan a problem to start building your graph.</UIText>
            <Pressable onPress={() => router.push('/scan')} style={s.cta}>
              <UIText style={s.ctaText}>Scan a problem</UIText>
            </Pressable>
          </Card>
        ) : (
          nodes.map((node) => (
            <Card key={node.id} style={s.nodeCard}>
              <View style={s.nodeTop}>
                <UIText style={s.nodeTitle}>{node.label}</UIText>
                <UIText style={s.mastery}>{node.mastery}%</UIText>
              </View>
              <UIText style={s.subject}>{node.subject}</UIText>
              <View style={s.barTrack}>
                <View style={[s.barFill, { width: `${node.mastery}%` }]} />
              </View>
              {node.links.length > 0 && (
                <View style={s.links}>
                  <UIText style={s.linksLabel}>Connected to</UIText>
                  {node.links.map((link) => (
                    <UIText key={link} style={s.linkChip}>
                      ↗ {link}
                    </UIText>
                  ))}
                </View>
              )}
            </Card>
          ))
        )}
      </ScrollView>
    </View>
  )
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: BG },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  back: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#1a1a1a',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: { flex: 1, textAlign: 'center', fontSize: 18, fontWeight: '700', color: '#fff' },
  content: { padding: 20, gap: 12, paddingBottom: 40 },
  hint: { fontSize: 14, color: TEXT_SECONDARY, lineHeight: 20, marginBottom: 4 },
  empty: { padding: 24, alignItems: 'center', gap: 12 },
  emptyText: { color: TEXT_SECONDARY, textAlign: 'center' },
  cta: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: ACCENT,
  },
  ctaText: { fontWeight: '700', color: '#000' },
  nodeCard: { gap: 8, padding: 14 },
  nodeTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  nodeTitle: { fontSize: 16, fontWeight: '700', color: '#fff', flex: 1 },
  mastery: { fontSize: 14, fontWeight: '800', color: ACCENT },
  subject: { fontSize: 12, color: TEXT_SECONDARY },
  barTrack: {
    height: 6,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.1)',
    overflow: 'hidden',
  },
  barFill: { height: '100%', backgroundColor: ACCENT, borderRadius: 999 },
  links: { marginTop: 4, gap: 4 },
  linksLabel: { fontSize: 11, color: TEXT_SECONDARY, textTransform: 'uppercase' },
  linkChip: { fontSize: 13, color: '#a5b4fc' },
})
