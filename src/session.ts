const KEY = 'vitaling-session-v1'

export type MeasureKind = 'health' | 'stress' | 'diet' | 'walk' | 'sleep' | 'survey'

export type DoneMeasures = Partial<Record<MeasureKind, boolean>>
/** 자동 측정 모드: 표준 / 배터리 절약 / 심층 분석 (브링 앱의 자동 측정 모드와 동일 구성) */
export type AutoMeasureMode = 'standard' | 'saver' | 'deep'
export type AutoMeasureKind = 'hr' | 'spo2'
/** 항목별 완료/수령 날짜 키 (일 단위 항목은 YYYY-MM-DD, 설문은 YYYY-MM) */
export type DateKeys = Partial<Record<MeasureKind, string>>

export type VitalingSession = {
  onboarded: boolean
  phone: string
  paired: boolean
  serial: string | null
  /** 바이탈링 앱 연동 고유번호 (예: ABC-012345) */
  vitalId: string | null
  /** 오늘 측정 완료 여부 — 처음 진입 시에는 보상 대신 측정하기 */
  measuredToday: boolean
  doneMeasures: DoneMeasures
  /** 실제 측정/업로드/확인을 마친 날짜 — 00:00 지나면 자동으로 초기화된 것으로 취급 */
  doneDates: DateKeys
  /** 포인트를 수령한 날짜 — 화면을 다시 열어도 유지 */
  claimedDates: DateKeys
  /** 오늘 올린 식단 사진 (축소한 data URL)과 올린 날짜 키 */
  dietPhoto: string | null
  dietPhotoDate: string | null
  /** 지표별 자동 측정 모드 */
  autoMeasure: Record<AutoMeasureKind, AutoMeasureMode>
}

const defaultSession: VitalingSession = {
  onboarded: false,
  phone: '',
  paired: false,
  serial: null,
  vitalId: null,
  measuredToday: false,
  doneMeasures: {},
  doneDates: {},
  claimedDates: {},
  dietPhoto: null,
  dietPhotoDate: null,
  autoMeasure: { hr: 'standard', spo2: 'standard' },
}

function pad2(n: number) {
  return String(n).padStart(2, '0')
}

/** 항목의 리셋 주기 키. 일 단위 항목은 오늘 날짜, 설문은 이번 달 */
export function periodKey(kind: MeasureKind, now = new Date()) {
  const ym = `${now.getFullYear()}-${pad2(now.getMonth() + 1)}`
  return kind === 'survey' ? ym : `${ym}-${pad2(now.getDate())}`
}

let cache: VitalingSession | null = null
const listeners = new Set<() => void>()

function read(): VitalingSession {
  if (cache) return cache
  try {
    const raw = localStorage.getItem(KEY)
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<VitalingSession>
      cache = {
        ...defaultSession,
        ...parsed,
        doneMeasures: { ...defaultSession.doneMeasures, ...parsed.doneMeasures },
        doneDates: { ...defaultSession.doneDates, ...parsed.doneDates },
        claimedDates: { ...defaultSession.claimedDates, ...parsed.claimedDates },
        autoMeasure: { ...defaultSession.autoMeasure, ...parsed.autoMeasure },
      }
      return cache!
    }
  } catch {
    /* ignore */
  }
  cache = { ...defaultSession }
  return cache
}

function write(next: VitalingSession) {
  cache = next
  localStorage.setItem(KEY, JSON.stringify(next))
  listeners.forEach((l) => l())
}

export function getSession() {
  return read()
}

export function subscribeSession(listener: () => void) {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

export function saveVitalId(vitalId: string) {
  write({ ...read(), vitalId: vitalId.trim().toUpperCase() })
}

export function completeOnboarding(phone: string) {
  write({ ...read(), onboarded: true, phone })
}

export function pairRing(serial: string) {
  write({ ...read(), paired: true, serial })
}

export function unpairRing() {
  write({ ...read(), paired: false, serial: null })
}

export function markMeasuredToday() {
  write({ ...read(), measuredToday: true })
}

export function markMeasureDone(kind: MeasureKind) {
  const cur = read()
  write({
    ...cur,
    measuredToday: kind === 'health' ? true : cur.measuredToday,
    doneMeasures: { ...cur.doneMeasures, [kind]: true },
    doneDates: { ...cur.doneDates, [kind]: periodKey(kind) },
  })
}

/** 이번 주기(오늘/이번 달)에 실제로 측정·확인을 마쳤는지 */
export function isMeasureDone(session: VitalingSession, kind: MeasureKind) {
  return session.doneDates?.[kind] === periodKey(kind)
}

export function markClaimed(kind: MeasureKind) {
  const cur = read()
  write({ ...cur, claimedDates: { ...cur.claimedDates, [kind]: periodKey(kind) } })
}

export function setAutoMeasure(kind: AutoMeasureKind, mode: AutoMeasureMode) {
  const cur = read()
  write({ ...cur, autoMeasure: { ...cur.autoMeasure, [kind]: mode } })
}

/** 식단 사진 저장 (업로드 날짜와 함께) */
export function saveDietPhoto(dataUrl: string) {
  const cur = read()
  try {
    write({ ...cur, dietPhoto: dataUrl, dietPhotoDate: periodKey('diet') })
  } catch {
    // 저장 공간 초과 시 사진 없이 날짜만 기록
    write({ ...cur, dietPhoto: null, dietPhotoDate: periodKey('diet') })
  }
}

/** 오늘 올린 식단 사진 (어제 것은 보여 주지 않음) */
export function todayDietPhoto(session: VitalingSession) {
  return session.dietPhotoDate === periodKey('diet') ? session.dietPhoto : null
}

/** 이번 주기에 포인트를 이미 받았는지 */
export function isClaimed(session: VitalingSession, kind: MeasureKind) {
  return session.claimedDates?.[kind] === periodKey(kind)
}

export function clearMeasureDone(kind: MeasureKind) {
  const cur = read()
  const nextDone = { ...cur.doneMeasures }
  delete nextDone[kind]
  const nextDates = { ...cur.doneDates }
  delete nextDates[kind]
  const nextClaimed = { ...cur.claimedDates }
  delete nextClaimed[kind]
  write({
    ...cur,
    measuredToday: kind === 'health' ? false : cur.measuredToday,
    doneMeasures: nextDone,
    doneDates: nextDates,
    claimedDates: nextClaimed,
  })
}

export function resetSession() {
  write({ ...defaultSession })
}

/** e.g. VRing-A9C3004 → VRing-A9C3**** */
export function maskSerial(serial: string | null | undefined) {
  if (!serial) return ''
  if (serial.length <= 8) return `${serial.slice(0, 4)}****`
  return `${serial.slice(0, serial.length - 4)}****`
}
