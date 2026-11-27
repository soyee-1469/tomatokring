/** 메인 ↔ 상세 화면 공통 색상 */

export const SLEEP_COLORS = {
  line: '#8A4DF5',
  soft: '#F1EAFE',
  stages: {
    // 보라 한 색의 농담 4단계 (브링과 같은 방식) — 한 카드에 색 하나. 2026-11-19 레퍼런스 보라(#9F66F4) 기준으로 밝게
    deep: '#7E3FF2',
    rem: '#A47BF7',
    light: '#CDB6FB',
    awake: '#E3D6FD', // 흰 바탕 하이프노그램에서 띠가 보일 만큼만 (더 연하면 사라짐)
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
  hr: { color: '#EE8C84', soft: '#FDEEEC' },
  spo2: { color: '#6CC4D2', soft: '#E8F7F9' },
  temp: { color: '#F2AE6B', soft: '#FDF3E8' },
  resp: { color: '#1CCE68', soft: '#E4FAEC' },
} as const

/** 메인·상세 공통 정상 범위 문구 */
export const VITAL_NORMAL: Record<'hr' | 'spo2' | 'temp' | 'resp', string> = {
  hr: '정상 60–100',
  spo2: '정상 95–100',
  temp: '정상 36.0–36.8',
  resp: '정상 12–20',
}

/** 홈 그래프 색 — 2026-11-19 레퍼런스에서 추출한 캔디 팔레트, CSS :root --c-* 토큰과 동일 값. tomato는 브랜드색(로고·위험)에만 */
export const HOME_COLORS = {
  tomato: '#CD313E',
  coral: '#F96B6D',
  orange: '#FF8E50',
  lemon: '#FCCA14',
  leaf: '#1CCE68',
  berry: '#568EE4',
  teal: '#2BCFDD',
  beet: '#9F66F4',
  pink: '#E07DE5',
} as const

/** 홈 카드 색의 연한 배경 (아이콘 칩용) — CSS --c-*-soft 와 동일 값 */
export const HOME_SOFT = {
  tomato: '#FFF0F1',
  coral: '#FFEDED',
  orange: '#FFF1E8',
  lemon: '#FFF8D9',
  leaf: '#E4FAEC',
  berry: '#EAF1FC',
  teal: '#E3FAFC',
  beet: '#F1EAFE',
  pink: '#FBEEFC',
} as const
