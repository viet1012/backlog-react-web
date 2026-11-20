import { beforeEach, describe, expect, it, vi } from 'vitest'

// Mã nhân viên đang đăng nhập (mẹo nhớ theo từng người)
let employeeId: string | null = 'E001'

vi.mock('../../../services/authService', () => ({
  getCurrentEmployeeId: () => employeeId,
}))

// localStorage tối giản (test chạy trên Node)
function memoryStorage(): Storage {
  const data = new Map<string, string>()

  return {
    get length() { return data.size },
    clear: () => data.clear(),
    getItem: (key) => data.get(key) ?? null,
    key: (index) => [...data.keys()][index] ?? null,
    removeItem: (key) => { data.delete(key) },
    setItem: (key, value) => { data.set(key, String(value)) },
  }
}

// Module giữ trạng thái "phiên này đã hiện mẹo" → nạp lại cho mỗi test (= phiên mới)
async function freshSession() {
  vi.resetModules()
  return import('./shortcutTips')
}

beforeEach(() => {
  employeeId = 'E001'
  vi.stubGlobal('localStorage', memoryStorage())
})

describe('shortcutTips', () => {
  it('mỗi phiên tối đa 1 mẹo', async () => {
    const tips = await freshSession()

    expect(tips.canShowTip('intro')).toBe(true)
    tips.claimTip('intro')

    // phiên này đã có mẹo → mẹo khác chờ phiên sau
    expect(tips.canShowTip('refresh')).toBe(false)

    const next = await freshSession()
    expect(next.canShowTip('refresh')).toBe(true)
  })

  it('mỗi mẹo chỉ hiện 1 lần cho mỗi người', async () => {
    const tips = await freshSession()
    tips.claimTip('intro')

    const next = await freshSession()
    expect(next.canShowTip('intro')).toBe(false)

    // người khác trên cùng máy vẫn thấy
    employeeId = 'E002'
    expect(next.canShowTip('intro')).toBe(true)
  })

  it('đã tự dùng phím thì không nhắc', async () => {
    const tips = await freshSession()

    tips.markTipDone('search')
    expect(tips.canShowTip('search')).toBe(false)
    // chưa hiện mẹo nào trong phiên → mẹo khác vẫn được
    expect(tips.canShowTip('refresh')).toBe(true)
  })

  it('nhắc khi dùng chuột tới lần thứ MOUSE_USES_BEFORE_TIP', async () => {
    const tips = await freshSession()
    const results = Array.from({ length: tips.MOUSE_USES_BEFORE_TIP }, () => tips.countMouseUse('refresh'))

    expect(results.at(-1)).toBe(true)
    expect(results.slice(0, -1).every((r) => !r)).toBe(true)
  })

  it('localStorage hỏng / bị chặn: không lỗi, coi như chưa xem', async () => {
    vi.stubGlobal('localStorage', {
      getItem: () => { throw new Error('blocked') },
      setItem: () => { throw new Error('blocked') },
    })

    const tips = await freshSession()

    expect(tips.isTipDone('intro')).toBe(false)
    expect(() => tips.claimTip('intro')).not.toThrow()
  })
})
