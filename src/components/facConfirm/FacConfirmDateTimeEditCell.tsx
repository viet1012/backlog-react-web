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

            return dayjs()
                .second(0)
                .millisecond(0)
        })


    async function handleChange(
        nextValue: Dayjs | null,
    ) {
        if (
            !nextValue
            || !nextValue.isValid()
        ) {
            return
        }

        setPickerValue(nextValue)

        await api.setEditCellValue({
            id,
            field,
            value: nextValue.format(
                'YYYY-MM-DDTHH:mm:ss',
            ),
        })
    }


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


    return (
        <DateTimePicker
            open={open}

            value={pickerValue}

            ampm={false}

            format="DD/MM/YYYY HH:mm"

            minutesStep={1}

            onOpen={() => {
                setOpen(true)
            }}

            onClose={() => {
                setOpen(false)
            }}

            onChange={(nextValue) => {
                void handleChange(nextValue)
            }}

            onAccept={(nextValue) => {
                void handleAccept(nextValue)
            }}

            slotProps={{
                textField: {
                    autoFocus: true,

                    size: 'small',

                    fullWidth: true,

                    onClick: (event) => {
                        event.stopPropagation()
                    },

                    onDoubleClick: (event) => {
                        event.stopPropagation()
                    },

                    onKeyDown: (event) => {
                        event.stopPropagation()
                    },

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
