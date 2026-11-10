// Exact dezelfde loting als de echte "Wie rijdt er?"-app (portfoliowebsite/src/wie-rijdt/main.js):
// geen database, het toeval start vanuit datum + wie er meegaat + ronde. Daardoor geeft het bord
// in de fabriek vandaag dezelfde uitslag als de app op ieders telefoon (met iedereen mee, ronde 1).

export const CREW = ['Bente', 'Ties', 'Mack', 'Jens']

function seededRandom(text: string) {
  let h = 2166136261
  for (let i = 0; i < text.length; i++) h = Math.imul(h ^ text.charCodeAt(i), 16777619)
  return () => {
    // mulberry32
    h = (h + 0x6d2b79f5) | 0
    let t = Math.imul(h ^ (h >>> 15), 1 | h)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

export function draw(date = new Date()) {
  // De app werkt met ids (k1..k4), niet met de namen zelf.
  const going = CREW.map((_, i) => i)
  const ids = going.map((i) => 'k' + (i + 1)).join(',')
  const rand = seededRandom([date.toLocaleDateString('sv-SE'), ids, 1].join('|'))
  const pick = (pool: number[]) => pool[Math.floor(rand() * pool.length)]

  // terug = de BOB; heen is iemand anders, die mag daarna drinken
  const back = pick(going)
  const there = pick(going.filter((i) => i !== back))
  return { there, back, label: date.toLocaleDateString('nl-NL', { day: 'numeric', month: 'long' }) }
}
