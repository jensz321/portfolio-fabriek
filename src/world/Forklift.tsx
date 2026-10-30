import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { useKeyboardControls } from '@react-three/drei'
import { CuboidCollider, RigidBody, type RapierRigidBody } from '@react-three/rapier'
import * as THREE from 'three'
import { WORLD, palette } from '../layout'
import { useStore } from '../store'
import { debugCam, playerPos } from './player'

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

export function Forklift() {
  const body = useRef<RapierRigidBody>(null)
  const mast = useRef<THREE.Group>(null)
  const speed = useRef(0)
  const [, getKeys] = useKeyboardControls<Controls>()

  useFrame((state, dt) => {
    const rb = body.current
    if (!rb) return
    dt = Math.min(dt, 0.05)

    const keys = getKeys()
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

    _pos.set(p.x, p.y, p.z)
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
      <ForkliftModel mastRef={mast} />
    </RigidBody>
  )
}

export function ForkliftModel({
  mastRef,
  color = palette.yellow,
}: {
  mastRef?: React.RefObject<THREE.Group | null>
  color?: string
}) {
  const yellow = <meshStandardMaterial color={color} roughness={0.6} />
  const dark = <meshStandardMaterial color={palette.dark} roughness={0.8} />
  const steel = <meshStandardMaterial color={palette.steel} metalness={0.4} roughness={0.5} />

  return (
    <group>
      {/* chassis */}
      <mesh castShadow receiveShadow position={[0, 0.7, -0.1]}>
        <boxGeometry args={[1.7, 0.8, 2.4]} />
        {yellow}
      </mesh>
      {/* contragewicht */}
      <mesh castShadow position={[0, 0.9, -1.2]}>
        <boxGeometry args={[1.6, 1, 0.5]} />
        {dark}
      </mesh>
      {/* stoel */}
      <mesh castShadow position={[0, 1.3, -0.4]}>
        <boxGeometry args={[0.7, 0.5, 0.6]} />
        {dark}
      </mesh>
      {/* kooi: 4 staanders + dak */}
      {[
        [-0.75, 0.6],
        [0.75, 0.6],
        [-0.75, -0.9],
        [0.75, -0.9],
      ].map(([x, z], i) => (
        <mesh key={i} castShadow position={[x, 1.9, z]}>
          <boxGeometry args={[0.08, 1.6, 0.08]} />
          {dark}
        </mesh>
      ))}
      <mesh castShadow position={[0, 2.72, -0.15]}>
        <boxGeometry args={[1.6, 0.06, 1.6]} />
        {yellow}
      </mesh>
      {/* oranje zwaailicht */}
      <mesh position={[0.6, 2.85, -0.8]}>
        <cylinderGeometry args={[0.1, 0.1, 0.18, 12]} />
        <meshStandardMaterial color={palette.orange} emissive={palette.orange} emissiveIntensity={1.5} />
      </mesh>
      {/* wielen */}
      {[
        [-0.85, 0.75],
        [0.85, 0.75],
        [-0.85, -0.85],
        [0.85, -0.85],
      ].map(([x, z], i) => (
        <mesh key={i} castShadow position={[x, 0.35, z]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.35, 0.35, 0.3, 16]} />
          {dark}
        </mesh>
      ))}
      {/* mast + vorken */}
      <group ref={mastRef} position={[0, 0.2, 1.15]}>
        {[-0.45, 0.45].map((x) => (
          <mesh key={x} castShadow position={[x, 1.4, 0]}>
            <boxGeometry args={[0.12, 2.8, 0.12]} />
            {steel}
          </mesh>
        ))}
        <mesh castShadow position={[0, 0.35, 0.1]}>
          <boxGeometry args={[1.1, 0.5, 0.08]} />
          {steel}
        </mesh>
        {[-0.3, 0.3].map((x) => (
          <mesh key={x} castShadow position={[x, 0.08, 0.75]}>
            <boxGeometry args={[0.14, 0.06, 1.4]} />
            {steel}
          </mesh>
        ))}
      </group>
    </group>
  )
}
