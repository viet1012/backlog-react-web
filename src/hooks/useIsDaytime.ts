import { useEffect, useState } from 'react'

// Mốc giờ ban ngày theo giờ máy người dùng: [DAY_START_HOUR, NIGHT_START_HOUR)
export const DAY_START_HOUR = 6
export const NIGHT_START_HOUR = 17

const CHECK_INTERVAL_MS = 60_000

function isDaytimeAt(date: Date) {
  const hour = date.getHours()
  return hour >= DAY_START_HOUR && hour < NIGHT_START_HOUR
}

// Chỉ khi dev: ?bg=day / ?bg=night để ép chế độ. Build production bỏ qua param này
function getDevForcedDaytime(): boolean | null {
  if (!import.meta.env.DEV) return null

  const bg = new URLSearchParams(window.location.search).get('bg')
  if (bg === 'day') return true
  if (bg === 'night') return false
  return null
}

export function useIsDaytime() {
  const [forcedDaytime] = useState(getDevForcedDaytime)
  const [isDaytime, setIsDaytime] = useState(() => isDaytimeAt(new Date()))

  useEffect(() => {
    if (forcedDaytime !== null) return

    const timer = window.setInterval(() => {
      setIsDaytime(isDaytimeAt(new Date()))
    }, CHECK_INTERVAL_MS)

    return () => {
      window.clearInterval(timer)
    }
  }, [forcedDaytime])

  return forcedDaytime ?? isDaytime
}
