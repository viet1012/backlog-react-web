import type { Language, Messages } from '../../i18n/i18nContext'
import { findMascotRoute, MASCOT_ROUTES, MASCOT_TEXTS } from './mascotConfig'
import type { MascotLine } from './mascotConfig'

type MascotI18n = Messages['mascot']
type ScreenId = Extract<keyof MascotI18n['lines'], keyof MascotI18n['screens']>

interface RouteConfig {
  /** khóa i18n: tên trang (divider, AI Logs) */
  id: ScreenId
  /** screenKey gửi lên /api/assistant/chat */
  screenKey: string
}

// Route → cấu hình mascot: lấy từ mascotConfig (chỉ các màn supported).
const ROUTES: Record<string, RouteConfig> = Object.fromEntries(
  Object.entries(MASCOT_ROUTES)
    .filter(([, config]) => config.supported && config.screenId && config.screenKey)
    .map(([route, config]) => [route, { id: config.screenId!, screenKey: config.screenKey! }]),
)

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
  /** route khớp trong mascotConfig (undefined → không có trong map) */
  route?: string
  /** câu bắt chuyện khi idle (mascotConfig) */
  idleLines: MascotLine[]
  /** phản ứng khi đổi tháng (mascotConfig); undefined → không phản ứng */
  monthChanged?: (month: string) => MascotLine
}

/** name: tên mascot (useMascotName) để điền vào câu chào trong mascotConfig */
export function getMascotScreen(pathname: string, t: Messages, language: Language, name: string): MascotScreen {
  const match = findMascotRoute(pathname)
  const defaults = t.mascot.lines.default
  const supported = match?.config.supported && match.config.screenKey && match.config.screenId
    ? match.config
    : undefined

  if (!match || !supported) {
    return { lines: defaults, suggestions: [], route: match?.route, idleLines: [] }
  }

  const id = supported.screenId!
  const texts = supported.texts?.[language]
  const lines = t.mascot.lines[id]
  return {
    lines: lines.length > 0 ? lines : defaults,
    screenKey: supported.screenKey,
    screenId: id,
    greeting: texts
      ? texts.greeting(name, MASCOT_TEXTS[language].timeGreeting(new Date().getHours()))
      : t.mascot.screens[id].greeting,
    suggestions: texts ? texts.suggestedQuestions : t.mascot.screens[id].suggestions,
    route: match.route,
    idleLines: texts ? texts.idleLines(name) : [],
    monthChanged: texts?.monthChanged ?? undefined,
  }
}

export function getScreenName(screenId: ScreenId, t: Messages): string {
  return t.mascot.screens[screenId].name
}

export type { ScreenId }
