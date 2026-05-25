import { View, StyleSheet, type ViewProps } from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import { SURFACE, BORDER, ACCENT_BORDER, BG_ELEVATED } from '@/lib/theme'

interface CardProps extends ViewProps {
  compact?: boolean
  /** Cyan glass glow border */
  glow?: boolean
}

/**
 * Glass cyber container card for panels and list items.
 */
export function Card({ compact, glow, style, children, ...rest }: CardProps) {
  return (
    <View
      style={[
        styles.outer,
        glow && styles.outerGlow,
        style,
      ]}
      {...rest}
    >
      <LinearGradient
        colors={[SURFACE, BG_ELEVATED]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.card, compact ? styles.compact : styles.normal]}
      >
        {children}
      </LinearGradient>
    </View>
  )
}

const styles = StyleSheet.create({
  outer: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: BORDER,
    overflow: 'hidden',
    shadowColor: '#22d3ee',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  outerGlow: {
    borderColor: ACCENT_BORDER,
    shadowOpacity: 0.18,
  },
  card: {
    borderRadius: 15,
  },
  normal: { padding: 16 },
  compact: { padding: 10 },
})
