import { useEffect, useState } from 'react'

import { getDayPeriod } from './shiftParts'

// Re-checked every minute so greetings / avatars follow the clock.
export function useDayPeriod() {
  const [period, setPeriod] = useState(() => getDayPeriod(new Date()))

  useEffect(() => {
    const timer = window.setInterval(() => setPeriod(getDayPeriod(new Date())), 60_000)
    return () => window.clearInterval(timer)
  }, [])

  return period
}
