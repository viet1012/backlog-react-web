import type { ReactNode } from 'react'

import { keyframes } from '@mui/material/styles'

import { sampleCobot, SHOULDER_RISE, type CobotSample, type CobotSpec } from './cobotMotion'

/*
 * Cobot (robot cộng tác: tay trắng, khớp có vòng LED xanh, đầu kẹp 2 ngón) vẽ trong SVG của cụm máy.
 * Góc khớp tính sẵn bằng IK theo đường đi của đầu kẹp (cobotMotion.ts) rồi đổ thành keyframes CSS:
 * hạ thẳng xuống, khép kẹp, nhấc lên, xoay đế, hạ, nhả, quay về. Món hàng (CobotPayload) đi theo mũi kẹp.
 * Toạ độ tuyệt đối trong SVG; tâm xoay đặt bằng transform-origin + transform-box: view-box.
 */

const LINK = '#f1f3f5'
const EDGE = '#8f99a3'
const JOINT = '#dde2e7'
const RING = '#2f8fd6'
const TOOL = '#2a2f36'
// Khép vừa khít phôi rộng 5.2 (khe 2 ngón lúc mở 7.8)
const FINGER_TRAVEL = 1.3

const pct = (t: number) => `${(t * 100).toFixed(2)}%`

function frames(samples: CobotSample[], value: (s: CobotSample) => string) {
  return keyframes`${samples.map((s) => `${pct(s.t)} { ${value(s)} }`).join('\n')}`
}

function geometry(spec: CobotSpec) {
  const shoulderY = spec.mount - SHOULDER_RISE
  const elbowY = shoulderY - spec.upper
  return { shoulderY, elbowY, wristX: spec.x + spec.fore }
}

/*
 * Style chuyển động của 1 cobot (đặt vào sx khung bao SVG).
 * payloadWindow: [hiện, bắt đầu mờ, tắt hẳn] của món hàng đang cầm / vừa đặt.
 */
export function cobotSx(spec: CobotSpec, payloadWindow: [number, number, number]) {
  const samples = sampleCobot(spec)
  const { shoulderY, elbowY, wristX } = geometry(spec)
  const [grab, release] = spec.grip
  const [show, fadeFrom, hide] = payloadWindow
  const run = (kf: ReturnType<typeof keyframes>) => `${kf} ${spec.cycle}s linear infinite`
  const closed = (t: number) => t >= grab && t <= release

  // Mũi kẹp lúc gắp / lúc đặt: món hàng đứng yên ở đó trước khi gắp / sau khi đặt
  const tipAt = (t: number) => samples.reduce((best, s) => (Math.abs(s.t - t) < Math.abs(best.t - t) ? s : best))
  const pickTip = tipAt(grab)
  const placeTip = tipAt(release)

  const payload = frames(samples, (s) => {
    const at = s.t < grab ? pickTip : s.t > release ? placeTip : s
    const opacity = s.t < show || s.t >= hide ? 0 : s.t <= fadeFrom ? 1 : 1 - (s.t - fadeFrom) / (hide - fadeFrom)
    return `transform: translate(${at.tipX.toFixed(2)}px, ${at.tipY.toFixed(2)}px); opacity: ${opacity.toFixed(3)};`
  })

  const id = spec.id
  return {
    [`& .cobot-${id}-yaw`]: {
      transformBox: 'view-box',
      transformOrigin: `${spec.x}px ${shoulderY}px`,
      animation: run(frames(samples, (s) => `transform: scaleX(${s.yawScale.toFixed(4)});`)),
    },
    [`& .cobot-${id}-shoulder`]: {
      transformBox: 'view-box',
      transformOrigin: `${spec.x}px ${shoulderY}px`,
      animation: run(frames(samples, (s) => `transform: rotate(${s.shoulder.toFixed(2)}deg);`)),
    },
    [`& .cobot-${id}-elbow`]: {
      transformBox: 'view-box',
      transformOrigin: `${spec.x}px ${elbowY}px`,
      animation: run(frames(samples, (s) => `transform: rotate(${s.elbow.toFixed(2)}deg);`)),
    },
    [`& .cobot-${id}-wrist`]: {
      transformBox: 'view-box',
      transformOrigin: `${wristX}px ${elbowY}px`,
      animation: run(frames(samples, (s) => `transform: rotate(${s.wrist.toFixed(2)}deg);`)),
    },
    [`& .cobot-${id}-finger-l`]: {
      animation: run(frames(samples, (s) => `transform: translateX(${closed(s.t) ? FINGER_TRAVEL : 0}px);`)),
    },
    [`& .cobot-${id}-finger-r`]: {
      animation: run(frames(samples, (s) => `transform: translateX(${closed(s.t) ? -FINGER_TRAVEL : 0}px);`)),
    },
    [`& .cobot-${id}-payload`]: { animation: run(payload) },
  }
}

/*
 * Món hàng nguồn đứng chờ ở chỗ gắp (vd. thùng trên băng chuyền): biến mất lúc bị gắp,
 * món mới trượt vào từ phía sau (slideFrom px theo trục x) trong khoảng arrive.
 */
export function cobotSourceSx(spec: CobotSpec, className: string, arrive: [number, number], slideFrom: number) {
  const [grab] = spec.grip
  const [from, to] = arrive
  const kf = keyframes`
    0%                    { transform: translateX(0); opacity: 1; }
    ${pct(grab)}          { transform: translateX(0); opacity: 1; }
    ${pct(grab + 0.005)}  { transform: translateX(0); opacity: 0; }
    ${pct(from)}          { transform: translateX(${slideFrom}px); opacity: 0; }
    ${pct(from + 0.01)}   { transform: translateX(${slideFrom}px); opacity: 1; }
    ${pct(to)}            { transform: translateX(0); opacity: 1; }
    100%                  { transform: translateX(0); opacity: 1; }
  `
  return { [`& .${className}`]: { animation: `${kf} ${spec.cycle}s linear infinite` } }
}

// Đoạn tay: viền xám bên dưới + thân trắng + vệt sáng
function Link({ x1, y1, x2, y2, width }: { x1: number; y1: number; x2: number; y2: number; width: number }) {
  return (
    <g strokeLinecap="round">
      <line x1={x1} y1={y1} x2={x2} y2={y2} stroke={EDGE} strokeWidth={width + 1.6} />
      <line x1={x1} y1={y1} x2={x2} y2={y2} stroke={LINK} strokeWidth={width} />
      <line x1={x1} y1={y1 - width * 0.22} x2={x2} y2={y2 - width * 0.22} stroke="#ffffff" strokeWidth={width * 0.25} opacity={0.8} />
    </g>
  )
}

function Joint({ cx, cy, r }: { cx: number; cy: number; r: number }) {
  return (
    <g>
      <circle cx={cx} cy={cy} r={r} fill={JOINT} stroke={EDGE} strokeWidth={0.8} />
      <circle cx={cx} cy={cy} r={r * 0.62} fill="none" stroke={RING} strokeWidth={1.3} />
    </g>
  )
}

export function Cobot({ spec, dark = false }: { spec: CobotSpec; dark?: boolean }) {
  const { x, mount, id } = spec
  const { shoulderY, elbowY, wristX } = geometry(spec)
  const tipY = elbowY + spec.tool
  // Đầu kẹp: khối cổ tay -> đế kẹp -> 2 ngón tới mũi kẹp (tipY)
  const wristBlock = { top: elbowY + 2.5, height: 6.5 }
  const palm = { top: wristBlock.top + wristBlock.height, height: 3.8 }
  const fingerTop = palm.top + palm.height

  return (
    <g style={dark ? { filter: 'brightness(0.94) sepia(0.08)' } : undefined}>
      {/* Đế tròn bắt bulông (đứng yên; phần trên xoay theo yaw) */}
      <rect x={x - 12} y={mount - 4} width={24} height={4} rx={1.2} fill="#59636f" />
      <rect x={x - 9.5} y={mount - SHOULDER_RISE + 1} width={19} height={SHOULDER_RISE - 4} rx={3.5} fill={LINK} stroke={EDGE} strokeWidth={0.9} />
      <rect x={x - 9.5} y={mount - 9} width={19} height={2} fill={RING} />

      <g className={`cobot-${id}-yaw`}>
        <g className={`cobot-${id}-shoulder`}>
          <Link x1={x} y1={shoulderY} x2={x} y2={elbowY} width={10} />
          <g className={`cobot-${id}-elbow`}>
            <Link x1={x} y1={elbowY} x2={wristX} y2={elbowY} width={8.5} />
            {/* Cổ tay + đầu kẹp 2 ngón (cổ tay xoay bù để luôn hướng xuống; ngón khép khi cầm hàng) */}
            <g className={`cobot-${id}-wrist`}>
              <rect x={wristX - 4} y={wristBlock.top} width={8} height={wristBlock.height} rx={1.4} fill={JOINT} stroke={EDGE} strokeWidth={0.7} />
              <rect x={wristX - 4} y={wristBlock.top + 2.6} width={8} height={1.3} fill={RING} />
              <rect x={wristX - 6.5} y={palm.top} width={13} height={palm.height} rx={1} fill={TOOL} />
              <rect className={`cobot-${id}-finger-l`} x={wristX - 6.5} y={fingerTop} width={2.6} height={tipY - fingerTop} rx={0.6} fill={TOOL} />
              <rect className={`cobot-${id}-finger-r`} x={wristX + 3.9} y={fingerTop} width={2.6} height={tipY - fingerTop} rx={0.6} fill={TOOL} />
            </g>
            <Joint cx={wristX} cy={elbowY} r={5.4} />
          </g>
          <Joint cx={x} cy={elbowY} r={7} />
        </g>
        <Joint cx={x} cy={shoulderY} r={8.2} />
      </g>
    </g>
  )
}

/*
 * Món hàng cobot đang cầm: vẽ quanh gốc (0, 0) = mũi kẹp, keyframes dịch nó theo mũi kẹp.
 * Đặt SAU <Cobot> để nằm đè lên ngón kẹp.
 */
export function CobotPayload({ spec, children }: { spec: CobotSpec; children: ReactNode }) {
  return <g className={`cobot-${spec.id}-payload`} style={{ opacity: 0 }}>{children}</g>
}
