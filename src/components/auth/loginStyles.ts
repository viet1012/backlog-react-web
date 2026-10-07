import type {
  SxProps,
  Theme,
} from '@mui/material'
import type { CSSProperties } from 'react'


export const LOGIN_COLORS = {
  text: '#f4f8ff',
  primary: '#76c7ff',

  muted:
    'rgba(215, 231, 246, 0.62)',

  border:
    'rgba(160, 215, 255, 0.20)',
}


/* =========================================================
   THEME TOKENS (ngày / đêm)
   Token được gán thành CSS variable (--auth-*) trên root trang login,
   các sx bên dưới chỉ đọc var(...) nên đổi chế độ không cần đổi sx.
========================================================= */
export const nightTokens = {
  // Card
  cardSkin: `
    linear-gradient(135deg, rgba(255,255,255,0.085) 0%, rgba(255,255,255,0.02) 30%, transparent 58%),
    linear-gradient(145deg, rgba(13, 37, 59, 0.52) 0%, rgba(5, 21, 39, 0.42) 55%, rgba(3, 15, 29, 0.48) 100%)
  `,
  cardSkinOpacity: '1',
  cardBgColor: 'rgba(255, 255, 255, 0)',
  cardBorder: 'rgba(142, 210, 255, 0.22)',
  cardBackdrop: 'blur(20px) saturate(135%)',
  cardShadow: '0 32px 90px rgba(0,0,0,0.30), inset 0 1px 0 rgba(255,255,255,0.075), 0 0 0 1px rgba(85,180,245,0.03)',

  // Header
  iconBoxBg: 'linear-gradient(145deg, rgba(255,255,255,0.16), rgba(255,255,255,0.06))',
  iconBoxBorder: 'rgba(160, 215, 255, 0.24)',
  iconBoxShadow: '0 8px 20px rgba(0, 0, 0, 0.18), inset 0 1px 0 rgba(255,255,255,0.12)',
  title: '#FFFFFF',
  titleShadow: '0 1px 2px rgba(0,0,0,0.45)',
  subtitle: 'rgba(255, 255, 255, 0.8)',
  headerHint: 'rgba(215, 231, 246, 0.72)',
  headerHintBg: 'rgba(67, 169, 255, 0.08)',
  headerHintBorder: 'rgba(120, 203, 255, 0.16)',

  // Input
  label: 'rgba(255, 255, 255, 0.9)',
  inputText: '#f4f8ff',
  inputBgColor: 'rgba(255, 255, 255, 0)',
  inputBgImage: 'linear-gradient(135deg, rgba(255,255,255,0.065), rgba(255,255,255,0.025))',
  inputBgImageHover: 'linear-gradient(135deg, rgba(255,255,255,0.085), rgba(255,255,255,0.035))',
  inputBgImageFocus: 'linear-gradient(135deg, rgba(95,190,255,0.10), rgba(255,255,255,0.035))',
  inputBackdrop: 'blur(14px)',
  inputBorder: 'rgba(180, 220, 250, 0.18)',
  inputBorderHover: 'rgba(120, 203, 255, 0.40)',
  inputBorderFocus: '#43a9ff',
  inputRing: '0 0 0 3px rgba(67, 169, 255, 0.18)',
  placeholder: 'rgba(215, 231, 246, 0.38)',
  // Icon trong ô input (user, ổ khóa, con mắt)
  inputIcon: 'rgba(226, 236, 248, 0.85)',
  inputIconFocus: '#7CC4FF',

  // Nút con mắt
  eyeIconHover: '#b8e6ff',
  eyeHoverBg: 'rgba(120, 205, 255, 0.075)',
  eyeHoverBorder: 'rgba(145, 214, 255, 0.10)',
  eyeHoverShadow: '0 4px 14px rgba(0, 45, 85, 0.14)',
  eyeIconDisabled: 'rgba(210, 225, 238, 0.25)',

  // Checkbox
  checkbox: 'rgba(175, 210, 236, 0.55)',
  checkboxChecked: '#43a9ff',
  checkboxLabel: 'rgba(225, 237, 248, 0.72)',

  // Nút Sign In
  buttonText: '#f5fbff',
  buttonTextDisabled: 'rgba(235, 245, 255, 0.48)',
  buttonTextShadow: '0 1px 8px rgba(0, 0, 0, 0.22)',
  buttonBgColor: 'rgba(37, 99, 235, 0)',
  buttonBgColorHover: 'rgba(29, 78, 216, 0)',
  buttonBgColorDisabled: 'rgba(37, 99, 235, 0)',
  buttonBgImage: 'linear-gradient(135deg, rgba(82, 184, 255, 0.28) 0%, rgba(45, 137, 220, 0.22) 48%, rgba(31, 112, 190, 0.18) 100%)',
  buttonBgImageHover: 'linear-gradient(135deg, rgba(95, 195, 255, 0.34) 0%, rgba(52, 151, 235, 0.28) 48%, rgba(38, 126, 208, 0.24) 100%)',
  buttonBgImageDisabled: 'linear-gradient(135deg, rgba(100, 160, 200, 0.12), rgba(50, 105, 145, 0.10))',
  buttonBorder: 'rgba(139, 215, 255, 0.34)',
  buttonBorderHover: 'rgba(151, 222, 255, 0.56)',
  buttonBorderDisabled: 'rgba(150, 200, 230, 0.12)',
  buttonBackdrop: 'blur(16px) saturate(150%)',
  buttonShadow: '0 12px 30px rgba(0, 90, 170, 0.18), inset 0 1px 0 rgba(255,255,255,0.16), inset 0 -1px 0 rgba(100,190,255,0.06)',
  buttonShadowHover: '0 16px 36px rgba(0, 110, 195, 0.24), inset 0 1px 0 rgba(255,255,255,0.20), 0 0 24px rgba(82, 186, 255, 0.10)',
  buttonShadowActive: '0 8px 22px rgba(0, 90, 170, 0.17), inset 0 1px 0 rgba(255,255,255,0.12)',
  buttonFxOpacity: '1',

  // Text phụ
  hint: 'rgba(255, 255, 255, 0.7)',
  footer: 'rgba(255, 255, 255, 0.7)',
  link: '#76c7ff',
  linkHover: '#b5e5ff',
  linkWeight: '400',

  // Thông báo lỗi / Caps Lock
  alertText: '#ffd9dd',
  alertBg: 'rgba(180, 35, 50, 0.18)',
  alertBorder: 'rgba(255, 110, 120, 0.22)',
  alertIcon: '#ff8d96',
  alertBackdrop: 'blur(12px)',
  capsLock: '#ffd28a',

  // Logo F2 + slogan (ngoài card)
  brandTitleShadow: '0 3px 14px rgba(0,0,0,0.28)',
  brandTextShadow: 'none',
  heroShadow: '0 4px 22px rgba(0,0,0,0.30)',
}

export type AuthTokens = typeof nightTokens

const DAY_BRAND_SHADOW = '0 2px 8px rgba(0,0,0,0.35)'

export const dayTokens: AuthTokens = {
  cardSkin: nightTokens.cardSkin,
  cardSkinOpacity: '0',
  cardBgColor: 'rgba(255, 255, 255, 0.80)',
  cardBorder: 'rgba(255, 255, 255, 0.65)',
  cardBackdrop: 'blur(18px) saturate(1.4)',
  cardShadow: '0 20px 50px rgba(15, 40, 80, 0.25)',

  iconBoxBg: '#EEF4FF',
  iconBoxBorder: '#DBE6FF',
  iconBoxShadow: '0 4px 12px rgba(15, 40, 80, 0.08)',
  title: '#0F1E33',
  titleShadow: 'none',
  subtitle: '#4A5B72',
  headerHint: '#334155',
  headerHintBg: '#EEF4FF',
  headerHintBorder: '#DBE6FF',

  label: '#1F2D40',
  inputText: '#0F1E33',
  inputBgColor: '#FFFFFF',
  inputBgImage: 'none',
  inputBgImageHover: 'none',
  inputBgImageFocus: 'none',
  inputBackdrop: 'none',
  inputBorder: '#D5DEE9',
  inputBorderHover: '#B6C4D6',
  inputBorderFocus: '#2563EB',
  inputRing: '0 0 0 3px rgba(37, 99, 235, 0.18)',
  placeholder: '#94A3B8',
  inputIcon: '#475569',
  inputIconFocus: '#2563EB',

  eyeIconHover: '#334155',
  eyeHoverBg: '#F1F5F9',
  eyeHoverBorder: 'transparent',
  eyeHoverShadow: 'none',
  eyeIconDisabled: '#CBD5E1',

  checkbox: '#94A3B8',
  checkboxChecked: '#2563EB',
  checkboxLabel: '#334155',

  buttonText: '#FFFFFF',
  buttonTextDisabled: '#FFFFFF',
  buttonTextShadow: 'none',
  buttonBgColor: '#2563EB',
  buttonBgColorHover: '#1D4ED8',
  buttonBgColorDisabled: 'rgba(37, 99, 235, 0.45)',
  buttonBgImage: 'none',
  buttonBgImageHover: 'none',
  buttonBgImageDisabled: 'none',
  buttonBorder: 'transparent',
  buttonBorderHover: 'transparent',
  buttonBorderDisabled: 'transparent',
  buttonBackdrop: 'none',
  buttonShadow: '0 8px 20px rgba(37, 99, 235, 0.28)',
  buttonShadowHover: '0 10px 24px rgba(29, 78, 216, 0.32)',
  buttonShadowActive: '0 4px 12px rgba(29, 78, 216, 0.28)',
  buttonFxOpacity: '0',

  hint: '#5B6B80',
  footer: '#475569',
  link: '#1D4ED8',
  linkHover: '#1E40AF',
  linkWeight: '600',

  alertText: '#B91C1C',
  alertBg: '#FEF2F2',
  alertBorder: '#FECACA',
  alertIcon: '#DC2626',
  alertBackdrop: 'none',
  capsLock: '#B45309',

  brandTitleShadow: DAY_BRAND_SHADOW,
  brandTextShadow: DAY_BRAND_SHADOW,
  heroShadow: DAY_BRAND_SHADOW,
}

function toCssVarName(key: string) {
  return `--auth-${key.replace(/[A-Z]/g, (char) => `-${char.toLowerCase()}`)}`
}

// Đọc token trong sx: v('title') -> 'var(--auth-title)'
export function v(key: keyof AuthTokens) {
  return `var(${toCssVarName(key)})`
}

/*
  Gán token lên root trang login qua prop `style` (không qua sx/emotion):
  emotion coi mọi chuỗi "label:<giá trị>" trong style là label và nối vào tên class,
  nên --auth-label:#1F2D40 làm class thành "css-xxx-#1F2D40" -> selector không hợp lệ,
  trình duyệt bỏ cả rule và toàn bộ biến --auth-* bị mất (chỉ lộ ra ở bản ngày vì giá trị hex không có dấu cách).
*/
export function createAuthThemeVars(isDaytime: boolean): CSSProperties {
  const tokens = isDaytime ? dayTokens : nightTokens

  return Object.fromEntries(
    Object.entries(tokens).map(([key, value]) => [toCssVarName(key), value.trim()]),
  ) as CSSProperties
}

// Khi đang chuyển ngày/đêm (data-mode-switching="true") mọi màu trong trang fade cùng thời gian với background
export function createAuthModeSwitchSx() {
  const fade = (property: string) => `${property} ${BACKGROUND_FADE_MS}ms ease-in-out`

  return {
    '&[data-mode-switching="true"] *, &[data-mode-switching="true"] *::before, &[data-mode-switching="true"] *::after': {
      transition: `${[
        'color',
        'background-color',
        'border-color',
        'box-shadow',
        'text-shadow',
        'opacity',
        'fill',
        'backdrop-filter',
      ].map(fade).join(', ')} !important`,
    },
  }
}


/* =========================================================
   INPUT
========================================================= */

// Label nằm phía trên ô (AuthField), không dùng floating label
export const loginFieldSx = {
  '& .MuiOutlinedInput-root': {
    minHeight: 48,

    color: v('inputText'),

    fontSize: 14.5,

    borderRadius: '12px',

    backgroundColor: v('inputBgColor'),
    backgroundImage: v('inputBgImage'),

    backdropFilter: v('inputBackdrop'),
    WebkitBackdropFilter: v('inputBackdrop'),

    transition:
      'border-color 160ms ease, background-color 160ms ease, box-shadow 160ms ease',

    '& fieldset': {
      borderColor: v('inputBorder'),
    },

    '& input::placeholder': {
      color: v('placeholder'),
      opacity: 1,
    },

    // Icon đầu ô (user / ổ khóa)
    '& .MuiInputAdornment-positionStart': {
      mr: 0.5,

      '& svg': {
        fontSize: 19,
      },
    },

    // Màu mọi icon trong ô (user, ổ khóa, con mắt)
    '& .MuiInputAdornment-root svg': {
      color: v('inputIcon'),
      transition: 'color 160ms ease',
    },

    '&:hover': {
      backgroundImage: v('inputBgImageHover'),
    },

    '&:hover fieldset': {
      borderColor: v('inputBorderHover'),
    },

    '&.Mui-focused': {
      backgroundImage: v('inputBgImageFocus'),
      boxShadow: v('inputRing'),
    },

    '&.Mui-focused fieldset': {
      borderWidth: '1.5px',
      borderColor: v('inputBorderFocus'),
    },

    '&.Mui-focused .MuiInputAdornment-root svg': {
      color: v('inputIconFocus'),
    },

    '&.Mui-disabled': {
      opacity: 0.65,
    },
  },
} satisfies SxProps<Theme>

export const authLabelSx = {
  display: 'block',
  mb: 0.75,
  fontSize: 12.5,
  fontWeight: 600,
  letterSpacing: '0.01em',
  color: v('label'),
} satisfies SxProps<Theme>

// Dòng gợi ý nhỏ, màu nhạt (S-Patrol)
export const authHintSx = {
  textAlign: 'center',
  fontSize: 12,
  lineHeight: 1.5,
  color: v('hint'),
} satisfies SxProps<Theme>

export const capsLockHintSx = {
  mt: 0.75,
  fontSize: 12,
  fontWeight: 500,
  lineHeight: 1.4,
  color: v('capsLock'),
} satisfies SxProps<Theme>

export const loginAlertSx = {
  py: 0.3,
  borderRadius: 2.5,
  color: v('alertText'),
  bgcolor: v('alertBg'),
  border: '1px solid',
  borderColor: v('alertBorder'),
  backdropFilter: v('alertBackdrop'),
  WebkitBackdropFilter: v('alertBackdrop'),
  '& .MuiAlert-icon': {
    color: v('alertIcon'),
  },
} satisfies SxProps<Theme>

export const authModeActionSx = {
  p: 0,
  border: 0,
  bgcolor: 'transparent',
  cursor: 'pointer',
  fontFamily: 'inherit',
  fontSize: 12.5,
  fontWeight: v('linkWeight'),
  color: v('link'),
  transition: 'color 150ms ease',
  '&:hover': {
    color: v('linkHover'),
    textDecoration: 'underline',
  },
} satisfies SxProps<Theme>

export const authModeFooterSx = {
  mt: -0.25,
  textAlign: 'center',
  fontSize: 12.5,
  color: v('footer'),
} satisfies SxProps<Theme>

export const authCheckboxSx = {
  color: v('checkbox'),

  '&.Mui-checked': {
    color: v('checkboxChecked'),
  },
} satisfies SxProps<Theme>

export const authCheckboxLabelSx = {
  m: 0,
  ml: -0.75,

  '& .MuiFormControlLabel-label': {
    fontSize: 12.5,
    color: v('checkboxLabel'),
  },
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
    color: v('inputIcon'),
    backgroundColor: 'transparent',
    border: '1px solid transparent',
    transition: 'color 180ms ease, background-color 180ms ease, border-color 180ms ease, box-shadow 180ms ease, transform 180ms ease',
    '& svg': { fontSize: 20 },
    '&:hover': {
      color: v('eyeIconHover'),
      backgroundColor: v('eyeHoverBg'),
      borderColor: v('eyeHoverBorder'),
      boxShadow: v('eyeHoverShadow'),
      transform: 'translateY(-1px)',
    },
    '&:active': { transform: 'scale(0.95)' },
  },
  // Cùng độ ưu tiên với rule màu icon khi focus ở loginFieldSx, đặt sau nên thắng
  '& .MuiOutlinedInput-root .MuiIconButton-root:hover svg': {
    color: v('eyeIconHover'),
  },
  '& .MuiOutlinedInput-root .MuiIconButton-root.Mui-disabled svg': {
    color: v('eyeIconDisabled'),
  },
} satisfies SxProps<Theme>

export const loginButtonSx = {
  mt: 0.5,
  minHeight: 48,
  borderRadius: '12px',
  fontWeight: 750,
  textTransform: 'none',
  fontSize: 15,
  color: v('buttonText'),
  position: 'relative',
  overflow: 'hidden',
  backgroundColor: v('buttonBgColor'),
  backgroundImage: v('buttonBgImage'),
  border: '1px solid',
  borderColor: v('buttonBorder'),
  backdropFilter: v('buttonBackdrop'),
  WebkitBackdropFilter: v('buttonBackdrop'),
  boxShadow: v('buttonShadow'),
  textShadow: v('buttonTextShadow'),
  transition: 'transform 160ms ease, border-color 160ms ease, background-color 160ms ease, box-shadow 160ms ease',
  '&::before': {
    content: '""',
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '48%',
    pointerEvents: 'none',
    opacity: v('buttonFxOpacity'),
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
    opacity: `calc(0.8 * ${v('buttonFxOpacity')})`,
  },
  '&:hover': {
    transform: 'translateY(-1px)',
    borderColor: v('buttonBorderHover'),
    backgroundColor: v('buttonBgColorHover'),
    backgroundImage: v('buttonBgImageHover'),
    boxShadow: v('buttonShadowHover'),
    '&::after': { left: '82%' },
  },
  '&:active': {
    transform: 'translateY(0) scale(0.995)',
    boxShadow: v('buttonShadowActive'),
  },
  '&.Mui-disabled': {
    color: v('buttonTextDisabled'),
    backgroundColor: v('buttonBgColorDisabled'),
    backgroundImage: v('buttonBgImageDisabled'),
    borderColor: v('buttonBorderDisabled'),
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
  maxWidth: 420,

  translate: {
    xs: '0 0',
    md: '0 -55px',
  },

  p: {
    xs: 3,
    sm: 3.5,
  },

  overflow: 'hidden',

  border: '1px solid',
  borderColor: v('cardBorder'),

  borderRadius: '20px',

  // background-color: nền chính (ngày rgba(255,255,255,0.80), đêm trong suốt) - chỉ transition màu.
  // Gradient kính tối của đêm nằm ở ::before (background-image, không transition), ẩn/hiện bằng opacity.
  backgroundColor: v('cardBgColor'),
  backgroundImage: 'none',

  backdropFilter: v('cardBackdrop'),
  WebkitBackdropFilter: v('cardBackdrop'),

  boxShadow: v('cardShadow'),

  '&::before': {
    content: '""',
    position: 'absolute',
    inset: 0,
    pointerEvents: 'none',
    borderRadius: 'inherit',

    backgroundImage: v('cardSkin'),
    opacity: v('cardSkinOpacity'),
  },

  // Accent bar xanh ở cạnh trên card
  '&::after': {
    content: '""',
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 3,
    pointerEvents: 'none',
    zIndex: 2,

    background:
      'linear-gradient(90deg, #2f8fe8 0%, #5cc3ff 55%, #2f8fe8 100%)',
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
   BACKGROUND IMAGE LAYER (dùng chung cho ảnh đêm và ảnh ngày)
   Chuyển động nhẹ, không rotate, scale tối đa 1.03 để ảnh không bị nội suy nhòe.
   Mép ảnh: lớp rộng 104% (inset -2%), dịch tối đa ~1.25% mỗi chiều -> không lộ viền.
========================================================= */
const BG_LAYER_INSET = '-2%'

function bgImageLayerBase(backgroundImage: string) {
  return {
    content: '""',
    position: 'absolute',
    inset: BG_LAYER_INSET,

    backgroundImage: `url(${backgroundImage})`,
    backgroundPosition: 'center',
    backgroundSize: 'cover',
    backgroundRepeat: 'no-repeat',

    transformOrigin: 'center center',
    willChange: 'transform',
    backfaceVisibility: 'hidden',
    WebkitBackfaceVisibility: 'hidden',

    animation: 'factoryCinematicMotion 30s ease-in-out infinite alternate',
  }
}

const cinematicMotionKeyframes = {
  '0%': {
    transform: 'scale(1) translate3d(-1.2%, -0.4%, 0)',
  },
  '50%': {
    transform: 'scale(1.015) translate3d(0%, 0.2%, 0)',
  },
  '100%': {
    transform: 'scale(1.03) translate3d(1.2%, -0.3%, 0)',
  },
}

const bgReducedMotionSx = {
  '@media (prefers-reduced-motion: reduce)': {
    '&::before': {
      animation: 'none',
      transform: 'none',
    },
  },
}


/* =========================================================
   PAGE BACKGROUND
========================================================= */
interface PageBackgroundOptions {
  // Bỏ trống: overlay luôn hiện như cũ. true/false: bật/tắt overlay đêm kèm fade
  nightOverlayVisible?: boolean
}

export function createPageBackgroundSx(
  backgroundImage: string,
  { nightOverlayVisible }: PageBackgroundOptions = {},
) {
  const nightOverlayToggleSx: Record<string, string | number> =
    nightOverlayVisible === undefined
      ? {}
      : {
        opacity: nightOverlayVisible ? 1 : 0,
        transition: `opacity ${BACKGROUND_FADE_MS}ms ease-in-out`,
      }

  return {
    position: 'relative',
    width: '100vw',
    height: '100dvh',
    overflow: 'hidden',

    color: '#f4f8ff',
    backgroundColor: '#020912',

    '&::before': {
      ...bgImageLayerBase(backgroundImage),
      zIndex: 0,
    },

    '&::after': {
      ...nightOverlayToggleSx,

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

    '@keyframes factoryCinematicMotion': cinematicMotionKeyframes,

    ...bgReducedMotionSx,
  }
}


/* =========================================================
   DAY BACKGROUND LAYER (chồng lên ảnh đêm, fade bằng opacity)
========================================================= */
export const BACKGROUND_FADE_MS = 900

// Opacity overlay tối của ảnh ngày (0 = trong suốt, 1 = đen hẳn) — chỉnh tay ở đây
export const DAY_OVERLAY_OPACITY = {
  // Vùng trái sau logo F2 / slogan (mép trái → mờ dần tới ~60% chiều ngang)
  left: 0.30,
  leftFade: 0.05,

  // Vùng giữa sau card (tâm → bán kính ~38% → viền ngoài)
  center: 0.08,
  centerFade: 0.04,
  centerEdge: 0.10,

  // Dải dọc: trên cùng / giữa / dưới cùng
  top: 0.12,
  middle: 0,
  bottom: 0.35,
}

export function createDayBackgroundLayerSx(
  backgroundImage: string,
  visible: boolean,
): SxProps<Theme> {
  return {
    position: 'absolute',
    inset: 0,
    zIndex: 0,
    overflow: 'hidden',
    pointerEvents: 'none',

    opacity: visible ? 1 : 0,
    transition: `opacity ${BACKGROUND_FADE_MS}ms ease-in-out`,

    // Cùng chuyển động với ảnh đêm để lúc fade không bị lệch khung
    '&::before': bgImageLayerBase(backgroundImage),

    // Overlay tối cho ảnh ngày: đậm hơn ở góc trái (logo F2, slogan) và quanh card
    '&::after': {
      content: '""',
      position: 'absolute',
      inset: 0,

      background: `
        radial-gradient(
          circle at 50% 46%,
          rgba(2, 14, 30, ${DAY_OVERLAY_OPACITY.center}) 0%,
          rgba(2, 14, 30, ${DAY_OVERLAY_OPACITY.centerFade}) 38%,
          rgba(1, 8, 18, ${DAY_OVERLAY_OPACITY.centerEdge}) 100%
        ),

        linear-gradient(
          180deg,
          rgba(1, 8, 18, ${DAY_OVERLAY_OPACITY.top}) 0%,
          rgba(1, 8, 18, ${DAY_OVERLAY_OPACITY.middle}) 40%,
          rgba(1, 8, 18, ${DAY_OVERLAY_OPACITY.bottom}) 100%
        ),

        linear-gradient(
          90deg,
          rgba(0, 7, 18, ${DAY_OVERLAY_OPACITY.left}) 0%,
          rgba(0, 7, 18, ${DAY_OVERLAY_OPACITY.leftFade}) 32%,
          transparent 60%
        )
      `,
    },

    '@keyframes factoryCinematicMotion': cinematicMotionKeyframes,

    ...bgReducedMotionSx,
  }
}
