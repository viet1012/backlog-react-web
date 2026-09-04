import {
  Box,
  Card,
  Typography,
} from '@mui/material'

import {
  alpha,
} from '@mui/material/styles'

import {
  AssignmentOutlined,
  AccessTimeOutlined,
  SettingsOutlined,
  LayersOutlined,
} from '@mui/icons-material'


// =========================================================
// TYPES
// =========================================================

export interface BacklogStatusSummaryItem {
  status: string
  poCount: number
  totalQty: number
}

export interface BacklogStatusSummaryData {
  totalPoCount: number
  totalQty: number
  statuses: BacklogStatusSummaryItem[]
}

interface BacklogSummaryProps {
  summary: BacklogStatusSummaryData | null
  selectedStatus: string
  loading?: boolean
  onStatusClick: (status: string) => void
}


// =========================================================
// CONFIG
// =========================================================

const STATUS_ORDER = [
  'NY PROCESS',
  'NYI',
  'WIP',
  'WIP_FG',
]

const STATUS_ICONS = {
  'NY PROCESS': <AccessTimeOutlined />,
  NYI: <AccessTimeOutlined />,
  WIP: <SettingsOutlined />,
  WIP_FG: <LayersOutlined />,
} as const

const ACCENT =
  '#3b82f6'


// =========================================================
// HELPERS
// =========================================================

function normalizeStatus(
  value?: string | null,
) {
  return (value ?? '')
    .trim()
    .toUpperCase()
}

function formatNumber(
  value?: number | null,
) {
  return (value ?? 0)
    .toLocaleString()
}


// =========================================================
// GLASS CARD STYLE
// =========================================================

function getGlassCardSx(
  theme: any,
  active = false,
) {
  const dark =
    theme.palette.mode === 'dark'

  return {
    border:
      `1px solid ${active
        ? alpha(ACCENT, 0.55)
        : dark
          ? alpha('#ffffff', 0.10)
          : alpha('#0f172a', 0.10)
      }`,

    bgcolor:
      active
        ? alpha(
          ACCENT,
          dark
            ? 0.12
            : 0.06,
        )
        : dark
          ? alpha(
            '#172033',
            0.62,
          )
          : alpha(
            '#ffffff',
            0.62,
          ),

    backdropFilter:
      'blur(14px)',

    WebkitBackdropFilter:
      'blur(14px)',

    boxShadow:
      active
        ? `0 3px 14px ${alpha(
          ACCENT,
          dark
            ? 0.14
            : 0.10,
        )}`
        : dark
          ? '0 2px 10px rgba(0,0,0,0.16)'
          : '0 2px 10px rgba(15,23,42,0.06)',

    transition:
      'all 150ms ease',
  }
}


// =========================================================
// COMPONENT
// =========================================================

export function BacklogSummary({
  summary,
  selectedStatus,
  loading = false,
  onStatusClick,
}: BacklogSummaryProps) {

  const statuses =
    summary?.statuses ?? []

  const sortedStatuses =
    [...statuses].sort(
      (a, b) => {

        const aIndex =
          STATUS_ORDER.indexOf(
            normalizeStatus(
              a.status,
            ),
          )

        const bIndex =
          STATUS_ORDER.indexOf(
            normalizeStatus(
              b.status,
            ),
          )

        return (
          (aIndex === -1 ? 999 : aIndex)
          -
          (bIndex === -1 ? 999 : bIndex)
        )
      },
    )


  return (
    <Box
      sx={{
        display:
          'grid',

        gridTemplateColumns:
          '210px minmax(0, 1fr)',

        gap:
          0.75,
        mb:
          0.5,

        '@media (max-width: 1000px)': {
          gridTemplateColumns:
            '1fr',
        },
      }}
    >

      {/* =====================================================
          TOTAL
      ===================================================== */}

      <Card
        sx={(theme) => ({
          ...getGlassCardSx(
            theme,
            false,
          ),

          minHeight:
            106,

          px:
            1.4,

          py:
            1,

          display:
            'flex',

          alignItems:
            'center',

          borderTop:
            `2px solid ${alpha(
              ACCENT,
              0.8,
            )}`,
        })}
      >
        <Box
          sx={{
            width:
              '100%',

            display:
              'grid',

            gridTemplateColumns:
              '34px minmax(0, 1fr)',

            columnGap:
              0.9,

            rowGap:
              1,

            alignItems:
              'center',
          }}
        >

          {/* ICON */}

          <Box
            sx={(theme) => ({
              width:
                32,

              height:
                32,

              display:
                'grid',

              placeItems:
                'center',

              borderRadius:
                1.5,

              color:
                ACCENT,

              bgcolor:
                alpha(
                  ACCENT,
                  theme.palette.mode === 'dark'
                    ? 0.18
                    : 0.10,
                ),

              '& svg': {
                fontSize:
                  18,
              },
            })}
          >
            <AssignmentOutlined />
          </Box>


          {/* TITLE */}

          <Typography
            sx={{
              fontSize:
                10.5,

              fontWeight:
                800,

              letterSpacing:
                0.35,

              color:
                'text.secondary',

              textTransform:
                'uppercase',
            }}
          >
            Total Orders
          </Typography>


          {/* METRICS */}

          <Box
            sx={{
              gridColumn:
                '1 / span 2',

              display:
                'grid',

              gridTemplateColumns:
                '1fr 1px 1.35fr',

              alignItems:
                'center',

              columnGap:
                1,
            }}
          >

            {/* PO */}

            <Box
              sx={{
                display:
                  'flex',

                alignItems:
                  'baseline',

                gap:
                  0.4,
              }}
            >
              <Typography
                sx={{
                  fontSize:
                    20,

                  fontWeight:
                    900,

                  lineHeight:
                    1,

                  color:
                    ACCENT,
                }}
              >
                {formatNumber(
                  summary?.totalPoCount,
                )}
              </Typography>

              <Typography
                sx={{
                  fontSize:
                    9.5,

                  fontWeight:
                    700,

                  color:
                    'text.secondary',
                }}
              >
                PO
              </Typography>
            </Box>


            {/* DIVIDER */}

            <Box
              sx={{
                width:
                  1,

                height:
                  28,

                bgcolor:
                  'divider',
              }}
            />


            {/* PCS */}

            <Box
              sx={{
                display:
                  'flex',

                alignItems:
                  'baseline',

                gap:
                  0.4,

                minWidth:
                  0,
              }}
            >
              <Typography
                sx={{
                  fontSize:
                    16,

                  fontWeight:
                    850,

                  lineHeight:
                    1,

                  color:
                    'text.primary',

                  whiteSpace:
                    'nowrap',
                }}
              >
                {formatNumber(
                  summary?.totalQty,
                )}
              </Typography>

              <Typography
                sx={{
                  fontSize:
                    9.5,

                  fontWeight:
                    700,

                  color:
                    'text.secondary',
                }}
              >
                PCS
              </Typography>
            </Box>

          </Box>

        </Box>
      </Card>


      {/* =====================================================
          STATUS GRID
      ===================================================== */}

      <Box
        sx={{
          display:
            'grid',

          gridTemplateColumns:
            'repeat(2, minmax(0, 1fr))',

          gap:
            0.75,

          '@media (max-width: 700px)': {
            gridTemplateColumns:
              '1fr',
          },
        }}
      >

        {sortedStatuses.map(
          (item) => {

            const normalized =
              normalizeStatus(
                item.status,
              )

            const active =
              normalizeStatus(
                selectedStatus,
              ) === normalized

            const icon =
              STATUS_ICONS[
              normalized as keyof typeof STATUS_ICONS
              ]


            return (
              <Card
                key={
                  item.status
                }

                onClick={() => {
                  if (!loading) {
                    onStatusClick(
                      item.status,
                    )
                  }
                }}

                sx={(theme) => ({
                  ...getGlassCardSx(
                    theme,
                    active,
                  ),

                  minHeight:
                    49,

                  px:
                    1,

                  py:
                    0.55,

                  cursor:
                    loading
                      ? 'default'
                      : 'pointer',

                  userSelect:
                    'none',

                  display:
                    'grid',

                  gridTemplateColumns:
                    '28px minmax(0, 1fr)',

                  columnGap:
                    0.75,

                  alignItems:
                    'center',

                  borderLeft:
                    `2px solid ${active
                      ? ACCENT
                      : alpha(
                        ACCENT,
                        0.45,
                      )
                    }`,

                  '&:hover': {
                    transform:
                      loading
                        ? 'none'
                        : 'translateY(-1px)',

                    bgcolor:
                      theme.palette.mode === 'dark'
                        ? alpha(
                          ACCENT,
                          active
                            ? 0.14
                            : 0.07,
                        )
                        : alpha(
                          ACCENT,
                          active
                            ? 0.08
                            : 0.035,
                        ),
                  },

                  '@media (prefers-reduced-motion: reduce)': {
                    transform:
                      'none',

                    '&:hover': {
                      transform:
                        'none',
                    },
                  },
                })}
              >

                {/* ICON */}

                <Box
                  sx={(theme) => ({
                    width:
                      26,

                    height:
                      26,

                    display:
                      'grid',

                    placeItems:
                      'center',

                    borderRadius:
                      1.3,

                    color:
                      ACCENT,

                    bgcolor:
                      alpha(
                        ACCENT,
                        theme.palette.mode === 'dark'
                          ? 0.16
                          : 0.09,
                      ),

                    '& svg': {
                      fontSize:
                        15,
                    },
                  })}
                >
                  {icon}
                </Box>


                {/* CONTENT */}

                <Box
                  sx={{
                    minWidth:
                      0,
                  }}
                >

                  {/* TITLE */}

                  <Typography
                    sx={{
                      mb:
                        0.25,

                      fontSize:
                        10.5,

                      fontWeight:
                        800,

                      lineHeight:
                        1,

                      color:
                        active
                          ? ACCENT
                          : 'text.primary',
                    }}
                  >
                    {item.status}
                  </Typography>


                  {/* PO | PCS */}

                  <Box
                    sx={{
                      display:
                        'grid',

                      gridTemplateColumns:
                        '0.8fr 1px 1.35fr',

                      alignItems:
                        'center',

                      columnGap:
                        0.8,
                    }}
                  >

                    {/* PO */}

                    <Box
                      sx={{
                        display:
                          'flex',

                        alignItems:
                          'baseline',

                        gap:
                          0.35,
                      }}
                    >
                      <Typography
                        sx={{
                          fontSize:
                            13.5,

                          fontWeight:
                            900,

                          lineHeight:
                            1,

                          color:
                            active
                              ? ACCENT
                              : 'text.primary',
                        }}
                      >
                        {formatNumber(
                          item.poCount,
                        )}
                      </Typography>

                      <Typography
                        sx={{
                          fontSize:
                            8.5,

                          fontWeight:
                            700,

                          color:
                            'text.secondary',
                        }}
                      >
                        PO
                      </Typography>
                    </Box>


                    {/* DIVIDER */}

                    <Box
                      sx={{
                        width:
                          1,

                        height:
                          22,

                        bgcolor:
                          'divider',
                      }}
                    />


                    {/* PCS */}

                    <Box
                      sx={{
                        display:
                          'flex',

                        alignItems:
                          'baseline',

                        gap:
                          0.35,

                        minWidth:
                          0,
                      }}
                    >
                      <Typography
                        sx={{
                          fontSize:
                            13.5,

                          fontWeight:
                            900,

                          lineHeight:
                            1,

                          color:
                            active
                              ? ACCENT
                              : 'text.primary',

                          whiteSpace:
                            'nowrap',
                        }}
                      >
                        {formatNumber(
                          item.totalQty,
                        )}
                      </Typography>

                      <Typography
                        sx={{
                          fontSize:
                            8.5,

                          fontWeight:
                            700,

                          color:
                            'text.secondary',
                        }}
                      >
                        PCS
                      </Typography>
                    </Box>

                  </Box>

                </Box>

              </Card>
            )
          },
        )}

      </Box>

    </Box>
  )
}