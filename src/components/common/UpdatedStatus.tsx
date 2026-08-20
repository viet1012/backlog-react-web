import { Box, Stack, Typography } from '@mui/material'
import { uiTokens } from '../../theme/uiTokens'

interface UpdatedStatusProps {
  updatedAt: Date | null
  error?: boolean
}

export function UpdatedStatus({ updatedAt, error = false }: UpdatedStatusProps) {
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
          ? 'Connection issue'
          : `Live   Last updated: ${updatedAt ? updatedAt.toLocaleTimeString() : 'Not yet loaded'}`}
      </Typography>
    </Stack>
  )
}
