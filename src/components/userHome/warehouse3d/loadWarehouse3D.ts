import { HOME_FONT_URLS } from '../homeFonts'

/*
 * Tải trước kệ 3D (chunk three.js) + font SDF. Gọi từ lúc rê chuột vào menu / lúc đăng nhập
 * để khi mở trang chủ không phải chờ tải tuần tự: chunk trang -> chunk three.js -> font.
 * File này không import three, nằm được trong bundle chính.
 */
type Warehouse3DModule = typeof import('./UserHomeWarehouse3D')

let modulePromise: Promise<Warehouse3DModule> | null = null
let fontsWarmed = false

export function loadWarehouse3D(): Promise<Warehouse3DModule> {
  if (!modulePromise) {
    modulePromise = import('./UserHomeWarehouse3D').catch((error: unknown) => {
      // Lỗi mạng: cho phép thử lại ở lần sau
      modulePromise = null
      throw error
    })
  }
  warmFonts()
  return modulePromise
}

// Đưa file font vào cache HTTP; troika đọc lại cùng URL nên không phải chờ tải
function warmFonts() {
  if (fontsWarmed || typeof fetch !== 'function') return
  fontsWarmed = true
  for (const url of Object.values(HOME_FONT_URLS)) {
    fetch(url).catch(() => {
      fontsWarmed = false
    })
  }
}
