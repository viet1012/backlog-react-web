import type {
  SxProps,
  Theme,
} from '@mui/material'


export const LOGIN_COLORS = {
  text: '#f4f8ff',
  primary: '#76c7ff',

  muted:
    'rgba(215, 231, 246, 0.62)',

  border:
    'rgba(160, 215, 255, 0.20)',
}


/* =========================================================
   INPUT
========================================================= */

export const loginFieldSx = {
  '& .MuiInputLabel-root': {
    color:
      'rgba(224, 239, 252, 0.58)',
  },

  '& .MuiInputLabel-root.Mui-focused': {
    color: '#8bd5ff',
  },

  '& .MuiOutlinedInput-root': {
    minHeight: 54,

    color: '#f4f8ff',

    borderRadius: '16px',

    background: `
      linear-gradient(
        135deg,
        rgba(255,255,255,0.065),
        rgba(255,255,255,0.025)
      )
    `,

    backdropFilter:
      'blur(14px)',

    WebkitBackdropFilter:
      'blur(14px)',

    transition:
      'border-color 160ms ease, background 160ms ease, box-shadow 160ms ease',

    '& fieldset': {
      borderColor:
        'rgba(180, 220, 250, 0.18)',
    },

    '&:hover': {
      background: `
        linear-gradient(
          135deg,
          rgba(255,255,255,0.085),
          rgba(255,255,255,0.035)
        )
      `,
    },

    '&:hover fieldset': {
      borderColor:
        'rgba(120, 203, 255, 0.40)',
    },

    '&.Mui-focused': {
      background: `
        linear-gradient(
          135deg,
          rgba(95,190,255,0.10),
          rgba(255,255,255,0.035)
        )
      `,

      boxShadow:
        '0 0 0 3px rgba(74, 177, 255, 0.08)',
    },

    '&.Mui-focused fieldset': {
      borderColor:
        'rgba(111, 204, 255, 0.72)',
    },

    '&.Mui-disabled': {
      opacity: 0.65,
    },
  },
} satisfies SxProps<Theme>

export const loginAlertSx = {
  py: 0.3,
  borderRadius: 2.5,
  color: '#ffd9dd',
  bgcolor: 'rgba(180, 35, 50, 0.18)',
  border: '1px solid rgba(255, 110, 120, 0.22)',
  backdropFilter: 'blur(12px)',
  WebkitBackdropFilter: 'blur(12px)',
  '& .MuiAlert-icon': {
    color: '#ff8d96',
  },
} satisfies SxProps<Theme>

export const authModeActionSx = {
  p: 0,
  border: 0,
  bgcolor: 'transparent',
  cursor: 'pointer',
  fontFamily: 'inherit',
  fontSize: 12.5,
  color: '#76c7ff',
  transition: 'color 150ms ease',
  '&:hover': {
    color: '#b5e5ff',
    textDecoration: 'underline',
  },
} satisfies SxProps<Theme>

export const authModeFooterSx = {
  mt: -0.25,
  textAlign: 'center',
  fontSize: 12.5,
  color: 'rgba(225, 237, 248, 0.62)',
} satisfies SxProps<Theme>

export const passwordToggleFieldSx = {
  ...loginFieldSx,
  '& .MuiInputAdornment-root': {
    mr: 0.25,
  },
  '& .MuiIconButton-root': {
    width: 34,
    height: 34,
    p: 0,
    borderRadius: '10px',
    color: 'rgba(220, 235, 247, 0.48)',
    background: 'transparent',
    border: '1px solid transparent',
    transition: 'color 180ms ease, background 180ms ease, border-color 180ms ease, box-shadow 180ms ease, transform 180ms ease',
    '& svg': { fontSize: 20 },
    '&[aria-pressed="true"]': { color: '#9fdcff' },
    '&:hover': {
      color: '#b8e6ff',
      background: 'rgba(120, 205, 255, 0.075)',
      borderColor: 'rgba(145, 214, 255, 0.10)',
      boxShadow: '0 4px 14px rgba(0, 45, 85, 0.14)',
      transform: 'translateY(-1px)',
    },
    '&:active': { transform: 'scale(0.95)' },
    '&.Mui-disabled': { color: 'rgba(210, 225, 238, 0.25)' },
  },
} satisfies SxProps<Theme>

export const loginButtonSx = {
  mt: 0.6,
  minHeight: 48,
  borderRadius: '16px',
  fontWeight: 750,
  textTransform: 'none',
  fontSize: 15,
  color: '#f5fbff',
  position: 'relative',
  overflow: 'hidden',
  background: `linear-gradient(135deg, rgba(82, 184, 255, 0.28) 0%, rgba(45, 137, 220, 0.22) 48%, rgba(31, 112, 190, 0.18) 100%)`,
  border: '1px solid rgba(139, 215, 255, 0.34)',
  backdropFilter: 'blur(16px) saturate(150%)',
  WebkitBackdropFilter: 'blur(16px) saturate(150%)',
  boxShadow: `0 12px 30px rgba(0, 90, 170, 0.18), inset 0 1px 0 rgba(255,255,255,0.16), inset 0 -1px 0 rgba(100,190,255,0.06)`,
  textShadow: '0 1px 8px rgba(0, 0, 0, 0.22)',
  transition: 'transform 160ms ease, border-color 160ms ease, background 160ms ease, box-shadow 160ms ease',
  '&::before': {
    content: '""',
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '48%',
    pointerEvents: 'none',
    background: 'linear-gradient(180deg, rgba(255,255,255,0.14), rgba(255,255,255,0.025))',
  },
  '&::after': {
    content: '""',
    position: 'absolute',
    width: 80,
    height: 80,
    top: '50%',
    left: '18%',
    transform: 'translate(-50%, -50%)',
    borderRadius: '50%',
    pointerEvents: 'none',
    background: 'rgba(100, 205, 255, 0.10)',
    filter: 'blur(22px)',
    transition: 'left 350ms ease, opacity 200ms ease',
    opacity: 0.8,
  },
  '&:hover': {
    transform: 'translateY(-1px)',
    borderColor: 'rgba(151, 222, 255, 0.56)',
    background: 'linear-gradient(135deg, rgba(95, 195, 255, 0.34) 0%, rgba(52, 151, 235, 0.28) 48%, rgba(38, 126, 208, 0.24) 100%)',
    boxShadow: '0 16px 36px rgba(0, 110, 195, 0.24), inset 0 1px 0 rgba(255,255,255,0.20), 0 0 24px rgba(82, 186, 255, 0.10)',
    '&::after': { left: '82%' },
  },
  '&:active': {
    transform: 'translateY(0) scale(0.995)',
    boxShadow: '0 8px 22px rgba(0, 90, 170, 0.17), inset 0 1px 0 rgba(255,255,255,0.12)',
  },
  '&.Mui-disabled': {
    color: 'rgba(235, 245, 255, 0.48)',
    background: 'linear-gradient(135deg, rgba(100, 160, 200, 0.12), rgba(50, 105, 145, 0.10))',
    borderColor: 'rgba(150, 200, 230, 0.12)',
    boxShadow: 'none',
    '&::after': { display: 'none' },
  },
  '& .MuiCircularProgress-root, & .MuiButton-startIcon, & .MuiButton-endIcon, & > *': {
    position: 'relative',
    zIndex: 2,
  },
} satisfies SxProps<Theme>


/* =========================================================
   GLASS CARD
========================================================= */
export const loginCardSx = {
  position: 'relative',

  width: '100%',
  maxWidth: 410,

  translate: {
    xs: '0 0',
    md: '0 -55px',
  },

  p: {
    xs: 3,
    sm: 3.5,
  },

  overflow: 'hidden',

  border:
    '1px solid rgba(142, 210, 255, 0.22)',

  borderRadius: '24px',

  background: `
    linear-gradient(
      145deg,
      rgba(13, 37, 59, 0.52) 0%,
      rgba(5, 21, 39, 0.42) 55%,
      rgba(3, 15, 29, 0.48) 100%
    )
  `,

  backdropFilter:
    'blur(20px) saturate(135%)',

  WebkitBackdropFilter:
    'blur(20px) saturate(135%)',

  boxShadow: `
    0 32px 90px rgba(0,0,0,0.30),
    inset 0 1px 0 rgba(255,255,255,0.075),
    0 0 0 1px rgba(85,180,245,0.03)
  `,

  '&::before': {
    content: '""',
    position: 'absolute',
    inset: 0,
    pointerEvents: 'none',
    borderRadius: 'inherit',

    background: `
      linear-gradient(
        135deg,
        rgba(255,255,255,0.085) 0%,
        rgba(255,255,255,0.02) 30%,
        transparent 58%
      )
    `,
  },

  '& > *': {
    position: 'relative',
    zIndex: 1,
  },
} satisfies SxProps<Theme>
/* =========================================================
   CENTER LOGIN
========================================================= */

export const centerContainerSx = {
  position: 'absolute',

  inset: 0,

  zIndex: 1,

  display: 'flex',

  alignItems: 'center',

  justifyContent: 'center',

  px: {
    xs: 2,
    sm: 4,
  },

  py: {
    xs: 2,
    md: 3,
  },

  boxSizing: 'border-box',
} satisfies SxProps<Theme>


/* =========================================================
   PAGE BACKGROUND
========================================================= */
export function createPageBackgroundSx(
  backgroundImage: string,
): SxProps<Theme> {
  return {
    position: 'relative',
    width: '100vw',
    height: '100dvh',
    overflow: 'hidden',

    color: '#f4f8ff',
    backgroundColor: '#020912',

    '&::before': {
      content: '""',

      position: 'absolute',

      inset: '-8%',

      backgroundImage: `url(${backgroundImage})`,
      backgroundPosition: 'center',
      backgroundSize: 'cover',
      backgroundRepeat: 'no-repeat',

      transformOrigin: 'center center',

      willChange: 'transform',

      backfaceVisibility: 'hidden',
      WebkitBackfaceVisibility: 'hidden',

      animation:
        'factoryCinematicMotion 24s ease-in-out infinite alternate',

      zIndex: 0,
    },

    '&::after': {
      content: '""',

      position: 'absolute',
      inset: 0,

      pointerEvents: 'none',

      background: `
        radial-gradient(
          circle at 50% 44%,
          rgba(16, 60, 95, 0.03) 0%,
          rgba(2, 12, 25, 0.07) 42%,
          rgba(1, 8, 18, 0.23) 100%
        ),

        linear-gradient(
          180deg,
          rgba(1, 8, 18, 0.06) 0%,
          rgba(1, 8, 18, 0.03) 47%,
          rgba(1, 8, 18, 0.27) 100%
        ),

        linear-gradient(
          90deg,
          rgba(0, 7, 18, 0.15) 0%,
          transparent 22%,
          transparent 78%,
          rgba(0, 7, 18, 0.16) 100%
        )
      `,

      zIndex: 0,
    },

    '@keyframes factoryCinematicMotion': {
      '0%': {
        transform:
          'scale(1.04) translate3d(-1.8%, -0.7%, 0) rotate(-0.35deg)',
      },

      '50%': {
        transform:
          'scale(1.075) translate3d(0%, 0.25%, 0) rotate(0deg)',
      },

      '100%': {
        transform:
          'scale(1.10) translate3d(1.8%, -0.4%, 0) rotate(0.35deg)',
      },
    },

    '@media (prefers-reduced-motion: reduce)': {
      '&::before': {
        animation: 'none',

        transform:
          'scale(1.04)',
      },
    },
  }
}
