import {
  useCallback,
  useMemo,
  useRef,
  useState,
} from 'react'

import type {
  GridCellParams,
} from '@mui/x-data-grid'

import {
  FAC_CONFIRM_PROCESS_CONFIG,
  getFacConfirmProcessIdentityByBackendName,
} from '../../../config/facConfirmProcessConfig'

import type {
  FacConfirmConfirmedProcess,
  FacConfirmEditableField,
  FacConfirmProcessGroup,
  FacConfirmProcessTimeChange,
  FacConfirmRow,
} from '../../../types/facConfirm'

import {
  normalizeFacConfirmDateTime,
  normalizeFacConfirmDateTimeForApi,
} from '../../../utils/facConfirmDateTime'

interface Props {
  activeProcess: FacConfirmProcessGroup | null
  confirmedProcesses: FacConfirmConfirmedProcess[]
}

interface ValidatedCellChange {
  field: FacConfirmEditableField
  key: string
  baseline: CellBaseline
  nextValue: string | null
}

interface CellBaseline {
  rowId: string
  aufnr: string
  zglobalCode: string | null
  field: FacConfirmEditableField
  originalValue: string | null
  normalizedValue: string | null
}

type FacConfirmRestoreRow = {
  id: string
  aufnr: string
  zglobalCode: string | null
} & Partial<Pick<FacConfirmRow, FacConfirmEditableField>>

const editedCellClasses: Record<FacConfirmProcessGroup, string> = {
  Rough: 'fac-confirm-edited-rough',
  Heat: 'fac-confirm-edited-heat',
  Fine: 'fac-confirm-edited-fine',
}

function getCellKey(
  row: FacConfirmRow,
  field: string,
): string {
  return [
    getRowId(row),
    field,
  ].join('|')
}

function getRowId(
  row: FacConfirmRow,
): string {
  return [
    row.aufnr,
    row.zglobalCode ?? '',
  ].join('|')
}

function getConfirmedCellKey(
  aufnr: string,
  field: string,
): string {
  return [aufnr, field].join('|')
}

function valuesEqual(
  left: unknown,
  right: unknown,
): boolean {
  return String(left ?? '') === String(right ?? '')
}

function isEditableField(
  activeProcess: FacConfirmProcessGroup | null,
  field: string,
): field is FacConfirmEditableField {
  return activeProcess != null
    && FAC_CONFIRM_PROCESS_CONFIG[
      activeProcess
    ].columns.some(
      (editableField) =>
        editableField === field,
    )
}

function normalizeOptionalDateTime(
  value: unknown,
  field?: FacConfirmEditableField,
  row?: FacConfirmRow,
): string | null {
  if (
    value == null
    || String(value).trim() === ''
  ) {
    return null
  }

  if (!field || !row) {
    return normalizeFacConfirmDateTime(value)
  }

  return normalizeFacConfirmDateTimeForApi(
    value,
    {
      field,

      isDC53:
        row?.isDC53 === true,

      isTD:
        row?.isTD === true,

      heatStart:
        row?.heatStart,
    },
  )
}

export function useFacConfirmCellEditState({
  activeProcess,
  confirmedProcesses,
}: Props) {
  const baselineValuesRef = useRef(
    new Map<string, CellBaseline>(),
  )

  const [editedCells, setEditedCells] = useState(
    () => new Map<string, FacConfirmProcessGroup>(),
  )

  const [pendingMap, setPendingMap] = useState(
    () => new Map<string, FacConfirmProcessTimeChange>(),
  )


  const confirmedCells = useMemo(() => {
    const cells = new Map<string, FacConfirmProcessGroup>()

    confirmedProcesses.forEach((item) => {
      if (!item.confirmFnTime) {
        return
      }

      const identity = getFacConfirmProcessIdentityByBackendName(
        item.processGrp,
      )

      cells.set(
        getConfirmedCellKey(item.aufnr, identity.field),
        identity.processGroup,
      )
    })

    return cells
  }, [confirmedProcesses])

  const canEditCell = useCallback(
    (
      row: FacConfirmRow,
      field: string,
    ): boolean => {
      if (!isEditableField(activeProcess, field)) {
        return false
      }

      const value = row[field]

      const hasValue =
        value != null
        && String(value).trim() !== ''

      // =========================================
      // 1. Cell rỗng
      // => cho nhập
      // =========================================
      if (!hasValue) {
        return true
      }

      // =========================================
      // 2. Cell từ /confirmed-processes
      // => đã Fac Confirm
      // => cho sửa lại
      // =========================================
      const confirmedCell =
        confirmedCells.has(
          getConfirmedCellKey(
            row.aufnr,
            field,
          ),
        )

      if (confirmedCell) {
        return true
      }

      // =========================================
      // 3. Cell đang pending
      // => user vừa nhập nhưng chưa Confirm Changes
      // => PHẢI cho sửa tiếp
      // =========================================
      const pendingCell =
        pendingMap.has(
          getCellKey(
            row,
            field,
          ),
        )

      if (pendingCell) {
        return true
      }

      // =========================================
      // 4. Có value nhưng:
      // - không confirmed
      // - không pending
      //
      // => value từ Backlog_Main
      // => LOCK
      // =========================================
      return false
    },
    [
      activeProcess,
      confirmedCells,
      pendingMap,
    ],
  )

  const getCellClassName = useCallback(
    (params: GridCellParams<FacConfirmRow>): string => {
      const editedProcess = editedCells.get(
        getCellKey(params.row, params.field),
      )

      if (editedProcess) {
        return editedCellClasses[editedProcess]
      }

      const confirmedProcess = confirmedCells.get(
        getConfirmedCellKey(params.row.aufnr, params.field),
      )

      return confirmedProcess
        ? editedCellClasses[confirmedProcess]
        : ''
    },
    [confirmedCells, editedCells],
  )

  const processRowUpdate = useCallback(
    (
      newRow: FacConfirmRow,
      oldRow: FacConfirmRow,
    ): FacConfirmRow => {
      if (!activeProcess) {
        return oldRow
      }

      const changedFields =
        FAC_CONFIRM_PROCESS_CONFIG[
          activeProcess
        ].columns.filter(
          (field) =>
            !valuesEqual(
              oldRow[field],
              newRow[field],
            )
            && canEditCell(oldRow, field),
        )

      if (changedFields.length === 0) {
        return oldRow
      }

      // Validate every changed value before mutating local edit state.
      const validatedChanges = changedFields.map(
        (field): ValidatedCellChange => {
          const key = getCellKey(newRow, field)
          const baseline = baselineValuesRef.current.get(key) ?? {
            rowId: getRowId(oldRow),
            aufnr: oldRow.aufnr,
            zglobalCode: oldRow.zglobalCode,
            field,
            originalValue: oldRow[field],
            normalizedValue: normalizeOptionalDateTime(
              oldRow[field],
            ),
          }

          return {
            field,
            key,
            baseline,

            nextValue:
              normalizeOptionalDateTime(
                newRow[field],
                field,
                newRow,
              ),
          }
        },
      )

      validatedChanges.forEach((change) => {
        if (change.nextValue === change.baseline.normalizedValue) {
          baselineValuesRef.current.delete(change.key)
        } else {
          baselineValuesRef.current.set(
            change.key,
            change.baseline,
          )
        }
      })

      setEditedCells((current) => {
        const next = new Map(current)

        validatedChanges.forEach((change) => {
          if (
            change.nextValue === change.baseline.normalizedValue
          ) {
            next.delete(change.key)
          } else {
            next.set(change.key, activeProcess)
          }
        })

        return next
      })

      setPendingMap((current) => {
        const next = new Map(current)

        validatedChanges.forEach((change) => {
          if (
            change.nextValue === change.baseline.normalizedValue
          ) {
            next.delete(change.key)
          } else {
            next.set(change.key, {
              aufnr: newRow.aufnr,
              field: change.field,
              value: change.nextValue,
            })
          }
        })

        return next
      })

      return newRow
    },
    [
      activeProcess,
      canEditCell,
    ],
  )

  const pendingChanges = useMemo(
    () => [...pendingMap.values()],
    [pendingMap],
  )

  const applyPendingChangesToRows =
    useCallback(
      (
        rows: FacConfirmRow[],
      ): FacConfirmRow[] => {

        if (pendingMap.size === 0) {
          return rows
        }

        return rows.map((row) => {
          const nextRow: FacConfirmRow = {
            ...row,
          }

          let changed = false

          Object.values(
            FAC_CONFIRM_PROCESS_CONFIG,
          ).forEach((config) => {
            config.columns.forEach((field) => {
              const pending = pendingMap.get(
                getCellKey(row, field),
              )

              if (!pending) {
                return
              }

              nextRow[field] = pending.value
              changed = true
            })
          })

          return changed
            ? nextRow
            : row
        })
      },
      [pendingMap],
    )

  const getRestoreRows = useCallback((): FacConfirmRestoreRow[] => {
    const restoreRows = new Map<string, FacConfirmRestoreRow>()

    baselineValuesRef.current.forEach((baseline) => {
      const currentRow = restoreRows.get(baseline.rowId) ?? {
        id: baseline.rowId,
        aufnr: baseline.aufnr,
        zglobalCode: baseline.zglobalCode,
      }

      restoreRows.set(baseline.rowId, {
        ...currentRow,
        [baseline.field]: baseline.originalValue,
      })
    })

    return [...restoreRows.values()]
  }, [])

  const clearChanges = useCallback(() => {
    baselineValuesRef.current.clear()
    setEditedCells(new Map())
    setPendingMap(new Map())
  }, [])

  return {
    getCellClassName,
    canEditCell,
    processRowUpdate,
    applyPendingChangesToRows,
    pendingChanges,
    hasChanges: pendingChanges.length > 0,
    changeCount: pendingChanges.length,
    getRestoreRows,
    clearChanges,
  }


}
