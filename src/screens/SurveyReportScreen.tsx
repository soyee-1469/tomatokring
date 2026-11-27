import { MetricInfoButton } from '../components/AccuracyInfo'
import {
  CaretLeft,
  CaretRight,
} from '@phosphor-icons/react'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Header, Phone } from '../components/ui'
import { isMeasureDone } from '../session'
import { SURVEY_FORM_URL, SURVEY_OPEN } from '../survey'
import { Ri } from '../components/Ri'
import { useSession } from '../useSession'
import { ClaimBanner } from '../components/ClaimBanner'
import { PointTip } from '../components/PointGuide'

/** 최근 3개월 (마지막이 이번 달). 수치는 목업 샘플 — 실제로는 브링 API의 월간 기록 */
const SAMPLE_MONTH_STATS = [
  { sleep: '6시간 50분', stress: '42점', walk: '5,110걸음' },
  { sleep: '7시간 02분', stress: '38점', walk: '4,820걸음' },
  { sleep: '7시간 12분', stress: '35점', walk: '4,015걸음' },
]
const MONTHS = SAMPLE_MONTH_STATS.map((stat, i) => {
  const now = new Date()
  const d = new Date(now.getFullYear(), now.getMonth() - (SAMPLE_MONTH_STATS.length - 1 - i), 1)
  return { label: `${d.getFullYear()}년 ${d.getMonth() + 1}월`, month: d.getMonth() + 1, ...stat }
})

/** 홈 카드·포인트 안내와 같은 금액 (월 1회) */
const SURVEY_POINTS = '500만 P'

const RECENT = [...MONTHS].reverse().map((m, i) => ({ date: m.label, sub: 't.ring 월간 기록', value: '확인', today: i === 0 }))

export function SurveyReportScreen() {
  const navigate = useNavigate()
  const [month, setMonth] = useState(MONTHS.length - 1)
  const report = MONTHS[month]
  const session = useSession()
  const surveyDone = isMeasureDone(session, 'survey')
  // 설문은 이번 달에만 참여할 수 있다. 지난 달을 보고 있으면 참여 영역 대신 안내
  const isThisMonth = month === MONTHS.length - 1

  return (
    <div className="stage">
      <Phone>
        <div className="screen elder-home">
          <Header
            title="월간 설문"
            backTo="/vitaling/home"
            right={
              <>
                <MetricInfoButton metric="survey" tone="plain" />
              </>
            }
          />

          <div className="ms-date">
            <button
              type="button"
              className="ms-date-arrow"
              aria-label="이전 달"
              disabled={month === 0}
              onClick={() => setMonth((n) => Math.max(0, n - 1))}
            >
              <CaretLeft size={16} weight="bold" />
            </button>
            <b>{report.label}</b>
            <button
              type="button"
              className="ms-date-arrow"
              aria-label="다음 달"
              disabled={month === MONTHS.length - 1}
              onClick={() => setMonth((n) => Math.min(MONTHS.length - 1, n + 1))}
            >
              <CaretRight size={16} weight="bold" />
            </button>
          </div>

          <div className="scroll elder-body">
            <PointTip kind="survey" />
            <div className="elder-sleep-card ms-hero">
              <div className="ms-hero-meta">
                <div className="ms-metric">
                  <em>
                    <i className="dot avg" />
                    이번 달
                  </em>
                  <strong>
                    <b>확인</b>
                  </strong>
                  <span>t.ring</span>
                </div>
                <i className="ms-metric-split" aria-hidden />
                <div className="ms-metric">
                  <em>
                    <i className="dot range" />
                    출처
                  </em>
                  <strong>
                    <b>반지</b>
                  </strong>
                  <span className="ghost" aria-hidden>
                    t.ring
                  </span>
                </div>
              </div>
              <p className="ms-survey-lead">
                t.ring이 모은 이번 달 수면·스트레스·걸음 기록이에요.
              </p>
            </div>

            {/* 설문은 구글 설문지로 받는다. 운영 전에는 '준비 중'만, 열리면 설문지로 보내고 완료되면 받기 */}
            <div className="elder-sleep-card">
              <b className="ms-block-title">{isThisMonth ? '이번 달 설문' : `${report.month}월 설문`}</b>
              {!isThisMonth ? (
                <p className="ms-survey-past">지난 달 설문은 그 달에만 참여할 수 있어요. 이번 달 설문은 오른쪽 화살표로 넘겨서 확인해 주세요.</p>
              ) : surveyDone ? (
                <ClaimBanner kind="survey" doneText="설문 완료" />
              ) : !SURVEY_OPEN ? (
                <div className="ms-survey-soon">
                  <Ri name="time" size={22} />
                  <b>설문을 준비하고 있어요</b>
                  <p>설문이 열리면 한 달에 한 번 참여하고 <span className="nowrap">{SURVEY_POINTS}</span>를 받을 수 있어요.</p>
                </div>
              ) : (
                <button type="button" className="ms-now-btn" onClick={() => window.open(SURVEY_FORM_URL, '_blank', 'noopener')}>
                  설문 참여하기
                </button>
              )}
            </div>

            <div className="elder-sleep-card ms-stats">
              <div>
                <em>수면</em>
                <b>{report.sleep}</b>
              </div>
              <div>
                <em>스트레스</em>
                <b>{report.stress}</b>
              </div>
              <div>
                <em>걸음</em>
                <b>{report.walk}</b>
              </div>
            </div>

            <div className="elder-sleep-card ms-hist-card">
              <div className="ms-recent-head">
                <b>월간 기록</b>
                <button
                  type="button"
                  className="ms-more"
                  onClick={() => navigate('/vitaling/measure/survey/history')}
                >
                  더 보기
                </button>
              </div>
              <ul className="ms-hist-list">
                {RECENT.map((row) => (
                  <li key={row.date}>
                    <button
                      type="button"
                      className="ms-hist-row"
                      onClick={() => navigate('/vitaling/measure/survey/history')}
                    >
                      <span>
                        <b>
                          {row.date}
                          {row.today ? <i>이번 달</i> : null}
                        </b>
                        <em>{row.sub}</em>
                      </span>
                      <strong>{row.value}</strong>
                      <CaretRight size={16} weight="bold" />
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          </div>

        </div>
      </Phone>
    </div>
  )
}
