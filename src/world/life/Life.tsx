import { useMemo, useRef } from 'react'
import { CuboidCollider, RigidBody } from '@react-three/rapier'
import * as THREE from 'three'
import { palette, type Vec3 } from '../../layout'
import { Kit, preloadKit } from '../kit'
import { Conveyor, type ConveyorHandle } from './Conveyor'
import { RobotArm } from './RobotArm'
import { Beacon, Cogs, Crane, Piston, Steam } from './Machines'
import { DockTruck, LoopVehicle } from './Vehicles'

// Alles wat beweegt en niet bij één specifieke zone hoort.
// Coördinaten zijn afgestemd op de plattegrond in layout.ts.

// Rechthoek met afgeronde hoeken als route voor NPC-voertuigen.
function roundedRect(x0: number, z0: number, x1: number, z1: number, r: number): Vec3[] {
  const pts: Vec3[] = []
  const corners: [number, number, number][] = [
    [x1 - r, z0 + r, -Math.PI / 2],
    [x1 - r, z1 - r, 0],
    [x0 + r, z1 - r, Math.PI / 2],
    [x0 + r, z0 + r, Math.PI],
  ]
  for (const [cx, cz, a0] of corners) {
    for (let i = 0; i <= 3; i++) {
      const a = a0 + (i / 3) * (Math.PI / 2)
      pts.push([cx + Math.cos(a) * r, 0, cz + Math.sin(a) * r])
    }
  }
  return pts
}

const CENTRAL_LOOP = roundedRect(-9, 2, 20, 30, 4)
const WAREHOUSE_LOOP = roundedRect(-40, -25, -12, -18, 3)

export function Life() {
  return (
    <>
      <RawMaterialLine />
      <ShippingLine />
      <WallMachines />
      <Pipes />
      <LaneMarkings points={CENTRAL_LOOP} />
      <LaneMarkings points={WAREHOUSE_LOOP} />
      <Crane position={[12, 0, -2]} />
      <CraneDropZones />

      <LoopVehicle points={CENTRAL_LOOP} speed={4.5} color={palette.orange} />
      <LoopVehicle points={WAREHOUSE_LOOP} speed={3.5} color={palette.blue} offset={0.4} />
      <DockTruck x={37} dockZ={-39.6} outZ={-22} />

      {/* Raket: stampende zuigers naast de schermen */}
      <Piston position={[-9.5, 0, -23]} />
      <Piston position={[9.5, 0, -23]} name="piston-square" offset={0.5} speed={0.8} />

      {/* PadPlanner: tandwielen op de machine en stoom uit de schoorsteen */}
      <Cogs position={[24.2, 2.85, -21]} count={2} speed={1.4} />
      <Steam position={[28, 2.9, -21]} rate={1.2} rise={4} size={0.8} />

      {/* stoom uit twee silo's */}
      <Steam position={[-36.6, 5.8, 36]} rise={6} />
      <Steam position={[-26.4, 5.8, 36]} rise={5} rate={0.8} size={0.9} />

      {/* poort: zwaailichten en verkeerslichten */}
      <Beacon position={[-8.2, 8.4, 46]} />
      <Beacon position={[8.2, 8.4, 46]} speed={-4} />
      <Kit name="warning-traffic" position={[-9.5, 0, 43]} />
      <Kit name="warning-traffic" position={[9.5, 0, 43]} />
    </>
  )
}

// Verhoogde band: grondstoffen (je skills, uit de silo's) komen uit een trechter
// en vallen aan het eind in een bak. Je kunt er met de heftruck onderdoor.
function RawMaterialLine() {
  const x = -18
  const startZ = 34
  const height = 3.6
  const endZ = startZ - 24
  return (
    <>
      <Conveyor start={[x, 0, startZ]} angle={Math.PI / 2} tiles={6} height={height} interval={2.6} pool={12} speed={2.6} />
      <Kit name="hopper-high-round" position={[x, height + 0.8, startZ - 1.2]} />
      <Kit name="machine-window" position={[x, height, startZ - 14]} />
      <Steam position={[x, height + 4, startZ - 1.2]} rate={0.7} size={0.7} rise={3} />
      <Bin position={[x, 0, endZ - 2.4]} />
    </>
  )
}

// Grondband van Raket naar verzending: robotarm laadt, machine verwerkt, bak vangt op.
function ShippingLine() {
  const belt = useRef<ConveyorHandle>(null)
  const z = -28
  return (
    <>
      <Conveyor ref={belt} start={[-6, 0, z]} tiles={4} speed={2} pool={8} />
      <RobotArm
        position={[-4, 0, z - 3]}
        pick={-Math.PI / 2}
        place={0}
        period={6.5}
        offset={0.3}
        onRelease={(p) => belt.current?.spawn(p.setY(1.6))}
      />
      <group position={[-6.4, 0, z - 3]}>
        <Kit name="box-large" />
        <Kit name="box-small" position={[0, 1.1, 0]} />
      </group>
      <Kit name="machine" position={[3, 0, z]} rotation-y={Math.PI / 2} />
      <Steam position={[3, 2.8, z]} rate={0.9} size={0.6} rise={3} />
      <Bin position={[12.4, 0, z]} />
    </>
  )
}

// Open bak die dozen opvangt aan het eind van een band.
function Bin({ position }: { position: Vec3 }) {
  return (
    <group position={position}>
      <RigidBody type="fixed" colliders={false}>
        <CuboidCollider args={[2.4, 0.6, 0.1]} position={[0, 0.6, 2.2]} />
        <CuboidCollider args={[2.4, 0.6, 0.1]} position={[0, 0.6, -2.2]} />
        <CuboidCollider args={[0.1, 0.6, 2.2]} position={[2.4, 0.6, 0]} />
        <CuboidCollider args={[0.1, 0.6, 2.2]} position={[-2.4, 0.6, 0]} />
      </RigidBody>
      {[
        [0, 2.2, 4.8, 0.2],
        [0, -2.2, 4.8, 0.2],
        [2.4, 0, 0.2, 4.4],
        [-2.4, 0, 0.2, 4.4],
      ].map(([bx, bz, w, d], i) => (
        <mesh key={i} position={[bx, 0.6, bz]} castShadow receiveShadow>
          <boxGeometry args={[w, 1.2, d]} />
          <meshStandardMaterial color={palette.orange} />
        </mesh>
      ))}
    </group>
  )
}

// Rijen machines langs de muren: achtergrond die de hal vult.
const WALL_MACHINES: { pos: Vec3; rot: number; name: string; steam?: boolean }[] = [
  { pos: [-8, 0, -38], rot: 0, name: 'machine-fortified', steam: true },
  { pos: [-3, 0, -38], rot: 0, name: 'machine-window' },
  { pos: [2, 0, -38], rot: 0, name: 'machine-fortified' },
  { pos: [7, 0, -38], rot: 0, name: 'machine', steam: true },
  { pos: [42.5, 0, -4], rot: -Math.PI / 2, name: 'machine-window' },
  { pos: [42.5, 0, 1], rot: -Math.PI / 2, name: 'machine-fortified', steam: true },
  { pos: [42.5, 0, 9], rot: -Math.PI / 2, name: 'machine' },
  { pos: [42.5, 0, 14], rot: -Math.PI / 2, name: 'machine-window' },
  { pos: [-43, 0, -2], rot: Math.PI / 2, name: 'machine-fortified' },
  { pos: [-43, 0, 3], rot: Math.PI / 2, name: 'machine-window', steam: true },
]

function WallMachines() {
  return (
    <>
      {WALL_MACHINES.map(({ pos, rot, name, steam }) => (
        <group key={pos.join()} position={pos} rotation-y={rot}>
          <RigidBody type="fixed" colliders={false}>
            <CuboidCollider args={[1.2, 1.3, 1.5]} position={[0, 1.3, 0]} />
          </RigidBody>
          <Kit name={name} />
          {/* de band die door de machine loopt, kort stukje als decor */}
          <Kit name="conveyor-stripe" position={[0, 0, 2.6]} rotation-y={Math.PI / 2} />
          {steam && <Steam position={[0, 2.8, -0.6]} rate={0.6 + (pos[0] % 3) * 0.1} size={0.6} rise={3.5} />}
        </group>
      ))}
    </>
  )
}

// Dikke leidingen hoog langs de noordmuur, op staanders.
function Pipes() {
  const from = -44
  const to = 12
  const len = 3 // pipe-large-long is 2 m, ×1.5
  const count = Math.floor((to - from) / len)
  return (
    <group position={[0, 0, -44.6]}>
      {Array.from({ length: count }, (_, i) => (
        <Kit key={i} name={i % 5 === 2 ? 'pipe-large-valve' : 'pipe-large-long'} scale={1.5} position={[from + len / 2 + i * len, 4.4, 0]} />
      ))}
      {Array.from({ length: Math.floor(count / 3) + 1 }, (_, i) => (
        <mesh key={i} position={[from + i * len * 3, 2.4, 0]} castShadow>
          <boxGeometry args={[0.3, 4.8, 0.3]} />
          <meshStandardMaterial color={palette.steel} />
        </mesh>
      ))}
    </group>
  )
}

// Gestreepte rijbaan op de vloer waar de AGV's rijden.
function LaneMarkings({ points }: { points: Vec3[] }) {
  const mesh = useRef<THREE.InstancedMesh>(null)
  const dashes = useMemo(() => {
    const curve = new THREE.CatmullRomCurve3(points.map((p) => new THREE.Vector3(...p)), true, 'catmullrom', 0.15)
    const n = Math.floor(curve.getLength() / 1.6)
    const m = new THREE.Matrix4()
    const q = new THREE.Quaternion()
    const out: THREE.Matrix4[] = []
    for (let i = 0; i < n; i++) {
      const u = i / n
      const p = curve.getPointAt(u)
      const t = curve.getTangentAt(u)
      q.setFromAxisAngle(THREE.Object3D.DEFAULT_UP, Math.atan2(t.x, t.z))
      for (const side of [-1.5, 1.5]) {
        const off = new THREE.Vector3(t.z, 0, -t.x).multiplyScalar(side)
        out.push(m.clone().compose(new THREE.Vector3(p.x + off.x, 0.025, p.z + off.z), q, new THREE.Vector3(1, 1, 1)))
      }
    }
    return out
  }, [points])

  return (
    <instancedMesh
      ref={(im) => {
        mesh.current = im
        if (!im) return
        dashes.forEach((d, i) => im.setMatrixAt(i, d))
        im.instanceMatrix.needsUpdate = true
      }}
      args={[undefined, undefined, dashes.length]}
      receiveShadow
    >
      <boxGeometry args={[0.15, 0.01, 0.8]} />
      <meshBasicMaterial color={palette.yellow} />
    </instancedMesh>
  )
}

// Stapels onder de twee eindpunten van de kraan.
function CraneDropZones() {
  return (
    <>
      {[
        [12, -8.4],
        [7.5, 2.5],
      ].map(([x, z]) => (
        <group key={`${x}${z}`} position={[x, 0, z]}>
          <Kit name="indicator-special-cross" position={[0, 0.01, 0]} />
          <Kit name="box-large" position={[0.3, 0, 0.2]} rotation-y={0.3} />
        </group>
      ))}
    </>
  )
}

preloadKit([
  'conveyor-long-stripe-sides',
  'robot-arm-a',
  'box-small',
  'box-large',
  'crane',
  'crane-lift',
  'piston-round',
  'piston-square',
  'cog-a',
  'cog-b',
  'cog-c',
  'hopper-high-round',
  'scanner-high',
  'warning-traffic',
  'indicator-special-cross',
  'machine',
  'machine-window',
  'machine-fortified',
  'conveyor-stripe',
  'pipe-large-long',
  'pipe-large-valve',
])
preloadKit(['delivery', 'sedan', 'suv', 'hatchback-sports'], 'cars')
