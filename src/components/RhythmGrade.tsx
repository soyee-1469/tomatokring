import type { ReactNode } from 'react'
import { GRADE_BANDS, gradeOf } from '../rhythm'
import { Ri } from './Ri'

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

/** 무지개 눈금 (바디 리듬 상세 첫 카드, 날짜 하나): 0~100을 등급 구간 길이대로 5칸, 지금 점수 자리에 표시. 지금 등급 이름만 진하게 */
export function GradeScale({ score }: { score: number }) {
  const s = Math.min(100, Math.max(0, score))
  const cur = gradeOf(s)
  return (
    <div className="grade-scale" aria-label={`0~100 중 ${s}점, ${cur.label}`}>
      <div className="grade-scale-bar">
        {GRADE_BANDS.map((b) => (
          // 칸마다 시작~끝 위치의 무지개 색으로 그라데이션 (끊기지 않고 이어져 보이게)
          <i key={b.label} style={{ flex: Math.min(100, b.to) - b.from, background: `linear-gradient(90deg, ${rainbowAt(b.from)}, ${rainbowAt(Math.min(100, b.to))})` }} />
        ))}
        <span className="grade-scale-mark" style={{ left: `${s}%`, borderColor: cur.color }} />
      </div>
      <div className="grade-scale-labels">
        {GRADE_BANDS.map((b) => (
          <em key={b.label} style={{ flex: Math.min(100, b.to) - b.from }} className={b.label === cur.label ? 'on' : ''}>{b.label}</em>
        ))}
      </div>
    </div>
  )
}

/** 눈금 반원 게이지 (홈 오늘의 상태): 가는 눈금 41개로 된 반원. 0점부터 오늘 점수까지의 눈금만 그 구간의 무지개 색, 나머지는 연회색.
 *  가운데에 점수(덜 굵게) + 등급 이름 */
export function GradeTicks({ score, width = 168, gray = false, center }: { score: number; width?: number;
  /** 준비 중(7일 미만): 무지개 대신 회색 — score 만큼 진한 회색으로 차오름 */ gray?: boolean;
  /** 가운데 글자를 바꿀 때 (준비 중 '4/7일' 등) */ center?: ReactNode }) {
  const s = Math.min(100, Math.max(0, score))
  const cur = gradeOf(s)
  const n = 41
  const cx = width / 2
  const rOut = width / 2 - 2
  const rIn = rOut - 14
  const h = rOut + 6
  return (
    <div className="grade-ticks" style={{ width }}>
      <svg viewBox={`0 0 ${width} ${h}`} width={width} height={h} aria-label={`0~100 중 ${s}점, ${cur.label}`} role="img">
        {Array.from({ length: n }, (_, i) => {
          const v = (i / (n - 1)) * 100
          const a = Math.PI * (1 - i / (n - 1))
          const on = v <= s
          return (
            <line
              key={i}
              x1={cx + rIn * Math.cos(a)} y1={rOut + 2 - rIn * Math.sin(a)}
              x2={cx + rOut * Math.cos(a)} y2={rOut + 2 - rOut * Math.sin(a)}
              stroke={on ? (gray ? '#A9B1BB' : rainbowAt(v)) : '#E3E6EA'}
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
      <Ri name={diff > 0 ? 'arrow-up' : 'arrow-down'} size={13} />{Math.abs(diff)}
    </span>
  )
}

/** 바디 리듬 맨 위 한 줄 (사실만): 어제(전날)와 차이 → 없으면 내 평균과 차이 → 없으면 점수 */
export function rhythmHeadline(score: number, prev: number | null, avg: number | null, isToday = true) {
  const prevName = isToday ? '어제' : '전날'
  const tail = (d: number) => (isToday ? (d > 0 ? '높아요' : '낮아요') : (d > 0 ? '높았어요' : '낮았어요'))
  if (prev !== null) {
    const d = score - prev
    return d === 0 ? `${prevName}와 같은 점수${isToday ? '예요' : '였어요'}` : `${prevName}보다 ${Math.abs(d)}점 ${tail(d)}`
  }
  if (avg !== null) {
    const d = score - avg
    return d === 0 ? `내 평균과 같은 점수${isToday ? '예요' : '였어요'}` : `내 평균보다 ${Math.abs(d)}점 ${tail(d)}`
  }
  return isToday ? `오늘 바디 리듬 ${score}점이에요` : `이 날 바디 리듬 ${score}점이었어요`
}
