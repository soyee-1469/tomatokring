/** 최근 7일 선 그래프 — 홈 카드와 바이탈 상세가 같은 그림을 쓴다 */
export function TrendLine({
  values,
  labels,
  color,
  todayEmpty = false,
  compact = false,
  yMax,
  yMin = 0,
  unit = '',
}: {
  values: readonly number[]
  labels: readonly string[]
  color: string
  /** (이전 막대 그래프 호환) 사용 안 함 */
  bubble?: string
  /** 오늘 측정 전: 마지막 점을 비움 */
  todayEmpty?: boolean
  /** 홈용: 눈금 숫자·평균 글자 없이 선과 점만 (값은 상세에서) */
  compact?: boolean
  /** 위 눈금 값 (없으면 값 중 최대) */
  yMax?: number
  /** 아래 눈금 값 (기본 0) — 혈중 산소처럼 범위가 좁은 항목용 */
  yMin?: number
  unit?: string
}) {
  // 매끄러운 선 + 점 (레퍼런스: 위/아래 눈금, 평균 점선, 마지막 점만 채움)
  const w = 320
  const h = 120
  // 왼쪽 눈금 글자 자리: '9,120걸음'까지 들어가고 그래프와 10px 띄움
  const padL = compact ? 14 : 62
  const padR = 14
  const top = 16
  const bottom = 92
  const n = values.length
  const shown = values.map((v, i) => (todayEmpty && i === n - 1 ? null : v > 0 ? v : null))
  const nums = shown.filter((v): v is number => v !== null)
  const max = yMax ?? Math.max(1, ...nums)
  const avg = nums.length ? nums.reduce((a, c) => a + c, 0) / nums.length : 0
  const x = (i: number) => padL + ((w - padL - padR) * i) / Math.max(1, n - 1)
  const y = (v: number) => bottom - ((Math.min(max, Math.max(yMin, v)) - yMin) / Math.max(1, max - yMin)) * (bottom - top)
  const avgLabelFits = nums.length > 0 && Math.abs(y(avg) - top) > 11 && Math.abs(y(avg) - bottom) > 11
  const pts = shown.map((v, i) => (v === null ? null : { x: x(i), y: y(v) }))
  const seg = pts.filter((p): p is { x: number; y: number } => p !== null)
  // Catmull-Rom → 베지어
  let d = ''
  seg.forEach((p, i) => {
    if (i === 0) { d += `M ${p.x} ${p.y}`; return }
    const p0 = seg[i - 2] ?? seg[i - 1]
    const p1 = seg[i - 1]
    const p2 = p
    const p3 = seg[i + 1] ?? p
    const c1x = p1.x + (p2.x - p0.x) / 6
    const c1y = p1.y + (p2.y - p0.y) / 6
    const c2x = p2.x - (p3.x - p1.x) / 6
    const c2y = p2.y - (p3.y - p1.y) / 6
    d += ` C ${c1x} ${c1y}, ${c2x} ${c2y}, ${p2.x} ${p2.y}`
  })
  const fmt = (v: number) => (Number.isInteger(v) ? v.toLocaleString('ko-KR') : v.toFixed(1))
  return (
    <svg className="elder-fit-chart line" viewBox={`0 0 ${w} ${h}`} aria-hidden>
      <line x1={padL} x2={w - padR} y1={top} y2={top} stroke="#E8EBEE" strokeWidth="1.5" />
      <line x1={padL} x2={w - padR} y1={bottom} y2={bottom} stroke="#E8EBEE" strokeWidth="1.5" />
      {!compact && <text x={padL - 10} y={top + 4} textAnchor="end" fontSize="11" fontWeight="600" fill="#9aa3ad">{fmt(max)}{unit}</text>}
      {!compact && <text x={padL - 10} y={bottom + 4} textAnchor="end" fontSize="11" fontWeight="600" fill="#9aa3ad">{fmt(yMin)}{unit}</text>}
      {nums.length > 0 && (
        <>
          <line x1={padL} x2={w - padR} y1={y(avg)} y2={y(avg)} stroke={color} strokeOpacity="0.5" strokeWidth="1.5" strokeDasharray="4 4" />
          {avgLabelFits && !compact && <text x={padL - 10} y={y(avg) + 4} textAnchor="end" fontSize="11" fontWeight="700" fill="#5a6570">평균</text>}
        </>
      )}
      {d && <path d={d} fill="none" stroke={color} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />}
      {pts.map((p, i) => {
        const isLast = i === n - 1
        if (!p) {
          return isLast ? <circle key={i} cx={x(i)} cy={y(avg || max / 2)} r={6} fill="none" stroke="#c5ced6" strokeWidth="2" strokeDasharray="3 2" /> : null
        }
        return isLast
          ? <circle key={i} cx={p.x} cy={p.y} r={7} fill={color} />
          : <circle key={i} cx={p.x} cy={p.y} r={5} fill="#fff" stroke={color} strokeWidth="2.5" />
      })}
      {labels.map((l, i) => (
        <text key={l + i} x={x(i)} y={h - 6} textAnchor="middle" fontSize="12" fontWeight={i === n - 1 ? '700' : '500'} fill={i === n - 1 ? '#1a2332' : '#9aa3ad'}>{l}</text>
      ))}
    </svg>
  )
}
