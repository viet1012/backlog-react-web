import {
    Box,
    Divider,
    List,
    ListItemButton,
    ListItemIcon,
    ListItemText,
} from '@mui/material'

import ArrowUpwardRoundedIcon
    from '@mui/icons-material/ArrowUpwardRounded'

import ArrowDownwardRoundedIcon
    from '@mui/icons-material/ArrowDownwardRounded'

import FilterAltRoundedIcon
    from '@mui/icons-material/FilterAltRounded'

import {
    useGridApiContext,
    type GridColumnMenuProps,
} from '@mui/x-data-grid'

import type {
    MouseEvent,
} from 'react'

import PushPinOutlinedIcon
    from '@mui/icons-material/PushPinOutlined'

import PushPinRoundedIcon
    from '@mui/icons-material/PushPinRounded'

import {
    useExcelColumnFilter,
} from './excelFilterContext'

import {
    useGridPin,
} from './gridPinContext'

import { useI18n } from '../../../i18n/useI18n'

// =========================================================
// EXCEL COLUMN MENU
// =========================================================

export function ExcelColumnMenu(
    props: GridColumnMenuProps,
) {
    const {
        colDef,
        hideMenu,
    } = props

    const apiRef =
        useGridApiContext()

    const excelFilter =
        useExcelColumnFilter()

    const { t } =
        useI18n()


    // =======================================================
    // SORT ASC
    // =======================================================

    function sortAsc(
        event: MouseEvent<HTMLElement>,
    ) {
        event.stopPropagation()

        apiRef.current.setSortModel([
            {
                field: colDef.field,
                sort: 'asc',
            },
        ])

        hideMenu(event)
    }


    // =======================================================
    // SORT DESC
    // =======================================================

    function sortDesc(
        event: MouseEvent<HTMLElement>,
    ) {
        event.stopPropagation()

        apiRef.current.setSortModel([
            {
                field: colDef.field,
                sort: 'desc',
            },
        ])

        hideMenu(event)
    }


    // =======================================================
    // OPEN EXCEL FILTER
    // =======================================================

    function openFilter(
        event: MouseEvent<HTMLElement>,
    ) {
        event.stopPropagation()

        if (
            !excelFilter.isFilterableField(
                colDef.field,
            )
        ) {
            return
        }

        const field =
            colDef.field

        const label =
            colDef.headerName
            ?? colDef.field

        const headerElement =
            document.querySelector(
                `.MuiDataGrid-columnHeader[data-field="${CSS.escape(
                    colDef.field,
                )}"]`,
            )

        if (
            !(
                headerElement
                instanceof HTMLElement
            )
        ) {
            return
        }

        hideMenu(event)

        requestAnimationFrame(() => {
            excelFilter.openFilter(
                field,
                label,
                headerElement,
            )
        })
    }


    // =======================================================
    // PIN / UNPIN (giữ cột khi cuộn ngang)
    // =======================================================

    const pin =
        useGridPin()

    const pinned =
        pin?.pinnedColumns.includes(colDef.field) ?? false

    function togglePin(
        event: MouseEvent<HTMLElement>,
    ) {
        event.stopPropagation()

        pin?.togglePinnedColumn(colDef.field)

        hideMenu(event)
    }


    // =======================================================
    // COMMON ITEM STYLE
    // =======================================================

    const itemSx = {
        minHeight: 38,

        px: 1.5,
        py: 0.5,

        borderRadius: 0,

        '& .MuiListItemIcon-root': {
            minWidth: 34,
        },

        '& .MuiListItemText-primary': {
            fontSize: 12.5,
            fontWeight: 500,
        },
    } as const


    // =======================================================
    // RENDER
    // =======================================================

    return (
        <Box
            sx={(theme) => ({
                minWidth: 240,

                py: 0.5,

                bgcolor:
                    theme.palette.background.paper,

                color:
                    'text.primary',
            })}
        >
            <List
                disablePadding
            >

                {/* =================================================
            SORT ASC
        ================================================= */}

                <ListItemButton
                    onClick={sortAsc}
                    sx={itemSx}
                >
                    <ListItemIcon>
                        <ArrowUpwardRoundedIcon
                            fontSize="small"
                        />
                    </ListItemIcon>

                    <ListItemText
                        primary={t.dataGrid.sortAsc}
                    />
                </ListItemButton>


                {/* =================================================
            SORT DESC
        ================================================= */}

                <ListItemButton
                    onClick={sortDesc}
                    sx={itemSx}
                >
                    <ListItemIcon>
                        <ArrowDownwardRoundedIcon
                            fontSize="small"
                        />
                    </ListItemIcon>

                    <ListItemText
                        primary={t.dataGrid.sortDesc}
                    />
                </ListItemButton>


                <Divider />


                {/* =================================================
            FILTER
        ================================================= */}

                <ListItemButton
                    onClick={openFilter}

                    disabled={
                        !excelFilter.isFilterableField(
                            colDef.field,
                        )
                    }

                    sx={itemSx}
                >
                    <ListItemIcon>
                        <FilterAltRoundedIcon
                            fontSize="small"
                        />
                    </ListItemIcon>

                    <ListItemText
                        primary={t.dataGrid.filterMenu}
                    />
                </ListItemButton>


                {/* =================================================
            PIN (bảng có hỗ trợ ghim cột)
        ================================================= */}

                {pin && (
                    <>
                        <Divider />

                        <ListItemButton
                            onClick={togglePin}
                            sx={itemSx}
                        >
                            <ListItemIcon>
                                {pinned
                                    ? <PushPinRoundedIcon fontSize="small" />
                                    : <PushPinOutlinedIcon fontSize="small" />}
                            </ListItemIcon>

                            <ListItemText
                                primary={pinned ? t.dataGrid.unpinColumn : t.dataGrid.pinColumn}
                            />
                        </ListItemButton>
                    </>
                )}

            </List>
        </Box>
    )
}
