import { MetricInfoButton } from '../components/AccuracyInfo'
import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Phone } from '../components/ui'
import { Ri } from '../components/Ri'
import { ScoreArc as TodayScoreArc } from '../components/ScoreArc'
import { useSession } from '../useSession'
import { RHYTHM_MIN_DAYS, validDayCount } from '../session'
import { addDays, dayBundle, daySeed, GRADE_COPY, gradeOf, sameDay, startOfDay, type DayMetric } from '../rhythm'
import { WeekStrip } from '../components/WeekStrip'

const WEEKDAYS = ['일', '월', '화', '수', '목', '금', '토'] as const

function statusFromScore(score: number) {
  const g = gradeOf(score)
  const c = GRADE_COPY[g.label]
  return { tone: g.tone, label: g.label, headline: c.headline, headlinePast: c.headlinePast, advice: c.advice }
}

/** 최근 7일 바디 리듬 선 그래프 (홈 카드와 같은 모양) */
function WeekLine({ endDate }: { endDate: Date }) {
  const days = Array.from({ length: 7 }, (_, i) => addDays(endDate, i - 6))
  const vals = days.map((d) => dayBundle(d).score)
  const w = 320, h = 150, padL = 50, padR = 14, top = 14, bottom = 122
  // 축은 데이터 범위에 맞추되 위아래 여유를 두어 선이 가운데 오게 (무지개 띠는 축 범위에 따라 잘림)
  const lo = Math.max(0, Math.min(...vals) - 15)
  const hi = Math.min(100, Math.max(...vals) + 15)
  const x = (i: number) => padL + 10 + ((w - padL - padR - 20) * i) / 6
  const y = (v: number) => bottom - ((v - lo) / Math.max(1, hi - lo)) * (bottom - top)
  const avg = vals.reduce((a, b) => a + b, 0) / 7
  const pts = vals.map((v, i) => ({ x: x(i), y: y(v) }))
  let path = ''
  pts.forEach((p, i) => {
    if (i === 0) { path += `M ${p.x} ${p.y}`; return }
    const p0 = pts[i - 2] ?? pts[i - 1], p1 = pts[i - 1], p2 = p, p3 = pts[i + 1] ?? p
    path += ` C ${p1.x + (p2.x - p0.x) / 6} ${p1.y + (p2.y - p0.y) / 6}, ${p2.x - (p3.x - p1.x) / 6} ${p2.y - (p3.y - p1.y) / 6}, ${p2.x} ${p2.y}`
  })
  return (
    <svg className="elder-fit-chart line rd-rainbow" viewBox={`0 0 ${w} ${h}`} aria-hidden>
      <defs>
        <linearGradient id="rdRainbowV" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#42A5F5" />
          <stop offset="22%" stopColor="#66BB6A" />
          <stop offset="48%" stopColor="#FFEB3B" />
          <stop offset="72%" stopColor="#FF9800" />
          <stop offset="100%" stopColor="#E53935" />
        </linearGradient>
        <linearGradient id="rdRainbowBand" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#42A5F5" stopOpacity="0.14" />
          <stop offset="22%" stopColor="#66BB6A" stopOpacity="0.14" />
          <stop offset="48%" stopColor="#FFEB3B" stopOpacity="0.14" />
          <stop offset="72%" stopColor="#FF9800" stopOpacity="0.14" />
          <stop offset="100%" stopColor="#E53935" stopOpacity="0.14" />
        </linearGradient>
      </defs>
      <clipPath id="rdBandClip"><rect x={padL} y={top} width={w - padL - padR} height={bottom - top} rx={8} /></clipPath>
      <rect x={padL} y={y(100)} width={w - padL - padR} height={y(0) - y(100)} fill="url(#rdRainbowBand)" clipPath="url(#rdBandClip)" />
      <line x1={padL} x2={w - padR} y1={top} y2={top} stroke="#E8EBEE" strokeWidth="1.5" />
      <line x1={padL} x2={w - padR} y1={bottom} y2={bottom} stroke="#E8EBEE" strokeWidth="1.5" />
      <text x={padL - 8} y={top + 4} textAnchor="end" fontSize="11" fontWeight="600" fill="#9aa3ad">{hi}점</text>
      <text x={padL - 8} y={bottom + 4} textAnchor="end" fontSize="11" fontWeight="600" fill="#9aa3ad">{lo}점</text>
      <line x1={padL} x2={w - padR} y1={y(avg)} y2={y(avg)} stroke="#1a2332" strokeOpacity="0.35" strokeWidth="1.5" strokeDasharray="4 4" />
      <text x={padL - 8} y={y(avg) + 4} textAnchor="end" fontSize="11" fontWeight="700" fill="#5a6570">평균</text>
      <path d={path} fill="none" stroke="url(#rdRainbowV)" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" />
      {pts.map((p, i) => (i === 6 ? <circle key={i} cx={p.x} cy={p.y} r={7} fill="#1a2332" stroke="#fff" strokeWidth="2.5" /> : <circle key={i} cx={p.x} cy={p.y} r={5} fill="#fff" stroke="#1a2332" strokeWidth="2.5" />))}
      {days.map((d, i) => (
        <text key={i} x={x(i)} y={h - 6} textAnchor="middle" fontSize="12" fontWeight={i === 6 ? '700' : '500'} fill={i === 6 ? '#1a2332' : '#9aa3ad'}>{WEEKDAYS[d.getDay()]}</text>
      ))}
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
  return (
    <button type="button" className="day-metric-row" onClick={onOpen}>
      <span className="day-metric-ico" style={{ background: metric.soft, color: metric.color }}>
        <Ri name={metric.icon} size={22} />
      </span>
      <span className="day-metric-copy">
        <b>{metric.label}</b>
        <em className={`tone-${metric.tone}`}>{metric.status}</em>
      </span>
      <span className="day-metric-bar" aria-hidden>
        <i style={{ width: `${metric.score}%`, background: metric.color }} />
      </span>
      <strong>{metric.score}</strong>
      <Ri name="arrow-right-s" size={18} className="day-metric-caret" />
    </button>
  )
}

/** 회복(높을수록 좋음)·피로도(낮을수록 좋음) — 날짜 시드 기반 샘플 */
function rhythmOf(date: Date) {
  const seed = daySeed(date)
  const base = dayBundle(date).score
  const recovery = Math.max(40, Math.min(98, base + ((seed * 7) % 9) - 4))
  const fatigue = Math.max(15, Math.min(80, 100 - base + ((seed * 11) % 13) - 6))
  return { recovery, fatigue }
}
function rhythmLabel(v: number, higherIsBetter: boolean) {
  const good = higherIsBetter ? v : 100 - v
  if (good >= 85) return '최상'
  if (good >= 70) return '양호'
  if (good >= 50) return '보통'
  return '주의'
}

export function DayScoreScreen() {
  const navigate = useNavigate()
  const session = useSession()
  const validDays = validDayCount(session)
  const ready = validDays >= RHYTHM_MIN_DAYS
  const today = useMemo(() => startOfDay(new Date()), [])
  const [selected, setSelected] = useState(today)
  const [weekEnd, setWeekEnd] = useState(today)
  const bundle = useMemo(() => dayBundle(selected), [selected])
  const status = statusFromScore(bundle.score)
  const isToday = sameDay(selected, today)
  const dateLabel = `${selected.getMonth() + 1}월 ${selected.getDate()}일`
  const delta = bundle.score - bundle.prev
  const rhythm = rhythmOf(selected)
  const rhythmPrev = rhythmOf(addDays(selected, -1))
  // 내 평균: 최근 28일 활동 지수 평균 (브링 '내 평균' 마커 기준)
  const myAvg = useMemo(() => Math.round(Array.from({ length: 28 }, (_, i) => dayBundle(addDays(selected, -i)).score).reduce((a, b) => a + b, 0) / 28), [selected])
  const trend3 = useMemo(() => {
    const s3 = [0, 1, 2].map((i) => dayBundle(addDays(selected, -i)).score)
    return Math.sign(s3[0] - s3[2])
  }, [selected])

  const shiftWeek = (dir: -1 | 1) => {
    const next = addDays(weekEnd, dir * 7)
    const clamped = next > today ? today : next
    setWeekEnd(clamped)
  }

  return (
    <div className="stage">
      <Phone>
        <div className="screen day-score-screen">
          <header className="reward-header">
            <MetricInfoButton metric="health" tone="plain" />
            <h1>바디 리듬</h1>
            <button
              type="button"
              className="icon-btn"
              aria-label="닫기"
              onClick={() => navigate('/vitaling/home')}
            >
              <Ri name="close" size={24} />
            </button>
          </header>

          <div className="scroll reward-page day-score-page">
            <WeekStrip selected={selected} weekEnd={weekEnd} today={today} onSelect={setSelected} onShift={shiftWeek} scoreOf={(d) => dayBundle(d).score} />

            {!ready && (
              <section className="rhythm-hero collecting">
                <span className="rhythm-date">{isToday ? `오늘 · ${dateLabel}` : dateLabel}</span>
                <h2>아직 데이터가 충분하지 않아요.</h2>
                <p>유효한 기록 {validDays}일 / {RHYTHM_MIN_DAYS}일. 하루에 2개 이상의 유효 데이터가 기록되고 수면 기록이 포함돼야 1회로 인정돼요.</p>
                <span className="rhythm-days" aria-hidden>
                  {Array.from({ length: RHYTHM_MIN_DAYS }, (_, i) => <i key={i} className={i < validDays ? 'on' : ''} />)}
                </span>
                <button type="button" className="rhythm-collect-link" onClick={() => navigate('/vitaling/my')}>이전 기록이 있다면 데이터 복원 <Ri name="arrow-right-s" size={16} /></button>
              </section>
            )}

            {ready && (
              <>
                {/* 1) 반원 게이지가 주인공 — 홈과 같은 그림 */}
                <section className="rd-gauge">
                  <span className="rhythm-date">{isToday ? `오늘 · ${dateLabel}` : dateLabel}</span>
                  <div className="rd-gauge-wrap">
                    <TodayScoreArc score={bundle.score} size="lg" />
                    <div className="rd-gauge-center">
                      <strong>{bundle.score}<small>점</small></strong>
                      <b>{status.label}</b>
                    </div>
                  </div>
                  <div className="rd-gauge-scale" aria-hidden><span>나쁨</span><span>보통</span><span>최상</span></div>
                  <p className="rd-avg">
                    {Math.abs(bundle.score - myAvg) < 3 ? `내 평균 ${myAvg}점과 비슷해요` : bundle.score > myAvg ? `내 평균 ${myAvg}점보다 ${bundle.score - myAvg}점 높아요` : `내 평균 ${myAvg}점보다 ${myAvg - bundle.score}점 낮아요`}
                    {!isToday && ` · 전날보다 ${delta >= 0 ? '+' : ''}${delta}`}
                  </p>
                </section>

                {/* 2) 한 줄 해석 + 조언 */}
                <section className="rd-say">
                  <span className="rd-say-ico"><Ri name="chat-smile-3" fill size={20} /></span>
                  <div>
                    <b>{isToday ? status.headline : status.headlinePast}</b>
                    <p>{status.advice}</p>
                  </div>
                </section>

                {/* 3) 회복 · 피로도 — 홈 바이탈 칸과 같은 2칸 */}
                <section className="rd-pair">
                  <div>
                    <em>회복</em>
                    <strong>{rhythm.recovery}<small>점</small></strong>
                    <span>{rhythmLabel(rhythm.recovery, true)} · 전일 {rhythm.recovery - rhythmPrev.recovery >= 0 ? '+' : ''}{rhythm.recovery - rhythmPrev.recovery}</span>
                  </div>
                  <div>
                    <em>피로도</em>
                    <strong>{rhythm.fatigue}<small>점</small></strong>
                    <span>{rhythmLabel(rhythm.fatigue, false)} · 전일 {rhythm.fatigue - rhythmPrev.fatigue >= 0 ? '+' : ''}{rhythm.fatigue - rhythmPrev.fatigue}</span>
                  </div>
                </section>

                {/* 4) 최근 7일 흐름 — 홈 카드와 같은 선 그래프 */}
                <section className="rd-week">
                  <div className="v2-head"><b className="v2-label">최근 7일 바디 리듬</b><span className="v2-key">{trend3 > 0 ? '상승 중' : trend3 < 0 ? '하락 중' : '유지 중'}</span></div>
                  <WeekLine endDate={selected} />
                </section>
              </>
            )}

            <details className="v2-details rd-details">
              <summary>항목별 점수 보기 <Ri name="arrow-down-s" size={20} /></summary>
            <div className="day-metric-list">
              {bundle.metrics.map((m) => (
                <MetricRow key={m.id} metric={m} onOpen={() => navigate(m.to)} />
              ))}
            </div>
            </details>
          </div>
        </div>
      </Phone>
    </div>
  )
}
