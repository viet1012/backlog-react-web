import type { GridEventListener } from '@mui/x-data-grid'

export const preventColumnHeaderSort: GridEventListener<'columnHeaderClick'> = (
  _params,
  event,
) => {
  event.defaultMuiPrevented = true
}

export const dataGridHeaderSx = {
  width: '100%',
  height: '100%',
  '& .MuiDataGrid-sortIcon': { display: 'none !important' },
  '& .MuiDataGrid-iconButtonContainer': { display: 'none !important' },
  '& .MuiDataGrid-menuIcon': {
    display: 'flex !important',
    visibility: 'visible !important',
    width: 'auto !important',
  },
  '& .MuiDataGrid-menuIconButton': {
    display: 'inline-flex !important',
    visibility: 'visible !important',
  },
  '& .MuiDataGrid-row': {
    transition: 'background-color 160ms ease',
  },
} as const
