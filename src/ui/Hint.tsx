import { useEffect, useRef, useState } from 'react'
import { zoneLayout } from '../layout'
import { useStore } from '../store'

const TOTAL = Object.keys(zoneLayout).length

// Korte aanwijzing bovenin: eerst hoe je info krijgt, aan het eind een felicitatie.
export function Hint() {
  const started = useStore((s) => s.started)
  const seen = useStore((s) => s.visited.size)
  const [celebrate, setCelebrate] = useState(false)
  const last = useRef('')

  useEffect(() => {
    if (seen < TOTAL) return
    setCelebrate(true)
    const t = setTimeout(() => setCelebrate(false), 8000)
    return () => clearTimeout(t)
  }, [seen])

  const text = !started
    ? null
    : seen === 0
      ? 'Rij een gekleurd vak in om meer te zien'
      : celebrate
        ? 'Alle hallen gezien! Zin om samen iets te bouwen? Rij naar het laaddok.'
        : null
  // Tekst vasthouden tijdens het wegfaden.
  if (text) last.current = text

  return (
    <div className={`hint${text ? ' hint--show' : ''}`} role="status">
      {text ?? last.current}
    </div>
  )
}
