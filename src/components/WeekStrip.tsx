import { useEffect, useRef } from 'react'
import { addDays, sameDay, WEEKDAYS } from '../dates'

/** 보여줄 과거 일수 (오늘 포함) */
const DAYS_BACK = 60
/** 오늘 뒤에 비활성으로 보여줄 미래 일수 — 오늘이 가운데 올 때 오른쪽이 비지 않게 */
const DAYS_AHEAD = 7

/**
 * 날짜 스트립 — 가로로 밀어서 지난 날로 이동 (스크롤바 숨김), 선택한 날이 가운데 오도록 자동 스크롤.
 * weekEnd/onShift 는 이전 주 단위 이동용이라 더는 쓰지 않지만 호출부 호환을 위해 받기만 한다.
 */
export function WeekStrip(props: {
  selected: Date
  weekEnd?: Date
  today: Date
  onSelect: (d: Date) => void
  onShift?: (dir: -1 | 1) => void
  /** 각 날짜의 0~100 값 — 현재 UI에서는 표시하지 않음 */
  scoreOf?: (d: Date) => number
}) {
  const { selected, today, onSelect } = props
  const days = Array.from({ length: DAYS_BACK + DAYS_AHEAD }, (_, i) => addDays(today, i - (DAYS_BACK - 1)))
  const listRef = useRef<HTMLDivElement>(null)
  const firstRun = useRef(true)

  useEffect(() => {
    const el = listRef.current?.querySelector<HTMLElement>('.week-day.on')
    if (!el || !listRef.current) return
    const list = listRef.current
    const target = el.offsetLeft - (list.clientWidth - el.offsetWidth) / 2
    list.scrollTo({ left: target, behavior: firstRun.current ? 'auto' : 'smooth' })
    firstRun.current = false
  }, [selected])

  return (
    <div className="week-strip scrollable">
      <div className="week-head">
        <b>{selected.getMonth() + 1}월</b>
        {!sameDay(selected, today) && <button type="button" onClick={() => onSelect(today)}>오늘로</button>}
      </div>
      <div className="week-days" role="tablist" aria-label="날짜 선택" ref={listRef}>
        {days.map((d) => {
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
              className={`week-day ${on ? 'on' : ''} ${isToday ? 'today' : ''} ${future ? 'future' : ''}`}
              onClick={() => onSelect(d)}
            >
              <span className="week-day-wd">{isToday ? '오늘' : WEEKDAYS[d.getDay()]}</span>
              <b className="week-day-n">{d.getDate()}</b>
            </button>
          )
        })}
      </div>
    </div>
  )
}
