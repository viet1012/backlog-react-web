import {
  Alert,
  Box,
  CircularProgress,
  Collapse,
  IconButton,
  Typography,
} from '@mui/material'

import ExpandLessRoundedIcon
  from '@mui/icons-material/ExpandLessRounded'

import ExpandMoreRoundedIcon
  from '@mui/icons-material/ExpandMoreRounded'

import {
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'

import { alpha } from '@mui/material/styles'

import type {
  BacklogStatusSummary,
  BacklogStatusSummaryRow,
} from '../../services/reportService'

import {
  BACKLOG_STATUS_COLORS,
  normalizeBacklogStatus,
} from './backlogStatus'


interface BacklogSummaryProps {
  summary: BacklogStatusSummary | null
  selectedStatus: string
  loading?: boolean
  error?: string | null
  onStatusClick: (status: string) => void
  selectedCell: {
    status: string
    date: string
  } | null
  onCellClick: (
    cell: {
      status: string
      date: string
    } | null,
  ) => void
}

// =========================================================
// TODAY
//
// Local browser date:
// 2026-09-09
// =========================================================

function getTodayKey(): string {

  const now =
    new Date()

  const year =
    now.getFullYear()

  const month =
    String(
      now.getMonth() + 1,
    ).padStart(
      2,
      '0',
    )

  const day =
    String(
      now.getDate(),
    ).padStart(
      2,
      '0',
    )

  return `${year}-${month}-${day}`
}

// =========================================================
// STATUS COLOR
// =========================================================

function getStatusColor(
  status: string,
): string {

  const key =
    normalizeBacklogStatus(
      status,
    )

  return (
    BACKLOG_STATUS_COLORS[
    key as keyof typeof BACKLOG_STATUS_COLORS
    ]
    ?? '#64748b'
  )
}


// =========================================================
// DATE HEADER
//
// 2026-09-04 -> 4-Sep
// =========================================================

function formatDateHeader(
  value: string,
): string {

  const parts =
    value.split('-')

  if (parts.length !== 3) {
    return value
  }

  const year =
    Number(parts[0])

  const month =
    Number(parts[1])

  const day =
    Number(parts[2])

  if (
    !Number.isFinite(year)
    || !Number.isFinite(month)
    || !Number.isFinite(day)
  ) {
    return value
  }

  const date =
    new Date(
      year,
      month - 1,
      day,
    )

  const monthLabel =
    date.toLocaleString(
      'en-US',
      {
        month: 'short',
      },
    )

  return `${day}-${monthLabel}`
}


// =========================================================
// NUMBER
// =========================================================

function formatNumber(
  value: number | null | undefined,
): string {

  return (
    value ?? 0
  ).toLocaleString()
}


// =========================================================
// FIND CELL
// =========================================================

function getCell(
  row: BacklogStatusSummaryRow,
  date: string,
) {

  return row.values.find(
    (value) =>
      value.date === date,
  )
}


// =========================================================
// COMPONENT
// =========================================================

export function BacklogSummary({
  summary,
  selectedStatus,
  loading = false,
  error,
  onStatusClick,
  selectedCell,
  onCellClick,
}: BacklogSummaryProps) {

  const [collapsed, setCollapsed] =
    useState(false)

  const selectedKey =
    normalizeBacklogStatus(
      selectedStatus,
    )

  const dates =
    summary?.dates ?? []

  const rows =
    summary?.rows ?? []

  const today =
    useMemo(
      () => getTodayKey(),
      [],
    )

  const scrollContainerRef =
    useRef<HTMLDivElement | null>(
      null,
    )

  const todayHeaderRef =
    useRef<HTMLDivElement | null>(
      null,
    )

  const hasToday =
    dates.includes(
      today,
    )
  useEffect(
    () => {

      if (
        collapsed
        ||
        !summary
        || !hasToday
      ) {
        return
      }

      const container =
        scrollContainerRef.current

      const currentColumn =
        todayHeaderRef.current

      if (
        !container
        || !currentColumn
      ) {
        return
      }

      const containerRect =
        container.getBoundingClientRect()

      const columnRect =
        currentColumn.getBoundingClientRect()

      const currentColumnCenter =
        columnRect.left
        - containerRect.left
        + container.scrollLeft
        + columnRect.width / 2

      const targetLeft =
        currentColumnCenter
        - container.clientWidth / 2

      container.scrollTo({
        left:
          Math.max(
            0,
            targetLeft,
          ),

        behavior: 'auto',
      })

    },
    [
      summary,
      today,
      hasToday,
      collapsed,
    ],
  )
  return (
    <Box >

      <Box
        sx={(theme) => ({
          minHeight: 30,

          px: 1.25,

          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',

          border:
            `1px solid ${theme.palette.divider}`,

          borderRadius: 1.5,

          borderBottomLeftRadius:
            collapsed || !summary
              ? 1.5
              : 0,

          borderBottomRightRadius:
            collapsed || !summary
              ? 1.5
              : 0,

          bgcolor:
            alpha(
              theme.palette.primary.main,
              theme.palette.mode === 'dark'
                ? 0.05
                : 0.025,
            ),
        })}
      >
        <Typography
          sx={{
            fontSize: 12.5,
            fontWeight: 700,
            color: 'text.primary',
          }}
        >
          Backlog Summary
        </Typography>

        <IconButton
          size="small"
          aria-label={
            collapsed
              ? 'Expand Backlog Summary'
              : 'Collapse Backlog Summary'
          }
          onClick={() => {
            setCollapsed(
              (current) => !current,
            )
          }}
          sx={{
            width: 30,
            height: 30,
            color: 'text.secondary',
          }}
        >
          {collapsed
            ? <ExpandMoreRoundedIcon fontSize="small" />
            : <ExpandLessRoundedIcon fontSize="small" />}
        </IconButton>
      </Box>

      <Collapse
        in={!collapsed}
        timeout={180}
        unmountOnExit
      >
        <Box sx={{ pt: 0 }}>

          {/* =====================================================
          ERROR
      ===================================================== */}

          {error && (
            <Alert
              severity="warning"
              sx={{
                mb: 1,
                py: 0.25,
              }}
            >
              Status summary unavailable: {error}
            </Alert>
          )}


          {/* =====================================================
          LOADING
      ===================================================== */}

          {loading && !summary && (
            <Box
              sx={{
                height: 120,

                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <CircularProgress
                size={22}
              />
            </Box>
          )}


          {/* =====================================================
          MATRIX
      ===================================================== */}

          {summary && (
            <Box
              ref={scrollContainerRef}
              sx={(theme) => {

                const dark =
                  theme.palette.mode === 'dark'

                return {
                  width: '100%',

                  overflowX: 'auto',

                  border:
                    `1px solid ${dark
                      ? alpha('#ffffff', 0.08)
                      : alpha('#0f172a', 0.08)
                    }`,

                  borderTop: 'none',

                  borderRadius: 1.5,

                  borderTopLeftRadius: 0,
                  borderTopRightRadius: 0,

                  bgcolor:
                    dark
                      ? '#161c2c'
                      : '#ffffff',

                  boxShadow:
                    dark
                      ? '0 2px 8px rgba(0,0,0,0.18)'
                      : '0 2px 8px rgba(15,23,42,0.06)',
                }
              }}
            >

              <Box
                sx={{
                  minWidth:
                    Math.max(
                      800,
                      80
                      + dates.length * 140,
                    ),
                }}
              >

                {/* =================================================
                HEADER
            ================================================= */}
                <Box
                  sx={(theme) => {
                    const isDark =
                      theme.palette.mode === 'dark'

                    const headerAccent =
                      isDark
                        ? '#4F7FE3'
                        : '#5F88CC'

                    const headerBgTop =
                      alpha(
                        headerAccent,
                        isDark ? 0.24 : 0.4,
                      )

                    const headerBgBottom =
                      alpha(
                        headerAccent,
                        isDark ? 0.11 : 0.07,
                      )

                    const headerBorder =
                      alpha(
                        headerAccent,
                        isDark ? 0.34 : 0.22,
                      )

                    const headerSeparator =
                      alpha(
                        headerAccent,
                        isDark ? 0.26 : 0.16,
                      )

                    const headerBackground =
                      `linear-gradient(
                    180deg,
                    ${headerBgTop} 0%,
                    ${headerBgBottom} 100%
                  )`

                    return {
                      display: 'grid',

                      gridTemplateColumns:
                        `125px repeat(${dates.length}, minmax(130px, 1fr))`,

                      minHeight: 33,

                      alignItems: 'center',

                      background:
                        headerBackground,

                      borderBottom:
                        `1px solid ${headerBorder}`,

                      color:
                        theme.palette.text.primary,

                      '& > *:not(:last-child)': {
                        borderRight:
                          `1px solid ${headerSeparator}`,
                      },
                    }
                  }}
                >

                  <Typography
                    sx={(theme) => {
                      const isDark =
                        theme.palette.mode === 'dark'

                      const headerAccent =
                        isDark
                          ? '#4F7FE3'
                          : '#5F88CC'

                      return {
                        position: 'sticky',
                        left: 0,
                        zIndex: 4,

                        boxSizing: 'border-box',

                        alignSelf: 'stretch',
                        display: 'flex',
                        alignItems: 'center',

                        px: 2,

                        fontSize: 12.5,
                        fontWeight: 700,

                        color: 'text.primary',
                        whiteSpace: 'nowrap',

                        backgroundColor:
                          theme.palette.background.paper,

                        backgroundImage:
                          `linear-gradient(
                            180deg,
                            ${alpha(
                            headerAccent,
                            isDark ? 0.24 : 0.4,
                          )} 0%,
                            ${alpha(
                            headerAccent,
                            isDark ? 0.11 : 0.07,
                          )} 100%
                          )`,

                        boxShadow:
                          `2px 0 5px ${alpha(
                            theme.palette.common.black,
                            isDark ? 0.18 : 0.08,
                          )}`,
                      }
                    }}
                  >
                    Status
                  </Typography>


                  {dates.map(
                    (date) => {

                      const isToday =
                        date === today

                      return (

                        <Box
                          key={date}

                          ref={
                            isToday
                              ? todayHeaderRef
                              : undefined
                          }

                          sx={(theme) => {
                            return {
                              position: 'relative',

                              height: '100%',

                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',

                              px: 1,

                              bgcolor:
                                isToday
                                  ? alpha(
                                    theme.palette.primary.main,
                                    theme.palette.mode === 'dark'
                                      ? 0.20
                                      : 0.11,
                                  )
                                  : 'transparent',

                              borderLeft:
                                isToday
                                  ? `1px solid ${alpha(
                                    theme.palette.primary.main,
                                    0.50,
                                  )}`
                                  : undefined,

                              borderRight:
                                isToday
                                  ? `1px solid ${alpha(
                                    theme.palette.primary.main,
                                    0.50,
                                  )}`
                                  : undefined,

                              '&::after':
                                isToday
                                  ? {
                                    content: '""',

                                    position: 'absolute',

                                    left: 10,
                                    right: 10,
                                    bottom: 0,

                                    height: 3,

                                    bgcolor:
                                      theme.palette.primary.main,
                                  }
                                  : undefined,
                            }
                          }}
                        >

                          <Typography
                            sx={{
                              textAlign: 'center',

                              fontSize: 12.5,

                              fontWeight:
                                isToday
                                  ? 800
                                  : 700,

                              color:
                                isToday
                                  ? 'primary.main'
                                  : 'text.primary',

                              whiteSpace: 'nowrap',
                            }}
                          >
                            {formatDateHeader(date)}
                          </Typography>

                        </Box>

                      )
                    },
                  )}

                </Box>


                {/* =================================================
                ROWS
            ================================================= */}

                {rows.map(
                  (row) => {

                    const statusKey =
                      normalizeBacklogStatus(
                        row.status,
                      )

                    const active =
                      selectedKey === statusKey

                    const color =
                      getStatusColor(
                        row.status,
                      )


                    return (

                      <Box
                        key={row.status}

                        sx={(theme) => ({
                          display: 'grid',

                          gridTemplateColumns:
                            `125px repeat(${dates.length}, minmax(130px, 1fr))`,

                          minHeight: 41,

                          borderTop:
                            `1px solid ${theme.palette.divider
                            }`,

                          bgcolor:
                            active
                              ? alpha(
                                theme.palette.primary.main,
                                theme.palette.mode === 'dark'
                                  ? 0.18
                                  : 0.10,
                              )
                              : 'transparent',

                          boxShadow:
                            active
                              ? `inset 0 0 0 1px ${alpha(
                                theme.palette.primary.main,
                                theme.palette.mode === 'dark'
                                  ? 0.45
                                  : 0.28,
                              )}`
                              : 'none',

                          transition:
                            'background-color 160ms ease, box-shadow 160ms ease',
                        })}
                      >

                        {/* =========================================
                        STATUS
                    ========================================= */}

                        <Box
                          role="button"

                          tabIndex={0}

                          onClick={() => {
                            if (!loading) {
                              onStatusClick(
                                row.status,
                              )
                            }
                          }}

                          onKeyDown={(event) => {

                            if (
                              !loading
                              && (
                                event.key === 'Enter'
                                || event.key === ' '
                              )
                            ) {

                              event.preventDefault()

                              onStatusClick(
                                row.status,
                              )
                            }
                          }}

                          sx={(theme) => {
                            const isDark =
                              theme.palette.mode === 'dark'

                            const baseBackground =
                              isDark
                                ? '#161c2c'
                                : '#f7f9fc'

                            const edgeShadow =
                              `2px 0 5px ${alpha(
                                theme.palette.common.black,
                                isDark ? 0.2 : 0.07,
                              )}`

                            return {
                              position: 'sticky',
                              left: 0,
                              zIndex: 2,

                              display: 'flex',
                              alignItems: 'center',

                              px: 2,

                              cursor:
                                loading
                                  ? 'default'
                                  : 'pointer',

                              userSelect: 'none',

                              backgroundColor:
                                baseBackground,

                              backgroundImage:
                                isDark
                                  ? `linear-gradient(${alpha(
                                    theme.palette.common.white,
                                    0.025,
                                  )}, ${alpha(
                                    theme.palette.common.white,
                                    0.025,
                                  )})`
                                  : undefined,

                              boxShadow:
                                active
                                  ? `inset 0 0 0 9999px ${alpha(
                                    theme.palette.primary.main,
                                    isDark ? 0.22 : 0.14,
                                  )}, ${edgeShadow}`
                                  : edgeShadow,

                              transition:
                                'box-shadow 160ms ease',

                              borderRight:
                                `1px solid ${theme.palette.divider
                                }`,

                              '&::before': {
                                content: '""',

                                // position: 'absolute',
                                position: 'sticky',
                                top: 0,
                                bottom: 0,
                                left: 0,

                                width:
                                  active
                                    ? 4
                                    : 3,

                                bgcolor:
                                  active
                                    ? theme.palette.primary.main
                                    : color,
                              },

                              '&:hover': loading
                                ? undefined
                                : {
                                  boxShadow:
                                    `inset 0 0 0 9999px ${alpha(
                                      active
                                        ? theme.palette.primary.main
                                        : color,
                                      active
                                        ? isDark
                                          ? 0.25
                                          : 0.16
                                        : isDark
                                          ? 0.12
                                          : 0.07,
                                    )}, ${edgeShadow}`,
                                },

                              '&:focus-visible': {
                                outline:
                                  `2px solid ${alpha(
                                    active
                                      ? theme.palette.primary.main
                                      : color,
                                    0.55,
                                  )
                                  }`,

                                outlineOffset: -2,
                              },
                            }
                          }}
                        >

                          <Typography
                            sx={{
                              fontSize: 13,
                              fontWeight: 700,

                              color:
                                active
                                  ? 'primary.main'
                                  : 'text.primary',

                              whiteSpace: 'nowrap',
                            }}
                          >
                            {row.status}
                          </Typography>

                        </Box>


                        {/* =========================================
                        DATE CELLS
                    ========================================= */}

                        {dates.map(
                          (date) => {

                            const cell =
                              getCell(
                                row,
                                date,
                              )

                            const poCount =
                              cell?.poCount ?? 0

                            const qty =
                              cell?.qty ?? 0

                            const isToday =
                              date === today

                            const isFinished =
                              statusKey === 'FINISHED'

                            const isZero =
                              poCount === 0

                            const isOverdue =
                              !isFinished
                              && poCount > 0
                              && date <= today

                            const showTodayCellHighlight =
                              isToday
                              && !isFinished
                              && !isZero
                              && !isOverdue

                            const selected =
                              selectedCell?.status === row.status
                              && selectedCell.date === date

                            return (

                              <Box
                                key={date}

                                onClick={(event) => {
                                  event.stopPropagation()

                                  const nextSelectedCell =
                                    selected
                                      ? null
                                      : {
                                        status: row.status,
                                        date,
                                      }

                                  onCellClick(nextSelectedCell)
                                }}

                                sx={(theme) => {
                                  return {
                                    position: 'relative',

                                    minWidth: 0,

                                    px: 1,
                                    py: 0.3,

                                    display: 'flex',
                                    flexDirection: 'column',

                                    alignItems: 'center',
                                    justifyContent: 'center',

                                    cursor: 'pointer',

                                    bgcolor:
                                      isFinished
                                        ? alpha(
                                          theme.palette.grey[500],
                                          theme.palette.mode === 'dark'
                                            ? 0.10
                                            : 0.07,
                                        )
                                        : isZero
                                          ? alpha(
                                            theme.palette.grey[500],
                                            theme.palette.mode === 'dark'
                                              ? 0.10
                                              : 0.08,
                                          )
                                          : isOverdue
                                            ? alpha(
                                              theme.palette.error.main,
                                              theme.palette.mode === 'dark'
                                                ? 0.20
                                                : 0.11,
                                            )
                                            : isToday
                                              ? alpha(
                                                theme.palette.primary.main,
                                                theme.palette.mode === 'dark'
                                                  ? 0.13
                                                  : 0.075,
                                              )
                                              : 'transparent',

                                    borderLeft:
                                      showTodayCellHighlight
                                        ? `1px solid ${alpha(
                                          theme.palette.primary.main,
                                          0.40,
                                        )
                                        }`
                                        : undefined,

                                    borderRight:
                                      showTodayCellHighlight
                                        ? `1px solid ${alpha(
                                          theme.palette.primary.main,
                                          0.40,
                                        )
                                        }`
                                        : undefined,

                                    boxShadow:
                                      selected
                                        ? `inset 0 0 0 2px ${alpha(
                                          theme.palette.primary.main,
                                          0.65,
                                        )}`
                                        : undefined,

                                    '&:hover': {
                                      bgcolor:
                                        isFinished || isZero
                                          ? alpha(
                                            theme.palette.grey[500],
                                            theme.palette.mode === 'dark'
                                              ? 0.14
                                              : 0.11,
                                          )
                                          : isOverdue
                                            ? alpha(
                                              theme.palette.error.main,
                                              theme.palette.mode === 'dark'
                                                ? 0.26
                                                : 0.15,
                                            )
                                            : alpha(
                                              theme.palette.primary.main,
                                              theme.palette.mode === 'dark'
                                                ? 0.055
                                                : 0.035,
                                            ),

                                      boxShadow:
                                        selected
                                          ? `inset 0 0 0 2px ${alpha(
                                            theme.palette.primary.main,
                                            0.8,
                                          )}`
                                          : undefined,
                                    },
                                  }
                                }}
                              >

                                <Typography
                                  sx={(theme) => ({
                                    fontSize: 12.5,
                                    fontWeight:
                                      isOverdue
                                        ? 800
                                        : 700,

                                    lineHeight: 1.2,

                                    color:
                                      isFinished || isZero
                                        ? theme.palette.text.disabled
                                        : isOverdue
                                          ? theme.palette.error.main
                                          : theme.palette.text.primary,

                                    fontVariantNumeric:
                                      'tabular-nums',

                                    whiteSpace: 'nowrap',
                                  })}
                                >
                                  {formatNumber(
                                    poCount,
                                  )}{' '}
                                  PO
                                </Typography>


                                <Typography
                                  sx={(theme) => ({
                                    mt: 0.05,

                                    fontSize: 10.75,
                                    fontWeight: 600,

                                    lineHeight: 1.2,

                                    color:
                                      isFinished || isZero
                                        ? theme.palette.text.disabled
                                        : isOverdue
                                          ? alpha(
                                            theme.palette.error.main,
                                            theme.palette.mode === 'dark'
                                              ? 0.76
                                              : 0.72,
                                          )
                                          : alpha(
                                            theme.palette.text.primary,
                                            theme.palette.mode === 'dark'
                                              ? 0.62
                                              : 0.58,
                                          ),

                                    fontVariantNumeric:
                                      'tabular-nums',

                                    whiteSpace: 'nowrap',
                                  })}
                                >
                                  {formatNumber(
                                    qty,
                                  )}{' '}
                                  Pcs
                                </Typography>

                              </Box>

                            )
                          },
                        )}

                      </Box>

                    )
                  },
                )}

              </Box>

            </Box>
          )}

        </Box>
      </Collapse>

    </Box>
  )
}
