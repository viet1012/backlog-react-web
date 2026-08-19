import {
  DataGrid,
  GridToolbarColumnsButton,
  GridToolbarContainer,
  type GridPaginationModel,
} from '@mui/x-data-grid'
import { backlogColumns } from './backlog/backlogColumns'
import type { ProductionOrder } from '../types/report'

interface DataTableProps {
  data: ProductionOrder[]
  loading: boolean
  page: number
  pageSize: number
  totalElements: number
  onPaginationChange: (model: GridPaginationModel) => void
}

function BacklogToolbar() {
  return (
    <GridToolbarContainer
      sx={(theme) => ({
        justifyContent: 'flex-end',
        minHeight: 40,
        px: 1,
        py: 0.5,
        bgcolor:
          theme.palette.mode === 'dark'
            ? '#131f33'
            : '#f6f8fb',
        borderBottom: `1px solid ${theme.palette.divider}`,
      })}
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
  onPaginationChange,
}: DataTableProps) {
  return (
    <DataGrid
      rows={data}
      columns={backlogColumns}
      getRowId={(row) => row.AUFNR}

      loading={loading}

      paginationMode="server"
      rowCount={totalElements}

      paginationModel={{
        page,
        pageSize,
      }}

      onPaginationModelChange={onPaginationChange}

      pageSizeOptions={[20, 50, 100]}

      slots={{
        toolbar: BacklogToolbar,
      }}

      showToolbar

      density="compact"

      disableRowSelectionOnClick

      sx={(theme) => {
        const dark = theme.palette.mode === 'dark'

        return {
          width: '100%',
          height: '100%',

          border: 0,

          color: dark
            ? '#dbe7f8'
            : '#243047',

          bgcolor: dark
            ? '#101a2b'
            : '#ffffff',

          '& .MuiDataGrid-columnHeaders': {
            bgcolor: dark
              ? '#17243a'
              : '#eef3f8',

            borderBottom:
              `1px solid ${theme.palette.divider}`,
          },

          '& .MuiDataGrid-columnHeaderTitle': {
            fontWeight: 700,
            fontSize: 12,

            color: dark
              ? '#cbd8eb'
              : '#3b4a61',
          },

          '& .MuiDataGrid-cell': {
            borderColor: theme.palette.divider,
            fontSize: 12,
          },

          '& .MuiDataGrid-row': {
            transition:
              'background-color 160ms ease',
          },

          '& .MuiDataGrid-row:nth-of-type(even)': {
            bgcolor: dark
              ? '#121e31'
              : '#f8fafc',
          },

          '& .MuiDataGrid-row:hover': {
            bgcolor: dark
              ? '#1b3150'
              : '#eef5ff',
          },

          '& .MuiDataGrid-row.Mui-selected': {
            bgcolor: dark
              ? '#1c3b61'
              : '#dbeafe',
          },

          '& .MuiDataGrid-footerContainer': {
            minHeight: 46,

            bgcolor: dark
              ? '#131f33'
              : '#f6f8fb',

            borderTop:
              `1px solid ${theme.palette.divider}`,
          },

          '& .MuiDataGrid-virtualScroller::-webkit-scrollbar':
          {
            width: 10,
            height: 10,
          },

          '& .MuiDataGrid-virtualScroller::-webkit-scrollbar-track':
          {
            bgcolor: dark
              ? '#0d1625'
              : '#e5eaf0',
          },

          '& .MuiDataGrid-virtualScroller::-webkit-scrollbar-thumb':
          {
            bgcolor: dark
              ? '#33445e'
              : '#aab5c4',

            border:
              `2px solid ${dark
                ? '#0d1625'
                : '#e5eaf0'
              }`,

            borderRadius: 8,
          },

          '& .MuiDataGrid-virtualScroller::-webkit-scrollbar-thumb:hover':
          {
            bgcolor: dark
              ? '#49617f'
              : '#8392a7',
          },
        }
      }}
    />
  )
}