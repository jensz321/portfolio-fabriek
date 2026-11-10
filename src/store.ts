import { create } from 'zustand'
import type { ZoneId } from './content'

const MUTE_KEY = 'fabriek-muted'
function readMuted() {
  try {
    return localStorage.getItem(MUTE_KEY) === '1'
  } catch {
    return false
  }
}

type State = {
  // started: alle modellen en fonts zijn geladen, de heftruck mag rijden.
  started: boolean
  setReady: () => void
  muted: boolean
  toggleMute: () => void
  activeZone: ZoneId | null
  visited: Set<ZoneId>
  enterZone: (id: ZoneId) => void
  leaveZone: (id: ZoneId) => void
  // Touch-joystick schrijft hierheen; de heftruck leest het naast het toetsenbord.
  touch: { x: number; y: number }
  setTouch: (x: number, y: number) => void
}

export const useStore = create<State>((set) => ({
  started: false,
  setReady: () => set({ started: true }),
  muted: readMuted(),
  toggleMute: () =>
    set((s) => {
      try {
        localStorage.setItem(MUTE_KEY, s.muted ? '0' : '1')
      } catch {
        // opslag geblokkeerd: dan onthouden we het alleen deze sessie
      }
      return { muted: !s.muted }
    }),
  activeZone: null,
  visited: new Set(),
  enterZone: (id) => set((s) => ({ activeZone: id, visited: new Set(s.visited).add(id) })),
  leaveZone: (id) => set((s) => (s.activeZone === id ? { activeZone: null } : s)),
  touch: { x: 0, y: 0 },
  setTouch: (x, y) => set({ touch: { x, y } }),
}))

// Alleen tijdens ontwikkelen: maakt geautomatiseerde tests mogelijk (bv. een zone binnengaan).
if (import.meta.env.DEV) (window as unknown as { __store: typeof useStore }).__store = useStore
