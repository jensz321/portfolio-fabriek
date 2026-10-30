import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { Text } from '@react-three/drei'
import { CuboidCollider, CylinderCollider, RigidBody } from '@react-three/rapier'
import * as THREE from 'three'
import { profile, zones, type ZoneId } from '../content'
import { WORLD, palette, zoneLayout, type Vec3 } from '../layout'
import { Zone } from './Zone'

// Greybox-fabriek: alles is opgebouwd uit simpele vormen in code.
// Later kunnen losse onderdelen vervangen worden door GLB-modellen.

export function Factory() {
  return (
    <>
      <Ground />
      {(Object.keys(zoneLayout) as ZoneId[]).map((id) => (
        <Zone key={id} id={id} />
      ))}
      <Gate />
      <ControlRoom />
      <Silos />
      <AssemblyLine />
      <RaketHall />
      <PadPlannerMachine />
      <Parking />
      <MiniFactory />
      <Warehouse />
      <LoadingDock />
      <Props />
    </>
  )
}

/* ---------- bouwstenen ---------- */

function Box({
  pos,
  size,
  color,
  physics = true,
  ...mat
}: { pos: Vec3; size: Vec3; color: string; physics?: boolean } & THREE.MeshStandardMaterialParameters) {
  const mesh = (
    <mesh position={pos} castShadow receiveShadow>
      <boxGeometry args={size} />
      <meshStandardMaterial color={color} roughness={0.8} {...mat} />
    </mesh>
  )
  if (!physics) return mesh
  return (
    <RigidBody type="fixed" colliders="cuboid">
      {mesh}
    </RigidBody>
  )
}

function Label({
  children,
  pos,
  rot = [0, 0, 0],
  size = 0.6,
  color = palette.dark,
}: {
  children: string
  pos: Vec3
  rot?: Vec3
  size?: number
  color?: string
}) {
  return (
    <Text position={pos} rotation={rot} fontSize={size} color={color} anchorX="center" anchorY="middle">
      {children}
    </Text>
  )
}

const FLAT: Vec3 = [-Math.PI / 2, 0, 0]

/* ---------- vloer, muren, poort ---------- */

const YARD_END = 62

function Ground() {
  const h = WORLD.half
  const wh = WORLD.wallHeight
  const gate = WORLD.gateWidth / 2
  const sideLen = h - gate
  const floorDepth = h + YARD_END

  return (
    <>
      <RigidBody type="fixed" colliders={false} friction={1}>
        <CuboidCollider args={[h + 2, 0.5, floorDepth / 2 + 2]} position={[0, -0.5, (YARD_END - h) / 2]} />
      </RigidBody>
      <mesh rotation-x={-Math.PI / 2} position={[0, 0, (YARD_END - h) / 2]} receiveShadow>
        <planeGeometry args={[h * 2 + 4, floorDepth + 4]} />
        <meshStandardMaterial color={palette.floor} roughness={1} />
      </mesh>
      {/* buitenterrein: asfalt voor de poort */}
      <mesh rotation-x={-Math.PI / 2} position={[0, 0.01, (h + YARD_END) / 2]} receiveShadow>
        <planeGeometry args={[h * 2, YARD_END - h]} />
        <meshStandardMaterial color="#a39d93" roughness={1} />
      </mesh>

      {/* lage muren, zodat de camera er altijd overheen kijkt */}
      <Box pos={[0, wh / 2, -h]} size={[h * 2, wh, 1]} color={palette.wall} />
      <Box pos={[-h, wh / 2, (YARD_END - h) / 2]} size={[1, wh, floorDepth]} color={palette.wall} />
      <Box pos={[h, wh / 2, (YARD_END - h) / 2]} size={[1, wh, floorDepth]} color={palette.wall} />
      <Box pos={[0, wh / 2, YARD_END]} size={[h * 2, wh, 1]} color={palette.wall} />
      <Box pos={[-(gate + sideLen / 2), wh / 2, h]} size={[sideLen, wh, 1]} color={palette.wall} />
      <Box pos={[gate + sideLen / 2, wh / 2, h]} size={[sideLen, wh, 1]} color={palette.wall} />
    </>
  )
}

function Gate() {
  const h = WORLD.half
  const x = WORLD.gateWidth / 2 + 0.6
  return (
    <group>
      <Box pos={[-x, 3.5, h]} size={[1.2, 7, 1.2]} color={palette.dark} />
      <Box pos={[x, 3.5, h]} size={[1.2, 7, 1.2]} color={palette.dark} />
      <Box pos={[0, 7.4, h]} size={[x * 2 + 1.2, 1.6, 1.2]} color={palette.dark} physics={false} />
      <Label pos={[0, 7.4, h + 0.62]} size={1.3} color={palette.orange}>
        jens.
      </Label>
      <Label pos={[0, 0.05, h + 7]} rot={FLAT} size={0.7} color={palette.dark}>
        WASD / PIJLTJES OM TE RIJDEN
      </Label>
      <Label pos={[0, 0.05, h + 8.2]} rot={FLAT} size={0.45} color={palette.dark}>
        R = TERUG NAAR DE POORT
      </Label>
    </group>
  )
}

/* ---------- over mij ---------- */

function ControlRoom() {
  const [zx, , zz] = zoneLayout.over.pos
  const x = zx - 11
  return (
    <group>
      <Box pos={[x, 1.5, zz]} size={[7, 3, 9]} color={palette.wall} />
      <Box pos={[x, 4.25, zz]} size={[7, 2.5, 9]} color={palette.blue} transparent opacity={0.35} physics={false} />
      <Box pos={[x, 5.6, zz]} size={[7.4, 0.2, 9.4]} color={palette.dark} physics={false} />
      {/* monitor met "foto" */}
      <Box pos={[x + 2.2, 4.2, zz]} size={[0.15, 1.6, 2.4]} color={palette.dark} physics={false} />
      <mesh position={[x + 2.29, 4.2, zz]} rotation-y={Math.PI / 2}>
        <planeGeometry args={[2.2, 1.4]} />
        <meshStandardMaterial color={palette.cream} emissive={palette.cream} emissiveIntensity={0.6} />
      </mesh>
      <Label pos={[x + 2.31, 4.2, zz]} rot={[0, Math.PI / 2, 0]} size={0.18}>
        [ dit ben ik, echt waar ]
      </Label>
      <Label pos={[x + 3.52, 1.6, zz]} rot={[0, Math.PI / 2, 0]} size={0.7} color={palette.cream}>
        CONTROLEKAMER
      </Label>
    </group>
  )
}

function Silos() {
  // Grondstoffen = skills. Eén silo per skill, langs de westkant bij de poort.
  const startX = -40
  const z = 36
  return (
    <group>
      {profile.skills.map((skill, i) => {
        const x = startX + i * 3.4
        const height = 4 + ((i * 7) % 3)
        return (
          <group key={skill}>
            <RigidBody type="fixed" colliders={false} position={[x, height / 2, z]}>
              <CylinderCollider args={[height / 2, 1.3]} />
              <mesh castShadow receiveShadow>
                <cylinderGeometry args={[1.3, 1.3, height, 20]} />
                <meshStandardMaterial color={i % 2 ? palette.steel : palette.cream} roughness={0.6} />
              </mesh>
              <mesh position-y={height / 2 + 0.4} castShadow>
                <coneGeometry args={[1.3, 0.8, 20]} />
                <meshStandardMaterial color={palette.dark} />
              </mesh>
            </RigidBody>
            <Label pos={[x, 0.05, z + 2.2]} rot={FLAT} size={0.42}>
              {skill.toUpperCase()}
            </Label>
          </group>
        )
      })}
      <Label pos={[startX + 10, 0.05, z + 3.4]} rot={FLAT} size={0.55} color={palette.blue}>
        GRONDSTOFFEN
      </Label>
    </group>
  )
}

/* ---------- route / tijdlijn ---------- */

function AssemblyLine() {
  const [zx, , zz] = zoneLayout.route.pos
  const z = zz - 8
  const length = 26
  const stations = zones.route.list ?? []
  const crates = useRef<THREE.Group>(null)
  const lamp = useRef<THREE.MeshStandardMaterial>(null)

  useFrame(({ clock }) => {
    const t = clock.elapsedTime
    crates.current?.children.forEach((c, i) => {
      c.position.x = (((t * 1.6 + i * (length / 6)) % length) + length) % length - length / 2
    })
    if (lamp.current) lamp.current.emissiveIntensity = 1 + Math.sin(t * 5) * 0.9
  })

  return (
    <group position={[zx, 0, z]}>
      <Box pos={[0, 0.5, 0]} size={[length, 1, 2]} color={palette.dark} />
      <mesh position={[0, 1.01, 0]} rotation-x={-Math.PI / 2}>
        <planeGeometry args={[length, 1.6]} />
        <meshStandardMaterial color="#45474f" />
      </mesh>
      <group ref={crates}>
        {Array.from({ length: 6 }, (_, i) => (
          <mesh key={i} position={[0, 1.4, 0]} castShadow>
            <boxGeometry args={[0.8, 0.8, 0.8]} />
            <meshStandardMaterial color={palette.yellow} />
          </mesh>
        ))}
      </group>
      {stations.map((s, i) => {
        const x = -length / 2 + 3 + i * ((length - 6) / (stations.length - 1))
        return (
          <group key={s.name} position={[x, 0, 0]}>
            <Box pos={[0, 2.6, -0.2]} size={[3, 0.6, 2.6]} color={s.now ? palette.green : palette.steel} physics={false} />
            <Box pos={[-1.4, 1.5, -1.3]} size={[0.2, 3, 0.2]} color={palette.dark} />
            <Box pos={[1.4, 1.5, -1.3]} size={[0.2, 3, 0.2]} color={palette.dark} />
            <Label pos={[0, 2.6, 1.12]} size={0.32} color={palette.cream}>
              {String(i + 1).padStart(2, '0')}
            </Label>
            <Label pos={[0, 0.05, 2.2]} rot={FLAT} size={0.3}>
              {s.name.length > 22 ? s.name.slice(0, 20) + '…' : s.name}
            </Label>
            {s.now && (
              <mesh position={[0, 3.2, -0.2]}>
                <sphereGeometry args={[0.25, 16, 16]} />
                <meshStandardMaterial ref={lamp} color={palette.green} emissive={palette.green} />
              </mesh>
            )}
          </group>
        )
      })}
    </group>
  )
}

/* ---------- projecten ---------- */

function Screen({ pos, label, color }: { pos: Vec3; label: string; color: string }) {
  return (
    <group position={pos}>
      <Box pos={[0, 1.6, 0]} size={[5, 3.2, 3]} color={palette.wall} />
      <mesh position={[0, 2, 1.51]}>
        <planeGeometry args={[4, 1.8]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.7} />
      </mesh>
      <Label pos={[0, 2, 1.52]} size={0.5} color={palette.cream}>
        {label}
      </Label>
    </group>
  )
}

function RaketHall() {
  const [zx, , zz] = zoneLayout.raket.pos
  return (
    <group position={[zx, 0, zz - 9]}>
      <Screen pos={[-3.5, 0, 0]} label="PULSE720" color={palette.blue} />
      <Screen pos={[3.5, 0, 0]} label="CURO.ONE" color="#6c4fd9" />
      <Box pos={[0, 5, -0.5]} size={[13, 0.4, 4]} color={palette.dark} physics={false} />
      <Label pos={[0, 5, 1.52]} size={0.45} color={palette.cream}>
        STAGE BIJ RAKET
      </Label>
    </group>
  )
}

function PadPlannerMachine() {
  const [zx, , zz] = zoneLayout.padplanner.pos
  const walker = useRef<THREE.Mesh>(null)
  const loop = useMemo(() => {
    // Rondwandeling die weer bij de voordeur eindigt.
    const pts = Array.from({ length: 9 }, (_, i) => {
      const a = (i / 8) * Math.PI * 2
      const r = 3 + Math.sin(a * 3) * 0.8
      return new THREE.Vector3(Math.cos(a) * r, 0.06, Math.sin(a) * r)
    })
    return new THREE.CatmullRomCurve3(pts, true)
  }, [])

  useFrame(({ clock }) => {
    if (!walker.current) return
    const p = loop.getPointAt((clock.elapsedTime * 0.06) % 1)
    walker.current.position.set(p.x, 0.4, p.z)
  })

  return (
    <group>
      <group position={[zx, 0, zz - 9]}>
        <Box pos={[0, 1.4, 0]} size={[5, 2.8, 3]} color={palette.green} />
        <Box pos={[0, 0.9, 1.6]} size={[3, 0.1, 0.8]} color={palette.cream} physics={false} />
        <Label pos={[0, 2.2, 1.52]} size={0.5} color={palette.cream}>
          PADPLANNER
        </Label>
      </group>
      <group position={[zx + 12, 0, zz]}>
        <mesh>
          <tubeGeometry args={[loop, 120, 0.12, 6, true]} />
          <meshStandardMaterial color={palette.green} />
        </mesh>
        <Box pos={[3, 0.5, 0]} size={[1, 1, 1]} color={palette.orange} physics={false} />
        <mesh ref={walker} castShadow>
          <capsuleGeometry args={[0.15, 0.4, 4, 8]} />
          <meshStandardMaterial color={palette.dark} />
        </mesh>
      </group>
    </group>
  )
}

function Car({ pos, color, plate }: { pos: Vec3; color: string; plate?: string }) {
  return (
    <RigidBody position={pos} colliders={false} mass={20} linearDamping={2} angularDamping={2}>
      <CuboidCollider args={[1, 0.75, 2]} position={[0, 0.85, 0]} />
      <mesh castShadow position={[0, 0.7, 0]}>
        <boxGeometry args={[2, 0.9, 4]} />
        <meshStandardMaterial color={color} />
      </mesh>
      <mesh castShadow position={[0, 1.45, -0.2]}>
        <boxGeometry args={[1.8, 0.7, 2.2]} />
        <meshStandardMaterial color={palette.cream} />
      </mesh>
      {plate && (
        <>
          <mesh position={[0, 0.6, 2.01]}>
            <planeGeometry args={[1.3, 0.32]} />
            <meshStandardMaterial color={palette.yellow} />
          </mesh>
          <Label pos={[0, 0.6, 2.02]} size={0.18}>
            {plate}
          </Label>
        </>
      )}
    </RigidBody>
  )
}

function Parking() {
  const [zx, , zz] = zoneLayout['wie-rijdt'].pos
  const x = zx + 10
  return (
    <group>
      {[-3, 0, 3].map((dx) => (
        <mesh key={dx} rotation-x={-Math.PI / 2} position={[x + dx + 1.5, 0.03, zz]}>
          <planeGeometry args={[0.15, 5]} />
          <meshBasicMaterial color={palette.cream} />
        </mesh>
      ))}
      <Car pos={[x - 1.5, 0, zz]} color={palette.orange} plate="WIE RIJDT?" />
      <Car pos={[x + 1.6, 0, zz + 0.4]} color={palette.blue} />
      <Label pos={[x, 0.05, zz + 4]} rot={FLAT} size={0.5}>
        P · 4 PERSONEN · 1 AUTO
      </Label>
    </group>
  )
}

function MiniFactory() {
  const [zx, , zz] = zoneLayout.fabriek.pos
  const tiny = useRef<THREE.Mesh>(null)
  useFrame(({ clock }) => {
    if (!tiny.current) return
    const t = clock.elapsedTime * 0.8
    tiny.current.position.set(Math.cos(t) * 0.9, 1.75, Math.sin(t) * 0.9)
    tiny.current.rotation.y = -t
  })
  return (
    <group position={[zx, 0, zz - 7]}>
      <Box pos={[0, 0.75, 0]} size={[3.4, 1.5, 3.4]} color={palette.dark} />
      <Box pos={[0, 1.55, 0]} size={[3, 0.1, 3]} color={palette.floor} physics={false} />
      <Box pos={[-0.9, 1.8, -0.9]} size={[0.6, 0.4, 0.5]} color={palette.blue} physics={false} />
      <Box pos={[0.9, 1.8, -0.9]} size={[0.6, 0.4, 0.5]} color={palette.green} physics={false} />
      <Box pos={[0, 1.7, 1.1]} size={[1, 0.2, 0.3]} color={palette.dark} physics={false} />
      <mesh ref={tiny} castShadow>
        <boxGeometry args={[0.18, 0.18, 0.26]} />
        <meshStandardMaterial color={palette.yellow} />
      </mesh>
      <Label pos={[0, 0.9, 1.72]} size={0.28} color={palette.cream}>
        JE BENT HIER
      </Label>
    </group>
  )
}

/* ---------- magazijn (school) ---------- */

function Crate({ pos, label, color = palette.yellow }: { pos: Vec3; label?: string; color?: string }) {
  return (
    <RigidBody position={pos} colliders="cuboid" mass={0.6} linearDamping={0.6} angularDamping={0.6}>
      <mesh castShadow receiveShadow>
        <boxGeometry args={[1.2, 1.2, 1.2]} />
        <meshStandardMaterial color={color} roughness={0.9} />
      </mesh>
      {label && (
        <Label pos={[0, 0.61, 0]} rot={FLAT} size={0.16}>
          {label}
        </Label>
      )}
    </RigidBody>
  )
}

function Warehouse() {
  const [zx, , zz] = zoneLayout.school.pos
  const z = zz - 8
  const projects = zones.school.list ?? []
  return (
    <group>
      {[-5, 0, 5].map((dx) => (
        <group key={dx} position={[zx + dx, 0, z]}>
          {[0.1, 2, 3.9].map((y) => (
            <Box key={y} pos={[0, y, 0]} size={[4.4, 0.15, 2]} color={palette.orange} physics={y < 1} />
          ))}
          {[-2.1, 2.1].map((px) => (
            <Box key={px} pos={[px, 2, 0]} size={[0.15, 4, 2]} color={palette.blue} />
          ))}
          <Box pos={[0.8, 2.6, 0]} size={[1.2, 1.1, 1.2]} color={palette.yellow} physics={false} />
          <Box pos={[-0.9, 4.5, 0]} size={[1.2, 1.1, 1.2]} color={palette.cream} physics={false} />
        </group>
      ))}
      {projects.map((p, i) => (
        <Crate key={i} pos={[zx - 4.5 + i * 3, 0.6, zz - 1]} label={p.name.toUpperCase()} />
      ))}
      {/* schrootbak voor de dingetjes die nooit af zijn gekomen */}
      <group position={[zx - 13, 0, zz]}>
        <Box pos={[0, 0.6, -1.5]} size={[4, 1.2, 0.2]} color={palette.steel} />
        <Box pos={[0, 0.6, 1.5]} size={[4, 1.2, 0.2]} color={palette.steel} />
        <Box pos={[-2, 0.6, 0]} size={[0.2, 1.2, 3]} color={palette.steel} />
        <Box pos={[2, 0.6, 0]} size={[0.2, 1.2, 3]} color={palette.steel} />
        <Label pos={[0, 0.05, 2.6]} rot={FLAT} size={0.35}>
          NOOIT AF
        </Label>
        <Crate pos={[-0.6, 0.6, 0]} color={palette.wall} />
        <Crate pos={[0.8, 0.6, 0.2]} color={palette.wall} />
      </group>
    </group>
  )
}

/* ---------- laaddok (contact) ---------- */

function LoadingDock() {
  const [zx, , zz] = zoneLayout.contact.pos
  const z = -WORLD.half + 2
  const doors = (zones.contact.links ?? []).map((l) => l.label.replace(' ↗', '').toUpperCase())
  return (
    <group>
      <Box pos={[zx, 3, z]} size={[20, 6, 3]} color={palette.wall} />
      {doors.map((label, i) => {
        const x = zx - 6 + i * 6
        return (
          <group key={label} position={[x, 0, z + 1.52]}>
            <mesh position={[0, 2, 0]}>
              <planeGeometry args={[4, 4]} />
              <meshStandardMaterial color={palette.steel} />
            </mesh>
            {[0.6, 1.4, 2.2, 3, 3.8].map((y) => (
              <mesh key={y} position={[0, y, 0.01]}>
                <planeGeometry args={[4, 0.05]} />
                <meshStandardMaterial color={palette.dark} />
              </mesh>
            ))}
            <Box pos={[0, 4.6, 0.1]} size={[3, 0.8, 0.1]} color={palette.orange} physics={false} />
            <Label pos={[0, 4.6, 0.17]} size={0.45} color={palette.cream}>
              {label}
            </Label>
          </group>
        )
      })}
      <Label pos={[zx, 0.05, zz + 6]} rot={FLAT} size={0.4}>
        GEMAAKT IN APELDOORN
      </Label>
    </group>
  )
}

/* ---------- losse spullen om tegenaan te rijden ---------- */

function Props() {
  const barrels: Vec3[] = [
    [10, 0.7, 30],
    [11.2, 0.7, 30.6],
    [10.4, 0.7, 31.6],
    [-12, 0.7, -22],
    [36, 0.7, 4],
  ]
  const cones: Vec3[] = [
    [-5, 0.4, 32],
    [5, 0.4, 32],
    [-5, 0.4, 26],
    [5, 0.4, 26],
  ]
  return (
    <>
      {barrels.map((p, i) => (
        <RigidBody key={i} position={p} colliders="hull" mass={0.4}>
          <mesh castShadow>
            <cylinderGeometry args={[0.5, 0.5, 1.4, 14]} />
            <meshStandardMaterial color={i % 2 ? palette.blue : palette.orange} />
          </mesh>
        </RigidBody>
      ))}
      {cones.map((p, i) => (
        <RigidBody key={i} position={p} colliders="hull" mass={0.1}>
          <mesh castShadow>
            <coneGeometry args={[0.35, 0.8, 12]} />
            <meshStandardMaterial color={palette.orange} />
          </mesh>
        </RigidBody>
      ))}
      <Crate pos={[16, 0.6, 6]} />
      <Crate pos={[16, 1.8, 6]} />
      <Crate pos={[17.3, 0.6, 6.3]} />
      <Crate pos={[-14, 0.6, 8]} />
    </>
  )
}
