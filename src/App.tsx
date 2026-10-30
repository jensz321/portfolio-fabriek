import { Suspense } from 'react'
import { Canvas } from '@react-three/fiber'
import { KeyboardControls, type KeyboardControlsEntry } from '@react-three/drei'
import { Physics } from '@react-three/rapier'
import { Forklift, type Controls } from './world/Forklift'
import { Factory } from './world/Factory'
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

export default function App() {
  return (
    <KeyboardControls map={keyMap}>
      <Canvas shadows camera={{ fov: 40, position: [14, 20, 70], near: 0.5, far: 300 }} dpr={[1, 2]}>
        <color attach="background" args={[palette.sky]} />
        <fog attach="fog" args={[palette.sky, 75, 170]} />
        <hemisphereLight args={['#f4f0ff', '#9d97b5', 1.0]} />
        <directionalLight
          castShadow
          position={[30, 50, 25]}
          intensity={3.2}
          shadow-mapSize={[4096, 4096]}
          shadow-camera-left={-70}
          shadow-camera-right={70}
          shadow-camera-top={70}
          shadow-camera-bottom={-70}
          shadow-camera-far={150}
          shadow-bias={-0.0005}
        />
        <Suspense fallback={null}>
          <Physics gravity={[0, -20, 0]} debug={debug}>
            <Factory />
            <Forklift />
          </Physics>
        </Suspense>
      </Canvas>
      <Hud />
      <Panel />
      <Joystick />
    </KeyboardControls>
  )
}
