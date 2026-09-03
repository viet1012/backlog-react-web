import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
} from 'react'

import type {
  GridApi,
  GridCellParams,
  GridRowId,
} from '@mui/x-data-grid'

import {
  FAC_CONFIRM_PROCESS_CONFIG,
} from '../../../config/facConfirmProcessConfig'

import type {
  FacConfirmEditableField,
  FacConfirmProcessGroup,
  FacConfirmRow,
} from '../../../types/facConfirm'

import {
  normalizeFacConfirmDateTimeForApi,
} from '../../../utils/facConfirmDateTime'

interface FillCell {
  id: GridRowId
  field: FacConfirmEditableField
}

interface FillDrag extends FillCell {
  pointerId: number
  value: FacConfirmRow[FacConfirmEditableField]
  startX: number
  startY: number
  direction: FillDirection | null
}

type FillDirection = 'vertical' | 'horizontal'

interface Props {
  activeProcess: FacConfirmProcessGroup | null
  apiRef: React.RefObject<GridApi | null>
  processRowUpdate: (
    newRow: FacConfirmRow,
    oldRow: FacConfirmRow,
  ) => FacConfirmRow
  onError: (error: unknown) => void
}

const FILL_HANDLE_HIT_SIZE = 12
const DIRECTION_LOCK_THRESHOLD = 5

function isEditableField(
  activeProcess: FacConfirmProcessGroup | null,
  field: string,
): field is FacConfirmEditableField {
  return activeProcess != null
    && FAC_CONFIRM_PROCESS_CONFIG[activeProcess].columns.some(
      (editableField) => editableField === field,
    )
}

function getCellFromPoint(
  clientX: number,
  clientY: number,
): { id: string; field: string } | null {
  const element = document.elementFromPoint(clientX, clientY)
  const cell = element?.closest<HTMLElement>('[role="gridcell"][data-field]')
  const row = cell?.closest<HTMLElement>('[role="row"][data-id]')

  if (!cell || !row) {
    return null
  }

  return {
    id: row.dataset.id ?? '',
    field: cell.dataset.field ?? '',
  }
}

export function useFacConfirmFillHandle({
  activeProcess,
  apiRef,
  processRowUpdate,
  onError,
}: Props) {
  const [selectedCell, setSelectedCell] = useState<FillCell | null>(null)
  const [rangeIds, setRangeIds] = useState<Set<GridRowId>>(() => new Set())
  const [rangeFields, setRangeFields] = useState<Set<string>>(() => new Set())
  const [dragDirection, setDragDirection] = useState<FillDirection | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const dragRef = useRef<FillDrag | null>(null)
  const targetIdRef = useRef<GridRowId | null>(null)
  const targetFieldRef = useRef<FacConfirmEditableField | null>(null)

  const allowedFields = useMemo(
    () => new Set(activeProcess
      ? FAC_CONFIRM_PROCESS_CONFIG[activeProcess].columns
      : []),
    [activeProcess],
  )

  const cancelDrag = useCallback(() => {
    dragRef.current = null
    targetIdRef.current = null
    targetFieldRef.current = null
    setRangeIds(new Set())
    setRangeFields(new Set())
    setDragDirection(null)
    setIsDragging(false)
  }, [])

  useEffect(() => {
    if (!dragRef.current) {
      return
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault()
        cancelDrag()
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [isDragging, cancelDrag])

  const getPageRowIds = useCallback(() => {
    const api = apiRef.current
    if (!api) {
      return []
    }

    return api.getSortedRowIds().filter((id) => api.getRow(id) != null)
  }, [apiRef])

  const updateVerticalRange = useCallback((targetId: GridRowId) => {
    const drag = dragRef.current
    if (!drag) {
      return
    }

    const ids = getPageRowIds()
    const sourceIndex = ids.indexOf(drag.id)
    const targetIndex = ids.indexOf(targetId)
    if (sourceIndex < 0 || targetIndex < 0) {
      return
    }

    const start = Math.min(sourceIndex, targetIndex)
    const end = Math.max(sourceIndex, targetIndex)
    targetIdRef.current = targetId
    setRangeIds(new Set(ids.slice(start, end + 1)))
  }, [getPageRowIds])

  const getHorizontalRange = useCallback((
    sourceField: FacConfirmEditableField,
    targetField: string,
  ): FacConfirmEditableField[] | null => {
    const visibleFields = apiRef.current?.getVisibleColumns().map(
      (column) => column.field,
    ) ?? []
    const sourceIndex = visibleFields.indexOf(sourceField)
    const targetIndex = visibleFields.indexOf(targetField)

    if (sourceIndex < 0 || targetIndex < 0) {
      return null
    }

    const start = Math.min(sourceIndex, targetIndex)
    const end = Math.max(sourceIndex, targetIndex)
    const fields = visibleFields.slice(start, end + 1)

    return fields.every((field) => allowedFields.has(field as FacConfirmEditableField))
      ? fields as FacConfirmEditableField[]
      : null
  }, [allowedFields, apiRef])

  const handleCellClick = useCallback((params: GridCellParams<FacConfirmRow>) => {
    setSelectedCell(
      isEditableField(activeProcess, params.field)
        ? { id: params.id, field: params.field }
        : null,
    )
  }, [activeProcess])

  const handlePointerDown = useCallback((event: ReactPointerEvent<HTMLElement>) => {
    if (event.button !== 0 || !selectedCell) {
      return
    }

    const cell = (event.target as Element).closest<HTMLElement>(
      '[role="gridcell"][data-field]',
    )
    if (!cell || cell.dataset.field !== selectedCell.field) {
      return
    }

    const row = cell.closest<HTMLElement>('[role="row"][data-id]')
    const rect = cell.getBoundingClientRect()
    const isHandle = row?.dataset.id === String(selectedCell.id)
      && event.clientX >= rect.right - FILL_HANDLE_HIT_SIZE
      && event.clientY >= rect.bottom - FILL_HANDLE_HIT_SIZE

    if (!isHandle || !allowedFields.has(selectedCell.field)) {
      return
    }

    const sourceRow = apiRef.current?.getRow(selectedCell.id) as FacConfirmRow | null
    if (!sourceRow) {
      return
    }

    const value = sourceRow[selectedCell.field]
    try {
      normalizeFacConfirmDateTimeForApi(value)
    } catch (error) {
      onError(error)
      return
    }

    event.preventDefault()
    event.stopPropagation()
    event.currentTarget.setPointerCapture(event.pointerId)
    dragRef.current = {
      ...selectedCell,
      pointerId: event.pointerId,
      value,
      startX: event.clientX,
      startY: event.clientY,
      direction: null,
    }
    targetIdRef.current = selectedCell.id
    targetFieldRef.current = selectedCell.field
    setRangeIds(new Set([selectedCell.id]))
    setRangeFields(new Set([selectedCell.field]))
    setDragDirection(null)
    setIsDragging(true)
  }, [allowedFields, apiRef, onError, selectedCell])

  const handlePointerMove = useCallback((event: ReactPointerEvent<HTMLElement>) => {
    const drag = dragRef.current
    if (!drag || drag.pointerId !== event.pointerId) {
      return
    }

    event.preventDefault()
    if (!drag.direction) {
      const deltaX = event.clientX - drag.startX
      const deltaY = event.clientY - drag.startY

      if (Math.hypot(deltaX, deltaY) < DIRECTION_LOCK_THRESHOLD) {
        return
      }

      drag.direction = Math.abs(deltaY) > Math.abs(deltaX)
        ? 'vertical'
        : 'horizontal'
      setDragDirection(drag.direction)
    }

    const target = getCellFromPoint(event.clientX, event.clientY)

    if (drag.direction === 'vertical') {
      if (target?.field === drag.field) {
        updateVerticalRange(target.id)
      } else {
        targetIdRef.current = null
        setRangeIds(new Set([drag.id]))
      }
      return
    }

    const fields = target?.id === String(drag.id)
      ? getHorizontalRange(drag.field, target.field)
      : null

    if (fields) {
      targetFieldRef.current = target?.field as FacConfirmEditableField
      setRangeFields(new Set(fields))
    } else {
      targetFieldRef.current = null
      setRangeFields(new Set([drag.field]))
      targetIdRef.current = null
    }
  }, [getHorizontalRange, updateVerticalRange])

  const handlePointerUp = useCallback((event: ReactPointerEvent<HTMLElement>) => {
    const drag = dragRef.current
    if (!drag || drag.pointerId !== event.pointerId) {
      return
    }

    event.preventDefault()
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId)
    }

    try {
      if (drag.direction === 'vertical') {
        const targetId = targetIdRef.current
        const ids = getPageRowIds()
        const sourceIndex = ids.indexOf(drag.id)
        const targetIndex = targetId == null ? -1 : ids.indexOf(targetId)

        if (sourceIndex < 0 || targetIndex < 0) {
          return
        }

        const start = Math.min(sourceIndex, targetIndex)
        const end = Math.max(sourceIndex, targetIndex)
        const updates: FacConfirmRow[] = []

        ids.slice(start, end + 1).forEach((id) => {
          if (id === drag.id) {
            return
          }

          const oldRow = apiRef.current?.getRow(id) as FacConfirmRow | null
          if (!oldRow) {
            return
          }

          updates.push(processRowUpdate({
            ...oldRow,
            [drag.field]: drag.value,
          }, oldRow))
        })

        // DataGrid Community accepts one row per updateRows call.
        updates.forEach((row) => apiRef.current?.updateRows([row]))
      } else if (drag.direction === 'horizontal' && targetFieldRef.current) {
        const fields = getHorizontalRange(drag.field, targetFieldRef.current)
        let updatedRow = apiRef.current?.getRow(drag.id) as FacConfirmRow | null

        fields?.forEach((field) => {
          if (!updatedRow || field === drag.field) {
            return
          }

          updatedRow = processRowUpdate({
            ...updatedRow,
            [field]: drag.value,
          }, updatedRow)
          apiRef.current?.updateRows([updatedRow])
        })
      }
    } catch (error) {
      onError(error)
    } finally {
      cancelDrag()
    }
  }, [apiRef, cancelDrag, getHorizontalRange, getPageRowIds, onError, processRowUpdate])

  const handlePointerCancel = useCallback(() => {
    cancelDrag()
  }, [cancelDrag])

  const getFillClassName = useCallback((params: GridCellParams<FacConfirmRow>) => {
    const classes: string[] = []
    if (
      selectedCell?.id === params.id
      && selectedCell.field === params.field
      && allowedFields.has(params.field as FacConfirmEditableField)
    ) {
      classes.push('fac-confirm-fill-source')
    }
    if (rangeIds.has(params.id) && dragRef.current?.field === params.field) {
      classes.push('fac-confirm-fill-range')
    }
    if (params.id === dragRef.current?.id && rangeFields.has(params.field)) {
      classes.push('fac-confirm-fill-range')
    }
    return classes.join(' ')
  }, [allowedFields, rangeFields, rangeIds, selectedCell])

  return {
    getFillClassName,
    handleCellClick,
    handlePointerDown,
    handlePointerMove,
    handlePointerUp,
    handlePointerCancel,
    dragDirection,
    isDragging,
  }
}
