import { Box, CircularProgress, Skeleton, Typography, useMediaQuery } from '@mui/material'

import { useI18n } from '../../../i18n/useI18n'

/*
 * Khung chờ trong lúc tải three.js / font / dựng cảnh WebGL: dáng kệ 3 tầng với thùng mờ,
 * để người dùng thấy trang đang làm việc thay vì 1 vùng trống. Không import three.
 */
const TIERS = [5, 5, 4]

interface Warehouse3DLoadingProps {
  dark: boolean
}

export function Warehouse3DLoading({ dark }: Warehouse3DLoadingProps) {
  const { t } = useI18n()
  const reduceMotion = useMediaQuery('(prefers-reduced-motion: reduce)')
  const crateBg = dark ? 'rgba(170, 205, 235, 0.13)' : 'rgba(60, 95, 130, 0.12)'
  const beam = dark ? 'rgba(140, 190, 230, 0.22)' : 'rgba(60, 95, 130, 0.2)'

  return (
    <Box
      role="status"
      aria-live="polite"
      sx={{
        position: 'relative',
        flex: 1,
        minHeight: 0,
        height: '100%',
        width: 'min(1220px, 100%)',
        mx: 'auto',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        gap: { xs: 2, md: 2.5 },
        px: { xs: 1, md: 6 },
        py: 2,
      }}
    >
      {TIERS.map((count, tier) => (
        <Box key={tier} sx={{ position: 'relative', pb: 1.25 }}>
          <Box sx={{ display: 'flex', gap: { xs: 1, md: 2 }, justifyContent: 'center', alignItems: 'flex-end' }}>
            {Array.from({ length: count }, (_, i) => (
              <Skeleton
                key={i}
                variant="rounded"
                animation={reduceMotion ? false : 'wave'}
                sx={{
                  flex: 1,
                  maxWidth: 170,
                  height: { xs: 56, md: 'clamp(48px, 9vh, 96px)' },
                  bgcolor: crateBg,
                  borderRadius: 1.5,
                }}
              />
            ))}
          </Box>
          {/* Thanh dầm kệ */}
          <Box sx={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: 6, borderRadius: 1, bgcolor: beam }} />
        </Box>
      ))}

      <Box
        sx={{
          position: 'absolute',
          left: '50%',
          top: '50%',
          transform: 'translate(-50%, -50%)',
          display: 'flex',
          alignItems: 'center',
          gap: 1.25,
          px: 2,
          py: 1,
          borderRadius: 999,
          bgcolor: dark ? 'rgba(17, 24, 34, 0.82)' : 'rgba(255, 255, 255, 0.88)',
          boxShadow: dark ? '0 6px 20px rgba(0, 0, 0, 0.4)' : '0 6px 20px rgba(30, 50, 80, 0.16)',
          backdropFilter: 'blur(6px)',
        }}
      >
        <CircularProgress size={16} thickness={5} />
        <Typography variant="body2" sx={{ fontWeight: 700, color: 'text.primary', whiteSpace: 'nowrap' }}>
          {t.userHome.loading3d}
        </Typography>
      </Box>
    </Box>
  )
}
