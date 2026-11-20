import { getCurrentEmployeeId } from '../../../services/authService'

/*
 * Mẹo phím tắt: cho người dùng biết có phím tắt mà không cần đọc tài liệu.
 *
 *   intro    lần đầu vào app sau khi có phím tắt: "Mới: bấm ? để xem phím tắt"
 *   refresh  bấm nút ⟳ bằng chuột lần thứ 2 trong phiên: "Lần sau bấm R"
 *   search   bấm chuột vào ô tìm lần thứ 2 trong phiên: "Lần sau bấm /"
 *
 * Quy tắc để không phiền:
 *   - mỗi mẹo hiện tối đa 1 lần cho mỗi người (nhớ theo mã nhân viên, localStorage)
 *   - mỗi phiên (lần mở tab) hiện tối đa 1 mẹo
 *   - đã dùng phím đó rồi (vd tự bấm /) thì coi như đã biết, không nhắc nữa
 */

export type ShortcutTipId = 'intro' | 'refresh' | 'search'

/** Số lần bấm chuột (trong phiên) trước khi nhắc phím tắt */
export const MOUSE_USES_BEFORE_TIP = 2

const storageKey = () => `shortcut-tips:${getCurrentEmployeeId() ?? 'guest'}`

let tipShownThisSession = false
const mouseUses = new Map<ShortcutTipId, number>()

function readDone(): Set<string> {
  try {
    const raw = localStorage.getItem(storageKey())
    return new Set(raw ? JSON.parse(raw) as string[] : [])
  } catch {
    return new Set()
  }
}

function writeDone(done: Set<string>) {
  try {
    localStorage.setItem(storageKey(), JSON.stringify([...done]))
  } catch {
    // trình duyệt chặn lưu: chỉ là mẹo, bỏ qua
  }
}

/** Đã hiện hoặc người dùng đã tự dùng phím này */
export function isTipDone(id: ShortcutTipId): boolean {
  return readDone().has(id)
}

/** Ghi nhận: đã biết phím này (đã hiện mẹo hoặc đã tự bấm) */
export function markTipDone(id: ShortcutTipId) {
  const done = readDone()
  if (done.has(id)) return

  done.add(id)
  writeDone(done)
}

/** Có được hiện mẹo này bây giờ không (chưa hiện lần nào, phiên này chưa có mẹo nào) */
export function canShowTip(id: ShortcutTipId): boolean {
  return !tipShownThisSession && !isTipDone(id)
}

/** Gọi ngay trước khi hiện mẹo */
export function claimTip(id: ShortcutTipId) {
  tipShownThisSession = true
  markTipDone(id)
}

/** Đếm 1 lần dùng chuột cho việc có phím tắt; trả về true khi tới lúc nhắc */
export function countMouseUse(id: ShortcutTipId): boolean {
  const n = (mouseUses.get(id) ?? 0) + 1
  mouseUses.set(id, n)

  return n >= MOUSE_USES_BEFORE_TIP && canShowTip(id)
}
