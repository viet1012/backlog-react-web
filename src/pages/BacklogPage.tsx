import { Alert, Card, Stack } from '@mui/material'
import type { PaletteMode } from '@mui/material/styles'
import type { GridPaginationModel, GridSortModel } from '@mui/x-data-grid'
import { useCallback, useState } from 'react'
import { DataTable } from '../components/DataTable'
import { BacklogFilterBar } from '../components/backlog/BacklogFilterBar'
import { BacklogSummary } from '../components/backlog/BacklogSummary'
import { PageHeader } from '../components/common/PageHeader'
import { PageShell } from '../components/common/PageShell'
import { RefreshButton } from '../components/common/RefreshButton'
import { UpdatedStatus } from '../components/common/UpdatedStatus'
import { ThemeToggleButton } from '../components/common/ThemeToggleButton'
import { useBacklogData } from '../hooks/useBacklogData'
import { useGridPreferences } from '../hooks/useGridPreferences'
import type { BacklogFilterItem, ReportFilters } from '../services/reportService'

const initialFilters: ReportFilters = {
  search: '', status: '', div: '', currentProcess: '', shipBy: '', productionDate: '',
}

interface BacklogPageProps { mode: PaletteMode; onToggleMode: () => void }

export function BacklogPage({
  mode,
  onToggleMode,
}: BacklogPageProps) {

  const [
    filters,
    setFilters,
  ] = useState<ReportFilters>(
    initialFilters,
  )

  const preferences =
    useGridPreferences(
      'backlog',
      100,
    )

  const [
    page,
    setPage,
  ] = useState(0)

  const [
    sortModel,
    setSortModel,
  ] = useState<GridSortModel>([])

  const [
    excelFilters,
    setExcelFilters,
  ] = useState<BacklogFilterItem[]>([])


  const {
    data,
    totalElements,

    summary,

    loading,
    error,

    lastUpdated,

    handleRefresh,
  } = useBacklogData({
    page,

    pageSize:
      preferences.pageSize,

    filters,
    excelFilters,
    sortModel,
  })


  // =======================================================
  // FILTER
  // =======================================================

  const handleFilterChange =
    useCallback(
      (
        name:
          keyof ReportFilters,

        value:
          string,
      ) => {

        setFilters(
          (current) => ({
            ...current,
            [name]: value,
          }),
        )

        setPage(0)
      },
      [],
    )


  // =======================================================
  // SUMMARY STATUS
  // =======================================================

  const handleSummaryStatusClick =
    useCallback(
      (status: string) => {

        setFilters(
          (current) => {

            const sameStatus =
              current.status
                .trim()
                .toUpperCase()
              ===
              status
                .trim()
                .toUpperCase()

            return {
              ...current,

              status:
                sameStatus
                  ? ''
                  : status,
            }
          },
        )

        setPage(0)
      },
      [],
    )


  // =======================================================
  // CLEAR
  // =======================================================

  const handleClearFilters =
    useCallback(
      () => {

        setFilters(
          initialFilters,
        )

        setExcelFilters([])

        setPage(0)
      },
      [],
    )


  // =======================================================
  // PAGINATION
  // =======================================================

  const handlePaginationChange =
    useCallback(
      (
        model:
          GridPaginationModel,
      ) => {

        if (
          model.pageSize
          !== preferences.pageSize
        ) {

          preferences.setPageSize(
            model.pageSize,
          )

          setPage(0)

          return
        }

        setPage(
          model.page,
        )
      },
      [preferences],
    )


  // =======================================================
  // EXCEL FILTER
  // =======================================================

  const handleExcelFiltersChange =
    useCallback(
      (
        nextFilters:
          BacklogFilterItem[],
      ) => {

        setExcelFilters(
          nextFilters,
        )

        setPage(0)
      },
      [],
    )


  // =======================================================
  // SORT
  // =======================================================

  const handleSortChange =
    useCallback(
      (
        model:
          GridSortModel,
      ) => {

        setSortModel(
          model,
        )

        setPage(0)
      },
      [],
    )


  return (
    <PageShell>

      <PageHeader
        title="PRODUCTION BACKLOG"

        subtitle={
          'Monitor production status, process flow and delivery progress.'
        }

        status={
          <UpdatedStatus
            updatedAt={
              lastUpdated
            }

            error={
              Boolean(
                error,
              )
            }
          />
        }

        actions={(
          <Stack
            direction="row"

            spacing={1.5}

            sx={{
              alignItems:
                'center',
            }}
          >
            <RefreshButton
              loading={
                loading
              }

              onClick={
                handleRefresh
              }
            />

            <ThemeToggleButton
              mode={
                mode
              }

              onToggle={
                onToggleMode
              }
            />
          </Stack>
        )}
      />


      {/* SUMMARY */}

      <BacklogSummary
        summary={
          summary
        }

        selectedStatus={
          filters.status
        }

        loading={
          loading
        }

        onStatusClick={
          handleSummaryStatusClick
        }
      />


      {/* FILTER */}

      <BacklogFilterBar
        filters={
          filters
        }

        excelFilterCount={
          excelFilters.length
        }

        loading={
          loading
        }

        onFilterChange={
          handleFilterChange
        }

        onClear={
          handleClearFilters
        }

        onRefresh={
          handleRefresh
        }
      />


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


      {/* TABLE */}

      <Card
        sx={{
          flex: 1,
          minHeight: 0,
          overflow: 'hidden',
        }}
      >
        <DataTable
          data={
            data
          }

          loading={
            loading
          }

          page={
            page
          }

          pageSize={
            preferences.pageSize
          }

          totalElements={
            totalElements
          }

          excelFilters={
            excelFilters
          }

          sortModel={
            sortModel
          }

          columnVisibilityModel={
            preferences.columnVisibilityModel
          }

          columnOrder={
            preferences.columnOrder
          }

          columnWidths={
            preferences.columnWidths
          }

          onColumnVisibilityModelChange={
            preferences
              .setColumnVisibilityModel
          }

          onColumnOrderChange={
            preferences
              .setColumnOrder
          }

          onColumnWidthChange={
            preferences
              .setColumnWidth
          }

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
