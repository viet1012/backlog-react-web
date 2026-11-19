import {
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import { flushSync } from 'react-dom'

import { ResponsiveContainer as RechartsResponsiveContainer } from 'recharts'

import {
  isLayoutSliding,
  subscribeLayoutSliding,
} from '../layout/layoutSliding'
import {
  SIDEBAR_DURATION,
  SIDEBAR_EASE,
} from '../layout/sidebarStyles'

interface Size {
  width: number
  height: number
}

interface StableResponsiveContainerProps {
  children: ReactNode
  /** Accepted for drop-in compatibility with Recharts; always fills the parent. */
  width?: string | number
  /** Accepted for drop-in compatibility with Recharts; always fills the parent. */
  height?: string | number
}

function sameSize(a: Size | null, b: Size) {
  return a !== null && a.width === b.width && a.height === b.height
}

/**
 * Drop-in for Recharts' ResponsiveContainer that rides layout slides.
 *
 * It fills its parent and measures it itself. When the sidebar collapses or
 * expands (see layoutSliding), the chart is NOT redrawn during the motion:
 * the already-drawn SVG is stretched with a compositor transform from the old
 * size to the new one, on the same duration / easing as the slide. When the
 * slide ends, the chart is redrawn once at the real size and the transform is
 * dropped in the same frame – no gap, no snap, one render.
 *
 * A 0×0 measure (page hidden by KeepAlive) is ignored, so hidden pages do not
 * re-render their charts either.
 */
export function StableResponsiveContainer({ children }: StableResponsiveContainerProps) {
  const boxRef = useRef<HTMLDivElement>(null)
  const innerRef = useRef<HTMLDivElement>(null)
  const pendingRef = useRef<Size | null>(null)
  const sizeRef = useRef<Size | null>(null)
  const [size, setSize] = useState<Size | null>(null)

  // First measure before paint, so the chart shows up in the first frame
  useLayoutEffect(() => {
    const box = boxRef.current
    if (!box) return
    const { width, height } = box.getBoundingClientRect()
    if (width > 0 && height > 0) {
      const first = { width: Math.floor(width), height: Math.floor(height) }
      sizeRef.current = first
      setSize(first)
    }
  }, [])

  useEffect(() => {
    const box = boxRef.current
    if (!box) return

    const clearStretch = () => {
      const inner = innerRef.current
      if (!inner) return
      inner.style.transition = ''
      inner.style.transform = ''
      inner.style.willChange = ''
    }

    // Redraw at the real size. After a slide the stretch must be dropped in
    // the same frame as the redraw → synchronous; a plain window resize has no
    // stretch, so it stays an ordinary (batched) update – with N charts a
    // flushSync each would block N times in a row.
    const apply = (next: Size, afterSlide: boolean) => {
      if (!sameSize(sizeRef.current, next)) {
        sizeRef.current = next
        if (afterSlide) flushSync(() => setSize(next))
        else setSize(next)
      }
      clearStretch()
    }

    const stretchTo = (next: Size) => {
      const inner = innerRef.current
      const current = sizeRef.current
      if (!inner || !current) return
      inner.style.willChange = 'transform'
      inner.style.transformOrigin = '0 0'
      inner.style.transition = `transform ${SIDEBAR_DURATION}ms ${SIDEBAR_EASE}`
      inner.style.transform = `scale(${next.width / current.width}, ${next.height / current.height})`
    }

    // ResizeObserver reports after layout, before paint: the stretch starts
    // in the very frame the sidebar starts moving
    const observer = new ResizeObserver(([entry]) => {
      const width = Math.floor(entry.contentRect.width)
      const height = Math.floor(entry.contentRect.height)
      if (width === 0 || height === 0) return

      const next = { width, height }

      if (isLayoutSliding()) {
        pendingRef.current = next
        if (!sameSize(sizeRef.current, next)) stretchTo(next)
        return
      }

      pendingRef.current = null
      apply(next, false)
    })

    const unsubscribe = subscribeLayoutSliding(() => {
      if (isLayoutSliding() || !pendingRef.current) return
      const next = pendingRef.current
      pendingRef.current = null
      apply(next, true)
    })

    observer.observe(box)
    return () => {
      observer.disconnect()
      unsubscribe()
    }
  }, [])

  return (
    <div
      ref={boxRef}
      style={{
        position: 'relative',
        width: '100%',
        height: '100%',
        minWidth: 0,
        minHeight: 0,
      }}
    >
      {size && (
        // Absolute + fixed px size: the chart never feeds back into the
        // parent's size, and is only stretched (not redrawn) during a slide
        <div
          ref={innerRef}
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: size.width,
            height: size.height,
          }}
        >
          {/* Numeric size: Recharts uses it right away instead of waiting for
              its own ResizeObserver, so the redraw lands in the same frame
              as the stretch is removed */}
          <RechartsResponsiveContainer width={size.width} height={size.height}>
            {children}
          </RechartsResponsiveContainer>
        </div>
      )}
    </div>
  )
}

export { StableResponsiveContainer as ResponsiveContainer }
