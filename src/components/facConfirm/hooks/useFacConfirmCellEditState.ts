import {
  useCallback,
  useMemo,
  useState,
} from 'react'

import type {
  GridCellParams,
} from '@mui/x-data-grid'

import {
  FAC_CONFIRM_PROCESS_CONFIG,
} from '../../../config/facConfirmProcessConfig'

import type {
  FacConfirmConfirmedProcess,
  FacConfirmEditableField,
  FacConfirmProcessGroup,
  FacConfirmProcessTimeChange,
  FacConfirmRow,
} from '../../../types/facConfirm'


interface Props {
  activeProcess:
  FacConfirmProcessGroup | null

  confirmedProcesses:
  FacConfirmConfirmedProcess[]
}


const editedCellClasses:
  Record<FacConfirmProcessGroup, string> = {
  Rough: 'fac-confirm-edited-rough',
  Heat: 'fac-confirm-edited-heat',
  Fine: 'fac-confirm-edited-fine',
}


// =========================================================
// DB PROCESS -> GRID FIELD
// =========================================================

const confirmedProcessConfig:
  Record<
    FacConfirmConfirmedProcess['processGrp'],
    {
      field: FacConfirmEditableField
      process: FacConfirmProcessGroup
    }
  > = {
  'To Drill': {
    field: 'toDrill',
    process: 'Rough',
  },

  'To Heat': {
    field: 'toHeat',
    process: 'Rough',
  },

  'Heat Start': {
    field: 'heatStart',
    process: 'Heat',
  },

  'Heat Finish': {
    field: 'heatFinish',
    process: 'Heat',
  },

  'To Packing': {
    field: 'toPk',
    process: 'Fine',
  },
}


// =========================================================
// CELL KEY
// =========================================================

function getCellKey(
  row: FacConfirmRow,
  field: string,
) {
  return [
    row.aufnr,
    row.zglobalCode ?? '',
    field,
  ].join('|')
}


function getConfirmedCellKey(
  aufnr: string,
  field: string,
) {
  return [
    aufnr,
    field,
  ].join('|')
}


// =========================================================
// VALUE COMPARE
// =========================================================

function valuesEqual(
  left: unknown,
  right: unknown,
) {
  return String(left ?? '')
    === String(right ?? '')
}


// =========================================================
// VALIDATE DATETIME PARTS
// =========================================================

function validateDateTimeParts(
  year: string,
  month: string,
  day: string,
  hour: string,
  minute: string,
  second: string,
): string {

  const y = Number(year)
  const m = Number(month)
  const d = Number(day)
  const h = Number(hour)
  const min = Number(minute)
  const sec = Number(second)


  if (
    m < 1
    || m > 12
    || d < 1
    || d > 31
    || h < 0
    || h > 23
    || min < 0
    || min > 59
    || sec < 0
    || sec > 59
  ) {
    throw new Error(
      'Invalid datetime. Use DD/MM/YYYY HH:mm.',
    )
  }


  const date =
    new Date(
      y,
      m - 1,
      d,
      h,
      min,
      sec,
    )


  if (
    date.getFullYear() !== y
    || date.getMonth() !== m - 1
    || date.getDate() !== d
    || date.getHours() !== h
    || date.getMinutes() !== min
    || date.getSeconds() !== sec
  ) {
    throw new Error(
      'Invalid datetime. Use DD/MM/YYYY HH:mm.',
    )
  }


  return (
    `${year}-${month}-${day}`
    + `T${hour}:${minute}:${second}`
  )
}


// =========================================================
// DATETIME -> API FORMAT
// =========================================================

function toApiDateTime(
  value: unknown,
): string {

  const text =
    String(value ?? '').trim()


  if (!text) {
    throw new Error(
      'Datetime is required.',
    )
  }


  // =======================================================
  // ISO
  //
  // 2026-08-20T05:11
  // 2026-08-20T05:11:56
  // 2026-08-20T05:11:56.000+00:00
  // =======================================================

  const isoMatch =
    text.match(
      /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})(?::(\d{2}))?/,
    )


  if (isoMatch) {

    const [
      ,
      year,
      month,
      day,
      hour,
      minute,
      second = '00',
    ] = isoMatch


    return validateDateTimeParts(
      year,
      month,
      day,
      hour,
      minute,
      second,
    )
  }


  // =======================================================
  // DISPLAY FORMAT
  //
  // 20/08/2026 05:11
  // 20/08/2026 05:11:56
  // =======================================================

  const displayMatch =
    text.match(
      /^(\d{2})\/(\d{2})\/(\d{4})\s+(\d{2}):(\d{2})(?::(\d{2}))?$/,
    )


  if (!displayMatch) {
    throw new Error(
      'Invalid datetime. Use DD/MM/YYYY HH:mm.',
    )
  }


  const [
    ,
    day,
    month,
    year,
    hour,
    minute,
    second = '00',
  ] = displayMatch


  return validateDateTimeParts(
    year,
    month,
    day,
    hour,
    minute,
    second,
  )
}


// =========================================================
// HOOK
// =========================================================

export function useFacConfirmCellEditState({
  activeProcess,
  confirmedProcesses,
}: Props) {

  const [
    editedCells,
    setEditedCells,
  ] =
    useState<
      Map<
        string,
        FacConfirmProcessGroup
      >
    >(
      () => new Map(),
    )


  const [
    pendingMap,
    setPendingMap,
  ] =
    useState<
      Map<
        string,
        FacConfirmProcessTimeChange
      >
    >(
      () => new Map(),
    )


  // =======================================================
  // DB CONFIRMED CELLS
  // =======================================================

  const confirmedCells =
    useMemo(
      () => {

        const map =
          new Map<
            string,
            FacConfirmProcessGroup
          >()


        confirmedProcesses.forEach(
          (item) => {

            const config =
              confirmedProcessConfig[
              item.processGrp
              ]


            if (
              !config
              || !item.confirmFnTime
            ) {
              return
            }


            map.set(
              getConfirmedCellKey(
                item.aufnr,
                config.field,
              ),
              config.process,
            )
          },
        )


        return map
      },
      [
        confirmedProcesses,
      ],
    )


  // =======================================================
  // CELL CLASS
  // =======================================================

  const getCellClassName =
    useCallback(
      (
        params:
          GridCellParams<FacConfirmRow>,
      ) => {

        const editedProcess =
          editedCells.get(
            getCellKey(
              params.row,
              params.field,
            ),
          )


        if (editedProcess) {
          return editedCellClasses[
            editedProcess
          ]
        }


        const confirmedProcess =
          confirmedCells.get(
            getConfirmedCellKey(
              params.row.aufnr,
              params.field,
            ),
          )


        if (confirmedProcess) {
          return editedCellClasses[
            confirmedProcess
          ]
        }


        return ''
      },
      [
        editedCells,
        confirmedCells,
      ],
    )


  // =======================================================
  // PROCESS ROW UPDATE
  // =======================================================

  const processRowUpdate =
    useCallback(
      (
        newRow:
          FacConfirmRow,

        oldRow:
          FacConfirmRow,
      ) => {

        if (!activeProcess) {
          return newRow
        }


        const changedFields =
          FAC_CONFIRM_PROCESS_CONFIG[
            activeProcess
          ].columns.filter(
            (field) =>
              !valuesEqual(
                oldRow[field],
                newRow[field],
              ),
          )


        if (
          changedFields.length === 0
        ) {
          return newRow
        }


        // =================================================
        // VALIDATE FIRST
        // =================================================

        const validatedChanges =
          changedFields.map(
            (field) => {

              const value =
                newRow[field]

              const key =
                getCellKey(
                  newRow,
                  field,
                )


              if (
                value == null
                || String(value).trim() === ''
              ) {
                return {
                  field,
                  key,
                  apiValue:
                    null as string | null,
                }
              }


              return {
                field,
                key,

                apiValue:
                  toApiDateTime(
                    value,
                  ),
              }
            },
          )


        // =================================================
        // MARK EDITED CELLS
        // =================================================

        setEditedCells(
          (current) => {

            const next =
              new Map(
                current,
              )


            validatedChanges.forEach(
              ({
                key,
                apiValue,
              }) => {

                // Nếu user xóa trắng thì bỏ màu edit local
                if (!apiValue) {
                  next.delete(
                    key,
                  )

                  return
                }


                next.set(
                  key,
                  activeProcess,
                )
              },
            )


            return next
          },
        )


        // =================================================
        // STORE PENDING CHANGES
        // =================================================

        setPendingMap(
          (current) => {

            const next =
              new Map(
                current,
              )


            validatedChanges.forEach(
              ({
                field,
                key,
                apiValue,
              }) => {

                if (!apiValue) {
                  next.delete(
                    key,
                  )

                  return
                }


                next.set(
                  key,
                  {
                    aufnr:
                      newRow.aufnr,

                    field:
                      field as FacConfirmEditableField,

                    value:
                      apiValue,
                  },
                )
              },
            )


            return next
          },
        )


        return newRow
      },
      [
        activeProcess,
      ],
    )


  // =======================================================
  // PENDING ARRAY
  // =======================================================

  const pendingChanges =
    useMemo(
      () =>
        [
          ...pendingMap.values(),
        ],
      [
        pendingMap,
      ],
    )


  // =======================================================
  // CLEAR
  // =======================================================

  const clearChanges =
    useCallback(
      () => {

        setEditedCells(
          new Map(),
        )

        setPendingMap(
          new Map(),
        )
      },
      [],
    )


  return {
    getCellClassName,

    processRowUpdate,

    pendingChanges,

    hasChanges:
      pendingChanges.length > 0,

    changeCount:
      pendingChanges.length,

    clearChanges,
  }
}