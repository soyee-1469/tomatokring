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



/** 5단계 등급 (나쁨 0–34 · 주의 35–49 · 보통 50–74 · 좋음 75–89 · 최상 90–100) — 홈·상세 공통 */
export const GRADE_BANDS = [
  { label: '나쁨', from: 0, to: 35, color: '#E4605A', tone: 'bad' as const },
  { label: '주의', from: 35, to: 50, color: '#F2994A', tone: 'warn' as const },
  { label: '보통', from: 50, to: 75, color: '#E9C34A', tone: 'warn' as const },
  { label: '좋음', from: 75, to: 90, color: '#50B83D', tone: 'ok' as const },
  { label: '최상', from: 90, to: 101, color: '#2F80ED', tone: 'ok' as const },
] as const
export function gradeOf(score: number) {
  return GRADE_BANDS.find((b) => score >= b.from && score < b.to) ?? GRADE_BANDS[0]
}
/** 등급별 한 줄 해석 (홈 게이지 안 문구와 상세 헤드라인이 같은 톤) */
export const GRADE_COPY: Record<(typeof GRADE_BANDS)[number]['label'], { short: string; headline: string; headlinePast: string; advice: string }> = {
  최상: { short: '최상이에요', headline: '몸과 마음이 아주 가뿐한 상태예요.', headlinePast: '몸과 마음이 아주 가뿐한 날이었어요.', advice: '미뤄 둔 일을 하기 좋은 날이에요.' },
  좋음: { short: '괜찮아요', headline: '몸과 마음이 가뿐한 상태예요.', headlinePast: '몸과 마음이 가뿐한 날이었어요.', advice: '쌓인 일들을 차근차근 정리해 보세요.' },
  보통: { short: '보통이에요', headline: '조금 쉬어가도 괜찮은 날이에요.', headlinePast: '조금 쉬어가도 괜찮은 날이었어요.', advice: '무리한 일정은 내일로 미루고 물을 자주 마셔 보세요.' },
  주의: { short: '주의가 필요해요', headline: '몸이 쉬고 싶다고 말하고 있어요.', headlinePast: '몸이 지쳐 있던 날이었어요.', advice: '오늘은 가볍게만 움직이고 일찍 쉬어 주세요.' },
  나쁨: { short: '조금 살펴보세요', headline: '오늘은 몸을 돌봐야 하는 날이에요.', headlinePast: '몸이 많이 지쳐 있던 날이었어요.', advice: '충분히 쉬고, 불편한 증상이 있으면 의료 전문가와 상담해 주세요.' },
}
