// Ghi đè khi chạy local bằng .env.development.local (xem .env.example)
export const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || 'http://192.168.122.16:9100'

// BE utility (điện EVN / đồng hồ) – server khác backlog-be
export const UTILITY_API_BASE_URL =
  import.meta.env.VITE_UTILITY_API_BASE || 'http://192.168.122.16:9093'

// export const UTILITY_API_BASE_URL =
//   import.meta.env.VITE_UTILITY_API_BASE || 'http://localhost:9999'
// pdf2cad (PDF → DXF, Setting › PDF → CAD). Mặc định đi qua proxy của backlog-be
// (<API_BASE_URL>/api/pdf2cad, kiểm tra quyền bằng X-Employee-Id).
// VITE_PDF2CAD_API_BASE=mock → chạy bằng dữ liệu mẫu (src/services/pdf2cadMock.ts), không cần BE.
// Trỏ thẳng server pdf2cad (cần bật CORS bên đó): VITE_PDF2CAD_API_BASE=http://<IP>:5020/api
export const PDF2CAD_API_BASE_URL =
  import.meta.env.VITE_PDF2CAD_API_BASE || `${API_BASE_URL.replace(/\/$/, '')}/api/pdf2cad`

// Ảnh HSE: url = base + tên file
export const HSE_IMAGE_BASE_URL =
  import.meta.env.VITE_HSE_IMAGE_BASE_URL || 'http://192.168.122.16:8002/images/'
