import { create } from 'zustand'
import type { ZoneId } from './content'

type State = {
  // ready: alle modellen en fonts zijn geladen. started: de bezoeker heeft op Start gedrukt.
  ready: boolean
  started: boolean
  setReady: () => void
  start: () => void
  activeZone: ZoneId | null
  visited: Set<ZoneId>
  enterZone: (id: ZoneId) => void
  leaveZone: (id: ZoneId) => void
  // Touch-joystick schrijft hierheen; de heftruck leest het naast het toetsenbord.
  touch: { x: number; y: number }
  setTouch: (x: number, y: number) => void
}

export const useStore = create<State>((set) => ({
  ready: false,
  started: false,
  setReady: () => set({ ready: true }),
  start: () => set((s) => (s.ready ? { started: true } : s)),
  activeZone: null,
  visited: new Set(),
  enterZone: (id) => set((s) => ({ activeZone: id, visited: new Set(s.visited).add(id) })),
  leaveZone: (id) => set((s) => (s.activeZone === id ? { activeZone: null } : s)),
  touch: { x: 0, y: 0 },
  setTouch: (x, y) => set({ touch: { x, y } }),
}))
