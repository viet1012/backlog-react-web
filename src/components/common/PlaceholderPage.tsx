import type { SvgIconComponent } from '@mui/icons-material'
import { Box, Typography } from '@mui/material'
import { glassPanelSx } from '../../theme/uiTokens'
import { PageHeader } from './PageHeader'
import { PageShell } from './PageShell'

interface PlaceholderPageProps {
  title: string
  subtitle: string
  icon: SvgIconComponent
}

export function PlaceholderPage({
  title,
  subtitle,
  icon: Icon,
}: PlaceholderPageProps) {
  return (
    <PageShell>
      <PageHeader title={title} subtitle={subtitle} />

      <Box
        component="main"
        sx={(theme) => ({
          ...glassPanelSx(theme),
          minHeight: 0,
          flex: 1,
          display: 'grid',
          placeItems: 'center',
          px: { xs: 2, sm: 4 },
          py: { xs: 4, sm: 6 },
          textAlign: 'center',
        })}
      >
        <Box sx={{ width: '100%', maxWidth: 520 }}>
          <Box
            sx={{
              width: 56,
              height: 56,
              mx: 'auto',
              mb: 2,
              display: 'grid',
              placeItems: 'center',
              borderRadius: 3,
              color: 'primary.main',
              bgcolor: 'action.hover',
              border: 1,
              borderColor: 'divider',
            }}
          >
            <Icon sx={{ fontSize: 30 }} />
          </Box>

          <Typography component="h2" sx={{ fontSize: 18, fontWeight: 800 }}>
            {title}
          </Typography>
          <Typography
            color="text.secondary"
            sx={{ mt: 0.75, fontSize: 13, lineHeight: 1.6 }}
          >
            This workspace is ready for the upcoming {title} functionality.
          </Typography>
        </Box>
      </Box>
    </PageShell>
  )
}
