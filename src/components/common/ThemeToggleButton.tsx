import {
  useEffect,
  useRef,
  useState,
  type MouseEvent,
  type TransitionEvent,
} from 'react'

import DarkModeRoundedIcon from '@mui/icons-material/DarkModeRounded'
import LightModeRoundedIcon from '@mui/icons-material/LightModeRounded'
import {
  Box,
  Portal,
  Tooltip,
} from '@mui/material'
import {
  alpha,
  type PaletteMode,
} from '@mui/material/styles'

import { AppButton } from './AppButton'

interface ThemeToggleButtonProps {
  mode: PaletteMode
  onToggle: () => void
}

type TransitionPhase =
  | 'idle'
  | 'covering'
  | 'covered'
  | 'switching'
  | 'revealing'

interface RevealState {
  x: number
  y: number
  radius: number
  targetMode: PaletteMode
  expanded: boolean
}

const coverDuration = 250
const revealDuration = 190
const postSwitchHold = 70

export function ThemeToggleButton({
  mode,
  onToggle,
}: ThemeToggleButtonProps) {
  const [phase, setPhase] = useState<TransitionPhase>('idle')
  const [reveal, setReveal] = useState<RevealState | null>(null)
  const phaseRef = useRef<TransitionPhase>('idle')
  const transitioningRef = useRef(false)
  const onToggleRef = useRef(onToggle)
  const frameRefs = useRef<number[]>([])
  const fallbackTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const holdTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    onToggleRef.current = onToggle
  }, [onToggle])

  const updatePhase = (nextPhase: TransitionPhase) => {
    phaseRef.current = nextPhase
    setPhase(nextPhase)
  }

  const clearScheduledWork = () => {
    frameRefs.current.forEach(cancelAnimationFrame)
    frameRefs.current = []

    if (fallbackTimerRef.current) {
      clearTimeout(fallbackTimerRef.current)
      fallbackTimerRef.current = null
    }

    if (holdTimerRef.current) {
      clearTimeout(holdTimerRef.current)
      holdTimerRef.current = null
    }
  }

  const finishTransition = () => {
    clearScheduledWork()
    transitioningRef.current = false
    setReveal(null)
    updatePhase('idle')
  }

  const runAfterPaint = (callback: () => void) => {
    const firstFrame = requestAnimationFrame(() => {
      const secondFrame = requestAnimationFrame(callback)
      frameRefs.current.push(secondFrame)
    })

    frameRefs.current.push(firstFrame)
  }

  const markCovered = () => {
    if (phaseRef.current !== 'covering') return

    if (fallbackTimerRef.current) {
      clearTimeout(fallbackTimerRef.current)
      fallbackTimerRef.current = null
    }

    updatePhase('covered')
  }

  useEffect(() => {
    if (phase !== 'covering' || !reveal || reveal.expanded) return

    runAfterPaint(() => {
      if (phaseRef.current !== 'covering') return

      setReveal((current) => current
        ? { ...current, expanded: true }
        : current)

      fallbackTimerRef.current = setTimeout(
        markCovered,
        coverDuration + 100,
      )
    })
  }, [phase, reveal])

  useEffect(() => {
    if (phase !== 'covered') return

    runAfterPaint(() => {
      if (phaseRef.current !== 'covered') return

      updatePhase('switching')
      onToggleRef.current()
    })
  }, [phase])

  useEffect(() => {
    if (
      phase !== 'switching'
      || !reveal
      || mode !== reveal.targetMode
    ) {
      return
    }

    runAfterPaint(() => {
      if (phaseRef.current !== 'switching') return

      holdTimerRef.current = setTimeout(() => {
        holdTimerRef.current = null

        if (phaseRef.current === 'switching') {
          updatePhase('revealing')
        }
      }, postSwitchHold)
    })
  }, [mode, phase, reveal])

  useEffect(() => {
    if (phase !== 'revealing') return

    fallbackTimerRef.current = setTimeout(
      finishTransition,
      revealDuration + 100,
    )

    return () => {
      if (fallbackTimerRef.current) {
        clearTimeout(fallbackTimerRef.current)
        fallbackTimerRef.current = null
      }
    }
  }, [phase])

  useEffect(() => () => {
    clearScheduledWork()
    transitioningRef.current = false
  }, [])

  const handleToggle = (event: MouseEvent<HTMLButtonElement>) => {
    if (transitioningRef.current) return

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      onToggleRef.current()
      return
    }

    const rect = event.currentTarget.getBoundingClientRect()
    const x = rect.left + rect.width / 2
    const y = rect.top + rect.height / 2
    const radius = Math.hypot(
      Math.max(x, window.innerWidth - x),
      Math.max(y, window.innerHeight - y),
    ) + 2

    transitioningRef.current = true
    setReveal({
      x,
      y,
      radius,
      targetMode: mode === 'light' ? 'dark' : 'light',
      expanded: false,
    })
    updatePhase('covering')
  }

  const handleOverlayTransitionEnd = (
    event: TransitionEvent<HTMLDivElement>,
  ) => {
    if (event.target !== event.currentTarget) return

    if (phaseRef.current === 'covering'
      && event.propertyName === 'clip-path') {
      markCovered()
    } else if (phaseRef.current === 'revealing'
      && event.propertyName === 'opacity') {
      finishTransition()
    }
  }

  const isLight = mode === 'light'
  const label = isLight
    ? 'Switch to dark mode'
    : 'Switch to light mode'

  return (
    <>
      <Tooltip title={label}>
        <span>
          <AppButton
            compact
            aria-label={label}
            aria-pressed={!isLight}
            disabled={phase !== 'idle'}
            onClick={handleToggle}
            icon={(
              <Box
                sx={{
                  position: 'relative',
                  width: 18,
                  height: 18,
                  '& svg': {
                    position: 'absolute',
                    inset: 0,
                    fontSize: 18,
                    transition:
                      'opacity 220ms ease, transform 240ms ease',
                  },
                  '@media (prefers-reduced-motion: reduce)': {
                    '& svg': { transition: 'none' },
                  },
                }}
              >
                <LightModeRoundedIcon
                  sx={{
                    color: '#f59e0b',
                    opacity: isLight ? 1 : 0,
                    transform: isLight
                      ? 'rotate(0deg) scale(1)'
                      : 'rotate(75deg) scale(0.72)',
                  }}
                />
                <DarkModeRoundedIcon
                  sx={{
                    color: '#60a5fa',
                    opacity: isLight ? 0 : 1,
                    transform: isLight
                      ? 'rotate(-75deg) scale(0.72)'
                      : 'rotate(0deg) scale(1)',
                  }}
                />
              </Box>
            )}
            sx={(theme) => ({
              borderColor: alpha(
                isLight ? '#f59e0b' : '#60a5fa',
                theme.palette.mode === 'dark' ? 0.34 : 0.28,
              ),
              bgcolor: alpha(
                isLight ? '#f59e0b' : '#60a5fa',
                theme.palette.mode === 'dark' ? 0.07 : 0.045,
              ),
            })}
          />
        </span>
      </Tooltip>

      {reveal && (
        <Portal>
          <Box
            aria-hidden
            onTransitionEnd={handleOverlayTransitionEnd}
            sx={{
              position: 'fixed',
              inset: 0,
              zIndex: 2147483647,
              pointerEvents: 'none',
              opacity: phase === 'revealing' ? 0 : 1,
              clipPath: reveal.expanded || phase !== 'covering'
                ? `circle(${reveal.radius}px at ${reveal.x}px ${reveal.y}px)`
                : `circle(0px at ${reveal.x}px ${reveal.y}px)`,
              transition: phase === 'covering'
                ? `clip-path ${coverDuration}ms cubic-bezier(0.2, 0, 0, 1)`
                : phase === 'revealing'
                  ? `opacity ${revealDuration}ms ease`
                  : 'none',
              willChange: 'clip-path, opacity',
              bgcolor: reveal.targetMode === 'dark'
                ? '#0b1220'
                : '#eef3f8',
              backgroundImage: reveal.targetMode === 'dark'
                ? 'radial-gradient(circle at 50% 40%, rgba(37,99,235,0.10), transparent 58%)'
                : 'radial-gradient(circle at 50% 40%, rgba(56,189,248,0.08), transparent 58%)',
            }}
          />
        </Portal>
      )}
    </>
  )
}
