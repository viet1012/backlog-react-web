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
  useMemo,
  useState,
} from 'react'

import { DataTable } from '../../components/DataTable'
import { BacklogFilterBar } from '../../components/backlog/BacklogFilterBar'
import { BacklogSummary } from '../../components/backlog/BacklogSummary'
import { describeBacklogFilters } from '../../components/backlog/backlogFilterLabels'
import { PageHeader } from '../../components/common/PageHeader'
import { PageShell } from '../../components/common/PageShell'
import { HeaderAction, HeaderActionBar, HeaderActionDivider } from '../../components/common/headerActions'
import { notifyExport } from '../../components/common/notify'
import { UpdatedStatus } from '../../components/common/UpdatedStatus'
import { useBacklogData } from '../../hooks/useBacklogData'
import { useBacklogSummary } from '../../hooks/useBacklogSummary'
import { useCachedQuery } from '../../hooks/useCachedQuery'
import { useGridPreferences } from '../../hooks/useGridPreferences'
import { usePageReadyMetric } from '../../hooks/usePageReadyMetric'
import { readUrlParams, urlParam, useUrlFilters, type UrlParams } from '../../hooks/useUrlFilters'

import {
  exportBacklogExcel,
  getBacklogFilterOptions,
  type BacklogFilterItem,
  type ReportFilters,
} from '../../services/reportService'
import {
  createBacklogColumns,
} from '../../components/backlog/backlogColumns'
import { useI18n } from '../../i18n/useI18n'

const initialFilters: ReportFilters = {
  search: '',
  status: '',
  div: '',
  currentProcess: '',
  shipBy: '',
  productionDate: '',
}

const BACKLOG_PATH = '/backlog'

// ?q=…&status=…&div=…&process=…&shipBy=…&prodD=YYYY-MM-DD (bỏ trống = không lọc).
// Lọc theo cột (Excel) và ô Summary không đưa lên URL.
const BACKLOG_URL_PARAMS: UrlParams<ReportFilters> = {
  search: urlParam.text('q'),
  status: urlParam.text('status'),
  div: urlParam.text('div'),
  currentProcess: urlParam.text('process'),
  shipBy: urlParam.text('shipBy'),
  productionDate: urlParam.date('prodD', ''),
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


type BacklogOptionField =
  Parameters<typeof getBacklogFilterOptions>[0]['field']


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

  const { t } =
    useI18n()

  const [
    filters,
    setFilters,
  ] =
    useState<ReportFilters>(
      // link chia sẻ / F5: lấy bộ lọc trên URL
      () => ({
        ...initialFilters,
        ...readUrlParams(
          BACKLOG_PATH,
          BACKLOG_URL_PARAMS,
        ),
      }),
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

  const optionContextFilters =
    useMemo(
      () =>
        buildSimpleFilters(
          effectiveFilters,
        ),
      [
        effectiveFilters,
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

  const [
    exporting,
    setExporting,
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
  // Cache theo bộ lọc: quay lại trang / bộ lọc vừa xem không phải chờ
  // =======================================================

  const simpleFilters =
    buildSimpleFilters(
      filters,
    )

  // Dropdown options (4 requests, limit 500) wait until the main list has
  // loaded once: started together they took 4 of the browser's 6 connections
  // and queued the list – the thing the user is actually waiting for.
  const [listLoadedOnce, setListLoadedOnce] =
    useState(false)

  if (!listLoadedOnce && (data.length > 0 || (!loading && lastUpdated != null))) {
    setListLoadedOnce(true)
  }

  // đo hiệu năng (chỉ khi bật): mở trang → bảng chi tiết hiện ra
  usePageReadyMetric('backlog', listLoadedOnce)

  const selectOptionsQuery =
    useCachedQuery<BacklogSelectOptions>(
      listLoadedOnce
        ? `backlog:options:${JSON.stringify([
          filters.search.trim(),
          simpleFilters,
          excelFilters,
        ])}`
        : null,
      async (signal) => {

        const allFilters = [
          ...simpleFilters,
          ...excelFilters,
        ]

        const loadField =
          (field: BacklogOptionField) =>
            getBacklogFilterOptions(
              {
                field,

                filters:
                  removeOwnField(
                    allFilters,
                    field,
                  ),

                logicOperator:
                  'and',

                search:
                  filters.search.trim(),

                limit:
                  500,
              },

              signal,
            )

        const [
          status,
          div,
          currentProcess,
          shipBy,
        ] =
          await Promise.all([
            loadField('Status'),
            loadField('Div'),
            loadField('CurrentProcess'),
            loadField('ShipBy'),
          ])

        return {
          status,
          div,
          currentProcess,
          shipBy,
        }
      },
      { refreshKey },
    )

  const selectOptions =
    selectOptionsQuery.data
    ?? EMPTY_SELECT_OPTIONS

  const selectOptionsLoading =
    selectOptionsQuery.loading


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


  // Có bộ lọc nào đang bật (ô lọc, lọc cột, ô Summary)
  const hasAnyFilter =
    Object.values(filters).some((value) => value.trim() !== '')
    || excelFilters.length > 0
    || summaryCellFilter != null

  const filterSummary =
    [
      describeBacklogFilters(filters, t),
      summaryCellFilter
        ? `${t.columns.status}: ${summaryCellFilter.status} · ${t.columns.exportDate}: ${summaryCellFilter.date}`
        : '',
      excelFilters.length > 0
        ? t.backlog.columnFilters(excelFilters.length)
        : '',
    ]
      .filter(Boolean)
      .join(' · ')


  // =======================================================
  // URL ⇄ BỘ LỌC: link từ ngoài => áp bộ lọc của link
  // =======================================================

  useUrlFilters({
    path: BACKLOG_PATH,
    params: BACKLOG_URL_PARAMS,
    values: filters,
    onUrlChange: (next) => {
      setFilters(next)
      setExcelFilters([])
      setSummaryCellFilter(null)
      setPage(0)
    },
  })


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

  const exportColumns =
    useMemo(
      () => {

        const allFields =
          createBacklogColumns(t).map(
            (column) =>
              column.field,
          )


        const knownFields =
          new Set(
            allFields,
          )


        const orderedFields =
          preferences.columnOrder
            .filter(
              (field) =>
                knownFields.has(
                  field,
                ),
            )


        const orderedSet =
          new Set(
            orderedFields,
          )


        const missingFields =
          allFields.filter(
            (field) =>
              !orderedSet.has(
                field,
              ),
          )


        return [
          ...orderedFields,
          ...missingFields,
        ].filter(
          (field) =>
            preferences
              .columnVisibilityModel[
            field
            ] !== false,
        )
      },
      [
        preferences.columnOrder,
        preferences.columnVisibilityModel,
        t,
      ],
    )

  const exportSort =
    useMemo(
      () => {

        const sort =
          sortModel[0]


        if (
          !sort?.field
          || !sort.sort
        ) {
          return null
        }


        return `${sort.field},${sort.sort}`
      },
      [
        sortModel,
      ],
    )

  // =======================================================
  // EXPORT EXCEL
  // =======================================================

  const handleExportExcel =
    useCallback(
      async () => {

        if (
          exportColumns.length === 0
        ) {
          console.error(
            'No visible columns to export',
          )

          return
        }


        try {

          setExporting(
            true,
          )


          const simpleFilters =
            buildSimpleFilters(
              effectiveFilters,
            )


          const allFilters = [
            ...simpleFilters,
            ...effectiveExcelFilters,
          ]


          // Progress / done / failed toast (notifyExport never throws)
          await notifyExport((onProgress) => exportBacklogExcel(
            {
              filter: {
                filters:
                  allFilters,

                logicOperator:
                  'and',
              },

              search:
                effectiveFilters
                  .search
                  .trim(),

              sort:
                exportSort,

              columns:
                exportColumns,
            },
            onProgress,
          ))

        } finally {

          setExporting(
            false,
          )
        }
      },
      [
        effectiveFilters,
        effectiveExcelFilters,
        exportColumns,
        exportSort,
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
        title={t.backlog.title}

        subtitle={t.backlog.subtitle}

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
          <HeaderActionBar>
            <HeaderAction
              kind="exportExcel"
              loading={exporting}
              disabled={exportColumns.length === 0}
              onClick={handleExportExcel}
            />

            <HeaderActionDivider />

            <HeaderAction
              kind="refresh"
              loading={loading || summaryLoading}
              onClick={handleRefresh}
            />
          </HeaderActionBar>
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


      {/* Bảng trống thì lỗi hiện ngay trong bảng (cảnh lỗi API), chỉ còn dòng cũ mới cần thanh báo */}
      {error && data.length > 0 && (
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

          optionContextFilters={
            optionContextFilters
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

          error={
            error
          }

          onRetry={
            handleRefresh
          }

          // Trống vì bộ lọc (vd link cũ mà PO không còn) => nói rõ + Xóa bộ lọc
          onClearFilters={
            hasAnyFilter
              ? handleClearFilters
              : undefined
          }

          filterSummary={
            filterSummary
          }

          density={
            preferences.density
          }

          onDensityChange={
            preferences.setDensity
          }

          pinnedColumns={
            preferences.pinnedColumns
          }

          onTogglePinnedColumn={
            preferences.togglePinnedColumn
          }
        />
      </Card>

    </PageShell>
  )
}
