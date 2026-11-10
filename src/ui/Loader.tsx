import { useEffect, useState } from 'react'
import { useProgress } from '@react-three/drei'
import { useStore } from '../store'

const touch = matchMedia('(pointer: coarse)').matches

// Start- en laadscherm. Dezelfde opmaak staat statisch in index.html, zodat bezoekers
// het al zien terwijl de JavaScript-bundel nog binnenkomt. De styling staat daar ook.
export function Loader() {
  const ready = useStore((s) => s.ready)
  const started = useStore((s) => s.started)
  const start = useStore((s) => s.start)
  const { progress } = useProgress()
  const [gone, setGone] = useState(false)

  useEffect(() => {
    if (!ready || started) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault()
        start()
      }
    }
    addEventListener('keydown', onKey)
    return () => removeEventListener('keydown', onKey)
  }, [ready, started, start])

  // Na de uitfade-animatie helemaal uit de DOM, zodat hij niets meer kost.
  useEffect(() => {
    if (!started) return
    const t = setTimeout(() => setGone(true), 700)
    return () => clearTimeout(t)
  }, [started])

  if (gone) return null
  const pct = ready ? 100 : Math.min(99, Math.round(progress))

  return (
    <div className={`loader${ready ? ' loader--ready' : ''}${started ? ' loader--out' : ''}`}>
      <div className="loader__card">
        <p className="loader__kicker">[ PORTFOLIO / 2026 ]</p>
        <h1 className="loader__title">jens.</h1>
        <p className="loader__intro">
          Welkom in mijn fabriek. Pak de heftruck en rij rond: elke hal is een stukje van mij.
        </p>

        <div className="loader__bar" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100}>
          <div style={{ width: `${pct}%` }} />
        </div>
        <p className="loader__status">{ready ? 'Alle machines draaien' : `Machines opstarten… ${pct}%`}</p>

        <ul className="loader__keys">
          {touch ? (
            <li>
              <span className="key key--wide">joystick</span> linksonder om te rijden
            </li>
          ) : (
            <>
              <li>
                <span className="key">W</span>
                <span className="key">A</span>
                <span className="key">S</span>
                <span className="key">D</span> of pijltjes om te rijden
              </li>
              <li>
                <span className="key">R</span> terug naar de poort
              </li>
            </>
          )}
          <li>
            <span className="key key--zone" /> rij een gekleurd vak in voor meer info
          </li>
        </ul>

        <button className="loader__start" disabled={!ready} onClick={start}>
          {ready ? 'Start de heftruck' : 'Even geduld…'}
        </button>
        <a className="loader__classic" href="https://jens.vanduinkerken.net">
          Liever gewoon lezen? Klassieke versie →
        </a>
      </div>
    </div>
  )
}
