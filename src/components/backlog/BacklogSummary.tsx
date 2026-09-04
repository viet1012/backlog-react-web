import {
  AccessTimeOutlined,
  AssignmentOutlined,
  LayersOutlined,
  SettingsOutlined,
} from '@mui/icons-material'
import { Alert, Box, Card, CircularProgress, Typography } from '@mui/material'
import { alpha, type Theme } from '@mui/material/styles'
import type { SystemStyleObject } from '@mui/system'
import type { ReactNode } from 'react'
import type { BacklogStatusSummary } from '../../services/reportService'

interface BacklogSummaryProps {
  summary: BacklogStatusSummary | null
  selectedStatus: string
  loading?: boolean
  error?: string | null
  onStatusClick: (status: string) => void
}

interface StatusConfig {
  key: string
  label: string
  hint: string
  icon: ReactNode
  color: string
}

// Each status gets its own identity instead of one accent stretched across
// everything — the color itself communicates where an order sits in the flow.
const STATUS_CONFIG: StatusConfig[] = [
  { key: 'NY PROCESS', label: 'NY Process', hint: 'Awaiting release', icon: <AccessTimeOutlined />, color: '#d97706' },
  { key: 'NYI', label: 'NYI', hint: 'Not yet issued', icon: <AccessTimeOutlined />, color: '#64748b' },
  { key: 'WIP', label: 'WIP', hint: 'In production', icon: <SettingsOutlined />, color: '#2563eb' },
  { key: 'WIP_FG', label: 'WIP_FG', hint: 'Finished goods', icon: <LayersOutlined />, color: '#0d9488' },
]

const TOTAL_COLOR = '#1e293b'

function normalizeStatus(value?: string | null) {
  return (value ?? '').trim().toUpperCase()
}

function formatMetric(value: number | undefined, unavailable: boolean) {
  return unavailable ? '—' : (value ?? 0).toLocaleString()
}

function getCardSx(theme: Theme, color: string, active: boolean): SystemStyleObject<Theme> {
  const dark = theme.palette.mode === 'dark'
  return {
    position: 'relative',
    border: `1px solid ${active ? alpha(color, dark ? 0.55 : 0.4) : dark ? alpha('#ffffff', 0.08) : alpha('#0f172a', 0.08)}`,
    bgcolor: active
      ? alpha(color, dark ? 0.14 : 0.055)
      : dark ? '#161c2c' : '#ffffff',
    borderRadius: 2,
    boxShadow: active
      ? `0 1px 0 ${alpha(color, 0.9)} inset, 0 4px 16px ${alpha(color, dark ? 0.18 : 0.12)}`
      : dark ? '0 1px 2px rgba(0,0,0,0.24)' : '0 1px 2px rgba(15,23,42,0.05)',
    transition: 'border-color 150ms ease, background-color 150ms ease, box-shadow 150ms ease, transform 150ms ease',
  }
}

function SummaryIcon({ children, color }: { children: ReactNode; color: string }) {
  return (
    <Box
      sx={(theme) => ({
        width: 30,
        height: 30,
        display: 'grid',
        placeItems: 'center',
        borderRadius: 1.5,
        color,
        bgcolor: alpha(color, theme.palette.mode === 'dark' ? 0.18 : 0.1),
        flexShrink: 0,
        '& svg': { fontSize: 17 },
      })}
    >
      {children}
    </Box>
  )
}

function SummaryMetric({ value, unit, unavailable, color, compact = false }: {
  value: number | undefined
  unit: 'PO' | 'PCS'
  unavailable: boolean
  color: string
  compact?: boolean
}) {
  return (
    <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 0.4, minWidth: 0 }}>
      <Typography
        sx={{
          fontSize: compact ? 15 : unit === 'PO' ? 21 : 16,
          fontWeight: unit === 'PO' ? 700 : 600,
          lineHeight: 1,
          fontVariantNumeric: 'tabular-nums',
          color: unit === 'PO' ? color : 'text.primary',
          whiteSpace: 'nowrap',
        }}
      >
        {formatMetric(value, unavailable)}
      </Typography>
      <Typography sx={{ fontSize: compact ? 9.5 : 10.5, fontWeight: 600, color: 'text.secondary' }}>
        {unit}
      </Typography>
    </Box>
  )
}

function SummaryMetricRow({ poCount, totalQty, unavailable, color, compact = false }: {
  poCount: number | undefined
  totalQty: number | undefined
  unavailable: boolean
  color: string
  compact?: boolean
}) {
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: compact ? 1 : 1.25 }}>
      <SummaryMetric value={poCount} unit="PO" unavailable={unavailable} color={color} compact={compact} />
      <Box sx={{ width: '1px', height: compact ? 20 : 26, bgcolor: 'divider' }} />
      <SummaryMetric value={totalQty} unit="PCS" unavailable={unavailable} color={color} compact={compact} />
    </Box>
  )
}

function TotalSummaryCard({ summary, loading }: {
  summary: BacklogStatusSummary | null
  loading: boolean
}) {
  return (
    <Card
      sx={(theme) => ({
        ...getCardSx(theme, TOTAL_COLOR, false),
        minHeight: 106,
        px: 1.75,
        py: 1.25,
        display: 'flex',
        alignItems: 'center',
        gap: 1.25,
      })}
    >
      <SummaryIcon color={TOTAL_COLOR}>
        {loading ? <CircularProgress size={16} sx={{ color: TOTAL_COLOR }} /> : <AssignmentOutlined />}
      </SummaryIcon>
      <Box sx={{ minWidth: 0 }}>
        <Typography sx={{ mb: 0.4, fontSize: 14, fontWeight: 600, color: 'text.secondary' }}>
          Total orders
        </Typography>
        <SummaryMetricRow
          poCount={summary?.totalPoCount}
          totalQty={summary?.totalQty}
          unavailable={loading || !summary}
          color={TOTAL_COLOR}
        />
      </Box>
    </Card>
  )
}

function StatusSummaryCard({
  config,
  poCount,
  totalQty,
  filterValue,
  active,
  loading,
  unavailable,
  onClick,
}: {
  config: StatusConfig
  poCount: number | undefined
  totalQty: number | undefined
  filterValue: string
  active: boolean
  loading: boolean
  unavailable: boolean
  onClick: (status: string) => void
}) {
  return (
    <Card
      onClick={() => {
        if (!loading) onClick(filterValue)
      }}
      role="button"
      aria-pressed={active}
      tabIndex={loading ? -1 : 0}
      onKeyDown={(e) => {
        if (!loading && (e.key === 'Enter' || e.key === ' ')) {
          e.preventDefault()
          onClick(filterValue)
        }
      }}
      sx={(theme) => ({
        ...getCardSx(theme, config.color, active),
        minHeight: 56,
        px: 1.25,
        py: 0.75,
        cursor: loading ? 'default' : 'pointer',
        userSelect: 'none',
        display: 'flex',
        alignItems: 'center',
        gap: 1,
        outline: 'none',
        '&:hover': loading ? undefined : {
          transform: 'translateY(-1px)',
          borderColor: alpha(config.color, theme.palette.mode === 'dark' ? 0.5 : 0.35),
        },
        '&:focus-visible': {
          boxShadow: `0 0 0 2px ${alpha(config.color, 0.5)}`,
        },
        '@media (prefers-reduced-motion: reduce)': {
          transform: 'none',
          '&:hover': { transform: 'none' },
        },
      })}
    >
      <SummaryIcon color={config.color}>{config.icon}</SummaryIcon>
      <Box sx={{ minWidth: 0, flex: 1 }}>
        <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 0.6, mb: 0.15 }}>
          <Typography sx={{ fontSize: 12.5, fontWeight: 700, lineHeight: 1.2, color: active ? config.color : 'text.primary' }}>
            {config.label}
          </Typography>
          <Typography sx={{ fontSize: 10, fontWeight: 500, color: 'text.secondary', display: { xs: 'none', sm: 'inline' } }}>
            · {config.hint}
          </Typography>
        </Box>
        <SummaryMetricRow poCount={poCount} totalQty={totalQty} unavailable={unavailable} color={config.color} compact />
      </Box>
    </Card>
  )
}

export function BacklogSummary({
  summary,
  selectedStatus,
  loading = false,
  error,
  onStatusClick,
}: BacklogSummaryProps) {
  const statusesByKey = new Map(
    (summary?.statuses ?? []).map((item) => [normalizeStatus(item.status), item]),
  )
  const selectedKey = normalizeStatus(selectedStatus)
  const unavailable = loading || !summary

  return (
    <Box sx={{ mb: 0.75 }}>
      {error && (
        <Alert severity="warning" sx={{ mb: 1, py: 0.25 }}>
          Status summary unavailable: {error}
        </Alert>
      )}
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: '280px minmax(0, 1fr)',
          gap: 1,
          '@media (max-width: 1000px)': { gridTemplateColumns: '1fr' },
        }}
      >
        <TotalSummaryCard summary={summary} loading={loading} />
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: 'repeat(2, minmax(240px, 1fr))',
            gap: 1,
            '@media (max-width: 700px)': { gridTemplateColumns: '1fr' },
          }}
        >
          {STATUS_CONFIG.map((config) => {
            const item = statusesByKey.get(config.key)
            return (
              <StatusSummaryCard
                key={config.key}
                config={config}
                poCount={item?.poCount}
                totalQty={item?.totalQty}
                filterValue={item?.status ?? config.label}
                active={selectedKey === config.key}
                loading={loading}
                unavailable={unavailable}
                onClick={onStatusClick}
              />
            )
          })}
        </Box>
      </Box>
    </Box>
  )
}