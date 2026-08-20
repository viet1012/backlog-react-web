import {
  Alert,
  Box,
  Button,
  Card,
  Chip,
  FormControl,
  IconButton,
  InputAdornment,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material'
import type { PaletteMode, Theme } from '@mui/material/styles'
import type { GridPaginationModel } from '@mui/x-data-grid'
import { useEffect, useMemo, useState } from 'react'
import { DataTable } from '../components/DataTable'
import { PageHeader } from '../components/common/PageHeader'
import { PageShell } from '../components/common/PageShell'
import { UpdatedStatus } from '../components/common/UpdatedStatus'
import { getReports, type ReportFilters } from '../services/reportService'
import type { ProductionOrder } from '../types/report'
import { RefreshButton } from '../components/common/RefreshButton'

const initialFilters: ReportFilters = {
  search: '',
  status: '',
  div: '',
  currentProcess: '',
  shipBy: '',
  productionDate: '',
}

const filterLabels: Record<keyof ReportFilters, string> = {
  search: 'Search',
  status: 'Status',
  div: 'Division',
  currentProcess: 'Process',
  shipBy: 'Ship By',
  productionDate: 'Production Date',
}

const glassPanelSx = (theme: Theme) => ({
  backgroundColor:
    theme.palette.mode === 'dark'
      ? 'rgba(15, 23, 42, 0.64)'
      : 'rgba(255, 255, 255, 0.72)',
  backgroundImage: 'none',
  border: `1px solid ${theme.palette.divider}`,
  boxShadow:
    theme.palette.mode === 'dark'
      ? '0 12px 34px rgba(0, 0, 0, 0.18)'
      : '0 12px 30px rgba(15, 23, 42, 0.07)',
  backdropFilter: 'blur(14px)',
  borderRadius: 4,
})

interface DashboardPageProps {
  mode: PaletteMode
  onToggleMode: () => void
}

export function DashboardPage({ mode, onToggleMode }: DashboardPageProps) {
  const [page, setPage] = useState(0)
  const [pageSize, setPageSize] = useState(20)
  const [data, setData] = useState<ProductionOrder[]>([])
  const [totalElements, setTotalElements] = useState(0)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [filters, setFilters] = useState<ReportFilters>(initialFilters)
  const [refreshKey, setRefreshKey] = useState(0)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)

  const activeFilters = useMemo(
    () =>
      (Object.entries(filters) as Array<[keyof ReportFilters, string]>).filter(
        ([, value]) => value !== '',
      ),
    [filters],
  )

  const pageSummary = useMemo(() => {
    const normalizedStatuses = data.map((order) =>
      order.Status?.toUpperCase() ?? '',
    )

    return {
      wip: normalizedStatuses.filter((status) => status.includes('WIP')).length,
      waiting: normalizedStatuses.filter(
        (status) => status.includes('WAIT') || status === 'NYI',
      ).length,
      completed: normalizedStatuses.filter(
        (status) => status.includes('DONE') || status.includes('COMPLETE'),
      ).length,
    }
  }, [data])

  function updateFilter(name: keyof ReportFilters, value: string) {
    setFilters((currentFilters) => ({ ...currentFilters, [name]: value }))
    setPage(0)
  }

  function clearFilters() {
    setFilters(initialFilters)
    setPage(0)
  }

  function handlePaginationChange(model: GridPaginationModel) {
    if (model.pageSize !== pageSize) {
      setPageSize(model.pageSize)
      setPage(0)
      return
    }

    setPage(model.page)
  }

  useEffect(() => {
    const controller = new AbortController()

    async function loadReports() {
      setLoading(true)
      setError(null)

      try {
        const response = await getReports(
          page,
          filters,
          controller.signal,
          pageSize,
        )

        setData(response.content)
        setTotalElements(response.totalElements)
        setLastUpdated(new Date())
      } catch (requestError) {
        if (!controller.signal.aborted) {
          setData([])
          setTotalElements(0)
          setError(
            requestError instanceof Error
              ? requestError.message
              : 'Unable to load production backlog',
          )
        }
      } finally {
        if (!controller.signal.aborted) setLoading(false)
      }
    }

    void loadReports()
    return () => controller.abort()
  }, [page, pageSize, filters, refreshKey])

  return (
    <PageShell>
      <PageHeader
        title="PRODUCTION BACKLOG"
        subtitle="Monitor production status, process flow and delivery progress."
        status={
          <UpdatedStatus updatedAt={lastUpdated} error={Boolean(error)} />
        }
        actions={
          <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center' }}>
            <RefreshButton
              loading={loading}
              onClick={() => setRefreshKey((value) => value + 1)}
            />
            <Tooltip
              title={
                mode === 'light' ? 'Switch to dark mode' : 'Switch to light mode'
              }
            >
              <Button
                size="small"
                variant="outlined"
                onClick={onToggleMode}
                startIcon={
                  <span aria-hidden>{mode === 'light' ? '\u263c' : '\u263e'}</span>
                }
                sx={{ minWidth: 86 }}
              >
                {mode === 'light' ? 'Light' : 'Dark'}
              </Button>
            </Tooltip>
          </Stack>
        }
      />

      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, minmax(150px, 1fr))',
          gap: 1.5,
          mb: 1,
        }}
      >
        {[
          {
            label: 'Total Orders',
            value: totalElements,
            note: 'All matching orders',
            accent: '#60a5fa',
          },
          { label: 'WIP', value: pageSummary.wip, note: 'Current page', accent: '#f59e0b' },
          { label: 'Waiting', value: pageSummary.waiting, note: 'Current page', accent: '#38bdf8' },
          { label: 'Completed', value: pageSummary.completed, note: 'Current page', accent: '#22c55e' },
        ].map((item) => (
          <Card
            key={item.label}
            sx={(theme) => ({
              ...glassPanelSx(theme),
              px: 2,
              py: 1.2,
              borderTop: `2px solid ${item.accent}`,
              transition: 'transform 170ms ease',
              '&:hover': { transform: 'translateY(-1px)' },
            })}
          >
            <Stack direction="row" spacing={1.25} sx={{ alignItems: 'center' }}>
              <Box
                sx={{
                  width: 9,
                  height: 9,
                  flex: '0 0 auto',
                  borderRadius: '50%',
                  bgcolor: item.accent,
                  boxShadow: `0 0 0 5px ${item.accent}18`,
                }}
              />
              <Box>
                <Typography variant="caption" color="text.secondary">
                  {item.label}
                </Typography>
                <Stack direction="row" spacing={1} sx={{ alignItems: 'baseline' }}>
                  <Typography variant="h6" sx={{ fontWeight: 700 }}>
                    {item.value.toLocaleString()}
                  </Typography>
                  <Typography variant="caption" color="text.disabled">
                    {item.note}
                  </Typography>
                </Stack>
              </Box>
            </Stack>
          </Card>
        ))}
      </Box>

      <Card
        sx={(theme) => ({ ...glassPanelSx(theme), mb: 1, p: 1.5 })}
      >
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns:
              'minmax(280px, 2fr) repeat(4, minmax(135px, 1fr)) minmax(155px, 1fr) auto auto',
            gap: 1.25,
            alignItems: 'center',
          }}
        >
          <TextField
            placeholder="Search sales order, global code, product..."
            size="small"
            value={filters.search}
            onChange={(event) => updateFilter('search', event.target.value)}
            slotProps={{
              input: {
                startAdornment: (
                  <InputAdornment position="start">{'\u2315'}</InputAdornment>
                ),
                endAdornment: filters.search ? (
                  <InputAdornment position="end">
                    <IconButton
                      size="small"
                      aria-label="Clear search"
                      onClick={() => updateFilter('search', '')}
                    >
                      {'\u00d7'}
                    </IconButton>
                  </InputAdornment>
                ) : null,
              },
            }}
          />

          <FilterSelect
            id="status"
            label="Status"
            value={filters.status}
            options={['DONE', 'WIP', 'WIP_FG', 'NYI']}
            onChange={(value) => updateFilter('status', value)}
          />
          <FilterSelect
            id="division"
            label="Division"
            value={filters.div}
            options={['PR']}
            onChange={(value) => updateFilter('div', value)}
          />
          <FilterSelect
            id="process"
            label="Current Process"
            value={filters.currentProcess}
            options={['Packing', 'Packing Received', 'Inspection', 'SGDT']}
            onChange={(value) => updateFilter('currentProcess', value)}
          />
          <FilterSelect
            id="ship-by"
            label="Ship By"
            value={filters.shipBy}
            options={['AIR', 'EXP', 'SEA']}
            onChange={(value) => updateFilter('shipBy', value)}
          />
          <TextField
            label="Production Date"
            type="date"
            size="small"
            value={filters.productionDate}
            onChange={(event) =>
              updateFilter('productionDate', event.target.value)
            }
            slotProps={{ inputLabel: { shrink: true } }}
          />
          <Button
            size="small"
            onClick={clearFilters}
            disabled={activeFilters.length === 0}
            sx={{ whiteSpace: 'nowrap' }}
          >
            Clear Filters
          </Button>
          <Button
            size="small"
            variant="outlined"
            onClick={() => setRefreshKey((value) => value + 1)}
            disabled={loading}
            sx={{ whiteSpace: 'nowrap' }}
          >
            Refresh
          </Button>
        </Box>

        {activeFilters.length > 0 && (
          <Stack
            direction="row"
            spacing={1}
            sx={{ mt: 1.25, alignItems: 'center' }}
          >
            <Typography variant="caption" color="text.secondary">
              Active filters:
            </Typography>
            {activeFilters.map(([name, value]) => (
              <Chip
                key={name}
                size="small"
                label={`${filterLabels[name]}: ${value}`}
                onDelete={() => updateFilter(name, '')}
                sx={(theme) => ({
                  bgcolor:
                    theme.palette.mode === 'dark'
                      ? 'rgba(96,165,250,0.09)'
                      : 'rgba(37,99,235,0.07)',
                  border: `1px solid ${theme.palette.divider}`,
                  '&:hover': { filter: 'brightness(1.15)' },
                })}
              />
            ))}
            <Button size="small" onClick={clearFilters}>
              Clear All
            </Button>
          </Stack>
        )}
      </Card>

      {error && (
        <Alert severity="error" sx={{ mb: 1.5 }}>
          {error}
        </Alert>
      )}

      <Card
        sx={(theme) => ({
          flex: 1,
          minHeight: 0,
          overflow: 'hidden',

          bgcolor:
            theme.palette.mode === 'dark'
              ? '#101a2b'
              : '#ffffff',

          backgroundImage: 'none',

          border: `1px solid ${theme.palette.divider}`,

          boxShadow:
            theme.palette.mode === 'dark'
              ? '0 16px 45px rgba(0,0,0,0.25)'
              : '0 14px 36px rgba(15,23,42,0.09)',
        })}
      >
        <DataTable
          data={data}
          loading={loading}
          page={page}
          pageSize={pageSize}
          totalElements={totalElements}
          onPaginationChange={handlePaginationChange}
        />
      </Card>
    </PageShell>
  )
}

interface FilterSelectProps {
  id: string
  label: string
  value: string
  options: string[]
  onChange: (value: string) => void
}

function FilterSelect({ id, label, value, options, onChange }: FilterSelectProps) {
  return (
    <FormControl size="small">
      <InputLabel id={`${id}-filter-label`}>{label}</InputLabel>
      <Select
        labelId={`${id}-filter-label`}
        label={label}
        value={value}
        onChange={(event) => onChange(event.target.value)}
      >
        <MenuItem value="">All</MenuItem>
        {options.map((option) => (
          <MenuItem key={option} value={option}>
            {option}
          </MenuItem>
        ))}
      </Select>
    </FormControl>
  )
}
