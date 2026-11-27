import type { ReactNode } from 'react'
import { GRADE_BANDS, gradeOf } from '../rhythm'

/** 바디 리듬 무지개 5색 — 등급마다 색 하나 (나쁨 빨강 · 주의 주황 · 보통 노랑 · 좋음 초록 · 최상 파랑).
 *  색만 봐도 지금 상태가 구분되게, 홈 카드·상세·7일 막대가 모두 이 색을 쓴다 (GRADE_BANDS 가 단일 소스) */
export function gradeColor(score: number) {
  return gradeOf(score).color
}

/** 글자용 진한 색: 파스텔 등급 색을 어둡게 눌러 흰 바탕에서도 읽히게 (amount 0~1) */
export function deepen(c: string, amount = 0.4) {
  return '#' + [1, 3, 5].map((k) => Math.round(parseInt(c.slice(k, k + 2), 16) * (1 - amount)).toString(16).padStart(2, '0')).join('')
}

/** 0~100 위치의 무지개 색 — 등급 구간 가운데마다 그 등급 색, 사이는 섞어서 (그라데이션 눈금·막대용) */
export function rainbowAt(v: number) {
  const pts = GRADE_BANDS.map((b) => ({ at: (b.from + Math.min(100, b.to)) / 2, c: b.color }))
  if (v <= pts[0].at) return pts[0].c
  if (v >= pts[pts.length - 1].at) return pts[pts.length - 1].c
  const i = pts.findIndex((p) => p.at >= v)
  const a = pts[i - 1], b = pts[i]
  const t = (v - a.at) / (b.at - a.at)
  const hex = (c: string) => [1, 3, 5].map((k) => parseInt(c.slice(k, k + 2), 16))
  const [r1, g1, b1] = hex(a.c), [r2, g2, b2] = hex(b.c)
  const mix = (x: number, y: number) => Math.round(x + (y - x) * t).toString(16).padStart(2, '0')
  return `#${mix(r1, r2)}${mix(g1, g2)}${mix(b1, b2)}`
}

/** 눈금 반원 게이지 (홈 오늘의 상태): 가는 눈금 41개로 된 반원. 0점부터 오늘 점수까지의 눈금만 그 구간의 무지개 색, 나머지는 연회색.
 *  가운데에 점수(덜 굵게) + 등급 이름 */
export function GradeTicks({ score, width = 168, center }: { score: number; width?: number;
  /** 가운데 글자를 바꿀 때 (준비 중 '4/7일' 등) */ center?: ReactNode }) {
  const s = Math.min(100, Math.max(0, score))
  const cur = gradeOf(s)
  const n = 41
  const cx = width / 2
  const rOut = width / 2 - 2
  const rIn = rOut - 14
  const h = rOut + 6
  return (
    // 좁은 화면에서는 줄어들도록: 최대 width, 남는 폭에 맞춰 축소 (viewBox 비율 유지)
    <div className="grade-ticks" style={{ width: '100%', maxWidth: width }}>
      <svg viewBox={`0 0 ${width} ${h}`} width="100%" style={{ height: 'auto' }} aria-label={`0~100 중 ${s}점, ${cur.label}`} role="img">
        {Array.from({ length: n }, (_, i) => {
          const v = (i / (n - 1)) * 100
          const a = Math.PI * (1 - i / (n - 1))
          const on = v <= s
          return (
            <line
              key={i}
              x1={cx + rIn * Math.cos(a)} y1={rOut + 2 - rIn * Math.sin(a)}
              x2={cx + rOut * Math.cos(a)} y2={rOut + 2 - rOut * Math.sin(a)}
              stroke={on ? rainbowAt(v) : '#E3E6EA'}
              strokeWidth={3}
              strokeLinecap="round"
            />
          )
        })}
      </svg>
      <span className="grade-ticks-center">
        {center ?? (
          <>
            <strong>{s}<small>점</small></strong>
            <b style={{ color: deepen(cur.color) }}>{cur.label}</b>
          </>
        )}
      </span>
    </div>
  )
}

/** 증감 칩: 화살표 + 차이. 색은 좋아졌는지로 (higherIsBetter=false 면 내려갈 때 초록) */
export function DeltaChip({ diff, higherIsBetter = true, sameText = '같음' }: { diff: number; higherIsBetter?: boolean; sameText?: string }) {
  if (diff === 0) return <span className="rd-delta same">{sameText}</span>
  const better = higherIsBetter ? diff > 0 : diff < 0
  return (
    <span className={`rd-delta ${better ? 'good' : 'bad'}`} aria-label={`${Math.abs(diff)}점 ${diff > 0 ? '높아요' : '낮아요'}`}>
      {/* 칩 대신 작은 삼각형 + 숫자 (글자색만) */}
      <span className="rd-delta-tri" aria-hidden>{diff > 0 ? '▲' : '▼'}</span>{Math.abs(diff)}
    </span>
  )
}

/** 바디 리듬 맨 위 한 줄 (사실만): 어제(전날)와 차이 → 없으면 7일 평균과 차이 → 없으면 점수 */
export function rhythmHeadline(score: number, prev: number | null, avg: number | null, isToday = true) {
  const prevName = isToday ? '어제' : '전날'
  const tail = (d: number) => (isToday ? (d > 0 ? '높아요' : '낮아요') : (d > 0 ? '높았어요' : '낮았어요'))
  if (prev !== null) {
    const d = score - prev
    return d === 0 ? `${prevName}와 같은 점수${isToday ? '예요' : '였어요'}` : `${prevName}보다 ${Math.abs(d)}점 ${tail(d)}`
  }
  if (avg !== null) {
    const d = score - avg
    return d === 0 ? `7일 평균과 같은 점수${isToday ? '예요' : '였어요'}` : `7일 평균보다 ${Math.abs(d)}점 ${tail(d)}`
  }
  return isToday ? `오늘 바디 리듬 ${score}점이에요` : `이 날 바디 리듬 ${score}점이었어요`
}

/** 기록 모으는 중 반원 (바디 리듬 준비 중): 점수 게이지와 같은 가는 눈금을 하루 단위로 묶어 total 묶음으로 (하루 = 눈금 5개 한 묶음, 묶음 사이 틈).
 *  모인 날은 진한 회색, 남은 날은 연한 회색. 가운데에 n/7일 */
export function DayArc({ days, total, width = 168, center }: { days: number; total: number; width?: number; center?: ReactNode }) {
  const perDay = 5
  const gapDeg = 9 // 하루 묶음 사이 틈(도)
  const cx = width / 2
  const rOut = width / 2 - 2
  const rIn = rOut - 14
  const h = rOut + 6
  const span = (180 - gapDeg * (total - 1)) / total // 하루 묶음이 차지하는 각도
  const step = span / (perDay - 1)
  return (
    <div className="grade-ticks day-arc" style={{ width: '100%', maxWidth: width }}>
      <svg viewBox={`0 0 ${width} ${h}`} width="100%" style={{ height: 'auto' }} aria-label={`${total}일 중 ${days}일 기록`} role="img">
        {Array.from({ length: total }, (_, d) =>
          Array.from({ length: perDay }, (_, k) => {
            const deg = d * (span + gapDeg) + k * step
            const a = Math.PI * (1 - deg / 180)
            return (
              <line
                key={`${d}-${k}`}
                x1={cx + rIn * Math.cos(a)} y1={rOut + 2 - rIn * Math.sin(a)}
                x2={cx + rOut * Math.cos(a)} y2={rOut + 2 - rOut * Math.sin(a)}
                // 모인 날: 진한 회색, 남은 날: 연한 회색 (점수가 아니라 기록 진행이라 색을 쓰지 않음)
                stroke={d < days ? '#A9B1BB' : '#E3E6EA'}
                strokeWidth={3}
                strokeLinecap="round"
              />
            )
          }),
        )}
      </svg>
      <span className="grade-ticks-center">{center}</span>
    </div>
  )
}
