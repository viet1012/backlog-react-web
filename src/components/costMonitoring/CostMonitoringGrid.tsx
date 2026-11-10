import { Box, Typography } from '@mui/material'
import type { Theme } from '@mui/material/styles'
import type { CostDetailTarget, CostMonitoringChartResponse } from '../../types/costMonitoring'
import { CostChartCard } from './CostChartCard'
import { COST_COLUMNS, COST_ROWS } from './costChartConfig'

interface CostMonitoringGridProps {
  // "2026-10"
  month: string | null
  data: CostMonitoringChartResponse | null
  loading: boolean
  // legend tắt Estimate (MTD) → ẩn đường trên cả 9 chart
  estVisible?: boolean
  onOpenDetail?: (target: CostDetailTarget) => void
}

const headerSx = {
  fontSize: 16,
  fontWeight: 800,
  letterSpacing: 0.5,
  color: 'text.primary',
  bgcolor: 'background.paper',
}

// Đường ngăn giữa các xưởng: dày & đậm hơn đường ngăn cột để mắt đọc theo hàng
const rowDivider = (theme: Theme) =>
  `2px solid ${theme.palette.mode === 'dark' ? '#64748B' : '#94A3B8'}`

const colDivider = (theme: Theme) => `1px solid ${theme.palette.divider}`

// MOLD (hàng giữa) có nền tint rất nhạt, PRESS / GUIDE giữ nền trắng
const rowBg = (theme: Theme, rowIndex: number) =>
  rowIndex === 1
    ? theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.03)' : 'rgba(148,163,184,0.06)'
    : theme.palette.background.paper

// Ô trong 1 hàng xưởng. column = 0 là cột nhãn hàng, 1..3 là chart.
// md+: viền trên của hàng sau hàng đầu là đường ngăn xưởng (kéo dài cả cột nhãn),
//      các chart có viền trái mảnh làm đường ngăn cột.
// xs : 1 cột – chỉ chart đầu của mỗi xưởng mang đường ngăn xưởng, còn lại viền mảnh.
const cellSx = (rowIndex: number, column: number) => (theme: Theme) => ({
  minWidth: 0,
  minHeight: 0,
  pt: '6px',
  bgcolor: rowBg(theme, rowIndex),
  borderTop: {
    xs: rowIndex > 0 && column === 1
      ? rowDivider(theme)
      : rowIndex === 0 && column === 1 ? 'none' : colDivider(theme),
    md: rowIndex > 0 ? rowDivider(theme) : colDivider(theme),
  },
  borderLeft: { xs: 'none', md: column > 0 ? colDivider(theme) : 'none' },
})

// Bảng 3 hàng (PRESS / MOLD / GUIDE) × 3 cột (OT / T&SL / RM) như Excel.
// Màn nhỏ xếp 1 cột, nhãn hàng/cột ẩn và tiêu đề nằm trong từng ô.
export function CostMonitoringGrid({ month, data, loading, estVisible = true, onOpenDetail }: CostMonitoringGridProps) {
  return (
    <Box
      sx={{
        flex: 1,
        minWidth: 0,
        minHeight: 0,
        display: 'flex',
        flexDirection: 'column',
        overflowY: 'auto',
        '@media print': { overflow: 'visible', flex: 'none' },
      }}
    >
      {/* md+: lưới giãn vừa chiều cao còn lại của trang (không scroll);
          chỉ khi màn quá thấp (mỗi hàng < 170px) mới scroll */}
      <Box
        sx={(theme) => ({
          display: 'grid',
          flex: { md: 1 },
          border: colDivider(theme),
          bgcolor: theme.palette.background.paper,
          gridTemplateColumns: { xs: 'minmax(0, 1fr)', md: '40px repeat(3, minmax(0, 1fr))' },
          gridTemplateRows: { md: 'auto repeat(3, minmax(170px, 1fr))' },
          // A4 ngang: lưới 3×3 vừa 1 trang
          '@media print': {
            gridTemplateColumns: '40px repeat(3, minmax(0, 1fr))',
            gridTemplateRows: 'auto repeat(3, 54mm)',
            breakInside: 'avoid',
          },
        })}
      >
        <Box sx={{ ...headerSx, display: { xs: 'none', md: 'block' } }} />

        {COST_COLUMNS.map((column) => (
          <Typography
            key={column}
            sx={(theme) => ({
              ...headerSx,
              display: { xs: 'none', md: 'block' },
              textAlign: 'center',
              py: 0.5,
              borderLeft: colDivider(theme),
            })}
          >
            {column}
          </Typography>
        ))}

        {COST_ROWS.map((row, rowIndex) => [
          <Box
            key={`${row.div}-label`}
            sx={[
              cellSx(rowIndex, 0),
              (theme) => ({
                display: { xs: 'none', md: 'grid' },
                placeItems: 'center',
                // vạch dọc 4px ở mép trái – 1 màu trung tính cho cả 3 xưởng
                boxShadow: `inset 4px 0 0 ${theme.palette.mode === 'dark' ? '#94A3B8' : '#475569'}`,
              }),
            ]}
          >
            <Typography
              sx={{
                fontSize: 16,
                fontWeight: 800,
                letterSpacing: 1,
                writingMode: 'vertical-rl',
                transform: 'rotate(180deg)',
              }}
            >
              {row.label}
            </Typography>
          </Box>,

          ...COST_COLUMNS.map((column, colIndex) => (
            <Box key={`${row.div}-${column}`} sx={cellSx(rowIndex, colIndex + 1)}>
              <CostChartCard
                month={month}
                chart={data?.charts.find((c) => c.div === row.div && c.chart === column)}
                title={`${row.label} · ${column}`}
                loading={loading}
                estVisible={estVisible}
                onOpenDetail={onOpenDetail && (() => onOpenDetail({ div: row.div, chart: column }))}
              />
            </Box>
          )),
        ])}
      </Box>
    </Box>
  )
}
