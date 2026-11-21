import { memo } from 'react'

import { Box } from '@mui/material'

import { getFloorTextures } from './floorTextures'
import { CEILING_TILE, ceilingTile, getHomePalette, HOME_CONTENT_WIDTH, noiseTexture } from './userHomeStyles'
import { UserHomeAmr } from './wall/UserHomeAmr'
import { UserHomeMachines } from './wall/UserHomeMachines'
import { UserHomeWallSigns } from './wall/UserHomeWallSigns'

/*
 * Nền xưởng vẽ bằng CSS + SVG theo ảnh xưởng thật. Trần / tường / sàn đứng yên; chỉ "người và xe"
 * chuyển động (AMR chạy dọc sàn, công nhân làm việc ở máy), đều tắt khi bật giảm chuyển động.
 * Lớp từ sau ra trước:
 *   trần bê tông màu be nghiêng phối cảnh, hàng đèn tuýp + máng cáp hút về phía xa
 *   -> tường sơn trắng ngà, ống gió + máng cáp dọc mép trần, cửa cuốn xanh xám, chân tường xám
 *   -> cột bê tông trắng quấn sọc vàng đen + băng rôn -> máy móc hai bên kệ
 *   -> sàn epoxy xám đậm, vạch vàng hai bên, đèn phản chiếu.
 * Chân tường đặt theo tầm mắt camera của kệ 3D (prop horizon) để kệ và xưởng cùng phối cảnh.
 */

// Mép trần giáp tường, % chiều cao (tối đa; chân tường cao lên thì trần thu lại để tường đủ cao)
const WALL_TOP_MAX = 26
const MIN_WALL = 20
// Ô mạch cắt sàn (px trên mặt sàn trước khi nghiêng)
const SLAB = 220
// Vị trí vệt đèn phản chiếu trên sàn (% bề ngang)
const REFLECTIONS = [10, 27, 44, 56, 73, 90]
// Cửa cuốn sát mép kệ: lấn vào sau kệ ngần này px, phần trên nhô cao hơn máy
const SHUTTER_TUCK = 40

// Độ đậm trung bình của lớp nhiễu ~ alpha / 2
const GRAIN = noiseTexture(0.85, 0.16, 160)
const BLOTCH = noiseTexture(0.012, 0.3, 520, 3)

interface UserHomeBackdropProps {
  dark: boolean
  // Chân tường (% chiều cao khung) = tầm mắt camera kệ 3D, để sàn / trần hút về cùng điểm tụ với kệ
  horizon: number
}

function Shutter({ side, dark, horizon, wallTop }: { side: 'left' | 'right'; dark: boolean; horizon: number; wallTop: number }) {
  const p = getHomePalette(dark)
  const inner = HOME_CONTENT_WIDTH / 2 - SHUTTER_TUCK

  return (
    <Box
      sx={{
        position: 'absolute',
        bottom: `${100 - horizon}%`,
        [side === 'left' ? 'right' : 'left']: `calc(50% + ${inner}px)`,
        width: 'clamp(170px, 16%, 260px)',
        height: `${(horizon - wallTop) * 0.78}%`,
        // Ray dẫn 2 bên + hộp cuốn phía trên
        borderLeft: `5px solid ${p.duct}`,
        borderRight: `5px solid ${p.duct}`,
        background: [
          `linear-gradient(180deg, ${p.duct} 0 14px, rgba(0, 0, 0, 0.25) 14px 17px, transparent 17px)`,
          `repeating-linear-gradient(180deg, transparent 0 7px, ${p.shutterSlat} 7px 9px)`,
          `linear-gradient(90deg, rgba(0, 0, 0, 0.08) 0%, transparent 30%, rgba(255, 255, 255, 0.08) 60%, rgba(0, 0, 0, 0.1) 100%)`,
          `linear-gradient(180deg, ${p.shutter} 0%, ${p.shutter} 100%)`,
        ].join(', '),
        boxShadow: 'inset 0 -6px 0 rgba(0, 0, 0, 0.25)',
      }}
    />
  )
}

export const UserHomeBackdrop = memo(function UserHomeBackdrop({ dark, horizon }: UserHomeBackdropProps) {
  const p = getHomePalette(dark)
  const wallTop = Math.min(WALL_TOP_MAX, horizon - MIN_WALL)
  const floor = getFloorTextures(dark)
  // Gờ sáng cạnh mạch cắt (mép bê tông bị mẻ, bắt sáng)
  const jointLip = dark ? 'rgba(255, 255, 255, 0.04)' : 'rgba(255, 255, 255, 0.12)'

  return (
    <Box
      aria-hidden
      sx={{
        position: 'absolute',
        inset: 0,
        zIndex: 0,
        overflow: 'hidden',
        pointerEvents: 'none',
        // Băng rôn hai bên chỉ hiện khi khung đủ rộng (container query theo khung này)
        containerType: 'inline-size',
        background: `linear-gradient(180deg, ${p.wallTop} ${wallTop}%, ${p.wallLow} ${horizon}%, ${p.floorFar} ${horizon}%)`,
      }}
    >
      {/* Trần: mặt phẳng nghiêng (hút về mép tường), đèn tuýp + máng cáp lát lặp */}
      <Box
        sx={{
          position: 'absolute',
          left: 0,
          right: 0,
          top: 0,
          height: `${wallTop}%`,
          overflow: 'hidden',
          background: `linear-gradient(180deg, ${p.ceilingNear} 0%, ${p.ceilingFar} 100%)`,
        }}
      >
        <Box sx={{ position: 'absolute', inset: 0, perspective: '380px', perspectiveOrigin: '50% 100%' }}>
          <Box
            sx={{
              position: 'absolute',
              left: '-60%',
              right: '-60%',
              bottom: 0,
              height: '320%',
              transformOrigin: 'bottom center',
              transform: 'rotateX(-72deg)',
              backgroundImage: [ceilingTile(p), BLOTCH].join(', '),
              backgroundSize: `${CEILING_TILE.width}px ${CEILING_TILE.height}px, 520px 520px`,
              backgroundPosition: 'center bottom, 0 0',
            }}
          />
        </Box>
        {/* Phía xa dày đèn nên rực hơn: CỘNG sáng (screen), không phủ màu đè làm tắt đèn */}
        <Box
          sx={{
            position: 'absolute',
            inset: 0,
            background: `linear-gradient(180deg, transparent 35%, ${p.tubeGlow} 100%)`,
            opacity: 0.45,
            mixBlendMode: 'screen',
          }}
        />
      </Box>

      {/* Tường sơn: hạt sơn, tối dần xuống chân tường */}
      <Box
        sx={{
          position: 'absolute',
          left: 0,
          right: 0,
          top: `${wallTop}%`,
          bottom: `${100 - horizon}%`,
          backgroundImage: [GRAIN, `linear-gradient(180deg, transparent 55%, ${p.wallFoot} 160%)`].join(', '),
          backgroundSize: '160px 160px, auto',
        }}
      />
      {/* Ánh đèn trần hắt xuống phần trên tường */}
      <Box
        sx={{
          position: 'absolute',
          left: 0,
          right: 0,
          top: `${wallTop}%`,
          height: `${(horizon - wallTop) * 0.6}%`,
          background: `linear-gradient(180deg, ${p.tubeGlow} 0%, transparent 100%)`,
          opacity: dark ? 0.4 : 0.35,
          mixBlendMode: 'screen',
        }}
      />

      {/* Ống gió + máng cáp chạy dọc mép trần */}
      <Box
        sx={{
          position: 'absolute',
          left: 0,
          right: 0,
          top: `${wallTop}%`,
          height: 16,
          background: [
            'repeating-linear-gradient(90deg, rgba(0, 0, 0, 0.18) 0 2px, transparent 2px 120px)',
            `linear-gradient(180deg, rgba(255, 255, 255, 0.35) 0%, transparent 35%, rgba(0, 0, 0, 0.25) 100%)`,
            `linear-gradient(180deg, ${p.duct} 0%, ${p.duct} 100%)`,
          ].join(', '),
          boxShadow: '0 5px 8px rgba(0, 0, 0, 0.18)',
        }}
      />
      <Box
        sx={{
          position: 'absolute',
          left: 0,
          right: 0,
          top: `calc(${wallTop}% + 22px)`,
          height: 5,
          borderTop: `1.5px solid ${p.tray}`,
          borderBottom: `1.5px solid ${p.tray}`,
          background: `repeating-linear-gradient(90deg, ${p.tray} 0 1.5px, transparent 1.5px 9px)`,
          opacity: 0.8,
        }}
      />

      {/* Chân tường */}
      <Box sx={{ position: 'absolute', left: 0, right: 0, bottom: `${100 - horizon}%`, height: '1.4%', bgcolor: p.skirting }} />

      {/* Cửa cuốn xanh xám sát hai mép kệ (chạm sàn, che chân tường) */}
      <Shutter side="left" dark={dark} horizon={horizon} wallTop={wallTop} />
      <Shutter side="right" dark={dark} horizon={horizon} wallTop={wallTop} />

      {/* Cột bê tông + băng rôn An toàn / 5S ở hai bên kệ */}
      <UserHomeWallSigns dark={dark} horizon={horizon} />

      {/* Máy móc ở hai bên kệ, đứng trên chân tường, phía trước cột */}
      <UserHomeMachines horizon={horizon} dark={dark} />

      {/* Sàn epoxy */}
      <Box
        sx={{
          position: 'absolute',
          left: 0,
          right: 0,
          top: `${horizon}%`,
          bottom: 0,
          overflow: 'hidden',
          background: `linear-gradient(180deg, ${p.floorFar} 0%, ${p.floorNear} 100%)`,
        }}
      >
        {/*
          Mặt sàn nghiêng (epoxy đã dùng lâu năm như xưởng thật), lớp từ trên xuống:
          bong sơn / xước / vết bánh xe (đè cả vạch vàng) -> vạch vàng lối đi chạy dọc HAI BÊN kệ
          -> mạch cắt có gờ (nét tối + nét sáng) -> mảng vá, vùng mòn sáng, loang, hạt thô, đốm cốt liệu.
          Vùng đặt kệ (khung vạch vàng + ốp chân trụ) vẽ trong cảnh 3D.
        */}
        <Box sx={{ position: 'absolute', inset: 0, perspective: '420px', perspectiveOrigin: '50% 0%' }}>
          <Box
            sx={{
              position: 'absolute',
              left: '-60%',
              right: '-60%',
              top: 0,
              height: '320%',
              transformOrigin: 'top center',
              transform: 'rotateX(72deg)',
              backgroundImage: [
                ...floor.over.map((layer) => layer.image),
                `linear-gradient(90deg, transparent calc(26% - 10px), ${p.lane} calc(26% - 10px) 26%, transparent 26% 74%, ${p.lane} 74% calc(74% + 10px), transparent calc(74% + 10px))`,
                `repeating-linear-gradient(0deg, ${p.joint} 0 2px, ${jointLip} 2px 3.5px, transparent 3.5px ${SLAB}px)`,
                `repeating-linear-gradient(90deg, ${p.joint} 0 2px, ${jointLip} 2px 3.5px, transparent 3.5px ${SLAB}px)`,
                ...floor.under.map((layer) => layer.image),
              ].join(', '),
              backgroundSize: [
                ...floor.over.map((layer) => layer.size),
                '100% 100%',
                'auto',
                'auto',
                ...floor.under.map((layer) => layer.size),
              ].join(', '),
              backgroundPosition: [
                ...floor.over.map(() => '0 0'),
                '0 0',
                '0 0',
                'center 0',
                ...floor.under.map(() => '0 0'),
              ].join(', '),
            }}
          />
        </Box>

        {/* Đèn tuýp phản chiếu trên sàn: loang không đều theo độ mòn của lớp epoxy */}
        <Box
          sx={{
            position: 'absolute',
            inset: 0,
            maskImage: floor.reflectionMask,
            maskSize: '400px 400px',
          }}
        >
          {REFLECTIONS.map((left) => (
            <Box
              key={left}
              sx={{
                position: 'absolute',
                left: `${left}%`,
                top: 0,
                width: 130,
                height: '90%',
                transform: 'translateX(-50%)',
                background: `radial-gradient(ellipse 50% 100% at 50% 0%, ${p.reflection} 0%, transparent 70%)`,
              }}
            />
          ))}
        </Box>

        {/* Bóng tối chỗ tường giáp sàn */}
        <Box sx={{ position: 'absolute', left: 0, right: 0, top: 0, height: 16, background: `linear-gradient(180deg, ${p.wallFoot} 0%, transparent 100%)` }} />
      </Box>

      {/* Xe AMR chạy dọc sàn sát chân tường (vẽ sau sàn để nằm trên mặt sàn) */}
      <UserHomeAmr horizon={horizon} dark={dark} />

      {/* Ca đêm: hơi ấm của dàn đèn tuýp lan khắp xưởng (sáng nhất ở giữa, chỗ kệ) */}
      {dark && (
        <Box
          sx={{
            position: 'absolute',
            inset: 0,
            background: 'radial-gradient(ellipse 75% 70% at 50% 40%, rgba(255, 185, 105, 0.16) 0%, rgba(255, 170, 90, 0.05) 60%, transparent 100%)',
            mixBlendMode: 'screen',
          }}
        />
      )}

      {/* Viền tối 4 góc */}
      <Box
        sx={{
          position: 'absolute',
          inset: 0,
          background: dark
            ? 'radial-gradient(ellipse at 50% 45%, transparent 60%, rgba(18, 10, 2, 0.38) 100%)'
            : 'radial-gradient(ellipse at 50% 45%, transparent 60%, rgba(45, 40, 30, 0.22) 100%)',
        }}
      />
    </Box>
  )
})
