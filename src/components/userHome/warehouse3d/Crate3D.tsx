import { useEffect, useMemo, useRef } from 'react'
import { useFrame, useThree, type ThreeEvent } from '@react-three/fiber'
import { Edges, RoundedBox } from '@react-three/drei'
import { MathUtils, type Group, type MeshStandardMaterial, type Texture } from 'three'

import { INK } from '../factoryScene/primitives'
import { FitText } from './FitText'
import { FONT } from './fonts'
import {
  cartonTexture,
  LOCKED_LAYOUT,
  lockedFaceTexture,
  printedIconTexture,
  readyStickerTexture,
  roleTagTexture,
  STICKER_ASPECT,
  STICKER_LAYOUT,
  TAG_ASPECT,
  TAG_LAYOUT,
  UPCOMING_LAYOUT,
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
  // Chỉ hiện ở tooltip khi rê chuột (trên nhãn dán quá nhỏ để đọc)
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
// Thời gian "trượt" tới vị trí (giây): rê chuột / bấm chọn
const HOVER_SMOOTH = 0.11
const PICK_SMOOTH = 0.16
// frameloop="demand": frame đầu sau lúc đứng yên có delta = cả khoảng nghỉ -> chặn lại để thùng không nhảy cóc
const MAX_DELTA = 1 / 30

interface Axis {
  value: number
  velocity: number
}

// Lò xo giảm chấn tới hạn (smooth damp): tăng tốc rồi hãm êm, giữ vận tốc khi đổi đích giữa chừng
function stepAxis(axis: Axis, target: number, smoothTime: number, dt: number) {
  const omega = 2 / smoothTime
  const x = omega * dt
  const decay = 1 / (1 + x + 0.48 * x * x + 0.235 * x * x * x)
  const change = axis.value - target
  const temp = (axis.velocity + omega * change) * dt
  axis.velocity = (axis.velocity - omega * temp) * decay
  axis.value = target + (change + temp) * decay
  return Math.abs(axis.value - target) < 0.0005 && Math.abs(axis.velocity) < 0.005
}

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
  const motion = useRef<Record<'y' | 'z' | 'rx', Axis>>({
    y: { value: 0, velocity: 0 },
    z: { value: 0, velocity: 0 },
    rx: { value: 0, velocity: 0 },
  })
  const anisotropy = useThree((state) => state.gl.capabilities.getMaxAnisotropy())

  // Texture riêng của thùng (chỉ phần hình, chữ là SDF); dựng lại khi icon tải xong
  const textures = useMemo((): CrateTextures => {
    if (kind === 'ready') {
      return {
        kind,
        sticker: sharpen(readyStickerTexture(color), anisotropy),
        icon: icon ? sharpen(printedIconTexture(icon, color), anisotropy) : null,
      }
    }
    if (kind === 'upcoming') return { kind, face: sharpen(upcomingFaceTexture(), anisotropy) }
    return {
      kind,
      face: sharpen(lockedFaceTexture(icon), anisotropy),
      tag: sharpen(roleTagTexture(), anisotropy),
    }
  }, [kind, color, icon, anisotropy])

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

    const dt = Math.min(delta, MAX_DELTA)
    const smooth = picked ? PICK_SMOOTH : HOVER_SMOOTH
    const m = motion.current
    // Gọi đủ cả 3 trục (không dùng && để khỏi bỏ qua trục sau)
    const zDone = stepAxis(m.z, picked ? 1.3 : highlighted ? HOVER_PULL : 0, smooth, dt)
    const yDone = stepAxis(m.y, picked ? 0.14 : highlighted ? HOVER_LIFT : 0, smooth, dt)
    const rxDone = stepAxis(m.rx, picked ? -0.07 : 0, smooth, dt)

    g.position.set(placement.x, placement.y + dropY + m.y.value, placement.z + m.z.value)
    g.rotation.x = m.rx.value

    if (u < 1 || !zDone || !yDone || !rxDone) {
      // Bóng đổ chỉ vẽ lại khi hàng di chuyển (camera lệch theo chuột thì không cần)
      state.gl.shadowMap.needsUpdate = true
      state.invalidate()
    }
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

  // Nhãn dán chiếm nửa dưới mặt trước; toạ độ chữ tính theo STICKER_LAYOUT (tỉ lệ từ mép trái / mép trên)
  const stickerW = w * 0.9
  const stickerH = stickerW / STICKER_ASPECT
  const stickerY = -h / 2 + h * 0.07 + stickerH / 2
  const stickerX = (fraction: number) => -stickerW / 2 + stickerW * fraction
  const stickerRow = (fromTop: number) => stickerH / 2 - stickerH * fromTop
  const ledRadius = stickerH * 0.045
  const iconSize = h * 0.26
  const iconY = stickerY + stickerH / 2 + h * 0.03 + iconSize / 2
  // Mặt in kín (thùng sắp ra mắt / cần quyền)
  const faceW = w * 0.98
  const faceH = h * 0.98
  const faceRow = (fromTop: number) => faceH / 2 - faceH * fromTop
  const tagW = MathUtils.clamp(w * 0.4, 0.16, 0.26)
  const tagH = tagW / TAG_ASPECT
  const textZ = 0.002

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
            <mesh position={[0, h / 2 - h * 0.06, frontZ]} raycast={noRaycast}>
              <planeGeometry args={[w * 0.18, h * 0.12]} />
              <meshStandardMaterial color="#e9d5aa" roughness={0.28} polygonOffset polygonOffsetFactor={-2} />
            </mesh>
          </>
        )}

        {textures.kind === 'ready' && (
          <>
            {textures.icon && (
              <DecalPlane map={textures.icon} width={iconSize} height={iconSize} position={[0, iconY, frontZ + 0.0005]} roughness={0.9} />
            )}
            <group position={[0, stickerY, frontZ + 0.001]}>
              <DecalPlane map={textures.sticker} width={stickerW} height={stickerH} position={[0, 0, 0]} roughness={0.5} />
              {/* Tên trang: tối đa 2 dòng, dài quá thì thu nhỏ */}
              <FitText
                position={[stickerX(STICKER_LAYOUT.left), stickerRow((STICKER_LAYOUT.titleTop + STICKER_LAYOUT.titleBottom) / 2), textZ]}
                anchorX="left"
                fontSize={stickerH * 0.25}
                minFontSize={stickerH * 0.15}
                lineHeight={1.08}
                maxWidth={stickerW * (STICKER_LAYOUT.right - STICKER_LAYOUT.left)}
                overflowWrap="break-word"
                fitHeight={stickerH * (STICKER_LAYOUT.titleBottom - STICKER_LAYOUT.titleTop)}
                color="#1d2733"
              >
                {texts.title}
              </FitText>
              <FitText
                position={[stickerX(STICKER_LAYOUT.left), stickerRow((STICKER_LAYOUT.divider + 1) / 2), textZ]}
                anchorX="left"
                fontSize={stickerH * 0.15}
                letterSpacing={0.04}
                whiteSpace="nowrap"
                fitWidth={stickerW * 0.55}
                color={color}
              >
                {texts.group.toUpperCase()}
              </FitText>
              <FitText
                position={[stickerX(STICKER_LAYOUT.right) - ledRadius * 2 - stickerH * 0.05, stickerRow((STICKER_LAYOUT.divider + 1) / 2), textZ]}
                anchorX="right"
                fontSize={stickerH * 0.14}
                letterSpacing={0.05}
                whiteSpace="nowrap"
                color="#5b6774"
              >
                {texts.action}
              </FitText>
              {/* Đèn LED xanh cạnh chữ hành động */}
              <mesh position={[stickerX(STICKER_LAYOUT.right) - ledRadius, stickerRow((STICKER_LAYOUT.divider + 1) / 2), 0.005]} raycast={noRaycast}>
                <sphereGeometry args={[ledRadius, 12, 12]} />
                <meshStandardMaterial ref={led} color="#2ec46a" emissive="#3ee07a" emissiveIntensity={2.2} toneMapped={false} />
              </mesh>
            </group>
          </>
        )}

        {textures.kind === 'upcoming' && (
          <>
            <group position={[0, 0, frontZ + 0.001]}>
              <DecalPlane map={textures.face} width={faceW} height={faceH} position={[0, 0, 0]} roughness={0.75} />
              {/* Tên viết tay hơi nghiêng */}
              <FitText
                position={[0, faceRow(UPCOMING_LAYOUT.titleY), textZ]}
                rotation-z={UPCOMING_LAYOUT.titleTilt}
                font={FONT.medium}
                textAlign="center"
                fontSize={h * 0.15}
                minFontSize={h * 0.09}
                lineHeight={1.05}
                maxWidth={faceW * 0.86}
                overflowWrap="break-word"
                fitHeight={faceH * 0.4}
                color="#3a2210"
                fillOpacity={0.9}
              >
                {texts.title}
              </FitText>
              {/* Trạng thái in trên băng keo vàng */}
              <FitText
                position={[0, faceRow(UPCOMING_LAYOUT.tapeY), textZ]}
                rotation-z={UPCOMING_LAYOUT.tapeTilt}
                fontSize={faceH * UPCOMING_LAYOUT.tapeHeight * 0.5}
                letterSpacing={0.08}
                whiteSpace="nowrap"
                fitWidth={faceW * 0.86}
                color={INK}
              >
                {texts.status.toUpperCase()}
              </FitText>
            </group>
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
            <group position={[0, 0, frontZ + 0.001]}>
              <DecalPlane map={textures.face} width={faceW} height={faceH} position={[0, 0, 0]} roughness={0.55} />
              <FitText
                position={[0, faceRow(LOCKED_LAYOUT.titleY), textZ]}
                textAlign="center"
                fontSize={h * 0.1}
                minFontSize={h * 0.065}
                lineHeight={1.05}
                maxWidth={faceW * LOCKED_LAYOUT.titleWidth}
                overflowWrap="break-word"
                fitHeight={faceH * LOCKED_LAYOUT.titleHeight}
                color="#3d4753"
              >
                {texts.title}
              </FitText>
            </group>
            {/* Dây + thẻ đỏ treo góc */}
            <mesh position={[w / 2 - tagW * 0.55, h / 2 - 0.01, frontZ + 0.012]} rotation-z={0.5} raycast={noRaycast}>
              <cylinderGeometry args={[0.0025, 0.0025, 0.07, 6]} />
              <meshStandardMaterial color="#efe6d2" />
            </mesh>
            <group position={[w / 2 - tagW * 0.2, h / 2 - 0.04 - tagH / 2, frontZ + 0.02]} rotation-z={-0.16}>
              <DecalPlane map={textures.tag} width={tagW} height={tagH} position={[0, 0, 0]} roughness={0.45} />
              <FitText
                position={[-tagW / 2 + tagW * TAG_LAYOUT.textLeft, 0, textZ]}
                anchorX="left"
                fontSize={tagH * 0.36}
                whiteSpace="nowrap"
                fitWidth={tagW * (TAG_LAYOUT.textRight - TAG_LAYOUT.textLeft)}
                minFontSize={tagH * 0.2}
                color="#ffffff"
              >
                {texts.roles}
              </FitText>
            </group>
          </>
        )}
      </group>
    </>
  )
}
