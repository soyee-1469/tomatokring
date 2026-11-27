import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { X } from '@phosphor-icons/react'
import { Header, Phone, PrimaryButton } from '../components/ui'
import { Ri } from '../components/Ri'
import { useSession } from '../useSession'
import { restoreValidDays } from '../session'
import { DemoControls } from '../dev/DemoControls'

/** 마이 페이지: 내 정보 · 기기 정보 · 기기 설정 · 데이터 복원 · 가이드 */
export function MyScreen() {
  const navigate = useNavigate()
  const session = useSession()
  const [restoreOpen, setRestoreOpen] = useState(false)

  const menu: { icon: string; cls: string; title: string; desc: string; onClick: () => void }[] = [
    { icon: 'user-settings', cls: 'berry', title: '내 정보', desc: '성별 · 생일 · 키 · 몸무게', onClick: () => navigate('/vitaling/my/profile') },
    { icon: 'flag', cls: 'berry', title: '목표 설정', desc: '걸음 · 수면 시간 · 취침 시각 · 식단 칼로리', onClick: () => navigate('/vitaling/goals') },
    { icon: 'settings-3', cls: 'berry', title: '기기 설정', desc: '반지 연결 · 자동 측정 · 고유번호 연동 · 약관', onClick: () => navigate('/vitaling/settings') },
    { icon: 'pulse', cls: 'beet', title: '자동 측정 모드', desc: '심박수 · 혈중 산소 측정 주기', onClick: () => navigate('/vitaling/settings/auto-measure') },
    { icon: 'refresh', cls: 'leaf', title: '데이터 복원', desc: '서버에 저장된 측정 기록 다시 불러오기', onClick: () => setRestoreOpen(true) },
    { icon: 'book-open', cls: 'orange', title: '가이드 (사용 방법)', desc: '처음 시작하기 · 반지 착용법 · 측정 방법', onClick: () => navigate('/vitaling/guide') },
    { icon: 'question', cls: 'pink', title: '도움말 · 문의', desc: '자주 묻는 질문과 고객센터', onClick: () => navigate('/vitaling/help') },
  ]

  return (
    <div className="stage">
      <Phone>
        <div className="screen elder-home my-page">
          <Header title="마이" backTo="/vitaling/home" />
          <div className="scroll elder-body">
            <div className="my-device slim">
              <div className="my-device-head">
                <span className="my-device-ico"><Ri name="bluetooth" fill size={22} /></span>
                <div>
                  <b>토마톡 링</b>
                  <span className={session.paired ? 'ok' : 'off'}>{session.paired ? '연결됨 · 마지막 동기화 10:24' : '연결 안 됨'}</span>
                </div>
                {session.paired ? (
                  <span className="my-battery"><Ri name="battery" fill size={18} />78%</span>
                ) : (
                  <button type="button" className="my-device-link" onClick={() => navigate('/vitaling/pair')}>연결하기</button>
                )}
              </div>
            </div>

            <p className="my-section-label">설정 · 도움</p>
            <ul className="my-menu grouped">
              {menu.map((m) => (
                <li key={m.title}>
                  <button type="button" className="my-menu-row" onClick={m.onClick}>
                    <span className={`my-menu-ico ${m.cls}`}><Ri name={m.icon} size={22} /></span>
                    <span className="my-menu-copy">
                      <b>{m.title}</b>
                      <em>{m.desc}</em>
                    </span>
                    <Ri name="arrow-right-s" size={22} className="my-menu-caret" />
                  </button>
                </li>
              ))}
            </ul>

            {/* 시연용 전환 버튼: 개발 서버(npm run dev)에서만 보이고, 배포 빌드에서는 코드째 빠진다 */}
            {import.meta.env.DEV && <DemoControls />}
          </div>
          {restoreOpen && <RestoreSheet onClose={() => setRestoreOpen(false)} />}
        </div>
      </Phone>
    </div>
  )
}

/** 복원 가능한 최대 기간: 오늘 포함 73일 (실제 앱 기준, 예: 11월 18일이면 9월 7일부터) */
const RESTORE_MAX_DAYS = 73

function toKey(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}
function fromKey(k: string) {
  const [y, m, d] = k.split('-').map(Number)
  return new Date(y, m - 1, d)
}
function addDays(d: Date, n: number) {
  const x = new Date(d)
  x.setDate(x.getDate() + n)
  return x
}
function fmtK(k: string) {
  const d = fromKey(k)
  return `${d.getMonth() + 1}월 ${d.getDate()}일`
}

type RestorePeriod = 7 | 14 | 30 | 'custom'

/**
 * 데이터 복원 (실제 앱 흐름): 로그아웃 뒤에는 복원해야 이전 기록이 보임.
 * 기간은 최근 7일 · 14일 · 30일 · 직접 선택(시작일·종료일, 오늘 기준 73일 전부터).
 */
function RestoreSheet({ onClose }: { onClose: () => void }) {
  const today = new Date()
  const todayKey = toKey(today)
  const minKey = toKey(addDays(today, -(RESTORE_MAX_DAYS - 1)))
  const [step, setStep] = useState<'period' | 'running' | 'done'>('period')
  const [period, setPeriod] = useState<RestorePeriod>(7)
  const [start, setStart] = useState(minKey)
  const [end, setEnd] = useState(todayKey)
  const [pct, setPct] = useState(0)

  const range = period === 'custom'
    ? { from: start, to: end }
    : { from: toKey(addDays(today, -(period - 1))), to: todayKey }
  const dayCount = Math.max(0, Math.round((fromKey(range.to).getTime() - fromKey(range.from).getTime()) / 86_400_000) + 1)
  const customValid = period !== 'custom' || (start >= minKey && end <= todayKey && start <= end)

  useEffect(() => {
    if (step !== 'running') return
    const id = window.setInterval(() => {
      setPct((p) => {
        if (p >= 100) {
          window.clearInterval(id)
          restoreValidDays(range.from, range.to)
          setStep('done')
          return 100
        }
        return p + 5
      })
    }, 70)
    return () => window.clearInterval(id)
  }, [step])

  const options: { v: RestorePeriod; label: string }[] = [
    { v: 7, label: '최근 7일' },
    { v: 14, label: '최근 14일' },
    { v: 30, label: '최근 30일' },
    { v: 'custom', label: '직접 선택' },
  ]

  return (
    <div className="sheet-overlay" role="dialog" aria-modal="true" aria-labelledby="restore-title">
      <button type="button" className="sheet-backdrop" aria-label="닫기" onClick={onClose} />
      <div className="sheet-panel restore-sheet">
        <div className="sheet-handle" />
        <div className="sheet-top">
          <h2 id="restore-title">데이터 복원</h2>
          <button type="button" className="icon-btn" aria-label="닫기" onClick={onClose}>
            <X size={20} weight="bold" />
          </button>
        </div>
        {step === 'period' && (
          <>
            <p className="restore-lead left">복원할 기간을 골라 주세요</p>
            <p className="restore-hint">로그아웃했거나 휴대폰을 바꿨다면 복원해야 이전 기록이 보여요. 오늘 기준 {RESTORE_MAX_DAYS}일 전({fmtK(minKey)})부터 복원할 수 있어요.</p>
            <div className="restore-options" role="radiogroup" aria-label="복원 기간">
              {options.map((o) => (
                <button
                  key={String(o.v)}
                  type="button"
                  role="radio"
                  aria-checked={period === o.v}
                  className={`restore-opt ${period === o.v ? 'on' : ''}`}
                  onClick={() => setPeriod(o.v)}
                >
                  <i className={period === o.v ? 'ri-checkbox-circle-fill' : 'ri-checkbox-blank-circle-line'} aria-hidden />
                  {o.label}
                </button>
              ))}
            </div>
            {period === 'custom' && (
              <div className="restore-dates">
                <label>
                  <span>시작일</span>
                  <input type="date" value={start} min={minKey} max={end} onChange={(e) => setStart(e.target.value)} />
                </label>
                <label>
                  <span>종료일</span>
                  <input type="date" value={end} min={start} max={todayKey} onChange={(e) => setEnd(e.target.value)} />
                </label>
              </div>
            )}
            <p className="restore-summary">
              {fmtK(range.from)} ~ {fmtK(range.to)} · <b>{dayCount}일치</b>
            </p>
            <PrimaryButton disabled={!customValid || dayCount === 0} onClick={() => setStep('running')}>복원 시작</PrimaryButton>
          </>
        )}
        {step === 'running' && (
          <>
            <span className="restore-ico spin"><Ri name="loader-4" size={30} /></span>
            <p className="restore-lead">{dayCount}일치 기록을 불러오는 중이에요<br />잠시만 기다려 주세요.</p>
            <div className="restore-bar"><i style={{ width: `${pct}%` }} /></div>
            <p className="restore-pct">{pct}%</p>
          </>
        )}
        {step === 'done' && (
          <>
            <span className="restore-ico ok"><Ri name="checkbox-circle" fill size={30} /></span>
            <p className="restore-lead">{fmtK(range.from)} ~ {fmtK(range.to)}<br />{dayCount}일치 복원이 끝났어요.</p>
            <PrimaryButton onClick={onClose}>홈에서 확인하기</PrimaryButton>
          </>
        )}
      </div>
    </div>
  )
}
