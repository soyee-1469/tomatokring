import {
  BatteryCharging,
  BatteryHigh,
  BatteryWarning,
  Bell,
  Bluetooth,
  Brain,
  CalendarBlank,
  CaretDown,
  CaretLeft,
  CaretRight,
  ChatCircle,
  Check,
  CheckCircle,
  ClipboardText,
  Cpu,
  ForkKnife,
  Drop,
  DropSlash,
  Feather,
  FirstAid,
  GameController,
  Gear,
  GearSix,
  Heart,
  HeartStraight,
  List,
  MagnifyingGlass,
  Moon,
  Person,
  PersonSimpleWalk,
  Robot,
  ShoppingBag,
  Smiley,
  Sparkle,
  Thermometer,
  Translate,
  UsersThree,
  Waveform,
  Wind,
  X,
} from '@phosphor-icons/react'
import { useMemo, useState, type ReactNode } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { BottomNav, Header, InputComponent, Phone, PrimaryButton, Row, Steps, Toggle } from './components/ui'
import { MetricInfoButton } from './components/AccuracyInfo'
import { AUTO_MODE_LABEL } from './measureLog'
import { completeOnboarding, isClaimed, isMeasureDone, markClaimed, maskSerial, pairRing, resetSession, saveVitalId, todayDietPhoto, unpairRing, type MeasureKind } from './session'
import { openVitalingShop, VITALING_SHOP_URL } from './shop'
import {
  ACTIVITY_COLORS,
  ACTIVITY_LEGEND,
  SLEEP_COLORS,
  STRESS_COLORS,
  VITAL_COLORS,
} from './palette'
import { TERMS_DOCS, TERMS_LIST, type TermsDocId } from './termsDocs'
import { useSession } from './useSession'
import { BALANCES, getExchangeStatus } from './screens/RewardHistoryScreen'

export function IndexScreen() {
  const navigate = useNavigate()
  return (
    <div className="stage">
      <Phone>
        <div className="screen">
          <Header title="토마톡메신저" />
          <div className="scroll">
            <p className="eyebrow">TOMATALK × VITAL RING</p>
            <h2 className="headline">화면을 골라 확인해 보세요</h2>
            <p className="lead" style={{ marginBottom: 8 }}>
              실제 서비스 플로우 순서대로 구성했습니다.
            </p>
            {(
              [
                ['서비스', '/service'],
                ['번역상담 기기등록', '/biz/device'],
                ['번역상담 상담사용', '/biz'],
                ['번역상담 고객용', '/biz/customer'],
                ['캐릭터 만들기', '/character'],
                ['토마톡 링 진입(라우팅)', '/vitaling'],
                ['고유번호 등록', '/vitaling/serial'],
                ['약관 동의', '/vitaling/terms'],
                ['전화번호 등록', '/vitaling/profile'],
                ['링 연동', '/vitaling/pair'],
                ['홈', '/vitaling/home'],
                ['종합 점수', '/vitaling/day'],
                ['지갑 (보유)', '/wallet'],
                ['보상 관리', '/reward'],
                ['적립 및 교환 내역', '/reward/history'],
                ['실시간 측정', '/vitaling/live'],
                ['심박 상세', '/vitaling/vital/hr'],
                ['피부온도 상세', '/vitaling/vital/temp'],
                ['바디 리듬', '/vitaling/measure/health'],
                ['실시간 측정', '/vitaling/measure/stress'],
                ['AI 식단 관리', '/vitaling/measure/diet'],
                ['운동 성과', '/vitaling/measure/walk'],
                ['수면 패턴', '/vitaling/measure/sleep'],
                ['설문조사 (월)', '/vitaling/survey'],
                ['스트레스 기록 목록', '/vitaling/measure/stress/history'],
                ['식단 기록 목록', '/vitaling/measure/diet/history'],
                ['걷기 기록 목록', '/vitaling/measure/walk/history'],
                ['스트레스 분석', '/vitaling/stress'],
                ['활동 지수', '/vitaling/activity'],
                ['수면 분석', '/vitaling/sleep'],
                ['알림', '/vitaling/alerts'],
                ['가족 건강 관리', '/vitaling/team'],
                ['설정', '/vitaling/settings'],
                ['도움말', '/vitaling/help'],
                ['사용안내 · 구매', '/vitaling/guide'],
                ['제품 소개(참고)', '/vitaling/intro'],
              ] as const
            ).map(([label, path]) => (
              <Row
                key={path}
                title={label}
                trailing={<CaretRight size={16} weight="light" />}
                onClick={() => navigate(path)}
              />
            ))}
            <button
              type="button"
              className="ghost-link"
              style={{ marginTop: 16 }}
              onClick={() => {
                resetSession()
                navigate('/service')
              }}
            >
              시안 상태 초기화 (첫 진입으로)
            </button>
          </div>
        </div>
      </Phone>
    </div>
  )
}

export function ServiceScreen() {
  const navigate = useNavigate()
  const favs = [
    {
      name: '번역상담 기기등록',
      bg: '#FFE4EC',
      icon: <ChatCircle size={24} weight="fill" color="#E53935" />,
      path: '/biz/device',
    },
    {
      name: '번역상담 상담사용',
      bg: '#FFE4EC',
      icon: <ChatCircle size={24} weight="fill" color="#E53935" />,
      path: '/biz',
    },
    {
      name: '번역상담 고객용',
      bg: '#E8F1FF',
      icon: <UsersThree size={24} weight="fill" color="#3B82F6" />,
      path: '/biz/customer',
    },
    {
      name: '캐릭터 만들기',
      bg: '#FFE4EC',
      icon: <Sparkle size={24} weight="fill" color="#E53935" />,
      path: '/character',
    },
    { name: '이모티콘', bg: '#FFE8A3', icon: <Smiley size={26} weight="fill" color="#F5A623" /> },
  ]
  const list = [
    {
      name: '번역상담 기기등록',
      desc: '설치 후 상담사용/고객용 선택 · 서버 발급 계정 로그인',
      bg: '#FFE4EC',
      icon: <ChatCircle size={22} weight="fill" color="#E53935" />,
      liked: true,
      path: '/biz/device',
      highlight: true,
    },
    {
      name: '번역상담 상담사용',
      desc: '공공기관 다국어 번역상담 · 담당자 태블릿',
      bg: '#FFE4EC',
      icon: <ChatCircle size={22} weight="fill" color="#E53935" />,
      liked: true,
      path: '/biz',
      highlight: true,
    },
    {
      name: '번역상담 고객용',
      desc: '민원인용 실시간 번역상담 · 고객 태블릿',
      bg: '#E8F1FF',
      icon: <UsersThree size={22} weight="fill" color="#3B82F6" />,
      liked: true,
      path: '/biz/customer',
      highlight: true,
    },
    {
      name: '캐릭터 만들기',
      desc: '사진으로 3D 캐릭터 만들기',
      bg: '#FFE4EC',
      icon: <Sparkle size={22} weight="fill" color="#E53935" />,
      liked: true,
      path: '/character',
      highlight: true,
    },
    {
      name: '토마톡 게임',
      desc: '미니게임에 참여하고 포인트 받기',
      bg: '#E8F1FF',
      icon: <GameController size={22} weight="fill" color="#3B82F6" />,
    },
    {
      name: '이모티콘',
      desc: '다양한 이모티콘으로 감정을 표현하세요',
      bg: '#FFF4CC',
      icon: <Smiley size={22} weight="fill" color="#F5A623" />,
      liked: true,
    },
    {
      name: '지니 콩즈',
      desc: 'AI 지니 콩즈에게 무엇이든 물어보세요',
      bg: '#FFE0EF',
      icon: <Robot size={22} weight="fill" color="#E91E8C" />,
      liked: true,
    },
    {
      name: '출석 체크',
      desc: '매일 출석하고 포인트 받기',
      bg: '#D9F5E5',
      icon: <CheckCircle size={22} weight="fill" color="#2BB673" />,
      liked: true,
    },
    {
      name: '토마톡 링',
      desc: '신체 활동을 실시간으로 측정합니다',
      bg: '#FFE8E8',
      icon: <Heart size={22} weight="fill" color="#E53935" />,
      liked: true,
      path: '/vitaling',
      highlight: true,
    },
    {
      name: '친구 초대',
      desc: '친구를 초대하고 혜택을 받으세요',
      bg: '#E8F8FF',
      icon: <UsersThree size={22} weight="fill" color="#0EA5E9" />,
      liked: true,
    },
    {
      name: '토마톡 페이',
      desc: 'TOTT로 간편하게 결제하세요',
      bg: '#FFE4E8',
      icon: <HeartStraight size={22} weight="fill" color="#E53935" />,
    },
    {
      name: '블록체인 게임',
      desc: '자산 연동 블록체인 게임',
      bg: '#FFE8E8',
      icon: <GameController size={22} weight="fill" color="#E53935" />,
    },
  ]

  return (
    <div className="stage">
      <Phone>
        <div className="screen with-nav">
          <Header
            title="서비스"
            right={
              <>
                <button type="button" className="icon-btn" aria-label="검색">
                  <MagnifyingGlass size={22} weight="light" />
                </button>
                <button type="button" className="icon-btn" aria-label="메뉴">
                  <List size={22} weight="light" />
                </button>
              </>
            }
          />
          <div className="scroll service-page">
            <p className="section-label" style={{ marginTop: 2 }}>즐겨찾는 서비스</p>
            <div className="fav-row">
              {favs.map((f) => (
                <button
                  key={f.name}
                  type="button"
                  className="fav-item"
                  onClick={() => 'path' in f && f.path && navigate(f.path)}
                >
                  <div className="orb" style={{ background: f.bg }}>{f.icon}</div>
                  <span>{f.name}</span>
                </button>
              ))}
              <button type="button" className="fav-item">
                <div className="orb fav-plus">
                  <span className="fav-plus-mark">+</span>
                </div>
                <span className="plus-label">&nbsp;</span>
              </button>
            </div>

            {(() => {
              const ex = getExchangeStatus()
              return (
                <div className={`svc-balance ${ex.canExchange ? 'is-ready' : ''}`}>
                  <div className="svc-balance-head">
                    <div className="svc-balance-title">
                      <span>보유 포인트</span>
                      <em className="svc-balance-unit">P</em>
                    </div>
                    <button
                      type="button"
                      className="svc-balance-more"
                      onClick={() => navigate('/reward/history')}
                    >
                      상세내역
                      <CaretRight size={14} weight="bold" />
                    </button>
                  </div>
                  <strong className="svc-balance-hero">
                    {BALANCES.pointAvailable.toLocaleString('ko-KR')}
                  </strong>
                  {ex.canExchange ? (
                    <>
                      <p className="svc-balance-ready-msg">교환 가능!!</p>
                      <button
                        type="button"
                        className="svc-balance-cta"
                        onClick={() => navigate('/reward')}
                      >
                        {ex.maxTott} TOTT 교환하기
                      </button>
                    </>
                  ) : (
                    <div className="ex-status">
                      <p>
                        <b>{ex.remain.toLocaleString('ko-KR')} P</b> 더 모으면{' '}
                        {ex.unlockTott} TOTT 교환 가능
                      </p>
                      <div className="ex-bar" aria-hidden>
                        <i style={{ width: `${ex.progress}%` }} />
                      </div>
                    </div>
                  )}
                </div>
              )
            })()}

            <p className="section-label">서비스 전체</p>
            {list.map((s) => (
              <button
                key={s.name + s.desc}
                type="button"
                className={`svc-item ${s.highlight ? 'highlight' : ''}`}
                onClick={() => s.path && navigate(s.path)}
              >
                <div className="orb" style={{ background: s.bg }}>{s.icon}</div>
                <div>
                  <div className="name">{s.name}</div>
                  <div className="desc">{s.desc}</div>
                </div>
                <HeartStraight
                  size={22}
                  weight={s.liked ? 'fill' : 'light'}
                  color={s.liked ? '#E53935' : '#D0D0D0'}
                />
              </button>
            ))}
          </div>
          <BottomNav active="service" />
        </div>
      </Phone>
    </div>
  )
}

export function VitalingEntryScreen() {
  const session = useSession()
  if (!session.vitalId) return <Navigate to="/vitaling/serial" replace />
  if (session.onboarded) return <Navigate to="/vitaling/home" replace />
  return <Navigate to="/vitaling/terms" replace />
}

/** 바이탈링 앱 연동용 고유번호 최초 등록 */
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
    if (session.onboarded) {
      navigate('/vitaling/home', { replace: true })
      return
    }
    navigate('/vitaling/terms', { replace: true })
  }

  return (
    <div className="stage">
      <Phone>
        <div className="screen">
          <Header title="고유번호 등록" backTo="/service" />
          <div className="scroll">
            <Steps step={1} total={3} />
            <p className="eyebrow">바이탈링 연동</p>
            <h2 className="headline">
              바이탈링 앱의<br />
              고유번호를 입력해 주세요
            </h2>
            <p className="lead" style={{ marginBottom: 22 }}>
              이름·연락처와 함께 토마톡 링과 바이탈링을 연결하는 번호입니다.
              <br />
              바이탈링 앱 설정에서 확인할 수 있어요.
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

export function VitalingGateScreen() {
  const navigate = useNavigate()
  const pillars = [
    { icon: Waveform, title: '실시간 생체 모니터링', desc: '심박·호흡·산소·체온·HRV 24시간 측정' },
    { icon: Moon, title: '수면·스트레스 분석', desc: '수면 단계와 스트레스 지수 종합 리포트' },
    { icon: FirstAid, title: 'SOS 응급호출', desc: '위급 시 보호자에게 즉시 알림' },
    { icon: UsersThree, title: '가족 이상신호 관리', desc: '원격으로 가족 건강 상태를 함께 케어' },
  ]
  const specs = [
    { icon: Cpu, label: 'Dual Core Arm® Cortex®' },
    { icon: Bluetooth, label: '2.4GHz Bluetooth LE 5.0' },
    { icon: Translate, label: '한글화 기본 UI 어플리케이션' },
    { icon: Waveform, label: '건강 이상 자동 감지 기능' },
    { icon: PersonSimpleWalk, label: '신체 활동량 측정 기능' },
    { icon: Brain, label: '자율신경계 스트레스 분석' },
    { icon: Moon, label: '수면 패턴 AI 분석' },
    { icon: Gear, label: '퀄리티 높은 고강도 티타늄 합금' },
    { icon: Feather, label: '2.8g 초경량' },
    { icon: DropSlash, label: '100meter 방수 기능' },
    { icon: BatteryCharging, label: '리튬이온 배터리 탑재' },
    { icon: UsersThree, label: '원격 케어' },
  ]

  return (
    <div className="stage">
      <Phone>
        <div className="screen with-nav">
          <Header title="토마톡 링" backTo="/service" />
          <div className="scroll">
            <div className="hero-visual"><div className="ring-3d" /></div>
            <p className="eyebrow" style={{ textAlign: 'center' }}>한국 최초 SOS 스마트링</p>
            <h2 className="headline" style={{ textAlign: 'center' }}>
              나와 가족의 건강을<br />밀착 관리해요
            </h2>
            <p className="lead" style={{ textAlign: 'center', marginBottom: 14 }}>
              토마톡 서비스에서 토마톡 링을 선택하면<br />
              약관·전화번호 등록 후 메인으로 진입합니다.
            </p>

            <div className="feature-list" style={{ marginBottom: 16 }}>
              {pillars.map(({ icon: Icon, title, desc }) => (
                <div key={title} className="feature">
                  <div className="ico"><Icon size={18} weight="light" /></div>
                  <div>
                    <b>{title}</b>
                    <span>{desc}</span>
                  </div>
                </div>
              ))}
            </div>

            <p className="section-label" style={{ textAlign: 'center' }}>제품 특장점</p>
            <div className="spec-grid">
              {specs.map(({ icon: Icon, label }) => (
                <div key={label} className="spec-cell">
                  <Icon size={26} weight="light" />
                  <span>{label}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="footer shadow">
            <PrimaryButton onClick={() => navigate('/vitaling')}>서비스 플로우로 시작</PrimaryButton>
          </div>
          <BottomNav active="service" />
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
          <Header title="서비스 동의" backTo="/vitaling/serial" />
          <div className="scroll">
            <Steps step={2} total={3} />
            <div className="terms-head">
              <p className="eyebrow">서비스 시작</p>
              <h2 className="headline">토마톡 링을 쓰려면<br />동의가 필요해요</h2>
              <p className="lead">약관 동의와 전화번호 등록을 마치면 메인으로 이동합니다.</p>
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
              한 번 등록하면 다음부터는 서비스 탭에서 바로 메인으로 들어옵니다.
              의료 진단 목적이 아닌 웰니스 서비스입니다. 이상신호·비상 호출은 119를 대체하지 않습니다.
            </div>
          </div>
          <div className="footer shadow">
            <PrimaryButton disabled={!all} onClick={() => navigate('/vitaling/profile')}>
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

export function ProfileScreen() {
  const navigate = useNavigate()
  const [phone, setPhone] = useState('')
  const [touched, setTouched] = useState(false)

  const digits = phone.replace(/\D/g, '').slice(0, 11)
  const formatted = formatPhone(digits)
  const valid = /^010\d{8}$/.test(digits)
  const showError = touched && digits.length > 0 && !valid && digits.length >= 10
  const success = valid

  const onChangePhone = (raw: string) => {
    setTouched(true)
    setPhone(raw.replace(/\D/g, '').slice(0, 11))
  }

  const submit = () => {
    if (!valid) {
      setTouched(true)
      return
    }
    completeOnboarding(digits)
    navigate('/vitaling/home', { replace: true })
  }

  return (
    <div className="stage">
      <Phone>
        <div className="screen">
          <Header title="전화번호 등록" backTo="/vitaling/terms" />
          <div className="scroll">
            <Steps step={3} total={3} />
            <p className="eyebrow">SOS · 보호자 알림용</p>
            <h2 className="headline">연락 가능한<br />전화번호를 등록해 주세요</h2>
            <p className="lead" style={{ marginBottom: 22 }}>
              토마톡 계정과 연결되며, 비상 연락·본인 확인에 사용됩니다.
            </p>

            <InputComponent
              label="휴대폰 번호"
              value={formatted}
              onChange={onChangePhone}
              placeholder="010-0000-0000"
              inputMode="tel"
              success={success}
              error={showError ? '올바른 휴대폰 번호를 입력해 주세요' : undefined}
              helper={!showError && !success ? '숫자만 입력해도 자동으로 맞춰져요' : undefined}
            />
          </div>
          <div className="footer shadow">
            <PrimaryButton disabled={!valid} onClick={submit}>
              등록하고 시작하기
            </PrimaryButton>
          </div>
        </div>
      </Phone>
    </div>
  )
}

function formatPhone(digits: string) {
  if (digits.length <= 3) return digits
  if (digits.length <= 7) return `${digits.slice(0, 3)}-${digits.slice(3)}`
  return `${digits.slice(0, 3)}-${digits.slice(3, 7)}-${digits.slice(7)}`
}

export function PairScreen() {
  const navigate = useNavigate()
  const [selected, setSelected] = useState<string | null>(null)
  const devices = ['VRing-A9C3004', 'VRing-AAA2114']

  const connect = (id: string) => {
    setSelected(id)
    pairRing(id)
    window.setTimeout(() => navigate('/vitaling/home', { replace: true }), 450)
  }

  return (
    <div className="stage">
      <Phone>
        <div className="screen scan-screen">
          <header className="scan-header">
            <span />
            <h1>기기연결</h1>
            <button type="button" className="icon-btn" aria-label="닫기" onClick={() => navigate('/vitaling/home')}>
              <X size={22} weight="light" />
            </button>
          </header>

          <div className="scroll scan-body">
            <h2 className="scan-title">기기 탐색 중입니다</h2>
            <p className="scan-lead">
              토마톡 링을 스마트폰 근처 또는 화면 위에 올려 주세요.
              <br />
              아래 목록에서 반지를 선택하세요.
            </p>

            <div className="scan-radar" aria-hidden>
              <i className="ring r1" />
              <i className="ring r2" />
              <i className="ring r3" />
              <span className="scan-logo" />
            </div>

            <div className="scan-list">
              {devices.map((id) => (
                <button
                  key={id}
                  type="button"
                  className={`scan-device ${selected === id ? 'on' : ''}`}
                  onClick={() => connect(id)}
                >
                  {id}
                </button>
              ))}
            </div>
          </div>

          <div className="footer">
            <button type="button" className="btn-cancel" onClick={() => navigate('/vitaling/home')}>
              취소
            </button>
          </div>
        </div>
      </Phone>
    </div>
  )
}

/** 시안 기준일 (오늘) */
/** 홈 기준 '오늘' = 실제 오늘 (측정·보상 상태 처리와 같은 날짜 기준) */
const HOME_TODAY = startOfDay(new Date())

function toDateKey(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}
const WEEKDAYS_KO = ['일', '월', '화', '수', '목', '금', '토'] as const

function startOfDay(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate())
}

function sameDay(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate()
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

function monthMatrix(year: number, month: number) {
  const first = new Date(year, month, 1)
  const startPad = first.getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const cells: (Date | null)[] = []
  for (let i = 0; i < startPad; i++) cells.push(null)
  for (let day = 1; day <= daysInMonth; day++) cells.push(new Date(year, month, day))
  while (cells.length % 7 !== 0) cells.push(null)
  return cells
}

function HomeCalendarSheet({
  selected,
  onSelect,
  onClose,
}: {
  selected: Date
  onSelect: (d: Date) => void
  onClose: () => void
}) {
  const [cursor, setCursor] = useState(() => new Date(selected.getFullYear(), selected.getMonth(), 1))
  const cells = useMemo(() => monthMatrix(cursor.getFullYear(), cursor.getMonth()), [cursor])
  const minDate = addDays(HOME_TODAY, -90)
  const title = `${cursor.getFullYear()}년 ${cursor.getMonth() + 1}월`

  return (
    <div className="sheet-overlay" role="dialog" aria-modal="true" aria-labelledby="home-cal-title">
      <button type="button" className="sheet-backdrop" aria-label="닫기" onClick={onClose} />
      <div className="sheet-panel home-cal-sheet">
        <div className="sheet-handle" />
        <div className="sheet-top">
          <h2 id="home-cal-title">날짜 선택</h2>
          <button type="button" className="icon-btn" aria-label="닫기" onClick={onClose}>
            <X size={20} weight="bold" />
          </button>
        </div>
        <div className="home-cal-month">
          <button
            type="button"
            className="home-cal-nav"
            aria-label="이전 달"
            onClick={() => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() - 1, 1))}
          >
            <CaretLeft size={18} weight="bold" />
          </button>
          <b>{title}</b>
          <button
            type="button"
            className="home-cal-nav"
            aria-label="다음 달"
            onClick={() => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1))}
          >
            <CaretRight size={18} weight="bold" />
          </button>
        </div>
        <div className="home-cal-weekdays" aria-hidden>
          {WEEKDAYS_KO.map((w) => (
            <span key={w}>{w}</span>
          ))}
        </div>
        <div className="home-cal-grid">
          {cells.map((d, i) => {
            if (!d) return <span key={`e-${i}`} className="home-cal-day empty" />
            const disabled = d > HOME_TODAY || d < minDate
            const on = sameDay(d, selected)
            const isToday = sameDay(d, HOME_TODAY)
            return (
              <button
                key={d.toISOString()}
                type="button"
                disabled={disabled}
                className={`home-cal-day ${on ? 'on' : ''} ${isToday ? 'today' : ''}`}
                onClick={() => {
                  onSelect(d)
                  onClose()
                }}
              >
                {d.getDate()}
              </button>
            )
          })}
        </div>
        <button
          type="button"
          className="home-cal-today"
          onClick={() => {
            onSelect(HOME_TODAY)
            onClose()
          }}
        >
          오늘로 이동
        </button>
      </div>
    </div>
  )
}



/** 군더더기 없는 7일 막대: 오늘만 진하게 + 값 말풍선 (참고 이미지 스타일) */
function MiniBars({
  values,
  labels,
  color,
  bubble,
  todayEmpty = false,
}: {
  values: readonly number[]
  labels: readonly string[]
  color: string
  bubble: string
  /** 오늘 측정 전: 마지막 막대를 점선 빈 막대로 */
  todayEmpty?: boolean
}) {
  const w = 168
  const h = 104
  const top = 30
  const bottom = 18
  const gap = 6
  const n = values.length
  const bw = (w - gap * (n - 1)) / n
  const max = Math.max(1, ...values)
  const last = n - 1
  const bubbleW = Math.max(40, bubble.length * 8 + 16)
  const lastCx = last * (bw + gap) + bw / 2
  const bubbleX = Math.min(w - bubbleW, Math.max(0, lastCx - bubbleW / 2))
  return (
    <svg className="elder-fit-chart" viewBox={`0 0 ${w} ${h}`} aria-hidden>
      {values.map((v, i) => {
        const bh = Math.max(10, (v / max) * (h - top - bottom))
        const x = i * (bw + gap)
        const y = h - bottom - bh
        const isLast = i === last
        if (isLast && todayEmpty) {
          const eh = h - top - bottom
          return (
            <g key={labels[i] ?? i}>
              <rect x={x + 1} y={top + 1} width={bw - 2} height={eh - 2} rx={7} fill="none" stroke="#c5ced6" strokeWidth="1.5" strokeDasharray="4 3" />
              <text x={x + bw / 2} y={h - 3} textAnchor="middle" fontSize="12" fontWeight="800" fill="#1a2332">
                {labels[i]}
              </text>
            </g>
          )
        }
        return (
          <g key={labels[i] ?? i}>
            <rect x={x} y={y} width={bw} height={bh} rx={7} fill={color} opacity={isLast ? 1 : 0.22} />
            <text
              x={x + bw / 2}
              y={h - 3}
              textAnchor="middle"
              fontSize="12"
              fontWeight={isLast ? '800' : '600'}
              fill={isLast ? '#1a2332' : '#9aa3ad'}
            >
              {labels[i]}
            </text>
          </g>
        )
      })}
      {!todayEmpty && (
        <>
          <rect x={bubbleX} y={2} width={bubbleW} height={22} rx={11} fill="#1a2332" />
          <text x={bubbleX + bubbleW / 2} y={17} textAnchor="middle" fontSize="12" fontWeight="800" fill="#fff">
            {bubble}
          </text>
        </>
      )}
    </svg>
  )
}

/** 목표 대비 링 게이지 (칼로리 등) */
function RingGauge({ value, goal, color }: { value: number; goal: number; color: string }) {
  const size = 72
  const stroke = 10
  const r = (size - stroke) / 2
  const c = 2 * Math.PI * r
  const pct = Math.max(0, Math.min(1, value / Math.max(1, goal)))
  return (
    <svg className="elder-fit-ring" viewBox={`0 0 ${size} ${size}`} aria-hidden>
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#eef1f5" strokeWidth={stroke} />
      {pct > 0 && (
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={color}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={`${c * pct} ${c}`}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      )}
    </svg>
  )
}


/** 0~100 종합 점수 → 5단계 상태 (브링 활동 지수 기준: 나쁨·주의·보통·좋음·최상) */
function statusFromScore(score: number) {
  if (score >= 90) return { tone: 'ok' as const, title: '최상이에요', level: '최상' }
  if (score >= 75) return { tone: 'ok' as const, title: '괜찮아요', level: '좋음' }
  if (score >= 50) return { tone: 'warn' as const, title: '보통이에요', level: '보통' }
  if (score >= 35) return { tone: 'warn' as const, title: '주의가 필요해요', level: '주의' }
  return { tone: 'bad' as const, title: '조금 살펴보세요', level: '나쁨' }
}

/** 홈 종합 점수: 무지개 아크 (항목 평균과 동일 표현) */
function TodayScoreArc({ score }: { score: number }) {
  const r = 112
  const cx = 140
  const cy = 132
  const t = Math.min(100, Math.max(0, score)) / 100
  const angle = Math.PI - Math.PI * t
  const x = cx + r * Math.cos(angle)
  const y = cy - r * Math.sin(angle)
  const path = `M ${cx - r} ${cy} A ${r} ${r} 0 0 1 ${cx + r} ${cy}`

  return (
    <svg className="elder-score-arc" viewBox="0 0 280 158" aria-hidden>
      <defs>
        <linearGradient id="homeScoreArcGrad" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#E53935" />
          <stop offset="28%" stopColor="#FF9800" />
          <stop offset="52%" stopColor="#FFEB3B" />
          <stop offset="78%" stopColor="#66BB6A" />
          <stop offset="100%" stopColor="#42A5F5" />
        </linearGradient>
      </defs>
      <path d={path} fill="none" stroke="#eee" strokeWidth="16" strokeLinecap="round" />
      <path d={path} fill="none" stroke="url(#homeScoreArcGrad)" strokeWidth="16" strokeLinecap="round" />
      <circle cx={x} cy={y} r="10" fill="#fff" stroke="#ddd" strokeWidth="2" />
      <circle cx={x} cy={y} r="4.5" fill="#1a2332" />
    </svg>
  )
}

/** 포인트 지급 정책 (11/09 수정본 · 50~70대 앱포스터 측정 기준) — 항목당 1일 1회, 설문은 월 1회 */
const STRESS_REWARD_MAX = 30 // 스트레스 30점 이하(0~30)일 때 지급
const STRESS_AVG_REF = 40 // 또래 평균 39.98점
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
function formatClaimP(points: number) {
  return points % 10_000 === 0 ? `${(points / 10_000).toLocaleString('ko-KR')}만 P` : `${points.toLocaleString('ko-KR')} P`
}

/** 스트레스 점수 등급 — 낮을수록 좋음 */
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
function TodayScoreCard({
  score,
  dayWord,
  tiles,
  deviceStatus,
  onOpen,
}: {
  score: number
  dayWord: string
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
      <button type="button" className="elder-score-gauge" onClick={onOpen} aria-label="오늘 나의 상태 자세히 보기">
        <TodayScoreArc score={score} />
        <div className="elder-score-center">
          <strong>
            {score}
            <small>점</small>
          </strong>
          <b>{dayWord} {status.title}</b>
        </div>
      </button>
      <div className="elder-score-scale" aria-hidden>
        <span>나쁨</span>
        <span>보통</span>
        <span>최상</span>
      </div>
      <button type="button" className="elder-score-open-btn" onClick={onOpen}>
        {byScore.level} · 심장·산소·체온·호흡·수면 평균 · 자세히 보기
        <CaretRight size={12} weight="bold" />
      </button>
    </div>
  )
}


/** 카드 하단 보상 영역: 당일만 지급, 측정 전 → 측정 버튼, 측정 후 기준 충족 → 지급 버튼, 수령 후 → 비활성 완료 */
function RewardBlock({
  isToday,
  measured,
  claimed,
  eligible = true,
  guide,
  measureLabel,
  readyText,
  claimLabel,
  doneLabel,
  tip,
  onMeasure,
  onClaim,
}: {
  isToday: boolean
  measured: boolean
  claimed: boolean
  eligible?: boolean
  guide: string
  measureLabel: string
  readyText: string
  claimLabel: string
  doneLabel: string
  tip?: string
  onMeasure: () => void
  onClaim: () => void
}) {
  if (!isToday) {
    return (
      <div className="elder-score-reward">
        <p className="elder-claim-tip">지난 날짜 기록이에요 · 포인트는 당일에만 지급</p>
      </div>
    )
  }
  return (
    <div className="elder-score-reward">
      {!measured ? (
        <>
          <p className="elder-claim-guide">{guide}</p>
          <button type="button" className="elder-claim-btn secondary" onClick={onMeasure}>
            {measureLabel}
          </button>
        </>
      ) : claimed ? (
        <button type="button" className="elder-claim-btn done" disabled>
          <CheckCircle size={18} weight="fill" />
          {doneLabel}
        </button>
      ) : eligible ? (
        <>
          <p className="elder-claim-guide good"><CheckCircle size={18} weight="fill" />{readyText}</p>
          <button type="button" className="elder-claim-btn" onClick={onClaim}>
            <Heart size={16} weight="fill" />
            {claimLabel}
          </button>
        </>
      ) : (
        <p className="elder-claim-tip">
          <Heart size={12} weight="fill" />
          {tip}
        </p>
      )}
    </div>
  )
}

function seededShift(seed: number, i: number, range: number) {
  const x = Math.sin(seed * 9301 + i * 49297) * 233280
  return Math.round((x - Math.floor(x)) * range * 2 - range)
}
function clampNum(v: number, lo: number, hi: number) {
  return Math.min(hi, Math.max(lo, v))
}
function hoursLabel(h: number) {
  const hh = Math.floor(h)
  return `${hh}시간 ${Math.round((h - hh) * 60)}분`
}

type HomeProfile = (typeof TEAM_HOME)[keyof typeof TEAM_HOME]

/** 선택한 날짜 기준 홈 데이터. 오늘은 기본 샘플, 지난 날짜는 날짜 시드로 달라진 값 (7일 창은 선택 날짜로 끝남) */
function homeDataFor(profile: HomeProfile, date: Date) {
  const labels = Array.from({ length: 7 }, (_, i) => WEEKDAYS_KO[addDays(date, i - 6).getDay()])
  if (sameDay(date, HOME_TODAY)) {
    return {
      labels,
      score: profile.todayScore,
      stress: profile.stressWeek.scores as readonly number[],
      steps: profile.stepsWeek as readonly number[],
      sleepHours: profile.sleepWeek.hours as readonly number[],
      efficiency: profile.sleepWeek.efficiency,
      latestLabel: profile.sleepWeek.latestLabel,
      dietKcal: profile.diet.kcal,
      dietCount: profile.diet.count,
    }
  }
  const seed = date.getFullYear() * 400 + date.getMonth() * 31 + date.getDate()
  const stress = profile.stressWeek.scores.map((v, i) => clampNum(v + seededShift(seed, i, 12), 5, 95))
  const steps = profile.stepsWeek.map((v, i) => clampNum(v + seededShift(seed, i + 10, 1800), 500, 15_000))
  const sleepHours = profile.sleepWeek.hours.map((v, i) => clampNum(Math.round((v + seededShift(seed, i + 20, 10) / 10) * 10) / 10, 3, 10))
  return {
    labels,
    score: clampNum(profile.todayScore + seededShift(seed, 50, 15), 20, 98),
    stress,
    steps,
    sleepHours,
    efficiency: clampNum(profile.sleepWeek.efficiency + seededShift(seed, 30, 12), 20, 98),
    latestLabel: hoursLabel(sleepHours[6]),
    dietKcal: clampNum(profile.diet.kcal + seededShift(seed, 40, 400), 300, 2_600),
    dietCount: 1 + (Math.abs(seed) % 3),
  }
}

function SurveyRewardCard({
  joined,
  claimed,
  isToday,
  onJoin,
  onClaim,
}: {
  joined: boolean
  claimed: boolean
  isToday: boolean
  onJoin: () => void
  onClaim: () => void
}) {
  return (
    <div className="elder-fit-card survey">
      <button type="button" className="elder-card-hit" onClick={onJoin} aria-label="설문조사 (월)">
        <div className="elder-fit-head">
          <i style={{ color: '#2F80ED' }}><ClipboardText size={22} weight="fill" /></i>
          <b>설문조사</b>
          <span className={`elder-menu-tag ${joined ? 'ok' : 'mid'}`}>{joined ? '이번 달 참여 완료' : '이번 달 참여 전'}</span>
        </div>
        <div className="elder-fit-body">
          <div className="elder-fit-num">
            <strong className="text">{new Date().getMonth() + 1}월 설문</strong>
            <em>3문항 · 약 1분 · 매월 1회</em>
          </div>
        </div>
      </button>
      <RewardBlock
        isToday={isToday}
        measured={joined}
        claimed={claimed}
        guide={`설문 3문항에 답하면 ${formatClaimP(SURVEY_REWARD_P)} 지급 · 월 1회`}
        measureLabel="설문하기"
        readyText="설문 완료! 포인트를 받아 보세요"
        claimLabel={`${formatClaimP(SURVEY_REWARD_P)} 지급 받기`}
        doneLabel={`${formatClaimP(SURVEY_REWARD_P)} 지급 완료`}
        onMeasure={onJoin}
        onClaim={onClaim}
      />
    </div>
  )
}

function DietUploadCard({
  kcal,
  goal,
  count,
  photo,
  measured,
  claimed,
  isToday,
  onMeasure,
  onClaim,
}: {
  kcal: number
  goal: number
  count: number
  photo?: string | null
  measured: boolean
  claimed: boolean
  isToday: boolean
  onMeasure: () => void
  onClaim: () => void
}) {
  const shown = measured ? kcal : 0
  return (
    <div className="elder-fit-card diet">
      <button type="button" className="elder-card-hit" onClick={onMeasure} aria-label="AI 식단">
        <div className="elder-fit-head">
          <i style={{ color: '#FF7A45' }}><ForkKnife size={22} weight="fill" /></i>
          <b>AI 식단</b>
          <span className={`elder-menu-tag ${measured ? 'ok' : 'mid'}`}>{measured ? `${count}끼 기록` : '등록 전'}</span>
        </div>
        <div className="elder-fit-body">
          {measured ? (
            <>
              <div className="elder-fit-num">
                <strong>{shown.toLocaleString('ko-KR')}<small>kcal</small></strong>
                <em>목표 {goal.toLocaleString('ko-KR')}kcal</em>
              </div>
              {photo ? (
                <span className="elder-fit-photo">
                  <img src={photo} alt="오늘 올린 식단 사진" />
                </span>
              ) : (
                <RingGauge value={shown} goal={goal} color="#FF7A45" />
              )}
            </>
          ) : (
            <div className="elder-fit-blank">
              <span>식사 사진 한 장으로 칼로리를 확인해 보세요.</span>
            </div>
          )}
        </div>
      </button>
      <RewardBlock
        isToday={isToday}
        measured={measured}
        claimed={claimed}
        guide={`아침·점심·저녁 중 1회 올리면 ${formatClaimP(DIET_REWARD_P)} 지급`}
        measureLabel="식단 사진 올리기"
        readyText="식단 확인 완료! 포인트를 받아 보세요"
        claimLabel={`${formatClaimP(DIET_REWARD_P)} 지급 받기`}
        doneLabel={`${formatClaimP(DIET_REWARD_P)} 지급 완료`}
        onMeasure={onMeasure}
        onClaim={onClaim}
      />
    </div>
  )
}

const TEAM_HOME = {
  me: {
    todayScore: 85,
    tiles: [
      { id: 'hr', label: '심장', value: 72, display: '72', unit: '회/분', max: 200, tone: 'ok' as const, ...VITAL_COLORS.hr, Icon: Heart },
      { id: 'spo2', label: '산소', value: 95, display: '95', unit: '%', max: 100, tone: 'ok' as const, ...VITAL_COLORS.spo2, Icon: Drop },
      { id: 'temp', label: '체온', value: 36.4, display: '36.4', unit: '°C', max: 45, tone: 'ok' as const, ...VITAL_COLORS.temp, Icon: Thermometer },
      { id: 'resp', label: '호흡', value: 18, display: '18', unit: '회/분', max: 40, tone: 'ok' as const, ...VITAL_COLORS.resp, Icon: Wind },
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
      scores: [44, 38, 52, 41, 36, 33, 28],
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
    device: { batteryFull: true, wearing: true, linkMode: 'on' as const },
  },
  mom: {
    todayScore: Math.round((74 + 90 + 82 + 80 + 68 + 70) / 6),
    tiles: [
      { id: 'hr', label: '심장', value: 78, display: '78', unit: '회/분', max: 200, tone: 'ok' as const, ...VITAL_COLORS.hr, Icon: Heart },
      { id: 'spo2', label: '산소', value: 94, display: '94', unit: '%', max: 100, tone: 'warn' as const, ...VITAL_COLORS.spo2, Icon: Drop },
      { id: 'temp', label: '체온', value: 36.2, display: '36.2', unit: '°C', max: 45, tone: 'ok' as const, ...VITAL_COLORS.temp, Icon: Thermometer },
      { id: 'resp', label: '호흡', value: 16, display: '16', unit: '회/분', max: 40, tone: 'ok' as const, ...VITAL_COLORS.resp, Icon: Wind },
    ],
    sleepWeek: {
      days: ['월', '화', '수', '목', '금', '토', '일'],
      hours: [5.4, 6.0, 5.1, 6.2, 5.8, 6.5, 5.6],
      latestLabel: '5시간 36분',
      efficiency: 58,
      stages: [
        { name: '깊은', pct: 18, color: SLEEP_COLORS.stages.deep },
        { name: '렘', pct: 16, color: SLEEP_COLORS.stages.rem },
        { name: '얕은', pct: 48, color: SLEEP_COLORS.stages.light },
        { name: '깸', pct: 18, color: SLEEP_COLORS.stages.awake },
      ],
    },
    stressWeek: {
      days: ['월', '화', '수', '목', '금', '토', '일'],
      scores: [58, 62, 47, 55, 64, 51, 46],
    },
    stepsWeek: [2_010, 2_450, 1_880, 2_600, 2_120, 2_980, 2_240],
    diet: { kcal: 380, goal: 1_800, count: 1 },
    activityDay: {
      score: 38,
      stepsCount: 2_240,
      steps: '2,240',
      bars: Array.from({ length: 72 }, (_, i) => {
        if (i < 20) return ACTIVITY_COLORS.states.sleep
        if (i < 30) return ACTIVITY_COLORS.states.off
        if (i < 36) return ACTIVITY_COLORS.states.rest
        if (i < 42) return ACTIVITY_COLORS.states.active
        if (i < 50) return ACTIVITY_COLORS.states.rest
        if (i < 58) return ACTIVITY_COLORS.states.off
        if (i < 66) return ACTIVITY_COLORS.states.sleep
        return ACTIVITY_COLORS.states.unknown
      }),
      legend: ACTIVITY_LEGEND,
    },
    device: { batteryFull: false, wearing: true, linkMode: 'sync' as const },
  },
} as const

export function HomeScreen() {
  const navigate = useNavigate()
  const session = useSession()
  const [calOpen, setCalOpen] = useState(false)
  const [selectedDate, setSelectedDate] = useState(() => startOfDay(HOME_TODAY))
  const activeMember = 'me' as const
  const profile = TEAM_HOME[activeMember]
  const device = profile.device

  if (!session.vitalId) return <Navigate to="/vitaling/serial" replace />
  if (!session.onboarded) return <Navigate to="/vitaling/terms" replace />

  const tiles = profile.tiles
  const isToday = sameDay(selectedDate, HOME_TODAY)
  const day = homeDataFor(profile, selectedDate)
  const dayWord = isToday ? '오늘' : `${selectedDate.getMonth() + 1}월 ${selectedDate.getDate()}일`
  const stressSel = day.stress[day.stress.length - 1]
  const stressInfo = stressLevel(stressSel)
  const stressEligible = stressSel <= STRESS_REWARD_MAX
  const sleepInfo = sleepEfficiencyLevel(day.efficiency)
  const sleepHoursSel = day.sleepHours[day.sleepHours.length - 1]
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
  const stressShow = !isToday || stressMeasured
  // 오늘 측정 전이라도 이전 기록이 있으면 어제 값 + 오늘 빈 막대, 이전 기록도 없으면 안내 문장만
  const hasPrev = (vals: readonly number[]) => vals.slice(0, -1).some((v) => v > 0)
  const stressYday = day.stress[day.stress.length - 2]
  const stepsYday = day.steps[day.steps.length - 2]
  const sleepYday = day.sleepHours[day.sleepHours.length - 2]
  const walkShow = !isToday || walkMeasured
  const sleepShow = !isToday || sleepMeasured
  const dateQuery = `?d=${toDateKey(selectedDate)}`
  const goMeasure = (kind: MeasureKind) => {
    if (kind === 'sleep') {
      navigate(`/vitaling/sleep${dateQuery}`)
      return
    }
    if (kind === 'survey') {
      navigate('/vitaling/survey')
      return
    }
    navigate(`/vitaling/measure/${kind}${dateQuery}`)
  }


  const dateLabel = formatHomeDate(selectedDate)
  const statusLabel = isToday
    ? '오늘 나의 상태'
    : `${selectedDate.getMonth() + 1}월 ${selectedDate.getDate()}일 나의 상태`

  return (
    <div className="stage">
      <Phone statusTone="dark">
        <div className="screen with-nav elder-home">
          <header className="elder-top">
            <button type="button" className="elder-gear" aria-label="뒤로" onClick={() => navigate('/service')}>
              <CaretRight size={22} weight="bold" style={{ transform: 'rotate(180deg)' }} />
            </button>
            <h1>토마톡 링</h1>
            <div className="elder-top-actions">
              <button type="button" className="elder-gear" aria-label="설정" onClick={() => navigate('/vitaling/settings')}>
                <GearSix size={22} weight="bold" />
              </button>
            </div>
          </header>

          <div className="scroll elder-body">
            <div className="elder-compact-top">
              <div className="elder-date-weather">
                <div className="elder-date-row">
                  <button
                    type="button"
                    className="elder-date-center"
                    onClick={() => setCalOpen(true)}
                    aria-label="달력 열기"
                  >
                    <CalendarBlank size={18} weight="fill" />
                    <b>{dateLabel}</b>
                    <CaretDown size={14} weight="bold" />
                  </button>
                  <span className={`elder-date-battery ${device.batteryFull ? '' : 'low'}`}>
                    {device.batteryFull ? <BatteryHigh size={18} weight="fill" /> : <BatteryWarning size={18} weight="fill" />}
                    {device.batteryFull ? '배터리 충분' : '배터리 부족'}
                  </span>
                </div>
              </div>
            </div>

            {!session.paired ? (
              <div className="elder-ble-card">
                <div className="elder-ble-ico">
                  <Bluetooth size={36} weight="bold" />
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
                <TodayScoreCard
                  score={day.score}
                  dayWord={dayWord}
                  tiles={tiles}
                  onOpen={() => navigate('/vitaling/day')}
                  deviceStatus={null}
                />

                <div className="elder-fit-card stress">
                  <button type="button" className="elder-card-hit" onClick={() => goMeasure('stress')} aria-label="스트레스 측정">
                    <div className="elder-fit-head">
                      <i style={{ color: STRESS_COLORS.line }}><Brain size={22} weight="fill" /></i>
                      <b>스트레스</b>
                      {stressShow ? (
                        <span className={`elder-menu-tag ${tagTone(stressInfo.tone)}`}>{stressInfo.label}</span>
                      ) : (
                        <span className="elder-menu-tag mid">측정 전</span>
                      )}
                    </div>
                    <div className="elder-fit-body">
                      {stressShow ? (
                        <>
                          <div className="elder-fit-num">
                            <strong>{stressSel}<small>점</small></strong>
                            <em>{isToday ? `또래 평균 ${STRESS_AVG_REF}점` : `${dayWord} 기록`}</em>
                          </div>
                          <div className="elder-fit-chart-wrap">
                            <MiniBars values={day.stress} labels={day.labels} color={STRESS_COLORS.line} bubble={`${stressSel}점`} />
                            <span className="elder-fit-cap">최근 7일 스트레스</span>
                          </div>
                        </>
                      ) : hasPrev(day.stress) ? (
                        <>
                          <div className="elder-fit-num">
                            <strong>{stressYday}<small>점</small></strong>
                            <em>어제 기록</em>
                          </div>
                          <div className="elder-fit-chart-wrap">
                            <MiniBars values={day.stress} labels={day.labels} color={STRESS_COLORS.line} bubble="" todayEmpty />
                            <span className="elder-fit-cap">최근 7일 스트레스</span>
                          </div>
                        </>
                      ) : (
                        <div className="elder-fit-blank">
                          <span>편안히 앉아 오늘의 스트레스를 측정해 보세요.</span>
                        </div>
                      )}
                    </div>
                  </button>
                  <RewardBlock
                    isToday={isToday}
                    measured={stressMeasured}
                    claimed={stressClaimed}
                    eligible={stressEligible}
                    guide={`${STRESS_REWARD_MAX}점 이하면 ${formatClaimP(STRESS_REWARD_P)} 지급 · 1일 1회`}
                    measureLabel="측정하기"
                    readyText="기준 통과! 포인트를 받아 보세요"
                    claimLabel={`${formatClaimP(STRESS_REWARD_P)} 지급 받기`}
                    doneLabel={`${formatClaimP(STRESS_REWARD_P)} 지급 완료`}
                    tip={`오늘 ${stressSel}점 (또래 평균 ${STRESS_AVG_REF}점) · ${STRESS_REWARD_MAX}점 이하일 때 지급`}
                    onMeasure={() => goMeasure('stress')}
                    onClaim={() => markClaimed('stress')}
                  />
                </div>

                <DietUploadCard
                  kcal={day.dietKcal}
                  goal={profile.diet.goal}
                  count={day.dietCount}
                  photo={isToday ? todayDietPhoto(session) : null}
                  measured={isToday ? dietMeasured : true}
                  claimed={dietClaimed}
                  isToday={isToday}
                  onMeasure={() => goMeasure('diet')}
                  onClaim={() => markClaimed('diet')}
                />

                <div className="elder-fit-card activity">
                  <button type="button" className="elder-card-hit" onClick={() => goMeasure('walk')} aria-label="운동하기 (걷기)">
                    <div className="elder-fit-head">
                      <i style={{ color: '#43A047' }}><PersonSimpleWalk size={22} weight="fill" /></i>
                      <b>운동하기 (걷기)</b>
                      {walkShow ? (
                        <span className={`elder-menu-tag ${tagTone(walkStatus.tone)}`}>{walkStatus.label}</span>
                      ) : (
                        <span className="elder-menu-tag mid">기록 전</span>
                      )}
                    </div>
                    <div className="elder-fit-body">
                      {walkShow ? (
                        <>
                          <div className="elder-fit-num">
                            <strong>{stepsLabel}<small>걸음</small></strong>
                            <em>{walkEligible ? `목표 달성 ${walkPct}%` : `목표까지 ${walkRemain.toLocaleString('ko-KR')}걸음`}</em>
                          </div>
                          <div className="elder-fit-chart-wrap">
                            <MiniBars values={day.steps} labels={day.labels} color="#43A047" bubble={stepsLabel} />
                            <span className="elder-fit-cap">최근 7일 걸음</span>
                          </div>
                        </>
                      ) : hasPrev(day.steps) ? (
                        <>
                          <div className="elder-fit-num">
                            <strong>{stepsYday.toLocaleString('ko-KR')}<small>걸음</small></strong>
                            <em>어제 기록</em>
                          </div>
                          <div className="elder-fit-chart-wrap">
                            <MiniBars values={day.steps} labels={day.labels} color="#43A047" bubble="" todayEmpty />
                            <span className="elder-fit-cap">최근 7일 걸음</span>
                          </div>
                        </>
                      ) : (
                        <div className="elder-fit-blank">
                          <span>반지에 기록된 오늘의 걸음 수를 불러와요.</span>
                        </div>
                      )}
                    </div>
                  </button>
                  <RewardBlock
                    isToday={isToday}
                    measured={walkMeasured}
                    claimed={walkClaimed}
                    eligible={walkEligible}
                    guide={`${WALK_REWARD_STEPS.toLocaleString('ko-KR')}걸음 이상이면 ${formatClaimP(WALK_REWARD_P)} 지급 · 1일 1회`}
                    measureLabel="활동 기록 보기"
                    readyText="목표 달성! 포인트를 받아 보세요"
                    claimLabel={`${formatClaimP(WALK_REWARD_P)} 지급 받기`}
                    doneLabel={`${formatClaimP(WALK_REWARD_P)} 지급 완료`}
                    tip={`오늘 ${stepsLabel}걸음 · ${WALK_REWARD_STEPS.toLocaleString('ko-KR')}걸음 이상일 때 지급`}
                    onMeasure={() => goMeasure('walk')}
                    onClaim={() => markClaimed('walk')}
                  />
                </div>

                <div className="elder-fit-card sleep">
                  <button type="button" className="elder-card-hit" onClick={() => goMeasure('sleep')} aria-label="수면 포인트">
                    <div className="elder-fit-head">
                      <i style={{ color: '#7B61FF' }}><Moon size={22} weight="fill" /></i>
                      <b>수면</b>
                      {sleepShow ? (
                        <span className={`elder-menu-tag ${tagTone(sleepInfo.tone)}`}>{sleepInfo.label}</span>
                      ) : (
                        <span className="elder-menu-tag mid">확인 전</span>
                      )}
                    </div>
                    <div className="elder-fit-body">
                      {sleepShow ? (
                        <>
                          <div className="elder-fit-num">
                            <strong className="text">{day.latestLabel}</strong>
                            <em>수면 효율 {day.efficiency}%</em>
                          </div>
                          <div className="elder-fit-chart-wrap">
                            <MiniBars values={day.sleepHours} labels={day.labels} color="#7B61FF" bubble={`${sleepHoursSel.toFixed(1)}시간`} />
                            <span className="elder-fit-cap">최근 7일 수면 시간</span>
                          </div>
                        </>
                      ) : hasPrev(day.sleepHours) ? (
                        <>
                          <div className="elder-fit-num">
                            <strong className="text">{hoursLabel(sleepYday)}</strong>
                            <em>어제 기록</em>
                          </div>
                          <div className="elder-fit-chart-wrap">
                            <MiniBars values={day.sleepHours} labels={day.labels} color="#7B61FF" bubble="" todayEmpty />
                            <span className="elder-fit-cap">최근 7일 수면 시간</span>
                          </div>
                        </>
                      ) : (
                        <div className="elder-fit-blank">
                          <span>지난밤 수면 시간과 수면 효율을 확인해 보세요.</span>
                        </div>
                      )}
                    </div>
                  </button>
                  <RewardBlock
                    isToday={isToday}
                    measured={sleepMeasured}
                    claimed={sleepClaimed}
                    guide={`지난밤 수면 확인 시 ${formatClaimP(SLEEP_REWARD_P)} 지급 · 1일 1회`}
                    measureLabel="수면 확인하기"
                    readyText="수면 확인 완료! 포인트를 받아 보세요"
                    claimLabel={`${formatClaimP(SLEEP_REWARD_P)} 지급 받기`}
                    doneLabel={`${formatClaimP(SLEEP_REWARD_P)} 지급 완료`}
                    onMeasure={() => goMeasure('sleep')}
                    onClaim={() => markClaimed('sleep')}
                  />
                </div>

                <SurveyRewardCard
                  joined={surveyMeasured}
                  claimed={surveyClaimed}
                  isToday={isToday}
                  onJoin={() => goMeasure('survey')}
                  onClaim={() => markClaimed('survey')}
                />
              </>
            )}
          </div>
          <BottomNav active="service" />
          {calOpen && (
            <HomeCalendarSheet
              selected={selectedDate}
              onSelect={setSelectedDate}
              onClose={() => setCalOpen(false)}
            />
          )}
        </div>
      </Phone>
    </div>
  )
}

export function ActivityScreen() {
  const heights = [40, 55, 35, 70, 62, 48, 80]
  return (
    <div className="stage">
      <Phone>
        <div className="screen with-nav" style={{ background: 'var(--bg)' }}>
          <Header title="활동" backTo="/vitaling/home" />
          <div className="scroll bg">
            <div className="chips">
              {['1일', '7일', '30일', '90일'].map((t, i) => (
                <button key={t} type="button" className={`chip ${i === 0 ? 'on' : ''}`}>{t}</button>
              ))}
            </div>
            <div className="stat-hero">
              <div className="label" style={{ fontSize: 12, color: 'var(--text-3)', fontWeight: 600 }}>오늘 걸음</div>
              <div className="big">4,820</div>
              <div style={{ fontSize: 13, color: 'var(--text-2)' }}>목표 8,000보 · 60% 달성</div>
              <div className="bars">
                {heights.map((h, i) => (
                  <i key={i} style={{ height: `${h}%` }} />
                ))}
              </div>
            </div>
            <div className="metric-grid">
              <div className="metric"><div className="k">칼로리</div><div className="v">186</div><div className="u">kcal</div></div>
              <div className="metric"><div className="k">거리</div><div className="v">3.2</div><div className="u">km</div></div>
            </div>
          </div>
          <BottomNav active="service" />
        </div>
      </Phone>
    </div>
  )
}

export function SleepScreen() {
  return (
    <div className="stage">
      <Phone>
        <div className="screen with-nav" style={{ background: 'var(--bg)' }}>
          <Header title="수면" backTo="/vitaling/home" />
          <div className="scroll bg">
            <div className="stat-hero">
              <div style={{ fontSize: 12, color: 'var(--text-3)', fontWeight: 600 }}>지난밤 수면</div>
              <div className="big">7h 12m</div>
              <div style={{ fontSize: 13, color: 'var(--text-2)' }}>수면 점수 82 · 회복에 좋아요</div>
            </div>
            <div className="metric-grid">
              <div className="metric"><div className="k">깊은 수면</div><div className="v" style={{ fontSize: 20 }}>1h 40m</div></div>
              <div className="metric"><div className="k">REM</div><div className="v" style={{ fontSize: 20 }}>1h 25m</div></div>
              <div className="metric"><div className="k">얕은 수면</div><div className="v" style={{ fontSize: 20 }}>3h 50m</div></div>
              <div className="metric"><div className="k">깨어남</div><div className="v" style={{ fontSize: 20 }}>17m</div></div>
            </div>
          </div>
          <BottomNav active="service" />
        </div>
      </Phone>
    </div>
  )
}

export function AlertsScreen() {
  const [tab, setTab] = useState('전체')
  const items = [
    { title: '심박 상승 주의', date: '오늘 09:12', tag: '주의', color: '#ef6c00', sub: '안정시 심박이 평소보다 높아요', cat: '주의' },
    { title: '제스처 SOS 감지', date: '어제 22:40', tag: '위험', color: '#e53935', sub: '비상호출이 실행되었어요', cat: '위험' },
    { title: '산소포화도 저하', date: '어제 18:20', tag: '주의', color: '#ef6c00', sub: 'SpO₂ 92% · 잠시 후 회복', cat: '주의' },
    { title: '수면 리포트', date: '어제 07:05', tag: '건강', color: '#2e7d32', sub: '깊은 수면이 조금 부족했어요', cat: '건강' },
  ]
  const tabs = ['전체', '위험', '주의', '건강']
  const filtered = tab === '전체' ? items : items.filter((i) => i.cat === tab)

  return (
    <div className="stage">
      <Phone>
        <div className="screen with-nav" style={{ background: 'var(--bg)' }}>
          <Header title="이상신호 · 경고" backTo="/vitaling/home" />
          <div className="scroll bg">
            <p className="lead" style={{ marginBottom: 10 }}>푸시 알림과 최근 경고 로그입니다.</p>
            <div className="chips">
              {tabs.map((t) => (
                <button key={t} type="button" className={`chip ${tab === t ? 'on' : ''}`} onClick={() => setTab(t)}>{t}</button>
              ))}
            </div>
            {filtered.map((it) => (
              <div key={it.title} className="alert-card">
                <div className="orb" style={{ background: it.color }}><Bell size={18} weight="light" /></div>
                <div>
                  <div className="t">{it.title}</div>
                  <div className="d">{it.date} · {it.sub}</div>
                </div>
                <span className="tag">{it.tag}</span>
              </div>
            ))}
          </div>
          <BottomNav active="service" />
        </div>
      </Phone>
    </div>
  )
}

export function TeamScreen() {
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const family = [
    { name: '어머니', relation: '부모님', status: '정상', tone: 'ok', vitals: '심박 68 · SpO₂ 97%' },
    { name: '아버지', relation: '부모님', status: '주의', tone: 'warn', vitals: '심박 98 · 스트레스 높음' },
    { name: '동생', relation: '가족', status: '정상', tone: 'ok', vitals: '수면 점수 84' },
  ]

  return (
    <div className="stage">
      <Phone>
        <div className="screen with-nav">
          <Header title="가족 건강 관리" backTo="/vitaling/home" />
          <div className="scroll">
            <p className="eyebrow">원격 모니터링</p>
            <h2 className="headline" style={{ fontSize: 20 }}>등록된 가족의<br />상태를 한눈에</h2>
            <p className="lead">이상 신호 감지 시 푸시로 바로 알려드려요.</p>

            <p className="section-label">가족 리스트</p>
            <div className="family-list">
              {family.map((m) => (
                <div key={m.name} className={`family-card ${m.tone}`}>
                  <div className="family-top">
                    <div className="avatar"><Person size={20} weight="light" /></div>
                    <div className="family-meta">
                      <b>{m.name}</b>
                      <span>{m.relation}</span>
                    </div>
                    <span className={`status-pill ${m.tone}`}>{m.status}</span>
                  </div>
                  <div className="family-vitals">{m.vitals}</div>
                </div>
              ))}
            </div>

            <p className="section-label">최근 경고</p>
            <div className="note" style={{ marginBottom: 12 }}>
              아버지 · 어제 21:14 · 심박 상승 주의 알림이 전달되었어요.
            </div>

            <p className="section-label">보호자 초대</p>
            <div className="invite-row">
              <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="전화번호 입력" />
              <button type="button" className="btn-line">공유 +</button>
            </div>
            <div className="or">또는</div>
            <div className="invite-row">
              <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="이메일 입력" />
              <button type="button" className="btn-line">공유 +</button>
            </div>
            <div className="note">
              보호자는 이상신호 · SOS 알림을 함께 받을 수 있어요.
            </div>
          </div>
          <BottomNav active="service" />
        </div>
      </Phone>
    </div>
  )
}

export function SettingsScreen() {
  const navigate = useNavigate()
  const session = useSession()
  const [wifiOnly, setWifiOnly] = useState(false)
  const [sos, setSos] = useState(true)
  const [sleepStress, setSleepStress] = useState(true)
  const [hrAlert, setHrAlert] = useState(true)
  const [spo2Alert, setSpo2Alert] = useState(true)
  const [openDoc, setOpenDoc] = useState<TermsDocId | null>(null)
  const doc = openDoc ? TERMS_DOCS[openDoc] : null

  return (
    <div className="stage">
      <Phone>
        <div className="screen with-nav">
          <Header title="설정 · 기기 관리" backTo="/vitaling/home" />
          <div className="scroll">
            <p className="section-label" style={{ marginTop: 4 }}>스마트링</p>
            <div className="device-card">
              <div className="device-card-row">
                <span>연결 상태</span>
                <b className={session.paired ? 'ok-text' : ''}>
                  {session.paired ? 'BLE 연결됨' : '미연결'}
                </b>
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
                <b>{session.paired ? 'v1.8.4' : '--'}</b>
              </div>
            </div>

            <p className="section-label">기기 연결</p>
            {session.paired ? (
              <>
                <Row
                  title="다른 반지 연결"
                  desc="새 기기로 다시 연결합니다"
                  trailing={<CaretRight size={14} weight="light" />}
                  onClick={() => navigate('/vitaling/pair')}
                />
                <Row
                  title="토마톡 링 연결 해제"
                  onClick={() => unpairRing()}
                />
              </>
            ) : (
              <Row
                title="반지 연결하기"
                desc="설정에서 언제든 연결할 수 있어요"
                trailing={<CaretRight size={14} weight="light" />}
                onClick={() => navigate('/vitaling/pair')}
              />
            )}
            <Row title="내 반지 찾기" trailing={<CaretRight size={14} weight="light" />} />

            <p className="section-label">측정</p>
            <Row
              title="자동 측정 모드"
              desc={`심박수 ${AUTO_MODE_LABEL[session.autoMeasure.hr]} · 혈중 산소 ${AUTO_MODE_LABEL[session.autoMeasure.spo2]}`}
              trailing={<CaretRight size={14} weight="light" />}
              onClick={() => navigate('/vitaling/settings/auto-measure')}
            />
            <Row
              title="직접 재기 (실시간 측정)"
              desc="심박수 · 혈중 산소 · 피부 온도 · 스트레스를 지금 바로 측정"
              trailing={<CaretRight size={14} weight="light" />}
              onClick={() => navigate('/vitaling/measure/stress?m=hr')}
            />

            <p className="section-label">비상 연락망</p>
            <Row title="보호자 1 · 어머니" desc="010-1234-5678" trailing={<CaretRight size={14} weight="light" />} />
            <Row title="보호자 2 · 동생" desc="010-9876-5432" trailing={<CaretRight size={14} weight="light" />} />
            <Row title="비상연락망 추가" trailing={<CaretRight size={14} weight="light" />} />

            <p className="section-label">알림 · 임계치</p>
            <div className="toggle-row"><span>비상 호출(SOS) 기능</span><Toggle on={sos} onToggle={() => setSos(!sos)} /></div>
            <div className="toggle-row"><span>심박 임계치 초과 알림</span><Toggle on={hrAlert} onToggle={() => setHrAlert(!hrAlert)} /></div>
            <div className="toggle-row"><span>산소포화도 저하 알림</span><Toggle on={spo2Alert} onToggle={() => setSpo2Alert(!spo2Alert)} /></div>
            <div className="toggle-row"><span>수면 중 스트레스 자동 측정</span><Toggle on={sleepStress} onToggle={() => setSleepStress(!sleepStress)} /></div>
            <div className="toggle-row"><span>Wi-Fi에서만 데이터 갱신</span><Toggle on={wifiOnly} onToggle={() => setWifiOnly(!wifiOnly)} /></div>

            <p className="section-label">약관</p>
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
          <BottomNav active="service" />
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
    { n: '1', title: '서비스에서 토마톡 링 선택', desc: '토마톡 하단 서비스 탭에서 토마톡 링으로 들어옵니다.' },
    { n: '2', title: '약관 · 전화번호 등록', desc: '동의와 연락처를 등록하면 메인으로 이동합니다. 다음부터는 바로 들어와요.' },
    { n: '3', title: '메인에서 기능 미리보기', desc: '수면·스트레스·실시간 바이탈 화면을 샘플로 둘러볼 수 있어요.' },
    { n: '4', title: '링크로 구매 · 연결', desc: '구매는 공식몰 링크에서 진행하고, 수령 후 앱에서 반지를 연결합니다.' },
  ]

  const features = [
    { icon: Waveform, title: '실시간 생체 신호', desc: '심박·호흡·산소·피부온도·HRV' },
    { icon: Moon, title: '수면 · 스트레스', desc: '패턴 분석과 종합 리포트' },
    { icon: FirstAid, title: 'SOS 응급호출', desc: '위급 시 보호자에게 즉시 알림' },
    { icon: UsersThree, title: '가족 원격 케어', desc: '이상신호를 가족과 공유' },
  ]

  return (
    <div className="stage">
      <Phone>
        <div className="screen with-nav">
          <Header title="사용방법 · 구매" backTo="/vitaling/home" />
          <div className="scroll">
            <div className="hero-visual" style={{ marginBottom: 8 }}>
              <div className="ring-3d" />
            </div>
            <p className="eyebrow" style={{ textAlign: 'center' }}>VITAL RING</p>
            <h2 className="headline" style={{ textAlign: 'center', fontSize: 20 }}>
              반지가 없어도<br />먼저 써보고 구매해요
            </h2>
            <p className="lead" style={{ textAlign: 'center' }}>
              앱에서는 사용방법을 확인하고,
              <br />
              구매는 공식몰 링크에서 진행합니다.
            </p>

            <a className="shop-card linkish" href={VITALING_SHOP_URL} target="_blank" rel="noreferrer">
              <ShoppingBag size={22} weight="light" />
              <div>
                <b>공식몰에서 구매하기</b>
                <span>링크로 이동 · 색상·사이즈·배송지 입력</span>
              </div>
              <CaretRight size={16} weight="light" color="#999" />
            </a>

            <p className="section-label">앱에서 이렇게 사용해요</p>
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

            <p className="section-label">샘플 화면 체험</p>
            <div className="guide-demo-row">
              {[
                ['수면 분석', '/vitaling/sleep'],
                ['스트레스', '/vitaling/stress'],
                ['실시간', '/vitaling/live'],
              ].map(([label, path]) => (
                <button key={path} type="button" className="guide-demo" onClick={() => navigate(path)}>
                  {label}
                </button>
              ))}
            </div>
          </div>
          <div className="footer shadow">
            <a className="btn btn-primary" href={VITALING_SHOP_URL} target="_blank" rel="noreferrer">
              구매 링크로 이동
            </a>
            <button type="button" className="btn-line full" style={{ marginTop: 8 }} onClick={() => navigate('/vitaling/pair')}>
              이미 있어요 · 반지 연결
            </button>
          </div>
          <BottomNav active="service" />
        </div>
      </Phone>
    </div>
  )
}

export function HelpScreen() {
  const navigate = useNavigate()
  return (
    <div className="stage">
      <Phone>
        <div className="screen with-nav">
          <Header title="도움말" backTo="/vitaling/home" />
          <div className="scroll">
            <Row
              title="사용방법 · 구매"
              desc="기능 미리보기 · 공식몰 링크 구매"
              trailing={<CaretRight size={14} weight="light" />}
              onClick={() => navigate('/vitaling/guide')}
            />
            <Row
              title="토마톡 링 구매하기"
              desc="공식몰 링크로 이동합니다"
              trailing={<CaretRight size={14} weight="light" />}
              onClick={openVitalingShop}
            />
            <Row
              title="반지 연결하기"
              desc="기기 탐색 화면으로 이동합니다"
              trailing={<CaretRight size={14} weight="light" />}
              onClick={() => navigate('/vitaling/pair')}
            />
            <Row title="공지사항" trailing={<CaretRight size={14} weight="light" />} />
            <Row title="자주 묻는 질문" trailing={<CaretRight size={14} weight="light" />} />
            <Row title="1:1 문의하기" trailing={<CaretRight size={14} weight="light" />} />
            <Row title="전화 문의하기" trailing={<CaretRight size={14} weight="light" />} />

            <div className="help-block">
              <h3>토마톡 링 사용법</h3>
              <p>
                토마톡 서비스 → 토마톡 링. 약관·전화번호 등록을 마치면 메인으로 들어가고, 그다음부터는 바로 진입합니다.
                구매는 앱 안에서 결제하지 않고 공식몰 링크로 진행합니다.
              </p>
              <ol>
                <li>전용 무선 충전기를 USB-C로 연결합니다.</li>
                <li>반지를 올리면 빨간 LED, 완료 시 초록 LED로 바뀝니다.</li>
              </ol>
            </div>
          </div>
          <BottomNav active="service" />
        </div>
      </Phone>
    </div>
  )
}
