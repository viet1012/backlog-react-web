import { Box, Tooltip } from '@mui/material'
import { keyframes } from '@mui/material/styles'
import { useI18n } from '../../i18n/useI18n'

interface UpdatedStatusProps {
  updatedAt: Date | null
  error?: boolean
}

const ping = keyframes`
  0% { opacity: 0.6; transform: scale(1); }
  100% { opacity: 0; transform: scale(2.6); }
`

// Header status as a single LED; the "live · updated at" text lives in the tooltip
export function UpdatedStatus({ updatedAt, error = false }: UpdatedStatusProps) {
  const { t, language } = useI18n()

  const label = error
    ? t.status.connectionIssue
    : t.status.live(updatedAt ? updatedAt.toLocaleTimeString(language === 'vi' ? 'vi-VN' : 'en-US') : t.status.notLoaded)

  const color = error ? 'error.main' : 'success.main'

  return (
    <Tooltip title={label} arrow>
      <Box
        role="status"
        aria-label={label}
        tabIndex={0}
        sx={{
          position: 'relative',
          flexShrink: 0,
          width: 22,
          height: 22,
          display: 'grid',
          placeItems: 'center',
          borderRadius: '50%',
          cursor: 'help',
          '&:focus-visible': { outline: '2px solid', outlineColor: 'primary.main' },
        }}
      >
        <Box
          sx={{
            position: 'relative',
            width: 9,
            height: 9,
            borderRadius: '50%',
            bgcolor: color,
            '&::after': {
              content: '""',
              position: 'absolute',
              inset: 0,
              borderRadius: '50%',
              bgcolor: color,
              animation: error ? 'none' : `${ping} 2s ease-out infinite`,
              '@media (prefers-reduced-motion: reduce)': { animation: 'none' },
            },
          }}
        />
      </Box>
    </Tooltip>
  )
}
