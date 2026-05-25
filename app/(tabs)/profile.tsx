import { useState } from 'react'
import { View, ScrollView, StyleSheet, Pressable, Dimensions } from 'react-native'
import { router } from 'expo-router'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import { LinearGradient } from 'expo-linear-gradient'
import { Text as UIText } from '@/components/ui/Text'
import { Card } from '@/components/ui/Card'
import { AlertModal } from '@/components/ui/AppModal'
import SettingsRow from '@/components/ui/SettingsRow'
import { useSubscription } from '@/contexts/SubscriptionContext'
import { logoutRevenueCat } from '@/lib/purchases'
import { supabase } from '@/lib/supabase'
import { track } from '@/lib/analytics'
import {
    ACCENT,
    BG,
    TEXT_SECONDARY,
    TEXT_TERTIARY,
} from '@/lib/theme'
import { TAB_BAR_CLEARANCE } from '@/components/TabBar'
import { TechBackground } from '@/components/TechBackground'
import { demoUser } from '@/lib/mockData'
import { useProfile } from '@/hooks/useProfile'

const { width: SW } = Dimensions.get('window')

const SPARKLINE_DATA = [40, 65, 30, 80, 55, 90, 70]
const KNOWLEDGE_SUBJECTS = [
  { name: 'Math', color: '#3b82f6', size: 64 },
  { name: 'History', color: '#f59e0b', size: 48 },
  { name: 'Chemistry', color: '#10b981', size: 56 },
  { name: 'Physics', color: '#8b5cf6', size: 44 },
  { name: 'Biology', color: '#f97316', size: 40 },
]

export default function ProfileScreen() {
    const insets = useSafeAreaInsets()
    const { isPremium } = useSubscription()
    const { data: profile } = useProfile()
    const [signOutModal, setSignOutModal] = useState(false)
    const [signingOut, setSigningOut] = useState(false)
    const [errorModal, setErrorModal] = useState<string | null>(null)

    async function handleSignOut() {
        setSigningOut(true)
        try {
            track('logout')
            await logoutRevenueCat()
            const { error } = await supabase.auth.signOut()
            if (error) throw error
        } catch (e: any) {
            setErrorModal(e?.message ?? 'Sign out failed. Please try again.')
        } finally {
            setSigningOut(false)
        }
    }

    const initials = profile?.initials ?? demoUser.initials
    const email = profile?.email ?? demoUser.email
    const fullName = profile?.fullName ?? demoUser.fullName

    return (
        <View style={{ flex: 1, backgroundColor: BG }}>
        <TechBackground />
        <ScrollView
            style={{ flex: 1 }}
            contentContainerStyle={[s.container, { paddingTop: insets.top + 16, paddingBottom: TAB_BAR_CLEARANCE + 16 }]}
            showsVerticalScrollIndicator={false}
        >
            <Card style={s.heroCard}>
                <LinearGradient
                    colors={['rgba(14, 165, 164, 0.12)', 'rgba(255,255,255,0.02)']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={StyleSheet.absoluteFillObject}
                />

                <View style={s.avatarWrap}>
                    <UIText style={s.avatarText}>{initials}</UIText>
                    {isPremium && (
                        <View style={s.premiumDot}>
                            <Ionicons name="sparkles" size={10} color="#fff" />
                        </View>
                    )}
                </View>

                <UIText style={s.name}>{fullName}</UIText>
                <UIText style={s.email}>{email}</UIText>
                <View style={s.studentBadge}>
                    <UIText style={s.studentBadgeText}>Student</UIText>
                </View>

                <View style={s.heroStatsRow}>
                    <View style={s.heroStat}>
                        <UIText style={s.heroStatValue}>24</UIText>
                        <UIText style={s.heroStatLabel}>Problems</UIText>
                    </View>
                    <View style={s.heroStatDivider} />
                    <View style={s.heroStat}>
                        <UIText style={s.heroStatValue}>140</UIText>
                        <UIText style={s.heroStatLabel}>XP</UIText>
                    </View>
                    <View style={s.heroStatDivider} />
                    <View style={s.heroStat}>
                        <UIText style={s.heroStatValue}>3</UIText>
                        <UIText style={s.heroStatLabel}>day streak 🔥</UIText>
                    </View>
                </View>
            </Card>

            <Card style={s.tipCard}>
                <View style={s.tipRow}>
                    <Ionicons name="bulb-outline" size={20} color={ACCENT} />
                    <UIText style={s.tipText}>
                        Tip: Do 10 problems daily to keep your streak!
                    </UIText>
                </View>
            </Card>

            <UIText style={s.sectionTitle}>Your progress</UIText>
            <View style={s.analyticsGrid}>
                <Card style={s.analyticsCard}>
                    <UIText style={s.analyticsLabel}>Problems this week</UIText>
                    <UIText style={s.analyticsValue}>12</UIText>
                    <View style={s.sparklineRow}>
                        {SPARKLINE_DATA.map((height, i) => (
                            <View
                                key={i}
                                style={[s.sparklineBar, { height: `${height}%`, backgroundColor: ACCENT }]}
                            />
                        ))}
                    </View>
                </Card>

                <Card style={s.analyticsCard}>
                    <UIText style={s.analyticsLabel}>Flashcard accuracy</UIText>
                    <View style={s.circularProgressWrap}>
                        <View style={s.circularProgressBg}>
                            <View style={[s.circularProgressFill, { borderTopColor: ACCENT, borderRightColor: ACCENT }]} />
                        </View>
                        <UIText style={s.circularProgressText}>78%</UIText>
                    </View>
                </Card>

                <Card style={s.analyticsCard}>
                    <UIText style={s.analyticsLabel}>Strongest subject</UIText>
                    <View style={s.strongestSubjectRow}>
                        <Ionicons name="trophy-outline" size={24} color="#fbbf24" />
                        <UIText style={s.strongestSubjectText}>Mathematics</UIText>
                    </View>
                </Card>

                <Card style={s.analyticsCard}>
                    <UIText style={s.analyticsLabel}>Due for review</UIText>
                    <View style={s.dueReviewRow}>
                        <Ionicons name="notifications-outline" size={24} color={ACCENT} />
                        <UIText style={s.dueReviewText}>12 cards</UIText>
                    </View>
                </Card>
            </View>

            <UIText style={s.sectionTitle}>Knowledge map</UIText>
            <Pressable
                onPress={() => {}}
                style={({ pressed }) => [s.knowledgeMapCard, pressed && { opacity: 0.85 }]}
            >
                <View style={s.knowledgeCirclesRow}>
                    {KNOWLEDGE_SUBJECTS.map((subj, i) => (
                        <View key={i} style={s.knowledgeCircleWrap}>
                            <View style={[s.knowledgeCircle, { width: subj.size, height: subj.size, backgroundColor: subj.color }]} />
                            <UIText style={s.knowledgeCircleLabel}>{subj.name}</UIText>
                        </View>
                    ))}
                </View>
                <UIText style={s.knowledgeMapLink}>Full knowledge graph →</UIText>
            </Pressable>

            <UIText style={s.sectionTitle}>Study settings</UIText>
            <Card compact style={s.sectionCard}>
                <SettingsRow icon="trending-up-outline" label="Daily goal" subLabel="20 problems" onPress={() => {}} />
                <SettingsRow icon="time-outline" label="Reminder time" subLabel="6:00 PM" onPress={() => {}} />
                <View style={s.preferredSubjectsRow}>
                    <View style={s.preferredSubjectsLabelWrap}>
                        <Ionicons name="heart-outline" size={20} color="rgba(255,255,255,0.6)" />
                        <UIText style={s.preferredSubjectsLabel}>Preferred subjects</UIText>
                    </View>
                    <View style={s.preferredSubjectsTags}>
                        {['Math', 'Physics', 'Chemistry'].map((tag, i) => (
                            <View key={i} style={s.subjectTag}>
                                <UIText style={s.subjectTagText}>{tag}</UIText>
                            </View>
                        ))}
                    </View>
                </View>
            </Card>

            <UIText style={s.sectionTitle}>Account</UIText>
            <Card compact style={s.sectionCard}>
                <SettingsRow icon="settings-outline" label="Settings" onPress={() => router.push('/settings')} />
                <SettingsRow icon="help-buoy-outline" label="Help & Support" onPress={() => router.push('/support')} />
                <SettingsRow icon="document-text-outline" label="Privacy Policy" onPress={() => router.push('/privacy')} />
                <SettingsRow icon="shield-checkmark-outline" label="Terms of Service" onPress={() => router.push('/terms')} last={true} />
            </Card>

            <Pressable
                onPress={() => setSignOutModal(true)}
                disabled={signingOut}
                style={({ pressed }) => [s.signOutBtn, (pressed || signingOut) && { opacity: 0.72 }]}
            >
                <Ionicons name="log-out-outline" size={17} color="rgba(255,255,255,0.45)" />
                <UIText style={s.signOutText}>{signingOut ? 'Signing out…' : 'Sign out'}</UIText>
            </Pressable>

            <AlertModal
                visible={signOutModal}
                title="Sign out"
                message="You will be signed out of your account."
                buttons={[
                    { text: 'Cancel', style: 'cancel', onPress: () => setSignOutModal(false) },
                    { text: 'Sign out', style: 'destructive', onPress: () => { setSignOutModal(false); handleSignOut() } },
                ]}
                onDismiss={() => setSignOutModal(false)}
            />

            <AlertModal
                visible={!!errorModal}
                title="Error"
                message={errorModal ?? ''}
                buttons={[{ text: 'OK', onPress: () => setErrorModal(null) }]}
                onDismiss={() => setErrorModal(null)}
            />
        </ScrollView>
        </View>
    )
}

const s = StyleSheet.create({
    container: { paddingHorizontal: 20, gap: 14 },
    heroCard: {
        overflow: 'hidden',
        alignItems: 'center',
        gap: 6,
        paddingVertical: 22,
        paddingHorizontal: 16,
    },
    avatarWrap: {
        width: 72,
        height: 72,
        borderRadius: 36,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(255,255,255,0.18)',
        marginBottom: 4,
    },
    avatarText: { fontSize: 26, fontWeight: '800', color: '#fff' },
    premiumDot: {
        position: 'absolute',
        bottom: 0,
        right: 0,
        width: 20,
        height: 20,
        borderRadius: 999,
        backgroundColor: ACCENT,
        borderWidth: 2,
        borderColor: BG,
        alignItems: 'center',
        justifyContent: 'center',
    },
    name: { fontSize: 20, fontWeight: '800', color: '#fff', letterSpacing: -0.3 },
    email: { fontSize: 13, color: TEXT_SECONDARY },
    studentBadge: {
        paddingHorizontal: 12,
        paddingVertical: 4,
        borderRadius: 999,
        backgroundColor: 'rgba(14, 165, 164, 0.12)',
        marginTop: 2,
    },
    studentBadgeText: { fontSize: 12, color: ACCENT, fontWeight: '700' },
    heroStatsRow: {
        flexDirection: 'row',
        marginTop: 12,
        gap: 16,
        alignItems: 'center',
    },
    heroStat: {
        alignItems: 'center',
        gap: 2,
    },
    heroStatValue: { fontSize: 20, fontWeight: '800', color: '#fff' },
    heroStatLabel: { fontSize: 12, color: TEXT_SECONDARY },
    heroStatDivider: {
        width: 1,
        height: 32,
        backgroundColor: 'rgba(255,255,255,0.1)',
    },
    tipCard: {
        paddingVertical: 14,
        paddingHorizontal: 16,
        backgroundColor: 'rgba(14, 165, 164, 0.05)',
        borderColor: 'rgba(14, 165, 164, 0.15)',
    },
    tipRow: {
        flexDirection: 'row',
        gap: 10,
        alignItems: 'flex-start',
    },
    tipText: {
        flex: 1,
        fontSize: 13,
        color: '#fff',
        lineHeight: 18,
    },
    sectionTitle: {
        fontSize: 11,
        fontWeight: '700',
        color: TEXT_TERTIARY,
        letterSpacing: 0.8,
        textTransform: 'uppercase',
        marginTop: 3,
        marginBottom: -4,
    },
    analyticsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 12,
    },
    analyticsCard: {
        width: (SW - 52) / 2,
        paddingVertical: 16,
        paddingHorizontal: 14,
        gap: 6,
    },
    analyticsLabel: {
        fontSize: 12,
        color: TEXT_SECONDARY,
        fontWeight: '500',
    },
    analyticsValue: {
        fontSize: 22,
        color: '#fff',
        fontWeight: '800',
    },
    sparklineRow: {
        flexDirection: 'row',
        gap: 4,
        alignItems: 'flex-end',
        height: 40,
        marginTop: 4,
    },
    sparklineBar: {
        flex: 1,
        borderRadius: 999,
        minHeight: 4,
    },
    circularProgressWrap: {
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 8,
    },
    circularProgressBg: {
        width: 60,
        height: 60,
        borderRadius: 30,
        borderWidth: 6,
        borderColor: 'rgba(255,255,255,0.1)',
        position: 'relative',
    },
    circularProgressFill: {
        position: 'absolute',
        top: -6,
        left: -6,
        width: 60,
        height: 60,
        borderRadius: 30,
        borderWidth: 6,
        borderColor: 'transparent',
        borderLeftColor: 'rgba(255,255,255,0.1)',
        borderBottomColor: 'rgba(255,255,255,0.1)',
        transform: [{ rotate: '45deg' }],
    },
    circularProgressText: {
        position: 'absolute',
        fontSize: 18,
        color: '#fff',
        fontWeight: '800',
    },
    strongestSubjectRow: {
        flexDirection: 'row',
        gap: 10,
        alignItems: 'center',
        marginTop: 4,
    },
    strongestSubjectText: {
        fontSize: 16,
        color: '#fff',
        fontWeight: '700',
    },
    dueReviewRow: {
        flexDirection: 'row',
        gap: 10,
        alignItems: 'center',
        marginTop: 4,
    },
    dueReviewText: {
        fontSize: 16,
        color: '#fff',
        fontWeight: '700',
    },
    knowledgeMapCard: {
        paddingVertical: 18,
        paddingHorizontal: 16,
        gap: 12,
    },
    knowledgeCirclesRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    knowledgeCircleWrap: {
        alignItems: 'center',
        gap: 6,
    },
    knowledgeCircle: {
        borderRadius: 999,
    },
    knowledgeCircleLabel: {
        fontSize: 11,
        color: TEXT_SECONDARY,
        fontWeight: '500',
    },
    knowledgeMapLink: {
        fontSize: 13,
        color: ACCENT,
        fontWeight: '600',
        textAlign: 'center',
    },
    sectionCard: { padding: 0, overflow: 'hidden' },
    preferredSubjectsRow: {
        paddingVertical: 12,
        paddingHorizontal: 16,
        gap: 10,
    },
    preferredSubjectsLabelWrap: {
        flexDirection: 'row',
        gap: 10,
        alignItems: 'center',
    },
    preferredSubjectsLabel: {
        fontSize: 14,
        color: '#fff',
        fontWeight: '600',
    },
    preferredSubjectsTags: {
        flexDirection: 'row',
        gap: 8,
        flexWrap: 'wrap',
    },
    subjectTag: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 999,
        backgroundColor: 'rgba(255,255,255,0.06)',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
    },
    subjectTagText: {
        fontSize: 12,
        color: '#fff',
        fontWeight: '600',
    },
    signOutBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 7,
        paddingVertical: 10,
    },
    signOutText: { color: 'rgba(255,255,255,0.45)', fontSize: 14, fontWeight: '500' },
})
