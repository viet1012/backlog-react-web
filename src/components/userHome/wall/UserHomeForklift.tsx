import { Box } from '@mui/material'
import { keyframes } from '@mui/material/styles'

import { C, INK } from '../factoryScene/primitives'

/*
 * Xe nâng chở thùng hàng chạy dọc chân tường (sau kệ hàng): sang phải, nghỉ ngoài khung, quay đầu chạy về.
 * Chỉ animate transform / opacity. Không render ở đồ hoạ Thấp / 2D (UserHomeBackdrop quyết định),
 * ẩn hẳn khi hệ thống bật giảm chuyển động (đứng yên giữa sàn trông lạ).
 */
const WIDTH = 104
const HEIGHT = 73
const CYCLE = 44

// % trong translate = bề rộng lớp ngoài = cả khung nền
const travel = keyframes`
  0%   { transform: translate3d(-${WIDTH + 30}px, 0, 0); }
  40%  { transform: translate3d(calc(100% + 30px), 0, 0); }
  50%  { transform: translate3d(calc(100% + 30px), 0, 0); }
  90%  { transform: translate3d(-${WIDTH + 30}px, 0, 0); }
  100% { transform: translate3d(-${WIDTH + 30}px, 0, 0); }
`

// Quay đầu lúc đang ở ngoài khung (cùng chu kỳ với travel)
const face = keyframes`
  0%, 49.9% { transform: scaleX(1); }
  50%, 100% { transform: scaleX(-1); }
`

const bump = keyframes`
  0%, 100% { transform: translateY(0); }
  50%      { transform: translateY(-1px); }
`

const beacon = keyframes`
  0%, 100% { opacity: 1; }
  50%      { opacity: 0.2; }
`

function ForkliftSvg() {
  return (
    <svg viewBox="0 0 120 84" width={WIDTH} height={HEIGHT}>
      <g className="forklift-body">
        {/* Khung bảo vệ đầu tài xế */}
        <rect x="26" y="11" width="44" height="5" rx="1.5" fill={INK} />
        <path d="M31 16 V48 M65 16 V48" stroke={INK} strokeWidth="3" />
        {/* Đèn xoay trên nóc */}
        <circle className="forklift-beacon" cx="48" cy="7" r="4" fill={C.orange} stroke={INK} strokeWidth="1.5" />
        {/* Tài xế: mũ bảo hộ + áo xanh */}
        <rect x="42" y="31" width="13" height="16" rx="3" fill={C.blue} />
        <circle cx="48.5" cy="26" r="5.5" fill={C.skin} />
        <path d="M42.5 25 a6 6 0 0 1 12 0 Z" fill={C.yellow} stroke={INK} strokeWidth="1.2" />
        {/* Đối trọng + thân xe */}
        <rect x="6" y="34" width="24" height="22" rx="6" fill={C.yellow} stroke={INK} strokeWidth="2.5" />
        <rect x="10" y="46" width="78" height="20" rx="5" fill={C.yellow} stroke={INK} strokeWidth="2.5" />
        <rect x="14" y="52" width="16" height="4" rx="2" fill={INK} opacity="0.25" />
        {/* Cột nâng + càng */}
        <rect x="88" y="6" width="6" height="62" rx="1.5" fill={C.midSteel} stroke={INK} strokeWidth="2" />
        <rect x="93" y="42" width="4" height="26" fill={INK} />
        <rect x="93" y="64" width="25" height="4" rx="1" fill={INK} />
        {/* Pallet + thùng hàng */}
        <rect x="95" y="58" width="23" height="6" fill="#a9743f" stroke={INK} strokeWidth="1.5" />
        <rect x="96" y="38" width="21" height="20" rx="1.5" fill={C.carton} stroke={INK} strokeWidth="2" />
        <rect x="104" y="38" width="5" height="20" fill="rgba(255, 238, 205, 0.55)" />
      </g>
      {/* Bánh xe */}
      {[28, 74].map((cx) => (
        <g key={cx}>
          <circle cx={cx} cy="72" r="11" fill={INK} />
          <circle cx={cx} cy="72" r="4.5" fill={C.steel} />
        </g>
      ))}
    </svg>
  )
}

export function UserHomeForklift({ horizon, dark }: { horizon: number; dark: boolean }) {
  return (
    <Box
      sx={{
        position: 'absolute',
        left: 0,
        width: '100%',
        // Bánh xe chạm sàn ngay dưới chân tường
        top: `calc(${horizon}% - ${HEIGHT - 12}px)`,
        height: HEIGHT,
        opacity: dark ? 0.82 : 0.92,
        animation: `${travel} ${CYCLE}s linear infinite`,
        '@media (prefers-reduced-motion: reduce)': { display: 'none' },
      }}
    >
      <Box
        sx={{
          position: 'relative',
          width: WIDTH,
          height: HEIGHT,
          animation: `${face} ${CYCLE}s linear infinite`,
          '& .forklift-body': { animation: `${bump} 0.5s ease-in-out infinite` },
          '& .forklift-beacon': { animation: `${beacon} 0.8s steps(1, end) infinite` },
        }}
      >
        {/* Bóng dưới gầm */}
        <Box sx={{ position: 'absolute', left: 6, right: 6, bottom: -3, height: 8, borderRadius: '50%', bgcolor: 'rgba(0, 0, 0, 0.22)', filter: 'blur(3px)' }} />
        <Box sx={{ position: 'relative' }}>
          <ForkliftSvg />
        </Box>
      </Box>
    </Box>
  )
}
