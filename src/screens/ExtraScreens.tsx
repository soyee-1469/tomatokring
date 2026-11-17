import { AccuracyInfoButton } from '../components/AccuracyInfo'
import {
  ChartBar,
  Export,
  Person,
  Plus,
} from '@phosphor-icons/react'
import { useNavigate } from 'react-router-dom'
import { BottomNav, Header, Phone } from '../components/ui'
import type { ReactNode } from 'react'

function Shell({
  title,
  children,
}: {
  title: string
  children: ReactNode
}) {
  return (
    <div className="stage">
      <Phone>
        <div className="screen with-nav elder-home">
          <Header
            title={title}
            backTo="/vitaling/home"
            right={
              <>
                <button type="button" className="icon-btn" aria-label="내보내기">
                  <Export size={22} weight="regular" />
                </button>
                <AccuracyInfoButton tone="plain" />
              </>
            }
          />
          <div className="scroll elder-body">{children}</div>
          <BottomNav active="service" />
        </div>
      </Phone>
    </div>
  )
}

export function CycleScreen() {
  return (
    <Shell title="생리 주기">
      <div className="elder-sleep-card">
        <b className="ms-block-title">현재 주기 14일째</b>
        <p className="ms-survey-lead">최근 시작일 8월 25일 · 평균 주기 28일</p>
        <div className="ms-split-2">
          <div className="elder-sleep-card">
            <em>다음 예정</em>
            <b>9월 22일</b>
          </div>
          <div className="elder-sleep-card">
            <em>가임기</em>
            <b>9월 5–10일</b>
          </div>
        </div>
      </div>
      <div className="elder-sleep-card">
        <div className="ms-recent-head">
          <b>최근 기록</b>
        </div>
        <ul className="ms-hist-list">
          {[
            { date: '2026.08.25', days: '28일' },
            { date: '2026.07.28', days: '27일' },
            { date: '2026.07.01', days: '29일' },
          ].map((row) => (
            <li key={row.date}>
              <div className="ms-hist-row">
                <span>
                  <b>{row.date}</b>
                  <em>주기 길이</em>
                </span>
                <strong>{row.days}</strong>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </Shell>
  )
}

const ALARMS = [
  { name: '기상', time: '07:00', days: '매일', on: true },
  { name: '점심 약', time: '12:30', days: '월–금', on: true },
  { name: '취침', time: '22:30', days: '매일', on: false },
]

export function AlarmScreen() {
  return (
    <Shell title="알람">
      <div className="elder-sleep-card">
        <div className="ms-recent-head">
          <b>오늘 알람</b>
          <em>2개 켜짐</em>
        </div>
        <ul className="ms-hist-list">
          {ALARMS.map((row) => (
            <li key={row.name}>
              <div className="ms-hist-row">
                <span>
                  <b>{row.time}</b>
                  <em>
                    {row.name} · {row.days}
                  </em>
                </span>
                <strong>{row.on ? '켜짐' : '꺼짐'}</strong>
              </div>
            </li>
          ))}
        </ul>
        <button type="button" className="ms-now-btn" style={{ marginTop: 12 }}>
          <Plus size={18} weight="bold" />
          알람 추가
        </button>
      </div>
    </Shell>
  )
}

export function WorkoutScreen() {
  const navigate = useNavigate()
  return (
    <Shell title="운동">
      <div className="elder-sleep-card">
        <b className="ms-block-title">오늘 걷기</b>
        <p className="ms-survey-lead">오전 09:20–09:52 · 야외</p>
        <div className="ms-split-2">
          <div className="elder-sleep-card">
            <em>거리</em>
            <b>2.4km</b>
          </div>
          <div className="elder-sleep-card">
            <em>칼로리</em>
            <b>148kcal</b>
          </div>
        </div>
        <div className="ms-split-2">
          <div className="elder-sleep-card">
            <em>시간</em>
            <b>32분</b>
          </div>
          <div className="elder-sleep-card">
            <em>평균 심박</em>
            <b>112bpm</b>
          </div>
        </div>
        <button type="button" className="ms-now-btn">운동하기</button>
        <button type="button" className="ms-more" style={{ marginTop: 12 }} onClick={() => navigate('/vitaling/measure/walk')}>
          활동 기록 보기
        </button>
      </div>
    </Shell>
  )
}

export function RankingScreen() {
  const rows = [
    { rank: 1, name: '김토마', steps: '8,420보' },
    { rank: 2, name: '나', steps: '4,015보', me: true },
    { rank: 3, name: '박링', steps: '3,880보' },
    { rank: 4, name: '이건강', steps: '3,210보' },
    { rank: 5, name: '최링링', steps: '2,940보' },
  ]
  return (
    <Shell title="랭킹">
      <div className="elder-sleep-card">
        <div className="ms-recent-head">
          <b>오늘 걸음 랭킹</b>
          <ChartBar size={18} weight="fill" />
        </div>
        <ul className="ms-hist-list">
          {rows.map((r) => (
            <li key={r.rank}>
              <div className="ms-hist-row">
                <span>
                  <b>
                    {r.rank}위 {r.name}
                    {r.me ? <i>나</i> : null}
                  </b>
                  <em>오늘 걸음</em>
                </span>
                <strong>{r.steps}</strong>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </Shell>
  )
}

export function MyScreen() {
  const navigate = useNavigate()
  return (
    <Shell title="마이">
      <div className="elder-sleep-card">
        <Person size={28} weight="fill" color="#2F80ED" />
        <b className="ms-block-title">김토마</b>
        <p className="ms-survey-lead">토마톡 링 · ABC-012345</p>
      </div>
      <div className="elder-sleep-card">
        <button type="button" className="ms-hist-row" onClick={() => navigate('/vitaling/pair')}>
          <span>
            <b>반지 연결</b>
            <em>VRing-A9C3004 · 배터리 82%</em>
          </span>
        </button>
        <button type="button" className="ms-hist-row" onClick={() => navigate('/vitaling/settings')}>
          <span>
            <b>알림 설정</b>
            <em>배터리·착용 안내 켜짐</em>
          </span>
        </button>
      </div>
    </Shell>
  )
}
