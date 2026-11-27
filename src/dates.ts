/** 날짜 도우미 — 여러 화면이 같은 기준(현지 시각 자정)으로 날짜를 다루도록 한 곳에 둔다 */

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

/** 'YYYY-MM-DD' (세션 저장 키와 같은 모양) */
export function dateKey(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

/** 'HH:MM' → 자정부터 분 */
export function clockMinutes(t: string) {
  const [h, m] = t.split(':').map(Number)
  return h * 60 + m
}

export const WEEKDAYS = ['일', '월', '화', '수', '목', '금', '토'] as const
