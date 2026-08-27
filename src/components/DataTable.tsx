import {
  DataGrid,
  GridToolbarColumnsButton,
  GridToolbarContainer,
  type GridPaginationModel,
  type GridSortModel,
  type GridColumnOrderChangeParams,
  type GridColumnResizeParams,
} from '@mui/x-data-grid'
import { useMemo } from 'react'

import { backlogColumns } from './backlog/backlogColumns'
import { ExcelColumnFilterProvider } from './backlog/ExcelColumnFilter'

import type { ProductionOrder } from '../types/report'
import { ExcelColumnMenu } from './backlog/ExcelColumnMenu'
import {
  dataGridHeaderSx,
  preventColumnHeaderSort,
} from '../theme/dataGridHeaderStyles'
import type { BacklogFilterItem } from '../services/reportService'
import type { GridColumnVisibilityModel } from '@mui/x-data-grid'
import { applyGridColumnPreferences } from '../utils/uiPreferences'

interface DataTableProps {
  data: ProductionOrder[]
  loading: boolean

  page: number
  pageSize: number
  totalElements: number

  excelFilters: BacklogFilterItem[]
  sortModel: GridSortModel

  columnVisibilityModel:
  GridColumnVisibilityModel

  onColumnVisibilityModelChange: (
    model: GridColumnVisibilityModel,
  ) => void
  columnOrder: string[]
  columnWidths: Record<string, number>
  onColumnOrderChange: (order: string[]) => void
  onColumnWidthChange: (field: string, width: number) => void

  onExcelFiltersChange: (
    filters: BacklogFilterItem[],
  ) => void

  onSortChange: (
    model: GridSortModel,
  ) => void

  onPaginationChange: (
    model: GridPaginationModel,
  ) => void
}

function BacklogToolbar() {
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

export function DataTable({
  data,
  loading,

  page,
  pageSize,
  totalElements,

  excelFilters,
  sortModel,

  columnVisibilityModel,
  onColumnVisibilityModelChange,
  columnOrder,
  columnWidths,
  onColumnOrderChange,
  onColumnWidthChange,

  onExcelFiltersChange,
  onSortChange,
  onPaginationChange,
}: DataTableProps) {
  const preferredColumns = useMemo(() => {
    return applyGridColumnPreferences(backlogColumns, columnOrder, columnWidths)
  }, [columnOrder, columnWidths])

  function handleColumnOrderChange(params: GridColumnOrderChangeParams) {
    const nextOrder = preferredColumns.map((column) => column.field)
    const [movedField] = nextOrder.splice(params.oldIndex, 1)
    if (!movedField) return
    nextOrder.splice(params.targetIndex, 0, movedField)
    onColumnOrderChange(nextOrder)
  }

  function handleColumnWidthChange(params: GridColumnResizeParams) {
    onColumnWidthChange(params.colDef.field, params.width)
  }

  return (
    <ExcelColumnFilterProvider
      excelFilters={excelFilters}
      onExcelFiltersChange={onExcelFiltersChange}
    >
      <DataGrid
        rows={data}
        columns={preferredColumns}

        columnVisibilityModel={
          columnVisibilityModel
        }

        onColumnVisibilityModelChange={
          onColumnVisibilityModelChange
        }

        onColumnOrderChange={handleColumnOrderChange}
        onColumnWidthChange={handleColumnWidthChange}
        
        getRowId={(row) =>
          [
            row.VBELN ?? '',
            row.ZGLOBAL_CODE ?? '',
            row.PIER_AUFNR ?? '',
            row.AUFNR ?? '',
          ].join('|')
        }

        loading={loading}

        paginationMode="server"
        filterMode="server"
        sortingMode="server"

        sortModel={sortModel}

        onSortModelChange={onSortChange}

        rowCount={totalElements}

        paginationModel={{
          page,
          pageSize,
        }}

        onPaginationModelChange={
          onPaginationChange
        }

        pageSizeOptions={[
          20,
          50,
          100,
        ]}

        slots={{
          toolbar: BacklogToolbar,

          // QUAN TRỌNG:
          // thay menu mặc định của MUI
          columnMenu: ExcelColumnMenu,
        }}

        showToolbar

        density="compact"

        disableRowSelectionOnClick

        onColumnHeaderClick={preventColumnHeaderSort}

        sx={dataGridHeaderSx}
      />
    </ExcelColumnFilterProvider>
  )
}
