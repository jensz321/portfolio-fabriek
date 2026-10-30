import { useMemo } from 'react'
import { useGLTF } from '@react-three/drei'
import type { ThreeElements } from '@react-three/fiber'
import * as THREE from 'three'

// Modellen uit de Kenney-kits (CC0), staan in public/models/<kit>/.
// De factory kit is op tegels van 1 m gebouwd; ×2 past bij de heftruck.
export const KIT_SCALE = { factory: 2, cars: 1.6 } as const
export type KitName = keyof typeof KIT_SCALE

const url = (kit: KitName, name: string) => `/models/${kit}/${name}.glb`

// Elke aanroep krijgt een eigen kloon, zodat je losse onderdelen (wielen, scharnieren) kunt animeren.
export function useKitModel(name: string, kit: KitName = 'factory') {
  const { scene, animations } = useGLTF(url(kit, name))
  const object = useMemo(() => {
    const clone = scene.clone(true)
    clone.traverse((o) => {
      if ((o as THREE.Mesh).isMesh) {
        o.castShadow = true
        o.receiveShadow = true
      }
    })
    return clone
  }, [scene])
  return { object, animations }
}

type KitProps = { name: string; kit?: KitName } & Omit<ThreeElements['group'], 'children'>

export function Kit({ name, kit = 'factory', scale, ...props }: KitProps) {
  const { object } = useKitModel(name, kit)
  return (
    <group scale={scale ?? KIT_SCALE[kit]} {...props}>
      <primitive object={object} />
    </group>
  )
}

export function preloadKit(names: string[], kit: KitName = 'factory') {
  names.forEach((n) => useGLTF.preload(url(kit, n)))
}
