import { useEffect, useState } from 'react'

/** Loads shorter than this show nothing (no skeleton flash on fast APIs) */
export const LOADING_DELAY_MS = 300

/**
 * True only once `active` has stayed true for `delay` ms; false again as soon
 * as `active` turns false.
 */
export function useDelayedFlag(active: boolean, delay = LOADING_DELAY_MS): boolean {
  const [shown, setShown] = useState(false)
  const [prevActive, setPrevActive] = useState(active)

  // reset during render (not in an effect) so a new load starts hidden again
  if (active !== prevActive) {
    setPrevActive(active)
    if (!active) setShown(false)
  }

  useEffect(() => {
    if (!active) return

    const timer = window.setTimeout(() => setShown(true), Math.max(0, delay))

    return () => window.clearTimeout(timer)
  }, [active, delay])

  return active && shown
}
