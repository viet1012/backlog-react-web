import { memo } from 'react'

import { Box } from '@mui/material'
import { keyframes } from '@mui/material/styles'

import { C, INK } from './factoryScene/primitives'
import { getHomePalette, hazardStripes } from './userHomeStyles'

/*
 * Nền xưởng vẽ bằng CSS + SVG (thay ảnh nền cũ).
 * Lớp: giàn mái -> đèn high-bay -> máy móc (andon, robot, băng chuyền) -> cầu trục -> sàn 3D.
 * Chỉ animate transform / opacity để chạy trên GPU; tắt hết khi prefers-reduced-motion.
 */

// Đường chân tường (tường / sàn), % chiều cao
const HORIZON = 62
// 1 ô lưới sàn; track sàn trượt đúng 1 ô để vòng lặp liền mạch
const CELL = 64
const LAMPS = [8, 25, 42, 59, 76, 93]
const CRANE_TOP = '2.5%'
const CRANE_CABLE = 26
const DUST = [
  { x: 9, delay: 0, dur: 14 },
  { x: 23, delay: 5, dur: 17 },
  { x: 27, delay: 9, dur: 13 },
  { x: 40, delay: 2, dur: 16 },
  { x: 45, delay: 11, dur: 15 },
  { x: 57, delay: 6, dur: 18 },
  { x: 61, delay: 1, dur: 14 },
  { x: 74, delay: 8, dur: 16 },
  { x: 79, delay: 3, dur: 13 },
  { x: 92, delay: 10, dur: 17 },
]

const floorScroll = keyframes`
  from { transform: translate3d(0, -${CELL}px, 0); }
  to   { transform: translate3d(0, 0, 0); }
`

const lampFlicker = keyframes`
  0%, 100% { opacity: 1; }
  47% { opacity: 1; }
  48% { opacity: 0.72; }
  50% { opacity: 0.95; }
  52% { opacity: 0.8; }
  54% { opacity: 1; }
`

const craneTravel = keyframes`
  0%   { transform: translate3d(6%, 0, 0); }
  45%  { transform: translate3d(78%, 0, 0); }
  55%  { transform: translate3d(78%, 0, 0); }
  100% { transform: translate3d(6%, 0, 0); }
`

const hookSway = keyframes`
  0%, 100% { transform: rotate(-2.5deg); }
  50%      { transform: rotate(2.5deg); }
`

const andonBlink = keyframes`
  0%, 100% { opacity: 1; }
  50%      { opacity: 0.25; }
`

const conveyorMove = keyframes`
  from { transform: translateX(0); }
  to   { transform: translateX(75px); }
`

const robotArm = keyframes`
  0%, 100% { transform: rotate(-14deg); }
  50%      { transform: rotate(18deg); }
`

const dustRise = keyframes`
  0%   { opacity: 0; transform: translate3d(0, 0, 0); }
  15%  { opacity: 0.8; }
  85%  { opacity: 0.6; }
  100% { opacity: 0; transform: translate3d(18px, -220px, 0); }
`

interface UserHomeBackdropProps {
  dark: boolean
  // Đồ hoạ thấp: tắt các chuyển động trang trí lớn (đèn chập chờn, bụi, sàn trôi)
  calm?: boolean
}

function FactorySilhouette({ fill, window }: { fill: string; window: string }) {
  return (
    <svg viewBox="0 0 1200 160" preserveAspectRatio="xMidYMax slice" width="100%" height="100%">
      <g fill={fill}>
        {/* Kệ hàng */}
        <rect x="20" y="40" width="8" height="120" />
        <rect x="142" y="40" width="8" height="120" />
        <rect x="20" y="60" width="130" height="5" />
        <rect x="20" y="96" width="130" height="5" />
        <rect x="20" y="132" width="130" height="5" />
        <rect x="34" y="42" width="34" height="18" />
        <rect x="74" y="46" width="26" height="14" />
        <rect x="40" y="78" width="44" height="18" />
        <rect x="96" y="112" width="40" height="20" />

        {/* Máy CNC */}
        <rect x="200" y="70" width="170" height="90" rx="6" />
        <rect x="355" y="36" width="4" height="34" />

        {/* Bồn chứa + ống */}
        <rect x="420" y="50" width="70" height="110" />
        <ellipse cx="455" cy="50" rx="35" ry="13" />
        <rect x="490" y="82" width="70" height="8" />

        {/* Ống khói */}
        <rect x="566" y="0" width="18" height="160" />

        {/* Robot: đế */}
        <rect x="618" y="132" width="52" height="28" rx="4" />

        {/* Băng chuyền */}
        <rect x="700" y="128" width="220" height="10" rx="5" />
        <rect x="716" y="138" width="6" height="22" />
        <rect x="898" y="138" width="6" height="22" />

        {/* Máy thứ 2 */}
        <rect x="950" y="60" width="140" height="100" rx="6" />
        <rect x="1072" y="26" width="4" height="34" />

        {/* Thùng xếp chồng */}
        <rect x="1110" y="118" width="40" height="42" />
        <rect x="1152" y="126" width="34" height="34" />
        <rect x="1124" y="84" width="36" height="34" />
      </g>

      {/* Cửa sổ máy (sáng lên ở ca đêm) */}
      <rect x="216" y="86" width="70" height="40" rx="3" fill={window} />
      <rect x="298" y="86" width="56" height="18" rx="3" fill={window} />
      <rect x="966" y="76" width="80" height="42" rx="3" fill={window} />

      {/* Tay robot: khớp quay quanh (644, 132) */}
      <g className="robot-arm" fill="none" stroke={fill} strokeLinecap="round">
        <path d="M644 132 L676 92 L716 104" strokeWidth="11" />
        <circle cx="716" cy="104" r="6" fill={fill} stroke="none" />
      </g>

      {/* Thùng hàng chạy trên băng chuyền */}
      <defs>
        <clipPath id="userHomeConveyorClip">
          <rect x="700" y="96" width="220" height="32" />
        </clipPath>
      </defs>
      <g clipPath="url(#userHomeConveyorClip)">
        <g className="conveyor-load" fill={C.carton} opacity="0.75">
          {[625, 700, 775, 850, 925].map((x) => (
            <rect key={x} x={x} y="108" width="24" height="20" rx="2" />
          ))}
        </g>
      </g>

      {/* Tháp đèn andon */}
      {[
        { x: 357, y: 30 },
        { x: 1074, y: 20 },
      ].map(({ x, y }, i) => (
        <g key={x}>
          <circle className="andon" cx={x} cy={y} r="5" fill={C.red} style={{ animationDelay: `${i * 0.7}s` }} />
          <circle cx={x} cy={y + 11} r="5" fill={C.yellow} opacity="0.45" />
          <circle className="andon andon-slow" cx={x} cy={y + 22} r="5" fill={C.green} />
        </g>
      ))}
    </svg>
  )
}

export const UserHomeBackdrop = memo(function UserHomeBackdrop({ dark, calm = false }: UserHomeBackdropProps) {
  const palette = getHomePalette(dark)

  return (
    <Box
      aria-hidden
      sx={{
        position: 'absolute',
        inset: 0,
        zIndex: 0,
        overflow: 'hidden',
        pointerEvents: 'none',
        background: `linear-gradient(180deg, ${palette.ceiling} 0%, ${palette.wall} ${HORIZON - 2}%, ${palette.floor} ${HORIZON}%, ${palette.floor} 100%)`,

        '@media (prefers-reduced-motion: reduce)': {
          '& *': { animation: 'none !important' },
        },
        ...(calm && { '& .ambient-motion': { animation: 'none !important' } }),
      }}
    >
      {/* Giàn kèo mái */}
      <Box
        sx={{
          position: 'absolute',
          left: 0,
          right: 0,
          top: 0,
          height: '20%',
          borderBottom: `5px solid ${palette.truss}`,
          background: [
            `repeating-linear-gradient(55deg, transparent 0 46px, ${palette.truss} 46px 49px)`,
            `repeating-linear-gradient(-55deg, transparent 0 46px, ${palette.truss} 46px 49px)`,
          ].join(', '),
          maskImage: 'linear-gradient(180deg, transparent 0%, #000 60%)',
        }}
      />

      {/* Đèn high-bay + chóp sáng */}
      {LAMPS.map((left, i) => (
        <Box
          key={left}
          sx={{
            position: 'absolute',
            left: `${left}%`,
            top: 0,
            width: 0,
            height: '100%',
          }}
        >
          <Box sx={{ position: 'absolute', left: -0.5, top: 0, width: '1px', height: '13%', bgcolor: palette.truss }} />
          <Box
            sx={{
              position: 'absolute',
              left: -17,
              top: '13%',
              width: 34,
              height: 10,
              bgcolor: dark ? '#2a3a50' : '#7d8fa3',
              clipPath: 'polygon(22% 0, 78% 0, 100% 100%, 0 100%)',
            }}
          />
          <Box
            className="ambient-motion"
            sx={{
              position: 'absolute',
              left: -130,
              top: 'calc(13% + 10px)',
              width: 260,
              height: `${HORIZON + 10}%`,
              clipPath: 'polygon(44% 0, 56% 0, 100% 100%, 0 100%)',
              background: `linear-gradient(180deg, ${palette.lampGlow} 0%, transparent 78%)`,
              mixBlendMode: dark ? 'screen' : 'normal',
              animation: `${lampFlicker} ${7 + i * 1.3}s linear ${i * 1.1}s infinite`,
            }}
          />
        </Box>
      ))}

      {/* Máy móc phía tường */}
      <Box
        sx={{
          position: 'absolute',
          left: 0,
          right: 0,
          bottom: `${100 - HORIZON}%`,
          height: '24%',
          '& .andon': { animation: `${andonBlink} 1.4s ease-in-out infinite` },
          '& .andon-slow': { animation: `${andonBlink} 3.2s ease-in-out infinite` },
          '& .conveyor-load': { animation: `${conveyorMove} 4s linear infinite` },
          '& .robot-arm': {
            transformBox: 'view-box',
            transformOrigin: '644px 132px',
            animation: `${robotArm} 5s ease-in-out infinite`,
          },
        }}
      >
        <FactorySilhouette
          fill={palette.silhouette}
          window={dark ? 'rgba(120, 210, 255, 0.28)' : 'rgba(255, 255, 255, 0.45)'}
        />
      </Box>

      {/* Cầu trục sát trần (phía dưới là bảng LED + kệ): ray + xe con + móc treo thùng hàng */}
      <Box
        sx={{
          position: 'absolute',
          left: 0,
          right: 0,
          top: CRANE_TOP,
          height: 8,
          background: hazardStripes(6),
          opacity: dark ? 0.55 : 0.7,
          boxShadow: '0 3px 6px rgba(0, 0, 0, 0.18)',
        }}
      />
      <Box
        sx={{
          position: 'absolute',
          left: 0,
          top: CRANE_TOP,
          width: '100%',
          animation: `${craneTravel} 38s ease-in-out infinite`,
        }}
      >
        <Box sx={{ position: 'absolute', left: -22, top: -6, width: 44, height: 16, borderRadius: '3px', bgcolor: C.yellow, border: `2px solid ${INK}` }} />
        <Box
          sx={{
            position: 'absolute',
            left: 0,
            top: 10,
            transformOrigin: 'top center',
            animation: `${hookSway} 3.6s ease-in-out infinite`,
          }}
        >
          <Box sx={{ position: 'absolute', left: -1, top: 0, width: '2px', height: CRANE_CABLE, bgcolor: dark ? '#9fb2c8' : '#4c5d70' }} />
          <Box
            sx={{
              position: 'absolute',
              left: -20,
              top: CRANE_CABLE,
              width: 40,
              height: 28,
              borderRadius: '3px',
              bgcolor: C.carton,
              border: `2px solid ${INK}`,
              boxShadow: 'inset 0 -6px 0 rgba(0, 0, 0, 0.12)',
            }}
          />
        </Box>
      </Box>

      {/* Sàn 3D: mặt phẳng nghiêng, track trượt về phía người xem */}
      <Box
        sx={{
          position: 'absolute',
          left: 0,
          right: 0,
          top: `${HORIZON}%`,
          bottom: 0,
          overflow: 'hidden',
          perspective: '420px',
          perspectiveOrigin: '50% 0%',
          maskImage: 'linear-gradient(180deg, transparent 0%, #000 22%)',
        }}
      >
        <Box
          sx={{
            position: 'absolute',
            left: '-60%',
            right: '-60%',
            top: 0,
            height: '320%',
            transformOrigin: 'top center',
            transform: 'rotateX(72deg)',
          }}
        >
          <Box
            className="ambient-motion"
            sx={{
              position: 'absolute',
              inset: `-${CELL}px 0 0 0`,
              animation: `${floorScroll} 3.2s linear infinite`,
              // Thứ tự lớp: vạch giữa (nét đứt, chu kỳ = 1 ô) | 2 mép lối đi | lưới ngang | lưới dọc
              backgroundImage: [
                `repeating-linear-gradient(0deg, ${palette.lane} 0 ${CELL / 2}px, transparent ${CELL / 2}px ${CELL}px)`,
                `linear-gradient(90deg, transparent calc(42% - 5px), ${palette.lane} calc(42% - 5px) 42%, transparent 42% 58%, ${palette.lane} 58% calc(58% + 5px), transparent calc(58% + 5px))`,
                `repeating-linear-gradient(0deg, ${palette.grid} 0 2px, transparent 2px ${CELL}px)`,
                `repeating-linear-gradient(90deg, ${palette.grid} 0 2px, transparent 2px ${CELL}px)`,
              ].join(', '),
              backgroundSize: '6px 100%, 100% 100%, auto, auto',
              backgroundPosition: 'center top, 0 0, 0 0, center 0',
              backgroundRepeat: 'no-repeat, no-repeat, repeat, repeat',
            }}
          />
        </Box>
        {/* Sương mờ ở chân tường để sàn hoà vào tường */}
        <Box sx={{ position: 'absolute', inset: 0, background: `linear-gradient(180deg, ${palette.fog} 0%, transparent 35%)` }} />
      </Box>

      {/* Bụi lơ lửng trong ánh đèn */}
      {DUST.map(({ x, delay, dur }) => (
        <Box
          key={x}
          className="ambient-motion"
          sx={{
            position: 'absolute',
            left: `${x}%`,
            top: `${HORIZON - 4}%`,
            width: 3,
            height: 3,
            borderRadius: '50%',
            bgcolor: dark ? 'rgba(255, 226, 170, 0.75)' : 'rgba(255, 255, 255, 0.9)',
            opacity: 0,
            animation: `${dustRise} ${dur}s linear ${delay}s infinite`,
          }}
        />
      ))}

      {/* Vạch cảnh báo mép dưới + viền tối 4 góc */}
      <Box sx={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: 6, background: hazardStripes(8), opacity: 0.8 }} />
      <Box
        sx={{
          position: 'absolute',
          inset: 0,
          background: dark
            ? 'radial-gradient(ellipse at 50% 45%, transparent 55%, rgba(0, 4, 12, 0.55) 100%)'
            : 'radial-gradient(ellipse at 50% 45%, transparent 60%, rgba(40, 60, 85, 0.18) 100%)',
        }}
      />
    </Box>
  )
})
