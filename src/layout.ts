import type { ZoneId } from './content'

// Plattegrond van de fabriek (bovenaanzicht, x = links/rechts, z = voor/achter).
// De bezoeker begint bij de poort aan de zuidkant (+z) en rijdt naar binnen (-z).

export type Vec3 = [number, number, number]

export const WORLD = {
  half: 46, // vloer en buitenmuren lopen van -half tot +half
  wallHeight: 1.6,
  gateWidth: 14,
  spawn: [0, 1, 52] as Vec3,
  spawnYaw: Math.PI, // met de vorken naar de fabriek
}

// Middelpunt en grootte (breedte x diepte) van elke zone op de vloer.
export const zoneLayout: Record<ZoneId, { pos: Vec3; size: [number, number]; color: string }> = {
  poort: { pos: [0, 0, 40], size: [14, 8], color: '#ff5a1f' },
  over: { pos: [-28, 0, 22], size: [12, 10], color: '#3d6fd9' },
  route: { pos: [-26, 0, -4], size: [16, 10], color: '#2fa36b' },
  raket: { pos: [0, 0, -14], size: [14, 10], color: '#3d6fd9' },
  padplanner: { pos: [26, 0, -12], size: [12, 10], color: '#2fa36b' },
  'wie-rijdt': { pos: [28, 0, 22], size: [12, 10], color: '#f2b632' },
  fabriek: { pos: [0, 0, 14], size: [8, 8], color: '#ff5a1f' },
  school: { pos: [-22, 0, -32], size: [14, 9], color: '#f2b632' },
  contact: { pos: [24, 0, -34], size: [14, 9], color: '#ff5a1f' },
}

export const palette = {
  sky: '#e9e4da',
  floor: '#cfc8bc',
  wall: '#b9b1a4',
  dark: '#2b2d33',
  steel: '#8a8f99',
  yellow: '#f2b632',
  orange: '#ff5a1f',
  blue: '#3d6fd9',
  green: '#2fa36b',
  cream: '#f6f1e7',
}
