import { useImperativeHandle, useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { CuboidCollider, RigidBody, type RapierRigidBody } from '@react-three/rapier'
import * as THREE from 'three'
import type { Vec3 } from '../../layout'
import { Kit } from '../kit'
import { Cargo } from './Cargo'

export type ConveyorHandle = {
  // Zet een doos uit de pool op de band (of op een gegeven wereldpositie).
  spawn: (at?: THREE.Vector3) => void
}

type Props = {
  start: Vec3 // begin van de band (midden van de eerste tegel-rand), op de vloer
  tiles: number // aantal tegels van 4 m
  angle?: number // richting om de Y-as; 0 = band loopt naar +x
  height?: number // > 0 = band op poten, je kunt eronderdoor rijden
  speed?: number
  pool?: number // aantal dozen dat deze band hergebruikt
  interval?: number // automatisch een doos plaatsen elke x seconden (0 = alleen via spawn())
  ref?: React.Ref<ConveyorHandle>
}

const TILE = 4
const BELT_TOP = 0.8

export function Conveyor({ start, tiles, angle = 0, height = 0, speed = 2.2, pool = 8, interval = 0, ref }: Props) {
  const length = tiles * TILE
  const dir = useMemo(() => new THREE.Vector3(Math.cos(angle), 0, -Math.sin(angle)), [angle])
  const riding = useRef(new Set<RapierRigidBody>())
  const boxes = useRef<(RapierRigidBody | null)[]>([])
  const next = useRef(0)
  const timer = useRef(interval * 0.5)

  const spawnPoint = useMemo(
    () => new THREE.Vector3(...start).addScaledVector(dir, 1.2).setY(height + BELT_TOP + 0.4),
    [start, dir, height],
  )

  const spawn = (at?: THREE.Vector3) => {
    const rb = boxes.current[next.current % pool]
    next.current++
    if (!rb) return
    const p = at ?? spawnPoint
    rb.setEnabled(true)
    rb.setTranslation(p, true)
    rb.setRotation(new THREE.Quaternion().setFromAxisAngle(THREE.Object3D.DEFAULT_UP, angle + (Math.random() - 0.5) * 0.3), true)
    rb.setLinvel({ x: 0, y: 0, z: 0 }, true)
    rb.setAngvel({ x: 0, y: 0, z: 0 }, true)
  }

  useImperativeHandle(ref, () => ({ spawn }))

  useFrame((_, dt) => {
    if (interval > 0) {
      timer.current += dt
      if (timer.current >= interval) {
        timer.current = 0
        spawn()
      }
    }
    // Alles wat op de band ligt krijgt de bandsnelheid; zijwaarts blijft het vrij.
    for (const rb of riding.current) {
      const v = rb.linvel()
      const along = v.x * dir.x + v.z * dir.z
      const push = THREE.MathUtils.lerp(along, speed, 0.25) - along
      rb.setLinvel({ x: v.x + dir.x * push, y: v.y, z: v.z + dir.z * push }, true)
    }
  })

  const legs = height > 0 ? Array.from({ length: tiles + 1 }, (_, i) => i * TILE) : []

  return (
    <>
      <group position={start} rotation-y={angle}>
        {Array.from({ length: tiles }, (_, i) => (
          <Kit key={i} name="conveyor-long-stripe-sides" position={[TILE / 2 + i * TILE, height, 0]} />
        ))}
        {legs.map((x) =>
          [-0.9, 0.9].map((z) => (
            <mesh key={`${x}${z}`} position={[Math.min(Math.max(x, 0.2), length - 0.2), height / 2, z]} castShadow>
              <boxGeometry args={[0.2, height, 0.2]} />
              <meshStandardMaterial color="#5a5f7a" />
            </mesh>
          )),
        )}
        <RigidBody type="fixed" colliders={false}>
          {/* het bandoppervlak; bij een verhoogde band is het alleen de band zelf */}
          <CuboidCollider args={[length / 2, BELT_TOP / 2, 1]} position={[length / 2, height + BELT_TOP / 2, 0]} />
          {/* opstaande randen, zodat dozen niet zijwaarts van de band glijden */}
          <CuboidCollider args={[length / 2, 0.3, 0.08]} position={[length / 2, height + BELT_TOP + 0.3, 0.95]} />
          <CuboidCollider args={[length / 2, 0.3, 0.08]} position={[length / 2, height + BELT_TOP + 0.3, -0.95]} />
          {legs.map((x) => (
            <CuboidCollider key={x} args={[0.15, height / 2, 1]} position={[Math.min(Math.max(x, 0.2), length - 0.2), height / 2, 0]} />
          ))}
          <CuboidCollider
            sensor
            args={[length / 2, 0.5, 0.9]}
            position={[length / 2, height + BELT_TOP + 0.5, 0]}
            onIntersectionEnter={({ other }) => {
              if (other.rigidBody && other.rigidBodyObject?.name !== 'forklift') riding.current.add(other.rigidBody)
            }}
            onIntersectionExit={({ other }) => {
              if (other.rigidBody) riding.current.delete(other.rigidBody)
            }}
          />
        </RigidBody>
      </group>
      {Array.from({ length: pool }, (_, i) => (
        <Cargo
          key={i}
          ref={(rb) => {
            boxes.current[i] = rb
          }}
          variant={i % 3 === 0 ? 'box-large' : 'box-small'}
          position={[0, -20 - i * 3, 0]}
          disabled
        />
      ))}
    </>
  )
}
