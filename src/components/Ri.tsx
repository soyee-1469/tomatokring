import type { CSSProperties } from 'react'
import {
  BatteryCharging, BatteryEmpty, BatteryFull, BatteryHigh, BatteryLow, BatteryMedium, BatteryWarning,
  BookOpen, Brain, ChatCircleDots, ClipboardText, Drop, Flag, ForkKnife, Gear, Heartbeat,
  Moon, Footprints, Question, Siren, ArrowsClockwise, Thermometer, UserGear,
  Smiley, SmileyMeh, SmileySad,
} from '@phosphor-icons/react'
import type { Icon } from '@phosphor-icons/react'

/**
 * 아이콘 래퍼.
 * - 기능·바이탈 아이콘(홈 카드, 바이탈 칸, 상세 히어로, 항목별 점수, 마이 메뉴)은 Phosphor 채움(fill)으로 그린다. 듀오톤·선 아이콘은 'AI 서비스' 느낌이라 쓰지 않음.
 * - 화살표·체크·닫기 같은 UI 아이콘은 Remix Icon 그대로.
 * name은 Remix 이름('heart-pulse')을 그대로 받고, 아래 표에 있으면 듀오톤으로 바뀐다.
 */
const DUOTONE: Record<string, Icon> = {
  brain: Brain,
  restaurant: ForkKnife,
  walk: Footprints, // 걷는 사람 대신 발자국 (홈 미션 카드 도장과 같은 그림)
  moon: Moon, // 반짝이 달(MoonStars)은 AI 아이콘처럼 읽혀서 쓰지 않음
  survey: ClipboardText,
  'heart-pulse': Heartbeat,
  siren: Siren, // 이상 징후 카드 (경광등)
  // 반지 배터리 단계 (홈 날짜 줄)
  'battery-empty': BatteryEmpty,
  'battery-low': BatteryLow,
  'battery-medium': BatteryMedium,
  'battery-high': BatteryHigh,
  'battery-full': BatteryFull,
  'battery-charging': BatteryCharging,
  'battery-warning': BatteryWarning,
  drop: Drop,
  'temp-hot': Thermometer,
  // pulse(심박변이도)는 Phosphor 채움이 사각 박스 모양이라 Remix 파형 그대로 둔다
  'chat-smile-3': ChatCircleDots,
  flag: Flag,
  'book-open': BookOpen,
  question: Question,
  // 컨디션 체크 얼굴 3개 (이상 징후 카드·상세)
  'emotion-happy': Smiley,
  'emotion-normal': SmileyMeh,
  'emotion-unhappy': SmileySad,
  refresh: ArrowsClockwise,
  'settings-3': Gear,
  'user-settings': UserGear,
}

export function Ri({
  name,
  fill = false,
  size = 22,
  className = '',
  style,
}: {
  name: string
  fill?: boolean
  size?: number
  className?: string
  style?: CSSProperties
}) {
  const Duo = DUOTONE[name]
  if (Duo) {
    return (
      <i className={`ico-duo ${className}`.trim()} style={{ fontSize: size, lineHeight: 0, display: 'inline-flex', ...style }} aria-hidden>
        <Duo size={size} weight="fill" />
      </i>
    )
  }
  return (
    <i
      className={`ri-${name}-${fill ? 'fill' : 'line'} ${className}`.trim()}
      style={{ fontSize: size, lineHeight: 1, ...style }}
      aria-hidden
    />
  )
}
