import { KeyboardArrowUpRounded } from '@mui/icons-material'
import { Box, Button, Fab, Stack } from '@mui/material'
import { useEffect, useState, type RefObject } from 'react'

const trainingNavItems = [
  { id: 'overview', label: 'Overview' },
  { id: 'order-flow', label: 'Flow' },
  { id: 'systems', label: 'Systems' },
  { id: 'roadmap', label: 'Roadmap' },
  { id: 'modules', label: 'Modules' },
  { id: 'terminology', label: 'Terms' },
  { id: 'warnings', label: 'Notes' },
] as const

interface Props {
  scrollRef: RefObject<HTMLDivElement | null>
  activeId: string
  onActiveIdChange: (id: string) => void
  onNavigate: (id: string) => void
}

export function PcTrainingNav({ scrollRef, activeId, onActiveIdChange, onNavigate }: Props) {
  const [showTop, setShowTop] = useState(false)

  useEffect(() => {
    const root = scrollRef.current
    if (!root) return

    const onScroll = () => setShowTop(root.scrollTop > 520)
    const sections = trainingNavItems
      .map(({ id }) => document.getElementById(id))
      .filter((section): section is HTMLElement => section != null)
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((left, right) => left.boundingClientRect.top - right.boundingClientRect.top)[0]
        if (visible) onActiveIdChange(visible.target.id)
      },
      { root, rootMargin: '-70px 0px -65% 0px', threshold: 0 },
    )

    sections.forEach((section) => observer.observe(section))
    root.addEventListener('scroll', onScroll, { passive: true })
    onScroll()
    return () => {
      observer.disconnect()
      root.removeEventListener('scroll', onScroll)
    }
  }, [onActiveIdChange, scrollRef])

  return (
    <>
      <Box
        component="nav"
        aria-label="PC training sections"
        sx={(theme) => ({
          position: 'sticky', top: 0, zIndex: 5, mx: -0.5, px: 0.5, py: 0.7,
          overflowX: 'auto', bgcolor: theme.palette.mode === 'dark'
            ? 'rgba(11,18,32,0.92)' : 'rgba(238,243,248,0.92)',
          backdropFilter: 'blur(12px)', scrollbarWidth: 'none',
          '&::-webkit-scrollbar': { display: 'none' },
        })}
      >
        <Stack direction="row" spacing={0.5} sx={{ width: 'max-content' }}>
          {trainingNavItems.map((item) => (
            <Button
              key={item.id}
              size="small"
              aria-current={activeId === item.id ? 'location' : undefined}
              onClick={() => onNavigate(item.id)}
              sx={{ minHeight: 28, px: 1.2, fontSize: 11, color: activeId === item.id ? 'primary.main' : 'text.secondary', bgcolor: activeId === item.id ? 'action.selected' : 'transparent' }}
            >
              {item.label}
            </Button>
          ))}
        </Stack>
      </Box>
      {showTop && (
        <Fab size="small" color="primary" aria-label="Back to top" onClick={() => scrollRef.current?.scrollTo({ top: 0, behavior: 'smooth' })} sx={{ position: 'absolute', right: 18, bottom: 18, zIndex: 6 }}>
          <KeyboardArrowUpRounded />
        </Fab>
      )}
    </>
  )
}
