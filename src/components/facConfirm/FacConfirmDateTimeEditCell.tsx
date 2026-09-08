import {
    useState,
} from 'react'

import {
    DateTimePicker,
} from '@mui/x-date-pickers/DateTimePicker'

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
    params: GridRenderEditCellParams<
        FacConfirmRow
    >,
) {
    const {
        id,
        field,
        value,
        api,
    } = params


    // =========================================================
    // PICKER STATE
    // =========================================================

    const [open, setOpen] =
        useState(true)

    const [pickerValue, setPickerValue] =
        useState<Dayjs>(() => {
            if (value) {
                const existing =
                    dayjs(value)

                if (existing.isValid()) {
                    return existing
                }
            }

            // Cell chưa có giá trị
            // -> mặc định thời gian hiện tại
            return dayjs()
                .second(0)
                .millisecond(0)
        })


    // =========================================================
    // CHANGE
    // =========================================================

    async function handleChange(
        nextValue: Dayjs | null,
    ) {
        if (!nextValue) {
            return
        }

        setPickerValue(nextValue)

        if (!nextValue.isValid()) {
            return
        }

        await api.setEditCellValue({
            id,
            field,

            value:
                nextValue.format(
                    'YYYY-MM-DDTHH:mm:ss',
                )
        })
    }


    // =========================================================
    // ACCEPT
    // =========================================================

    async function handleAccept(
        nextValue: Dayjs | null,
    ) {
        if (
            !nextValue
            || !nextValue.isValid()
        ) {
            return
        }

        const formatted =
            nextValue.format(
                'YYYY-MM-DDTHH:mm:ss',
            )

        await api.setEditCellValue({
            id,
            field,
            value: formatted,
        })

        api.stopCellEditMode({
            id,
            field,
        })
    }


    // =========================================================
    // RENDER
    // =========================================================

    return (
        <DateTimePicker

            open={open}

            value={pickerValue}

            onOpen={() =>
                setOpen(true)
            }

            onClose={() =>
                setOpen(false)
            }

            onChange={
                handleChange
            }

            onAccept={(nextValue) => {
                void handleAccept(
                    nextValue,
                )
            }}

            ampm={false}

            format="DD/MM/YYYY HH:mm"

            minutesStep={1}

            slotProps={{
                textField: {
                    autoFocus: true,

                    size: 'small',

                    fullWidth: true,

                    sx: {
                        height: '100%',

                        '& .MuiInputBase-root': {
                            height: '100%',
                            fontSize: 12,
                            borderRadius: 0,
                        },

                        '& .MuiInputBase-input': {
                            px: 1,
                            py: 0,
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