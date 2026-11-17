import { preload } from 'suspend-react'
import { preloadFont } from 'troika-three-text'

import { FONT } from './fonts'

/*
 * drei <Text> suspend tới khi troika tải + parse xong font, với key
 * ['troika-text', font, characters] trong cache của suspend-react (xem
 * @react-three/drei/core/Text.js). Nạp sẵn đúng key đó ngay khi chunk 3D được tải
 * (lúc đăng nhập / rê chuột vào menu / F5) => lúc mở trang, cảnh dựng luôn ở lần render
 * đầu, không phải chờ thêm 1 vòng tải + parse font trong worker.
 * Nếu drei đổi key thì chỉ mất tác dụng, không lỗi: <Text> tự tải như cũ.
 */
export function warmTextFonts() {
  for (const font of Object.values(FONT)) {
    preload(
      () => new Promise<void>((resolve) => {
        preloadFont({ font }, () => resolve())
      }),
      ['troika-text', font, undefined],
    )
  }
}
