import {
  useEffect,
  useRef,
  useState,
  type MouseEvent,
  type TransitionEvent,
} from 'react'

import {
  Box,
  Portal,
  Tooltip,
} from '@mui/material'
import type {
  PaletteMode,
  SxProps,
  Theme,
} from '@mui/material/styles'

import { useI18n } from '../../i18n/useI18n'

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

const starPath = 'M 0 10 C 10 10,10 10 ,0 10 C 10 10 , 10 10 , 10 20 C 10 10 , 10 10 , 20 10 C 10 10 , 10 10 , 10 0 C 10 10,10 10 ,0 10 Z'

// Sun/moon switch, adapted from Uiverse.io by RiccardoRapelli.
// Checked state is driven by aria-checked so every instance stays in sync with `mode`.
const switchSx: SxProps<Theme> = {
  position: 'relative',
  display: 'inline-block',
  flexShrink: 0,
  width: 60,
  height: 34,
  p: 0,
  border: 0,
  borderRadius: '34px',
  bgcolor: 'transparent',
  cursor: 'pointer',

  '&:disabled': { cursor: 'default' },
  '&:focus-visible': {
    outline: '2px solid #2196f3',
    outlineOffset: 2,
  },

  '& span': { display: 'block' },

  '& .slider': {
    position: 'absolute',
    inset: 0,
    zIndex: 0,
    overflow: 'hidden',
    borderRadius: '34px',
    bgcolor: '#2196f3',
    transition: '0.4s',
  },

  '& .sun-moon': {
    position: 'absolute',
    left: 4,
    bottom: 4,
    width: 26,
    height: 26,
    borderRadius: '50%',
    bgcolor: 'yellow',
    transition: '0.4s',
  },

  '& .moon-dot': {
    position: 'absolute',
    zIndex: 4,
    opacity: 0,
    fill: 'gray',
    transition: '0.4s',
  },
  '& .moon-dot-1': { left: 10, top: 3, width: 6, height: 6 },
  '& .moon-dot-2': { left: 2, top: 10, width: 10, height: 10 },
  '& .moon-dot-3': { left: 16, top: 18, width: 3, height: 3 },

  '& .light-ray': {
    position: 'absolute',
    zIndex: -1,
    fill: 'white',
    opacity: 0.1,
  },
  '& .light-ray-1': { left: -8, top: -8, width: 43, height: 43 },
  '& .light-ray-2': { left: '-50%', top: '-50%', width: 55, height: 55 },
  '& .light-ray-3': { left: -18, top: -18, width: 60, height: 60 },

  '& .cloud-light, & .cloud-dark': {
    position: 'absolute',
    animation: 'themeSwitchCloudMove 6s infinite',
  },
  '& .cloud-light': { fill: '#eee' },
  '& .cloud-dark': { fill: '#ccc', animationDelay: '1s' },
  '& .cloud-1': { left: 30, top: 15, width: 40 },
  '& .cloud-2': { left: 44, top: 10, width: 20 },
  '& .cloud-3': { left: 18, top: 24, width: 30 },
  '& .cloud-4': { left: 36, top: 18, width: 40 },
  '& .cloud-5': { left: 48, top: 14, width: 20 },
  '& .cloud-6': { left: 22, top: 26, width: 30 },

  '& .stars': {
    transform: 'translateY(-32px)',
    opacity: 0,
    transition: '0.4s',
  },
  '& .star': {
    position: 'absolute',
    fill: 'white',
    transition: '0.4s',
    animation: 'themeSwitchStarTwinkle 2s infinite',
  },
  '& .star-1': { width: 20, top: 2, left: 3, animationDelay: '0.3s' },
  '& .star-2': { width: 6, top: 16, left: 3 },
  '& .star-3': { width: 12, top: 20, left: 10, animationDelay: '0.6s' },
  '& .star-4': { width: 18, top: 0, left: 18, animationDelay: '1.3s' },

  '&[aria-checked="true"]': {
    '& .slider': { bgcolor: 'black' },
    '& .sun-moon': {
      bgcolor: 'white',
      transform: 'translateX(26px) rotate(360deg)',
      transition: '0.6s ease-in-out',
    },
    '& .moon-dot': { opacity: 1 },
    '& .stars': {
      transform: 'translateY(0)',
      opacity: 1,
    },
  },

  '@keyframes themeSwitchCloudMove': {
    '0%': { transform: 'translateX(0px)' },
    '40%': { transform: 'translateX(4px)' },
    '80%': { transform: 'translateX(-4px)' },
    '100%': { transform: 'translateX(0px)' },
  },
  '@keyframes themeSwitchStarTwinkle': {
    '0%': { transform: 'scale(1)' },
    '40%': { transform: 'scale(1.2)' },
    '80%': { transform: 'scale(0.8)' },
    '100%': { transform: 'scale(1)' },
  },

  '@media (prefers-reduced-motion: reduce)': {
    '& *': {
      transition: 'none !important',
      animation: 'none !important',
    },
  },
}

function Circle({ className }: { className: string }) {
  return (
    <svg className={className} viewBox="0 0 100 100" aria-hidden>
      <circle cx="50" cy="50" r="50" />
    </svg>
  )
}

export function ThemeToggleButton({
  mode,
  onToggle,
}: ThemeToggleButtonProps) {
  const { t } = useI18n()
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

  const handleToggle = (event: MouseEvent<HTMLElement>) => {
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
    ? t.theme.toDark
    : t.theme.toLight

  return (
    <>
      <Tooltip title={label}>
        <Box component="span" sx={{ display: 'inline-flex' }}>
          <Box
            component="button"
            type="button"
            role="switch"
            aria-label={label}
            aria-checked={!isLight}
            disabled={phase !== 'idle'}
            onClick={handleToggle}
            sx={switchSx}
          >
            <span className="slider">
              <span className="sun-moon">
                <Circle className="moon-dot moon-dot-1" />
                <Circle className="moon-dot moon-dot-2" />
                <Circle className="moon-dot moon-dot-3" />
                <Circle className="light-ray light-ray-1" />
                <Circle className="light-ray light-ray-2" />
                <Circle className="light-ray light-ray-3" />
                <Circle className="cloud-dark cloud-1" />
                <Circle className="cloud-dark cloud-2" />
                <Circle className="cloud-dark cloud-3" />
                <Circle className="cloud-light cloud-4" />
                <Circle className="cloud-light cloud-5" />
                <Circle className="cloud-light cloud-6" />
              </span>
              <span className="stars">
                {[1, 2, 3, 4].map((index) => (
                  <svg
                    key={index}
                    className={`star star-${index}`}
                    viewBox="0 0 20 20"
                    aria-hidden
                  >
                    <path d={starPath} />
                  </svg>
                ))}
              </span>
            </span>
          </Box>
        </Box>
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
