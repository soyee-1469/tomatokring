import { Ri } from './Ri'

const WEEKDAYS = ['일', '월', '화', '수', '목', '금', '토'] as const
export function startOfDay(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate())
}
export function addDays(d: Date, n: number) {
  const x = startOfDay(d)
  x.setDate(x.getDate() + n)
  return x
}
export function sameDay(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate()
}

/** 선택한 날로 끝나는 7일 스트립 — 가로 스크롤 없이 화면 폭에 7칸 고정, 지난주는 화살표로 */
export function WeekStrip({
  selected,
  weekEnd,
  today,
  onSelect,
  onShift,
  scoreOf,
}: {
  selected: Date
  weekEnd: Date
  today: Date
  onSelect: (d: Date) => void
  onShift: (dir: -1 | 1) => void
  /** 각 날짜의 0~100 값 (막대 높이) */
  scoreOf: (d: Date) => number
}) {
  const days = Array.from({ length: 7 }, (_, i) => addDays(weekEnd, i - 6))
  const scores = days.map((d) => scoreOf(d))
  const first = days[0]
  const last = days[6]
  const range = `${first.getMonth() + 1}월 ${first.getDate()}일 ~ ${last.getMonth() + 1}월 ${last.getDate()}일`
  const atLatest = sameDay(weekEnd, today)
  return (
    <div className="week-strip">
      <div className="week-nav">
        <button type="button" aria-label="지난주" onClick={() => onShift(-1)}>
          <Ri name="arrow-left-s" size={22} />
        </button>
        <b>{range}</b>
        <button type="button" aria-label="다음주" disabled={atLatest} onClick={() => onShift(1)}>
          <Ri name="arrow-right-s" size={22} />
        </button>
      </div>
      <div className="week-days" role="tablist" aria-label="날짜 선택">
        {days.map((d, i) => {
          const on = sameDay(d, selected)
          const isToday = sameDay(d, today)
          const future = d > today
          return (
            <button
              key={d.toISOString()}
              type="button"
              role="tab"
              aria-selected={on}
              disabled={future}
              className={`week-day ${on ? 'on' : ''} ${isToday ? 'today' : ''}`}
              onClick={() => onSelect(d)}
            >
              <span className="week-day-bar" aria-hidden>
                <i style={{ height: `${future ? 0 : Math.max(18, scores[i])}%` }} />
              </span>
              <span className="week-day-wd">{isToday ? '오늘' : WEEKDAYS[d.getDay()]}</span>
              <b className="week-day-n">{d.getDate()}</b>
            </button>
          )
        })}
      </div>
    </div>
  )
}
