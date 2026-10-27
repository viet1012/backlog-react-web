// Ghi đè khi chạy local bằng .env.development.local (xem .env.example)
export const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || 'http://192.168.122.16:9100'

// Ảnh HSE: url = base + tên file
export const HSE_IMAGE_BASE_URL =
  import.meta.env.VITE_HSE_IMAGE_BASE_URL || 'http://192.168.122.16:8002/images/'
