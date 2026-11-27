import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { Ri } from '../components/Ri'
import { addDays, clockMinutes, sameDay, startOfDay, WEEKDAYS } from '../dates'
import { DateLine } from '../components/DateLine'
import { TrendBars } from '../components/TrendBars'
import { dayLog, formatLogValue, type LiveMetricId, type LogRow } from '../measureLog'
import { useSession } from '../useSession'
import { ClaimBanner } from '../components/ClaimBanner'
import { PointTip } from '../components/PointGuide'
import { useScrub } from '../components/useScrub'
import { METRIC_STYLE } from '../metricStyle'

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
    color: METRIC_STYLE.hr.color, trendMin: 50, trendMax: 100,
    label: '심박수', unit: 'bpm', digits: 0, normal: [60, 100], yMin: 40, yMax: 120, zoneUnit: '분',
    zones: [
      { label: '일상생활', color: '#50B83D', test: (v) => v < 96 },
      { label: '가벼운 활동', color: '#A8D45A', test: (v) => v >= 96 && v < 112 },
      { label: '유산소', color: '#E9C34A', test: (v) => v >= 112 && v < 128 },
      { label: '무산소', color: '#F2994A', test: (v) => v >= 128 && v < 144 },
      { label: '최대 심박', color: '#E4605A', test: (v) => v >= 144 },
    ],
  },
  spo2: { color: METRIC_STYLE.spo2.color, trendMax: 100, trendMin: 90, label: '혈중 산소', unit: '%', digits: 0, normal: [95, 100], yMin: 94, yMax: 100, zoneUnit: '%', zones: [
    { label: '보통', color: '#50B83D', test: (v) => v >= 95 }, { label: '약간 낮음', color: '#F2994A', test: (v) => v >= 90 && v < 95 }, { label: '낮음', color: '#E4605A', test: (v) => v < 90 } ] },
  temp: { color: METRIC_STYLE.temp.color, trendMin: 35, trendMax: 38, label: '피부 온도', unit: '°C', digits: 1, normal: [36.0, 37.0], yMin: 36.0, yMax: 37.0, zoneUnit: '분', zones: [
    { label: '정상', color: '#50B83D', test: (v) => v >= 36.0 && v < 37.0 }, { label: '약간 높음', color: '#F2994A', test: (v) => v >= 37.0 && v < 37.5 }, { label: '고온', color: '#E4605A', test: (v) => v >= 37.5 }, { label: '약간 낮음', color: '#9DBBE8', test: (v) => v >= 35.5 && v < 36.0 }, { label: '저온', color: '#2F80ED', test: (v) => v < 35.5 } ] },
  hrv: { color: METRIC_STYLE.hrv.color, trendMin: 0, trendMax: 80, label: '심박변이도', unit: 'ms', digits: 0, normal: [40, 60], yMin: 30, yMax: 50, zoneUnit: '%', zones: [
    { label: '평균', color: '#50B83D', test: (v) => v >= 40 && v < 50 }, { label: '평균 이상', color: '#9DBBE8', test: (v) => v >= 50 && v < 60 }, { label: '높음', color: '#2F80ED', test: (v) => v >= 60 }, { label: '평균 이하', color: '#F2994A', test: (v) => v < 40 } ] },
  stress: { color: METRIC_STYLE.stress.color, trendMax: 100, label: '스트레스', unit: '점', digits: 0, normal: [0, 40], yMin: 0, yMax: 100, zoneUnit: '%', zones: [
    { label: '매우 낮음', color: '#50B83D', test: (v) => v < 21 }, { label: '낮음', color: '#A8D45A', test: (v) => v >= 21 && v < 41 }, { label: '보통', color: '#E9C34A', test: (v) => v >= 41 && v < 61 }, { label: '높음', color: '#F2994A', test: (v) => v >= 61 && v < 81 }, { label: '매우 높음', color: '#E4605A', test: (v) => v >= 81 } ] },
}
const fmt = (v: number, d: number) => v.toFixed(d)

/** 오늘 값을 사실로만 두 줄: ① 정상 범위(또는 구간) 안인지 ② 지난 7일 평균과 차이. 해석·조언은 넣지 않는다 (2026-11-27) */
function interpret(metric: LiveMetricId, today: number, usual: number | null, isToday: boolean) {
  const s = SPEC[metric]
  const [lo, hi] = s.normal
  const u = s.unit
  const f = (v: number) => fmt(v, s.digits)
  const be = isToday ? '이에요' : '이었어요'
  let head: string
  let tone: 'ok' | 'warn' = 'ok'
  if (metric === 'stress') {
    // 스트레스는 구간 이름으로 (매우 낮음 0–20 · 낮음 21–40 · 보통 41–60 · 높음 61–80 · 매우 높음 81–100)
    const z = s.zones.find((zz) => zz.test(today))
    const ranges: Record<string, string> = { '매우 낮음': '0–20점', '낮음': '21–40점', '보통': '41–60점', '높음': '61–80점', '매우 높음': '81–100점' }
    head = `'${z?.label ?? '-'}' 구간(${ranges[z?.label ?? ''] ?? ''})${be}.`
    tone = today > 60 ? 'warn' : 'ok'
  } else if (today < lo) {
    head = `정상 범위(${f(lo)}–${f(hi)}${u})보다 낮${isToday ? '아요' : '았어요'}.`
    tone = 'warn'
  } else if (today > hi) {
    head = `정상 범위(${f(lo)}–${f(hi)}${u})보다 높${isToday ? '아요' : '았어요'}.`
    tone = 'warn'
  } else {
    head = `정상 범위(${f(lo)}–${f(hi)}${u}) 안${be}.`
  }
  const tol = metric === 'temp' ? 0.1 : 1
  let tip: string
  if (usual === null) tip = '지난 7일 기록이 없어 평균과 비교할 수 없어요.'
  else {
    const d = today - usual
    tip = Math.abs(d) < tol
      ? `지난 7일 평균과 같아요(${f(usual)}${u}).`
      : `지난 7일 평균 ${f(usual)}${u}보다 ${f(Math.abs(d))}${u} ${d > 0 ? '높' : '낮'}${isToday ? '아요' : '았어요'}.`
  }
  return { head, tip, tone }
}

/** 하루 그래프: 시간대별 평균을 막대로, 정상 범위는 연한 띠 */
function DayBars({ metric, rows }: { metric: LiveMetricId; rows: LogRow[] }) {
  const s = SPEC[metric]
  // 모든 항목 공통: 시간대별 최저~최고를 연한 띠로, 평균은 작은 점으로 (가로 스크롤 없이 하루 전체)
  const W = 320, H = 150, padL = 46, padR = 14, padT = 14, padB = 26
  const x = (h: number) => padL + ((W - padL - padR) * h) / 24
  const vs = rows.map((r) => r.value)
  const span = vs.length ? Math.max(...vs) - Math.min(...vs) : 0
  const pad = Math.max(span * 0.6, (s.yMax - s.yMin) * 0.12)
  const lo = vs.length ? Math.max(s.yMin, Math.floor(Math.min(...vs) - pad)) : s.yMin
  const hi = vs.length ? Math.min(s.yMax, Math.ceil(Math.max(...vs) + pad)) : s.yMax
  const y = (v: number) => padT + (H - padT - padB) * (1 - (Math.min(hi, Math.max(lo, v)) - lo) / Math.max(1, hi - lo))
  const hourly = useMemo(() => {
    const m = new Map<number, number[]>()
    rows.forEach((r) => { const h = Math.floor(clockMinutes(r.time) / 60); m.set(h, [...(m.get(h) ?? []), r.value]) })
    return [...m.entries()].sort((a, b) => a[0] - b[0]).map(([h, vs]) => ({ h, mean: vs.reduce((a, b) => a + b, 0) / vs.length, min: Math.min(...vs), max: Math.max(...vs) }))
  }, [rows])
  const mean = rows.length ? rows.reduce((a, r) => a + r.value, 0) / rows.length : null
  const fmtY = (t: number) => (s.digits ? t.toFixed(1) : String(t))
  const bandW = 6
  const cx = (h: number) => x(h + 0.5)
  // 누른 위치에서 가장 가까운 시간대 (기록 있는 시간대만) — 세로 점선 + 말풍선
  const scrub = useScrub<HTMLDivElement>()
  const at = scrub.pos === null ? null : scrub.pos * W
  const pick = at === null || !hourly.length ? null : hourly.reduce((best, p) => (Math.abs(cx(p.h) - at) < Math.abs(cx(best.h) - at) ? p : best))
  const tipAt = pick ? (cx(pick.h) / W) * 100 : 0
  return (
    <div className="chart-scrub" ref={scrub.ref}>
    {pick && (
      <div className="chart-tip" style={{ left: `${tipAt}%`, transform: `translateX(-${tipAt}%)` }}>
        <em>{pick.h}시</em>
        <b>{pick.max > pick.min && '평균 '}{fmt(pick.mean, s.digits)}{s.unit}</b>
        {pick.max > pick.min && <span>{fmt(pick.min, s.digits)}–{fmt(pick.max, s.digits)}</span>}
      </div>
    )}
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
      {pick && <line x1={cx(pick.h)} x2={cx(pick.h)} y1={padT} y2={H - padB} className="scrubline" />}
      {/* 시간대별 최저~최고 띠 */}
      {hourly.map((p) => {
        const top = y(p.max), bot = y(p.min)
        if (bot - top < 2) return null
        return <rect key={`r${p.h}`} x={cx(p.h) - bandW / 2} y={top} width={bandW} height={bot - top} rx={bandW / 2} className="rangeband" />
      })}
      {/* 평균 점을 얇은 선으로 연결 */}
      {hourly.length > 1 && (
        <path d={hourly.map((p, i) => `${i === 0 ? 'M' : 'L'} ${cx(p.h)} ${y(p.mean)}`).join(' ')} className="mline" />
      )}
      {/* 시간대별 평균 점 (마지막만 조금 크게) */}
      {hourly.map((p, i) => {
        const last = i === hourly.length - 1
        return <circle key={p.h} cx={cx(p.h)} cy={y(p.mean)} r={last ? 4 : 2.8} className={last ? 'mdot last' : 'mdot'} />
      })}
      {['0', '6', '12', '18', '24'].map((h) => (
        <text key={h} x={x(Number(h))} y={H - 7} className="xlab" textAnchor={h === '0' ? 'start' : h === '24' ? 'end' : 'middle'}>{h}시</text>
      ))}
      {pick && <circle cx={cx(pick.h)} cy={y(pick.mean)} r={5} className="mdot scrubdot" />}
    </svg>
    </div>
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
    const days = Array.from({ length: 7 }, (_, i) => addDays(date, i - 6))
    return {
      values: days.map((d) => { const rs = dayLog(metric, d); return rs.length ? rs.reduce((a, r) => a + r.value, 0) / rs.length : 0 }),
      labels: days.map((d, i) => (i === 6 && isToday ? '오늘' : WEEKDAYS[d.getDay()])),
    }
  }, [metric, date, isToday, session.autoMeasure, session.doneDates])
  const month = useMemo(() => {
    // 선택한 날로 끝나는 4주: 주별 하루 평균의 평균 (기록 없는 날 제외)
    const weeks = [3, 2, 1, 0].map((w) => {
      const days = Array.from({ length: 7 }, (_, i) => addDays(date, -(w * 7) - (6 - i)))
      const means = days.map((d) => { const rs = dayLog(metric, d); return rs.length ? rs.reduce((a, r) => a + r.value, 0) / rs.length : null }).filter((m): m is number => m !== null)
      return means.length ? means.reduce((a, b) => a + b, 0) / means.length : 0
    })
    return { values: weeks, labels: ['3주 전', '2주 전', '지난주', isToday ? '이번 주' : '해당 주'] }
  }, [metric, date, isToday, session.autoMeasure, session.doneDates])
  const zoneCounts = s.zones.map((z) => vals.filter(z.test).length)
  const zoneTotal = zoneCounts.reduce((a, b) => a + b, 0)
  const manual = rows.find((r) => r.mode === 'manual')

  return (
    <>

      {/* 2) 한 줄 해석 + 오늘 값 */}
      <DateLine date={date} today={today} onDate={onDate} />
      {/* 포인트가 걸린 항목(스트레스)만: 맨 위에 받는 조건 */}
      {metric === 'stress' && <PointTip kind="stress" />}

      <section className={`v2-hero v2-m-${metric}`}>
        {/* 1행: 항목 아이콘 + 큰 숫자, 2행: 해석 + 조언 */}
        <div className="v2-top">
          <span className="v2-say-ico"><Ri name={{ hr: 'heart-pulse', spo2: 'drop', temp: 'temp-hot', hrv: 'pulse', stress: 'brain' }[metric]} size={22} /></span>
          {has ? (
            <div className="v2-val">
              <strong>{fmt(isToday ? latest : mean, s.digits)}<small>{s.unit}</small></strong>
              <span className="v2-val-sub">
                {isToday ? `${rows[0].time.slice(0, 5)} 측정` : `${date.getMonth() + 1}월 ${date.getDate()}일 하루 평균`}
                {usual !== null && ` · 평소 ${fmt(usual, s.digits)}${s.unit}`}
              </span>
            </div>
          ) : (
            <div className="v2-val"><strong>--<small>{s.unit}</small></strong><span className="v2-val-sub">기록 없음</span></div>
          )}
        </div>
        <div className="v2-say">
          <div>
            <b>{say ? say.head : isToday ? '아직 오늘 기록이 없어요.' : '이 날은 기록이 없어요.'}</b>
            <p>{say ? say.tip : metric === 'stress' ? '편안히 앉아 1분이면 돼요. 바로 아래 버튼으로 재 보세요.' : '반지를 끼고 있으면 자동으로 재요. 지금 바로 잴 수도 있어요.'}</p>
          </div>
        </div>
      </section>

      {/* 기록이 없는 오늘: 숫자 바로 아래에 측정 버튼 하나만 (빈 그래프·빈 기록 목록보다 먼저) */}
      {isToday && !has && (
        <div className="v2-now-first">
          <button type="button" className="v2-now" disabled={busy} onClick={onMeasure}>
            {busy ? '측정 중…' : metric === 'stress' ? '스트레스 측정하기' : '지금 측정하기'}
          </button>
        </div>
      )}

      {/* 보상 칸은 오늘 기록(자동·직접)이 있을 때만 (기록 전엔 빈 흰 칸이 남지 않게). 정책: 하루 중 30점 이하 기록이 있으면 1일 1회 */}
      {metric === 'stress' && isToday && has && (
        <section className="v2-claim">
          <ClaimBanner kind="stress" done doneText="오늘 30점 이하 기록" eligible={vals.some((v) => v <= 30)} ineligibleText="아직 조건 전이에요. 편안히 앉아 직접 재 보세요." />
        </section>
      )}

      {/* 3) 하루 그래프 — 기록이 있을 때만 (빈 축만 있는 그래프는 고장난 차트처럼 보임) */}
      {has && (
        <section className="v2-card">
          <div className="v2-head"><b className="v2-label">하루 흐름</b><span className="v2-key">{metric === 'stress' ? '편안한 구간 0–40' : `정상 ${s.normal[0]}–${s.normal[1]}${s.unit}`}</span></div>
          <DayBars metric={metric} rows={rows} />
        </section>
      )}

      {/* 4) 오늘 기록 + 지금 측정하기 */}
      {/* 스트레스만 기간 비교: 최근 7일(하루 평균) + 최근 한 달(주 평균). 순간값 항목(심박수 등)은 하루 흐름까지만 */}
      {/* 기간 안에 기록이 하나도 없으면 카드 자체를 숨김 */}
      {metric === 'stress' && week.values.some((v) => v > 0) && (
        <section className="v2-card">
          <div className="v2-head"><b className="v2-label">최근 7일</b><span className="v2-key">하루 평균</span></div>
          <TrendBars values={week.values} labels={week.labels} color={s.color} yMax={s.trendMax} yMin={s.trendMin} digits={s.digits} />
        </section>
      )}
      {metric === 'stress' && month.values.some((v) => v > 0) && (
        <section className="v2-card">
          <div className="v2-head"><b className="v2-label">최근 한 달</b><span className="v2-key">주 평균</span></div>
          <TrendBars values={month.values} labels={month.labels} color={s.color} yMax={s.trendMax} yMin={s.trendMin} digits={s.digits} />
        </section>
      )}

      {/* 기록 목록·전체 보기는 기록이 있을 때만 (없는 기록의 전체 보기가 측정 버튼보다 먼저 오지 않게) */}
      {has && (
      <section className="v2-card">
        <div className="v2-head"><b className="v2-label">{isToday ? '오늘 기록' : '이 날 기록'}</b><button type="button" className="v2-more" onClick={onHistory}>전체 보기 <Ri name="arrow-right-s" size={16} /></button></div>
        <ul className="v2-log">
          {rows.slice(0, 3).map((r) => (
            <li key={r.id}><strong>{formatLogValue(metric, r.value).replace(' ', '')}</strong>{r.mode === 'manual' && <i>직접 측정</i>}<em>{r.time.slice(0, 5)}</em></li>
          ))}
        </ul>
        {isToday && (
          <button type="button" className="v2-now" disabled={busy} onClick={onMeasure}>
            {busy ? '측정 중…' : manual ? '다시 측정하기' : metric === 'stress' ? '스트레스 측정하기' : '지금 측정하기'}
          </button>
        )}
      </section>
      )}

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
          <button type="button" className="v2-link" onClick={() => navigate('/vitaling/day')}>바디 리듬에서 종합 점수 보기 <Ri name="arrow-right-s" size={16} /></button>
        </section>
      )}
    </>
  )
}
