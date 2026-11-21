import { useId } from 'react'

import { Box } from '@mui/material'

import { HOME_CONTENT_WIDTH } from '../userHomeStyles'
import { Cobot, CobotPayload, cobotSourceSx, cobotSx } from './Cobot'
import { PALLETIZE_COBOT, TEND_COBOT } from './cobotMotion'
import { FactoryWorker, workerMotionSx } from './FactoryWorker'

/*
 * Máy móc đứng sát chân tường ở HAI BÊN kệ hàng (không đặt sau kệ vì sẽ bị che hết), vẽ tĩnh:
 * trái = hàng rào an toàn + robot nạp phôi + máy CNC (công nhân đứng bấm bảng điều khiển) + bàn cobot cấp phôi,
 * phải = pallet thùng carton + cobot xếp hàng + băng chuyền (công nhân cúi quét mã thùng) + buồng kiểm tra.
 * Máy đứng yên; chỉ công nhân (FactoryWorker) và cobot (Cobot) cử động.
 * Mỗi cụm bám theo mép kệ, lấn vào sau kệ TUCK px; khoảng trống hai bên rộng thì cụm to dần (tới MAX).
 * Tô bằng gradient (vỏ sơn tĩnh điện, kính có phản chiếu, đèn trong buồng máy) thay cho nét viền hoạt hình;
 * màu nhấn lấy theo kệ: xanh trụ kệ, cam dầm kệ.
 */

// Hệ toạ độ mỗi cụm (2 : 1), chân máy chạm y = GROUND
const VB_W = 400
const VB_H = 200
const GROUND = 196
const MIN_WIDTH = 240
const MAX_WIDTH = 380
// Phần cụm máy nằm khuất sau mép kệ
const TUCK = 90

const RACK_BLUE = '#2a67a8'

// Thùng ở đầu băng chuyền mà cobot xếp hàng sẽ gắp
const PALLETIZE_SOURCE = 'cobot-palletize-source'

/*
 * Chuyển động 2 cobot (tính 1 lần). Cửa sổ món hàng: [hiện, bắt đầu mờ, tắt].
 * Phôi: mờ dần trên khay nạp (máy CNC kéo vào). Thùng: nằm trên pallet tới gần hết chu kỳ rồi mờ đi.
 */
const COBOT_SX = {
  ...cobotSx(TEND_COBOT, [0.14, 0.84, 0.9]),
  ...cobotSx(PALLETIZE_COBOT, [0.14, 0.86, 0.97]),
  ...cobotSourceSx(PALLETIZE_COBOT, PALLETIZE_SOURCE, [0.8, 0.96], 44),
}

interface MachineColors {
  bodyTop: string
  bodyBottom: string
  side: string
  edge: string
  baseTop: string
  baseBottom: string
  interior: string
  workLight: string
  sheen: string
  screen: string
  shadow: string
  post: string
  mesh: string
  dimLamp: string
}

function machineColors(dark: boolean): MachineColors {
  return dark
    ? {
      // Vỏ máy xám nhạt dưới đèn ấm ca đêm (không xanh lạnh)
      bodyTop: '#b9b2a6',
      bodyBottom: '#8a8378',
      side: 'rgba(0, 0, 0, 0.18)',
      edge: 'rgba(0, 0, 0, 0.5)',
      baseTop: '#3c3730',
      baseBottom: '#211d18',
      interior: '#120e09',
      workLight: 'rgba(255, 225, 170, 0.5)',
      sheen: 'rgba(255, 225, 185, 0.22)',
      screen: '#5fd0f5',
      shadow: 'rgba(10, 5, 0, 0.55)',
      post: '#d6a51c',
      mesh: 'rgba(220, 195, 160, 0.28)',
      dimLamp: 'rgba(0, 0, 0, 0.2)',
    }
    : {
      bodyTop: '#eef0f1',
      bodyBottom: '#c8cdd2',
      side: 'rgba(60, 80, 100, 0.12)',
      edge: 'rgba(40, 52, 66, 0.45)',
      baseTop: '#46525f',
      baseBottom: '#272f39',
      interior: '#1a2430',
      workLight: 'rgba(215, 240, 255, 0.6)',
      sheen: 'rgba(255, 255, 255, 0.6)',
      screen: '#5fd0f5',
      shadow: 'rgba(25, 35, 48, 0.38)',
      post: '#e6b417',
      mesh: 'rgba(50, 62, 75, 0.32)',
      dimLamp: 'rgba(0, 0, 0, 0.18)',
    }
}

// Gradient / bộ lọc dùng chung trong 1 cụm (id riêng mỗi cụm)
function Defs({ id, colors }: { id: string; colors: MachineColors }) {
  return (
    <defs>
      <linearGradient id={`${id}-body`} x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor={colors.bodyTop} />
        <stop offset="1" stopColor={colors.bodyBottom} />
      </linearGradient>
      <linearGradient id={`${id}-base`} x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor={colors.baseTop} />
        <stop offset="1" stopColor={colors.baseBottom} />
      </linearGradient>
      <linearGradient id={`${id}-steel`} x1="0" y1="0" x2="1" y2="0">
        <stop offset="0" stopColor="#8e99a6" />
        <stop offset="0.45" stopColor="#dfe4ea" />
        <stop offset="1" stopColor="#7d8896" />
      </linearGradient>
      <linearGradient id={`${id}-orange`} x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="#ffa257" />
        <stop offset="1" stopColor="#d4600f" />
      </linearGradient>
      <linearGradient id={`${id}-blue`} x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="#4a8bd0" />
        <stop offset="1" stopColor="#1f4f86" />
      </linearGradient>
      <linearGradient id={`${id}-carton`} x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="#dcae74" />
        <stop offset="1" stopColor="#b68147" />
      </linearGradient>
      <linearGradient id={`${id}-wood`} x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="#b98a55" />
        <stop offset="1" stopColor="#7f5730" />
      </linearGradient>
      {/* Kính: phản chiếu chéo phía trên-trái */}
      <linearGradient id={`${id}-sheen`} x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stopColor={colors.sheen} />
        <stop offset="0.32" stopColor={colors.sheen} stopOpacity="0" />
        <stop offset="0.55" stopColor={colors.sheen} stopOpacity="0.35" />
        <stop offset="0.62" stopColor={colors.sheen} stopOpacity="0" />
      </linearGradient>
      {/* Đèn chiếu sáng trong buồng máy */}
      <radialGradient id={`${id}-work`} cx="0.5" cy="0" r="0.9">
        <stop offset="0" stopColor={colors.workLight} />
        <stop offset="1" stopColor={colors.workLight} stopOpacity="0" />
      </radialGradient>
      <pattern id={`${id}-mesh`} width="6" height="6" patternUnits="userSpaceOnUse">
        <path d="M0 0 L6 6 M6 0 L0 6" stroke={colors.mesh} strokeWidth={0.8} />
      </pattern>
      <filter id={`${id}-soft`} x="-20%" y="-200%" width="140%" height="500%">
        <feGaussianBlur stdDeviation="4" />
      </filter>
      <filter id={`${id}-glow`} x="-100%" y="-100%" width="300%" height="300%">
        <feGaussianBlur stdDeviation="3" />
      </filter>
    </defs>
  )
}

type Url = (name: string) => string

// Thân tủ máy: vỏ sơn trắng, nắp tối, chỉ xanh trụ kệ, chân đế tối, đường ghép tấm vỏ
function Cabinet({ x, y, w, u, colors }: { x: number; y: number; w: number; u: Url; colors: MachineColors }) {
  const h = GROUND - y
  return (
    <g>
      <rect x={x} y={y} width={w} height={h} rx={4} fill={u('body')} stroke={colors.edge} strokeWidth={1} />
      <rect x={x + w - 12} y={y + 14} width={12} height={h - 30} fill={colors.side} />
      <rect x={x} y={y} width={w} height={12} rx={4} fill={u('base')} />
      <rect x={x} y={y + 12} width={w} height={3} fill={RACK_BLUE} />
      <line x1={x + w * 0.62} y1={y + 15} x2={x + w * 0.62} y2={GROUND - 16} stroke={colors.edge} strokeWidth={0.6} opacity={0.6} />
      <rect x={x - 1} y={GROUND - 16} width={w + 2} height={16} fill={u('base')} />
      {[0, 1, 2, 3, 4].map((i) => (
        <rect key={i} x={x + 10 + i * 7} y={GROUND - 11} width={4} height={6} rx={1} fill="#000" opacity={0.35} />
      ))}
    </g>
  )
}

// Bảng điều khiển: màn hình sáng + 3 nút
function ControlPanel({ x, y, w, h, u, colors }: { x: number; y: number; w: number; h: number; u: Url; colors: MachineColors }) {
  return (
    <g>
      <rect x={x} y={y} width={w} height={h} rx={2.5} fill={u('base')} stroke={colors.edge} strokeWidth={0.8} />
      <rect x={x + 3.5} y={y + 4} width={w - 7} height={h * 0.38} rx={1.5} fill={colors.screen} opacity={0.9} />
      <rect x={x + 3.5} y={y + 4} width={w - 7} height={h * 0.38} rx={1.5} fill={u('sheen')} />
      {['#3ccf6e', '#f2c230', '#e5484d'].map((fill, i) => (
        <circle key={fill} cx={x + w * (0.25 + i * 0.25)} cy={y + h * 0.64} r={2.4} fill={fill} />
      ))}
    </g>
  )
}

// Tháp đèn andon: xanh đang sáng (máy chạy bình thường), đỏ / vàng tắt
function Andon({ x, y, u, colors }: { x: number; y: number; u: Url; colors: MachineColors }) {
  return (
    <g>
      <rect x={x - 1.2} y={y + 24} width={2.4} height={16} fill={u('steel')} />
      <rect x={x - 5} y={y - 4} width={10} height={28} rx={2} fill="#1d232b" />
      <rect x={x - 4} y={y - 3} width={8} height={7} rx={1.5} fill="#b23a3a" />
      <rect x={x - 4} y={y - 3} width={8} height={7} rx={1.5} fill={colors.dimLamp} />
      <rect x={x - 4} y={y + 5} width={8} height={7} rx={1.5} fill="#b8962a" />
      <rect x={x - 4} y={y + 5} width={8} height={7} rx={1.5} fill={colors.dimLamp} />
      <rect x={x - 6} y={y + 11} width={12} height={9} rx={3} fill="#4dff8f" opacity={0.7} filter={u('glow')} />
      <rect x={x - 4} y={y + 13} width={8} height={7} rx={1.5} fill="#5dff9a" />
    </g>
  )
}

function useSvgIds() {
  const id = useId().replace(/[^a-zA-Z0-9_-]/g, '')
  const u: Url = (name) => `url(#${id}-${name})`
  return { id, u }
}

function LeftCell({ colors, dark }: { colors: MachineColors; dark: boolean }) {
  const { id, u } = useSvgIds()

  return (
    <svg viewBox={`0 0 ${VB_W} ${VB_H}`} width="100%" style={{ display: 'block', overflow: 'visible' }}>
      <Defs id={id} colors={colors} />

      {/* Bóng mềm dưới chân máy */}
      <ellipse cx={210} cy={GROUND} rx={196} ry={6} fill={colors.shadow} filter={u('soft')} />

      {/* Hàng rào an toàn quanh robot: lưới + cột vàng + thanh trên */}
      <rect x={8} y={124} width={112} height={66} fill={u('mesh')} />
      <rect x={8} y={120} width={112} height={4} fill={colors.post} />
      {[8, 64, 120].map((x) => (
        <rect key={x} x={x - 2.5} y={118} width={5} height={GROUND - 118} fill={colors.post} stroke={colors.edge} strokeWidth={0.6} />
      ))}

      {/* Robot nạp phôi (tư thế đứng yên, tay vươn về cửa máy CNC) */}
      <rect x={46} y={174} width={36} height={GROUND - 174} rx={2} fill={u('base')} />
      <path d="M64 160 L92 116 L128 126" fill="none" stroke={u('orange')} strokeWidth={11} strokeLinecap="round" strokeLinejoin="round" />
      <path d="M64 160 L92 116 L128 126" fill="none" stroke="#ffffff" strokeOpacity={0.25} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" transform="translate(-2 -2)" />
      <circle cx={92} cy={116} r={7} fill={u('base')} />
      <rect x={126} y={120} width={8} height={13} rx={1.5} fill={u('steel')} />
      <rect x={52} y={156} width={24} height={20} rx={6} fill={u('orange')} />

      {/* Máy CNC: cửa kính (trong có đèn + trục chính), tay nắm, bảng điều khiển, andon */}
      <Cabinet x={140} y={74} w={164} u={u} colors={colors} />
      <rect x={154} y={100} width={88} height={62} rx={3} fill={colors.interior} />
      <rect x={154} y={100} width={88} height={62} rx={3} fill={u('work')} />
      <rect x={190} y={100} width={14} height={26} fill={u('steel')} />
      <path d="M193 126 h8 l-4 9 z" fill="#c8d0d8" />
      <rect x={172} y={146} width={52} height={10} rx={1} fill={u('steel')} />
      <rect x={154} y={100} width={88} height={62} rx={3} fill={u('sheen')} stroke={colors.edge} strokeWidth={1.2} />
      <rect x={233} y={116} width={4} height={28} rx={2} fill={u('steel')} />
      <ControlPanel x={252} y={96} w={40} h={58} u={u} colors={colors} />
      <Andon x={292} y={36} u={u} colors={colors} />

      {/* Công nhân đứng bấm bảng điều khiển máy CNC */}
      <FactoryWorker x={230} y={GROUND} pose="panel" dark={dark} />

      {/* Khay nạp phôi ở hông máy CNC + cửa nạp tự động */}
      <rect x={298} y={110} width={6} height={13} fill={colors.interior} />
      <rect x={294} y={123} width={22} height={3} rx={0.8} fill={u('steel')} />
      <rect x={300} y={126} width={3} height={10} fill={u('steel')} />

      {/* Bàn thép cạnh máy, thùng nhựa dưới gầm */}
      <rect x={314} y={150} width={80} height={5} rx={1} fill={u('steel')} />
      {[318, 386].map((x) => (
        <rect key={x} x={x} y={155} width={4} height={GROUND - 155} fill={u('steel')} />
      ))}
      <rect x={318} y={182} width={72} height={3} fill={u('steel')} />
      <rect x={326} y={166} width={34} height={16} rx={1.5} fill={u('blue')} />

      {/* Phôi thép trong thùng (nhô lên khỏi miệng thùng) */}
      {[358, 365, 377, 384].map((x) => (
        <rect key={x} x={x - 2.6} y={126} width={5.2} height={10} rx={1} fill={u('steel')} />
      ))}

      {/* Cobot cấp phôi: gắp phôi trong thùng -> xoay đế -> đặt lên khay nạp của máy CNC */}
      <Cobot spec={TEND_COBOT} dark={dark} />
      <CobotPayload spec={TEND_COBOT}>
        <rect x={-2.6} y={-7} width={5.2} height={9} rx={1} fill={u('steel')} />
      </CobotPayload>

      {/* Thùng phôi vẽ sau cobot: ngón kẹp thò xuống trong thùng thì bị thành thùng che */}
      <rect x={352} y={132} width={38} height={18} rx={1.5} fill={u('blue')} />
      <rect x={352} y={132} width={38} height={2.4} fill="#ffffff" opacity={0.3} />
      <rect x={362} y={137} width={18} height={4} rx={2} fill="#000" opacity={0.35} />
    </svg>
  )
}

function RightCell({ colors, dark }: { colors: MachineColors; dark: boolean }) {
  const { id, u } = useSvgIds()
  const beltY = 150

  return (
    <svg viewBox={`0 0 ${VB_W} ${VB_H}`} width="100%" style={{ display: 'block', overflow: 'visible' }}>
      <Defs id={id} colors={colors} />

      <ellipse cx={200} cy={GROUND} rx={196} ry={6} fill={colors.shadow} filter={u('soft')} />

      {/* Ống hút khí từ nóc buồng kiểm tra lên mái */}
      <rect x={300} y={-70} width={18} height={140} fill={u('steel')} />
      {[-30, 20].map((y) => (
        <rect key={y} x={297} y={y} width={24} height={5} fill={u('steel')} stroke={colors.edge} strokeWidth={0.5} />
      ))}

      {/* Pallet gỗ + thùng carton (phía trong, sát kệ) */}
      <rect x={8} y={GROUND - 10} width={78} height={10} fill={u('wood')} />
      {[14, 44, 74].map((x) => (
        <rect key={x} x={x} y={GROUND - 7} width={8} height={7} fill="#000" opacity={0.35} />
      ))}
      {[[12, 156, 36, 30], [50, 156, 32, 30], [24, 128, 38, 28]].map(([x, y, w, h]) => (
        <g key={`${x}-${y}`}>
          <rect x={x} y={y} width={w} height={h} rx={1} fill={u('carton')} stroke="rgba(90, 60, 25, 0.35)" strokeWidth={0.6} />
          <rect x={x + w / 2 - 3} y={y} width={6} height={h} fill="#f3dfbf" opacity={0.5} />
        </g>
      ))}

      {/* Băng chuyền: chân, khung xanh, mặt băng tối, thùng hàng đang nằm trên băng */}
      {[110, 186, 258].map((x) => (
        <rect key={x} x={x} y={beltY + 10} width={5} height={GROUND - beltY - 10} fill={u('steel')} />
      ))}
      <rect x={106} y={GROUND - 22} width={158} height={3} fill={u('steel')} />

      {/* Công nhân đứng sau băng chuyền, cúi quét mã thùng hàng */}
      <FactoryWorker x={180} y={GROUND - 2} pose="pick" scale={0.96} dark={dark} />

      {/* Thùng trên băng (băng chạy về phía cobot); thùng ở đầu băng bị cobot gắp, thùng mới trượt tới thay */}
      {[124, 194, 262].map((x) => (
        <g key={x} className={x === 124 ? PALLETIZE_SOURCE : undefined}>
          <rect x={x} y={beltY - 20} width={26} height={20} rx={1} fill={u('carton')} stroke="rgba(90, 60, 25, 0.35)" strokeWidth={0.6} />
          <rect x={x + 10} y={beltY - 20} width={6} height={20} fill="#f3dfbf" opacity={0.5} />
        </g>
      ))}
      <rect x={94} y={beltY} width={184} height={6} rx={3} fill={u('base')} />
      <rect x={94} y={beltY + 6} width={184} height={6} fill={u('blue')} />

      {/* Cobot xếp hàng trên trụ đứng: gắp thùng ở đầu băng -> xoay đế -> đặt lên chồng thùng trên pallet */}
      <rect x={85} y={GROUND - 4} width={16} height={4} rx={1} fill={u('base')} />
      <rect x={88} y={PALLETIZE_COBOT.mount} width={10} height={GROUND - PALLETIZE_COBOT.mount - 4} fill={u('steel')} />
      <Cobot spec={PALLETIZE_COBOT} dark={dark} />
      <CobotPayload spec={PALLETIZE_COBOT}>
        <rect x={-13} y={-1} width={26} height={20} rx={1} fill={u('carton')} stroke="rgba(90, 60, 25, 0.35)" strokeWidth={0.6} />
        <rect x={-3} y={-1} width={6} height={20} fill="#f3dfbf" opacity={0.5} />
      </CobotPayload>

      {/* Buồng kiểm tra: lối vào có rèm nhựa, ô kính, bảng điều khiển, andon */}
      <Cabinet x={276} y={66} w={116} u={u} colors={colors} />
      <rect x={276} y={126} width={22} height={34} fill={colors.interior} />
      {[0, 1, 2, 3, 4].map((i) => (
        <rect key={i} x={277 + i * 4.2} y={127} width={3} height={24} fill="#b9d3e6" opacity={0.28} />
      ))}
      <rect x={306} y={90} width={44} height={40} rx={2.5} fill={colors.interior} />
      <rect x={306} y={90} width={44} height={40} rx={2.5} fill={u('work')} />
      <rect x={306} y={90} width={44} height={40} rx={2.5} fill={u('sheen')} stroke={colors.edge} strokeWidth={1.2} />
      <ControlPanel x={356} y={90} w={26} h={50} u={u} colors={colors} />
      <Andon x={370} y={28} u={u} colors={colors} />
    </svg>
  )
}

interface UserHomeMachinesProps {
  horizon: number
  dark: boolean
}

export function UserHomeMachines({ horizon, dark }: UserHomeMachinesProps) {
  const colors = machineColors(dark)
  const inner = HOME_CONTENT_WIDTH / 2 - TUCK

  const cluster = {
    position: 'absolute',
    // Chân máy lấn xuống sàn một chút để không hở chân tường
    bottom: `calc(${100 - horizon}% - 4px)`,
    width: `clamp(${MIN_WIDTH}px, calc((100% - ${HOME_CONTENT_WIDTH}px) / 2 + ${TUCK}px), ${MAX_WIDTH}px)`,
  } as const

  return (
    <Box
      sx={{
        position: 'absolute',
        inset: 0,
        ...workerMotionSx,
        ...COBOT_SX,
        // Giảm chuyển động: công nhân + cobot đứng yên ở tư thế gốc
        '@media (prefers-reduced-motion: reduce)': { '& *': { animation: 'none !important' } },
      }}
    >
      <Box sx={{ ...cluster, right: `calc(50% + ${inner}px)` }}>
        <LeftCell colors={colors} dark={dark} />
      </Box>
      <Box sx={{ ...cluster, left: `calc(50% + ${inner}px)` }}>
        <RightCell colors={colors} dark={dark} />
      </Box>
    </Box>
  )
}
