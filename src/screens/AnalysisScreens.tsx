import { MetricInfoButton } from '../components/AccuracyInfo'
import {
  Export,
} from '@phosphor-icons/react'
import { useEffect, useRef, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Header, Phone } from '../components/ui'
import { isMeasureDone, markMeasureDone } from '../session'
import { useSession } from '../useSession'
import { ClaimBanner } from '../components/ClaimBanner'
import { DateBar, parseDateKey, recentDate, todayStart, type Period } from './MeasureScreen'
import {
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

export function SleepAnalysisScreen() {
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const [date, setDate] = useState(() => parseDateKey(params.get('d')) ?? todayStart())
  const [period, setPeriod] = useState<Period>('day')
  const session = useSession()
  const sleepDone = isMeasureDone(session, 'sleep')
  const autoStart = params.get('run') === '1'
  const started = useRef(false)
  useEffect(() => {
    // 홈의 "수면 확인하기"로 들어오면 지난밤 수면 확인을 바로 완료 처리
    if (!autoStart || started.current || sleepDone) return
    started.current = true
    markMeasureDone('sleep')
  }, [autoStart, sleepDone])

  return (
    <div className="stage">
      <Phone>
        <div className="screen elder-home">
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
                <ClaimBanner kind="sleep" doneText="확인 완료" />
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

        </div>
      </Phone>
    </div>
  )
}

