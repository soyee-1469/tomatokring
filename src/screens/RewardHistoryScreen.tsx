import {
  ArrowsLeftRight,
  CalendarCheck,
  CaretDown,
  CaretLeft,
  CaretUp,
  GameController,
  Heart,
  UserPlus,
} from '@phosphor-icons/react'
import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Phone } from '../components/ui'
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
  { id: 'vitaling', label: '토마톡 링' },
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

function formatSignedP(n: number) {
  const sign = n > 0 ? '+ ' : n < 0 ? '' : ''
  // negative already has -
  if (n < 0) return `${formatP(n)} P`
  return `${sign}${formatP(n)} P`
}

function formatSignedTott(n: number) {
  if (n < 0) return `${n} TOTT`
  return `+ ${n} TOTT`
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
    title: '토마톡 링 연동 보상',
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

function filterActivities(items: Activity[], source: RewardFilter, pay: PayType) {
  return items.filter((item) => {
    // 교환은 발생 경로 ‘전체’에서만 (또는 포인트/TOTT 유형 필터로 각각 노출)
    if (item.source === 'exchange') {
      if (source !== 'all') return false
      if (pay === 'all') return true
      if (pay === 'point') return item.point != null && item.point !== 0
      if (pay === 'tott') return item.tott != null && item.tott !== 0
      return false
    }
    if (source !== 'all' && item.source !== source) return false
    if (pay === 'all') return true
    if (pay === 'point') return item.point != null && item.point !== 0
    if (pay === 'tott') return item.tott != null && item.tott !== 0
    return true
  })
}

function activityIcon(item: Activity): ReactNode {
  if (item.source === 'exchange') {
    return (
      <span className="rh-ico exchange">
        <ArrowsLeftRight size={20} weight="bold" />
      </span>
    )
  }
  if (item.source === 'vitaling') {
    return (
      <span className="rh-ico vitaling">
        <Heart size={22} weight="fill" />
      </span>
    )
  }
  if (item.source === 'game') {
    return (
      <span className="rh-ico game">
        <GameController size={22} weight="fill" />
      </span>
    )
  }
  if (item.source === 'attend') {
    return (
      <span className="rh-ico attend">
        <CalendarCheck size={22} weight="fill" />
      </span>
    )
  }
  return (
    <span className="rh-ico invite">
      <UserPlus size={22} weight="fill" />
    </span>
  )
}

function amountTone(n: number, currency: 'p' | 'tott') {
  if (n < 0) return 'debit'
  return currency === 'p' ? 'p' : 'tott'
}

function RewardFilters({
  value,
  onChange,
}: {
  value: RewardFilter
  onChange: (v: RewardFilter) => void
}) {
  return (
    <div className="rh-filters" role="tablist" aria-label="발생 경로">
      {REWARD_FILTERS.map((f) => (
        <button
          key={f.id}
          type="button"
          role="tab"
          aria-selected={value === f.id}
          className={`rh-filter ${value === f.id ? 'on' : ''}`}
          onClick={() => onChange(f.id)}
        >
          {f.label}
        </button>
      ))}
    </div>
  )
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

function ActivityRow({ item, payFocus = 'all' }: { item: Activity; payFocus?: PayType }) {
  const showPoint =
    item.point != null &&
    item.point !== 0 &&
    (payFocus === 'all' || payFocus === 'point')
  const showTott =
    item.tott != null &&
    item.tott !== 0 &&
    (payFocus === 'all' || payFocus === 'tott')

  const title =
    item.source === 'exchange' && payFocus === 'tott'
      ? '포인트에서 생성된 토큰'
      : item.source === 'exchange' && payFocus === 'point'
        ? 'TOTT 교환으로 포인트 사용'
        : item.title

  const detail =
    item.source === 'exchange' && payFocus === 'tott'
      ? `${formatP(Math.abs(item.point ?? 0))}P 교환`
      : item.source === 'exchange' && payFocus === 'point'
        ? `${item.tott ?? 0} TOTT로 전환`
        : item.sub ?? ''

  return (
    <div className={`rh-item ${item.source === 'exchange' ? 'is-exchange' : ''}`}>
      {activityIcon(item)}
      <div className="rh-item-body">
        <div className="rh-item-left">
          <b className="rh-item-title">{title}</b>
          <em className="rh-item-date">{fmtHistDate(item.date)}</em>
        </div>
        <div className="rh-item-right">
          <div className="rh-item-amt">
            {showPoint && (
              <strong className={`tone-${amountTone(item.point!, 'p')}`}>{formatSignedP(item.point!)}</strong>
            )}
            {showTott && (
              <strong className={`tone-${amountTone(item.tott!, 'tott')}`}>{formatSignedTott(item.tott!)}</strong>
            )}
          </div>
          {detail ? <span className="rh-item-detail">{detail}</span> : null}
        </div>
      </div>
    </div>
  )
}

function ActivityToolbar({
  source,
  onSource,
  pay,
  onPay,
}: {
  source: RewardFilter
  onSource: (v: RewardFilter) => void
  pay: PayType
  onPay: (v: PayType) => void
}) {
  return (
    <div className="rh-toolbar">
      <RewardFilters value={source} onChange={onSource} />
      <PayTypeDropdown value={pay} onChange={onPay} />
    </div>
  )
}

/** 보상 관리 */
export function RewardHistoryScreen() {
  const navigate = useNavigate()
  const [source, setSource] = useState<RewardFilter>('all')
  const [pay, setPay] = useState<PayType>('all')
  const preview = useMemo(() => filterActivities(ACTIVITIES, source, pay).slice(0, 5), [source, pay])

  const maxTott =
    BALANCES.pointAvailable >= MIN_P_TO_EXCHANGE
      ? Math.floor(BALANCES.pointAvailable / P_PER_TOTT)
      : 0

  return (
    <div className="stage">
      <Phone>
        <div className="screen rh-screen">
          <header className="rh-header">
            <button type="button" className="rh-back" aria-label="뒤로" onClick={() => navigate('/vitaling/home')}>
              <CaretLeft size={22} weight="bold" />
            </button>
            <h1>보상 관리</h1>
            <span className="rh-header-spacer" />
          </header>

          <div className="scroll rh-body">
            <div className="rh-asset-card simple focus-point">
              <div className="rh-point-hero">
                <em>보유 포인트</em>
                <strong>
                  {formatP(BALANCES.pointAvailable)}
                  <small>P</small>
                </strong>
              </div>
              {maxTott > 0 ? (
                <div className="rh-exchange-ready">
                  <div className="rh-exchange-qty">
                    <em>지금 교환 가능</em>
                    <strong>{maxTott}</strong>
                    <span>TOTT</span>
                  </div>
                  <button type="button" className="rh-exchange-btn compact">
                    {maxTott} TOTT 교환하기
                  </button>
                </div>
              ) : (
                <div className="rh-exchange-progress">
                  <p className="rh-exchange-progress-title">
                    교환까지 <b>{formatP(MIN_P_TO_EXCHANGE - BALANCES.pointAvailable)}P</b> 남았어요
                  </p>
                  <progress
                    className="rh-point-progress"
                    value={BALANCES.pointAvailable}
                    max={MIN_P_TO_EXCHANGE}
                    aria-label="포인트 교환 진행률"
                  />
                </div>
              )}
              <div className="rh-life-row">
                <div className="rh-life-item">
                  <em>누적 포인트</em>
                  <b>
                    {formatP(BALANCES.pointLifetime)}
                    <small>P</small>
                  </b>
                </div>
                <div className="rh-life-item tott">
                  <em>누적 토큰</em>
                  <b>
                    {BALANCES.tottLifetime}
                    <small>TOTT</small>
                  </b>
                </div>
              </div>
            </div>

            <div className="rh-section-head">
              <h2>적립 및 교환 내역</h2>
              <button
                type="button"
                className="rh-more"
                onClick={() => {
                  const q = new URLSearchParams()
                  if (source !== 'all') q.set('source', source)
                  if (pay !== 'all') q.set('type', pay)
                  const qs = q.toString()
                  navigate(`/reward/history${qs ? `?${qs}` : ''}`)
                }}
              >
                전체 보기 +
              </button>
            </div>

            <ActivityToolbar source={source} onSource={setSource} pay={pay} onPay={setPay} />

            {preview.length === 0 ? (
              <p className="rh-empty">해당 조건의 내역이 없어요</p>
            ) : (
              <div className="rh-list">
                {preview.map((item) => (
                  <ActivityRow key={item.id} item={item} payFocus={pay} />
                ))}
              </div>
            )}
          </div>

        </div>
      </Phone>
    </div>
  )
}

/** 적립 및 교환 내역 전체 — Figma 5883:52452 */
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
  { id: 'hv1', source: 'vitaling', icon: 'vitaling', title: '스트레스 측정 보상', date: '26-10-11', detail: '스트레스 24점 (30점 이하)', amount: 200_000, unit: 'P' },
  { id: 'h2', source: 'invite', icon: 'invite', title: '친구 초대 이벤트', date: '26-03-19', detail: '10명 달성 보상', amount: 500_000, unit: 'P' },
  { id: 'h3', source: 'game', icon: 'game', title: '게임 참여 보상', date: '26-03-19', detail: '토마콩즈', amount: 1_000, unit: 'P' },
  { id: 'hv2', source: 'vitaling', icon: 'vitaling', title: '수면 포인트', date: '26-10-10', detail: '지난밤 수면 효율 84%', amount: 200_000, unit: 'P' },
  { id: 'h4', source: 'exchange', icon: 'exchange', title: '포인트 교환', date: '26-10-11', detail: '포인트 > TOTT 교환', amount: 4, unit: 'TOTT' },
  { id: 'h5', source: 'exchange', icon: 'exchange', title: 'TOTT 교환', date: '26-10-11', detail: '포인트 > TOTT 교환', amount: -4_000_000, unit: 'P' },
  { id: 'hv3', source: 'vitaling', icon: 'vitaling', title: 'AI 식단 업로드 보상', date: '26-10-09', detail: '점심 식단 사진 업로드', amount: 200_000, unit: 'P' },
  { id: 'h6', source: 'invite', icon: 'gift', title: '친구 추천 보상', date: '26-10-11', detail: 'James님 추천코드 입력', amount: 0.5, unit: 'TOTT' },
  { id: 'hv4', source: 'vitaling', icon: 'vitaling', title: '설문조사 (월) 보상', date: '26-07-20', detail: '7월 설문 참여', amount: 5_000_000, unit: 'P' },
  { id: 'h7', source: 'invite', icon: 'invite', title: '친구 초대 이벤트', date: '26-03-19', detail: '30명 달성 보상', amount: 500_000, unit: 'P' },
  { id: 'h8', source: 'invite', icon: 'gift', title: '친구 추천 보상', date: '26-10-11', detail: 'bbb님 추천코드 입력', amount: 0.5, unit: 'TOTT' },
  { id: 'hv5', source: 'vitaling', icon: 'vitaling', title: '운동하기 (걷기) 보상', date: '26-10-08', detail: '8,412걸음 (8,000걸음 이상)', amount: 200_000, unit: 'P' },
  { id: 'h9', source: 'game', icon: 'ad', title: '광고 시청 보상', date: '26-03-19', detail: '광고시청', amount: 1_000, unit: 'P' },
  { id: 'h10', source: 'game', icon: 'game', title: '게임 참여 보상', date: '26-03-19', detail: '사다리게임', amount: 1_000, unit: 'P' },
  { id: 'hv6', source: 'vitaling', icon: 'vitaling', title: '심박수 측정 보상', date: '26-03-19', detail: '일일 측정 완료', amount: 1_000, unit: 'P' },
  { id: 'h11', source: 'invite', icon: 'gift', title: '친구 추천 보상', date: '26-10-11', detail: '123님 추천코드 입력', amount: 0.5, unit: 'TOTT' },
  { id: 'h12', source: 'attend', icon: 'attend', title: '출석 체크 보상', date: '26-03-19', detail: '30명 달성 보상', amount: 1_000, unit: 'P' },
  { id: 'h13', source: 'game', icon: 'ad', title: '광고 시청 보상', date: '26-03-19', detail: '광고시청', amount: 1_000, unit: 'P' },
  { id: 'hv7', source: 'vitaling', icon: 'vitaling', title: '스트레스 관리 보상', date: '26-03-18', detail: '안정 구간 유지', amount: 1_500, unit: 'P' },
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
      <div className="rh-tx-body">
        <div className="rh-tx-main">
          <p className="rh-tx-title">{item.title}</p>
          <div className={`rh-tx-amt ${tott ? 'is-tott' : ''}`}>
            <strong>{amt.value}</strong>
            <span>{amt.unit}</span>
          </div>
        </div>
        <div className="rh-tx-meta">
          <em>{fmtHistDate(item.date)}</em>
          <span>{item.detail}</span>
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
            <button type="button" className="rh-back" aria-label="뒤로" onClick={() => navigate('/reward')}>
              <img src={backIcon} alt="" width={40} height={40} />
            </button>
            <h1>보상 내역</h1>
            <span className="rh-header-spacer" />
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
