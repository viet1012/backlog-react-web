import { useEffect, useMemo } from 'react'
import { useThree } from '@react-three/fiber'
import { Edges } from '@react-three/drei'
import { DoubleSide } from 'three'

import { useI18n } from '../../../i18n/useI18n'
import { INK } from '../factoryScene/primitives'
import { FitText } from './FitText'
import {
  deckTexture,
  meshAlphaTexture,
  PLATE_ASPECT,
  PLATE_LAYOUT,
  tierPlateTexture,
  uprightTexture,
} from './labelTextures'
import { RACK, type RackLayout, type TierLayout } from './rackModel'

/*
 * Khung kệ: 4 trụ đột lỗ + giằng chéo 2 hông, mỗi tầng 2 dầm (trước/sau) + tấm sàn,
 * nhãn vị trí trên dầm trước, tầng "cần quyền" có lồng lưới + ổ khoá.
 */
const UPRIGHT_COLOR = '#2a67a8'
const BEAM_COLOR = '#f07a22'
// Không để quá mảnh: dưới ~2px trên màn hình sẽ lấp lánh răng cưa khi camera lệch theo chuột
const BRACE_RADIUS = 0.017
// Bước lỗ đột trên trụ (m)
const SLOT_PITCH = 0.065
const PLATE_HEIGHT = 0.13
/*
 * Chống z-fighting (2 mặt trùng nhau -> nhấp nháy khi camera lệch theo chuột):
 * - dầm nhô khỏi mặt trụ BEAM_PROUD (như dầm bắt bát vào mặt trụ)
 * - mép dầm cao hơn mặt sàn BEAM_LIP (như dầm có gờ đỡ tấm sàn)
 */
const BEAM_PROUD = 0.006
const BEAM_LIP = 0.004

const halfW = RACK.width / 2
const frontZ = -RACK.post / 2
const backZ = -RACK.depth + RACK.post / 2
const BEAM_Z = [-RACK.beamDepth / 2 + BEAM_PROUD, -RACK.depth + RACK.beamDepth / 2 - BEAM_PROUD]

// Tâm dầm của tầng có mặt sàn ở deckY
const beamCenterY = (deckY: number) => deckY + BEAM_LIP - RACK.beam / 2

interface BraceSegment {
  position: [number, number, number]
  rotationX: number
  length: number
}

// Giằng zigzag giữa trụ trước và trụ sau ở hông x
function braceSegments(height: number): BraceSegment[] {
  const segments: BraceSegment[] = []
  const bottom = 0.14
  const top = height - 0.12
  const steps = Math.max(2, Math.round((top - bottom) / 0.55))
  const step = (top - bottom) / steps
  const dz = backZ - frontZ

  for (let i = 0; i <= steps; i++) {
    const y = bottom + i * step
    // Thanh ngang
    segments.push({ position: [0, y, (frontZ + backZ) / 2], rotationX: Math.PI / 2, length: Math.abs(dz) })
    if (i < steps) {
      // Thanh chéo, đổi hướng mỗi bước
      const dy = step
      const signedDz = i % 2 === 0 ? dz : -dz
      segments.push({
        position: [0, y + dy / 2, (frontZ + backZ) / 2],
        rotationX: Math.atan2(signedDz, dy),
        length: Math.hypot(dy, dz),
      })
    }
  }
  return segments
}

function TierPlate({ tier, label }: { tier: TierLayout; label: string }) {
  const anisotropy = useThree((state) => state.gl.capabilities.getMaxAnisotropy())
  const texture = useMemo(() => {
    const plate = tierPlateTexture()
    plate.anisotropy = anisotropy
    return plate
  }, [anisotropy])
  useEffect(() => () => texture.dispose(), [texture])

  const width = PLATE_HEIGHT * PLATE_ASPECT
  const at = (fraction: number) => -width / 2 + width * fraction
  const textZ = 0.002

  return (
    <group position={[-halfW + RACK.post + 0.14 + width / 2, beamCenterY(tier.deckY), BEAM_PROUD + 0.003]}>
      <mesh>
        <planeGeometry args={[width, PLATE_HEIGHT]} />
        <meshStandardMaterial map={texture} roughness={0.55} toneMapped={false} polygonOffset polygonOffsetFactor={-2} />
      </mesh>
      <FitText position={[at(PLATE_LAYOUT.codeLeft), 0, textZ]} anchorX="left" fontSize={PLATE_HEIGHT * 0.5} letterSpacing={0.02} color={INK}>
        {tier.spec.code}
      </FitText>
      <FitText
        position={[at(PLATE_LAYOUT.labelLeft), 0, textZ]}
        anchorX="left"
        fontSize={PLATE_HEIGHT * 0.42}
        letterSpacing={0.04}
        whiteSpace="nowrap"
        fitWidth={width * (PLATE_LAYOUT.countRight - PLATE_LAYOUT.labelLeft - 0.07)}
        color={INK}
      >
        {label.toUpperCase()}
      </FitText>
      <FitText position={[at(PLATE_LAYOUT.countRight), 0, textZ]} anchorX="right" fontSize={PLATE_HEIGHT * 0.5} color="#ef7424">
        {String(tier.count)}
      </FitText>
    </group>
  )
}

function Cage({ tier }: { tier: TierLayout }) {
  const width = RACK.width - RACK.post
  const height = tier.topY - tier.deckY - 0.03
  const alpha = useMemo(() => {
    const texture = meshAlphaTexture()
    texture.repeat.set(width / 0.12, height / 0.12)
    return texture
  }, [width, height])
  const centerY = tier.deckY + height / 2
  const z = 0.05

  return (
    // raycast tắt: chuột xuyên qua lưới tới thùng phía sau
    <group>
      <mesh position={[0, centerY, z]} raycast={() => null}>
        <planeGeometry args={[width, height]} />
        {/* alphaToCoverage (dùng MSAA) thay alphaTest: sợi thép mịn, không "bò" răng cưa khi camera di chuyển */}
        <meshStandardMaterial color="#a3adb8" metalness={0.75} roughness={0.35} alphaMap={alpha} alphaToCoverage side={DoubleSide} />
      </mesh>
      {/* Khung ống viền lồng */}
      {[
        { p: [0, tier.topY - 0.03, z], s: [width, 0.025, 0.025] },
        { p: [-width / 2, centerY, z], s: [0.025, height, 0.025] },
        { p: [width / 2, centerY, z], s: [0.025, height, 0.025] },
        { p: [0, centerY, z], s: [0.02, height, 0.02] },
      ].map(({ p, s }, i) => (
        <mesh key={i} position={p as [number, number, number]} castShadow raycast={() => null}>
          <boxGeometry args={s as [number, number, number]} />
          <meshStandardMaterial color="#8e99a5" metalness={0.8} roughness={0.3} />
        </mesh>
      ))}
      {/* Ổ khoá treo giữa */}
      <group position={[0, tier.topY - 0.13, z + 0.03]}>
        <mesh castShadow>
          <boxGeometry args={[0.1, 0.085, 0.035]} />
          <meshStandardMaterial color="#c9a227" metalness={0.85} roughness={0.28} />
        </mesh>
        <mesh position={[0, 0.045, 0]}>
          <torusGeometry args={[0.032, 0.008, 10, 20, Math.PI]} />
          <meshStandardMaterial color="#cfd6de" metalness={0.9} roughness={0.2} />
        </mesh>
        <mesh position={[0, -0.005, 0.018]}>
          <circleGeometry args={[0.011, 16]} />
          <meshStandardMaterial color="#3b2f0a" />
        </mesh>
      </group>
    </group>
  )
}

interface Rack3DProps {
  layout: RackLayout
  // Mức Thấp: nét viền mực thay cho bóng đổ để khối vẫn rõ ràng
  outlines: boolean
}

export function Rack3D({ layout, outlines }: Rack3DProps) {
  const edges = outlines ? <Edges color={INK} threshold={20} /> : null
  const { t } = useI18n()
  const height = layout.height
  const braces = useMemo(() => braceSegments(height), [height])
  const anisotropy = useThree((state) => state.gl.capabilities.getMaxAnisotropy())

  // Lỗ đột / rãnh sàn là hoạ tiết dày: cần lọc anisotropic tối đa để không gợn moiré khi camera lệch
  const uprightMap = useMemo(() => {
    const texture = uprightTexture()
    texture.repeat.set(1, height / SLOT_PITCH)
    texture.anisotropy = anisotropy
    return texture
  }, [height, anisotropy])

  const deckMap = useMemo(() => {
    const texture = deckTexture()
    texture.repeat.set((RACK.width - RACK.post) / 0.3, (RACK.depth - 0.06) / 0.3)
    texture.anisotropy = anisotropy
    return texture
  }, [anisotropy])

  const tierLabel = {
    locked: t.userHome.tierLocked,
    ready: t.userHome.tierReady,
    upcoming: t.userHome.tierUpcoming,
  }

  return (
    <group>
      {/* Trụ + đế */}
      {[-halfW, halfW].flatMap((x) => [frontZ, backZ].map((z) => (
        <group key={`${x}:${z}`} position={[x, 0, z]}>
          <mesh position={[0, height / 2, 0]} castShadow receiveShadow>
            <boxGeometry args={[RACK.post, height, RACK.post]} />
            <meshStandardMaterial color={UPRIGHT_COLOR} map={uprightMap} metalness={0.45} roughness={0.38} />
            {edges}
          </mesh>
          <mesh position={[0, 0.006, 0]} receiveShadow>
            <boxGeometry args={[0.16, 0.012, 0.16]} />
            <meshStandardMaterial color="#59636f" metalness={0.6} roughness={0.45} />
          </mesh>
        </group>
      )))}

      {/* Giằng hông */}
      {[-halfW, halfW].map((x) => (
        <group key={x} position={[x, 0, 0]}>
          {braces.map((segment, i) => (
            <mesh key={i} position={segment.position} rotation-x={segment.rotationX} castShadow>
              <cylinderGeometry args={[BRACE_RADIUS, BRACE_RADIUS, segment.length, 8]} />
              <meshStandardMaterial color={UPRIGHT_COLOR} metalness={0.45} roughness={0.4} />
            </mesh>
          ))}
        </group>
      ))}

      {layout.tiers.map((tier) => (
        <group key={tier.spec.code}>
          {/* Dầm trước / sau */}
          {BEAM_Z.map((z) => (
            <mesh key={z} position={[0, beamCenterY(tier.deckY), z]} castShadow receiveShadow>
              <boxGeometry args={[RACK.width, RACK.beam, RACK.beamDepth]} />
              <meshStandardMaterial color={BEAM_COLOR} metalness={0.3} roughness={0.42} />
              {edges}
            </mesh>
          ))}
          {/* Tấm sàn */}
          <mesh position={[0, tier.deckY - RACK.deck / 2, -RACK.depth / 2]} receiveShadow>
            <boxGeometry args={[RACK.width - RACK.post, RACK.deck, RACK.depth - 0.06]} />
            <meshStandardMaterial color="#b9c2cc" map={deckMap} metalness={0.55} roughness={0.5} />
            {edges}
          </mesh>
          <TierPlate tier={tier} label={tierLabel[tier.spec.kind]} />
          {tier.spec.kind === 'locked' && tier.count > 0 && <Cage tier={tier} />}
        </group>
      ))}

      {/* Dầm đỉnh kệ */}
      {BEAM_Z.map((z) => (
        <mesh key={z} position={[0, height - 0.08, z]} castShadow>
          <boxGeometry args={[RACK.width, 0.08, RACK.beamDepth]} />
          <meshStandardMaterial color={BEAM_COLOR} metalness={0.3} roughness={0.42} />
          {edges}
        </mesh>
      ))}
    </group>
  )
}
