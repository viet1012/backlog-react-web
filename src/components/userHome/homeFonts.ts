/*
 * Font Be Vietnam Pro dùng chung cho trang chủ: chữ DOM (bảng LED) qua @font-face và chữ SDF trong cảnh 3D.
 * Cùng 1 URL nên trình duyệt chỉ tải 1 lần. File TTF đóng gói cùng app, không tải từ mạng ngoài.
 * Chỉ có 2 độ đậm: 600 (thường) và 800 (đậm).
 */
import semiBold from '@expo-google-fonts/be-vietnam-pro/600SemiBold/BeVietnamPro_600SemiBold.ttf?url'
import extraBold from '@expo-google-fonts/be-vietnam-pro/800ExtraBold/BeVietnamPro_800ExtraBold.ttf?url'

export const HOME_FONT_URLS = { semiBold, extraBold }

export const HOME_FONT = '"Be Vietnam Pro", Inter, system-ui, sans-serif'

export const homeFontFaces = [
  { '@font-face': { fontFamily: 'Be Vietnam Pro', src: `url(${semiBold}) format('truetype')`, fontWeight: 600, fontStyle: 'normal', fontDisplay: 'swap' } },
  { '@font-face': { fontFamily: 'Be Vietnam Pro', src: `url(${extraBold}) format('truetype')`, fontWeight: 800, fontStyle: 'normal', fontDisplay: 'swap' } },
]
