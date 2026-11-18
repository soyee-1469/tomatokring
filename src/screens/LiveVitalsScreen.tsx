import { AccuracyInfoButton } from '../components/AccuracyInfo'
import { useNavigate } from 'react-router-dom'
import { Header, Phone } from '../components/ui'
type VitalId = 'hr' | 'spo2' | 'temp' | 'hrv'

type Series = {
  id: VitalId
  color: string
  soft: string
  min: number
  max: number
  value: string
  label: string
  unit: string
  status: string
  points: number[]
  guide?: number
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

function Sparkline({
  color,
  min,
  max,
  points,
  guide,
}: {
  color: string
  min: number
  max: number
  points: number[]
  guide?: number
}) {
  const w = 280
  const h = 64
  const padX = 2
  const padY = 6
  const uid = color.replace('#', '')
  const xs = points.map((_, i) => padX + (i / Math.max(1, points.length - 1)) * (w - padX * 2))
  const ys = points.map((p) => {
    const t = (p - min) / Math.max(0.001, max - min)
    return h - padY - t * (h - padY * 2)
  })
  const line = smoothLine(xs, ys)
  const area = `${line}L${xs[xs.length - 1].toFixed(2)} ${h}L${xs[0].toFixed(2)} ${h}Z`
  const guideY =
    guide != null
      ? h - padY - ((guide - min) / Math.max(0.001, max - min)) * (h - padY * 2)
      : null
  const lastX = xs[xs.length - 1]
  const lastY = ys[ys.length - 1]

  return (
    <svg className="live-chart" viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" aria-hidden>
      <defs>
        <linearGradient id={`live-${uid}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.12" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={area} fill={`url(#live-${uid})`} />
      {guideY != null && (
        <line
          x1="0"
          y1={guideY}
          x2={w}
          y2={guideY}
          stroke="#c5ccd4"
          strokeWidth="0.8"
          strokeDasharray="2.5 3"
          vectorEffect="non-scaling-stroke"
        />
      )}
      <path
        d={line}
        fill="none"
        stroke={color}
        strokeWidth="1.5"
        strokeLinejoin="round"
        strokeLinecap="round"
        vectorEffect="non-scaling-stroke"
      />
      <circle cx={lastX} cy={lastY} r="2.4" fill="#fff" stroke={color} strokeWidth="1.3" />
    </svg>
  )
}

function LiveCard({ item, onOpen }: { item: Series; onOpen: () => void }) {
  return (
    <button type="button" className="vital-detail-card as-link" onClick={onOpen}>
      <div className="vital-detail-head">
        <div>
          <b>{item.label}</b>
          <em>{item.status}</em>
        </div>
        <strong style={{ color: item.color }}>
          {item.value}
          <small>{item.unit}</small>
        </strong>
      </div>
      <div className="vital-detail-chart">
        <Sparkline
          color={item.color}
          min={item.min}
          max={item.max}
          points={item.points}
          guide={item.guide}
        />
      </div>
    </button>
  )
}

export function LiveVitalsScreen() {
  const navigate = useNavigate()
  const series: Series[] = [
    {
      id: 'hr',
      color: '#E53935',
      soft: '#fafbfc',
      min: 62,
      max: 108,
      value: '72',
      label: '심박수',
      unit: 'bpm',
      status: '정상 범위',
      guide: 75,
      points: [78, 76, 74, 81, 88, 92, 85, 79, 83, 90, 86, 80, 77, 82, 75, 73, 71, 74, 72, 70, 72],
    },
    {
      id: 'spo2',
      color: '#1E88E5',
      soft: '#fafbfc',
      min: 92,
      max: 99,
      value: '95',
      label: '혈중 산소',
      unit: '%',
      status: '양호',
      guide: 95,
      points: [96, 96, 95, 95, 96, 95, 94, 95, 95, 96, 95, 95, 96, 95, 94, 95, 95, 96, 95, 95],
    },
    {
      id: 'temp',
      color: '#7E57C2',
      soft: '#fafbfc',
      min: 35.9,
      max: 36.8,
      value: '36.4',
      label: '피부 온도',
      unit: '°C',
      status: '안정',
      guide: 36.4,
      points: [36.28, 36.31, 36.35, 36.42, 36.48, 36.44, 36.39, 36.36, 36.41, 36.45, 36.43, 36.38, 36.4, 36.42, 36.39, 36.41],
    },
    {
      id: 'hrv',
      color: '#00897B',
      soft: '#fafbfc',
      min: 10,
      max: 75,
      value: '37',
      label: 'HRV 회복력',
      unit: 'RMSSD',
      status: '회복 중',
      guide: 40,
      points: [22, 28, 24, 35, 31, 42, 38, 48, 33, 40, 29, 45, 36, 41, 32, 38, 34, 37],
    },
  ]

  return (
    <div className="stage">
      <Phone>
        <div className="screen ring-live">
          <Header title="바이탈" backTo="/vitaling/home" right={<AccuracyInfoButton />} />
          <div className="scroll live-page ring">
            <p className="ring-live-lead">지표를 선택하면 날짜·시간별 추이를 볼 수 있어요</p>
            {series.map((item) => (
              <LiveCard
                key={item.id}
                item={item}
                onOpen={() => navigate(`/vitaling/measure/stress?m=${item.id}`)}
              />
            ))}
          </div>
        </div>
      </Phone>
    </div>
  )
}
