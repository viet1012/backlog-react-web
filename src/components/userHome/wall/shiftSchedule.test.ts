import { describe, expect, it } from 'vitest'

import { clockLabel, formatCountdown, getShiftNow } from './shiftSchedule'

// 2026-11-23 là thứ Hai
const at = (h: number, m = 0, s = 0, day = 23) => new Date(2026, 10, day, h, m, s)

describe('getShiftNow – ca hành chính', () => {
  it('trước 08:00: chưa vào ca', () => {
    expect(getShiftNow(at(7, 30)).state).toEqual({ kind: 'before' })
  })

  it('giờ làm việc: không đếm ngược tới giờ nghỉ', () => {
    expect(getShiftNow(at(8)).state).toEqual({ kind: 'work' })
    expect(getShiftNow(at(9, 59, 59)).state).toEqual({ kind: 'work' })
    expect(getShiftNow(at(16, 59)).state).toEqual({ kind: 'work' })
  })

  it('giải lao 10:00–10:10 và 15:35–15:45: đếm ngược tới lúc quay lại', () => {
    expect(getShiftNow(at(10, 3, 48)).state).toEqual({ kind: 'break', endsAt: 610, leftSeconds: 372 })
    expect(getShiftNow(at(15, 35)).state).toMatchObject({ kind: 'break', endsAt: 945 })
    expect(getShiftNow(at(10, 10)).state.kind).toBe('work')
  })

  it('nghỉ trưa 12:00–13:00', () => {
    expect(getShiftNow(at(12, 30)).state).toEqual({ kind: 'lunch', endsAt: 780, leftSeconds: 1800 })
    expect(getShiftNow(at(13)).state.kind).toBe('work')
  })

  it('từ 17:00: hết giờ, ca tới là ngày làm kế tiếp', () => {
    const state = getShiftNow(at(17)).state
    expect(state.kind).toBe('after')
    if (state.kind === 'after') expect(state.nextDay.getDate()).toBe(24)
  })

  it('thứ Bảy làm, Chủ nhật nghỉ; hết giờ thứ Bảy thì ca tới là thứ Hai', () => {
    expect(getShiftNow(at(9, 0, 0, 28)).state.kind).toBe('work')
    const saturdayEvening = getShiftNow(at(18, 0, 0, 28)).state
    if (saturdayEvening.kind === 'after') expect(saturdayEvening.nextDay.getDate()).toBe(30)
    const sunday = getShiftNow(at(9, 0, 0, 29)).state
    expect(sunday.kind).toBe('dayOff')
    if (sunday.kind === 'dayOff') expect(sunday.nextDay.getDay()).toBe(1)
  })
})

describe('định dạng', () => {
  it('clockLabel / formatCountdown', () => {
    expect(clockLabel(945)).toBe('15:45')
    expect(formatCountdown(372)).toBe('06:12')
    expect(formatCountdown(3600)).toBe('60:00')
    expect(formatCountdown(-3)).toBe('00:00')
  })
})
