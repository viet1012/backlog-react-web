import { Alert, Card, Stack, Tooltip } from '@mui/material'
import type { PaletteMode } from '@mui/material/styles'
import type { GridPaginationModel, GridSortModel } from '@mui/x-data-grid'
import { useCallback, useState } from 'react'
import { DataTable } from '../components/DataTable'
import { BacklogFilterBar } from '../components/backlog/BacklogFilterBar'
import { BacklogSummary } from '../components/backlog/BacklogSummary'
import { AppButton } from '../components/common/AppButton'
import { PageHeader } from '../components/common/PageHeader'
import { PageShell } from '../components/common/PageShell'
import { RefreshButton } from '../components/common/RefreshButton'
import { UpdatedStatus } from '../components/common/UpdatedStatus'
import { useBacklogData } from '../hooks/useBacklogData'
import { useGridPreferences } from '../hooks/useGridPreferences'
import type { BacklogFilterItem, ReportFilters } from '../services/reportService'

const initialFilters: ReportFilters = {
  search: '', status: '', div: '', currentProcess: '', shipBy: '', productionDate: '',
}

interface BacklogPageProps { mode: PaletteMode; onToggleMode: () => void }

export function BacklogPage({ mode, onToggleMode }: BacklogPageProps) {
  // =======================================================
  // PAGE FILTER STATE
  // =======================================================
  const [filters, setFilters] = useState<ReportFilters>(initialFilters)

  // =======================================================
  // GRID PREFERENCES
  // =======================================================
  const preferences = useGridPreferences('backlog', 100)

  // =======================================================
  // PAGINATION / SORT / EXCEL FILTERS
  // =======================================================
  const [page, setPage] = useState(0)
  const [sortModel, setSortModel] = useState<GridSortModel>([])
  const [excelFilters, setExcelFilters] = useState<BacklogFilterItem[]>([])

  // =======================================================
  // DATA HOOK
  // =======================================================
  const { data, totalElements, loading, error, lastUpdated, handleRefresh } = useBacklogData({
    page, pageSize: preferences.pageSize, filters, excelFilters, sortModel,
  })

  // =======================================================
  // HANDLERS
  // =======================================================
  const handleFilterChange = useCallback((name: keyof ReportFilters, value: string) => {
    setFilters((current) => ({ ...current, [name]: value }))
    setPage(0)
  }, [])

  const handleClearFilters = useCallback(() => {
    setFilters(initialFilters)
    setExcelFilters([])
    setPage(0)
  }, [])

  const handlePaginationChange = useCallback((model: GridPaginationModel) => {
    if (model.pageSize !== preferences.pageSize) {
      preferences.setPageSize(model.pageSize)
      setPage(0)
      return
    }
    setPage(model.page)
  }, [preferences])

  const handleExcelFiltersChange = useCallback((nextFilters: BacklogFilterItem[]) => {
    setExcelFilters(nextFilters)
    setPage(0)
  }, [])

  const handleSortChange = useCallback((model: GridSortModel) => {
    setSortModel(model)
    setPage(0)
  }, [])

  // =======================================================
  // RENDER
  // =======================================================
  return (
    <PageShell>
      <PageHeader
        title="PRODUCTION BACKLOG"
        subtitle="Monitor production status, process flow and delivery progress."
        status={<UpdatedStatus updatedAt={lastUpdated} error={Boolean(error)} />}
        actions={(
          <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center' }}>
            <RefreshButton loading={loading} onClick={handleRefresh} />
            <Tooltip title={mode === 'light' ? 'Switch to dark mode' : 'Switch to light mode'}>
              <span>
                <AppButton variant="outlined" onClick={onToggleMode} icon={<span aria-hidden>{mode === 'light' ? '☼' : '☾'}</span>}>
                  {mode === 'light' ? 'Light' : 'Dark'}
                </AppButton>
              </span>
            </Tooltip>
          </Stack>
        )}
      />

      <BacklogSummary data={data} totalElements={totalElements} />
      <BacklogFilterBar
        filters={filters}
        excelFilterCount={excelFilters.length}
        loading={loading}
        onFilterChange={handleFilterChange}
        onClear={handleClearFilters}
        onRefresh={handleRefresh}
      />
      {error && <Alert severity="error" sx={{ mb: 1.5 }}>{error}</Alert>}

      <Card sx={{ flex: 1, minHeight: 0, overflow: 'hidden' }}>
        <DataTable
          data={data} loading={loading} page={page} pageSize={preferences.pageSize}
          totalElements={totalElements} excelFilters={excelFilters} sortModel={sortModel}
          columnVisibilityModel={preferences.columnVisibilityModel}
          columnOrder={preferences.columnOrder} columnWidths={preferences.columnWidths}
          onColumnVisibilityModelChange={preferences.setColumnVisibilityModel}
          onColumnOrderChange={preferences.setColumnOrder}
          onColumnWidthChange={preferences.setColumnWidth}
          onExcelFiltersChange={handleExcelFiltersChange}
          onSortChange={handleSortChange}
          onPaginationChange={handlePaginationChange}
        />
      </Card>
    </PageShell>
  )
}
