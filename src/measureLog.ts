import { getSession, type AutoMeasureMode, type AutoMeasureKind } from './session'

export type LiveMetricId = 'hr' | 'hrv' | 'spo2' | 'temp' | 'stress'
export type LogMode = 'auto' | 'manual'
export type LogRow = { id: string; time: string; value: number; mode: LogMode }

/** 자동 측정 모드별 측정 주기(분) */
export const AUTO_INTERVAL_MIN: Record<AutoMeasureMode, number> = { standard: 10, saver: 30, deep: 5 }
export const AUTO_MODE_LABEL: Record<AutoMeasureMode, string> = { standard: '표준', saver: '배터리 절약', deep: '심층 분석' }

const BASE: Record<LiveMetricId, { base: number; spread: number; digits: number; unit: string; auto: AutoMeasureKind | null }> = {
  hr: { base: 74, spread: 10, digits: 0, unit: 'bpm', auto: 'hr' },
  hrv: { base: 40, spread: 7, digits: 0, unit: 'ms', auto: 'hr' },
  spo2: { base: 97, spread: 1.5, digits: 0, unit: '%', auto: 'spo2' },
  temp: { base: 36.5, spread: 0.3, digits: 1, unit: '°C', auto: 'hr' },
  stress: { base: 36, spread: 8, digits: 0, unit: '점', auto: null },
}

function noise(seed: number, i: number) {
  const x = Math.sin(seed * 9301 + i * 49297) * 233280
  return (x - Math.floor(x)) * 2 - 1
}
function pad2(n: number) {
  return String(n).padStart(2, '0')
}
function hhmmss(min: number, sec = 0) {
  return `${pad2(Math.floor(min / 60))}:${pad2(min % 60)}:${pad2(sec)}`
}
function isSameDay(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate()
}

/** 해당 지표의 자동 측정 주기(분). 스트레스는 자동 측정이 없어 1시간 간격 샘플 */
export function autoIntervalFor(metric: LiveMetricId) {
  const auto = BASE[metric].auto
  if (!auto) return 60
  return AUTO_INTERVAL_MIN[getSession().autoMeasure[auto]]
}

export function formatLogValue(metric: LiveMetricId, v: number) {
  const b = BASE[metric]
  return `${v.toFixed(b.digits)} ${b.unit}`
}

/**
 * 하루 측정 기록 (최신순). 자동 측정은 06:00부터 지금(오늘) 또는 22:00(지난 날짜)까지 주기마다,
 * 실시간(수동) 측정은 하루 3회 정도 초 단위 시각으로 섞여 들어감.
 */
export function dayLog(metric: LiveMetricId, date: Date): LogRow[] {
  const b = BASE[metric]
  const now = new Date()
  const today = isSameDay(date, now)
  const endMin = today ? now.getHours() * 60 + now.getMinutes() : 22 * 60
  const seed = date.getFullYear() * 400 + date.getMonth() * 31 + date.getDate() + metric.length * 7
  const step = autoIntervalFor(metric)
  const rows: LogRow[] = []
  let i = 0
  for (let m = 6 * 60; m <= endMin; m += step) {
    // 점심 전후로 살짝 높고 저녁엔 낮아지는 하루 곡선
    const curve = Math.sin(((m - 6 * 60) / (16 * 60)) * Math.PI) * b.spread * 0.6
    const v = b.base + curve + noise(seed, i) * b.spread
    rows.push({ id: `a-${m}`, time: hhmmss(m), value: Number(v.toFixed(b.digits)), mode: 'auto' })
    i += 1
  }
  const manualAt = [9 * 60 + 20, 13 * 60 + 5, 16 * 60 + 15].filter((m) => m <= endMin)
  manualAt.forEach((m, k) => {
    const v = b.base + noise(seed, 100 + k) * b.spread * 0.5
    rows.push({ id: `m-${m}`, time: hhmmss(m, 29 + k * 7), value: Number(v.toFixed(b.digits)), mode: 'manual' })
  })
  rows.sort((x, y) => (x.time < y.time ? 1 : -1))
  return rows
}
