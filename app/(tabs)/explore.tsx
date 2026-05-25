import { useMemo, useState } from 'react'
import {
    View,
    ScrollView,
    StyleSheet,
    Pressable,
} from 'react-native'
import { router } from 'expo-router'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import { LinearGradient } from 'expo-linear-gradient'
import { Text as UIText } from '@/components/ui/Text'
import { Card } from '@/components/ui/Card'
import TextInputField from '@/components/ui/TextInputField'
import {
    BG,
    BORDER,
    TEXT_SECONDARY,
    ACCENT,
} from '@/lib/theme'
import { TAB_BAR_CLEARANCE } from '@/components/TabBar'

type Subject = 'math' | 'physics' | 'chemistry' | 'history' | 'biology' | 'economics' | 'other'
type Difficulty = 'easy' | 'medium' | 'hard'

interface Problem {
    id: number
    question: string
    subject: Subject
    topic: string
    difficulty: Difficulty
    timeAgo: string
}

const SUBJECTS: Array<{ key: Subject | 'all'; label: string }> = [
    { key: 'all', label: 'All' },
    { key: 'math', label: 'Math' },
    { key: 'physics', label: 'Physics' },
    { key: 'chemistry', label: 'Chemistry' },
    { key: 'history', label: 'History' },
    { key: 'biology', label: 'Biology' },
    { key: 'economics', label: 'Economics' },
    { key: 'other', label: 'Other' },
]

const SUBJECT_COLORS: Record<Subject, string> = {
    math: '#3b82f6',
    physics: '#8b5cf6',
    chemistry: '#10b981',
    history: '#f59e0b',
    biology: '#22c55e',
    economics: '#06b6d4',
    other: '#6b7280',
}

const DIFFICULTY_COLORS: Record<Difficulty, string> = {
    easy: '#22c55e',
    medium: '#f59e0b',
    hard: '#ef4444',
}

const HARDCODED_PROBLEMS: Problem[] = [
    { id: 1, question: 'Solve: 2x² + 5x - 3 = 0', subject: 'math', topic: 'Quadratic Equations', difficulty: 'medium', timeAgo: '2h ago' },
    { id: 2, question: 'When did the Mughal Empire fall and why?', subject: 'history', topic: 'Mughal Empire', difficulty: 'easy', timeAgo: '5h ago' },
    { id: 3, question: 'Balance this equation: Fe + O₂ → Fe₂O₃', subject: 'chemistry', topic: 'Redox Reactions', difficulty: 'medium', timeAgo: '1d ago' },
    { id: 4, question: 'What is Newton\'s second law and give an example?', subject: 'physics', topic: 'Classical Mechanics', difficulty: 'easy', timeAgo: '2d ago' },
    { id: 5, question: 'Calculate compound interest on ₹10,000 at 8% for 3 years', subject: 'math', topic: 'Financial Math', difficulty: 'hard', timeAgo: '3d ago' },
]

export default function LibraryScreen() {
    const insets = useSafeAreaInsets()
    const [searchQuery, setSearchQuery] = useState('')
    const [activeSubject, setActiveSubject] = useState<Subject | 'all'>('all')

    const filteredProblems = useMemo(() => {
        let filtered = HARDCODED_PROBLEMS
        if (activeSubject !== 'all') {
            filtered = filtered.filter(p => p.subject === activeSubject)
        }
        if (searchQuery.trim()) {
            const q = searchQuery.trim().toLowerCase()
            filtered = filtered.filter(p => p.question.toLowerCase().includes(q))
        }
        return filtered
    }, [activeSubject, searchQuery])

    const uniqueSubjects = new Set(HARDCODED_PROBLEMS.map(p => p.subject)).size

    return (
        <ScrollView
            style={{ flex: 1, backgroundColor: BG }}
            contentContainerStyle={[s.container, { paddingTop: insets.top + 16, paddingBottom: TAB_BAR_CLEARANCE + 16 }]}
            showsVerticalScrollIndicator={false}
        >
            <View style={s.header}>
                <UIText style={s.title}>Problem Library</UIText>
                <UIText style={s.subtitle}>All your saved problems</UIText>
            </View>

            <View style={s.searchBar}>
                <Ionicons name="search-outline" size={20} color="rgba(255,255,255,0.4)" />
                <TextInputField
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                    placeholder="Search problems..."
                    style={s.searchInput}
                />
            </View>

            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.filterRow}>
                {SUBJECTS.map((subject) => {
                    const active = subject.key === activeSubject
                    return (
                        <Pressable
                            key={subject.key}
                            onPress={() => setActiveSubject(subject.key)}
                            style={[s.filterChip, active && s.filterChipActive]}
                        >
                            <UIText style={[s.filterText, active && s.filterTextActive]}>{subject.label}</UIText>
                        </Pressable>
                    )
                })}
            </ScrollView>

            <View style={s.statsRow}>
                <Card style={s.statCard}>
                    <UIText style={s.statValue}>{HARDCODED_PROBLEMS.length}</UIText>
                    <UIText style={s.statLabel}>Problems</UIText>
                </Card>
                <Card style={s.statCard}>
                    <UIText style={s.statValue}>{uniqueSubjects}</UIText>
                    <UIText style={s.statLabel}>Subjects</UIText>
                </Card>
                <Card style={s.statCard}>
                    <UIText style={s.statValue}>8</UIText>
                    <UIText style={s.statLabel}>This week</UIText>
                </Card>
            </View>

            {filteredProblems.length === 0 ? (
                <Card style={s.emptyCard}>
                    <UIText style={s.emptyEmoji}>📚</UIText>
                    <UIText style={s.emptyTitle}>No problems yet</UIText>
                    <UIText style={s.emptySub}>Scan your first problem to get started</UIText>
                    <Pressable
                        onPress={() => router.push('/scan')}
                        style={({ pressed }) => [s.scanButton, pressed && { opacity: 0.85, transform: [{ scale: 0.98 }] }]}
                    >
                        <LinearGradient
                            colors={[ACCENT, '#0d9488']}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 1 }}
                            style={s.scanButtonGrad}
                        >
                            <UIText style={s.scanButtonText}>Scan now →</UIText>
                        </LinearGradient>
                    </Pressable>
                </Card>
            ) : (
                filteredProblems.map((problem) => (
                    <Card key={problem.id} style={s.problemCard}>
                        <View style={s.problemTop}>
                            <View style={s.problemLeft}>
                                <View style={[s.subjectPill, { backgroundColor: `${SUBJECT_COLORS[problem.subject]}20` }]}>
                                    <UIText style={[s.subjectPillText, { color: SUBJECT_COLORS[problem.subject] }]}>
                                        {problem.subject.charAt(0).toUpperCase() + problem.subject.slice(1)}
                                    </UIText>
                                </View>
                            </View>
                            <View style={s.problemCenter}>
                                <UIText style={s.problemQuestion} numberOfLines={2}>
                                    {problem.question}
                                </UIText>
                                <UIText style={s.problemTopic}>{problem.topic}</UIText>
                            </View>
                            <View style={s.problemRight}>
                                <View style={[s.difficultyBadge, { backgroundColor: `${DIFFICULTY_COLORS[problem.difficulty]}20` }]}>
                                    <UIText style={[s.difficultyBadgeText, { color: DIFFICULTY_COLORS[problem.difficulty] }]}>
                                        {problem.difficulty.charAt(0).toUpperCase() + problem.difficulty.slice(1)}
                                    </UIText>
                                </View>
                                <UIText style={s.timeAgo}>{problem.timeAgo}</UIText>
                            </View>
                        </View>
                        <View style={s.problemBottom}>
                            <Pressable
                                onPress={() => {}}
                                style={({ pressed }) => [pressed && { opacity: 0.7 }]}
                            >
                                <UIText style={s.actionLink}>View solution</UIText>
                            </Pressable>
                            <Pressable
                                onPress={() => {}}
                                style={({ pressed }) => [pressed && { opacity: 0.7 }]}
                            >
                                <UIText style={s.actionLink}>Flashcards</UIText>
                            </Pressable>
                            <Pressable
                                onPress={() => {}}
                                style={({ pressed }) => [pressed && { opacity: 0.7 }]}
                            >
                                <UIText style={s.actionLink}>🎬 Explainer</UIText>
                            </Pressable>
                        </View>
                    </Card>
                ))
            )}
        </ScrollView>
    )
}

const s = StyleSheet.create({
    container: { paddingHorizontal: 20, gap: 16 },
    header: { gap: 4, marginBottom: 4 },
    title: { fontSize: 24, fontWeight: '800', color: '#fff', letterSpacing: -0.5 },
    subtitle: { fontSize: 13, color: TEXT_SECONDARY },
    searchBar: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        backgroundColor: 'rgba(255,255,255,0.04)',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
        borderRadius: 16,
        paddingHorizontal: 14,
        paddingVertical: 8,
    },
    searchInput: {
        flex: 1,
        borderWidth: 0,
        backgroundColor: 'transparent',
        paddingHorizontal: 0,
        paddingVertical: 0,
    },
    filterRow: { gap: 8, paddingVertical: 4 },
    filterChip: {
        borderWidth: 1,
        borderColor: BORDER,
        borderRadius: 999,
        paddingHorizontal: 14,
        paddingVertical: 8,
        backgroundColor: 'rgba(255,255,255,0.04)',
    },
    filterChipActive: {
        backgroundColor: ACCENT,
        borderColor: ACCENT,
    },
    filterText: { fontSize: 13, color: TEXT_SECONDARY, fontWeight: '600' },
    filterTextActive: { color: '#fff' },
    statsRow: {
        flexDirection: 'row',
        gap: 12,
        marginBottom: 4,
    },
    statCard: {
        flex: 1,
        alignItems: 'center',
        paddingVertical: 14,
        paddingHorizontal: 12,
        gap: 4,
    },
    statValue: {
        fontSize: 22,
        fontWeight: '800',
        color: '#fff',
    },
    statLabel: {
        fontSize: 12,
        color: TEXT_SECONDARY,
        fontWeight: '500',
    },
    emptyCard: {
        alignItems: 'center',
        paddingVertical: 40,
        gap: 12,
        marginTop: 16,
    },
    emptyEmoji: {
        fontSize: 64,
    },
    emptyTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#fff',
    },
    emptySub: {
        fontSize: 14,
        color: TEXT_SECONDARY,
        marginBottom: 12,
    },
    scanButton: {
        borderRadius: 14,
        overflow: 'hidden',
    },
    scanButtonGrad: {
        paddingHorizontal: 20,
        paddingVertical: 12,
    },
    scanButtonText: {
        fontSize: 15,
        fontWeight: '700',
        color: '#fff',
    },
    problemCard: {
        gap: 12,
        paddingVertical: 14,
        paddingHorizontal: 16,
    },
    problemTop: {
        flexDirection: 'row',
        gap: 12,
    },
    problemLeft: {
        paddingTop: 2,
    },
    subjectPill: {
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: 999,
    },
    subjectPillText: {
        fontSize: 11,
        fontWeight: '700',
    },
    problemCenter: {
        flex: 1,
        gap: 4,
    },
    problemQuestion: {
        fontSize: 15,
        fontWeight: '700',
        color: '#fff',
        lineHeight: 20,
    },
    problemTopic: {
        fontSize: 12,
        color: TEXT_SECONDARY,
        fontWeight: '500',
    },
    problemRight: {
        alignItems: 'flex-end',
        gap: 6,
        paddingTop: 2,
    },
    difficultyBadge: {
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 999,
    },
    difficultyBadgeText: {
        fontSize: 11,
        fontWeight: '700',
    },
    timeAgo: {
        fontSize: 11,
        color: 'rgba(255,255,255,0.4)',
        fontWeight: '500',
    },
    problemBottom: {
        flexDirection: 'row',
        gap: 20,
        paddingTop: 4,
        borderTopWidth: 1,
        borderTopColor: 'rgba(255,255,255,0.06)',
    },
    actionLink: {
        fontSize: 13,
        color: ACCENT,
        fontWeight: '600',
    },
})
