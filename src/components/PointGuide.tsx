import { useState } from 'react'
import { Info } from '@phosphor-icons/react'
import { PrimaryButton } from './ui'
import { REWARD_P, formatP } from './ClaimBanner'
import type { MissionCardKind } from '../session'

/** 포인트 지급 기준 (11/09 수정본 정책표) — 수치 기준이 있는 건 스트레스·걷기 둘뿐 */
export const STRESS_REWARD_MAX = 30 // 스트레스 30점 이하(0~30)일 때 지급
export const WALK_REWARD_STEPS = 8_000 // 8,000걸음 이상일 때 지급

const RULES: readonly { kind: MissionCardKind; label: string; rule: string }[] = [
  { kind: 'stress', label: '스트레스', rule: `하루 중 ${STRESS_REWARD_MAX}점 이하 기록이 있을 때` },
  { kind: 'diet', label: '식단', rule: '식단 사진을 올리면' },
  { kind: 'walk', label: '걷기', rule: `하루 ${WALK_REWARD_STEPS.toLocaleString('ko-KR')}걸음 이상 걸으면` },
  { kind: 'sleep', label: '수면', rule: '지난밤 수면 기록이 있으면' },
  { kind: 'survey', label: '설문', rule: '이달의 설문을 마치면' },
]
/** 한 달(30일) 최대: 매일 받는 네 항목 × 30일 + 월 1회 설문 */
const MONTH_MAX = RULES.reduce((a, r) => a + REWARD_P[r.kind] * (r.kind === 'survey' ? 1 : 30), 0)

/** 포인트 받는 방법 시트 — 홈 '오늘의 미션' 머리글과 보상 내역 화면에서 같은 것을 연다 */
export function PointGuideSheet({ onClose }: { onClose: () => void }) {
  return (
    <div className="sheet-overlay" role="dialog" aria-modal="true" aria-labelledby="point-guide-title">
      <button type="button" className="sheet-backdrop" aria-label="닫기" onClick={onClose} />
      <div className="sheet-panel sleep-eff-sheet point-guide">
        <div className="sheet-handle" />
        <h2 id="point-guide-title">포인트 받는 방법</h2>
        <ul className="point-guide-list">
          {RULES.map((r) => (
            <li key={r.kind}>
              <span><b>{r.label}</b><em>{r.rule}</em></span>
              <strong>{formatP(REWARD_P[r.kind])}</strong>
            </li>
          ))}
        </ul>
        <p>설문은 한 달에 한 번, 나머지는 하루에 한 번 받을 수 있어요. 한 달에 최대 {formatP(MONTH_MAX)}까지 받아요.</p>
        <PrimaryButton onClick={onClose}>확인</PrimaryButton>
      </div>
    </div>
  )
}

/** ⓘ 버튼 + 시트 한 벌 */
export function PointGuideButton({ className = '' }: { className?: string }) {
  const [open, setOpen] = useState(false)
  return (
    <>
      <button type="button" className={`point-guide-btn ${className}`.trim()} aria-label="포인트 받는 방법" onClick={() => setOpen(true)}>
        <Info size={20} weight="regular" />
      </button>
      {open && <PointGuideSheet onClose={() => setOpen(false)} />}
    </>
  )
}
