import {
  useCallback,
} from 'react'

import {
  Box,
  alpha,
} from '@mui/material'

import {
  GridToolbarColumnsButton,
  GridToolbarContainer,
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
  facConfirmColumns,
} from './facConfirmColumns'


interface FacConfirmDataTableProps {
  rows: FacConfirmRow[]

  loading: boolean

  div: string
  expD: string

  procGrp: FacConfirmProcessGroup

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
  (filters: FacConfirmFilterItem[]) => void

  onPaginationChange:
  (model: GridPaginationModel) => void

  onSortChange:
  (model: GridSortModel) => void

  onColumnVisibilityModelChange:
  (model: GridColumnVisibilityModel) => void

  onColumnOrderChange:
  (order: string[]) => void

  onColumnWidthChange:
  (
    field: string,
    width: number,
  ) => void
}


function FacConfirmToolbar() {
  return (
    <GridToolbarContainer
      sx={{
        justifyContent: 'flex-end',
        minHeight: 40,
        px: 1,
        py: 0.5,
      }}
    >
      <GridToolbarColumnsButton />
    </GridToolbarContainer>
  )
}


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
  // HIGHLIGHT CONFIG
  // =======================================================

  const highlightConfig =
    highlightProcGrp
      ? FAC_CONFIRM_PROCESS_CONFIG[
      highlightProcGrp
      ]
      : null


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

          // Chưa click process
          // => không highlight

          if (!highlightConfig) {
            return {
              width: '100%',
              height: '100%',
              minHeight: 0,
            }
          }


          const color =
            highlightConfig.getColor(
              theme,
            )


          const columnStyles:
            Record<string, object> = {}


          for (
            const field
            of highlightConfig.columns
          ) {

            // CELL

            columnStyles[
              `& .MuiDataGrid-cell[data-field="${field}"]`
            ] = {

              backgroundColor:
                alpha(
                  color,
                  theme.palette.mode === 'dark'
                    ? 0.10
                    : 0.055,
                ),

              transition:
                'background-color 180ms ease',
            }


            // HEADER

            columnStyles[
              `& .MuiDataGrid-columnHeader[data-field="${field}"]`
            ] = {

              backgroundColor:
                alpha(
                  color,
                  theme.palette.mode === 'dark'
                    ? 0.16
                    : 0.09,
                ),

              transition:
                'background-color 180ms ease',
            }


            // ROW HOVER

            columnStyles[
              `& .MuiDataGrid-row:hover .MuiDataGrid-cell[data-field="${field}"]`
            ] = {

              backgroundColor:
                alpha(
                  color,
                  theme.palette.mode === 'dark'
                    ? 0.15
                    : 0.09,
                ),
            }
          }


          return {
            width: '100%',
            height: '100%',
            minHeight: 0,

            ...columnStyles,
          }
        }}
      >

        <ReusableDataGrid<FacConfirmRow>

          rows={
            rows
          }

          columns={
            facConfirmColumns
          }

          getRowId={(row) =>
            [
              row.aufnr,
              row.zglobalCode ?? '',
            ].join('|')
          }

          loading={
            loading
          }

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

          sortingMode="client"

          sortModel={
            sortModel
          }

          onSortChange={
            onSortChange
          }

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