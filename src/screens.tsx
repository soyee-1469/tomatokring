import {
  Moon,
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
import { Fragment, useEffect, useState, type ReactNode } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { Header, InputComponent, Phone, PrimaryButton, Row, Steps } from './components/ui'
import { MetricInfoButton } from './components/AccuracyInfo'
import { Ri } from './components/Ri'
import { dayBundle, GRADE_COPY, gradeOf } from './rhythm'
import { MEALS } from './meals'
import { ScoreArc as TodayScoreArc } from './components/ScoreArc'
import { TrendLine as MiniBars } from './components/TrendLine'
import { AUTO_MODE_LABEL, dayLog } from './measureLog'
import { completeOnboarding, DEFAULT_CARD_ORDER, isClaimed, isMeasureDone, markClaimed, maskSerial, pairRing, RHYTHM_MIN_DAYS, saveVitalId, setCardOrder, todayDietPhoto, unpairRing, validDayCount, type HomeCardKind, type MeasureKind } from './session'
import { openVitalingShop, VITALING_SHOP_URL } from './shop'
import {
  ACTIVITY_COLORS,
  ACTIVITY_LEGEND,
  SLEEP_COLORS,
  VITAL_COLORS,
  HOME_COLORS,
  HOME_SOFT,
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
    // 이미 반지가 연결된 사용자(설정에서 번호만 바꾸는 경우)는 홈으로, 처음이면 반지 연결로
    navigate(session.paired ? '/vitaling/home' : '/vitaling/pair', { replace: true })
  }

  return (
    <div className="stage">
      <Phone>
        <div className="screen">
          <Header title="고유번호 연동" backTo={session.onboarded && session.paired ? '/vitaling/settings' : '/vitaling/terms'} />
          <div className="scroll">
            <Steps step={2} total={3} />
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
            <Steps step={1} total={3} />
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
            <PrimaryButton disabled={!all} onClick={() => { completeOnboarding(''); navigate('/vitaling/serial', { replace: true }) }}>
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
  stress: { label: '스트레스', icon: 'brain', cls: 'stress' },
  diet: { label: 'AI 식단', icon: 'restaurant', cls: 'diet' },
  walk: { label: '운동하기 (걷기)', icon: 'walk', cls: 'activity' },
  sleep: { label: '수면', icon: 'moon', cls: 'sleep' },
  survey: { label: '설문조사', icon: 'survey', cls: 'survey' },
}

/** 홈 카드 순서 편집: 드래그 대신 위·아래 버튼 (50~70대 기준) */
function CardOrderSheet({ order, onClose }: { order: readonly HomeCardKind[]; onClose: () => void }) {
  const [draft, setDraft] = useState<HomeCardKind[]>([...order])
  const move = (i: number, dir: -1 | 1) => {
    const j = i + dir
    if (j < 0 || j >= draft.length) return
    const next = [...draft]
    ;[next[i], next[j]] = [next[j], next[i]]
    setDraft(next)
  }
  const save = () => {
    setCardOrder(draft)
    onClose()
  }
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
        <p className="card-order-hint">자주 보는 카드를 위로 올려 보세요.</p>
        <ul className="card-order-list">
          {draft.map((kind, i) => {
            const meta = HOME_CARD_META[kind]
            return (
              <li key={kind} className={`card-order-item ${meta.cls}`}>
                <span className="card-order-no">{i + 1}</span>
                <i className="card-order-ico"><Ri name={meta.icon} size={22} /></i>
                <b>{meta.label}</b>
                <span className="card-order-btns">
                  <button type="button" aria-label={`${meta.label} 위로`} disabled={i === 0} onClick={() => move(i, -1)}>
                    <Ri name="arrow-up-s" size={22} />
                  </button>
                  <button type="button" aria-label={`${meta.label} 아래로`} disabled={i === draft.length - 1} onClick={() => move(i, 1)}>
                    <Ri name="arrow-down-s" size={22} />
                  </button>
                </span>
              </li>
            )
          })}
        </ul>
        <div className="card-order-actions">
          <button type="button" className="card-order-reset" onClick={() => setDraft([...DEFAULT_CARD_ORDER])}>
            기본 순서로
          </button>
          <PrimaryButton onClick={save}>저장</PrimaryButton>
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
const STRESS_REWARD_MAX = 30 // 스트레스 30점 이하(0~30)일 때 지급
// 또래 평균(초기 스펙 참고값 39.98)은 실제 데이터가 없어 쓰지 않는다. 대신 내 최근 7일 평균을 보여준다
const WALK_REWARD_STEPS = 8_000 // 8,000걸음 이상일 때 지급
// 또래 평균 걸음 5,680 (스펙 참고값, 화면에는 미표시)
const STRESS_REWARD_P = 200_000
const DIET_REWARD_P = 200_000
const WALK_REWARD_P = 200_000
const SLEEP_REWARD_P = 200_000
const SURVEY_REWARD_P = 5_000_000

function tagTone(tone: 'ok' | 'warn' | 'bad') {
  return tone === 'ok' ? 'ok' : tone === 'warn' ? 'mid' : 'low'
}
/** 홈 카드 상태 태그: 미완료(pending)는 회색, 완료·정상(ok)은 녹색 체크 */
function StatusTag({ tone, children }: { tone: 'ok' | 'mid' | 'low' | 'pending'; children: ReactNode }) {
  return (
    <span className={`elder-menu-tag ${tone}`}>
      {tone === 'ok' && <Ri name="checkbox-circle" fill size={14} />}
      {children}
    </span>
  )
}
function formatClaimP(points: number) {
  return points % 10_000 === 0 ? `${(points / 10_000).toLocaleString('ko-KR')}만 P` : `${points.toLocaleString('ko-KR')} P`
}

/** 스트레스 지수 등급 — 낮을수록 좋음 */
function stressLevel(score: number) {
  if (score <= 20) return { label: '매우 낮음', tone: 'ok' as const }
  if (score <= 40) return { label: '낮음', tone: 'ok' as const }
  if (score <= 60) return { label: '보통', tone: 'warn' as const }
  if (score <= 80) return { label: '높음', tone: 'bad' as const }
  return { label: '매우 높음', tone: 'bad' as const }
}

/** 수면 효율(%) 등급 */
function sleepEfficiencyLevel(pct: number) {
  if (pct >= 81) return { label: '최상', tone: 'ok' as const }
  if (pct >= 61) return { label: '상', tone: 'ok' as const }
  if (pct >= 41) return { label: '보통', tone: 'warn' as const }
  if (pct >= 21) return { label: '하', tone: 'bad' as const }
  return { label: '최하', tone: 'bad' as const }
}

/** 점수 + 이상 바이탈을 반영한 오늘 종합 요약 (무지개) — 요약 전용, 보상 없음 */
/** 바디 리듬 준비 중: 유효한 날이 7일 미만일 때 점수 대신 진행 상태 */
function RhythmCollecting({ days, onOpen }: { days: number; onOpen: () => void }) {
  const left = RHYTHM_MIN_DAYS - days
  return (
    <div className="elder-score-card arc rhythm-collecting">
      <button type="button" className="rhythm-collecting-body" onClick={onOpen}>
        <span className="rhythm-days" aria-label={`${RHYTHM_MIN_DAYS}일 중 ${days}일`}>
          {Array.from({ length: RHYTHM_MIN_DAYS }, (_, i) => <i key={i} className={i < days ? 'on' : ''} />)}
        </span>
        <strong>{days}<small>/ {RHYTHM_MIN_DAYS}일</small></strong>
        <b>{days === 0 ? '바디 리듬을 준비하고 있어요' : `${left}일만 더 모으면 바디 리듬이 보여요`}</b>
        <p>잘 때 반지를 끼고 자면 하루가 쌓여요.<br />수면 기록이 있는 날만 인정돼요.</p>
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
    <div className={`elder-score-card arc tone-${status.tone}`}>
      {deviceStatus ? <div className="elder-device-status">{deviceStatus}</div> : null}
      <button type="button" className="elder-score-gauge" onClick={onOpen} aria-label="바디 리듬 자세히 보기">
        <TodayScoreArc score={score} />
        <div className="elder-score-center">
          <strong>
            {score}
            <small>점</small>
          </strong>
          <b>오늘 {status.title}</b>
        </div>
      </button>
      <div className="elder-score-scale" aria-hidden>
        <span>나쁨</span>
        <span>보통</span>
        <span>최상</span>
      </div>
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
}) {
  const navigate = useNavigate()
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
          <button type="button" className="elder-claim-btn done" disabled>
            <Ri name="checkbox-circle" fill size={18} />
            {doneLabel}
          </button>
          <p className="elder-claim-guide under links">
            {repeatLabel && <><button type="button" onClick={onMeasure}>{repeatLabel}</button><i>·</i></>}
            <button type="button" onClick={() => navigate('/reward/history')}>적립 내역 보기</button>
          </p>
        </>
      ) : eligible ? (
        <>
          <button type="button" className="elder-claim-btn with-points" onClick={onClaim}>
            <Ri name="checkbox-circle" fill size={18} />
            <span>{readyText} · {points} 받기</span>
          </button>
          {repeatLabel && (
            <p className="elder-claim-guide under links"><button type="button" onClick={onMeasure}>{repeatLabel}</button></p>
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

function hoursLabel(h: number) {
  const hh = Math.floor(h)
  return `${hh}시간 ${Math.round((h - hh) * 60)}분`
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

function SurveyRewardCard({
  joined,
  claimed,
  onJoin,
  onClaim,
}: {
  joined: boolean
  claimed: boolean
  onJoin: () => void
  onClaim: () => void
}) {
  return (
    <div className="elder-fit-card survey">
      <button type="button" className="elder-card-hit" onClick={onJoin} aria-label="설문조사 (월)">
        <div className="elder-fit-head">
          <Ri name="survey" fill />
          <b>설문조사</b>
          <StatusTag tone={joined ? 'ok' : 'pending'}>{joined ? '이번 달 참여 완료' : '이번 달 참여 전'}</StatusTag>
        </div>
        <div className="elder-fit-body">
          <div className="elder-fit-num">

          </div>
        </div>
      </button>
      <RewardBlock
        measured={joined}
        claimed={claimed}
        guide="설문 3문항에 답하면 지급 · 월 1회"
        points={formatClaimP(SURVEY_REWARD_P)}
        measureLabel="설문하고"
        readyText="설문 완료"
        doneLabel={`오늘 ${formatClaimP(SURVEY_REWARD_P)} 받았어요`}
        onMeasure={onJoin}
        onClaim={onClaim}
      />
    </div>
  )
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
      <button type="button" className="elder-card-hit" onClick={onOpen} aria-label="AI 식단 상세">
        <div className="elder-fit-head">
          <Ri name="restaurant" fill />
          <b>AI 식단</b>
          <StatusTag tone={measured ? 'ok' : 'pending'}>{measured ? '기록 완료' : '등록 전'}</StatusTag>
        </div>
        <div className="elder-fit-body">
          {measured ? (
            <>
              <div className="elder-fit-num">
                <div>
                  <strong>{shown.toLocaleString('ko-KR')}<small>kcal</small></strong>
                  <em>목표 {goal.toLocaleString('ko-KR')}kcal</em>
                </div>
              </div>
              <ul className="home-meals">
                {photo && (
                  <li>
                    <span className="thumb photo"><img src={photo} alt="" /></span>
                    <span className="copy"><b>오늘 올린 식단 사진</b><em>분석 중</em></span>
                  </li>
                )}
                {MEALS.map((m) => (
                  <li key={m.name}>
                    <span className="thumb"><Ri name="restaurant" size={20} /></span>
                    <span className="copy"><b>{m.name}</b><em>{m.time}</em></span>
                    <strong>{m.kcal}<small>kcal</small></strong>
                  </li>
                ))}
              </ul>
            </>
          ) : (
            <button type="button" className="diet-drop" onClick={onMeasure} aria-label="식단 사진 올리기">
              <Ri name="restaurant" size={30} />
              <span>오늘의 식단 등록 전</span>
              <em>여기를 눌러 식사 사진을 올려 보세요</em>
            </button>
          )}
        </div>
      </button>
      <RewardBlock
        measured={measured}
        claimed={claimed}
        guide="아침·점심·저녁 중 1회 올리면 지급 · 1일 1회"
        points={formatClaimP(DIET_REWARD_P)}
        measureLabel="사진 올리고"
        repeatLabel="식단 더 올리기"
        readyText="등록 완료"
        doneLabel={`오늘 ${formatClaimP(DIET_REWARD_P)} 받았어요`}
        onMeasure={onMeasure}
        onClaim={onClaim}
      />
    </div>
  )
}

/** 홈 바이탈 4종 — 최신 자동 측정값과 상태 한 단어 */
const HOME_VITALS = [
  { id: 'hr', label: '심박수', value: 72, unit: 'bpm', status: '일상생활', icon: 'heart-pulse', color: HOME_COLORS.tomato, soft: HOME_SOFT.tomato },
  { id: 'spo2', label: '혈중 산소', value: 98, unit: '%', status: '보통', icon: 'drop', color: HOME_COLORS.berry, soft: HOME_SOFT.berry },
  { id: 'temp', label: '피부 온도', value: 36.6, unit: '°C', status: '정상', icon: 'temp-hot', color: HOME_COLORS.orange, soft: HOME_SOFT.orange },
  { id: 'hrv', label: 'HRV 회복력', value: 42, unit: 'ms', status: '평균', icon: 'pulse', color: HOME_COLORS.beet, soft: HOME_SOFT.beet },
] as const

const TEAM_HOME = {
  me: {
    todayScore: 85,
    tiles: [
      { id: 'hr', label: '심박수', value: 72, display: '72', unit: '회/분', max: 200, tone: 'ok' as const, ...VITAL_COLORS.hr, Icon: Heart },
      { id: 'spo2', label: '혈중 산소', value: 95, display: '95', unit: '%', max: 100, tone: 'ok' as const, ...VITAL_COLORS.spo2, Icon: Drop },
      { id: 'temp', label: '피부 온도', value: 36.4, display: '36.4', unit: '°C', max: 45, tone: 'ok' as const, ...VITAL_COLORS.temp, Icon: Thermometer },
      { id: 'hrv', label: 'HRV 회복력', value: 42, display: '42', unit: 'ms', max: 100, tone: 'ok' as const, ...VITAL_COLORS.resp, Icon: Wind },
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
    diet: { kcal: 1_120, goal: 2_300, count: 2 },
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

export function HomeScreen() {
  const navigate = useNavigate()
  const session = useSession()
  const [orderOpen, setOrderOpen] = useState(false)
  const activeMember = 'me' as const
  const profile = TEAM_HOME[activeMember]
  const device = profile.device

  if (!session.onboarded) return <Navigate to="/vitaling/terms" replace />
  if (!session.vitalId) return <Navigate to="/vitaling/serial" replace />

  const tiles = profile.tiles
  // 홈은 항상 오늘 기준. 지난 날짜는 상세 화면에서 본다
  const day = homeDataFor(profile)
  // 스트레스 7일: 상세 화면과 같은 기록(dayLog)에서 하루 평균 (오늘은 측정 전이면 0)
  // 지난 날은 하루 평균, 오늘은 마지막 측정값 (상세 히어로와 같은 기준)
  const stressSeries = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(); d.setDate(d.getDate() - (6 - i))
    const rs = dayLog('stress', d)
    if (!rs.length) return 0
    return i === 6 ? rs[0].value : Math.round(rs.reduce((acc, r) => acc + r.value, 0) / rs.length)
  })
  const stressSel = stressSeries[stressSeries.length - 1]
  // 내 평균: 오늘을 뺀 최근 6일 중 기록 있는 날의 평균
  const stressPast = stressSeries.slice(0, 6).filter((v) => v > 0)
  const stressMyAvg = stressPast.length ? Math.round(stressPast.reduce((a, b) => a + b, 0) / stressPast.length) : null
  const stressHasPrev = stressPast.length > 0
  const stressInfo = stressLevel(stressSel)
  const stressEligible = stressSel <= STRESS_REWARD_MAX
  const sleepInfo = sleepEfficiencyLevel(day.efficiency)
  const stepsSel = day.steps[day.steps.length - 1]
  const stepsLabel = stepsSel.toLocaleString('ko-KR')
  const walkEligible = stepsSel >= WALK_REWARD_STEPS
  const walkPct = Math.round((stepsSel / WALK_REWARD_STEPS) * 100)
  const walkRemain = Math.max(0, WALK_REWARD_STEPS - stepsSel)
  const walkStatus = walkEligible ? { label: '목표 달성', tone: 'ok' as const } : { label: '목표 미달', tone: 'warn' as const }
  // 측정 완료·수령 여부는 세션에 날짜와 함께 저장 (00:00 지나면 자동 초기화, 화면 재진입에도 유지)
  const stressMeasured = isMeasureDone(session, 'stress')
  // 오늘은 실제 측정 후에만 값·그래프 표시, 지난 날짜는 기록 그대로 표시
  const dietMeasured = isMeasureDone(session, 'diet')
  const walkMeasured = isMeasureDone(session, 'walk')
  const sleepMeasured = isMeasureDone(session, 'sleep')
  const surveyMeasured = isMeasureDone(session, 'survey')
  const stressClaimed = isClaimed(session, 'stress')
  const dietClaimed = isClaimed(session, 'diet')
  const walkClaimed = isClaimed(session, 'walk')
  const sleepClaimed = isClaimed(session, 'sleep')
  const surveyClaimed = isClaimed(session, 'survey')
  const stressShow = stressSel > 0
  // 선택한 날 값이 없어도 그 이전 기록이 있으면 마지막 기록 + 빈 막대, 아예 없으면 안내만
  const hasPrev = (vals: readonly number[]) => vals.slice(0, -1).some((v) => v > 0)
  const sleepYday = day.sleepHours[day.sleepHours.length - 2]
  const walkShow = walkMeasured
  const sleepShow = sleepMeasured
  /** 카드 탭 → 상세 보기(start=false), 측정 버튼 → 상세에서 바로 측정 시작(start=true, run=1) */
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

  /** 카드 렌더러 — 순서는 session.cardOrder 를 따름 */
  const renderCard = (kind: HomeCardKind) => {
    switch (kind) {
      case 'stress':
        return (
          <Fragment key="stress">
      <div className="elder-fit-card stress">
        <button type="button" className="elder-card-hit" onClick={() => goMeasure('stress')} aria-label="스트레스 상세">
          <div className="elder-fit-head">
            <Ri name="brain" fill />
            <b>스트레스</b>
            {stressShow ? (
              <StatusTag tone={tagTone(stressInfo.tone)}>{stressInfo.label}</StatusTag>
            ) : (
              <StatusTag tone="pending">측정 전</StatusTag>
            )}
          </div>
          <div className="elder-fit-body">
            {stressShow ? (
              <div className="elder-fit-num">
                <div>
                  <strong>{stressSel}<small>점</small></strong>
                  <em>{stressMyAvg !== null ? `내 평균 ${stressMyAvg}점` : '첫 측정'}</em>
                </div>
              </div>
            ) : (
              <p className="elder-fit-hint">편안히 앉아 오늘의 스트레스를 측정해 보세요.</p>
            )}
          </div>
        </button>
        <RewardBlock
            measured={stressMeasured}
          claimed={stressClaimed}
          eligible={stressEligible}
          guide={`${STRESS_REWARD_MAX}점 이하면 지급 · 1일 1회`}
          points={formatClaimP(STRESS_REWARD_P)}
          measureLabel="측정하고"
          repeatLabel="다시 측정하기"
          readyText="측정 완료"
          doneLabel={`오늘 ${formatClaimP(STRESS_REWARD_P)} 받았어요`}
          tip={`오늘 ${stressSel}점${stressMyAvg !== null ? ` (내 평균 ${stressMyAvg}점)` : ''} · ${STRESS_REWARD_MAX}점 이하일 때 지급`}
          onMeasure={() => goMeasure('stress', true)}
          onClaim={() => markClaimed('stress')}
        />
        {/* 7일 그래프는 포인트 버튼 아래 (받는 게 먼저) */}
        {(stressShow || stressHasPrev) && (
          <div className="elder-fit-chart-wrap tail">
            <MiniBars values={stressSeries} labels={day.labels} color={HOME_COLORS.beet} yMax={100} unit="점" todayEmpty={!stressShow} />
            <span className="elder-fit-cap">최근 7일 스트레스</span>
          </div>
        )}
      </div>
          </Fragment>
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
      case 'walk':
        return (
          <Fragment key="walk">
      <div className="elder-fit-card activity">
        <button type="button" className="elder-card-hit" onClick={() => goMeasure('walk')} aria-label="운동하기 (걷기)">
          <div className="elder-fit-head">
            <Ri name="walk" fill />
            <b>운동하기 (걷기)</b>
            {walkShow ? (
              <StatusTag tone={tagTone(walkStatus.tone)}>{walkStatus.label}</StatusTag>
            ) : (
              <StatusTag tone="pending">기록 전</StatusTag>
            )}
          </div>
          <div className="elder-fit-body">
            {walkShow ? (
              <>
                <div className="elder-fit-num">
                  <div>
                    <strong>{stepsLabel}<small>걸음</small></strong>
                    <em>{walkEligible ? `목표 ${WALK_REWARD_STEPS.toLocaleString('ko-KR')}걸음 · ${walkPct}%` : `목표까지 ${walkRemain.toLocaleString('ko-KR')}걸음`}</em>
                  </div>
                </div>
                <progress
                  className="elder-walk-progress"
                  value={Math.min(stepsSel, WALK_REWARD_STEPS)}
                  max={WALK_REWARD_STEPS}
                  aria-label="오늘 걸음 목표 진행률"
                />
              </>
            ) : (
              <p className="elder-fit-hint">반지에 기록된 오늘 걸음을 아직 불러오지 않았어요.</p>
            )}
          </div>
        </button>
        <RewardBlock
            measured={walkMeasured}
          claimed={walkClaimed}
          eligible={walkEligible}
          guide={`${WALK_REWARD_STEPS.toLocaleString('ko-KR')}걸음 이상이면 지급 · 1일 1회`}
          points={formatClaimP(WALK_REWARD_P)}
          measureLabel="걸음 확인하고"
          repeatLabel="걸음 다시 불러오기"
          readyText="걸음 확인 완료"
          doneLabel={`오늘 ${formatClaimP(WALK_REWARD_P)} 받았어요`}
          tip={`오늘 ${stepsLabel}걸음 · ${WALK_REWARD_STEPS.toLocaleString('ko-KR')}걸음 이상일 때 지급`}
          onMeasure={() => goMeasure('walk', true)}
          onClaim={() => markClaimed('walk')}
        />
        {hasPrev(day.steps) && (
          <div className="elder-fit-chart-wrap tail">
            <MiniBars values={day.steps} labels={day.labels} color={HOME_COLORS.leaf} unit="걸음" todayEmpty={!walkShow} />
            <span className="elder-fit-cap">최근 7일 걸음</span>
          </div>
        )}
      </div>
          </Fragment>
        )
      case 'sleep':
        return (
          <Fragment key="sleep">
      <div className="elder-fit-card sleep">
        <button type="button" className="elder-card-hit" onClick={() => goMeasure('sleep')} aria-label="수면 포인트">
          <div className="elder-fit-head">
            <Ri name="moon" fill />
            <b>수면</b>
            {sleepShow ? (
              <StatusTag tone={tagTone(sleepInfo.tone)}>{sleepInfo.label}</StatusTag>
            ) : (
              <StatusTag tone="pending">확인 전</StatusTag>
            )}
          </div>
          <div className="elder-fit-body">
            {sleepShow ? (
              <div className="elder-fit-num">
                <strong className="text">{day.latestLabel}</strong>
                <em>수면 효율 {day.efficiency}%</em>
              </div>
            ) : hasPrev(day.sleepHours) ? (
              <div className="elder-fit-num">
                <strong className="text">{hoursLabel(sleepYday)}</strong>
                <em>지난밤 수면</em>
              </div>
            ) : (
              <p className="elder-fit-hint">지난밤 수면 시간과 수면 효율을 확인해 보세요.</p>
            )}
          </div>
        </button>
        <RewardBlock
            measured={sleepMeasured}
          claimed={sleepClaimed}
          guide="지난밤 수면 확인 시 지급 · 1일 1회"
          points={formatClaimP(SLEEP_REWARD_P)}
          measureLabel="수면 확인하고"
          readyText="확인 완료"
          doneLabel={`오늘 ${formatClaimP(SLEEP_REWARD_P)} 받았어요`}
          onMeasure={() => goMeasure('sleep', true)}
          onClaim={() => markClaimed('sleep')}
        />
        {hasPrev(day.sleepHours) && (
          <div className="elder-fit-chart-wrap tail">
            <MiniBars values={day.sleepHours} labels={day.labels} color={HOME_COLORS.berry} yMax={10} unit="시간" todayEmpty={!sleepShow} />
            <span className="elder-fit-cap">최근 7일 수면 시간</span>
          </div>
        )}
      </div>
          </Fragment>
        )
      case 'survey':
        return (
          <Fragment key="survey">
      <SurveyRewardCard
        joined={surveyMeasured}
        claimed={surveyClaimed}
        onJoin={() => goMeasure('survey')}
        onClaim={() => markClaimed('survey')}
      />
          </Fragment>
        )
    }
  }

  const validDays = validDayCount(session)
  const dateLabel = formatHomeDate(HOME_TODAY)
  const statusLabel = '오늘 나의 상태'

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

          <div className="scroll elder-body">
            <div className="elder-compact-top">
              <div className="elder-date-weather">
                <div className="elder-date-row">
                  <span className="elder-date-center">
                    <b>{dateLabel}</b>
                  </span>
                  <span className={`elder-date-battery ${device.battery <= 20 ? 'low' : ''}`}>
                    <Ri name={device.battery <= 20 ? 'battery-low' : device.battery <= 60 ? 'battery' : 'battery'} fill size={16} />
                    {device.battery}%
                  </span>
                </div>
              </div>
            </div>

            {!session.paired ? (
              <div className="elder-ble-card">
                <div className="elder-ble-ico">
                  <Ri name="bluetooth" fill size={36} />
                </div>
                <b>블루투스를 켜고<br />반지와 연결해 주세요</b>
                <p>휴대폰 블루투스를 켠 뒤<br />토마톡 링을 가까이 두면 찾을 수 있어요.</p>
                <PrimaryButton onClick={() => navigate('/vitaling/pair')}>반지 연결하기</PrimaryButton>
                <button type="button" className="ghost-link" onClick={openVitalingShop}>
                  반지가 없어요 · 구매하기
                </button>
              </div>
            ) : (
              <>
                <div className="elder-section-row">
                  <p className="elder-section-label">
                    {statusLabel}
                    <MetricInfoButton metric="health" className="elder-section-info" />
                  </p>
                  <button
                    type="button"
                    className="elder-device-id"
                    onClick={() => navigate('/reward/history')}
                  >
                    보상내역
                  </button>
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

                {/* 오늘 바이탈: 심박수·혈중 산소·피부 온도·HRV — 값 + 상태 한 줄, 누르면 상세 */}
                <section className="elder-fit-card vitals" aria-label="오늘 바이탈">
                  <div className="home-vitals">
                    {HOME_VITALS.map((v) => (
                      <button key={v.id} type="button" className="home-vital" onClick={() => navigate(`/vitaling/measure/stress?m=${v.id}`)}>
                        <span className="home-vital-ico" style={{ background: v.soft, color: v.color }}><Ri name={v.icon} fill size={20} /></span>
                        <span className="home-vital-copy">
                          <em>{v.label}</em>
                          <strong>{v.value}<small>{v.unit}</small></strong>
                          <span>{v.status}</span>
                        </span>
                      </button>
                    ))}
                  </div>
                </section>

                {session.cardOrder.map(renderCard)}

                <button type="button" className="elder-card-order-btn" onClick={() => setOrderOpen(true)}>
                  <Ri name="list-settings" size={18} />
                  카드 순서 편집
                </button>
              </>
            )}
          </div>
          {orderOpen && <CardOrderSheet order={session.cardOrder} onClose={() => setOrderOpen(false)} />}
        </div>
      </Phone>
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
    { icon: Waveform, title: '바이탈 측정', desc: '심박수 · 혈중 산소 · 피부 온도 · 호흡 · HRV' },
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
