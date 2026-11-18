import { useState } from 'react'
import { X } from '@phosphor-icons/react'
import { Header, Phone, PrimaryButton } from '../components/ui'
import { Ri } from '../components/Ri'
import { getSession, setHealthProfile, setHealthGoals, type HealthGoals, type HealthProfile } from '../session'
import { useSession } from '../useSession'

/**
 * 내 정보 (브링 '내 프로필'의 성별·생일·키·몸무게만) — 칼로리·거리·정상 범위 계산에 쓰이는 값.
 * 닉네임·계정·소속·탈퇴·로그아웃은 토마톡 계정이 담당하므로 없음.
 */
type EditKey = keyof HealthProfile | keyof HealthGoals | null

function fmtProfile(p: HealthProfile, k: keyof HealthProfile) {
  const v = p[k]
  if (v === null || v === '') return null
  if (k === 'sex') return v === 'female' ? '여성' : '남성'
  if (k === 'birth') return `${v}`.replace(/^(\d{4})-(\d{2})-(\d{2})$/, '$1년 $2월 $3일')
  if (k === 'height') return `${v}cm`
  if (k === 'weight') return `${v}kg`
  return String(v)
}

const PROFILE_ROWS: { k: keyof HealthProfile; label: string; type: 'sex' | 'date' | 'number'; unit?: string; hint: string }[] = [
  { k: 'sex', label: '성별', type: 'sex', hint: '정상 범위 계산에 써요' },
  { k: 'birth', label: '생일', type: 'date', hint: '나이대별 기준 비교에 써요' },
  { k: 'height', label: '키', type: 'number', unit: 'cm', hint: '걸음 거리 계산에 써요' },
  { k: 'weight', label: '몸무게', type: 'number', unit: 'kg', hint: '소모 칼로리 계산에 써요' },
]

const GOAL_GROUPS: { title: string; rows: { k: keyof HealthGoals; label: string; unit: string; type: 'number' | 'time'; step?: number }[] }[] = [
  { title: '활동 목표', rows: [{ k: 'steps', label: '걸음 수', unit: '걸음', type: 'number', step: 500 }, { k: 'kcalBurn', label: '칼로리', unit: 'kcal', type: 'number', step: 50 }, { k: 'distance', label: '거리', unit: 'km', type: 'number', step: 1 }] },
  { title: '수면 목표', rows: [{ k: 'sleepMinutes', label: '수면 시간', unit: '', type: 'time' }, { k: 'bedtime', label: '취침 시각', unit: '', type: 'time' }] },
  { title: 'AI 식단 목표', rows: [{ k: 'kcalIntake', label: '칼로리', unit: 'kcal', type: 'number', step: 100 }] },
]

function fmtGoal(g: HealthGoals, k: keyof HealthGoals) {
  const v = g[k]
  if (k === 'sleepMinutes') return `${Math.floor(v / 60)}시간 ${String(v % 60).padStart(2, '0')}분`
  if (k === 'bedtime') return `${String(Math.floor(v / 60)).padStart(2, '0')}:${String(v % 60).padStart(2, '0')}`
  if (k === 'steps') return `${v.toLocaleString('ko-KR')}걸음`
  if (k === 'distance') return `${v}km`
  return `${v.toLocaleString('ko-KR')}kcal`
}

export function ProfileScreenMy() {
  const session = useSession()
  const [edit, setEdit] = useState<EditKey>(null)
  const p = session.healthProfile
  return (
    <div className="stage">
      <Phone>
        <div className="screen elder-home">
          <Header title="내 정보" backTo="/vitaling/my" />
          <div className="scroll elder-body">
            <p className="settings-note" style={{ marginTop: 4 }}>칼로리·거리·정상 범위를 정확히 계산하려면 네 가지를 채워 주세요. 이름과 연락처는 토마톡 계정 정보를 그대로 써요.</p>
            <ul className="my-menu grouped">
              {PROFILE_ROWS.map((r) => {
                const val = fmtProfile(p, r.k)
                return (
                  <li key={r.k}>
                    <button type="button" className="my-menu-row" onClick={() => setEdit(r.k)}>
                      <span className="my-menu-copy"><b>{r.label}</b><em>{r.hint}</em></span>
                      <span className={`pf-val ${val ? '' : 'empty'}`}>{val ?? '입력하기'} <Ri name="pencil" size={16} /></span>
                    </button>
                  </li>
                )
              })}
            </ul>
          </div>
          {edit && edit in p && <ProfileEditSheet k={edit as keyof HealthProfile} onClose={() => setEdit(null)} />}
        </div>
      </Phone>
    </div>
  )
}

function ProfileEditSheet({ k, onClose }: { k: keyof HealthProfile; onClose: () => void }) {
  const row = PROFILE_ROWS.find((r) => r.k === k)!
  const cur = getSession().healthProfile
  const [val, setVal] = useState<string>(cur[k] === null ? '' : String(cur[k]))
  const save = () => {
    const next: HealthProfile = { ...cur }
    if (k === 'sex') next.sex = val === 'female' ? 'female' : 'male'
    else if (k === 'birth') next.birth = val
    else if (k === 'height') next.height = val ? Number(val) : null
    else if (k === 'weight') next.weight = val ? Number(val) : null
    setHealthProfile(next)
    onClose()
  }
  return (
    <div className="sheet-overlay" role="dialog" aria-modal="true" aria-labelledby="pf-edit-title">
      <button type="button" className="sheet-backdrop" aria-label="닫기" onClick={onClose} />
      <div className="sheet-panel">
        <div className="sheet-handle" />
        <div className="sheet-top">
          <h2 id="pf-edit-title">{row.label} 입력</h2>
          <button type="button" className="icon-btn" aria-label="닫기" onClick={onClose}><X size={20} weight="bold" /></button>
        </div>
        {row.type === 'sex' ? (
          <div className="restore-options">
            {[['female', '여성'], ['male', '남성']].map(([v, l]) => (
              <button key={v} type="button" role="radio" aria-checked={val === v} className={`restore-opt ${val === v ? 'on' : ''}`} onClick={() => setVal(v)}>
                <i className={val === v ? 'ri-checkbox-circle-fill' : 'ri-checkbox-blank-circle-line'} aria-hidden />{l}
              </button>
            ))}
          </div>
        ) : (
          <label className="pf-input">
            <input type={row.type === 'date' ? 'date' : 'number'} inputMode={row.type === 'number' ? 'decimal' : undefined} value={val} onChange={(e) => setVal(e.target.value)} placeholder={row.type === 'number' ? '숫자 입력' : ''} />
            {row.unit && <span>{row.unit}</span>}
          </label>
        )}
        <PrimaryButton disabled={!val} onClick={save}>저장</PrimaryButton>
      </div>
    </div>
  )
}

/** 목표 설정 (브링 '목표 설정' 구조: 활동 · 수면 · AI 식단) */
export function GoalsScreen() {
  const session = useSession()
  const [edit, setEdit] = useState<keyof HealthGoals | null>(null)
  const g = session.healthGoals
  return (
    <div className="stage">
      <Phone>
        <div className="screen elder-home">
          <Header title="목표 설정" backTo="/vitaling/my" />
          <div className="scroll elder-body">
            {GOAL_GROUPS.map((grp) => (
              <section key={grp.title}>
                <p className="my-section-label goal-label">{grp.title}</p>
                <ul className="my-menu grouped">
                  {grp.rows.map((r) => (
                    <li key={r.k}>
                      <button type="button" className="my-menu-row" onClick={() => setEdit(r.k)}>
                        <span className="my-menu-copy"><b>{r.label}</b></span>
                        <span className="pf-val">{fmtGoal(g, r.k)} <Ri name="pencil" size={16} /></span>
                      </button>
                    </li>
                  ))}
                </ul>
              </section>
            ))}
            <p className="settings-note">포인트 지급 기준(걷기 8,000걸음 등)은 목표와 별도로 토마톡이 정한 값이에요.</p>
          </div>
          {edit && <GoalEditSheet k={edit} onClose={() => setEdit(null)} />}
        </div>
      </Phone>
    </div>
  )
}

function GoalEditSheet({ k, onClose }: { k: keyof HealthGoals; onClose: () => void }) {
  const row = GOAL_GROUPS.flatMap((x) => x.rows).find((r) => r.k === k)!
  const cur = getSession().healthGoals
  const [val, setVal] = useState<number>(cur[k])
  const save = () => {
    setHealthGoals({ ...cur, [k]: val })
    onClose()
  }
  const step = row.step ?? 1
  return (
    <div className="sheet-overlay" role="dialog" aria-modal="true" aria-labelledby="goal-edit-title">
      <button type="button" className="sheet-backdrop" aria-label="닫기" onClick={onClose} />
      <div className="sheet-panel">
        <div className="sheet-handle" />
        <div className="sheet-top">
          <h2 id="goal-edit-title">{row.label} 목표</h2>
          <button type="button" className="icon-btn" aria-label="닫기" onClick={onClose}><X size={20} weight="bold" /></button>
        </div>
        {row.type === 'time' ? (
          <div className="goal-time">
            <label>
              <span>{k === 'bedtime' ? '시' : '시간'}</span>
              <input type="number" min={0} max={23} value={Math.floor(val / 60)} onChange={(e) => setVal(Number(e.target.value) * 60 + (val % 60))} />
            </label>
            <label>
              <span>분</span>
              <input type="number" min={0} max={59} step={5} value={val % 60} onChange={(e) => setVal(Math.floor(val / 60) * 60 + Number(e.target.value))} />
            </label>
          </div>
        ) : (
          <div className="goal-stepper">
            <button type="button" aria-label="줄이기" onClick={() => setVal((v) => Math.max(0, v - step))}><Ri name="subtract" size={24} /></button>
            <b>{val.toLocaleString('ko-KR')}<small>{row.unit}</small></b>
            <button type="button" aria-label="늘리기" onClick={() => setVal((v) => v + step)}><Ri name="add" size={24} /></button>
          </div>
        )}
        <PrimaryButton onClick={save}>저장</PrimaryButton>
      </div>
    </div>
  )
}
