import { MetricInfoButton } from '../components/AccuracyInfo'
import {
  CaretLeft,
  CaretRight,
  Export,
  Robot,
} from '@phosphor-icons/react'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Header, Phone } from '../components/ui'
import { isMeasureDone, markMeasureDone } from '../session'
import { useSession } from '../useSession'
import { ClaimBanner } from '../components/ClaimBanner'

const MONTHS = [
  { label: '2026년 7월', sleep: '6시간 50분', stress: '42점', walk: '5,110보' },
  { label: '2026년 8월', sleep: '7시간 02분', stress: '38점', walk: '4,820보' },
  { label: '2026년 9월', sleep: '7시간 12분', stress: '35점', walk: '4,015보' },
]

const SURVEY_QUESTIONS = [
  { q: '이번 달 몸 상태는 어땠나요?', a: ['좋았어요', '보통이에요', '힘들었어요'] },
  { q: '반지는 하루에 얼마나 착용했나요?', a: ['거의 종일', '낮에만', '가끔'] },
  { q: '포인트 지급이 도움이 됐나요?', a: ['네', '보통', '아니요'] },
] as const

const RECENT = [
  { date: '2026년 9월', sub: '토마톡 링 월간 기록', value: '확인', today: true },
  { date: '2026년 8월', sub: '토마톡 링 월간 기록', value: '확인' },
  { date: '2026년 7월', sub: '토마톡 링 월간 기록', value: '확인' },
]

export function SurveyReportScreen() {
  const navigate = useNavigate()
  const [month, setMonth] = useState(MONTHS.length - 1)
  const report = MONTHS[month]
  const session = useSession()
  const surveyDone = isMeasureDone(session, 'survey')
  const [answers, setAnswers] = useState<(number | null)[]>(() => SURVEY_QUESTIONS.map(() => null))
  const allAnswered = answers.every((a) => a !== null)

  return (
    <div className="stage">
      <Phone>
        <div className="screen elder-home">
          <Header
            title="설문조사 (월)"
            backTo="/vitaling/home"
            right={
              <>
                <button type="button" className="icon-btn" aria-label="내보내기">
                  <Export size={22} weight="regular" />
                </button>
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
            <div className="elder-sleep-card ms-hero">
              <button type="button" className="ms-fab" aria-label="도우미">
                <Robot size={22} weight="fill" />
              </button>
              <div className="ms-hero-meta">
                <div className="ms-metric">
                  <em>
                    <i className="dot avg" />
                    이번 달
                  </em>
                  <strong>
                    <b>확인</b>
                  </strong>
                  <span>토마톡 링</span>
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
                    토마톡 링
                  </span>
                </div>
              </div>
              <p className="ms-survey-lead">
                토마톡 링이 모은 이번 달 수면·스트레스·걸음과 함께, 아래 짧은 설문에 답하면 포인트가 지급됩니다.
              </p>
            </div>

            <div className="elder-sleep-card">
              <b className="ms-block-title">이번 달 설문 (3문항)</b>
              {surveyDone ? (
                <ClaimBanner kind="survey" doneText="설문 완료" />
              ) : (
                <>
                  <ol className="ms-survey-q">
                    {SURVEY_QUESTIONS.map((item, qi) => (
                      <li key={item.q}>
                        <b>{item.q}</b>
                        <div className="ms-survey-opts">
                          {item.a.map((label, ai) => (
                            <button
                              key={label}
                              type="button"
                              className={answers[qi] === ai ? 'on' : ''}
                              onClick={() => setAnswers((cur) => cur.map((v, i) => (i === qi ? ai : v)))}
                            >
                              {label}
                            </button>
                          ))}
                        </div>
                      </li>
                    ))}
                  </ol>
                  <button
                    type="button"
                    className="ms-now-btn"
                    disabled={!allAnswered}
                    onClick={() => markMeasureDone('survey')}
                  >
                    {allAnswered ? '설문 제출하기' : '모든 문항에 답해 주세요'}
                  </button>
                </>
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
