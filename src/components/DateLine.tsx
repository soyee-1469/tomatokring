import { Ri } from './Ri'
import { addDays, sameDay } from './WeekStrip'

const WD = ['일', '월', '화', '수', '목', '금', '토']

/** 카드 밖 가운데 날짜 한 줄 — ‹ 11월 18일 수요일 › (오늘 이후로는 못 감) */
export function DateLine({ date, today, onDate }: { date: Date; today: Date; onDate: (d: Date) => void }) {
  const atToday = sameDay(date, today)
  return (
    <div className="date-line">
      <button type="button" aria-label="이전 날" onClick={() => onDate(addDays(date, -1))}><Ri name="arrow-left-s" size={22} /></button>
      <b>{date.getMonth() + 1}월 {date.getDate()}일 {WD[date.getDay()]}요일</b>
      <button type="button" aria-label="다음 날" disabled={atToday} onClick={() => onDate(addDays(date, 1))}><Ri name="arrow-right-s" size={22} /></button>
    </div>
  )
}
