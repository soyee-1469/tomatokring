import { SLEEP_COLORS } from '../palette'

/** 수면 단계 색 — 보라 한 색의 농담 4단계 (홈·상세 공통) */
export const SLEEP_TONES = SLEEP_COLORS.stages
export type SleepStage = keyof typeof SLEEP_TONES
export type SleepSegment = { stage: SleepStage; min: number }

export const SLEEP_STAGE_ORDER: readonly { stage: SleepStage; name: string; full: string }[] = [
  { stage: 'deep', name: '깊은', full: '깊은 수면' },
  { stage: 'rem', name: '렘', full: '렘 수면' },
  { stage: 'light', name: '얕은', full: '얕은 수면' },
  { stage: 'awake', name: '깸', full: '깬 상태' },
]

/** 지난밤 샘플 (합 432분 = 7시간 12분) */
export const SLEEP_LAST_NIGHT: readonly SleepSegment[] = [
  { stage: 'light', min: 18 }, { stage: 'deep', min: 52 }, { stage: 'light', min: 26 }, { stage: 'rem', min: 24 },
  { stage: 'light', min: 38 }, { stage: 'deep', min: 46 }, { stage: 'light', min: 30 }, { stage: 'rem', min: 32 },
  { stage: 'awake', min: 8 }, { stage: 'light', min: 44 }, { stage: 'rem', min: 36 }, { stage: 'light', min: 28 },
  { stage: 'awake', min: 10 }, { stage: 'light', min: 40 },
]

/** 수면 효율(%) 등급 */
export function sleepEfficiencyLevel(pct: number) {
  if (pct >= 81) return { label: '최상', tone: 'ok' as const }
  if (pct >= 61) return { label: '상', tone: 'ok' as const }
  if (pct >= 41) return { label: '보통', tone: 'warn' as const }
  if (pct >= 21) return { label: '하', tone: 'bad' as const }
  return { label: '최하', tone: 'bad' as const }
}

export function sleepMinutesLabel(min: number) {
  const h = Math.floor(min / 60)
  const m = min % 60
  if (h === 0) return `${m}분`
  if (m === 0) return `${h}시간`
  return `${h}시간 ${m}분`
}

export function sleepStageTotals(segments: readonly SleepSegment[]) {
  const total = segments.reduce((a, s) => a + s.min, 0)
  return SLEEP_STAGE_ORDER.map((st) => {
    const min = segments.filter((s) => s.stage === st.stage).reduce((a, s) => a + s.min, 0)
    return { ...st, min, pct: total ? Math.round((min / total) * 100) : 0 }
  })
}

export function SleepTimeline({ start, end, segments, legend = true }: { start: string; end: string; segments: readonly SleepSegment[]; legend?: boolean }) {
  const total = segments.reduce((a, s) => a + s.min, 0)
  return (
    <div className="sleep-timeline" aria-label={`지난밤 수면 ${start}부터 ${end}까지`}>
      <div className="sleep-timeline-bar">
        {segments.map((s, i) => (
          <span key={i} className={`st-${s.stage}`} style={{ flex: s.min / total, background: SLEEP_TONES[s.stage] }} />
        ))}
      </div>
      <div className="sleep-timeline-axis"><span>{start} 취침</span><span>{end} 기상</span></div>
      {legend && (
        <ul className="sleep-timeline-legend">
          {SLEEP_STAGE_ORDER.map((st) => (
            <li key={st.stage}><i style={{ background: SLEEP_TONES[st.stage] }} />{st.name}</li>
          ))}
        </ul>
      )}
    </div>
  )
}
