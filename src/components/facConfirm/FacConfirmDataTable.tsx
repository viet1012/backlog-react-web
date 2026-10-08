import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react'

import {
  Box,
  Tooltip,
  alpha,
} from '@mui/material'

import SaveRoundedIcon
  from '@mui/icons-material/SaveRounded'

import UndoRoundedIcon
  from '@mui/icons-material/UndoRounded'



import {
  GridCellEditStopReasons,
  GridCellModes,
  GridToolbarColumnsButton,
  GridToolbarContainer,
  type GridEventListener,
  type GridColumnVisibilityModel,
  type GridPaginationModel,
  type GridSortModel,
  useGridApiRef,
  type GridCellParams,
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
  getEditableFieldCoverage,
  getEditableFields,
  getFieldRuleDescription,
} from '../../config/facConfirmEditRules'

import {
  getFacConfirmFilterOptions,
  saveFacConfirmProcessTimes,
} from '../../services/facConfirmService'

import {
  getCurrentEmployeeId,
} from '../../services/authService'

import {
  preventColumnHeaderSort,
} from '../../theme/dataGridHeaderStyles'

import type {
  FacConfirmClassify,
  FacConfirmConfirmedProcess,
  FacConfirmEditableField,
  FacConfirmFilterItem,
  FacConfirmHeatType,
  FacConfirmProcessGroup,
  FacConfirmRow,
} from '../../types/facConfirm'

import {
  getFacConfirmColumns,
} from './facConfirmColumns'

import {
  FacConfirmEditErrorSnackbar,
} from './FacConfirmEditErrorSnackbar'

import {
  useFacConfirmCellEditState,
} from './hooks/useFacConfirmCellEditState'

import {
  useFacConfirmFillHandle,
} from './hooks/useFacConfirmFillHandle'

import {
  FAC_GUIDE_FOCUS_EDIT_COLUMNS_EVENT,
  FAC_TOUR_EDIT_COLUMN_CLASS,
} from './guide/facConfirmGuideEvents'

import { AppButton } from '../common/AppButton'
import { ClearButton } from '../common/ClearButton'

interface FacConfirmDataTableProps {
  rows: FacConfirmRow[]
  confirmedProcesses: FacConfirmConfirmedProcess[]
  loading: boolean

  div: string
  expD: string

  procGrp: FacConfirmProcessGroup
  classify?: FacConfirmClassify
  heatType: FacConfirmHeatType

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
  activeFilterCount: number
  onConfirm: () => void
  onCancelChanges: () => void
  onClearFilters: () => void
}


function FacConfirmToolbar({
  hasChanges,
  saving,
  changeCount,
  activeFilterCount,
  onConfirm,
  onCancelChanges,
  onClearFilters,
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
      <Box
        sx={{
          display: 'flex',
          gap: 0.75,
        }}
      >
        {hasChanges && (
          <Box
            data-tour="fac-confirm-actions"
            sx={{
              display: 'flex',
              gap: 0.75,
            }}
          >
            <AppButton
              appearance="action"
              loading={saving}
              icon={!saving ? <SaveRoundedIcon /> : undefined}
              onClick={onConfirm}
            >
              {saving
                ? 'Saving...'
                : `Confirm Changes (${changeCount})`}
            </AppButton>

            <AppButton
              disabled={saving}
              icon={<UndoRoundedIcon />}
              onClick={onCancelChanges}
            >
              Cancel Changes
            </AppButton>
          </Box>
        )}
      </Box>

      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 0.75,
        }}
      >
        {activeFilterCount > 0 && (
          <ClearButton
            mode="clearAll"
            onClick={onClearFilters}
          />
        )}

        <Box
          component="span"
          data-tour="fac-columns"
          sx={{
            display: 'inline-flex',
          }}
        >
          <GridToolbarColumnsButton />
        </Box>
      </Box>
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
  classify,
  heatType,

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
        request: ExcelFilterOptionsRequest,
        signal?: AbortSignal,
      ) =>
        getFacConfirmFilterOptions(
          {
            ...request,
            div,
            expD,
            procGrp,
            classify,
            heatType,
          },
          signal,
        ),
      [
        div,
        expD,
        procGrp,
        classify,
        heatType,
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
  // CELL EDIT STATE
  // =======================================================

  const {
    getCellClassName,
    canEditCell,
    processRowUpdate,
    applyPendingChangesToRows,
    pendingChanges,
    pendingProcesses,
    hasChanges,
    changeCount,
    getRestoreRows,
    clearChanges,
  } = useFacConfirmCellEditState({
    activeProcess:
      highlightProcGrp,

    confirmedProcesses,
  })

  const displayRows = useMemo(
    () => applyPendingChangesToRows(rows),
    [applyPendingChangesToRows, rows],
  )


  // =======================================================
  // QUYỀN SỬA THEO DÒNG ĐANG HIỂN THỊ
  //
  // allFields : sửa được ở mọi dòng  -> tô đậm tiêu đề
  // someFields: sửa được ở một số dòng -> tô nhạt + tooltip
  // =======================================================

  const editableCoverage = useMemo(
    () => getEditableFieldCoverage(
      displayRows,
      highlightProcGrp,
    ),
    [displayRows, highlightProcGrp],
  )

  // Key chuỗi để columns không tạo lại mỗi lần sửa ô
  const allFieldsKey =
    editableCoverage.allFields.join(',')

  const someFieldsKey =
    editableCoverage.someFields.join(',')

  // Cột chiếu sáng ở tour Bước 9 (allFields + someFields)
  const tourFields = useMemo(
    () => [
      allFieldsKey,
      someFieldsKey,
    ].join(',').split(',').filter(Boolean),
    [allFieldsKey, someFieldsKey],
  )


  // =======================================================
  // COLUMNS
  // =======================================================

  const columns =
    useMemo(
      () => {
        const someFields =
          new Set(someFieldsKey.split(','))

        return getFacConfirmColumns(
          highlightProcGrp,
        ).map((column) => {

          if (
            !highlightProcGrp
            || !tourFields.includes(column.field)
          ) {
            return column
          }

          // Tour (Bước 9) chiếu sáng tiêu đề các cột nhập được.
          // Nối thêm vào class sẵn có, không ghi đè.
          const current =
            column.headerClassName

          const description =
            someFields.has(column.field)
              ? getFieldRuleDescription(
                highlightProcGrp,
                column.field as FacConfirmEditableField,
              )
              : null

          const renderHeader =
            column.renderHeader

          return {
            ...column,

            headerClassName:
              typeof current === 'function'
                ? (
                  params: Parameters<typeof current>[0],
                ) => [
                  current(params),
                  FAC_TOUR_EDIT_COLUMN_CLASS,
                ].filter(Boolean).join(' ')
                : [
                  current,
                  FAC_TOUR_EDIT_COLUMN_CLASS,
                ].filter(Boolean).join(' '),

            // Cột chỉ sửa được ở một số dòng: tooltip theo quy tắc
            ...(description && renderHeader
              ? {
                renderHeader: (
                  params: Parameters<typeof renderHeader>[0],
                ) => (
                  <Tooltip
                    title={description}
                    placement="top"
                    arrow
                  >
                    <Box
                      component="span"
                      sx={{
                        display: 'flex',
                        width: '100%',
                        height: '100%',
                        minWidth: 0,
                      }}
                    >
                      {renderHeader(params)}
                    </Box>
                  </Tooltip>
                ),
              }
              : {}),
          }
        })
      },
      [
        highlightProcGrp,
        someFieldsKey,
        tourFields,
      ],
    )

  const apiRef = useGridApiRef()


  // =======================================================
  // GUIDE TOUR: CUỘN TỚI CỘT NHẬP ĐƯỢC
  // =======================================================

  useEffect(() => {
    const handleFocusEditColumns = () => {
      const api = apiRef.current

      if (!api || !highlightProcGrp) {
        return
      }

      const colIndexes =
        tourFields
          .map((field) =>
            api.getColumnIndex(field, true),
          )
          .filter((colIndex) => colIndex >= 0)

      if (colIndexes.length === 0) {
        return
      }

      // Cuộn tới cột cuối rồi cột đầu
      // => cả cụm cột hiện ra (nếu đủ rộng), cột đầu luôn thấy.
      api.scrollToIndexes({
        colIndex: Math.max(...colIndexes),
      })

      api.scrollToIndexes({
        colIndex: Math.min(...colIndexes),
      })
    }

    window.addEventListener(
      FAC_GUIDE_FOCUS_EDIT_COLUMNS_EVENT,
      handleFocusEditColumns,
    )

    return () => window.removeEventListener(
      FAC_GUIDE_FOCUS_EDIT_COLUMNS_EVENT,
      handleFocusEditColumns,
    )
  }, [
    apiRef,
    highlightProcGrp,
    tourFields,
  ])

  // =======================================================
  // CONFIRM ALL CHANGES
  // =======================================================
  const handleSaveChanges =
    useCallback(
      async () => {

        if (
          !hasChanges
          || saving
        ) {
          return
        }

        // MSNV lấy từ tài khoản đang đăng nhập
        const employeeId =
          getCurrentEmployeeId()

        if (!employeeId) {
          setEditError(
            'Không xác định được tài khoản, vui lòng đăng nhập lại.',
          )

          return
        }

        // Thay đổi chưa lưu không bị xóa khi đổi công đoạn
        // => chỉ lưu khi mọi thay đổi được sửa ở công đoạn đang chọn.
        if (
          !highlightProcGrp
          || pendingProcesses.some(
            (process) => process !== highlightProcGrp,
          )
        ) {
          setEditError(
            'Có thay đổi chưa lưu của công đoạn khác. '
            + 'Vui lòng chọn lại công đoạn đó để lưu, hoặc Cancel Changes.',
          )

          return
        }

        try {

          setSaving(true)

          await saveFacConfirmProcessTimes({
            employeeId,

            procGrp:
              highlightProcGrp,

            changes:
              pendingChanges,
          })

          clearChanges()

          onSaved?.()

        } catch (error) {

          console.error(
            'Save Fac Confirm failed:',
            error,
          )

          // Giữ nguyên các thay đổi chưa lưu
          setEditError(
            error instanceof Error
              ? error.message
              : 'Unable to save Fac Confirm.',
          )

        } finally {

          setSaving(false)
        }
      },
      [
        hasChanges,
        saving,
        highlightProcGrp,
        pendingChanges,
        pendingProcesses,
        clearChanges,
        onSaved,
      ],
    )

  const handleOpenConfirm =
    useCallback(
      () => {
        void handleSaveChanges()
      },
      [
        handleSaveChanges,
      ],
    )

  const handleCloseEditError =
    useCallback(
      () => setEditError(''),
      [],
    )



  // =======================================================
  // ROW UPDATE ERROR
  // =======================================================

  const handleProcessRowUpdateError =
    useCallback(
      (
        error: unknown,
      ) => {

        const api = apiRef.current

        if (api && highlightProcGrp) {
          for (const id of api.getAllRowIds()) {
            const row =
              api.getRow(id) as FacConfirmRow | null

            if (!row) {
              continue
            }

            const editingField = getEditableFields(
              row,
              highlightProcGrp,
            ).find(
              (field) =>
                api.getCellMode(id, field)
                === GridCellModes.Edit,
            )

            if (editingField) {
              api.stopCellEditMode({
                id,
                field: editingField,
                ignoreModifications: true,
              })

              break
            }
          }
        }

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
      [
        apiRef,
        highlightProcGrp,
      ],
    )

  const handleCancelChanges =
    useCallback(
      () => {
        if (saving) {
          return
        }

        try {
          const api = apiRef.current

          if (!api) {
            return
          }

          const restoreRows = getRestoreRows()

          // DataGrid Community accepts one row per updateRows call.
          restoreRows.forEach((row) => {
            api.updateRows([row])
          })

          clearChanges()
        } catch (error) {
          handleProcessRowUpdateError(error)
        }
      },
      [
        apiRef,
        clearChanges,
        getRestoreRows,
        handleProcessRowUpdateError,
        saving,
      ],
    )


  const handleCellKeyDown =
    useCallback<GridEventListener<'cellKeyDown'>>(
      (
        params,
        event,
      ) => {

        if (
          event.key !== 'Delete'
          && event.key !== 'Backspace'
        ) {
          return
        }

        if (
          !canEditCell(
            params.row,
            params.field,
          )
        ) {
          return
        }

        if (
          params.row[
          params.field as keyof FacConfirmRow
          ] == null
        ) {
          return
        }

        const api =
          apiRef.current

        if (!api) {
          return
        }

        event.defaultMuiPrevented = true

        try {

          const oldRow =
            params.row

          const newRow = {
            ...oldRow,

            [params.field]:
              null,
          } as FacConfirmRow

          const updatedRow =
            processRowUpdate(
              newRow,
              oldRow,
            )

          api.updateRows([
            updatedRow,
          ])

        } catch (error) {

          handleProcessRowUpdateError(
            error,
          )
        }
      },
      [
        apiRef,
        canEditCell,
        processRowUpdate,
        handleProcessRowUpdateError,
      ],
    )
  // =======================================================
  // TOOLBAR WRAPPER
  // =======================================================

  const handleClearFilters =
    useCallback(
      () => {
        onExcelFiltersChange([])
      },
      [
        onExcelFiltersChange,
      ],
    )

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

          activeFilterCount={
            excelFilters.length
          }

          onConfirm={
            handleOpenConfirm
          }

          onCancelChanges={
            handleCancelChanges
          }

          onClearFilters={
            handleClearFilters
          }
        />
      ),
      [
        hasChanges,
        saving,
        changeCount,
        excelFilters.length,
        handleCancelChanges,
        handleClearFilters,
        handleOpenConfirm,
      ],
    )

  const isCellEditable = useCallback(
    (
      params: GridCellParams<FacConfirmRow>,
    ): boolean =>
      canEditCell(
        params.row,
        params.field,
      ),
    [
      canEditCell,
    ],
  )

  const handleCellEditStop =
    useCallback<GridEventListener<'cellEditStop'>>(
      (params, event) => {
        if (
          params.reason ===
          GridCellEditStopReasons.cellFocusOut
        ) {
          event.defaultMuiPrevented = true
        }
      },
      [],
    )

  const {
    getFillClassName,
    handleCellClick,
    handlePointerDown,
    handlePointerMove,
    handlePointerUp,
    handlePointerCancel,
    dragDirection,
    isDragging,
  } = useFacConfirmFillHandle({
    activeProcess: highlightProcGrp,
    apiRef,
    processRowUpdate,
    onError: handleProcessRowUpdateError,
  })

  const getFacConfirmCellClassName = useCallback(
    (params: Parameters<typeof getCellClassName>[0]) => [
      getCellClassName(params),
      getFillClassName(params),
    ].filter(Boolean).join(' '),
    [getCellClassName, getFillClassName],
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
        onPointerDownCapture={handlePointerDown}
        onPointerMoveCapture={handlePointerMove}
        onPointerUpCapture={handlePointerUp}
        onPointerCancelCapture={handlePointerCancel}
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


            editableCoverage.allFields.forEach(
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


            // Sửa được ở một số dòng: nền nhạt hơn, gạch chân chấm
            editableCoverage.someFields.forEach(
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
                        ? 0.09
                        : 0.05,
                    ),

                  color:
                    activeColor,

                  fontWeight:
                    700,

                  transition:
                    'background-color 180ms ease',

                  '& [role="button"] > span:first-of-type': {
                    textDecoration: 'underline dotted',
                    textUnderlineOffset: '3px',
                  },
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
                    `& .MuiDataGrid-cell${className}`,
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


          // Ô trống sửa được ở công đoạn đang chọn
          // (canEditCell: gồm quy tắc + khóa Backlog): nền nhạt màu công đoạn.
          // Ô quy tắc khóa: sọc chéo (xem fac-confirm-rule-locked).
          //
          // Ô đã sửa chưa lưu: nền đậm hơn (editedCellStyles)
          // + viền trái 2px màu công đoạn.
          // Gộp với shadow của fill handle để không bị ghi đè.
          const editableCellStyles =
            Object.fromEntries(

              (
                Object.keys(
                  processColors,
                ) as FacConfirmProcessGroup[]
              ).flatMap(
                (
                  process,
                ) => {

                  const color =
                    processColors[
                    process
                    ]

                  const pendingClassName =
                    `.fac-confirm-edited-${process.toLowerCase()}.fac-confirm-pending`

                  const pendingShadow =
                    `inset 2px 0 0 ${color}`

                  return [
                    [
                      `& .MuiDataGrid-cell.fac-confirm-editable-${process.toLowerCase()}`,
                      {

                        backgroundColor:
                          alpha(
                            color,

                            theme.palette.mode ===
                              'dark'
                              ? 0.12
                              : 0.07,
                          ),
                      },
                    ],

                    [
                      `& .MuiDataGrid-cell${pendingClassName}`,
                      {
                        boxShadow:
                          pendingShadow,
                      },
                    ],

                    [
                      `& .MuiDataGrid-cell${pendingClassName}.fac-confirm-fill-source`,
                      {
                        boxShadow:
                          `${pendingShadow}, `
                          + `inset 0 0 0 1.5px ${theme.palette.primary.main}`,
                      },
                    ],

                    [
                      `& .MuiDataGrid-cell${pendingClassName}.fac-confirm-fill-range`,
                      {
                        boxShadow:
                          `${pendingShadow}, `
                          + `inset 0 0 0 9999px ${alpha(theme.palette.primary.main, 0.08)}`,
                      },
                    ],
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

            cursor:
              dragDirection === 'horizontal'
                ? 'ew-resize'
                : dragDirection === 'vertical'
                  ? 'ns-resize'
                  : isDragging
                    ? 'crosshair'
                    : undefined,

            userSelect:
              isDragging
                ? 'none'
                : undefined,


            ...editedCellStyles,

            ...editableCellStyles,

            // Sọc chéo thấy được cả khi ô trống
            '& .MuiDataGrid-cell.fac-confirm-rule-locked': {
              backgroundImage:
                `repeating-linear-gradient(`
                + `135deg, `
                + `${theme.palette.action.selected} 0 4px, `
                + `transparent 4px 9px)`,

              color:
                theme.palette.text.disabled,

              cursor:
                'not-allowed',
            },



            '& .MuiDataGrid-cell.fac-confirm-fill-source': {
              position: 'relative',
              overflow: 'visible',

              boxShadow:
                `inset 0 0 0 1.5px ${theme.palette.primary.main}`,
            },

            '& .MuiDataGrid-cell.fac-confirm-fill-source::after': {
              content: '""',

              position: 'absolute',

              right: -4,
              bottom: -4,

              width: 8,
              height: 8,

              boxSizing: 'border-box',

              backgroundColor:
                theme.palette.primary.main,

              border: `1.5px solid ${theme.palette.background.paper}`,

              borderRadius: '1px',

              cursor: 'crosshair',

              zIndex: 10,

              pointerEvents: 'auto',
            },

            '& .MuiDataGrid-cell--editing.fac-confirm-fill-source::after': {
              display: 'none',
            },

            '& .MuiDataGrid-cell.fac-confirm-fill-range': {
              boxShadow: `inset 0 0 0 9999px ${alpha(theme.palette.primary.main, 0.08)}`,
            },

            '& .MuiDataGrid-row:hover .MuiDataGrid-cell.fac-confirm-edited-rough': {
              backgroundColor:
                alpha(
                  processColors.Rough,
                  0.15,
                ),
            },

            '& .MuiDataGrid-row:hover .MuiDataGrid-cell.fac-confirm-edited-heat': {
              backgroundColor:
                alpha(
                  processColors.Heat,
                  0.15,
                ),
            },

            '& .MuiDataGrid-row:hover .MuiDataGrid-cell.fac-confirm-edited-fine': {
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

          apiRef={apiRef}

          rows={
            displayRows
          }

          columns={
            columns
          }

          isCellEditable={isCellEditable}

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
            getFacConfirmCellClassName
          }

          onCellClick={handleCellClick}

          onCellKeyDown={
            handleCellKeyDown
          }

          processRowUpdate={
            processRowUpdate
          }

          onProcessRowUpdateError={
            handleProcessRowUpdateError
          }

          onCellEditStop={
            handleCellEditStop
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

      <FacConfirmEditErrorSnackbar
        message={editError}
        onClose={handleCloseEditError}
      />

    </ExcelColumnFilterProvider>
  )
}
