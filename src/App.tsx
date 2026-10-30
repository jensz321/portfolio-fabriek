import { Suspense } from 'react'
import { Canvas } from '@react-three/fiber'
import { KeyboardControls, type KeyboardControlsEntry } from '@react-three/drei'
import { Physics } from '@react-three/rapier'
import { Forklift, type Controls } from './world/Forklift'
import { Factory } from './world/Factory'
import { Lighting } from './world/Lighting'
import { PerfProbe } from './world/PerfProbe'
import { palette } from './layout'
import { Hud } from './ui/Hud'
import { Panel } from './ui/Panel'
import { Joystick } from './ui/Joystick'

const keyMap: KeyboardControlsEntry<Controls>[] = [
  { name: 'forward', keys: ['ArrowUp', 'KeyW'] },
  { name: 'back', keys: ['ArrowDown', 'KeyS'] },
  { name: 'left', keys: ['ArrowLeft', 'KeyA'] },
  { name: 'right', keys: ['ArrowRight', 'KeyD'] },
  { name: 'reset', keys: ['KeyR'] },
]

const debug = new URLSearchParams(location.search).has('debug')

// Resolutie begrensd op 1,5×: op retina nog scherp, maar ~44% minder pixels dan 2×.
// Gemeten op een retina-Mac was de pixelvulling (niet physics of objecten) de bottleneck.
const DPR: [number, number] = [1, 1.5]

export default function App() {
  return (
    <KeyboardControls map={keyMap}>
      <Canvas shadows camera={{ fov: 40, position: [14, 20, 70], near: 0.5, far: 300 }} dpr={DPR}>
        <PerfProbe />
        <color attach="background" args={[palette.sky]} />
        <fog attach="fog" args={[palette.sky, 75, 170]} />
        <Suspense fallback={null}>
          <Physics gravity={[0, -20, 0]} debug={debug}>
            <Factory />
            <Forklift />
          </Physics>
          <Lighting />
        </Suspense>
      </Canvas>
      <Hud />
      <Panel />
      <Joystick />
    </KeyboardControls>
  )
}
