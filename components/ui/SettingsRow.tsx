import { Pressable, StyleSheet, ViewStyle, View } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { Text } from '@/components/ui/Text'
import { BORDER, TEXT_PRIMARY, TEXT_SECONDARY, TEXT_TERTIARY } from '@/lib/theme'

interface SettingsRowProps {
    icon: string
    label: string
    subLabel?: string
    onPress: () => void
    last?: boolean
    style?: ViewStyle
}

export default function SettingsRow({ icon, label, subLabel, onPress, last, style }: SettingsRowProps) {
    return (
        <Pressable
            onPress={onPress}
            style={({ pressed }) => [s.row, !last && s.divider, pressed && { opacity: 0.65 }, style]}
        >
            <Ionicons name={icon as any} size={18} color={TEXT_SECONDARY} />
            <View style={s.labelWrap}>
                <Text style={s.label}>{label}</Text>
                {subLabel && <Text style={s.subLabel}>{subLabel}</Text>}
            </View>
            <Ionicons name="chevron-forward" size={15} color={TEXT_TERTIARY} />
        </Pressable>
    )
}

const s = StyleSheet.create({
    row: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        paddingHorizontal: 14,
        paddingVertical: 13,
    },
    divider: {
        borderBottomWidth: StyleSheet.hairlineWidth,
        borderBottomColor: BORDER,
    },
    labelWrap: {
        flex: 1,
        gap: 2,
    },
    label: {
        fontSize: 14.5,
        color: TEXT_PRIMARY,
    },
    subLabel: {
        fontSize: 12,
        color: TEXT_SECONDARY,
    },
})
