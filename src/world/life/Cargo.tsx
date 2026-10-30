import { useCallback } from 'react'
import { CuboidCollider, RigidBody, type RapierRigidBody } from '@react-three/rapier'
import type { Vec3 } from '../../layout'
import { Kit, KIT_SCALE } from '../kit'

// Halve afmetingen van de kit-dozen (ongeschaald, origin onderaan).
const SIZES = {
  'box-small': [0.3, 0.275, 0.25],
  'box-large': [0.55, 0.275, 0.5],
  'box-long': [0.55, 0.275, 0.25],
  'box-wide': [0.3, 0.275, 0.5],
} as const

export type CargoVariant = keyof typeof SIZES

type Props = {
  variant?: CargoVariant
  position: Vec3
  rotation?: Vec3
  // Start uitgeschakeld (zwevend buiten beeld) tot een band hem in gebruik neemt.
  disabled?: boolean
  ref?: React.Ref<RapierRigidBody | null>
}

export function Cargo({ variant = 'box-small', position, rotation, disabled, ref }: Props) {
  const s = KIT_SCALE.factory
  const [hx, hy, hz] = SIZES[variant].map((v) => v * s)

  const setRef = useCallback(
    (rb: RapierRigidBody | null) => {
      if (rb && disabled) rb.setEnabled(false)
      if (typeof ref === 'function') ref(rb)
      else if (ref) (ref as React.RefObject<RapierRigidBody | null>).current = rb
    },
    [disabled, ref],
  )

  return (
    <RigidBody
      ref={setRef}
      position={position}
      rotation={rotation}
      colliders={false}
      linearDamping={0.4}
      angularDamping={0.6}
      friction={0.8}
      density={0.6}
    >
      <CuboidCollider args={[hx, hy, hz]} position={[0, hy, 0]} />
      <Kit name={variant} />
    </RigidBody>
  )
}
