import type { CSSProperties } from 'react'
import { gradeOf } from '../rhythm'
import { HOME_COLORS } from '../palette'

/** 바디 리듬 링 게이지 — 홈과 상세가 같은 그림을 쓴다.
 *  무지개 반원 대신 점수 구간 색 하나로 차오르는 링 (좋음 초록 · 보통 노랑 · 나쁨 산호, 수면 효율 링과 같은 모양).
 *  처음 그려질 때 0에서 점수까지 차오르는 애니메이션(CSS) */
const TONE_COLOR = { ok: HOME_COLORS.leaf, warn: HOME_COLORS.lemon, bad: HOME_COLORS.coral } as const
const TONE_SOFT = { ok: '#E4F9EC', warn: '#FFF6D6', bad: '#FFE9E9' } as const

export function ScoreArc({ score, size = 'md' }: { score: number; size?: 'md' | 'lg' }) {
  const s = Math.min(100, Math.max(0, score))
  const tone = gradeOf(s).tone
  const r = 66
  const c = 2 * Math.PI * r
  const off = c * (1 - s / 100)
  return (
    <svg className={`elder-score-arc ring ${size}`} viewBox="0 0 160 160" style={{ '--c': c } as CSSProperties} aria-hidden>
      <circle cx={80} cy={80} r={r} fill="none" stroke={TONE_SOFT[tone]} strokeWidth={14} />
      <circle className="fill" cx={80} cy={80} r={r} fill="none" stroke={TONE_COLOR[tone]} strokeWidth={14} strokeLinecap="round" strokeDasharray={c.toFixed(2)} strokeDashoffset={off.toFixed(2)} transform="rotate(-90 80 80)" />
    </svg>
  )
}
