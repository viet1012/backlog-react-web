import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'

import { Box, LinearProgress } from '@mui/material'
import { alpha, keyframes } from '@mui/material/styles'
import { useLocation } from 'react-router-dom'

import { Mascot, MascotProvider } from '../mascot'
import { clockInTimeline, useClockInRun } from '../shift/clockInStore'

import { KeepAliveOutlet } from './KeepAliveOutlet'
import { LeftSidebar } from './LeftSidebar'
import { setNavPending, useNavPending } from './navPending'
import { recordPageVisit } from './pageUsage'
import { SIDEBAR_DURATION, SIDEBAR_EASE } from './sidebarStyles'
import { setLayoutSliding } from './layoutSliding'
import { markNavigation } from '../../utils/webVitals'

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

interface MainLayoutProps {
  onToggleMode: () => void
}

export function MainLayout({ onToggleMode }: MainLayoutProps) {
  const mainRef = useRef<HTMLElement>(null)

  // Sidebar collapse/expand: the reserved width changes once (one layout, one
  // chart resize); <main> is then slid from its old position with a transform,
  // which runs on the compositor and keeps pace with the sidebar panel.
  const slideMain = useCallback((delta: number) => {
    const el = mainRef.current
    if (!el || !el.animate) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

    el.getAnimations().forEach((animation) => animation.cancel())

    // While sliding, panels drop their backdrop blur (header, cards…): a blur
    // over a moving layer is re-sampled on every frame, which is what made the
    // title bar stutter. The page background is a soft gradient, so the swap
    // is not visible.
    el.dataset.sliding = 'true'
    // Charts (StableResponsiveContainer) hold their size until the slide ends
    setLayoutSliding(true)

    const animation = el.animate(
      [
        { transform: `translateX(${-delta}px)` },
        { transform: 'translateX(0)' },
      ],
      // no fill: a kept transform would make <main> the containing block of
      // every position: fixed element inside it
      { duration: SIDEBAR_DURATION, easing: SIDEBAR_EASE },
    )

    const done = () => {
      // a newer slide may have started meanwhile
      if (el.getAnimations().length > 0) return
      delete el.dataset.sliding
      setLayoutSliding(false)
    }
    animation.onfinish = done
    animation.oncancel = done
  }, [])

  const run = useClockInRun()
  const { pathname } = useLocation()
  const pendingPath = useNavPending()
  // Đã bấm sang trang khác nhưng router chưa đổi xong (trang mới đang tải / render)
  const navigating = pendingPath !== null && pendingPath !== pathname

  // Router đổi xong (hoặc người dùng bấm lại đúng trang hiện tại) → xoá trạng thái chờ
  useEffect(() => {
    setNavPending(null)
    // Trang chủ dùng số liệu này để đưa trang hay dùng lên đầu kệ
    recordPageVisit(pathname)
  }, [pathname])

  // Đo hiệu năng: dự phòng khi không bắt được lúc bấm (link ngoài sidebar, trình
  // duyệt không có Navigation API). Đã ghi lúc bấm thì lệnh này không đổi gì.
  useLayoutEffect(() => {
    markNavigation(pathname)
  }, [pathname])

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
        // Không dùng backgroundAttachment: 'fixed': khung đã 100vh, không cuộn nên không
        // cần, mà 'fixed' bắt trình duyệt vẽ lại nền (và các lớp blur phía trên) liên tục

        // Fill backwards only: a transform kept after the end would make
        // these the containing block of every position: fixed inside.
        ...(riseDelay !== null && {
          '& > aside': { animation: `${sidebarIn} 560ms ${revealEase} ${delay + 120}ms backwards` },
          '& > main': { animation: `${pageIn} 640ms ${revealEase} ${delay + 220}ms backwards` },
        }),
      })}
    >
      <MascotProvider>
        <LeftSidebar onToggleMode={onToggleMode} onWidthChange={slideMain} />
        <Box
          ref={mainRef}
          component="main"
          aria-busy={navigating}
          sx={{
            position: 'relative',
            display: 'flex',
            flex: 1,
            minWidth: 0,
            minHeight: 0,
            overflow: 'hidden',

            // see slideMain
            '&[data-sliding]': { willChange: 'transform' },
            // Only the elements that carry a blur – a universal selector would
            // restyle every DataGrid cell when the attribute is set and removed
            '&[data-sliding] :is(header, .app-glass, .MuiCard-root, .MuiDataGrid-root)': {
              backdropFilter: 'none !important',
              WebkitBackdropFilter: 'none !important',
            },
          }}
        >
          {/* Phản hồi tức thì khi bấm chuyển trang: thanh chạy trên cùng.
              Trễ 120ms để chuyển trang nhanh (đã tải sẵn) không bị nháy. */}
          {navigating && (
            <LinearProgress
              sx={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                zIndex: 10,
                height: 2,
                animation: `${fadeIn} 160ms ease-out 120ms both`,
              }}
            />
          )}

          {/* Lớp phủ mờ khi đang chuyển trang. Không đổi opacity của chính trang:
              làm vậy gom cả trang thành 1 lớp, mọi backdrop-filter bên trong phải vẽ lại
              2 lần (mờ đi + hiện lại) và nhảy về 1 không transition → nháy. */}
          {navigating && (
            <Box
              aria-hidden
              sx={(theme) => ({
                position: 'absolute',
                inset: 0,
                zIndex: 9,
                bgcolor: alpha(theme.palette.background.default, 0.45),
                animation: `${fadeIn} 180ms ease 120ms both`,
              })}
            />
          )}

          {/* Không đặt key theo pathname: KeepAliveOutlet phải giữ nguyên để không mount lại các trang đã mở */}
          <Box
            sx={{
              display: 'flex',
              flex: 1,
              minWidth: 0,
              minHeight: 0,
            }}
          >
            {/* giữ các trang đã mở (ẩn) → chuyển qua lại không tải lại */}
            <KeepAliveOutlet fallback={<PageFallback />} />
          </Box>
        </Box>

        {/* đặt ngoài Outlet → không re-mount khi chuyển trang */}
        <Mascot />
      </MascotProvider>
    </Box>
  )
}
