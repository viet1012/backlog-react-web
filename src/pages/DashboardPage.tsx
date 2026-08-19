import {
  Alert,
  Box,
  Button,
  Card,
  Chip,
  Container,
  FormControl,
  IconButton,
  InputAdornment,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  TextField,
  Typography,
} from '@mui/material'
import type { GridPaginationModel } from '@mui/x-data-grid'
import { useEffect, useMemo, useState } from 'react'
import { DataTable } from '../components/DataTable'
import { getReports, type ReportFilters } from '../services/reportService'
import type { ProductionOrder } from '../types/report'

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

export function DashboardPage() {
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
    <Container maxWidth={false} disableGutters sx={{ px: 2.5, py: 2 }}>
      <Stack
        direction="row"
        sx={{ mb: 1.5, alignItems: 'center', justifyContent: 'space-between' }}
      >
        <Box>
          <Typography variant="h5" component="h1" sx={{ fontWeight: 700 }}>
            Production Backlog
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Monitor and manage production orders
          </Typography>
        </Box>

        <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center' }}>
          <Typography variant="caption" color="text.secondary">
            Last updated:{' '}
            {lastUpdated ? lastUpdated.toLocaleTimeString() : 'Not yet loaded'}
          </Typography>
          <Button
            variant="outlined"
            size="small"
            startIcon={<span aria-hidden>↻</span>}
            onClick={() => setRefreshKey((value) => value + 1)}
            disabled={loading}
          >
            Refresh
          </Button>
        </Stack>
      </Stack>

      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, minmax(150px, 1fr))',
          gap: 1.5,
          mb: 1.5,
        }}
      >
        {[
          { label: 'Total Orders', value: totalElements, note: 'All matching orders' },
          { label: 'WIP', value: pageSummary.wip, note: 'Current page' },
          { label: 'Waiting', value: pageSummary.waiting, note: 'Current page' },
          { label: 'Completed', value: pageSummary.completed, note: 'Current page' },
        ].map((item) => (
          <Card key={item.label} variant="outlined" sx={{ px: 2, py: 1.25 }}>
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
          </Card>
        ))}
      </Box>

      <Card variant="outlined" sx={{ mb: 1.5, p: 1.5 }}>
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns:
              'minmax(280px, 2fr) repeat(4, minmax(135px, 1fr)) minmax(155px, 1fr) auto',
            gap: 1.25,
            alignItems: 'center',
          }}
        >
          <TextField
            placeholder="Search VBELN, Global Code, Product..."
            size="small"
            value={filters.search}
            onChange={(event) => updateFilter('search', event.target.value)}
            slotProps={{
              input: {
                startAdornment: (
                  <InputAdornment position="start">⌕</InputAdornment>
                ),
                endAdornment: filters.search ? (
                  <InputAdornment position="end">
                    <IconButton
                      size="small"
                      aria-label="Clear search"
                      onClick={() => updateFilter('search', '')}
                    >
                      ×
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
        variant="outlined"
        sx={{ height: 'max(430px, calc(100vh - 350px))', overflow: 'hidden' }}
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
    </Container>
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
