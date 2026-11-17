import { CaretRight, Drop, Heartbeat, Thermometer, Waveform, Brain } from '@phosphor-icons/react'
import { useState } from 'react'
import { Navigate, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { dayLog, formatLogValue, type LiveMetricId } from '../measureLog'
import { DateBar, parseDateKey, todayStart } from './MeasureScreen'
import { BottomNav, Header, Phone } from '../components/ui'
import { type MeasureKind } from '../session'

type HistoryRow = {
  id: string
  date: string
  sub: string
  value: string
  today?: boolean
  badge?: string
}

type HistoryDef = {
  title: string
  listTitle: string
  emptyHint: string
  startLabel: string
  detailTo?: string
  past: HistoryRow[]
  today: HistoryRow
}

const DEFS: Record<MeasureKind, HistoryDef> = {
  health: {
    title: '바디 리듬',
    listTitle: '최근 기록',
    emptyHint: '반지가 기록하면 여기에 쌓여요',
    startLabel: '오늘 보기',
    today: { id: 'h-today', date: '2026.09.07 월', sub: '회복 80 · 활동 86', value: '86점', today: true },
    past: [
      { id: 'h-1', date: '2026.09.06 일', sub: '10:20-11:10', value: '82점' },
      { id: 'h-2', date: '2026.09.05 토', sub: '09:40-10:30', value: '80점' },
      { id: 'h-3', date: '2026.09.04 금', sub: '21:10-21:40', value: '79점' },
    ],
  },
  stress: {
    title: '실시간 측정',
    listTitle: '최근 측정',
    emptyHint: '반지가 기록하면 여기에 쌓여요',
    startLabel: '오늘 보기',
    today: { id: 's-today', date: '2026.09.07 월', sub: '실시간 · 15:59', value: '38점', today: true },
    past: [
      { id: 's-1', date: '2026.09.06 일', sub: '15:10-15:40', value: '71점' },
      { id: 's-2', date: '2026.09.05 토', sub: '09:20-09:50', value: '76점' },
      { id: 's-3', date: '2026.09.03 수', sub: '20:05-20:30', value: '68점' },
    ],
  },
  diet: {
    title: 'AI 식단',
    listTitle: '최근 식단',
    emptyHint: '사진으로 기록한 식단이 여기에 쌓여요',
    startLabel: '오늘 보기',
    today: { id: 'd-today', date: '2026.09.07 월 · 점심', sub: '한식 집밥 · 12:10', value: '520kcal', today: true },
    past: [
      { id: 'd-1', date: '2026.09.06 일 · 저녁', sub: '면 요리 · 18:40', value: '640kcal' },
      { id: 'd-2', date: '2026.09.06 일 · 점심', sub: '샐러드 · 12:30', value: '480kcal' },
      { id: 'd-3', date: '2026.09.05 토 · 아침', sub: '토스트 · 08:20', value: '320kcal' },
    ],
  },
  walk: {
    title: '활동',
    listTitle: '최근 운동',
    emptyHint: '운동을 기록하면 여기에 쌓여요',
    startLabel: '오늘 보기',
    today: { id: 'w-today', date: '2026.09.07 월', sub: '야외 걷기 · 32분', value: '2.4km', today: true },
    past: [
      { id: 'w-1', date: '2026.09.06 일', sub: '09:10-18:40', value: '6,280보' },
      { id: 'w-2', date: '2026.09.05 토', sub: '08:40-17:20', value: '5,110보' },
      { id: 'w-3', date: '2026.09.04 금', sub: '07:50-19:10', value: '3,640보' },
    ],
  },
  sleep: {
    title: '수면',
    listTitle: '최근 수면 기록',
    emptyHint: '잠잘 때 반지를 착용하면 지난밤 기록이 쌓여요',
    startLabel: '지난밤 보기',
    detailTo: '/vitaling/sleep',
    today: { id: 'z-today', date: '2026.09.07 월', sub: '22:21-06:21', value: '7시간 12분', today: true },
    past: [
      { id: 'z-1', date: '2026.09.06 일', sub: '23:05-06:40', value: '6시간 50분' },
      { id: 'z-2', date: '2026.09.05 토', sub: '22:10-06:05', value: '7시간 40분' },
      { id: 'z-3', date: '2026.09.04 금', sub: '00:20-06:10', value: '5시간 50분' },
    ],
  },
  survey: {
    title: '설문조사 (월)',
    listTitle: '월간 기록',
    emptyHint: '월간 기록이 여기에 쌓여요',
    startLabel: '이번 달 보기',
    detailTo: '/vitaling/survey',
    today: { id: 'q-today', date: '2026년 9월', sub: '토마톡 링 월간 기록', value: '확인', today: true, badge: '이번 달' },
    past: [
      { id: 'q-1', date: '2026년 8월', sub: '토마톡 링 월간 기록', value: '확인' },
      { id: 'q-2', date: '2026년 7월', sub: '토마톡 링 월간 기록', value: '확인' },
    ],
  },
}

function isMeasureKind(v: string | undefined): v is MeasureKind {
  return !!v && v in DEFS
}

const LIVE_TITLES: Record<LiveMetricId, string> = { hr: '심박수', hrv: '심박변이도', spo2: '혈중 산소', temp: '피부 온도', stress: '스트레스' }
const LIVE_ICONS: Record<LiveMetricId, typeof Heartbeat> = { hr: Heartbeat, hrv: Waveform, spo2: Drop, temp: Thermometer, stress: Brain }
function isLiveMetric(v: string | null): v is LiveMetricId {
  return !!v && v in LIVE_TITLES
}
const WEEKDAY_KO = ['일', '월', '화', '수', '목', '금', '토'] as const
function dateHeading(d: Date) {
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')} ${WEEKDAY_KO[d.getDay()]}`
}

/** 브링 '전체 기록' 화면: 날짜 아래 그날의 모든 측정(자동/실시간)을 시각 순으로 */
function LiveLogHistory({ metric, initialDate }: { metric: LiveMetricId; initialDate: Date }) {
  const [date, setDate] = useState(initialDate)
  const rows = dayLog(metric, date)
  const Icon = LIVE_ICONS[metric]
  const autoCount = rows.filter((r) => r.mode === 'auto').length
  const manualCount = rows.length - autoCount
  const dateKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
  return (
    <div className="stage">
      <Phone>
        <div className="screen with-nav elder-home">
          <Header title={`${LIVE_TITLES[metric]} 전체 기록`} backTo={`/vitaling/measure/stress?m=${metric}&d=${dateKey}`} />
          <DateBar period="day" date={date} onDate={setDate} />
          <div className="scroll elder-body">
            <div className="elder-sleep-card ms-hist-card">
              <div className="ms-hist-head">
                <b>{dateHeading(date)}</b>
                <em>{rows.length}건 · 자동 {autoCount} · 실시간 {manualCount}</em>
              </div>
              {rows.length === 0 ? (
                <div className="ms-hist-empty">
                  <p>이날은 측정 기록이 없어요</p>
                </div>
              ) : (
                <ul className="ms-log-list full">
                  {rows.map((row) => (
                    <li key={row.id}>
                      <div className="ms-log-row">
                        <span className="ms-log-ico"><Icon size={18} weight="fill" /></span>
                        <strong>{formatLogValue(metric, row.value)}</strong>
                        <i className={row.mode}>{row.mode === 'auto' ? '자동 측정' : '실시간 측정'}</i>
                        <em>{row.time}</em>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
          <BottomNav active="service" />
        </div>
      </Phone>
    </div>
  )
}

export function MeasureHistoryScreen() {
  const { kind } = useParams()
  const [params] = useSearchParams()
  const navigate = useNavigate()
  if (!isMeasureKind(kind)) return <Navigate to="/vitaling/home" replace />
  const metricParam = params.get('m')
  if (kind === 'stress' && isLiveMetric(metricParam)) {
    return <LiveLogHistory metric={metricParam} initialDate={parseDateKey(params.get('d')) ?? todayStart()} />
  }

  const def = DEFS[kind]
  const rows = [def.today, ...def.past]
  const detailTo = def.detailTo ?? `/vitaling/measure/${kind}`

  return (
    <div className="stage">
      <Phone>
        <div className="screen with-nav elder-home">
          <Header title={def.listTitle} backTo={detailTo} />

          <div className="scroll elder-body">
            <div className="elder-sleep-card ms-hist-card">
              <div className="ms-hist-head">
                <b>{def.title}</b>
                <em>{rows.length}건</em>
              </div>

              {rows.length === 0 ? (
                <div className="ms-hist-empty">
                  <p>{def.emptyHint}</p>
                  <button type="button" className="elder-claim-btn" onClick={() => navigate(detailTo)}>
                    {def.startLabel}
                  </button>
                </div>
              ) : (
                <ul className="ms-hist-list">
                  {rows.map((row) => (
                    <li key={row.id}>
                      <button type="button" className="ms-hist-row" onClick={() => navigate(detailTo)}>
                        <span>
                          <b>
                            {row.date}
                            {row.today ? <i>{row.badge ?? '오늘'}</i> : null}
                          </b>
                          <em>{row.sub}</em>
                        </span>
                        <strong>{row.value}</strong>
                        <CaretRight size={16} weight="bold" />
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>

          <BottomNav active="service" />
        </div>
      </Phone>
    </div>
  )
}
