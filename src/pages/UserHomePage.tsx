import { Box, Typography } from '@mui/material'
import type { PaletteMode } from '@mui/material/styles'

import factoryBackground from '../assets/login-factory-bg.png'
import { PageHeader } from '../components/common/PageHeader'
import { PageShell } from '../components/common/PageShell'
import {
  createUserHomeHeroSx,
  userHomeAmbientSx,
  userHomeCardSx,
} from '../components/userHome/userHomeStyles'
import { getAuthSession } from '../services/authService'

interface UserHomePageProps {
  mode: PaletteMode
  onToggleMode: () => void
}

interface AccountDetailProps {
  label: string
  value: string
}

function AccountDetail({ label, value }: AccountDetailProps) {
  return (
    <Box
      sx={{
        minWidth: 0,

        p: 1.6,

        textAlign: 'left',

        position: 'relative',

        overflow: 'hidden',

        border:
          '1px solid rgba(148, 222, 255, 0.24)',

        borderRadius: '18px',

        background: `
    linear-gradient(
      135deg,
      rgba(132, 211, 255, 0.13) 0%,
      rgba(35, 88, 126, 0.08) 48%,
      rgba(255,255,255,0.035) 100%
    )
  `,

        backdropFilter:
          'blur(14px)',

        WebkitBackdropFilter:
          'blur(14px)',

        boxShadow: `
    inset 0 1px 0 rgba(235,250,255,0.13),
    inset 0 -1px 0 rgba(78,177,238,0.08),
    0 8px 22px rgba(0,8,18,0.16)
  `,

        transition:
          'transform 180ms ease, border-color 180ms ease, box-shadow 180ms ease',

        '&::before': {
          content: '""',

          position: 'absolute',

          inset: 0,

          pointerEvents: 'none',

          background: `
      linear-gradient(
        135deg,
        rgba(255,255,255,0.10),
        transparent 35%
      )
    `,
        },

        '& > *': {
          position: 'relative',
          zIndex: 1,
        },

        '&:hover': {
          transform:
            'translateY(-1px)',

          borderColor:
            'rgba(150, 225, 255, 0.48)',

          boxShadow: `
      inset 0 1px 0 rgba(240,252,255,0.18),
      0 10px 26px rgba(0,8,18,0.20),
      0 0 18px rgba(70,175,238,0.10)
    `,
        },
      }}
    >
      <Typography
        sx={{
          fontSize: 9.5,
          fontWeight: 700,
          letterSpacing: '0.13em',
          color: 'rgba(179, 215, 239, 0.52)',
          textTransform: 'uppercase',
        }}
      >
        {label}
      </Typography>
      <Typography
        noWrap
        sx={{ mt: 0.45, fontSize: 13.5, fontWeight: 650, color: 'rgba(241, 248, 255, 0.9)' }}
      >
        {value}
      </Typography>
    </Box>
  )
}

export function UserHomePage({ mode, onToggleMode }: UserHomePageProps) {
  const session = getAuthSession()
  const displayName = session?.name || session?.employeeId || 'User'

  return (
    <PageShell>
      <PageHeader
        title="User Home"
        subtitle="Production Control"
        mode={mode}
        onToggleMode={onToggleMode}
      />

      <Box sx={createUserHomeHeroSx(factoryBackground)}>
        <Box className="user-home-ambient" sx={userHomeAmbientSx} />

        <Box className="user-home-card" sx={userHomeCardSx}>
          <Typography
            sx={{
              display: 'inline-flex',
              px: 1.4,
              py: 0.55,
              border: '1px solid rgba(132, 213, 255, 0.25)',
              borderRadius: 999,
              background: 'linear-gradient(135deg, rgba(91, 189, 245, 0.14), rgba(48, 126, 184, 0.07))',
              boxShadow: 'inset 0 1px 0 rgba(235, 250, 255, 0.09), 0 0 16px rgba(68, 170, 231, 0.08)',
              color: 'rgba(137, 207, 250, 0.72)',
              fontSize: 9.5,
              fontWeight: 750,
              letterSpacing: '0.2em',
            }}
          >
            PRODUCTION CONTROL
          </Typography>

          <Typography
            sx={{
              mt: 2.1,
              fontSize: { xs: 27, sm: 34 },
              fontWeight: 700,
              lineHeight: 1.15,
              letterSpacing: '-0.03em',
              textShadow: '0 4px 22px rgba(0, 0, 0, 0.34)',
            }}
          >
            Welcome, {displayName}
          </Typography>
          <Typography sx={{ mt: 0.9, fontSize: 13.5, color: 'rgba(215, 232, 246, 0.62)' }}>
            Your Production Control workspace
          </Typography>

          <Box
            sx={{
              mt: 3.2,
              display: 'grid',
              gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
              gap: 1.1,
            }}
          >
            <AccountDetail label="Employee ID" value={session?.employeeId || '—'} />
            <AccountDetail label="Department" value={session?.dept || '—'} />
            <AccountDetail label="Section" value={session?.section || '—'} />
            <AccountDetail label="Role" value={session?.roles.join(', ') || 'USER'} />
          </Box>
        </Box>
      </Box>
    </PageShell>
  )
}
