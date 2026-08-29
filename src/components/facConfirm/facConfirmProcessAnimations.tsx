// src/components/facConfirm/facConfirmProcessAnimations.tsx
import ConstructionRoundedIcon
    from '@mui/icons-material/ConstructionRounded'

import LocalFireDepartmentRoundedIcon
    from '@mui/icons-material/LocalFireDepartmentRounded'

import PrecisionManufacturingRoundedIcon
    from '@mui/icons-material/PrecisionManufacturingRounded'

import {
    Box,
} from '@mui/material'

import {
    alpha,
    useTheme,
    type Theme,
} from '@mui/material/styles'

import type {
    FacConfirmProcessGroup,
} from '../../types/facConfirm'

import {
    FAC_CONFIRM_PROCESS_CONFIG,
} from '../../config/facConfirmProcessConfig'


interface Props {
    processGroup:
    FacConfirmProcessGroup

    selected:
    boolean
}


// =========================================================
// MAIN
// =========================================================

export function FacConfirmAnimatedProcessIcon({
    processGroup,
    selected,
}: Props) {

    const theme =
        useTheme()

    const color =
        FAC_CONFIRM_PROCESS_CONFIG[
            processGroup
        ].getColor(theme)


    if (processGroup === 'Heat') {
        return (
            <HeatAnimatedIcon
                selected={selected}
                color={color}
                theme={theme}
            />
        )
    }


    if (processGroup === 'Fine') {
        return (
            <FineAnimatedIcon
                selected={selected}
            />
        )
    }


    return (
        <RoughAnimatedIcon
            selected={selected}
        />
    )
}


function RoughAnimatedIcon({
    selected,
}: {
    selected: boolean
}) {
    return (
        <ConstructionRoundedIcon
            sx={{
                fontSize: 17,

                transformOrigin: 'center',

                animation:
                    selected
                        ? 'facConfirmRoughMotion 1.35s ease-in-out infinite'
                        : 'none',

                '@keyframes facConfirmRoughMotion': {
                    '0%, 100%': {
                        transform:
                            'rotate(-5deg) translateY(0)',
                    },

                    '25%': {
                        transform:
                            'rotate(4deg) translateY(-1px)',
                    },

                    '50%': {
                        transform:
                            'rotate(-3deg) translateY(0)',
                    },

                    '75%': {
                        transform:
                            'rotate(5deg) translateY(-1px)',
                    },
                },

                '@media (prefers-reduced-motion: reduce)': {
                    animation: 'none',
                    transform: 'none',
                },
            }}
        />
    )
}


function FineAnimatedIcon({
    selected,
}: {
    selected: boolean
}) {
    return (
        <PrecisionManufacturingRoundedIcon
            sx={{
                fontSize: 17,

                transformOrigin: 'center',

                animation:
                    selected
                        ? 'facConfirmFineMotion 1.6s ease-in-out infinite'
                        : 'none',

                '@keyframes facConfirmFineMotion': {
                    '0%, 100%': {
                        transform:
                            'rotate(-3deg) translateX(0)',
                    },

                    '25%': {
                        transform:
                            'rotate(2deg) translateX(1px)',
                    },

                    '50%': {
                        transform:
                            'rotate(0deg) translateX(0)',
                    },

                    '75%': {
                        transform:
                            'rotate(-2deg) translateX(-1px)',
                    },
                },

                '@media (prefers-reduced-motion: reduce)': {
                    animation: 'none',
                    transform: 'none',
                },
            }}
        />
    )
}


function HeatAnimatedIcon({
    selected,
    color,
    theme,
}: {
    selected: boolean
    color: string
    theme: Theme
}) {
    return (
        <Box
            sx={{
                position: 'relative',
                width: 22,
                height: 24,

                display: 'grid',
                placeItems: 'center',

                '& .heat-main': {
                    color,
                    position: 'absolute',
                    bottom: 1,
                    fontSize: 21,

                    transformOrigin:
                        'center bottom',

                    animation:
                        selected
                            ? 'facConfirmHeatMain .88s ease-in-out infinite'
                            : 'none',
                },

                '& .heat-inner': {
                    color:
                        theme.palette.warning.light,

                    position: 'absolute',
                    bottom: 1,
                    fontSize: 13,

                    transformOrigin:
                        'center bottom',

                    animation:
                        selected
                            ? 'facConfirmHeatInner .68s ease-in-out infinite'
                            : 'none',
                },

                '& .spark-1': {
                    position: 'absolute',
                    top: 2,
                    left: 8,

                    width: 2.5,
                    height: 2.5,

                    borderRadius: '50%',

                    bgcolor:
                        theme.palette.warning.main,

                    opacity: 0,

                    animation:
                        selected
                            ? 'facConfirmHeatSpark1 1.25s ease-out infinite'
                            : 'none',
                },

                '& .spark-2': {
                    position: 'absolute',
                    top: 4,
                    right: 6,

                    width: 2,
                    height: 2,

                    borderRadius: '50%',

                    bgcolor:
                        theme.palette.warning.light,

                    opacity: 0,

                    animation:
                        selected
                            ? 'facConfirmHeatSpark2 1.45s ease-out .28s infinite'
                            : 'none',
                },

                '@keyframes facConfirmHeatMain': {
                    '0%, 100%': {
                        transform:
                            'translate(0,0) scale(1,1) rotate(0deg)',

                        filter:
                            `drop-shadow(0 0 2px ${alpha(
                                color,
                                0.24,
                            )})`,
                    },

                    '30%': {
                        transform:
                            'translate(.4px,-3px) scale(1.04,1.17) rotate(2deg)',

                        filter:
                            `drop-shadow(0 2px 7px ${alpha(
                                color,
                                0.52,
                            )})`,
                    },

                    '62%': {
                        transform:
                            'translate(.4px,-2px) scale(1.03,1.14) rotate(1.5deg)',

                        filter:
                            `drop-shadow(0 2px 6px ${alpha(
                                color,
                                0.45,
                            )})`,
                    },
                },

                '@keyframes facConfirmHeatInner': {
                    '0%, 100%': {
                        transform:
                            'translateY(0) scale(.82,.9)',
                        opacity: .72,
                    },

                    '48%': {
                        transform:
                            'translateY(-2px) scale(.76,1.12)',
                        opacity: .86,
                    },

                    '72%': {
                        transform:
                            'translateY(-1px) scale(.9,1.02)',
                        opacity: .96,
                    },
                },

                '@keyframes facConfirmHeatSpark1': {
                    '0%': {
                        transform:
                            'translate(0,0) scale(.4)',
                        opacity: 0,
                    },

                    '20%': {
                        opacity: .9,
                    },

                    '100%': {
                        transform:
                            'translate(-2px,-10px) scale(.8)',
                        opacity: 0,
                    },
                },

                '@keyframes facConfirmHeatSpark2': {
                    '0%': {
                        transform:
                            'translate(0,0) scale(.35)',
                        opacity: 0,
                    },

                    '25%': {
                        opacity: .8,
                    },

                    '100%': {
                        transform:
                            'translate(2px,-9px) scale(.7)',
                        opacity: 0,
                    },
                },

                '@media (prefers-reduced-motion: reduce)': {
                    '& *': {
                        animation:
                            'none !important',

                        transform:
                            'none !important',

                        filter:
                            'none !important',
                    },
                },
            }}
        >
            <LocalFireDepartmentRoundedIcon
                className="heat-main"
            />

            <LocalFireDepartmentRoundedIcon
                className="heat-inner"
            />

            <Box className="spark-1" />
            <Box className="spark-2" />
        </Box>
    )
}