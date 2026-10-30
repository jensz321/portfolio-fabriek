import { useMemo } from 'react'
import { useGLTF } from '@react-three/drei'
import type { ThreeElements } from '@react-three/fiber'
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js'
import * as THREE from 'three'

// Eén visuele taal voor alles: onze eigen vormen gebruiken hetzelfde materiaal en dezelfde
// kleurenkaart (Textures/colormap.png) als de Kenney-modellen. Die kaart bestaat uit cellen van
// 64×128 px: links een vlakke kleur, rechts een verloop van licht (boven) naar donker (onder).

export const SWATCH = {
  cream: [0, 1],
  green: [1, 1],
  yellow: [2, 1],
  orange: [3, 1],
  red: [4, 1],
  blue: [5, 1],
  sky: [6, 1],
  purple: [7, 1],
  charcoal: [0, 2],
  steel: [1, 2],
  slate: [2, 2],
  silver: [3, 2],
  white: [4, 2],
  salmon: [5, 2],
  brown: [6, 2],
  peach: [7, 2],
  lavender: [0, 3],
  indigo: [1, 3],
  periwinkle: [2, 3],
  navy: [3, 3],
  royal: [4, 3],
  violet: [5, 3],
  gold: [6, 3],
  teal: [7, 3],
} as const

export type Swatch = keyof typeof SWATCH

// De vlakke kleur van elke cel, voor dingen die geen materiaal delen (tekst, vloerverf, UI).
export const FLAT: Record<Swatch, string> = {
  cream: '#fde4c7',
  green: '#61cb8b',
  yellow: '#ffc044',
  orange: '#ff7e44',
  red: '#cf534f',
  blue: '#6794d9',
  sky: '#d0e8ff',
  purple: '#a878e8',
  charcoal: '#38383d',
  steel: '#868ba1',
  slate: '#4f5260',
  silver: '#a0a8c9',
  white: '#ffffff',
  salmon: '#f1976c',
  brown: '#b06041',
  peach: '#f2bf99',
  lavender: '#76769c',
  indigo: '#4d4d69',
  periwinkle: '#61618a',
  navy: '#323245',
  royal: '#5967a5',
  violet: '#5c5e94',
  gold: '#e4a35e',
  teal: '#61c8af',
}

const MAP = 512

// Zet de UV's zo dat elk vertex de kleur krijgt die bij zijn hoogte in het verloop hoort.
function paint(geometry: THREE.BufferGeometry, swatch: Swatch, gradient: boolean) {
  const [col, band] = SWATCH[swatch]
  geometry.computeBoundingBox()
  const { min, max } = geometry.boundingBox!
  const pos = geometry.attributes.position
  const uv = new Float32Array(pos.count * 2)
  const u = (col * 64 + (gradient ? 48 : 16)) / MAP
  const vTop = (band * 128 + 4) / MAP
  const vBot = (band * 128 + 124) / MAP
  const h = max.y - min.y || 1
  for (let i = 0; i < pos.count; i++) {
    const t = gradient ? 1 - (pos.getY(i) - min.y) / h : 0.5
    uv[i * 2] = u
    uv[i * 2 + 1] = vTop + t * (vBot - vTop)
  }
  geometry.setAttribute('uv', new THREE.BufferAttribute(uv, 2))
  return geometry
}

const cache = new Map<string, THREE.BufferGeometry>()
function cached(key: string, make: () => THREE.BufferGeometry) {
  let g = cache.get(key)
  if (!g) cache.set(key, (g = make()))
  return g
}

export function boxGeometry(size: readonly [number, number, number], swatch: Swatch, radius?: number, gradient = true) {
  const r = radius ?? Math.min(0.12, Math.min(...size) * 0.25)
  return cached(`box${size.join()}${swatch}${r}${gradient}`, () =>
    paint(new RoundedBoxGeometry(size[0], size[1], size[2], 2, r), swatch, gradient),
  )
}

export function cylinderGeometry(radius: number, height: number, swatch: Swatch, top = radius, segments = 20) {
  return cached(`cyl${radius}${height}${swatch}${top}${segments}`, () =>
    paint(new THREE.CylinderGeometry(top, radius, height, segments), swatch, true),
  )
}

// Het gedeelde materiaal van de factory kit (zelfde texture-instellingen als de GLB's).
export function useKitMaterial() {
  const { scene } = useGLTF('/models/factory/box-small.glb')
  return useMemo(() => {
    let mat: THREE.Material | undefined
    scene.traverse((o) => {
      if (!mat && (o as THREE.Mesh).isMesh) mat = (o as THREE.Mesh).material as THREE.Material
    })
    return mat!
  }, [scene])
}

type MeshProps = Omit<ThreeElements['mesh'], 'args'>

export function KitBox({
  size,
  swatch,
  radius,
  flat,
  ...props
}: { size: [number, number, number]; swatch: Swatch; radius?: number; flat?: boolean } & MeshProps) {
  const material = useKitMaterial()
  return <mesh geometry={boxGeometry(size, swatch, radius, !flat)} material={material} castShadow receiveShadow {...props} />
}

export function KitCylinder({
  radius,
  height,
  swatch,
  top,
  segments,
  ...props
}: { radius: number; height: number; swatch: Swatch; top?: number; segments?: number } & MeshProps) {
  const material = useKitMaterial()
  return (
    <mesh geometry={cylinderGeometry(radius, height, swatch, top, segments)} material={material} castShadow receiveShadow {...props} />
  )
}

// Fonts van de site, ook voor de borden in 3D (troika leest woff, geen woff2).
export const FONT = {
  display: '/fonts/bricolage-grotesque-800.woff',
  text: '/fonts/instrument-sans-600.woff',
}
