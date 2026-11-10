import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { Billboard, Text } from '@react-three/drei'
import { CuboidCollider, RigidBody } from '@react-three/rapier'
import * as THREE from 'three'
import { zones, type ZoneId } from '../content'
import { zoneLayout, zoneSigns } from '../layout'
import { useStore } from '../store'
import { FLAT, FONT, KitBox, type Swatch } from './style'

// Een vak op de vloer: rij erin en het bijbehorende paneel klapt open.
export function Zone({ id }: { id: ZoneId }) {
  const { pos, size, color } = zoneLayout[id]
  const enterZone = useStore((s) => s.enterZone)
  const leaveZone = useStore((s) => s.leaveZone)
  const active = useStore((s) => s.activeZone === id)
  const fill = useRef<THREE.MeshBasicMaterial>(null)

  useFrame((_, dt) => {
    if (!fill.current) return
    const target = active ? 0.35 : 0.12
    fill.current.opacity = THREE.MathUtils.lerp(fill.current.opacity, target, 1 - Math.exp(-8 * dt))
  })

  const [w, d] = size
  const stripe = 0.35

  return (
    <group position={pos}>
      <mesh rotation-x={-Math.PI / 2} position-y={0.02} receiveShadow>
        <planeGeometry args={[w, d]} />
        <meshBasicMaterial ref={fill} color={color} transparent opacity={0.12} depthWrite={false} />
      </mesh>
      {/* gele/gekleurde belijning rondom, zoals op een echte fabrieksvloer */}
      {[
        [0, d / 2, w, stripe],
        [0, -d / 2, w, stripe],
        [w / 2, 0, stripe, d],
        [-w / 2, 0, stripe, d],
      ].map(([x, z, sw, sd], i) => (
        <mesh key={i} rotation-x={-Math.PI / 2} position={[x, 0.03, z]}>
          <planeGeometry args={[sw, sd]} />
          <meshBasicMaterial color={color} />
        </mesh>
      ))}
      <Text
        rotation-x={-Math.PI / 2}
        position={[0, 0.04, d / 2 - 1.1]}
        fontSize={0.9}
        color={color}
        font={FONT.display}
        anchorX="center"
        anchorY="middle"
      >
        {zones[id].title.toUpperCase()}
      </Text>
      <RigidBody type="fixed" colliders={false}>
        <CuboidCollider
          sensor
          args={[w / 2, 1.5, d / 2]}
          position={[0, 1.5, 0]}
          onIntersectionEnter={({ other }) => {
            if (other.rigidBodyObject?.name === 'forklift') enterZone(id)
          }}
          onIntersectionExit={({ other }) => {
            if (other.rigidBodyObject?.name === 'forklift') leaveZone(id)
          }}
        />
      </RigidBody>
      {zoneSigns[id] && <Sign text={zoneSigns[id]} color={color} active={active} seed={pos[0]} />}
    </group>
  )
}

const SIGN_Y = 6.5

// Zwevend bord boven de hal, van ver te zien. Krimpt weg als je in de zone staat,
// zodat het niet tussen de camera en de heftruck hangt.
function Sign({ text, color, active, seed }: { text: string; color: string; active: boolean; seed: number }) {
  const group = useRef<THREE.Group>(null)
  const swatch = (Object.keys(FLAT) as Swatch[]).find((k) => FLAT[k] === color) ?? 'navy'
  const width = text.length * 0.5 + 1.6

  useFrame(({ clock }, dt) => {
    const g = group.current
    if (!g) return
    const s = THREE.MathUtils.lerp(g.scale.x, active ? 0 : 1, 1 - Math.exp(-10 * dt))
    g.scale.setScalar(Math.max(s, 0.001))
    g.visible = s > 0.01
    g.position.y = SIGN_Y + Math.sin(clock.elapsedTime * 1.4 + seed) * 0.2
  })

  return (
    <group ref={group} position-y={SIGN_Y}>
      <Billboard>
        <KitBox size={[width, 1.5, 0.3]} swatch={swatch} radius={0.3} castShadow={false} />
        <Text
          position={[0, 0, 0.17]}
          fontSize={0.8}
          color={swatch === 'yellow' ? FLAT.navy : FLAT.white}
          font={FONT.display}
          anchorX="center"
          anchorY="middle"
        >
          {text}
        </Text>
      </Billboard>
    </group>
  )
}
