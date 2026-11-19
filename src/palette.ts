/** 메인 ↔ 상세 화면 공통 색상 */

export const SLEEP_COLORS = {
  line: '#5E35B1',
  soft: '#EDE7F6',
  stages: {
    // 보라 한 색의 농담 4단계 (브링과 같은 방식) — 한 카드에 색 하나
    deep: '#5E35B1',
    rem: '#9575CD',
    light: '#C4B0EA',
    awake: '#EDE7F6',
  },
} as const

export const SLEEP_STAGE_LIST = [
  { key: 'deep' as const, name: '깊은', nameFull: '깊은 수면', color: SLEEP_COLORS.stages.deep },
  { key: 'rem' as const, name: '렘', nameFull: '렘 수면', color: SLEEP_COLORS.stages.rem },
  { key: 'light' as const, name: '얕은', nameFull: '얕은 수면', color: SLEEP_COLORS.stages.light },
  { key: 'awake' as const, name: '깸', nameFull: '깬 상태', color: SLEEP_COLORS.stages.awake },
]

export const STRESS_COLORS = {
  line: '#00897B',
  soft: '#E0F2F1',
} as const

export const ACTIVITY_COLORS = {
  accent: '#1E88E5',
  soft: '#E3F2FD',
  states: {
    sleep: '#90CAF9',
    active: '#EF5350',
    charge: '#66BB6A',
    off: '#BDBDBD',
    rest: '#FFEB3B',
    unknown: '#E0E0E0',
  },
} as const

export const ACTIVITY_LEGEND = [
  { c: ACTIVITY_COLORS.states.sleep, t: '수면중' },
  { c: ACTIVITY_COLORS.states.active, t: '활동중' },
  { c: ACTIVITY_COLORS.states.charge, t: '충전중' },
  { c: ACTIVITY_COLORS.states.off, t: '미착용' },
  { c: ACTIVITY_COLORS.states.rest, t: '휴식중' },
  { c: ACTIVITY_COLORS.states.unknown, t: '알수없음' },
] as const

export const VITAL_COLORS = {
  hr: { color: '#E53935', soft: '#FFE8E6' },
  spo2: { color: '#1E88E5', soft: '#E3F2FD' },
  temp: { color: '#7E57C2', soft: '#F3E5F5' },
  resp: { color: '#43A047', soft: '#E8F5E9' },
} as const

/** 메인·상세 공통 정상 범위 문구 */
export const VITAL_NORMAL: Record<'hr' | 'spo2' | 'temp' | 'resp', string> = {
  hr: '정상 60–100',
  spo2: '정상 95–100',
  temp: '정상 36.0–36.8',
  resp: '정상 12–20',
}

/** 홈 카드 색 — 기존 메신저 보상 내역 칩 색 기준, CSS :root 토큰과 동일 값 */
export const HOME_COLORS = {
  tomato: '#CD313E',
  orange: '#FF6B4A',
  lemon: '#E0A800',
  leaf: '#50B83D',
  berry: '#2F80ED',
  beet: '#8B5CF6',
  pink: '#E85BB0',
} as const

/** 홈 카드 색의 연한 배경 (아이콘 칩용) — CSS --c-*-soft 와 동일 값 */
export const HOME_SOFT = {
  tomato: '#FFF0F1',
  orange: '#FFEFEA',
  lemon: '#FFF7D9',
  leaf: '#F8FFE7',
  berry: '#E8EFFF',
  beet: '#F6EEFF',
  pink: '#FFF2FC',
} as const
