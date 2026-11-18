/** 바디 리듬 반원 게이지 — 홈과 상세가 같은 그림을 쓴다 */
/** 홈 바디 리듬: 무지개 아크 (항목 평균과 동일 표현) */
export function ScoreArc({ score, size = 'md' }: { score: number; size?: 'md' | 'lg' }) {
  const r = 112
  const cx = 140
  const cy = 132
  const t = Math.min(100, Math.max(0, score)) / 100
  const angle = Math.PI - Math.PI * t
  const x = cx + r * Math.cos(angle)
  const y = cy - r * Math.sin(angle)
  const path = `M ${cx - r} ${cy} A ${r} ${r} 0 0 1 ${cx + r} ${cy}`

  return (
    <svg className={`elder-score-arc ${size}`} viewBox="0 0 280 158" aria-hidden>
      <defs>
        <linearGradient id="homeScoreArcGrad" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#E53935" />
          <stop offset="28%" stopColor="#FF9800" />
          <stop offset="52%" stopColor="#FFEB3B" />
          <stop offset="78%" stopColor="#66BB6A" />
          <stop offset="100%" stopColor="#42A5F5" />
        </linearGradient>
      </defs>
      <path d={path} fill="none" stroke="#eee" strokeWidth="16" strokeLinecap="round" />
      <path d={path} fill="none" stroke="url(#homeScoreArcGrad)" strokeWidth="16" strokeLinecap="round" />
      <circle cx={x} cy={y} r="10" fill="#fff" stroke="#ddd" strokeWidth="2" />
      <circle cx={x} cy={y} r="4.5" fill="#1a2332" />
    </svg>
  )
}

/** 게이지 그라데이션(빨강→주황→노랑→초록→파랑)에서 점수 위치의 색 */
const STOPS: [number, string][] = [[0, '#E53935'], [28, '#FF9800'], [52, '#FFEB3B'], [78, '#66BB6A'], [100, '#42A5F5']]
export function gaugeColor(score: number) {
  const t = Math.min(100, Math.max(0, score))
  let i = 0
  while (i < STOPS.length - 2 && t > STOPS[i + 1][0]) i++
  const [a, ca] = STOPS[i], [b, cb] = STOPS[i + 1]
  const k = (t - a) / (b - a)
  const hex = (c: string) => [1, 3, 5].map((j) => parseInt(c.slice(j, j + 2), 16))
  const [r1, g1, b1] = hex(ca), [r2, g2, b2] = hex(cb)
  const mix = (x: number, y: number) => Math.round(x + (y - x) * k).toString(16).padStart(2, '0')
  return `#${mix(r1, r2)}${mix(g1, g2)}${mix(b1, b2)}`
}
