import type {
    Theme,
} from '@mui/material/styles'

import type {
    SystemStyleObject,
} from '@mui/system'


// =========================================================
// TRANSITIONS
// =========================================================

export const SIDEBAR_WIDTH = 238
export const SIDEBAR_COLLAPSED_WIDTH = 64
export const SIDEBAR_DURATION = 260
export const SIDEBAR_EASE = 'cubic-bezier(0.2, 0, 0, 1)'

export const sidebarTransition =
    `width ${SIDEBAR_DURATION}ms ${SIDEBAR_EASE}`

/**
 * Labels leave fast when collapsing, and come back slightly after the
 * panel starts growing when expanding, so text never squeezes.
 */
export function labelTransitionFor(collapsed: boolean) {
    return collapsed
        ? 'opacity 90ms ease, transform 120ms ease'
        : `opacity 180ms ease 90ms, transform 240ms ${SIDEBAR_EASE} 60ms`
}

export const iconTransition =
    'transform 160ms ease'


// =========================================================
// SIDEBAR SLOT
// The in-flow box that reserves space next to <main>. Its width changes
// once (no transition) so the page lays out a single time; the visual
// panel inside animates on its own and <main> slides with a transform.
// =========================================================

export function getSidebarSlotSx(
    collapsed: boolean,
): SystemStyleObject<Theme> {
    return {
        position: 'relative',
        zIndex: 10,
        flexShrink: 0,
        width: collapsed ? SIDEBAR_COLLAPSED_WIDTH : SIDEBAR_WIDTH,
        height: '100vh',
    }
}


// =========================================================
// SIDEBAR PANEL
// =========================================================

export function getSidebarSx(
    theme: Theme,
    collapsed: boolean,
): SystemStyleObject<Theme> {

    return {
        width:
            collapsed
                ? SIDEBAR_COLLAPSED_WIDTH
                : SIDEBAR_WIDTH,

        height:
            '100%',

        position:
            'absolute',

        top: 0,
        left: 0,
        bottom: 0,

        willChange:
            'width',

        display:
            'flex',

        flexDirection:
            'column',

        overflow:
            'hidden',

        contain:
            'layout paint',

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

        // No backdrop-filter: the sidebar holds looping animations (avatar,
        // LED, online dot) and a blurred backdrop would be redrawn every frame.

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

            // Wide soft gradient instead of filter: blur() – a blur is
            // re-rasterised on every frame while the panel width animates
            background:
                theme.palette.mode === 'dark'
                    ? 'radial-gradient(closest-side, rgba(99,102,241,0.10), transparent)'
                    : 'radial-gradient(closest-side, rgba(99,102,241,0.08), transparent)',
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
            1,
    }
}


// =========================================================
// EDGE RAIL (collapse / expand by clicking the sidebar border)
// A thin hit zone just outside the panel edge. Idle it is invisible; on
// hover a short accent line grows along the border. Lives in the slot
// (outside the clipped panel) and rides the edge with a transform.
// =========================================================

const RAIL_HIT = 8

export function getEdgeRailSx(
    theme: Theme,
    collapsed: boolean,
): SystemStyleObject<Theme> {
    const primary = theme.palette.primary.main
    const x = (collapsed ? SIDEBAR_COLLAPSED_WIDTH : SIDEBAR_WIDTH) - 2

    return {
        position: 'absolute',
        top: 0,
        bottom: 0,
        left: 0,
        zIndex: 2,
        width: RAIL_HIT,
        p: 0,
        border: 0,
        bgcolor: 'transparent',
        cursor: collapsed ? 'e-resize' : 'w-resize',
        transform: `translateX(${x}px)`,
        transition: `transform ${SIDEBAR_DURATION}ms ${SIDEBAR_EASE}`,

        // Accent line on the border itself
        '&::after': {
            content: '""',
            position: 'absolute',
            top: '50%',
            left: 1,
            width: 2,
            height: '100%',
            borderRadius: 2,
            background: `linear-gradient(180deg, transparent, ${primary} 30%, #38bdf8 70%, transparent)`,
            boxShadow: `0 0 10px ${primary}`,
            opacity: 0,
            transform: 'translateY(-50%) scaleY(0.35)',
            transition: 'opacity 160ms ease, transform 260ms cubic-bezier(0.2, 0, 0, 1)',
        },

        '&:hover::after': {
            opacity: 0.9,
            transform: 'translateY(-50%) scaleY(1)',
            transitionDelay: '80ms',
        },

        '@media (prefers-reduced-motion: reduce)': {
            transition: 'none',
            '&::after': { transition: 'none' },
        },
    }
}


// =========================================================
// HEADER TOGGLE BUTTON
// =========================================================

export function getToggleButtonSx(
    theme: Theme,
): SystemStyleObject<Theme> {
    const dark = theme.palette.mode === 'dark'
    const primary = theme.palette.primary.main

    return {
        width: 30,
        height: 30,
        flexShrink: 0,
        borderRadius: '9px',
        color: 'text.secondary',
        transition: 'color 160ms ease, background-color 160ms ease, box-shadow 160ms ease',

        '&:hover, &.Mui-focusVisible': {
            color: primary,
            bgcolor: dark ? 'rgba(96,165,250,0.12)' : 'rgba(37,99,235,0.08)',
            boxShadow: `inset 0 0 0 1px ${dark ? 'rgba(96,165,250,0.28)' : 'rgba(37,99,235,0.18)'}`,
        },

        '&:active': {
            bgcolor: dark ? 'rgba(96,165,250,0.18)' : 'rgba(37,99,235,0.12)',
        },
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
// HAZARD STRIPE (shared with the shutter rail of the
// clock-in / clock-out animations)
// =========================================================

export const hazardStripe = (dark: boolean) =>
    `repeating-linear-gradient(-45deg, #f59e0b 0 6px, ${dark ? '#0f172a' : '#374151'} 6px 12px)`


// =========================================================
// GROUP HEADER
// =========================================================

export function getGroupHeaderSx(
    theme: Theme,
    collapsed: boolean,
): SystemStyleObject<Theme> {

    return {
        minHeight: collapsed ? 0 : 30,
        height: collapsed ? 0 : 30,
        // Fixed expanded width: clipped by the panel instead of reflowing
        width: SIDEBAR_WIDTH - 16,
        flexShrink: 0,
        mx: 1,
        mb: 0.25,
        px: 1,
        py: 0,
        gap: 0.9,
        borderRadius: '8px',
        color: 'text.secondary',
        opacity: collapsed ? 0 : 1,
        overflow: 'hidden',
        pointerEvents: collapsed ? 'none' : 'auto',
        // Height follows the sidebar width so items below glide instead of jumping
        transition: `${labelTransitionFor(collapsed)}, height ${SIDEBAR_DURATION}ms ${SIDEBAR_EASE}, min-height ${SIDEBAR_DURATION}ms ${SIDEBAR_EASE}, color 160ms ease, background-color 160ms ease`,

        '&:hover': {
            color: 'text.primary',
            bgcolor: theme.palette.mode === 'dark'
                ? 'rgba(255,255,255,0.045)'
                : 'rgba(15,23,42,0.04)',
        },
    }
}


// =========================================================
// MENU ITEM
// The active background is the shared sliding indicator in
// LeftSidebar, so items themselves stay transparent.
// =========================================================

export function getMenuItemSx(
    theme: Theme,
    collapsed: boolean,
    active: boolean,
    color: string,
): SystemStyleObject<Theme> {

    return {
        position: 'relative',
        zIndex: 1,
        minHeight: 38,
        mx: collapsed ? 0 : 0.9,
        mb: 0.35,
        px: collapsed ? 0 : 1.15,
        justifyContent: collapsed ? 'center' : 'flex-start',
        borderRadius: '11px',
        color: active ? color : 'text.secondary',
        bgcolor: 'transparent',
        transition: 'color 160ms ease, background-color 160ms ease',

        '&:hover': {
            color: active ? color : 'text.primary',
            bgcolor: active
                ? 'transparent'
                : theme.palette.mode === 'dark'
                    ? 'rgba(255,255,255,0.05)'
                    : 'rgba(15,23,42,0.045)',

            '& .MuiListItemIcon-root svg': {
                transform: collapsed ? 'scale(1.12)' : 'translateX(2px) scale(1.06)',
            },
        },

        '&.Mui-selected, &.Mui-selected:hover, &.Mui-focusVisible': {
            bgcolor: 'transparent',
        },

        '&.Mui-focusVisible': {
            outline: '2px solid',
            outlineColor: color,
            outlineOffset: -2,
        },
    }
}


// =========================================================
// FOOTER (employee badge)
// =========================================================

export function getFooterSx(
    theme: Theme,
    collapsed: boolean,
): SystemStyleObject<Theme> {

    const dark = theme.palette.mode === 'dark'

    return {
        position: 'relative',
        overflow: 'hidden',
        // Expanded: fixed width so the name does not re-wrap (and the footer
        // height does not jump) while the panel grows
        width: collapsed ? 'auto' : SIDEBAR_WIDTH - 16,
        flexShrink: 0,
        boxSizing: 'border-box',
        mx: 1,
        mb: 1,
        px: collapsed ? 0.5 : 1.1,
        pt: collapsed ? 1 : 1.25,
        pb: collapsed ? 0.75 : 1,
        display: 'flex',
        flexDirection: collapsed ? 'column' : 'row',
        alignItems: 'center',
        gap: collapsed ? 0.75 : 1,
        borderRadius: '14px',
        background: dark
            ? 'linear-gradient(145deg, rgba(25,61,88,0.52), rgba(7,25,43,0.42))'
            : 'linear-gradient(145deg, rgba(255,255,255,0.80), rgba(225,241,252,0.52))',
        border: dark
            ? '1px solid rgba(113,196,245,0.14)'
            : '1px solid rgba(112,156,190,0.18)',
        boxShadow: dark
            ? '0 8px 22px rgba(0,0,0,0.16), inset 0 1px 0 rgba(220,245,255,0.07)'
            : '0 8px 22px rgba(31,74,108,0.07), inset 0 1px 0 rgba(255,255,255,0.88)',

        // Badge clip stripe
        '&::before': {
            content: '""',
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: 4,
            backgroundImage: hazardStripe(dark),
            opacity: 0.85,
        },
    }
}

