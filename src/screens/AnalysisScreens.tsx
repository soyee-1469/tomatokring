import { MetricInfoButton } from '../components/AccuracyInfo'
import {
} from '@phosphor-icons/react'
import { useEffect, useRef, useState, type ReactNode } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Header, Phone, PrimaryButton } from '../components/ui'
import { isMeasureDone, markMeasureDone } from '../session'
import { useSession } from '../useSession'
import { ClaimBanner } from '../components/ClaimBanner'
import { PointTip } from '../components/PointGuide'
import { parseDateKey, recentDate, todayStart } from './MeasureScreen'
import { DateLine } from '../components/DateLine'
import { Ri } from '../components/Ri'
import { SLEEP_LAST_NIGHT, SLEEP_TONES, SleepHypnogram, sleepEfficiencyLevel, sleepMinutesLabel, sleepStageTotals, type SleepSegment } from '../components/Sleep'
import {
  SLEEP_COLORS,
} from '../palette'



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

const SLEEP_NIGHTS: readonly {
  total: number
  start: string
  end: string
  efficiency: number
  segments: readonly SleepSegment[]
  hr: readonly [number, number, number]
  spo2: readonly [number, number, number]
  say: { b: string; p: string }
}[] = [
  {
    total: 432, start: '22:21', end: '06:21', efficiency: 84, segments: SLEEP_LAST_NIGHT,
    hr: [52, 58, 71], spo2: [94, 97, 99],
    say: { b: '푹 잘 잔 밤이에요.', p: '깊은 수면이 충분했어요. 오늘도 같은 시간에 잠자리에 들어 보세요.' },
  },
  {
    // 브링 캡처 샘플: 잠이 부족한 밤 (4시간 18분, 03:26~07:44, 효율 54%)
    total: 258, start: '03:26', end: '07:44', efficiency: 54,
    segments: [
      { stage: 'light', min: 22 }, { stage: 'deep', min: 34 }, { stage: 'light', min: 48 }, { stage: 'rem', min: 12 },
      { stage: 'light', min: 40 }, { stage: 'deep', min: 27 }, { stage: 'light', min: 36 }, { stage: 'rem', min: 17 },
      { stage: 'light', min: 22 },
    ],
    hr: [57, 64, 77], spo2: [90, 96, 99],
    say: { b: '잠이 부족한 밤이었어요.', p: '늦게 잠들어 수면 시간이 짧았어요. 오늘은 조금 일찍 잠자리에 들어 보세요.' },
  },
  {
    total: 460, start: '22:10', end: '06:05', efficiency: 88,
    segments: [
      { stage: 'light', min: 20 }, { stage: 'deep', min: 58 }, { stage: 'light', min: 30 }, { stage: 'rem', min: 28 },
      { stage: 'light', min: 42 }, { stage: 'deep', min: 50 }, { stage: 'light', min: 34 }, { stage: 'rem', min: 38 },
      { stage: 'awake', min: 6 }, { stage: 'light', min: 48 }, { stage: 'rem', min: 40 }, { stage: 'light', min: 30 },
      { stage: 'awake', min: 8 }, { stage: 'light', min: 28 },
    ],
    hr: [51, 57, 69], spo2: [95, 97, 99],
    say: { b: '푹 잘 잔 밤이에요.', p: '수면 시간과 깊은 수면 모두 충분했어요.' },
  },
]
const SLEEP_RECENT = [
  { date: recentDate(1), sub: `${SLEEP_NIGHTS[1].start}-${SLEEP_NIGHTS[1].end}`, value: sleepMinutesLabel(SLEEP_NIGHTS[1].total) },
  { date: recentDate(2), sub: `${SLEEP_NIGHTS[2].start}-${SLEEP_NIGHTS[2].end}`, value: sleepMinutesLabel(SLEEP_NIGHTS[2].total) },
]

function SleepTag({ tone, children }: { tone: 'ok' | 'mid' | 'low' | 'pending'; children: ReactNode }) {
  return (
    <span className={`elder-menu-tag ${tone}`}>
      {tone === 'ok' && <Ri name="checkbox-circle" fill size={14} />}
      {children}
    </span>
  )
}

/** 수면 효율 링 (0~100) */
function EfficiencyRing({ pct }: { pct: number }) {
  const r = 34
  const c = 2 * Math.PI * r
  const v = Math.min(100, Math.max(0, pct)) / 100
  return (
    <div className="sleep-eff-ring" aria-hidden>
      <svg viewBox="0 0 88 88">
        <circle cx="44" cy="44" r={r} fill="none" stroke={SLEEP_COLORS.soft} strokeWidth="10" />
        <circle
          cx="44" cy="44" r={r} fill="none" stroke={SLEEP_COLORS.line} strokeWidth="10" strokeLinecap="round"
          strokeDasharray={`${c * v} ${c * (1 - v)}`} transform="rotate(-90 44 44)"
        />
      </svg>
      <strong>{pct}<small>%</small></strong>
    </div>
  )
}

function SleepEfficiencyInfoSheet({ onClose }: { onClose: () => void }) {
  return (
    <div className="sheet-overlay" role="dialog" aria-modal="true" aria-labelledby="sleep-eff-title">
      <button type="button" className="sheet-backdrop" aria-label="닫기" onClick={onClose} />
      <div className="sheet-panel sleep-eff-sheet">
        <div className="sheet-handle" />
        <h2 id="sleep-eff-title">수면 효율이란?</h2>
        <p>잠자리에 있던 시간 중 실제로 잠든 시간의 비율이에요. 자다 깬 시간이 많거나 잠드는 데 오래 걸리면 낮아져요.</p>
        <ul className="sleep-eff-scale">
          <li><b>81% 이상</b><span>최상</span></li>
          <li><b>61~80%</b><span>상</span></li>
          <li><b>41~60%</b><span>보통</span></li>
          <li><b>21~40%</b><span>하</span></li>
          <li><b>20% 이하</b><span>최하</span></li>
        </ul>
        <p>잠자리에서는 휴대전화를 멀리 두고, 잠이 오지 않으면 잠시 일어났다가 다시 눕는 것이 도움이 돼요.</p>
        <PrimaryButton onClick={onClose}>확인</PrimaryButton>
      </div>
    </div>
  )
}

export function SleepAnalysisScreen() {
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const [date, setDate] = useState(() => parseDateKey(params.get('d')) ?? todayStart())
  const [effInfo, setEffInfo] = useState(false)
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

  const offset = Math.max(0, Math.round((todayStart().getTime() - date.getTime()) / 86_400_000))
  const night = SLEEP_NIGHTS[Math.min(offset, SLEEP_NIGHTS.length - 1)]
  const stages = sleepStageTotals(night.segments)
  const eff = sleepEfficiencyLevel(night.efficiency)
  const effTone = eff.tone === 'ok' ? 'ok' : eff.tone === 'warn' ? 'mid' : 'low'
  const goal = session.healthGoals.sleepMinutes
  const short = goal - night.total
  const goalPct = Math.min(100, Math.round((night.total / goal) * 100))

  return (
    <div className="stage">
      <Phone>
        <div className="screen elder-home v2-page sleep-detail">
          <Header
            title="수면"
            backTo="/vitaling/home"
            right={
              <>
                <MetricInfoButton metric="sleep" tone="plain" />
              </>
            }
          />

          <div className="scroll elder-body v2-page">
            <DateLine date={date} today={todayStart()} onDate={setDate} />
            <PointTip kind="sleep" />

            {/* 바이탈 상세와 같은 히어로: 1행 값(왼쪽)+아이콘(오른쪽), 2행 해석 */}
            <section className="v2-hero v2-m-sleep">
              <div className="v2-top">
                <span className="v2-say-ico"><Ri name="moon" size={22} /></span>
                <div className="v2-val">
                  {/* 다른 상세의 값과 같은 규격: 숫자 48px + 단위 18px */}
                  <strong className="dur">
                    {night.total >= 60 && <span>{Math.floor(night.total / 60)}<small>시간</small></span>}
                    {(night.total % 60 > 0 || night.total < 60) && <span>{night.total % 60}<small>분</small></span>}
                  </strong>
                  <span className="v2-val-sub">{night.start} 취침 · {night.end} 기상</span>
                </div>
              </div>
              <div className="v2-say">
                <div>
                  <b>{night.say.b}</b>
                  <p>{night.say.p}</p>
                </div>
              </div>
            </section>

            {/* 1. 수면 단계: 밤새 흐름 + 단계별 시간·비율 (보라 농담 한 색) */}
            <section className="elder-sleep-card sleep-stage-card" aria-label="수면 단계">
              <b className="sleep-card-title">수면 단계</b>
              <div className="sleep-hypno">
                <SleepHypnogram segments={night.segments} height={120} detail start={night.start} end={night.end} />
                <div className="sleep-timeline-axis"><span>{night.start} 취침</span><span>{night.end} 기상</span></div>
              </div>
              <ul className="sleep-stage-list">
                {stages.map((s) => (
                  <li key={s.stage}>
                    <i style={{ background: SLEEP_TONES[s.stage] }} />
                    <span>{s.full}</span>
                    <strong>{sleepMinutesLabel(s.min)}</strong>
                    <em>{s.pct}%</em>
                  </li>
                ))}
              </ul>
            </section>

            {/* 2. 수면 효율 링 */}
            <section className="elder-sleep-card sleep-eff-card" aria-label="수면 효율">
              <b className="sleep-card-title">수면 효율</b>
              <div className="sleep-eff-row">
                <EfficiencyRing pct={night.efficiency} />
                <div className="sleep-eff-text">
                  <SleepTag tone={effTone}>{eff.label}</SleepTag>
                  <p>{eff.tone === 'ok' ? '수면 효율이 좋은 편이에요.' : eff.tone === 'warn' ? '수면 효율이 보통이에요.' : '수면 효율이 낮은 편이에요.'}</p>
                </div>
              </div>
              <div className="elder-claim-actions">
                <button type="button" onClick={() => setEffInfo(true)}><Ri name="question" size={16} />수면 효율이란?</button>
              </div>
            </section>

            {/* 3. 목표 대비 */}
            <section className="elder-sleep-card sleep-goal-card" aria-label="목표 수면 시간">
              <div className="sleep-goal-head">
                <b className="sleep-card-title">목표 수면 시간</b>
                <SleepTag tone={short > 0 ? 'pending' : 'ok'}>{short > 0 ? '부족' : '달성'}</SleepTag>
              </div>
              <p className="sleep-goal-say">
                {short > 0 ? <>목표보다 <b>{sleepMinutesLabel(short)}</b> 부족해요</> : <>목표를 채웠어요</>}
              </p>
              <div className="sleep-goal-bar"><i style={{ width: `${goalPct}%` }} /></div>
              <div className="sleep-goal-axis"><span>{sleepMinutesLabel(night.total)} 잤어요</span><span>목표 {sleepMinutesLabel(goal)}</span></div>
              <div className="elder-claim-actions">
                <button type="button" onClick={() => navigate('/vitaling/goals')}><Ri name="edit" size={16} />목표 바꾸기</button>
              </div>
            </section>

            {/* 4. 수면 중 심박수·혈중 산소 */}
            <section className="elder-sleep-card sleep-vital-card" aria-label="수면 중 심박수와 혈중 산소">
              <b className="sleep-card-title">수면 중 심박수·혈중 산소</b>
              <ul className="sleep-vital-list">
                {([
                  { id: 'hr', label: '심박수', unit: 'bpm', icon: 'heart-pulse', v: night.hr },
                  { id: 'spo2', label: '혈중 산소', unit: '%', icon: 'drop', v: night.spo2 },
                ] as const).map((row) => (
                  <li key={row.id}>
                    <div className="sleep-vital-head">
                      <span className="sleep-vital-ico metric-ico tinted" data-metric={row.id}><Ri name={row.icon} fill size={18} /></span>
                      <b>{row.label}</b>
                      <small>{row.unit}</small>
                    </div>
                    <div className="sleep-vital-stats">
                      <span><em>최저</em><strong>{row.v[0]}</strong></span>
                      <span><em>평균</em><strong>{row.v[1]}</strong></span>
                      <span><em>최고</em><strong>{row.v[2]}</strong></span>
                    </div>
                  </li>
                ))}
              </ul>
            </section>

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
                {SLEEP_RECENT.map((row) => (
                  <li key={row.date}>
                    <button
                      type="button"
                      className="ms-hist-row"
                      onClick={() => navigate('/vitaling/measure/sleep/history')}
                    >
                      <span>
                        <b>{row.date}</b>
                        <em>{row.sub}</em>
                      </span>
                      <strong>{row.value}</strong>
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {effInfo && <SleepEfficiencyInfoSheet onClose={() => setEffInfo(false)} />}
        </div>
      </Phone>
    </div>
  )
}
