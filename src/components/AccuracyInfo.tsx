import { CaretRight, Info, X } from '@phosphor-icons/react'
import { useEffect, useRef, useState, type ReactNode } from 'react'
import { createPortal } from 'react-dom'

const ROWS: [string, string][] = [
  ['피부 온도', '25°C ~ 43°C (± 0.1°C)'],
  ['심박수', '30 ~ 210bpm (1.24bpm)'],
  ['안정시 심박수', '수면/안정 시 자동 측정'],
  ['혈중 산소농도', '70 ~ 100% (3.14% 이하, FDA 기준 이내)'],
  ['호흡수', '6 ~ 30회/분 (1.6bpm 이하)'],
  ['수면 측정', '수면다원검사와 수면시간 비교'],
  ['스트레스 측정', 'HRV 매트릭스 파라미터와 비교'],
  ['HR RR-Interval', '300 ~ 2000ms (7ms 이하)'],
]

function resolveSheetHost(anchor?: Element | null) {
  if (anchor) {
    const screen = anchor.closest('.screen')
    if (screen) return screen
    const phone = anchor.closest('.phone')
    if (phone) return phone
  }
  return document.querySelector('.phone .screen') ?? document.querySelector('.phone')
}

export function AccuracyInfoButton({
  className = '',
  tone = 'accent',
}: {
  className?: string
  tone?: 'accent' | 'plain'
}) {
  const [open, setOpen] = useState(false)
  const btnRef = useRef<HTMLButtonElement>(null)
  return (
    <>
      <button
        ref={btnRef}
        type="button"
        className={`${tone === 'plain' ? 'icon-btn' : 'info-btn'} ${className}`.trim()}
        aria-label="측정 정확도 안내"
        onClick={() => setOpen(true)}
      >
        <Info size={22} weight="regular" />
      </button>
      {open && <AccuracySheet anchor={btnRef.current} onClose={() => setOpen(false)} />}
    </>
  )
}

export function AccuracySheet({
  onClose,
  anchor = null,
}: {
  onClose: () => void
  anchor?: Element | null
}) {
  const [host, setHost] = useState<Element | null>(null)

  useEffect(() => {
    setHost(resolveSheetHost(anchor))
  }, [anchor])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  if (!host) return null

  return createPortal(
    <div className="sheet-overlay" role="dialog" aria-modal="true" aria-labelledby="accuracy-title">
      <button type="button" className="sheet-backdrop" aria-label="닫기" onClick={onClose} />
      <div className="sheet-panel">
        <div className="sheet-handle" />
        <div className="sheet-top">
          <h2 id="accuracy-title">측정 정확도</h2>
          <button type="button" className="icon-btn" aria-label="닫기" onClick={onClose}>
            <X size={20} weight="light" />
          </button>
        </div>
        <p className="accuracy-lead">센서별로 측정 범위와 오차 범위예요.</p>
        <div className="accuracy-table">
          <div className="accuracy-head">
            <span>센서 항목</span>
            <span>측정값 (정확도)</span>
          </div>
          {ROWS.map(([k, v]) => (
            <div key={k} className="accuracy-row">
              <span>{k}</span>
              <span>{v}</span>
            </div>
          ))}
        </div>
        <p className="accuracy-note">
          본 수치는 웰니스 목적의 참고 정보이며, 의료 진단·치료 목적으로 사용할 수 없습니다.
        </p>
      </div>
    </div>,
    host,
  )
}

export function WithInfoTitle({ children, title }: { children?: ReactNode; title: string }) {
  return (
    <div className="with-info-title">
      <span>{title}</span>
      <AccuracyInfoButton />
      {children}
    </div>
  )
}


/* ===== 지표별 정보(i) 안내 — 브링 앱의 정보 팝업 구성(지표 설명 → 기록이 없을 때 확인 → 면책)을 우리 스타일로 ===== */
export type MetricInfoKey = 'stress' | 'hr' | 'hrv' | 'spo2' | 'temp' | 'sleep' | 'diet' | 'walk' | 'health' | 'survey'

const METRIC_INFO: Record<MetricInfoKey, { title: string; what: string[]; tips?: string[]; rules?: string[] }> = {
  stress: {
    title: '스트레스 지수',
    what: [
      '심장 박동 사이 간격의 변화(심박변이도)를 바탕으로 몸이 받는 긴장 정도를 0~100으로 나타낸 값이에요.',
      '숫자가 낮을수록 편안한 상태예요. 0~20 매우 낮음, 21~40 낮음, 41~60 보통, 61~80 높음, 81~100 매우 높음으로 나눠요.',
      '오래 높은 상태가 이어지면 건강에 영향을 줄 수 있으니 하루 한 번씩 확인하며 관리해 보세요.',
    ],
  },
  hr: {
    title: '심박수',
    what: [
      '1분 동안 심장이 뛰는 횟수예요. 편히 쉴 때는 보통 60~100회 사이예요.',
      '걷기, 커피, 긴장, 더위에 따라 오르내리는 것이 자연스러워요.',
    ],
    tips: ['앉거나 가만히 있는 편안한 상태에서 재면 가장 정확해요.'],
  },
  hrv: {
    title: '심박변이도',
    what: [
      '심장 박동과 다음 박동 사이 간격이 얼마나 달라지는지를 ms 단위로 나타낸 값이에요.',
      '값이 높을수록 몸이 스트레스에 잘 적응하고 회복이 좋은 상태예요. 낮으면 피로, 스트레스, 수면 부족의 신호일 수 있어요.',
      '하루하루 값보다 여러 날의 흐름을 함께 보는 것이 중요해요.',
    ],
  },
  spo2: {
    title: '혈중 산소',
    what: [
      '혈액 속에 산소가 얼마나 실려 있는지를 %로 나타낸 값이에요. 보통 95% 이상이면 정상 범위예요.',
      '잠자는 동안에는 일시적으로 낮아질 수 있고, 잠시 뒤 회복되면 걱정하지 않아도 돼요.',
      '코골이가 심하거나 수면 중 숨이 자주 멎는 분은 낮게 측정될 수 있어요.',
    ],
    tips: ['손이 차가우면 피가 덜 돌아 값이 낮게 나올 수 있어요. 손을 따뜻하게 해 주세요.'],
  },
  temp: {
    title: '피부 온도',
    what: [
      '손가락 피부에서 잰 온도로, 체온의 바깥쪽 지표예요. 잠, 주변 환경, 스트레스에 따라 달라져요.',
      '정상 범위 안에서 조금씩 변하는 것은 자연스러워요. 갑자기 크게 변하면 피로나 몸 상태의 신호일 수 있어요.',
    ],
  },
  sleep: {
    title: '수면',
    what: [
      '수면 효율은 침대에 있던 시간 중 실제로 잠든 시간의 비율이에요. 81% 이상이면 최상이에요.',
      '깊은 잠, 렘 수면, 얕은 잠, 깬 상태 4단계로 나눠 보여 줘요.',
    ],
    tips: ['잠자는 동안 링을 끼고 있어야 기록돼요. 낮잠은 수면 기록에 포함되지 않을 수 있어요.'],
  },
  diet: {
    title: 'AI 식단',
    what: [
      'AI가 음식 사진을 분석해 칼로리와 영양 정보를 알려주는 기능이에요.',
      '제공되는 분석 결과는 AI가 일반적인 기준을 바탕으로 산출한 참고용 건강 정보이며, 실제 섭취량이나 재료에 따라 차이가 있을 수 있어요.',
      '특정 질병이나 알레르기가 있는 경우, 사용 전 반드시 전문가와 상담해 주세요.',
      '현재 이 기능은 Beta(시범 운영) 단계로, 하루 최대 20회까지 분석할 수 있어요.',
      'Beta 단계가 끝나면 분석 횟수나 제공 항목이 바뀔 수 있어요.',
    ],
  },
  walk: {
    title: '운동하기 (걷기)',
    what: [
      '링의 움직임 센서로 걸음 수를 세고, 걸음과 시간을 바탕으로 거리와 소모 칼로리를 계산해요.',
      '설거지처럼 손을 많이 움직이는 일은 걸음으로 잡힐 수 있어요. 전체 흐름을 참고해 주세요.',
    ],
  },
  health: {
    title: '바디 리듬',
    // 브링 앱 '바디 리듬' 안내 모달 문구
    what: [
      '이 서비스는 의료 진단이나 치료 목적이 아닌, 일상적인 컨디션 관리를 돕는 참고 지표예요.',
      '바디 리듬 점수는 절대적인 수치가 아니라, 내 최근 평균 상태(기준선)와 비교한 상대적인 변화를 보여줘요.',
      '수면, 휴식, 수분 섭취 등 규칙적인 생활 습관을 함께 관리하면 더 정확한 리듬 분석이 가능해요.',
    ],
    // 브링 앱 '아직 데이터가 충분하지 않아요' 안내 기준
    rules: [
      '유효한 기록이 7회 쌓여야 바디 리듬 점수가 계산돼요. 그 전에는 "데이터가 충분하지 않아요"로 표시돼요.',
      '하루에 2개 이상의 유효 데이터가 기록되어야 1회로 인정돼요. 이때 수면 기록이 반드시 포함돼야 해요.',
      '링을 오래 착용했더라도 데이터가 부족한 날은 분석 횟수에서 제외될 수 있어요. 잠잘 때 링을 끼고 주무세요.',
    ],
  },
  survey: {
    title: '설문조사 (월)',
    what: [
      '매달 1회 짧은 설문(3문항)에 답하면 포인트가 지급돼요.',
      '이번 달 수면·스트레스·걸음 요약을 함께 보여 드려요.',
    ],
  },
}

const NO_RECORD_STEPS = [
  '링 연결을 해제했다가 다시 연결해 보세요. (설정 > 링 연결)',
  '펌웨어를 최신 버전으로 업데이트해 보세요. (설정 > 기기 설정)',
  '자동 측정 모드를 다른 방식으로 바꿔 보세요. (설정 > 자동 측정)',
  '센서 보정을 진행해 보세요. (설정 > 센서 보정)',
]

const WEAR_TIPS = [
  '링이 너무 크면 센서가 피부에 닿지 않아 오차가 생길 수 있어요.',
  '너무 꽉 끼면 혈류가 눌려 값이 달라질 수 있어요.',
  '센서가 손바닥 쪽을 향하도록 끼워 주세요.',
]

export function MetricInfoButton({
  metric,
  className = '',
  tone = 'plain',
}: {
  metric: MetricInfoKey
  className?: string
  tone?: 'accent' | 'plain'
}) {
  const [open, setOpen] = useState(false)
  const btnRef = useRef<HTMLButtonElement>(null)
  return (
    <>
      <button
        ref={btnRef}
        type="button"
        className={`${tone === 'plain' ? 'icon-btn' : 'info-btn'} ${className}`.trim()}
        aria-label={`${METRIC_INFO[metric].title} 안내`}
        onClick={() => setOpen(true)}
      >
        <Info size={22} weight="regular" />
      </button>
      {open && <MetricInfoSheet metric={metric} anchor={btnRef.current} onClose={() => setOpen(false)} />}
    </>
  )
}

export function MetricInfoSheet({
  metric,
  onClose,
  anchor = null,
}: {
  metric: MetricInfoKey
  onClose: () => void
  anchor?: Element | null
}) {
  const [host, setHost] = useState<Element | null>(null)
  const [showAccuracy, setShowAccuracy] = useState(false)
  /** 팝업 안 스크롤을 피하려고 긴 내용은 두 번째 페이지로 */
  const [page, setPage] = useState<'main' | 'trouble'>('main')
  const info = METRIC_INFO[metric]
  const isDevice = metric !== 'diet' && metric !== 'survey'

  useEffect(() => {
    setHost(resolveSheetHost(anchor))
  }, [anchor])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  if (!host) return null
  if (showAccuracy) return <AccuracySheet anchor={anchor} onClose={onClose} />

  return createPortal(
    <div className="sheet-overlay" role="dialog" aria-modal="true" aria-labelledby="metric-info-title">
      <button type="button" className="sheet-backdrop" aria-label="닫기" onClick={onClose} />
      <div className="sheet-panel metric-info">
        <div className="sheet-handle" />
        <div className="sheet-top">
          {page === 'trouble' ? (
            <button type="button" className="icon-btn" aria-label="이전" onClick={() => setPage('main')}>
              <CaretRight size={20} weight="bold" style={{ transform: 'rotate(180deg)' }} />
            </button>
          ) : null}
          <h2 id="metric-info-title">{page === 'trouble' ? '기록이 없거나 이상할 때' : `${info.title}란?`}</h2>
          <button type="button" className="icon-btn" aria-label="닫기" onClick={onClose}>
            <X size={20} weight="light" />
          </button>
        </div>
        <div className="metric-info-scroll">
          {page === 'main' ? (
            <>
              <ul className="metric-info-list">
                {info.what.map((line) => (
                  <li key={line}>{line}</li>
                ))}
              </ul>
              {info.rules?.length ? (
                <>
                  <h3 className="metric-info-sub">점수가 계산되려면</h3>
                  <ul className="metric-info-list">
                    {info.rules.map((line) => (
                      <li key={line}>{line}</li>
                    ))}
                  </ul>
                </>
              ) : null}
              {info.tips?.length ? (
                <>
                  <h3 className="metric-info-sub">이렇게 재면 더 정확해요</h3>
                  <ul className="metric-info-list">
                    {info.tips.map((line) => (
                      <li key={line}>{line}</li>
                    ))}
                  </ul>
                </>
              ) : null}
              {isDevice ? (
                <button type="button" className="metric-info-link" onClick={() => setPage('trouble')}>
                  기록이 없거나 이상할 때 확인할 점
                  <CaretRight size={16} weight="bold" />
                </button>
              ) : null}
              {metric !== 'health' && (
                <p className="accuracy-note">웰니스 기기라 수치는 참고용이에요. 진단·치료 근거로는 쓸 수 없어요.</p>
              )}
            </>
          ) : (
            <>
              <ol className="metric-info-steps">
                {NO_RECORD_STEPS.map((line) => (
                  <li key={line}>{line}</li>
                ))}
              </ol>
              <h3 className="metric-info-sub">착용 방법</h3>
              <ul className="metric-info-list">
                {WEAR_TIPS.map((line) => (
                  <li key={line}>{line}</li>
                ))}
              </ul>
              <button type="button" className="metric-info-link" onClick={() => setShowAccuracy(true)}>
                센서 측정 정확도 표 보기
                <CaretRight size={16} weight="bold" />
              </button>
            </>
          )}
        </div>
        <button type="button" className="sheet-close-btn" onClick={page === 'trouble' ? () => setPage('main') : onClose}>
          {page === 'trouble' ? '이전' : '닫기'}
        </button>
      </div>
    </div>,
    host,
  )
}
