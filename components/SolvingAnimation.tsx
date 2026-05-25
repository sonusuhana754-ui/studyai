import React, { useEffect } from 'react'
import { View, StyleSheet } from 'react-native'
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  Easing,
  FadeIn,
} from 'react-native-reanimated'
import { ACCENT } from '@/lib/theme'

export function SolvingAnimation() {
  const scale = useSharedValue(1)
  const rotate = useSharedValue(0)

  useEffect(() => {
    scale.value = withRepeat(
      withSequence(
        withTiming(1.15, { duration: 900, easing: Easing.inOut(Easing.ease) }),
        withTiming(1, { duration: 900, easing: Easing.inOut(Easing.ease) })
      ),
      -1
    )
    rotate.value = withRepeat(
      withTiming(360, { duration: 8000, easing: Easing.linear }),
      -1
    )
  }, [])

  const ringStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotate.value}deg` }, { scale: scale.value }],
  }))

  const coreStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }))

  return (
    <Animated.View entering={FadeIn.duration(400)} style={styles.wrap}>
      <Animated.View style={[styles.ring, ringStyle]} />
      <Animated.View style={[styles.ringInner, ringStyle]} />
      <Animated.Text style={[styles.core, coreStyle]}>✦</Animated.Text>
      <View style={styles.dots}>
        {['📐', '🧪', '📚', '⚡'].map((emoji, i) => (
          <Animated.Text
            key={i}
            entering={FadeIn.delay(200 + i * 120).duration(400)}
            style={[styles.orbitEmoji, ORBIT_POSITIONS[i]]}
          >
            {emoji}
          </Animated.Text>
        ))}
      </View>
    </Animated.View>
  )
}

const ORBIT_POSITIONS = [
  { top: -8, left: -28 },
  { top: -8, right: -28 },
  { bottom: -8, left: -28 },
  { bottom: -8, right: -28 },
]

const styles = StyleSheet.create({
  wrap: {
    width: 140,
    height: 140,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ring: {
    position: 'absolute',
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 2,
    borderColor: 'rgba(14,165,164,0.35)',
    borderTopColor: ACCENT,
    borderRightColor: ACCENT,
  },
  ringInner: {
    position: 'absolute',
    width: 90,
    height: 90,
    borderRadius: 45,
    borderWidth: 1,
    borderColor: 'rgba(167,139,250,0.25)',
    borderBottomColor: '#a78bfa',
  },
  core: {
    fontSize: 36,
    color: ACCENT,
  },
  dots: {
    ...StyleSheet.absoluteFillObject,
  },
  orbitEmoji: {
    position: 'absolute',
    fontSize: 22,
  },
})
