/*
 * Font cho chữ SDF trong cảnh 3D (troika-three-text qua drei <Text>).
 * Be Vietnam Pro: thiết kế cho tiếng Việt (dấu chồng rõ ràng), file TTF đầy đủ glyph nên troika
 * không phải tải font dự phòng từ CDN. Dùng chung file với bảng LED (homeFonts).
 */
import { HOME_FONT_URLS } from '../homeFonts'

export const FONT = {
  // Chữ phụ: hành động, chữ viết tay trên thùng sắp ra mắt
  medium: HOME_FONT_URLS.semiBold,
  // Tên trang, nhãn in hoa, mã vị trí
  bold: HOME_FONT_URLS.extraBold,
}

// Thứ tự vẽ sau mọi vật trong suốt khác (nhãn dán, màng co) để viền chữ khử răng cưa hoà đúng vào nền giấy
export const TEXT_RENDER_ORDER = 2
