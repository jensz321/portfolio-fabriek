import { useEffect, useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { CylinderCollider, RigidBody } from '@react-three/rapier'
import * as THREE from 'three'
import type { Vec3 } from '../../layout'
import { KIT_SCALE, useKitModel } from '../kit'

// Een houding van de arm: draaivoet, schouder, elleboog, pols, klauw (0 = open, 1 = dicht).
type Pose = { yaw: number; shoulder: number; elbow: number; wrist: number; claw: number }
type Key = [t: number, pose: Pose, event?: 'grab' | 'release']

const UP: Omit<Pose, 'yaw' | 'claw'> = { shoulder: 0.15, elbow: 0.5, wrist: 0.6 }
const DOWN: Omit<Pose, 'yaw' | 'claw'> = { shoulder: 0.75, elbow: 1.05, wrist: 0.95 }

function cycle(pick: number, place: number): Key[] {
  return [
    [0.0, { yaw: pick, ...UP, claw: 0 }],
    [0.12, { yaw: pick, ...DOWN, claw: 0 }],
    [0.2, { yaw: pick, ...DOWN, claw: 1 }, 'grab'],
    [0.32, { yaw: pick, ...UP, claw: 1 }],
    [0.55, { yaw: place, ...UP, claw: 1 }],
    [0.67, { yaw: place, ...DOWN, claw: 1 }],
    [0.75, { yaw: place, ...DOWN, claw: 0 }, 'release'],
    [0.87, { yaw: place, ...UP, claw: 0 }],
    [1.0, { yaw: pick, ...UP, claw: 0 }],
  ]
}

const smooth = (t: number) => t * t * (3 - 2 * t)

type Props = {
  position: Vec3
  pick: number // hoek (rad) waar hij oppakt
  place: number // hoek (rad) waar hij neerzet
  period?: number
  offset?: number // fase, zodat niet alle armen synchroon lopen
  onRelease?: (worldPos: THREE.Vector3) => void
}

export function RobotArm({ position, pick, place, period = 7, offset = 0, onRelease }: Props) {
  const { object } = useKitModel('robot-arm-a')
  const keys = useMemo(() => cycle(pick, place), [pick, place])
  const lastT = useRef(-1)

  const joints = useMemo(
    () => ({
      base: object.getObjectByName('element-a')!,
      shoulder: object.getObjectByName('element-b')!,
      elbow: object.getObjectByName('element-d')!,
      wrist: object.getObjectByName('element-f')!,
      clawA: object.getObjectByName('claw-a')!,
      clawB: object.getObjectByName('claw-b')!,
    }),
    [object],
  )
  const clawRest = useMemo(() => [joints.clawA.position.x, joints.clawB.position.x], [joints])

  // De doos die de arm vasthoudt hangt aan de pols en is alleen zichtbaar tijdens het dragen.
  const { object: held } = useKitModel('box-small')
  useMemo(() => {
    held.position.set(0, 0.5, 0)
    held.visible = false
  }, [held])
  useEffect(() => {
    joints.wrist.add(held)
    return () => {
      joints.wrist.remove(held)
    }
  }, [joints, held])

  const pose: Pose = { yaw: 0, shoulder: 0, elbow: 0, wrist: 0, claw: 0 }
  const tmp = useMemo(() => new THREE.Vector3(), [])

  useFrame(({ clock }) => {
    const t = (clock.elapsedTime / period + offset) % 1
    let i = 0
    while (i < keys.length - 2 && keys[i + 1][0] <= t) i++
    const [t0, a] = keys[i]
    const [t1, b] = keys[i + 1]
    const k = smooth(THREE.MathUtils.clamp((t - t0) / (t1 - t0), 0, 1))
    for (const p of Object.keys(pose) as (keyof Pose)[]) pose[p] = THREE.MathUtils.lerp(a[p], b[p], k)

    joints.base.rotation.y = pose.yaw
    joints.shoulder.rotation.x = pose.shoulder
    joints.elbow.rotation.x = pose.elbow
    joints.wrist.rotation.x = pose.wrist
    joints.clawA.position.x = clawRest[0] - pose.claw * 0.06
    joints.clawB.position.x = clawRest[1] + pose.claw * 0.06

    // Gebeurtenissen precies één keer afvuren als we het sleutelmoment passeren.
    const crossed = (key: number) => lastT.current < key && t >= key
    for (const [kt, , ev] of keys) {
      if (!ev || !crossed(kt)) continue
      if (ev === 'grab') held.visible = true
      if (ev === 'release') {
        held.visible = false
        onRelease?.(held.getWorldPosition(tmp).clone())
      }
    }
    lastT.current = t
  })

  return (
    <group position={position}>
      <RigidBody type="fixed" colliders={false}>
        <CylinderCollider args={[0.6, 0.9]} position={[0, 0.6, 0]} />
      </RigidBody>
      <primitive object={object} scale={KIT_SCALE.factory} />
    </group>
  )
}
