import { useEffect, useRef, useState, type KeyboardEvent, type ReactNode } from 'react'

import { Box, Dialog, InputBase, Typography } from '@mui/material'
import { alpha } from '@mui/material/styles'
import { KeyboardReturnRounded, SearchRounded } from '@mui/icons-material'

import { useI18n } from '../../i18n/useI18n'

export interface QuickJumpItem {
    path: string
    label: string
    groupLabel: string
    color: string
    icon: ReactNode
    actionLabel?: string
}

export function QuickJumpDialog({
    items,
    onClose,
    onSelect,
}: {
    items: QuickJumpItem[]
    onClose: () => void
    onSelect: (path: string) => void
}) {
    const { t } = useI18n()
    const [query, setQuery] = useState('')
    const [activeIndex, setActiveIndex] = useState(0)
    const itemRefs = useRef<(HTMLDivElement | null)[]>([])

    const needle = query.trim().toLowerCase()
    const results = needle
        ? items.filter((item) =>
            item.label.toLowerCase().includes(needle)
            || item.groupLabel.toLowerCase().includes(needle))
        : items
    const safeIndex = Math.min(activeIndex, Math.max(results.length - 1, 0))

    useEffect(() => {
        itemRefs.current[safeIndex]?.scrollIntoView({ block: 'nearest' })
    }, [safeIndex])

    function handleKeyDown(event: KeyboardEvent) {
        if (event.key === 'ArrowDown') {
            event.preventDefault()
            setActiveIndex((safeIndex + 1) % Math.max(results.length, 1))
        } else if (event.key === 'ArrowUp') {
            event.preventDefault()
            setActiveIndex((safeIndex - 1 + results.length) % Math.max(results.length, 1))
        } else if (event.key === 'Enter' && results[safeIndex]) {
            event.preventDefault()
            onSelect(results[safeIndex].path)
        }
    }

    return (
        <Dialog
            open
            onClose={onClose}
            fullWidth
            maxWidth="xs"
            slotProps={{
                paper: {
                    sx: {
                        alignSelf: 'flex-start',
                        mt: '12vh',
                        borderRadius: 3,
                        overflow: 'hidden',
                    },
                },
            }}
        >
            <Box
                sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1,
                    px: 2,
                    py: 1.25,
                    borderBottom: '1px solid',
                    borderColor: 'divider',
                }}
            >
                <SearchRounded sx={{ fontSize: 20, color: 'text.secondary' }} />
                <InputBase
                    autoFocus
                    fullWidth
                    value={query}
                    placeholder={t.sidebar.search}
                    onChange={(event) => {
                        setQuery(event.target.value)
                        setActiveIndex(0)
                    }}
                    onKeyDown={handleKeyDown}
                    inputProps={{ 'aria-label': t.sidebar.searchAria }}
                    sx={{ fontSize: 14 }}
                />
            </Box>

            <Box role="listbox" sx={{ maxHeight: 340, overflowY: 'auto', p: 0.75 }}>
                {results.length === 0 && (
                    <Typography sx={{ py: 3, textAlign: 'center', fontSize: 13, color: 'text.secondary' }}>
                        {t.sidebar.searchNoResult}
                    </Typography>
                )}

                {results.map((item, index) => {
                    const selected = index === safeIndex

                    return (
                        <Box
                            key={item.path}
                            ref={(el: HTMLDivElement | null) => {
                                itemRefs.current[index] = el
                            }}
                            role="option"
                            aria-selected={selected}
                            onMouseMove={() => setActiveIndex(index)}
                            onClick={() => onSelect(item.path)}
                            sx={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: 1.25,
                                px: 1.25,
                                py: 0.9,
                                borderRadius: 2,
                                cursor: 'pointer',
                                bgcolor: selected ? alpha(item.color, 0.12) : 'transparent',
                            }}
                        >
                            <Box
                                sx={{
                                    width: 30,
                                    height: 30,
                                    flexShrink: 0,
                                    display: 'grid',
                                    placeItems: 'center',
                                    borderRadius: '9px',
                                    color: item.color,
                                    bgcolor: alpha(item.color, 0.12),
                                    '& svg': { fontSize: 17 },
                                }}
                            >
                                {item.icon}
                            </Box>

                            <Box sx={{ flex: 1, minWidth: 0 }}>
                                <Typography noWrap sx={{ fontSize: 13, fontWeight: 650 }}>
                                    {item.label}
                                </Typography>
                                <Typography noWrap sx={{ fontSize: 10.5, letterSpacing: '0.06em', color: 'text.secondary' }}>
                                    {item.groupLabel}
                                    {item.actionLabel && ` · ${item.actionLabel}`}
                                </Typography>
                            </Box>

                            {selected && (
                                <KeyboardReturnRounded sx={{ fontSize: 16, color: 'text.secondary' }} />
                            )}
                        </Box>
                    )
                })}
            </Box>

            <Typography
                sx={{
                    px: 2,
                    py: 0.9,
                    fontSize: 11,
                    color: 'text.secondary',
                    borderTop: '1px solid',
                    borderColor: 'divider',
                    bgcolor: 'action.hover',
                }}
            >
                {t.sidebar.searchHint}
            </Typography>
        </Dialog>
    )
}
