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
  hr: { color: '#F96B6D', soft: '#FFEDED' },
  spo2: { color: '#2BCFDD', soft: '#E3FAFC' },
  temp: { color: '#FF8E50', soft: '#FFF1E8' },
  resp: { color: '#1CCE68', soft: '#E4FAEC' },
} as const
