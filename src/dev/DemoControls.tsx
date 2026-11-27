import { useSession } from '../useSession'
import { RHYTHM_MIN_DAYS, setBatteryDemo, setDemoValidDays, setSignalDemo, validDayCount, type BatteryDemo, type SignalState } from '../session'

/** 시연용 전환 버튼 모음 (마이 페이지 맨 아래).
 *  개발 서버에서만 그린다 — MyScreen 에서 `import.meta.env.DEV && <DemoControls />` 로 감싸서, 배포 빌드(npm run build)에는 화면도 코드도 들어가지 않는다.
 *  그래서 푸시할 때 따로 지울 필요가 없다. 새 시연용 버튼도 여기에만 추가할 것 */
export function DemoControls() {
  const session = useSession()
  return (
    <>
      {/* 시연용: 바디 리듬 데이터 일수 전환 */}
      <div className="demo-box">
        <b>시연용 · 바디 리듬 데이터 {validDayCount(session)}/{RHYTHM_MIN_DAYS}일</b>
        <div className="demo-row">
          {[0, 4, 7, 14].map((n) => (
            <button key={n} type="button" className={validDayCount(session) === n ? 'on' : ''} onClick={() => setDemoValidDays(n)}>{n}일</button>
          ))}
        </div>
        <span>0일은 처음 쓴 날, 4일은 모으는 중, 7일은 점수만, 14일은 추세까지 보이는 상태예요.</span>
      </div>
      {/* 시연용: 이상 징후 상태 전환 — 홈 카드는 '감지'일 때만 나온다 */}
      <div className="demo-box">
        <b>시연용 · 이상 징후 상태</b>
        <div className="demo-row">
          {([['collecting', '준비 중'], ['normal', '평소와 비슷'], ['detected', '감지']] as [SignalState, string][]).map(([id, label]) => (
            <button key={id} type="button" className={session.signalDemo === id ? 'on' : ''} onClick={() => setSignalDemo(id)}>{label}</button>
          ))}
        </div>
        <span>홈에는 '감지'일 때만 이상 징후 카드가 나와요. 나머지는 상세 화면에서만 보여요.</span>
      </div>
      {/* 시연용: 반지 배터리 단계 */}
      <div className="demo-box">
        <b>시연용 · 반지 배터리</b>
        <div className="demo-row wrap">
          {([['none', '못 읽음'], [3, '비었음 3%'], [15, '낮음 15%'], [50, '중간 50%'], [null, '높음 78%'], [100, '가득 100%'], ['charging', '충전 중']] as [BatteryDemo, string][]).map(([v, label]) => (
            <button key={String(v)} type="button" className={session.batteryDemo === v ? 'on' : ''} onClick={() => setBatteryDemo(v)}>{label}</button>
          ))}
        </div>
        <span>20% 이하는 빨갛게, 5% 이하는 빈 배터리 아이콘, 충전 중은 번개 아이콘이에요. 못 읽음은 반지와 연결이 끊긴 상태예요.</span>
      </div>
    </>
  )
}
