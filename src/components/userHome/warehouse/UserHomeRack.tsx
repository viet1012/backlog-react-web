import { Box, Tooltip, Typography } from '@mui/material'
import { InfoOutlined } from '@mui/icons-material'

import { useElementSize } from '../../../hooks/useElementSize'
import { useI18n } from '../../../i18n/useI18n'
import { INK } from '../factoryScene/primitives'
import type { HomeMenu, HomeMenuEntry } from '../userHomeMenu'
import { CRATE_DEPTH, CRATE_RATIO, crateCell, fitCrates } from './crateLayout'
import { UserHomeCrate, type CrateKind } from './UserHomeCrate'

/*
 * Kệ hàng 3 tầng (nhìn chính diện, hơi từ trên xuống):
 * trên = sắp ra mắt (thùng bọc màng co), giữa = dùng ngay (thùng mở được), dưới = cần quyền (thùng nhựa trong lồng lưới).
 * Mỗi tầng là một khung perspective riêng; điểm nhìn đặt cao dần để cả kệ trông như cùng một góc nhìn.
 */
const UPRIGHT = 18
const BEAM = 18
const SIDE_PAD = 18
const TOP_PAD = 12
const GAP = 16
// Chừa chỗ cho phần nóc thùng nhô lên khi nhìn từ trên
const TOP_FACE_RESERVE = 0.86

const BEAM_BG = 'linear-gradient(180deg, #ff9a52 0%, #ef7424 55%, #c95b14 100%)'
const UPRIGHT_BG = [
  'radial-gradient(circle, rgba(5, 14, 28, 0.55) 0 1.8px, transparent 2.2px) center 6px / 100% 14px repeat-y',
  'linear-gradient(90deg, #1f4f84 0%, #3a82c9 45%, #2a65a3 100%)',
].join(', ')

interface RackTierProps {
  kind: CrateKind
  code: string
  label: string
  entries: HomeMenuEntry[]
  empty: string
  flex: number
  maxSize: number
  // perspective-origin: điểm nhìn của tầng này
  eye: string
  delayBase: number
  dark: boolean
  info?: string
}

function RackTier({ kind, code, label, entries, empty, flex, maxSize, eye, delayBase, dark, info }: RackTierProps) {
  const [stageRef, stage] = useElementSize<HTMLDivElement>()
  const rawFit = fitCrates(
    entries.length,
    stage.width - SIDE_PAD * 2,
    (stage.height - TOP_PAD) * TOP_FACE_RESERVE,
    { gap: GAP, maxSize },
  )
  const fit = { ...rawFit, size: Math.floor(rawFit.size) }
  const crateHeight = Math.round(fit.size / CRATE_RATIO)
  const deckDepth = Math.round(Math.max(fit.size, 80) * CRATE_DEPTH) + 12

  return (
    <Box sx={{ position: 'relative', flex, minHeight: 0, display: 'flex', flexDirection: 'column' }}>
      <Box
        ref={stageRef}
        sx={{
          position: 'relative',
          flex: 1,
          minHeight: 0,
          perspective: '900px',
          perspectiveOrigin: eye,
        }}
      >
        {/* Mặt sàn kệ */}
        <Box
          sx={{
            position: 'absolute',
            left: 0,
            right: 0,
            bottom: 0,
            height: deckDepth,
            transformOrigin: 'bottom',
            transform: 'rotateX(90deg)',
            background: dark
              ? 'repeating-linear-gradient(90deg, rgba(255, 255, 255, 0.05) 0 2px, transparent 2px 22px), linear-gradient(180deg, #1c2532 0%, #2c3746 100%)'
              : 'repeating-linear-gradient(90deg, rgba(255, 255, 255, 0.35) 0 2px, transparent 2px 22px), linear-gradient(180deg, #8f9cab 0%, #b4bfcb 100%)',
          }}
        />

        {fit.size > 0 && (
          <Box
            sx={{
              position: 'absolute',
              left: SIDE_PAD,
              right: SIDE_PAD,
              top: TOP_PAD,
              bottom: 0,
              display: 'grid',
              gridTemplateColumns: `repeat(${fit.cols}, ${fit.size}px)`,
              gridTemplateRows: `repeat(${fit.rows}, ${crateHeight}px)`,
              justifyContent: 'center',
              alignContent: 'end',
              columnGap: `${GAP}px`,
              transformStyle: 'preserve-3d',
            }}
          >
            {entries.map((entry, index) => (
              <Box key={entry.item.path} sx={{ ...crateCell(index, fit), transformStyle: 'preserve-3d' }}>
                <UserHomeCrate
                  entry={entry}
                  kind={kind}
                  size={fit.size}
                  delayMs={delayBase + index * 70}
                  dark={dark}
                />
              </Box>
            ))}
          </Box>
        )}

        {entries.length === 0 && (
          <Box sx={{ position: 'absolute', inset: 0, display: 'grid', placeItems: 'center', px: 2 }}>
            <Typography
              sx={{
                px: 1.4,
                py: 0.6,
                borderRadius: '8px',
                fontSize: 12.5,
                fontWeight: 700,
                textAlign: 'center',
                color: dark ? 'rgba(220, 232, 245, 0.8)' : '#33475c',
                bgcolor: dark ? 'rgba(10, 20, 34, 0.7)' : 'rgba(255, 255, 255, 0.8)',
                border: '1px dashed rgba(130, 160, 190, 0.5)',
              }}
            >
              {empty}
            </Typography>
          </Box>
        )}

        {/* Lồng lưới thép cho hàng cần quyền */}
        {kind === 'locked' && entries.length > 0 && (
          <Box
            sx={{
              position: 'absolute',
              inset: `4px ${SIDE_PAD / 2}px 0`,
              pointerEvents: 'none',
              border: `2px solid ${dark ? 'rgba(160, 180, 200, 0.45)' : 'rgba(70, 85, 100, 0.55)'}`,
              borderBottom: 'none',
              background: [
                `repeating-linear-gradient(45deg, ${dark ? 'rgba(170, 190, 210, 0.22)' : 'rgba(60, 75, 90, 0.26)'} 0 1.5px, transparent 1.5px 16px)`,
                `repeating-linear-gradient(-45deg, ${dark ? 'rgba(170, 190, 210, 0.22)' : 'rgba(60, 75, 90, 0.26)'} 0 1.5px, transparent 1.5px 16px)`,
              ].join(', '),
            }}
          />
        )}
      </Box>

      {/* Thanh ngang kệ + nhãn vị trí kho */}
      <Box
        sx={{
          position: 'relative',
          zIndex: 2,
          flexShrink: 0,
          height: BEAM,
          mx: `-${UPRIGHT / 2}px`,
          background: BEAM_BG,
          borderTop: '1px solid rgba(255, 255, 255, 0.4)',
          boxShadow: '0 5px 10px rgba(0, 0, 0, 0.32)',
        }}
      >
        <Box
          sx={{
            position: 'absolute',
            left: UPRIGHT + 10,
            top: '50%',
            transform: 'translateY(-50%)',
            display: 'flex',
            alignItems: 'center',
            gap: 0.8,
            height: 24,
            pl: 0.8,
            pr: info ? 0.4 : 0.8,
            borderRadius: '3px',
            bgcolor: '#fdfdf8',
            border: `1px solid ${INK}`,
            boxShadow: '0 2px 4px rgba(0, 0, 0, 0.3)',
          }}
        >
          <Typography sx={{ fontFamily: 'ui-monospace, Consolas, monospace', fontSize: 12, fontWeight: 900, color: INK }}>
            {code}
          </Typography>
          <Box sx={{ width: '1px', alignSelf: 'stretch', my: 0.5, bgcolor: 'rgba(20, 18, 31, 0.3)' }} />
          <Typography noWrap sx={{ fontSize: 11, fontWeight: 800, letterSpacing: '0.06em', textTransform: 'uppercase', color: INK }}>
            {label}
          </Typography>
          <Typography sx={{ fontSize: 11, fontWeight: 900, color: '#ef7424' }}>{entries.length}</Typography>
          {/* Mã vạch trang trí */}
          <Box sx={{ width: 30, height: 13, background: `repeating-linear-gradient(90deg, ${INK} 0 1px, transparent 1px 3px, ${INK} 3px 5px, transparent 5px 6px)` }} />
          {info && (
            <Tooltip arrow title={info}>
              <Box component="span" tabIndex={0} aria-label={info} sx={{ display: 'grid', color: '#c95b14', cursor: 'help', outline: 'none', '&:focus-visible': { outline: `2px solid ${INK}` } }}>
                <InfoOutlined sx={{ fontSize: 16 }} />
              </Box>
            </Tooltip>
          )}
        </Box>
      </Box>
    </Box>
  )
}

interface UserHomeRackProps {
  menu: HomeMenu
  dark: boolean
}

export function UserHomeRack({ menu, dark }: UserHomeRackProps) {
  const { t } = useI18n()

  return (
    <Box
      sx={{
        position: 'relative',
        flex: 1,
        minHeight: 0,
        width: 'min(1220px, 100%)',
        mx: 'auto',
        display: 'flex',
        flexDirection: 'column',
        px: `${UPRIGHT}px`,
        pt: 1,
        pb: '12px',
      }}
    >
      {/* Bóng kệ đổ xuống sàn */}
      <Box
        sx={{
          position: 'absolute',
          left: '4%',
          right: '4%',
          bottom: -10,
          height: 34,
          borderRadius: '50%',
          background: 'radial-gradient(ellipse at center, rgba(0, 0, 0, 0.38) 0%, transparent 70%)',
        }}
      />

      {/* Tấm lưới sau kệ */}
      <Box
        sx={{
          position: 'absolute',
          top: 0,
          bottom: 12,
          left: UPRIGHT,
          right: UPRIGHT,
          background: dark
            ? 'repeating-linear-gradient(0deg, rgba(120, 160, 200, 0.08) 0 1px, transparent 1px 22px), repeating-linear-gradient(90deg, rgba(120, 160, 200, 0.08) 0 1px, transparent 1px 22px), rgba(6, 12, 22, 0.55)'
            : 'repeating-linear-gradient(0deg, rgba(50, 70, 95, 0.08) 0 1px, transparent 1px 22px), repeating-linear-gradient(90deg, rgba(50, 70, 95, 0.08) 0 1px, transparent 1px 22px), rgba(225, 232, 240, 0.55)',
        }}
      />

      {/* 2 trụ đứng + đế */}
      {(['left', 'right'] as const).map((side) => (
        <Box key={side} sx={{ position: 'absolute', top: -6, bottom: 0, [side]: 0, width: UPRIGHT, zIndex: 3 }}>
          <Box sx={{ position: 'absolute', inset: '0 0 6px 0', background: UPRIGHT_BG, borderRadius: '2px 2px 0 0', boxShadow: '2px 0 6px rgba(0, 0, 0, 0.25)' }} />
          <Box sx={{ position: 'absolute', left: -5, right: -5, bottom: 0, height: 7, borderRadius: '2px', bgcolor: '#5c6b7c', border: '1px solid rgba(0, 0, 0, 0.35)' }} />
        </Box>
      ))}

      <RackTier
        kind="upcoming"
        code="A-03"
        label={t.userHome.tierUpcoming}
        entries={menu.upcoming}
        empty={t.userHome.upcomingNone}
        flex={0.9}
        maxSize={150}
        eye="50% 0%"
        delayBase={500}
        dark={dark}
      />
      <RackTier
        kind="ready"
        code="A-02"
        label={t.userHome.tierReady}
        entries={menu.ready}
        empty={t.userHome.readyNone}
        flex={1.3}
        maxSize={250}
        eye="50% -55%"
        delayBase={150}
        dark={dark}
      />
      <RackTier
        kind="locked"
        code="A-01"
        label={t.userHome.tierLocked}
        entries={menu.locked}
        empty={t.userHome.lockedNone}
        flex={1}
        maxSize={170}
        eye="50% -140%"
        delayBase={800}
        dark={dark}
        info={t.userHome.lockedNote}
      />
    </Box>
  )
}
