// Alle tekst van de site op één plek. De 3D-wereld leest hieruit,
// zodat content aanpassen nooit aan de scene-code hoeft te komen.

export const profile = {
  name: 'Jens van Duinkerken',
  email: 'jens@vanduinkerken.net',
  github: 'https://github.com/jensz321',
  linkedin: 'https://www.linkedin.com/in/jens-van-duinkerken-1a1b97292',
  birthDate: new Date(2006, 9, 13),
  skills: ['Node.js', 'React', 'Tailwind', 'Supabase', 'Three.js', 'Vercel', 'JavaScript'],
}

export function age(now = new Date()) {
  const b = profile.birthDate
  const hadBirthday =
    now.getMonth() > b.getMonth() || (now.getMonth() === b.getMonth() && now.getDate() >= b.getDate())
  return now.getFullYear() - b.getFullYear() - (hadBirthday ? 0 : 1)
}

export type Link = { label: string; href: string }

export type ZoneId =
  | 'poort'
  | 'over'
  | 'route'
  | 'raket'
  | 'padplanner'
  | 'wie-rijdt'
  | 'fabriek'
  | 'school'
  | 'contact'

export type ZoneContent = {
  id: ZoneId
  kicker: string
  title: string
  body: string[]
  tags?: string[]
  list?: { name: string; what: string; now?: boolean }[]
  links?: Link[]
}

export const zones: Record<ZoneId, ZoneContent> = {
  poort: {
    id: 'poort',
    kicker: '[ PORTFOLIO / 2026 ]',
    title: 'jens.',
    body: [
      'Student HBO ICT aan Windesheim in Zwolle. Ik bouw full-stack webapps met Node.js en React, en side projects waar ik zelf gewoon zin in heb.',
      'Pak de heftruck en rij rond. Elke hal is een stukje van mij.',
    ],
  },
  over: {
    id: 'over',
    kicker: 'Controlekamer',
    title: 'Over mij',
    body: [
      `Ik ben Jens, ${age()} jaar, uit Apeldoorn. Na mijn MBO Software Development en een stage bij Raket zit ik nu op Windesheim voor Business IT & Management.`,
      'Ik bouw het liefst dingen die echt gebruikt worden, van een app voor een rijschool tot een routeplanner voor wandelingen. Deze zomer zat ik in Málaga voor een bootcamp over content strategy.',
    ],
    tags: profile.skills,
  },
  route: {
    id: 'route',
    kicker: 'Assemblagelijn',
    title: 'Mijn route tot nu toe',
    body: [],
    list: [
      { name: 'MBO Software Development', what: 't/m 2026 · Aventus, Apeldoorn' },
      { name: 'Stage bij school', what: 'sep 2024 – jan 2025 · Aventus' },
      { name: 'Bootcamp content strategy', what: 'jun – aug 2026 · Málaga' },
      { name: 'HBO ICT — Business IT & Management', what: 'nu · Windesheim, Zwolle', now: true },
    ],
  },
  raket: {
    id: 'raket',
    kicker: 'Stage · 2026',
    title: 'Stage bij Raket',
    body: [
      "Meegebouwd aan Pulse720 en Curo.one in een echt dev-team. Ik werkte aan UI-componenten in Vue.js en aan de koppeling met AI-API's.",
    ],
    links: [
      { label: 'Pulse720', href: 'https://app.pulse720.com' },
      { label: 'Curo.one', href: 'https://curo.one' },
    ],
  },
  padplanner: {
    id: 'padplanner',
    kicker: 'Side project · 2026',
    title: 'PadPlanner',
    body: [
      'Een generator voor rondwandelingen: kies je startpunt en afstand, en je krijgt een route die weer bij je voordeur eindigt. Idee van mijn broer, gebouwd door mij.',
    ],
    tags: ['React', 'Vercel'],
    links: [{ label: 'Probeer de app', href: 'https://padplanner.vercel.app' }],
  },
  'wie-rijdt': {
    id: 'wie-rijdt',
    kicker: 'Side project · 2026',
    title: 'Wie rijdt er?',
    body: [
      "Met z'n vieren één auto, en elke keer weer dezelfde discussie: wie rijdt er? En vooral: wie moet er terugrijden en mag dus niet drinken? Daar heb ik een kleine app voor gebouwd. Hij loot wie heen rijdt (die mag daarna drinken) en wie terug rijdt (de BOB, pech gehad).",
      'Het leukste stukje: er is geen database of account. De loting rekent met de datum en wie er meegaat, dus elke telefoon geeft toch dezelfde uitkomst. Geen ruzie meer, het lot heeft gesproken.',
    ],
    tags: ['JavaScript', 'Vite'],
    links: [{ label: 'Bekijk project', href: 'https://jens.vanduinkerken.net/wie-rijdt/' }],
  },
  fabriek: {
    id: 'fabriek',
    kicker: 'Experiment · in de maak',
    title: 'De 3D-fabriek',
    body: [
      'Een portfolio als fabriek in Three.js, waar je als bezoeker doorheen rijdt. Nog lang niet af, wel heel leuk om aan te werken.',
      'Je staat er nu middenin.',
    ],
    tags: ['Three.js', 'WebGL'],
  },
  school: {
    id: 'school',
    kicker: 'Magazijn · MBO',
    title: 'Schoolprojecten & hackathons',
    body: ['Op school heb ik heel veel kleine projecten gebouwd, en ook genoeg dingetjes die nooit af zijn gekomen. Een greep:'],
    list: [
      { name: 'Examenproject', what: 'app voor een rijschool' },
      { name: 'Excellent Taste', what: 'restaurant-app, full-stack' },
      { name: 'Hackathon', what: 'digitale laboratoria in het Nederlandse onderwijs verbinden' },
      { name: 'Hackathon', what: 'jongeren vaker naar buiten krijgen' },
    ],
  },
  contact: {
    id: 'contact',
    kicker: 'Laaddok',
    title: 'Zeg hallo',
    body: ['Rij een pakketje mijn kant op. Gemaakt in Apeldoorn.'],
    links: [
      { label: 'Mail me', href: `mailto:${profile.email}` },
      { label: 'GitHub ↗', href: profile.github },
      { label: 'LinkedIn ↗', href: profile.linkedin },
    ],
  },
}
