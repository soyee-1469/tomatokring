import { MetricInfoButton } from '../components/AccuracyInfo'
import {
  CalendarBlank,
  CaretDown,
  CaretLeft,
  CaretRight,
  CheckCircle,
  Export,
  Fire,
  ForkKnife,
  Heartbeat,
  Plus,
  Sneaker,
  Waveform,
  Wind,
} from '@phosphor-icons/react'
import { useEffect, useRef, useState, type ReactNode } from 'react'
import { Navigate, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { BottomNav, Header, Phone } from '../components/ui'
import { getSession, isMeasureDone, markMeasureDone, saveDietPhoto, todayDietPhoto, type MeasureKind } from '../session'
import { useSession } from '../useSession'
import { autoIntervalFor, dayLog, formatLogValue, STRESS_DAY_POINTS, type LiveMetricId } from '../measureLog'

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

const LIVE_ZONES: Record<(typeof LIVE_METRICS)[number]['id'], { t: string; p: number; c: string }[]> = {
  hr: [
    { t: '휴식', p: 35, c: '#66BB6A' },
    { t: '일상생활', p: 50, c: '#42A5F5' },
    { t: '운동', p: 15, c: '#FB8C00' },
  ],
  hrv: [
    { t: '낮음', p: 40, c: '#E53935' },
    { t: '보통', p: 45, c: '#FDD835' },
    { t: '좋음', p: 15, c: '#66BB6A' },
  ],
  temp: [
    { t: '낮음', p: 10, c: '#42A5F5' },
    { t: '정상', p: 80, c: '#66BB6A' },
    { t: '높음', p: 10, c: '#FB8C00' },
  ],
  spo2: [
    { t: '주의', p: 5, c: '#FB8C00' },
    { t: '보통', p: 20, c: '#FDD835' },
    { t: '정상', p: 75, c: '#66BB6A' },
  ],
  stress: [
    { t: '매우 높음', p: 0, c: '#E53935' },
    { t: '높음', p: 8, c: '#FB8C00' },
    { t: '보통', p: 22, c: '#FDD835' },
    { t: '낮음', p: 40, c: '#66BB6A' },
    { t: '매우 낮음', p: 30, c: '#AED581' },
  ],
}

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

/** 브링식 하루 측정 그래프: 0~24시 축, 측정 시각마다 점, 평균 점선 */
function DayDotChart({
  points,
  color,
  yMin,
  yMax,
  unit,
}: {
  points: readonly { readonly h: number; readonly v: number }[]
  color: string
  yMin: number
  yMax: number
  unit: string
}) {
  const w = 300
  const h = 132
  const padL = 44
  const padR = 12
  const padT = 14
  const padB = 24
  const xOf = (hour: number) => padL + (hour / 24) * (w - padL - padR)
  const yOf = (v: number) => padT + (1 - (v - yMin) / Math.max(0.001, yMax - yMin)) * (h - padT - padB)
  const avg = points.reduce((a, b) => a + b.v, 0) / Math.max(1, points.length)
  const last = points.length - 1
  const d = points.map((pt, i) => `${i === 0 ? 'M' : 'L'} ${xOf(pt.h)} ${yOf(pt.v)}`).join(' ')
  return (
    <svg className="ms-day-chart" viewBox={`0 0 ${w} ${h}`} aria-hidden>
      {[yMax, (yMin + yMax) / 2, yMin].map((v) => (
        <g key={v}>
          <line x1={padL} y1={yOf(v)} x2={w - padR} y2={yOf(v)} stroke="#eef1f4" strokeWidth="1" />
          <text x={padL - 6} y={yOf(v) + 4} textAnchor="end" fontSize="12" fontWeight="700" fill="#6b7684">
            {Math.round(v)}{unit}
          </text>
        </g>
      ))}
      {points.length > 1 && (
        <line x1={padL} y1={yOf(avg)} x2={w - padR} y2={yOf(avg)} stroke={color} strokeWidth="1.2" strokeDasharray="3 4" opacity="0.5" />
      )}
      {points.length > 1 && <path d={d} fill="none" stroke={color} strokeWidth="2.4" strokeLinejoin="round" strokeLinecap="round" />}
      {points.map((pt, i) => (
        <circle key={`${pt.h}-${i}`} cx={xOf(pt.h)} cy={yOf(pt.v)} r={i === last ? 6 : 4} fill={i === last ? color : '#fff'} stroke={color} strokeWidth="2" />
      ))}
      {[0, 6, 12, 18, 24].map((hour) => (
        <text key={hour} x={xOf(hour)} y={h - 5} textAnchor="middle" fontSize="12" fontWeight="600" fill="#6b7684">
          {hour}시
        </text>
      ))}
    </svg>
  )
}


const MEALS = [
  { name: '한식 집밥', time: '오후 12:10', kcal: 520, protein: 28, fat: 14, carb: 68 },
  { name: '바나나', time: '오전 09:20', kcal: 90, protein: 1, fat: 0, carb: 23 },
]

const RHYTHM_TILES = [
  { label: '회복', value: '80', unit: '점', color: '#2F80ED' },
  { label: '피로', value: '52', unit: '점', color: '#FB8C00' },
  { label: '심장', value: '72', unit: '회/분', color: '#E53935' },
  { label: '산소', value: '97', unit: '%', color: '#1E88E5' },
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
  stress: '실시간 측정',
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

function linePath(values: number[], w: number, h: number) {
  const min = Math.min(...values)
  const max = Math.max(...values)
  const span = Math.max(1, max - min)
  return values
    .map((v, i) => {
      const x = (i / (values.length - 1)) * w
      const y = h - ((v - min) / span) * (h - 8) - 4
      return `${i === 0 ? 'M' : 'L'} ${x.toFixed(1)} ${y.toFixed(1)}`
    })
    .join(' ')
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

function MinMax({ min, max }: { min: string; max: string }) {
  return (
    <div className="elder-sleep-card ms-stats two">
      <div>
        <em>최저</em>
        <b>{min}</b>
      </div>
      <div>
        <em>최고</em>
        <b>{max}</b>
      </div>
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

/** 상세 화면 '최근 측정 기록': 오늘 기록 중 최신 3건 + 더 보기(전체 기록) */
function MeasureLogCard({ metric, date, onMore }: { metric: LiveMetricId; date: Date; onMore: () => void }) {
  const rows = dayLog(metric, date).slice(0, 3)
  const interval = autoIntervalFor(metric)
  return (
    <div className="elder-sleep-card ms-hist-card">
      <div className="ms-recent-head">
        <b>최근 측정 기록</b>
        <button type="button" className="ms-more" onClick={onMore}>
          더 보기
        </button>
      </div>
      {metric !== 'stress' ? <em className="ms-head-sub ms-log-note">자동 측정 {interval}분마다 · 실시간 측정은 직접 잰 값</em> : null}
      <ul className="ms-log-list">
        {rows.map((row) => (
          <li key={row.id}>
            <button type="button" className="ms-log-row" onClick={onMore}>
              <strong>{formatLogValue(metric, row.value)}</strong>
              <i className={row.mode}>{row.mode === 'auto' ? '자동 측정' : '실시간 측정'}</i>
              <em>{row.time.slice(0, 5)}</em>
            </button>
          </li>
        ))}
        {rows.length === 0 ? <li className="ms-log-empty">아직 측정 기록이 없어요</li> : null}
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

/** 실제 측정·업로드를 마친 뒤 홈에서 포인트를 받도록 안내 */
function DoneBanner({ kind, text }: { kind: MeasureKind; text: string }) {
  const navigate = useNavigate()
  const session = useSession()
  if (!isMeasureDone(session, kind)) return null
  return (
    <div className="ms-done-banner">
      <CheckCircle size={20} weight="fill" />
      <span>{text}</span>
      <button type="button" onClick={() => navigate('/vitaling/home')}>
        지급 받기
      </button>
    </div>
  )
}

function HrBody({
  busy,
  onMeasure,
  onHistory,
  date,
}: {
  busy: boolean
  onMeasure: () => void
  onHistory: () => void
  date: Date
}) {
  const series = [62, 64, 68, 71, 74, 88, 92, 86, 78, 70, 66, 64, 61, 63, 68, 72, 70, 67, 64, 61, 59, 58, 60, 63]
  const path = linePath(series, 280, 88)

  return (
    <>
      <div className="elder-sleep-card ms-chart-card ms-hr-card">
        <div className="ms-live-head">
          <Heartbeat size={22} weight="fill" color="#E53935" />
          <div>
            <em>현재 심박수</em>
            <strong>
              68<small>bpm</small>
            </strong>
          </div>
          <span className="elder-menu-tag ok">일상생활</span>
        </div>
        <svg className="ms-line tall" viewBox="0 0 280 88" aria-hidden>
          <path d={`${path} L 280 88 L 0 88 Z`} fill="rgba(229,57,53,.12)" />
          <path d={path} fill="none" stroke="#E53935" strokeWidth="2.2" />
        </svg>
        <div className="ms-hr-zone">
          <div>
            <em>휴식</em>
            <em>일상</em>
            <em>운동</em>
          </div>
          <i>
            <b style={{ left: '42%' }} />
          </i>
          <span>지금은 일상생활 구간이에요</span>
        </div>
      </div>
      <MinMax min="58" max="92" />
      <div className="elder-sleep-card">
        <MeasureNow label="심박수 다시 재기" busy={busy} onClick={onMeasure} />
      </div>
      <MeasureLogCard metric="hr" date={date} onMore={onHistory} />
    </>
  )
}

function HrvBody({
  busy,
  onMeasure,
  onHistory,
  date,
}: {
  busy: boolean
  onMeasure: () => void
  onHistory: () => void
  date: Date
}) {
  const week = [
    { d: '월', v: 40 },
    { d: '화', v: 38 },
    { d: '수', v: 42 },
    { d: '목', v: 36 },
    { d: '금', v: 34 },
    { d: '토', v: 35 },
    { d: '일', v: 32 },
  ]

  return (
    <>
      <div className="elder-sleep-card ms-hrv-hero">
        <Waveform size={26} weight="fill" color="#8E24AA" />
        <em>오늘 심박변이도</em>
        <strong>
          32<small>ms</small>
        </strong>
        <span className="elder-menu-tag low">평균 이하</span>
        <p>회복이 조금 부족해요. 오늘은 무리하지 않는 편이 좋아요.</p>
      </div>
      <div className="elder-sleep-card">
        <b className="ms-block-title">최근 7일</b>
        <div className="ms-hrv-bars" aria-hidden>
          {week.map((d) => (
            <i key={d.d} style={{ height: `${(d.v / 48) * 100}%` }}>
              <em>{d.d}</em>
            </i>
          ))}
        </div>
      </div>
      <div className="ms-split-2">
        <div className="elder-sleep-card">
          <em>7일 평균</em>
          <b>38ms</b>
        </div>
        <div className="elder-sleep-card">
          <em>지난주보다</em>
          <b>-6ms</b>
        </div>
      </div>
      <div className="elder-sleep-card">
        <MeasureNow label="심박변이도 다시 재기" busy={busy} onClick={onMeasure} />
      </div>
      <MeasureLogCard metric="hrv" date={date} onMore={onHistory} />
    </>
  )
}

function Spo2Body({
  busy,
  onMeasure,
  onHistory,
  date,
}: {
  busy: boolean
  onMeasure: () => void
  onHistory: () => void
  date: Date
}) {
  const night = [
    { t: '22:40', v: '96%' },
    { t: '02:10', v: '97%' },
    { t: '05:20', v: '98%' },
  ]

  return (
    <>
      <div className="elder-sleep-card ms-spo2-hero">
        <Wind size={26} weight="fill" color="#1E88E5" />
        <div className="ms-spo2-gauge" aria-hidden />
        <strong>
          97<small>%</small>
        </strong>
        <span className="elder-menu-tag ok">정상</span>
        <p>정상 범위는 95–100%예요.</p>
      </div>
      <div className="elder-sleep-card">
        <b className="ms-block-title">지난밤 측정</b>
        <ul className="ms-hist-list">
          {night.map((row) => (
            <li key={row.t}>
              <div className="ms-hist-row">
                <span>
                  <b>{row.t}</b>
                  <em>수면 중 자동 측정</em>
                </span>
                <strong>{row.v}</strong>
              </div>
            </li>
          ))}
        </ul>
      </div>
      <div className="elder-sleep-card">
        <MeasureNow label="혈중 산소 다시 재기" busy={busy} onClick={onMeasure} />
      </div>
      <MeasureLogCard metric="spo2" date={date} onMore={onHistory} />
    </>
  )
}

function TempBody({
  busy,
  onMeasure,
  onHistory,
  date,
}: {
  busy: boolean
  onMeasure: () => void
  onHistory: () => void
  date: Date
}) {
  return (
    <>
      <div className="elder-sleep-card ms-temp-hero">
        <em>현재 피부 온도</em>
        <strong>
          36.4<small>°C</small>
        </strong>
        <span className="elder-menu-tag ok">정상</span>
        <p>내 기준 36.3°C보다 0.1°C 높아요.</p>
      </div>
      <MinMax min="35.8" max="36.9" />
      <div className="elder-sleep-card">
        <MeasureNow label="피부 온도 다시 재기" busy={busy} onClick={onMeasure} />
      </div>
      <MeasureLogCard metric="temp" date={date} onMore={onHistory} />
    </>
  )
}

function StressMetricBody({
  busy,
  onMeasure,
  onHistory,
  date,
  dayLabel = '오늘',
}: {
  busy: boolean
  onMeasure: () => void
  onHistory: () => void
  date: Date
  dayLabel?: string
}) {
  const session = useSession()
  const isToday = date.getFullYear() === todayStart().getFullYear()
    && date.getMonth() === todayStart().getMonth()
    && date.getDate() === todayStart().getDate()
  const measured = isToday && isMeasureDone(session, 'stress')
  const points = measured ? STRESS_DAY_POINTS : []
  const last = points[points.length - 1]
  if (!measured) {
    return (
      <>
        <div className="elder-sleep-card ms-stress-hero">
          <em>{dayLabel} 스트레스</em>
          <p className="ms-empty">{isToday ? '아직 측정 기록이 없어요. 편안히 앉아 측정해 보세요.' : '이 날은 측정 기록이 없어요.'}</p>
        </div>
        {isToday ? (
          <div className="elder-sleep-card">
            <MeasureNow label="스트레스 측정하기" busy={busy} onClick={onMeasure} />
          </div>
        ) : null}
        <MeasureLogCard metric="stress" date={date} onMore={onHistory} />
      </>
    )
  }
  return (
    <>
      <div className="elder-sleep-card ms-stress-hero">
        <em>{dayLabel} 스트레스</em>
        <strong>
          {last.v}<small>점</small>
        </strong>
        <span className="elder-menu-tag ok">낮음</span>
      </div>
      <div className="elder-sleep-card">
        <div className="ms-recent-head">
          <b>{dayLabel} 시간대별 측정</b>
          <em className="ms-head-sub">마지막 16:19</em>
        </div>
        <DayDotChart points={points} color="#00A48A" yMin={0} yMax={100} unit="점" />
        <div className="ms-stat-row">
          <div><em>최저</em><strong>{Math.min(...points.map((p) => p.v))}</strong></div>
          <div><em>평균</em><strong>{Math.round(points.reduce((a, b) => a + b.v, 0) / points.length)}</strong></div>
          <div><em>최고</em><strong>{Math.max(...points.map((p) => p.v))}</strong></div>
        </div>
      </div>
      <div className="elder-sleep-card">
        <b className="ms-block-title">스트레스 구간</b>
        <div className="ms-zones">
          {LIVE_ZONES.stress.map((z) => (
            <div key={z.t}>
              <i style={{ background: z.c, width: `${Math.max(8, z.p)}%` }} />
              <em>{z.t}</em>
              <b>{z.p}%</b>
            </div>
          ))}
        </div>
      </div>
      <div className="elder-sleep-card">
        <MeasureNow label="스트레스 측정하기" busy={busy} onClick={onMeasure} />
        <DoneBanner kind="stress" text="스트레스 측정 완료!" />
      </div>
      <MeasureLogCard metric="stress" date={date} onMore={onHistory} />
    </>
  )
}

function LiveBody({
  onHistory,
  initialMetric,
  dayLabel,
  date,
  autoStart = false,
}: {
  onHistory: () => void
  initialMetric?: (typeof LIVE_METRICS)[number]['id']
  dayLabel?: string
  date: Date
  /** 홈의 측정하기에서 들어오면 상세에서 바로 측정을 시작 */
  autoStart?: boolean
}) {
  const [busy, setBusy] = useState(false)
  const started = useRef(false)
  const onMeasure = () => {
    setBusy(true)
    window.setTimeout(() => {
      setBusy(false)
      // 스트레스 측정이 실제로 끝났을 때만 완료 처리
      if (!initialMetric || initialMetric === 'stress') markMeasureDone('stress')
    }, 900)
  }
  useEffect(() => {
    if (!autoStart || started.current) return
    if (initialMetric && initialMetric !== 'stress') return
    if (isMeasureDone(getSession(), 'stress')) return
    started.current = true
    onMeasure()
  }, [autoStart, initialMetric])
  const props = { busy, onMeasure, onHistory, date }

  if (initialMetric === 'hr') return <HrBody {...props} />
  if (initialMetric === 'hrv') return <HrvBody {...props} />
  if (initialMetric === 'spo2') return <Spo2Body {...props} />
  if (initialMetric === 'temp') return <TempBody {...props} />
  return <StressMetricBody {...props} dayLabel={dayLabel} />
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

function DietBody({ period, autoStart = false }: { period: Period; autoStart?: boolean }) {
  const session = useSession()
  const photo = todayDietPhoto(session)
  const photoTime = new Date().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })
  const fileRef = useRef<HTMLInputElement>(null)
  const started = useRef(false)
  useEffect(() => {
    // 홈의 "식단 사진 올리기"로 들어오면 사진 선택창을 바로 연다
    if (!autoStart || started.current) return
    if (isMeasureDone(getSession(), 'diet')) return
    started.current = true
    const input = fileRef.current
    input?.scrollIntoView({ block: 'center' })
    input?.click()
  }, [autoStart])

  return (
    <>
      <div className="elder-sleep-card">
        <div className="ms-kcal-bar">
          <i aria-hidden>
            <b style={{ width: period === 'month' ? '18%' : '28%' }} />
          </i>
          <div>
            <em>520kcal</em>
            <span>2,300kcal</span>
          </div>
        </div>
        <div className="ms-macro-rings">
          <div>
            <i className="ring protein" />
            <em>단백질</em>
            <b>28g / 80g</b>
          </div>
          <div>
            <i className="ring fat" />
            <em>지방</em>
            <b>14g / 55g</b>
          </div>
          <div>
            <i className="ring carb" />
            <em>탄수화물</em>
            <b>68g / 251g</b>
          </div>
        </div>
      </div>

      <div className="elder-sleep-card ms-hist-card">
        <div className="ms-recent-head">
          <b>식단 기록</b>
        </div>
        <ul className="ms-diet-rows">
          {photo ? (
            <li>
              <span className="thumb photo" aria-hidden>
                <img src={photo} alt="" />
              </span>
              <span>
                <b>오늘 올린 식단 사진</b>
                <em>AI 분석 결과는 잠시 후 표시돼요</em>
              </span>
              <strong>{photoTime}</strong>
            </li>
          ) : null}
          {MEALS.map((m) => (
            <li key={m.name}>
              <span className="thumb" aria-hidden>
                <ForkKnife size={20} weight="bold" />
              </span>
              <span>
                <b>{m.name}</b>
                <em>{m.kcal}kcal · 단백질 {m.protein}g · 지방 {m.fat}g · 탄수 {m.carb}g</em>
              </span>
              <strong>{m.time}</strong>
            </li>
          ))}
        </ul>
        <label className="ms-plus">
          <Plus size={22} weight="bold" />
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            hidden
            onChange={(e) => {
              const file = e.target.files?.[0]
              if (!file) return
              // 사진 업로드가 실제로 됐을 때 저장 + 완료 처리
              shrinkImage(file)
                .then((dataUrl) => saveDietPhoto(dataUrl))
                .catch(() => saveDietPhoto(''))
                .finally(() => markMeasureDone('diet'))
            }}
          />
        </label>
        <DoneBanner kind="diet" text="식단 사진 업로드 완료!" />
      </div>

      {period === 'month' ? (
        <div className="elder-sleep-card">
          <b className="ms-block-title">월간 영양 분석</b>
          <i className="ms-nutri-bar" aria-hidden />
          <ul className="ms-nutri-leg">
            <li><i className="protein" />단백질 28g (25%)</li>
            <li><i className="fat" />지방 14g (13%)</li>
            <li><i className="carb" />탄수화물 68g (62%)</li>
          </ul>
        </div>
      ) : null}
    </>
  )
}

function WalkBody({ period, autoStart = false }: { period: Period; autoStart?: boolean }) {
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
  const bars = [12, 8, 4, 0, 0, 0, 6, 18, 32, 28, 40, 55, 48, 36, 44, 52, 38, 30, 22, 16, 10, 8, 4, 2]

  return (
    <>
      <div className="ms-act-hero">
        <em>총 걸음수</em>
        <strong>8,412<small>걸음</small></strong>
        <span>{period === 'day' ? '1시간에 평균 350걸음 걸었어요' : '하루 평균 6,650걸음 걸었어요'}</span>
      </div>

      <div className="elder-sleep-card">
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
        <div className="ms-hour-bars" aria-hidden>
          {(mode === 'hour' ? bars : bars.map((_, i) => bars.slice(0, i + 1).reduce((a, b) => a + b, 0) / 8)).map((v, i) => (
            <i key={i} style={{ height: `${Math.max(6, Math.min(100, v))}%` }} />
          ))}
        </div>
      </div>

      <div className="elder-sleep-card">
        <MeasureNow label="오늘 걸음 불러오기" busy={busy} onClick={onSync} />
        <DoneBanner kind="walk" text="오늘 걸음 불러오기 완료!" />
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
        <div className="screen with-nav elder-home">
          <Header
            title={pageTitle}
            backTo="/vitaling/home"
            right={
              <>
                <button type="button" className="icon-btn" aria-label="내보내기">
                  <Export size={22} weight="regular" />
                </button>
                <MetricInfoButton metric={kind === 'stress' ? liveMetric : (kind as MeasureKind)} tone="plain" />
              </>
            }
          />

          <DateBar
            period={withPeriod ? period : 'day'}
            date={date}
            onDate={setDate}
            onPeriod={withPeriod ? setPeriod : undefined}
          />

          <div className="scroll elder-body">
            {kind === 'health' ? <HealthBody /> : null}
            {kind === 'stress' ? (
              <LiveBody
                onHistory={() => navigate(historyTo)}
                initialMetric={liveMetric}
                dayLabel={dayLabelOf(date)}
                date={date}
                autoStart={params.get('run') === '1' && liveMetric === 'stress'}
              />
            ) : null}
            {kind === 'diet' ? <DietBody period={period} autoStart={params.get('run') === '1'} /> : null}
            {kind === 'walk' ? <WalkBody period={period} autoStart={params.get('run') === '1'} /> : null}
            {kind === 'health' ? (
              <RecentCard title="최근 기록" rows={RECENT.health} onMore={() => navigate(historyTo)} />
            ) : null}
          </div>

          <BottomNav active="service" />
        </div>
      </Phone>
    </div>
  )
}

export { DateBar, type Period }
