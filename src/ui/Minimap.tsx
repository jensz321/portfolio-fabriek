import { useEffect, useRef } from 'react'
import { zones, type ZoneId } from '../content'
import { WORLD, zoneLayout } from '../layout'
import { useStore } from '../store'
import { playerHeading, playerPos } from '../world/player'

// Plattegrond in de hoek. De SVG werkt direct in wereldmeters (x → x, z → y),
// zodat zones en de speler zonder omrekenen getekend worden.
const H = WORLD.half
const GATE = WORLD.gateWidth / 2
const VIEW = `${-H - 2} ${-H - 2} ${H * 2 + 4} ${H + WORLD.yardEnd + 4}`
const IDS = Object.keys(zoneLayout) as ZoneId[]

export function Minimap() {
  const started = useStore((s) => s.started)
  const visited = useStore((s) => s.visited)
  const active = useStore((s) => s.activeZone)
  const arrow = useRef<SVGGElement>(null)

  // De pijl volgt de heftruck elk frame, buiten React om.
  useEffect(() => {
    let frame = 0
    const tick = () => {
      const deg = (Math.atan2(Math.cos(playerHeading.yaw), Math.sin(playerHeading.yaw)) * 180) / Math.PI
      arrow.current?.setAttribute('transform', `translate(${playerPos.x} ${playerPos.z}) rotate(${deg})`)
      frame = requestAnimationFrame(tick)
    }
    tick()
    return () => cancelAnimationFrame(frame)
  }, [])

  return (
    <nav className={`minimap${started ? ' minimap--show' : ''}`} aria-label="Plattegrond van de fabriek">
      <svg viewBox={VIEW}>
        <rect x={-H} y={H} width={H * 2} height={WORLD.yardEnd - H} rx={2} className="minimap__yard" />
        <rect x={-H} y={-H} width={H * 2} height={H * 2} rx={2} className="minimap__hall" />
        {/* muur met een opening voor de poort */}
        <path
          d={`M ${-GATE} ${H} H ${-H} V ${-H} H ${H} V ${H} H ${GATE}`}
          className="minimap__wall"
        />
        {IDS.map((id) => {
          const { pos, size, color } = zoneLayout[id]
          const seen = visited.has(id)
          return (
            <g key={id} className={id === active ? 'minimap__zone is-active' : 'minimap__zone'}>
              <title>{zones[id].title}</title>
              <rect
                x={pos[0] - size[0] / 2}
                y={pos[2] - size[1] / 2}
                width={size[0]}
                height={size[1]}
                rx={1.5}
                fill={color}
                fillOpacity={seen ? 0.9 : 0.3}
                stroke={color}
                strokeWidth={0.8}
              />
              {seen && (
                <path
                  d={`M ${pos[0] - 2} ${pos[2]} l 1.5 1.6 l 3 -3.4`}
                  className="minimap__check"
                />
              )}
            </g>
          )
        })}
        <g ref={arrow}>
          <circle r={5.5} className="minimap__halo" />
          <path d="M 4.5 0 L -3.3 3.6 L -1.5 0 L -3.3 -3.6 Z" className="minimap__player" />
        </g>
      </svg>
    </nav>
  )
}
