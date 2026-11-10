import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { Text } from '@react-three/drei'
import { CuboidCollider, CylinderCollider, RigidBody } from '@react-three/rapier'
import * as THREE from 'three'
import { profile, zones, type ZoneId } from '../content'
import { WORLD, zoneLayout, type Vec3 } from '../layout'
import { Zone } from './Zone'
import { Kit } from './kit'
import { FLAT as COLOR, FONT, KitBox, KitCylinder, type Swatch } from './style'
import { floorTexture } from './textures'
import { Conveyor, type ConveyorHandle } from './life/Conveyor'
import { RobotArm } from './life/RobotArm'
import { Cargo } from './life/Cargo'
import { ParkedCar } from './life/Vehicles'
import { Life } from './life/Life'
import { LotteryBoard, PhotoBadge, ProjectScreen } from './Personal'

// De vaste gebouwen en zones. Eigen vormen gebruiken KitBox/KitCylinder,
// zodat ze dezelfde kleuren en afgeronde randen hebben als de Kenney-modellen.

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
      <Life />
    </>
  )
}

/* ---------- bouwstenen ---------- */

function Box({
  pos,
  size,
  swatch,
  physics = true,
  radius,
  flat,
}: {
  pos: Vec3
  size: Vec3
  swatch: Swatch
  physics?: boolean
  radius?: number
  flat?: boolean
}) {
  const mesh = <KitBox position={pos} size={size} swatch={swatch} radius={radius} flat={flat} />
  if (!physics) return mesh
  return (
    <RigidBody type="fixed" colliders={false}>
      <CuboidCollider args={[size[0] / 2, size[1] / 2, size[2] / 2]} position={pos} />
      {mesh}
    </RigidBody>
  )
}

export function Label({
  children,
  pos,
  rot = [0, 0, 0],
  size = 0.6,
  color = COLOR.navy,
  display,
}: {
  children: string
  pos: Vec3
  rot?: Vec3
  size?: number
  color?: string
  display?: boolean
}) {
  return (
    <Text
      position={pos}
      rotation={rot}
      fontSize={size}
      color={color}
      font={display ? FONT.display : FONT.text}
      anchorX="center"
      anchorY="middle"
    >
      {children}
    </Text>
  )
}

const FLAT_ROT: Vec3 = [-Math.PI / 2, 0, 0]

/* ---------- vloer, muren, poort ---------- */

const YARD_END = WORLD.yardEnd

function Ground() {
  const h = WORLD.half
  const wh = WORLD.wallHeight
  const gate = WORLD.gateWidth / 2
  const sideLen = h - gate
  const floorDepth = h + YARD_END
  const hall = useMemo(() => floorTexture('hall', (h * 2) / 8, (h * 2) / 8), [h])
  const yard = useMemo(() => floorTexture('yard', (h * 2) / 8, (YARD_END - h) / 8), [h])

  return (
    <>
      <RigidBody type="fixed" colliders={false} friction={1}>
        <CuboidCollider args={[h + 2, 0.5, floorDepth / 2 + 2]} position={[0, -0.5, (YARD_END - h) / 2]} />
      </RigidBody>
      <mesh rotation-x={-Math.PI / 2} position={[0, 0, 0]} receiveShadow>
        <planeGeometry args={[h * 2, h * 2]} />
        <meshStandardMaterial map={hall} roughness={0.95} />
      </mesh>
      {/* buitenterrein voor de poort */}
      <mesh rotation-x={-Math.PI / 2} position={[0, 0, (h + YARD_END) / 2]} receiveShadow>
        <planeGeometry args={[h * 2, YARD_END - h]} />
        <meshStandardMaterial map={yard} roughness={1} />
      </mesh>
      {/* rand rondom, zodat de wereld niet in het niets eindigt */}
      <mesh rotation-x={-Math.PI / 2} position={[0, -0.02, (YARD_END - h) / 2]} receiveShadow>
        <planeGeometry args={[h * 2 + 40, floorDepth + 40]} />
        <meshStandardMaterial color="#c9c6d8" roughness={1} />
      </mesh>

      {/* lage muren met een donkere rand bovenop, zodat de camera er altijd overheen kijkt */}
      {[
        [[0, -h], [h * 2 + 1, 1]],
        [[-h, (YARD_END - h) / 2], [1, floorDepth]],
        [[h, (YARD_END - h) / 2], [1, floorDepth]],
        [[0, YARD_END], [h * 2 + 1, 1]],
        [[-(gate + sideLen / 2), h], [sideLen, 1]],
        [[gate + sideLen / 2, h], [sideLen, 1]],
      ].map(([[x, z], [w, d]], i) => (
        <group key={i}>
          <Box pos={[x, wh / 2, z]} size={[w, wh, d]} swatch="silver" radius={0.15} />
          <Box pos={[x, wh + 0.1, z]} size={[w + 0.1, 0.2, d + 0.1]} swatch="navy" radius={0.06} physics={false} />
        </group>
      ))}
    </>
  )
}

function Gate() {
  const h = WORLD.half
  const x = WORLD.gateWidth / 2 + 0.6
  return (
    <group>
      {[-x, x].map((px) => (
        <group key={px}>
          <Box pos={[px, 3.5, h]} size={[1.4, 7, 1.4]} swatch="navy" radius={0.2} />
          {/* geel-zwarte waarschuwingsband onderaan de palen */}
          {[0.4, 1.2].map((y) => (
            <Box key={y} pos={[px, y, h]} size={[1.5, 0.4, 1.5]} swatch="yellow" radius={0.08} physics={false} />
          ))}
        </group>
      ))}
      <Box pos={[0, 7.6, h]} size={[x * 2 + 1.6, 1.8, 1.5]} swatch="navy" radius={0.25} physics={false} />
      <Box pos={[0, 7.6, h + 0.6]} size={[6, 1.3, 0.4]} swatch="indigo" radius={0.15} physics={false} />
      <Label pos={[0, 7.6, h + 0.82]} size={1.3} color={COLOR.orange} display>
        jens.
      </Label>
      <Label pos={[0, 0.05, h + 7]} rot={FLAT_ROT} size={0.7}>
        WASD / PIJLTJES OM TE RIJDEN
      </Label>
      <Label pos={[0, 0.05, h + 8.2]} rot={FLAT_ROT} size={0.45}>
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
      <Box pos={[x, 1.5, zz]} size={[7, 3, 9]} swatch="silver" radius={0.3} />
      <Box pos={[x, 3.1, zz]} size={[7.3, 0.3, 9.3]} swatch="navy" physics={false} />
      {/* glazen bovenbouw met hoekstijlen */}
      <mesh position={[x, 4.4, zz]}>
        <boxGeometry args={[6.8, 2.4, 8.8]} />
        <meshStandardMaterial color={COLOR.sky} transparent opacity={0.4} roughness={0.1} />
      </mesh>
      {[
        [-3.4, -4.4],
        [3.4, -4.4],
        [-3.4, 4.4],
        [3.4, 4.4],
      ].map(([dx, dz]) => (
        <Box key={`${dx}${dz}`} pos={[x + dx, 4.4, zz + dz]} size={[0.3, 2.5, 0.3]} swatch="navy" physics={false} />
      ))}
      <Box pos={[x, 5.75, zz]} size={[7.6, 0.4, 9.6]} swatch="navy" radius={0.15} physics={false} />
      {/* monitor met systeemstatus */}
      <Box pos={[x + 2.2, 4.2, zz]} size={[0.2, 1.7, 2.5]} swatch="charcoal" physics={false} />
      <mesh position={[x + 2.31, 4.2, zz]} rotation-y={Math.PI / 2}>
        <planeGeometry args={[2.2, 1.4]} />
        <meshStandardMaterial color={COLOR.green} emissive={COLOR.green} emissiveIntensity={0.6} />
      </mesh>
      <Label pos={[x + 2.33, 4.2, zz]} rot={[0, Math.PI / 2, 0]} size={0.22} color={COLOR.white} display>
        ALLES DRAAIT
      </Label>
      <Box pos={[x + 3.55, 1.6, zz]} size={[0.15, 0.9, 5.4]} swatch="royal" physics={false} />
      <Label pos={[x + 3.65, 1.6, zz]} rot={[0, Math.PI / 2, 0]} size={0.6} color={COLOR.white} display>
        CONTROLEKAMER
      </Label>
      {/* personeelspas met foto, schuin naar de camera gedraaid */}
      <PhotoBadge position={[zx - 6, 0, zz + 8.5]} rotation={Math.PI / 4} />
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
              <KitCylinder radius={1.3} height={height} swatch={i % 2 ? 'silver' : 'white'} />
              <KitCylinder radius={1.36} height={0.3} swatch="orange" position-y={height / 2 - 0.8} />
              <KitCylinder radius={1.36} height={0.3} swatch="navy" position-y={-height / 2 + 0.15} />
              <KitCylinder radius={1.3} top={0.25} height={0.8} swatch="navy" position-y={height / 2 + 0.4} />
            </RigidBody>
            <Label pos={[x, 0.05, z + 2.2]} rot={FLAT_ROT} size={0.42}>
              {skill.toUpperCase()}
            </Label>
          </group>
        )
      })}
      <Label pos={[startX + 10, 0.05, z + 3.4]} rot={FLAT_ROT} size={0.55} color={COLOR.royal} display>
        GRONDSTOFFEN
      </Label>
    </group>
  )
}

/* ---------- route / tijdlijn ---------- */

function AssemblyLine() {
  const [zx, , zz] = zoneLayout.route.pos
  const z = zz - 8
  const length = 24
  const stations = zones.route.list ?? []
  const belt = useRef<ConveyorHandle>(null)
  const lamp = useRef<THREE.MeshStandardMaterial>(null)

  useFrame(({ clock }) => {
    if (lamp.current) lamp.current.emissiveIntensity = 1 + Math.sin(clock.elapsedTime * 5) * 0.9
  })

  return (
    <group>
      <Conveyor ref={belt} start={[zx - length / 2 - 1, 0, z]} tiles={length / 4} pool={9} speed={2} />
      {/* robotarm zet dozen van de pallet op het begin van de band */}
      <RobotArm
        position={[zx - length / 2 + 1, 0, z - 3]}
        pick={-Math.PI / 2}
        place={0}
        period={6}
        onRelease={(p) => belt.current?.spawn(p.setY(1.6))}
      />
      <Pallet pos={[zx - length / 2 - 2.2, 0, z - 3]} />
      <Kit name="scanner-high" position={[zx - 2.7, 0, z]} />
      <group position={[zx, 0, z]}>
        {stations.map((s, i) => {
          const x = -length / 2 + 7 + i * ((length - 10) / (stations.length - 1))
          return (
            <group key={s.name} position={[x, 0, 0]}>
              <Box pos={[0, 3, 0]} size={[3, 0.7, 2.8]} swatch={s.now ? 'green' : 'periwinkle'} radius={0.2} physics={false} />
              <Box pos={[-1.4, 1.5, -1.5]} size={[0.3, 3, 0.3]} swatch="navy" />
              <Box pos={[1.4, 1.5, -1.5]} size={[0.3, 3, 0.3]} swatch="navy" />
              <Label pos={[0, 3, 1.42]} size={0.36} color={COLOR.white} display>
                {String(i + 1).padStart(2, '0')}
              </Label>
              <Label pos={[0, 0.05, 2.6]} rot={FLAT_ROT} size={0.3}>
                {s.name.length > 22 ? s.name.slice(0, 20) + '…' : s.name}
              </Label>
              {s.now && (
                <mesh position={[0, 3.65, 0]}>
                  <sphereGeometry args={[0.25, 16, 16]} />
                  <meshStandardMaterial ref={lamp} color={COLOR.green} emissive={COLOR.green} />
                </mesh>
              )}
            </group>
          )
        })}
      </group>
    </group>
  )
}

// Een pallet met gestapelde dozen (decor, waar de robotarm "van pakt").
function Pallet({ pos }: { pos: Vec3 }) {
  return (
    <group position={pos}>
      <Box pos={[0, 0.15, 0]} size={[2.2, 0.3, 2.2]} swatch="brown" radius={0.05} />
      <Kit name="box-large" position={[0, 0.3, 0]} />
      <Kit name="box-small" position={[-0.4, 1.4, 0.2]} rotation-y={0.2} />
      <Kit name="box-small" position={[0.5, 1.4, -0.1]} rotation-y={-0.1} />
    </group>
  )
}

/* ---------- projecten ---------- */

function Screen({ pos, label, color }: { pos: Vec3; label: string; color: string }) {
  return (
    <group position={pos}>
      <Box pos={[0, 1.6, 0]} size={[5, 3.2, 3]} swatch="silver" radius={0.3} />
      <Box pos={[0, 2, 1.45]} size={[4.4, 2.2, 0.2]} swatch="charcoal" physics={false} />
      <mesh position={[0, 2, 1.56]}>
        <planeGeometry args={[4, 1.8]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.7} />
      </mesh>
      <Label pos={[0, 2, 1.57]} size={0.5} color={COLOR.white} display>
        {label}
      </Label>
    </group>
  )
}

function RaketHall() {
  const [zx, , zz] = zoneLayout.raket.pos
  return (
    <group position={[zx, 0, zz - 9]}>
      <Screen pos={[-3.5, 0, 0]} label="PULSE720" color={COLOR.blue} />
      <Screen pos={[3.5, 0, 0]} label="CURO.ONE" color={COLOR.purple} />
      {[-6.2, 6.2].map((x) => (
        <Box key={x} pos={[x, 2.5, -0.5]} size={[0.4, 5, 0.4]} swatch="navy" />
      ))}
      <Box pos={[0, 5.1, -0.5]} size={[13.4, 0.6, 4]} swatch="navy" radius={0.2} physics={false} />
      <Label pos={[0, 5.1, 1.52]} size={0.45} color={COLOR.white} display>
        STAGE BIJ RAKET
      </Label>
    </group>
  )
}

function PadPlannerMachine() {
  const [zx, , zz] = zoneLayout.padplanner.pos
  const walker = useRef<THREE.Group>(null)
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
    const u = (clock.elapsedTime * 0.06) % 1
    const p = loop.getPointAt(u)
    const t = loop.getTangentAt(u)
    walker.current.position.set(p.x, 0, p.z)
    walker.current.rotation.y = Math.atan2(t.x, t.z)
  })

  return (
    <group>
      <group position={[zx, 0, zz - 9]}>
        <Box pos={[0, 1.4, 0]} size={[5, 2.8, 3]} swatch="green" radius={0.35} />
        <Box pos={[0, 2.9, -0.3]} size={[4.2, 0.4, 2.2]} swatch="navy" radius={0.15} physics={false} />
        {/* uitvoerlade met een geprinte route */}
        <Box pos={[0, 0.9, 1.7]} size={[3, 0.15, 0.9]} swatch="white" physics={false} />
        <Label pos={[0, 2.1, 1.52]} size={0.5} color={COLOR.white} display>
          PADPLANNER
        </Label>
      </group>
      <ProjectScreen position={[zx + 6.4, 0, zz - 9.5]} image="/images/route.jpg" />
      <group position={[zx + 12, 0, zz]}>
        <mesh>
          <tubeGeometry args={[loop, 120, 0.12, 6, true]} />
          <meshStandardMaterial color={COLOR.green} />
        </mesh>
        {/* "voordeur": klein huisje waar de route begint en eindigt */}
        <group position={[3, 0, 0]}>
          <KitBox size={[1.2, 1, 1.2]} swatch="cream" position-y={0.5} />
          <KitCylinder radius={1} top={0.01} height={0.7} segments={4} swatch="red" position-y={1.35} rotation-y={Math.PI / 4} />
        </group>
        <group ref={walker}>
          <KitCylinder radius={0.16} height={0.5} swatch="blue" position-y={0.35} />
          <KitCylinder radius={0.13} height={0.25} swatch="peach" position-y={0.75} />
        </group>
      </group>
    </group>
  )
}

function Parking() {
  const [zx, , zz] = zoneLayout['wie-rijdt'].pos
  const x = zx + 10
  return (
    <group>
      {[-3, 0, 3, 6].map((dx) => (
        <mesh key={dx} rotation-x={-Math.PI / 2} position={[x + dx + 1.5, 0.03, zz]}>
          <planeGeometry args={[0.15, 5]} />
          <meshBasicMaterial color={COLOR.white} />
        </mesh>
      ))}
      <ParkedCar position={[x - 1.5, 0, zz]} rotation={Math.PI} model="hatchback-sports" plate="WIE RIJDT?" />
      <ParkedCar position={[x + 1.6, 0, zz + 0.3]} rotation={Math.PI} model="sedan" />
      <ParkedCar position={[x + 4.6, 0, zz - 0.2]} rotation={Math.PI} model="suv" />
      <Label pos={[x, 0.05, zz + 4]} rot={FLAT_ROT} size={0.5}>
        P · 4 PERSONEN · 1 AUTO
      </Label>
      <LotteryBoard position={[x + 2, 0, zz - 5.5]} />
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
      <Box pos={[0, 0.75, 0]} size={[3.4, 1.5, 3.4]} swatch="navy" radius={0.2} />
      <Box pos={[0, 1.55, 0]} size={[3, 0.1, 3]} swatch="silver" radius={0.03} physics={false} />
      <Box pos={[-0.9, 1.8, -0.9]} size={[0.6, 0.4, 0.5]} swatch="blue" radius={0.06} physics={false} />
      <Box pos={[0.9, 1.8, -0.9]} size={[0.6, 0.4, 0.5]} swatch="green" radius={0.06} physics={false} />
      <Box pos={[0, 1.7, 1.1]} size={[1, 0.2, 0.3]} swatch="periwinkle" radius={0.04} physics={false} />
      <KitBox ref={tiny} size={[0.18, 0.18, 0.26]} swatch="yellow" radius={0.03} />
      <Label pos={[0, 0.9, 1.72]} size={0.28} color={COLOR.white} display>
        JE BENT HIER
      </Label>
    </group>
  )
}

/* ---------- magazijn (school) ---------- */

// Krat met een projectnaam erop; dezelfde doos als overal in de fabriek.
function Crate({ pos, label }: { pos: Vec3; label: string }) {
  return (
    <RigidBody position={pos} colliders={false} linearDamping={0.6} angularDamping={0.6} density={0.4}>
      <CuboidCollider args={[1.1, 0.55, 1]} position={[0, 0.55, 0]} />
      <Kit name="box-large" />
      <Label pos={[0, 1.12, 0.6]} rot={FLAT_ROT} size={0.2}>
        {label}
      </Label>
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
          {[0.15, 2, 3.9].map((y) => (
            <Box key={y} pos={[0, y, 0]} size={[4.4, 0.2, 2]} swatch="orange" radius={0.05} physics={y < 1} />
          ))}
          {[-2.1, 2.1].map((px) =>
            [-0.85, 0.85].map((pz) => <Box key={`${px}${pz}`} pos={[px, 2, pz]} size={[0.2, 4, 0.2]} swatch="royal" radius={0.04} />),
          )}
          <Kit name="box-large" position={[0.6, 2.1, 0]} />
          <Kit name="box-small" position={[-1.1, 2.1, 0.1]} rotation-y={0.3} />
          <Kit name="box-wide" position={[-0.6, 4, 0]} />
        </group>
      ))}
      {projects.map((p, i) => (
        <Crate key={i} pos={[zx - 4.5 + i * 3, 0.05, zz - 1]} label={p.name.toUpperCase()} />
      ))}
      {/* schrootbak voor de dingetjes die nooit af zijn gekomen */}
      <group position={[zx - 13, 0, zz]}>
        <Box pos={[0, 0.6, -1.5]} size={[4, 1.2, 0.25]} swatch="steel" radius={0.06} />
        <Box pos={[0, 0.6, 1.5]} size={[4, 1.2, 0.25]} swatch="steel" radius={0.06} />
        <Box pos={[-2, 0.6, 0]} size={[0.25, 1.2, 3]} swatch="steel" radius={0.06} />
        <Box pos={[2, 0.6, 0]} size={[0.25, 1.2, 3]} swatch="steel" radius={0.06} />
        <Label pos={[0, 0.05, 2.6]} rot={FLAT_ROT} size={0.35}>
          NOOIT AF
        </Label>
        <Cargo variant="box-small" position={[-0.6, 0.1, 0]} rotation={[0.3, 0.4, 0]} />
        <Cargo variant="box-small" position={[0.8, 0.1, 0.2]} rotation={[0, -0.6, 0.2]} />
      </group>
    </group>
  )
}

/* ---------- laaddok (contact) ---------- */

function LoadingDock() {
  const [zx, , zz] = zoneLayout.contact.pos
  const z = -WORLD.half + 2
  const front = z + 1.5
  const doors = (zones.contact.links ?? []).map((l) => l.label.replace(' ↗', '').toUpperCase())
  return (
    <group>
      <Box pos={[zx + 3, 3, z]} size={[26, 6, 3]} swatch="silver" radius={0.3} />
      <Box pos={[zx + 3, 6.1, z]} size={[26.4, 0.4, 3.4]} swatch="navy" radius={0.12} physics={false} />
      {/* laadplaats voor de vrachtwagen */}
      <group position={[zx + 13, 0, front]}>
        <Kit name="door-wide-open" position={[0, 0, -0.75]} />
        <Box pos={[0, 4.9, 0.1]} size={[3, 0.8, 0.2]} swatch="yellow" radius={0.08} physics={false} />
        <Label pos={[0, 4.9, 0.22]} size={0.4} display>
          LADING
        </Label>
      </group>
      {doors.map((label, i) => {
        const x = zx - 6 + i * 6
        return (
          <group key={label} position={[x, 0, front]}>
            <Kit name="door-wide-closed" position={[0, 0, -0.75]} />
            <Box pos={[0, 4.6, 0.1]} size={[3, 0.8, 0.2]} swatch="orange" radius={0.08} physics={false} />
            <Label pos={[0, 4.6, 0.22]} size={0.42} color={COLOR.white} display>
              {label}
            </Label>
          </group>
        )
      })}
      <Label pos={[zx, 0.05, zz + 6]} rot={FLAT_ROT} size={0.4}>
        GEMAAKT IN APELDOORN
      </Label>
    </group>
  )
}

/* ---------- losse spullen om tegenaan te rijden ---------- */

function Props() {
  const barrels: Vec3[] = [
    [10, 0.7, 36],
    [11.2, 0.7, 36.6],
    [10.4, 0.7, 37.6],
    [-6, 0.7, -30],
    [38, 0.7, 6],
  ]
  const cones: Vec3[] = [
    [-5, 0, 34],
    [5, 0, 34],
    [-6.5, 0, 44],
    [6.5, 0, 44],
  ]
  return (
    <>
      {barrels.map((p, i) => (
        <RigidBody key={i} position={p} colliders={false} mass={0.4}>
          <CylinderCollider args={[0.7, 0.5]} />
          <KitCylinder radius={0.5} height={1.4} swatch={i % 2 ? 'blue' : 'orange'} />
          {[-0.4, 0.4].map((y) => (
            <KitCylinder key={y} radius={0.53} height={0.1} swatch="navy" position-y={y} />
          ))}
        </RigidBody>
      ))}
      {cones.map((p, i) => (
        <RigidBody key={i} position={p} colliders="hull" mass={0.1}>
          <Kit name="cone" kit="cars" />
        </RigidBody>
      ))}
      {/* stapels dozen om doorheen te rijden */}
      {[
        [14, 22],
        [-12, 40],
        [36, -2],
        [-40, 10],
      ].map(([x, z]) => (
        <group key={`${x}${z}`}>
          <Cargo variant="box-large" position={[x, 0, z]} />
          <Cargo variant="box-large" position={[x + 2.4, 0, z]} />
          <Cargo variant="box-large" position={[x + 1.2, 1.15, z]} />
          <Cargo variant="box-small" position={[x + 1.2, 2.3, z]} />
        </group>
      ))}
    </>
  )
}
