import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'

import DownloadRoundedIcon
  from '@mui/icons-material/DownloadRounded'

import HelpOutlineRoundedIcon
  from '@mui/icons-material/HelpOutlineRounded'

import {
  Alert,
  Box,
  Button,
  IconButton,
  Stack,
  Tooltip,
} from '@mui/material'

import type {
  GridPaginationModel,
  GridSortModel,
} from '@mui/x-data-grid'

import {
  FacConfirmDataTable,
  type FacConfirmDataTableHandle,
} from '../components/facConfirm/FacConfirmDataTable'

import {
  FacConfirmUnsavedChangesDialog,
} from '../components/facConfirm/FacConfirmUnsavedChangesDialog'

import {
  getFacConfirmColumns,
} from '../components/facConfirm/facConfirmColumns'

import {
  FacConfirmFilterBar,
} from '../components/facConfirm/FacConfirmFilterBar'

import {
  GuideTour,
} from '../components/facConfirm/guide/GuideTour'

import {
  useGuideTour,
} from '../components/facConfirm/guide/useGuideTour'

import {
  FAC_CONFIRM_GUIDE_KEY,
  facConfirmGuideSteps,
} from '../components/facConfirm/guide/facConfirmGuideSteps'

import {
  PageHeader,
} from '../components/common/PageHeader'

import {
  PageShell,
} from '../components/common/PageShell'

import {
  RefreshButton,
} from '../components/common/RefreshButton'

import {
  UpdatedStatus,
} from '../components/common/UpdatedStatus'

import {
  useFacConfirmData,
} from '../hooks/useFacConfirmData'

import {
  useGridPreferences,
} from '../hooks/useGridPreferences'

import {
  exportFacConfirmExcel,
} from '../services/facConfirmService'

import type {
  FacConfirmClassify,
  FacConfirmFilterItem,
  FacConfirmHeatType,
  FacConfirmProcessGroup,
} from '../types/facConfirm'

import {
  loadFacConfirmPreferences,
  saveFacConfirmPreferences,
} from '../utils/uiPreferences'


interface FacConfirmPageProps {
  mode: 'light' | 'dark'
  onToggleMode: () => void
}


// Chờ người dùng ngừng gõ rồi mới gọi API
const SEARCH_DEBOUNCE_MS = 300


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

  const [pagePreferences] =
    useState(loadFacConfirmPreferences)


  const [div, setDiv] =
    useState(
      pagePreferences.div
    )


  const [expD, setExpD] =
    useState(getToday)


  const [procGrp, setProcGrp] =
    useState<FacConfirmProcessGroup>(
      pagePreferences.procGrp,
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
  ] = useState<FacConfirmClassify[]>([
    'Sale',
    'Stock',
  ])


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


  // searchInput: giá trị ô nhập (cập nhật ngay)
  // search: giá trị gửi API (sau debounce)
  const [
    searchInput,
    setSearchInput,
  ] =
    useState('')

  const [
    search,
    setSearch,
  ] =
    useState('')


  const tableRef =
    useRef<FacConfirmDataTableHandle>(null)


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


  const preferences =
    useGridPreferences(
      'fac-confirm',
      100,
    )


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
    'All',
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

        let nextHeatType: FacConfirmHeatType =
          heatType

        // =========================================
        // MOLD
        // Chỉ được All
        // =========================================
        if (nextDiv === 'MO') {
          nextHeatType = 'All'
        }

        // =========================================
        // GUIDE
        // All / Normal / Molypden
        // =========================================
        else if (nextDiv === 'GU') {

          const allowedGuideHeatTypes:
            FacConfirmHeatType[] = [
              'All',
              'Normal',
              'Molypden',
            ]

          if (
            !allowedGuideHeatTypes.includes(
              heatType
            )
          ) {
            nextHeatType = 'All'
          }
        }

        // =========================================
        // PRESS / PRESS RETAINER
        // Giữ Heat Type hiện tại
        // =========================================

        setHeatType(
          nextHeatType
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
          preferences.pageSize
        ) {

          preferences.setPageSize(
            model.pageSize,
          )
        }

      },
      [
        preferences,
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
  // SEARCH
  // =========================================================

  const handleSearchChange =
    useCallback(
      (
        value: string,
      ) => {

        setSearchInput(
          value
        )

      },
      [],
    )


  useEffect(() => {
    if (searchInput === search) {
      return
    }

    const timer = window.setTimeout(
      () => {
        setSearch(
          searchInput
        )

        resetPage()
      },
      SEARCH_DEBOUNCE_MS,
    )

    return () => window.clearTimeout(timer)
  }, [
    resetPage,
    search,
    searchInput,
  ])


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

          await exportFacConfirmExcel({
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
          })
        } catch (exportError) {
          console.error(
            'Export Fac Confirm Excel failed:',
            exportError,
          )
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
        title="FAC CONFIRM"

        subtitle="Production process confirmation."

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
          <Stack
            direction="row"
            spacing={1}
            sx={{ alignItems: 'center' }}
          >
            <Tooltip title="Hướng dẫn sử dụng">
              <IconButton
                size="small"
                aria-label="Hướng dẫn sử dụng"
                onClick={
                  guide.start
                }
              >
                <HelpOutlineRoundedIcon
                  fontSize="small"
                />
              </IconButton>
            </Tooltip>

            <Button
              data-tour="fac-export"
              variant="outlined"
              size="small"
              startIcon={
                <DownloadRoundedIcon />
              }
              disabled={
                exporting
                || exportColumns.length === 0
              }
              onClick={
                handleExportExcel
              }
            >
              {
                exporting
                  ? 'Exporting...'
                  : 'Export Excel'
              }
            </Button>

            <Box
              component="span"
              data-tour="fac-refresh"
            >
              <RefreshButton
                loading={
                  loading
                }

                onClick={
                  handleRefresh
                }
              />
            </Box>
          </Stack>
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
          search={searchInput}
          processGroups={processGroups}
          loading={loading}
          summaryLoading={summaryLoading}

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


      {/* Lỗi tải: dữ liệu cũ vẫn giữ trên bảng */}
      {error && (
        <Alert
          severity="error"
          action={
            <Button
              color="inherit"
              size="small"
              disabled={loading}
              onClick={handleRefresh}
            >
              Thử lại
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
          onSaved={handleRefresh}
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


      <GuideTour
        open={guide.open}
        steps={facConfirmGuideSteps}
        onClose={guide.close}
      />

    </PageShell>
  )
}
