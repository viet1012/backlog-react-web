import { useEffect, useMemo, useRef, useState, type CSSProperties } from 'react'
import { useNavigate } from 'react-router-dom'

import { Box } from '@mui/material'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { ContactShadows, Environment, Html, Lightformer, Sparkles } from '@react-three/drei'
import { MathUtils, Object3D, Vector3, type PerspectiveCamera, type SpotLight } from 'three'

import { useI18n } from '../../../i18n/useI18n'
import { getGroupColor } from '../../layout/sidebarConfig'
import type { RenderSize } from '../graphics/GraphicsQualityButton'
import { graphicsDpr, type GraphicsProfile } from '../graphics/graphicsQuality'
import type { HomeMenu } from '../userHomeMenu'
import { Crate3D, type CrateQuality, type CrateTexts } from './Crate3D'
import { Rack3D } from './Rack3D'
import { buildRackLayout, RACK, type CratePlacement, type RackLayout } from './rackModel'
import { useIconImages } from './useIconImages'

/*
 * Kệ hàng WebGL (three.js). Canvas trong suốt đặt trên nền xưởng CSS.
 * Mọi thông số nặng/nhẹ lấy từ GraphicsProfile (Thấp / Vừa / Cao / Tối đa); đổi mức thì dựng lại Canvas.
 * Thấp..Cao: frameloop="demand" (đứng yên thì không vẽ). Tối đa: vẽ liên tục cho hiệu ứng sống động.
 * Không dùng PerformanceMonitor: ở chế độ demand khoảng nghỉ giữa các frame bị tính là FPS thấp.
 * Được lazy-load: three.js chỉ tải khi vào trang chủ.
 */
const FOV = 32
const PICK_MS = 450
const PARALLAX = { x: 0.45, y: 0.22 }
// Đo FPS khi đã có đủ ngần này giây vẽ liên tục (lúc thả hàng / rê chuột)
const PROBE_SECONDS = 1.2
// Bỏ qua khoảng nghỉ giữa các lần vẽ ở chế độ demand
const PROBE_MAX_DELTA = 0.5

// Ẩn khỏi màn hình nhưng vẫn focus được bằng bàn phím / đọc được bằng trình đọc màn hình
const visuallyHidden: CSSProperties = {
  position: 'absolute',
  width: 1,
  height: 1,
  margin: -1,
  padding: 0,
  overflow: 'hidden',
  clip: 'rect(0 0 0 0)',
  whiteSpace: 'nowrap',
  border: 0,
}

function SceneLights({ dark, profile }: { dark: boolean; profile: GraphicsProfile }) {
  const shadows = profile.shadowMapSize > 0
  // Không có môi trường phản chiếu thì bù ánh sáng nền để thép không bị tối
  const ambientBoost = profile.envResolution > 0 ? 0 : 0.45

  return (
    <>
      <hemisphereLight args={[dark ? '#5d7bb0' : '#eef4ff', dark ? '#1b140d' : '#8b8173', (dark ? 0.6 : 1.15) + ambientBoost]} />
      <directionalLight
        castShadow={shadows}
        position={[-3.5, 6.5, 5]}
        intensity={dark ? 1.6 : 2.3}
        color={dark ? '#ffd9a8' : '#ffffff'}
        shadow-mapSize={[profile.shadowMapSize || 512, profile.shadowMapSize || 512]}
        shadow-bias={-0.0004}
        shadow-normalBias={0.02}
        shadow-radius={4}
        shadow-camera-left={-4}
        shadow-camera-right={4}
        shadow-camera-top={4.2}
        shadow-camera-bottom={-0.6}
        shadow-camera-near={1}
        shadow-camera-far={16}
      />
      <directionalLight position={[4, 3, 4]} intensity={dark ? 0.35 : 0.6} />
      {/* Môi trường phản chiếu dựng tại chỗ (không tải HDR từ mạng), vẽ 1 lần */}
      {profile.envResolution > 0 && (
        <Environment resolution={profile.envResolution} frames={1} environmentIntensity={dark ? 0.35 : 0.8}>
          <Lightformer form="rect" intensity={3} position={[0, 5, 0]} rotation-x={Math.PI / 2} scale={[10, 2, 1]} />
          <Lightformer form="rect" intensity={1.5} position={[-6, 2, 3]} rotation-y={Math.PI / 2} scale={[6, 2, 1]} />
          <Lightformer form="rect" intensity={1.5} position={[6, 2, 3]} rotation-y={-Math.PI / 2} scale={[6, 2, 1]} />
          <Lightformer form="rect" intensity={1} position={[0, 2, 8]} scale={[8, 3, 1]} />
        </Environment>
      )}
    </>
  )
}

// Đo FPS trung vị trên các frame vẽ liên tục, báo 1 lần
function FpsProbe({ onMeasured }: { onMeasured: (fps: number) => void }) {
  const samples = useRef<number[]>([])
  const total = useRef(0)
  const done = useRef(false)

  useFrame((_, delta) => {
    if (done.current || delta <= 0 || delta > PROBE_MAX_DELTA) return
    samples.current.push(delta)
    total.current += delta
    if (total.current < PROBE_SECONDS) return
    done.current = true
    const sorted = [...samples.current].sort((a, b) => a - b)
    onMeasured(1 / sorted[Math.floor(sorted.length / 2)])
  })

  return null
}

// Báo độ phân giải render thật (px thiết bị) cho bảng chọn chất lượng
function RenderSizeReporter({ onChange }: { onChange: (size: RenderSize) => void }) {
  const width = useThree((state) => state.size.width)
  const height = useThree((state) => state.size.height)
  const dpr = useThree((state) => state.viewport.dpr)

  useEffect(() => {
    onChange({ width: Math.round(width * dpr), height: Math.round(height * dpr), dpr })
  }, [width, height, dpr, onChange])

  return null
}

// Đặt camera vừa khít kệ theo tỉ lệ khung; lệch nhẹ theo chuột (parallax)
function CameraRig({ rackHeight }: { rackHeight: number }) {
  const { size, gl, invalidate } = useThree()
  const pointer = useRef({ x: 0, y: 0 })
  const placed = useRef(false)

  const fit = useMemo(() => {
    const aspect = size.width / Math.max(size.height, 1)
    const tanHalf = Math.tan(MathUtils.degToRad(FOV / 2))
    const viewW = RACK.width + 0.9
    const viewH = rackHeight + 0.6
    const distance = Math.max(viewH / 2 / tanHalf, viewW / 2 / (tanHalf * aspect))
    const target = new Vector3(0, rackHeight * 0.47, -RACK.depth / 2)
    return { target, base: new Vector3(0, target.y + distance * 0.13, distance) }
  }, [size.width, size.height, rackHeight])

  useEffect(() => {
    const onMove = (event: PointerEvent) => {
      const rect = gl.domElement.getBoundingClientRect()
      pointer.current.x = MathUtils.clamp(((event.clientX - rect.left) / rect.width) * 2 - 1, -1, 1)
      pointer.current.y = MathUtils.clamp(((event.clientY - rect.top) / rect.height) * 2 - 1, -1, 1)
      invalidate()
    }
    window.addEventListener('pointermove', onMove)
    return () => window.removeEventListener('pointermove', onMove)
  }, [gl, invalidate])

  useEffect(() => invalidate(), [fit, invalidate])

  useFrame((state, delta) => {
    const cam = state.camera as PerspectiveCamera
    const goalX = fit.base.x + pointer.current.x * PARALLAX.x
    const goalY = fit.base.y - pointer.current.y * PARALLAX.y
    if (!placed.current) {
      cam.position.copy(fit.base)
      placed.current = true
    }
    cam.position.x = MathUtils.damp(cam.position.x, goalX, 3.5, delta)
    cam.position.y = MathUtils.damp(cam.position.y, goalY, 3.5, delta)
    cam.position.z = MathUtils.damp(cam.position.z, fit.base.z, 3.5, delta)
    cam.lookAt(fit.target)

    if (Math.abs(cam.position.x - goalX) > 0.001 || Math.abs(cam.position.y - goalY) > 0.001 || Math.abs(cam.position.z - fit.base.z) > 0.001) {
      state.invalidate()
    }
  })

  return null
}

// Đèn rọi đi theo thùng đang được chọn / rê chuột
function HoverSpot({ placement, dark }: { placement: CratePlacement | null; dark: boolean }) {
  const light = useRef<SpotLight>(null)
  const target = useMemo(() => new Object3D(), [])

  useFrame((state, delta) => {
    const l = light.current
    if (!l) return
    const goal = placement ? (dark ? 22 : 12) : 0
    if (placement) {
      l.position.set(placement.x, placement.y + placement.h / 2 + 1.5, placement.z + 1.8)
      target.position.set(placement.x, placement.y, placement.z)
      target.updateMatrixWorld()
    }
    l.intensity = MathUtils.damp(l.intensity, goal, 8, delta)
    if (Math.abs(l.intensity - goal) > 0.05) state.invalidate()
  })

  return (
    <>
      <spotLight ref={light} angle={0.36} penumbra={0.75} distance={7} decay={1.6} intensity={0} color="#ffe6b8" target={target} />
      <primitive object={target} />
    </>
  )
}

const tooltipStyle: CSSProperties = {
  transform: 'translate(-50%, calc(-100% - 10px))',
  width: 'max-content',
  maxWidth: 260,
  padding: '8px 11px',
  borderRadius: 8,
  background: 'rgba(17, 24, 34, 0.94)',
  color: '#f2f6fb',
  fontFamily: '"Segoe UI", system-ui, sans-serif',
  fontSize: 12,
  lineHeight: 1.45,
  boxShadow: '0 8px 22px rgba(0, 0, 0, 0.35)',
  pointerEvents: 'none',
}

function CrateTooltip({ placement, title, lines }: { placement: CratePlacement; title: string; lines: string[] }) {
  return (
    <Html position={[placement.x, placement.y + placement.h / 2 + 0.08, placement.z + placement.d / 2]} zIndexRange={[40, 30]}>
      <div style={tooltipStyle}>
        <div style={{ fontWeight: 800, fontSize: 13 }}>{title}</div>
        {lines.map((line) => (
          <div key={line} style={{ opacity: 0.82 }}>{line}</div>
        ))}
      </div>
    </Html>
  )
}

function EmptyTierNotes({ layout, notes }: { layout: RackLayout; notes: Record<string, string> }) {
  return (
    <>
      {layout.tiers.filter((tier) => tier.count === 0).map((tier) => (
        <Html key={tier.spec.code} center position={[0, tier.deckY + tier.spec.clear * 0.4, -RACK.depth / 2]} zIndexRange={[20, 10]}>
          <div style={{ ...tooltipStyle, transform: 'none', background: 'rgba(17, 24, 34, 0.78)', border: '1px dashed rgba(160, 190, 220, 0.5)' }}>
            {notes[tier.spec.kind]}
          </div>
        </Html>
      ))}
    </>
  )
}

interface UserHomeWarehouse3DProps {
  menu: HomeMenu
  dark: boolean
  profile: GraphicsProfile
  // false: hàng đã nằm sẵn trên kệ (vd. vừa đổi chất lượng)
  intro: boolean
  onMeasured: (fps: number) => void
  onRenderSize: (size: RenderSize) => void
}

export default function UserHomeWarehouse3D({ menu, dark, profile, intro, onMeasured, onRenderSize }: UserHomeWarehouse3DProps) {
  const { t } = useI18n()
  const navigate = useNavigate()
  const layout = useMemo(() => buildRackLayout(menu), [menu])
  const entries = useMemo(() => layout.crates.map((crate) => crate.entry), [layout])
  const { images, host } = useIconImages(entries)

  const [hovered, setHovered] = useState<number | null>(null)
  const [focused, setFocused] = useState<number | null>(null)
  const [picked, setPicked] = useState<number | null>(null)
  const timerRef = useRef(0)

  const quality: CrateQuality = {
    smoothness: profile.roundedSmoothness,
    film: profile.film,
    outlines: profile.outlines,
    ambient: profile.ambientMotion,
  }

  useEffect(() => () => window.clearTimeout(timerRef.current), [])

  const active = hovered ?? focused
  const activeCrate = active === null ? null : layout.crates[active]
  const mode = dark ? 'dark' : 'light'

  const texts: CrateTexts[] = layout.crates.map(({ entry }) => {
    const { item } = entry
    return {
      title: t.nav[item.labelKey],
      hint: t.userHome.pageHints[item.labelKey],
      action: (item.action === 'input' ? t.sidebar.input : t.sidebar.view).toUpperCase(),
      group: t.nav.groups[entry.groupId],
      status: item.status === 'developing'
        ? t.sidebar.developing
        : item.status === 'todo' ? t.sidebar.notStarted : t.sidebar.comingSoon,
      roles: (item.roles ?? []).join(' / '),
    }
  })

  function pick(index: number) {
    const crate = layout.crates[index]
    if (crate.kind !== 'ready' || picked !== null) return
    setPicked(index)
    timerRef.current = window.setTimeout(() => navigate(crate.entry.item.path), PICK_MS)
  }

  const tooltip = active !== null && activeCrate && activeCrate.kind !== 'ready'
    ? {
      placement: activeCrate,
      title: texts[active].title,
      lines: activeCrate.kind === 'locked'
        ? [t.userHome.requires(texts[active].roles), t.userHome.lockedNote]
        : [texts[active].status],
    }
    : null

  return (
    <Box
      onPointerLeave={() => setHovered(null)}
      sx={{
        position: 'relative',
        flex: 1,
        minHeight: 0,
        width: 'min(1220px, 100%)',
        mx: 'auto',
        cursor: activeCrate?.kind === 'ready' && hovered !== null ? 'pointer' : 'default',
      }}
    >
      {host}

      {/* key theo mức: antialias / loại bóng chỉ đặt được lúc tạo context nên đổi mức là dựng lại */}
      <Canvas
        key={profile.level}
        shadows={profile.shadowMapSize > 0 ? 'percentage' : false}
        frameloop={profile.ambientMotion ? 'always' : 'demand'}
        dpr={graphicsDpr(profile)}
        gl={{ antialias: profile.antialias, alpha: true }}
        camera={{ fov: FOV, near: 0.1, far: 60, position: [0, 2, 10] }}
        onPointerMissed={() => setHovered(null)}
        aria-hidden
      >
        <FpsProbe onMeasured={onMeasured} />
        <RenderSizeReporter onChange={onRenderSize} />
        <SceneLights dark={dark} profile={profile} />
        <CameraRig rackHeight={layout.height} />
        <Rack3D layout={layout} outlines={profile.outlines} />

        {layout.crates.map((placement, index) => (
          <Crate3D
            key={placement.entry.item.path}
            placement={placement}
            index={index}
            texts={texts[index]}
            color={getGroupColor(placement.entry.groupId, mode)}
            icon={images.get(placement.entry.item.path)}
            highlighted={active === index}
            picked={picked === index}
            dark={dark}
            quality={quality}
            intro={intro}
            onHover={setHovered}
            onPick={pick}
          />
        ))}

        <HoverSpot placement={activeCrate} dark={dark} />
        <ContactShadows
          position={[0, 0.002, -0.3]}
          scale={[9, 4]}
          resolution={profile.contactResolution}
          // Thấp: chụp bóng 1 lần (tĩnh); còn lại cập nhật theo thùng
          frames={profile.contactShadow === 'baked' ? 1 : Infinity}
          blur={2.4}
          far={2.5}
          opacity={dark ? 0.75 : 0.5}
          color="#0a0f18"
        />
        {/* Tối đa: bụi lơ lửng trong ánh đèn kho */}
        {profile.ambientMotion && (
          <Sparkles count={70} scale={[6.4, 3.4, 1.6]} position={[0, 1.75, 0.3]} size={2.4} speed={0.25} opacity={dark ? 0.75 : 0.5} color="#ffe2b0" />
        )}

        {tooltip && <CrateTooltip placement={tooltip.placement} title={tooltip.title} lines={tooltip.lines} />}
        <EmptyTierNotes
          layout={layout}
          notes={{ ready: t.userHome.readyNone, upcoming: t.userHome.upcomingNone, locked: t.userHome.lockedNone }}
        />
      </Canvas>

      {/* Bàn phím / trình đọc màn hình: focus mục nào thì thùng đó sáng lên trong cảnh 3D */}
      <nav aria-label={t.userHome.pickHint} style={visuallyHidden}>
        {layout.crates.map((crate, index) => (
          crate.kind === 'ready' ? (
            <a
              key={crate.entry.item.path}
              href={crate.entry.item.path}
              onClick={(event) => {
                event.preventDefault()
                pick(index)
              }}
              onFocus={() => setFocused(index)}
              onBlur={() => setFocused(null)}
            >
              {texts[index].hint ? `${texts[index].title} — ${texts[index].hint}` : texts[index].title}
            </a>
          ) : (
            <span key={crate.entry.item.path} tabIndex={0} onFocus={() => setFocused(index)} onBlur={() => setFocused(null)}>
              {crate.kind === 'locked'
                ? `${texts[index].title}, ${t.userHome.requires(texts[index].roles)}`
                : `${texts[index].title}, ${texts[index].status}`}
            </span>
          )
        ))}
      </nav>
    </Box>
  )
}
