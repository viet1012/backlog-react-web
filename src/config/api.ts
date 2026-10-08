// Ghi đè khi chạy local bằng .env.development.local (xem .env.example)
export const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || 'http://192.168.122.16:9100'
