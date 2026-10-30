import { useEffect, useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { useAnimations } from '@react-three/drei'
import { CuboidCollider, CylinderCollider, RigidBody } from '@react-three/rapier'
import * as THREE from 'three'
import type { Vec3 } from '../../layout'
import { Kit, KIT_SCALE, useKitModel } from '../kit'

const smooth = (t: number) => t * t * (3 - 2 * t)

/* ---------- kraan ---------- */

// Draait tussen twee hoeken en laat de magneet zakken om een doos op te pakken en neer te zetten.
export function Crane({ position, from = 0, to = Math.PI * 0.75, period = 14, scale = 2.5 }: {
  position: Vec3
  from?: number
  to?: number
  period?: number
  scale?: number
}) {
  const { object: crane } = useKitModel('crane')
  const { object: lift } = useKitModel('crane-lift')
  const { object: box } = useKitModel('box-large')

  const parts = useMemo(() => {
    const arm = crane.getObjectByName('arm')!
    const chain = lift.getObjectByName('chain')!
    const magnet = lift.getObjectByName('magnet')!
    lift.position.set(0, 0, -2.55)
    arm.add(lift)
    box.position.set(0, -0.6, 0)
    box.scale.setScalar(0.5)
    magnet.add(box)
    return { arm, chain, magnet, magnetY: magnet.position.y }
  }, [crane, lift, box])

  useFrame(({ clock }) => {
    const t = (clock.elapsedTime / period) % 1
    // 0-0.15 zakken+pakken, 0.15-0.3 omhoog, 0.3-0.5 draaien, 0.5-0.65 zakken+loslaten, 0.65-0.8 omhoog, 0.8-1 terugdraaien
    const seg = (a: number, b: number) => smooth(THREE.MathUtils.clamp((t - a) / (b - a), 0, 1))
    const yaw = from + (to - from) * (seg(0.3, 0.5) - seg(0.8, 1))
    const drop = seg(0, 0.12) - seg(0.15, 0.3) + seg(0.5, 0.62) - seg(0.65, 0.8)
    parts.arm.rotation.y = yaw
    parts.magnet.position.y = parts.magnetY - drop * 1.2
    parts.chain.scale.y = 1 + drop * 1.6
    parts.chain.position.y = -0.25 - drop * 0.6
    box.visible = t > 0.12 && t < 0.62
  })

  return (
    <group position={position}>
      <RigidBody type="fixed" colliders={false}>
        <CylinderCollider args={[1.5, 1.2]} position={[0, 1.5, 0]} />
      </RigidBody>
      <primitive object={crane} scale={scale} />
    </group>
  )
}

/* ---------- zuiger ---------- */

export function Piston({ position, offset = 0, speed = 1, name = 'piston-round' }: {
  position: Vec3
  offset?: number
  speed?: number
  name?: string
}) {
  const { object, animations } = useKitModel(name)
  const { actions } = useAnimations(animations, object)
  useEffect(() => {
    const a = actions['toggle']
    if (!a) return
    a.reset().setLoop(THREE.LoopRepeat, Infinity).play()
    a.timeScale = speed
    a.time = offset * a.getClip().duration
  }, [actions, offset, speed])
  return (
    <group position={position}>
      <RigidBody type="fixed" colliders={false}>
        <CuboidCollider args={[1, 1, 1]} position={[0, 1, 0]} />
      </RigidBody>
      <primitive object={object} scale={KIT_SCALE.factory} />
    </group>
  )
}

/* ---------- tandwielen ---------- */

// Een rij in elkaar grijpende tandwielen; buren draaien tegengesteld.
export function Cogs({ position, rotation, count = 3, speed = 1 }: {
  position: Vec3
  rotation?: Vec3
  count?: number
  speed?: number
}) {
  const group = useRef<THREE.Group>(null)
  useFrame((_, dt) => {
    group.current?.children.forEach((c, i) => {
      c.rotation.y += (i % 2 ? -1 : 1) * speed * dt
    })
  })
  const names = ['cog-a', 'cog-b', 'cog-c']
  return (
    <group position={position} rotation={rotation}>
      <group ref={group}>
        {Array.from({ length: count }, (_, i) => (
          <Kit key={i} name={names[i % names.length]} position={[i * 1.8, 0, 0]} rotation-y={i * 0.3} />
        ))}
      </group>
    </group>
  )
}

/* ---------- stoom ---------- */

const PUFFS = 14
const _m = new THREE.Matrix4()
const _q = new THREE.Quaternion()
const _p = new THREE.Vector3()
const _s = new THREE.Vector3()

// Zachte witte wolkjes die opstijgen, groeien en weer verdwijnen.
export function Steam({ position, rate = 1, rise = 5, size = 1 }: { position: Vec3; rate?: number; rise?: number; size?: number }) {
  const mesh = useRef<THREE.InstancedMesh>(null)
  const seeds = useMemo(() => Array.from({ length: PUFFS }, () => [Math.random(), Math.random() - 0.5, Math.random() - 0.5]), [])

  useFrame(({ clock }) => {
    if (!mesh.current) return
    const time = clock.elapsedTime * 0.25 * rate
    seeds.forEach(([phase, dx, dz], i) => {
      const life = (time + phase) % 1
      const grow = Math.sin(life * Math.PI)
      _p.set(dx * life * 2, life * rise, dz * life * 2 + life * 0.8)
      _s.setScalar((0.25 + life * 0.9) * grow * size)
      mesh.current!.setMatrixAt(i, _m.compose(_p, _q, _s))
    })
    mesh.current.instanceMatrix.needsUpdate = true
  })

  return (
    <instancedMesh ref={mesh} args={[undefined, undefined, PUFFS]} position={position} frustumCulled={false}>
      <icosahedronGeometry args={[1, 1]} />
      <meshStandardMaterial color="#ffffff" transparent opacity={0.55} roughness={1} depthWrite={false} />
    </instancedMesh>
  )
}

/* ---------- zwaailicht ---------- */

export function Beacon({ position, color = '#ff8a2a', speed = 4 }: { position: Vec3; color?: string; speed?: number }) {
  const head = useRef<THREE.Group>(null)
  // Het doelpunt hangt aan de draaiende kop, dus de lichtbundel draait vanzelf mee.
  const target = useMemo(() => {
    const o = new THREE.Object3D()
    o.position.set(4, -1.5, 0)
    return o
  }, [])
  useFrame((_, dt) => {
    if (head.current) head.current.rotation.y += speed * dt
  })
  return (
    <group position={position}>
      <mesh>
        <cylinderGeometry args={[0.18, 0.2, 0.35, 12]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={2} transparent opacity={0.85} />
      </mesh>
      <group ref={head}>
        <primitive object={target} />
        <spotLight color={color} intensity={30} distance={10} angle={0.5} penumbra={0.6} target={target} />
      </group>
    </group>
  )
}
