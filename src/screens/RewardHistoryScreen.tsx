import {
  CaretDown,
  CaretUp,
} from '@phosphor-icons/react'
import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Phone } from '../components/ui'
import { PointGuideButton } from '../components/PointGuide'
import adBg from '../assets/reward/ad-bg.svg'
import adFg from '../assets/reward/ad-fg.svg'
import attendBg from '../assets/reward/attend-bg.svg'
import attendFg from '../assets/reward/attend-fg.svg'
import backIcon from '../assets/reward/back.svg'
import exchangeBg from '../assets/reward/exchange-bg.svg'
import exchangeFg from '../assets/reward/exchange-fg.svg'
import gameBg from '../assets/reward/game-bg.svg'
import gameFg from '../assets/reward/game-fg.svg'
import giftBg from '../assets/reward/gift-bg.svg'
import giftFg from '../assets/reward/gift-fg.svg'
import inviteBg from '../assets/reward/invite-bg.svg'
import inviteFg from '../assets/reward/invite-fg.svg'
import vitalingBg from '../assets/reward/vitaling-bg.svg'
import vitalingFg from '../assets/reward/vitaling-fg.svg'

export type RewardSource = 'vitaling' | 'game' | 'attend' | 'invite' | 'exchange'
export type RewardFilter = 'all' | 'vitaling' | 'game' | 'attend' | 'invite'
export type PayType = 'all' | 'point' | 'tott'

type Activity = {
  id: string
  source: RewardSource
  title: string
  date: string
  sub?: string
  /** 포인트 변동 (없으면 null) */
  point?: number
  /** TOTT 변동 (없으면 null) */
  tott?: number
}

export const REWARD_FILTERS: { id: RewardFilter; label: string }[] = [
  { id: 'all', label: '전체' },
  { id: 'vitaling', label: 't.ring' },
  { id: 'game', label: '게임' },
  { id: 'attend', label: '출석' },
  { id: 'invite', label: '초대' },
]

const PAY_TYPE_OPTIONS: { id: PayType; label: string }[] = [
  { id: 'all', label: '전체 유형' },
  { id: 'point', label: '포인트' },
  { id: 'tott', label: 'TOTT' },
]

/** 시안 잔액 — 교환 미충족(진행률 UX) 데모 */
export const BALANCES = {
  pointAvailable: 320_000,
  pointLifetime: 1_250_000,
  tottHeld: 3.5,
  tottLifetime: 12.5,
}

/** 1 TOTT = 1,000,000P (월 29,000,000P = 29 TOTT 정책 기준) */
export const P_PER_TOTT = 1_000_000
export const MIN_P_TO_EXCHANGE = 1_000_000

/** 교환 가능 여부 · 진행률 */
export function getExchangeStatus(pointAvailable = BALANCES.pointAvailable) {
  const canExchange = pointAvailable >= MIN_P_TO_EXCHANGE
  const maxTott = canExchange ? Math.floor(pointAvailable / P_PER_TOTT) : 0
  const progress = Math.min(100, Math.round((pointAvailable / MIN_P_TO_EXCHANGE) * 100))
  const remain = Math.max(0, MIN_P_TO_EXCHANGE - pointAvailable)
  /** 임계 도달 시 받을 수 있는 TOTT (1,000,000P = 1) */
  const unlockTott = Math.floor(MIN_P_TO_EXCHANGE / P_PER_TOTT)
  return { canExchange, maxTott, progress, remain, unlockTott }
}


/** '25-10-11' / '2026.08.04' → '2025년 10월 11일' (올해는 연도 생략) */
function fmtHistDate(raw: string) {
  const m = /^(\d{2,4})[-.](\d{1,2})[-.](\d{1,2})$/.exec(raw)
  if (!m) return raw
  const year = m[1].length === 2 ? 2000 + Number(m[1]) : Number(m[1])
  const md = `${Number(m[2])}월 ${Number(m[3])}일`
  return year === new Date().getFullYear() ? md : `${year}년 ${md}`
}

function formatP(n: number) {
  return n.toLocaleString('ko-KR')
}

/** 통합 내역 — 발생 경로 + 지급 형태 */
export const ACTIVITIES: Activity[] = [
  {
    id: 'a1',
    source: 'invite',
    title: '친구 초대 이벤트',
    date: '2026.08.04',
    sub: '30명 달성 보상',
    point: 2_000_000,
  },
  {
    id: 'a2',
    source: 'game',
    title: '토마콩즈 참여 보상',
    date: '2026.08.04',
    point: 1_000,
  },
  {
    id: 'a3',
    source: 'invite',
    title: '친구 추천 보상',
    date: '2026.08.04',
    sub: 'Anna님 추천코드 입력',
    tott: 0.5,
  },
  {
    id: 'a4',
    source: 'vitaling',
    title: '스트레스 측정 보상',
    date: '2026.08.04',
    sub: '스트레스 24점 (30점 이하)',
    point: 200_000,
  },
  {
    id: 'a5',
    source: 'exchange',
    title: '포인트를 TOTT로 교환',
    date: '2026.08.04',
    sub: '1,000,000P = 1 TOTT',
    point: -4_000_000,
    tott: 4,
  },
  {
    id: 'a6',
    source: 'attend',
    title: '출석 체크 보상',
    date: '2026.08.03',
    sub: '7일 연속 출석',
    point: 1_000,
  },
  {
    id: 'a7',
    source: 'vitaling',
    title: '수면 기록 보상',
    date: '2026.08.03',
    point: 3_000,
  },
  {
    id: 'a8',
    source: 'vitaling',
    title: '착용 연속 보상',
    date: '2026.08.02',
    sub: '7일 착용',
    point: 5_000,
  },
  {
    id: 'a9',
    source: 'game',
    title: '게임 참여 보상',
    date: '2026.08.01',
    sub: '데일리 플레이',
    point: 10_000,
  },
  {
    id: 'a10',
    source: 'vitaling',
    title: 't.ring 연동 보상',
    date: '2026.07.20',
    tott: 0.2,
  },
  {
    id: 'a11',
    source: 'invite',
    title: '친구 추천 보상',
    date: '2026.03.19',
    sub: 'Soorim님 추천코드 입력',
    tott: 0.5,
  },
]

function parseSource(raw: string | null): RewardFilter {
  if (raw === 'vitaling' || raw === 'game' || raw === 'attend' || raw === 'invite') return raw
  return 'all'
}

function parsePayType(raw: string | null): PayType {
  if (raw === 'point' || raw === 'tott') return raw
  return 'all'
}

function PayTypeDropdown({
  value,
  onChange,
  plain = false,
  disabled = false,
}: {
  value: PayType
  onChange: (v: PayType) => void
  /** 박스 없이 텍스트만 */
  plain?: boolean
  /** 예: 토마톡 링은 포인트만 → 잠금 */
  disabled?: boolean
}) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const label = PAY_TYPE_OPTIONS.find((o) => o.id === value)?.label ?? '전체 유형'

  useEffect(() => {
    if (disabled) setOpen(false)
  }, [disabled])

  useEffect(() => {
    if (!open || disabled) return
    const onDoc = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onDoc)
    return () => document.removeEventListener('mousedown', onDoc)
  }, [open, disabled])

  return (
    <div className={`rh-pay-dd ${plain ? 'plain' : ''} ${disabled ? 'is-disabled' : ''}`} ref={ref}>
      <button
        type="button"
        className={`rh-pay-trigger ${plain ? 'plain' : ''} ${open ? 'open' : ''} ${disabled ? 'is-disabled' : ''}`}
        onClick={() => {
          if (disabled) return
          setOpen((v) => !v)
        }}
        aria-expanded={open}
        aria-disabled={disabled}
        disabled={disabled}
      >
        {label}
        {!disabled && (open ? <CaretUp size={12} weight="bold" /> : <CaretDown size={12} weight="bold" />)}
      </button>
      {!disabled && open && (
        <ul className="rh-pay-menu" role="listbox">
          {PAY_TYPE_OPTIONS.map((o) => (
            <li key={o.id}>
              <button
                type="button"
                className={value === o.id ? 'on' : ''}
                onClick={() => {
                  onChange(o.id)
                  setOpen(false)
                }}
              >
                {o.label}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

type HistoryIcon = 'invite' | 'game' | 'exchange' | 'gift' | 'ad' | 'attend' | 'vitaling'

type HistoryRow = {
  id: string
  source: RewardFilter | 'exchange'
  icon: HistoryIcon
  title: string
  date: string
  detail: string
  amount: number
  unit: 'P' | 'TOTT'
}

/** 피그마 「전체 보상 내역」 시안 데이터 */
const HISTORY_ROWS: HistoryRow[] = [
  { id: 'h1', source: 'invite', icon: 'invite', title: '친구 초대 이벤트', date: '26-10-11', detail: '30명 달성 보상', amount: 2_000_000, unit: 'P' },
  { id: 'hv1', source: 'vitaling', icon: 'vitaling', title: '스트레스 측정 보상', date: '26-10-11', detail: '24점', amount: 200_000, unit: 'P' },
  { id: 'h2', source: 'invite', icon: 'invite', title: '친구 초대 이벤트', date: '26-03-19', detail: '10명 달성 보상', amount: 500_000, unit: 'P' },
  { id: 'h3', source: 'game', icon: 'game', title: '게임 참여 보상', date: '26-03-19', detail: '토마콩즈', amount: 1_000, unit: 'P' },
  { id: 'hv2', source: 'vitaling', icon: 'vitaling', title: '수면 포인트', date: '26-10-10', detail: '효율 84%', amount: 200_000, unit: 'P' },
  { id: 'h4', source: 'exchange', icon: 'exchange', title: '포인트 교환', date: '26-10-11', detail: '포인트 → TOTT', amount: 4, unit: 'TOTT' },
  { id: 'h5', source: 'exchange', icon: 'exchange', title: 'TOTT 교환', date: '26-10-11', detail: '포인트 → TOTT', amount: -4_000_000, unit: 'P' },
  { id: 'hv3', source: 'vitaling', icon: 'vitaling', title: '식단 사진 보상', date: '26-10-09', detail: '점심 사진', amount: 200_000, unit: 'P' },
  { id: 'h6', source: 'invite', icon: 'gift', title: '친구 추천 보상', date: '26-10-11', detail: 'James님 추천코드 입력', amount: 0.5, unit: 'TOTT' },
  { id: 'hv4', source: 'vitaling', icon: 'vitaling', title: '월간 설문 보상', date: '26-07-20', detail: '7월', amount: 5_000_000, unit: 'P' },
  { id: 'h7', source: 'invite', icon: 'invite', title: '친구 초대 이벤트', date: '26-03-19', detail: '30명 달성 보상', amount: 500_000, unit: 'P' },
  { id: 'h8', source: 'invite', icon: 'gift', title: '친구 추천 보상', date: '26-10-11', detail: 'bbb님 추천코드 입력', amount: 0.5, unit: 'TOTT' },
  { id: 'hv5', source: 'vitaling', icon: 'vitaling', title: '걷기 보상', date: '26-10-08', detail: '8,412걸음', amount: 200_000, unit: 'P' },
  { id: 'h9', source: 'game', icon: 'ad', title: '광고 시청 보상', date: '26-03-19', detail: '광고시청', amount: 1_000, unit: 'P' },
  { id: 'h10', source: 'game', icon: 'game', title: '게임 참여 보상', date: '26-03-19', detail: '사다리게임', amount: 1_000, unit: 'P' },
  { id: 'hv6', source: 'vitaling', icon: 'vitaling', title: '심박수 측정 보상', date: '26-03-19', detail: '측정 완료', amount: 1_000, unit: 'P' },
  { id: 'h11', source: 'invite', icon: 'gift', title: '친구 추천 보상', date: '26-10-11', detail: '123님 추천코드 입력', amount: 0.5, unit: 'TOTT' },
  { id: 'h12', source: 'attend', icon: 'attend', title: '출석 체크 보상', date: '26-03-19', detail: '30명 달성 보상', amount: 1_000, unit: 'P' },
  { id: 'h13', source: 'game', icon: 'ad', title: '광고 시청 보상', date: '26-03-19', detail: '광고시청', amount: 1_000, unit: 'P' },
  { id: 'hv7', source: 'vitaling', icon: 'vitaling', title: '스트레스 관리 보상', date: '26-03-18', detail: '안정 유지', amount: 1_500, unit: 'P' },
  { id: 'h14', source: 'invite', icon: 'gift', title: '친구 추천 보상', date: '26-10-11', detail: 'aaa님 추천코드 입력', amount: 0.5, unit: 'TOTT' },
  { id: 'h15', source: 'game', icon: 'game', title: '게임 참여 보상', date: '26-03-19', detail: '30명 달성 보상', amount: 1_000, unit: 'P' },
  { id: 'h16', source: 'attend', icon: 'attend', title: '출석 체크 보상', date: '26-03-19', detail: '30명 달성 보상', amount: 1_000, unit: 'P' },
  { id: 'h17', source: 'game', icon: 'ad', title: '광고 시청 보상', date: '26-03-19', detail: '광고시청', amount: 1_000, unit: 'P' },
  { id: 'h18', source: 'attend', icon: 'attend', title: '출석 체크 보상', date: '26-10-11', detail: 'bbb님 추천코드 입력', amount: 15, unit: 'TOTT' },
]

const HISTORY_ICON: Record<HistoryIcon, { bg: string; fg: string }> = {
  invite: { bg: inviteBg, fg: inviteFg },
  game: { bg: gameBg, fg: gameFg },
  exchange: { bg: exchangeBg, fg: exchangeFg },
  gift: { bg: giftBg, fg: giftFg },
  ad: { bg: adBg, fg: adFg },
  attend: { bg: attendBg, fg: attendFg },
  vitaling: { bg: vitalingBg, fg: vitalingFg },
}

function HistoryTxIcon({ kind }: { kind: HistoryIcon }) {
  const { bg, fg } = HISTORY_ICON[kind]
  return (
    <span className="rh-tx-ico" aria-hidden>
      <img className="rh-tx-ico-bg" src={bg} alt="" width={38} height={38} />
      <img className="rh-tx-ico-fg" src={fg} alt="" />
    </span>
  )
}

function formatHistoryAmount(amount: number, unit: 'P' | 'TOTT') {
  if (unit === 'TOTT') {
    const sign = amount > 0 ? '+ ' : amount < 0 ? '' : ''
    return { value: `${sign}${amount}`, unit }
  }
  if (amount < 0) return { value: formatP(amount), unit }
  return { value: `+${formatP(amount)}`, unit }
}

function filterHistory(items: HistoryRow[], source: RewardFilter, pay: PayType = 'all') {
  return items.filter((item) => {
    if (source !== 'all') {
      if (item.source === 'exchange') return false
      if (item.source !== source) return false
    }
    if (pay === 'point') return item.unit === 'P'
    if (pay === 'tott') return item.unit === 'TOTT'
    return true
  })
}

function HistoryTxRow({ item }: { item: HistoryRow }) {
  const amt = formatHistoryAmount(item.amount, item.unit)
  const tott = item.unit === 'TOTT' && item.amount > 0
  return (
    <div className="rh-tx">
      <HistoryTxIcon kind={item.icon} />
      {/* 왼쪽(제목·날짜)과 오른쪽(금액·비고)을 두 칸으로 나눠 서로 침범하지 않게. 오른쪽은 폭 상한 + 말줄임 */}
      <div className="rh-tx-body">
        <div className="rh-tx-left">
          <p className="rh-tx-title">{item.title}</p>
          <em className="rh-tx-date">{fmtHistDate(item.date)}</em>
        </div>
        <div className="rh-tx-right">
          <div className={`rh-tx-amt ${tott ? 'is-tott' : ''}`}>
            <strong>{amt.value}</strong>
            <span>{amt.unit}</span>
          </div>
          <span className="rh-tx-detail">{item.detail}</span>
        </div>
      </div>
    </div>
  )
}

export function RewardHistoryAllScreen() {
  const navigate = useNavigate()
  const [params, setParams] = useSearchParams()
  const source = parseSource(params.get('source'))
  const payRaw = parsePayType(params.get('type'))
  const payLocked = source === 'vitaling'
  const pay: PayType = payLocked ? 'point' : payRaw
  const items = useMemo(() => filterHistory(HISTORY_ROWS, source, pay), [source, pay])

  const setSource = (next: RewardFilter) => {
    const q = new URLSearchParams(params)
    if (next === 'all') q.delete('source')
    else q.set('source', next)
    // 토마톡 링은 포인트만 — 유형을 포인트로 고정
    if (next === 'vitaling') q.set('type', 'point')
    setParams(q)
  }

  const setPay = (next: PayType) => {
    if (payLocked) return
    const q = new URLSearchParams(params)
    if (next === 'all') q.delete('type')
    else q.set('type', next)
    setParams(q)
  }

  return (
    <div className="stage">
      <Phone>
        <div className="screen rh-screen rh-history">
          <header className="rh-header rh-history-header">
            {/* 보상 관리(메신저 화면)는 링 앱에서 뺐다. 뒤로 가면 홈 */}
            <button type="button" className="rh-back" aria-label="뒤로" onClick={() => navigate('/vitaling/home')}>
              <img src={backIcon} alt="" width={40} height={40} />
            </button>
            <h1>보상 내역</h1>
            <span className="rh-header-spacer rh-header-info"><PointGuideButton /></span>
          </header>

          <div className="scroll rh-body rh-history-body">
            <div className="rh-filters rh-history-filters" role="tablist" aria-label="발생 경로">
              {REWARD_FILTERS.map((f) => (
                <button
                  key={f.id}
                  type="button"
                  role="tab"
                  aria-selected={source === f.id}
                  className={`rh-filter ${source === f.id ? 'on' : ''}`}
                  onClick={() => setSource(f.id)}
                >
                  {f.label}
                </button>
              ))}
            </div>

            <div className="rh-history-meta">
              <PayTypeDropdown value={pay} onChange={setPay} plain disabled={payLocked} />
              <span className="rh-history-count">{items.length}건</span>
            </div>

            {items.length === 0 ? (
              <p className="rh-empty">해당 조건의 내역이 없어요</p>
            ) : (
              <div className="rh-tx-list">
                {items.map((item) => (
                  <HistoryTxRow key={item.id} item={item} />
                ))}
              </div>
            )}
          </div>
        </div>
      </Phone>
    </div>
  )
}
