import {
  useCallback,
  useMemo,
  useState,
} from 'react'

import {
  Box,
  alpha,
} from '@mui/material'

import {
  GridToolbarColumnsButton,
  GridToolbarContainer,
  type GridCellParams,
  type GridColumnVisibilityModel,
  type GridPaginationModel,
  type GridSortModel,
} from '@mui/x-data-grid'

import {
  ExcelColumnFilterProvider,
} from '../common/dataGrid/ExcelColumnFilter'

import {
  ExcelColumnMenu,
} from '../common/dataGrid/ExcelColumnMenu'

import {
  ReusableDataGrid,
} from '../common/dataGrid/ReusableDataGrid'

import type {
  ExcelFilterOptionsRequest,
} from '../common/dataGrid/excelFilterContext'

import {
  getFacConfirmFilterKind,
  isFacConfirmFilterField,
} from '../../config/facConfirmFilterFields'

import {
  FAC_CONFIRM_PROCESS_CONFIG,
} from '../../config/facConfirmProcessConfig'

import {
  getFacConfirmFilterOptions,
} from '../../services/facConfirmService'

import {
  preventColumnHeaderSort,
} from '../../theme/dataGridHeaderStyles'

import type {
  FacConfirmFilterItem,
  FacConfirmProcessGroup,
  FacConfirmRow,
} from '../../types/facConfirm'

import {
  getFacConfirmColumns,
} from './facConfirmColumns'


interface FacConfirmDataTableProps {
  rows: FacConfirmRow[]

  loading: boolean

  div: string

  expD: string

  procGrp:
  FacConfirmProcessGroup

  highlightProcGrp:
  FacConfirmProcessGroup | null

  excelFilters:
  FacConfirmFilterItem[]

  paginationModel:
  GridPaginationModel

  rowCount: number

  sortModel:
  GridSortModel

  columnVisibilityModel:
  GridColumnVisibilityModel

  columnOrder:
  string[]

  columnWidths:
  Record<string, number>

  onExcelFiltersChange:
  (
    filters:
      FacConfirmFilterItem[],
  ) => void

  onPaginationChange:
  (
    model:
      GridPaginationModel,
  ) => void

  onSortChange:
  (
    model:
      GridSortModel,
  ) => void

  onColumnVisibilityModelChange:
  (
    model:
      GridColumnVisibilityModel,
  ) => void

  onColumnOrderChange:
  (
    order: string[],
  ) => void

  onColumnWidthChange:
  (
    field: string,
    width: number,
  ) => void
}


// =========================================================
// TOOLBAR
// =========================================================

function FacConfirmToolbar() {

  return (
    <GridToolbarContainer
      sx={{
        justifyContent:
          'flex-end',

        minHeight:
          40,

        px:
          1,

        py:
          0.5,
      }}
    >

      <GridToolbarColumnsButton />

    </GridToolbarContainer>
  )
}


// =========================================================
// CELL KEY
// =========================================================

function getCellKey(
  row: FacConfirmRow,
  field: string,
) {

  return [
    row.aufnr,
    row.zglobalCode ?? '',
    field,
  ].join('|')
}


// =========================================================
// VALUE COMPARE
// =========================================================

function valuesEqual(
  left: unknown,
  right: unknown,
) {

  if (
    left == null
    && right == null
  ) {
    return true
  }

  return String(left ?? '')
    === String(right ?? '')
}


// =========================================================
// COMPONENT
// =========================================================

export function FacConfirmDataTable({

  rows,
  loading,

  div,
  expD,

  procGrp,
  highlightProcGrp,

  excelFilters,

  paginationModel,
  rowCount,

  sortModel,

  columnVisibilityModel,
  columnOrder,
  columnWidths,

  onExcelFiltersChange,

  onPaginationChange,
  onSortChange,

  onColumnVisibilityModelChange,
  onColumnOrderChange,
  onColumnWidthChange,

}: FacConfirmDataTableProps) {

  // =======================================================
  // USER EDITED CELLS
  //
  // key:
  // AUFNR | GlobalCode | field
  //
  // value:
  // Rough / Heat / Fine
  // =======================================================

  const [
    editedCells,
    setEditedCells,
  ] =
    useState<
      Map<
        string,
        FacConfirmProcessGroup
      >
    >(
      () => new Map(),
    )


  // =======================================================
  // FILTER OPTIONS
  // =======================================================

  const loadOptions =
    useCallback(
      (
        request:
          ExcelFilterOptionsRequest,

        signal?:
          AbortSignal,
      ) =>
        getFacConfirmFilterOptions(
          {
            ...request,

            div,

            expD,

            procGrp,
          },

          signal,
        ),
      [
        div,
        expD,
        procGrp,
      ],
    )


  // =======================================================
  // ACTIVE PROCESS CONFIG
  // =======================================================

  const highlightConfig =
    highlightProcGrp
      ? FAC_CONFIRM_PROCESS_CONFIG[
      highlightProcGrp
      ]
      : null


  // =======================================================
  // COLUMNS
  // =======================================================

  const columns =
    useMemo(
      () =>
        getFacConfirmColumns(
          highlightProcGrp,
        ),
      [
        highlightProcGrp,
      ],
    )


  // =======================================================
  // CELL CLASS
  //
  // Chỉ cell đã được USER sửa mới có màu.
  // Data có sẵn từ BE không có màu.
  // =======================================================

  const getCellClassName =
    useCallback(
      (
        params:
          GridCellParams<FacConfirmRow>,
      ): string => {

        const key =
          getCellKey(
            params.row,
            params.field,
          )

        const editedProcess =
          editedCells.get(
            key,
          )

        if (!editedProcess) {
          return ''
        }


        switch (
        editedProcess
        ) {

          case 'Rough':
            return 'fac-confirm-edited-rough'

          case 'Heat':
            return 'fac-confirm-edited-heat'

          case 'Fine':
            return 'fac-confirm-edited-fine'

          default:
            return ''
        }
      },
      [
        editedCells,
      ],
    )


  // =======================================================
  // PROCESS ROW UPDATE
  //
  // Chỉ mark màu nếu value thực sự thay đổi.
  // Double click rồi ESC => không đổi màu.
  // =======================================================

  const processRowUpdate =
    useCallback(
      (
        newRow:
          FacConfirmRow,

        oldRow:
          FacConfirmRow,
      ) => {

        if (!highlightProcGrp) {
          return newRow
        }


        const activeFields =
          FAC_CONFIRM_PROCESS_CONFIG[
            highlightProcGrp
          ].columns


        const changedFields =
          activeFields.filter(
            (field) => {

              const key =
                field as keyof FacConfirmRow


              return !valuesEqual(
                oldRow[key],
                newRow[key],
              )
            },
          )


        if (
          changedFields.length > 0
        ) {

          setEditedCells(
            (current) => {

              const next =
                new Map(
                  current,
                )


              for (
                const field
                of changedFields
              ) {

                next.set(
                  getCellKey(
                    newRow,
                    field,
                  ),

                  highlightProcGrp,
                )
              }


              return next
            },
          )
        }


        return newRow
      },
      [
        highlightProcGrp,
      ],
    )


  // =======================================================
  // PROCESS UPDATE ERROR
  // =======================================================

  const handleProcessRowUpdateError =
    useCallback(
      (
        error: unknown,
      ) => {

        console.error(
          'Fac Confirm row update failed:',
          error,
        )
      },
      [],
    )


  // =======================================================
  // RENDER
  // =======================================================

  return (
    <ExcelColumnFilterProvider

      excelFilters={
        excelFilters
      }

      onExcelFiltersChange={
        onExcelFiltersChange
      }

      isFilterableField={
        isFacConfirmFilterField
      }

      getFilterKind={
        getFacConfirmFilterKind
      }

      loadOptions={
        loadOptions
      }

    >

      <Box
        sx={(theme) => {

          // =================================================
          // COLOR
          // =================================================

          const roughColor =
            FAC_CONFIRM_PROCESS_CONFIG.Rough
              .getColor(theme)

          const heatColor =
            FAC_CONFIRM_PROCESS_CONFIG.Heat
              .getColor(theme)

          const fineColor =
            FAC_CONFIRM_PROCESS_CONFIG.Fine
              .getColor(theme)


          // =================================================
          // ACTIVE HEADER
          // =================================================

          const headerStyles:
            Record<string, object> = {}


          if (
            highlightConfig
          ) {

            const activeColor =
              highlightConfig.getColor(
                theme,
              )


            for (
              const field
              of highlightConfig.columns
            ) {

              headerStyles[
                `& .MuiDataGrid-columnHeader[data-field="${field}"]`
              ] = {

                backgroundColor:
                  alpha(
                    activeColor,

                    theme.palette.mode ===
                      'dark'
                      ? 0.18
                      : 0.10,
                  ),

                color:
                  activeColor,

                fontWeight:
                  800,

                transition:
                  'background-color 180ms ease',
              }
            }
          }


          return {

            width:
              '100%',

            height:
              '100%',

            minHeight:
              0,


            // =================================================
            // ROUGH EDITED CELL
            // =================================================

            '& .fac-confirm-edited-rough': {

              backgroundColor:
                alpha(
                  roughColor,

                  theme.palette.mode ===
                    'dark'
                    ? 0.18
                    : 0.10,
                ),

              transition:
                'background-color 180ms ease',
            },


            // =================================================
            // HEAT EDITED CELL
            // =================================================

            '& .fac-confirm-edited-heat': {

              backgroundColor:
                alpha(
                  heatColor,

                  theme.palette.mode ===
                    'dark'
                    ? 0.18
                    : 0.10,
                ),

              transition:
                'background-color 180ms ease',
            },


            // =================================================
            // FINE EDITED CELL
            // =================================================

            '& .fac-confirm-edited-fine': {

              backgroundColor:
                alpha(
                  fineColor,

                  theme.palette.mode ===
                    'dark'
                    ? 0.18
                    : 0.10,
                ),

              transition:
                'background-color 180ms ease',
            },


            // =================================================
            // HOVER
            // =================================================

            '& .MuiDataGrid-row:hover .fac-confirm-edited-rough': {
              backgroundColor:
                alpha(
                  roughColor,
                  0.15,
                ),
            },

            '& .MuiDataGrid-row:hover .fac-confirm-edited-heat': {
              backgroundColor:
                alpha(
                  heatColor,
                  0.15,
                ),
            },

            '& .MuiDataGrid-row:hover .fac-confirm-edited-fine': {
              backgroundColor:
                alpha(
                  fineColor,
                  0.15,
                ),
            },


            // =================================================
            // ACTIVE HEADER
            // =================================================

            ...headerStyles,
          }
        }}
      >

        <ReusableDataGrid<FacConfirmRow>

          rows={
            rows
          }

          columns={
            columns
          }

          getRowId={(row) =>
            [
              row.aufnr,

              row.zglobalCode
              ?? '',
            ].join('|')
          }

          loading={
            loading
          }


          // ===============================================
          // PAGINATION
          // ===============================================

          paginationMode="server"

          page={
            paginationModel.page
          }

          pageSize={
            paginationModel.pageSize
          }

          rowCount={
            rowCount
          }

          onPaginationChange={
            onPaginationChange
          }


          // ===============================================
          // SORT
          // ===============================================

          sortingMode="client"

          sortModel={
            sortModel
          }

          onSortChange={
            onSortChange
          }


          // ===============================================
          // COLUMN PREFERENCES
          // ===============================================

          columnVisibilityModel={
            columnVisibilityModel
          }

          columnOrder={
            columnOrder
          }

          columnWidths={
            columnWidths
          }

          onColumnVisibilityModelChange={
            onColumnVisibilityModelChange
          }

          onColumnOrderChange={
            onColumnOrderChange
          }

          onColumnWidthChange={
            onColumnWidthChange
          }


          // ===============================================
          // EDIT
          // ===============================================

          getCellClassName={
            getCellClassName
          }

          processRowUpdate={
            processRowUpdate
          }

          onProcessRowUpdateError={
            handleProcessRowUpdateError
          }


          // ===============================================
          // TOOLBAR
          // ===============================================

          toolbar={
            FacConfirmToolbar
          }

          columnMenu={
            ExcelColumnMenu
          }

          onColumnHeaderClick={
            preventColumnHeaderSort
          }

        />

      </Box>

    </ExcelColumnFilterProvider>
  )
}