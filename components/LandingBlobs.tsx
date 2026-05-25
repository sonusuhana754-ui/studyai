import React, { useEffect } from 'react'
import { StyleSheet, View, Dimensions } from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  Easing,
} from 'react-native-reanimated'
import { BG } from '@/lib/theme'

const { width: W, height: H } = Dimensions.get('window')

type Blob = { size: number; left: number; top: number; color: string; duration: number }

const BLOBS: Blob[] = [
  { size: W * 0.85, left: W * 0.35, top: -W * 0.2, color: 'rgba(34,211,238,0.14)', duration: 5000 },
  { size: W * 0.75, left: -W * 0.35, top: H * 0.35, color: 'rgba(129,140,248,0.12)', duration: 4500 },
  { size: W * 0.55, left: W * 0.5, top: H * 0.55, color: 'rgba(34,211,238,0.08)', duration: 5500 },
]

function BlobView({ blob }: { blob: Blob }) {
  const y = useSharedValue(0)
  useEffect(() => {
    y.value = withRepeat(
      withSequence(
        withTiming(-18, { duration: blob.duration / 2, easing: Easing.inOut(Easing.sin) }),
        withTiming(18, { duration: blob.duration / 2, easing: Easing.inOut(Easing.sin) })
      ),
      -1,
      true
    )
  }, [])
  const style = useAnimatedStyle(() => ({ transform: [{ translateY: y.value }] }))
  return (
    <Animated.View
      pointerEvents="none"
      style={[
        styles.blob,
        {
          width: blob.size,
          height: blob.size,
          borderRadius: blob.size / 2,
          left: blob.left,
          top: blob.top,
          backgroundColor: blob.color,
        },
        style,
      ]}
    />
  )
}

/** Soft teal/purple glow blobs — matches marketing landing reference */
export function LandingBlobs() {
  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      <LinearGradient
        colors={[BG, '#030508', BG]}
        locations={[0, 0.45, 1]}
        style={StyleSheet.absoluteFill}
      />
      {BLOBS.map((b, i) => (
        <BlobView key={i} blob={b} />
      ))}
      <LinearGradient
        colors={['transparent', 'rgba(5,8,16,0.6)', BG]}
        locations={[0, 0.75, 1]}
        style={[StyleSheet.absoluteFill, { top: H * 0.5 }]}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  blob: { position: 'absolute' },
})
