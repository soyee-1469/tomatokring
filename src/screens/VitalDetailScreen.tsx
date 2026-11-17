import { AccuracyInfoButton } from '../components/AccuracyInfo'
import { CaretLeft, Drop, Heart, Thermometer, Wind, type Icon } from '@phosphor-icons/react'
import { useMemo, useState } from 'react'
import { Navigate, useNavigate, useParams } from 'react-router-dom'
import { BottomNav, Phone } from '../components/ui'
import { STRESS_COLORS, VITAL_COLORS, VITAL_NORMAL } from '../palette'

export type VitalId = 'hr' | 'spo2' | 'temp' | 'resp' | 'hrv'

type VitalDef = {
  id: VitalId
  label: string
  unit: string
  unitLabel: string
  color: string
  normalRange: string
  domain: [number, number]
  normal: [number, number]
  guide?: number
  format: (n: number) => string
  seed: number[]
  Icon: Icon
}

export const VITAL_DEFS: Record<VitalId, VitalDef> = {
  hr: {
    id: 'hr',
    label: '심장',
    unit: '회/분',
    unitLabel: '회/분',
    color: VITAL_COLORS.hr.color,
    normalRange: VITAL_NORMAL.hr,
    domain: [40, 140],
    normal: [60, 100],
    guide: 75,
    format: (n) => `${Math.round(n)}`,
    seed: [68, 66, 64, 62, 61, 60, 62, 70, 78, 82, 76, 74, 88, 92, 85, 79, 77, 82, 90, 86, 80, 74, 71, 69],
    Icon: Heart,
  },
  spo2: {
    id: 'spo2',
    label: '산소',
    unit: '%',
    unitLabel: '%',
    color: VITAL_COLORS.spo2.color,
    normalRange: VITAL_NORMAL.spo2,
    domain: [88, 100],
    normal: [95, 100],
    guide: 97,
    format: (n) => n.toFixed(0),
    seed: [96, 96, 95, 95, 96, 95, 94, 95, 95, 96, 95, 95, 96, 95, 94, 95, 95, 96, 95, 95, 96, 95, 95, 96],
    Icon: Drop,
  },
  temp: {
    id: 'temp',
    label: '체온',
    unit: '°C',
    unitLabel: '°C',
    color: VITAL_COLORS.temp.color,
    normalRange: VITAL_NORMAL.temp,
    domain: [35.4, 37.4],
    normal: [36.0, 36.8],
    guide: 36.4,
    format: (n) => n.toFixed(1),
    seed: [36.2, 36.15, 36.1, 36.05, 36.0, 36.05, 36.1, 36.2, 36.3, 36.35, 36.4, 36.42, 36.48, 36.5, 36.45, 36.42, 36.4, 36.38, 36.35, 36.32, 36.28, 36.25, 36.22, 36.2],
    Icon: Thermometer,
  },
  resp: {
    id: 'resp',
    label: '호흡',
    unit: '회/분',
    unitLabel: '회/분',
    color: VITAL_COLORS.resp.color,
    normalRange: VITAL_NORMAL.resp,
    domain: [6, 28],
    normal: [12, 20],
    guide: 16,
    format: (n) => `${Math.round(n)}`,
    seed: [14, 13, 13, 12, 12, 13, 14, 15, 16, 17, 17, 18, 18, 19, 18, 17, 18, 18, 17, 16, 15, 15, 14, 14],
    Icon: Wind,
  },
  hrv: {
    id: 'hrv',
    label: '심박변이도',
    unit: 'RMSSD',
    unitLabel: 'RMSSD',
    color: STRESS_COLORS.line,
    normalRange: '참고 20–60',
    domain: [10, 80],
    normal: [20, 60],
    guide: 40,
    format: (n) => `${Math.round(n)}`,
    seed: [42, 45, 48, 50, 52, 55, 50, 38, 32, 28, 30, 34, 36, 40, 38, 35, 33, 36, 40, 42, 44, 46, 45, 43],
    Icon: Heart,
  },
}

const DATES = [
  { d: '수', n: '1/10' },
  { d: '목', n: '1/11' },
  { d: '금', n: '1/12' },
  { d: '토', n: '1/13' },
  { d: '일', n: '1/14' },
  { d: '월', n: '1/15' },
]

type Range = 'day' | 'week'

function dayShift(seed: number[], dayIndex: number) {
  return seed.map((v, i) => {
    const wobble = ((i + dayIndex * 3) % 5) * 0.02 - 0.04
    return v * (1 + wobble * 0.15) + (dayIndex - 3) * (v > 40 ? 0.4 : 0.02)
  })
}

function smoothLine(xs: number[], ys: number[]) {
  if (xs.length === 0) return ''
  if (xs.length === 1) return `M${xs[0].toFixed(2)} ${ys[0].toFixed(2)}`
  let d = `M${xs[0].toFixed(2)} ${ys[0].toFixed(2)}`
  for (let i = 0; i < xs.length - 1; i++) {
    const x0 = xs[i - 1] ?? xs[i]
    const y0 = ys[i - 1] ?? ys[i]
    const x1 = xs[i]
    const y1 = ys[i]
    const x2 = xs[i + 1]
    const y2 = ys[i + 1]
    const x3 = xs[i + 2] ?? x2
    const y3 = ys[i + 2] ?? y2
    const cp1x = x1 + (x2 - x0) / 6
    const cp1y = y1 + (y2 - y0) / 6
    const cp2x = x2 - (x3 - x1) / 6
    const cp2y = y2 - (y3 - y1) / 6
    d += `C${cp1x.toFixed(2)} ${cp1y.toFixed(2)},${cp2x.toFixed(2)} ${cp2y.toFixed(2)},${x2.toFixed(2)} ${y2.toFixed(2)}`
  }
  return d
}

function DetailChart({
  color,
  min,
  max,
  points,
  guide,
  labels,
}: {
  color: string
  min: number
  max: number
  points: number[]
  guide?: number
  labels: string[]
}) {
  const w = 320
  const h = 160
  const padL = 8
  const padR = 8
  const padT = 12
  const padB = 22
  const uid = color.replace('#', '')
  const xs = points.map((_, i) => padL + (i / Math.max(1, points.length - 1)) * (w - padL - padR))
  const ys = points.map((p) => {
    const t = (p - min) / Math.max(0.001, max - min)
    return h - padB - t * (h - padT - padB)
  })
  const line = smoothLine(xs, ys)
  const area = `${line}L${xs[xs.length - 1].toFixed(2)} ${h - padB}L${xs[0].toFixed(2)} ${h - padB}Z`
  const guideY =
    guide != null
      ? h - padB - ((guide - min) / Math.max(0.001, max - min)) * (h - padT - padB)
      : null
  const tickIdx = [0, Math.floor(points.length / 2), points.length - 1]

  return (
    <svg className="vital-detail-main-chart" viewBox={`0 0 ${w} ${h}`} aria-hidden>
      <defs>
        <linearGradient id={`vd-${uid}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.14" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      {[0.25, 0.5, 0.75].map((t) => {
        const y = padT + t * (h - padT - padB)
        return <line key={t} x1={padL} y1={y} x2={w - padR} y2={y} stroke="#eceff3" strokeWidth="1" />
      })}
      <path d={area} fill={`url(#vd-${uid})`} />
      {guideY != null && (
        <line
          x1={padL}
          y1={guideY}
          x2={w - padR}
          y2={guideY}
          stroke="#c5ccd4"
          strokeWidth="1"
          strokeDasharray="3 4"
        />
      )}
      <path d={line} fill="none" stroke={color} strokeWidth="1.6" strokeLinejoin="round" strokeLinecap="round" />
      {tickIdx.map((i) => (
        <text
          key={i}
          x={xs[i]}
          y={h - 4}
          textAnchor={i === 0 ? 'start' : i === points.length - 1 ? 'end' : 'middle'}
          fontSize="10"
          fill="#9aa3ad"
          fontWeight="600"
        >
          {labels[i]}
        </text>
      ))}
    </svg>
  )
}

function isVitalId(v: string | undefined): v is VitalId {
  return !!v && v in VITAL_DEFS
}

/** 상단 원형 게이지 — 심장·산소·체온·호흡 동일 */
function VitalCircleGauge({
  value,
  display,
  unit,
  color,
  min,
  max,
  Icon: Glyph,
}: {
  value: number
  display: string
  unit: string
  color: string
  min: number
  max: number
  Icon: Icon
}) {
  const size = 220
  const stroke = 16
  const r = (size - stroke) / 2
  const c = 2 * Math.PI * r
  const t = Math.min(1, Math.max(0.08, (value - min) / Math.max(0.001, max - min)))
  const dash = c * t
  const uid = `vital-ring-${color.replace('#', '')}`

  return (
    <div className="hr-circle-wrap">
      <svg className="hr-circle-svg" viewBox={`0 0 ${size} ${size}`} aria-hidden>
        <defs>
          <linearGradient id={uid} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={color} stopOpacity="0.35" />
            <stop offset="45%" stopColor={color} stopOpacity="0.85" />
            <stop offset="100%" stopColor={color} />
          </linearGradient>
        </defs>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#f0f2f5" strokeWidth={stroke} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={`url(#${uid})`}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={`${dash.toFixed(2)} ${(c - dash).toFixed(2)}`}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
        <circle cx={size / 2} cy={stroke / 2} r={5} fill={color} />
      </svg>
      <div className="hr-circle-center">
        <div className="hr-circle-value">
          <strong>{display}</strong>
          <Glyph size={22} weight="fill" color={color} className="hr-circle-heart" />
        </div>
        <span>{unit}</span>
      </div>
    </div>
  )
}

function statusTone(value: number, normal: [number, number]) {
  if (value < normal[0] || value > normal[1]) return 'warn' as const
  return 'ok' as const
}

export function VitalDetailScreen() {
  const { metricId } = useParams()
  const navigate = useNavigate()
  const [day, setDay] = useState(5)
  const [range, setRange] = useState<Range>('day')
  const valid = isVitalId(metricId)
  const def = valid ? VITAL_DEFS[metricId] : VITAL_DEFS.hr

  const hourly = useMemo(() => dayShift(def.seed, day), [def.seed, day])
  const weekly = useMemo(
    () =>
      DATES.map((_, i) => {
        const series = dayShift(def.seed, i)
        return series.reduce((a, b) => a + b, 0) / series.length
      }),
    [def.seed],
  )

  if (!valid) return <Navigate to="/vitaling/live" replace />

  const points = range === 'day' ? hourly : weekly
  const labels = range === 'day' ? ['00시', '12시', '23시'] : [DATES[0].n, DATES[3].n, DATES[5].n]
  const latest = points[points.length - 1]
  const avg = points.reduce((a, b) => a + b, 0) / points.length
  const minV = Math.min(...points)
  const maxV = Math.max(...points)
  const hourRows = hourly.map((v, i) => ({
    time: `${String(i).padStart(2, '0')}:00`,
    value: v,
  }))
  const tone = statusTone(latest, def.normal)
  const statusLabel = tone === 'ok' ? '정상' : latest < def.normal[0] ? '낮음' : '높음'
  const Glyph = def.Icon

  return (
    <div className="stage">
      <Phone>
        <div className="screen with-nav vital-detail-screen">
          <div className="vital-detail-top">
            <div className="vital-detail-nav">
              <button type="button" className="icon-btn light" aria-label="뒤로" onClick={() => navigate(-1)}>
                <CaretLeft size={22} weight="light" color="#fff" />
              </button>
              <h1>{def.label}</h1>
              <AccuracyInfoButton className="light-info" />
            </div>
            <div className="date-strip analysis-dates">
              {DATES.map((item, i) => (
                <button
                  key={item.n}
                  type="button"
                  className={`date-chip ${day === i ? 'on' : ''}`}
                  onClick={() => setDay(i)}
                >
                  <span>{item.d}</span>
                  <b>{item.n}</b>
                </button>
              ))}
            </div>
          </div>

          <div className="vital-detail-body">
            <div className="vital-range-tabs">
              <button type="button" className={range === 'day' ? 'on' : ''} onClick={() => setRange('day')}>
                시간별
              </button>
              <button type="button" className={range === 'week' ? 'on' : ''} onClick={() => setRange('week')}>
                날짜별
              </button>
            </div>

            {/* 공통 레이아웃: 캡션 → 원형 → 추이 → 상태 → 통계 → 목록 */}
            <div className="vital-detail-panel">
              <em className="vital-detail-caption">
                {range === 'day' ? `${DATES[day].n} · 최근` : '주간 평균'}
              </em>

              <VitalCircleGauge
                value={latest}
                display={def.format(latest)}
                unit={def.unitLabel}
                color={def.color}
                min={def.domain[0]}
                max={def.domain[1]}
                Icon={Glyph}
              />

              <DetailChart
                color={def.color}
                min={def.domain[0]}
                max={def.domain[1]}
                points={points}
                guide={def.guide}
                labels={labels}
              />

              <div className={`vital-detail-status tone-${tone}`}>
                <b>{statusLabel}</b>
                <strong>{def.normalRange}</strong>
                <span>
                  {range === 'day' ? '오늘 측정값 기준' : '선택한 기간 평균 기준'} · {def.label}
                </span>
              </div>
            </div>

            <div className="vital-stat-row">
              <div>
                <em>평균</em>
                <b>
                  {def.format(avg)}
                  <small>{def.unitLabel}</small>
                </b>
              </div>
              <div>
                <em>최저</em>
                <b>
                  {def.format(minV)}
                  <small>{def.unitLabel}</small>
                </b>
              </div>
              <div>
                <em>최고</em>
                <b>
                  {def.format(maxV)}
                  <small>{def.unitLabel}</small>
                </b>
              </div>
            </div>

            {range === 'day' && (
              <>
                <div className="ring-section-head tight">
                  <h3>시간대별</h3>
                </div>
                <div className="vital-hour-list">
                  {[...hourRows].reverse().map((row) => (
                    <div key={row.time} className="vital-hour-row">
                      <span>{row.time}</span>
                      <b style={{ color: def.color }}>
                        {def.format(row.value)}
                        <small>{def.unitLabel}</small>
                      </b>
                    </div>
                  ))}
                </div>
              </>
            )}

            {range === 'week' && (
              <>
                <div className="ring-section-head tight">
                  <h3>날짜별 평균</h3>
                </div>
                <div className="vital-hour-list">
                  {[...DATES].reverse().map((d, revI) => {
                    const i = DATES.length - 1 - revI
                    return (
                      <button
                        key={d.n}
                        type="button"
                        className="vital-hour-row as-btn"
                        onClick={() => {
                          setDay(i)
                          setRange('day')
                        }}
                      >
                        <span>
                          {d.d} · {d.n}
                        </span>
                        <b style={{ color: def.color }}>
                          {def.format(weekly[i])}
                          <small>{def.unitLabel}</small>
                        </b>
                      </button>
                    )
                  })}
                </div>
              </>
            )}
          </div>
          <BottomNav active="service" />
        </div>
      </Phone>
    </div>
  )
}
