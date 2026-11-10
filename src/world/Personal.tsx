import { useEffect, useMemo, useRef, useState } from 'react'
import { useFrame } from '@react-three/fiber'
import { Text, useTexture } from '@react-three/drei'
import { CuboidCollider, RigidBody } from '@react-three/rapier'
import * as THREE from 'three'
import { age, profile } from '../content'
import { CREW, draw } from '../lottery'
import type { Vec3 } from '../layout'
import { useStore } from '../store'
import { playFanfare, playTick } from '../audio/sound'
import { FLAT, FONT, KitBox } from './style'

// De persoonlijke stukken in de fabriek: foto, loting en projectbeelden.

function usePhoto(url: string) {
  const tex = useTexture(url)
  tex.colorSpace = THREE.SRGBColorSpace
  tex.anisotropy = 8
  return tex
}

// Bord op twee palen; alleen de palen zijn fysiek, zodat je er niet doorheen rijdt.
function Posts({ x, height }: { x: number; height: number }) {
  return (
    <>
      <RigidBody type="fixed" colliders={false}>
        {[-x, x].map((px) => (
          <CuboidCollider key={px} args={[0.15, height / 2, 0.15]} position={[px, height / 2, 0]} />
        ))}
      </RigidBody>
      {[-x, x].map((px) => (
        <KitBox key={px} size={[0.25, height, 0.25]} swatch="navy" radius={0.06} position={[px, height / 2, 0]} />
      ))}
    </>
  )
}

/* ---------- personeelspas met foto (over mij) ---------- */

export function PhotoBadge({ position, rotation = 0 }: { position: Vec3; rotation?: number }) {
  const photo = usePhoto('/images/jens.jpg')
  return (
    <group position={position} rotation-y={rotation}>
      <Posts x={1.3} height={2.2} />
      <KitBox size={[3.2, 4.9, 0.3]} swatch="navy" radius={0.25} position={[0, 4.35, 0]} />
      <KitBox size={[3.2, 0.75, 0.34]} swatch="orange" radius={0.12} position={[0, 6.4, 0]} />
      <Text position={[0, 6.4, 0.19]} fontSize={0.36} color={FLAT.white} font={FONT.display}>
        MEDEWERKER
      </Text>
      <mesh position={[0, 4.35, 0.16]}>
        <planeGeometry args={[2.25, 3]} />
        <meshBasicMaterial map={photo} toneMapped={false} />
      </mesh>
      <Text position={[0, 2.5, 0.16]} fontSize={0.26} color={FLAT.white} font={FONT.display}>
        {profile.name}
      </Text>
      {/* sticker, zoals op de gewone site */}
      <group position={[0.75, 3.15, 0.2]} rotation-z={0.12}>
        <KitBox size={[1.75, 0.42, 0.05]} swatch="yellow" radius={0.08} castShadow={false} />
        <Text position={[0, 0, 0.04]} fontSize={0.15} color={FLAT.navy} font={FONT.text}>
          dit ben ik, echt waar
        </Text>
      </group>
      <group position={[-1.05, 5.55, 0.2]} rotation-z={-0.15}>
        <KitBox size={[0.95, 0.42, 0.05]} swatch="green" radius={0.08} castShadow={false} />
        <Text position={[0, 0, 0.04]} fontSize={0.15} color={FLAT.white} font={FONT.display}>
          {`${age()} jaar`}
        </Text>
      </group>
    </group>
  )
}

/* ---------- scherm met projectbeeld ---------- */

export function ProjectScreen({ position, image, width = 3.6 }: { position: Vec3; image: string; width?: number }) {
  const tex = usePhoto(image)
  const { width: w, height: h } = tex.image as { width: number; height: number }
  const height = (width * h) / w
  return (
    <group position={position}>
      <Posts x={width / 2 - 0.3} height={3.6 - height / 2} />
      <KitBox size={[width + 0.3, height + 0.3, 0.25]} swatch="charcoal" radius={0.1} position={[0, 3.6, 0]} />
      <mesh position={[0, 3.6, 0.13]}>
        <planeGeometry args={[width, height]} />
        <meshBasicMaterial map={tex} toneMapped={false} />
      </mesh>
    </group>
  )
}

/* ---------- loting bij de parkeerplaats ---------- */

type Phase = 'idle' | 'spin' | 'there' | 'done'

const ROW_Y = [4.3, 3.6, 2.9, 2.2]
const COLOR = { base: '#e9e6f3', spin: FLAT.orange, there: FLAT.yellow, back: FLAT.green }

// Rij de parkeerplaats op en het rad draait: eerst wie heen rijdt, daarna wie de BOB is.
export function LotteryBoard({ position }: { position: Vec3 }) {
  const result = useMemo(() => draw(), [])
  const active = useStore((s) => s.activeZone === 'wie-rijdt')
  const [phase, setPhase] = useState<Phase>('idle')
  const rows = useRef<(THREE.MeshBasicMaterial | null)[]>([])
  const spin = useRef({ idx: 0, count: 0, total: 0, wait: 0, bobIn: 0 })

  useEffect(() => {
    if (!active) return
    // genoeg rondjes en precies eindigen op de uitslag
    spin.current = { idx: 0, count: 0, total: CREW.length * 4 + result.there, wait: 0, bobIn: 0 }
    setPhase('spin')
  }, [active, result])

  useFrame((_, dt) => {
    const s = spin.current
    if (phase === 'spin') {
      s.wait -= dt
      if (s.wait <= 0) {
        s.idx = (s.idx + 1) % CREW.length
        s.count++
        playTick()
        // steeds langzamer, zoals een rad dat uitdraait
        s.wait = 0.05 + 0.32 * (s.count / s.total) ** 2
        if (s.count === s.total) {
          setPhase('there')
          s.bobIn = 0.9
          playFanfare()
        }
      }
    } else if (phase === 'there') {
      s.bobIn -= dt
      if (s.bobIn <= 0) {
        setPhase('done')
        playFanfare()
      }
    }

    rows.current.forEach((m, i) => {
      if (!m) return
      let c = COLOR.base
      if (phase === 'spin' && i === s.idx) c = COLOR.spin
      if ((phase === 'there' || phase === 'done') && i === result.there) c = COLOR.there
      if (phase === 'done' && i === result.back) c = COLOR.back
      m.color.set(c)
    })
  })

  const footer =
    phase === 'idle' ? 'RIJ DE PARKEERPLAATS OP OM TE LOTEN' : phase === 'done' ? 'HET LOT HEEFT GESPROKEN' : 'LOTEN…'

  return (
    <group position={position}>
      <Posts x={2.9} height={1.4} />
      <KitBox size={[6.6, 5, 0.3]} swatch="navy" radius={0.3} position={[0, 3.75, 0]} />
      <Text position={[0, 5.65, 0.17]} fontSize={0.5} color={FLAT.white} font={FONT.display}>
        WIE RIJDT ER?
      </Text>
      <Text position={[0, 5.1, 0.17]} fontSize={0.2} color={FLAT.silver} font={FONT.text}>
        {`LOTING VAN ${result.label.toUpperCase()}`}
      </Text>
      {CREW.map((name, i) => (
        <group key={name} position={[0, ROW_Y[i], 0.17]}>
          <mesh>
            <planeGeometry args={[5.8, 0.56]} />
            <meshBasicMaterial
              ref={(m) => {
                rows.current[i] = m
              }}
              color={COLOR.base}
              toneMapped={false}
            />
          </mesh>
          <Text position={[-2.65, 0, 0.01]} fontSize={0.3} color={FLAT.navy} font={FONT.display} anchorX="left">
            {name}
          </Text>
          {(phase === 'there' || phase === 'done') && i === result.there && (
            <Text position={[2.65, 0, 0.01]} fontSize={0.22} color={FLAT.navy} font={FONT.display} anchorX="right">
              RIJDT HEEN
            </Text>
          )}
          {phase === 'done' && i === result.back && (
            <Text position={[2.65, 0, 0.01]} fontSize={0.22} color={FLAT.navy} font={FONT.display} anchorX="right">
              BOB, RIJDT TERUG
            </Text>
          )}
        </group>
      ))}
      <Text position={[0, 1.6, 0.17]} fontSize={0.18} color={FLAT.silver} font={FONT.text}>
        {footer}
      </Text>
    </group>
  )
}
