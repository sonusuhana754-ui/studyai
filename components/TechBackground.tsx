import React, { useEffect } from 'react'
import { StyleSheet, View, Dimensions } from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import Svg, { Defs, Line, RadialGradient, Stop, Circle, Rect } from 'react-native-svg'
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  Easing,
} from 'react-native-reanimated'
import { ACCENT, BG, CYBER_VIOLET, CYBER_MAGENTA, CYBER_LIME } from '@/lib/theme'

const { width: W, height: H } = Dimensions.get('window')
const GRID_STEP = 32

type OrbConfig = {
  size: number
  left: number
  top: number
  color: string
  duration: number
}

const ORBS: OrbConfig[] = [
  { size: 140, left: -40, top: H * 0.06, color: ACCENT, duration: 5000 },
  { size: 90, left: W * 0.72, top: H * 0.1, color: CYBER_VIOLET, duration: 4200 },
  { size: 70, left: W * 0.1, top: H * 0.5, color: CYBER_MAGENTA, duration: 5500 },
  { size: 110, left: W * 0.5, top: H * 0.62, color: CYBER_LIME, duration: 4800 },
]

function GlowOrb({ config }: { config: OrbConfig }) {
  const translateY = useSharedValue(0)
  const scale = useSharedValue(1)

  useEffect(() => {
    translateY.value = withRepeat(
      withSequence(
        withTiming(-22, { duration: config.duration / 2, easing: Easing.inOut(Easing.sin) }),
        withTiming(22, { duration: config.duration / 2, easing: Easing.inOut(Easing.sin) })
      ),
      -1,
      true
    )
    scale.value = withRepeat(
      withSequence(
        withTiming(1.08, { duration: config.duration / 2 }),
        withTiming(0.94, { duration: config.duration / 2 })
      ),
      -1,
      true
    )
  }, [])

  const style = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }, { scale: scale.value }],
  }))

  return (
    <Animated.View
      pointerEvents="none"
      style={[
        styles.orb,
        {
          width: config.size,
          height: config.size,
          borderRadius: config.size / 2,
          left: config.left,
          top: config.top,
          backgroundColor: config.color,
          shadowColor: config.color,
        },
        style,
      ]}
    />
  )
}

function GridOverlay() {
  const lines: React.ReactNode[] = []
  for (let x = 0; x <= W; x += GRID_STEP) {
    lines.push(
      <Line
        key={`v${x}`}
        x1={x}
        y1={0}
        x2={x}
        y2={H}
        stroke="rgba(34,211,238,0.06)"
        strokeWidth={1}
      />
    )
  }
  for (let y = 0; y <= H; y += GRID_STEP) {
    lines.push(
      <Line
        key={`h${y}`}
        x1={0}
        y1={y}
        x2={W}
        y2={y}
        stroke="rgba(34,211,238,0.06)"
        strokeWidth={1}
      />
    )
  }
  return (
    <Svg width={W} height={H} style={StyleSheet.absoluteFill} pointerEvents="none">
      <Defs>
        <RadialGradient id="vignette" cx="50%" cy="30%" r="70%">
          <Stop offset="0%" stopColor="rgba(34,211,238,0.08)" />
          <Stop offset="100%" stopColor="transparent" />
        </RadialGradient>
      </Defs>
      {lines}
      <Rect x={0} y={0} width={W} height={H} fill="url(#vignette)" />
      <Circle cx={W * 0.85} cy={H * 0.15} r={120} fill="rgba(129,140,248,0.06)" />
      <Circle cx={W * 0.12} cy={H * 0.75} r={90} fill="rgba(244,114,182,0.05)" />
    </Svg>
  )
}

/** Full-screen cyber backdrop: gradient mesh, grid, floating glow orbs */
export function TechBackground() {
  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      <LinearGradient
        colors={[BG, '#0a1228', '#0d1035', BG]}
        locations={[0, 0.35, 0.7, 1]}
        style={StyleSheet.absoluteFill}
      />
      <GridOverlay />
      {ORBS.map((o, i) => (
        <GlowOrb key={i} config={o} />
      ))}
    </View>
  )
}

const styles = StyleSheet.create({
  orb: {
    position: 'absolute',
    opacity: 0.22,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.9,
    shadowRadius: 40,
    elevation: 0,
  },
})
