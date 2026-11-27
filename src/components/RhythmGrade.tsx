import { GRADE_BANDS, gradeOf } from '../rhythm'

/** 바디 리듬 무지개 5색 — 등급마다 색 하나 (나쁨 빨강 · 주의 주황 · 보통 노랑 · 좋음 초록 · 최상 파랑).
 *  색만 봐도 지금 상태가 구분되게, 홈 카드·상세·7일 막대가 모두 이 색을 쓴다 (GRADE_BANDS 가 단일 소스) */
export function gradeColor(score: number) {
  return gradeOf(score).color
}

/** 등급 알약: 등급 색 점 + 이름, 바탕은 같은 색을 아주 연하게 */
export function GradePill({ score, className = '' }: { score: number; className?: string }) {
  const g = gradeOf(score)
  return (
    <span className={`rd-grade ${className}`} style={{ background: `${g.color}1F` }}>
      <i style={{ background: g.color }} />
      {g.label}
    </span>
  )
}

/** 무지개 눈금 (바디 리듬 상세 첫 카드, 날짜 하나): 0~100을 등급 구간 길이대로 5칸, 지금 점수 자리에 표시. 지금 등급 이름만 진하게 */
export function GradeScale({ score }: { score: number }) {
  const s = Math.min(100, Math.max(0, score))
  const cur = gradeOf(s)
  return (
    <div className="grade-scale" aria-label={`0~100 중 ${s}점, ${cur.label}`}>
      <div className="grade-scale-bar">
        {GRADE_BANDS.map((b) => (
          <i key={b.label} style={{ flex: Math.min(100, b.to) - b.from, background: b.color, opacity: b.label === cur.label ? 1 : 0.35 }} />
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
