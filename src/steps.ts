/** 오늘 시간대별 걸음 (0시~23시, 고정 샘플 — 합계 8,412걸음, 16시 이후는 아직 없음). 홈 걷기 카드 막대와 걷기 상세 그래프가 같이 쓴다 */
export const STEPS_BY_HOUR: readonly number[] = [0, 0, 0, 0, 0, 0, 180, 640, 1_120, 520, 380, 760, 1_340, 410, 560, 1_210, 1_292, 0, 0, 0, 0, 0, 0, 0]

/** 하루 걸음 수 (목업): 오늘은 시간대별 합계(8,412), 지난 날은 날짜로 정해지는 3,500~11,000, 아직 오지 않은 날은 0.
 *  걷기 상세의 이번 주·이번 달 그래프가 쓴다 */
export function stepsOnDay(date: Date) {
  const now = new Date()
  const d0 = new Date(date.getFullYear(), date.getMonth(), date.getDate())
  const t0 = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  if (d0.getTime() > t0.getTime()) return 0
  if (d0.getTime() === t0.getTime()) return STEPS_BY_HOUR.reduce((a, b) => a + b, 0)
  const seed = Math.round(d0.getTime() / 86_400_000)
  // 날짜마다 고르게 흩어지는 값 (정수 해시) — 규칙적으로 오르내리지 않게
  const h = (Math.imul(seed ^ 0x5bd1e995, 2_654_435_761) >>> 0) % 7_500
  return 3_500 + h
}

/** 그날의 시간대별 걸음 (0~23시): 오늘은 STEPS_BY_HOUR, 지난 날은 그날 합계(stepsOnDay)를 하루 흐름 모양대로 나눔, 아직 오지 않은 날은 0 */
const DAY_SHAPE = [0, 0, 0, 0, 0, 0, 2, 6, 9, 5, 4, 6, 10, 4, 5, 9, 10, 8, 6, 5, 3, 2, 1, 0]
export function stepsByHourOn(date: Date): number[] {
  const now = new Date()
  if (date.getFullYear() === now.getFullYear() && date.getMonth() === now.getMonth() && date.getDate() === now.getDate()) return [...STEPS_BY_HOUR]
  const total = stepsOnDay(date)
  if (total === 0) return Array(24).fill(0)
  const sum = DAY_SHAPE.reduce((a, b) => a + b, 0)
  const hours = DAY_SHAPE.map((w) => Math.round((total * w) / sum))
  hours[16] += total - hours.reduce((a, b) => a + b, 0) // 반올림 차이는 오후 한 칸에 몰아 합계를 맞춘다
  return hours
}
