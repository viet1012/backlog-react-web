import { Box, Skeleton, Stack, Typography, useTheme } from '@mui/material'
import type { ReactNode } from 'react'
import { TABULAR_NUMS } from './evnCompareUi'

// =========================================================
// Mảnh dùng chung cho các biểu đồ của chế độ "Biểu đồ"
// =========================================================

export interface EvnLegendItem {
  label: string
  color: string
  kind: 'line' | 'bar' | 'dot' | 'outline' | 'dash'
}

export function EvnLegend({ items }: { items: EvnLegendItem[] }) {
  return (
    <>
      {items.map((item) => (
        <Stack key={item.label} direction="row" sx={{ alignItems: 'center', gap: 0.5 }}>
          {(item.kind === 'line' || item.kind === 'dash') && (
            <Box component="svg" width={14} height={8} aria-hidden>
              <line
                x1={0}
                y1={4}
                x2={14}
                y2={4}
                stroke={item.color}
                strokeWidth={2}
                strokeDasharray={item.kind === 'dash' ? '3 2' : undefined}
              />
            </Box>
          )}
          {item.kind === 'bar' && <Box sx={{ width: 10, height: 10, borderRadius: 0.5, bgcolor: item.color }} />}
          {item.kind === 'outline' && (
            <Box sx={{ width: 10, height: 10, borderRadius: 0.5, border: `2px solid ${item.color}` }} />
          )}
          {item.kind === 'dot' && <Box sx={{ width: 9, height: 9, borderRadius: '50%', bgcolor: item.color }} />}
          <Typography sx={{ fontSize: 12, color: 'text.secondary' }}>{item.label}</Typography>
        </Stack>
      ))}
    </>
  )
}

export interface EvnTooltipItem {
  label: string
  value: string
  // màu nhận diện chuỗi (chấm cạnh nhãn); chữ luôn dùng màu chữ
  color?: string
  // tô màu giá trị (vd % theo ngưỡng)
  valueColor?: string
}

export function EvnTooltipBox({
  title,
  items,
  footer,
}: {
  title: string
  items: EvnTooltipItem[]
  footer?: ReactNode
}) {
  const theme = useTheme()

  return (
    <Box
      sx={{
        px: 1,
        py: 0.75,
        borderRadius: 1.5,
        border: `1px solid ${theme.palette.divider}`,
        bgcolor: 'background.paper',
        boxShadow: theme.shadows[3],
        fontSize: 11.5,
        minWidth: 180,
      }}
    >
      <Typography sx={{ fontSize: 11.5, fontWeight: 700, mb: 0.25 }}>{title}</Typography>

      {items.map((item) => (
        <Box key={item.label} sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 2 }}>
          <Stack direction="row" sx={{ alignItems: 'center', gap: 0.5, color: 'text.secondary' }}>
            {item.color && <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: item.color, flexShrink: 0 }} />}
            <Box component="span">{item.label}</Box>
          </Stack>
          <Box
            component="span"
            sx={{ ...TABULAR_NUMS, color: item.valueColor ?? 'text.primary', fontWeight: item.valueColor ? 700 : 600 }}
          >
            {item.value}
          </Box>
        </Box>
      ))}

      {footer}
    </Box>
  )
}

// Khung chiều cao cố định: skeleton khi tải lần đầu, thông báo khi rỗng
export function EvnChartBox({
  height,
  loading,
  empty,
  emptyLabel,
  children,
}: {
  height: number
  loading: boolean
  empty: boolean
  emptyLabel: string
  children: ReactNode
}) {
  return (
    <Box sx={{ height, position: 'relative', minWidth: 0 }}>
      {loading && empty ? (
        <Skeleton variant="rounded" height="100%" />
      ) : empty ? (
        <Box sx={{ height: '100%', display: 'grid', placeItems: 'center' }}>
          <Typography sx={{ fontSize: 12.5, color: 'text.secondary' }}>{emptyLabel}</Typography>
        </Box>
      ) : (
        children
      )}
    </Box>
  )
}
