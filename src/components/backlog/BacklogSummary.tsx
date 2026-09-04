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
// STATUS CONFIG
// =========================================================

const STATUS_CONFIG = {
  'NY PROCESS': {
    accent: '#22d3ee',
    icon: <AccessTimeOutlined />,
  },

  NYI: {
    accent: '#22d3ee',
    icon: <AccessTimeOutlined />,
  },

  WIP: {
    accent: '#f59e0b',
    icon: <SettingsOutlined />,
  },

  WIP_FG: {
    accent: '#a855f7',
    icon: <LayersOutlined />,
  },
} as const


const STATUS_ORDER = [
  'NY PROCESS',
  'NYI',
  'WIP',
  'WIP_FG',
]


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
        display: 'grid',

        // TOTAL bên trái
        // 4 STATUS bên phải 2x2
        gridTemplateColumns:
          '220px minmax(0, 1fr)',

        gap: 1,

        mb: 0.5,

        '@media (max-width: 1000px)': {
          gridTemplateColumns:
            '1fr',
        },
      }}
    >

      {/* =====================================================
          TOTAL ORDERS
      ===================================================== */}

      <Card
        sx={(theme) => ({
          minHeight: 116,

          px: 1.5,
          py: 1,

          display: 'flex',
          alignItems: 'center',

          border:
            `1px solid ${alpha(
              '#3b82f6',
              0.65,
            )}`,

          borderTop:
            '2px solid #3b82f6',

          bgcolor:
            alpha(
              theme.palette.background.paper,
              0.55,
            ),
        })}
      >
        <Box
          sx={{
            width: '100%',

            display: 'grid',

            gridTemplateColumns:
              '38px 1fr',

            columnGap: 1,

            alignItems: 'center',
          }}
        >

          {/* ICON */}

          <Box
            sx={{
              width: 36,
              height: 36,

              display: 'grid',
              placeItems: 'center',

              borderRadius: 2,

              bgcolor:
                alpha(
                  '#3b82f6',
                  0.16,
                ),

              color:
                '#60a5fa',

              '& svg': {
                fontSize: 20,
              },
            }}
          >
            <AssignmentOutlined />
          </Box>


          {/* CONTENT */}

          <Box>

            <Typography
              sx={{
                fontSize: 11,

                fontWeight: 800,

                color:
                  'text.secondary',

                textTransform:
                  'uppercase',

                letterSpacing:
                  0.4,
              }}
            >
              Total Orders
            </Typography>


            <Box
              sx={{
                mt: 0.35,

                display: 'flex',
                alignItems: 'baseline',

                gap: 0.5,
              }}
            >
              <Typography
                sx={{
                  fontSize: 25,

                  fontWeight: 900,

                  lineHeight: 1,

                  color:
                    '#60a5fa',
                }}
              >
                {formatNumber(
                  summary?.totalPoCount,
                )}
              </Typography>

              <Typography
                sx={{
                  fontSize: 10,

                  fontWeight: 700,

                  color:
                    'text.secondary',
                }}
              >
                PO
              </Typography>
            </Box>


            <Box
              sx={{
                mt: 0.65,

                display: 'flex',
                alignItems: 'baseline',

                gap: 0.5,
              }}
            >
              <Typography
                sx={{
                  fontSize: 15,

                  fontWeight: 800,
                }}
              >
                {formatNumber(
                  summary?.totalQty,
                )}
              </Typography>

              <Typography
                sx={{
                  fontSize: 10,

                  fontWeight: 700,

                  color:
                    'text.secondary',
                }}
              >
                Pcs
              </Typography>
            </Box>

          </Box>

        </Box>
      </Card>


      {/* =====================================================
          STATUS GRID 2 x 2
      ===================================================== */}

      <Box
        sx={{
          display: 'grid',

          gridTemplateColumns:
            'repeat(2, minmax(0, 1fr))',

          gap: 1,

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

            const config =
              STATUS_CONFIG[
              normalized as keyof typeof STATUS_CONFIG
              ]

            const accent =
              config?.accent
              ?? '#64748b'

            const active =
              normalizeStatus(
                selectedStatus,
              )
              === normalized


            return (
              <Card
                key={item.status}

                onClick={() => {
                  if (!loading) {
                    onStatusClick(
                      item.status,
                    )
                  }
                }}

                sx={(theme) => ({
                  minHeight: 54,

                  px: 1.25,
                  py: 0.7,

                  cursor:
                    loading
                      ? 'default'
                      : 'pointer',

                  userSelect:
                    'none',

                  display:
                    'grid',

                  gridTemplateColumns:
                    '32px 1fr',

                  gap:
                    0.9,

                  alignItems:
                    'center',

                  border:
                    `1px solid ${active
                      ? alpha(
                        accent,
                        0.75,
                      )
                      : theme.palette.divider
                    }`,

                  borderLeft:
                    `3px solid ${accent}`,

                  bgcolor:
                    active
                      ? alpha(
                        accent,
                        theme.palette.mode === 'dark'
                          ? 0.14
                          : 0.07,
                      )
                      : alpha(
                        theme.palette.background.paper,
                        0.5,
                      ),

                  boxShadow:
                    active
                      ? `0 2px 8px ${alpha(
                        accent,
                        0.12,
                      )}`
                      : 'none',

                  transition:
                    'all 150ms ease',

                  '&:hover': {
                    transform:
                      loading
                        ? 'none'
                        : 'translateY(-1px)',

                    bgcolor:
                      active
                        ? alpha(
                          accent,
                          theme.palette.mode === 'dark'
                            ? 0.18
                            : 0.1,
                        )
                        : theme.palette.action.hover,
                  },
                })}
              >

                {/* ICON */}

                <Box
                  sx={{
                    width: 30,
                    height: 30,

                    display: 'grid',
                    placeItems: 'center',

                    borderRadius: 1.5,

                    color:
                      accent,

                    bgcolor:
                      alpha(
                        accent,
                        0.14,
                      ),

                    '& svg': {
                      fontSize: 17,
                    },
                  }}
                >
                  {config?.icon}
                </Box>


                {/* CONTENT */}

                <Box
                  sx={{
                    minWidth: 0,
                  }}
                >

                  {/* STATUS */}

                  <Typography
                    sx={{
                      mb: 0.35,

                      fontSize: 11.5,

                      fontWeight: 800,

                      lineHeight: 1,

                      color:
                        active
                          ? accent
                          : 'text.primary',
                    }}
                  >
                    {item.status}
                  </Typography>


                  {/* PO / PCS */}

                  <Box
                    sx={{
                      display: 'grid',

                      gridTemplateColumns:
                        '1fr 1px 1fr',

                      alignItems: 'center',

                      columnGap: 1,
                    }}
                  >

                    {/* PO */}

                    <Box>
                      <Typography
                        sx={{
                          fontSize: 9,

                          color:
                            'text.secondary',

                          lineHeight: 1,
                        }}
                      >
                        PO
                      </Typography>

                      <Typography
                        sx={{
                          mt: 0.2,

                          fontSize: 15,

                          fontWeight: 900,

                          lineHeight: 1,

                          color:
                            accent,
                        }}
                      >
                        {formatNumber(
                          item.poCount,
                        )}
                      </Typography>
                    </Box>


                    {/* DIVIDER */}

                    <Box
                      sx={{
                        width: 1,
                        height: 25,

                        bgcolor:
                          'divider',
                      }}
                    />


                    {/* PCS */}

                    <Box>
                      <Typography
                        sx={{
                          fontSize: 9,

                          color:
                            'text.secondary',

                          lineHeight: 1,
                        }}
                      >
                        PCS
                      </Typography>

                      <Typography
                        sx={{
                          mt: 0.2,

                          fontSize: 15,

                          fontWeight: 900,

                          lineHeight: 1,

                          color:
                            accent,
                        }}
                      >
                        {formatNumber(
                          item.totalQty,
                        )}
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