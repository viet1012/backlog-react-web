import type {
    Theme,
} from '@mui/material/styles'

import type {
    SystemStyleObject,
} from '@mui/system'

import type {
    GroupAccent,
} from './sidebarConfig'


// =========================================================
// TRANSITIONS
// =========================================================

export const sidebarTransition =
    'width 220ms ease'

export const labelTransition =
    'opacity 160ms ease, transform 180ms ease'

export const iconTransition =
    'transform 160ms ease'


// =========================================================
// SIDEBAR ROOT
// =========================================================

export function getSidebarSx(
    theme: Theme,
    collapsed: boolean,
): SystemStyleObject<Theme> {

    return {
        width:
            collapsed
                ? 64
                : 238,

        height:
            '100vh',

        flexShrink:
            0,

        position:
            'relative',

        display:
            'flex',

        flexDirection:
            'column',

        overflow:
            'hidden',

        // =====================================================
        // GLASS BACKGROUND
        // =====================================================

        background:
            theme.palette.mode === 'dark'
                ? `
          radial-gradient(
            circle at 10% 8%,
            rgba(59,130,246,0.18),
            transparent 30%
          ),
          radial-gradient(
            circle at 95% 35%,
            rgba(14,165,233,0.10),
            transparent 36%
          ),
          radial-gradient(
            circle at 15% 82%,
            rgba(139,92,246,0.08),
            transparent 34%
          ),
          linear-gradient(
            180deg,
            rgba(15,23,42,0.94) 0%,
            rgba(15,23,42,0.88) 50%,
            rgba(17,24,39,0.92) 100%
          )
        `
                : `
          radial-gradient(
            circle at 8% 6%,
            rgba(59,130,246,0.18),
            transparent 30%
          ),
          radial-gradient(
            circle at 96% 38%,
            rgba(56,189,248,0.14),
            transparent 36%
          ),
          radial-gradient(
            circle at 20% 78%,
            rgba(139,92,246,0.10),
            transparent 34%
          ),
          linear-gradient(
            180deg,
            rgba(248,250,252,0.80) 0%,
            rgba(241,245,249,0.70) 52%,
            rgba(248,250,252,0.78) 100%
          )
        `,

        backdropFilter:
            'blur(28px) saturate(145%)',

        WebkitBackdropFilter:
            'blur(28px) saturate(145%)',

        borderRight:
            theme.palette.mode === 'dark'
                ? '1px solid rgba(255,255,255,0.07)'
                : '1px solid rgba(255,255,255,0.72)',

        boxShadow:
            theme.palette.mode === 'dark'
                ? `
          12px 0 34px rgba(0,0,0,0.22),
          inset -1px 0 0 rgba(255,255,255,0.03)
        `
                : `
          12px 0 34px rgba(15,23,42,0.07),
          inset -1px 0 0 rgba(255,255,255,0.70)
        `,

        transition:
            sidebarTransition,

        // =====================================================
        // LIGHT REFLECTION
        // =====================================================

        '&::before': {
            content:
                '""',

            position:
                'absolute',

            inset:
                0,

            pointerEvents:
                'none',

            background:
                theme.palette.mode === 'dark'
                    ? `
            linear-gradient(
              135deg,
              rgba(255,255,255,0.035),
              transparent 32%
            )
          `
                    : `
            linear-gradient(
              135deg,
              rgba(255,255,255,0.72),
              rgba(255,255,255,0.10) 30%,
              transparent 50%
            )
          `,

            opacity:
                theme.palette.mode === 'dark'
                    ? 0.45
                    : 0.72,
        },

        // =====================================================
        // SOFT BOTTOM GLOW
        // =====================================================

        '&::after': {
            content:
                '""',

            position:
                'absolute',

            left:
                24,

            right:
                24,

            bottom:
                60,

            height:
                100,

            pointerEvents:
                'none',

            background:
                theme.palette.mode === 'dark'
                    ? 'radial-gradient(circle, rgba(99,102,241,0.10), transparent 68%)'
                    : 'radial-gradient(circle, rgba(99,102,241,0.08), transparent 68%)',

            filter:
                'blur(18px)',
        },

        '& > *': {
            position:
                'relative',

            zIndex:
                1,
        },

        '@media (prefers-reduced-motion: reduce)': {
            transition:
                'none',

            '& *': {
                transition:
                    'none !important',
            },
        },

        zIndex:
            10,
    }
}


// =========================================================
// BRAND WRAPPER
// =========================================================

export function getBrandCardSx(
    theme: Theme,
): SystemStyleObject<Theme> {

    return {
        flex:
            1,

        minWidth:
            0,

        display:
            'flex',

        alignItems:
            'center',

        gap:
            0.75,

        px:
            0.9,

        py:
            0.7,

        pr:
            3.2,

        borderRadius:
            '14px',

        background:
            theme.palette.mode === 'dark'
                ? `
          linear-gradient(
            135deg,
            rgba(255,255,255,0.065),
            rgba(255,255,255,0.025)
          )
        `
                : `
          linear-gradient(
            135deg,
            rgba(255,255,255,0.74),
            rgba(255,255,255,0.40)
          )
        `,

        border:
            theme.palette.mode === 'dark'
                ? '1px solid rgba(255,255,255,0.08)'
                : '1px solid rgba(255,255,255,0.90)',

        backdropFilter:
            'blur(20px) saturate(145%)',

        WebkitBackdropFilter:
            'blur(20px) saturate(145%)',

        boxShadow:
            theme.palette.mode === 'dark'
                ? `
          0 10px 28px rgba(0,0,0,0.16),
          inset 0 1px 0 rgba(255,255,255,0.06)
        `
                : `
          0 10px 28px rgba(15,23,42,0.07),
          inset 0 1px 0 rgba(255,255,255,0.95)
        `,
    }
}


// =========================================================
// GROUP HEADER
// =========================================================

export function getGroupHeaderSx(
    theme: Theme,
    collapsed: boolean,
    accent: GroupAccent,
): SystemStyleObject<Theme> {

    return {
        minHeight:
            collapsed
                ? 0
                : 36,

        height:
            collapsed
                ? 0
                : 36,

        mx:
            1,

        mb:
            0.55,

        px:
            1.25,

        py:
            collapsed
                ? 0
                : 0.5,

        borderRadius:
            '11px',

        opacity:
            collapsed
                ? 0
                : 1,

        overflow:
            'hidden',

        pointerEvents:
            collapsed
                ? 'none'
                : 'auto',

        background:
            theme.palette.mode === 'dark'
                ? `
          linear-gradient(
            135deg,
            ${accent.dark},
            rgba(255,255,255,0.025)
          )
        `
                : `
          linear-gradient(
            135deg,
            ${accent.light},
            rgba(255,255,255,0.54)
          )
        `,

        border:
            theme.palette.mode === 'dark'
                ? '1px solid rgba(255,255,255,0.055)'
                : '1px solid rgba(255,255,255,0.82)',

        backdropFilter:
            'blur(18px) saturate(140%)',

        WebkitBackdropFilter:
            'blur(18px) saturate(140%)',

        boxShadow:
            theme.palette.mode === 'dark'
                ? '0 5px 18px rgba(0,0,0,0.08)'
                : `
          0 5px 18px rgba(15,23,42,0.035),
          inset 0 1px 0 rgba(255,255,255,0.72)
        `,

        transform:
            collapsed
                ? 'translateX(-6px)'
                : 'translateX(0)',

        transition:
            `
        ${labelTransition},
        background 160ms ease,
        transform 160ms ease,
        box-shadow 160ms ease
      `,

        '&:hover': {
            transform:
                collapsed
                    ? 'translateX(-6px)'
                    : 'translateX(2px)',

            boxShadow:
                theme.palette.mode === 'dark'
                    ? `0 7px 20px ${accent.glow}`
                    : `
            0 7px 20px ${accent.glow},
            inset 0 1px 0 rgba(255,255,255,0.88)
          `,
        },
    }
}


// =========================================================
// MENU ITEM
// =========================================================

export function getMenuItemSx(
    theme: Theme,
    collapsed: boolean,
    active: boolean,
): SystemStyleObject<Theme> {

    return {
        position:
            'relative',

        minHeight:
            40,

        mx:
            collapsed
                ? 0
                : 0.9,

        mb:
            0.42,

        px:
            collapsed
                ? 0
                : 1.15,

        justifyContent:
            collapsed
                ? 'center'
                : 'flex-start',

        borderRadius:
            '11px',

        color:
            active
                ? 'primary.main'
                : 'text.secondary',

        background:
            theme.palette.mode === 'dark'
                ? 'rgba(255,255,255,0.018)'
                : 'rgba(255,255,255,0.22)',

        border:
            '1px solid transparent',

        backdropFilter:
            'blur(14px) saturate(130%)',

        WebkitBackdropFilter:
            'blur(14px) saturate(130%)',

        transition:
            `
        transform 150ms ease,
        background-color 160ms ease,
        box-shadow 160ms ease,
        color 160ms ease,
        border-color 160ms ease
      `,

        // =====================================================
        // ACTIVE LEFT INDICATOR
        // =====================================================

        '&::before': {
            content:
                '""',

            position:
                'absolute',

            left:
                0,

            top:
                8,

            bottom:
                8,

            width:
                3,

            borderRadius:
                '0 5px 5px 0',

            background:
                'linear-gradient(180deg, #2563eb 0%, #38bdf8 100%)',

            opacity:
                active
                    ? 1
                    : 0,

            transform:
                active
                    ? 'scaleY(1)'
                    : 'scaleY(0)',

            transformOrigin:
                'center',

            transition:
                'transform 180ms ease, opacity 180ms ease',

            boxShadow:
                active
                    ? '0 0 12px rgba(59,130,246,0.55)'
                    : 'none',
        },

        // =====================================================
        // HOVER
        // =====================================================

        '&:hover': {
            transform:
                collapsed
                    ? 'scale(1.05)'
                    : 'translateX(3px)',

            color:
                active
                    ? 'primary.main'
                    : 'text.primary',

            background:
                theme.palette.mode === 'dark'
                    ? 'rgba(255,255,255,0.065)'
                    : 'rgba(255,255,255,0.66)',

            borderColor:
                theme.palette.mode === 'dark'
                    ? 'rgba(255,255,255,0.075)'
                    : 'rgba(255,255,255,0.88)',

            boxShadow:
                theme.palette.mode === 'dark'
                    ? `
            0 8px 24px rgba(0,0,0,0.15),
            inset 0 1px 0 rgba(255,255,255,0.05)
          `
                    : `
            0 8px 24px rgba(15,23,42,0.055),
            inset 0 1px 0 rgba(255,255,255,0.88)
          `,

            '& .MuiListItemIcon-root svg': {
                transform:
                    'translateX(2px) scale(1.06)',
            },
        },

        // =====================================================
        // SELECTED / GLASS CARD
        // =====================================================

        '&.Mui-selected': {
            color:
                'primary.main',

            background:
                theme.palette.mode === 'dark'
                    ? `
            linear-gradient(
              135deg,
              rgba(59,130,246,0.22),
              rgba(56,189,248,0.08)
            )
          `
                    : `
            linear-gradient(
              135deg,
              rgba(255,255,255,0.82),
              rgba(219,234,254,0.50)
            )
          `,

            border:
                theme.palette.mode === 'dark'
                    ? '1px solid rgba(96,165,250,0.20)'
                    : '1px solid rgba(255,255,255,0.94)',

            backdropFilter:
                'blur(20px) saturate(150%)',

            WebkitBackdropFilter:
                'blur(20px) saturate(150%)',

            boxShadow:
                theme.palette.mode === 'dark'
                    ? `
            0 10px 28px rgba(0,0,0,0.17),
            0 0 18px rgba(59,130,246,0.06),
            inset 0 1px 0 rgba(255,255,255,0.08)
          `
                    : `
            0 10px 28px rgba(37,99,235,0.10),
            0 0 18px rgba(59,130,246,0.055),
            inset 0 1px 0 rgba(255,255,255,0.96)
          `,
        },

        '&.Mui-selected:hover': {
            background:
                theme.palette.mode === 'dark'
                    ? `
            linear-gradient(
              135deg,
              rgba(59,130,246,0.27),
              rgba(56,189,248,0.11)
            )
          `
                    : `
            linear-gradient(
              135deg,
              rgba(255,255,255,0.90),
              rgba(219,234,254,0.62)
            )
          `,

            boxShadow:
                theme.palette.mode === 'dark'
                    ? `
            0 12px 30px rgba(0,0,0,0.18),
            0 0 20px rgba(59,130,246,0.08),
            inset 0 1px 0 rgba(255,255,255,0.10)
          `
                    : `
            0 12px 30px rgba(37,99,235,0.12),
            0 0 20px rgba(59,130,246,0.07),
            inset 0 1px 0 rgba(255,255,255,0.98)
          `,
        },
    }
}


// =========================================================
// FOOTER
// =========================================================

export function getFooterSx(
    theme: Theme,
): SystemStyleObject<Theme> {

    return {
        mx:
            1,

        mb:
            1,

        px:
            1.25,

        py:
            0.85,

        borderRadius:
            '10px',

        background:
            theme.palette.mode === 'dark'
                ? `
          linear-gradient(
            135deg,
            rgba(255,255,255,0.045),
            rgba(255,255,255,0.02)
          )
        `
                : `
          linear-gradient(
            135deg,
            rgba(255,255,255,0.58),
            rgba(255,255,255,0.34)
          )
        `,

        border:
            theme.palette.mode === 'dark'
                ? '1px solid rgba(255,255,255,0.055)'
                : '1px solid rgba(255,255,255,0.78)',

        backdropFilter:
            'blur(16px) saturate(135%)',

        WebkitBackdropFilter:
            'blur(16px) saturate(135%)',

        boxShadow:
            theme.palette.mode === 'dark'
                ? '0 6px 18px rgba(0,0,0,0.08)'
                : `
          0 6px 18px rgba(15,23,42,0.035),
          inset 0 1px 0 rgba(255,255,255,0.78)
        `,
    }
}