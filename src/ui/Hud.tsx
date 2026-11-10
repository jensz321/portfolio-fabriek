import { zoneLayout } from '../layout'
import { useStore } from '../store'

export function Hud() {
  const visited = useStore((s) => s.visited.size)
  const total = Object.keys(zoneLayout).length
  const muted = useStore((s) => s.muted)
  const toggleMute = useStore((s) => s.toggleMute)

  return (
    <header className="hud">
      <a className="hud__logo" href="#" aria-label="Jens van Duinkerken">
        jens.
      </a>
      <span className="hud__progress">
        {visited}/{total} hallen bezocht
      </span>
      <button
        className="hud__sound"
        onClick={toggleMute}
        aria-pressed={!muted}
        title={muted ? 'Geluid aan (M)' : 'Geluid uit (M)'}
      >
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M4 9h4l5-4v14l-5-4H4z" />
          {muted ? <path d="M16 9l5 6M21 9l-5 6" /> : <path d="M16 8.5a5 5 0 0 1 0 7M18.5 6a8.5 8.5 0 0 1 0 12" />}
        </svg>
        <span className="sr-only">{muted ? 'Geluid aanzetten' : 'Geluid uitzetten'}</span>
      </button>
      <a className="hud__classic" href="https://jens.vanduinkerken.net">
        Klassieke versie
      </a>
    </header>
  )
}
