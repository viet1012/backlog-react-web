import { useEffect, useRef, useState, useSyncExternalStore } from 'react'
import { Box, Button, CircularProgress, IconButton, LinearProgress, Paper, Typography } from '@mui/material'
import { alpha, keyframes, type Theme } from '@mui/material/styles'
import CheckCircleRoundedIcon from '@mui/icons-material/CheckCircleRounded'
import CloseRoundedIcon from '@mui/icons-material/CloseRounded'
import DownloadingRoundedIcon from '@mui/icons-material/DownloadingRounded'
import ErrorRoundedIcon from '@mui/icons-material/ErrorRounded'
import InfoRoundedIcon from '@mui/icons-material/InfoRounded'
import WarningRoundedIcon from '@mui/icons-material/WarningRounded'

import { useI18n } from '../../../i18n/useI18n'
import { glassPanelSx, uiTokens } from '../../../theme/uiTokens'
import { getToasts, notify, subscribeToasts, type Toast, type ToastTone } from './notifyStore'

const enter = keyframes`
  from { opacity: 0; transform: translateY(12px) scale(0.98); }
  to { opacity: 1; transform: none; }
`

const ICONS: Record<ToastTone, typeof InfoRoundedIcon> = {
  success: CheckCircleRoundedIcon,
  error: ErrorRoundedIcon,
  warning: WarningRoundedIcon,
  info: InfoRoundedIcon,
  progress: DownloadingRoundedIcon,
}

function toneColor(theme: Theme, tone: ToastTone): string {
  switch (tone) {
    case 'success': return theme.palette.success.main
    case 'error': return theme.palette.error.main
    case 'warning': return theme.palette.warning.main
    default: return theme.palette.primary.main
  }
}

/** Renders the toasts from `notify`. Mount once, inside ThemeProvider. */
export function NotifyHost() {
  const toasts = useSyncExternalStore(subscribeToasts, getToasts, getToasts)

  if (toasts.length === 0) return null

  return (
    <Box
      sx={(theme) => ({
        position: 'fixed',
        left: '50%',
        bottom: 16,
        transform: 'translateX(-50%)',
        zIndex: theme.zIndex.snackbar,
        width: 'min(440px, calc(100vw - 32px))',
        display: 'flex',
        flexDirection: 'column',
        gap: 1,
        pointerEvents: 'none',
        '@media print': { display: 'none' },
      })}
    >
      {toasts.map((toast) => <ToastItem key={toast.id} toast={toast} />)}
    </Box>
  )
}

function ToastItem({ toast }: { toast: Toast }) {
  const { t } = useI18n()
  const [busy, setBusy] = useState(false)
  const [paused, setPaused] = useState(false)

  // Auto close; hover / focus pauses and keeps the time that was left
  const remaining = useRef(toast.duration)

  useEffect(() => {
    if (paused || remaining.current == null || busy) return

    const startedAt = Date.now()
    const timer = window.setTimeout(() => notify.dismiss(toast.id), remaining.current)

    return () => {
      window.clearTimeout(timer)
      if (remaining.current != null) remaining.current -= Date.now() - startedAt
    }
  }, [paused, busy, toast.id])

  async function runAction() {
    if (!toast.action || busy) return

    setBusy(true)
    try {
      await toast.action.onClick()
    } catch (error) {
      // the action reports its own failure (usually with another toast)
      console.error('Toast action failed:', error)
    } finally {
      notify.dismiss(toast.id)
    }
  }

  const Icon = ICONS[toast.tone]
  const isError = toast.tone === 'error'
  const pct = toast.progress == null ? null : Math.round(toast.progress * 100)

  return (
    <Paper
      elevation={0}
      role={isError ? 'alert' : 'status'}
      aria-live={isError ? 'assertive' : 'polite'}
      onPointerEnter={() => setPaused(true)}
      onPointerLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
      sx={(theme) => {
        const c = toneColor(theme, toast.tone)

        return {
          ...glassPanelSx(theme),
          // toasts float over any page content: a bit more opaque than panels
          bgcolor: theme.palette.mode === 'dark' ? 'rgba(17,27,45,0.94)' : 'rgba(255,255,255,0.96)',
          boxShadow: theme.palette.mode === 'dark'
            ? '0 12px 32px rgba(0,0,0,0.42)'
            : '0 12px 32px rgba(15,23,42,0.16)',
          position: 'relative',
          overflow: 'hidden',
          pointerEvents: 'auto',
          borderRadius: uiTokens.card.borderRadius,
          pl: 1.5,
          pr: 0.75,
          py: 1,
          display: 'flex',
          alignItems: 'flex-start',
          gap: 1.25,
          animation: `${enter} 200ms ease-out`,
          '@media (prefers-reduced-motion: reduce)': { animation: 'none' },
          // tone stripe
          '&::before': {
            content: '""',
            position: 'absolute',
            left: 0,
            top: 0,
            bottom: 0,
            width: 4,
            bgcolor: c,
          },
          '& .toast-icon': { color: c },
        }
      }}
    >
      <Icon className="toast-icon" sx={{ fontSize: 20, mt: '1px', flexShrink: 0 }} />

      <Box sx={{ flex: 1, minWidth: 0, py: '1px' }}>
        <Typography sx={{ fontSize: 13, fontWeight: 700, lineHeight: 1.45, fontVariantNumeric: 'tabular-nums', overflowWrap: 'anywhere' }}>
          {toast.message}
        </Typography>

        {toast.detail && (
          <Typography
            title={toast.detail}
            sx={{
              mt: 0.25,
              fontSize: 12,
              lineHeight: 1.45,
              color: 'text.secondary',
              overflow: 'hidden',
              display: '-webkit-box',
              WebkitLineClamp: 3,
              WebkitBoxOrient: 'vertical',
              wordBreak: 'break-word',
            }}
          >
            {toast.detail}
          </Typography>
        )}

        {toast.tone === 'progress' && (
          <LinearProgress
            variant={pct == null ? 'indeterminate' : 'determinate'}
            value={pct ?? undefined}
            aria-label={typeof toast.message === 'string' ? toast.message : undefined}
            sx={{ mt: 0.75, mb: 0.25, height: 4, borderRadius: 2 }}
          />
        )}
      </Box>

      {toast.action && (
        <Button
          size="small"
          onClick={() => void runAction()}
          disabled={busy}
          startIcon={busy ? <CircularProgress size={12} color="inherit" /> : undefined}
          sx={(theme) => ({
            flexShrink: 0,
            alignSelf: 'center',
            minWidth: 0,
            px: 1.25,
            borderRadius: '8px',
            fontSize: 12.5,
            fontWeight: 800,
            textTransform: 'none',
            color: toneColor(theme, toast.tone),
            '&:hover': { bgcolor: alpha(toneColor(theme, toast.tone), 0.1) },
          })}
        >
          {toast.action.label}
        </Button>
      )}

      {toast.tone !== 'progress' && (
        <IconButton
          size="small"
          aria-label={t.common.dismiss}
          onClick={() => notify.dismiss(toast.id)}
          sx={{ flexShrink: 0, color: 'text.secondary', p: 0.5 }}
        >
          <CloseRoundedIcon sx={{ fontSize: 18 }} />
        </IconButton>
      )}
    </Paper>
  )
}
