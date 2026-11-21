import { Box } from '@mui/material'
import { keyframes } from '@mui/material/styles'

import { LogoBlocks, MisumiWordmark } from './MisumiLogo'

/*
 * Xe tự hành AMR của xưởng (vẽ theo ảnh xe thật), nhìn nghiêng, đầu xe quay sang phải:
 * thân xanh da trời bo góc, mặt nâng đen chìa ra ngoài + viền bạc, đế cản đen sát sàn,
 * bánh xe vành cam lộ ở hông, đèn LED trắng góc trước, nút dừng khẩn đỏ, đèn trạng thái xanh, nhãn MiSUMi.
 * Trên mặt nâng chở kệ thép 2 tầng, mỗi tầng 3 thùng nhựa xanh.
 * Chạy dọc sàn sát chân tường (phía sau kệ, phía trước máy): sang phải, dừng ngoài khung, quay đầu chạy về.
 * Chỉ animate transform / opacity; ẩn khi bật giảm chuyển động.
 */
// Khung hình: thân xe 0..70, kệ thùng phía trên tới y = TOP (âm)
const TOP = -46
const VB = { w: 130, h: 70 - TOP }
const CYCLE = 36
// Mép trên thùng nhựa mỗi tầng kệ (tầng dưới đứng trên mặt y = 15, tầng trên trên mặt y = -12)
const TOTE_ROWS = [-6, -33]

// % trong translate = bề rộng lớp ngoài = cả khung nền
const travel = keyframes`
  0%   { transform: translate3d(-140px, 0, 0); }
  42%  { transform: translate3d(calc(100% + 40px), 0, 0); }
  50%  { transform: translate3d(calc(100% + 40px), 0, 0); }
  92%  { transform: translate3d(-140px, 0, 0); }
  100% { transform: translate3d(-140px, 0, 0); }
`

// Quay đầu lúc đang ở ngoài khung (cùng chu kỳ với travel)
const face = keyframes`
  0%, 49.9% { transform: scaleX(1); }
  50%, 100% { transform: scaleX(-1); }
`

const bump = keyframes`
  0%, 100% { transform: translateY(0); }
  50%      { transform: translateY(-0.5px); }
`

const spin = keyframes`
  from { transform: rotate(0deg); }
  to   { transform: rotate(360deg); }
`

const statusBlink = keyframes`
  0%, 100% { opacity: 1; }
  50%      { opacity: 0.3; }
`

function AmrSvg() {
  return (
    <svg viewBox={`0 ${TOP} ${VB.w} ${VB.h}`} width="100%" style={{ display: 'block', overflow: 'visible' }}>
      <defs>
        <linearGradient id="amr-body" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#6cc4f5" />
          <stop offset="0.55" stopColor="#3a9fe2" />
          <stop offset="1" stopColor="#2a86c9" />
        </linearGradient>
        <linearGradient id="amr-deck" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#3a3e44" />
          <stop offset="1" stopColor="#1c1f23" />
        </linearGradient>
        <linearGradient id="amr-tote" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#4a8bd0" />
          <stop offset="1" stopColor="#1f4f86" />
        </linearGradient>
        <linearGradient id="amr-steel" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#d6dce2" />
          <stop offset="1" stopColor="#7f8994" />
        </linearGradient>
        <radialGradient id="amr-headlight" cx="0.5" cy="0.5" r="0.5">
          <stop offset="0" stopColor="#ffffff" stopOpacity="0.55" />
          <stop offset="1" stopColor="#ffffff" stopOpacity="0" />
        </radialGradient>
        <filter id="amr-glow" x="-50%" y="-200%" width="200%" height="500%">
          <feGaussianBlur stdDeviation="1.6" />
        </filter>
      </defs>

      {/* Bóng dưới gầm + ánh đèn trắng hắt xuống sàn phía trước */}
      <ellipse cx={64} cy={66} rx={60} ry={3.5} fill="rgba(0, 0, 0, 0.38)" />
      <ellipse cx={126} cy={66} rx={12} ry={3} fill="url(#amr-headlight)" />

      <g className="amr-body">
        {/* Đế cản đen sát sàn */}
        <rect x={5} y={56} width={118} height={8} rx={3.5} fill="#15181c" />

        {/* Thân xe xanh, mặt trước hơi tối */}
        <rect x={9} y={29} width={110} height={30} rx={7} fill="url(#amr-body)" />
        <rect x={110} y={31} width={9} height={26} rx={4} fill="#000" opacity={0.1} />
        <rect x={12} y={31} width={104} height={2} rx={1} fill="#ffffff" opacity={0.35} />

        {/* Cụm nâng + mặt nâng đen chìa ra ngoài, viền bạc */}
        <rect x={34} y={26} width={64} height={4} fill="#14171a" />
        <rect x={3} y={19} width={121} height={8} rx={4} fill="url(#amr-deck)" />
        <rect x={5} y={25.5} width={117} height={1.6} rx={0.8} fill="#aeb5bd" />

        {/* Kệ thép 2 tầng đặt trên mặt nâng, mỗi tầng 3 thùng nhựa xanh */}
        <g>
          {[8, 117].map((x) => (
            <rect key={x} x={x} y={-42} width={3.2} height={61} rx={0.8} fill="url(#amr-steel)" />
          ))}
          {TOTE_ROWS.map((rowTop) => [12, 46, 80].map((x) => (
            <g key={`${rowTop}-${x}`}>
              <rect x={x} y={rowTop} width={33} height={21} rx={1.5} fill="url(#amr-tote)" />
              <rect x={x} y={rowTop} width={33} height={2.4} rx={1} fill="#ffffff" opacity={0.35} />
              <rect x={x + 9} y={rowTop + 5} width={15} height={3.6} rx={1.8} fill="#000" opacity={0.35} />
              <rect x={x + 11} y={rowTop + 11} width={11} height={6} rx={0.6} fill="#ffffff" opacity={0.85} />
              <rect x={x} y={rowTop + 19} width={33} height={2} fill="#000" opacity={0.18} />
            </g>
          )))}
          {/* Mặt kệ: đáy, giữa, khung nóc */}
          {[15, -12, -42].map((y) => (
            <rect key={y} x={6} y={y} width={116} height={3.2} rx={0.8} fill="url(#amr-steel)" />
          ))}
        </g>

        {/* Nhãn MiSUMi ở hông (tự lật ngược lại khi xe quay đầu để chữ luôn đọc xuôi) */}
        <g className="amr-label">
          {/* Cùng logo + chữ MiSUMi với băng rôn */}
          <rect x={25} y={35.5} width={46} height={17} rx={1.5} fill="#ffffff" stroke="#1f6fae" strokeWidth={0.5} />
          <g transform="translate(27.5 38) scale(0.16)">
            <LogoBlocks />
          </g>
          <MisumiWordmark x={41} y={47.4} size={7.6} />
        </g>

        {/* Ô cửa kiểm tra + nhãn cảnh báo nhỏ phía sau */}
        <rect x={12} y={37} width={10} height={14} rx={1.5} fill="none" stroke="#1f6fae" strokeWidth={0.8} />
        <rect x={14} y={40} width={6} height={3} fill="#ffffff" opacity={0.8} />

        {/* Nút dừng khẩn đỏ + đèn trạng thái xanh ở đầu xe */}
        <circle cx={111} cy={39} r={4.6} fill="#2a2d31" />
        <circle cx={111} cy={38.6} r={3.4} fill="#e0322f" />
        <circle cx={110} cy={37.6} r={1.1} fill="#ffffff" opacity={0.5} />
        <circle className="amr-status" cx={111} cy={47} r={1.4} fill="#3cff7a" />
        <circle cx={111} cy={51} r={1.4} fill="#1d2127" />

        {/* Đèn LED trắng góc trước */}
        <rect x={98} y={53} width={22} height={3.6} rx={1.8} fill="#ffffff" filter="url(#amr-glow)" opacity={0.9} />
        <rect x={99} y={53.6} width={20} height={2.4} rx={1.2} fill="#ffffff" />
      </g>

      {/* Hốc bánh + bánh xe vành cam (có nan để thấy quay) */}
      <rect x={72} y={43} width={22} height={16} rx={6} fill="#1a1d21" />
      <g className="amr-wheel">
        <circle cx={83} cy={54} r={8} fill="#2a2d31" />
        <circle cx={83} cy={54} r={6.2} fill="#e3a12b" />
        <circle cx={83} cy={54} r={4.4} fill="#c9ced3" />
        <rect x={82.4} y={49.8} width={1.2} height={8.4} fill="#7d858e" />
        <rect x={78.8} y={53.4} width={8.4} height={1.2} fill="#7d858e" />
      </g>
    </svg>
  )
}

export function UserHomeAmr({ horizon, dark }: { horizon: number; dark: boolean }) {
  return (
    <Box
      sx={{
        position: 'absolute',
        left: 0,
        width: '100%',
        // Chạy trên sàn, nhích ra trước chân máy một chút
        bottom: `calc(${100 - horizon}% - 18px)`,
        animation: `${travel} ${CYCLE}s linear infinite`,
        filter: dark ? 'brightness(0.94) sepia(0.08)' : 'none',
        '@media (prefers-reduced-motion: reduce)': { display: 'none' },
      }}
    >
      <Box
        sx={{
          // Xe + kệ thùng cao ~2/3 máy CNC phía sau
          width: 'clamp(64px, 5.4%, 104px)',
          animation: `${face} ${CYCLE}s linear infinite`,
          '& .amr-body': { animation: `${bump} 0.5s ease-in-out infinite` },
          '& .amr-wheel': { transformBox: 'fill-box', transformOrigin: 'center', animation: `${spin} 1.1s linear infinite` },
          '& .amr-status': { animation: `${statusBlink} 1.6s ease-in-out infinite` },
          '& .amr-label': { transformBox: 'fill-box', transformOrigin: 'center', animation: `${face} ${CYCLE}s linear infinite` },
        }}
      >
        <AmrSvg />
      </Box>
    </Box>
  )
}
