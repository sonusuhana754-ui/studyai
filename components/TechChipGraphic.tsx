import React from 'react'
import { View, StyleSheet } from 'react-native'
import Svg, { Circle, Line, Polygon, Defs, LinearGradient, Stop } from 'react-native-svg'
import { ACCENT, CYBER_VIOLET } from '@/lib/theme'

type Props = { size?: number }

/** Decorative neural-chip SVG for hero areas */
export function TechChipGraphic({ size = 72 }: Props) {
  const c = size / 2
  const r = size * 0.38
  const pts = Array.from({ length: 6 }, (_, i) => {
    const a = (Math.PI / 3) * i - Math.PI / 6
    return `${c + r * Math.cos(a)},${c + r * Math.sin(a)}`
  }).join(' ')

  return (
    <View style={[styles.wrap, { width: size, height: size }]}>
      <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <Defs>
          <LinearGradient id="chipGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <Stop offset="0%" stopColor={ACCENT} stopOpacity="0.9" />
            <Stop offset="100%" stopColor={CYBER_VIOLET} stopOpacity="0.9" />
          </LinearGradient>
        </Defs>
        <Polygon
          points={pts}
          fill="none"
          stroke="url(#chipGrad)"
          strokeWidth={2}
          opacity={0.9}
        />
        <Polygon
          points={Array.from({ length: 6 }, (_, i) => {
            const a = (Math.PI / 3) * i - Math.PI / 6
            const ir = r * 0.5
            return `${c + ir * Math.cos(a)},${c + ir * Math.sin(a)}`
          }).join(' ')}
          fill="rgba(34,211,238,0.1)"
          stroke="rgba(34,211,238,0.25)"
          strokeWidth={1}
        />
        <Circle cx={c} cy={c} r={size * 0.12} fill={ACCENT} opacity={0.95} />
        <Circle cx={c} cy={c} r={size * 0.2} fill="none" stroke={ACCENT} strokeWidth={1} opacity={0.4} />
        {[0, 60, 120, 180, 240, 300].map((deg) => {
          const rad = (deg * Math.PI) / 180
          const x2 = c + (r + 8) * Math.cos(rad)
          const y2 = c + (r + 8) * Math.sin(rad)
          return (
            <Line
              key={deg}
              x1={c + r * 0.7 * Math.cos(rad)}
              y1={c + r * 0.7 * Math.sin(rad)}
              x2={x2}
              y2={y2}
              stroke={CYBER_VIOLET}
              strokeWidth={1.5}
              opacity={0.7}
            />
          )
        })}
        <Circle cx={c * 0.35} cy={c * 0.4} r={3} fill={ACCENT} opacity={0.8} />
        <Circle cx={c * 1.55} cy={c * 0.55} r={2.5} fill={CYBER_VIOLET} opacity={0.8} />
        <Circle cx={c * 1.2} cy={c * 1.45} r={2} fill="#f472b6" opacity={0.8} />
      </Svg>
    </View>
  )
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
    justifyContent: 'center',
  },
})
