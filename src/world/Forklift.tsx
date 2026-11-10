import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { useKeyboardControls } from '@react-three/drei'
import { CuboidCollider, RigidBody, type RapierRigidBody } from '@react-three/rapier'
import * as THREE from 'three'
import { WORLD } from '../layout'
import { FLAT as COLOR, KitBox, KitCylinder, type Swatch } from './style'
import { useStore } from '../store'
import { debugCam, playerHeading, playerPos } from './player'

export type Controls = 'forward' | 'back' | 'left' | 'right' | 'reset'

const MAX_SPEED = 14
const MAX_REVERSE = 7
const ACCEL = 18
const BRAKE = 30
const TURN_RATE = 2.4
const CAMERA_OFFSET = new THREE.Vector3(16, 22, 20)

const _pos = new THREE.Vector3()
const _camTarget = new THREE.Vector3()
const _quat = new THREE.Quaternion()
const _euler = new THREE.Euler()
// Zolang het startscherm open staat, reageert de heftruck nergens op.
const IDLE = { forward: false, back: false, left: false, right: false, reset: false }

export function Forklift() {
  const body = useRef<RapierRigidBody>(null)
  const mast = useRef<THREE.Group>(null)
  const visual = useRef<THREE.Group>(null)
  const speed = useRef(0)
  const [, getKeys] = useKeyboardControls<Controls>()

  useFrame((state, dt) => {
    const rb = body.current
    if (!rb) return
    dt = Math.min(dt, 0.05)

    const keys = useStore.getState().started ? getKeys() : IDLE
    const touch = useStore.getState().touch
    const throttle = (keys.forward ? 1 : 0) - (keys.back ? 1 : 0) + touch.y
    const steer = (keys.left ? 1 : 0) - (keys.right ? 1 : 0) - touch.x

    if (keys.reset) {
      rb.setTranslation({ x: WORLD.spawn[0], y: WORLD.spawn[1], z: WORLD.spawn[2] }, true)
      rb.setRotation(_quat.setFromAxisAngle(THREE.Object3D.DEFAULT_UP, WORLD.spawnYaw), true)
      speed.current = 0
    }

    // Arcade-rijgedrag: we sturen de snelheid direct aan in plaats van krachten,
    // dat voelt strakker en een heftruck hoeft niet realistisch te slippen.
    const target = THREE.MathUtils.clamp(throttle, -1, 1) * (throttle >= 0 ? MAX_SPEED : MAX_REVERSE)
    const speeding = Math.abs(target) > Math.abs(speed.current) && Math.sign(target) !== -Math.sign(speed.current)
    const step = (speeding ? ACCEL : BRAKE) * dt
    speed.current += THREE.MathUtils.clamp(target - speed.current, -step, step)

    const rot = rb.rotation()
    _euler.setFromQuaternion(_quat.set(rot.x, rot.y, rot.z, rot.w), 'YXZ')
    const yaw = _euler.y
    playerHeading.yaw = yaw
    const v = rb.linvel()

    // Sturen werkt alleen als je rijdt, en achteruit draait het stuur om (zoals bij een echte truck).
    const turn = THREE.MathUtils.clamp(steer, -1, 1) * TURN_RATE * THREE.MathUtils.clamp(speed.current / 4, -1, 1)
    rb.setAngvel({ x: 0, y: turn, z: 0 }, true)
    rb.setLinvel({ x: Math.sin(yaw) * speed.current, y: v.y, z: Math.cos(yaw) * speed.current }, true)

    // Mast een beetje laten wiebelen bij optrekken en remmen.
    if (mast.current) {
      mast.current.rotation.x = THREE.MathUtils.lerp(mast.current.rotation.x, -throttle * 0.04, 0.1)
    }

    const p = rb.translation()
    if (p.y < -10) rb.setTranslation({ x: WORLD.spawn[0], y: WORLD.spawn[1], z: WORLD.spawn[2] }, true)

    // Camera en NPC's volgen de getekende (geïnterpoleerde) positie, niet de physics-stap:
    // physics loopt op 60 Hz, het scherm vaak op 120 Hz, anders hapert de camera.
    if (visual.current) visual.current.getWorldPosition(_pos)
    else _pos.set(p.x, p.y, p.z)
    playerPos.copy(_pos)
    if (debugCam) {
      state.camera.position.set(debugCam[0], debugCam[1], debugCam[2])
      state.camera.lookAt(debugCam[3], debugCam[4], debugCam[5])
      return
    }
    _camTarget.copy(_pos).add(CAMERA_OFFSET)
    state.camera.position.lerp(_camTarget, 1 - Math.exp(-4 * dt))
    state.camera.lookAt(_pos.x, _pos.y + 1, _pos.z)
  })

  return (
    <RigidBody
      ref={body}
      name="forklift"
      colliders={false}
      position={WORLD.spawn}
      rotation={[0, WORLD.spawnYaw, 0]}
      enabledRotations={[false, true, false]}
      mass={4}
      friction={0}
      ccd
    >
      <CuboidCollider args={[0.9, 0.7, 1.4]} position={[0, 0.8, 0]} />
      <CuboidCollider args={[0.7, 0.1, 0.8]} position={[0, 0.25, 2.1]} mass={0.1} />
      <group ref={visual}>
        <ForkliftModel mastRef={mast} />
      </group>
    </RigidBody>
  )
}

export function ForkliftModel({
  mastRef,
  swatch = 'yellow',
}: {
  mastRef?: React.RefObject<THREE.Group | null>
  swatch?: Swatch
}) {
  return (
    <group>
      {/* chassis met afgeronde randen, zoals de kit-voertuigen */}
      <KitBox size={[1.75, 0.85, 2.5]} swatch={swatch} radius={0.25} position={[0, 0.75, -0.1]} />
      {/* contragewicht */}
      <KitBox size={[1.7, 1.05, 0.6]} swatch="navy" radius={0.22} position={[0, 0.95, -1.2]} />
      {/* stoel + stuur */}
      <KitBox size={[0.75, 0.55, 0.6]} swatch="charcoal" radius={0.15} position={[0, 1.4, -0.4]} />
      <KitBox size={[0.5, 0.08, 0.08]} swatch="charcoal" radius={0.03} position={[0, 1.65, 0.35]} rotation-x={-0.5} />
      {/* kooi: 4 staanders + dak */}
      {[
        [-0.78, 0.6],
        [0.78, 0.6],
        [-0.78, -0.9],
        [0.78, -0.9],
      ].map(([x, z], i) => (
        <KitBox key={i} size={[0.12, 1.6, 0.12]} swatch="navy" radius={0.04} position={[x, 1.95, z]} />
      ))}
      <KitBox size={[1.75, 0.12, 1.75]} swatch={swatch} radius={0.05} position={[0, 2.78, -0.15]} />
      {/* oranje zwaailicht */}
      <mesh position={[0.6, 2.93, -0.8]}>
        <cylinderGeometry args={[0.1, 0.12, 0.2, 12]} />
        <meshStandardMaterial color={COLOR.orange} emissive={COLOR.orange} emissiveIntensity={1.5} />
      </mesh>
      {/* wielen met naaf */}
      {[
        [-0.88, 0.75],
        [0.88, 0.75],
        [-0.88, -0.85],
        [0.88, -0.85],
      ].map(([x, z], i) => (
        <group key={i} position={[x, 0.38, z]} rotation={[0, 0, Math.PI / 2]}>
          <KitCylinder radius={0.38} height={0.34} swatch="charcoal" />
          <KitCylinder radius={0.18} height={0.38} swatch="silver" />
        </group>
      ))}
      {/* mast + vorken */}
      <group ref={mastRef} position={[0, 0.2, 1.2]}>
        {[-0.45, 0.45].map((x) => (
          <KitBox key={x} size={[0.16, 2.8, 0.16]} swatch="steel" radius={0.04} position={[x, 1.4, 0]} />
        ))}
        <KitBox size={[1.15, 0.55, 0.12]} swatch="steel" radius={0.04} position={[0, 0.38, 0.1]} />
        {[-0.3, 0.3].map((x) => (
          <KitBox key={x} size={[0.16, 0.07, 1.4]} swatch="steel" radius={0.02} position={[x, 0.08, 0.78]} />
        ))}
      </group>
    </group>
  )
}
