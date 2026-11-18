import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { Ri } from '../components/Ri'
import { addDays, sameDay, startOfDay } from '../components/WeekStrip'
import { DateLine } from '../components/DateLine'
import { TrendBars } from '../components/TrendBars'
import { dayLog, formatLogValue, type LiveMetricId, type LogRow } from '../measureLog'
import { useSession } from '../useSession'
import { ClaimBanner } from '../components/ClaimBanner'

/**
 * 토마톡 링 식 바이탈 상세 (심박수부터 적용):
 * 1) 주간 7칸 스트립  2) 한 줄 해석 + 오늘 값  3) 하루 그래프  4) 오늘 기록 + 지금 측정하기  5) 자세히(접기): 최저/평균/최고 · 구간
 * 브링의 평균/범위/도넛 중심 6단 구성 대신 "해석 → 기록" 3단이 기본.
 */

type Spec = {
  label: string
  unit: string
  digits: number
  normal: [number, number]
  yMin: number
  yMax: number
  zones: { label: string; color: string; test: (v: number) => boolean }[]
  zoneUnit: '분' | '%'
  /** 최근 7일 선 색 (홈과 같은 항목 색) */
  color: string
  /** 최근 7일 위 눈금 (없으면 값 중 최대) */
  trendMax?: number
  trendMin?: number
}
const SPEC: Record<LiveMetricId, Spec> = {
  hr: {
    color: '#CD313E', trendMin: 50, trendMax: 100,
    label: '심박수', unit: 'bpm', digits: 0, normal: [60, 100], yMin: 40, yMax: 120, zoneUnit: '분',
    zones: [
      { label: '일상생활', color: '#50B83D', test: (v) => v < 96 },
      { label: '가벼운 활동', color: '#A8D45A', test: (v) => v >= 96 && v < 112 },
      { label: '유산소', color: '#E9C34A', test: (v) => v >= 112 && v < 128 },
      { label: '무산소', color: '#F2994A', test: (v) => v >= 128 && v < 144 },
      { label: '최대 심박', color: '#E4605A', test: (v) => v >= 144 },
    ],
  },
  spo2: { color: '#2F80ED', trendMax: 100, trendMin: 90, label: '혈중 산소', unit: '%', digits: 0, normal: [95, 100], yMin: 94, yMax: 100, zoneUnit: '%', zones: [
    { label: '보통', color: '#50B83D', test: (v) => v >= 95 }, { label: '약간 낮음', color: '#F2994A', test: (v) => v >= 90 && v < 95 }, { label: '낮음', color: '#E4605A', test: (v) => v < 90 } ] },
  temp: { color: '#FF6B4A', trendMin: 35, trendMax: 38, label: '피부 온도', unit: '°C', digits: 1, normal: [36.0, 37.0], yMin: 36.0, yMax: 37.0, zoneUnit: '분', zones: [
    { label: '정상', color: '#50B83D', test: (v) => v >= 36.0 && v < 37.0 }, { label: '약간 높음', color: '#F2994A', test: (v) => v >= 37.0 && v < 37.5 }, { label: '고온', color: '#E4605A', test: (v) => v >= 37.5 }, { label: '약간 낮음', color: '#9DBBE8', test: (v) => v >= 35.5 && v < 36.0 }, { label: '저온', color: '#2F80ED', test: (v) => v < 35.5 } ] },
  hrv: { color: '#8B5CF6', trendMin: 0, trendMax: 80, label: 'HRV 회복력', unit: 'ms', digits: 0, normal: [40, 60], yMin: 30, yMax: 50, zoneUnit: '%', zones: [
    { label: '평균', color: '#50B83D', test: (v) => v >= 40 && v < 50 }, { label: '평균 이상', color: '#9DBBE8', test: (v) => v >= 50 && v < 60 }, { label: '높음', color: '#2F80ED', test: (v) => v >= 60 }, { label: '평균 이하', color: '#F2994A', test: (v) => v < 40 } ] },
  stress: { color: '#8B5CF6', trendMax: 100, label: '스트레스', unit: '', digits: 0, normal: [0, 40], yMin: 0, yMax: 100, zoneUnit: '%', zones: [
    { label: '매우 낮음', color: '#50B83D', test: (v) => v < 21 }, { label: '낮음', color: '#A8D45A', test: (v) => v >= 21 && v < 41 }, { label: '보통', color: '#E9C34A', test: (v) => v >= 41 && v < 61 }, { label: '높음', color: '#F2994A', test: (v) => v >= 61 && v < 81 }, { label: '매우 높음', color: '#E4605A', test: (v) => v >= 81 } ] },
}

function minutesOf(t: string) { const [h, m] = t.split(':').map(Number); return h * 60 + m }
const fmt = (v: number, d: number) => v.toFixed(d)

/** 오늘 값을 평소(최근 7일 평균)와 정상 범위에 비춰 한 줄로 */
function interpret(metric: LiveMetricId, today: number, usual: number | null, isToday: boolean) {
  const s = SPEC[metric]
  const [lo, hi] = s.normal
  const diff = usual === null ? 0 : today - usual
  const tol = metric === 'temp' ? 0.2 : metric === 'spo2' ? 1 : 5
  if (metric === 'hr') {
    if (today > hi) return { head: isToday ? '오늘은 심장이 조금 빨리 뛰어요.' : '심장이 조금 빨리 뛴 날이었어요.', tip: '잠시 앉아서 숨을 고르고, 카페인은 줄여 보세요.', tone: 'warn' as const }
    if (today < lo) return { head: isToday ? '오늘은 심장이 천천히 뛰어요.' : '심장이 천천히 뛴 날이었어요.', tip: '어지럽거나 기운이 없으면 의료 전문가와 상담해 주세요.', tone: 'warn' as const }
    if (diff > tol) return { head: isToday ? '평소보다 조금 빨라요.' : '평소보다 조금 빨랐던 날이에요.', tip: '활동이 많았거나 긴장한 날일 수 있어요. 잠시 쉬어 가세요.', tone: 'ok' as const }
    if (diff < -tol) return { head: isToday ? '평소보다 느긋해요.' : '평소보다 느긋했던 날이에요.', tip: '편안한 하루예요. 이 흐름을 유지해 보세요.', tone: 'ok' as const }
    return { head: isToday ? '오늘 심장은 평소처럼 안정적이에요.' : '심장이 안정적이었던 날이에요.', tip: '좋은 상태예요. 물 한 잔 마시고 가볍게 움직여 보세요.', tone: 'ok' as const }
  }
  if (metric === 'spo2') {
    if (today < 90) return { head: isToday ? '혈중 산소가 낮게 나왔어요.' : '혈중 산소가 낮았던 날이에요.', tip: '잠시 뒤 다시 재 보고, 계속 낮으면 의료 전문가와 상담해 주세요.', tone: 'warn' as const }
    if (today < lo) return { head: isToday ? '혈중 산소가 조금 낮아요.' : '혈중 산소가 조금 낮았던 날이에요.', tip: '깊게 숨 쉬고 잠시 쉬어 보세요. 잘 때는 잠깐 낮아지기도 해요.', tone: 'warn' as const }
    return { head: isToday ? '혈중 산소가 충분해요.' : '혈중 산소가 충분했던 날이에요.', tip: '좋은 상태예요. 이대로 유지해 보세요.', tone: 'ok' as const }
  }
  if (metric === 'temp') {
    if (today >= 37.5) return { head: isToday ? '피부 온도가 높아요.' : '피부 온도가 높았던 날이에요.', tip: '몸이 뜨겁거나 으슬으슬하면 체온계로 확인해 주세요.', tone: 'warn' as const }
    if (today >= hi) return { head: isToday ? '피부 온도가 조금 높아요.' : '피부 온도가 조금 높았던 날이에요.', tip: '운동 직후나 더운 곳에서는 올라갈 수 있어요.', tone: 'warn' as const }
    if (today < 35.5) return { head: isToday ? '피부 온도가 낮아요.' : '피부 온도가 낮았던 날이에요.', tip: '손이 차가우면 낮게 나와요. 손을 따뜻하게 해 주세요.', tone: 'warn' as const }
    if (Math.abs(diff) > tol) return { head: diff > 0 ? '평소보다 조금 따뜻해요.' : '평소보다 조금 서늘해요.', tip: '큰 변화는 아니에요. 흐름을 지켜봐 주세요.', tone: 'ok' as const }
    return { head: isToday ? '피부 온도가 평소와 같아요.' : '피부 온도가 안정적이었던 날이에요.', tip: '좋은 상태예요.', tone: 'ok' as const }
  }
  if (metric === 'hrv') {
    if (today < lo) return { head: isToday ? '오늘은 회복이 조금 부족해요.' : '회복이 부족했던 날이에요.', tip: '무리하지 말고 오늘은 일찍 쉬어 주세요.', tone: 'warn' as const }
    if (diff > tol) return { head: isToday ? '평소보다 회복이 잘 됐어요.' : '회복이 잘 됐던 날이에요.', tip: '몸이 준비돼 있어요. 활동하기 좋은 날이에요.', tone: 'ok' as const }
    return { head: isToday ? '회복 상태가 평소와 비슷해요.' : '회복이 평소와 비슷했던 날이에요.', tip: '꾸준히 잘 자는 게 회복에 가장 좋아요.', tone: 'ok' as const }
  }
  // stress: 낮을수록 좋음
  if (today > 80) return { head: isToday ? '스트레스가 매우 높아요.' : '스트레스가 매우 높았던 날이에요.', tip: '하던 일을 잠시 멈추고 천천히 숨을 고르세요.', tone: 'warn' as const }
  if (today > 60) return { head: isToday ? '스트레스가 높은 편이에요.' : '스트레스가 높았던 날이에요.', tip: '10분만 걷거나 창밖을 보며 쉬어 보세요.', tone: 'warn' as const }
  if (today > 40) return { head: isToday ? '스트레스가 보통이에요.' : '스트레스가 보통이었던 날이에요.', tip: '물 한 잔 마시고 어깨를 풀어 보세요.', tone: 'ok' as const }
  return { head: isToday ? '오늘은 마음이 편안해요.' : '마음이 편안했던 날이에요.', tip: '좋은 상태예요. 이 흐름을 유지해 보세요.', tone: 'ok' as const }
}

/** 하루 그래프: 시간대별 평균을 막대로, 정상 범위는 연한 띠 */
function DayBars({ metric, rows }: { metric: LiveMetricId; rows: LogRow[] }) {
  const s = SPEC[metric]
  // 홈 카드 7일 그래프와 같은 틀: 왼쪽 눈금, 위아래 선, 평균 점선, 매끄러운 선, 빈 점 + 마지막 점만 채움
  const W = 320, H = 150, padL = 46, padR = 14, padT = 14, padB = 26
  const x = (h: number) => padL + ((W - padL - padR) * h) / 24
  // 축: 값 범위에 여유를 두되 규격 범위 안에서
  const vs = rows.map((r) => r.value)
  const span = vs.length ? Math.max(...vs) - Math.min(...vs) : 0
  const pad = Math.max(span * 0.6, (s.yMax - s.yMin) * 0.12)
  const lo = vs.length ? Math.max(s.yMin, Math.floor(Math.min(...vs) - pad)) : s.yMin
  const hi = vs.length ? Math.min(s.yMax, Math.ceil(Math.max(...vs) + pad)) : s.yMax
  const y = (v: number) => padT + (H - padT - padB) * (1 - (Math.min(hi, Math.max(lo, v)) - lo) / Math.max(1, hi - lo))
  const hourly = useMemo(() => {
    const m = new Map<number, number[]>()
    rows.forEach((r) => { const h = Math.floor(minutesOf(r.time) / 60); m.set(h, [...(m.get(h) ?? []), r.value]) })
    return [...m.entries()].sort((a, b) => a[0] - b[0]).map(([h, vs]) => ({ h, mean: vs.reduce((a, b) => a + b, 0) / vs.length, min: Math.min(...vs), max: Math.max(...vs) }))
  }, [rows])
  const mean = rows.length ? rows.reduce((a, r) => a + r.value, 0) / rows.length : null
  const fmtY = (t: number) => (s.digits ? t.toFixed(1) : String(t))
  const pts = hourly.map((p) => ({ x: x(p.h + 0.5), y: y(p.mean) }))
  let path = ''
  pts.forEach((p, i) => {
    if (i === 0) { path += `M ${p.x} ${p.y}`; return }
    const p0 = pts[i - 2] ?? pts[i - 1], p1 = pts[i - 1], p2 = p, p3 = pts[i + 1] ?? p
    path += ` C ${p1.x + (p2.x - p0.x) / 6} ${p1.y + (p2.y - p0.y) / 6}, ${p2.x - (p3.x - p1.x) / 6} ${p2.y - (p3.y - p1.y) / 6}, ${p2.x} ${p2.y}`
  })
  const bw = (W - padL - padR) / 24 - 3
  return (
    <svg className={`v2-chart v2-m-${metric}`} viewBox={`0 0 ${W} ${H}`} aria-hidden>
      <line x1={padL} x2={W - padR} y1={y(hi)} y2={y(hi)} className="grid" />
      <line x1={padL} x2={W - padR} y1={y(lo)} y2={y(lo)} className="grid" />
      <text x={padL - 8} y={y(hi) + 4} className="ylab" textAnchor="end">{fmtY(hi)}</text>
      <text x={padL - 8} y={y(lo) + 4} className="ylab" textAnchor="end">{fmtY(lo)}</text>
      {mean !== null && (
        <>
          <line x1={padL} x2={W - padR} y1={y(mean)} y2={y(mean)} className="avg" />
          <text x={padL - 8} y={y(mean) + 4} className="avglab" textAnchor="end">평균</text>
        </>
      )}
      {metric === 'stress'
        ? hourly.map((p, i) => (
            <rect key={p.h} x={x(p.h) + 1.5} y={y(p.mean)} width={bw} height={Math.max(3, y(s.yMin) - y(p.mean))} rx={bw / 2} className="bar" style={{ animationDelay: `${i * 28}ms` }} />
          ))
        : metric === 'hr' || metric === 'hrv'
        ? hourly.map((p, i) => {
            // 심박수·HRV: 시간대별 최소~최대 범위 막대 (한 시간 안에서도 오르내리므로)
            // 한 시간에 측정이 하나뿐이면 범위가 없으므로 막대 대신 점
            const top = y(p.max), bot = y(p.min)
            const single = bot - top < 2
            const cls = i === hourly.length - 1 ? 'range last' : 'range'
            if (single) return <circle key={p.h} cx={x(p.h) + 1.5 + bw / 2} cy={top} r={bw / 2} className={cls} />
            const hgt = Math.max(bw, bot - top)
            return <rect key={p.h} x={x(p.h) + 1.5} y={top - (hgt - (bot - top)) / 2} width={bw} height={hgt} rx={bw / 2} className={cls} />
          })
        : (
          <>
            {path && <path d={path} className="line" />}
            {/* 점은 선 위에만: 직접 잰 시간대는 빈 점, 마지막 시간대는 채운 점 */}
            {hourly.map((p, i) => {
              const last = i === hourly.length - 1
              const manualHere = rows.some((r) => r.mode === 'manual' && Math.floor(minutesOf(r.time) / 60) === p.h)
              if (!last && !manualHere) return null
              return <circle key={p.h} cx={pts[i].x} cy={pts[i].y} r={last ? 6.5 : 4.5} className={last ? 'dot last' : 'dot'} />
            })}
          </>
        )}
      {['0', '6', '12', '18', '24'].map((h) => (
        <text key={h} x={x(Number(h))} y={H - 7} className="xlab" textAnchor={h === '0' ? 'start' : h === '24' ? 'end' : 'middle'}>{h}시</text>
      ))}
    </svg>
  )
}

export function VitalDayBodyV2({
  metric, date, onDate, busy, onMeasure, onHistory,
}: { metric: LiveMetricId; date: Date; onDate: (d: Date) => void; busy: boolean; onMeasure: () => void; onHistory: () => void }) {
  const navigate = useNavigate()
  const session = useSession()
  const s = SPEC[metric]
  const today = useMemo(() => startOfDay(new Date()), [])
  const isToday = sameDay(date, today)
  const rows = useMemo(() => dayLog(metric, date), [metric, date, session.autoMeasure, session.doneDates])
  const vals = rows.map((r) => r.value)
  const has = vals.length > 0
  const mean = has ? vals.reduce((a, b) => a + b, 0) / vals.length : 0
  const latest = has ? rows[0].value : 0
  const usual = useMemo(() => {
    const arr = Array.from({ length: 7 }, (_, i) => dayLog(metric, addDays(date, -(i + 1)))).map((rs) => (rs.length ? rs.reduce((a, r) => a + r.value, 0) / rs.length : null)).filter((v): v is number => v !== null)
    return arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : null
  }, [metric, date])
  const say = has ? interpret(metric, isToday ? latest : mean, usual, isToday) : null
  const week = useMemo(() => {
    const WD = ['일', '월', '화', '수', '목', '금', '토']
    const days = Array.from({ length: 7 }, (_, i) => addDays(date, i - 6))
    return {
      values: days.map((d) => { const rs = dayLog(metric, d); return rs.length ? rs.reduce((a, r) => a + r.value, 0) / rs.length : 0 }),
      labels: days.map((d, i) => (i === 6 && isToday ? '오늘' : WD[d.getDay()])),
    }
  }, [metric, date, isToday, session.autoMeasure, session.doneDates])
  const zoneCounts = s.zones.map((z) => vals.filter(z.test).length)
  const zoneTotal = zoneCounts.reduce((a, b) => a + b, 0)
  const manual = rows.find((r) => r.mode === 'manual')

  return (
    <>

      {/* 2) 한 줄 해석 + 오늘 값 */}
      <DateLine date={date} today={today} onDate={onDate} />

      <section className={`v2-hero v2-m-${metric}`}>
        <div className="v2-say">
          <span className="v2-say-ico"><Ri name="chat-smile-3" fill size={20} /></span>
          <div>
            <b>{say ? say.head : isToday ? '아직 오늘 기록이 없어요.' : '이 날은 기록이 없어요.'}</b>
            <p>{say ? say.tip : metric === 'stress' ? '편안히 앉아 1분이면 돼요. 아래에서 바로 측정해 보세요.' : '반지를 끼고 있으면 자동으로 재요. 지금 바로 잴 수도 있어요.'}</p>
          </div>
        </div>
        {has && (
          <div className="v2-val">
            <strong>{fmt(isToday ? latest : mean, s.digits)}<small>{s.unit}</small></strong>
            <span className="v2-val-sub">
              {isToday ? `${rows[0].time.slice(0, 5)} 측정` : `${date.getMonth() + 1}월 ${date.getDate()}일 하루 평균`}
              {usual !== null && ` · 평소 ${fmt(usual, s.digits)}${s.unit}`}
            </span>
          </div>
        )}
      </section>

      {metric === 'stress' && isToday && (
        <section className="v2-claim">
          <ClaimBanner kind="stress" doneText="측정 완료" eligible={manual !== undefined && manual.value <= 30} ineligibleText="30점 이하일 때 지급돼요. 편안히 앉아 다시 측정해 보세요." />
        </section>
      )}

      {/* 3) 하루 그래프 */}
      <section className="v2-card">
        <div className="v2-head"><b className="v2-label">하루 흐름</b><span className="v2-key">{metric === 'stress' ? '편안한 구간 0–40' : `정상 ${s.normal[0]}–${s.normal[1]}${s.unit}`}</span></div>
        <DayBars metric={metric} rows={rows} />
      </section>

      {/* 4) 오늘 기록 + 지금 측정하기 */}
      {/* 최근 7일 — 홈 카드와 같은 선 그래프 (오늘은 지금까지 평균) */}
      <section className="v2-card">
        <div className="v2-head"><b className="v2-label">최근 7일</b><span className="v2-key">하루 평균{s.unit ? ` · ${s.unit}` : ''}</span></div>
        <TrendBars values={week.values} labels={week.labels} color={s.color} yMax={s.trendMax} yMin={s.trendMin} digits={s.digits} />
      </section>

      <section className="v2-card">
        <div className="v2-head"><b className="v2-label">{isToday ? '오늘 기록' : '이 날 기록'}</b><button type="button" className="v2-more" onClick={onHistory}>전체 보기 <Ri name="arrow-right-s" size={16} /></button></div>
        <ul className="v2-log">
          {rows.slice(0, 3).map((r) => (
            <li key={r.id}><strong>{formatLogValue(metric, r.value).replace(' ', '')}</strong>{r.mode === 'manual' && <i>직접 측정</i>}<em>{r.time.slice(0, 5)}</em></li>
          ))}
          {rows.length === 0 && <li className="v2-log-empty">기록이 없어요</li>}
        </ul>
        {isToday && (
          <button type="button" className="v2-now" disabled={busy} onClick={onMeasure}>
            {busy ? '측정 중…' : manual ? '다시 측정하기' : metric === 'stress' ? '스트레스 측정하기' : '지금 측정하기'}
          </button>
        )}
      </section>

      {/* 5) 최저·평균·최고 + 구간 — 항상 표시 */}
      {has && (
        <section className="v2-details open-always">
          <div className="v2-stat3">
            <div><em>최저</em><strong>{fmt(Math.min(...vals), s.digits)}</strong></div>
            <div><em>평균</em><strong>{fmt(mean, s.digits)}</strong></div>
            <div><em>최고</em><strong>{fmt(Math.max(...vals), s.digits)}</strong></div>
          </div>
          <div className="v2-zone">
            <b>{s.label} 구간</b>
            <div className="v2-zone-bar" aria-hidden>
              {s.zones.map((z, i) => zoneCounts[i] > 0 && <i key={z.label} style={{ width: `${(zoneCounts[i] / zoneTotal) * 100}%`, background: z.color }} />)}
            </div>
            <ul>
              {s.zones.map((z, i) => (
                <li key={z.label}><i style={{ background: z.color }} /><span>{z.label}</span><b>{s.zoneUnit === '%' ? `${zoneTotal ? Math.round((zoneCounts[i] / zoneTotal) * 100) : 0}%` : `${zoneCounts[i] * 10}분`}</b></li>
              ))}
            </ul>
          </div>
          <button type="button" className="v2-link" onClick={() => navigate('/vitaling/day')}>바디 리듬에서 종합 보기 <Ri name="arrow-right-s" size={16} /></button>
        </section>
      )}
    </>
  )
}
