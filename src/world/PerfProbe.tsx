import { useEffect, useRef, useState } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { Html } from '@react-three/drei'

// Meet frametijden en render-statistieken. Altijd actief (goedkoop); met ?perf ook zichtbaar.
// Uitlezen kan ook via window.__perf, handig voor geautomatiseerde metingen.

declare global {
  interface Window {
    __perf?: Record<string, number>
  }
}

const show = new URLSearchParams(location.search).has('perf')

export function PerfProbe() {
  const gl = useThree((s) => s.gl)
  const frames = useRef<number[]>([])
  const last = useRef(performance.now())
  const [text, setText] = useState('')

  useEffect(() => {
    // three reset info per render; met meerdere passes (AO) willen we het totaal per frame.
    gl.info.autoReset = false
  }, [gl])

  useFrame(() => {
    const now = performance.now()
    frames.current.push(now - last.current)
    last.current = now
    if (frames.current.length < 60) {
      gl.info.reset()
      return
    }
    const sorted = [...frames.current].sort((a, b) => a - b)
    const avg = sorted.reduce((a, b) => a + b, 0) / sorted.length
    const stats = {
      fps: Math.round(1000 / avg),
      avgMs: +avg.toFixed(2),
      p95Ms: +sorted[Math.floor(sorted.length * 0.95)].toFixed(2),
      calls: gl.info.render.calls / sorted.length,
      triangles: Math.round(gl.info.render.triangles / sorted.length),
      geometries: gl.info.memory.geometries,
      textures: gl.info.memory.textures,
      programs: gl.info.programs?.length ?? 0,
    }
    window.__perf = stats
    if (show) setText(Object.entries(stats).map(([k, v]) => `${k} ${v}`).join('  ·  '))
    frames.current = []
    gl.info.reset()
  }, -1000)

  if (!show) return null
  return (
    <Html fullscreen style={{ pointerEvents: 'none' }}>
      <div style={{ position: 'absolute', left: 16, bottom: 16, font: '12px JetBrains Mono, monospace', background: '#323245', color: '#fff', padding: '6px 10px', borderRadius: 8 }}>
        {text}
      </div>
    </Html>
  )
}
