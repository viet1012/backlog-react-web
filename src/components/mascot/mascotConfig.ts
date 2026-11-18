/**
 * Cấu hình hành vi mascot – mọi câu nói, thời gian, route hỗ trợ đặt ở đây cho dễ chỉnh.
 * Tên mascot KHÔNG đặt ở đây: lấy từ API (/config) qua useMascotName(), truyền vào các hàm text bên dưới.
 */
import type { Language } from '../../utils/uiPreferences'
import type { ScreenId } from './mascotMessages'

// ---------------------------------------------------------------------------
// Thời gian (ms)
// ---------------------------------------------------------------------------
export const MASCOT_TIMING = {
  /** vào trang → chờ chút rồi mới hiện bubble chào (tránh nháy lúc trang đang tải) */
  entryBubbleDelayMs: 800,
  /** bubble chào khi vào trang tự ẩn sau */
  entryBubbleVisibleMs: 5_000,
  /** bubble "màn hình chưa hỗ trợ" tự ẩn sau (dài hơn để kịp đọc + bấm link) */
  unsupportedBubbleVisibleMs: 9_000,
  /** user không tương tác bao lâu thì mascot bắt chuyện */
  idleBubbleAfterMs: 60_000,
  /** bubble bắt chuyện tự ẩn sau */
  idleBubbleVisibleMs: 10_000,
  /** khoảng cách tối thiểu giữa 2 bubble tự hiện (chống spam) */
  bubbleMinGapMs: 3 * 60_000,
  /** user bỏ qua (tự ẩn / bấm X) bấy nhiêu bubble bắt chuyện liên tiếp → ngừng hẳn tới khi reload */
  maxIgnoredBubbles: 3,
  /** không tương tác bao lâu thì mascot buồn ngủ */
  sleepyAfterMs: 3 * 60_000,
  /** chu kỳ kiểm tra idle */
  activityCheckMs: 5_000,
  /** có câu trả lời → "đang nói" trong bao lâu rồi chuyển "vui" */
  talkingMs: 1_800,
  /** "vui" bao lâu rồi về idle */
  happyMs: 2_500,
  /** chớp mắt ngẫu nhiên: khoảng cách giữa 2 lần chớp */
  blinkMinMs: 2_500,
  blinkMaxMs: 6_500,
  /** vẫy tay ngẫu nhiên lúc idle */
  randomWaveMinMs: 25_000,
  randomWaveMaxMs: 60_000,
  /** rời tab lâu hơn mức này rồi quay lại → "chào mừng quay lại" */
  welcomeBackAfterMs: 5 * 60_000,
  /** bubble phản ứng (quay lại, tỉnh ngủ, đổi tháng) tự ẩn sau */
  reactionBubbleVisibleMs: 7_000,
  /** bubble "hỏi về đoạn đang bôi đen" tự ẩn sau */
  selectionBubbleVisibleMs: 8_000,
  /** chờ user bôi đen xong rồi mới hiện bubble */
  selectionDebounceMs: 300,
} as const

/** giới hạn đoạn văn bản bôi đen để hỏi */
export const MASCOT_SELECTION = {
  minChars: 3,
  maxChars: 300,
  /** độ dài trích dẫn hiển thị trên bubble */
  previewChars: 40,
} as const

/** mắt nhìn theo con trỏ: độ lệch tối đa của con ngươi (đơn vị SVG) và khoảng cách đạt độ lệch tối đa (px) */
export const MASCOT_EYE_FOLLOW = {
  maxOffset: 1.8,
  fullAtPx: 320,
} as const

/** khóa localStorage (qua uiPreferences, có tiền tố chung) */
export const MASCOT_STORAGE_KEYS = {
  /** user bấm "Đừng nhắc nữa" → không tự hiện bubble nữa */
  bubblesMuted: 'mascot:bubblesMuted',
  /** vị trí mascot sau khi kéo (khoảng cách tới mép phải / dưới) */
  position: 'mascot:position',
} as const

/** kéo thả mascot */
export const MASCOT_DRAG = {
  /** di chuyển quá ngưỡng này (px) mới tính là kéo – nhỏ hơn vẫn là click mở chat */
  thresholdPx: 5,
  /** khoảng cách tối thiểu tới mép màn hình */
  edgeMarginPx: 8,
  /** vị trí mặc định (góc dưới phải) */
  defaultRight: 16,
  defaultBottom: 16,
  /** Alt + phím mũi tên: mỗi lần dịch bấy nhiêu px */
  keyboardStepPx: 24,
  /** màn hẹp hơn mức này: panel chiếm gần hết bề ngang → không cho kéo, mascot về góc */
  minViewportWidth: 900,
} as const

// ---------------------------------------------------------------------------
// Route → màn hình
// ---------------------------------------------------------------------------
export interface MascotRouteTexts {
  /** tên màn hình hiển thị */
  name: string
  /**
   * câu chào ngắn khi vào trang (bubble) + câu chào tĩnh trong chat khi API gợi ý lỗi;
   * hello = lời chào theo giờ (MascotTexts.timeGreeting)
   */
  greeting: (name: string, hello: string) => string
  /** đổi tháng trên màn → bubble gợi ý; null → không phản ứng */
  monthChanged: ((month: string) => MascotLine) | null
  /** câu hỏi gợi ý: bubble chào + chip trong chat khi API gợi ý lỗi */
  suggestedQuestions: string[]
  /** câu bắt chuyện khi user idle; question → bấm bubble mở chat điền sẵn câu này */
  idleLines: (name: string) => MascotLine[]
}

export interface MascotLine {
  text: string
  question?: string
}

export interface MascotRouteConfig {
  supported: boolean
  /** khóa i18n hiện có (divider "Đang xem", AI Logs) – bắt buộc khi supported */
  screenId?: ScreenId
  /** screenKey gửi lên /api/assistant/chat – bắt buộc khi supported */
  screenKey?: string
  texts?: Record<Language, MascotRouteTexts>
}

/**
 * Khớp theo tiền tố route. Route không có trong map → coi như chưa hỗ trợ.
 * Thêm màn hình mới: thêm 1 entry supported: true + screenId (khai báo trong i18n mascot.screens/lines).
 */
export const MASCOT_ROUTES: Record<string, MascotRouteConfig> = {
  '/cost-monitoring': {
    supported: true,
    screenId: 'costMonitoring',
    screenKey: 'cost-monitoring',
    texts: {
      vi: {
        name: 'Cost Monitoring',
        greeting: (name, hello) => `${hello}, mình là ${name}! Hỏi mình về chi phí nhé.`,
        monthChanged: (month) => ({
          text: `Đã chuyển sang tháng ${month}. Muốn mình tóm tắt nhanh không?`,
          question: `Tóm tắt chi phí tháng ${month} so với target`,
        }),
        suggestedQuestions: [
          'Tháng này chi phí có vượt target không?',
          'Hạng mục nào đang vượt nhiều nhất?',
          'So sánh actual với PL TGT',
          'Giải thích T&SL giúp tôi',
        ],
        idleLines: () => [
          { text: 'Cần mình giúp gì không?' },
          { text: 'Muốn xem chi phí tháng này vượt target chỗ nào không?', question: 'Tháng này chi phí vượt target ở hạng mục nào?' },
          { text: 'Mình so sánh actual với PL TGT giúp bạn nhé?', question: 'So sánh actual với PL TGT' },
          { text: 'Nhớ check T&SL nhé! Cần mình giải thích không?', question: 'Giải thích T&SL giúp tôi' },
        ],
      },
      en: {
        name: 'Cost Monitoring',
        greeting: (name, hello) => `${hello}! I'm ${name} – ask me anything about costs.`,
        monthChanged: (month) => ({
          text: `Switched to ${month}. Want a quick summary?`,
          question: `Summarize ${month} costs against target`,
        }),
        suggestedQuestions: [
          'Is this month over target?',
          'Which item is the most over target?',
          'Compare actual with PL TGT',
          'Explain T&SL to me',
        ],
        idleLines: () => [
          { text: 'Need a hand with anything?' },
          { text: 'Want to see where this month is over target?', question: 'Which items are over target this month?' },
          { text: 'Shall I compare actual with PL TGT for you?', question: 'Compare actual with PL TGT' },
          { text: "Don't forget to check T&SL! Want an explanation?", question: 'Explain T&SL to me' },
        ],
      },
    },
  },
}

// ---------------------------------------------------------------------------
// Câu nói chung
// ---------------------------------------------------------------------------
export interface MascotTexts {
  /** bubble khi vào màn chưa hỗ trợ; screens = danh sách màn đang hỗ trợ */
  unsupportedBubble: (screens: string) => string
  /** câu chào trong chat ở màn chưa hỗ trợ */
  unsupportedGreeting: (name: string) => string
  /** banner giới hạn trong chat */
  limitBannerTitle: string
  limitBannerBody: (screens: string) => string
  /** trả lời tại chỗ (không gọi API) khi hỏi ở màn chưa hỗ trợ */
  outOfScopeReply: (name: string, screens: string) => string
  /** link chuyển màn */
  goTo: (screen: string) => string
  /** gợi ý kèm bubble chào: "Thử hỏi: …" */
  tryAsking: (question: string) => string
  dismiss: string
  mute: string
  /** aria-label bubble bấm được */
  openChatHint: (name: string) => string
  /** lời chào theo giờ trong ngày (0–23) */
  timeGreeting: (hour: number) => string
  /** quay lại tab sau thời gian dài */
  welcomeBack: (name: string) => MascotLine[]
  /** tỉnh dậy sau khi buồn ngủ */
  wakeUp: (name: string) => MascotLine[]
  /** bôi đen văn bản: bubble + câu hỏi điền sẵn */
  selectionAsk: (preview: string) => string
  selectionQuestion: (text: string) => string
  /** tooltip mascot: bấm để chat, kéo để di chuyển */
  dragHint: (name: string) => string
  /** nút đưa mascot về góc mặc định */
  resetPosition: string
  /** nhãn biểu cảm (Phòng thay đồ – xem trước) */
  states: Record<MascotState, string>
}

export const MASCOT_TEXTS: Record<Language, MascotTexts> = {
  vi: {
    unsupportedBubble: (screens) => `Màn hình này mình chưa học tới 😢 Mình đang hỗ trợ: ${screens}`,
    unsupportedGreeting: (name) => `Chào bạn, mình là ${name}. Tiếc là màn hình này mình chưa học tới 😢`,
    limitBannerTitle: 'Màn hình này chưa được hỗ trợ',
    limitBannerBody: (screens) => `Mình chỉ trả lời được câu hỏi trên: ${screens}.`,
    outOfScopeReply: (name, screens) =>
      `Xin lỗi, ${name} chưa đọc được dữ liệu của màn hình này nên chưa trả lời được 😢\nBạn chuyển sang ${screens} rồi hỏi lại nhé!`,
    goTo: (screen) => `Mở ${screen}`,
    tryAsking: (question) => `Thử hỏi: “${question}”`,
    dismiss: 'Đóng',
    mute: 'Đừng nhắc nữa',
    openChatHint: (name) => `Mở chat với ${name}`,
    timeGreeting: (hour) =>
      hour < 11 ? 'Chào buổi sáng' : hour < 13 ? 'Chào buổi trưa' : hour < 18 ? 'Chào buổi chiều' : 'Chào buổi tối',
    welcomeBack: () => [
      { text: 'Chào mừng bạn quay lại! 👋 Cần mình xem gì không?' },
      { text: 'Bạn quay lại rồi! Mình tóm tắt nhanh màn hình này nhé?', question: 'Tóm tắt nhanh tình hình chi phí đang xem' },
    ],
    wakeUp: () => [
      { text: 'Ơ, mình ngủ gật mất 😅 Cần gì cứ gọi mình nhé!' },
      { text: 'Oáp… mình tỉnh rồi! Có gì cần hỏi không?' },
    ],
    selectionAsk: (preview) => `Hỏi mình về “${preview}”?`,
    selectionQuestion: (text) => `Giải thích giúp tôi: “${text}”`,
    dragHint: (name) => `Bấm để chat với ${name} · Kéo để di chuyển (Alt + mũi tên)`,
    resetPosition: 'Đưa về góc màn hình',
    states: {
      idle: 'Vui vẻ',
      greeting: 'Chào',
      thinking: 'Suy nghĩ',
      talking: 'Đang nói',
      happy: 'Vui',
      sad: 'Buồn',
      confused: 'Bối rối',
      sleepy: 'Buồn ngủ',
    },
  },
  en: {
    unsupportedBubble: (screens) => `I haven't learned this screen yet 😢 I can help with: ${screens}`,
    unsupportedGreeting: (name) => `Hi, I'm ${name}. Sorry, I haven't learned this screen yet 😢`,
    limitBannerTitle: "This screen isn't supported yet",
    limitBannerBody: (screens) => `I can only answer questions on: ${screens}.`,
    outOfScopeReply: (name, screens) =>
      `Sorry, ${name} can't read this screen's data yet 😢\nPlease switch to ${screens} and ask again!`,
    goTo: (screen) => `Open ${screen}`,
    tryAsking: (question) => `Try asking: “${question}”`,
    dismiss: 'Close',
    mute: "Don't remind me",
    openChatHint: (name) => `Open chat with ${name}`,
    timeGreeting: (hour) =>
      hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening',
    welcomeBack: () => [
      { text: 'Welcome back! 👋 Anything I can look into?' },
      { text: "You're back! Want a quick summary of this screen?", question: 'Give me a quick summary of the costs on screen' },
    ],
    wakeUp: () => [
      { text: 'Oops, I dozed off 😅 Just call me if you need anything!' },
      { text: "Yawn… I'm awake! Any questions?" },
    ],
    selectionAsk: (preview) => `Ask me about “${preview}”?`,
    selectionQuestion: (text) => `Please explain: “${text}”`,
    dragHint: (name) => `Click to chat with ${name} · Drag to move (Alt + arrow keys)`,
    resetPosition: 'Move back to corner',
    states: {
      idle: 'Idle',
      greeting: 'Greeting',
      thinking: 'Thinking',
      talking: 'Talking',
      happy: 'Happy',
      sad: 'Sad',
      confused: 'Confused',
      sleepy: 'Sleepy',
    },
  },
}

// ---------------------------------------------------------------------------
// Trạng thái biểu cảm
// ---------------------------------------------------------------------------
/**
 * idle: thở nhẹ, chớp mắt · greeting: vẫy tay, cười mở miệng · thinking: chờ LM Studio ·
 * talking: vừa có câu trả lời · happy: trả lời xong · sad: màn chưa hỗ trợ / mất kết nối ·
 * confused: lỗi / timeout · sleepy: user không tương tác lâu
 */
export type MascotState = 'idle' | 'greeting' | 'thinking' | 'talking' | 'happy' | 'sad' | 'confused' | 'sleepy'

export const MASCOT_STATES: MascotState[] = ['idle', 'greeting', 'thinking', 'talking', 'happy', 'sad', 'confused', 'sleepy']

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
export function findMascotRoute(pathname: string): { route: string; config: MascotRouteConfig } | undefined {
  const route = Object.keys(MASCOT_ROUTES).find(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  )
  return route ? { route, config: MASCOT_ROUTES[route] } : undefined
}

/** các màn đang hỗ trợ (để gợi ý chuyển màn) */
export function getSupportedScreens(language: Language): { route: string; name: string }[] {
  return Object.entries(MASCOT_ROUTES)
    .filter(([, config]) => config.supported && config.texts)
    .map(([route, config]) => ({ route, name: config.texts![language].name }))
}

export function randomBetween(min: number, max: number) {
  return min + Math.random() * (max - min)
}
