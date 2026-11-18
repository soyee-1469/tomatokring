import type { CSSProperties } from 'react'

/** Remix Icon 래퍼. name은 'heart-pulse'처럼 접두사·접미사 없이 전달 */
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
  return (
    <i
      className={`ri-${name}-${fill ? 'fill' : 'line'} ${className}`.trim()}
      style={{ fontSize: size, lineHeight: 1, ...style }}
      aria-hidden
    />
  )
}
