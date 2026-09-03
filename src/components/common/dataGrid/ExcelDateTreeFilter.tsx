import {
    Box,
    Checkbox,
    Collapse,
    IconButton,
    Stack,
    Typography,
} from '@mui/material'

import {
    ChevronRightRounded,
    ExpandMoreRounded,
} from '@mui/icons-material'

import {
    useMemo,
    useState,
} from 'react'


interface Props {
    options: string[]
    selectedValues: string[]
    onChange: (
        values: string[],
    ) => void
}


const MONTH_NAMES = [
    'January',
    'February',
    'March',
    'April',
    'May',
    'June',
    'July',
    'August',
    'September',
    'October',
    'November',
    'December',
] as const


interface DateDay {
    value: string
    day: number
}


interface DateMonth {
    key: string
    month: number
    label: string
    days: DateDay[]
}


interface DateYear {
    year: number
    months: DateMonth[]
}


function buildDateTree(
    options: string[],
): DateYear[] {

    const map =
        new Map<
            number,
            Map<number, DateDay[]>
        >()


    for (const raw of options) {

        const value =
            raw.trim()


        if (
            !/^\d{4}-\d{2}-\d{2}$/.test(
                value,
            )
        ) {
            continue
        }


        const [
            yearText,
            monthText,
            dayText,
        ] =
            value.split('-')


        const year =
            Number(yearText)

        const month =
            Number(monthText)

        const day =
            Number(dayText)


        let months =
            map.get(year)


        if (!months) {
            months =
                new Map()

            map.set(
                year,
                months,
            )
        }


        let days =
            months.get(month)


        if (!days) {
            days = []

            months.set(
                month,
                days,
            )
        }


        days.push({
            value,
            day,
        })
    }


    return [
        ...map.entries(),
    ]
        .sort(
            ([yearA], [yearB]) =>
                yearB - yearA,
        )
        .map(
            ([year, months]) => ({

                year,

                months: [
                    ...months.entries(),
                ]
                    .sort(
                        ([monthA], [monthB]) =>
                            monthA - monthB,
                    )
                    .map(
                        ([month, days]) => ({

                            key:
                                `${year}-${String(
                                    month,
                                ).padStart(
                                    2,
                                    '0',
                                )}`,

                            month,

                            label:
                                MONTH_NAMES[
                                month - 1
                                ]
                                ?? String(month),

                            days:
                                [...days]
                                    .sort(
                                        (left, right) =>
                                            left.day
                                            - right.day,
                                    ),
                        }),
                    ),
            }),
        )
}


function allSelected(
    values: string[],
    selected: Set<string>,
) {

    return (
        values.length > 0
        && values.every(
            (value) =>
                selected.has(
                    value,
                ),
        )
    )
}


function someSelected(
    values: string[],
    selected: Set<string>,
) {

    const selectedCount =
        values.filter(
            (value) =>
                selected.has(
                    value,
                ),
        ).length


    return (
        selectedCount > 0
        && selectedCount
        < values.length
    )
}


export function ExcelDateTreeFilter({
    options,
    selectedValues,
    onChange,
}: Props) {

    const selected =
        useMemo(
            () =>
                new Set(
                    selectedValues,
                ),
            [selectedValues],
        )


    const tree =
        useMemo(
            () =>
                buildDateTree(
                    options,
                ),
            [options],
        )


    const [
        expandedYears,
        setExpandedYears,
    ] =
        useState<
            Set<number>
        >(
            () =>
                new Set(
                    tree.map(
                        (item) =>
                            item.year,
                    ),
                ),
        )


    const [
        expandedMonths,
        setExpandedMonths,
    ] =
        useState<
            Set<string>
        >(
            () =>
                new Set(),
        )


    const applyGroup =
        (
            values: string[],
            checked: boolean,
        ) => {

            const next =
                new Set(
                    selected,
                )


            for (const value of values) {

                if (checked) {
                    next.add(value)
                } else {
                    next.delete(value)
                }
            }


            onChange(
                [...next],
            )
        }


    const toggleDay =
        (
            value: string,
            checked: boolean,
        ) => {

            const next =
                new Set(
                    selected,
                )


            if (checked) {
                next.add(value)
            } else {
                next.delete(value)
            }


            onChange(
                [...next],
            )
        }


    const toggleYear =
        (year: number) => {

            setExpandedYears(
                (current) => {

                    const next =
                        new Set(
                            current,
                        )


                    if (
                        next.has(year)
                    ) {
                        next.delete(year)
                    } else {
                        next.add(year)
                    }


                    return next
                },
            )
        }


    const toggleMonth =
        (key: string) => {

            setExpandedMonths(
                (current) => {

                    const next =
                        new Set(
                            current,
                        )


                    if (
                        next.has(key)
                    ) {
                        next.delete(key)
                    } else {
                        next.add(key)
                    }


                    return next
                },
            )
        }


    return (
        <Stack
            spacing={0.25}
            sx={{
                maxHeight: 320,
                overflowY: 'auto',

                pr: 0.5,
            }}
        >

            {tree.map(
                (yearItem) => {

                    const yearValues =
                        yearItem.months
                            .flatMap(
                                (month) =>
                                    month.days.map(
                                        (day) =>
                                            day.value,
                                    ),
                            )


                    const yearChecked =
                        allSelected(
                            yearValues,
                            selected,
                        )


                    const yearIndeterminate =
                        someSelected(
                            yearValues,
                            selected,
                        )


                    return (
                        <Box
                            key={
                                yearItem.year
                            }
                        >

                            <Stack
                                direction="row"
                                sx={{
                                    alignItems:
                                        'center',

                                    minHeight: 30,
                                }}
                            >

                                <IconButton
                                    size="small"
                                    onClick={() =>
                                        toggleYear(
                                            yearItem.year,
                                        )
                                    }
                                    sx={{
                                        width: 26,
                                        height: 26,
                                    }}
                                >
                                    {expandedYears.has(
                                        yearItem.year,
                                    )
                                        ? (
                                            <ExpandMoreRounded
                                                sx={{
                                                    fontSize: 18,
                                                }}
                                            />
                                        )
                                        : (
                                            <ChevronRightRounded
                                                sx={{
                                                    fontSize: 18,
                                                }}
                                            />
                                        )}
                                </IconButton>


                                <Checkbox
                                    size="small"

                                    checked={
                                        yearChecked
                                    }

                                    indeterminate={
                                        yearIndeterminate
                                    }

                                    onChange={(
                                        event,
                                    ) =>
                                        applyGroup(
                                            yearValues,
                                            event
                                                .target
                                                .checked,
                                        )
                                    }
                                />


                                <Typography
                                    sx={{
                                        fontSize: 12,

                                        fontWeight: 800,
                                    }}
                                >
                                    {yearItem.year}
                                </Typography>

                            </Stack>


                            <Collapse
                                in={
                                    expandedYears.has(
                                        yearItem.year,
                                    )
                                }
                            >

                                <Box
                                    sx={{
                                        pl: 2.5,
                                    }}
                                >

                                    {yearItem.months.map(
                                        (month) => {

                                            const monthValues =
                                                month.days.map(
                                                    (day) =>
                                                        day.value,
                                                )


                                            const monthChecked =
                                                allSelected(
                                                    monthValues,
                                                    selected,
                                                )


                                            const monthIndeterminate =
                                                someSelected(
                                                    monthValues,
                                                    selected,
                                                )


                                            return (
                                                <Box
                                                    key={
                                                        month.key
                                                    }
                                                >

                                                    <Stack
                                                        direction="row"
                                                        sx={{
                                                            alignItems:
                                                                'center',

                                                            minHeight: 29,
                                                        }}
                                                    >

                                                        <IconButton
                                                            size="small"

                                                            onClick={() =>
                                                                toggleMonth(
                                                                    month.key,
                                                                )
                                                            }

                                                            sx={{
                                                                width: 26,
                                                                height: 26,
                                                            }}
                                                        >
                                                            {expandedMonths.has(
                                                                month.key,
                                                            )
                                                                ? (
                                                                    <ExpandMoreRounded
                                                                        sx={{
                                                                            fontSize: 17,
                                                                        }}
                                                                    />
                                                                )
                                                                : (
                                                                    <ChevronRightRounded
                                                                        sx={{
                                                                            fontSize: 17,
                                                                        }}
                                                                    />
                                                                )}
                                                        </IconButton>


                                                        <Checkbox
                                                            size="small"

                                                            checked={
                                                                monthChecked
                                                            }

                                                            indeterminate={
                                                                monthIndeterminate
                                                            }

                                                            onChange={(
                                                                event,
                                                            ) =>
                                                                applyGroup(
                                                                    monthValues,
                                                                    event
                                                                        .target
                                                                        .checked,
                                                                )
                                                            }
                                                        />


                                                        <Typography
                                                            sx={{
                                                                fontSize: 11.5,

                                                                fontWeight: 700,
                                                            }}
                                                        >
                                                            {month.label}
                                                        </Typography>

                                                    </Stack>


                                                    <Collapse
                                                        in={
                                                            expandedMonths.has(
                                                                month.key,
                                                            )
                                                        }
                                                    >

                                                        <Box
                                                            sx={{
                                                                pl: 5,
                                                            }}
                                                        >

                                                            {month.days.map(
                                                                (day) => (

                                                                    <Stack
                                                                        key={
                                                                            day.value
                                                                        }

                                                                        direction="row"

                                                                        sx={{
                                                                            alignItems:
                                                                                'center',

                                                                            minHeight: 27,
                                                                        }}
                                                                    >

                                                                        <Checkbox
                                                                            size="small"

                                                                            checked={
                                                                                selected.has(
                                                                                    day.value,
                                                                                )
                                                                            }

                                                                            onChange={(
                                                                                event,
                                                                            ) =>
                                                                                toggleDay(
                                                                                    day.value,
                                                                                    event
                                                                                        .target
                                                                                        .checked,
                                                                                )
                                                                            }
                                                                        />


                                                                        <Typography
                                                                            sx={{
                                                                                fontSize: 11.5,
                                                                            }}
                                                                        >
                                                                            {String(
                                                                                day.day,
                                                                            ).padStart(
                                                                                2,
                                                                                '0',
                                                                            )}
                                                                        </Typography>

                                                                    </Stack>
                                                                ),
                                                            )}

                                                        </Box>

                                                    </Collapse>

                                                </Box>
                                            )
                                        },
                                    )}

                                </Box>

                            </Collapse>

                        </Box>
                    )
                },
            )}

        </Stack>
    )
}