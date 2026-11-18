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

/** 최근 7일 바디 리듬: 세로 막대 7개, 막대 색 = 그날 등급 색 (홈 게이지와 같은 색 기준) */
function WeekLine({ endDate }: { endDate: Date }) {
  const days = Array.from({ length: 7 }, (_, i) => addDays(endDate, i - 6))
  const vals = days.map((d) => dayBundle(d).score)
  const w = 320, h = 170, padL = 36, padR = 8, top = 24, bottom = 136
  const n = 7
  const slot = (w - padL - padR) / n
  const bw = 26
  const x = (i: number) => padL + slot * i + (slot - bw) / 2
  const y = (v: number) => bottom - (v / 100) * (bottom - top)
  const avg = vals.reduce((a, b) => a + b, 0) / 7
  return (
    <svg className="rd-bars" viewBox={`0 0 ${w} ${h}`} aria-hidden>
      {[0, 50, 100].map((t) => (
        <g key={t}>
          <line x1={padL} x2={w - padR} y1={y(t)} y2={y(t)} stroke="#EEF0F2" strokeWidth="1.5" />
          <text x={padL - 8} y={y(t) + 4} textAnchor="end" fontSize="11" fontWeight="600" fill="#9aa3ad">{t}</text>
        </g>
      ))}
      <line x1={padL} x2={w - padR} y1={y(avg)} y2={y(avg)} stroke="#1a2332" strokeOpacity="0.35" strokeWidth="1.5" strokeDasharray="4 4" />
      {vals.map((v, i) => {
        const g = gradeOf(v)
        const last = i === 6
        return (
          <g key={i}>
            <rect x={x(i)} y={y(v)} width={bw} height={Math.max(4, bottom - y(v))} rx={bw / 2} fill={g.color} opacity={last ? 1 : 0.55} />
            <text x={x(i) + bw / 2} y={y(v) - 8} textAnchor="middle" fontSize="12" fontWeight="700" fill={last ? '#1a2332' : '#6b7684'}>{v}</text>
            <text x={x(i) + bw / 2} y={h - 8} textAnchor="middle" fontSize="12" fontWeight={last ? '700' : '500'} fill={last ? '#1a2332' : '#9aa3ad'}>{last ? '오늘' : WEEKDAYS[days[i].getDay()]}</text>
          </g>
        )
      })}
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

            <section className="v2-details rd-details open-always">
              <div className="v2-head"><b className="v2-label">항목별 점수</b></div>
            <div className="day-metric-list">
              {bundle.metrics.map((m) => (
                <MetricRow key={m.id} metric={m} onOpen={() => navigate(m.to)} />
              ))}
            </div>
            </section>
          </div>
        </div>
      </Phone>
    </div>
  )
}
