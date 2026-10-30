import { useRef, useState } from 'react'
import { useStore } from '../store'

const RADIUS = 48

// Simpele virtuele joystick voor touchscreens. Op desktop blijft hij verborgen via CSS.
export function Joystick() {
  const setTouch = useStore((s) => s.setTouch)
  const origin = useRef<{ x: number; y: number } | null>(null)
  const [knob, setKnob] = useState({ x: 0, y: 0 })

  function move(e: React.PointerEvent) {
    if (!origin.current) return
    let dx = e.clientX - origin.current.x
    let dy = e.clientY - origin.current.y
    const len = Math.hypot(dx, dy)
    if (len > RADIUS) {
      dx = (dx / len) * RADIUS
      dy = (dy / len) * RADIUS
    }
    setKnob({ x: dx, y: dy })
    setTouch(dx / RADIUS, -dy / RADIUS)
  }

  function end() {
    origin.current = null
    setKnob({ x: 0, y: 0 })
    setTouch(0, 0)
  }

  return (
    <div
      className="joystick"
      onPointerDown={(e) => {
        const r = e.currentTarget.getBoundingClientRect()
        origin.current = { x: r.left + r.width / 2, y: r.top + r.height / 2 }
        e.currentTarget.setPointerCapture(e.pointerId)
        move(e)
      }}
      onPointerMove={move}
      onPointerUp={end}
      onPointerCancel={end}
    >
      <div className="joystick__knob" style={{ transform: `translate(${knob.x}px, ${knob.y}px)` }} />
    </div>
  )
}
