import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { Text } from '@react-three/drei'
import { CuboidCollider, RigidBody, type RapierRigidBody } from '@react-three/rapier'
import * as THREE from 'three'
import { palette, type Vec3 } from '../../layout'
import { ForkliftModel } from '../Forklift'
import { KIT_SCALE, useKitModel } from '../kit'
import { playerPos } from '../player'

const _q = new THREE.Quaternion()
const _ahead = new THREE.Vector3()

// Staat de speler vlak voor dit voertuig? Dan remt het af, zoals een echte AGV met veiligheidsscanner.
function blocked(pos: THREE.Vector3, dir: THREE.Vector3, reach = 3.5, radius = 3) {
  _ahead.copy(pos).addScaledVector(dir, reach)
  _ahead.y = playerPos.y
  return _ahead.distanceTo(playerPos) < radius
}

// Wielen van kit-auto's laten meedraaien met de afgelegde afstand.
function useWheels(object: THREE.Object3D) {
  return useMemo(() => {
    const wheels: THREE.Object3D[] = []
    object.traverse((o) => {
      if (o.name.startsWith('wheel')) wheels.push(o)
    })
    return (distance: number) => wheels.forEach((w) => (w.rotation.x += distance / (0.3 * KIT_SCALE.cars)))
  }, [object])
}

/* ---------- NPC die een rondje rijdt ---------- */

export function LoopVehicle({ points, speed = 4, color = palette.orange, offset = 0 }: {
  points: Vec3[]
  speed?: number
  color?: string
  offset?: number
}) {
  const body = useRef<RapierRigidBody>(null)
  const lamp = useRef<THREE.MeshStandardMaterial>(null)
  const curve = useMemo(
    () => new THREE.CatmullRomCurve3(points.map((p) => new THREE.Vector3(...p)), true, 'catmullrom', 0.15),
    [points],
  )
  const length = useMemo(() => curve.getLength(), [curve])
  const s = useRef(offset * length)
  const v = useRef(0)
  const pos = useMemo(() => new THREE.Vector3(), [])
  const tangent = useMemo(() => new THREE.Vector3(), [])

  useFrame(({ clock }, dt) => {
    const rb = body.current
    if (!rb) return
    dt = Math.min(dt, 0.05)
    const u = (s.current / length) % 1
    curve.getPointAt(u, pos)
    curve.getTangentAt(u, tangent)

    const stop = blocked(pos, tangent)
    v.current = THREE.MathUtils.lerp(v.current, stop ? 0 : speed, 1 - Math.exp(-(stop ? 8 : 2) * dt))
    s.current += v.current * dt

    rb.setNextKinematicTranslation({ x: pos.x, y: 0, z: pos.z })
    rb.setNextKinematicRotation(_q.setFromAxisAngle(THREE.Object3D.DEFAULT_UP, Math.atan2(tangent.x, tangent.z)))

    // Lampje knippert sneller als hij voor je moet wachten.
    if (lamp.current) lamp.current.emissiveIntensity = Math.sin(clock.elapsedTime * (stop ? 18 : 6)) > 0 ? 2.5 : 0.2
  })

  const start = curve.getPointAt(offset % 1)
  return (
    <RigidBody ref={body} type="kinematicPosition" colliders={false} position={[start.x, 0, start.z]}>
      <CuboidCollider args={[0.9, 0.7, 1.4]} position={[0, 0.8, 0]} />
      <CuboidCollider args={[0.6, 0.15, 0.8]} position={[0, 0.3, 2.1]} />
      <ForkliftModel color={color} />
      <mesh position={[-0.6, 2.85, -0.8]}>
        <cylinderGeometry args={[0.1, 0.1, 0.18, 12]} />
        <meshStandardMaterial ref={lamp} color="#3da5ff" emissive="#3da5ff" />
      </mesh>
      {/* pallet met lading op de vorken */}
      <group position={[0, 0.25, 2.1]}>
        <mesh castShadow>
          <boxGeometry args={[1.2, 0.15, 1.3]} />
          <meshStandardMaterial color="#b58a5a" />
        </mesh>
        <mesh castShadow position={[0, 0.5, 0]}>
          <boxGeometry args={[1, 0.85, 1.1]} />
          <meshStandardMaterial color="#e8a25a" />
        </mesh>
      </group>
    </RigidBody>
  )
}

/* ---------- vrachtwagen bij het laaddok ---------- */

// Rijdt achteruit het dok in, wacht, rijdt weer weg en wacht. Altijd met de neus naar +z.
export function DockTruck({ x, dockZ, outZ, wait = 5, speed = 3.5 }: {
  x: number
  dockZ: number
  outZ: number
  wait?: number
  speed?: number
}) {
  const body = useRef<RapierRigidBody>(null)
  const { object } = useKitModel('delivery', 'cars')
  const spin = useWheels(object)
  const reverse = useRef<THREE.MeshStandardMaterial>(null)
  const state = useRef({ z: outZ, target: dockZ, pause: 0 })
  const pos = useMemo(() => new THREE.Vector3(), [])
  const dir = useMemo(() => new THREE.Vector3(), [])

  useFrame(({ clock }, dt) => {
    const rb = body.current
    if (!rb) return
    dt = Math.min(dt, 0.05)
    const st = state.current
    if (st.pause > 0) {
      st.pause -= dt
      if (reverse.current) reverse.current.emissiveIntensity = 0
      return
    }
    const sign = Math.sign(st.target - st.z)
    pos.set(x, 0, st.z)
    dir.set(0, 0, sign)
    if (blocked(pos, dir, 4, 3.2)) return

    // Rustig optrekken en afremmen vlak bij het eindpunt.
    const remaining = Math.abs(st.target - st.z)
    const step = Math.min(remaining, speed * Math.min(1, remaining / 3 + 0.25) * dt)
    st.z += sign * step
    spin(sign * step)
    rb.setNextKinematicTranslation({ x, y: 0, z: st.z })
    if (remaining - step < 0.01) {
      st.target = st.target === dockZ ? outZ : dockZ
      st.pause = wait
    }
    // Achteruitrijlichten knipperen alleen bij achteruitrijden.
    if (reverse.current) reverse.current.emissiveIntensity = sign < 0 && Math.sin(clock.elapsedTime * 10) > 0 ? 3 : 0
  })

  const s = KIT_SCALE.cars
  return (
    <RigidBody ref={body} type="kinematicPosition" colliders={false} position={[x, 0, outZ]}>
      <CuboidCollider args={[0.75 * s, 1.1 * s, 1.6 * s]} position={[0, 1.1 * s, 0]} />
      <primitive object={object} scale={s} />
      {[-0.55, 0.55].map((lx) => (
        <mesh key={lx} position={[lx * s, 0.5 * s, -1.63 * s]}>
          <boxGeometry args={[0.25, 0.18, 0.05]} />
          <meshStandardMaterial ref={lx < 0 ? reverse : undefined} color="#ffffff" emissive="#ffffff" emissiveIntensity={0} />
        </mesh>
      ))}
    </RigidBody>
  )
}

/* ---------- geparkeerde auto (duwbaar) ---------- */

export function ParkedCar({ position, rotation = 0, model = 'sedan', plate }: {
  position: Vec3
  rotation?: number
  model?: string
  plate?: string
}) {
  const { object } = useKitModel(model, 'cars')
  const s = KIT_SCALE.cars
  return (
    <RigidBody position={position} rotation={[0, rotation, 0]} colliders={false} mass={30} linearDamping={3} angularDamping={3}>
      <CuboidCollider args={[0.72 * s, 0.6 * s, 1.27 * s]} position={[0, 0.6 * s, 0]} />
      <primitive object={object} scale={s} />
      {plate && (
        <group position={[0, 0.42 * s, -1.29 * s]} rotation-y={Math.PI}>
          <mesh>
            <planeGeometry args={[1.1, 0.28]} />
            <meshStandardMaterial color={palette.yellow} />
          </mesh>
          <Text position={[0, 0, 0.01]} fontSize={0.16} color={palette.dark}>
            {plate}
          </Text>
        </group>
      )}
    </RigidBody>
  )
}
