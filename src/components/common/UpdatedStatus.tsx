import { Box, Stack, Typography } from '@mui/material'
import { useI18n } from '../../i18n/useI18n'
import { uiTokens } from '../../theme/uiTokens'

interface UpdatedStatusProps {
  updatedAt: Date | null
  error?: boolean
}

export function UpdatedStatus({ updatedAt, error = false }: UpdatedStatusProps) {
  const { t, language } = useI18n()

  return (
    <Stack direction="row" spacing={0.75} sx={{ alignItems: 'center' }}>
      <Box
        sx={{
          width: 7,
          height: 7,
          borderRadius: '50%',
          bgcolor: error ? 'error.main' : 'success.main',
          boxShadow: error ? 'none' : '0 0 0 4px rgba(34,197,94,0.1)',
        }}
      />
      <Typography
        color="text.secondary"
        sx={{ fontSize: uiTokens.header.metaFontSize, whiteSpace: 'nowrap' }}
      >
        {error
          ? t.status.connectionIssue
          : t.status.live(updatedAt ? updatedAt.toLocaleTimeString(language === 'vi' ? 'vi-VN' : 'en-US') : t.status.notLoaded)}
      </Typography>
    </Stack>
  )
}
