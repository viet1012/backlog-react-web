import styles from './Mascot.module.css'
import { useMascotSkin } from './mascotContext'
import { shade } from './mascotSkin'
import type { MascotHat, MascotSkin } from './mascotSkin'

// Tọa độ các lọn tóc xoăn: mái dưới vành mũ + hai bên thái dương
const FRINGE_X = [57, 64, 71, 78, 85, 92, 99]
const TEMPLES: [number, number][] = [
  [51, 64], [49, 70], [50, 76],
  [109, 64], [111, 70], [110, 76],
]
/** không đội mũ → thêm lọn xoăn trên đỉnh đầu */
const CROWN: [number, number][] = [
  [62, 47], [71, 43], [80, 41.5], [89, 43], [98, 47], [56, 54], [104, 54], [67, 51], [80, 49], [93, 51],
]

/** viewBox đầy đủ (giữ tỉ lệ 160:200) và viewBox cắt phần đầu cho avatar thu nhỏ */
export const MASCOT_VIEWBOX = { width: 160, height: 200 }
const FULL_VIEWBOX = `0 0 ${MASCOT_VIEWBOX.width} ${MASCOT_VIEWBOX.height}`
const HEAD_VIEWBOX = '38 24 84 84'

/** idle: cười · thinking: mắt liếc lên, miệng chữ "o", chấm suy nghĩ · sad: lông mày chau, miệng mếu */
export type MascotMood = 'idle' | 'thinking' | 'sad'

interface MascotSvgProps {
  waving: boolean
  /** chỉ hiện phần đầu – dùng cho avatar khi thu nhỏ */
  headOnly?: boolean
  mood?: MascotMood
  /** skin xem trước (Phòng thay đồ); bỏ trống → skin đang áp dụng */
  skin?: MascotSkin
  className?: string
}

export function MascotSvg({ waving, headOnly = false, mood = 'idle', skin: skinProp, className }: MascotSvgProps) {
  const appliedSkin = useMascotSkin()
  const skin = skinProp ?? appliedSkin
  const thinking = mood === 'thinking'
  const sad = mood === 'sad'

  const pocket = shade(skin.overallColor, -0.2)
  const neck = shade(skin.skinTone, -0.07)
  const nose = shade(skin.skinTone, -0.12)
  const beard = shade(skin.hairColor, 0.12)

  return (
    <svg
      className={className}
      viewBox={headOnly ? HEAD_VIEWBOX : FULL_VIEWBOX}
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      focusable="false"
    >
      {/* ---- Chân + ủng ---- */}
      <rect x="58" y="160" width="19" height="28" rx="4" fill={skin.overallColor} />
      <rect x="83" y="160" width="19" height="28" rx="4" fill={skin.overallColor} />
      <rect x="54" y="184" width="25" height="10" rx="5" fill="#4A3A2A" />
      <rect x="81" y="184" width="25" height="10" rx="5" fill="#4A3A2A" />

      {/* ---- Tay trái buông ---- */}
      <line x1="58" y1="110" x2="47" y2="146" stroke={skin.shirtColor} strokeWidth="12" strokeLinecap="round" />
      <circle cx="46" cy="152" r="6.5" fill={skin.skinTone} />

      {/* ---- Thân: áo + quần yếm ---- */}
      <rect x="54" y="100" width="52" height="58" rx="14" fill={skin.shirtColor} />
      <path d="M54 146 H106 V164 Q106 168 102 168 H58 Q54 168 54 164 Z" fill={skin.overallColor} />
      <rect x="64" y="120" width="32" height="34" rx="4" fill={skin.overallColor} />
      <rect x="72" y="128" width="16" height="10" rx="2" fill={pocket} />
      {/* dây đeo */}
      <path d="M62 102 L67 122" stroke={skin.strapColor} strokeWidth="5" strokeLinecap="round" />
      <path d="M98 102 L93 122" stroke={skin.strapColor} strokeWidth="5" strokeLinecap="round" />
      <circle cx="67" cy="123" r="2.4" fill="#FCE7B5" />
      <circle cx="93" cy="123" r="2.4" fill="#FCE7B5" />

      {/* ---- Tay phải giơ lên (vẫy) ---- */}
      <g className={`${styles.arm} ${waving ? styles.waving : ''}`}>
        <line x1="102" y1="110" x2="122" y2="80" stroke={skin.shirtColor} strokeWidth="12" strokeLinecap="round" />
        <circle cx="125" cy="74" r="6.5" fill={skin.skinTone} />
      </g>

      {/* ---- Cổ + đầu ---- */}
      <rect x="73" y="92" width="14" height="12" rx="3" fill={neck} />
      <circle cx="80" cy="68" r="30" fill={skin.skinTone} />

      {/* tóc xoăn: mái + thái dương (+ đỉnh đầu khi không đội mũ) */}
      <g fill={skin.hairColor}>
        {skin.hat === 'none' && (
          <>
            <path d="M51 62 A29.5 29.5 0 0 1 109 62 Q96 54 80 54 Q64 54 51 62 Z" />
            {CROWN.map(([x, y]) => (
              <circle key={`c-${x}-${y}`} cx={x} cy={y} r="5" />
            ))}
          </>
        )}
        {FRINGE_X.map((x, i) => (
          <circle key={x} cx={x} cy={i % 2 ? 62 : 63.5} r="4.6" />
        ))}
        {TEMPLES.map(([x, y]) => (
          <circle key={`${x}-${y}`} cx={x} cy={y} r="4.2" />
        ))}
      </g>

      {/* râu quai nón ngắn theo viền hàm */}
      {skin.beard && (
        <path
          d="M52.9 72.8 A27.5 27.5 0 0 0 107.1 72.8"
          fill="none"
          stroke={beard}
          strokeWidth="5"
          strokeLinecap="round"
        />
      )}

      {/* lông mày: buồn → đầu trong nhướng lên; suy nghĩ → một bên nhướng */}
      <path
        d={sad ? 'M64 67.5 Q69.5 66 75 63.5' : 'M64 67 Q69.5 63.5 75 66.5'}
        fill="none"
        stroke={skin.hairColor}
        strokeWidth="2.2"
        strokeLinecap="round"
      />
      <path
        d={sad ? 'M85 63.5 Q90.5 66 96 67.5' : thinking ? 'M85 64.5 Q90.5 61 96 64' : 'M85 66.5 Q90.5 63.5 96 67'}
        fill="none"
        stroke={skin.hairColor}
        strokeWidth="2.2"
        strokeLinecap="round"
      />

      {/* mắt (chớp); suy nghĩ → liếc lên phải */}
      <g transform={thinking ? 'translate(1.6 -1.6)' : undefined}>
        <g className={styles.eyes} fill="#2B1A0E">
          <circle cx="70" cy="73" r="2.6" />
          <circle cx="90" cy="73" r="2.6" />
        </g>
      </g>

      {/* kính */}
      {skin.glasses === 'round' && (
        <g fill="#ffffff" fillOpacity="0.18" stroke="#2B2B2B" strokeWidth="1.8">
          <circle cx="70" cy="73" r="6.2" />
          <circle cx="90" cy="73" r="6.2" />
          <path d="M76.2 72.5 Q80 70.5 83.8 72.5" fill="none" />
          <path d="M63.8 72 L54 70" fill="none" />
          <path d="M96.2 72 L106 70" fill="none" />
        </g>
      )}
      {skin.glasses === 'sunglasses' && (
        <g>
          <path d="M62 69 H77.5 V74 Q77.5 79.5 71 79.5 H68 Q62 79.5 62 74 Z" fill="#1D1F24" />
          <path d="M82.5 69 H98 V74 Q98 79.5 92 79.5 H89 Q82.5 79.5 82.5 74 Z" fill="#1D1F24" />
          <path d="M77.5 70.5 Q80 69 82.5 70.5" fill="none" stroke="#1D1F24" strokeWidth="1.8" />
          <path d="M62 70 L53 68.5 M98 70 L107 68.5" stroke="#1D1F24" strokeWidth="1.8" strokeLinecap="round" />
          <path d="M65 71.5 L69 71.5 M85.5 71.5 L89.5 71.5" stroke="#ffffff" strokeOpacity="0.55" strokeWidth="1.4" strokeLinecap="round" />
        </g>
      )}

      {/* má hồng + mũi */}
      <ellipse cx="62.5" cy="80" rx="4.2" ry="2.6" fill="#F29A92" opacity="0.55" />
      <ellipse cx="97.5" cy="80" rx="4.2" ry="2.6" fill="#F29A92" opacity="0.55" />
      <ellipse cx="80" cy="78.5" rx="2.2" ry="1.7" fill={nose} />

      {/* ria mép mỏng (đi cùng râu) + miệng */}
      {skin.beard && (
        <path d="M72 82.6 Q76 80.4 80 82 Q84 80.4 88 82.6" fill="none" stroke={beard} strokeWidth="2" strokeLinecap="round" />
      )}
      {thinking
        ? <ellipse cx="82" cy="87.5" rx="2.4" ry="2.1" fill="#8A3B1F" />
        : (
          <path
            d={sad ? 'M74 89.5 Q80 84.5 86 89.5' : 'M73.5 86 Q80 92.5 86.5 86'}
            fill="none"
            stroke="#8A3B1F"
            strokeWidth="2"
            strokeLinecap="round"
          />
        )}

      {/* ---- Mũ ---- */}
      <Hat hat={skin.hat} color={skin.hatColor} />

      {/* buồn: giọt mồ hôi bên thái dương */}
      {sad && (
        <path
          className={styles.sweat}
          d="M108 70 Q104.5 75.5 106.2 78 Q108 80 109.8 78 Q111.5 75.5 108 70 Z"
          fill="#8EC5F4"
          stroke="#5A9BD8"
          strokeWidth="0.8"
        />
      )}

      {/* suy nghĩ: 3 chấm bong bóng suy nghĩ phía trên phải đầu (không hiện ở avatar) */}
      {thinking && !headOnly && (
        // nền xanh nhạt + viền xanh đậm → nổi rõ trên nền trang trắng lẫn tối
        <g fill="#E3F0FC" stroke="#378ADD" strokeWidth="1.6">
          <circle className={styles.thoughtDot} cx="114" cy="42" r="2.8" />
          <circle className={styles.thoughtDot} cx="122" cy="32" r="4" style={{ animationDelay: '0.2s' }} />
          {/* bong bóng lớn có "…" bên trong */}
          <g className={styles.thoughtDot} style={{ animationDelay: '0.4s' }}>
            <ellipse cx="139" cy="15" rx="13" ry="9.5" />
            <g fill="#378ADD" stroke="none">
              <circle cx="133.5" cy="15" r="1.7" />
              <circle cx="139" cy="15" r="1.7" />
              <circle cx="144.5" cy="15" r="1.7" />
            </g>
          </g>
        </g>
      )}
    </svg>
  )
}

function Hat({ hat, color }: { hat: MascotHat; color: string }) {
  if (hat === 'helmet') {
    // mũ bảo hộ: vòm + gờ sáng ở giữa + vành
    return (
      <g>
        <path d="M48 58 A32 32 0 0 1 112 58 Z" fill={color} />
        <path d="M76 28.5 Q80 27 84 28.5 L85 57 H75 Z" fill={shade(color, 0.3)} />
        <rect x="42" y="55" width="76" height="7" rx="3.5" fill={shade(color, -0.3)} />
      </g>
    )
  }
  if (hat === 'cap') {
    // mũ lưỡi trai: vòm + nút trên đỉnh + lưỡi trai chìa sang phải
    return (
      <g>
        <path d="M100 57 Q124 54.5 133 60.5 Q130 64 120 63.5 L100 62.5 Z" fill={shade(color, -0.25)} />
        <path d="M49 60 A31 31 0 0 1 111 60 Z" fill={color} />
        <path d="M80 29 V60" stroke={shade(color, -0.15)} strokeWidth="1.4" />
        <path d="M64 33.5 Q70 45 70 60 M96 33.5 Q90 45 90 60" fill="none" stroke={shade(color, -0.15)} strokeWidth="1.2" />
        <circle cx="80" cy="29.5" r="3" fill={shade(color, -0.2)} />
        <rect x="48" y="56.5" width="64" height="5" rx="2.5" fill={shade(color, -0.12)} />
      </g>
    )
  }
  if (hat === 'beanie') {
    // mũ len: vòm + gấu gập có sọc len + quả bông trên đỉnh
    const cuff = shade(color, -0.15)
    return (
      <g>
        <circle cx="80" cy="27" r="7.5" fill={shade(color, 0.4)} />
        <path d="M50 60 A30 32 0 0 1 110 60 Z" fill={color} />
        <rect x="46" y="53" width="68" height="11" rx="5.5" fill={cuff} />
        <g stroke={shade(color, -0.3)} strokeWidth="1.1" strokeLinecap="round">
          {[54, 62, 70, 78, 86, 94, 102].map((x) => (
            <path key={x} d={`M${x} 55.5 V61.5`} />
          ))}
        </g>
      </g>
    )
  }
  return null
}
