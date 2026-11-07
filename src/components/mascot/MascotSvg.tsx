import styles from './Mascot.module.css'

// Tọa độ các lọn tóc xoăn: mái dưới vành mũ + hai bên thái dương
const FRINGE_X = [57, 64, 71, 78, 85, 92, 99]
const TEMPLES: [number, number][] = [
  [51, 64], [49, 70], [50, 76],
  [109, 64], [111, 70], [110, 76],
]

/** viewBox đầy đủ (giữ tỉ lệ 160:200) và viewBox cắt phần đầu cho avatar thu nhỏ */
export const MASCOT_VIEWBOX = { width: 160, height: 200 }
const FULL_VIEWBOX = `0 0 ${MASCOT_VIEWBOX.width} ${MASCOT_VIEWBOX.height}`
const HEAD_VIEWBOX = '38 24 84 84'

interface MascotSvgProps {
  waving: boolean
  /** chỉ hiện phần đầu – dùng cho avatar khi thu nhỏ */
  headOnly?: boolean
  className?: string
}

export function MascotSvg({ waving, headOnly = false, className }: MascotSvgProps) {
  return (
    <svg
      className={className}
      viewBox={headOnly ? HEAD_VIEWBOX : FULL_VIEWBOX}
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      focusable="false"
    >
      {/* ---- Chân + ủng ---- */}
      <rect x="58" y="160" width="19" height="28" rx="4" fill="#185FA5" />
      <rect x="83" y="160" width="19" height="28" rx="4" fill="#185FA5" />
      <rect x="54" y="184" width="25" height="10" rx="5" fill="#4A3A2A" />
      <rect x="81" y="184" width="25" height="10" rx="5" fill="#4A3A2A" />

      {/* ---- Tay trái buông ---- */}
      <line x1="58" y1="110" x2="47" y2="146" stroke="#378ADD" strokeWidth="12" strokeLinecap="round" />
      <circle cx="46" cy="152" r="6.5" fill="#F0C9A4" />

      {/* ---- Thân: áo + quần yếm ---- */}
      <rect x="54" y="100" width="52" height="58" rx="14" fill="#378ADD" />
      <path d="M54 146 H106 V164 Q106 168 102 168 H58 Q54 168 54 164 Z" fill="#185FA5" />
      <rect x="64" y="120" width="32" height="34" rx="4" fill="#185FA5" />
      <rect x="72" y="128" width="16" height="10" rx="2" fill="#134C86" />
      {/* dây đeo cam */}
      <path d="M62 102 L67 122" stroke="#E8732A" strokeWidth="5" strokeLinecap="round" />
      <path d="M98 102 L93 122" stroke="#E8732A" strokeWidth="5" strokeLinecap="round" />
      <circle cx="67" cy="123" r="2.4" fill="#FCE7B5" />
      <circle cx="93" cy="123" r="2.4" fill="#FCE7B5" />

      {/* ---- Tay phải giơ lên (vẫy) ---- */}
      <g className={`${styles.arm} ${waving ? styles.waving : ''}`}>
        <line x1="102" y1="110" x2="122" y2="80" stroke="#378ADD" strokeWidth="12" strokeLinecap="round" />
        <circle cx="125" cy="74" r="6.5" fill="#F0C9A4" />
      </g>

      {/* ---- Cổ + đầu ---- */}
      <rect x="73" y="92" width="14" height="12" rx="3" fill="#E4B48C" />
      <circle cx="80" cy="68" r="30" fill="#F0C9A4" />

      {/* tóc xoăn: mái + thái dương */}
      <g fill="#412402">
        {FRINGE_X.map((x, i) => (
          <circle key={x} cx={x} cy={i % 2 ? 62 : 63.5} r="4.6" />
        ))}
        {TEMPLES.map(([x, y]) => (
          <circle key={`${x}-${y}`} cx={x} cy={y} r="4.2" />
        ))}
      </g>

      {/* râu quai nón ngắn theo viền hàm */}
      <path
        d="M52.9 72.8 A27.5 27.5 0 0 0 107.1 72.8"
        fill="none"
        stroke="#633806"
        strokeWidth="5"
        strokeLinecap="round"
      />

      {/* lông mày */}
      <path d="M64 67 Q69.5 63.5 75 66.5" fill="none" stroke="#412402" strokeWidth="2.2" strokeLinecap="round" />
      <path d="M85 66.5 Q90.5 63.5 96 67" fill="none" stroke="#412402" strokeWidth="2.2" strokeLinecap="round" />

      {/* mắt (chớp) */}
      <g className={styles.eyes} fill="#2B1A0E">
        <circle cx="70" cy="73" r="2.6" />
        <circle cx="90" cy="73" r="2.6" />
      </g>

      {/* má hồng + mũi */}
      <ellipse cx="62.5" cy="80" rx="4.2" ry="2.6" fill="#F29A92" opacity="0.55" />
      <ellipse cx="97.5" cy="80" rx="4.2" ry="2.6" fill="#F29A92" opacity="0.55" />
      <ellipse cx="80" cy="78.5" rx="2.2" ry="1.7" fill="#DDA27A" />

      {/* ria mép mỏng + miệng cười */}
      <path d="M72 82.6 Q76 80.4 80 82 Q84 80.4 88 82.6" fill="none" stroke="#633806" strokeWidth="2" strokeLinecap="round" />
      <path d="M73.5 86 Q80 92.5 86.5 86" fill="none" stroke="#8A3B1F" strokeWidth="2" strokeLinecap="round" />

      {/* ---- Mũ bảo hộ ---- */}
      <path d="M48 58 A32 32 0 0 1 112 58 Z" fill="#EF9F27" />
      <path d="M76 28.5 Q80 27 84 28.5 L85 57 H75 Z" fill="#F7B955" />
      <rect x="42" y="55" width="76" height="7" rx="3.5" fill="#BA7517" />
    </svg>
  )
}
