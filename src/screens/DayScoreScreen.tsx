import { AccuracyInfoButton } from '../components/AccuracyInfo'
import {
  Brain,
  CaretRight,
  Drop,
  Heart,
  Moon,
  PersonSimpleWalk,
  Thermometer,
  Wind,
  X,
  type Icon,
} from '@phosphor-icons/react'
import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { BottomNav, Phone } from '../components/ui'
import {
  ACTIVITY_COLORS,
  SLEEP_COLORS,
  STRESS_COLORS,
  VITAL_COLORS,
} from '../palette'

const DATES = [
  { d: '토', n: '1/10' },
  { d: '일', n: '1/11' },
  { d: '월', n: '1/12' },
  { d: '화', n: '1/13' },
  { d: '수', n: '1/14' },
  { d: '목', n: '1/15' },
]

type Tone = 'ok' | 'warn' | 'bad'

type DayMetric = {
  id: string
  label: string
  score: number
  tone: Tone
  status: string
  color: string
  soft: string
  Icon: Icon
  to: string
}

function statusFromScore(score: number) {
  if (score >= 80) return { tone: 'ok' as const, titleToday: '오늘 괜찮아요', titlePast: '괜찮았어요' }
  if (score >= 60) return { tone: 'warn' as const, titleToday: '보통이에요', titlePast: '보통이었어요' }
  return { tone: 'bad' as const, titleToday: '조금 살펴보세요', titlePast: '조금 살펴볼 날이었어요' }
}

function dayBundle(dayIndex: number) {
  const wobble = (base: number, i: number) =>
    Math.max(40, Math.min(98, Math.round(base + ((dayIndex * 3 + i * 5) % 11) - 5)))

  const metrics: DayMetric[] = [
    {
      id: 'hr',
      label: '심장',
      score: wobble(88, 0),
      tone: 'ok',
      status: '정상',
      ...VITAL_COLORS.hr,
      Icon: Heart,
      to: '/vitaling/vital/hr',
    },
    {
      id: 'spo2',
      label: '산소',
      score: wobble(92, 1),
      tone: 'ok',
      status: '정상',
      ...VITAL_COLORS.spo2,
      Icon: Drop,
      to: '/vitaling/vital/spo2',
    },
    {
      id: 'temp',
      label: '체온',
      score: wobble(86, 2),
      tone: 'ok',
      status: '정상',
      ...VITAL_COLORS.temp,
      Icon: Thermometer,
      to: '/vitaling/vital/temp',
    },
    {
      id: 'resp',
      label: '호흡',
      score: wobble(84, 3),
      tone: 'ok',
      status: '정상',
      ...VITAL_COLORS.resp,
      Icon: Wind,
      to: '/vitaling/vital/resp',
    },
    {
      id: 'sleep',
      label: '수면',
      score: wobble(80, 4),
      tone: dayIndex === 2 ? 'warn' : 'ok',
      status: dayIndex === 2 ? '주의' : '좋음',
      color: SLEEP_COLORS.line,
      soft: SLEEP_COLORS.soft,
      Icon: Moon,
      to: '/vitaling/sleep',
    },
    {
      id: 'stress',
      label: '스트레스',
      score: wobble(78, 5),
      tone: 'ok',
      status: '안정',
      color: STRESS_COLORS.line,
      soft: STRESS_COLORS.soft,
      Icon: Brain,
      to: '/vitaling/stress',
    },
    {
      id: 'activity',
      label: '활동',
      score: wobble(72, 6),
      tone: dayIndex <= 1 ? 'warn' : 'ok',
      status: dayIndex <= 1 ? '보통' : '좋음',
      color: ACTIVITY_COLORS.accent,
      soft: ACTIVITY_COLORS.soft,
      Icon: PersonSimpleWalk,
      to: '/vitaling/activity',
    },
  ].map((m) => ({
    ...m,
    tone: (m.score >= 80 ? 'ok' : m.score >= 60 ? 'warn' : 'bad') as Tone,
    status: m.score >= 80 ? m.status : m.score >= 60 ? (m.id === 'stress' ? '주의' : '보통') : '위험',
  }))

  const score = Math.round(metrics.reduce((a, m) => a + m.score, 0) / metrics.length)
  const prev = Math.round(score + ((dayIndex % 3) - 1) * 4)
  return { score, prev, metrics }
}

function DayArc({ score }: { score: number }) {
  const r = 118
  const cx = 140
  const cy = 138
  const t = Math.min(100, Math.max(0, score)) / 100
  const angle = Math.PI - Math.PI * t
  const x = cx + r * Math.cos(angle)
  const y = cy - r * Math.sin(angle)
  const path = `M ${cx - r} ${cy} A ${r} ${r} 0 0 1 ${cx + r} ${cy}`

  return (
    <svg className="arc-gauge" viewBox="0 0 280 168" aria-hidden>
      <defs>
        <linearGradient id="dayArcGrad" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#E53935" />
          <stop offset="28%" stopColor="#FF9800" />
          <stop offset="52%" stopColor="#FFEB3B" />
          <stop offset="78%" stopColor="#66BB6A" />
          <stop offset="100%" stopColor="#42A5F5" />
        </linearGradient>
      </defs>
      <path d={path} fill="none" stroke="#eee" strokeWidth="18" strokeLinecap="round" />
      <path d={path} fill="none" stroke="url(#dayArcGrad)" strokeWidth="18" strokeLinecap="round" />
      <circle cx={x} cy={y} r="11" fill="#fff" stroke="#ddd" strokeWidth="2" />
      <circle cx={x} cy={y} r="5" fill="#1a2332" />
    </svg>
  )
}

function MetricRow({
  metric,
  onOpen,
}: {
  metric: DayMetric
  onOpen: () => void
}) {
  const Icon = metric.Icon
  return (
    <button type="button" className="day-metric-row" onClick={onOpen}>
      <span className="day-metric-ico" style={{ background: metric.soft, color: metric.color }}>
        <Icon size={20} weight="fill" />
      </span>
      <span className="day-metric-copy">
        <b>{metric.label}</b>
        <em className={`tone-${metric.tone}`}>{metric.status}</em>
      </span>
      <span className="day-metric-bar" aria-hidden>
        <i style={{ width: `${metric.score}%`, background: metric.color }} />
      </span>
      <strong>{metric.score}</strong>
      <CaretRight size={16} weight="bold" color="#c5ccd4" />
    </button>
  )
}

export function DayScoreScreen() {
  const navigate = useNavigate()
  const todayIndex = DATES.length - 1
  const [active, setActive] = useState(todayIndex)
  const bundle = useMemo(() => dayBundle(active), [active])
  const status = statusFromScore(bundle.score)
  const isToday = active === todayIndex
  const title = isToday ? status.titleToday : `${DATES[active].n} · ${status.titlePast}`
  const delta = bundle.score - bundle.prev

  return (
    <div className="stage">
      <Phone>
        <div className="screen with-nav day-score-screen">
          <header className="reward-header">
            <AccuracyInfoButton />
            <h1>종합 점수</h1>
            <button
              type="button"
              className="icon-btn"
              aria-label="닫기"
              onClick={() => navigate('/vitaling/home')}
            >
              <X size={22} weight="light" />
            </button>
          </header>

          <div className="scroll reward-page day-score-page">
            <div className="date-strip">
              {DATES.map((item, i) => (
                <button
                  key={item.n}
                  type="button"
                  className={`date-chip ${active === i ? 'on' : ''}`}
                  onClick={() => setActive(i)}
                >
                  <span>{item.d}</span>
                  <b>{item.n}</b>
                </button>
              ))}
            </div>

            <div className="arc-wrap">
              <DayArc score={bundle.score} />
              <div className="arc-labels">
                <span>나쁨</span>
                <span>보통</span>
                <span>좋음</span>
              </div>
              <div className="arc-center">
                <div className="arc-points">
                  {bundle.score}
                  <small>점</small>
                </div>
                <div className="day-score-status">{title}</div>
                {!isToday && (
                  <div className="arc-delta">
                    전날보다{' '}
                    <em className={delta >= 0 ? 'up' : 'down'}>
                      {delta >= 0 ? '▲' : '▼'} {Math.abs(delta)}
                    </em>
                  </div>
                )}
                {isToday && (
                  <div className="arc-delta muted">심장·수면 등 평균으로 계산해요</div>
                )}
              </div>
            </div>

            <div className={`reward-callout tone-${status.tone}`}>
              {status.tone === 'ok' && '전반적으로 안정적이에요. 오늘도 이 흐름을 유지해 보세요.'}
              {status.tone === 'warn' && '몇몇 지표를 조금 더 살펴보면 좋아요. 항목을 눌러 확인해 보세요.'}
              {status.tone === 'bad' && '오늘은 몸 상태를 조금 더 살펴보는 게 좋겠어요.'}
            </div>

            <div className="day-metric-list">
              <div className="day-metric-head">
                <h3>항목별 점수</h3>
                <span>눌러서 상세</span>
              </div>
              {bundle.metrics.map((m) => (
                <MetricRow key={m.id} metric={m} onOpen={() => navigate(m.to)} />
              ))}
            </div>
          </div>
          <BottomNav active="service" />
        </div>
      </Phone>
    </div>
  )
}
