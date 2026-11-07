import { Suspense, useState } from 'react'

import { Box, LinearProgress } from '@mui/material'
import { alpha, keyframes } from '@mui/material/styles'
import { Outlet } from 'react-router-dom'

import { Mascot, MascotProvider } from '../mascot'
import { clockInTimeline, useClockInRun } from '../shift/clockInStore'

import { LeftSidebar } from './LeftSidebar'

// Clock-in: the app is mounted under the shutter, then the sidebar and the
// page come up as it rolls up ("lights on"). Dim, not invisible, while
// waiting, so the page is already drawn when the shutter reveals it.
const sidebarIn = keyframes`
  from { opacity: 0.35; transform: translateX(-16px); }
  to { opacity: 1; transform: none; }
`

const pageIn = keyframes`
  from { opacity: 0.35; transform: translateY(14px); }
  to { opacity: 1; transform: none; }
`

const revealEase = 'cubic-bezier(.2,.8,.2,1)'

const fadeIn = keyframes`
  from { opacity: 0; }
  to { opacity: 1; }
`

// A page chunk still downloading (first visit): a thin bar along the top,
// shown only when it takes a moment so fast loads do not flash.
function PageFallback() {
  return (
    <Box sx={{ position: 'relative', flex: 1 }}>
      <LinearProgress
        sx={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: 2,
          animation: `${fadeIn} 200ms ease-out 250ms both`,
        }}
      />
    </Box>
  )
}

export function MainLayout() {
  const run = useClockInRun()

  // ms from mount until the shutter starts rolling up; null when not signing in
  const [riseDelay] = useState(() => run
    ? Math.max(0, run.startedAt.getTime() + clockInTimeline(run.full).riseAt - Date.now())
    : null)

  // Skipped (or finished): come in right away
  const delay = run ? riseDelay ?? 0 : 0

  return (
    <Box
      sx={(theme) => ({
        display: 'flex',
        width: '100vw',
        height: '100vh',
        overflow: 'hidden',
        bgcolor: 'background.default',
        backgroundImage: `
          radial-gradient(circle at 12% 8%, ${alpha(theme.palette.primary.main, theme.palette.mode === 'dark' ? 0.12 : 0.09)} 0, transparent 32%),
          radial-gradient(circle at 88% 92%, ${alpha(theme.palette.info.main, theme.palette.mode === 'dark' ? 0.08 : 0.06)} 0, transparent 30%),
          linear-gradient(145deg, ${alpha(theme.palette.background.default, 0.98)}, ${alpha(theme.palette.background.paper, 0.72)})
        `,
        backgroundAttachment: 'fixed',

        // Fill backwards only: a transform kept after the end would make
        // these the containing block of every position: fixed inside.
        ...(riseDelay !== null && {
          '& > aside': { animation: `${sidebarIn} 560ms ${revealEase} ${delay + 120}ms backwards` },
          '& > main': { animation: `${pageIn} 640ms ${revealEase} ${delay + 220}ms backwards` },
        }),
      })}
    >
      <MascotProvider>
        <LeftSidebar />
        <Box
          component="main"
          sx={{
            display: 'flex',
            flex: 1,
            minWidth: 0,
            minHeight: 0,
            overflow: 'hidden',
          }}
        >
          <Suspense fallback={<PageFallback />}>
            <Outlet />
          </Suspense>
        </Box>

        {/* đặt ngoài Outlet → không re-mount khi chuyển trang */}
        <Mascot />
      </MascotProvider>
    </Box>
  )
}
