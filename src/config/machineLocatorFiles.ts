// File JSON dữ liệu gốc của từng layout Machine Locator (đường dẫn tính từ thư mục gốc dự án).
// Dùng chung cho app (machineLocatorLayouts) và Vite plugin lưu file khi chạy dev,
// nên file này không được import gì thêm.
export const machineLayoutFiles: Record<string, string> = {
  'factory-a-f1': 'src/data/machineLocator/factoryA-f1.json',
  'factory-b-f1': 'src/data/machineLocator/factoryB-f1.json',
  'factory-c-f1': 'src/data/machineLocator/factoryC-f1.json',
}

// Thông số ảnh layout để dev store tạo file dữ liệu rỗng (m = {}) nếu file chưa có.
// crop = [x, y, w, h] theo pt PDF, ảnh: px = (pt - crop.xy) * ppp
export const machineLayoutInit: Record<string, {
  crop: [number, number, number, number]
  page: [number, number]
  ppp: number
}> = {
  // vùng pt 195..1000 x 15..835 -> ảnh 3578 x 3644 px
  'factory-c-f1': { crop: [195, 15, 805, 820], page: [1190.55, 841.89], ppp: 4.4444 },
}
