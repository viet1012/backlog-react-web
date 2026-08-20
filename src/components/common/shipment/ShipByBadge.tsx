import {
    Box,
    Typography,
} from '@mui/material'

import {
    DirectionsBoatOutlined,
    FlightOutlined,
    BoltOutlined,
    HelpOutlineOutlined,
} from '@mui/icons-material'

interface ShipByBadgeProps {
    shipBy?: string | null
}

type ShipByType =
    | 'AIR'
    | 'SEA'
    | 'EXPRESS'
    | 'UNKNOWN'


function normalizeShipBy(
    shipBy?: string | null,
): ShipByType {
    const value =
        shipBy?.trim().toUpperCase()

    switch (value) {
        case 'AIR':
            return 'AIR'

        case 'SEA':
            return 'SEA'

        case 'EXP':
        case 'EXPRESS':
            return 'EXPRESS'

        default:
            return 'UNKNOWN'
    }
}


export function ShipByBadge({
    shipBy,
}: ShipByBadgeProps) {
    const type =
        normalizeShipBy(shipBy)

    const config = {
        AIR: {
            label: 'AIR',
            icon: <FlightOutlined />,
        },

        SEA: {
            label: 'SEA',
            icon: <DirectionsBoatOutlined />,
        },

        EXPRESS: {
            label: 'EXPRESS',
            icon: <BoltOutlined />,
        },

        UNKNOWN: {
            label: 'N/A',
            icon: <HelpOutlineOutlined />,
        },
    }[type]


    return (
        <Box
            sx={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 0.5,

                minWidth: 0,

                color:
                    type === 'UNKNOWN'
                        ? 'text.disabled'
                        : 'text.secondary',
            }}
        >
            <Box
                sx={{
                    width: 18,
                    height: 18,

                    flexShrink: 0,

                    display: 'grid',
                    placeItems: 'center',

                    borderRadius: 1,

                    bgcolor: 'action.hover',

                    color:
                        type === 'UNKNOWN'
                            ? 'text.disabled'
                            : 'primary.main',

                    '& svg': {
                        fontSize: 13,
                    },
                }}
            >
                {config.icon}
            </Box>

            <Typography
                noWrap
                sx={{
                    fontSize: 9.5,
                    fontWeight: 650,
                    lineHeight: 1,
                    color: 'inherit',
                }}
            >
                {config.label}
            </Typography>
        </Box>
    )
}