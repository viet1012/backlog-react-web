// import { Alert, Card} from '@mui/material'
// import type { PaletteMode } from '@mui/material/styles'
// import type { GridPaginationModel, GridSortModel } from '@mui/x-data-grid'
// import { useCallback, useState } from 'react'
// import { DataTable } from '../components/DataTable'
// import { BacklogFilterBar } from '../components/backlog/BacklogFilterBar'
// import { BacklogSummary } from '../components/backlog/BacklogSummary'
// import { PageHeader } from '../components/common/PageHeader'
// import { PageShell } from '../components/common/PageShell'
// import { RefreshButton } from '../components/common/RefreshButton'
// import { UpdatedStatus } from '../components/common/UpdatedStatus'
// import { useBacklogData } from '../hooks/useBacklogData'
// import { useBacklogSummary } from '../hooks/useBacklogSummary'
// import { useGridPreferences } from '../hooks/useGridPreferences'
// import type { BacklogFilterItem, ReportFilters } from '../services/reportService'

// const initialFilters: ReportFilters = {
//   search: '', status: '', div: '', currentProcess: '', shipBy: '', productionDate: '',
// }

// interface BacklogPageProps { mode: PaletteMode; onToggleMode: () => void }

// export function BacklogPage({
//   mode,
//   onToggleMode,
// }: BacklogPageProps) {

//   const [
//     filters,
//     setFilters,
//   ] = useState<ReportFilters>(
//     initialFilters,
//   )

//   const preferences =
//     useGridPreferences(
//       'backlog',
//       100,
//     )

//   const [
//     page,
//     setPage,
//   ] = useState(0)

//   const [
//     sortModel,
//     setSortModel,
//   ] = useState<GridSortModel>([])

//   const [
//     excelFilters,
//     setExcelFilters,
//   ] = useState<BacklogFilterItem[]>([])


//   const {
//     data,
//     totalElements,

//     loading,
//     error,

//     lastUpdated,

//     handleRefresh,
//     refreshKey,
//   } = useBacklogData({
//     page,

//     pageSize:
//       preferences.pageSize,

//     filters,
//     excelFilters,
//     sortModel,
//   })

//   const {
//     summary,
//     loading: summaryLoading,
//     error: summaryError,
//   } = useBacklogSummary({
//     filters,
//     excelFilters,
//     refreshKey,
//   })


//   // =======================================================
//   // FILTER
//   // =======================================================

//   const handleFilterChange =
//     useCallback(
//       (
//         name:
//           keyof ReportFilters,

//         value:
//           string,
//       ) => {

//         setFilters(
//           (current) => ({
//             ...current,
//             [name]: value,
//           }),
//         )

//         setPage(0)
//       },
//       [],
//     )


//   // =======================================================
//   // SUMMARY STATUS
//   // =======================================================

//   const handleSummaryStatusClick =
//     useCallback(
//       (status: string) => {

//         setFilters(
//           (current) => {

//             const sameStatus =
//               current.status
//                 .trim()
//                 .toUpperCase()
//               ===
//               status
//                 .trim()
//                 .toUpperCase()

//             return {
//               ...current,

//               status:
//                 sameStatus
//                   ? ''
//                   : status,
//             }
//           },
//         )

//         setPage(0)
//       },
//       [],
//     )


//   // =======================================================
//   // CLEAR
//   // =======================================================

//   const handleClearFilters =
//     useCallback(
//       () => {

//         setFilters(
//           initialFilters,
//         )

//         setExcelFilters([])

//         setPage(0)
//       },
//       [],
//     )


//   // =======================================================
//   // PAGINATION
//   // =======================================================

//   const handlePaginationChange =
//     useCallback(
//       (
//         model:
//           GridPaginationModel,
//       ) => {

//         if (
//           model.pageSize
//           !== preferences.pageSize
//         ) {

//           preferences.setPageSize(
//             model.pageSize,
//           )

//           setPage(0)

//           return
//         }

//         setPage(
//           model.page,
//         )
//       },
//       [preferences],
//     )


//   // =======================================================
//   // EXCEL FILTER
//   // =======================================================

//   const handleExcelFiltersChange =
//     useCallback(
//       (
//         nextFilters:
//           BacklogFilterItem[],
//       ) => {

//         setExcelFilters(
//           nextFilters,
//         )

//         setPage(0)
//       },
//       [],
//     )


//   // =======================================================
//   // SORT
//   // =======================================================

//   const handleSortChange =
//     useCallback(
//       (
//         model:
//           GridSortModel,
//       ) => {

//         setSortModel(
//           model,
//         )

//         setPage(0)
//       },
//       [],
//     )


//   return (
//     <PageShell>

//       <PageHeader
//         title="PRODUCTION BACKLOG"

//         subtitle="Monitor production status, process flow and delivery progress."

//         status={
//           <UpdatedStatus
//             updatedAt={lastUpdated}
//             error={Boolean(error)}
//           />
//         }

//         actions={
//           <RefreshButton
//             loading={
//               loading ||
//               summaryLoading
//             }
//             onClick={handleRefresh}
//           />
//         }

//         mode={mode}
//         onToggleMode={onToggleMode}
//       />


//       {/* SUMMARY */}

//       <BacklogSummary
//         summary={
//           summary
//         }

//         selectedStatus={
//           filters.status
//         }

//         loading={
//           summaryLoading
//         }

//         error={
//           summaryError
//         }

//         onStatusClick={
//           handleSummaryStatusClick
//         }
//       />


//       {/* FILTER */}

//       <BacklogFilterBar
//         filters={
//           filters
//         }

//         excelFilterCount={
//           excelFilters.length
//         }

//         loading={
//           loading
//         }

//         onFilterChange={
//           handleFilterChange
//         }

//         onClear={
//           handleClearFilters
//         }

//         onRefresh={
//           handleRefresh
//         }
//       />


//       {error && (
//         <Alert
//           severity="error"
//           sx={{
//             mb: 1.5,
//           }}
//         >
//           {error}
//         </Alert>
//       )}


//       {/* TABLE */}

//       <Card
//         sx={{
//           flex: 1,
//           minHeight: 0,
//           overflow: 'hidden',
//         }}
//       >
//         <DataTable
//           data={
//             data
//           }

//           loading={
//             loading
//           }

//           page={
//             page
//           }

//           pageSize={
//             preferences.pageSize
//           }

//           totalElements={
//             totalElements
//           }

//           excelFilters={
//             excelFilters
//           }

//           sortModel={
//             sortModel
//           }

//           columnVisibilityModel={
//             preferences.columnVisibilityModel
//           }

//           columnOrder={
//             preferences.columnOrder
//           }

//           columnWidths={
//             preferences.columnWidths
//           }

//           onColumnVisibilityModelChange={
//             preferences
//               .setColumnVisibilityModel
//           }

//           onColumnOrderChange={
//             preferences
//               .setColumnOrder
//           }

//           onColumnWidthChange={
//             preferences
//               .setColumnWidth
//           }

//           onExcelFiltersChange={
//             handleExcelFiltersChange
//           }

//           onSortChange={
//             handleSortChange
//           }

//           onPaginationChange={
//             handlePaginationChange
//           }
//         />
//       </Card>

//     </PageShell>
//   )
// }


import {
  Alert,
  Card,
} from '@mui/material'

import type {
  PaletteMode,
} from '@mui/material/styles'

import type {
  GridPaginationModel,
  GridSortModel,
} from '@mui/x-data-grid'

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react'

import { DataTable } from '../components/DataTable'
import { BacklogFilterBar } from '../components/backlog/BacklogFilterBar'
import { BacklogSummary } from '../components/backlog/BacklogSummary'
import { PageHeader } from '../components/common/PageHeader'
import { PageShell } from '../components/common/PageShell'
import { RefreshButton } from '../components/common/RefreshButton'
import { UpdatedStatus } from '../components/common/UpdatedStatus'
import { useBacklogData } from '../hooks/useBacklogData'
import { useBacklogSummary } from '../hooks/useBacklogSummary'
import { useGridPreferences } from '../hooks/useGridPreferences'

import {
  getBacklogFilterOptions,
  type BacklogFilterItem,
  type ReportFilters,
} from '../services/reportService'


const initialFilters: ReportFilters = {
  search: '',
  status: '',
  div: '',
  currentProcess: '',
  shipBy: '',
  productionDate: '',
}


interface BacklogPageProps {
  mode: PaletteMode
  onToggleMode: () => void
}


interface BacklogSelectOptions {
  status: string[]
  div: string[]
  currentProcess: string[]
  shipBy: string[]
}


interface SummaryCellFilter {
  status: string
  date: string
}


const EMPTY_SELECT_OPTIONS: BacklogSelectOptions = {
  status: [],
  div: [],
  currentProcess: [],
  shipBy: [],
}


// =========================================================
// SIMPLE FILTER -> BACKEND FILTER
// =========================================================

function buildSimpleFilters(
  filters: ReportFilters,
): BacklogFilterItem[] {

  const result:
    BacklogFilterItem[] = []


  if (filters.status.trim()) {
    result.push({
      field: 'Status',
      operator: 'equals',
      value: filters.status.trim(),
    })
  }


  if (filters.div.trim()) {
    result.push({
      field: 'Div',
      operator: 'equals',
      value: filters.div.trim(),
    })
  }


  if (
    filters.currentProcess.trim()
  ) {
    result.push({
      field: 'CurrentProcess',
      operator: 'equals',
      value:
        filters.currentProcess.trim(),
    })
  }


  if (filters.shipBy.trim()) {
    result.push({
      field: 'ShipBy',
      operator: 'equals',
      value: filters.shipBy.trim(),
    })
  }


  if (
    filters.productionDate.trim()
  ) {
    result.push({
      field: 'ProductionD',
      operator: 'equals',
      value:
        filters.productionDate.trim(),
    })
  }


  return result
}


// =========================================================
// REMOVE OWN FIELD
//
// Ví dụ đang lấy option của Status:
// bỏ filter Status hiện tại ra,
// nhưng vẫn giữ Div / Process / ShipBy...
// =========================================================

function removeOwnField(
  filters: BacklogFilterItem[],
  field: string,
): BacklogFilterItem[] {

  return filters.filter(
    (item) =>
      item.field
        .trim()
        .toLowerCase()
      !==
      field
        .trim()
        .toLowerCase(),
  )
}


export function BacklogPage({
  mode,
  onToggleMode,
}: BacklogPageProps) {

  const [
    filters,
    setFilters,
  ] =
    useState<ReportFilters>(
      initialFilters,
    )


  const [
    summaryCellFilter,
    setSummaryCellFilter,
  ] =
    useState<SummaryCellFilter | null>(
      null,
    )


  const effectiveFilters =
    useMemo<ReportFilters>(
      () =>
        summaryCellFilter
          ? {
            ...filters,
            status: '',
          }
          : filters,
      [
        filters,
        summaryCellFilter,
      ],
    )


  const preferences =
    useGridPreferences(
      'backlog',
      100,
    )


  const [
    page,
    setPage,
  ] =
    useState(0)


  const [
    sortModel,
    setSortModel,
  ] =
    useState<GridSortModel>(
      [],
    )


  const [
    excelFilters,
    setExcelFilters,
  ] =
    useState<BacklogFilterItem[]>(
      [],
    )


  const effectiveExcelFilters =
    useMemo<BacklogFilterItem[]>(
      () => {
        if (!summaryCellFilter) {
          return excelFilters
        }

        return [
          ...excelFilters.filter(
            (item) => {
              const field =
                item.field
                  .trim()
                  .toLowerCase()

              return field !== 'status'
                && field !== 'exportd'
            },
          ),
          {
            field: 'Status',
            operator: 'equals',
            value:
              summaryCellFilter.status,
          },
          {
            field: 'ExportD',
            operator: 'equals',
            value:
              summaryCellFilter.date,
          },
        ]
      },
      [
        excelFilters,
        summaryCellFilter,
      ],
    )


  // =======================================================
  // DROPDOWN OPTIONS
  // =======================================================

  const [
    selectOptions,
    setSelectOptions,
  ] =
    useState<BacklogSelectOptions>(
      EMPTY_SELECT_OPTIONS,
    )


  const [
    selectOptionsLoading,
    setSelectOptionsLoading,
  ] =
    useState(false)


  const {
    data,
    totalElements,

    loading,
    error,

    lastUpdated,

    handleRefresh,
    refreshKey,
  } =
    useBacklogData({
      page,

      pageSize:
        preferences.pageSize,

      filters:
        effectiveFilters,
      excelFilters:
        effectiveExcelFilters,
      sortModel,
    })


  const {
    summary,

    loading:
    summaryLoading,

    error:
    summaryError,
  } =
    useBacklogSummary({
      filters,
      excelFilters,
      refreshKey,
    })


  // =======================================================
  // LOAD DROPDOWN OPTIONS
  // =======================================================

  useEffect(
    () => {

      const controller =
        new AbortController()


      const load =
        async () => {

          try {

            setSelectOptionsLoading(
              true,
            )


            const simpleFilters =
              buildSimpleFilters(
                filters,
              )


            const allFilters = [
              ...simpleFilters,
              ...excelFilters,
            ]


            const [
              status,
              div,
              currentProcess,
              shipBy,
            ] =
              await Promise.all([

                getBacklogFilterOptions(
                  {
                    field:
                      'Status',

                    filters:
                      removeOwnField(
                        allFilters,
                        'Status',
                      ),

                    logicOperator:
                      'and',

                    search:
                      filters.search.trim(),

                    limit:
                      500,
                  },

                  controller.signal,
                ),


                getBacklogFilterOptions(
                  {
                    field:
                      'Div',

                    filters:
                      removeOwnField(
                        allFilters,
                        'Div',
                      ),

                    logicOperator:
                      'and',

                    search:
                      filters.search.trim(),

                    limit:
                      500,
                  },

                  controller.signal,
                ),


                getBacklogFilterOptions(
                  {
                    field:
                      'CurrentProcess',

                    filters:
                      removeOwnField(
                        allFilters,
                        'CurrentProcess',
                      ),

                    logicOperator:
                      'and',

                    search:
                      filters.search.trim(),

                    limit:
                      500,
                  },

                  controller.signal,
                ),


                getBacklogFilterOptions(
                  {
                    field:
                      'ShipBy',

                    filters:
                      removeOwnField(
                        allFilters,
                        'ShipBy',
                      ),

                    logicOperator:
                      'and',

                    search:
                      filters.search.trim(),

                    limit:
                      500,
                  },

                  controller.signal,
                ),
              ])

            console.log(
              'BACKLOG FILTER OPTIONS:',
              {
                status,
                div,
                currentProcess,
                shipBy,
              },
            )

            setSelectOptions({
              status,
              div,
              currentProcess,
              shipBy,
            })

          } catch (error) {

            if (
              error instanceof DOMException
              && error.name === 'AbortError'
            ) {
              return
            }


            console.error(
              'Load backlog filter options failed:',
              error,
            )

          } finally {

            if (
              !controller.signal.aborted
            ) {
              setSelectOptionsLoading(
                false,
              )
            }
          }
        }

      console.log(
        'LOAD FILTER OPTIONS',
        {
          filters,
          excelFilters,
        },
      )

      void load()


      return () => {
        controller.abort()
      }

    },
    [
      filters.search,
      filters.status,
      filters.div,
      filters.currentProcess,
      filters.shipBy,
      filters.productionDate,
      excelFilters,
      refreshKey,
    ]
  )


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
            [name]:
              value,
          }),
        )

        setPage(
          0,
        )
      },
      [],
    )


  // =======================================================
  // SUMMARY STATUS
  // =======================================================

  const handleSummaryStatusClick =
    useCallback(
      (
        status:
          string,
      ) => {

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


        setPage(
          0,
        )
      },
      [],
    )


  const handleSummaryCellClick =
    useCallback(
      (
        cell:
          SummaryCellFilter | null,
      ) => {
        setSummaryCellFilter(
          cell,
        )

        setPage(
          0,
        )
      },
      [],
    )


  // =======================================================
  // CLEAR
  // =======================================================

  const handleClearFilters =
    useCallback(
      () => {

        setFilters({
          ...initialFilters,
        })

        setExcelFilters(
          [],
        )

        setSummaryCellFilter(
          null,
        )

        setPage(
          0,
        )
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

          setPage(
            0,
          )

          return
        }


        setPage(
          model.page,
        )
      },
      [
        preferences,
      ],
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

        setPage(
          0,
        )
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

        setPage(
          0,
        )
      },
      [],
    )


  return (
    <PageShell>

      <PageHeader
        title="PRODUCTION BACKLOG"

        subtitle="Monitor production status, process flow and delivery progress."

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

        actions={
          <RefreshButton
            loading={
              loading
              || summaryLoading
            }

            onClick={
              handleRefresh
            }
          />
        }

        mode={
          mode
        }

        onToggleMode={
          onToggleMode
        }
      />


      <BacklogSummary
        summary={
          summary
        }

        selectedStatus={
          filters.status
        }

        loading={
          summaryLoading
        }

        error={
          summaryError
        }

        onStatusClick={
          handleSummaryStatusClick
        }

        selectedCell={
          summaryCellFilter
        }

        onCellClick={
          handleSummaryCellClick
        }

      />


      <BacklogFilterBar
        filters={
          filters
        }

        options={
          selectOptions
        }

        excelFilterCount={
          excelFilters.length
        }

        summaryFilter={
          summaryCellFilter
        }

        loading={
          selectOptionsLoading
        }

        onFilterChange={
          handleFilterChange
        }

        onClear={
          handleClearFilters
        }
      />


      {error && (
        <Alert
          severity="error"

          sx={{
            mb:
              1.5,
          }}
        >
          {error}
        </Alert>
      )}


      <Card
        sx={{
          border: 'none',

          flex:
            1,

          minHeight:
            0,

          overflow:
            'hidden',
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
            effectiveExcelFilters
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
