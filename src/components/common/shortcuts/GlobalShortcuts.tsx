import { useEffect, useEffectEvent, useState } from 'react'

import { useI18n } from '../../../i18n/useI18n'
import { openQuickJump } from '../../layout/quickJump'
import { useClockInRun } from '../../shift/clockInStore'
import { notify } from '../notify'
import {
  countUnsavedChanges,
  isTypingTarget,
  onOpenShortcutHelp,
} from './shortcutsStore'
import {
  canShowTip,
  claimTip,
  countMouseUse,
  markTipDone,
  type ShortcutTipId,
} from './shortcutTips'
import { Kbd, ShortcutHelpDialog } from './ShortcutHelpDialog'

// Mẹo "có phím tắt" hiện sau khi vào app một lúc (không chen vào lúc trang đang tải)
const INTRO_DELAY_MS = 8000
const TIP_DURATION_MS = 10_000

const SEARCH_SELECTOR = 'input[data-shortcut="search"]'
const REFRESH_SELECTOR = '[data-header-action="refresh"] button'

/** Phần tử đang thật sự hiện (trang ẩn của KeepAlive bị display: none) */
function isVisible(el: Element): boolean {
  return typeof el.checkVisibility === 'function'
    ? el.checkVisibility()
    : el.getClientRects().length > 0
}

function firstVisible<T extends Element>(selector: string): T | null {
  for (const el of document.querySelectorAll<T>(selector)) {
    if (isVisible(el)) return el
  }
  return null
}

// Đang có hộp thoại / menu / drawer dạng modal: để nó tự xử lý phím
const hasOpenModal = () => document.querySelector('.MuiModal-root:not(.MuiModal-hidden)') !== null

// Đang thao tác trong bảng (DataGrid: gõ chữ là sửa ô) hoặc trong hộp thoại
const inWidget = (target: EventTarget | null) => target instanceof Element
  && target.closest('[role="grid"], [role="treegrid"], [role="dialog"], [role="menu"], [role="listbox"]') !== null

/** "Bấm {key} để…" → chữ + ô phím */
function withKey(text: string, key: string) {
  const [before, after = ''] = text.split('{key}')

  return (
    <>
      {before}
      <Kbd size="small">{key}</Kbd>
      {after}
    </>
  )
}

/**
 * Phím tắt chung (xem shortcutsStore.ts). Gắn 1 lần trong MainLayout.
 *   ?  bảng phím tắt   /  vào ô tìm (không có: mở tìm trang)   r  làm mới
 * Ctrl+K, Ctrl+B do LeftSidebar xử lý (đã có từ trước).
 * Kèm mẹo cho người chưa biết phím tắt (shortcutTips.ts).
 */
export function GlobalShortcuts() {
  const { t } = useI18n()
  const [helpOpen, setHelpOpen] = useState(false)

  function openHelp() {
    markTipDone('intro')
    setHelpOpen(true)
  }

  const showTip = useEffectEvent((id: ShortcutTipId) => {
    if (!canShowTip(id)) return
    claimTip(id)

    const message = id === 'intro'
      ? withKey(t.shortcuts.tipIntro, '?')
      : id === 'refresh'
        ? withKey(t.shortcuts.tipRefresh, 'R')
        : withKey(t.shortcuts.tipSearch, '/')

    notify.info(message, {
      key: 'shortcut-tip',
      duration: TIP_DURATION_MS,
      action: { label: t.shortcuts.tipShowAll, onClick: openHelp },
    })
  })

  const onKeyDown = useEffectEvent((event: KeyboardEvent) => {
    // trang tự xử lý phím này rồi (vd ? của Machine Locator mở hướng dẫn riêng)
    if (event.defaultPrevented || event.repeat || event.isComposing) return
    if (event.ctrlKey || event.metaKey || event.altKey) return
    if (isTypingTarget(event.target) || inWidget(event.target) || hasOpenModal()) return

    switch (event.key) {
      case '?': {
        event.preventDefault()
        openHelp()
        return
      }

      case '/': {
        event.preventDefault()
        markTipDone('search')
        const input = firstVisible<HTMLInputElement>(`${SEARCH_SELECTOR}:not(:disabled)`)

        if (input) {
          input.focus()
          input.select()
        } else {
          openQuickJump()
        }
        return
      }

      // 'R': đang bật Caps Lock
      case 'r':
      case 'R': {
        const button = firstVisible<HTMLButtonElement>(REFRESH_SELECTOR)
        if (!button || button.disabled) return

        event.preventDefault()
        markTipDone('refresh')

        // Không để một phím bấm nhầm làm mất thay đổi chưa lưu
        const unsaved = countUnsavedChanges()
        if (unsaved > 0) {
          notify.warning(t.shortcuts.unsavedBlocked(unsaved), { key: 'shortcut-unsaved' })
          return
        }

        button.click()
      }
    }
  })

  // Dùng chuột cho việc có phím tắt (lần thứ 2 trong phiên) → nhắc phím tắt 1 lần
  const onMouseUse = useEffectEvent((event: MouseEvent) => {
    if (!(event.target instanceof Element)) return

    // detail = 0: click do code / bàn phím (vd chính phím R) – không tính
    if (event.type === 'click' && event.detail > 0 && event.target.closest(REFRESH_SELECTOR)) {
      if (countMouseUse('refresh')) window.setTimeout(() => showTip('refresh'), 600)
      return
    }

    if (event.type === 'pointerdown') {
      const input = event.target.closest<HTMLInputElement>(SEARCH_SELECTOR)

      if (input && document.activeElement !== input && countMouseUse('search')) {
        window.setTimeout(() => showTip('search'), 400)
      }
    }
  })

  useEffect(() => {
    // bubble trên window: chạy SAU listener của trang (document) => trang được ưu tiên
    const handleKey = (event: KeyboardEvent) => onKeyDown(event)
    const handleMouse = (event: MouseEvent) => onMouseUse(event)

    window.addEventListener('keydown', handleKey)
    window.addEventListener('click', handleMouse, true)
    window.addEventListener('pointerdown', handleMouse, true)
    const offOpen = onOpenShortcutHelp(() => {
      markTipDone('intro')
      setHelpOpen(true)
    })

    return () => {
      window.removeEventListener('keydown', handleKey)
      window.removeEventListener('click', handleMouse, true)
      window.removeEventListener('pointerdown', handleMouse, true)
      offOpen()
    }
  }, [])

  // Giới thiệu 1 lần (chưa từng thấy / chưa từng bấm ?), sau khi màn chấm công đã cuộn lên.
  // Lúc đó đang mở hộp thoại thì để phiên sau.
  const clockIn = useClockInRun()

  useEffect(() => {
    if (clockIn) return

    const intro = window.setTimeout(() => {
      if (!hasOpenModal()) showTip('intro')
    }, INTRO_DELAY_MS)

    return () => window.clearTimeout(intro)
  }, [clockIn])

  return <ShortcutHelpDialog open={helpOpen} onClose={() => setHelpOpen(false)} />
}
