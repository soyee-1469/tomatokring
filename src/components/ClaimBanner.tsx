import { useNavigate } from 'react-router-dom'
import { Ri } from './Ri'
import { isClaimed, isMeasureDone, markClaimed, type MeasureKind } from '../session'
import { useSession } from '../useSession'

export const REWARD_P: Record<Exclude<MeasureKind, 'health'>, number> = {
  stress: 200_000, diet: 200_000, walk: 200_000, sleep: 200_000, survey: 5_000_000,
}
export function formatP(points: number) {
  return points % 10_000 === 0 ? `${(points / 10_000).toLocaleString('ko-KR')}만 P` : `${points.toLocaleString('ko-KR')} P`
}

/** 측정 완료 → 여기서 바로 수령 → 적립 내역 확인 (홈으로 돌려보내지 않는다). eligible=false 면 기준 미달 안내만. */
export function ClaimBanner({ kind, doneText, eligible = true, ineligibleText }: { kind: Exclude<MeasureKind, 'health'>; doneText: string; eligible?: boolean; ineligibleText?: string }) {
  const navigate = useNavigate()
  const session = useSession()
  if (!isMeasureDone(session, kind)) return null
  const claimed = isClaimed(session, kind)
  const points = formatP(REWARD_P[kind])
  if (claimed) {
    return (
      <div className="claim-banner done">
        <button type="button" className="claim-done-btn" disabled>
          <Ri name="checkbox-circle" fill size={18} />
          오늘 {points} 받았어요
        </button>
        <button type="button" className="claim-link" onClick={() => navigate('/reward/history')}>적립 내역 보기 <Ri name="arrow-right-s" size={14} /></button>
      </div>
    )
  }
  if (!eligible) {
    return (
      <div className="claim-banner off">
        <Ri name="information" fill size={20} />
        <span>{ineligibleText ?? '지급 기준에 못 미쳤어요. 다시 측정해 보세요.'}</span>
      </div>
    )
  }
  return (
    <div className="claim-banner ready">
      <button type="button" className="claim-go" onClick={() => markClaimed(kind)}>
        <Ri name="checkbox-circle" fill size={18} />
        <span>{doneText} · {points} 받기</span>
      </button>
    </div>
  )
}
