import type { ReactNode } from 'react'

import { getMessages } from '../../../i18n/i18nContext'

/**
 * App-wide toasts. Call from anywhere (components, hooks, services):
 *
 *   notify.success('Đã lưu 12 ô', { undo: () => restore() })
 *   notify.error(t.common.exportFailed, { detail: err.message })
 *
 *   const p = notify.progress(t.common.exportProgress(null))
 *   p.update(0.45)                 // "Đang xuất... 45%"
 *   p.success(t.common.exportDone(name))
 *
 * <NotifyHost /> (mounted once in App) renders them. Pages never render their
 * own Snackbar/Alert for action feedback.
 */

export type ToastTone = 'success' | 'error' | 'warning' | 'info' | 'progress'

export interface ToastAction {
  label: string
  /** May return a promise: the button shows a spinner until it settles */
  onClick: () => void | Promise<void>
}

export interface ToastOptions {
  /** Second line, e.g. the raw API error */
  detail?: string | null
  action?: ToastAction
  /** Shorthand for an "Undo" action */
  undo?: () => void | Promise<void>
  /** ms before auto close; null = stay until closed */
  duration?: number | null
  /** Same key replaces the previous toast instead of stacking a new one */
  key?: string
}

export interface Toast {
  id: number
  key?: string
  tone: ToastTone
  message: ReactNode
  detail?: string | null
  action?: ToastAction
  /** 0..1, or null = indeterminate (progress tone only) */
  progress?: number | null
  duration: number | null
}

export interface ProgressHandle {
  /** fraction 0..1, or null when the total is unknown */
  update: (fraction: number | null, message?: ReactNode) => void
  success: (message: ReactNode, options?: ToastOptions) => void
  error: (message: ReactNode, options?: ToastOptions) => void
  dismiss: () => void
}

const MAX_VISIBLE = 4

const DEFAULT_DURATION: Record<ToastTone, number | null> = {
  success: 4000,
  info: 4000,
  warning: 6000,
  error: 8000,
  progress: null,
}

// Undo needs time to read + reach the button
const UNDO_DURATION = 8000

let toasts: Toast[] = []
let nextId = 1
const listeners = new Set<() => void>()

function emit() {
  for (const listener of listeners) listener()
}

export function subscribeToasts(listener: () => void) {
  listeners.add(listener)

  return () => {
    listeners.delete(listener)
  }
}

export function getToasts(): Toast[] {
  return toasts
}

function show(tone: ToastTone, message: ReactNode, options: ToastOptions = {}, extra: Partial<Toast> = {}): number {
  const action = options.undo
    ? { label: getMessages().common.undo, onClick: options.undo }
    : options.action

  const toast: Toast = {
    id: nextId++,
    key: options.key,
    tone,
    message,
    detail: options.detail,
    action,
    duration: options.duration !== undefined
      ? options.duration
      : options.undo ? UNDO_DURATION : DEFAULT_DURATION[tone],
    ...extra,
  }

  const rest = options.key ? toasts.filter((t) => t.key !== options.key) : toasts

  // Oldest finished toasts make room first; running progress stays
  let next = [...rest, toast]
  while (next.length > MAX_VISIBLE) {
    const drop = next.findIndex((t) => t.tone !== 'progress')
    next = next.filter((_, i) => i !== (drop === -1 ? 0 : drop))
  }

  toasts = next
  emit()

  return toast.id
}

function patch(id: number, changes: Partial<Toast>) {
  if (!toasts.some((t) => t.id === id)) return

  toasts = toasts.map((t) => (t.id === id ? { ...t, ...changes } : t))
  emit()
}

function dismiss(id: number) {
  if (!toasts.some((t) => t.id === id)) return

  toasts = toasts.filter((t) => t.id !== id)
  emit()
}

/** Replace a toast in place (keeps its slot, restarts its timer via the new id) */
function replace(id: number, tone: ToastTone, message: ReactNode, options: ToastOptions = {}) {
  const index = toasts.findIndex((t) => t.id === id)

  if (index === -1) {
    show(tone, message, options)
    return
  }

  const previous = toasts[index]
  const action = options.undo
    ? { label: getMessages().common.undo, onClick: options.undo }
    : options.action

  toasts = toasts.map((t, i) => (i === index
    ? {
      id: nextId++,
      key: previous.key,
      tone,
      message,
      detail: options.detail,
      action,
      duration: options.duration !== undefined
        ? options.duration
        : options.undo ? UNDO_DURATION : DEFAULT_DURATION[tone],
    }
    : t))
  emit()
}

export const notify = {
  success: (message: ReactNode, options?: ToastOptions) => show('success', message, options),
  error: (message: ReactNode, options?: ToastOptions) => show('error', message, options),
  warning: (message: ReactNode, options?: ToastOptions) => show('warning', message, options),
  info: (message: ReactNode, options?: ToastOptions) => show('info', message, options),

  /**
   * Long task with a bar. `label` builds the text from the percentage
   * (null = unknown total), e.g. t.common.exportProgress.
   */
  progress(label: (pct: number | null) => ReactNode, options?: Pick<ToastOptions, 'key'>): ProgressHandle {
    const id = show('progress', label(null), { ...options, duration: null }, { progress: null })

    return {
      update(fraction, message) {
        const clamped = fraction == null ? null : Math.max(0, Math.min(1, fraction))
        const pct = clamped == null ? null : Math.round(clamped * 100)

        patch(id, { progress: clamped, message: message ?? label(pct) })
      },
      success: (message, opts) => replace(id, 'success', message, opts),
      error: (message, opts) => replace(id, 'error', message, opts),
      dismiss: () => dismiss(id),
    }
  },

  dismiss,
}

/** Message of an unknown thrown value, for `detail` */
export function errorDetail(error: unknown): string {
  return error instanceof Error ? error.message : String(error)
}
