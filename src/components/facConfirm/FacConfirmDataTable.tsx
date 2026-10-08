import {
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
  type Ref,
} from 'react'

import {
  Box,
  LinearProgress,
  Tooltip,
  alpha,
} from '@mui/material'

import type {
  Theme,
} from '@mui/material/styles'

import EditRoundedIcon
  from '@mui/icons-material/EditRounded'

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
  FacConfirmNoRowsOverlay,
} from './FacConfirmNoRowsOverlay'

import {
  scrollToFieldCluster,
} from './facConfirmGridScroll'

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

// Cho trang điều khiển thay đổi chưa lưu (vd khi đổi công đoạn)
export interface FacConfirmDataTableHandle {
  hasChanges: boolean
  changeCount: number
  saving: boolean

  // true khi lưu xong (hoặc không có gì để lưu)
  save: () => Promise<boolean>

  discard: () => void
}

interface FacConfirmDataTableProps {
  ref?: Ref<FacConfirmDataTableHandle>

  rows: FacConfirmRow[]
  confirmedProcesses: FacConfirmConfirmedProcess[]

  // Đang tải (có thể đang hiện dữ liệu cũ) => thanh tiến độ mỏng
  loading: boolean

  // Lần tải đầu, chưa có dữ liệu => skeleton rows
  initialLoading: boolean

  // Đang hiện dữ liệu của bộ lọc trước => chưa cho sửa
  stale: boolean

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
  ref,
  rows,
  confirmedProcesses,
  loading,
  initialLoading,
  stale,

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
  //
  // Tính trên rows gốc: quy tắc chỉ phụ thuộc cờ của dòng,
  // không phụ thuộc giá trị ô => sửa ô không tính lại.
  // =======================================================

  const editableCoverage = useMemo(
    () => getEditableFieldCoverage(
      rows,
      highlightProcGrp,
    ),
    [rows, highlightProcGrp],
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
        const allFields =
          new Set(allFieldsKey.split(','))

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

          // Cột cần xác nhận ở mọi dòng: icon bút trước tên cột
          const showEditIcon =
            allFields.has(column.field)

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

            ...(showEditIcon && renderHeader
              ? {
                renderHeader: (
                  params: Parameters<typeof renderHeader>[0],
                ) => (
                  <Box
                    component="span"
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 0.5,
                      width: '100%',
                      height: '100%',
                      minWidth: 0,
                    }}
                  >
                    <EditRoundedIcon
                      sx={{
                        fontSize: 14,
                        flexShrink: 0,
                      }}
                    />
                    {renderHeader(params)}
                  </Box>
                ),
              }
              : {}),

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
        allFieldsKey,
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

      // Tour đo vị trí ngay sau khi cuộn => cuộn tức thì
      scrollToFieldCluster(
        api,
        tourFields,
        { onlyIfHidden: true },
      )
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
  // ĐỔI CÔNG ĐOẠN: CUỘN MƯỢT TỚI CỤM CỘT
  //
  // highlightProcGrp đổi khi dữ liệu công đoạn mới đã hiển thị.
  // Chỉ cuộn khi cụm cột đang nằm ngoài vùng nhìn thấy.
  // =======================================================

  const tourFieldsRef = useRef(tourFields)

  useEffect(() => {
    tourFieldsRef.current = tourFields
  }, [tourFields])

  const previousProcGrpRef = useRef(highlightProcGrp)

  useEffect(() => {
    if (previousProcGrpRef.current === highlightProcGrp) {
      return
    }

    previousProcGrpRef.current = highlightProcGrp

    // Chờ DataGrid vẽ cột mới rồi mới đo vị trí
    const frame = requestAnimationFrame(() => {
      const api = apiRef.current

      if (!api) {
        return
      }

      scrollToFieldCluster(
        api,
        tourFieldsRef.current,
        {
          onlyIfHidden: true,
          behavior: 'smooth',
        },
      )
    })

    return () => cancelAnimationFrame(frame)
  }, [
    apiRef,
    highlightProcGrp,
  ])

  // =======================================================
  // CONFIRM ALL CHANGES
  // =======================================================
  const handleSaveChanges =
    useCallback(
      async (): Promise<boolean> => {

        if (!hasChanges) {
          return true
        }

        if (saving) {
          return false
        }

        // MSNV lấy từ tài khoản đang đăng nhập
        const employeeId =
          getCurrentEmployeeId()

        if (!employeeId) {
          setEditError(
            'Không xác định được tài khoản, vui lòng đăng nhập lại.',
          )

          return false
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

          return false
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

          return true

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

          return false

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
          stale
          || (
            event.key !== 'Delete'
            && event.key !== 'Backspace'
          )
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
        stale,
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
      !stale
      && canEditCell(
        params.row,
        params.field,
      ),
    [
      canEditCell,
      stale,
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
  // HANDLE CHO TRANG
  // =======================================================

  useImperativeHandle(
    ref,
    () => ({
      hasChanges,
      changeCount,
      saving,
      save: handleSaveChanges,
      discard: handleCancelChanges,
    }),
    [
      changeCount,
      handleCancelChanges,
      handleSaveChanges,
      hasChanges,
      saving,
    ],
  )


  // =======================================================
  // TẢI DỮ LIỆU
  //
  // Có dòng để hiện (kể cả dữ liệu cũ) => thanh mỏng, không che bảng.
  // Chưa có dòng nào => skeleton (tránh hiện "Không có dữ liệu" khi đang tải).
  // =======================================================

  const showSkeleton =
    initialLoading
    || (loading && rows.length === 0)


  // =======================================================
  // KHÔNG CÓ DỮ LIỆU
  // =======================================================

  const hasExcelFilters =
    excelFilters.length > 0

  const noRowsOverlay = useMemo(
    () => function FacConfirmTableNoRowsOverlay() {
      return (
        <FacConfirmNoRowsOverlay
          hasFilters={hasExcelFilters}
          onClearFilters={handleClearFilters}
        />
      )
    },
    [
      handleClearFilters,
      hasExcelFilters,
    ],
  )


  // =======================================================
  // STYLES
  //
  // Dựng một lần theo coverage / công đoạn (không theo từng render).
  // Thứ tự ưu tiên (thấp -> cao):
  //   dải cột < ô trống cần nhập < ô đã sửa < ô bị quy tắc khóa (sọc)
  // =======================================================

  const tableSx = useMemo(
    () => (theme: Theme) => {

      const isDark =
        theme.palette.mode === 'dark'

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

      const colorTransition =
        'background-color 200ms ease'

      const allFields =
        allFieldsKey.split(',').filter(Boolean)

      const someFields =
        someFieldsKey.split(',').filter(Boolean)


      const headerStyles:
        Record<string, object> = {}

      // Dải cột: mọi ô của cột cần xác nhận, kể cả ô đã có giá trị
      const columnBandStyles:
        Record<string, object> = {}


      if (
        highlightProcGrp
      ) {

        const activeColor =
          processColors[
          highlightProcGrp
          ]


        allFields.forEach(
          (
            field,
          ) => {

            headerStyles[
              `& .MuiDataGrid-columnHeader[data-field="${field}"]`
            ] = {

              backgroundColor:
                alpha(
                  activeColor,
                  isDark ? 0.18 : 0.10,
                ),

              color:
                activeColor,

              fontWeight:
                800,

              // Viền dưới bằng shadow => không đổi chiều cao tiêu đề
              boxShadow:
                `inset 0 -2px 0 ${activeColor}`,

              transition:
                colorTransition,
            }

            columnBandStyles[
              `& .MuiDataGrid-cell[data-field="${field}"]`
            ] = {

              backgroundColor:
                alpha(
                  activeColor,
                  isDark ? 0.07 : 0.04,
                ),

              transition:
                colorTransition,
            }
          },
        )


        // Sửa được ở một số dòng: nền nhạt hơn, gạch chân chấm, viền dưới nét đứt
        someFields.forEach(
          (
            field,
          ) => {

            headerStyles[
              `& .MuiDataGrid-columnHeader[data-field="${field}"]`
            ] = {

              backgroundColor:
                alpha(
                  activeColor,
                  isDark ? 0.09 : 0.05,
                ),

              backgroundImage:
                `linear-gradient(to right, ${activeColor} 0 4px, transparent 4px 7px)`,

              backgroundSize:
                '7px 2px',

              backgroundPosition:
                'left bottom',

              backgroundRepeat:
                'repeat-x',

              color:
                activeColor,

              fontWeight:
                700,

              transition:
                colorTransition,

              '& [role="button"] > span:first-of-type': {
                textDecoration: 'underline dotted',
                textUnderlineOffset: '3px',
              },
            }

            columnBandStyles[
              `& .MuiDataGrid-cell[data-field="${field}"]`
            ] = {

              backgroundColor:
                alpha(
                  activeColor,
                  isDark ? 0.05 : 0.025,
                ),

              transition:
                colorTransition,
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
                      isDark ? 0.18 : 0.10,
                    ),

                  transition:
                    colorTransition,
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
                        isDark ? 0.12 : 0.07,
                      ),

                    transition:
                      colorTransition,
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

        position:
          'relative',

        width:
          '100%',

        height:
          '100%',

        minHeight:
          0,


        // Dải cột đứng trước => các style ô bên dưới đè lên
        ...columnBandStyles,

        ...editedCellStyles,

        ...editableCellStyles,

        // Sọc chéo thấy được cả khi ô trống, đè lên dải cột
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


        '@media (prefers-reduced-motion: reduce)': {
          '& .MuiDataGrid-cell, & .MuiDataGrid-columnHeader': {
            transition: 'none',
          },
        },
      }
    },
    [
      allFieldsKey,
      highlightProcGrp,
      someFieldsKey,
    ],
  )

  // Con trỏ khi kéo fill handle: tách riêng để style bảng không dựng lại
  const dragSx = useMemo(
    () => ({
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
          ? 'none' as const
          : undefined,
    }),
    [
      dragDirection,
      isDragging,
    ],
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
        onPointerDownCapture={
          stale
            ? undefined
            : handlePointerDown
        }
        onPointerMoveCapture={handlePointerMove}
        onPointerUpCapture={handlePointerUp}
        onPointerCancelCapture={handlePointerCancel}
        sx={[
          tableSx,
          dragSx,
        ]}
      >

        {/* Đang tải trên dữ liệu cũ: thanh mỏng, không che bảng */}
        {loading && !showSkeleton && (
          <LinearProgress
            aria-label="Đang tải dữ liệu"
            sx={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              height: 2,
              zIndex: 5,
              borderTopLeftRadius: 4,
              borderTopRightRadius: 4,
            }}
          />
        )}

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
            showSkeleton
          }

          loadingOverlayVariant="skeleton"

          noRowsOverlay={
            noRowsOverlay
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
