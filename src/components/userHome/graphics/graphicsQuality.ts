import { loadPreference, savePreference } from '../../../utils/uiPreferences'

/*
 * Mức chất lượng đồ hoạ trang chủ. Không import three: trang dùng file này trước khi quyết định tải bản 3D.
 *
 * flat   2D CSS, không WebGL            -> máy rất yếu / không có WebGL
 * low    3D phẳng, nét viền kiểu truyện tranh, không bóng thời gian thực
 * medium 3D đầy đủ, bóng 1024px          -> mặc định card tích hợp
 * high   bóng 2048px, độ nét tới 2x      -> card rời phổ thông
 * ultra  siêu lấy mẫu, bóng 4096px, hiệu ứng sống động (hạt bụi, LED nháy, vẽ liên tục)
 */
export const GRAPHICS_LEVELS = ['flat', 'low', 'medium', 'high', 'ultra'] as const
export type GraphicsLevel = typeof GRAPHICS_LEVELS[number]
export type GraphicsSetting = 'auto' | GraphicsLevel
export type Graphics3DLevel = Exclude<GraphicsLevel, 'flat'>

export interface GraphicsProfile {
  level: Graphics3DLevel
  // dpr = min(devicePixelRatio * dprScale, dprMax)
  dprScale: number
  dprMax: number
  antialias: boolean
  shadowMapSize: number
  // 0 = tắt môi trường phản chiếu
  envResolution: number
  contactShadow: 'baked' | 'live'
  contactResolution: number
  // 0 = hộp vuông cạnh (không bo)
  roundedSmoothness: number
  film: boolean
  outlines: boolean
  // Hiệu ứng chạy liên tục (vẽ mọi frame)
  ambientMotion: boolean
}

export const GRAPHICS_PROFILES: Record<Graphics3DLevel, GraphicsProfile> = {
  low: {
    level: 'low',
    dprScale: 1,
    dprMax: 1,
    antialias: true,
    shadowMapSize: 0,
    envResolution: 0,
    contactShadow: 'baked',
    contactResolution: 256,
    roundedSmoothness: 0,
    film: false,
    outlines: true,
    ambientMotion: false,
  },
  medium: {
    level: 'medium',
    dprScale: 1,
    dprMax: 1.5,
    antialias: true,
    shadowMapSize: 1024,
    envResolution: 64,
    contactShadow: 'live',
    contactResolution: 512,
    roundedSmoothness: 3,
    film: true,
    outlines: false,
    ambientMotion: false,
  },
  high: {
    level: 'high',
    dprScale: 1,
    dprMax: 2,
    antialias: true,
    shadowMapSize: 2048,
    envResolution: 128,
    contactShadow: 'live',
    contactResolution: 1024,
    roundedSmoothness: 4,
    film: true,
    outlines: false,
    ambientMotion: false,
  },
  ultra: {
    level: 'ultra',
    dprScale: 1.5,
    dprMax: 3,
    antialias: true,
    shadowMapSize: 4096,
    envResolution: 256,
    contactShadow: 'live',
    contactResolution: 1024,
    roundedSmoothness: 5,
    film: true,
    outlines: false,
    ambientMotion: true,
  },
}

// Màu nhận diện từng mức (vạch mức, viền thẻ đang chọn)
export const LEVEL_ACCENT: Record<GraphicsLevel, string> = {
  flat: '#64748b',
  low: '#0d9488',
  medium: '#2563eb',
  high: '#7c3aed',
  ultra: '#d97706',
}

// Tải GPU tương đối 1..5 (hiển thị trong bảng chọn)
export const GRAPHICS_LOAD: Record<GraphicsLevel, number> = { flat: 1, low: 2, medium: 3, high: 4, ultra: 5 }

export function graphicsDpr(profile: GraphicsProfile) {
  return Math.min((window.devicePixelRatio || 1) * profile.dprScale, profile.dprMax)
}

// Hạ 1 bậc (dùng khi máy chạy không mượt)
export function lowerLevel(level: GraphicsLevel): GraphicsLevel {
  const index = GRAPHICS_LEVELS.indexOf(level)
  return GRAPHICS_LEVELS[Math.max(0, index - 1)]
}

// =========================================================
// NHẬN DIỆN GPU
// =========================================================

export interface GpuInfo {
  webgl: boolean
  // Tên card đã rút gọn, null nếu trình duyệt ẩn
  renderer: string | null
  suggested: GraphicsLevel
}

// "ANGLE (Intel, Intel(R) UHD Graphics 620 (0x00003EA0) Direct3D11 vs_5_0 ps_5_0, D3D11)" -> "Intel(R) UHD Graphics 620"
function cleanRenderer(raw: string) {
  const parts = raw.startsWith('ANGLE (') ? raw.slice(7, -1).split(', ') : [raw]
  const name = parts.length > 1 ? parts[1] : parts[0]
  return name.replace(/\s*\(0x[0-9a-f]+\)/i, '').replace(/\s+(Direct3D|OpenGL|Vulkan|Metal).*$/i, '').trim()
}

export function detectGpu(): GpuInfo {
  try {
    const canvas = document.createElement('canvas')
    const gl = canvas.getContext('webgl2') ?? canvas.getContext('webgl')
    if (!gl) return { webgl: false, renderer: null, suggested: 'flat' }

    const debug = gl.getExtension('WEBGL_debug_renderer_info')
    const raw = String(gl.getParameter(debug ? debug.UNMASKED_RENDERER_WEBGL : gl.RENDERER) ?? '')
    // Trả context thử ngay, trình duyệt giới hạn số context WebGL cùng lúc
    gl.getExtension('WEBGL_lose_context')?.loseContext()

    const name = raw ? cleanRenderer(raw) : null
    const key = raw.toLowerCase()
    let suggested: GraphicsLevel = 'medium'
    if (/swiftshader|llvmpipe|software|basic render/.test(key)) suggested = 'flat'
    else if (/nvidia|geforce|quadro|rtx|gtx|radeon rx|radeon pro|arc\(tm\) a|arc a/.test(key)) suggested = 'high'

    return { webgl: true, renderer: name, suggested }
  } catch {
    return { webgl: false, renderer: null, suggested: 'flat' }
  }
}

// =========================================================
// LƯU LỰA CHỌN
// =========================================================

const STORAGE_KEY = 'user-home:graphics'

export function loadGraphicsSetting(): GraphicsSetting {
  const stored = loadPreference(STORAGE_KEY)
  return stored === 'auto' || GRAPHICS_LEVELS.includes(stored as GraphicsLevel) ? stored as GraphicsSetting : 'auto'
}

export function saveGraphicsSetting(setting: GraphicsSetting) {
  savePreference(STORAGE_KEY, setting)
}

interface ResolveContext {
  gpu: GpuInfo
  reduceMotion: boolean
  wide: boolean
}

// Mức thực tế được dùng. Tự động: tôn trọng "giảm chuyển động" và màn hẹp; chọn tay thì theo người dùng
export function resolveGraphicsLevel(setting: GraphicsSetting, { gpu, reduceMotion, wide }: ResolveContext): GraphicsLevel {
  if (!gpu.webgl || !wide) return 'flat'
  if (setting !== 'auto') return setting
  return reduceMotion ? 'flat' : gpu.suggested
}
