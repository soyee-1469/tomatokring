const KEY = 'vitaling-session-v1'

export type MeasureKind = 'health' | 'stress' | 'diet' | 'walk' | 'sleep' | 'survey'

export type DoneMeasures = Partial<Record<MeasureKind, boolean>>
/** 자동 측정 모드: 표준 / 배터리 절약 / 심층 분석 (브링 앱의 자동 측정 모드와 동일 구성) */
export type AutoMeasureMode = 'standard' | 'saver' | 'deep'
export type AutoMeasureKind = 'hr' | 'spo2'
/** 항목별 완료/수령 날짜 키 (일 단위 항목은 YYYY-MM-DD, 설문은 YYYY-MM) */
export type DateKeys = Partial<Record<MeasureKind, string>>
/** 내 정보 (브링 프로필 중 계산에 쓰는 값만) */
export type HealthProfile = { sex: 'female' | 'male' | null; birth: string; height: number | null; weight: number | null }
/** 목표 (브링 목표 설정 구조) — 시간 값은 분 단위 */
export type HealthGoals = { steps: number; kcalBurn: number; distance: number; sleepMinutes: number; bedtime: number; kcalIntake: number }
export const DEFAULT_GOALS: HealthGoals = { steps: 6000, kcalBurn: 300, distance: 3, sleepMinutes: 480, bedtime: 22 * 60, kcalIntake: 2300 }
/** 홈에서 순서를 바꿀 수 있는 카드 */
/** 이상 징후 상태 — 브링 API 판정값. 목업에서는 샘플 토글로 바꿔 본다 */
export type SignalState = 'collecting' | 'normal' | 'detected'
export type ConditionAnswer = 'good' | 'so-so' | 'bad'
/** 배터리 시연값 — null이면 실제(샘플) 값, 'none'은 반지에서 못 읽은 상태, 'charging'은 충전 중 */
export type BatteryDemo = number | 'none' | 'charging' | null

export type HomeCardKind = Exclude<MeasureKind, 'health'>
export const DEFAULT_CARD_ORDER: readonly HomeCardKind[] = ['stress', 'diet', 'walk', 'sleep', 'survey']

export type VitalingSession = {
  onboarded: boolean
  phone: string
  paired: boolean
  serial: string | null
  /** 브링 앱 고유번호 — 토마톡 링 데이터 연동 키 (예: ABC-012345) */
  vitalId: string | null
  /** 오늘 측정 완료 여부 — 처음 진입 시에는 보상 대신 측정하기 */
  measuredToday: boolean
  doneMeasures: DoneMeasures
  /** 오늘 홈/상세에서 추가로 직접 잰 스트레스 값들 (날짜 키 → [{time:'HH:MM:SS', value}]) */
  stressExtra: Record<string, { time: string; value: number }[]>
  /** 실제 측정/업로드/확인을 마친 날짜 — 00:00 지나면 자동으로 초기화된 것으로 취급 */
  doneDates: DateKeys
  /** 포인트를 수령한 날짜 — 화면을 다시 열어도 유지 */
  claimedDates: DateKeys
  /** 오늘 올린 식단 사진 (축소한 data URL)과 올린 날짜 키 */
  dietPhoto: string | null
  dietPhotoDate: string | null
  /** 지표별 자동 측정 모드 */
  autoMeasure: Record<AutoMeasureKind, AutoMeasureMode>
  /** 홈 카드 순서 (사용자가 편집) */
  cardOrder: HomeCardKind[]
  healthProfile: HealthProfile
  healthGoals: HealthGoals
  /** 바디 리듬 계산에 인정된 날 (YYYY-MM-DD). 하루 2개 이상 유효 데이터 + 수면 기록이 있는 날. 7일 쌓여야 점수 표시 */
  validDays: string[]
  /** 이상 징후 샘플 상태 (목업 전용) */
  signalDemo: SignalState
  /** 컨디션 체크 응답 (날짜 키 → 답) */
  conditionChecks: Record<string, ConditionAnswer>
  batteryDemo: BatteryDemo
}

const defaultSession: VitalingSession = {
  onboarded: false,
  phone: '',
  paired: false,
  serial: null,
  vitalId: null,
  measuredToday: false,
  doneMeasures: {},
  stressExtra: {},
  doneDates: {},
  claimedDates: {},
  dietPhoto: null,
  dietPhotoDate: null,
  autoMeasure: { hr: 'standard', spo2: 'standard' },
  cardOrder: [...DEFAULT_CARD_ORDER],
  healthProfile: { sex: null, birth: '', height: null, weight: null },
  healthGoals: { ...DEFAULT_GOALS },
  validDays: [],
  signalDemo: 'collecting',
  conditionChecks: {},
  batteryDemo: null,
}

function pad2(n: number) {
  return String(n).padStart(2, '0')
}

/** 항목의 리셋 주기 키. 일 단위 항목은 오늘 날짜, 설문은 이번 달 */
export function periodKey(kind: MeasureKind, now = new Date()) {
  const ym = `${now.getFullYear()}-${pad2(now.getMonth() + 1)}`
  return kind === 'survey' ? ym : `${ym}-${pad2(now.getDate())}`
}

/** 저장된 순서에 빠진 카드는 뒤에, 모르는 값은 버림 */
export function normalizeCardOrder(order: unknown): HomeCardKind[] {
  const saved = Array.isArray(order) ? (order.filter((k): k is HomeCardKind => (DEFAULT_CARD_ORDER as readonly string[]).includes(k as string)) as HomeCardKind[]) : []
  const seen = new Set<HomeCardKind>()
  const out: HomeCardKind[] = []
  for (const k of [...saved, ...DEFAULT_CARD_ORDER]) {
    if (!seen.has(k)) { seen.add(k); out.push(k) }
  }
  return out
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
        stressExtra: parsed.stressExtra ?? {},
        cardOrder: normalizeCardOrder(parsed.cardOrder),
        healthProfile: { ...defaultSession.healthProfile, ...parsed.healthProfile },
        healthGoals: { ...defaultSession.healthGoals, ...parsed.healthGoals },
        validDays: Array.isArray(parsed.validDays) ? parsed.validDays.filter((v): v is string => typeof v === 'string') : [],
        signalDemo: parsed.signalDemo ?? 'collecting',
        conditionChecks: parsed.conditionChecks ?? {},
        batteryDemo: parsed.batteryDemo ?? null,
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
  // 수면 기록이 들어온 날은 (반지를 끼고 있어 자동 바이탈이 있으므로) 유효한 하루로 인정
  const today = periodKey('sleep')
  const validDays = kind === 'sleep' && !cur.validDays.includes(today) ? [...cur.validDays, today] : cur.validDays
  write({
    ...cur,
    measuredToday: kind === 'health' ? true : cur.measuredToday,
    doneMeasures: { ...cur.doneMeasures, [kind]: true },
    doneDates: { ...cur.doneDates, [kind]: periodKey(kind) },
    validDays,
  })
}

/** 스트레스 재측정: 오늘 기록에 값 하나 추가 (첫 측정이면 완료 처리까지) */
export function addStressReading(value: number) {
  const cur = read()
  const key = periodKey('stress')
  const now = new Date()
  const time = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:00`
  const list = [...(cur.stressExtra[key] ?? []), { time, value }]
  write({
    ...cur,
    doneMeasures: { ...cur.doneMeasures, stress: true },
    doneDates: { ...cur.doneDates, stress: key },
    stressExtra: { ...cur.stressExtra, [key]: list },
  })
}

export const RHYTHM_MIN_DAYS = 7
/** 바디 리듬 계산에 쓸 수 있는 유효한 날 수 (복원 가능 범위 73일 안) */
export function validDayCount(session: VitalingSession) {
  const now = new Date()
  const from = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 72)
  const fromKey = periodKey('sleep', from)
  return session.validDays.filter((d) => d >= fromKey).length
}
/** 시연용: 유효한 날을 n일로 맞춤 (어제부터 거꾸로). 목업 전용 */
export function setDemoValidDays(n: number) {
  const cur = read()
  const days: string[] = []
  for (let i = 1; i <= n; i++) {
    const d = new Date()
    d.setDate(d.getDate() - i)
    days.push(periodKey('sleep', d))
  }
  write({ ...cur, validDays: days })
}

/** 데이터 복원: 서버 기록이 들어온 기간을 유효한 날로 채움 */
export function restoreValidDays(fromKey: string, toKey: string) {
  const cur = read()
  const days: string[] = []
  const d = new Date(Number(fromKey.slice(0, 4)), Number(fromKey.slice(5, 7)) - 1, Number(fromKey.slice(8, 10)))
  for (let i = 0; i < 120; i++) {
    const k = periodKey('sleep', d)
    if (k > toKey) break
    days.push(k)
    d.setDate(d.getDate() + 1)
  }
  write({ ...cur, validDays: Array.from(new Set([...cur.validDays, ...days])).sort() })
}

/** 이번 주기(오늘/이번 달)에 실제로 측정·확인을 마쳤는지 */
export function isMeasureDone(session: VitalingSession, kind: MeasureKind) {
  return session.doneDates?.[kind] === periodKey(kind)
}

export function markClaimed(kind: MeasureKind) {
  const cur = read()
  write({ ...cur, claimedDates: { ...cur.claimedDates, [kind]: periodKey(kind) } })
}

export function setHealthProfile(profile: HealthProfile) {
  write({ ...read(), healthProfile: profile })
}
export function setHealthGoals(goals: HealthGoals) {
  write({ ...read(), healthGoals: goals })
}

export function setCardOrder(order: readonly HomeCardKind[]) {
  write({ ...read(), cardOrder: normalizeCardOrder(order) })
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

export function setBatteryDemo(v: BatteryDemo) {
  write({ ...read(), batteryDemo: v })
}
export function setSignalDemo(state: SignalState) {
  write({ ...read(), signalDemo: state })
}
/** 오늘 컨디션 체크 답 저장 (null이면 지움) */
export function setConditionCheck(answer: ConditionAnswer | null) {
  const cur = read()
  const next = { ...cur.conditionChecks }
  const key = periodKey('stress')
  if (answer) next[key] = answer
  else delete next[key]
  write({ ...cur, conditionChecks: next })
}
export function todayCondition(session: VitalingSession): ConditionAnswer | null {
  return session.conditionChecks?.[periodKey('stress')] ?? null
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
