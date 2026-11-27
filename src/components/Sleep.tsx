import { useId } from 'react'
import { SLEEP_COLORS } from '../palette'
import { useScrub } from './useScrub'
import { clockMinutes } from '../dates'

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

/** 단계 사이 세로 연결선 색 (옅은 보라) */
const JOIN_COLOR = '#DCCFFB'

/** 단계별 층 (위→아래: 깸·렘·얕은·깊은) — 하이프노그램 세로 위치 */
const HYPNO_LANES: readonly SleepStage[] = ['awake', 'rem', 'light', 'deep']
function clockLabel(min: number) {
  const m = ((Math.round(min) % 1440) + 1440) % 1440
  return `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`
}

/** start·end(취침·기상 시각)를 주면 꾹 눌러 단계와 시간대를 읽을 수 있다 (상세용) */
export function SleepHypnogram({ segments, height = 36, detail = false, className, start, end }: { segments: readonly SleepSegment[]; height?: number; detail?: boolean; className?: string; start?: string; end?: string }) {
  const scrub = useScrub<HTMLDivElement>()
  const gradientId = useId()
  const width = 300
  const total = segments.reduce((a, s) => a + s.min, 0) || 1
  const lane = height / HYPNO_LANES.length
  const bar = detail ? lane * 0.6 : 3
  const corner = detail ? 2 : bar / 2
  const cy = (st: SleepStage) => HYPNO_LANES.indexOf(st) * lane + lane / 2
  let x = 0
  const blocks = segments.map((sg) => {
    const w = (sg.min / total) * width
    const b = { x, w, stage: sg.stage }
    x += w
    return b
  })
  const interactive = start !== undefined && end !== undefined
  const at = interactive && scrub.pos !== null ? scrub.pos * width : null
  const pickIdx = at === null ? -1 : Math.max(0, blocks.findIndex((b, i) => at < b.x + b.w || i === blocks.length - 1))
  const pick = pickIdx >= 0 ? blocks[pickIdx] : null
  // 가로축은 취침~기상 시각이므로 띠의 위치를 그 구간에 그대로 대응시킨다
  const from = interactive ? clockMinutes(start) : 0
  const span = interactive ? ((clockMinutes(end) - from + 1440) % 1440 || 1440) : 0
  const tipAt = pick ? ((pick.x + pick.w / 2) / width) * 100 : 0
  const chart = (
    <svg className={className} viewBox={`0 0 ${width} ${height}`} width="100%" height={height} preserveAspectRatio="none" aria-hidden>
      {detail && (
        <defs>
          {HYPNO_LANES.map((stage) => (
            <linearGradient key={stage} id={`${gradientId}-${stage}`} x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor={SLEEP_TONES[stage]} stopOpacity={0.78} />
              <stop offset="100%" stopColor={SLEEP_TONES[stage]} />
            </linearGradient>
          ))}
        </defs>
      )}
      {detail && HYPNO_LANES.map((st, i) => (
        <line key={st} x1={0} x2={width} y1={(i + 1) * lane} y2={(i + 1) * lane} stroke={i === HYPNO_LANES.length - 1 ? '#D6DAE0' : '#EEF0F3'} strokeWidth={1} vectorEffect="non-scaling-stroke" />
      ))}
      {blocks.map((b, i) => (i === 0 || blocks[i - 1].stage === b.stage ? null : (
        <line key={`c${i}`} x1={b.x} x2={b.x} y1={cy(blocks[i - 1].stage)} y2={cy(b.stage)} stroke={JOIN_COLOR} strokeWidth={1} vectorEffect="non-scaling-stroke" />
      )))}
      {/* 고른 구간이 있으면 나머지 막대를 흐리게 */}
      {blocks.map((b, i) => (
        <rect key={i} x={b.x.toFixed(2)} y={cy(b.stage) - bar / 2} width={b.w.toFixed(2)} height={bar} rx={Math.min(corner, b.w / 2)} fill={detail ? `url(#${gradientId}-${b.stage})` : SLEEP_TONES[b.stage]} opacity={pick && i !== pickIdx ? 0.3 : 1} />
      ))}
    </svg>
  )
  if (!interactive) return chart
  return (
    <div className="chart-scrub" ref={scrub.ref}>
      {pick && (
        <div className="chart-tip" style={{ left: `${tipAt}%`, transform: `translateX(-${tipAt}%)` }}>
          <i style={{ background: SLEEP_TONES[pick.stage] }} />
          <b>{SLEEP_STAGE_ORDER.find((st) => st.stage === pick.stage)?.full}</b>
          <span>{clockLabel(from + (pick.x / width) * span)}–{clockLabel(from + ((pick.x + pick.w) / width) * span)}</span>
        </div>
      )}
      {chart}
    </div>
  )
}
