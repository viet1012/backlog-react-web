import { useEffect, useMemo, useRef } from 'react'
import { useFrame, useThree, type ThreeEvent } from '@react-three/fiber'
import { Edges, RoundedBox } from '@react-three/drei'
import { MathUtils, type Group, type MeshStandardMaterial, type Texture } from 'three'

import { INK } from '../factoryScene/primitives'
import {
  cartonTexture,
  lockedFaceTexture,
  printedIconTexture,
  readyStickerTexture,
  roleTagTexture,
  STICKER_ASPECT,
  TAG_ASPECT,
  upcomingFaceTexture,
} from './labelTextures'
import type { CratePlacement } from './rackModel'

/*
 * Một thùng hàng 3D. Group ngoài giữ vị trí + hoạt ảnh (thả rơi, kéo ra khi chọn),
 * các mặt trang trí là plane dán sát mặt trước (polygonOffset để không nhấp nháy z-fighting).
 * frameloop="demand": chỉ xin vẽ tiếp (invalidate) khi còn đang chuyển động.
 */
export interface CrateTexts {
  title: string
  hint?: string
  action: string
  group: string
  status: string
  roles: string
}

// Phần chất lượng đồ hoạ thùng cần biết
export interface CrateQuality {
  // 0 = hộp vuông cạnh
  smoothness: number
  film: boolean
  outlines: boolean
  // LED nhấp nháy (chỉ khi canvas vẽ liên tục)
  ambient: boolean
}

interface Crate3DProps {
  placement: CratePlacement
  index: number
  texts: CrateTexts
  color: string
  icon: HTMLImageElement | undefined
  highlighted: boolean
  picked: boolean
  dark: boolean
  quality: CrateQuality
  // false: hiện ngay tại chỗ (vd. vừa đổi chất lượng), không thả rơi lại
  intro: boolean
  onHover: (index: number | null) => void
  onPick: (index: number) => void
}

type CrateTextures =
  | { kind: 'ready'; sticker: Texture; icon: Texture | null }
  | { kind: 'upcoming'; face: Texture }
  | { kind: 'locked'; face: Texture; tag: Texture }

const DROP_HEIGHT = 1.4
const DROP_SECONDS = 0.75
// Khoảng thùng nhô ra / nhích lên khi được chọn
const HOVER_PULL = 0.26
const HOVER_LIFT = 0.035

// Mesh hiển thị không nhận chuột; chỉ khối bắt chuột đứng yên nhận (tránh vào/ra liên tục ở mép khi thùng nhô ra)
const noRaycast = () => null

function sharpen(texture: Texture, anisotropy: number) {
  texture.anisotropy = anisotropy
  return texture
}
const CARTON = { light: '#c99660', dark: '#b3844f' }
const TOTE = { light: '#6f7d8c', dark: '#5a6674' }

function easeOutBounce(u: number) {
  const n = 7.5625
  const d = 2.75
  if (u < 1 / d) return n * u * u
  if (u < 2 / d) return n * (u -= 1.5 / d) * u + 0.75
  if (u < 2.5 / d) return n * (u -= 2.25 / d) * u + 0.9375
  return n * (u -= 2.625 / d) * u + 0.984375
}

function DecalPlane({ map, width, height, position, rotation = 0, roughness = 0.6 }: {
  map: Texture
  width: number
  height: number
  position: [number, number, number]
  rotation?: number
  roughness?: number
}) {
  return (
    <mesh position={position} rotation-z={rotation} raycast={noRaycast}>
      <planeGeometry args={[width, height]} />
      {/* Không tone mapping: giữ trắng giấy / chữ đen đúng độ tương phản */}
      <meshStandardMaterial map={map} transparent roughness={roughness} toneMapped={false} polygonOffset polygonOffsetFactor={-2} />
    </mesh>
  )
}

export function Crate3D({ placement, index, texts, color, icon, highlighted, picked, dark, quality, intro, onHover, onPick }: Crate3DProps) {
  const { kind, w, h, d } = placement
  const group = useRef<Group>(null)
  const led = useRef<MeshStandardMaterial>(null)
  const startRef = useRef<number | null>(null)
  const motion = useRef({ y: 0, z: 0, rx: 0 })
  const anisotropy = useThree((state) => state.gl.capabilities.getMaxAnisotropy())

  // Texture riêng của thùng; dựng lại khi đổi ngôn ngữ / icon tải xong
  const textures = useMemo((): CrateTextures => {
    if (kind === 'ready') {
      return {
        kind,
        sticker: sharpen(readyStickerTexture({ title: texts.title, hint: texts.hint, action: texts.action, group: texts.group, color }), anisotropy),
        icon: icon ? sharpen(printedIconTexture(icon, color), anisotropy) : null,
      }
    }
    if (kind === 'upcoming') return { kind, face: sharpen(upcomingFaceTexture(texts.title, texts.status), anisotropy) }
    return {
      kind,
      face: sharpen(lockedFaceTexture(texts.title, icon), anisotropy),
      tag: sharpen(roleTagTexture(texts.roles), anisotropy),
    }
  }, [kind, texts.title, texts.hint, texts.action, texts.group, texts.status, texts.roles, color, icon, anisotropy])

  useEffect(() => () => {
    if (textures.kind === 'ready') {
      textures.sticker.dispose()
      textures.icon?.dispose()
    } else {
      textures.face.dispose()
      if (textures.kind === 'locked') textures.tag.dispose()
    }
  }, [textures])

  useFrame((state, delta) => {
    const g = group.current
    if (!g) return
    const now = state.clock.elapsedTime
    // Không intro: coi như đã thả xong từ trước
    if (startRef.current === null) startRef.current = intro ? now : now - placement.delay - DROP_SECONDS - 1

    if (quality.ambient && led.current) {
      led.current.emissiveIntensity = 1.4 + 1.2 * Math.max(0, Math.sin(now * 2.6 + index * 1.7))
    }

    const u = (now - startRef.current - placement.delay) / DROP_SECONDS
    g.visible = u >= 0
    const dropY = u < 1 ? DROP_HEIGHT * (1 - easeOutBounce(MathUtils.clamp(u, 0, 1))) : 0

    const goalZ = picked ? 1.3 : highlighted ? HOVER_PULL : 0
    const goalY = picked ? 0.14 : highlighted ? HOVER_LIFT : 0
    const goalRx = picked ? -0.07 : 0
    const m = motion.current
    m.z = MathUtils.damp(m.z, goalZ, 9, delta)
    m.y = MathUtils.damp(m.y, goalY, 9, delta)
    m.rx = MathUtils.damp(m.rx, goalRx, 9, delta)

    g.position.set(placement.x, placement.y + dropY + m.y, placement.z + m.z)
    g.rotation.x = m.rx

    const settled = u >= 1 && Math.abs(m.z - goalZ) < 0.001 && Math.abs(m.y - goalY) < 0.001 && Math.abs(m.rx - goalRx) < 0.001
    if (!settled) state.invalidate()
  })

  function handleOver(event: ThreeEvent<PointerEvent>) {
    event.stopPropagation()
    onHover(index)
  }

  function handleClick(event: ThreeEvent<MouseEvent>) {
    event.stopPropagation()
    if (kind === 'ready') onPick(index)
  }

  const frontZ = d / 2 + 0.002
  const radius = Math.min(0.03, w * 0.035)
  const carton = kind !== 'locked'
  const bodyColor = carton ? CARTON[dark ? 'dark' : 'light'] : TOTE[dark ? 'dark' : 'light']

  const bodyMaterial = (
    <meshStandardMaterial
      color={bodyColor}
      map={carton ? cartonTexture() : null}
      roughness={carton ? 0.86 : 0.48}
      metalness={0}
      emissive={highlighted && kind === 'ready' ? '#3a2a10' : '#000000'}
    />
  )

  const stickerW = w * 0.84
  const stickerH = stickerW / STICKER_ASPECT
  const tagW = MathUtils.clamp(w * 0.4, 0.16, 0.26)

  return (
    <>
      {/* Khối bắt chuột vô hình, đứng yên, phủ cả vị trí nghỉ lẫn vị trí nhô ra */}
      <mesh
        position={[placement.x, placement.y + HOVER_LIFT / 2, placement.z + HOVER_PULL / 2]}
        onPointerOver={handleOver}
        onPointerOut={() => onHover(null)}
        onClick={handleClick}
      >
        <boxGeometry args={[w + 0.02, h + 0.02 + HOVER_LIFT, d + HOVER_PULL]} />
        <meshBasicMaterial visible={false} />
      </mesh>

      {/* Vị trí / hiện-ẩn do useFrame điều khiển (chạy trước mỗi lần vẽ) */}
      <group ref={group} visible={false}>
        {quality.smoothness > 0 ? (
          <RoundedBox args={[w, h, d]} radius={radius} smoothness={quality.smoothness} castShadow receiveShadow raycast={noRaycast}>
            {bodyMaterial}
          </RoundedBox>
        ) : (
          // Mức Thấp: hộp vuông cạnh + nét viền mực (giống phong cách truyện tranh của app)
          <mesh castShadow receiveShadow raycast={noRaycast}>
            <boxGeometry args={[w, h, d]} />
            {bodyMaterial}
            {quality.outlines && <Edges color={INK} threshold={20} />}
          </mesh>
        )}

        {carton && (
          <>
            {/* Băng keo trên nóc + vắt xuống mặt trước */}
            <mesh position={[0, h / 2 + 0.002, 0]} rotation-x={-Math.PI / 2} raycast={noRaycast}>
              <planeGeometry args={[w * 0.18, d + 0.004]} />
              <meshStandardMaterial color="#e9d5aa" roughness={0.28} polygonOffset polygonOffsetFactor={-2} />
            </mesh>
            <mesh position={[0, h / 2 - h * 0.11, frontZ]} raycast={noRaycast}>
              <planeGeometry args={[w * 0.18, h * 0.22]} />
              <meshStandardMaterial color="#e9d5aa" roughness={0.28} polygonOffset polygonOffsetFactor={-2} />
            </mesh>
          </>
        )}

        {textures.kind === 'ready' && (
          <>
            {textures.icon && (
              <DecalPlane map={textures.icon} width={h * 0.36} height={h * 0.36} position={[0, h * 0.1, frontZ + 0.0005]} roughness={0.9} />
            )}
            <DecalPlane map={textures.sticker} width={stickerW} height={stickerH} position={[0, -h / 2 + h * 0.08 + stickerH / 2, frontZ + 0.001]} roughness={0.5} />
            {/* Đèn LED xanh trên nhãn */}
            <mesh position={[stickerW / 2 - stickerH * 0.14, -h / 2 + h * 0.08 + stickerH * 0.12, frontZ + 0.006]} raycast={noRaycast}>
              <sphereGeometry args={[Math.max(0.008, w * 0.011), 12, 12]} />
              <meshStandardMaterial ref={led} color="#2ec46a" emissive="#3ee07a" emissiveIntensity={2.2} toneMapped={false} />
            </mesh>
          </>
        )}

        {textures.kind === 'upcoming' && (
          <>
            <DecalPlane map={textures.face} width={w * 0.98} height={h * 0.98} position={[0, 0, frontZ + 0.001]} roughness={0.75} />
            {/* Màng co bọc ngoài: chỉ phản chiếu môi trường, không đổ bóng */}
            {quality.film && (
              <RoundedBox args={[w + 0.022, h + 0.022, d + 0.022]} radius={radius + 0.01} smoothness={quality.smoothness} raycast={noRaycast}>
                <meshStandardMaterial color="#eef6ff" transparent opacity={0.16} roughness={0.06} metalness={0.1} depthWrite={false} envMapIntensity={2} />
              </RoundedBox>
            )}
          </>
        )}

        {textures.kind === 'locked' && (
          <>
            <DecalPlane map={textures.face} width={w * 0.98} height={h * 0.98} position={[0, 0, frontZ + 0.001]} roughness={0.55} />
            {/* Dây + thẻ đỏ treo góc */}
            <mesh position={[w / 2 - tagW * 0.55, h / 2 - 0.01, frontZ + 0.012]} rotation-z={0.5} raycast={noRaycast}>
              <cylinderGeometry args={[0.0025, 0.0025, 0.07, 6]} />
              <meshStandardMaterial color="#efe6d2" />
            </mesh>
            <DecalPlane
              map={textures.tag}
              width={tagW}
              height={tagW / TAG_ASPECT}
              position={[w / 2 - tagW * 0.2, h / 2 - 0.04 - tagW / TAG_ASPECT / 2, frontZ + 0.02]}
              rotation={-0.16}
              roughness={0.45}
            />
          </>
        )}
      </group>
    </>
  )
}
