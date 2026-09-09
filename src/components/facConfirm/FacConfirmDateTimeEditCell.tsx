import {
    useCallback,
    useMemo,
    useRef,
    useState,
} from 'react'

import {
    Button,
    DialogActions,
} from '@mui/material'

import {
    DateTimePicker,
} from '@mui/x-date-pickers/DateTimePicker'

import type {
    PickersActionBarProps,
} from '@mui/x-date-pickers/PickersActionBar'

import {
    type GridRenderEditCellParams,
} from '@mui/x-data-grid'

import dayjs, {
    type Dayjs,
} from 'dayjs'

import type {
    FacConfirmRow,
} from '../../types/facConfirm'


export function FacConfirmDateTimeEditCell(
    params: GridRenderEditCellParams<FacConfirmRow>,
) {
    const {
        id,
        field,
        value,
        api,
    } = params

    const initialValue = (() => {
        if (value) {
            const existing = dayjs(value)

            if (existing.isValid()) {
                return existing
            }
        }

        return dayjs()
            .second(0)
            .millisecond(0)
    })()

    const [open, setOpen] =
        useState(true)

    const [
        pickerValue,
        setPickerValue,
    ] = useState<Dayjs | null>(
        initialValue,
    )

    const latestValueRef =
        useRef<Dayjs | null>(
            initialValue,
        )

    const committingRef =
        useRef(false)

    const explicitActionRef =
        useRef<'commit' | 'cancel' | null>(null)

    const editStoppedRef =
        useRef(false)

    // =========================================================
    // DRAFT ONLY
    // =========================================================

    function handleChange(
        nextValue: Dayjs | null,
    ) {
        setPickerValue(nextValue)

        latestValueRef.current =
            nextValue
    }

    // =========================================================
    // REAL COMMIT
    // =========================================================

    const commitValue = useCallback(
        async () => {
            const nextValue =
                latestValueRef.current

            if (
                committingRef.current
                || !nextValue
                || !nextValue.isValid()
            ) {
                return
            }

            explicitActionRef.current =
                'commit'

            committingRef.current = true

            try {
                const formatted =
                    nextValue.format(
                        'YYYY-MM-DDTHH:mm:ss',
                    )

                await api.setEditCellValue({
                    id,
                    field,
                    value: formatted,
                })

                if (!editStoppedRef.current) {
                    editStoppedRef.current = true

                    api.stopCellEditMode({
                        id,
                        field,
                    })
                }
            } catch (error) {
                committingRef.current = false
                explicitActionRef.current = null
                throw error
            }
        },
        [
            api,
            field,
            id,
        ],
    )

    const cancelEdit = useCallback(
        () => {
            if (editStoppedRef.current) {
                return
            }

            explicitActionRef.current =
                'cancel'

            editStoppedRef.current = true

            api.stopCellEditMode({
                id,
                field,
                ignoreModifications: true,
            })
        },
        [
            api,
            field,
            id,
        ],
    )

    const actionBar = useMemo(
        () => function FacConfirmPickerActionBar({
            className,
        }: PickersActionBarProps) {
            return (
                <DialogActions
                    className={className}
                    disableSpacing
                    sx={{
                        gridColumn: '1 / 4',
                        gridRow: 5,
                        width: '100%',
                        boxSizing: 'border-box',
                        justifyContent: 'flex-end',
                        gap: 0.5,
                        px: 1.25,
                        py: 0.75,
                    }}
                >
                    <Button
                        size="small"
                        variant="text"
                        onClick={cancelEdit}
                        sx={{
                            minWidth: 64,
                            px: 1.25,
                        }}
                    >
                        Cancel
                    </Button>

                    <Button
                        size="small"
                        variant="contained"
                        disableElevation
                        onClick={() => {
                            void commitValue()
                        }}
                        sx={{
                            minWidth: 56,
                            px: 1.5,
                        }}
                    >
                        OK
                    </Button>
                </DialogActions>
            )
        },
        [
            cancelEdit,
            commitValue,
        ],
    )

    return (
        <DateTimePicker
            open={open}

            value={pickerValue}

            ampm={false}

            format="DD/MM/YYYY HH:mm"

            minutesStep={1}

            // Quan trọng:
            // giữ popup mở khi user focus/gõ field
            keepOpenDuringFieldFocus

            // Không auto accept khi chọn value trong popup
            closeOnSelect={false}

            onOpen={() => {
                setOpen(true)
            }}

            onClose={() => {
                setOpen(false)

                if (
                    !editStoppedRef.current
                    && explicitActionRef.current == null
                ) {
                    cancelEdit()
                }
            }}

            // =============================================
            // CHỈ DRAFT
            // =============================================

            onChange={(nextValue) => {
                handleChange(nextValue)
            }}

            slots={{
                actionBar,
            }}

            slotProps={{
                textField: {
                    autoFocus: true,

                    size: 'small',

                    fullWidth: true,

                    onClick: (event) => {
                        event.stopPropagation()
                    },

                    onDoubleClick: (
                        event,
                    ) => {
                        event.stopPropagation()
                    },

                    onKeyDown: (
                        event,
                    ) => {
                        // Không cho DataGrid xử lý keyboard
                        event.stopPropagation()

                        // =============================
                        // ENTER -> user chủ động commit
                        // =============================

                        if (
                            event.key ===
                            'Enter'
                        ) {
                            event.preventDefault()

                            void commitValue()

                            return
                        }

                        // =============================
                        // ESCAPE -> cancel
                        // =============================

                        if (
                            event.key ===
                            'Escape'
                        ) {
                            event.preventDefault()

                            cancelEdit()
                        }
                    },

                    sx: {
                        height: '100%',

                        '& .MuiInputBase-root': {
                            height: '100%',
                            fontSize: 12,
                            borderRadius: 0,
                            pr: 0,
                        },

                        '& .MuiInputAdornment-root': {
                            display: 'none',
                        },

                        '& .MuiInputBase-input': {
                            px: 1,
                            py: 0,
                            pr: 0,
                        },
                    },
                },

                popper: {
                    placement:
                        'bottom-start',
                },
            }}
        />
    )
}
