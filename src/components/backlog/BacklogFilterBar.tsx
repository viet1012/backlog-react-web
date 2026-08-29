import { alpha, Box, Chip, FormControl, IconButton, InputAdornment, InputLabel, MenuItem, Select, Stack, TextField, Typography } from '@mui/material'
import { AppButton } from '../common/AppButton'
import { GlassPanel } from '../common/GlassPanel'
import type { ReportFilters } from '../../services/reportService'
import FilterAltOffRoundedIcon from '@mui/icons-material/FilterAltOffRounded'
import { ClearButton } from '../common/ClearButton'
const labels: Record<keyof ReportFilters, string> = {
  search: 'Search', status: 'Status', div: 'Division', currentProcess: 'Process',
  shipBy: 'Ship By', productionDate: 'Production Date',
}

interface BacklogFilterBarProps {
  filters: ReportFilters
  excelFilterCount: number
  loading: boolean
  onFilterChange: (name: keyof ReportFilters, value: string) => void
  onClear: () => void
  onRefresh: () => void
}

const selectOptions = {
  status: ['DONE', 'WIP', 'WIP_FG', 'NYI'],
  div: ['PR'],
  currentProcess: ['Packing', 'Packing Received', 'Inspection', 'SGDT'],
  shipBy: ['AIR', 'EXP', 'SEA'],
} as const

export function BacklogFilterBar({ filters, excelFilterCount, onFilterChange, onClear, }: BacklogFilterBarProps) {
  const activeFilters = (Object.entries(filters) as Array<[keyof ReportFilters, string]>).filter(([, value]) => value !== '')
  return (
    <GlassPanel sx={{ mb: 0.5, p: 1.25 }}>
      <Box sx={{ display: 'grid', gridTemplateColumns: 'minmax(280px, 2fr) repeat(4, minmax(135px, 1fr)) minmax(155px, 1fr) auto auto', gap: 1.25, alignItems: 'center' }}>
        <TextField placeholder="Search sales order, global code, product..." size="small" value={filters.search}
          onChange={(event) => onFilterChange('search', event.target.value)}
          slotProps={{ input: { startAdornment: <InputAdornment position="start">⌕</InputAdornment>, endAdornment: filters.search ? <InputAdornment position="end"><IconButton size="small" aria-label="Clear search" onClick={() => onFilterChange('search', '')}>×</IconButton></InputAdornment> : null } }} />
        {(Object.keys(selectOptions) as Array<keyof typeof selectOptions>).map((name) => (
          <FormControl size="small" key={name}>
            <InputLabel id={`${name}-filter-label`}>{labels[name]}</InputLabel>
            <Select labelId={`${name}-filter-label`} label={labels[name]} value={filters[name]} onChange={(event) => onFilterChange(name, event.target.value)}>
              <MenuItem value="">All</MenuItem>
              {selectOptions[name].map((option) => <MenuItem key={option} value={option}>{option}</MenuItem>)}
            </Select>
          </FormControl>
        ))}
        <TextField label="Production Date" type="date" size="small" value={filters.productionDate}
          onChange={(event) => onFilterChange('productionDate', event.target.value)} slotProps={{ inputLabel: { shrink: true } }} />
        <ClearButton
          disabled={
            activeFilters.length === 0
            && excelFilterCount === 0
          }
          onClick={onClear}
        />
      </Box>
      {activeFilters.length > 0 && (
        <Stack direction="row" spacing={1} useFlexGap sx={{ mt: 1.25, alignItems: 'center', flexWrap: 'wrap' }}>
          <Typography variant="caption" color="text.secondary">Active filters:</Typography>
          {activeFilters.map(([name, value]) => <Chip key={name} size="small" label={`${labels[name]}: ${value}`} onDelete={() => onFilterChange(name, '')} />)}
          <ClearButton
            mode="clearAll"
            onClick={onClear}
          />
        </Stack>
      )}
    </GlassPanel>
  )
}
