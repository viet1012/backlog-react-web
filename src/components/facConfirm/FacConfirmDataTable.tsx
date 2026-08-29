import {
  useCallback,
  useMemo,
  useState,
} from 'react'

import {
  Alert,
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Snackbar,
  TextField,
  alpha,
} from '@mui/material'

import SaveRoundedIcon
  from '@mui/icons-material/SaveRounded'

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
  saveFacConfirmProcessTimes,
} from '../../services/facConfirmService'

import {
  preventColumnHeaderSort,
} from '../../theme/dataGridHeaderStyles'

import type {
  FacConfirmConfirmedProcess,
  FacConfirmFilterItem,
  FacConfirmProcessGroup,
  FacConfirmRow,
} from '../../types/facConfirm'

import {
  getFacConfirmColumns,
} from './facConfirmColumns'

import {
  useFacConfirmCellEditState,
} from './hooks/useFacConfirmCellEditState'

interface FacConfirmDataTableProps {
  rows: FacConfirmRow[]
  confirmedProcesses: FacConfirmConfirmedProcess[]
  loading: boolean

  div: string
  expD: string

  procGrp: FacConfirmProcessGroup

  highlightProcGrp:
  FacConfirmProcessGroup | null

  // XÓA DÒNG NÀY
  // updater: string

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
  (field: string, width: number) => void

  onSaved?:
  () => void
}

// =========================================================
// TOOLBAR
// =========================================================

interface FacConfirmToolbarProps {
  hasChanges: boolean
  saving: boolean
  changeCount: number
  onConfirm: () => void
}


function FacConfirmToolbar({
  hasChanges,
  saving,
  changeCount,
  onConfirm,
}: FacConfirmToolbarProps) {

  return (
    <GridToolbarContainer
      sx={{
        justifyContent:
          'space-between',

        minHeight:
          40,

        px:
          1,

        py:
          0.5,
      }}
    >
      <Box>
        {hasChanges && (
          <Button
            size="small"

            variant="contained"

            startIcon={
              <SaveRoundedIcon />
            }

            disabled={
              saving
            }

            onClick={
              onConfirm
            }
          >
            {saving
              ? 'Saving...'
              : `Confirm Changes (${changeCount})`}
          </Button>
        )}
      </Box>

      <GridToolbarColumnsButton />
    </GridToolbarContainer>
  )
}


// =========================================================
// COMPONENT
// =========================================================

export function FacConfirmDataTable({

  rows,
  confirmedProcesses,
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

  onSaved,

}: FacConfirmDataTableProps) {

  // =======================================================
  // SAVE STATE
  // =======================================================

  const [
    confirmDialogOpen,
    setConfirmDialogOpen,
  ] = useState(false)

  const [
    employeeId,
    setEmployeeId,
  ] = useState('')

  const [
    employeeError,
    setEmployeeError,
  ] = useState('')

  const [
    saving,
    setSaving,
  ] = useState(false)

  const [
    editError,
    setEditError,
  ] = useState('')
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
  // ACTIVE PROCESS
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
  // CELL EDIT STATE
  // =======================================================

  const {
    getCellClassName,
    processRowUpdate,
    pendingChanges,
    hasChanges,
    changeCount,
    clearChanges,
  } = useFacConfirmCellEditState({
    activeProcess:
      highlightProcGrp,

    confirmedProcesses,
  })

  // =======================================================
  // CONFIRM ALL CHANGES
  // =======================================================
  const handleOpenConfirm =
    useCallback(
      () => {

        if (!hasChanges) {
          return
        }

        setEmployeeError('')
        setEmployeeId('')
        setConfirmDialogOpen(true)
      },
      [
        hasChanges,
      ],
    )
  const handleSaveChanges =
    useCallback(
      async () => {

        const msnv =
          employeeId.trim()

        if (!msnv) {
          setEmployeeError(
            'Please enter employee ID.',
          )

          return
        }

        // Nếu MSNV công ty chỉ là số
        if (!/^\d+$/.test(msnv)) {
          setEmployeeError(
            'Employee ID must contain numbers only.',
          )

          return
        }

        if (
          !hasChanges
          || saving
        ) {
          return
        }

        try {

          setSaving(true)
          setEmployeeError('')

          const result =
            await saveFacConfirmProcessTimes({
              employeeId:
                msnv,

              changes:
                pendingChanges,
            })

          console.log(
            'Fac Confirm saved:',
            result,
          )

          clearChanges()

          setConfirmDialogOpen(
            false,
          )

          setEmployeeId('')

          onSaved?.()

        } catch (error) {

          console.error(
            'Save Fac Confirm failed:',
            error,
          )

          setEmployeeError(
            error instanceof Error
              ? error.message
              : 'Unable to save Fac Confirm.',
          )

        } finally {

          setSaving(false)
        }
      },
      [
        employeeId,
        hasChanges,
        saving,
        pendingChanges,
        clearChanges,
        onSaved,
      ],
    )


  // =======================================================
  // TOOLBAR WRAPPER
  // =======================================================

  const toolbarComponent =
    useCallback(
      () => (
        <FacConfirmToolbar
          hasChanges={
            hasChanges
          }

          saving={
            saving
          }

          changeCount={
            changeCount
          }

          onConfirm={
            handleOpenConfirm
          }
        />
      ),
      [
        hasChanges,
        saving,
        changeCount,
        handleOpenConfirm,
      ],
    )


  // =======================================================
  // ROW UPDATE ERROR
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

        setEditError(
          error instanceof Error
            ? error.message
            : 'Invalid value.',
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

          const processColors = {
            Rough:
              FAC_CONFIRM_PROCESS_CONFIG
                .Rough
                .getColor(theme),

            Heat:
              FAC_CONFIRM_PROCESS_CONFIG
                .Heat
                .getColor(theme),

            Fine:
              FAC_CONFIRM_PROCESS_CONFIG
                .Fine
                .getColor(theme),
          }


          const headerStyles:
            Record<string, object> = {}


          if (
            highlightConfig
          ) {

            const activeColor =
              highlightConfig.getColor(
                theme,
              )


            highlightConfig.columns.forEach(
              (
                field,
              ) => {

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
              },
            )
          }


          const editedCellStyles =
            Object.fromEntries(

              (
                Object.keys(
                  processColors,
                ) as FacConfirmProcessGroup[]
              ).map(
                (
                  process,
                ) => {

                  const className =
                    `.fac-confirm-edited-${process.toLowerCase()}`


                  return [
                    `& ${className}`,
                    {

                      backgroundColor:
                        alpha(
                          processColors[
                          process
                          ],

                          theme.palette.mode ===
                            'dark'
                            ? 0.18
                            : 0.10,
                        ),

                      transition:
                        'background-color 180ms ease',
                    },
                  ]
                },
              ),
            )


          return {

            width:
              '100%',

            height:
              '100%',

            minHeight:
              0,


            ...editedCellStyles,


            '& .MuiDataGrid-row:hover .fac-confirm-edited-rough': {
              backgroundColor:
                alpha(
                  processColors.Rough,
                  0.15,
                ),
            },


            '& .MuiDataGrid-row:hover .fac-confirm-edited-heat': {
              backgroundColor:
                alpha(
                  processColors.Heat,
                  0.15,
                ),
            },


            '& .MuiDataGrid-row:hover .fac-confirm-edited-fine': {
              backgroundColor:
                alpha(
                  processColors.Fine,
                  0.15,
                ),
            },


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

          getCellClassName={
            getCellClassName
          }

          processRowUpdate={
            processRowUpdate
          }

          onProcessRowUpdateError={
            handleProcessRowUpdateError
          }

          toolbar={
            toolbarComponent
          }

          columnMenu={
            ExcelColumnMenu
          }

          onColumnHeaderClick={
            preventColumnHeaderSort
          }

        />

      </Box>
      <Dialog
        open={
          confirmDialogOpen
        }

        onClose={() => {
          if (!saving) {
            setConfirmDialogOpen(
              false,
            )
          }
        }}

        maxWidth="xs"

        fullWidth
      >
        <DialogTitle>
          Confirm Changes
        </DialogTitle>

        <DialogContent>

          <TextField
            autoFocus

            fullWidth

            size="small"

            label="Employee ID"

            placeholder="Enter MSNV"

            value={
              employeeId
            }

            disabled={
              saving
            }

            error={
              Boolean(
                employeeError,
              )
            }

            helperText={
              employeeError
              || `${changeCount} change(s) will be confirmed.`
            }

            onChange={(event) => {
              setEmployeeId(
                event.target.value,
              )

              if (employeeError) {
                setEmployeeError('')
              }
            }}

            onKeyDown={(event) => {

              if (
                event.key === 'Enter'
              ) {
                event.preventDefault()

                void handleSaveChanges()
              }
            }}

            slotProps={{
              htmlInput: {
                inputMode:
                  'numeric',
              },
            }}

            sx={{
              mt: 1,
            }}
          />

        </DialogContent>

        <DialogActions>

          <Button
            disabled={
              saving
            }

            onClick={() =>
              setConfirmDialogOpen(
                false,
              )
            }
          >
            Cancel
          </Button>

          <Button
            variant="contained"

            startIcon={
              <SaveRoundedIcon />
            }

            disabled={
              saving
              || !employeeId.trim()
            }

            onClick={() =>
              void handleSaveChanges()
            }
          >
            {saving
              ? 'Saving...'
              : 'Confirm'}
          </Button>

        </DialogActions>
      </Dialog>
      <Snackbar
        open={
          Boolean(editError)
        }

        autoHideDuration={
          4000
        }

        onClose={() =>
          setEditError('')
        }

        anchorOrigin={{
          vertical:
            'top',

          horizontal:
            'center',
        }}
      >
        <Alert
          severity="warning"
          variant="filled"

          onClose={() =>
            setEditError('')
          }
        >
          {editError}
        </Alert>
      </Snackbar>

    </ExcelColumnFilterProvider>
  )
}