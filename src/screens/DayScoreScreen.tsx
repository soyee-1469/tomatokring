import { MetricInfoButton } from '../components/AccuracyInfo'
import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Phone } from '../components/ui'
import { Ri } from '../components/Ri'
import { GradePill, GradeScale } from '../components/RhythmGrade'
import { METRIC_STYLE } from '../metricStyle'
import { DateLine } from '../components/DateLine'
import { useScrub } from '../components/useScrub'
import { dayLabel, pickIndex, RhythmWeekBars } from '../components/RhythmWeekBars'
import { useSession } from '../useSession'
import { hasRhythmRecord, RHYTHM_MIN_DAYS, RHYTHM_TREND_DAYS, validDayCount } from '../session'
import { addDays, dayBundle, daySeed, GRADE_COPY, gradeOf, sameDay, startOfDay, type DayMetric } from '../rhythm'


function statusFromScore(score: number) {
  const g = gradeOf(score)
  const c = GRADE_COPY[g.label]
  return { tone: g.tone, label: g.label, headline: c.headline, headlinePast: c.headlinePast, advice: c.advice }
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
      {/* 홈 카드와 같은 크기(18px)의 아이콘만 (뒤에 원형 바탕 없음) */}
      <span className="day-metric-ico" style={{ color: metric.color }}>
        <Ri name={metric.icon} fill size={18} />
      </span>
      {/* 아이콘 바로 옆에 이름 → 상태(정상·보통·주의) → 짧은 막대 → 점수 (막대는 점수 바로 옆) */}
      <span className="day-metric-copy">
        <b>{metric.label}</b>
      </span>
      <em className="day-metric-status">{metric.status}</em>
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
/** 회복·피로도 7일 두 선: 회복(파랑)·피로도(주황). 피로도가 회복보다 높은 날은 그 칸을 연하게 칠해 '무리한 날'로 보여 준다.
 *  눈금 없이 선만, 고른 날(처음엔 마지막 날)의 두 점만 진하게 + 위에 말풍선 (회복 n · 피로도 n) */
const REC_COLOR = METRIC_STYLE.hrv.color
const FAT_COLOR = METRIC_STYLE.temp.color
function RecoveryFatigueChart({ endDate, hasRecord }: { endDate: Date; /** 기록 없는 날은 점·선을 비운다 (7일 막대와 같은 빈칸) */ hasRecord: (d: Date) => boolean }) {
  const days = Array.from({ length: 7 }, (_, i) => addDays(endDate, i - 6))
  const vals = days.map((d) => (hasRecord(d) ? rhythmOf(d) : null))
  const w = 320, h = 160, padL = 4, padR = 4, top = 44, bottom = 128
  const slot = (w - padL - padR) / 7
  const x = (i: number) => padL + slot * i + slot / 2
  const y = (v: number) => bottom - (v / 100) * (bottom - top)
  // 빈 날에서 선이 끊긴다
  const path = (key: 'recovery' | 'fatigue') => vals.map((v, i) => (v === null ? '' : `${i && vals[i - 1] ? 'L' : 'M'}${x(i).toFixed(1)} ${y(v[key]).toFixed(1)}`)).filter(Boolean).join(' ')
  const { ref, pos } = useScrub<HTMLDivElement>()
  const pick = pickIndex(pos, w, padL, slot)
  const p = vals[pick]
  return (
    <div className="rd-chart" ref={ref}>
      <svg className="rd-bars" viewBox={`0 0 ${w} ${h}`} aria-hidden>
        {vals.map((v, i) => v && v.fatigue > v.recovery && (
          <rect key={`o${i}`} x={x(i) - slot / 2 + 3} y={top - 8} width={slot - 6} height={bottom - top + 16} rx={10} fill={METRIC_STYLE.temp.soft} />
        ))}
        <line x1={x(pick)} x2={x(pick)} y1={top - 8} y2={bottom + 8} stroke="#1a2332" strokeOpacity="0.18" strokeWidth="1.5" strokeDasharray="3 3" />
        <path d={path('recovery')} fill="none" stroke={REC_COLOR} strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" />
        <path d={path('fatigue')} fill="none" stroke={FAT_COLOR} strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" />
        {vals.map((v, i) => {
          const on = i === pick
          return (
            <g key={i}>
              {v && <circle cx={x(i)} cy={y(v.recovery)} r={on ? 5.5 : 3} fill={on ? REC_COLOR : '#fff'} stroke={REC_COLOR} strokeWidth="2" />}
              {v && <circle cx={x(i)} cy={y(v.fatigue)} r={on ? 5.5 : 3} fill={on ? FAT_COLOR : '#fff'} stroke={FAT_COLOR} strokeWidth="2" />}
              <text x={x(i)} y={h - 8} textAnchor="middle" fontSize="12" fontWeight={on ? '700' : '500'} fill={on ? '#1a2332' : '#9aa3ad'}>{dayLabel(days, i)}</text>
            </g>
          )
        })}
      </svg>
      <span className={`rd-tip ${pick === 0 ? 'at-start' : pick === 6 ? 'at-end' : ''}`} style={{ left: `${(x(pick) / w) * 100}%`, top: `${((top - 8) / h) * 100}%` }}>
        {p ? <><i style={{ background: REC_COLOR }} />회복 {p.recovery}<i style={{ background: FAT_COLOR }} />피로도 {p.fatigue}</> : '기록 없음'}
      </span>
    </div>
  )
}
/** 전날과 비교 한 줄: '전날보다 3점 높아요' · '전날과 같아요' */
function vsPrevDay(diff: number) {
  if (diff === 0) return '전날과 같아요'
  return `전날보다 ${Math.abs(diff)}점 ${diff > 0 ? '높아요' : '낮아요'}`
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
  // 7~13일: 오늘 점수·등급까지만, 추세는 14일부터
  const trendReady = validDays >= RHYTHM_TREND_DAYS
  // 막대: 0 = 최근 7일, 1 = 그 전 7일 (14일이 모여야 고를 수 있음)
  const [weekPick, setWeekBack] = useState<0 | 1>(0)
  const weekBack = trendReady ? weekPick : 0
  const today = useMemo(() => startOfDay(new Date()), [])
  const [selected, setSelected] = useState(today)
  const bundle = useMemo(() => dayBundle(selected), [selected])
  const status = statusFromScore(bundle.score)
  const isToday = sameDay(selected, today)
  const dateLabel = `${selected.getMonth() + 1}월 ${selected.getDate()}일`
  const delta = bundle.score - bundle.prev
  const rhythm = rhythmOf(selected)
  const rhythmPrev = rhythmOf(addDays(selected, -1))
  // 내 평균: 최근 28일 활동 지수 평균 (브링 '내 평균' 마커 기준)
  const myAvg = useMemo(() => Math.round(Array.from({ length: 28 }, (_, i) => dayBundle(addDays(selected, -i)).score).reduce((a, b) => a + b, 0) / 28), [selected])
  // 최근 7일 중 피로도가 회복보다 높았던 날 (그래프에서 칠한 칸과 같은 기준)
  const overDays = useMemo(() => Array.from({ length: 7 }, (_, i) => addDays(selected, -i)).filter((d) => hasRhythmRecord(session, d)).map(rhythmOf).filter((r) => r.fatigue > r.recovery).length, [selected])


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
            <DateLine date={selected} today={today} onDate={setSelected} />

            {!ready && (
              <section className="rhythm-hero collecting">
                <span className="rhythm-date">{isToday ? `오늘 · ${dateLabel}` : dateLabel}</span>
                {/* 기록이 쌓이는 중에는 '부족하다'가 아니라 진행 상황부터: 며칠 모였고 며칠 남았는지 → 인정 조건은 그 아래 작게 */}
                <h2>{validDays === 0 ? `${RHYTHM_MIN_DAYS}일 기록이 모이면 바디 리듬을 볼 수 있어요.` : `${RHYTHM_MIN_DAYS - validDays}일만 더 모이면 바디 리듬을 볼 수 있어요.`}</h2>
                <div className="rhythm-progress">
                  <span className="rhythm-days" aria-hidden>
                    {Array.from({ length: RHYTHM_MIN_DAYS }, (_, i) => <i key={i} className={i < validDays ? 'on' : ''} />)}
                  </span>
                  <b>{validDays}일 / {RHYTHM_MIN_DAYS}일</b>
                </div>
                <p>하루에 2개 이상의 유효 데이터가 기록되고 수면 기록이 포함돼야 하루로 인정돼요.</p>
                <button type="button" className="rhythm-collect-link" onClick={() => navigate('/vitaling/my')}>이전 기록이 있다면 데이터 복원 <Ri name="arrow-right-s" size={16} /></button>
              </section>
            )}

            {ready && (
              <>
                {/* 1) 첫 카드: 오늘 몸 상태를 설명하는 한 문장 → 조언 → 점수·등급 (링 없이 숫자로. 7일 흐름은 아래 막대에서) */}
                <section className="rd-gauge rd-first">
                  <h2 className="rd-headline">{isToday ? status.headline : status.headlinePast}</h2>
                  <p className="rd-advice">{status.advice}</p>
                  <div className="rd-score">
                    <strong>{bundle.score}<small>점</small></strong>
                    <GradePill score={bundle.score} />
                  </div>
                  {/* 무지개 눈금: 이 날 점수가 5단계 중 어디인지 (날짜 하나라 가로) */}
                  <GradeScale score={bundle.score} />
                  {trendReady && <p className="rd-avg">
                    {Math.abs(bundle.score - myAvg) < 3 ? `내 평균 ${myAvg}점과 비슷해요` : bundle.score > myAvg ? `내 평균 ${myAvg}점보다 ${bundle.score - myAvg}점 높아요` : `내 평균 ${myAvg}점보다 ${myAvg - bundle.score}점 낮아요`}
                    {!isToday && ` · 전날보다 ${delta >= 0 ? '+' : ''}${delta}`}
                  </p>}
                </section>

                {/* 3) 회복 · 피로도 — 홈 바이탈 칸과 같은 2칸 */}
                <section className="rd-pair">
                  <div>
                    <em>회복</em>
                    <strong>{rhythm.recovery}<small>점</small></strong>
                    <span>{rhythmLabel(rhythm.recovery, true)} · {vsPrevDay(rhythm.recovery - rhythmPrev.recovery)}</span>
                  </div>
                  <div>
                    <em>피로도</em>
                    <strong>{rhythm.fatigue}<small>점</small></strong>
                    <span>{rhythmLabel(rhythm.fatigue, false)} · {vsPrevDay(rhythm.fatigue - rhythmPrev.fatigue)}</span>
                  </div>
                </section>

                {/* 3) 바디 리듬 막대 (세로 무지개): 한 번에 7칸만. 14일이 모이면 '최근 7일 / 그 전 7일' 탭으로 나눠 본다 (14칸을 한 줄에 그리면 너무 촘촘). 홈에는 없고 상세에서만 */}
                <section className="rd-week">
                  <div className="v2-head">
                    <b className="v2-label">바디 리듬</b>
                    {trendReady ? (
                      <span className="rd-span-tabs" role="tablist">
                        {([[0, '최근 7일'], [1, '그 전 7일']] as const).map(([n, label]) => (
                          <button key={n} type="button" role="tab" aria-selected={weekBack === n} className={weekBack === n ? 'on' : ''} onClick={() => setWeekBack(n)}>{label}</button>
                        ))}
                      </span>
                    ) : <span className="v2-key">최근 7일</span>}
                  </div>
                  <RhythmWeekBars key={weekBack} endDate={addDays(selected, -7 * weekBack)} hasRecord={(d) => hasRhythmRecord(session, d)} />
                </section>

                {trendReady ? (
                  /* 4) 회복·피로도 7일 흐름: 두 선이 엇갈린 날(피로도 > 회복)을 '무리한 날'로 */
                  <section className="rd-week rd-rf">
                    <div className="v2-head">
                      <b className="v2-label">회복 · 피로도 7일</b>
                      <span className="rd-rf-key"><i style={{ background: REC_COLOR }} />회복<i style={{ background: FAT_COLOR }} />피로도</span>
                    </div>
                    <RecoveryFatigueChart endDate={selected} hasRecord={(d) => hasRhythmRecord(session, d)} />
                    <p className="rd-rf-say">{overDays === 0 ? '이번 주는 무리한 날 없이 잘 쉬었어요.' : <>피로도가 회복보다 높았던 날이 <b>{overDays}일</b> 있어요.</>}</p>
                  </section>
                ) : (
                  /* 7~13일: 추세 분석 대신 진행 상황 (브링과 같이 14일부터) */
                  <section className="rd-week rd-trend-wait">
                    <b>추세 분석은 {RHYTHM_TREND_DAYS}일부터</b>
                    <span className="rhythm-days" aria-label={`${RHYTHM_TREND_DAYS}일 중 ${validDays}일`}>
                      {Array.from({ length: RHYTHM_TREND_DAYS }, (_, i) => <i key={i} className={i < validDays ? 'on' : ''} />)}
                    </span>
                    <p>{RHYTHM_TREND_DAYS - validDays}일 더 모이면 회복·피로도 흐름과 14일 바디 리듬, 내 평균과의 비교를 볼 수 있어요.</p>
                  </section>
                )}
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
