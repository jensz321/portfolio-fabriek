import { zoneLayout } from '../layout'
import { useStore } from '../store'

export function Hud() {
  const visited = useStore((s) => s.visited.size)
  const total = Object.keys(zoneLayout).length

  return (
    <header className="hud">
      <a className="hud__logo" href="#" aria-label="Jens van Duinkerken">
        jens.
      </a>
      <span className="hud__progress">
        {visited}/{total} hallen bezocht
      </span>
      <a className="hud__classic" href="https://jens.vanduinkerken.net">
        Klassieke versie
      </a>
    </header>
  )
}
