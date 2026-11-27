import { METRIC_STYLE } from './metricStyle'

/** 바디 리듬 점수·등급의 단일 소스. 홈과 상세가 같은 날 같은 값을 쓴다. */

export function startOfDay(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate())
}
export function addDays(d: Date, n: number) {
  const x = startOfDay(d)
  x.setDate(x.getDate() + n)
  return x
}
export function sameDay(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate()
}
/** 날짜 → 안정적인 샘플 시드 (같은 날은 항상 같은 값) */
export function daySeed(d: Date) {
  return Math.round(startOfDay(d).getTime() / 86_400_000)
}

export type Tone = 'ok' | 'warn' | 'bad'

export type DayMetric = {
  id: string
  label: string
  score: number
  tone: Tone
  status: string
  color: string
  soft: string
  icon: string
  to: string
}


export function dayBundle(date: Date) {
  const seed = daySeed(date)
  const dayIndex = seed % 7
  const wobble = (base: number, i: number) =>
    Math.max(40, Math.min(98, Math.round(base + ((seed * 7 + i * 13) % 17) - 8)))

  const metrics: DayMetric[] = [
    {
      id: 'hr',
      label: '심박수',
      score: wobble(88, 0),
      tone: 'ok',
      status: '정상',
      color: METRIC_STYLE.hr.color,
      soft: METRIC_STYLE.hr.soft,
      icon: 'heart-pulse',
      to: '/vitaling/measure/stress?m=hr',
    },
    {
      id: 'spo2',
      label: '혈중 산소',
      score: wobble(92, 1),
      tone: 'ok',
      status: '정상',
      color: METRIC_STYLE.spo2.color,
      soft: METRIC_STYLE.spo2.soft,
      icon: 'drop',
      to: '/vitaling/measure/stress?m=spo2',
    },
    {
      id: 'temp',
      label: '피부 온도',
      score: wobble(86, 2),
      tone: 'ok',
      status: '정상',
      color: METRIC_STYLE.temp.color,
      soft: METRIC_STYLE.temp.soft,
      icon: 'temp-hot',
      to: '/vitaling/measure/stress?m=temp',
    },
    {
      id: 'sleep',
      label: '수면',
      score: wobble(80, 4),
      tone: dayIndex === 2 ? 'warn' : 'ok',
      status: dayIndex === 2 ? '주의' : '좋음',
      color: METRIC_STYLE.sleep.color,
      soft: METRIC_STYLE.sleep.soft,
      icon: 'moon',
      to: '/vitaling/sleep',
    },
    {
      id: 'stress',
      label: '스트레스',
      score: wobble(78, 5),
      tone: 'ok',
      status: '안정',
      color: METRIC_STYLE.stress.color,
      soft: METRIC_STYLE.stress.soft,
      icon: 'brain',
      to: '/vitaling/stress',
    },
    {
      id: 'activity',
      label: '활동',
      score: wobble(72, 6),
      tone: dayIndex <= 1 ? 'warn' : 'ok',
      status: dayIndex <= 1 ? '보통' : '좋음',
      color: METRIC_STYLE.walk.color,
      soft: METRIC_STYLE.walk.soft,
      icon: 'walk',
      to: '/vitaling/activity',
    },
  ].map((m) => ({
    ...m,
    tone: (m.score >= 80 ? 'ok' : m.score >= 60 ? 'warn' : 'bad') as Tone,
    status: m.score >= 80 ? m.status : m.score >= 60 ? (m.id === 'stress' ? '주의' : '보통') : '위험',
  }))

  const score = Math.round(metrics.reduce((a, m) => a + m.score, 0) / metrics.length)
  const prev = Math.round(score + ((dayIndex % 3) - 1) * 4)
  return { score, prev, metrics }
}



/** 지난 7일(어제부터 7일 전까지) 중 기록이 있는 날의 바디 리듬 평균. 기록이 하루도 없으면 null.
 *  홈 '오늘의 상태'와 바디 리듬 상세가 같은 값을 쓴다 (2026-11-27: 28일 → 7일, 기록 없는 날 제외) */
export function recentAvg7(date: Date, hasRecord: (d: Date) => boolean): number | null {
  const scores = Array.from({ length: 7 }, (_, i) => addDays(date, -(i + 1))).filter(hasRecord).map((d) => dayBundle(d).score)
  return scores.length ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : null
}

/** 5단계 등급 (나쁨 0–34 · 주의 35–49 · 보통 50–74 · 좋음 75–89 · 최상 90–100) — 홈·상세 공통 */
export const GRADE_BANDS = [
  // 파스텔 무지개 (2026-11-27): 산호 → 살구 → 노랑 → 연두 → 하늘. 칸 사이는 그라데이션으로 이어 그린다
  { label: '나쁨', from: 0, to: 35, color: '#EE8C84', tone: 'bad' as const },
  { label: '주의', from: 35, to: 50, color: '#F2AE6B', tone: 'warn' as const },
  { label: '보통', from: 50, to: 75, color: '#EECB55', tone: 'warn' as const },
  { label: '좋음', from: 75, to: 90, color: '#93CF7F', tone: 'ok' as const },
  { label: '최상', from: 90, to: 101, color: '#78B4EE', tone: 'ok' as const },
] as const
export function gradeOf(score: number) {
  return GRADE_BANDS.find((b) => score >= b.from && score < b.to) ?? GRADE_BANDS[0]
}
/** 등급 문구 — 해석·조언 없이 사실만 (2026-11-27: 근거 없는 문장 금지). 받침에 맞춘 조사 */
export const GRADE_COPY: Record<(typeof GRADE_BANDS)[number]['label'], { short: string; headline: string; headlinePast: string }> = {
  최상: { short: '최상', headline: "오늘 바디 리듬은 '최상'이에요.", headlinePast: "이 날 바디 리듬은 '최상'이었어요." },
  좋음: { short: '좋음', headline: "오늘 바디 리듬은 '좋음'이에요.", headlinePast: "이 날 바디 리듬은 '좋음'이었어요." },
  보통: { short: '보통', headline: "오늘 바디 리듬은 '보통'이에요.", headlinePast: "이 날 바디 리듬은 '보통'이었어요." },
  주의: { short: '주의', headline: "오늘 바디 리듬은 '주의'예요.", headlinePast: "이 날 바디 리듬은 '주의'였어요." },
  나쁨: { short: '나쁨', headline: "오늘 바디 리듬은 '나쁨'이에요.", headlinePast: "이 날 바디 리듬은 '나쁨'이었어요." },
}
