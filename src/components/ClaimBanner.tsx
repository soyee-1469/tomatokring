import { useNavigate } from 'react-router-dom'
import { Ri } from './Ri'
import { isClaimed, isMeasureDone, type MeasureKind } from '../session'
import { useSession } from '../useSession'

export const REWARD_P: Record<Exclude<MeasureKind, 'health'>, number> = {
  stress: 200_000, diet: 200_000, walk: 200_000, sleep: 200_000, survey: 5_000_000,
}
export function formatP(points: number) {
  return points % 10_000 === 0 ? `${(points / 10_000).toLocaleString('ko-KR')}만 P` : `${points.toLocaleString('ko-KR')} P`
}

/** 상세는 '하는 곳', 홈은 '받는 곳': 완료되면 완료 표시 + '홈에서 받기' 링크, 받은 뒤엔 '받았어요' + 적립 내역 링크. eligible=false 면 기준 미달 안내만. */
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
  // 완료는 여기서, 받기는 홈 카드에서 (받는 자리는 홈 한 곳). 완료 표시 + 홈으로 가는 글자 링크만
  return (
    <div className="claim-banner done">
      <button type="button" className="claim-done-btn" disabled>
        <Ri name="checkbox-circle" fill size={18} />
        {doneText}
      </button>
      <button type="button" className="claim-link" onClick={() => navigate('/vitaling/home')}>홈에서 {points} 받기 <Ri name="arrow-right-s" size={14} /></button>
    </div>
  )
}
