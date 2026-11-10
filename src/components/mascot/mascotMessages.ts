import type { Messages } from '../../i18n/i18nContext'

type MascotI18n = Messages['mascot']
type ScreenId = Extract<keyof MascotI18n['lines'], keyof MascotI18n['screens']>

interface RouteConfig {
  /** khóa i18n: câu thoại (lines), tên trang + câu gợi ý (screens) */
  id: ScreenId
  /** screenKey gửi lên /api/assistant/chat */
  screenKey: string
}

// Route → cấu hình mascot. Khớp theo tiền tố; route không có trong map
// dùng câu chào mặc định và ẩn ô chat.
const ROUTES: Record<string, RouteConfig> = {
  '/cost-monitoring': { id: 'costMonitoring', screenKey: 'cost-monitoring' },
}

export interface AssistantScreenDef {
  screenKey: string
  screenId: ScreenId
  /** route của trang (tiền tố) */
  route: string
}

/** Mọi màn hình có chat trợ lý – dùng cho tab theo màn hình ở AI Logs (Logs / Bộ test) */
export const ASSISTANT_SCREENS: AssistantScreenDef[] = Object.entries(ROUTES).map(
  ([route, { id, screenKey }]) => ({ route, screenId: id, screenKey }),
)

/** Tên hiển thị của screenKey; screenKey lạ (chưa khai báo) → trả nguyên screenKey */
export function getScreenNameByKey(screenKey: string, t: Messages): string {
  const def = ASSISTANT_SCREENS.find((s) => s.screenKey === screenKey)
  return def ? t.mascot.screens[def.screenId].name : screenKey
}

export interface MascotScreen {
  lines: string[]
  /** undefined → trang chưa hỗ trợ chat */
  screenKey?: string
  screenId?: ScreenId
  /** câu chào trung tính khi API suggestions chưa trả / lỗi */
  greeting?: string
  suggestions: string[]
}

function findRoute(pathname: string): RouteConfig | undefined {
  const prefix = Object.keys(ROUTES).find(
    (route) => pathname === route || pathname.startsWith(`${route}/`),
  )
  return prefix ? ROUTES[prefix] : undefined
}

export function getMascotScreen(pathname: string, t: Messages): MascotScreen {
  const route = findRoute(pathname)
  const defaults = t.mascot.lines.default

  if (!route) return { lines: defaults, suggestions: [] }

  const lines = t.mascot.lines[route.id]
  return {
    lines: lines.length > 0 ? lines : defaults,
    screenKey: route.screenKey,
    screenId: route.id,
    greeting: t.mascot.screens[route.id].greeting,
    suggestions: t.mascot.screens[route.id].suggestions,
  }
}

export function getScreenName(screenId: ScreenId, t: Messages): string {
  return t.mascot.screens[screenId].name
}

export type { ScreenId }
