import { Box, Typography } from '@mui/material'
import { useEffect, useState } from 'react'

const TABS = [
  'PEOPLE',
  'PROCESS',
  'PROGRESS',
] as const

export function LoginHeroText() {
  const [activeIndex, setActiveIndex] = useState(0)

  useEffect(() => {
    const timer = window.setInterval(() => {
      setActiveIndex((prev) =>
        (prev + 1) % TABS.length
      )
    }, 2200)

    return () => {
      window.clearInterval(timer)
    }
  }, [])

  return (
    <Box
      sx={{
        position: 'absolute',
        left: { md: 48, lg: 64 },
        bottom: { md: 40, lg: 48 },
        zIndex: 3,
        display: { xs: 'none', md: 'block' },
      }}
    >
      {/* TABS */}
      <Box
        sx={{
          position: 'relative',
          display: 'inline-flex',
          gap: 3.2,
          mb: 2,
          pb: 1.1,
        }}
      >
        {TABS.map((tab, index) => (
          <Typography
            key={tab}
            onMouseEnter={() =>
              setActiveIndex(index)
            }
            sx={{
              position: 'relative',
              zIndex: 2,

              fontSize: 10,
              fontWeight: 700,

              letterSpacing: '0.34em',

              color:
                activeIndex === index
                  ? '#9edcff'
                  : 'rgba(195, 222, 244, 0.58)',

              textShadow:
                activeIndex === index
                  ? '0 0 16px rgba(95,190,255,0.32)'
                  : 'none',

              transition:
                'color 450ms ease, text-shadow 450ms ease',

              cursor: 'default',
              userSelect: 'none',
            }}
          >
            {tab}
          </Typography>
        ))}

        {/* MOVING INDICATOR */}
        <Box
          sx={{
            position: 'absolute',
            left: 0,
            bottom: 0,

            width: '58px',
            height: '2px',

            borderRadius: 999,

            background:
              'linear-gradient(90deg, rgba(92,195,255,0), #78ceff 45%, rgba(92,195,255,0))',

            boxShadow:
              '0 0 12px rgba(77, 183, 255, 0.55)',

            transform: `translateX(${activeIndex === 0
              ? 0
              : activeIndex === 1
                ? 91
                : 198
              }px)`,

            transition:
              'transform 650ms cubic-bezier(0.22, 1, 0.36, 1)',
          }}
        />
      </Box>

      {/* HERO */}
      <Typography
        sx={{
          fontSize: {
            md: 37,
            lg: 41,
          },

          fontWeight: 300,

          lineHeight: 1.08,

          letterSpacing: '-0.04em',

          color: 'rgba(245, 249, 255, 0.95)',

          textShadow:
            '0 4px 22px rgba(0,0,0,0.30)',
        }}
      >
        Your Time.
        <br />
        Our Priority.
      </Typography>
    </Box>
  )
}