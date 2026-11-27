import { useScrub } from './useScrub'
import { useId } from 'react'
import { gradeColor } from './RhythmGrade'
import { addDays, dayBundle, GRADE_BANDS, sameDay, startOfDay } from '../rhythm'

/** 바디 리듬 최근 7일 막대 — 홈 배너 카드와 상세 화면이 같은 그림을 쓴다 */
const WEEKDAYS = ['일', '월', '화', '수', '목', '금', '토'] as const

/** 고른 칸 번호: 누르지 않았으면 마지막(오늘·고른 날), 누르면 그 위치의 칸 */
export function pickIndex(pos: number | null, w: number, padL: number, slot: number, n = 7) {
  if (pos == null) return n - 1
  return Math.min(n - 1, Math.max(0, Math.floor((pos * w - padL) / slot)))
}

/** 최근 7일·14일 바디 리듬: 막대 안은 세로 무지개(축 고정, 아래 빨강 → 위 파랑). 눈금 없이, 막대마다 꼭대기 마커 + 점수,
 *  고른 날(처음엔 마지막 날)만 진하게 + 위에 말풍선 점수. 다른 막대를 누르면 말풍선이 옮겨 간다 */
export function RhythmWeekBars({ endDate, count = 7, compact = false, hasRecord = () => true }: { endDate: Date; /** 며칠치 (7 · 14) */ count?: number; /** 막대 영역을 낮게 */ compact?: boolean; /** 그날 기록이 있는지 — 없으면 빈칸(바닥에 짧은 회색 표시) + '기록 없음' */ hasRecord?: (d: Date) => boolean }) {
  const days = Array.from({ length: count }, (_, i) => addDays(endDate, i - (count - 1)))
  const vals = days.map((d) => (hasRecord(d) ? dayBundle(d).score : null))
  const w = 320, padL = 4, padR = 4
  const [h, top, bottom] = compact ? [140, 52, 110] : [176, 56, 144]
  const slot = (w - padL - padR) / count
  // 막대 굵기 = 상세 가로 무지개 눈금(10px)과 같게. 차트가 약 290px 폭으로 그려지므로 viewBox 단위로 11
  const bw = 11
  const x = (i: number) => padL + slot * i + (slot - bw) / 2
  const y = (v: number) => bottom - (v / 100) * (bottom - top)
  const { ref, pos } = useScrub<HTMLDivElement>()
  const pick = pickIndex(pos, w, padL, slot, count)
  const gid = `rb${useId().replace(/:/g, '')}`
  return (
    <div className="rd-chart" ref={ref}>
      <svg className="rd-bars" viewBox={`0 0 ${w} ${h}`} aria-hidden>
        <defs>
          {/* 세로 무지개: 0~100 축에 고정 (아래 빨강 → 위 파랑). 막대 높이만큼만 드러나서 높을수록 위쪽 색까지 보인다.
              색은 등급 구간(GRADE_BANDS) 가운데에 하나씩 */}
          <linearGradient id={gid} gradientUnits="userSpaceOnUse" x1="0" y1={y(0)} x2="0" y2={y(100)}>
            {GRADE_BANDS.map((b) => (
              <stop key={b.label} offset={`${(b.from + Math.min(100, b.to)) / 2}%`} stopColor={b.color} />
            ))}
          </linearGradient>
        </defs>
        {vals.map((v, i) => {
          const on = i === pick
          return (
            <g key={i}>
              {v === null
                ? <rect x={x(i)} y={bottom - bw} width={bw} height={bw} rx={bw / 2} fill="#DDE1E6" />
                : <>
                    <rect x={x(i)} y={y(v)} width={bw} height={Math.max(bw, bottom - y(v))} rx={bw / 2} fill={`url(#${gid})`} opacity={on ? 1 : 0.4} />
                    {/* 고른 날: 위에 뜬 말풍선과 막대 꼭대기를 점선으로 잇는다 */}
                    {on && <line x1={x(i) + bw / 2} x2={x(i) + bw / 2} y1={top - 18} y2={y(v) - 2} stroke="#1a2332" strokeOpacity="0.25" strokeWidth="1.5" strokeDasharray="3 3" />}
                    {/* 마커: 막대 꼭대기에 그날 등급 색 테두리 점 + 위에 점수 (고른 날은 말풍선이 대신) */}
                    <circle cx={x(i) + bw / 2} cy={y(v) + bw / 2} r={4.5} fill="#fff" stroke={gradeColor(v)} strokeWidth={2.5} />
                    {!on && <text x={x(i) + bw / 2} y={y(v) - 6} textAnchor="middle" fontSize="11" fontWeight="600" fill="#6b7684">{v}</text>}
                  </>}
              <text x={x(i) + bw / 2} y={h - 8} textAnchor="middle" fontSize="12" fontWeight={on ? '700' : '500'} fill={on ? '#1a2332' : '#9aa3ad'}>{dayLabel(days, i)}</text>
            </g>
          )
        })}
      </svg>
      {(() => {
        const v = vals[pick]
        // 말풍선은 막대 위 점수 줄보다 더 위(고정 높이)에 띄워 옆날 점수를 가리지 않게. 양 끝 칸에선 안쪽으로 붙임
        const edge = pick === 0 ? ' at-start' : pick === count - 1 ? ' at-end' : ''
        return <span className={`rd-tip${v === null ? ' empty' : ''}${edge}`} style={{ left: `${((x(pick) + bw / 2) / w) * 100}%`, top: `${((top - 22) / h) * 100}%` }}>{v === null ? '기록 없음' : `${v}점`}</span>
      })()}
    </div>
  )
}
/** 막대 아래 요일: 마지막 칸이 오늘이면 '오늘', 아니면 요일 */
export function dayLabel(days: Date[], i: number) {
  const last = days.length - 1
  if (i < last) return WEEKDAYS[days[i].getDay()]
  return sameDay(days[last], startOfDay(new Date())) ? '오늘' : WEEKDAYS[days[last].getDay()]
}

