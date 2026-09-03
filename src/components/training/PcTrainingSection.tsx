import { Box, Stack, Typography } from '@mui/material'
import type { ReactNode } from 'react'

interface Props {
  id: string
  number: string
  title: string
  description?: string
  children: ReactNode
}

export function PcTrainingSection({ id, number, title, description, children }: Props) {
  return (
    <Box component="section" id={id} sx={{ scrollMarginTop: 64 }}>
      <Stack direction="row" spacing={1.25} sx={{ alignItems: 'flex-start', mb: 1.5 }}>
        <Typography sx={{ color: 'primary.main', fontSize: 11, fontWeight: 900, pt: 0.45 }}>
          {number}
        </Typography>
        <Box>
          <Typography component="h2" sx={{ fontSize: { xs: 18, md: 21 }, fontWeight: 800, lineHeight: 1.2 }}>
            {title}
          </Typography>
          {description && (
            <Typography color="text.secondary" sx={{ mt: 0.4, fontSize: 12.5 }}>
              {description}
            </Typography>
          )}
        </Box>
      </Stack>
      {children}
    </Box>
  )
}
