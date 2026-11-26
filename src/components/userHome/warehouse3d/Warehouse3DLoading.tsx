import { Box, CircularProgress } from '@mui/material'
import { keyframes } from '@mui/material/styles'

import { useI18n } from '../../../i18n/useI18n'

/*
 * Khung chờ trong lúc tải three.js / font / dựng cảnh WebGL: chỉ 1 vòng xoay nhỏ, mảnh ở giữa,
 * không vẽ khung kệ. Hiện trễ một chút (tải nhanh thì không thấy gì) rồi mờ dần lên.
 * Không import three.
 */
const appear = keyframes`
  from { opacity: 0; transform: scale(0.85); }
  to   { opacity: 1; transform: scale(1); }
`

// Tải xong trước ngần này thì người dùng không thấy vòng xoay
const SHOW_DELAY_MS = 250

interface Warehouse3DLoadingProps {
  dark: boolean
}

export function Warehouse3DLoading({ dark }: Warehouse3DLoadingProps) {
  const { t } = useI18n()

  return (
    <Box
      role="status"
      aria-label={t.userHome.loading3d}
      sx={{
        position: 'relative',
        flex: 1,
        minHeight: 0,
        height: '100%',
        width: 'min(1220px, 100%)',
        mx: 'auto',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Box
        sx={{
          display: 'flex',
          p: 1,
          borderRadius: '50%',
          bgcolor: dark ? 'rgba(17, 24, 34, 0.45)' : 'rgba(255, 255, 255, 0.55)',
          backdropFilter: 'blur(4px)',
          animation: `${appear} 280ms ease-out ${SHOW_DELAY_MS}ms both`,
          '@media (prefers-reduced-motion: reduce)': { animation: 'none' },
        }}
      >
        <CircularProgress
          size={20}
          thickness={3}
          aria-hidden
          sx={{ color: dark ? 'rgba(190, 215, 240, 0.75)' : 'rgba(50, 80, 115, 0.6)' }}
        />
      </Box>
    </Box>
  )
}
