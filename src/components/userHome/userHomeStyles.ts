import type { SxProps, Theme } from '@mui/material'

export function createUserHomeHeroSx(backgroundImage: string): SxProps<Theme> {
  return {
    position: 'relative',
    flex: 1,
    minWidth: 0,
    minHeight: 0,
    display: 'grid',
    placeItems: 'center',
    overflow: 'hidden',
    borderRadius: 2.5,
    bgcolor: '#020912',
    isolation: 'isolate',

    '&::before': {
      content: '""',
      position: 'absolute',
      inset: '-7%',
      zIndex: -3,
      backgroundImage: `url(${backgroundImage})`,
      backgroundPosition: 'center',
      backgroundSize: 'cover',
      backgroundRepeat: 'no-repeat',
      transformOrigin: 'center center',
      backfaceVisibility: 'hidden',
      WebkitBackfaceVisibility: 'hidden',
      willChange: 'transform',
      animation: 'userHomeKenBurns 34s ease-in-out infinite alternate',
    },

    '&::after': {
      content: '""',

      position: 'absolute',
      inset: 0,

      zIndex: -1,

      pointerEvents: 'none',

      background: `
    radial-gradient(
      circle at 50% 44%,
      rgba(27, 109, 165, 0.04) 0%,
      transparent 43%
    ),

    linear-gradient(
      180deg,
      rgba(1, 8, 18, 0.14) 0%,
      rgba(2, 10, 22, 0.19) 54%,
      rgba(1, 7, 16, 0.38) 100%
    ),

    linear-gradient(
      90deg,
      rgba(0, 6, 15, 0.18) 0%,
      transparent 28%,
      transparent 72%,
      rgba(0, 6, 15, 0.18) 100%
    )
  `,
    },
    '@keyframes userHomeKenBurns': {
      '0%': {
        transform: 'scale(1.035) translate3d(-0.65%, -0.2%, 0) rotate(-0.12deg)',
      },
      '50%': {
        transform: 'scale(1.055) translate3d(0.1%, 0.18%, 0) rotate(0deg)',
      },
      '100%': {
        transform: 'scale(1.075) translate3d(0.7%, -0.12%, 0) rotate(0.12deg)',
      },
    },

    '@keyframes userHomeAmbientDrift': {
      from: {
        opacity: 0.32,
        transform: 'translate3d(-1.5%, 0.5%, 0) scale(1)',
      },
      to: {
        opacity: 0.48,
        transform: 'translate3d(1.5%, -0.5%, 0) scale(1.04)',
      },
    },

    '@media (prefers-reduced-motion: reduce)': {
      '&::before': {
        animation: 'none',
        transform: 'scale(1.04)',
      },
      '& .user-home-ambient, & .user-home-card': {
        animation: 'none',
      },
    },
  }
}

export const userHomeAmbientSx = {
  position: 'absolute',
  zIndex: -2,
  width: '70%',
  height: '70%',
  borderRadius: '50%',
  pointerEvents: 'none',
  opacity: 0.38,
  background: 'radial-gradient(circle, rgba(48, 161, 230, 0.17) 0%, rgba(24, 93, 145, 0.055) 38%, transparent 72%)',
  filter: 'blur(28px)',
  willChange: 'transform, opacity',
  animation: 'userHomeAmbientDrift 30s ease-in-out infinite alternate',
} satisfies SxProps<Theme>

export const userHomeCardSx = {
  position: 'relative',

  width: 'calc(100% - 32px)',
  maxWidth: 600,

  p: {
    xs: 3,
    sm: 4.5,
  },

  overflow: 'hidden',

  color: '#f4f8ff',
  textAlign: 'center',

  borderRadius: '32px',

  /*
   * QUAN TRỌNG:
   * Glass phải trong hơn.
   * Bản cũ opacity ~0.7-0.8 => quá đặc.
   */
  background: `
    linear-gradient(
      145deg,
      rgba(19, 54, 82, 0.52) 0%,
      rgba(7, 29, 52, 0.44) 46%,
      rgba(3, 18, 36, 0.52) 100%
    )
  `,

  backdropFilter:
    'blur(34px) saturate(185%)',

  WebkitBackdropFilter:
    'blur(34px) saturate(185%)',

  /*
   * Viền thường chỉ dùng fallback.
   * Viền sáng thật sẽ do ::before tạo.
   */
  border:
    '1px solid rgba(135, 220, 255, 0.38)',

  boxShadow: `
    0 42px 110px rgba(0, 0, 0, 0.52),

    0 0 12px rgba(74, 190, 255, 0.30),
    0 0 32px rgba(59, 170, 245, 0.22),
    0 0 70px rgba(38, 137, 220, 0.12),

    inset 0 1px 0 rgba(238, 252, 255, 0.42),
    inset 0 0 0 1px rgba(117, 206, 255, 0.08),
    inset 0 -1px 0 rgba(75, 170, 235, 0.20)
  `,

  animation:
    'userHomeCardEnter 560ms cubic-bezier(0.22, 1, 0.36, 1) both',

  /*
   * GRADIENT GLASS RIM
   *
   * Đây là phần Code X hiện tại thiếu.
   */
  '&::before': {
    content: '""',

    position: 'absolute',
    inset: 0,

    padding: '1.5px',

    borderRadius: 'inherit',

    pointerEvents: 'none',

    background: `
      linear-gradient(
        135deg,

        rgba(218, 247, 255, 0.95) 0%,

        rgba(116, 215, 255, 0.78) 8%,

        rgba(64, 177, 245, 0.38) 26%,

        rgba(49, 139, 205, 0.14) 48%,

        rgba(70, 174, 238, 0.28) 72%,

        rgba(148, 226, 255, 0.72) 92%,

        rgba(226, 250, 255, 0.92) 100%
      )
    `,

    WebkitMask: `
      linear-gradient(#fff 0 0)
      content-box,

      linear-gradient(#fff 0 0)
    `,

    WebkitMaskComposite:
      'xor',

    maskComposite:
      'exclude',

    filter:
      'drop-shadow(0 0 5px rgba(105, 211, 255, 0.50))',

    opacity: 0.95,

    zIndex: 3,
  },

  /*
   * REFLECTION / GLASS SHINE
   */
  '&::after': {
    content: '""',

    position: 'absolute',

    inset: '1px',

    borderRadius: '31px',

    pointerEvents: 'none',

    background: `
      radial-gradient(
        ellipse at 8% 0%,
        rgba(222, 248, 255, 0.25) 0%,
        rgba(135, 218, 255, 0.10) 18%,
        transparent 43%
      ),

      radial-gradient(
        ellipse at 100% 100%,
        rgba(93, 195, 255, 0.16) 0%,
        transparent 36%
      ),

      linear-gradient(
        132deg,
        rgba(255,255,255,0.16) 0%,
        rgba(185,234,255,0.06) 13%,
        transparent 30%,
        transparent 72%,
        rgba(89,188,248,0.055) 100%
      )
    `,

    boxShadow: `
      inset 0 14px 26px rgba(189, 235, 255, 0.035),
      inset 0 -18px 30px rgba(0, 20, 42, 0.14)
    `,

    zIndex: 0,
  },

  '& > *': {
    position: 'relative',
    zIndex: 2,
  },

  '@keyframes userHomeCardEnter': {
    from: {
      opacity: 0,
      transform:
        'translateY(10px) scale(0.982)',
    },

    to: {
      opacity: 1,
      transform:
        'translateY(0) scale(1)',
    },
  },

  '@media (prefers-reduced-motion: reduce)': {
    animation: 'none',
  },
} satisfies SxProps<Theme>