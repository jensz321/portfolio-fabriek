import { useEffect, useState } from 'react'
import { zones, type ZoneContent } from '../content'
import { useStore } from '../store'

// Kaart met de echte content van de zone waar de heftruck in staat.
export function Panel() {
  const activeZone = useStore((s) => s.activeZone)
  // De laatste content vasthouden zodat het paneel netjes kan wegschuiven.
  const [shown, setShown] = useState<ZoneContent | null>(null)

  useEffect(() => {
    if (activeZone) setShown(zones[activeZone])
  }, [activeZone])

  return (
    <aside className={`panel ${activeZone ? 'panel--open' : ''}`} aria-live="polite">
      {shown && (
        <>
          <p className="panel__kicker">{shown.kicker}</p>
          <h2 className="panel__title">{shown.title}</h2>
          {shown.body.map((p) => (
            <p key={p} className="panel__body">
              {p}
            </p>
          ))}
          {shown.list && (
            <ol className="panel__list">
              {shown.list.map((item, i) => (
                <li key={i} className={item.now ? 'is-now' : undefined}>
                  <strong>{item.name}</strong>
                  <span>{item.what}</span>
                </li>
              ))}
            </ol>
          )}
          {shown.tags && (
            <ul className="panel__tags">
              {shown.tags.map((t) => (
                <li key={t}>{t}</li>
              ))}
            </ul>
          )}
          {shown.links && (
            <div className="panel__links">
              {shown.links.map((l) => (
                <a key={l.href} href={l.href} target={l.href.startsWith('mailto') ? undefined : '_blank'} rel="noreferrer">
                  {l.label}
                </a>
              ))}
            </div>
          )}
        </>
      )}
    </aside>
  )
}
