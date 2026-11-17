import {
  CaretLeft,
  ChatCircle,
  CheckCircle,
  DotsThree,
  SquaresFour,
  User,
  Wallet,
  WarningCircle,
  X,
  type Icon,
} from '@phosphor-icons/react'
import { useId, useState, type ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'

export type NavTab = 'friends' | 'chat' | 'wallet' | 'service' | 'more'

export function BottomNav({ active = 'service' }: { active?: NavTab }) {
  const navigate = useNavigate()
  const tabs: { id: NavTab; label: string; icon: Icon; badge?: string; to?: string; fab?: boolean }[] = [
    { id: 'friends', label: '친구', icon: User },
    { id: 'chat', label: '대화', icon: ChatCircle, badge: '88' },
    { id: 'wallet', label: '지갑', icon: Wallet, fab: true, to: '/wallet' },
    { id: 'service', label: '서비스', icon: SquaresFour, to: '/service' },
    { id: 'more', label: '더보기', icon: DotsThree },
  ]

  return (
    <nav className="bottom-nav" aria-label="메인 메뉴">
      {tabs.map((tab) => {
        const IconComp = tab.icon
        const isOn = active === tab.id
        return (
          <button
            key={tab.id}
            type="button"
            className={`bottom-nav-item ${isOn ? 'on' : ''} ${tab.fab ? 'fab' : ''}`}
            onClick={() => tab.to && navigate(tab.to)}
          >
            <span className={`nav-icon-wrap ${tab.fab ? 'fab-wrap' : ''}`}>
              <IconComp size={tab.fab ? 26 : 24} weight={tab.fab || isOn ? 'fill' : 'light'} />
              {tab.badge && <span className="nav-badge">{tab.badge}</span>}
            </span>
            <span className="nav-label">{tab.label}</span>
          </button>
        )
      })}
    </nav>
  )
}

export function Phone({
  children,
  statusTone = 'dark',
}: {
  children: ReactNode
  statusTone?: 'dark' | 'light'
}) {
  return (
    <div className="phone">
      <div className="status-bar" style={{ color: statusTone === 'light' ? '#fff' : '#111' }}>
        <span>10:30</span>
        <span className="icons">▮▮▮  Wi-Fi  100%</span>
      </div>
      {children}
    </div>
  )
}

export function Header({
  title,
  backTo,
  right,
  transparent,
}: {
  title: string
  backTo?: string
  right?: ReactNode
  transparent?: boolean
}) {
  const navigate = useNavigate()
  return (
    <header className={`header ${transparent ? 'transparent' : ''}`}>
      <div>
        {backTo !== undefined ? (
          <button type="button" className="icon-btn" aria-label="뒤로" onClick={() => navigate(backTo)}>
            <CaretLeft size={22} weight="light" />
          </button>
        ) : (
          <button type="button" className="icon-btn" aria-label="뒤로" onClick={() => navigate(-1)}>
            <CaretLeft size={22} weight="light" />
          </button>
        )}
      </div>
      <h1>{title}</h1>
      <div className="right-slot">{right}</div>
    </header>
  )
}

export function PrimaryButton({
  children,
  disabled,
  onClick,
}: {
  children: ReactNode
  disabled?: boolean
  onClick?: () => void
}) {
  return (
    <button type="button" className="btn btn-primary" disabled={disabled} onClick={onClick}>
      {children}
    </button>
  )
}

export function Field({
  label,
  value,
  onChange,
  placeholder,
  unit,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  placeholder?: string
  unit?: string
}) {
  return (
    <InputComponent
      label={label}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      trailing={unit ? <span className="input-unit">{unit}</span> : undefined}
    />
  )
}

/** 토마톡 InputComponent — default / focus / error / success */
export function InputComponent({
  label,
  value,
  onChange,
  placeholder,
  maxLength,
  showCounter,
  helper,
  error,
  success,
  inputMode,
  trailing,
}: {
  label?: string
  value: string
  onChange: (v: string) => void
  placeholder?: string
  maxLength?: number
  showCounter?: boolean
  helper?: string
  error?: string
  success?: boolean
  inputMode?: 'text' | 'numeric' | 'tel' | 'email'
  trailing?: ReactNode
}) {
  const id = useId()
  const [focused, setFocused] = useState(false)
  const state = error ? 'error' : success && value ? 'success' : focused ? 'focus' : 'default'
  const showClear = Boolean(value) && (focused || state === 'error')

  return (
    <div className={`toma-input state-${state}`}>
      {label && <label htmlFor={id}>{label}</label>}
      <div className="toma-input-line">
        <input
          id={id}
          value={value}
          placeholder={placeholder}
          maxLength={maxLength}
          inputMode={inputMode}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
        />
        {showCounter && maxLength != null && (
          <span className="toma-counter">{value.length}/{maxLength}</span>
        )}
        {trailing}
        {state === 'success' && !showClear && (
          <CheckCircle size={20} weight="fill" className="toma-status ok" />
        )}
        {state === 'error' && !showClear && (
          <WarningCircle size={20} weight="fill" className="toma-status err" />
        )}
        {showClear && (
          <button
            type="button"
            className="toma-clear"
            aria-label="지우기"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => onChange('')}
          >
            <X size={16} weight="bold" />
          </button>
        )}
      </div>
      {(error || helper) && (
        <p className={`toma-helper ${error ? 'err' : ''}`}>{error || helper}</p>
      )}
    </div>
  )
}

export function Toggle({ on, onToggle }: { on: boolean; onToggle: () => void }) {
  return (
    <button type="button" className={`toggle ${on ? 'on' : ''}`} aria-pressed={on} onClick={onToggle} />
  )
}

export function Steps({ step, total = 3 }: { step: number; total?: number }) {
  return (
    <div className="steps" aria-label={`${total}단계 중 ${step}단계`}>
      {Array.from({ length: total }, (_, i) => (
        <i key={i} className={i < step ? 'on' : ''} />
      ))}
    </div>
  )
}

export function Row({
  title,
  desc,
  icon: IconComp,
  tone = '#fff1f0',
  color = 'var(--red)',
  trailing,
  onClick,
}: {
  title: string
  desc?: string
  icon?: Icon
  tone?: string
  color?: string
  trailing?: ReactNode
  onClick?: () => void
}) {
  return (
    <button type="button" className="row" onClick={onClick}>
      {IconComp && (
        <div className="orb" style={{ background: tone, color }}>
          <IconComp size={20} weight="light" />
        </div>
      )}
      <div>
        <div className="title">{title}</div>
        {desc && <div className="desc">{desc}</div>}
      </div>
      {trailing && <div className="trail">{trailing}</div>}
    </button>
  )
}
