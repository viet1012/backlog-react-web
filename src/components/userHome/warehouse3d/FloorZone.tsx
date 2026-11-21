import { useEffect, useMemo } from 'react'

import { hazardTexture } from './labelTextures'
import { RACK } from './rackModel'

/*
 * "Chỗ đứng" của kệ trên sàn xưởng (để kệ không trông như dán đè lên nền):
 * - khung vạch vàng dán sàn bao quanh chân kệ (vùng để hàng, như kho thật)
 * - ốp bảo vệ chân 2 trụ trước, sọc vàng đen (chống xe nâng va quệt)
 * Mặt sàn để trong suốt: sàn thật là nền CSS phía sau; ContactShadows đổ bóng lên đây.
 */
const TAPE_WIDTH = 0.08
const TAPE_Y = 0.004
const MARGIN_X = 0.38
const MARGIN_FRONT = 0.45
const MARGIN_BACK = 0.25
const TAPE_COLOR = '#f0bf1a'

const GUARD = { size: 0.15, height: 0.4 }

const halfW = RACK.width / 2
const frontZ = -RACK.post / 2

export function FloorZone() {
  const xMin = -halfW - MARGIN_X
  const xMax = halfW + MARGIN_X
  const zFront = MARGIN_FRONT
  const zBack = -RACK.depth - MARGIN_BACK
  const width = xMax - xMin
  const depth = zFront - zBack

  // [tâm x, tâm z, dài x, dài z]
  const strips: Array<[number, number, number, number]> = [
    [0, zFront, width, TAPE_WIDTH],
    [0, zBack, width, TAPE_WIDTH],
    [xMin, (zFront + zBack) / 2, TAPE_WIDTH, depth],
    [xMax, (zFront + zBack) / 2, TAPE_WIDTH, depth],
  ]

  const guardMap = useMemo(() => {
    const texture = hazardTexture().clone()
    texture.repeat.set(1.5, 3)
    texture.needsUpdate = true
    return texture
  }, [])
  useEffect(() => () => guardMap.dispose(), [guardMap])

  return (
    <group>
      {strips.map(([x, z, sx, sz]) => (
        <mesh key={`${x}:${z}`} position={[x, TAPE_Y, z]} rotation-x={-Math.PI / 2} receiveShadow>
          <planeGeometry args={[sx, sz]} />
          <meshStandardMaterial color={TAPE_COLOR} roughness={0.55} polygonOffset polygonOffsetFactor={-2} />
        </mesh>
      ))}

      {[-halfW, halfW].map((x) => (
        <mesh key={x} position={[x, GUARD.height / 2, frontZ]} castShadow receiveShadow>
          <boxGeometry args={[GUARD.size, GUARD.height, GUARD.size]} />
          <meshStandardMaterial map={guardMap} roughness={0.5} metalness={0.1} />
        </mesh>
      ))}
    </group>
  )
}
