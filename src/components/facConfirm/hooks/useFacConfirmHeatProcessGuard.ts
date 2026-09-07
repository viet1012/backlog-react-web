import {
    useCallback,
    useRef,
    useState,
} from 'react'

import type {
    DataGridProps,
    GridRowId,
} from '@mui/x-data-grid'

import type {
    FacConfirmRow,
} from '../../../types/facConfirm'


// =========================================================
// HEAT FIELDS
// =========================================================

export const FAC_CONFIRM_HEAT_FIELDS = [
    'heatStart',
    'heatFinish',
] as const


export type FacConfirmHeatField =
    typeof FAC_CONFIRM_HEAT_FIELDS[number]


// =========================================================
// WARNING REQUEST
// =========================================================

export interface FacConfirmHeatWarningRequest {
    id: GridRowId

    field: FacConfirmHeatField

    aufnr: string
}


// =========================================================
// TYPES
// =========================================================

type ProcessRowUpdate =
    NonNullable<
        DataGridProps<FacConfirmRow>[
        'processRowUpdate'
        ]
    >


interface UseFacConfirmHeatProcessGuardOptions {
    processRowUpdate: ProcessRowUpdate
}


// =========================================================
// HELPERS
// =========================================================

export function isFacConfirmHeatField(
    field: string,
): field is FacConfirmHeatField {

    return (
        field === 'heatStart'
        || field === 'heatFinish'
    )
}


export function getFacConfirmHeatFieldLabel(
    field: FacConfirmHeatField,
): string {

    switch (field) {

        case 'heatStart':
            return 'Heat Start'

        case 'heatFinish':
            return 'Heat Finish'
    }
}


export function shouldWarnForHeatProcess(
    row: FacConfirmRow,
    field: string,
): field is FacConfirmHeatField {

    return (
        isFacConfirmHeatField(field)
        && row.hasHeatProcess === false
    )
}


// =========================================================
// FIND CHANGED HEAT FIELD
// =========================================================

function findChangedHeatField(
    newRow: FacConfirmRow,
    oldRow: FacConfirmRow,
): FacConfirmHeatField | null {

    for (
        const field
        of FAC_CONFIRM_HEAT_FIELDS
    ) {

        if (
            newRow[field]
            !== oldRow[field]
        ) {
            return field
        }
    }

    return null
}


// =========================================================
// GET ROW ID
//
// Giống getRowId của FacConfirmDataTable.
// =========================================================

function getFacConfirmRowId(
    row: FacConfirmRow,
): GridRowId {

    return [
        row.aufnr,
        row.zglobalCode ?? '',
    ].join('|')
}


// =========================================================
// HOOK
// =========================================================

export function useFacConfirmHeatProcessGuard({
    processRowUpdate,
}: UseFacConfirmHeatProcessGuardOptions) {

    // =======================================================
    // WARNING STATE
    // =======================================================

    const [
        pendingWarning,
        setPendingWarning,
    ] =
        useState<
            FacConfirmHeatWarningRequest | null
        >(null)


    // =======================================================
    // PROMISE RESOLVER
    //
    // Khi requestPermission() được gọi:
    //
    // await requestPermission(...)
    //
    // Promise sẽ đứng chờ cho tới khi user bấm
    // Yes hoặc No.
    // =======================================================

    const pendingResolverRef =
        useRef<
            ((allowed: boolean) => void)
            | null
        >(null)


    // =======================================================
    // REQUEST PERMISSION
    // =======================================================

    const requestPermission =
        useCallback(
            (
                row: FacConfirmRow,
                field: string,
                rowId?: GridRowId,
            ): Promise<boolean> => {

                // Không phải Heat Start / Heat Finish
                if (
                    !isFacConfirmHeatField(
                        field,
                    )
                ) {
                    return Promise.resolve(
                        true,
                    )
                }


                // PO có Heat Process
                // => cho phép ngay.
                if (
                    row.hasHeatProcess
                    !== false
                ) {
                    return Promise.resolve(
                        true,
                    )
                }


                // Nếu vì lý do nào đó request cũ
                // chưa được resolve thì cancel nó.
                if (
                    pendingResolverRef.current
                ) {
                    pendingResolverRef.current(
                        false,
                    )

                    pendingResolverRef.current =
                        null
                }


                const id =
                    rowId
                    ?? getFacConfirmRowId(
                        row,
                    )


                setPendingWarning({
                    id,

                    field,

                    aufnr:
                        row.aufnr,
                })


                return new Promise<boolean>(
                    (resolve) => {

                        pendingResolverRef.current =
                            resolve
                    },
                )
            },
            [],
        )


    // =======================================================
    // YES
    // =======================================================

    const confirmPermission =
        useCallback(
            () => {

                const resolver =
                    pendingResolverRef.current


                pendingResolverRef.current =
                    null


                setPendingWarning(
                    null,
                )


                resolver?.(
                    true,
                )
            },
            [],
        )


    // =======================================================
    // NO
    // =======================================================

    const cancelPermission =
        useCallback(
            () => {

                const resolver =
                    pendingResolverRef.current


                pendingResolverRef.current =
                    null


                setPendingWarning(
                    null,
                )


                resolver?.(
                    false,
                )
            },
            [],
        )


    // =======================================================
    // GUARDED PROCESS ROW UPDATE
    //
    // Cái này dành cho Fill Handle.
    //
    // Direct DataGrid edit KHÔNG dùng wrapper này,
    // vì direct edit đã check từ cellEditStart.
    //
    // Như vậy user không bị hỏi 2 lần:
    //
    // click -> Yes -> nhập -> save
    //
    // thay vì:
    //
    // click -> Yes -> nhập -> Yes lần nữa
    // =======================================================

    const guardedProcessRowUpdate:
        ProcessRowUpdate =
        useCallback(
            async (
                newRow,
                oldRow,
                params,
            ) => {

                const changedHeatField =
                    findChangedHeatField(
                        newRow,
                        oldRow,
                    )


                // Không sửa Heat field
                if (
                    !changedHeatField
                ) {
                    return processRowUpdate(
                        newRow,
                        oldRow,
                        params,
                    )
                }


                // PO có Heat Process
                if (
                    oldRow.hasHeatProcess
                    !== false
                ) {
                    return processRowUpdate(
                        newRow,
                        oldRow,
                        params,
                    )
                }


                // PO KHÔNG có Heat Process
                const allowed =
                    await requestPermission(
                        oldRow,

                        changedHeatField,

                        params?.rowId,
                    )


                // User bấm NO
                //
                // Return oldRow:
                // DataGrid/fill giữ nguyên dữ liệu.
                if (!allowed) {
                    return oldRow
                }


                // User bấm YES
                return processRowUpdate(
                    newRow,
                    oldRow,
                    params,
                )
            },
            [
                processRowUpdate,
                requestPermission,
            ],
        )


    return {
        pendingWarning,

        requestPermission,

        confirmPermission,

        cancelPermission,

        guardedProcessRowUpdate,
    }
}