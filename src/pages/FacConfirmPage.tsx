import {
  useCallback,
  useState,
} from 'react'

import {
  Alert,
  Box,
} from '@mui/material'

import type {
  GridPaginationModel,
  GridSortModel,
} from '@mui/x-data-grid'

import {
  FacConfirmDataTable,
} from '../components/facConfirm/FacConfirmDataTable'

import {
  FacConfirmFilterBar,
} from '../components/facConfirm/FacConfirmFilterBar'

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

import type {
  FacConfirmClassify,
  FacConfirmFilterItem,
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
    highlightProcGrp,
    setHighlightProcGrp,
  ] =
    useState<FacConfirmProcessGroup | null>(
      pagePreferences.procGrp,
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


  // =========================================================
  // DATA
  // =========================================================

  const {
    rows,
    confirmedProcesses,
    processGroups,
    totalElements,
    loading,
    error,
    lastUpdated,
    handleRefresh,
  } = useFacConfirmData({
    div,

    expD,

    procGrp,

    classify:
      apiClassify,

    page:
      paginationModel.page,

    pageSize:
      paginationModel.pageSize,

    excelFilters,
  })


  // Nếu chưa dùng thì tránh eslint warning


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

        setDiv(
          nextDiv
        )


        saveFacConfirmPreferences({
          div:
            nextDiv,

          procGrp,
        })


        resetPage()

      },
      [
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

  const handleProcessGroupChange =
    useCallback(
      (
        value:
          FacConfirmProcessGroup,
      ) => {

        setProcGrp(
          value
        )

        setHighlightProcGrp(
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
          <RefreshButton
            loading={
              loading
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


      <FacConfirmFilterBar
        div={
          div
        }

        expD={
          expD
        }

        procGrp={
          procGrp
        }

        classify={
          classify
        }

        processGroups={
          processGroups
        }

        loading={
          loading
        }

        onDivChange={
          handleDivChange
        }

        onDateChange={
          handleDateChange
        }

        onProcessGroupChange={
          handleProcessGroupChange
        }

        onClassifyChange={
          handleClassifyChange
        }
      />


      {error && (
        <Alert
          severity="error"
        >
          {error}
        </Alert>
      )}


      <Box
        sx={{
          flex: 1,

          minHeight: 0,

          width: '100%',
        }}
      >
        <FacConfirmDataTable
          rows={
            rows
          }

          confirmedProcesses={
            confirmedProcesses
          }

          loading={
            loading
          }

          div={
            div
          }

          expD={
            expD
          }

          procGrp={
            procGrp
          }

          classify={
            apiClassify
          }

          highlightProcGrp={
            highlightProcGrp
          }

          excelFilters={
            excelFilters
          }

          paginationModel={
            paginationModel
          }

          rowCount={
            totalElements
          }

          sortModel={
            sortModel
          }

          columnVisibilityModel={
            preferences
              .columnVisibilityModel
          }

          columnOrder={
            preferences
              .columnOrder
          }

          columnWidths={
            preferences
              .columnWidths
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

          onSaved={
            handleRefresh
          }
        />
      </Box>

    </PageShell>
  )
}
