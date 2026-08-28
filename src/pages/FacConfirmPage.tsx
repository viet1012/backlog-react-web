import {
  Alert,
  Box,
} from '@mui/material'

import type {
  GridPaginationModel,
  GridSortModel,
} from '@mui/x-data-grid'

import {
  useCallback,
  useState,
} from 'react'

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
  FacConfirmFilterItem,
  FacConfirmProcessGroup,
} from '../types/facConfirm'

import {
  loadFacConfirmPreferences,
  saveFacConfirmPreferences,
} from '../utils/uiPreferences'


// =========================================================
// TODAY
// =========================================================

function getToday() {
  const now =
    new Date()

  return `${now.getFullYear()}-${String(
    now.getMonth() + 1,
  ).padStart(
    2,
    '0',
  )}-${String(
    now.getDate(),
  ).padStart(
    2,
    '0',
  )}`
}


// =========================================================
// PAGE
// =========================================================

export function FacConfirmPage() {

  // =======================================================
  // PAGE FILTER STATE
  // =======================================================

  const [
    pagePreferences,
  ] =
    useState(
      loadFacConfirmPreferences,
    )


  const [
    div,
    setDiv,
  ] =
    useState(
      pagePreferences.div,
    )


  const [
    expD,
    setExpD,
  ] =
    useState(
      getToday,
    )


  const [
    procGrp,
    setProcGrp,
  ] =
    useState<FacConfirmProcessGroup>(
      pagePreferences.procGrp,
    )


  // =======================================================
  // HIGHLIGHT STATE
  //
  // null:
  // chưa click Rough / Heat / Fine
  //
  // Rough:
  // highlight To Drill + To Heat
  //
  // Heat:
  // highlight Heat Start + Heat Finish
  //
  // Fine:
  // highlight To PK
  // =======================================================

  const [
    highlightProcGrp,
    setHighlightProcGrp,
  ] =
    useState<
      FacConfirmProcessGroup | null
    >(
      null,
    )


  // =======================================================
  // GRID PREFERENCES
  // =======================================================

  const preferences =
    useGridPreferences(
      'fac-confirm',
      20,
    )


  // =======================================================
  // PAGINATION
  // =======================================================

  const [
    paginationModel,
    setPaginationModel,
  ] =
    useState<GridPaginationModel>(
      () => ({
        page:
          0,

        pageSize:
          preferences.pageSize,
      }),
    )


  // =======================================================
  // SORT
  // =======================================================

  const [
    sortModel,
    setSortModel,
  ] =
    useState<GridSortModel>(
      [],
    )


  // =======================================================
  // EXCEL FILTER
  // =======================================================

  const [
    excelFilters,
    setExcelFilters,
  ] =
    useState<
      FacConfirmFilterItem[]
    >(
      [],
    )


  // =======================================================
  // DATA HOOK
  // =======================================================

  const {
    rows,

    processGroups,

    totalElements,

    loading,

    processGroupsLoading,

    error,

    lastUpdated,

    handleRefresh,
  } =
    useFacConfirmData({

      div,

      expD,

      procGrp,

      page:
        paginationModel.page,

      pageSize:
        paginationModel.pageSize,

      excelFilters,
    })


  // =======================================================
  // RESET PAGE
  // =======================================================

  const resetPage =
    useCallback(
      () => {

        setPaginationModel(
          (current) => ({
            ...current,

            page:
              0,
          }),
        )
      },
      [],
    )


  // =======================================================
  // DIVISION CHANGE
  // =======================================================

  const handleDivChange =
    useCallback(
      (
        nextDiv: string,
      ) => {

        setDiv(
          nextDiv,
        )


        // Khi đổi Division:
        // bỏ highlight cũ
        setHighlightProcGrp(
          null,
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


  // =======================================================
  // DATE CHANGE
  // =======================================================

  const handleDateChange =
    useCallback(
      (
        value: string,
      ) => {

        setExpD(
          value,
        )


        // đổi ngày => reset highlight
        setHighlightProcGrp(
          null,
        )


        resetPage()
      },
      [
        resetPage,
      ],
    )


  // =======================================================
  // PROCESS GROUP CHANGE
  // =======================================================

  const handleProcessGroupChange =
    useCallback(
      (
        value:
          FacConfirmProcessGroup,
      ) => {

        // ===============================================
        // API PROCESS GROUP
        // ===============================================

        setProcGrp(
          value,
        )


        // ===============================================
        // COLUMN HIGHLIGHT
        //
        // Chỉ tại đây mới set highlight
        // => mở page lần đầu sẽ không có màu
        // ===============================================

        setHighlightProcGrp(
          value,
        )


        // ===============================================
        // SAVE PAGE PREFERENCE
        // ===============================================

        saveFacConfirmPreferences({
          div,

          procGrp:
            value,
        })


        // ===============================================
        // RESET PAGE
        // ===============================================

        resetPage()
      },
      [
        div,
        resetPage,
      ],
    )


  // =======================================================
  // PAGINATION CHANGE
  // =======================================================

  const handlePaginationChange =
    useCallback(
      (
        model:
          GridPaginationModel,
      ) => {

        setPaginationModel(
          model,
        )


        if (
          model.pageSize
          !== preferences.pageSize
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


  // =======================================================
  // EXCEL FILTER CHANGE
  // =======================================================

  const handleExcelFiltersChange =
    useCallback(
      (
        filters:
          FacConfirmFilterItem[],
      ) => {

        setExcelFilters(
          filters,
        )

        resetPage()
      },
      [
        resetPage,
      ],
    )


  // =======================================================
  // SORT CHANGE
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
      },
      [],
    )


  // =======================================================
  // RENDER
  // =======================================================

  return (

    <PageShell>

      {/* =================================================
          HEADER
      ================================================= */}

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
                error,
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

      />


      {/* =================================================
          FILTER BAR
      ================================================= */}

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

        processGroups={
          processGroups
        }

        loading={
          processGroupsLoading
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

      />


      {/* =================================================
          ERROR
      ================================================= */}

      {error && (

        <Alert
          severity="error"
        >
          {error}
        </Alert>

      )}


      {/* =================================================
          TABLE
      ================================================= */}

      <Box
        sx={{
          flex:
            1,

          minHeight:
            0,

          width:
            '100%',
        }}
      >

        <FacConfirmDataTable

          // =============================================
          // DATA
          // =============================================

          rows={
            rows
          }

          loading={
            loading
          }


          // =============================================
          // BASE FILTER
          // =============================================

          div={
            div
          }

          expD={
            expD
          }

          procGrp={
            procGrp
          }


          // =============================================
          // ACTIVE HIGHLIGHT
          // =============================================

          highlightProcGrp={
            highlightProcGrp
          }


          // =============================================
          // EXCEL FILTER
          // =============================================

          excelFilters={
            excelFilters
          }


          // =============================================
          // PAGINATION
          // =============================================

          paginationModel={
            paginationModel
          }

          rowCount={
            totalElements
          }


          // =============================================
          // SORT
          // =============================================

          sortModel={
            sortModel
          }


          // =============================================
          // GRID PREFERENCES
          // =============================================

          columnVisibilityModel={
            preferences.columnVisibilityModel
          }

          columnOrder={
            preferences.columnOrder
          }

          columnWidths={
            preferences.columnWidths
          }


          // =============================================
          // CALLBACKS
          // =============================================

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

        />

      </Box>

    </PageShell>
  )
}