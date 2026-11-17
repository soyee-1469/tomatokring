import { CaretRight } from '@phosphor-icons/react'
import { useState } from 'react'
import { createPortal } from 'react-dom'
import { BottomNav, Header, Phone } from '../components/ui'
import { AUTO_INTERVAL_MIN, AUTO_MODE_LABEL } from '../measureLog'
import { setAutoMeasure, type AutoMeasureKind, type AutoMeasureMode } from '../session'
import { useSession } from '../useSession'

/** 브링 앱 '자동 측정 모드' 화면 구성: 지표별 현재 모드 → 바텀시트에서 표준/배터리 절약/심층 분석 선택 */
const ITEMS: { kind: AutoMeasureKind; title: string; desc: string[] }[] = [
  {
    kind: 'hr',
    title: '심박수',
    desc: ['정해진 주기마다 측정되어 반지에 저장돼요.', '매일 앱과 동기화해 데이터를 안전하게 보관해 주세요.'],
  },
  {
    kind: 'spo2',
    title: '혈중 산소',
    desc: ['정해진 주기마다 측정되어 앱으로 전송돼요.', '블루투스 연결이 끊기거나 앱이 종료되지 않게 해 주세요.'],
  },
]

const MODES: { id: AutoMeasureMode; desc: string }[] = [
  { id: 'standard', desc: '일반적인 사용에 알맞은 균형 잡힌 모드예요.' },
  { id: 'saver', desc: '반지 배터리가 오래 가지만 측정 주기가 길어져요.' },
  { id: 'deep', desc: '더 촘촘히 측정하지만 배터리 사용 시간은 줄어들어요.' },
]

function ModeSheet({
  kind,
  current,
  onClose,
}: {
  kind: AutoMeasureKind
  current: AutoMeasureMode
  onClose: () => void
}) {
  const [picked, setPicked] = useState<AutoMeasureMode>(current)
  const host = document.querySelector('.phone .screen') ?? document.body
  const title = ITEMS.find((it) => it.kind === kind)?.title ?? ''
  return createPortal(
    <div className="sheet-overlay" role="dialog" aria-modal="true" aria-labelledby="auto-mode-title">
      <button type="button" className="sheet-backdrop" aria-label="닫기" onClick={onClose} />
      <div className="sheet-panel auto-mode">
        <div className="sheet-handle" />
        <h2 id="auto-mode-title" className="auto-mode-title">{title} 자동 측정</h2>
        <div className="auto-mode-options" role="radiogroup" aria-label={`${title} 자동 측정 모드`}>
          {MODES.map((m) => (
            <button
              key={m.id}
              type="button"
              role="radio"
              aria-checked={picked === m.id}
              className={`auto-mode-option ${picked === m.id ? 'on' : ''}`}
              onClick={() => setPicked(m.id)}
            >
              <span>
                <b>
                  {AUTO_MODE_LABEL[m.id]}
                  <small>{AUTO_INTERVAL_MIN[m.id]}분마다</small>
                </b>
                <em>{m.desc}</em>
              </span>
              <i aria-hidden />
            </button>
          ))}
        </div>
        <div className="auto-mode-actions">
          <button type="button" className="auto-mode-cancel" onClick={onClose}>
            취소
          </button>
          <button
            type="button"
            className="auto-mode-save"
            onClick={() => {
              setAutoMeasure(kind, picked)
              onClose()
            }}
          >
            저장
          </button>
        </div>
      </div>
    </div>,
    host,
  )
}

export function AutoMeasureScreen() {
  const session = useSession()
  const [editing, setEditing] = useState<AutoMeasureKind | null>(null)

  return (
    <div className="stage">
      <Phone>
        <div className="screen with-nav elder-home">
          <Header title="자동 측정 모드" backTo="/vitaling/settings" />
          <div className="scroll elder-body">
            <div className="elder-sleep-card auto-measure-card">
              {ITEMS.map((it) => (
                <button key={it.kind} type="button" className="auto-measure-row" onClick={() => setEditing(it.kind)}>
                  <div className="auto-measure-head">
                    <b>{it.title}</b>
                    <span>
                      {AUTO_MODE_LABEL[session.autoMeasure[it.kind]]}
                      <CaretRight size={16} weight="bold" />
                    </span>
                  </div>
                  {it.desc.map((line) => (
                    <em key={line}>{line}</em>
                  ))}
                </button>
              ))}
            </div>

            <div className="elder-sleep-card auto-measure-manual">
              <b>직접 재기 (실시간 측정)</b>
              <em>자동 측정과 별도로 심박수·혈중 산소·피부 온도·스트레스는 각 화면의 "측정하기" 버튼으로 지금 바로 잴 수 있어요. 직접 잰 값은 기록에 "실시간 측정"으로 표시돼요.</em>
            </div>

            <div className="auto-measure-note">
              <b>유의사항</b>
              <ul>
                <li>안정적인 측정을 위해 블루투스 연결이 끊기거나 앱이 종료되지 않도록 유지해 주세요.</li>
                <li>심층 분석은 배터리를 더 빨리 사용해요. 외출이 길면 표준이나 배터리 절약을 권해요.</li>
              </ul>
            </div>
          </div>
          <BottomNav active="service" />
          {editing ? <ModeSheet kind={editing} current={session.autoMeasure[editing]} onClose={() => setEditing(null)} /> : null}
        </div>
      </Phone>
    </div>
  )
}
