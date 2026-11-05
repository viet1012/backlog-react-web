import {
  Box,
  Typography,
} from '@mui/material'

import InboxRoundedIcon
  from '@mui/icons-material/InboxRounded'

import { ClearButton } from '../common/ClearButton'
import { useI18n } from '../../i18n/useI18n'


interface FacConfirmNoRowsOverlayProps {
  // Đang có bộ lọc cột => hiện nút Clear All
  hasFilters: boolean
  onClearFilters: () => void
}


export function FacConfirmNoRowsOverlay({
  hasFilters,
  onClearFilters,
}: FacConfirmNoRowsOverlayProps) {
  const { t } = useI18n()

  return (
    <Box
      sx={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 0.75,
        px: 2,
        textAlign: 'center',
        color: 'text.secondary',
      }}
    >
      <InboxRoundedIcon
        sx={{
          fontSize: 36,
          opacity: 0.5,
        }}
      />

      <Typography
        sx={{
          fontSize: 14,
          fontWeight: 700,
          color: 'text.primary',
        }}
      >
        {t.facConfirm.noRowsTitle}
      </Typography>

      <Typography
        sx={{
          fontSize: 12.5,
        }}
      >
        {t.facConfirm.noRowsHint}
      </Typography>

      {hasFilters && (
        // Overlay của DataGrid chặn pointer mặc định => bật lại cho nút
        <Box sx={{ mt: 0.5, pointerEvents: 'auto' }}>
          <ClearButton
            mode="clearAll"
            onClick={onClearFilters}
          />
        </Box>
      )}
    </Box>
  )
}
