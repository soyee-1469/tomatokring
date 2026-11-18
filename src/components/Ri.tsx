import type { CSSProperties } from 'react'
import {
  BookOpen, Brain, ChatCircleDots, ClipboardText, Drop, Flag, ForkKnife, Gear, Heartbeat,
  Moon, PersonSimpleWalk, Question, ArrowsClockwise, Thermometer, UserGear,
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
  walk: PersonSimpleWalk,
  moon: Moon, // 반짝이 달(MoonStars)은 AI 아이콘처럼 읽혀서 쓰지 않음
  survey: ClipboardText,
  'heart-pulse': Heartbeat,
  drop: Drop,
  'temp-hot': Thermometer,
  // pulse(HRV 회복력)는 Phosphor 채움이 사각 박스 모양이라 Remix 파형 그대로 둔다
  'chat-smile-3': ChatCircleDots,
  flag: Flag,
  'book-open': BookOpen,
  question: Question,
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
