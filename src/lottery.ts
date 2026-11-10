// Dezelfde truc als de echte "Wie rijdt er?"-app: geen database, de uitslag volgt uit de datum
// en de namen. Iedereen die vandaag langskomt krijgt dus dezelfde loting.

export const CREW = ['Jij', 'Jens', 'Sam', 'Noor']

// Kleine, voorspelbare hash (FNV-1a), zodat elke browser hetzelfde getal krijgt.
function hash(text: string) {
  let h = 2166136261
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return h >>> 0
}

export function draw(names = CREW, date = new Date()) {
  const day = `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`
  const seed = hash(`${day}|${names.join(',')}`)
  const there = seed % names.length
  // de BOB is altijd iemand anders dan de heenrijder
  const back = (there + 1 + ((seed >>> 8) % (names.length - 1))) % names.length
  return { there, back, label: date.toLocaleDateString('nl-NL', { day: 'numeric', month: 'long' }) }
}
