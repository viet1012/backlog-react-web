import { Box, Typography } from '@mui/material'
import { alpha } from '@mui/material/styles'
import type { RefObject } from 'react'

import { getSummaryGridTemplate } from './backlogSummaryStyles'
import { formatDateHeader } from './backlogSummaryUtils'

interface BacklogSummaryHeaderProps {
  dates: string[]
  today: string
  todayHeaderRef: RefObject<HTMLDivElement | null>
}

export function BacklogSummaryHeader({
  dates,
  today,
  todayHeaderRef,
}: BacklogSummaryHeaderProps) {
  return (
    <Box
      sx={(theme) => {
        const isDark = theme.palette.mode === 'dark'
        const headerAccent = isDark ? '#4F7FE3' : '#5F88CC'
        const headerBgTop = alpha(
          headerAccent,
          isDark ? 0.24 : 0.4,
        )
        const headerBgBottom = alpha(
          headerAccent,
          isDark ? 0.11 : 0.07,
        )
        const headerBorder = alpha(
          headerAccent,
          isDark ? 0.34 : 0.22,
        )
        const headerSeparator = alpha(
          headerAccent,
          isDark ? 0.26 : 0.16,
        )
        const headerBackground = `linear-gradient(
          180deg,
          ${headerBgTop} 0%,
          ${headerBgBottom} 100%
        )`

        return {
          display: 'grid',
          gridTemplateColumns: getSummaryGridTemplate(dates.length),
          minHeight: 33,
          alignItems: 'center',
          background: headerBackground,
          borderBottom: `1px solid ${headerBorder}`,
          color: theme.palette.text.primary,
          '& > *:not(:last-child)': {
            borderRight: `1px solid ${headerSeparator}`,
          },
        }
      }}
    >
      <Typography
        sx={(theme) => {
          const isDark = theme.palette.mode === 'dark'
          const headerAccent = isDark ? '#4F7FE3' : '#5F88CC'

          return {
            position: 'sticky',
            left: 0,
            zIndex: 4,
            boxSizing: 'border-box',
            alignSelf: 'stretch',
            display: 'flex',
            alignItems: 'center',
            px: 2,
            fontSize: 12.5,
            fontWeight: 700,
            color: 'text.primary',
            whiteSpace: 'nowrap',
            backgroundColor: theme.palette.background.paper,
            backgroundImage: `linear-gradient(
              180deg,
              ${alpha(headerAccent, isDark ? 0.24 : 0.4)} 0%,
              ${alpha(headerAccent, isDark ? 0.11 : 0.07)} 100%
            )`,
            boxShadow: `2px 0 5px ${alpha(
              theme.palette.common.black,
              isDark ? 0.18 : 0.08,
            )}`,
          }
        }}
      >
        Status
      </Typography>

      {dates.map((date) => {
        const isToday = date === today

        return (
          <Box
            key={date}
            ref={isToday ? todayHeaderRef : undefined}
            sx={(theme) => ({
              position: 'relative',
              boxSizing: 'border-box',
              height: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              px: 1,
              bgcolor: isToday
                ? alpha(
                  theme.palette.primary.main,
                  theme.palette.mode === 'dark' ? 0.20 : 0.11,
                )
                : 'transparent',
              boxShadow: isToday
                ? `inset 1px 0 0 ${alpha(
                  theme.palette.primary.main,
                  0.50,
                )},
                  inset -1px 0 0 ${alpha(
                  theme.palette.primary.main,
                  0.50,
                )}`
                : undefined,
              '&::after': isToday
                ? {
                  content: '""',
                  position: 'absolute',
                  left: 0,
                  right: 0,
                  bottom: 0,
                  height: 3,
                  bgcolor: theme.palette.primary.main,
                  animation: 'todayPulse 2.4s ease-in-out infinite',
                  '@keyframes todayPulse': {
                    '0%, 100%': { opacity: 0.45 },
                    '50%': { opacity: 1 },
                  },
                  '@media (prefers-reduced-motion: reduce)': {
                    animation: 'none',
                    opacity: 1,
                  },
                }
                : undefined,
            })}
          >
            <Typography
              sx={{
                textAlign: 'center',
                fontSize: 12.5,
                fontWeight: isToday ? 800 : 700,
                color: isToday ? 'primary.main' : 'text.primary',
                whiteSpace: 'nowrap',
              }}
            >
              {formatDateHeader(date)}
            </Typography>
          </Box>
        )
      })}
    </Box>
  )
}
