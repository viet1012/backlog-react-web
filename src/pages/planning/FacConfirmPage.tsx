import {
  Suspense,
  lazy,
  useCallback,
  useMemo,
  useRef,
  useState,
} from 'react'

import {
  Alert,
  Box,
  Button,
} from '@mui/material'

import type {
  GridPaginationModel,
  GridSortModel,
} from '@mui/x-data-grid'

import {
  FacConfirmDataTable,
  type FacConfirmDataTableHandle,
} from '../../components/facConfirm/FacConfirmDataTable'

import {
  FacConfirmUnsavedChangesDialog,
} from '../../components/facConfirm/FacConfirmUnsavedChangesDialog'

import {
  getFacConfirmColumns,
} from '../../components/facConfirm/facConfirmColumns'

import {
  FacConfirmFilterBar,
} from '../../components/facConfirm/FacConfirmFilterBar'

import {
  ALL_CLASSIFY,
  FAC_CONFIRM_PATH,
  FAC_CONFIRM_URL_PARAMS,
  normalizeHeatType,
} from '../../components/facConfirm/facConfirmFilters'

import {
  readUrlParams,
  useUrlFilters,
} from '../../hooks/useUrlFilters'

import {
  FacConfirmDailyStats,
} from '../../components/facConfirm/FacConfirmDailyStats'

import {
  useGuideTour,
} from '../../components/facConfirm/guide/useGuideTour'

import {
  FAC_CONFIRM_GUIDE_KEY,
} from '../../components/facConfirm/guide/facConfirmGuideKey'

// Tour (engine + steps + demos ~1.1k lines) loads on first open only
const FacConfirmGuideTour = lazy(
  () => import('../../components/facConfirm/guide/FacConfirmGuideTour'),
)

import {
  HeaderAction,
  HeaderActionBar,
  HeaderActionDivider,
} from '../../components/common/headerActions'
import { notifyExport } from '../../components/common/notify'
import { usePerm } from '../../components/auth/useAuth'
import { ACTION, PERM } from '../../routes/appPages'

import {
  PageHeader,
} from '../../components/common/PageHeader'

import {
  PageShell,
} from '../../components/common/PageShell'

import {
  UpdatedStatus,
} from '../../components/common/UpdatedStatus'

import {
  useFacConfirmData,
} from '../../hooks/useFacConfirmData'
import { usePageReadyMetric } from '../../hooks/usePageReadyMetric'
import { useUnsavedChangesGuard } from '../../components/common/shortcuts'

import {
  useGridPreferences,
} from '../../hooks/useGridPreferences'

import {
  exportFacConfirmExcel,
} from '../../services/facConfirmService'

import type {
  FacConfirmClassify,
  FacConfirmFilterItem,
  FacConfirmHeatType,
  FacConfirmProcessGroup,
} from '../../types/facConfirm'

import {
  loadFacConfirmPreferences,
  saveFacConfirmPreferences,
} from '../../utils/uiPreferences'
import { useI18n } from '../../i18n/useI18n'


interface FacConfirmPageProps {
  mode: 'light' | 'dark'
  onToggleMode: () => void
}


function getToday(): string {
  const now = new Date()

  return `${now.getFullYear()}-${String(
    now.getMonth() + 1,
  ).padStart(2, '0')}-${String(
    now.getDate(),
  ).padStart(2, '0')}`
}


export function FacConfirmPage({
  mode,
  onToggleMode,
}: FacConfirmPageProps) {

  const { t } = useI18n()

  // Xuất Excel cần FAC_CONFIRM X
  const canExport = usePerm(PERM.FAC_CONFIRM, ACTION.EXPORT)

  const [pagePreferences] =
    useState(loadFacConfirmPreferences)

  // Link chia sẻ / F5: bộ lọc trên URL thắng giá trị nhớ trong máy
  const [urlFilters] =
    useState(() => readUrlParams(
      FAC_CONFIRM_PATH,
      FAC_CONFIRM_URL_PARAMS,
    ))


  const [div, setDiv] =
    useState(
      urlFilters.div
      ?? pagePreferences.div
    )


  const [expD, setExpD] =
    useState(
      () => urlFilters.expD
        ?? getToday(),
    )


  const [procGrp, setProcGrp] =
    useState<FacConfirmProcessGroup>(
      urlFilters.procGrp
      ?? pagePreferences.procGrp,
    )


  // =========================================================
  // SALE / STOCK
  //
  // Mặc định chọn cả 2
  // => FE không gửi classify
  // => backend lấy toàn bộ
  // =========================================================

  const [
    classify,
    setClassify,
  ] = useState<FacConfirmClassify[]>(
    () => urlFilters.classify
      ?? ALL_CLASSIFY,
  )


  const [
    sortModel,
    setSortModel,
  ] =
    useState<GridSortModel>([])


  const [
    excelFilters,
    setExcelFilters,
  ] =
    useState<FacConfirmFilterItem[]>([])


  // Giá trị gửi API (ô tìm đã debounce trong FilterSearch)
  const [
    search,
    setSearch,
  ] =
    useState(
      urlFilters.search
      ?? '',
    )


  const tableRef =
    useRef<FacConfirmDataTableHandle>(null)

  // phím tắt R không làm mới khi còn ô sửa chưa lưu (bấm nút thì vẫn như cũ)
  useUnsavedChangesGuard(() => (tableRef.current?.hasChanges ? tableRef.current.changeCount : 0))


  // Công đoạn người dùng muốn chuyển sang khi còn thay đổi chưa lưu
  const [
    pendingProcGrp,
    setPendingProcGrp,
  ] =
    useState<FacConfirmProcessGroup | null>(null)

  // Số ô chưa lưu lúc mở dialog (không đọc ref khi render)
  const [
    pendingChangeCount,
    setPendingChangeCount,
  ] =
    useState(0)

  const [
    switchSaving,
    setSwitchSaving,
  ] =
    useState(false)


  const [
    exporting,
    setExporting,
  ] =
    useState(false)


  const guide =
    useGuideTour(
      FAC_CONFIRM_GUIDE_KEY,
    )

  const [
    guideMounted,
    setGuideMounted,
  ] =
    useState(guide.open)

  if (guide.open && !guideMounted) {
    setGuideMounted(true)
  }


  const preferences =
    useGridPreferences(
      'fac-confirm',
      100,
    )

  const {
    pageSize: preferredPageSize,
    setPageSize: setPreferredPageSize,
  } = preferences


  const [
    paginationModel,
    setPaginationModel,
  ] =
    useState<GridPaginationModel>(() => ({
      page: 0,
      pageSize:
        preferences.pageSize,
    }))


  // =========================================================
  // CLASSIFY FOR API
  //
  // Sale only  => Sale
  // Stock only => Stock
  // Both       => undefined
  // =========================================================

  const apiClassify:
    FacConfirmClassify | undefined =
    classify.length === 1
      ? classify[0]
      : undefined

  const [
    heatType,
    setHeatType,
  ] = useState<FacConfirmHeatType>(
    () => normalizeHeatType(
      urlFilters.div ?? pagePreferences.div,
      urlFilters.heatType ?? 'All',
    ),
  )
  // =========================================================
  // DATA
  // =========================================================

  const {
    rows,
    confirmedProcesses,
    processGroups,
    totalElements,
    loading,
    initialLoading,
    stale,
    loadedProcGrp,
    summaryLoading,
    error,
    lastUpdated,
    handleRefresh,
  } = useFacConfirmData({
    div,

    expD,

    procGrp,

    classify:
      apiClassify,

    heatType,

    page:
      paginationModel.page,

    pageSize:
      paginationModel.pageSize,

    excelFilters,

    search,
  })

  // đo hiệu năng (chỉ khi bật): mở trang → bảng hiện ra
  usePageReadyMetric('fac-confirm', !loading && lastUpdated != null)


  // Làm mới / lưu xong => panel thống kê theo ngày cũng tải lại (nếu đang mở)
  const [
    dailyStatsRefreshToken,
    setDailyStatsRefreshToken,
  ] =
    useState(0)

  const handleRefreshAll =
    useCallback(() => {
      handleRefresh()

      setDailyStatsRefreshToken(
        (current) => current + 1,
      )
    }, [
      handleRefresh,
    ])


  // Bảng tô màu / quyền sửa theo công đoạn của dữ liệu đang hiển thị.
  // Thẻ công đoạn đổi ngay, bảng đổi khi dữ liệu mới về => không lệch, không chớp.
  const highlightProcGrp =
    loadedProcGrp
    ?? procGrp


  // =========================================================
  // RESET PAGE
  // =========================================================

  const resetPage =
    useCallback(() => {

      setPaginationModel(
        (current) => ({
          ...current,
          page: 0,
        }),
      )

    }, [])


  // =========================================================
  // DIV
  // =========================================================

  const handleDivChange =
    useCallback(
      (
        nextDiv: string,
      ) => {

        // MOLD chỉ có All; GUIDE: All / Normal / Molypden;
        // PRESS giữ Heat Type hiện tại nếu còn hợp lệ
        setHeatType(
          normalizeHeatType(
            nextDiv,
            heatType,
          )
        )

        setDiv(
          nextDiv
        )

        setExcelFilters([])

        saveFacConfirmPreferences({
          div: nextDiv,
          procGrp,
        })

        resetPage()
      },
      [
        heatType,
        procGrp,
        resetPage,
      ],
    )


  // =========================================================
  // DATE
  // =========================================================

  const handleDateChange =
    useCallback(
      (
        value: string,
      ) => {

        setExpD(
          value
        )

        resetPage()

      },
      [
        resetPage,
      ],
    )


  // =========================================================
  // PROCESS GROUP
  // =========================================================

  const applyProcessGroupChange =
    useCallback(
      (
        value:
          FacConfirmProcessGroup,
      ) => {

        setProcGrp(
          value
        )


        saveFacConfirmPreferences({
          div,

          procGrp:
            value,
        })


        resetPage()

      },
      [
        div,
        resetPage,
      ],
    )


  const handleProcessGroupChange =
    useCallback(
      (
        value:
          FacConfirmProcessGroup,
      ) => {

        if (value === procGrp) {
          return
        }

        // Còn thay đổi chưa lưu => hỏi trước khi đổi
        const table =
          tableRef.current

        if (table?.hasChanges) {
          setPendingChangeCount(
            table.changeCount
          )

          setPendingProcGrp(
            value
          )

          return
        }

        applyProcessGroupChange(
          value
        )
      },
      [
        applyProcessGroupChange,
        procGrp,
      ],
    )


  const handleUnsavedSave =
    useCallback(
      async () => {
        const nextProcGrp =
          pendingProcGrp

        if (!nextProcGrp) {
          return
        }

        setSwitchSaving(true)

        const saved =
          await tableRef.current?.save()
          ?? false

        setSwitchSaving(false)
        setPendingProcGrp(null)

        // Lưu lỗi: ở lại công đoạn hiện tại, lỗi hiện ở snackbar của bảng
        if (saved) {
          applyProcessGroupChange(
            nextProcGrp
          )
        }
      },
      [
        applyProcessGroupChange,
        pendingProcGrp,
      ],
    )


  const handleUnsavedDiscard =
    useCallback(
      () => {
        const nextProcGrp =
          pendingProcGrp

        tableRef.current?.discard()
        setPendingProcGrp(null)

        if (nextProcGrp) {
          applyProcessGroupChange(
            nextProcGrp
          )
        }
      },
      [
        applyProcessGroupChange,
        pendingProcGrp,
      ],
    )


  const handleUnsavedStay =
    useCallback(
      () => {
        setPendingProcGrp(null)
      },
      [],
    )


  // =========================================================
  // CLASSIFY
  // =========================================================

  const handleClassifyChange =
    useCallback(
      (
        value:
          FacConfirmClassify[],
      ) => {

        setClassify(
          value
        )

        setExcelFilters([])

        resetPage()

      },
      [
        resetPage,
      ],
    )

  const handleHeatTypeChange =
    useCallback(
      (
        value: FacConfirmHeatType,
      ) => {
        setHeatType(value)

        // Filter cũ có thể không còn đúng
        // với tập dữ liệu Heat mới.
        setExcelFilters([])

        resetPage()
      },
      [
        resetPage,
      ],
    )
  // =========================================================
  // PAGINATION
  // =========================================================

  const handlePaginationChange =
    useCallback(
      (
        model:
          GridPaginationModel,
      ) => {

        setPaginationModel(
          model
        )


        if (
          model.pageSize !==
          preferredPageSize
        ) {

          setPreferredPageSize(
            model.pageSize,
          )
        }

      },
      // Not `preferences`: the hook returns a new object every render, which
      // made this handler (and the memoized table) change on every render
      [
        preferredPageSize,
        setPreferredPageSize,
      ],
    )


  // =========================================================
  // EXCEL FILTER
  // =========================================================

  const handleExcelFiltersChange =
    useCallback(
      (
        filters:
          FacConfirmFilterItem[],
      ) => {

        setExcelFilters(
          filters
        )

        resetPage()

      },
      [
        resetPage,
      ],
    )


  // =========================================================
  // SEARCH (đã debounce ở ô tìm)
  // =========================================================

  const handleSearchChange =
    useCallback(
      (
        value: string,
      ) => {

        setSearch(
          value
        )

        resetPage()
      },
      [
        resetPage,
      ],
    )


  // =========================================================
  // ĐANG LỌC / XÓA BỘ LỌC
  //
  // Chỉ đếm bộ lọc thu hẹp dữ liệu; Division / ngày / công đoạn
  // là phạm vi xem nên giữ nguyên khi xóa.
  // =========================================================

  const activeFilterCount =
    (search.trim() ? 1 : 0)
    + (classify.length !== ALL_CLASSIFY.length ? 1 : 0)
    + (heatType !== 'All' ? 1 : 0)
    + excelFilters.length

  const handleClearFilters =
    useCallback(
      () => {
        setSearch('')
        setClassify(ALL_CLASSIFY)
        setHeatType('All')
        setExcelFilters([])
        resetPage()
      },
      [
        resetPage,
      ],
    )

  // Mô tả bộ lọc cho cảnh "không tìm thấy" (vd mở link cũ, dữ liệu không còn)
  const filterSummary =
    [
      search.trim() ? `${t.common.search}: ${search.trim()}` : '',
      classify.length === 1 ? classify[0] : '',
      heatType !== 'All' ? `${t.facConfirm.heatType}: ${heatType}` : '',
      excelFilters.length > 0 ? t.backlog.columnFilters(excelFilters.length) : '',
    ]
      .filter(Boolean)
      .join(' · ')

  // Export Date khác hôm nay (vd link cũ) => bảng trống có nút "Về hôm nay"
  const handleGoToday =
    useCallback(
      () => handleDateChange(getToday()),
      [
        handleDateChange,
      ],
    )


  // =========================================================
  // URL ⇄ BỘ LỌC
  //
  // ?div=PR&expD=2026-11-19&procGrp=Rough[&classify=Sale][&heat=DC53][&q=…]
  // Link từ ngoài (chia sẻ, Trang chủ) => áp bộ lọc của link.
  // =========================================================

  useUrlFilters({
    path: FAC_CONFIRM_PATH,
    params: FAC_CONFIRM_URL_PARAMS,
    values: {
      div,
      expD,
      procGrp,
      classify,
      heatType,
      search,
    },
    onUrlChange: (next) => {
      setDiv(next.div)
      setExpD(next.expD)
      setProcGrp(next.procGrp)
      setClassify(next.classify)
      setHeatType(
        normalizeHeatType(
          next.div,
          next.heatType,
        ),
      )
      setSearch(next.search)
      setExcelFilters([])
      resetPage()

      saveFacConfirmPreferences({
        div: next.div,
        procGrp: next.procGrp,
      })
    },
  })


  // =========================================================
  // SORT
  // =========================================================

  const handleSortChange =
    useCallback(
      (
        model:
          GridSortModel,
      ) => {

        setSortModel(
          model
        )

      },
      [],
    )


  const exportColumns =
    useMemo(
      () => {
        const allFields =
          getFacConfirmColumns(
            procGrp,
            t,
          ).map(
            (column) =>
              column.field,
          )

        const knownFields =
          new Set(allFields)

        const orderedFields =
          preferences.columnOrder.filter(
            (field) =>
              knownFields.has(field),
          )

        const orderedSet =
          new Set(orderedFields)

        const missingFields =
          allFields.filter(
            (field) =>
              !orderedSet.has(field),
          )

        return [
          ...orderedFields,
          ...missingFields,
        ].filter(
          (field) =>
            preferences.columnVisibilityModel[
              field
            ] !== false,
        )
      },
      [
        procGrp,
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

        if (!sort?.field || !sort.sort) {
          return null
        }

        return `${sort.field},${sort.sort}`
      },
      [
        sortModel,
      ],
    )


  const handleExportExcel =
    useCallback(
      async () => {
        if (exportColumns.length === 0) {
          console.error(
            'No visible columns to export',
          )

          return
        }

        try {
          setExporting(true)

          // Progress / done / failed toast (notifyExport never throws)
          await notifyExport((onProgress) => exportFacConfirmExcel(
            {
              div,
              expD,
              procGrp,
              classify: apiClassify,
              heatType,
              search: search.trim(),
              filters: excelFilters,
              logicOperator: 'and',
              sort: exportSort,
              columns: exportColumns,
            },
            onProgress,
          ))
        } finally {
          setExporting(false)
        }
      },
      [
        apiClassify,
        div,
        excelFilters,
        expD,
        exportColumns,
        exportSort,
        heatType,
        procGrp,
        search,
      ],
    )


  return (
    <PageShell>

      <PageHeader
        title={t.facConfirm.title}

        subtitle={t.facConfirm.subtitle}

        status={
          <UpdatedStatus
            updatedAt={
              lastUpdated
            }

            error={
              Boolean(
                error
              )
            }
          />
        }

        actions={
          <HeaderActionBar>
            {canExport && (
              <>
                <HeaderAction
                  kind="exportExcel"
                  tour="fac-export"
                  loading={exporting}
                  disabled={exportColumns.length === 0}
                  onClick={handleExportExcel}
                />

                <HeaderActionDivider />
              </>
            )}

            <HeaderAction
              kind="refresh"
              tour="fac-refresh"
              loading={loading}
              onClick={handleRefreshAll}
            />

            <HeaderAction
              kind="guide"
              onClick={guide.start}
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


      <Box
        data-tour="fac-filter-bar"
      >
        <FacConfirmFilterBar
          div={div}
          expD={expD}
          procGrp={procGrp}
          classify={classify}
          heatType={heatType}
          search={search}
          processGroups={processGroups}
          loading={loading}
          summaryLoading={summaryLoading}
          activeCount={activeFilterCount}
          onClear={handleClearFilters}

          onDivChange={handleDivChange}
          onDateChange={handleDateChange}
          onProcessGroupChange={
            handleProcessGroupChange
          }
          onClassifyChange={
            handleClassifyChange
          }
          onHeatTypeChange={
            handleHeatTypeChange
          }
          onSearchChange={
            handleSearchChange
          }
        />
      </Box>


      <FacConfirmDailyStats
        div={div}
        expD={expD}
        classify={apiClassify}
        heatType={heatType}
        procGrp={procGrp}
        refreshToken={
          dailyStatsRefreshToken
        }
        onSelectExportDate={
          handleDateChange
        }
      />


      {/* Lỗi tải: dữ liệu cũ vẫn giữ trên bảng. Bảng trống thì lỗi hiện ngay trong bảng (cảnh lỗi API) */}
      {error && rows.length > 0 && (
        <Alert
          severity="error"
          action={
            <Button
              color="inherit"
              size="small"
              disabled={loading}
              onClick={handleRefresh}
            >
              {t.common.retry}
            </Button>
          }
        >
          {error}
        </Alert>
      )}


      <Box
        data-tour="fac-table"
        sx={{
          flex: 1,

          minHeight: 0,

          width: '100%',
        }}
      >
        <FacConfirmDataTable
          ref={tableRef}
          rows={rows}
          confirmedProcesses={confirmedProcesses}
          loading={loading}
          initialLoading={initialLoading}
          stale={stale}

          div={div}
          expD={expD}

          procGrp={procGrp}
          classify={apiClassify}
          heatType={heatType}

          highlightProcGrp={highlightProcGrp}
          excelFilters={excelFilters}
          paginationModel={paginationModel}
          rowCount={totalElements}
          sortModel={sortModel}

          columnVisibilityModel={
            preferences.columnVisibilityModel
          }
          columnOrder={
            preferences.columnOrder
          }
          columnWidths={
            preferences.columnWidths
          }

          onExcelFiltersChange={
            handleExcelFiltersChange
          }
          onPaginationChange={
            handlePaginationChange
          }
          onSortChange={
            handleSortChange
          }
          onColumnVisibilityModelChange={
            preferences.setColumnVisibilityModel
          }
          onColumnOrderChange={
            preferences.setColumnOrder
          }
          onColumnWidthChange={
            preferences.setColumnWidth
          }
          onSaved={handleRefreshAll}
          error={error}
          onRetry={handleRefresh}
          pageFilterCount={activeFilterCount}
          filterSummary={filterSummary}
          onClearPageFilters={handleClearFilters}
          onGoToday={
            expD !== getToday()
              ? handleGoToday
              : undefined
          }
          density={preferences.density}
          onDensityChange={preferences.setDensity}
          pinnedColumns={preferences.pinnedColumns}
          onTogglePinnedColumn={preferences.togglePinnedColumn}
        />
      </Box>


      <FacConfirmUnsavedChangesDialog
        open={pendingProcGrp != null}
        changeCount={
          pendingChangeCount
        }
        saving={switchSaving}
        onSave={() => void handleUnsavedSave()}
        onDiscard={handleUnsavedDiscard}
        onStay={handleUnsavedStay}
      />


      {/* Mounted from the first open on (kept afterwards so closing can animate) */}
      {guideMounted && (
        <Suspense fallback={null}>
          <FacConfirmGuideTour
            open={guide.open}
            onClose={guide.close}
          />
        </Suspense>
      )}

    </PageShell>
  )
}
