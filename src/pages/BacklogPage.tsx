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
  type GridPaginationModel,
  type GridSortModel,
} from '@mui/x-data-grid'

import {
  useEffect,
  useMemo,
  useState,
} from 'react'

import { DataTable } from '../components/DataTable'
import { AppButton } from '../components/common/AppButton'
import { PageHeader } from '../components/common/PageHeader'
import { PageShell } from '../components/common/PageShell'
import { RefreshButton } from '../components/common/RefreshButton'
import { UpdatedStatus } from '../components/common/UpdatedStatus'

import {
  searchReports,
  type BacklogFilterItem,
  type ReportFilters,
} from '../services/reportService'

import { uiTokens } from '../theme/uiTokens'
import type { ProductionOrder } from '../types/report'
import { isExcelFilterField } from '../config/backlogFilterFields'
import { useGridPreferences } from '../hooks/useGridPreferences'


// =========================================================
// INITIAL FILTERS
// =========================================================

const initialFilters: ReportFilters = {
  search: '',
  status: '',
  div: '',
  currentProcess: '',
  shipBy: '',
  productionDate: '',
}


// =========================================================
// FILTER LABELS
// =========================================================

const filterLabels: Record<keyof ReportFilters, string> = {
  search: 'Search',
  status: 'Status',
  div: 'Division',
  currentProcess: 'Process',
  shipBy: 'Ship By',
  productionDate: 'Production Date',
}


// =========================================================
// PROPS
// =========================================================

interface BacklogPageProps {
  mode: PaletteMode
  onToggleMode: () => void
}


// =========================================================
// PAGE
// =========================================================

export function BacklogPage({
  mode,
  onToggleMode,
}: BacklogPageProps) {

  // =======================================================
  // PAGINATION
  // =======================================================

  const [page, setPage] =
    useState(0)

  const {
    columnVisibilityModel,
    columnOrder,
    columnWidths,
    pageSize,
    setColumnVisibilityModel,
    setColumnOrder,
    setColumnWidth,
    setPageSize,
  } = useGridPreferences('backlog', 20)


  // =======================================================
  // DATA
  // =======================================================

  const [data, setData] =
    useState<ProductionOrder[]>([])

  const [totalElements, setTotalElements] =
    useState(0)


  // =======================================================
  // UI
  // =======================================================

  const [loading, setLoading] =
    useState(false)

  const [error, setError] =
    useState<string | null>(null)

  const [refreshKey, setRefreshKey] =
    useState(0)

  const [lastUpdated, setLastUpdated] =
    useState<Date | null>(null)


  // =======================================================
  // TOP FILTER BAR
  // =======================================================

  const [filters, setFilters] =
    useState<ReportFilters>(initialFilters)


  // =======================================================
  // GRID FILTER
  // =======================================================

  const [excelFilters, setExcelFilters] =
    useState<BacklogFilterItem[]>([])


  // =======================================================
  // GRID SORT
  // =======================================================

  const [
    sortModel,
    setSortModel,
  ] = useState<GridSortModel>([])


  // =======================================================
  // ACTIVE FILTERS
  // =======================================================

  const activeFilters = useMemo(
    () =>
      (
        Object.entries(filters) as Array<
          [keyof ReportFilters, string]
        >
      ).filter(([, value]) => value !== ''),
    [filters],
  )


  // =======================================================
  // KPI
  // =======================================================

  const pageSummary = useMemo(() => {
    const statuses =
      data.map(
        (order) =>
          order.Status?.toUpperCase() ?? '',
      )

    return {
      wip:
        statuses.filter(
          (status) =>
            status.includes('WIP'),
        ).length,

      waiting:
        statuses.filter(
          (status) =>
            status.includes('WAIT')
            || status === 'NYI',
        ).length,

      completed:
        statuses.filter(
          (status) =>
            status.includes('DONE')
            || status.includes('COMPLETE'),
        ).length,
    }
  }, [data])


  // =======================================================
  // TOP FILTER HANDLERS
  // =======================================================

  function updateFilter(
    name: keyof ReportFilters,
    value: string,
  ) {
    setFilters((current) => ({
      ...current,
      [name]: value,
    }))

    setPage(0)
  }


  function clearFilters() {
    setFilters(initialFilters)

    setExcelFilters([])

    setPage(0)
  }


  // =======================================================
  // PAGINATION
  // =======================================================

  function handlePaginationChange(
    model: GridPaginationModel,
  ) {
    if (model.pageSize !== pageSize) {
      setPageSize(model.pageSize)
      setPage(0)
      return
    }

    setPage(model.page)
  }


  // =======================================================
  // GRID FILTER
  // =======================================================

  function handleExcelFiltersChange(
    nextFilters: BacklogFilterItem[],
  ) {
    setExcelFilters(nextFilters)
    setPage(0)
  }


  // =======================================================
  // SORT
  // =======================================================

  function handleSortChange(
    model: GridSortModel,
  ) {
    setSortModel(model)
    setPage(0)
  }


  // =======================================================
  // LOAD DATA
  // =======================================================

  useEffect(() => {
    const controller =
      new AbortController()

    async function loadReports() {
      setLoading(true)
      setError(null)

      try {
        const topFilters: BacklogFilterItem[] = []

        // ===============================
        // SEARCH
        // ===============================

        const search =
          filters.search.trim()

        if (search) {
          topFilters.push({
            field: 'VBELN',
            operator: 'contains',
            value: search,
          })
        }

        // ===============================
        // STATUS
        // ===============================

        if (filters.status) {
          topFilters.push({
            field: 'Status',
            operator: 'equals',
            value: filters.status,
          })
        }

        // ===============================
        // DIVISION
        // ===============================

        if (filters.div) {
          topFilters.push({
            field: 'Div',
            operator: 'equals',
            value: filters.div,
          })
        }

        // ===============================
        // CURRENT PROCESS
        // ===============================

        if (filters.currentProcess) {
          topFilters.push({
            field: 'CurrentProcess',
            operator: 'equals',
            value: filters.currentProcess,
          })
        }

        // ===============================
        // SHIP BY
        // ===============================

        if (filters.shipBy) {
          topFilters.push({
            field: 'ShipBy',
            operator: 'equals',
            value: filters.shipBy,
          })
        }

        // ===============================
        // PRODUCTION DATE
        // ===============================

        if (filters.productionDate) {
          topFilters.push({
            field: 'ProductionD',
            operator: 'is',
            value: filters.productionDate,
          })
        }

        // ===============================
        // MERGE FILTER
        // ===============================

        const request = {
          filters: [
            ...excelFilters,
            ...topFilters,
          ],

          logicOperator: 'and' as const,
        }

        // ===============================
        // API
        // ===============================

        const response =
          await searchReports(
            page,
            pageSize,
            request,
            controller.signal,

            sortModel[0]
              && sortModel[0].sort
              && isExcelFilterField(
                sortModel[0].field,
              )
              ? {
                field: sortModel[0].field,
                direction: sortModel[0].sort,
              }
              : undefined,
          )

        setData(response.content)

        setTotalElements(
          response.totalElements,
        )

        setLastUpdated(
          new Date(),
        )
      } catch (requestError) {
        if (
          !controller.signal.aborted
        ) {
          setData([])
          setTotalElements(0)

          setError(
            requestError instanceof Error
              ? requestError.message
              : 'Unable to load production backlog',
          )
        }
      } finally {
        if (
          !controller.signal.aborted
        ) {
          setLoading(false)
        }
      }
    }

    void loadReports()

    return () => {
      controller.abort()
    }
  }, [
    page,
    pageSize,
    filters,
    excelFilters,
    refreshKey,

    // Tạm thời để đây để UI refresh khi sort đổi.
    // Backend sort sẽ nối sau.
    sortModel,
  ])


  // =======================================================
  // RENDER
  // =======================================================

  return (
    <PageShell>

      {/* ===================================================
          HEADER
      =================================================== */}

      <PageHeader
        title="PRODUCTION BACKLOG"
        subtitle="Monitor production status, process flow and delivery progress."
        status={
          <UpdatedStatus
            updatedAt={lastUpdated}
            error={Boolean(error)}
          />
        }
        actions={
          <Stack
            direction="row"
            spacing={1.5}
            sx={{
              alignItems: 'center',
            }}
          >
            <RefreshButton
              loading={loading}
              onClick={() =>
                setRefreshKey(
                  (value) => value + 1,
                )
              }
            />

            <Tooltip
              title={
                mode === 'light'
                  ? 'Switch to dark mode'
                  : 'Switch to light mode'
              }
            >
              <span>
                <AppButton
                  variant="outlined"
                  onClick={onToggleMode}
                  icon={
                    <span aria-hidden>
                      {mode === 'light'
                        ? '☼'
                        : '☾'}
                    </span>
                  }
                >
                  {mode === 'light'
                    ? 'Light'
                    : 'Dark'}
                </AppButton>
              </span>
            </Tooltip>
          </Stack>
        }
      />


      {/* ===================================================
          KPI
      =================================================== */}

      <Box
        sx={{
          display: 'grid',

          gridTemplateColumns:
            'repeat(4, minmax(150px, 1fr))',

          gap: 1.5,
          mb: 0.5,
        }}
      >
        {[
          {
            label: 'Total Orders',
            value: totalElements,
            note: 'All matching orders',
            accent: '#60a5fa',
          },
          {
            label: 'WIP',
            value: pageSummary.wip,
            note: 'Current page',
            accent: '#f59e0b',
          },
          {
            label: 'Waiting',
            value: pageSummary.waiting,
            note: 'Current page',
            accent: '#38bdf8',
          },
          {
            label: 'Completed',
            value: pageSummary.completed,
            note: 'Current page',
            accent: '#22c55e',
          },
        ].map((item) => (
          <Card
            key={item.label}
            sx={{
              px: 2,
              py: 1.2,

              borderTop:
                `2px solid ${item.accent}`,

              transition:
                'transform 170ms ease, box-shadow 170ms ease',

              '&:hover': {
                transform:
                  'translateY(-1px)',
              },
            }}
          >
            <Stack
              direction="row"
              spacing={1.25}
              sx={{
                alignItems: 'center',
              }}
            >
              <Box
                sx={{
                  width: 3,
                  height: 28,

                  flex: '0 0 auto',

                  borderRadius: '1px',

                  bgcolor:
                    item.accent,
                }}
              />

              <Box>
                <Typography
                  color="text.secondary"
                  sx={{
                    fontSize:
                      uiTokens
                        .kpi
                        .labelFontSize,
                  }}
                >
                  {item.label}
                </Typography>

                <Stack
                  direction="row"
                  spacing={1}
                  sx={{
                    alignItems:
                      'baseline',
                  }}
                >
                  <Typography
                    sx={{
                      fontSize:
                        uiTokens
                          .kpi
                          .valueFontSize,

                      fontWeight: 800,
                    }}
                  >
                    {item.value
                      .toLocaleString()}
                  </Typography>

                  <Typography
                    color="text.disabled"
                    sx={{
                      fontSize:
                        uiTokens
                          .kpi
                          .secondaryFontSize,
                    }}
                  >
                    {item.note}
                  </Typography>
                </Stack>
              </Box>
            </Stack>
          </Card>
        ))}
      </Box>


      {/* ===================================================
          TOP FILTER PANEL
      =================================================== */}

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

            alignItems:
              'center',
          }}
        >

          {/* SEARCH */}

          <TextField
            placeholder="Search sales order, global code, product..."
            size="small"
            value={filters.search}
            onChange={(event) =>
              updateFilter(
                'search',
                event.target.value,
              )
            }
            slotProps={{
              input: {
                startAdornment: (
                  <InputAdornment position="start">
                    ⌕
                  </InputAdornment>
                ),

                endAdornment:
                  filters.search
                    ? (
                      <InputAdornment position="end">
                        <IconButton
                          size="small"
                          aria-label="Clear search"
                          onClick={() =>
                            updateFilter(
                              'search',
                              '',
                            )
                          }
                        >
                          ×
                        </IconButton>
                      </InputAdornment>
                    )
                    : null,
              },
            }}
          />


          <FilterSelect
            id="status"
            label="Status"
            value={filters.status}
            options={[
              'DONE',
              'WIP',
              'WIP_FG',
              'NYI',
            ]}
            onChange={(value) =>
              updateFilter(
                'status',
                value,
              )
            }
          />


          <FilterSelect
            id="division"
            label="Division"
            value={filters.div}
            options={[
              'PR',
            ]}
            onChange={(value) =>
              updateFilter(
                'div',
                value,
              )
            }
          />


          <FilterSelect
            id="process"
            label="Current Process"
            value={
              filters.currentProcess
            }
            options={[
              'Packing',
              'Packing Received',
              'Inspection',
              'SGDT',
            ]}
            onChange={(value) =>
              updateFilter(
                'currentProcess',
                value,
              )
            }
          />


          <FilterSelect
            id="ship-by"
            label="Ship By"
            value={filters.shipBy}
            options={[
              'AIR',
              'EXP',
              'SEA',
            ]}
            onChange={(value) =>
              updateFilter(
                'shipBy',
                value,
              )
            }
          />


          <TextField
            label="Production Date"
            type="date"
            size="small"
            value={
              filters.productionDate
            }
            onChange={(event) =>
              updateFilter(
                'productionDate',
                event.target.value,
              )
            }
            slotProps={{
              inputLabel: {
                shrink: true,
              },
            }}
          />


          <AppButton
            variant="outlined"
            onClick={clearFilters}
            disabled={
              activeFilters.length === 0
              && excelFilters.length === 0
            }
          >
            Clear Filters
          </AppButton>


          <AppButton
            variant="outlined"
            loading={loading}
            onClick={() =>
              setRefreshKey(
                (value) =>
                  value + 1,
              )
            }
          >
            Refresh
          </AppButton>

        </Box>


        {/* ===============================================
            ACTIVE FILTERS
        =============================================== */}

        {activeFilters.length > 0 && (
          <Stack
            direction="row"
            spacing={1}
            useFlexGap
            sx={{
              mt: 1.25,
              alignItems: 'center',
              flexWrap: 'wrap',
            }}
          >
            <Typography
              variant="caption"
              color="text.secondary"
            >
              Active filters:
            </Typography>

            {activeFilters.map(
              ([name, value]) => (
                <Chip
                  key={name}
                  size="small"
                  label={
                    `${filterLabels[name]}: ${value}`
                  }
                  onDelete={() =>
                    updateFilter(
                      name,
                      '',
                    )
                  }
                />
              ),
            )}

            <AppButton
              variant="outlined"
              onClick={clearFilters}
            >
              Clear All
            </AppButton>
          </Stack>
        )}
      </Card>


      {/* ===================================================
          ERROR
      =================================================== */}

      {error && (
        <Alert
          severity="error"
          sx={{
            mb: 1.5,
          }}
        >
          {error}
        </Alert>
      )}


      {/* ===================================================
          TABLE
      =================================================== */}

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

          excelFilters={
            excelFilters
          }

          sortModel={
            sortModel
          }

          columnVisibilityModel={
            columnVisibilityModel
          }

          onColumnVisibilityModelChange={
            setColumnVisibilityModel
          }

          columnOrder={columnOrder}
          columnWidths={columnWidths}
          onColumnOrderChange={setColumnOrder}
          onColumnWidthChange={setColumnWidth}

          onExcelFiltersChange={
            handleExcelFiltersChange
          }

          onSortChange={
            handleSortChange
          }

          onPaginationChange={
            handlePaginationChange
          }
        />
      </Card>

    </PageShell>
  )
}


// =========================================================
// FILTER SELECT
// =========================================================

interface FilterSelectProps {
  id: string
  label: string
  value: string
  options: string[]
  onChange: (
    value: string,
  ) => void
}


function FilterSelect({
  id,
  label,
  value,
  options,
  onChange,
}: FilterSelectProps) {

  return (
    <FormControl size="small">

      <InputLabel
        id={`${id}-filter-label`}
      >
        {label}
      </InputLabel>

      <Select
        labelId={
          `${id}-filter-label`
        }
        label={label}
        value={value}
        onChange={(event) =>
          onChange(
            event.target.value,
          )
        }
      >
        <MenuItem value="">
          All
        </MenuItem>

        {options.map(
          (option) => (
            <MenuItem
              key={option}
              value={option}
            >
              {option}
            </MenuItem>
          ),
        )}
      </Select>

    </FormControl>
  )
}
