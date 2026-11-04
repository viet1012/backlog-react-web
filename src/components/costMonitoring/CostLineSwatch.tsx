import { Box, useTheme } from '@mui/material'
import { COST_SERIES, seriesColor, type CostSeriesKey } from './costChartConfig'

interface CostLineSwatchProps {
  series: CostSeriesKey
  width?: number
}

// Mẫu đường đúng màu / nét như trên chart (Actual có mũi tên ở cuối)
export function CostLineSwatch({ series, width = 26 }: CostLineSwatchProps) {
  const dark = useTheme().palette.mode === 'dark'
  const config = COST_SERIES.find((s) => s.key === series)!
  const color = seriesColor(config, dark)
  const isActual = series === 'actMtd'

  return (
    <Box component="svg" width={width} height={10} sx={{ flexShrink: 0, display: 'block' }}>
      <line
        x1={1}
        y1={5}
        x2={isActual ? width - 8 : width - 1}
        y2={5}
        stroke={color}
        strokeWidth={config.strokeWidth}
        strokeDasharray={config.dash}
      />
      {isActual && <polygon points={`${width - 10},1 ${width - 1},5 ${width - 10},9`} fill={color} />}
    </Box>
  )
}
