/** 최근 7일 세로 막대 — 바디 리듬 7일 막대와 같은 틀, 항목 색 단색 (오늘만 진하게) */
export function TrendBars({
  values,
  labels,
  color,
  yMax,
  yMin = 0,
  digits = 0,
}: {
  values: readonly number[]
  labels: readonly string[]
  color: string
  yMax?: number
  yMin?: number
  digits?: number
}) {
  const w = 320, h = 170, padL = 44, padR = 8, top = 24, bottom = 136
  const n = values.length
  const nums = values.filter((v) => v > 0)
  const max = yMax ?? Math.max(1, ...nums)
  const slot = (w - padL - padR) / n
  const bw = 26
  const x = (i: number) => padL + slot * i + (slot - bw) / 2
  const y = (v: number) => bottom - ((Math.min(max, Math.max(yMin, v)) - yMin) / Math.max(1, max - yMin)) * (bottom - top)
  const avg = nums.length ? nums.reduce((a, b) => a + b, 0) / nums.length : 0
  const fmt = (v: number) => (digits ? v.toFixed(digits) : Math.round(v).toLocaleString('ko-KR'))
  const mid = (max + yMin) / 2
  return (
    <svg className="rd-bars" viewBox={`0 0 ${w} ${h}`} aria-hidden>
      {[yMin, mid, max].map((t) => (
        <g key={t}>
          <line x1={padL} x2={w - padR} y1={y(t)} y2={y(t)} stroke="#EEF0F2" strokeWidth="1.5" />
          <text x={padL - 8} y={y(t) + 4} textAnchor="end" fontSize="11" fontWeight="600" fill="#9aa3ad">{fmt(t)}</text>
        </g>
      ))}
      {nums.length > 0 && <line x1={padL} x2={w - padR} y1={y(avg)} y2={y(avg)} stroke="#1a2332" strokeOpacity="0.35" strokeWidth="1.5" strokeDasharray="4 4" />}
      {values.map((v, i) => {
        const last = i === n - 1
        if (v <= 0) {
          return (
            <g key={i}>
              <rect x={x(i)} y={bottom - 6} width={bw} height={6} rx={3} fill="#E8EBEE" />
              <text x={x(i) + bw / 2} y={h - 8} textAnchor="middle" fontSize="12" fontWeight={last ? '700' : '500'} fill={last ? '#1a2332' : '#9aa3ad'}>{labels[i]}</text>
            </g>
          )
        }
        return (
          <g key={i}>
            <rect x={x(i)} y={y(v)} width={bw} height={Math.max(4, bottom - y(v))} rx={bw / 2} fill={color} opacity={last ? 1 : 0.45} />
            <text x={x(i) + bw / 2} y={y(v) - 8} textAnchor="middle" fontSize="12" fontWeight="700" fill={last ? '#1a2332' : '#6b7684'}>{fmt(v)}</text>
            <text x={x(i) + bw / 2} y={h - 8} textAnchor="middle" fontSize="12" fontWeight={last ? '700' : '500'} fill={last ? '#1a2332' : '#9aa3ad'}>{labels[i]}</text>
          </g>
        )
      })}
    </svg>
  )
}
