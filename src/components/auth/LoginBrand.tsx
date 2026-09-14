import { FactoryRounded } from '@mui/icons-material'
import { Box, Typography } from '@mui/material'

export function LoginBrand() {
  return (
    <Box
      sx={{
        position: 'absolute',

        top: {
          md: 36,
          lg: 44,
        },

        left: {
          md: 48,
          lg: 64,
        },

        zIndex: 3,

        display: {
          xs: 'none',
          md: 'flex',
        },

        alignItems: 'center',
        gap: 1.6,
      }}
    >
      {/* ICON */}
      <Box
        sx={{
          position: 'relative',

          width: 40,
          height: 40,

          display: 'grid',
          placeItems: 'center',

          borderRadius: '13px',

          color: '#86d8ff',

          background:
            'linear-gradient(145deg, rgba(80,170,235,0.18), rgba(8,42,72,0.10))',

          border:
            '1px solid rgba(132, 207, 255, 0.26)',

          backdropFilter: 'blur(16px) saturate(135%)',
          WebkitBackdropFilter:
            'blur(16px) saturate(135%)',

          boxShadow: `
            0 10px 28px rgba(0, 0, 0, 0.18),
            inset 0 1px 0 rgba(255,255,255,0.08),
            0 0 24px rgba(56, 166, 235, 0.06)
          `,

          overflow: 'hidden',

          '&::before': {
            content: '""',

            position: 'absolute',

            inset: 0,

            borderRadius: 'inherit',

            background:
              'linear-gradient(135deg, rgba(255,255,255,0.12), transparent 42%)',

            pointerEvents: 'none',
          },

          '&::after': {
            content: '""',

            position: 'absolute',

            top: '-20%',
            bottom: '-20%',

            width: '18px',

            left: '-35%',

            transform: 'rotate(18deg)',

            background:
              'linear-gradient(90deg, transparent, rgba(170,225,255,0.18), transparent)',

            animation:
              'brandIconShine 7s ease-in-out infinite',

            pointerEvents: 'none',
          },

          '@keyframes brandIconShine': {
            '0%, 72%': {
              left: '-35%',
              opacity: 0,
            },

            '78%': {
              opacity: 1,
            },

            '88%': {
              left: '120%',
              opacity: 0.8,
            },

            '100%': {
              left: '120%',
              opacity: 0,
            },
          },

          '@media (prefers-reduced-motion: reduce)': {
            '&::after': {
              animation: 'none',
            },
          },
        }}
      >
        <FactoryRounded
          sx={{
            position: 'relative',
            zIndex: 1,

            fontSize: 21,

            filter:
              'drop-shadow(0 2px 8px rgba(70,180,245,0.22))',
          }}
        />
      </Box>

      {/* BRAND TEXT */}
      <Box
        sx={{
          minWidth: 0,
        }}
      >
        <Typography
          sx={{
            fontSize: 20,

            fontWeight: 800,

            lineHeight: 1,

            letterSpacing: '0.04em',

            color: 'rgba(247, 251, 255, 0.96)',

            textShadow:
              '0 3px 14px rgba(0,0,0,0.28)',
          }}
        >
          F2
        </Typography>

        <Typography
          sx={{
            mt: 0.65,

            fontSize: 9.25,

            fontWeight: 700,

            lineHeight: 1,

            letterSpacing: '0.20em',

            color:
              'rgba(198, 222, 241, 0.58)',
          }}
        >
          FACTORY OPERATIONS
        </Typography>

        {/* ACCENT LINE */}
        <Box
          sx={{
            position: 'relative',

            mt: 1.05,

            width: 74,
            height: 1.5,

            overflow: 'hidden',

            borderRadius: 999,

            background:
              'linear-gradient(90deg, rgba(102,199,255,0.40), rgba(102,199,255,0.05), transparent)',

            '&::after': {
              content: '""',

              position: 'absolute',

              top: 0,
              bottom: 0,

              width: 28,

              left: '-40%',

              borderRadius: 'inherit',

              background:
                'linear-gradient(90deg, transparent, rgba(185,232,255,0.95), transparent)',

              boxShadow:
                '0 0 10px rgba(106, 205, 255, 0.45)',

              animation:
                'brandLineSweep 4.8s ease-in-out infinite',
            },

            '@keyframes brandLineSweep': {
              '0%, 55%': {
                left: '-40%',
                opacity: 0,
              },

              '62%': {
                opacity: 1,
              },

              '82%': {
                left: '100%',
                opacity: 0.9,
              },

              '100%': {
                left: '100%',
                opacity: 0,
              },
            },

            '@media (prefers-reduced-motion: reduce)': {
              '&::after': {
                animation: 'none',
              },
            },
          }}
        />
      </Box>
    </Box>
  )
}