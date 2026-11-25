import {
  Moon,
  Seal,
  Brain,
  ForkKnife,
  Footprints,
  ClipboardText,
  CaretRight,
  Check,
  Drop,
  Heart,
  ShoppingBag,
  Sparkle,
  Thermometer,
  Waveform,
  Wind,
  X,
} from '@phosphor-icons/react'
import type { Icon } from '@phosphor-icons/react'
import { Fragment, useEffect, useRef, useState, type ReactNode } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { Header, InputComponent, Phone, PrimaryButton, Row, Steps } from './components/ui'
import { MetricInfoButton } from './components/AccuracyInfo'
import { Ri } from './components/Ri'
import { SLEEP_LAST_NIGHT, SleepHypnogram } from './components/Sleep'
import { STEPS_BY_HOUR } from './steps'
import { METRIC_STYLE } from './metricStyle'
import { PointGuideButton, STRESS_REWARD_MAX, WALK_REWARD_STEPS } from './components/PointGuide'
import { dayBundle, GRADE_COPY, gradeOf } from './rhythm'
import { ScoreArc as TodayScoreArc } from './components/ScoreArc'
import { AUTO_MODE_LABEL, dayLog } from './measureLog'
import { DEFAULT_CARD_ORDER, RHYTHM_MIN_DAYS, addStressReading, completeOnboarding, isClaimed, isMeasureDone, markClaimed, maskSerial, pairRing, saveVitalId, setCardOrder, setConditionCheck, todayCondition, todayDietPhoto, type ConditionAnswer, type HomeCardKind, type MeasureKind, type MissionCardKind, unpairRing, validDayCount } from './session'
import { openVitalingShop, VITALING_SHOP_URL } from './shop'
import {
  ACTIVITY_COLORS,
  ACTIVITY_LEGEND,
  SLEEP_COLORS,
  VITAL_COLORS,
} from './palette'
import { TERMS_DOCS, TERMS_LIST, type TermsDocId } from './termsDocs'
import { useSession } from './useSession'


export function SerialScreen() {
  const navigate = useNavigate()
  const session = useSession()
  const [value, setValue] = useState(session.vitalId ?? '')
  const [touched, setTouched] = useState(false)

  const normalized = value.trim().toUpperCase()
  const valid = /^[A-Z]{2,4}-\d{4,8}$/.test(normalized)
  const showError = touched && normalized.length > 0 && !valid

  const onChange = (raw: string) => {
    setTouched(true)
    setValue(raw.toUpperCase().replace(/[^A-Z0-9-]/g, '').slice(0, 14))
  }

  const submit = () => {
    if (!valid) {
      setTouched(true)
      return
    }
    saveVitalId(normalized)
    // 고유번호 연동은 처음 시작 흐름에서 뺐고 설정에서만 한다 (2026-11-19)
    navigate('/vitaling/settings', { replace: true })
  }

  return (
    <div className="stage">
      <Phone>
        <div className="screen">
          <Header title="고유번호 연동" backTo="/vitaling/settings" />
          <div className="scroll">
            <p className="eyebrow">토마톡 링 연동</p>
            <h2 className="headline">
              브링 앱의<br />
              고유번호를 입력해 주세요
            </h2>
            <p className="lead" style={{ marginBottom: 22 }}>
              반지 기록을 토마톡으로 가져오는 번호예요.
              <br />
              브링 앱 &gt; 마이 &gt; 기기 설정에서 확인할 수 있어요.
            </p>

            <InputComponent
              label="고유번호"
              value={value}
              onChange={onChange}
              placeholder="ABC-012345"
              inputMode="text"
              success={valid}
              error={showError ? '예: ABC-012345 형식으로 입력해 주세요' : undefined}
              helper={!showError && !valid ? '영문-숫자 조합 (예: ABC-012345)' : undefined}
            />
          </div>
          <div className="footer shadow">
            <PrimaryButton disabled={!valid} onClick={submit}>
              다음
            </PrimaryButton>
          </div>
        </div>
      </Phone>
    </div>
  )
}


export function TermsScreen() {
  const navigate = useNavigate()
  const [items, setItems] = useState(() => TERMS_LIST.map(() => false))
  const [openDoc, setOpenDoc] = useState<TermsDocId | null>(null)
  const all = items.every(Boolean)
  const toggleAll = () => setItems(TERMS_LIST.map(() => !all))
  const toggle = (i: number) => setItems((prev) => prev.map((v, idx) => (idx === i ? !v : v)))
  const doc = openDoc ? TERMS_DOCS[openDoc] : null

  return (
    <div className="stage">
      <Phone>
        <div className="screen">
          <Header title="서비스 동의" backTo="/service" />
          <div className="scroll">
            <Steps step={1} total={2} />
            <div className="terms-head">
              <p className="eyebrow">서비스 시작</p>
              <h2 className="headline">토마톡 링을 쓰려면<br />동의가 필요해요</h2>
              <p className="lead">동의 → 고유번호 연동 → 반지 연결, 세 단계면 끝나요. 이름과 연락처는 토마톡 계정을 그대로 써요.</p>
            </div>

            <button type="button" className="check-all" onClick={toggleAll}>
              <span className={`checkbox ${all ? 'on' : ''}`}><Check size={12} weight="bold" /></span>
              전체 동의
            </button>

            {TERMS_LIST.map(({ id, label }, i) => (
              <div key={id} className="check-item">
                <button type="button" className={`checkbox ${items[i] ? 'on' : ''}`} onClick={() => toggle(i)}>
                  <Check size={12} weight="bold" />
                </button>
                <button type="button" className="txt" onClick={() => toggle(i)}>
                  <span className="req">[필수]</span> {label}
                </button>
                <button type="button" className="view-chip" onClick={() => setOpenDoc(id)}>
                  보기
                </button>
              </div>
            ))}

            <div className="terms-note">
              한 번 동의하면 다음부터는 서비스 탭에서 바로 홈으로 들어와요.
              토마톡 링은 의료 진단 목적이 아닌 웰니스 서비스예요.
            </div>
          </div>
          <div className="footer shadow">
            <PrimaryButton disabled={!all} onClick={() => { completeOnboarding(''); navigate('/vitaling/pair', { replace: true }) }}>
              동의하고 계속하기
            </PrimaryButton>
          </div>

          {doc && (
            <div className="sheet-overlay" role="dialog" aria-modal="true" aria-labelledby="terms-doc-title">
              <button type="button" className="sheet-backdrop" aria-label="닫기" onClick={() => setOpenDoc(null)} />
              <div className="sheet-panel terms-sheet">
                <div className="sheet-handle" />
                <div className="sheet-top">
                  <h2 id="terms-doc-title">{doc.title}</h2>
                  <button type="button" className="icon-btn" aria-label="닫기" onClick={() => setOpenDoc(null)}>
                    <X size={20} weight="light" />
                  </button>
                </div>
                <div className="terms-doc-body">
                  {doc.body.map((line) => (
                    <p key={line} className={/^(제\d+조|\d+\.)/.test(line) ? 'terms-h' : undefined}>
                      {line}
                    </p>
                  ))}
                </div>
                <PrimaryButton
                  onClick={() => {
                    if (!openDoc) return
                    const idx = TERMS_LIST.findIndex((t) => t.id === openDoc)
                    if (idx >= 0) {
                      setItems((prev) => prev.map((v, i) => (i === idx ? true : v)))
                    }
                    setOpenDoc(null)
                  }}
                >
                  동의하고 닫기
                </PrimaryButton>
              </div>
            </div>
          )}
        </div>
      </Phone>
    </div>
  )
}



export function PairScreen() {
  const navigate = useNavigate()
  const [step, setStep] = useState<'scan' | 'pick' | 'done'>('scan')
  const [found, setFound] = useState<string[]>([])
  const [selected, setSelected] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  // 1단계 찾는 중: 2초 뒤 기기 목록 → 2단계 선택
  useEffect(() => {
    if (step !== 'scan') return
    const t1 = window.setTimeout(() => setFound(['TK-A9C3004']), 1200)
    const t2 = window.setTimeout(() => {
      setFound(['TK-A9C3004', 'TK-AAA2114'])
      setStep('pick')
    }, 2200)
    return () => {
      window.clearTimeout(t1)
      window.clearTimeout(t2)
    }
  }, [step])

  const connect = () => {
    if (!selected) return
    setBusy(true)
    window.setTimeout(() => {
      pairRing(selected)
      setBusy(false)
      setStep('done')
    }, 900)
  }

  return (
    <div className="stage">
      <Phone>
        <div className="screen scan-screen">
          <header className="scan-header">
            <span />
            <h1>반지 연결</h1>
            <button type="button" className="icon-btn" aria-label="닫기" onClick={() => navigate('/vitaling/home')}>
              <X size={22} weight="light" />
            </button>
          </header>

          <ol className="pair-steps" aria-label="연결 단계">
            {[['scan', '찾는 중'], ['pick', '반지 선택'], ['done', '연결 완료']].map(([k, l], i) => {
              const order = ['scan', 'pick', 'done']
              const cur = order.indexOf(step)
              const cls = i < cur ? 'past' : i === cur ? 'now' : ''
              return <li key={k} className={cls}><i>{i < cur ? <Ri name="check" size={14} /> : i + 1}</i><span>{l}</span></li>
            })}
          </ol>

          <div className="scroll scan-body">
            {step === 'scan' && (
              <>
                <h2 className="scan-title">반지를 찾고 있어요</h2>
                <p className="scan-lead">휴대폰 블루투스를 켜고<br />반지를 휴대폰 가까이에 두세요.</p>
                <div className="scan-radar" aria-hidden>
                  <i className="ring r1" />
                  <i className="ring r2" />
                  <i className="ring r3" />
                  <span className="scan-logo" />
                </div>
                <p className="scan-hint">{found.length ? `${found.length}개 찾았어요` : '잠시만 기다려 주세요'}</p>
              </>
            )}

            {step === 'pick' && (
              <>
                <h2 className="scan-title">연결할 반지를 선택하세요</h2>
                <p className="scan-lead">반지 안쪽에 적힌 번호와 같은 것을 고르면 돼요.</p>
                <div className="scan-list">
                  {found.map((id) => (
                    <button key={id} type="button" role="radio" aria-checked={selected === id} className={`scan-device ${selected === id ? 'on' : ''}`} onClick={() => setSelected(id)}>
                      <Ri name="bluetooth" fill size={20} />
                      <span>{id}</span>
                      {selected === id && <Ri name="checkbox-circle" fill size={20} />}
                    </button>
                  ))}
                </div>
                <button type="button" className="scan-retry" onClick={() => { setFound([]); setSelected(null); setStep('scan') }}>
                  내 반지가 없어요 · 다시 찾기
                </button>
              </>
            )}

            {step === 'done' && (
              <>
                <span className="scan-done-ico"><Ri name="checkbox-circle" fill size={40} /></span>
                <h2 className="scan-title">연결됐어요</h2>
                <p className="scan-lead">{selected}<br />이제 반지를 끼고 있으면 자동으로 측정돼요.</p>
              </>
            )}
          </div>

          <div className="footer">
            {step === 'pick' && (
              <PrimaryButton disabled={!selected || busy} onClick={connect}>{busy ? '연결 중…' : '연결하기'}</PrimaryButton>
            )}
            {step === 'done' && (
              <PrimaryButton onClick={() => navigate('/vitaling/home', { replace: true })}>홈으로</PrimaryButton>
            )}
            {step === 'scan' && (
              <button type="button" className="btn-cancel" onClick={() => navigate('/vitaling/home')}>나중에 연결할게요</button>
            )}
          </div>
        </div>
      </Phone>
    </div>
  )
}

/** 시안 기준일 (오늘) */
/** 홈 기준 '오늘' = 실제 오늘 (측정·보상 상태 처리와 같은 날짜 기준) */
const HOME_TODAY = startOfDay(new Date())

const WEEKDAYS_KO = ['일', '월', '화', '수', '목', '금', '토'] as const

function startOfDay(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate())
}

function addDays(d: Date, n: number) {
  const x = startOfDay(d)
  x.setDate(x.getDate() + n)
  return x
}

function formatHomeDate(d: Date) {
  const wd = WEEKDAYS_KO[d.getDay()]
  return `${d.getMonth() + 1}월 ${d.getDate()}일 ${wd}요일`
}

const HOME_CARD_META: Record<HomeCardKind, { label: string; icon: string; cls: string }> = {
  hr: { label: '심박수', icon: 'heart-pulse', cls: 'hr' },
  spo2: { label: '혈중 산소', icon: 'drop', cls: 'spo2' },
  temp: { label: '피부 온도', icon: 'temp-hot', cls: 'temp' },
  hrv: { label: '심박변이도', icon: 'pulse', cls: 'hrv' },
  stress: { label: '스트레스', icon: 'brain', cls: 'stress' },
  walk: { label: '걷기', icon: 'walk', cls: 'walk' },
  sleep: { label: '수면', icon: 'moon', cls: 'sleep' },
  survey: { label: '설문', icon: 'survey', cls: 'survey' },
  diet: { label: '식단', icon: 'restaurant', cls: 'diet' },
}

/** 홈 카드 순서 편집: 홈과 같은 2열 격자(식단은 1열 전체) 그대로 보여 주고, 카드를 아무 방향으로나 끌어 옮긴다(화살표·버튼 없음). 놓는 즉시 홈에 반영 */
function CardOrderSheet({ order, onClose }: { order: readonly HomeCardKind[]; onClose: () => void }) {
  const [draft, setDraft] = useState<HomeCardKind[]>([...order])
  const listRef = useRef<HTMLUListElement>(null)
  // 끄는 중: 어떤 카드를, 잡았을 때 카드 자리(목록 기준)와 크기, 지금 포인터 이동량
  const [drag, setDrag] = useState<{ kind: HomeCardKind; left: number; top: number; w: number; h: number; dx: number; dy: number } | null>(null)
  const dragRef = useRef<{ kind: HomeCardKind; startX: number; startY: number; armed: boolean; timer: number | null } | null>(null)

  const commit = (next: HomeCardKind[]) => {
    setDraft(next)
    setCardOrder(next) // 놓는 즉시 홈에 반영
  }
  const lift = (kind: HomeCardKind, el: HTMLElement, pointerId: number) => {
    const d = dragRef.current
    const list = listRef.current
    if (!d || !list) return
    d.armed = true
    try { navigator.vibrate?.(12) } catch { /* 지원 안 하는 기기 */ }
    const r = el.getBoundingClientRect()
    const lr = list.getBoundingClientRect()
    setDrag({ kind, left: r.left - lr.left, top: r.top - lr.top, w: r.width, h: r.height, dx: 0, dy: 0 })
    list.setPointerCapture?.(pointerId)
  }
  const onPointerDown = (kind: HomeCardKind, e: React.PointerEvent<HTMLElement>) => {
    if (e.button !== 0 && e.pointerType === 'mouse') return
    const el = e.currentTarget
    const d = { kind, startX: e.clientX, startY: e.clientY, armed: false, timer: null as number | null }
    dragRef.current = d
    lift(kind, el, e.pointerId) // 누르는 즉시 들린다 (격자 안에서는 스크롤이 없어 꾹 누를 필요 없음)
  }
  const onPointerMove = (e: React.PointerEvent) => {
    const d = dragRef.current
    if (!d) return
    const dx = e.clientX - d.startX
    const dy = e.clientY - d.startY
    if (!d.armed) {
      // 들리기 전에 많이 움직이면 드래그가 아니라 스크롤
      if (Math.hypot(dx, dy) > 8 && d.timer !== null) { window.clearTimeout(d.timer); dragRef.current = null }
      return
    }
    e.preventDefault()
    setDrag((cur) => (cur ? { ...cur, dx, dy } : cur))
    // 포인터가 다른 카드 위에 오면 그 자리로 바로 끼워 넣는다 (상하좌우 모두)
    const items = listRef.current?.querySelectorAll<HTMLElement>('.card-order-item:not(.ghost)') // 떠다니는 복사본은 자리 판정에서 뺀다
    if (!items) return
    const from = draft.indexOf(d.kind)
    for (let i = 0; i < items.length; i++) {
      if (i === from) continue
      const r = items[i].getBoundingClientRect()
      if (e.clientX >= r.left && e.clientX <= r.right && e.clientY >= r.top && e.clientY <= r.bottom) {
        if (i !== from) {
          const next = [...draft]
          next.splice(from, 1)
          next.splice(i, 0, d.kind)
          setDraft(next)
        }
        break
      }
    }
  }
  const onPointerEnd = () => {
    const d = dragRef.current
    dragRef.current = null
    if (!d) return
    if (d.timer !== null) window.clearTimeout(d.timer)
    if (!d.armed) return
    setDrag(null)
    setCardOrder(draft) // 끄는 동안 바뀐 순서를 홈에 반영
  }
  const reset = () => commit([...DEFAULT_CARD_ORDER])
  return (
    <div className="sheet-overlay" role="dialog" aria-modal="true" aria-labelledby="card-order-title">
      <button type="button" className="sheet-backdrop" aria-label="닫기" onClick={onClose} />
      <div className="sheet-panel card-order-sheet">
        <div className="sheet-handle" />
        <div className="sheet-top">
          <h2 id="card-order-title">카드 순서 편집</h2>
          <button type="button" className="icon-btn" aria-label="닫기" onClick={onClose}>
            <X size={20} weight="bold" />
          </button>
        </div>
        <p className="card-order-hint">홈과 같은 자리예요. 카드를 끌어서 원하는 자리에 놓아 보세요.</p>
        <ul
          ref={listRef}
          className={`card-order-list${drag ? ' dragging' : ''}`}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerEnd}
          onPointerCancel={onPointerEnd}
        >
          {draft.map((kind, i) => {
            const meta = HOME_CARD_META[kind]
            const isDrag = drag?.kind === kind
            const wide = kind === 'diet'
            return (
              <li
                key={kind}
                className={`card-order-item ${meta.cls}${wide ? ' wide' : ''}${isDrag ? ' placeholder' : ''}`}
                onPointerDown={(e) => onPointerDown(kind, e)}
                aria-label={`${meta.label}, ${i + 1}번째`}
              >
                <span className="card-order-head">
                  <i className="card-order-ico metric-ico" data-metric={kind}><Ri name={meta.icon} size={18} /></i>
                  <b>{meta.label}</b>
                </span>
                <span className="card-order-grip" aria-hidden="true"><i className="ri-draggable" /></span> {/* 끌 수 있다는 표시 (이 아이콘만 -line 접미사가 없어 Ri 대신 직접) */}
              </li>
            )
          })}
          {/* 끌리는 카드: 잡은 자리에서 포인터를 따라 떠다니는 복사본 (원래 자리는 점선 빈칸) */}
          {drag && (
            <li
              className={`card-order-item ghost ${HOME_CARD_META[drag.kind].cls}`}
              aria-hidden="true"
              style={{ left: drag.left + drag.dx, top: drag.top + drag.dy, width: drag.w, height: drag.h }}
            >
              <span className="card-order-head">
                <i className="card-order-ico metric-ico" data-metric={drag.kind}><Ri name={HOME_CARD_META[drag.kind].icon} size={18} /></i>
                <b>{HOME_CARD_META[drag.kind].label}</b>
              </span>
            </li>
          )}
        </ul>
        <div className="card-order-actions">
          <button type="button" className="card-order-reset" onClick={reset}>
            기본 순서로
          </button>
          <PrimaryButton onClick={onClose}>완료</PrimaryButton>
        </div>
      </div>
    </div>
  )
}



/** 군더더기 없는 7일 막대: 오늘만 진하게 + 값 말풍선 (참고 이미지 스타일) */


/** 0~100 바디 리듬 점수 → 5단계 상태 (브링 활동 지수 기준: 나쁨·주의·보통·좋음·최상) */
function statusFromScore(score: number) {
  const g = gradeOf(score)
  return { tone: g.tone, title: GRADE_COPY[g.label].short, level: g.label }
}


/** 포인트 지급 정책 (11/09 수정본 · 50~70대 기준) — 항목당 1일 1회, 설문은 월 1회 */
// 지급 기준 수치(STRESS_REWARD_MAX·WALK_REWARD_STEPS)는 components/PointGuide.tsx — 안내 시트와 같은 값을 쓴다
// 또래 평균(초기 스펙 참고값 39.98)은 실제 데이터가 없어 쓰지 않는다. 대신 내 최근 7일 평균을 보여준다
// 또래 평균 걸음 5,680 (스펙 참고값, 화면에는 미표시)
const STRESS_REWARD_P = 200_000
const DIET_REWARD_P = 200_000
const WALK_REWARD_P = 200_000
const SLEEP_REWARD_P = 200_000
const SURVEY_REWARD_P = 5_000_000

/** 홈 카드 상태 태그: 미완료(pending)는 회색, 완료·정상(ok)은 녹색 체크 */
function StatusTag({ tone, children }: { tone: 'ok' | 'mid' | 'low' | 'pending' | 'done'; children: ReactNode }) {
  return (
    <span className={`elder-menu-tag ${tone}`}>
      {(tone === 'ok' || tone === 'done') && <Ri name="checkbox-circle" fill size={14} />}
      {children}
    </span>
  )
}
function formatClaimP(points: number) {
  return points % 10_000 === 0 ? `${(points / 10_000).toLocaleString('ko-KR')}만 P` : `${points.toLocaleString('ko-KR')} P`
}

/** 스트레스 지수 등급 — 낮을수록 좋음 */
/** 홈 카드용: 마지막 기록이 2시간 넘게 지났을 때만 "n시간 전 기록" (평소엔 시각을 보여 주지 않는다 — 오래됐다는 신호만) */
const STALE_MIN = 120
function staleLabel(time: string | undefined): string | null {
  if (!time) return null
  const [h, m] = time.split(':').map(Number)
  const now = new Date()
  const diff = now.getHours() * 60 + now.getMinutes() - (h * 60 + m)
  if (diff < STALE_MIN) return null
  return `${Math.floor(diff / 60)}시간 전 기록`
}

function stressLevel(score: number) {
  if (score <= 20) return { label: '매우 낮음', tone: 'ok' as const }
  if (score <= 40) return { label: '낮음', tone: 'ok' as const }
  if (score <= 60) return { label: '보통', tone: 'warn' as const }
  if (score <= 80) return { label: '높음', tone: 'bad' as const }
  return { label: '매우 높음', tone: 'bad' as const }
}



/** 홈 맨 위 '오늘의 미션' 카드 — 토마톡 게임 탭의 미션 카드와 같은 형식(문장 + 도장 체크 5개 + n/5).
 *  토마톡 링만의 차별점(건강 확인 = 포인트)을 첫 화면에서, 메신저 쪽과 같은 모양으로 보여준다 */
const POINT_ITEMS: readonly { kind: MissionCardKind; label: string; points: number; Icon: Icon }[] = [
  { kind: 'stress', label: '스트레스', points: STRESS_REWARD_P, Icon: Brain },
  { kind: 'diet', label: '식단', points: DIET_REWARD_P, Icon: ForkKnife },
  { kind: 'walk', label: '걷기', points: WALK_REWARD_P, Icon: Footprints },
  { kind: 'sleep', label: '수면', points: SLEEP_REWARD_P, Icon: Moon },
  { kind: 'survey', label: '설문', points: SURVEY_REWARD_P, Icon: ClipboardText },
]
function TodayMissionCard({ claimed, ready, onItem }: { claimed: Record<MissionCardKind, boolean>; /** 지금 바로 받을 수 있는 항목 */ ready: Record<MissionCardKind, boolean>; onItem: (kind: MissionCardKind) => void }) {
  const doneCount = POINT_ITEMS.filter((it) => claimed[it.kind]).length
  const leftCount = POINT_ITEMS.length - doneCount
  const got = POINT_ITEMS.filter((it) => claimed[it.kind]).reduce((acc, it) => acc + it.points, 0)
  const left = POINT_ITEMS.filter((it) => !claimed[it.kind]).reduce((acc, it) => acc + it.points, 0)
  return (
    <section className={`elder-mission-card ${leftCount === 0 ? 'done' : ''}`} aria-label="오늘의 미션">
      {leftCount === 0 ? (
        <div className="elder-mission-done">
          <Ri name="checkbox-circle" fill size={22} />
          <b>미션을 모두 완료했어요</b>
          <span>{formatClaimP(got)} 획득</span>
        </div>
      ) : (
        // 게임 탭 광고 미션 카드와 같은 문장: "N개만 더 하면 X 획득" (숫자는 버튼과 같은 '40만 P' 표기)
        <p className="elder-mission-say">
          {leftCount}개만 더 하면 <b>{formatClaimP(left)} 획득</b>
        </p>
      )}
      <div className="elder-mission-row">
        <ul className="elder-mission-list">
          {POINT_ITEMS.map((it) => {
            const done = claimed[it.kind]
            const state = done ? '받음' : ready[it.kind] ? '받기 가능' : '조건 남음'
            return (
              <li key={it.kind} className={done ? 'done' : ready[it.kind] ? 'ready' : ''}>
                <button type="button" onClick={() => onItem(it.kind)} aria-label={`${it.label} ${state}`}>
                  <span className="elder-mission-seal">
                    <Seal size={44} weight="fill" />
                    {/* 도장 안은 항목 아이콘만 (체크 없음). 상태는 도장 색으로만: 초록 = 받기 가능(누를 것), 회색 = 받음, 연회색 = 조건 남음 */}
                    <it.Icon size={20} weight="fill" />
                  </span>
                  <b>{it.label}</b>
                </button>
              </li>
            )
          })}
        </ul>
      </div>
      {/* 도장 아래 n/5 카운터 (게임 탭과 같은 자리) */}
      {leftCount > 0 && <div className="elder-mission-count">{doneCount}/{POINT_ITEMS.length}</div>}
    </section>
  )
}


/** 홈 '이상 징후' 카드 — 브링 판정이 '감지'인 날에만 홈에 나온다. 컨디션 체크(좋아요·보통·안 좋아요)를 받는다.
 *  토마토 연한 배경은 이 카드에만 쓴다 (홈에서 빨강 계열을 쓰는 유일한 자리). 평소와 비슷·준비 중 상태는 상세 화면에서만 본다 */
export const CONDITION_OPTIONS: readonly { id: ConditionAnswer; label: string; icon: string; advice: string }[] = [
  { id: 'good', label: '좋아요', icon: 'emotion-happy', advice: '지금처럼 좋은 생활 리듬을 유지해 보세요.' },
  { id: 'so-so', label: '보통이에요', icon: 'emotion-normal', advice: '가벼운 활동과 휴식으로 하루의 균형을 맞춰 보세요.' },
  { id: 'bad', label: '안 좋아요', icon: 'emotion-unhappy', advice: '오늘은 무리하지 말고 쉬어 주세요. 불편함이 계속되면 전문가와 상의해 보세요.' },
]
function SignalCard({ condition, onOpen, onCondition }: {
  condition: ConditionAnswer | null
  onOpen: () => void
  onCondition: (a: ConditionAnswer | null) => void
}) {
  const picked = condition ? CONDITION_OPTIONS.find((o) => o.id === condition) : null
  return (
    <div className="elder-signal-card detected">
      <button type="button" className="elder-signal-row" onClick={onOpen} aria-label="이상 징후 자세히 보기">
        <Ri name="siren" fill />
        <b>이상 징후</b>
        <StatusTag tone="low">감지</StatusTag>
        <Ri name="arrow-right-s" size={20} className="elder-signal-arrow" />
      </button>
      <p className="elder-signal-say">어제에 이어 몸이 평소 같지 않아요</p>
      <p className="elder-signal-q">오늘 컨디션은 어떤가요?</p>
      <div className="elder-signal-options">
        {CONDITION_OPTIONS.map((o) => (
          <button key={o.id} type="button" className={condition === o.id ? 'on' : ''} onClick={() => onCondition(o.id)} aria-pressed={condition === o.id}>
            <Ri name={o.icon} fill={condition === o.id} size={26} />
            <b>{o.label}</b>
          </button>
        ))}
      </div>
      <p className="elder-signal-advice">{picked ? picked.advice : '오늘은 쉬는 시간을 조금 더 가져 보세요.'}</p>
    </div>
  )
}

/** 점수 + 이상 바이탈을 반영한 오늘 종합 요약 (무지개) — 요약 전용, 보상 없음 */
/** 바디 리듬 준비 중: 유효한 날이 7일 미만일 때 점수 대신 진행 상태 */
function RhythmCollecting({ days, onOpen }: { days: number; onOpen: () => void }) {
  return (
    <div className="elder-score-card arc rhythm-collecting">
      <button type="button" className="rhythm-collecting-body" onClick={onOpen}>
        <span className="rhythm-days" aria-label={`${RHYTHM_MIN_DAYS}일 중 ${days}일`}>
          {Array.from({ length: RHYTHM_MIN_DAYS }, (_, i) => <i key={i} className={i < days ? 'on' : ''} />)}
        </span>
        <strong>{days}<small>/ {RHYTHM_MIN_DAYS}일</small></strong>
        <b>바디 리듬을 준비하고 있어요</b>
        <p>반지를 끼고 자면 수면 기록이 쌓여요.</p>
      </button>
    </div>
  )
}

function TodayScoreCard({
  score,
  tiles,
  deviceStatus,
  onOpen,
}: {
  score: number
  tiles: readonly { label: string; tone: 'ok' | 'warn' | 'bad' }[]
  deviceStatus: ReactNode
  onOpen: () => void
}) {
  const byScore = statusFromScore(score)
  const alert = tiles.find((t) => t.tone === 'bad') ?? tiles.find((t) => t.tone === 'warn')
  const status = alert
    ? {
        tone: alert.tone,
        title: alert.tone === 'bad' ? `${alert.label} 위험` : `${alert.label} 주의`,
      }
    : byScore

  return (
    <div className={`elder-score-card arc ring tone-${status.tone}`}>
      {deviceStatus ? <div className="elder-device-status">{deviceStatus}</div> : null}
      {/* 단색 링 안에 점수와 한 줄 상태 (무지개 반원·나쁨/보통/최상 눈금은 뺌) */}
      <button type="button" className="elder-score-gauge" onClick={onOpen} aria-label="바디 리듬 자세히 보기">
        <span className="elder-score-ringwrap">
          <TodayScoreArc score={score} />
          <span className="elder-score-center">
            <strong>
              {score}
              <small>점</small>
            </strong>
            <b>오늘 {status.title}</b>
          </span>
        </span>
      </button>
      <button type="button" className="elder-score-open-btn" onClick={onOpen}>
        자세히 보기
        <Ri name="arrow-right-s" size={14} />
      </button>
    </div>
  )
}

/** 카드 하단 보상 영역: 당일만 지급, 측정 전 → 측정 버튼, 측정 후 기준 충족 → 지급 버튼, 수령 후 → 비활성 완료 */
function RewardBlock({
  measured,
  claimed,
  eligible = true,
  guide,
  points,
  measureLabel,
  /** 여러 번 할 수 있는 항목: 버튼 아래 작은 링크 문구 */
  repeatLabel,
  readyText,
  doneLabel,
  tip,
  onMeasure,
  onClaim,
  busy = false,
  busyLabel = '측정 중',
  busyMs = 3000,
}: {
  measured: boolean
  claimed: boolean
  eligible?: boolean
  guide: string
  /** 버튼에 함께 보여줄 지급 포인트 (예: '20만 P') */
  points: string
  measureLabel: string
  repeatLabel?: string
  readyText: string
  doneLabel: string
  tip?: string
  onMeasure: () => void
  onClaim: () => void
  /** 카드 안에서 측정/불러오기 진행 중 */
  busy?: boolean
  busyLabel?: string
  /** 진행 그래프가 차오르는 시간 */
  busyMs?: number
}) {
  const navigate = useNavigate()
  if (busy) {
    return (
      <div className="elder-score-reward">
        <button type="button" className="elder-claim-btn busy" disabled style={{ ['--busy-ms' as string]: `${busyMs}ms` }}>
          <Ri name="loader-4" size={18} className="spin" />
          <span>{busyLabel}</span>
        </button>
        <p className="elder-claim-guide under">측정이 끝나면 결과를 보여드려요.</p>
      </div>
    )
  }
  return (
    <div className="elder-score-reward">
      {!measured ? (
        <>
          <button type="button" className="elder-claim-btn secondary with-points" onClick={onMeasure}>
            <span>{measureLabel} {points} 받기</span>
          </button>
          <p className="elder-claim-guide under">{guide}</p>
        </>
      ) : claimed ? (
        <>
          {/* 받은 뒤: 회색 알약을 누르면 보상 내역으로. 카드마다 '적립 내역 보기' 버튼을 따로 두지 않는다 (입구는 미션 머리글의 보상내역) */}
          <button type="button" className="elder-claim-btn done link" onClick={() => navigate('/reward/history')} aria-label={`${doneLabel} · 보상 내역 보기`}>
            <Ri name="checkbox-circle" fill size={18} />
            {doneLabel}
            <Ri name="arrow-right-s" size={18} className="elder-claim-done-arrow" />
          </button>
          {repeatLabel && (
            <div className="elder-claim-actions">
              <button type="button" onClick={onMeasure}>
                <Ri name={repeatLabel.includes('올리기') ? 'add' : 'refresh'} size={16} />
                {repeatLabel}
              </button>
            </div>
          )}
        </>
      ) : eligible ? (
        <>
          <button type="button" className="elder-claim-btn with-points" onClick={onClaim}>
            <Ri name="checkbox-circle" fill size={18} />
            <span>{readyText ? `${readyText} · ` : ''}{points} 받기</span>
          </button>
          {repeatLabel && (
            <div className="elder-claim-actions">
              <button type="button" onClick={onMeasure}>
                <Ri name={repeatLabel.includes('올리기') ? 'add' : 'refresh'} size={16} />
                {repeatLabel}
              </button>
            </div>
          )}
        </>
      ) : (
        <p className="elder-claim-tip">
          <Ri name="heart-3" fill size={12} />
          {tip}
        </p>
      )}
    </div>
  )
}

type HomeProfile = (typeof TEAM_HOME)[keyof typeof TEAM_HOME]

/** 오늘 기준 홈 데이터 (7일 창은 오늘로 끝남) */
function homeDataFor(profile: HomeProfile) {
  const labels = Array.from({ length: 7 }, (_, i) => WEEKDAYS_KO[addDays(HOME_TODAY, i - 6).getDay()])
  // 스트레스는 측정 기록이 생기기 전에는 오늘·이전 날 모두 비어 있다
  const stress = Array.from({ length: 7 }, () => 0)
  return {
    labels,
    score: dayBundle(HOME_TODAY).score,
    stress,
    steps: profile.stepsWeek as readonly number[],
    sleepHours: profile.sleepWeek.hours as readonly number[],
    efficiency: profile.sleepWeek.efficiency,
    latestLabel: profile.sleepWeek.latestLabel,
    dietKcal: profile.diet.kcal,
    dietCount: profile.diet.count,
  }
}

function DietUploadCard({
  kcal,
  goal,
  photo,
  measured,
  claimed,
  onOpen,
  onMeasure,
  onClaim,
}: {
  kcal: number
  goal: number
  photo?: string | null
  measured: boolean
  claimed: boolean
  /** 카드 탭 → 식단 상세 보기 */
  onOpen: () => void
  /** 버튼 → 상세에서 바로 사진 올리기 */
  onMeasure: () => void
  onClaim: () => void
}) {
  const shown = measured ? kcal : 0
  return (
    <div className="elder-fit-card diet">
      <button type="button" className="elder-card-hit" onClick={onOpen} aria-label="식단">
        <div className="elder-fit-head" data-metric="diet">
          <Ri name="restaurant" fill className="metric-ico" />
          <b>식단</b>
          <StatusTag tone={measured ? 'done' : 'pending'}>{measured ? '기록 완료' : '등록 전'}</StatusTag>
        </div>
        <div className="elder-fit-body">
          {measured ? (
            <>
              {/* 홈은 kcal·목표 + 마지막 사진 한 장만 (오늘 올린 사진 전부와 식사 목록은 상세에서) */}
              <div className="home-diet-row">
                <div className="elder-fit-num">
                  <div>
                    <strong>{shown.toLocaleString('ko-KR')}<small>kcal</small></strong>
                    <em>목표 {goal.toLocaleString('ko-KR')}kcal</em>
                  </div>
                </div>
                {photo && <span className="home-diet-photo"><img src={photo} alt="오늘 마지막 식단 사진" /></span>}
              </div>
            </>
          ) : (
            <button type="button" className="diet-drop" onClick={onMeasure} aria-label="식단 사진 올리기">
              <Ri name="restaurant" size={30} />
              <span>오늘 식단 사진이 없어요</span>
              <em>식사 사진을 올려 보세요.</em>
            </button>
          )}
        </div>
      </button>
      <RewardBlock
        measured={measured}
        claimed={claimed}
        guide="식단 사진 등록 시 지급 · 하루 1회"
        points={formatClaimP(DIET_REWARD_P)}
        measureLabel="사진 올리고"
        repeatLabel="사진 더 올리기"
        readyText=""
        doneLabel={`오늘 ${formatClaimP(DIET_REWARD_P)} 획득`}
        onMeasure={onMeasure}
        onClaim={onClaim}
      />
    </div>
  )
}

/** 홈 바이탈 4종 — 최신 자동 측정값과 상태 한 단어 */
/** 지난밤 수면 타임라인 — 취침~기상 시간축 위에 단계를 색으로. 홈용이라 숫자는 시작·끝 시각만 */
const HOME_VITALS = [
  { id: 'hr', label: '심박수', value: 72, unit: 'bpm', icon: 'heart-pulse', color: METRIC_STYLE.hr.color, soft: METRIC_STYLE.hr.soft, week: [68, 71, 74, 70, 73, 69, 72] },
  { id: 'spo2', label: '혈중 산소', value: 98, unit: '%', icon: 'drop', color: METRIC_STYLE.spo2.color, soft: METRIC_STYLE.spo2.soft, week: [97, 98, 96, 98, 97, 98, 98] },
  { id: 'temp', label: '피부 온도', value: 36.6, unit: '°C', icon: 'temp-hot', color: METRIC_STYLE.temp.color, soft: METRIC_STYLE.temp.soft, week: [36.4, 36.5, 36.6, 36.7, 36.5, 36.6, 36.6] },
  { id: 'hrv', label: '심박변이도', value: 42, unit: 'ms', icon: 'pulse', color: METRIC_STYLE.hrv.color, soft: METRIC_STYLE.hrv.soft, week: [40, 38, 45, 41, 44, 39, 42] },
] as const

/** 아주 작은 7일 선 그래프 (홈 바이탈 칸용) — 축·눈금 없이 흐름만, 마지막 점은 오늘 */
function Spark({ values, color, width = 60, height = 26, skipZero = false, fluid = false, avg = false }: { values: readonly number[]; color: string; width?: number; height?: number; /** 0을 '기록 없음'으로 보고 건너뜀 (스트레스처럼 안 잰 날이 있는 항목) */ skipZero?: boolean; /** 담긴 칸의 폭에 맞춰 가로로 늘림 (홈 2열 카드). 선 굵기·점은 늘어나지 않게 non-scaling-stroke */ fluid?: boolean; /** 기록 있는 값들의 평균을 가로 점선으로 */ avg?: boolean }) {
  const pts = values.map((v, i) => ({ i, v, on: !skipZero || v > 0 }))
  const nums = pts.filter((p) => p.on).map((p) => p.v)
  const min = Math.min(...nums)
  const max = Math.max(...nums)
  const span = Math.max(0.0001, max - min)
  const padY = 4
  const x = (i: number) => (values.length < 2 ? width / 2 : 3 + ((width - 6) * i) / (values.length - 1))
  const y = (v: number) => height - padY - ((v - min) / span) * (height - padY * 2)
  // 기록 있는 점끼리만 선으로 잇는다 (빈 날은 끊김)
  const d = pts.map((p, i) => (!p.on ? '' : `${i === 0 || !pts[i - 1].on ? 'M' : 'L'} ${x(i).toFixed(1)} ${y(p.v).toFixed(1)}`)).filter(Boolean).join(' ')
  const lastOn = [...pts].reverse().find((p) => p.on)
  const mean = nums.length ? nums.reduce((a, b) => a + b, 0) / nums.length : null
  // fluid 모드에선 가로만 늘어나므로 원(circle)이 타원이 됨 → 점은 길이 0의 둥근 선으로 그려 굵기로 크기를 잡는다
  const ve = fluid ? ('non-scaling-stroke' as const) : undefined
  const dot = (cx: number, cy: number, r: number, key?: number | string, op = 1) =>
    fluid
      ? <path key={key} d={`M ${cx.toFixed(1)} ${cy.toFixed(1)} l 0 0`} stroke={color} strokeOpacity={op} strokeWidth={r * 2} strokeLinecap="round" vectorEffect={ve} />
      : <circle key={key} cx={cx} cy={cy} r={r} fill={color} fillOpacity={op} />
  return (
    <svg className="home-vital-spark" viewBox={`0 0 ${width} ${height}`} width={fluid ? '100%' : width} height={height} preserveAspectRatio={fluid ? 'none' : undefined} aria-hidden>
      {/* 평균 점선: 선 아래에 깔아 값 선이 위로 */}
      {avg && mean != null && nums.length > 1 && <line x1={0} x2={width} y1={y(mean).toFixed(1)} y2={y(mean).toFixed(1)} stroke={color} strokeOpacity="0.45" strokeWidth="1" strokeDasharray="3 3" vectorEffect={ve} />}
      <path d={d} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" strokeOpacity="0.9" vectorEffect={ve} />
      {pts.map((p, i) => (p.on && !(pts[i - 1]?.on) && !(pts[i + 1]?.on) && p !== lastOn ? dot(x(i), y(p.v), 2, i, 0.9) : null))}
      {lastOn && dot(x(lastOn.i), y(lastOn.v), 3)}
    </svg>
  )
}

/** 시간대별 세로 막대 (홈 걷기 카드, 그래프 자리 전체 폭). 24칸, 값 없는 시간은 바닥에 연한 눈금만 */
function HourBars({ values, color, height = 36 }: { values: readonly number[]; color: string; height?: number }) {
  const width = 170
  const n = values.length
  const gap = 2
  const bw = (width - gap * (n - 1)) / n
  const max = Math.max(1, ...values)
  return (
    <svg className="home-vital-spark" viewBox={`0 0 ${width} ${height}`} width="100%" height={height} preserveAspectRatio="none" aria-hidden>
      {values.map((v, i) => {
        const x = i * (bw + gap)
        const h = v > 0 ? Math.max(3, (v / max) * (height - 2)) : 2
        return <rect key={i} x={x.toFixed(2)} y={(height - h).toFixed(2)} width={bw.toFixed(2)} height={h.toFixed(2)} rx={1} fill={color} fillOpacity={v > 0 ? 0.9 : 0.18} />
      })}
    </svg>
  )
}

const TEAM_HOME = {
  me: {
    todayScore: 85,
    tiles: [
      { id: 'hr', label: '심박수', value: 72, display: '72', unit: '회/분', max: 200, tone: 'ok' as const, ...VITAL_COLORS.hr, Icon: Heart },
      { id: 'spo2', label: '혈중 산소', value: 95, display: '95', unit: '%', max: 100, tone: 'ok' as const, ...VITAL_COLORS.spo2, Icon: Drop },
      { id: 'temp', label: '피부 온도', value: 36.4, display: '36.4', unit: '°C', max: 45, tone: 'ok' as const, ...VITAL_COLORS.temp, Icon: Thermometer },
      { id: 'hrv', label: '심박변이도', value: 42, display: '42', unit: 'ms', max: 100, tone: 'ok' as const, ...VITAL_COLORS.resp, Icon: Wind },
    ],
    sleepWeek: {
      days: ['월', '화', '수', '목', '금', '토', '일'],
      hours: [6.8, 7.1, 5.9, 7.4, 6.5, 8.0, 7.2],
      latestLabel: '7시간 12분',
      efficiency: 84,
      stages: [
        { name: '깊은', pct: 28, color: SLEEP_COLORS.stages.deep },
        { name: '렘', pct: 22, color: SLEEP_COLORS.stages.rem },
        { name: '얕은', pct: 40, color: SLEEP_COLORS.stages.light },
        { name: '깸', pct: 10, color: SLEEP_COLORS.stages.awake },
      ],
    },
    stressWeek: {
      days: ['월', '화', '수', '목', '금', '토', '일'],
      scores: [0, 0, 0, 0, 0, 0, 0],
    },
    stepsWeek: [6_120, 7_340, 5_980, 8_010, 6_650, 9_120, 8_412],
    diet: { kcal: 1_120, goal: 2_300, count: 2, weekDone: [true, true, false, true, true, true] as readonly boolean[] },
    activityDay: {
      score: 53,
      stepsCount: 8_412,
      steps: '8,412',
      bars: Array.from({ length: 72 }, (_, i) => {
        if (i < 18) return ACTIVITY_COLORS.states.sleep
        if (i < 22) return ACTIVITY_COLORS.states.off
        if (i < 28) return ACTIVITY_COLORS.states.rest
        if (i < 40) return ACTIVITY_COLORS.states.active
        if (i < 44) return ACTIVITY_COLORS.states.charge
        if (i < 52) return ACTIVITY_COLORS.states.active
        if (i < 58) return ACTIVITY_COLORS.states.rest
        if (i < 64) return ACTIVITY_COLORS.states.sleep
        return ACTIVITY_COLORS.states.unknown
      }),
      legend: ACTIVITY_LEGEND,
    },
    device: { batteryFull: true, battery: 78, wearing: true, linkMode: 'on' as const },
  },

} as const

/** 반지 배터리 표시 단계 — 못 읽음 / 충전 중(번개) / 비었음(≤5, 빈 아이콘) / 낮음(≤20) / 중간(≤60) / 높음(≤90) / 가득. 20% 이하는 토마토색. 글자는 숫자만 (날짜 줄이 두 줄로 꺾이지 않게) */
function batteryView(level: number | null, charging = false): { icon: string; text: string; tone: 'none' | 'low' | 'ok' } {
  if (level === null) return { icon: 'battery-warning', text: '확인 안 됨', tone: 'none' }
  if (charging) return { icon: 'battery-charging', text: `${level}%`, tone: 'ok' }
  if (level <= 5) return { icon: 'battery-empty', text: `${level}%`, tone: 'low' }
  if (level <= 20) return { icon: 'battery-low', text: `${level}%`, tone: 'low' }
  if (level <= 60) return { icon: 'battery-medium', text: `${level}%`, tone: 'ok' }
  if (level <= 90) return { icon: 'battery-high', text: `${level}%`, tone: 'ok' }
  return { icon: 'battery-full', text: `${level}%`, tone: 'ok' }
}

export function HomeScreen() {
  const navigate = useNavigate()
  const session = useSession()
  const [orderOpen, setOrderOpen] = useState(false)
  const activeMember = 'me' as const
  const profile = TEAM_HOME[activeMember]
  const device = profile.device
  // 배터리: 시연값이 있으면 그 값, 없으면 샘플 기기 값
  const bd = session.batteryDemo
  const battery = batteryView(bd === 'none' ? null : bd === 'charging' || bd === null ? device.battery : bd, bd === 'charging')

  // 반지 기록 불러오기 — 브링처럼 세 가지로 갱신: 홈에 들어올 때 자동, 아래로 당겨서, 배터리 옆 버튼
  // 카드별 '재기': 지표마다 따로 잰다 — 실제 SDK도 심박수·혈중 산소·심박변이도·피부 온도를 각각 재고, 스트레스는 심박변이도에서 계산된다.
  // 목업은 몇 초 뒤 값이 나오는 흉내. 끝나면 방금 잰 값 하나를 모달로 (브링처럼). 스트레스는 측정 전이면 '측정 완료'로 바뀌어 받기 버튼이 뜬다
  const [busyTile, setBusyTile] = useState<MeasureTileKind | null>(null)
  const [vitalNow, setVitalNow] = useState<Partial<Record<'hr' | 'spo2' | 'temp' | 'hrv', number>>>({})
  const [result, setResult] = useState<ResultRow | null>(null)
  const measureTile = (kind: MeasureTileKind) => {
    if (busyTile) return
    setBusyTile(kind)
    window.setTimeout(() => {
      const j = (base: number, spread: number, digits: number) => Number((base + (Math.sin(Date.now() / 997) * spread)).toFixed(digits))
      if (kind === 'stress') {
        // 직접 측정: 오늘 기록에 값 하나 추가 (자동 기록과 나란히 쌓임). 25~45 사이 샘플 (시각 기반 흔들림)
        addStressReading(25 + (Math.floor(Date.now() / 1000) % 21))
        const v = dayLog('stress', new Date())[0]?.value ?? 0
        const st = stressLevel(v)
        setResult({ kind: 'stress', label: '스트레스', icon: 'brain', value: v, unit: '점', tone: st.tone === 'ok' ? 'ok' : st.tone === 'warn' ? 'mid' : 'low', status: st.label })
      } else {
        const sample = { hr: j(72, 4, 0), spo2: Math.min(99, j(98, 1, 0)), temp: j(36.6, 0.2, 1), hrv: j(42, 4, 0) }
        const v = sample[kind]
        const meta = HOME_VITALS.find((x) => x.id === kind)!
        setVitalNow((prev) => ({ ...prev, [kind]: v }))
        const st = vitalStatus(kind, v)
        setResult({ kind, label: meta.label, icon: meta.icon, value: v, unit: meta.unit, tone: st.tone, status: st.label })
      }
      setBusyTile(null)
    }, MEASURE_MS[kind])
  }
  const [syncing, setSyncing] = useState(false)
  const [toast, setToast] = useState<string | null>(null)
  const [pull, setPull] = useState(0)
  const pullStart = useRef<number | null>(null)
  const scrollRef = useRef<HTMLDivElement>(null)
  const PULL_TRIGGER = 56
  const runSync = () => {
    if (syncing) return
    setSyncing(true)
    window.setTimeout(() => {
      setSyncing(false)
      setToast('반지 기록을 불러왔어요')
      window.setTimeout(() => setToast(null), 1600)
    }, 1200)
  }
  useEffect(() => {
    if (session.paired) runSync()
    // 홈에 들어올 때 한 번
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
  const onPullStart = (y: number) => {
    const el = scrollRef.current
    if (!el || el.scrollTop > 0 || syncing) return
    pullStart.current = y
  }
  const onPullMove = (y: number) => {
    if (pullStart.current === null) return
    const dy = y - pullStart.current
    if (dy <= 0) { setPull(0); return }
    setPull(Math.min(80, dy * 0.5))
  }
  const onPullEnd = () => {
    if (pullStart.current === null) return
    pullStart.current = null
    if (pull >= PULL_TRIGGER) runSync()
    setPull(0)
  }

  if (!session.onboarded) return <Navigate to="/vitaling/terms" replace />

  const tiles = profile.tiles
  // 홈은 항상 오늘 기준. 지난 날짜는 상세 화면에서 본다
  const day = homeDataFor(profile)
  // 스트레스 7일: 상세 화면과 같은 기록(dayLog, 자동+직접)에서 하루 평균 (오늘은 기록이 아직 없으면 0)
  // 지난 날은 하루 평균, 오늘은 마지막 기록값 (상세 히어로와 같은 기준)
  const stressSeries = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(); d.setDate(d.getDate() - (6 - i))
    const rs = dayLog('stress', d)
    if (!rs.length) return 0
    return i === 6 ? rs[0].value : Math.round(rs.reduce((acc, r) => acc + r.value, 0) / rs.length)
  })
  const stressSel = stressSeries[stressSeries.length - 1]
  // 내 평균: 오늘을 뺀 최근 6일 중 기록 있는 날의 평균
  // 오늘 잰 값들을 시간순으로 (dayLog은 최신이 먼저라 뒤집음) — 홈 카드 오른쪽 위 작은 그래프용. 7일 흐름은 상세에서만
  const stressLog = dayLog('stress', new Date())
  const stressToday = stressLog.map((r) => r.value).reverse()
  const stressInfo = stressLevel(stressSel)
  // 정책: 하루 중 30점 이하 기록이 한 번이라도 있으면 그날 1회 지급 (자동·직접 구분 없음)
  const stressEligible = stressToday.some((v) => v <= STRESS_REWARD_MAX)
  const stressStale = busyTile === 'stress' ? null : staleLabel(stressLog[0]?.time)

  const stepsSel = day.steps[day.steps.length - 1]
  const stepsLabel = stepsSel.toLocaleString('ko-KR')
  const walkEligible = stepsSel >= WALK_REWARD_STEPS
  // 측정 완료·수령 여부는 세션에 날짜와 함께 저장 (00:00 지나면 자동 초기화, 화면 재진입에도 유지)
  // 스트레스는 자동 기록이 있으면 바로 값·그래프 표시 (직접 측정은 선택), 지난 날짜는 기록 그대로 표시
  const dietMeasured = isMeasureDone(session, 'diet')
  const surveyMeasured = isMeasureDone(session, 'survey')
  const stressClaimed = isClaimed(session, 'stress')
  const dietClaimed = isClaimed(session, 'diet')
  const walkClaimed = isClaimed(session, 'walk')
  const sleepClaimed = isClaimed(session, 'sleep')
  const surveyClaimed = isClaimed(session, 'survey')
  const stressShow = stressSel > 0
  const sleepShow = day.sleepHours[day.sleepHours.length - 1] > 0
  /** 카드 탭 → 상세 보기(start=false), 측정 버튼 → 상세에서 바로 측정 시작(start=true, run=1) */
  /** 포인트 카드의 항목을 누르면 홈의 해당 카드로 스크롤 (카드가 없으면 상세로) */
  const CARD_CLASS: Record<MissionCardKind, string> = { stress: 'stress', diet: 'diet', walk: 'walk', sleep: 'sleep', survey: 'survey' }
  const focusCard = (kind: MissionCardKind) => {
    const el = document.querySelector<HTMLElement>(`.elder-home .elder-fit-card.${CARD_CLASS[kind]}`)
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' })
      el.classList.add('flash')
      window.setTimeout(() => el.classList.remove('flash'), 1200)
    } else {
      goMeasure(kind)
    }
  }
  const goMeasure = (kind: MeasureKind, start = false) => {
    const run = start ? '?run=1' : ''
    if (kind === 'sleep') {
      navigate(`/vitaling/sleep${run}`)
      return
    }
    if (kind === 'survey') {
      navigate('/vitaling/survey')
      return
    }
    navigate(`/vitaling/measure/${kind}${run}`)
  }

  /** 2열 작은 카드 한 장 — 아이콘·이름 / 값 / 상태·보조 줄 / 그래프(카드 전체 폭) / 아래 받기 버튼. 세로로 쌓아 숫자가 숨 쉬고 그래프는 흐름이 읽히게. 오른쪽 위 모서리엔 작은 원형 측정 버튼이나 자동 기록 표시. 누르면 상세 */
  const tile = (kind: HomeCardKind, label: string, icon: string, value: ReactNode, state: ReactNode, spark: ReactNode, onOpen: () => void, action: ReactNode = null, corner: ReactNode = null) => (
    <div key={kind} className={`elder-fit-card tile ${kind}`}>
      {/* 위쪽(이름·값·상태·그래프)을 누르면 상세 */}
      <button type="button" className="home-tile-hit" onClick={onOpen} aria-label={label}>
        <span className="home-vital-head">
          <span className="home-vital-ico metric-ico" data-metric={kind}><Ri name={icon} fill size={18} /></span>
          <em>{label}</em>
        </span>
        <span className="home-vital-copy home-vital-value">{value}</span>
        <span className="home-vital-copy home-vital-state">{state}</span>
        {/* 그래프 자리는 비어 있어도(측정 전·설문) 높이를 잡아 옆 카드와 버튼 줄을 맞춘다 */}
        <span className="home-vital-graph">{spark}</span>
      </button>
      {/* 오른쪽 위: 재기(원형 아이콘)·자동 기록 표시 — 버튼 안에 버튼이 못 들어가서 카드에 따로 얹는다 */}
      {corner && <div className="home-tile-corner">{corner}</div>}
      {/* 포인트가 걸린 카드는 조건이 되면 큰 받기 버튼 (받기는 눈에 띄어야 해서 크게 유지) */}
      {action && <div className="home-tile-action">{action}</div>}
    </div>
  )
  // 재기는 걷기·수면의 '자동' 알약과 같은 크기의 알약 버튼: 작은 아이콘 + '측정' (2열 카드 폭에서 '측정하기'는 '심박변이도' 같은 긴 이름을 덮음). 재는 동안은 아이콘만 돌아가는 것으로 바뀜
  const measureBtn = (kind: MeasureTileKind) =>
    busyTile === kind ? (
      <button type="button" className="home-tile-measure busy" disabled aria-label="재는 중" style={{ ['--busy-ms' as string]: `${MEASURE_MS[kind]}ms` }}>
        <Ri name="loader-4" size={12} className="spin" />
        측정
      </button>
    ) : (
      <button type="button" className="home-tile-measure" onClick={() => measureTile(kind)} disabled={busyTile !== null} aria-label="측정하기" title="측정하기">
        <Ri name="play" fill size={12} />
        측정
      </button>
    )
  const claimBtn = (kind: MissionCardKind, points: number) => (
    <button type="button" className="elder-claim-btn with-points" onClick={() => markClaimed(kind)}>
      <Ri name="checkbox-circle" fill size={16} />
      <span>{formatClaimP(points)} 받기</span>
    </button>
  )
  /** 포인트가 걸린 카드는 버튼 자리를 늘 유지: 조건 전엔 회색 비활성, 받은 뒤엔 회색 '획득 완료' (카드 높이·줄이 흔들리지 않게) */
  const lockedBtn = (points: number) => (
    <button type="button" className="elder-claim-btn with-points locked" disabled>
      <span>{formatClaimP(points)} 받기</span>
    </button>
  )
  const doneBtn = (points: number) => (
    <button type="button" className="elder-claim-btn done" disabled>
      <Ri name="checkbox-circle" fill size={16} />
      <span>{formatClaimP(points)} 획득</span>
    </button>
  )
  /** 포인트 카드 버튼 한 자리: 받음 → 받을 수 있음 → 조건 전 */
  const pointBtn = (kind: MissionCardKind, points: number, claimed: boolean, eligible: boolean) =>
    claimed ? doneBtn(points) : eligible ? claimBtn(kind, points) : lockedBtn(points)
  /** 걷기·수면은 반지가 자동으로 재니 재기 버튼 자리에 '자동' 표시 (불러오기는 날짜 줄의 동기화 하나로) */
  const autoTip = (
    <span className="home-tile-auto" title="자동 기록 중">
      <Ri name="heart-3" fill size={12} />
      자동
    </span>
  )
  const sleepH = day.sleepHours[day.sleepHours.length - 1]

  /** 카드 렌더러 — 순서는 session.cardOrder 를 따름 */
  const renderCard = (kind: HomeCardKind) => {
    switch (kind) {
      case 'hr':
      case 'spo2':
      case 'temp':
      case 'hrv': {
        const v = HOME_VITALS.find((x) => x.id === kind)!
        const now = vitalNow[v.id]
        const value = now ?? v.value
        const week = now != null ? [...v.week.slice(0, -1), now] : v.week
        // 기록 시각은 홈에 안 보인다 (몇 시에 쟀는지는 상세에서). 다만 마지막 기록이 오래됐으면 "n시간 전 기록"만 (방금 직접 쟀으면 없음)
        const stale = now != null ? null : staleLabel(dayLog(v.id, new Date())[0]?.time)
        return tile(
          kind, v.label, v.icon,
          <strong>{value}<small>{v.unit}</small></strong>,
          <>
            <span>{busyTile === kind ? '재는 중…' : vitalStatus(v.id, value).label}</span>
            {stale && <span className="sub">{stale}</span>}
          </>,
          <Spark values={week} color={v.color} width={170} height={36} fluid avg />,
          () => navigate(`/vitaling/measure/stress?m=${v.id}`),
          null,
          measureBtn(kind),
        )
      }
      case 'stress':
        return tile(
          kind, '스트레스', 'brain',
          stressShow ? <strong>{stressSel}<small>점</small></strong> : <strong className="empty">기록 전</strong>,
          <>
            <span>{busyTile === 'stress' ? '재는 중…' : stressShow ? stressInfo.label : '반지가 자동으로 재요'}</span>
            {/* 조건이 될 때까지만 지급 기준 한 줄. 그 뒤엔 마지막 기록이 오래됐을 때만 "n시간 전 기록" */}
            {!stressClaimed && !(stressShow && stressEligible)
              ? <span className="sub">{STRESS_REWARD_MAX}점 이하면 {formatClaimP(STRESS_REWARD_P)}</span>
              : stressStale && <span className="sub">{stressStale}</span>}
          </>,
          // 오늘 기록(자동+직접)의 흐름. 7일은 상세에서
          stressShow ? <Spark values={stressToday} color={METRIC_STYLE.stress.color} width={170} height={36} fluid avg /> : null,
          () => goMeasure('stress'),
          // 버튼 자리는 늘 유지(받기·획득·조건 전), 재기는 오른쪽 위 원형
          pointBtn('stress', STRESS_REWARD_P, stressClaimed, stressShow && stressEligible),
          measureBtn('stress'),
        )
      case 'walk':
        return tile(
          kind, '걷기', 'walk',
          <strong>{stepsLabel}<small>걸음</small></strong>,
          <>
            <span>{walkEligible ? '목표 달성' : `목표까지 ${(WALK_REWARD_STEPS - stepsSel).toLocaleString('ko-KR')}걸음`}</span>
            {!walkClaimed && !walkEligible && <span className="sub">{WALK_REWARD_STEPS.toLocaleString('ko-KR')}걸음이면 {formatClaimP(WALK_REWARD_P)}</span>}
          </>,
          <HourBars values={STEPS_BY_HOUR} color={METRIC_STYLE.walk.color} />,
          () => goMeasure('walk'),
          // 걷기·수면은 반지가 자동으로 재니 재기 버튼은 없고(오른쪽 위 '자동'), 버튼 자리는 받기·획득·조건 전으로 늘 유지
          pointBtn('walk', WALK_REWARD_P, walkClaimed, walkEligible),
          autoTip,
        )
      case 'sleep':
        return tile(
          kind, '수면', 'moon',
          sleepShow ? <strong>{Math.floor(sleepH)}<small>시간</small> {Math.round((sleepH - Math.floor(sleepH)) * 60)}<small>분</small></strong> : <strong className="empty">기록 전</strong>,
          <>
            <span>{sleepShow ? `효율 ${day.efficiency}%` : '자면 자동 기록'}</span>
          </>,
          sleepShow ? <SleepHypnogram segments={SLEEP_LAST_NIGHT} height={36} className="home-vital-spark" /> : null,
          () => goMeasure('sleep'),
          pointBtn('sleep', SLEEP_REWARD_P, sleepClaimed, sleepShow),
          autoTip,
        )
      case 'survey':
        return tile(
          kind, '설문', 'survey',
          surveyMeasured ? <strong className="text">설문 완료</strong> : <strong className="empty">참여 전</strong>,
          <>
            <span>{surveyMeasured ? '이번 달 참여' : `월 1회 · ${formatClaimP(SURVEY_REWARD_P)}`}</span>
          </>,
          null,
          () => goMeasure('survey'),
          // 참여 전엔 참여하기, 참여하면 받기, 받은 뒤엔 회색 획득 (답변은 카드를 눌러 본다)
          surveyClaimed ? doneBtn(SURVEY_REWARD_P) : surveyMeasured ? claimBtn('survey', SURVEY_REWARD_P) : (
            <button type="button" className="elder-claim-btn secondary" onClick={() => goMeasure('survey')}>
              <span>참여하기</span>
            </button>
          ),
        )
      case 'diet':
        return (
          <Fragment key="diet">
      <DietUploadCard
        kcal={day.dietKcal}
        goal={profile.diet.goal}
        photo={todayDietPhoto(session)}
        measured={dietMeasured}
        claimed={dietClaimed}
        onOpen={() => goMeasure('diet')}
        onMeasure={() => goMeasure('diet', true)}
        onClaim={() => markClaimed('diet')}
      />
          </Fragment>
        )
    }
  }

  /** 순서대로 돌되, 2열 작은 카드가 이어지면 한 그리드로 묶고 식단(1열)은 따로 */
  const cardGroups: { tiles: boolean; kinds: HomeCardKind[] }[] = []
  session.cardOrder.forEach((k) => {
    const isTile = k !== 'diet'
    const last = cardGroups[cardGroups.length - 1]
    if (last && last.tiles && isTile) last.kinds.push(k)
    else cardGroups.push({ tiles: isTile, kinds: [k] })
  })

  const validDays = validDayCount(session)
  const dateLabel = formatHomeDate(HOME_TODAY)
  const statusLabel = '오늘의 상태'

  return (
    <div className="stage">
      <Phone statusTone="dark">
        <div className="screen elder-home">
          <header className="elder-top">
            <button type="button" className="elder-gear" aria-label="뒤로" onClick={() => (window.history.length > 1 ? navigate(-1) : undefined)}>
              <Ri name="arrow-left-s" size={24} />
            </button>
            <h1>토마톡 링</h1>
            <div className="elder-top-actions">
              <button type="button" className="elder-gear" aria-label="마이 페이지" onClick={() => navigate('/vitaling/my')}>
                <Ri name="user-3" size={22} />
              </button>
            </div>
          </header>

          <div
            className="scroll elder-body"
            ref={scrollRef}
            onTouchStart={(e) => onPullStart(e.touches[0].clientY)}
            onTouchMove={(e) => onPullMove(e.touches[0].clientY)}
            onTouchEnd={onPullEnd}
            onMouseDown={(e) => onPullStart(e.clientY)}
            onMouseMove={(e) => { if (e.buttons === 1) onPullMove(e.clientY) }}
            onMouseUp={onPullEnd}
            onMouseLeave={onPullEnd}
          >
            {/* 당겨서 새로고침 표시: 당기는 만큼 열리고, 불러오는 동안은 고정 높이 */}
            <div className={`elder-pull ${syncing ? 'busy' : ''} ${pull >= PULL_TRIGGER ? 'ready' : ''}`} style={{ height: syncing ? 44 : pull }} aria-hidden={!syncing}>
              {syncing ? (
                <><Ri name="loader-4" size={18} className="spin" /><span>기록 불러오는 중</span></>
              ) : (
                <><Ri name="arrow-down" size={18} className="elder-pull-arrow" /><span>{pull >= PULL_TRIGGER ? '놓으면 새로고침' : '당겨서 새로고침'}</span></>
              )}
            </div>
            <div className="elder-compact-top">
              <div className="elder-date-weather">
                <div className="elder-date-row">
                  <span className="elder-date-center">
                    <b>{dateLabel}</b>
                    {session.paired && (
                      <button type="button" className={`elder-date-sync ${syncing ? 'busy' : ''}`} onClick={runSync} aria-label="반지 기록 새로고침" disabled={syncing}>
                        <Ri name="refresh" size={18} className={syncing ? 'spin' : ''} />
                      </button>
                    )}
                  </span>
                  <span className={`elder-date-battery ${battery.tone}`} aria-label={`반지 배터리 ${battery.text}`}>
                    <Ri name={battery.icon} fill size={18} />
                    {battery.text}
                  </span>
                </div>
              </div>
            </div>

            {!session.paired ? (
              <div className="elder-ble-card">
                <div className="elder-ble-ico">
                  <Ri name="bluetooth" fill size={36} />
                </div>
                <b>토마톡 링을 연결해 주세요</b>
                <p>블루투스를 켜고 반지를 휴대폰 가까이에 두세요.</p>
                <PrimaryButton onClick={() => navigate('/vitaling/pair')}>반지 연결하기</PrimaryButton>
                <button type="button" className="ghost-link" onClick={openVitalingShop}>
                  반지가 없어요 · 구매하기
                </button>
              </div>
            ) : (
              <>
                <div className="elder-section-row">
                  <p className="elder-section-label with-info">오늘의 미션<PointGuideButton /></p>
                  <button type="button" className="elder-mission-link" onClick={() => navigate('/reward/history')}>
                    보상 내역 <Ri name="arrow-right" size={14} />
                  </button>
                </div>
                <TodayMissionCard
                  claimed={{ stress: stressClaimed, diet: dietClaimed, walk: walkClaimed, sleep: sleepClaimed, survey: surveyClaimed }}
                  ready={{ stress: stressShow && stressEligible && !stressClaimed, diet: dietMeasured && !dietClaimed, walk: walkEligible && !walkClaimed, sleep: sleepShow && !sleepClaimed, survey: surveyMeasured && !surveyClaimed }}
                  onItem={focusCard}
                />
                <div className="elder-section-row">
                  <p className="elder-section-label">
                    {statusLabel}
                    <MetricInfoButton metric="health" className="elder-section-info" />
                  </p>
                </div>
                {validDays >= RHYTHM_MIN_DAYS ? (
                  <TodayScoreCard
                    score={day.score}
                    tiles={tiles}
                    onOpen={() => navigate('/vitaling/day')}
                    deviceStatus={null}
                  />
                ) : (
                  <RhythmCollecting days={validDays} onOpen={() => navigate('/vitaling/day')} />
                )}

                {/* 이상 징후: 감지된 날에만 홈에 나온다 (바디 리듬 아래, 바이탈 위). 평소와 비슷·준비 중은 상세에서만 */}
                {session.signalDemo === 'detected' && (
                  <SignalCard
                    condition={todayCondition(session)}
                    onOpen={() => navigate('/vitaling/signal')}
                    onCondition={setConditionCheck}
                  />
                )}

                {/* 오늘 기록: 기능별 작은 카드 2열. 측정은 카드마다 재기 버튼으로, 받기는 포인트가 걸린 카드에서 */}
                <div className="elder-section-row">
                  <p className="elder-section-label">오늘 기록</p>
                  <button type="button" className="elder-mission-link" onClick={() => setOrderOpen(true)}>
                    <Ri name="list-settings" size={14} /> 순서 편집
                  </button>
                </div>
                {cardGroups.map((g, i) => (g.tiles ? <div key={i} className="home-tiles">{g.kinds.map(renderCard)}</div> : g.kinds.map(renderCard)))}
              </>
            )}
          </div>
          {toast && <div className="elder-toast" role="status">{toast}</div>}
          {orderOpen && <CardOrderSheet order={session.cardOrder} onClose={() => setOrderOpen(false)} />}
          {result && <VitalResultSheet row={result} onClose={() => setResult(null)} />}
        </div>
      </Phone>
    </div>
  )
}

/** 바이탈 상태 글자 — 네 지표 모두 정상·낮음·높음 한 체계 (홈 칸, 측정 완료 모달 공용) */
function vitalStatus(id: 'hr' | 'spo2' | 'temp' | 'hrv', v: number): { label: string; tone: 'ok' | 'mid' | 'low' } {
  if (id === 'hr') return v < 60 ? { label: '낮음', tone: 'mid' } : v <= 100 ? { label: '정상', tone: 'ok' } : { label: '높음', tone: 'low' }
  if (id === 'spo2') return v >= 95 ? { label: '정상', tone: 'ok' } : v >= 90 ? { label: '낮음', tone: 'mid' } : { label: '매우 낮음', tone: 'low' }
  if (id === 'temp') return v < 36 ? { label: '낮음', tone: 'mid' } : v <= 37.2 ? { label: '정상', tone: 'ok' } : { label: '높음', tone: 'low' }
  // 심박변이도: 높을수록 좋음. 글자는 다른 지표와 같은 정상·낮음·높음 체계
  return v > 60 ? { label: '높음', tone: 'ok' } : v >= 40 ? { label: '정상', tone: 'ok' } : v >= 30 ? { label: '낮음', tone: 'mid' } : { label: '낮음', tone: 'low' }
}
/** 홈 카드 '재기' 결과: 방금 잰 값 하나 */
type MeasureTileKind = 'hr' | 'spo2' | 'temp' | 'hrv' | 'stress'
/** 목업 측정 시간 — 실제는 지표마다 다르다 (온도는 바로, 나머지는 30초~수 분) */
const MEASURE_MS: Record<MeasureTileKind, number> = { hr: 3000, spo2: 3000, temp: 1500, hrv: 3000, stress: 3000 }
type ResultRow = { kind: 'hr' | 'spo2' | 'temp' | 'hrv' | 'stress'; label: string; icon: string; value: number; unit: string; tone: 'ok' | 'mid' | 'low'; status: string }
function VitalResultSheet({ row, onClose }: { row: ResultRow; onClose: () => void }) {
  const now = new Date()
  const time = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`
  return (
    <div className="sheet-overlay" role="dialog" aria-modal="true" aria-labelledby="vital-result-title">
      <button type="button" className="sheet-backdrop" aria-label="닫기" onClick={onClose} />
      <div className="sheet-panel vital-result-sheet">
        <div className="sheet-handle" />
        <div className="vital-result-head">
          <Ri name="checkbox-circle" fill size={26} />
          <h2 id="vital-result-title">측정 완료</h2>
          <span>{time} · 오늘 기록에 추가됐어요</span>
        </div>
        <ul className="vital-result-list">
          <li>
            <span className="home-vital-ico metric-ico" data-metric={row.kind}><Ri name={row.icon} fill size={18} /></span>
            <b>{row.label}</b>
            <strong>{row.value}<small>{row.unit}</small></strong>
            <StatusTag tone={row.tone}>{row.status}</StatusTag>
          </li>
        </ul>
        {/* 안내는 문장마다 한 줄 (둘째 문장은 줄 바꿔서) */}
        <p className="vital-result-say">
          {(row.tone === 'ok' ? ['정상 범위예요.'] : row.tone === 'mid' ? ['평소와 조금 다른 값이에요.', '잠시 쉬었다가 다시 재 보세요.'] : ['범위를 벗어난 값이에요.', '불편함이 있으면 전문가와 상의해 보세요.']).map((line, i) => (
            <Fragment key={i}>{i > 0 && <br />}{line}</Fragment>
          ))}
        </p>
        <PrimaryButton onClick={onClose}>확인</PrimaryButton>
      </div>
    </div>
  )
}





export function SettingsScreen() {
  const navigate = useNavigate()
  const session = useSession()
  const [openDoc, setOpenDoc] = useState<TermsDocId | null>(null)
  const doc = openDoc ? TERMS_DOCS[openDoc] : null

  return (
    <div className="stage">
      <Phone>
        <div className="screen settings-screen">
          <Header title="기기 설정" backTo="/vitaling/my" />
          <div className="scroll">
            {/* SDK 전제: 반지 연결·측정·주기 설정·펌웨어는 우리 앱이 직접 처리 */}
            <p className="section-label" style={{ marginTop: 4 }}>반지 연결</p>
            <div className="device-card">
              <div className="device-card-row">
                <span>연결 상태</span>
                <b className={session.paired ? 'ok-text' : ''}>{session.paired ? '연결됨' : '연결 안 됨'}</b>
              </div>
              <div className="device-card-row">
                <span>배터리</span>
                <b>{session.paired ? '78%' : '--'}</b>
              </div>
              <div className="device-card-row">
                <span>시리얼</span>
                <b>{session.paired ? maskSerial(session.serial) : '--'}</b>
              </div>
              <div className="device-card-row">
                <span>펌웨어</span>
                <b>{session.paired ? 'v1.8.4 · 최신' : '--'}</b>
              </div>
            </div>
            <div className="row-group">
            {session.paired ? (
              <>
                <Row
                  title="다른 반지 연결"
                  desc="새 반지로 다시 연결합니다"
                  trailing={<CaretRight size={14} weight="light" />}
                  onClick={() => navigate('/vitaling/pair')}
                />
                <Row title="반지 연결 해제" onClick={() => unpairRing()} />
              </>
            ) : (
              <Row
                title="반지 연결하기"
                desc="블루투스를 켜고 반지를 가까이 두세요"
                trailing={<CaretRight size={14} weight="light" />}
                onClick={() => navigate('/vitaling/pair')}
              />
            )}
            </div>

            <p className="section-label">측정</p>
            <div className="row-group">
            <Row
              title="자동 측정 모드"
              desc={`심박수 ${AUTO_MODE_LABEL[session.autoMeasure.hr]} · 혈중 산소 ${AUTO_MODE_LABEL[session.autoMeasure.spo2]}`}
              trailing={<CaretRight size={14} weight="light" />}
              onClick={() => navigate('/vitaling/settings/auto-measure')}
            />
            </div>

            {/* 과거 기록·바디 리듬 등 서버 계산값은 브링 API로 받으므로 고유번호 연동은 유지 */}
            <p className="section-label">토마톡 링 연동</p>
            <div className="device-card">
              <div className="device-card-row">
                <span>연동 상태</span>
                <b className={session.vitalId ? 'ok-text' : ''}>{session.vitalId ? '연동됨' : '미연동'}</b>
              </div>
              <div className="device-card-row">
                <span>고유번호</span>
                <b>{session.vitalId ?? '--'}</b>
              </div>
              <div className="device-card-row">
                <span>마지막 동기화</span>
                <b>{session.vitalId ? '오늘 10:24' : '--'}</b>
              </div>
            </div>
            <div className="row-group">
            <Row
              title={session.vitalId ? '다른 고유번호로 연동' : '고유번호 연동하기'}
              desc="브링 앱 설정에 있는 고유번호를 입력합니다"
              trailing={<CaretRight size={14} weight="light" />}
              onClick={() => navigate('/vitaling/serial')}
            />
            </div>

            <p className="section-label">약관</p>
            <div className="row-group">
            <Row
              title="개인정보 수집 및 처리방침"
              trailing={<CaretRight size={14} weight="light" />}
              onClick={() => setOpenDoc('privacy')}
            />
            <Row
              title="토마톡 링 서비스 약관"
              trailing={<CaretRight size={14} weight="light" />}
              onClick={() => setOpenDoc('service')}
            />
            </div>
          </div>
          {doc && (
            <div className="sheet-overlay" role="dialog" aria-modal="true" aria-labelledby="settings-terms-title">
              <button type="button" className="sheet-backdrop" aria-label="닫기" onClick={() => setOpenDoc(null)} />
              <div className="sheet-panel terms-sheet">
                <div className="sheet-handle" />
                <div className="sheet-top">
                  <h2 id="settings-terms-title">{doc.title}</h2>
                  <button type="button" className="icon-btn" aria-label="닫기" onClick={() => setOpenDoc(null)}>
                    <X size={20} weight="light" />
                  </button>
                </div>
                <div className="terms-doc-body">
                  {doc.body.map((line) => (
                    <p key={line} className={/^(제\d+조|\d+\.)/.test(line) ? 'terms-h' : undefined}>
                      {line}
                    </p>
                  ))}
                </div>
                <PrimaryButton onClick={() => setOpenDoc(null)}>확인</PrimaryButton>
              </div>
            </div>
          )}
        </div>
      </Phone>
    </div>
  )
}

export function GuideScreen() {
  const navigate = useNavigate()

  const steps = [
    { n: '1', title: '브링 앱 고유번호 연동', desc: '브링 앱 설정의 고유번호를 입력하면 기록과 바디 리듬을 토마톡에서 볼 수 있어요.' },
    { n: '2', title: '반지 연결', desc: '블루투스를 켜고 반지를 가까이 두면 토마톡 링이 반지를 찾아 연결해요.' },
    { n: '3', title: '매일 착용하고 잠자기', desc: '잘 때도 끼고 자야 수면 기록이 쌓이고, 7일이 모이면 바디 리듬이 계산돼요.' },
    { n: '4', title: '홈에서 확인하고 포인트 받기', desc: '스트레스 · 식단 · 걷기 · 수면 · 설문을 확인하면 포인트가 지급돼요.' },
  ]

  const features = [
    { icon: Waveform, title: '바이탈 측정', desc: '심박수 · 혈중 산소 · 피부 온도 · 호흡 · 심박변이도' },
    { icon: Moon, title: '수면 · 스트레스', desc: '수면 단계와 스트레스 구간 분석' },
    { icon: Heart, title: '바디 리듬', desc: '회복 · 피로도 · 활동 지수로 보는 오늘 상태' },
    { icon: Sparkle, title: '포인트 보상', desc: '매일 확인만 해도 쌓이는 토마톡 포인트' },
  ]

  return (
    <div className="stage">
      <Phone>
        <div className="screen">
          <Header title="사용 방법" backTo="/vitaling/my" />
          <div className="scroll">
            <div className="hero-visual" style={{ marginBottom: 8 }}>
              <div className="ring-3d" />
            </div>
            <p className="eyebrow" style={{ textAlign: 'center' }}>TOMATALK RING</p>
            <h2 className="headline" style={{ textAlign: 'center', fontSize: 20 }}>
              반지를 끼고 있기만 하면<br />토마톡이 건강을 챙겨요
            </h2>

            <p className="section-label">이렇게 시작해요</p>
            <div className="guide-steps">
              {steps.map((s) => (
                <div key={s.n} className="guide-step">
                  <span className="n">{s.n}</span>
                  <div>
                    <b>{s.title}</b>
                    <span>{s.desc}</span>
                  </div>
                </div>
              ))}
            </div>

            <p className="section-label">주요 기능</p>
            <div className="feature-list">
              {features.map(({ icon: Icon, title, desc }) => (
                <div key={title} className="feature">
                  <div className="ico"><Icon size={18} weight="light" /></div>
                  <div>
                    <b>{title}</b>
                    <span>{desc}</span>
                  </div>
                </div>
              ))}
            </div>

            <p className="section-label">반지가 아직 없다면</p>
            <a className="shop-card linkish" href={VITALING_SHOP_URL} target="_blank" rel="noreferrer">
              <ShoppingBag size={22} weight="light" />
              <div>
                <b>공식몰에서 구매하기</b>
                <span>링크로 이동 · 색상·사이즈·배송지 입력</span>
              </div>
              <CaretRight size={16} weight="light" color="#999" />
            </a>
          </div>
          <div className="footer shadow">
            <button type="button" className="btn btn-primary" onClick={() => navigate('/vitaling/pair')}>
              반지 연결하러 가기
            </button>
          </div>
        </div>
      </Phone>
    </div>
  )
}

const FAQ: { group: string; icon: string; color: string; items: { q: string; a: string[] }[] }[] = [
  {
    group: '심박수',
    icon: 'heart-pulse',
    color: '#CD313E',
    items: [
      { q: '[지금 측정하기]가 안 돼요', a: ['심박수 직접 측정이 안 되면 순서대로 해 보세요.', '1. 반지 초기화: 마이 > 기기 설정 > 공장 초기화', '2. 토마톡 앱 다시 설치', '3. 반지 다시 연결', '그래도 안 되면 1:1 문의로 알려 주세요.'] },
      { q: '자동 측정이 안 돼요', a: ['반지를 끼고 있어도 기록이 없거나, 안 끼었는데 기록될 때 순서대로 해 보세요.', '· 반지 연결 해제 후 다시 연결 (마이 > 기기 설정 > 반지 연결 해제)', '· 펌웨어를 최신으로 업데이트 (마이 > 기기 설정 > 펌웨어 업데이트)', '· 자동 측정 모드를 다른 것으로 바꿔 보기 (마이 > 자동 측정 모드)', '· G2·Pro 모델이면 센서 보정 (마이 > 기기 설정 > 센서 보정)', '· 하루 이상 기록이 없으면 반지를 초기화한 뒤 다시 연결'] },
      { q: '측정 결과가 실제 상태와 다른 것 같아요', a: ['반지 착용 상태에 따라 결과가 다르게 나올 수 있어요.', '· 반지가 너무 크면 센서가 제대로 닿지 않아 오차가 생겨요.', '· 너무 꽉 끼면 손가락을 압박해 측정에 영향을 줘요.', '· 센서가 손바닥 쪽을 향하도록 끼워 주세요.', '심박수는 앉거나 가만히 있는 안정된 상태에서 재는 것이 가장 정확해요.'] },
      { q: '의료용 기기와 수치가 달라요', a: ['토마톡 링은 의료기기가 아닌 웰니스용 기기예요. 센서 위치, 빛 반사, 착용 습관, 환경에 따라 결과가 달라질 수 있어요.', '일상적인 건강 관리와 컨디션 변화를 보는 데 알맞고, 정확한 진단이나 치료 목적으로는 권하지 않아요.', '수치가 계속 낮거나 불편한 증상이 있으면 의료 전문가와 상담해 주세요.'] },
    ],
  },
  {
    group: '혈중 산소',
    icon: 'drop',
    color: '#2F80ED',
    items: [
      { q: '혈중 산소란 무엇인가요?', a: ['혈액 속 산소의 포화도(%), 즉 혈액이 운반하는 산소의 양이에요.', '보통 95% 이상이면 정상 범위예요. 그보다 낮으면 일시적인 호흡 변화·피로·스트레스·흡연·고도 변화 등과 관련 있을 수 있어요.', '잠자는 동안에는 일시적으로 낮아지는 경우가 많아요. 일정 시간 안에 회복되면 걱정하지 않으셔도 돼요.', '코골이가 심하거나 수면무호흡이 있으면 낮게 측정될 수 있으니 참고해 주세요.'] },
      { q: '수치가 낮게 나와서 걱정돼요', a: ['한 번 낮게 나왔다고 건강에 이상이 있다고 단정할 수는 없어요.', '평소보다 낮다면 일시적인 호흡 변화·피로·스트레스·흡연·고도 변화 때문일 수 있어요.', 'G2·Pro 모델은 센서 민감도가 높아 수치가 급격히 낮아진 것처럼 보일 수 있어요.', '일부 결과보다는 전체적인 변화 흐름을 함께 살펴보는 게 좋아요.'] },
      { q: '측정 결과가 평소와 다른 것 같아요', a: ['· 반지가 손가락에 밀착되도록 조정하기', '· 센서가 손바닥을 향하도록 착용하기', '· 손이 너무 차가우면 혈류가 줄어드니 손을 따뜻하게 유지하기', '· 센서 부위를 깨끗이 닦은 뒤 다시 착용하기'] },
      { q: '혈중 산소가 자동으로 측정되지 않아요', a: ['G1 모델: 블루투스 연결이 안정적인지, 앱이 백그라운드에서도 동작 중인지 확인해 주세요. 휴대폰 설정에서 토마톡 위치 접근을 "항상 허용"으로 바꿔 주세요.', 'G2·Pro 모델: 반지 연결 해제 후 재연결 → 펌웨어 업데이트 → 다른 자동 측정 모드 선택 → 센서 보정 순서로 해 보세요.', '데이터가 하루 이상 기록되지 않으면 반지를 초기화한 뒤 다시 연결해 주세요.'] },
    ],
  },
]

export function HelpScreen() {
  const navigate = useNavigate()
  const [open, setOpen] = useState<string | null>(null)
  return (
    <div className="stage">
      <Phone>
        <div className="screen elder-home help-screen">
          <Header title="도움말 · 문의" backTo="/vitaling/my" />
          <div className="scroll elder-body">
            <ul className="my-menu">
              <li>
                <button type="button" className="my-menu-row" onClick={() => navigate('/vitaling/guide')}>
                  <span className="my-menu-ico"><Ri name="book-open" size={22} /></span>
                  <span className="my-menu-copy"><b>사용 방법</b><em>처음 시작하기 · 반지 착용법</em></span>
                  <Ri name="arrow-right-s" size={22} className="my-menu-caret" />
                </button>
              </li>
              <li>
                <button type="button" className="my-menu-row">
                  <span className="my-menu-ico"><Ri name="question-answer" size={22} /></span>
                  <span className="my-menu-copy"><b>1:1 문의하기</b><em>토마톡 고객센터로 연결돼요</em></span>
                  <Ri name="arrow-right-s" size={22} className="my-menu-caret" />
                </button>
              </li>
            </ul>

            {FAQ.map((g) => (
              <section key={g.group} className="faq-group">
                <h2 className="faq-title"><Ri name={g.icon} fill size={22} style={{ color: g.color }} /> {g.group} FAQ</h2>
                {g.items.map((it) => {
                  const id = `${g.group}:${it.q}`
                  const on = open === id
                  return (
                    <div key={id} className={`faq-item ${on ? 'on' : ''}`}>
                      <button type="button" className="faq-q" aria-expanded={on} onClick={() => setOpen(on ? null : id)}>
                        <span>Q. {it.q}</span>
                        <Ri name={on ? 'arrow-up-s' : 'arrow-down-s'} size={22} />
                      </button>
                      {on && (
                        <div className="faq-a">
                          {it.a.map((line) => <p key={line}>{line}</p>)}
                        </div>
                      )}
                    </div>
                  )
                })}
              </section>
            ))}

            <div className="help-footer">
              <b>토마톡 링 고객센터</b>
              <span>평일 09:00–17:00 (점심시간 12:00–13:00)</span>
              <span>토마톡 앱 &gt; 서비스 &gt; 1:1 문의</span>
            </div>
          </div>
        </div>
      </Phone>
    </div>
  )
}


/** 이상 징후 상세 — 다음 단계에서 채움 (상태 히어로 · 5일 징후 변화 · 수면 중 지표 슬라이더 · 컨디션 체크) */
