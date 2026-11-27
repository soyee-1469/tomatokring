import { Info } from '@phosphor-icons/react'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { WEEKDAYS } from '../dates'
import { Header, Phone, PrimaryButton } from '../components/ui'
import { Ri } from '../components/Ri'
import { CONDITION_OPTIONS } from '../screens'
import { setConditionCheck, setSignalDemo, todayCondition, type SignalState } from '../session'
import { useSession } from '../useSession'

/* 브링 API에서 받는 값(샘플): 오늘 판정·메시지, 최근 5일 변화, 수면 중 4개 지표의 오늘값과 28일 평소 범위 */
type Metric = { id: 'hr' | 'hrv' | 'temp' | 'spo2'; label: string; unit: string; icon: string; value: number; lo: number; hi: number; digits?: number }
const SIGNAL_SAMPLE: Record<Exclude<SignalState, 'collecting'>, { say: string; detail: string; badDays: readonly number[]; noneDays: readonly number[]; metrics: readonly Metric[] }> = {
  normal: {
    say: '오늘은 평소와 비슷해요',
    detail: '수면 중 심박수·심박변이도·피부 온도·혈중 산소가 모두 평소 범위 안에 있어요.',
    badDays: [15, 16], noneDays: [9],
    metrics: [
      { id: 'hr', label: '심박수', unit: 'bpm', icon: 'heart-pulse', value: 57, lo: 52, hi: 63 },
      { id: 'hrv', label: '심박변이도', unit: 'ms', icon: 'pulse', value: 44, lo: 34, hi: 57 },
      { id: 'temp', label: '피부 온도', unit: '°C', icon: 'temp-hot', value: 36.2, lo: 35.3, hi: 36.9, digits: 1 },
      { id: 'spo2', label: '혈중 산소', unit: '%', icon: 'drop', value: 96, lo: 94, hi: 97 },
    ],
  },
  detected: {
    say: '어제에 이어 2일째 이상 징후가 감지됐어요',
    detail: '수면 중 심박수·심박변이도가 최근 28일 평소 범위를 벗어났어요.',
    badDays: [0, 1, 2, 12], noneDays: [20],
    metrics: [
      { id: 'hr', label: '심박수', unit: 'bpm', icon: 'heart-pulse', value: 67, lo: 52, hi: 63 },
      { id: 'hrv', label: '심박변이도', unit: 'ms', icon: 'pulse', value: 31, lo: 34, hi: 57 },
      { id: 'temp', label: '피부 온도', unit: '°C', icon: 'temp-hot', value: 36.8, lo: 35.3, hi: 36.9, digits: 1 },
      { id: 'spo2', label: '혈중 산소', unit: '%', icon: 'drop', value: 95.3, lo: 94, hi: 97, digits: 1 },
    ],
  },
}
const COLLECTED_DAYS = 11

/** 최근 4주 달력 — 깃허브 잔디처럼 날짜마다 작은 네모 하나. 파랑 평소 · 토마토 평소와 다름 · 회색 기록 없음 */
type DayState = 'ok' | 'bad' | 'none'
function SignalCalendar({ bad, none }: { bad: readonly number[]; none: readonly number[] }) {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  // 오늘이 있는 주의 토요일까지 4주(28칸)
  const end = new Date(today)
  end.setDate(end.getDate() + (6 - end.getDay()))
  const cells: { date: Date; offset: number; state: DayState | 'future' }[] = []
  for (let i = 27; i >= 0; i--) {
    const d = new Date(end)
    d.setDate(end.getDate() - i)
    const offset = Math.round((today.getTime() - d.getTime()) / 86_400_000)
    const state: DayState | 'future' = offset < 0 ? 'future' : bad.includes(offset) ? 'bad' : none.includes(offset) ? 'none' : 'ok'
    cells.push({ date: d, offset, state })
  }
  const badCount = cells.filter((c) => c.state === 'bad').length
  let streak = 0
  while (bad.includes(streak)) streak++
  const say = streak >= 2
    ? `${['', '', '이틀', '사흘', '나흘', '닷새', '엿새', '이레'][Math.min(streak, 7)]}째 평소와 달라요`
    : badCount === 0 ? '4주 내내 평소와 비슷해요' : `최근 4주 중 평소와 다른 날이 ${badCount}일 있었어요`
  return (
    <div className="signal-cal-wrap">
      <div className="signal-cal">
        {WEEKDAYS.map((w) => <span key={w} className="signal-cal-wd">{w}</span>)}
        {cells.map((c) => (
          <span key={c.offset} className={`signal-cal-cell ${c.state} ${c.offset === 0 ? 'today' : ''}`} aria-label={`${c.date.getMonth() + 1}월 ${c.date.getDate()}일 ${c.state === 'bad' ? '평소와 다름' : c.state === 'ok' ? '평소' : c.state === 'none' ? '기록 없음' : ''}`}>
            {c.date.getDate() === 1 ? `${c.date.getMonth() + 1}/1` : c.date.getDate()}
          </span>
        ))}
      </div>
      <div className="signal-strip-legend"><span><i className="ok" />평소</span><span><i className="bad" />평소와 다름</span><span><i className="none" />기록 없음</span></div>
      <p className="signal-strip-say">{say}</p>
    </div>
  )
}

/** 지표 슬라이더 — 회색 전체 트랙 위에 평소 범위 띠, 오늘 값 점. 범위 밖이면 토마토 */
function RangeSlider({ m }: { m: Metric }) {
  const pad = (m.hi - m.lo) * 0.6
  const min = m.lo - pad
  const max = m.hi + pad
  const pct = (v: number) => Math.min(98, Math.max(2, ((v - min) / (max - min)) * 100))
  const out = m.value < m.lo || m.value > m.hi
  const fmt = (v: number) => (m.digits && v % 1 !== 0 ? v.toFixed(m.digits) : String(v))
  return (
    <li className={`signal-metric ${out ? 'out' : ''}`}>
      <div className="signal-metric-head">
        <span className="signal-metric-ico metric-ico" data-metric={m.id}><Ri name={m.icon} fill size={18} /></span>
        <b>{m.label}</b>
        <small>{m.unit}</small>
        <span className={`elder-menu-tag ${out ? 'low' : 'calm'}`}>{out ? (m.value > m.hi ? '평소보다 높음' : '평소보다 낮음') : '평소 범위'}</span>
      </div>
      <div className="signal-slider">
        <div className="signal-slider-track">
          <i className="signal-slider-band" style={{ left: `${pct(m.lo)}%`, width: `${pct(m.hi) - pct(m.lo)}%` }} />
          <i className="signal-slider-mid" style={{ left: `${pct((m.lo + m.hi) / 2)}%` }} />
          <span className="signal-slider-knob" style={{ left: `${pct(m.value)}%` }}>
            <em>{fmt(m.value)}</em>
          </span>
        </div>
        <div className="signal-slider-axis">
          <span style={{ left: `${pct(m.lo)}%` }}>{fmt(m.lo)}</span>
          <span style={{ left: `${pct(m.hi)}%` }}>{fmt(m.hi)}</span>
        </div>
      </div>
    </li>
  )
}

function SignalInfoSheet({ onClose }: { onClose: () => void }) {
  return (
    <div className="sheet-overlay" role="dialog" aria-modal="true" aria-labelledby="signal-info-title">
      <button type="button" className="sheet-backdrop" aria-label="닫기" onClick={onClose} />
      <div className="sheet-panel signal-info-sheet">
        <div className="sheet-handle" />
        <h2 id="signal-info-title">이상 징후란?</h2>
        <p>잠자는 동안 반지가 잰 심박수·심박변이도·피부 온도·혈중 산소를 <b>나의 최근 28일 평소 범위</b>와 비교해요.</p>
        <p>이틀 이상 평소 범위를 벗어나면 "이상 징후 감지"로 알려 드려요. 하루만 달라진 것은 감지로 보지 않아요.</p>
        <p>바디 리듬은 피로와 회복을, 이상 징후는 몸이 평소와 다르다는 신호를 보는 것이라 두 결과가 다르게 나올 수 있어요.</p>
        <p className="signal-info-notice">질병을 진단하는 기능이 아니에요. 불편함이 계속되면 전문가와 상의해 주세요.</p>
        <PrimaryButton onClick={onClose}>확인</PrimaryButton>
      </div>
    </div>
  )
}

export function SignalScreen() {
  const navigate = useNavigate()
  const session = useSession()
  const [info, setInfo] = useState(false)
  const state = session.signalDemo
  const condition = todayCondition(session)
  const picked = condition ? CONDITION_OPTIONS.find((o) => o.id === condition) : null
  const sample = state === 'collecting' ? null : SIGNAL_SAMPLE[state]

  return (
    <div className="stage">
      <Phone>
        <div className={`screen elder-home v2-page signal-detail ${state}`}>
          <Header
            title="이상 징후"
            backTo="/vitaling/home"
            right={
              <button type="button" className="icon-btn" aria-label="이상 징후 안내" onClick={() => setInfo(true)}>
                <Info size={22} weight="regular" />
              </button>
            }
          />

          <div className="scroll elder-body v2-page">
            {/* 상태 히어로: 준비 중(회색) · 평소와 비슷(파랑) · 감지(토마토) */}
            <section className="signal-hero" aria-label="오늘 이상 징후 상태">
              <span className="signal-hero-ico"><Ri name="siren" fill size={26} /></span>
              <div className="signal-hero-text">
                <span className={`elder-menu-tag ${state === 'detected' ? 'low' : state === 'normal' ? 'calm' : 'pending'}`}>
                  {state === 'detected' ? '감지' : state === 'normal' ? '평소와 비슷' : '준비 중'}
                </span>
                <b>{sample ? sample.say : '이상 징후를 준비하고 있어요'}</b>
                <p>{sample ? sample.detail : `잘 때 반지를 끼면 28일 동안 나의 평소 범위를 익혀요. 지금까지 ${COLLECTED_DAYS}일 모였어요.`}</p>
              </div>
            </section>

            {state === 'collecting' ? (
              <section className="elder-sleep-card signal-collecting" aria-label="준비 안내">
                <div className="signal-days" aria-label={`28일 중 ${COLLECTED_DAYS}일`}>
                  <i style={{ width: `${(COLLECTED_DAYS / 28) * 100}%` }} />
                </div>
                <div className="signal-days-axis"><span>{COLLECTED_DAYS}일 모임</span><span>28일</span></div>
                <p>28일이 모이면 최근 5일 징후 변화와 수면 중 지표를 평소 범위와 비교해 보여 드려요.</p>
              </section>
            ) : (
              <>
                {/* 최근 5일 징후 변화 */}
                <section className="elder-sleep-card" aria-label="징후 변화">
                  <b className="sleep-card-title">징후 변화</b>
                  <p className="signal-note"><Ri name="bar-chart" size={16} />최근 4주 · 이틀 연속 다르면 감지</p>
                  <SignalCalendar bad={sample!.badDays} none={sample!.noneDays} />
                </section>

                {/* 수면 중 4개 지표 슬라이더 */}
                <section className="elder-sleep-card" aria-label="수면 중 주요 지표">
                  <b className="sleep-card-title">수면 중 주요 지표</b>
                  <p className="signal-note"><Ri name="bar-chart" size={16} />나의 최근 28일 데이터를 기준으로 비교해요</p>
                  <ul className="signal-metric-list">
                    {sample!.metrics.map((m) => <RangeSlider key={m.id} m={m} />)}
                  </ul>
                </section>

                {/* 컨디션 체크 — 홈 감지 카드와 같은 얼굴 3개, 답은 날짜별로 저장 */}
                <section className="elder-sleep-card signal-condition" aria-label="오늘 컨디션">
                  <b className="sleep-card-title">오늘 컨디션은 어떤가요?</b>
                  <div className="elder-signal-options">
                    {CONDITION_OPTIONS.map((o) => (
                      <button key={o.id} type="button" className={condition === o.id ? 'on' : ''} onClick={() => setConditionCheck(o.id)} aria-pressed={condition === o.id}>
                        <Ri name={o.icon} fill={condition === o.id} size={28} />
                        <b>{o.label}</b>
                      </button>
                    ))}
                  </div>
                  <p className="elder-signal-advice">{picked ? picked.advice : '오늘 느낌을 골라 두면 기록에 남아요.'}</p>
                </section>
              </>
            )}

            <p className="signal-disclaimer">이상 징후는 질병 진단이 아니에요. 몸이 평소와 다르다는 신호일 뿐이니, 불편함이 계속되면 전문가와 상의해 주세요.</p>

            {/* 시안 확인용 샘플 상태 전환 (마이 화면의 데모 상자와 같은 값) */}
            <div className="signal-demo" aria-label="샘플 상태 보기">
              <span>샘플 상태</span>
              {(['collecting', 'normal', 'detected'] as const).map((s) => (
                <button key={s} type="button" className={state === s ? 'on' : ''} onClick={() => setSignalDemo(s)}>
                  {s === 'collecting' ? '준비 중' : s === 'normal' ? '비슷' : '감지'}
                </button>
              ))}
            </div>
            <div className="elder-claim-actions">
              <button type="button" onClick={() => navigate('/vitaling/home')}>홈으로</button>
            </div>
          </div>

          {info && <SignalInfoSheet onClose={() => setInfo(false)} />}
        </div>
      </Phone>
    </div>
  )
}
