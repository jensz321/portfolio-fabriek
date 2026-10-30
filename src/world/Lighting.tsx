import { useEffect, useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { playerPos } from './player'

// De zon volgt de heftruck: een kleine schaduwkaart rond de speler in plaats van één grote
// over de hele fabriek. Scherper én ~4× minder pixels om elk frame te tekenen.

const SUN_OFFSET = new THREE.Vector3(30, 50, 25)
const HALF = 36 // schaduwgebied van 72×72 m rond de speler, ruim wat de camera ziet
const MAP_SIZE = 2048

// Assen van de schaduwcamera, om de positie per texel in lichtruimte af te ronden.
const AXIS_F = SUN_OFFSET.clone().normalize()
const AXIS_R = new THREE.Vector3().crossVectors(THREE.Object3D.DEFAULT_UP, AXIS_F).normalize()
const AXIS_U = new THREE.Vector3().crossVectors(AXIS_F, AXIS_R).normalize()

export function Lighting() {
  const light = useRef<THREE.DirectionalLight>(null)
  const target = useMemo(() => new THREE.Object3D(), [])
  const snapped = useMemo(() => new THREE.Vector3(), [])
  const texel = (HALF * 2) / MAP_SIZE

  useEffect(() => {
    if (light.current) light.current.target = target
  }, [target])

  useFrame(() => {
    if (!light.current) return
    // Op hele texels (in lichtruimte) afronden voorkomt dat schaduwranden trillen terwijl je rijdt.
    const r = Math.round(playerPos.dot(AXIS_R) / texel) * texel
    const u = Math.round(playerPos.dot(AXIS_U) / texel) * texel
    snapped
      .copy(AXIS_R)
      .multiplyScalar(r)
      .addScaledVector(AXIS_U, u)
      .addScaledVector(AXIS_F, playerPos.dot(AXIS_F))
    target.position.copy(snapped)
    light.current.position.copy(snapped).add(SUN_OFFSET)
    target.updateMatrixWorld()
  })

  return (
    <>
      <hemisphereLight args={['#f4f0ff', '#9d97b5', 1.0]} />
      <primitive object={target} />
      <directionalLight
        ref={light}
        castShadow
        intensity={3.2}
        shadow-mapSize={[MAP_SIZE, MAP_SIZE]}
        shadow-camera-left={-HALF}
        shadow-camera-right={HALF}
        shadow-camera-top={HALF}
        shadow-camera-bottom={-HALF}
        shadow-camera-near={1}
        shadow-camera-far={140}
        shadow-bias={-0.0004}
        shadow-normalBias={0.03}
      />
    </>
  )
}
