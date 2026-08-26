import {
  Alert,
  Box,
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
import type { PaletteMode } from '@mui/material/styles'
import {
  GridLogicOperator,
  type GridFilterModel,
  type GridPaginationModel,
} from '@mui/x-data-grid'
import { useEffect, useMemo, useState } from 'react'
import { DataTable } from '../components/DataTable'
import { PageHeader } from '../components/common/PageHeader'
import { PageShell } from '../components/common/PageShell'
import { UpdatedStatus } from '../components/common/UpdatedStatus'
import {
  searchReports,
  type ReportFilters,
} from '../services/reportService'
import type { ProductionOrder } from '../types/report'
import { RefreshButton } from '../components/common/RefreshButton'
import { toBacklogFilterRequest } from '../utils/backlogFilter'
import { uiTokens } from '../theme/uiTokens'
import { AppButton } from '../components/common/AppButton'

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
  const [gridFilterModel, setGridFilterModel] = useState<GridFilterModel>({
    items: [],
    logicOperator: GridLogicOperator.And,
  })
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

  function handleGridFilterChange(model: GridFilterModel) {
    setGridFilterModel(model)
    setPage(0)
  }

  useEffect(() => {
    const controller = new AbortController()

    async function loadReports() {
      setLoading(true)
      setError(null)

      try {
        const response = await searchReports(
          page,
          pageSize,
          toBacklogFilterRequest(gridFilterModel),
          controller.signal,
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
  }, [page, pageSize, gridFilterModel, refreshKey])

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
              <AppButton
                variant="outlined"
                onClick={onToggleMode}
                icon={
                  <span aria-hidden>
                    {mode === 'light' ? '☼' : '☾'}
                  </span>
                }
              >
                {mode === 'light' ? 'Light' : 'Dark'}
              </AppButton>
            </Tooltip>
          </Stack>
        }
      />

      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, minmax(150px, 1fr))',
          gap: 1.5,
          mb: .5,

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
            sx={{
              px: 2,
              py: 1.2,
              borderTop: `2px solid ${item.accent}`,
              transition: 'transform 170ms ease, box-shadow 170ms ease',
              '&:hover': { transform: 'translateY(-1px)' },
            }}
          >
            <Stack direction="row" spacing={1.25} sx={{ alignItems: 'center' }}>
              <Box
                sx={{
                  width: 3,
                  height: 28,
                  flex: '0 0 auto',
                  borderRadius: '1px',
                  bgcolor: item.accent,
                }}
              />
              <Box>
                <Typography
                  color="text.secondary"
                  sx={{ fontSize: uiTokens.kpi.labelFontSize }}
                >
                  {item.label}
                </Typography>
                <Stack direction="row" spacing={1} sx={{ alignItems: 'baseline' }}>
                  <Typography
                    sx={{
                      fontSize: uiTokens.kpi.valueFontSize,
                      fontWeight: 800,
                    }}
                  >
                    {item.value.toLocaleString()}
                  </Typography>
                  <Typography
                    color="text.disabled"
                    sx={{ fontSize: uiTokens.kpi.secondaryFontSize }}
                  >
                    {item.note}
                  </Typography>
                </Stack>
              </Box>
            </Stack>
          </Card>
        ))}
      </Box>

      <Card
        elevation={0}
        sx={{
          mb: 0.5,
          p: 1.25,
        }}
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
          <AppButton
            onClick={clearFilters}
            disabled={activeFilters.length === 0}
          >
            Clear Filters
          </AppButton>

          <AppButton
            variant="outlined"
            onClick={() =>
              setRefreshKey((value) => value + 1)
            }
            loading={loading}
          >
            Refresh
          </AppButton>
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
              />
            ))}
            <AppButton onClick={clearFilters}>
              Clear All
            </AppButton>
          </Stack>
        )}
      </Card>

      {error && (
        <Alert severity="error" sx={{ mb: 1.5 }}>
          {error}
        </Alert>
      )}

      <Card
        sx={{
          flex: 1,
          minHeight: 0,
          overflow: 'hidden',
        }}
      >
        <DataTable
          data={data}
          loading={loading}
          page={page}
          pageSize={pageSize}
          totalElements={totalElements}
          filterModel={gridFilterModel}
          onFilterChange={handleGridFilterChange}
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
