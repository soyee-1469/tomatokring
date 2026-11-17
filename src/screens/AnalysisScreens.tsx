import { AccuracyInfoButton, MetricInfoButton } from '../components/AccuracyInfo'
import {
  CheckCircle,
  Export,
} from '@phosphor-icons/react'
import { useState, type ReactNode } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { BottomNav, Header, Phone } from '../components/ui'
import { isMeasureDone, markMeasureDone } from '../session'
import { useSession } from '../useSession'
import { DateBar, parseDateKey, recentDate, todayStart, type Period } from './MeasureScreen'
import {
  ACTIVITY_COLORS,
  ACTIVITY_LEGEND,
  SLEEP_COLORS,
} from '../palette'

const SLEEP_NIGHT = {
  avg: '7h 12m',
  range: '6h 50m-7h 12m',
  time: '22:21-06:21',
  recent: [
    { date: recentDate(0), sub: '22:21-06:21', value: '7시간 12분', today: true },
    { date: recentDate(1), sub: '23:05-06:40', value: '6시간 50분' },
    { date: recentDate(2), sub: '22:10-06:05', value: '7시간 40분' },
  ],
  stages: [
    { name: '깊은', full: '깊은 수면', time: '2시간 30분', pct: 31, color: SLEEP_COLORS.stages.deep },
    { name: '렘', full: '렘 수면', time: '1시간 40분', pct: 21, color: SLEEP_COLORS.stages.rem },
    { name: '얕은', full: '얕은 수면', time: '3시간 10분', pct: 40, color: SLEEP_COLORS.stages.light },
    { name: '깸', full: '깬 상태', time: '40분', pct: 8, color: SLEEP_COLORS.stages.awake },
  ],
}

const DATES = [
  { d: '토', n: '7/25' },
  { d: '일', n: '7/26' },
  { d: '월', n: '7/27' },
  { d: '화', n: '7/28' },
  { d: '수', n: '7/29' },
  { d: '목', n: '7/30' },
  { d: '금', n: '7/31' },
]

/** Semi gauge: 0~100 — 점수·상태는 아크 안, 안내는 아래로 분리 */
export function ScoreArc({
  score,
  title,
  delta,
  hint,
}: {
  score: number
  title?: string
  delta?: string
  hint?: string
}) {
  const r = 112
  const cx = 140
  const cy = 132
  const value = Math.min(100, Math.max(0, score)) / 100
  const angle = Math.PI - Math.PI * value
  const x = cx + r * Math.cos(angle)
  const y = cy - r * Math.sin(angle)
  const arc = `M ${cx - r} ${cy} A ${r} ${r} 0 0 1 ${cx + r} ${cy}`
  const deltaDown = delta?.includes('-')
  const deltaUp = delta?.includes('+')

  return (
    <div className="score-arc-wrap">
      <div className="score-arc-gauge">
        <svg viewBox="0 0 280 158" className="score-arc" aria-hidden>
          <defs>
            <linearGradient id="scoreArcGrad" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#E53935" />
              <stop offset="28%" stopColor="#FF9800" />
              <stop offset="52%" stopColor="#FFEB3B" />
              <stop offset="78%" stopColor="#66BB6A" />
              <stop offset="100%" stopColor="#42A5F5" />
            </linearGradient>
          </defs>
          <path d={arc} fill="none" stroke="#eee" strokeWidth="16" strokeLinecap="round" />
          <path d={arc} fill="none" stroke="url(#scoreArcGrad)" strokeWidth="16" strokeLinecap="round" />
          <circle cx={x} cy={y} r="10" fill="#fff" stroke="#ddd" strokeWidth="2" />
          <circle cx={x} cy={y} r="4.5" fill="#1a2332" />
        </svg>
        <div className="score-arc-center">
          <strong>
            {score}
            <small>점</small>
          </strong>
          {title && <b className="score-arc-title">{title}</b>}
        </div>
        <div className="score-arc-labels">
          <span>나쁨</span>
          <span>보통</span>
          <span>좋음</span>
        </div>
      </div>
      {(delta || hint) && (
        <div className="score-arc-meta">
          {delta && (
            <span className={`score-arc-delta ${deltaDown ? 'down' : deltaUp ? 'up' : ''}`}>
              {delta}
            </span>
          )}
          {hint && <p className="score-arc-hint">{hint}</p>}
        </div>
      )}
    </div>
  )
}

function AnalysisShell({
  title,
  children,
  weather,
}: {
  title: string
  children: ReactNode
  weather?: boolean
}) {
  const [active, setActive] = useState(DATES.length - 1)
  const selected = DATES[active]

  return (
    <div className="stage">
      <Phone>
        <div className="screen with-nav analysis-screen">
          <Header
            title={title}
            backTo="/vitaling/home"
            right={<AccuracyInfoButton />}
          />
          <div className="scroll analysis-body">
            <div className="date-strip analysis-dates">
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
            {weather && (
              <div className="weather-row">
                <span>2026년 {selected.n.replace('/', '월 ')}일 · {selected.d}요일</span>
                <div className="weather-metrics">
                  <span>28°</span>
                  <span>습도 52%</span>
                  <span>기압 1012</span>
                  <span>UV 보통</span>
                </div>
              </div>
            )}
            {children}
          </div>
          <BottomNav active="service" />
        </div>
      </Phone>
    </div>
  )
}

export function StressAnalysisScreen() {
  return (
    <AnalysisShell title="스트레스 분석" weather>
      <p className="analysis-desc">
        스트레스 점수는 1~100점이며, 점수가 높을수록 신체적 스트레스 징후가 적다는 의미입니다.
        HRV·자율신경 균형을 바탕으로 산출됩니다.
      </p>
      <ScoreArc
        score={22}
        title="조금 살펴보세요"
        delta="전날보다 +49"
        hint="HRV·자율신경으로 계산해요"
      />
    </AnalysisShell>
  )
}

export function SleepAnalysisScreen() {
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const [date, setDate] = useState(() => parseDateKey(params.get('d')) ?? todayStart())
  const [period, setPeriod] = useState<Period>('day')
  const session = useSession()
  const sleepDone = isMeasureDone(session, 'sleep')

  return (
    <div className="stage">
      <Phone>
        <div className="screen with-nav elder-home">
          <Header
            title="수면"
            backTo="/vitaling/home"
            right={
              <>
                <button type="button" className="icon-btn" aria-label="내보내기">
                  <Export size={22} weight="regular" />
                </button>
                <MetricInfoButton metric="sleep" tone="plain" />
              </>
            }
          />

          <DateBar period={period} date={date} onDate={setDate} onPeriod={setPeriod} />

          <div className="scroll elder-body">
            <div className="ms-act-hero">
              <em>총 수면 시간</em>
              <strong>7시간 12분</strong>
              <span>수면 효율 84% · 최상 · {SLEEP_NIGHT.time}</span>
            </div>

            <div className="elder-sleep-card ms-chart-card">
              <div className="ms-sleep-stages">
                <div className="elder-sleep-stages-bar">
                  {SLEEP_NIGHT.stages.map((s) => (
                    <i key={s.name} style={{ width: `${s.pct}%`, background: s.color }} />
                  ))}
                </div>
              </div>
              <div className="ms-sleep-legend-grid">
                {SLEEP_NIGHT.stages.map((s) => (
                  <span key={s.name}>
                    <i style={{ background: s.color }} />
                    {s.full} {s.time}
                  </span>
                ))}
              </div>
            </div>

            <div className="elder-sleep-card">
              {sleepDone ? (
                <div className="ms-done-banner">
                  <CheckCircle size={20} weight="fill" />
                  <span>지난밤 수면을 확인했어요</span>
                  <button type="button" onClick={() => navigate('/vitaling/home')}>
                    지급 받기
                  </button>
                </div>
              ) : (
                <button type="button" className="ms-now-btn" onClick={() => markMeasureDone('sleep')}>
                  지난밤 수면 확인 완료
                </button>
              )}
            </div>

            <div className="elder-sleep-card ms-hist-card">
              <div className="ms-recent-head">
                <b>최근 수면 기록</b>
                <button
                  type="button"
                  className="ms-more"
                  onClick={() => navigate('/vitaling/measure/sleep/history')}
                >
                  더 보기
                </button>
              </div>
              <ul className="ms-hist-list">
                {SLEEP_NIGHT.recent.filter((row) => !row.today).map((row) => (
                  <li key={row.date}>
                    <button
                      type="button"
                      className="ms-hist-row"
                      onClick={() => navigate('/vitaling/measure/sleep/history')}
                    >
                      <span>
                        <b>
                          {row.date}
                          {row.today ? <i>오늘</i> : null}
                        </b>
                        <em>{row.sub}</em>
                      </span>
                      <strong>{row.value}</strong>
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <BottomNav active="service" />
        </div>
      </Phone>
    </div>
  )
}

export function ActivityIndexScreen() {
  const bars = Array.from({ length: 72 }, (_, i) => {
    if (i < 18) return ACTIVITY_COLORS.states.sleep
    if (i < 22) return ACTIVITY_COLORS.states.off
    if (i < 28) return ACTIVITY_COLORS.states.rest
    if (i < 40) return ACTIVITY_COLORS.states.active
    if (i < 44) return ACTIVITY_COLORS.states.charge
    if (i < 52) return ACTIVITY_COLORS.states.active
    if (i < 58) return ACTIVITY_COLORS.states.rest
    if (i < 64) return ACTIVITY_COLORS.states.sleep
    return ACTIVITY_COLORS.states.unknown
  })

  return (
    <AnalysisShell title="오늘 활동 지수" weather>
      <div className="activity-barcode" aria-hidden>
        {bars.map((c, i) => (
          <i key={i} style={{ background: c }} />
        ))}
      </div>
      <div className="activity-legend">
        {ACTIVITY_LEGEND.map((l) => (
          <span key={l.t}>
            <i style={{ background: l.c }} />
            {l.t}
          </span>
        ))}
      </div>
      <ScoreArc
        score={53}
        title="보통이에요"
        delta="전날보다 -46"
        hint="걸음·활동 패턴으로 계산해요"
      />
      <div className="activity-steps">
        오늘 걸음 <strong>8,412</strong>
      </div>
    </AnalysisShell>
  )
}
