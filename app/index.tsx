import { useEffect, useRef } from 'react'
import { View, Pressable, StyleSheet, Dimensions, ScrollView } from 'react-native'
import { router } from 'expo-router'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withSpring,
    withTiming,
    withDelay,
    withRepeat,
    withSequence,
    Easing,
} from 'react-native-reanimated'
import { LinearGradient } from 'expo-linear-gradient'
import { Text } from '@/components/ui/Text'
import { ACCENT, ACCENT_BORDER, ACCENT_DIM, BG, CYBER_VIOLET } from '@/lib/theme'
import { APP_DESCRIPTION, APP_TAGLINE } from '@/lib/constants'
import { LandingBlobs } from '@/components/LandingBlobs'
import { SolverMockupCard } from '@/components/SolverMockupCard'
import { StudyAILogo } from '@/components/StudyAILogo'
import { adjustBrightness } from '@/lib/utils'
import { ALL_SUBJECT_LABELS } from '@/lib/subjects'

const { width: SW } = Dimensions.get('window')
const BTN_TEXT = '#041018'

const FEATURES = [
    { icon: '📷', title: 'Camera Scan', desc: 'Point at any problem', color: ACCENT },
    { icon: '🎬', title: 'Video Explainer', desc: 'AI-animated step-by-step videos', color: CYBER_VIOLET },
    { icon: '⚡', title: 'Smart Flashcards', desc: 'Auto-generated, gamified', color: '#fbbf24' },
    { icon: '🗺', title: 'Knowledge Graph', desc: 'Track your mastery visually', color: '#4ade80' },
]

const STATS = [
    { value: '10M+', label: 'Problems solved' },
    { value: '50+', label: 'Subjects covered' },
    { value: '98%', label: 'Accuracy rate' },
]

export default function LandingScreen() {
    const insets = useSafeAreaInsets()
    const scrollRef = useRef<ScrollView>(null)
    const mockupY = useRef(0)

    const headerY = useSharedValue(-20)
    const headerOpacity = useSharedValue(0)
    const heroY = useSharedValue(30)
    const heroOpacity = useSharedValue(0)
    const mockupScale = useSharedValue(0.92)
    const mockupOpacity = useSharedValue(0)
    const featuresY = useSharedValue(30)
    const featuresOpacity = useSharedValue(0)
    const statsY = useSharedValue(30)
    const statsOpacity = useSharedValue(0)
    const subjectsOpacity = useSharedValue(0)
    const ctaY = useSharedValue(30)
    const ctaOpacity = useSharedValue(0)
    const marquee1X = useSharedValue(0)

    useEffect(() => {
        headerY.value = withSpring(0, { damping: 16, stiffness: 120 })
        headerOpacity.value = withTiming(1, { duration: 500 })
        heroY.value = withDelay(100, withSpring(0, { damping: 16, stiffness: 110 }))
        heroOpacity.value = withDelay(100, withTiming(1, { duration: 550 }))
        mockupScale.value = withDelay(250, withSpring(1, { damping: 14, stiffness: 100 }))
        mockupOpacity.value = withDelay(250, withTiming(1, { duration: 500 }))
        featuresY.value = withDelay(400, withSpring(0, { damping: 16, stiffness: 110 }))
        featuresOpacity.value = withDelay(400, withTiming(1, { duration: 500 }))
        statsY.value = withDelay(550, withSpring(0, { damping: 16, stiffness: 110 }))
        statsOpacity.value = withDelay(550, withTiming(1, { duration: 500 }))
        subjectsOpacity.value = withDelay(700, withTiming(1, { duration: 500 }))
        ctaY.value = withDelay(850, withSpring(0, { damping: 16, stiffness: 110 }))
        ctaOpacity.value = withDelay(850, withTiming(1, { duration: 500 }))
        marquee1X.value = withRepeat(
            withTiming(-SW * 0.8, { duration: 20000, easing: Easing.linear }),
            -1,
            false
        )
    }, [])

    const headerStyle = useAnimatedStyle(() => ({
        transform: [{ translateY: headerY.value }],
        opacity: headerOpacity.value,
    }))
    const heroStyle = useAnimatedStyle(() => ({
        transform: [{ translateY: heroY.value }],
        opacity: heroOpacity.value,
    }))
    const mockupStyle = useAnimatedStyle(() => ({
        transform: [{ scale: mockupScale.value }],
        opacity: mockupOpacity.value,
    }))
    const featuresStyle = useAnimatedStyle(() => ({
        transform: [{ translateY: featuresY.value }],
        opacity: featuresOpacity.value,
    }))
    const statsStyle = useAnimatedStyle(() => ({
        transform: [{ translateY: statsY.value }],
        opacity: statsOpacity.value,
    }))
    const subjectsStyle = useAnimatedStyle(() => ({ opacity: subjectsOpacity.value }))
    const ctaStyle = useAnimatedStyle(() => ({
        transform: [{ translateY: ctaY.value }],
        opacity: ctaOpacity.value,
    }))
    const marquee1Style = useAnimatedStyle(() => ({ transform: [{ translateX: marquee1X.value }] }))

    const scrollToDemo = () => {
        scrollRef.current?.scrollTo({ y: Math.max(0, mockupY.current - 24), animated: true })
    }

    const [title1, title2] = APP_TAGLINE.split('. ').map((p, i) =>
        i === 0 ? `${p}.` : p.endsWith('.') ? p : `${p}.`
    )

    return (
        <View style={s.root}>
            <LandingBlobs />

            <ScrollView
                ref={scrollRef}
                style={{ flex: 1 }}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ paddingBottom: insets.bottom + 60 }}
            >
                <Animated.View style={[s.headerOuter, { marginTop: insets.top + 16 }, headerStyle]}>
                    <View style={s.headerBar}>
                        <StudyAILogo size="md" />
                        <View style={s.headerRight}>
                            <Pressable onPress={() => router.push('/(auth)/login')} hitSlop={8}>
                                <Text style={s.headerSignIn}>Sign in</Text>
                            </Pressable>
                            <Pressable
                                onPress={() => router.push('/(auth)/login')}
                                style={({ pressed }) => [s.headerCta, pressed && s.pressed]}
                            >
                                <LinearGradient
                                    colors={[ACCENT, adjustBrightness(ACCENT, -12)]}
                                    start={{ x: 0, y: 0 }}
                                    end={{ x: 1, y: 0 }}
                                    style={s.headerCtaGrad}
                                >
                                    <Text style={s.headerCtaText}>Get Started</Text>
                                </LinearGradient>
                            </Pressable>
                        </View>
                    </View>
                </Animated.View>

                <Animated.View style={[s.heroWrap, heroStyle]}>
                    <View style={s.badge}>
                        <Text style={s.badgeText}>+ AI-Powered Learning</Text>
                    </View>

                    <Text style={s.heroTitle1}>{title1}</Text>
                    <Text style={s.heroTitle2}>{title2}</Text>

                    <Text style={s.heroDesc}>{APP_DESCRIPTION}</Text>

                    <View style={s.heroButtons}>
                        <Pressable
                            onPress={() => router.push('/(auth)/login')}
                            style={({ pressed }) => [s.primaryBtn, pressed && s.pressed]}
                        >
                            <LinearGradient
                                colors={[ACCENT, adjustBrightness(ACCENT, -12)]}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 0 }}
                                style={s.primaryBtnGrad}
                            >
                                <Text style={s.primaryBtnText}>Start for free →</Text>
                            </LinearGradient>
                        </Pressable>

                        <Pressable
                            onPress={scrollToDemo}
                            style={({ pressed }) => [s.secondaryBtn, pressed && { opacity: 0.75 }]}
                        >
                            <Text style={s.secondaryBtnText}>See how it works</Text>
                        </Pressable>
                    </View>
                </Animated.View>

                <Animated.View
                    style={[s.mockupWrap, mockupStyle]}
                    onLayout={(e) => { mockupY.current = e.nativeEvent.layout.y }}
                >
                    <SolverMockupCard />
                </Animated.View>

                <Animated.View style={[s.featuresWrap, featuresStyle]}>
                    <View style={s.featuresGrid}>
                        {FEATURES.map((feat, i) => (
                            <View
                                key={i}
                                style={[s.featureCard, { borderColor: `${feat.color}33` }]}
                            >
                                <View style={[s.featureGlow, { backgroundColor: `${feat.color}18` }]} />
                                <Text style={s.featureIcon}>{feat.icon}</Text>
                                <Text style={[s.featureTitle, { color: feat.color }]}>{feat.title}</Text>
                                <Text style={s.featureDesc}>{feat.desc}</Text>
                            </View>
                        ))}
                    </View>
                </Animated.View>

                <Animated.View style={[s.statsWrap, statsStyle]}>
                    {STATS.map((stat, i) => (
                        <View key={i} style={s.statItem}>
                            <Text style={s.statValue}>{stat.value}</Text>
                            <Text style={s.statLabel}>{stat.label}</Text>
                        </View>
                    ))}
                </Animated.View>

                <Animated.View style={[s.subjectsWrap, subjectsStyle]}>
                    <View style={s.subjectsMarquee}>
                        <Animated.View style={[s.subjectsRow, marquee1Style]}>
                            {[...ALL_SUBJECT_LABELS, ...ALL_SUBJECT_LABELS].map((subj, i) => (
                                <View key={`1-${i}`} style={s.subjectPill}>
                                    <Text style={s.subjectText}>{subj}</Text>
                                    {i < ALL_SUBJECT_LABELS.length * 2 - 1 && <Text style={s.subjectDot}>·</Text>}
                                </View>
                            ))}
                        </Animated.View>
                    </View>
                </Animated.View>

                <Animated.View style={[s.ctaWrap, ctaStyle]}>
                    <Text style={s.ctaTitle}>Ready to ace your studies?</Text>
                    <Text style={s.ctaSubtitle}>Join free — no credit card required</Text>
                    <Pressable
                        onPress={() => router.push('/(auth)/login')}
                        style={({ pressed }) => [s.ctaBtn, pressed && s.pressed]}
                    >
                        <LinearGradient
                            colors={[ACCENT, adjustBrightness(ACCENT, -12)]}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 0 }}
                            style={s.ctaBtnGrad}
                        >
                            <Text style={s.ctaBtnText}>Get Started</Text>
                        </LinearGradient>
                    </Pressable>
                </Animated.View>
            </ScrollView>
        </View>
    )
}

const s = StyleSheet.create({
    root: { flex: 1, backgroundColor: BG },
    pressed: { opacity: 0.88, transform: [{ scale: 0.97 }] },

    headerOuter: { alignItems: 'center', paddingHorizontal: 20 },
    headerBar: {
        width: '100%',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    headerRight: { flexDirection: 'row', alignItems: 'center', gap: 16 },
    headerSignIn: { color: 'rgba(255,255,255,0.65)', fontSize: 14, fontWeight: '500' },
    headerCta: { borderRadius: 999, overflow: 'hidden' },
    headerCtaGrad: { paddingHorizontal: 18, paddingVertical: 10, borderRadius: 999 },
    headerCtaText: { color: BTN_TEXT, fontSize: 14, fontWeight: '800' },

    heroWrap: { paddingHorizontal: 24, paddingTop: 36, alignItems: 'center', gap: 14 },
    badge: {
        paddingHorizontal: 14,
        paddingVertical: 6,
        borderRadius: 999,
        borderWidth: 1,
        borderColor: ACCENT_BORDER,
        backgroundColor: ACCENT_DIM,
    },
    badgeText: { color: ACCENT, fontSize: 13, fontWeight: '700' },
    heroTitle1: {
        color: '#fff',
        fontSize: 42,
        fontWeight: '800',
        lineHeight: 46,
        textAlign: 'center',
        letterSpacing: -0.8,
    },
    heroTitle2: {
        color: '#fff',
        fontSize: 42,
        fontWeight: '800',
        lineHeight: 46,
        textAlign: 'center',
        letterSpacing: -0.8,
        marginTop: -6,
    },
    heroDesc: {
        color: 'rgba(255,255,255,0.55)',
        fontSize: 16,
        lineHeight: 24,
        textAlign: 'center',
        maxWidth: 520,
    },
    heroButtons: {
        flexDirection: 'row',
        gap: 12,
        marginTop: 8,
        flexWrap: 'wrap',
        justifyContent: 'center',
    },
    primaryBtn: { borderRadius: 999, overflow: 'hidden' },
    primaryBtnGrad: { paddingHorizontal: 28, paddingVertical: 14, borderRadius: 999 },
    primaryBtnText: { color: BTN_TEXT, fontSize: 16, fontWeight: '800' },
    secondaryBtn: {
        paddingHorizontal: 24,
        paddingVertical: 14,
        borderRadius: 999,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.18)',
        backgroundColor: 'rgba(255,255,255,0.04)',
    },
    secondaryBtnText: { color: 'rgba(255,255,255,0.85)', fontSize: 16, fontWeight: '600' },

    mockupWrap: { paddingHorizontal: 24, paddingTop: 28, alignItems: 'center' },

    featuresWrap: { paddingHorizontal: 24, paddingTop: 40 },
    featuresGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 14,
        justifyContent: 'center',
    },
    featureCard: {
        width: SW > 600 ? (SW - 48 - 42) / 4 : (SW - 48 - 14) / 2,
        minWidth: 148,
        padding: 18,
        borderRadius: 16,
        backgroundColor: 'rgba(10,18,40,0.75)',
        borderWidth: 1,
        alignItems: 'center',
        gap: 8,
        overflow: 'hidden',
    },
    featureGlow: {
        position: 'absolute',
        top: -20,
        right: -20,
        width: 80,
        height: 80,
        borderRadius: 40,
    },
    featureIcon: { fontSize: 30 },
    featureTitle: { fontSize: 15, fontWeight: '800', textAlign: 'center' },
    featureDesc: {
        color: 'rgba(255,255,255,0.5)',
        fontSize: 12,
        textAlign: 'center',
        lineHeight: 17,
    },

    statsWrap: {
        paddingHorizontal: 24,
        paddingTop: 44,
        flexDirection: 'row',
        justifyContent: 'center',
        gap: 40,
        flexWrap: 'wrap',
    },
    statItem: { alignItems: 'center' },
    statValue: { color: ACCENT, fontSize: 32, fontWeight: '800' },
    statLabel: { color: 'rgba(255,255,255,0.5)', fontSize: 14, marginTop: 4 },

    subjectsWrap: { paddingTop: 44, overflow: 'hidden' },
    subjectsMarquee: { overflow: 'hidden' },
    subjectsRow: { flexDirection: 'row', gap: 24, paddingHorizontal: 24 },
    subjectPill: { flexDirection: 'row', alignItems: 'center', gap: 24 },
    subjectText: { color: 'rgba(255,255,255,0.5)', fontSize: 15, fontWeight: '500' },
    subjectDot: { color: 'rgba(255,255,255,0.25)', fontSize: 15 },

    ctaWrap: { paddingHorizontal: 24, paddingTop: 52, alignItems: 'center', gap: 12 },
    ctaTitle: { color: '#fff', fontSize: 28, fontWeight: '800', textAlign: 'center' },
    ctaSubtitle: { color: 'rgba(255,255,255,0.55)', fontSize: 16, textAlign: 'center' },
    ctaBtn: { marginTop: 16, borderRadius: 999, overflow: 'hidden' },
    ctaBtnGrad: { paddingHorizontal: 32, paddingVertical: 14, borderRadius: 999 },
    ctaBtnText: { color: BTN_TEXT, fontSize: 16, fontWeight: '800' },
})
