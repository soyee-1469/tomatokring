import { useEffect, useRef, useState } from 'react'

/** 꾹 누르기까지 기다리는 시간 — 이보다 먼저 움직이면 화면 스크롤로 본다 */
const HOLD_MS = 200
const MOVE_TOLERANCE = 10

/**
 * 그래프를 눌러 그 위치의 값을 고르는 동작.
 * ref 를 그래프를 감싼 칸에 달면 pos 가 고른 가로 위치(0~1)로 채워진다. 손을 떼도 그대로 남고, 그래프 밖을 누르면 null 로 돌아간다.
 * 한 번 누르면 그 자리가 골라지고, 꾹 누른 채(터치는 HOLD_MS 뒤부터, 그 전엔 평소처럼 스크롤) 좌우로 움직이면 따라 움직인다.
 */
export function useScrub<T extends HTMLElement>() {
  const ref = useRef<T>(null)
  const [pos, setPos] = useState<number | null>(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    let timer: number | undefined
    let active = false
    let pointerId: number | null = null
    let startX = 0
    let startY = 0

    const place = (clientX: number) => {
      const r = el.getBoundingClientRect()
      if (r.width <= 0) return
      setPos(Math.min(1, Math.max(0, (clientX - r.left) / r.width)))
    }
    const stop = () => {
      window.clearTimeout(timer)
      timer = undefined
      active = false
      pointerId = null
    }
    const onDown = (e: PointerEvent) => {
      if (pointerId !== null || (e.pointerType === 'mouse' && e.button !== 0)) return
      pointerId = e.pointerId
      startX = e.clientX
      startY = e.clientY
      const begin = () => {
        timer = undefined
        active = true
        place(startX)
      }
      if (e.pointerType === 'mouse') {
        el.setPointerCapture?.(e.pointerId)
        begin()
      } else {
        timer = window.setTimeout(begin, HOLD_MS)
      }
    }
    const onMove = (e: PointerEvent) => {
      if (e.pointerId !== pointerId) return
      if (active) { place(e.clientX); return }
      // 켜지기 전에 손가락이 움직였으면 스크롤하려는 것
      if (Math.hypot(e.clientX - startX, e.clientY - startY) > MOVE_TOLERANCE) stop()
    }
    const onUp = (e: PointerEvent) => {
      if (e.pointerId !== pointerId) return
      // 꾹 누르기 전에 뗐으면 한 번 누른 것 → 그 자리를 고른다
      if (!active) place(e.clientX)
      stop()
    }
    const onCancel = (e: PointerEvent) => { if (e.pointerId === pointerId) stop() }
    // 그래프 밖을 누르면 고른 것을 푼다
    const onOutside = (e: PointerEvent) => { if (!el.contains(e.target as Node)) setPos(null) }
    // 켜진 뒤에는 화면이 같이 스크롤되지 않게
    const onTouchMove = (e: TouchEvent) => { if (active && e.cancelable) e.preventDefault() }
    const onContext = (e: Event) => e.preventDefault()

    el.addEventListener('pointerdown', onDown)
    el.addEventListener('pointermove', onMove)
    el.addEventListener('pointerup', onUp)
    el.addEventListener('pointercancel', onCancel)
    document.addEventListener('pointerdown', onOutside)
    el.addEventListener('touchmove', onTouchMove, { passive: false })
    el.addEventListener('contextmenu', onContext)
    return () => {
      window.clearTimeout(timer)
      el.removeEventListener('pointerdown', onDown)
      el.removeEventListener('pointermove', onMove)
      el.removeEventListener('pointerup', onUp)
      el.removeEventListener('pointercancel', onCancel)
      document.removeEventListener('pointerdown', onOutside)
      el.removeEventListener('touchmove', onTouchMove)
      el.removeEventListener('contextmenu', onContext)
    }
  }, [])

  return { ref, pos }
}
