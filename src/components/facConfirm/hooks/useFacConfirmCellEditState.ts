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
  normalizeFacConfirmDateTimeForApi,
} from '../../../utils/facConfirmDateTime'

interface Props {
  activeProcess: FacConfirmProcessGroup | null
  confirmedProcesses: FacConfirmConfirmedProcess[]
}

interface ValidatedCellChange {
  field: FacConfirmEditableField
  key: string
  baselineValue: string | null
  nextValue: string | null
}

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
    row.aufnr,
    row.zglobalCode ?? '',
    field,
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

function normalizeOptionalDateTime(
  value: unknown,
): string | null {
  if (value == null || String(value).trim() === '') {
    return null
  }

  return normalizeFacConfirmDateTimeForApi(value)
}

export function useFacConfirmCellEditState({
  activeProcess,
  confirmedProcesses,
}: Props) {
  const baselineValuesRef = useRef(
    new Map<string, string | null>(),
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
        return newRow
      }

      const changedFields = FAC_CONFIRM_PROCESS_CONFIG[
        activeProcess
      ].columns.filter((field) =>
        !valuesEqual(oldRow[field], newRow[field]),
      )

      if (changedFields.length === 0) {
        return newRow
      }

      // Validate every changed value before mutating local edit state.
      const validatedChanges = changedFields.map(
        (field): ValidatedCellChange => {
          const key = getCellKey(newRow, field)
          const existingBaseline = baselineValuesRef.current.get(key)
          const baselineValue = baselineValuesRef.current.has(key)
            ? existingBaseline ?? null
            : normalizeOptionalDateTime(oldRow[field])

          return {
            field,
            key,
            baselineValue,
            nextValue: normalizeOptionalDateTime(newRow[field]),
          }
        },
      )

      validatedChanges.forEach((change) => {
        if (change.nextValue === change.baselineValue) {
          baselineValuesRef.current.delete(change.key)
        } else {
          baselineValuesRef.current.set(
            change.key,
            change.baselineValue,
          )
        }
      })

      setEditedCells((current) => {
        const next = new Map(current)

        validatedChanges.forEach((change) => {
          if (
            change.nextValue == null
            || change.nextValue === change.baselineValue
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
            change.nextValue == null
            || change.nextValue === change.baselineValue
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
    [activeProcess],
  )

  const pendingChanges = useMemo(
    () => [...pendingMap.values()],
    [pendingMap],
  )

  const clearChanges = useCallback(() => {
    baselineValuesRef.current.clear()
    setEditedCells(new Map())
    setPendingMap(new Map())
  }, [])

  return {
    getCellClassName,
    processRowUpdate,
    pendingChanges,
    hasChanges: pendingChanges.length > 0,
    changeCount: pendingChanges.length,
    clearChanges,
  }
}
