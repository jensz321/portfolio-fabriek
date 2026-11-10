import { useEffect, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import type * as THREE from 'three'
import { useStore } from '../store'
import { playerDrive, playerPos } from '../world/player'
import { playChime, registerEmitter, updateSound, type SoundKind } from './sound'

// Koppelt een object in de wereld aan een geluidsbron. `active` mag per frame wisselen.
export function useEmitter(kind: SoundKind, ref: React.RefObject<THREE.Object3D | null>, active?: () => boolean) {
  const activeRef = useRef(active)
  activeRef.current = active
  useEffect(() => {
    const object = ref.current
    if (!object) return
    return registerEmitter({ kind, object, active: activeRef.current && (() => activeRef.current!()) })
  }, [kind, ref])
}

// Werkt het geluid elke frame bij en speelt een belletje bij het binnenrijden van een zone.
export function SoundListener() {
  useFrame(() => updateSound(playerPos, playerDrive.speed, playerDrive.throttle))

  useEffect(
    () =>
      useStore.subscribe((s, prev) => {
        if (s.activeZone && s.activeZone !== prev.activeZone) playChime(!prev.visited.has(s.activeZone))
      }),
    [],
  )
  return null
}
