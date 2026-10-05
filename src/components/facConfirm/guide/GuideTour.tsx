import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react'
import type { ReactNode } from 'react'

import ArrowBackRoundedIcon from '@mui/icons-material/ArrowBackRounded'
import ArrowForwardRoundedIcon from '@mui/icons-material/ArrowForwardRounded'
import CheckRoundedIcon from '@mui/icons-material/CheckRounded'
import CloseRoundedIcon from '@mui/icons-material/CloseRounded'

import {
  alpha,
  Box,
  Button,
  IconButton,
  Paper,
  Popper,
  Portal,
  Stack,
  Typography,
  useTheme,
} from '@mui/material'


// =========================================================
// TYPES
// =========================================================

export type GuidePlacement =
  | 'top' | 'top-start' | 'top-end'
  | 'bottom' | 'bottom-start' | 'bottom-end'
  | 'left' | 'left-start'
  | 'right' | 'right-start'

export interface GuideStep {
  id: string

  /**
   * Danh sách target cần highlight, dùng target ĐẦU TIÊN tìm thấy
   * (cho phép fallback).
   * - Bắt đầu bằng `.` hoặc `[` => CSS selector, khung sáng bao
   *   TẤT CẢ phần tử khớp.
   * - Còn lại => giá trị data-tour.
   * Bỏ trống => hiện hộp thoại giữa màn hình.
   */
  targets?: string[]

  /**
   * Kéo đáy khung sáng xuống bằng đáy phần tử này
   * (cùng quy tắc với targets). Khung sáng cũng bị cắt
   * ngang theo phần tử này.
   */
  extendTo?: string

  /** Gọi khi vào bước, TRƯỚC khi tìm phần tử */
  onEnter?: () => void

  /** Nhãn nhỏ phía trên tiêu đề, ví dụ "Bước 1" */
  step?: string

  title: string

  description?: ReactNode

  bullets?: ReactNode[]

  /** Demo / hình minh họa hiển thị phía trên mô tả */
  media?: ReactNode

  /** Khối hiển thị SAU danh sách bullets (ví dụ Note) */
  after?: ReactNode

  placement?: GuidePlacement
}

interface GuideTourProps {
  open: boolean
  steps: GuideStep[]
  onClose: (completed: boolean) => void
}

interface ResolvedTarget {
  stepId: string

  /** null => bước không có phần tử, hiện giữa màn hình */
  rect: DOMRect | null
}


// =========================================================
// HELPERS
// =========================================================

const SPOT_PADDING = 6

// Thời gian chờ phần tử được dựng sau onEnter
// (ví dụ DataGrid vừa cuộn tới cột mới)
const ENTER_RETRY_MS = 600

function isSelector(target: string): boolean {
  return target.startsWith('.') || target.startsWith('[')
}

function queryTarget(
  target: string,
): HTMLElement[] {
  // Bỏ qua phần tử đang bị ẩn (display: none)
  const isVisible = (el: HTMLElement) =>
    el.getClientRects().length > 0

  if (isSelector(target)) {
    return Array.from(
      document.querySelectorAll<HTMLElement>(target),
    ).filter(isVisible)
  }

  const el = document.querySelector<HTMLElement>(
    `[data-tour="${target}"]`,
  )

  return el && isVisible(el) ? [el] : []
}

/** Hình chữ nhật bao tất cả phần tử, áp dụng extendTo */
function getSpotRect(
  els: HTMLElement[],
  extendEl: HTMLElement | null,
): DOMRect | null {
  let top = Infinity
  let left = Infinity
  let right = -Infinity
  let bottom = -Infinity

  for (const el of els) {
    const r = el.getBoundingClientRect()

    top = Math.min(top, r.top)
    left = Math.min(left, r.left)
    right = Math.max(right, r.right)
    bottom = Math.max(bottom, r.bottom)
  }

  if (extendEl) {
    const r = extendEl.getBoundingClientRect()

    bottom = r.bottom

    // Cột ảo hóa của DataGrid có thể nằm ngoài vùng nhìn thấy
    left = Math.max(left, r.left)
    right = Math.min(right, r.right)
  }

  if (right <= left || bottom <= top) {
    return null
  }

  return new DOMRect(left, top, right - left, bottom - top)
}

function prefersReducedMotion(): boolean {
  return typeof window !== 'undefined'
    && Boolean(
      window.matchMedia?.('(prefers-reduced-motion: reduce)').matches,
    )
}


// =========================================================
// COMPONENT
//
// Chỉ mount nội dung khi open => mỗi lần mở là state mới,
// luôn bắt đầu từ bước 1 (không cần setState trong effect).
// =========================================================

export function GuideTour({
  open,
  steps,
  onClose,
}: GuideTourProps) {

  if (!open || steps.length === 0) {
    return null
  }

  return (
    <GuideTourContent
      steps={steps}
      onClose={onClose}
    />
  )
}


function GuideTourContent({
  steps,
  onClose,
}: Omit<GuideTourProps, 'open'>) {

  const theme = useTheme()

  const [index, setIndex] = useState(0)

  const [resolved, setResolved] =
    useState<ResolvedTarget | null>(null)

  const step = steps[index]
  const isFirst = index === 0
  const isLast = index === steps.length - 1
  const reduceMotion = prefersReducedMotion()

  // Bỏ qua kết quả của bước trước trong khung hình chuyển bước.
  // pending => chưa tìm xong phần tử của bước hiện tại.
  const pending =
    resolved === null
    || resolved.stepId !== step.id

  const target =
    pending
      ? null
      : resolved.rect


  // Tìm phần tử cần highlight + theo dõi vị trí.
  // Vòng requestAnimationFrame đọc rect mỗi khung hình,
  // chỉ setState khi vị trí / kích thước / viewport đổi.
  useEffect(() => {
    step.onEnter?.()

    const targets = step.targets ?? []
    const startedAt = performance.now()

    let frame = 0
    let lastKey: string | null = null
    let scrolled = false

    const tick = () => {
      // Sau onEnter: chờ target đầu tiên tối đa ENTER_RETRY_MS
      const waiting =
        step.onEnter !== undefined
        && performance.now() - startedAt < ENTER_RETRY_MS

      const extendEl = step.extendTo
        ? queryTarget(step.extendTo)[0] ?? null
        : null

      let rect: DOMRect | null = null
      let scrollEl: HTMLElement | null = null

      for (const t of waiting ? targets.slice(0, 1) : targets) {
        const els = queryTarget(t)

        rect = els.length > 0
          ? getSpotRect(els, extendEl)
          : null

        if (rect) {
          // Không scrollIntoView phần tử trong DataGrid
          // (header là vùng overflow: hidden, sẽ bị lệch)
          scrollEl = isSelector(t) ? extendEl : els[0]
          break
        }
      }

      if (!rect && waiting) {
        frame = requestAnimationFrame(tick)
        return
      }

      const key = rect
        ? [
            rect.top,
            rect.left,
            rect.width,
            rect.height,
            window.innerWidth,
            window.innerHeight,
          ].join('|')
        : 'none'

      if (key !== lastKey) {
        lastKey = key

        setResolved({
          stepId: step.id,
          rect,
        })
      }

      // Không có phần tử => dừng
      if (!rect) {
        return
      }

      if (!scrolled) {
        scrolled = true

        scrollEl?.scrollIntoView({
          block: 'nearest',
          inline: 'nearest',
          behavior: reduceMotion ? 'auto' : 'smooth',
        })
      }

      frame = requestAnimationFrame(tick)
    }

    frame = requestAnimationFrame(tick)

    return () => cancelAnimationFrame(frame)
  }, [step, reduceMotion])


  // Popper neo theo khung sáng đã tính (virtual anchor)
  const anchor = useMemo(
    () =>
      target
        ? { getBoundingClientRect: () => target }
        : null,
    [target],
  )


  const goNext = useCallback(() => {
    if (isLast) {
      onClose(true)
    } else {
      setIndex((i) => i + 1)
    }
  }, [isLast, onClose])

  const goPrev = useCallback(() => {
    setIndex((i) => Math.max(0, i - 1))
  }, [])


  // Phím tắt: ← → Esc
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose(false)
      else if (e.key === 'ArrowRight') goNext()
      else if (e.key === 'ArrowLeft') goPrev()
    }

    window.addEventListener('keydown', onKey)

    return () => window.removeEventListener('keydown', onKey)
  }, [goNext, goPrev, onClose])


  const zBase = theme.zIndex.modal + 10
  const dim = alpha('#0f172a', 0.58)
  const transition = reduceMotion ? 'none' : 'all 220ms ease'
  const progress = ((index + 1) / steps.length) * 100

  // Khung sáng vừa cao vừa rộng (ví dụ cả bảng) => không còn
  // chỗ đặt card cạnh khung sáng, neo card vào góc dưới bên phải.
  const docked =
    target !== null
    && target.height > window.innerHeight * 0.55
    && target.width > window.innerWidth * 0.6


  // =========================================================
  // CARD
  // =========================================================

  const card = (
    <Paper
      key={step.id}
      role="dialog"
      aria-modal="true"
      aria-labelledby="guide-tour-title"
      elevation={10}
      sx={{
        width: step.media ? 400 : 380,
        maxWidth: 'calc(100vw - 32px)',
        maxHeight: 'calc(100vh - 32px)',
        display: 'flex',
        flexDirection: 'column',
        borderRadius: 2.5,
        overflow: 'hidden',
        border: 1,
        borderColor: 'divider',
      }}
    >
      {/* Thanh tiến độ */}
      <Box
        role="progressbar"
        aria-label="Tiến độ hướng dẫn"
        aria-valuemin={1}
        aria-valuemax={steps.length}
        aria-valuenow={index + 1}
        aria-valuetext={`Bước ${index + 1} / ${steps.length}`}
        sx={{
          height: 3,
          flexShrink: 0,
          bgcolor: alpha(theme.palette.primary.main, 0.15),
        }}
      >
        <Box
          sx={{
            height: '100%',
            width: `${progress}%`,
            bgcolor: 'primary.main',
            transition,
          }}
        />
      </Box>

      <Box
        sx={{
          p: 2.5,
          pb: 2,
          flex: '1 1 auto',
          minHeight: 0,
          overflowY: 'auto',
        }}
      >
        <Stack
          direction="row"
          spacing={1}
          sx={{ alignItems: 'flex-start' }}
        >
          <Box sx={{ flex: 1, minWidth: 0 }}>
            {step.step && (
              <Typography
                variant="caption"
                sx={{
                  color: 'primary.main',
                  fontWeight: 700,
                  display: 'block',
                  mb: 0.25,
                }}
              >
                {step.step}
              </Typography>
            )}

            <Typography
              id="guide-tour-title"
              sx={{ fontSize: 17, fontWeight: 700, lineHeight: 1.35 }}
            >
              {step.title}
            </Typography>
          </Box>

          <IconButton
            size="small"
            aria-label="Đóng hướng dẫn"
            onClick={() => onClose(false)}
            sx={{ mt: -0.5, mr: -1 }}
          >
            <CloseRoundedIcon fontSize="small" />
          </IconButton>
        </Stack>

        {step.media && (
          <Box sx={{ mt: 1.5 }}>
            {step.media}
          </Box>
        )}

        {/* div: description có thể chứa khối div (GuideBody, Note...) */}
        {step.description && (
          <Typography
            component="div"
            variant="body2"
            sx={{ mt: 1.25, color: 'text.primary', lineHeight: 1.6 }}
          >
            {step.description}
          </Typography>
        )}

        {step.bullets && step.bullets.length > 0 && (
          <Box
            component="ul"
            sx={{
              m: 0,
              mt: step.description ? 1.25 : 0,
              pl: 2.25,
              display: 'grid',
              gap: 0.75,
              '& li': {
                typography: 'body2',
                lineHeight: 1.55,
              },
              '& li::marker': {
                color: 'primary.main',
              },
            }}
          >
            {step.bullets.map((bullet, i) => (
              <li key={i}>{bullet}</li>
            ))}
          </Box>
        )}

        {step.after && (
          <Box sx={{ mt: 1.25 }}>
            {step.after}
          </Box>
        )}
      </Box>

      <Stack
        direction="row"
        sx={{
          alignItems: 'center',
          px: 2.5,
          py: 1.25,
          flexShrink: 0,
          borderTop: 1,
          borderColor: 'divider',
          bgcolor: 'action.hover',
        }}
      >
        <Box sx={{ flex: 1 }} />

        {isFirst ? (
          <Button
            size="small"
            color="inherit"
            onClick={() => onClose(false)}
          >
            Bỏ qua
          </Button>
        ) : (
          <Button
            size="small"
            color="inherit"
            startIcon={<ArrowBackRoundedIcon />}
            onClick={goPrev}
          >
            Quay lại
          </Button>
        )}

        <Button
          size="small"
          variant="contained"
          disableElevation
          autoFocus
          endIcon={
            isLast
              ? <CheckRoundedIcon />
              : <ArrowForwardRoundedIcon />
          }
          onClick={goNext}
          sx={{ ml: 1 }}
        >
          {isLast ? 'Hoàn tất' : isFirst ? 'Bắt đầu' : 'Tiếp'}
        </Button>
      </Stack>
    </Paper>
  )


  // =========================================================
  // RENDER
  // =========================================================

  return (
    <Portal>
      {/* Lớp chặn thao tác phía sau khi đang xem hướng dẫn */}
      <Box
        sx={{
          position: 'fixed',
          inset: 0,
          zIndex: zBase,
          bgcolor: target ? 'transparent' : dim,
        }}
      />

      {/* Spotlight: khoét sáng vùng đang giới thiệu */}
      {target && (
        <Box
          sx={{
            position: 'fixed',
            top: target.top - SPOT_PADDING,
            left: target.left - SPOT_PADDING,
            width: target.width + SPOT_PADDING * 2,
            height: target.height + SPOT_PADDING * 2,
            borderRadius: 1.5,
            boxShadow: `0 0 0 9999px ${dim}, 0 0 0 2px ${theme.palette.primary.main}`,
            zIndex: zBase + 1,
            pointerEvents: 'none',
            transition,
          }}
        />
      )}

      {pending ? null : docked ? (
        <Box
          sx={{
            position: 'fixed',
            right: 16,
            bottom: 16,
            zIndex: zBase + 2,
          }}
        >
          {card}
        </Box>
      ) : anchor ? (
        <Popper
          key={step.id}
          open
          anchorEl={anchor}
          placement={step.placement ?? 'bottom-start'}
          sx={{ zIndex: zBase + 2 }}
          modifiers={[
            { name: 'offset', options: { offset: [0, 16] } },
            { name: 'flip', options: { padding: 16 } },
            {
              name: 'preventOverflow',
              options: { padding: 16, altAxis: true, tether: false },
            },
          ]}
        >
          {card}
        </Popper>
      ) : (
        <Box
          sx={{
            position: 'fixed',
            inset: 0,
            zIndex: zBase + 2,
            display: 'grid',
            placeItems: 'center',
            p: 2,
          }}
        >
          {card}
        </Box>
      )}
    </Portal>
  )
}
