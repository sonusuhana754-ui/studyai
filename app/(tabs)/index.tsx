import { useState, useEffect } from 'react'
import { View, ScrollView, StyleSheet, RefreshControl, Pressable, Dimensions } from 'react-native'
import { router } from 'expo-router'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useQueryClient } from '@tanstack/react-query'
import { LinearGradient } from 'expo-linear-gradient'
import { Text } from '@/components/ui/Text'
import { Card } from '@/components/ui/Card'
import {
    ACCENT,
    ACCENT_DIM,
    ACCENT_BORDER,
    BG,
    BORDER,
    CYBER_VIOLET,
    GRADIENT_CYBER,
    TEXT_SECONDARY,
    TEXT_TERTIARY,
} from '@/lib/theme'
import { TAB_BAR_CLEARANCE } from '@/components/TabBar'
import { useProfile } from '@/hooks/useProfile'
import { getGamificationData, getCurrentLevelXP } from '@/lib/gamification'
import { getHistory, HistoryItem, getFlashcardSets, getQuizScores } from '@/lib/history'
import { getLearningInsights, getDueRevisionCount, LearningInsight } from '@/lib/learningMemory'
import { TechBackground } from '@/components/TechBackground'
import { SectionLabel } from '@/components/SectionLabel'
import { SolverMockupCard } from '@/components/SolverMockupCard'
import { StudyAILogo } from '@/components/StudyAILogo'
import { APP_TAGLINE } from '@/lib/constants'
import Animated, {
    FadeInDown,
    FadeInUp,
} from 'react-native-reanimated'
import * as Haptics from 'expo-haptics'

const { width: SW } = Dimensions.get('window')
const GRID_GAP = 12
const GRID_PAD = 20
const ACTION_CELL_W = (SW - GRID_PAD * 2 - GRID_GAP) / 2

export default function HomeScreen() {
    const insets = useSafeAreaInsets()
    const [refreshing, setRefreshing] = useState(false)
    const queryClient = useQueryClient()
    const { data: profile } = useProfile()
    const [gamification, setGamification] = useState<any>(null)
    const [recentHistory, setRecentHistory] = useState<HistoryItem[]>([])
    const [flashcardDecks, setFlashcardDecks] = useState(0)
    const [quizCount, setQuizCount] = useState(0)
    const [insights, setInsights] = useState<LearningInsight[]>([])
    const [dueRevision, setDueRevision] = useState(0)

    const greeting = (() => {
        const h = new Date().getHours()
        if (h < 12) return 'Good morning'
        if (h < 17) return 'Good afternoon'
        return 'Good evening'
    })()

    useEffect(() => {
        const loadData = async () => {
            const [data, history, decks, scores, insightList, due] = await Promise.all([
                getGamificationData(),
                getHistory(),
                getFlashcardSets(),
                getQuizScores(),
                getLearningInsights(),
                getDueRevisionCount(),
            ])
            setGamification(data)
            setRecentHistory(history.filter(h => h.type === 'scan').slice(0, 5))
            setFlashcardDecks(decks.length)
            setQuizCount(scores.length)
            setInsights(insightList)
            setDueRevision(due)
        }
        loadData()
    }, [])

    const onRefresh = async () => {
        setRefreshing(true)
        await queryClient.invalidateQueries()
        const [data, history, decks, scores, insightList, due] = await Promise.all([
            getGamificationData(),
            getHistory(),
            getFlashcardSets(),
            getQuizScores(),
            getLearningInsights(),
            getDueRevisionCount(),
        ])
        setGamification(data)
        setRecentHistory(history.filter(h => h.type === 'scan').slice(0, 5))
        setFlashcardDecks(decks.length)
        setQuizCount(scores.length)
        setInsights(insightList)
        setDueRevision(due)
        setRefreshing(false)
    }

    const handlePress = (action: () => void) => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)
        action()
    }

    const AnimatedPressable = Animated.createAnimatedComponent(Pressable)

    return (
        <View style={{ flex: 1, backgroundColor: BG }}>
        <TechBackground />
        <ScrollView
            style={{ flex: 1 }}
            contentContainerStyle={[s.container, { paddingTop: insets.top + 16, paddingBottom: TAB_BAR_CLEARANCE + 16 }]}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={ACCENT} />}
            showsVerticalScrollIndicator={false}
        >
            <Animated.View entering={FadeInDown.duration(1000).springify()} style={s.heroBanner}>
                <View style={s.heroTop}>
                    <StudyAILogo size="sm" />
                    <View style={s.aiBadge}>
                        <Text style={s.aiBadgeText}>+ AI-Powered</Text>
                    </View>
                </View>
                <Text style={s.heroTagline}>{APP_TAGLINE}</Text>
                <SolverMockupCard compact />
            </Animated.View>

            <Animated.View entering={FadeInDown.duration(1000).delay(200).springify()} style={s.header}>
                <View style={s.headerLeft}>
                    <Text style={s.greeting}>{greeting}, {(profile?.fullName ?? 'User').split(' ')[0]}</Text>
                    <Text style={s.subGreeting}>Systems online — ready to learn</Text>
                    {gamification && (
                        <View style={s.levelContainer}>
                            <View style={s.levelBadge}>
                                <Text style={s.levelText}>LVL {gamification.level}</Text>
                            </View>
                            <View style={s.xpContainer}>
                                <Text style={s.xpText}>{gamification.xp} XP</Text>
                                <View style={s.xpBar}>
                                    <View 
                                        style={[
                                            s.xpFill, 
                                            { width: `${(getCurrentLevelXP(gamification.xp).xpCurrent / getCurrentLevelXP(gamification.xp).xpNeeded) * 100}%` }
                                        ]} 
                                    />
                                </View>
                            </View>
                        </View>
                    )}
                </View>
                <Animated.View 
                    entering={FadeInDown.duration(1000).delay(400).springify()}
                    style={s.streakCard}
                >
                    <Text style={s.streakText}>🔥 {gamification?.streak || 3} day streak</Text>
                </Animated.View>
            </Animated.View>

            <Animated.View entering={FadeInDown.duration(1000).delay(600)}>
                <SectionLabel>Quick Actions</SectionLabel>
            </Animated.View>
            <View style={s.actionGrid}>
                {[
                    [
                        {
                            title: 'Scan Problem',
                            sub: 'Point camera at any question',
                            emoji: '📷',
                            gradient: [...GRADIENT_CYBER.slice(0, 2)] as [string, string],
                            onPress: () => router.push('/scan'),
                            delay: 800,
                        },
                        {
                            title: 'Video Explainer',
                            sub: 'AI-animated lessons',
                            emoji: '🎬',
                            color: CYBER_VIOLET,
                            onPress: () => router.push('/explainer-topic'),
                            delay: 900,
                        },
                    ],
                    [
                        {
                            title: 'Flashcards',
                            sub: dueRevision > 0
                                ? `${dueRevision} due for revision`
                                : flashcardDecks > 0
                                  ? `${flashcardDecks} saved deck${flashcardDecks === 1 ? '' : 's'}`
                                  : 'Spaced repetition review',
                            emoji: '⚡',
                            color: '#fbbf24',
                            onPress: () => router.push('/flashcards-topic'),
                            delay: 1000,
                        },
                        {
                            title: 'Quiz Mode',
                            sub: quizCount > 0 ? `${quizCount} quiz${quizCount === 1 ? '' : 'zes'} taken` : 'Test your knowledge',
                            emoji: '🧠',
                            color: '#4ade80',
                            onPress: () => router.push('/quiz'),
                            delay: 1100,
                        },
                    ],
                ].map((row, rowIndex) => (
                    <View key={rowIndex} style={s.actionRow}>
                        {row.map((item) => (
                            <Animated.View
                                key={item.title}
                                entering={FadeInUp.duration(800).delay(item.delay).springify()}
                                style={s.actionCell}
                            >
                                <Pressable
                                    onPress={() => handlePress(item.onPress)}
                                    style={({ pressed }) => [
                                        s.actionPressable,
                                        pressed && { transform: [{ scale: 0.96 }], opacity: 0.92 },
                                    ]}
                                >
                                    {'gradient' in item && item.gradient ? (
                                        <LinearGradient
                                            colors={item.gradient}
                                            start={{ x: 0, y: 0 }}
                                            end={{ x: 1, y: 1 }}
                                            style={s.actionCardInner}
                                        >
                                            <Text style={s.actionIcon}>{item.emoji}</Text>
                                            <Text style={s.actionTitleTeal}>{item.title}</Text>
                                            <Text style={s.actionSubTeal}>{item.sub}</Text>
                                        </LinearGradient>
                                    ) : (
                                        <View style={[s.actionCardInner, s.actionCardDark, { borderColor: `${item.color}44` }]}>
                                            <View style={[s.actionGlowDot, { backgroundColor: item.color }]} />
                                            <Text style={s.actionIcon}>{item.emoji}</Text>
                                            <Text style={[s.actionTitle, { color: item.color }]}>{item.title}</Text>
                                            <Text style={s.actionSub}>{item.sub}</Text>
                                        </View>
                                    )}
                                </Pressable>
                            </Animated.View>
                        ))}
                    </View>
                ))}
            </View>

            <Animated.View entering={FadeInDown.duration(1000).delay(1300)}>
                <SectionLabel>Learning insights</SectionLabel>
            </Animated.View>
            <Animated.View entering={FadeInUp.duration(800).delay(1400).springify()}>
                <Card glow style={s.insightsCard}>
                    {insights.map((item) => (
                        <Pressable
                            key={item.id}
                            onPress={() => {
                                if (item.topic) {
                                    router.push({
                                        pathname: '/flashcards-topic',
                                        params: { topic: item.topic },
                                    })
                                } else if (item.id === 'revision-due') {
                                    router.push('/flashcards-topic')
                                }
                            }}
                            style={[
                                s.insightRow,
                                item.severity === 'focus' && s.insightRowFocus,
                            ]}
                        >
                            <Text style={s.insightIcon}>
                                {item.severity === 'focus' ? '🎯' : '💡'}
                            </Text>
                            <Text style={s.insightText}>{item.message}</Text>
                        </Pressable>
                    ))}
                    <Pressable
                        onPress={() => handlePress(() => router.push('/study-planner'))}
                        style={s.plannerLink}
                    >
                        <Text style={s.plannerLinkText}>📅 Open AI Study Planner →</Text>
                    </Pressable>
                </Card>
            </Animated.View>

            <Animated.View entering={FadeInDown.duration(1000).delay(1600)}>
                <SectionLabel>Your progress</SectionLabel>
            </Animated.View>
            <Animated.View 
                entering={FadeInUp.duration(1000).delay(1800).springify()}
            >
                <Card glow style={s.statsCard}>
                    <View style={s.statRow}>
                        <View style={s.statItem}>
                            <View style={s.statLabelWrap}>
                                <Text style={s.statLabel}>Problems solved</Text>
                            </View>
                            <Text style={s.statValue}>{gamification?.totalProblemsSolved ?? 0}</Text>
                            <View style={s.progressBar}>
                                <View style={s.progressFill} />
                            </View>
                        </View>
                        <View style={s.statDivider} />
                        <View style={s.statItem}>
                            <View style={s.statLabelWrap}>
                                <Text style={s.statLabel}>Flashcards mastered</Text>
                            </View>
                            <Text style={s.statValue}>67%</Text>
                            <View style={s.progressRing}>
                                <View style={s.progressRingInner}>
                                    <Text style={s.progressRingText}>67%</Text>
                                </View>
                            </View>
                        </View>
                        <View style={s.statDivider} />
                        <View style={s.statItem}>
                            <View style={s.statLabelWrap}>
                                <Text style={s.statLabel}>Study streak</Text>
                            </View>
                            <Text style={s.statValue}>{gamification?.streak ?? 0}</Text>
                            <Text style={s.statIcon}>🔥</Text>
                        </View>
                    </View>
                </Card>
            </Animated.View>

            <Animated.View entering={FadeInDown.duration(1000).delay(2000)}>
                <SectionLabel>Recently solved</SectionLabel>
            </Animated.View>
            {recentHistory.length === 0 ? (
                <Animated.View entering={FadeInUp.duration(1000).delay(2200).springify()}>
                    <Card style={s.emptyCard}>
                        <Text style={s.emptyEmoji}>📷</Text>
                        <Text style={s.emptyTitle}>No problems yet</Text>
                        <Text style={s.emptySub}>Scan your first question to see it here</Text>
                        <Pressable
                            onPress={() => handlePress(() => router.push('/scan'))}
                            style={({ pressed }) => [s.emptyBtn, pressed && { opacity: 0.85 }]}
                        >
                            <Text style={s.emptyBtnText}>Scan a problem</Text>
                        </Pressable>
                    </Card>
                </Animated.View>
            ) : (
                recentHistory.map((problem, index) => (
                    <Animated.View
                        key={problem.id}
                        entering={FadeInUp.duration(1000).delay(2200 + index * 150).springify()}
                    >
                        <Pressable
                            onPress={() => handlePress(() => router.push('/scan'))}
                            style={({ pressed }) => [pressed && { opacity: 0.75, transform: [{ scale: 0.95 }] }]}
                        >
                            <Card style={s.problemCard}>
                                <View style={s.problemTop}>
                                    <View style={s.problemSubject}>
                                        <Text style={s.problemSubjectText}>
                                            {(problem.subject ?? 'General').charAt(0).toUpperCase() + (problem.subject ?? '').slice(1)}
                                        </Text>
                                    </View>
                                </View>
                                <Text style={s.problemQuestion} numberOfLines={2}>
                                    {problem.topic}
                                </Text>
                                <Text style={s.problemView}>Solve again →</Text>
                            </Card>
                        </Pressable>
                    </Animated.View>
                ))
            )}
        </ScrollView>
        </View>
    )
}

const s = StyleSheet.create({
    container: { paddingHorizontal: 20, gap: 16 },
    heroBanner: {
        gap: 14,
        padding: 16,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: ACCENT_BORDER,
        backgroundColor: 'rgba(10,18,40,0.55)',
        marginBottom: 4,
    },
    heroTop: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    aiBadge: {
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 999,
        borderWidth: 1,
        borderColor: ACCENT_BORDER,
        backgroundColor: ACCENT_DIM,
    },
    aiBadgeText: { fontSize: 11, fontWeight: '700', color: ACCENT },
    heroTagline: {
        fontSize: 20,
        fontWeight: '800',
        color: '#fff',
        letterSpacing: -0.4,
        lineHeight: 26,
    },
    header: { 
        flexDirection: 'row', 
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 4 
    },
    headerLeft: { gap: 6 },
    greeting: { fontSize: 26, fontWeight: '800', color: '#fff', letterSpacing: -0.6 },
    subGreeting: { fontSize: 14, color: TEXT_SECONDARY },
    levelContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        marginTop: 8,
    },
    levelBadge: {
        backgroundColor: ACCENT,
        paddingHorizontal: 14,
        paddingVertical: 7,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.25)',
        shadowColor: ACCENT,
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.6,
        shadowRadius: 12,
        elevation: 8,
    },
    levelText: {
        fontSize: 13,
        fontWeight: '900',
        color: '#041018',
        letterSpacing: 1,
        fontFamily: 'monospace',
    },
    xpContainer: {
        flex: 1,
        gap: 6,
    },
    xpText: {
        fontSize: 14,
        color: '#fff',
        fontWeight: '700',
    },
    xpBar: {
        width: '100%',
        height: 10,
        borderRadius: 999,
        backgroundColor: 'rgba(255,255,255,0.15)',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
    },
    xpFill: {
        height: '100%',
        borderRadius: 999,
        backgroundColor: ACCENT,
        shadowColor: ACCENT,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.6,
        shadowRadius: 6,
        elevation: 4,
    },
    streakCard: {
        paddingHorizontal: 18,
        paddingVertical: 12,
        borderRadius: 999,
        backgroundColor: 'rgba(251,191,36,0.15)',
        borderWidth: 1,
        borderColor: 'rgba(251,191,36,0.3)',
        shadowColor: '#fbbf24',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 5,
    },
    streakText: {
        fontSize: 15,
        fontWeight: '800',
        color: '#fbbf24',
    },
    sectionTitle: {
        fontSize: 11,
        fontWeight: '700',
        color: TEXT_TERTIARY,
        letterSpacing: 0.8,
        textTransform: 'uppercase',
        marginTop: 4,
    },
    actionGrid: {
        gap: GRID_GAP,
    },
    actionRow: {
        flexDirection: 'row',
        gap: GRID_GAP,
    },
    actionCell: {
        width: ACTION_CELL_W,
    },
    actionPressable: {
        width: '100%',
    },
    actionCardInner: {
        width: '100%',
        minHeight: 132,
        padding: 18,
        borderRadius: 16,
        gap: 8,
        justifyContent: 'center',
    },
    actionCardDark: {
        backgroundColor: 'rgba(10,18,40,0.75)',
        borderWidth: 1,
        overflow: 'hidden',
    },
    actionGlowDot: {
        position: 'absolute',
        top: 12,
        right: 12,
        width: 8,
        height: 8,
        borderRadius: 4,
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 1,
        shadowRadius: 8,
    },
    insightsCard: { gap: 10, padding: 14 },
    insightRow: {
        flexDirection: 'row',
        gap: 10,
        padding: 10,
        borderRadius: 12,
        backgroundColor: 'rgba(255,255,255,0.03)',
    },
    insightRowFocus: {
        backgroundColor: ACCENT_DIM,
        borderWidth: 1,
        borderColor: ACCENT_BORDER,
    },
    insightIcon: { fontSize: 18 },
    insightText: { flex: 1, fontSize: 13, color: '#fff', lineHeight: 18 },
    plannerLink: {
        marginTop: 4,
        paddingVertical: 10,
        alignItems: 'center',
        borderTopWidth: 1,
        borderTopColor: 'rgba(255,255,255,0.06)',
    },
    plannerLinkText: { fontSize: 14, color: ACCENT, fontWeight: '700' },
    actionIcon: { fontSize: 32 },
    actionTitleTeal: { fontSize: 16, fontWeight: '700', color: '#fff' },
    actionSubTeal: { fontSize: 13, color: 'rgba(255,255,255,0.7)' },
    actionTitle: { fontSize: 16, fontWeight: '700', color: '#fff' },
    actionSub: { fontSize: 13, color: TEXT_SECONDARY },
    statsCard: { padding: 20 },
    statRow: { 
        flexDirection: 'row', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        gap: 16,
    },
    statItem: { 
        flex: 1,
        alignItems: 'center', 
        gap: 8,
    },
    statDivider: {
        width: 1,
        height: 60,
        backgroundColor: 'rgba(255,255,255,0.08)',
    },
    statLabelWrap: { alignItems: 'center' },
    statLabel: { fontSize: 12, color: TEXT_SECONDARY, fontWeight: '500' },
    statValue: { fontSize: 22, color: '#fff', fontWeight: '800' },
    statIcon: { fontSize: 24 },
    progressBar: {
        width: '100%',
        height: 6,
        borderRadius: 999,
        backgroundColor: 'rgba(255,255,255,0.1)',
    },
    progressFill: {
        width: '60%',
        height: '100%',
        borderRadius: 999,
        backgroundColor: ACCENT,
    },
    progressRing: {
        width: 40,
        height: 40,
        borderRadius: 999,
        borderWidth: 4,
        borderColor: 'rgba(255,255,255,0.1)',
        borderTopColor: ACCENT,
        borderRightColor: ACCENT,
        borderBottomColor: ACCENT,
        transform: [{ rotate: '-45deg' }],
        alignItems: 'center',
        justifyContent: 'center',
    },
    progressRingInner: {
        transform: [{ rotate: '45deg' }],
    },
    progressRingText: {
        fontSize: 10,
        color: '#fff',
        fontWeight: '700',
    },
    problemCard: { gap: 8, paddingVertical: 14 },
    problemTop: { 
        flexDirection: 'row', 
        justifyContent: 'space-between',
        alignItems: 'center',
        gap: 12,
    },
    problemSubject: {
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 999,
        backgroundColor: ACCENT_DIM,
    },
    problemSubjectText: {
        fontSize: 11,
        color: ACCENT,
        fontWeight: '600',
    },
    problemDifficulty: {
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 999,
        backgroundColor: 'rgba(255,255,255,0.05)',
        borderWidth: 1,
        borderColor: BORDER,
    },
    problemDifficultyText: {
        fontSize: 11,
        color: TEXT_SECONDARY,
        fontWeight: '600',
    },
    problemQuestion: { 
        fontSize: 15, 
        fontWeight: '600', 
        color: '#fff',
        lineHeight: 20,
    },
    problemView: { 
        fontSize: 13, 
        color: ACCENT, 
        fontWeight: '600',
        marginTop: 4,
    },
    emptyCard: {
        alignItems: 'center',
        paddingVertical: 28,
        gap: 8,
    },
    emptyEmoji: { fontSize: 40 },
    emptyTitle: { fontSize: 17, fontWeight: '700', color: '#fff' },
    emptySub: { fontSize: 14, color: TEXT_SECONDARY, textAlign: 'center' },
    emptyBtn: {
        marginTop: 12,
        paddingHorizontal: 20,
        paddingVertical: 12,
        borderRadius: 10,
        backgroundColor: ACCENT,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.3)',
    },
    emptyBtnText: { fontSize: 14, fontWeight: '800', color: '#041018', letterSpacing: 0.3 },
})
