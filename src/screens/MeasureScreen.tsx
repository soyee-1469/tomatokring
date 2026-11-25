import { MetricInfoButton } from '../components/AccuracyInfo'
import {
  CalendarBlank,
  CaretDown,
  CaretLeft,
  CaretRight,
  Fire,
  Sneaker,
} from '@phosphor-icons/react'
import { useEffect, useRef, useState, type ReactNode } from 'react'
import { Navigate, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { Header, Phone } from '../components/ui'
import { getSession, isMeasureDone, markMeasureDone, saveDietPhoto, todayDietPhoto, type MeasureKind, addStressReading } from '../session'
import { useSession } from '../useSession'
import { ClaimBanner } from '../components/ClaimBanner'
import { useScrub } from '../components/useScrub'
import { VitalDayBodyV2 } from './VitalDayBodyV2'
import { Ri } from '../components/Ri'
import { MEALS } from '../meals'
import { STEPS_BY_HOUR } from '../steps'
import { HOME_COLORS } from '../palette'

type Period = 'day' | 'week' | 'month'

type RecentRow = {
  date: string
  sub: string
  value: string
  today?: boolean
}

const WEEKDAYS = ['일', '월', '화', '수', '목', '금', '토'] as const

const LIVE_METRICS = [
  { id: 'hr', label: '심박수', avg: '68', unit: 'bpm', min: '58', mean: '68', max: '92', zone: '심박수 구간' },
  { id: 'hrv', label: '심박변이도', avg: '32', unit: 'ms', min: '28', mean: '32', max: '48', zone: '심박변이도 구간' },
  { id: 'temp', label: '피부 온도', avg: '36.4', unit: '°C', min: '35.8', mean: '36.4', max: '36.9', zone: '피부 온도 구간' },
  { id: 'spo2', label: '혈중 산소', avg: '97', unit: '%', min: '94', mean: '97', max: '99', zone: '혈중 산소 구간' },
  { id: 'stress', label: '스트레스', avg: '1', unit: '점', min: '1', mean: '3', max: '8', zone: '스트레스 구간' },
] as const

const WEEKDAY_KO = ['일', '월', '화', '수', '목', '금', '토'] as const
/** 오늘 0시 (홈·상세 공통 날짜 기준) */
export function todayStart() {
  const d = new Date()
  return new Date(d.getFullYear(), d.getMonth(), d.getDate())
}
/** 홈에서 넘어온 ?d=YYYY-MM-DD → Date */
export function parseDateKey(v: string | null) {
  if (!v) return null
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(v)
  if (!m) return null
  return new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]))
}
/** 상세 화면 제목용: 오늘이면 '오늘', 아니면 '11월 16일' */
export function dayLabelOf(d: Date) {
  const t = todayStart()
  const same = d.getFullYear() === t.getFullYear() && d.getMonth() === t.getMonth() && d.getDate() === t.getDate()
  return same ? '오늘' : `${d.getMonth() + 1}월 ${d.getDate()}일`
}
/** n일 전 날짜를 '2026.11.17 화' 형식으로 */
export function recentDate(ago: number) {
  const d = todayStart()
  d.setDate(d.getDate() - ago)
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')} ${WEEKDAY_KO[d.getDay()]}`
}


const RHYTHM_TILES = [
  { label: '회복', value: '80', unit: '점', color: '#2F80ED' },
  { label: '피로', value: '52', unit: '점', color: '#FB8C00' },
  { label: '심박수', value: '72', unit: '회/분', color: '#E53935' },
  { label: '혈중 산소', value: '97', unit: '%', color: '#1E88E5' },
]

const RECENT: Record<Exclude<MeasureKind, 'sleep' | 'survey'>, RecentRow[]> = {
  health: [
    { date: recentDate(0), sub: '회복 80 · 활동 86', value: '86점', today: true },
    { date: recentDate(1), sub: '회복 72 · 활동 78', value: '78점' },
    { date: recentDate(2), sub: '회복 74 · 활동 80', value: '80점' },
  ],
  stress: [
    { date: recentDate(0), sub: '실시간 · 16:19', value: '28점', today: true },
    { date: recentDate(1), sub: '실시간 · 15:10', value: '33점' },
    { date: recentDate(2), sub: '실시간 · 09:20', value: '36점' },
  ],
  diet: [
    { date: `${recentDate(0)} · 점심`, sub: '한식 집밥 · 12:10', value: '520kcal', today: true },
    { date: `${recentDate(1)} · 저녁`, sub: '면 요리 · 18:40', value: '640kcal' },
  ],
  walk: [
    { date: recentDate(0), sub: '야외 걷기 · 32분', value: '8,412보', today: true },
    { date: recentDate(1), sub: '야외 걷기 · 48분', value: '9,120보' },
  ],
}

const TITLES: Record<MeasureKind, string> = {
  health: '바디 리듬',
  stress: '직접 측정',
  diet: 'AI 식단',
  walk: '활동',
  sleep: '수면',
  survey: '설문조사 (월)',
}

function isMeasureKind(v: string | undefined): v is MeasureKind {
  return !!v && v in TITLES
}

function addDays(d: Date, n: number) {
  const next = new Date(d.getFullYear(), d.getMonth(), d.getDate())
  next.setDate(next.getDate() + n)
  return next
}

function mondayOf(d: Date) {
  const day = d.getDay()
  return addDays(d, day === 0 ? -6 : 1 - day)
}

function periodLabel(period: Period, date: Date) {
  if (period === 'month') return `${date.getFullYear()}년 ${date.getMonth() + 1}월`
  if (period === 'week') {
    const start = mondayOf(date)
    const end = addDays(start, 6)
    if (start.getMonth() === end.getMonth()) {
      return `${start.getMonth() + 1}월 ${start.getDate()}일 – ${end.getDate()}일`
    }
    return `${start.getMonth() + 1}월 ${start.getDate()}일 – ${end.getMonth() + 1}월 ${end.getDate()}일`
  }
  return `${date.getMonth() + 1}월 ${date.getDate()}일 ${WEEKDAYS[date.getDay()]}요일`
}

const PERIOD_OPTIONS = [
  { id: 'day', label: '오늘', hint: '하루 기록만 봐요' },
  { id: 'week', label: '이번 주', hint: '일주일 기록을 모아 봐요' },
  { id: 'month', label: '이번 달', hint: '한 달 기록을 모아 봐요' },
] as const

function shiftPeriod(period: Period, date: Date, dir: number) {
  if (period === 'month') return new Date(date.getFullYear(), date.getMonth() + dir, 1)
  if (period === 'week') return addDays(date, dir * 7)
  return addDays(date, dir)
}

function DateBar({
  period,
  date,
  onDate,
  onPeriod,
}: {
  period: Period
  date: Date
  onDate: (d: Date) => void
  onPeriod?: (v: Period) => void
}) {
  const [open, setOpen] = useState(false)

  return (
    <div className="ms-date">
      <button type="button" className="ms-date-arrow" aria-label="이전" onClick={() => onDate(shiftPeriod(period, date, -1))}>
        <CaretLeft size={16} weight="bold" />
      </button>
      {onPeriod ? (
        <button
          type="button"
          className="ms-date-center"
          aria-haspopup="listbox"
          aria-expanded={open}
          onClick={() => setOpen((v) => !v)}
        >
          <b>{periodLabel(period, date)}</b>
          <CaretDown size={12} weight="bold" />
        </button>
      ) : (
        <span className="ms-date-center static">
          <b>{periodLabel(period, date)}</b>
          <CalendarBlank size={16} weight="bold" />
        </span>
      )}
      <button type="button" className="ms-date-arrow" aria-label="다음" onClick={() => onDate(shiftPeriod(period, date, 1))}>
        <CaretRight size={16} weight="bold" />
      </button>
      {open && onPeriod ? (
        <div className="ms-period-menu" role="listbox" aria-label="기간 선택">
          {PERIOD_OPTIONS.map((opt) => (
            <button
              key={opt.id}
              type="button"
              className={period === opt.id ? 'on' : ''}
              onClick={() => {
                onPeriod(opt.id)
                setOpen(false)
              }}
            >
              <b>{opt.label}</b>
              <em>{opt.hint}</em>
            </button>
          ))}
        </div>
      ) : null}
    </div>
  )
}

function RecentCard({
  title,
  rows,
  onMore,
  extra,
}: {
  title: string
  rows: RecentRow[]
  onMore: () => void
  extra?: ReactNode
}) {
  return (
    <div className="elder-sleep-card ms-hist-card">
      <div className="ms-recent-head">
        <b>{title}</b>
        <button type="button" className="ms-more" onClick={onMore}>
          더 보기
        </button>
      </div>
      {extra}
      <ul className="ms-hist-list">
        {rows.map((row) => (
          <li key={row.date}>
            <button type="button" className="ms-hist-row" onClick={onMore}>
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
  )
}

function HealthBody() {
  return (
    <>
      <div className="elder-sleep-card ms-hero ms-hero-plain">
        <div className="ms-score-hero">
          <em>오늘 바디 리듬</em>
          <strong>
            86<small>점</small>
          </strong>
          <span>평소보다 활기찬 편이에요</span>
        </div>
      </div>
      <div className="elder-sleep-card ms-vital-grid">
        {RHYTHM_TILES.map((v) => (
          <div key={v.label}>
            <em>
              <i style={{ background: v.color }} />
              {v.label}
            </em>
            <b>
              {v.value}
              <small>{v.unit}</small>
            </b>
          </div>
        ))}
      </div>
    </>
  )
}

function MeasureNow({
  label,
  busy,
  onClick,
}: {
  label: string
  busy: boolean
  onClick: () => void
}) {
  return (
    <button type="button" className="ms-now-btn" disabled={busy} onClick={onClick}>
      {busy ? '측정 중…' : label}
    </button>
  )
}


function LiveBody({
  onHistory,
  initialMetric,
  date,
  onDate,
  dayLabel,
  autoStart = false,
}: {
  onHistory: () => void
  initialMetric?: (typeof LIVE_METRICS)[number]['id']
  date: Date
  onDate: (d: Date) => void
  dayLabel?: string
  /** 홈의 측정하기에서 들어오면 상세에서 바로 측정을 시작 */
  autoStart?: boolean
}) {
  const [busy, setBusy] = useState(false)
  const started = useRef(false)
  const onMeasure = () => {
    setBusy(true)
    window.setTimeout(() => {
      setBusy(false)
      // 스트레스 측정이 실제로 끝났을 때만 완료 처리 (재측정이면 값 추가)
      if (!initialMetric || initialMetric === 'stress') {
        if (isMeasureDone(getSession(), 'stress')) addStressReading(25 + (Math.floor(Date.now() / 1000) % 21))
        else markMeasureDone('stress')
      }
    }, 900)
  }
  useEffect(() => {
    if (!autoStart || started.current) return
    if (initialMetric && initialMetric !== 'stress') return
    if (isMeasureDone(getSession(), 'stress')) return
    started.current = true
    onMeasure()
  }, [autoStart, initialMetric])
  void dayLabel
  return <VitalDayBodyV2 metric={initialMetric ?? 'stress'} date={date} onDate={onDate} busy={busy} onMeasure={onMeasure} onHistory={onHistory} />
}

/** 선택한 사진을 긴 변 640px JPEG data URL로 축소 (localStorage 저장용) */
function shrinkImage(file: File, maxSide = 640) {
  return new Promise<string>((resolve, reject) => {
    const url = URL.createObjectURL(file)
    const img = new Image()
    img.onload = () => {
      const scale = Math.min(1, maxSide / Math.max(img.width, img.height))
      const canvas = document.createElement('canvas')
      canvas.width = Math.round(img.width * scale)
      canvas.height = Math.round(img.height * scale)
      const ctx = canvas.getContext('2d')
      if (!ctx) {
        URL.revokeObjectURL(url)
        reject(new Error('canvas'))
        return
      }
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
      URL.revokeObjectURL(url)
      resolve(canvas.toDataURL('image/jpeg', 0.8))
    }
    img.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error('image'))
    }
    img.src = url
  })
}

const DIET_GOAL = { kcal: 2300, protein: 72, fat: 70, carb: 316 }

function MacroBar({ label, value, goal, color }: { label: string; value: number; goal: number; color: string }) {
  const pct = Math.min(100, Math.round((value / goal) * 100))
  return (
    <div className="diet-macro-row">
      <em>{label}</em>
      <div className="diet-macro-track" aria-hidden><i style={{ width: `${pct}%`, background: color }} /></div>
      <b>{value}<small> / {goal}g</small></b>
    </div>
  )
}

/** AI 식단: 총 섭취 칼로리 → 남은 칼로리 → 진행 바 → 3대 영양소 막대 → 식단 기록 → (+) 메뉴 */
function DietBody({ period, autoStart = false }: { period: Period; autoStart?: boolean }) {
  const navigate = useNavigate()
  const session = useSession()
  const photo = todayDietPhoto(session)
  const photoTime = new Date().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })
  const fileRef = useRef<HTMLInputElement>(null)
  const cameraRef = useRef<HTMLInputElement>(null)
  const started = useRef(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const [nameOpen, setNameOpen] = useState(false)
  const [foodName, setFoodName] = useState('')
  const measured = isMeasureDone(session, 'diet')
  const meals = measured ? MEALS : []
  const kcal = meals.reduce((a, m) => a + m.kcal, 0)
  const macro = {
    protein: meals.reduce((a, m) => a + m.protein, 0),
    fat: meals.reduce((a, m) => a + m.fat, 0),
    carb: meals.reduce((a, m) => a + m.carb, 0),
  }
  const remain = Math.max(0, DIET_GOAL.kcal - kcal)
  const scale = period === 'week' ? 7 : period === 'month' ? 30 : 1
  useEffect(() => {
    // 홈의 "식단 사진 올리기"로 들어오면 (+) 메뉴를 바로 연다
    if (!autoStart || started.current) return
    if (isMeasureDone(getSession(), 'diet')) return
    started.current = true
    setMenuOpen(true)
  }, [autoStart])
  const onFile = (file?: File | null) => {
    if (!file) return
    shrinkImage(file)
      .then((dataUrl) => saveDietPhoto(dataUrl))
      .catch(() => saveDietPhoto(''))
      .finally(() => markMeasureDone('diet'))
    setMenuOpen(false)
  }

  return (
    <>
      <div className="vd-card diet-sum">
        <em>{period === 'day' ? '총 섭취 칼로리' : period === 'week' ? '이번 주 하루 평균' : '이번 달 하루 평균'}</em>
        <strong>{kcal.toLocaleString('ko-KR')}<small>kcal</small></strong>
        {period === 'day' && (
          <p className="diet-remain">
            {kcal === 0 ? <>오늘 목표는 <b>{DIET_GOAL.kcal.toLocaleString('ko-KR')}kcal</b>예요</> : remain > 0 ? <>오늘은 <b>{remain.toLocaleString('ko-KR')}kcal</b> 더 드셔도 돼요</> : <>오늘 목표 칼로리를 <b>다 채웠어요</b></>}
            <button type="button" className="diet-goal-btn" aria-label="목표 조정" onClick={() => navigate('/vitaling/goals')}><Ri name="equalizer" size={20} /></button>
          </p>
        )}
        <div className="diet-bar" aria-hidden><i style={{ width: `${Math.min(100, (kcal / (DIET_GOAL.kcal * scale)) * 100)}%` }} /></div>
        <div className="diet-bar-labels"><b>{kcal.toLocaleString('ko-KR')}kcal</b><span>{(DIET_GOAL.kcal * scale).toLocaleString('ko-KR')}kcal</span></div>
        <div className="diet-macros">
          <MacroBar label="단백질" value={macro.protein} goal={DIET_GOAL.protein * scale} color="#E4605A" />
          <MacroBar label="지방" value={macro.fat} goal={DIET_GOAL.fat * scale} color="#E9C34A" />
          <MacroBar label="탄수화물" value={macro.carb} goal={DIET_GOAL.carb * scale} color="#8BC34A" />
        </div>
      </div>

      <div className="vd-card">
        <div className="vd-head">
          <b className="vd-title">식단 기록</b>
        </div>
        <ul className="diet-rows">
          {photo ? (
            <li>
              <span className="thumb photo" aria-hidden><img src={photo} alt="" /></span>
              <span className="copy">
                <span className="line1"><b>{foodName || '오늘 올린 식단 사진'}</b><time>{photoTime}</time></span>
                <span className="line2"><strong>분석 중</strong><em>AI 분석 결과는 잠시 후 표시돼요</em></span>
              </span>
            </li>
          ) : null}
          {meals.map((m) => (
            <li key={m.name}>
              <span className="thumb" aria-hidden><Ri name="restaurant" size={22} /></span>
              <span className="copy">
                <span className="line1"><b>{m.name}</b><time>{m.time}</time></span>
                <span className="line2"><strong>{m.kcal}kcal</strong><em>단백질 {m.protein}g · 지방 {m.fat}g · 탄수 {m.carb}g</em></span>
              </span>
            </li>
          ))}
          {meals.length === 0 && !photo && <li className="diet-empty">아직 오늘 식단 기록이 없어요. 아래 + 버튼으로 사진을 올려 보세요.</li>}
        </ul>
        <ClaimBanner kind="diet" doneText="등록 완료" />
        <input ref={fileRef} type="file" accept="image/*" hidden onChange={(e) => onFile(e.target.files?.[0])} />
        <input ref={cameraRef} type="file" accept="image/*" capture="environment" hidden onChange={(e) => onFile(e.target.files?.[0])} />
      </div>

      {period === 'month' ? (
        <div className="vd-card">
          <b className="vd-title">월간 영양 분석</b>
          <i className="ms-nutri-bar" aria-hidden />
          <ul className="ms-nutri-leg">
            <li><i className="protein" />단백질 {macro.protein}g</li>
            <li><i className="fat" />지방 {macro.fat}g</li>
            <li><i className="carb" />탄수화물 {macro.carb}g</li>
          </ul>
        </div>
      ) : null}

      {/* (+) 메뉴: 사진 촬영 · 앨범 사진 선택 · 음식 이름 입력 */}
      <button type="button" className={`diet-fab ${menuOpen ? 'open' : ''}`} aria-label={menuOpen ? '닫기' : '식단 추가'} onClick={() => setMenuOpen((v) => !v)}>
        <Ri name={menuOpen ? 'close' : 'add'} size={28} />
      </button>
      {menuOpen && (
        <>
          <button type="button" className="diet-fab-backdrop" aria-label="닫기" onClick={() => setMenuOpen(false)} />
          <ul className="diet-fab-menu" role="menu">
            <li><button type="button" onClick={() => cameraRef.current?.click()}><Ri name="camera" fill size={22} />사진 촬영</button></li>
            <li><button type="button" onClick={() => fileRef.current?.click()}><Ri name="image" fill size={22} />앨범 사진 선택</button></li>
            <li><button type="button" onClick={() => { setMenuOpen(false); setNameOpen(true) }}><Ri name="pencil" fill size={22} />음식 이름 입력</button></li>
          </ul>
        </>
      )}
      {nameOpen && (
        <div className="sheet-overlay" role="dialog" aria-modal="true" aria-labelledby="diet-name-title">
          <button type="button" className="sheet-backdrop" aria-label="닫기" onClick={() => setNameOpen(false)} />
          <div className="sheet-panel">
            <div className="sheet-handle" />
            <div className="sheet-top"><h2 id="diet-name-title">음식 이름 입력</h2></div>
            <input className="diet-name-input" placeholder="예: 된장찌개, 바나나" value={foodName} onChange={(e) => setFoodName(e.target.value)} />
            <button type="button" className="vd-now" disabled={!foodName.trim()} onClick={() => { markMeasureDone('diet'); setNameOpen(false) }}>기록하기</button>
          </div>
        </div>
      )}
    </>
  )
}

/** 걷기 상세 그래프: 시간별은 알약 막대(최근·누른 막대만 진하게), 누적은 목표 점선까지 차오르는 면 그래프 */
function WalkChart({ mode, hourSteps, cumSteps, latest, goal, picked, onPick }: {
  mode: 'hour' | 'sum'; hourSteps: readonly number[]; cumSteps: readonly number[]; latest: number; goal: number
  picked: number | null; onPick: (h: number | null) => void
}) {
  const color = HOME_COLORS.leaf
  const W = 320, H = 172, padL = 44, padR = 8, top = 14, bottom = 138
  const slot = (W - padL - padR) / 24
  const bw = 7
  const cx = (h: number) => padL + slot * (h + 0.5)
  const max = mode === 'hour' ? Math.max(500, Math.ceil(Math.max(...hourSteps) / 500) * 500) : Math.ceil(Math.max(goal, cumSteps[latest]) / 2000) * 2000
  const y = (v: number) => bottom - (Math.min(max, v) / max) * (bottom - top)
  const ticks = mode === 'hour' ? [0, max / 2, max] : [0, max]
  // 누른 위치 → 시간 (아직 오지 않은 시간은 가장 최근 시간으로)
  const scrub = useScrub<HTMLDivElement>()
  const hit = scrub.pos === null ? null : Math.min(latest, Math.max(0, Math.floor((scrub.pos * W - padL) / slot)))
  useEffect(() => { onPick(hit) }, [hit, onPick])
  const strong = picked ?? latest
  const pts = cumSteps.slice(0, latest + 1).map((v, h) => ({ x: cx(h), y: y(v) }))
  const line = pts.map((p, i) => `${i ? 'L' : 'M'} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(' ')
  return (
    <div className="chart-scrub ms-walk-chart" ref={scrub.ref} aria-hidden>
      <svg viewBox={`0 0 ${W} ${H}`}>
        <defs>
          <linearGradient id="walkArea" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="0.32" />
            <stop offset="100%" stopColor={color} stopOpacity="0.02" />
          </linearGradient>
        </defs>
        {ticks.map((t) => (
          <g key={t}>
            <line x1={padL} x2={W - padR} y1={y(t)} y2={y(t)} stroke="#EEF0F2" strokeWidth="1.5" />
            <text x={padL - 8} y={y(t) + 4} textAnchor="end" className="tick">{t.toLocaleString('ko-KR')}</text>
          </g>
        ))}
        {mode === 'hour' ? (
          hourSteps.map((v, h) => v > 0 && (
            <rect key={h} x={cx(h) - bw / 2} y={Math.min(y(v), bottom - bw)} width={bw} height={Math.max(bw, bottom - y(v))} rx={bw / 2} fill={color} opacity={h === strong ? 1 : 0.35} />
          ))
        ) : (
          <>
            <line x1={padL} x2={W - padR} y1={y(goal)} y2={y(goal)} stroke="#1a2332" strokeOpacity="0.35" strokeWidth="1.5" strokeDasharray="4 4" />
            <text x={padL - 8} y={y(goal) + 4} textAnchor="end" className="goal">목표</text>
            <path d={`${line} L ${pts[pts.length - 1].x.toFixed(1)} ${bottom} L ${pts[0].x.toFixed(1)} ${bottom} Z`} fill="url(#walkArea)" />
            <path d={line} fill="none" stroke={color} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
            {picked !== null && <line x1={cx(picked)} x2={cx(picked)} y1={top} y2={bottom} stroke="#1a2332" strokeOpacity="0.45" strokeWidth="1.5" strokeDasharray="3 3" />}
            <circle cx={cx(strong)} cy={y(cumSteps[strong])} r={5.5} fill={color} stroke="#fff" strokeWidth="2" />
          </>
        )}
        {[0, 6, 12, 18].map((h) => (
          <text key={h} x={cx(h)} y={H - 8} textAnchor="middle" className="tick">{h}시</text>
        ))}
      </svg>
    </div>
  )
}

function WalkBody({ period, date, autoStart = false }: { period: Period; date: Date; autoStart?: boolean }) {
  const [mode, setMode] = useState<'hour' | 'sum'>('hour')
  const [busy, setBusy] = useState(false)
  const started = useRef(false)
  const onSync = () => {
    setBusy(true)
    window.setTimeout(() => {
      setBusy(false)
      // 링에서 오늘 걸음을 실제로 불러온 뒤 완료 처리
      markMeasureDone('walk')
    }, 900)
  }
  useEffect(() => {
    // 홈의 측정 버튼으로 들어오면 걸음 불러오기를 바로 시작
    if (!autoStart || started.current) return
    if (isMeasureDone(getSession(), 'walk')) return
    started.current = true
    onSync()
  }, [autoStart])
  const session = useSession()
  const goal = session.healthGoals.steps
  const hourSteps = STEPS_BY_HOUR
  const cumSteps = hourSteps.map((_, i) => hourSteps.slice(0, i + 1).reduce((a, b) => a + b, 0))
  // 가장 최근에 걸음이 잡힌 시간 · 가장 많이 걸은 시간
  const latest = hourSteps.reduce((last, v, i) => (v > 0 ? i : last), 0)
  const peak = hourSteps.indexOf(Math.max(...hourSteps))
  const [picked, setPicked] = useState<number | null>(null)
  const values = mode === 'hour' ? hourSteps : cumSteps

  return (
    <>
      <div className="ms-act-hero">
        <em>총 걸음 수</em>
        <strong>8,412<small>걸음</small></strong>
        <span>{period === 'day' ? '1시간에 평균 350걸음 걸었어요' : '하루 평균 6,650걸음 걸었어요'}</span>
      </div>

      <div className="elder-sleep-card ms-walk-card">
        <div className="ms-recent-head">
          <b>{mode === 'hour' ? '시간별 걸음' : '누적 걸음'}</b>
          <div className="ms-seg">
            <button type="button" className={mode === 'hour' ? 'on' : ''} onClick={() => setMode('hour')}>
              시간별
            </button>
            <button type="button" className={mode === 'sum' ? 'on' : ''} onClick={() => setMode('sum')}>
              누적
            </button>
          </div>
        </div>
        {/* 왼쪽 위 한 줄: 평소엔 가장 많이 걸은 시간, 막대를 누르면 그 시간의 걸음 수·날짜 */}
        <p className="ms-bar-pick" aria-live="polite">
          {picked !== null ? (
            <>
              <b>{values[picked].toLocaleString('ko-KR')}<small>걸음</small></b>
              <span>{date.getMonth() + 1}월 {date.getDate()}일 {picked}시{mode === 'sum' ? '까지' : ''}</span>
            </>
          ) : (
            <span>{mode === 'hour' ? `${peak}시에 가장 많이 걸었어요` : cumSteps[latest] >= goal ? `목표 ${goal.toLocaleString('ko-KR')}걸음을 채웠어요` : `목표까지 ${(goal - cumSteps[latest]).toLocaleString('ko-KR')}걸음 남았어요`}</span>
          )}
        </p>
        <WalkChart mode={mode} hourSteps={hourSteps} cumSteps={cumSteps} latest={latest} goal={goal} picked={picked} onPick={setPicked} />
      </div>

      <div className="elder-sleep-card">
        <MeasureNow label="오늘 걸음 불러오기" busy={busy} onClick={onSync} />
        <ClaimBanner kind="walk" doneText="걸음 확인 완료" />
      </div>

      <div className="ms-split-2">
        <div className="elder-sleep-card">
          <Fire size={22} weight="fill" color="#E53935" />
          <em>총 소모 칼로리</em>
          <b>310kcal</b>
        </div>
        <div className="elder-sleep-card">
          <Sneaker size={22} weight="fill" color="#2F80ED" />
          <em>총 거리</em>
          <b>5.9km</b>
        </div>
      </div>
    </>
  )
}

function isLiveMetric(v: string | null): v is (typeof LIVE_METRICS)[number]['id'] {
  return !!v && LIVE_METRICS.some((m) => m.id === v)
}

export function MeasureScreen() {
  const { kind } = useParams()
  const [params] = useSearchParams()
  const navigate = useNavigate()
  const valid = isMeasureKind(kind)
  const [date, setDate] = useState(() => parseDateKey(params.get('d')) ?? todayStart())
  const [period, setPeriod] = useState<Period>('day')
  const withPeriod = kind === 'diet' || kind === 'walk'
  const mParam = params.get('m')
  const liveMetric = isLiveMetric(mParam) ? mParam : 'stress'
  const pageTitle =
    kind === 'stress'
      ? (LIVE_METRICS.find((m) => m.id === liveMetric)?.label ?? TITLES.stress)
      : TITLES[kind as MeasureKind]

  useEffect(() => {
    // 종합(health)만 열람으로 완료 처리. 스트레스·식단·걷기는 실제 측정/업로드/동기화 후 완료
    if (valid && kind === 'health') markMeasureDone(kind)
  }, [kind, valid])

  if (!valid) return <Navigate to="/vitaling/home" replace />
  if (kind === 'sleep') return <Navigate to="/vitaling/sleep" replace />
  if (kind === 'survey') return <Navigate to="/vitaling/survey" replace />

  const dateKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
  const historyTo = kind === 'stress' ? `/vitaling/measure/stress/history?m=${liveMetric}&d=${dateKey}` : `/vitaling/measure/${kind}/history`

  return (
    <div className="stage">
      <Phone>
        <div className={`screen elder-home ${kind === 'stress' ? 'v2-page' : ''}`}>
          <Header
            title={pageTitle}
            backTo="/vitaling/home"
            right={
              <>
                <MetricInfoButton metric={kind === 'stress' ? liveMetric : (kind as MeasureKind)} tone="plain" />
              </>
            }
          />

          {withPeriod && (
            <div className="vd-period" role="tablist" aria-label="기간">
              {PERIOD_OPTIONS.map((opt) => (
                <button key={opt.id} type="button" role="tab" aria-selected={period === opt.id} className={period === opt.id ? 'on' : ''} onClick={() => setPeriod(opt.id)}>
                  {opt.label}
                </button>
              ))}
            </div>
          )}
          {kind !== 'stress' && <DateBar period={withPeriod ? period : 'day'} date={date} onDate={setDate} />}

          <div className="scroll elder-body">
            {kind === 'health' ? <HealthBody /> : null}
            {kind === 'stress' ? (
              <LiveBody
                onHistory={() => navigate(historyTo)}
                initialMetric={liveMetric}
                date={date}
                onDate={setDate}
                dayLabel={dayLabelOf(date)}
                autoStart={params.get('run') === '1' && liveMetric === 'stress'}
              />
            ) : null}
            {kind === 'diet' ? <DietBody period={period} autoStart={params.get('run') === '1'} /> : null}
            {kind === 'walk' ? <WalkBody period={period} date={date} autoStart={params.get('run') === '1'} /> : null}
            {kind === 'health' ? (
              <RecentCard title="최근 기록" rows={RECENT.health} onMore={() => navigate(historyTo)} />
            ) : null}
          </div>

        </div>
      </Phone>
    </div>
  )
}

export { DateBar, type Period }
