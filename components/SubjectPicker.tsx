import { useMemo, useState } from 'react'
import { View, ScrollView, Pressable, StyleSheet, TextInput } from 'react-native'
import { Text } from '@/components/ui/Text'
import { ACCENT, ACCENT_DIM, BORDER, TEXT_SECONDARY } from '@/lib/theme'
import {
  ACADEMIC_STREAMS,
  AcademicStreamId,
  DEFAULT_STREAM_ID,
  getStream,
  type SubjectItem,
} from '@/lib/subjects'

type SingleProps = {
  mode?: 'single'
  value: string
  onChange: (label: string) => void
}

type MultiProps = {
  mode: 'multi'
  value: string[]
  onChange: (labels: string[]) => void
  max?: number
}

type Props = (SingleProps | MultiProps) & {
  showSearch?: boolean
  initialStream?: AcademicStreamId
}

export function SubjectPicker(props: Props) {
  const [streamId, setStreamId] = useState<AcademicStreamId>(props.initialStream ?? DEFAULT_STREAM_ID)
  const [query, setQuery] = useState('')
  const stream = getStream(streamId)
  const isMulti = props.mode === 'multi'

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return stream.subjects
    return stream.subjects.filter((s) => s.label.toLowerCase().includes(q))
  }, [stream.subjects, query])

  const toggle = (item: SubjectItem) => {
    if (!isMulti) {
      ;(props as SingleProps).onChange(item.label)
      return
    }
    const { value, onChange, max = 8 } = props as MultiProps
    if (value.includes(item.label)) {
      onChange(value.filter((l) => l !== item.label))
    } else if (value.length < max) {
      onChange([...value, item.label])
    }
  }

  const isSelected = (label: string) =>
    isMulti ? (props as MultiProps).value.includes(label) : (props as SingleProps).value === label

  return (
    <View style={s.wrap}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={s.streamRow}
      >
        {ACADEMIC_STREAMS.map((st) => (
          <Pressable
            key={st.id}
            onPress={() => {
              setStreamId(st.id)
              setQuery('')
            }}
            style={[s.streamChip, streamId === st.id && s.streamChipActive]}
          >
            <Text style={s.streamEmoji}>{st.emoji}</Text>
            <Text style={[s.streamLabel, streamId === st.id && s.streamLabelActive]}>
              {st.label}
            </Text>
          </Pressable>
        ))}
      </ScrollView>

      {props.showSearch !== false && (
        <TextInput
          style={s.search}
          placeholder={`Search in ${stream.label}…`}
          placeholderTextColor="#555"
          value={query}
          onChangeText={setQuery}
        />
      )}

      <View style={s.chipGrid}>
        {filtered.map((item) => {
          const active = isSelected(item.label)
          return (
            <Pressable
              key={`${streamId}-${item.id}`}
              onPress={() => toggle(item)}
              style={[
                s.chip,
                active && s.chipActive,
                { borderColor: active ? item.color : BORDER },
              ]}
            >
              <View style={[s.dot, { backgroundColor: item.color }]} />
              <Text style={[s.chipText, active && { color: '#fff' }]} numberOfLines={2}>
                {item.label}
              </Text>
            </Pressable>
          )
        })}
      </View>

      {isMulti && (props as MultiProps).value.length > 0 && (
        <Text style={s.hint}>
          Selected ({(props as MultiProps).value.length}): {(props as MultiProps).value.join(', ')}
        </Text>
      )}
    </View>
  )
}

const s = StyleSheet.create({
  wrap: { gap: 10 },
  streamRow: { gap: 8, paddingVertical: 2 },
  streamChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: BORDER,
    backgroundColor: 'rgba(10,18,40,0.6)',
  },
  streamChipActive: {
    borderColor: ACCENT,
    backgroundColor: ACCENT_DIM,
  },
  streamEmoji: { fontSize: 14 },
  streamLabel: { fontSize: 13, fontWeight: '600', color: TEXT_SECONDARY },
  streamLabelActive: { color: ACCENT, fontWeight: '700' },
  search: {
    backgroundColor: 'rgba(10,18,40,0.8)',
    borderWidth: 1,
    borderColor: BORDER,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: '#fff',
    fontSize: 14,
  },
  chipGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    backgroundColor: 'rgba(10,18,40,0.5)',
    maxWidth: '100%',
  },
  chipActive: { backgroundColor: 'rgba(34,211,238,0.12)' },
  dot: { width: 6, height: 6, borderRadius: 3 },
  chipText: { fontSize: 13, fontWeight: '600', color: TEXT_SECONDARY, flexShrink: 1 },
  hint: { fontSize: 12, color: TEXT_SECONDARY, lineHeight: 17 },
})
