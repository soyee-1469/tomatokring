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
