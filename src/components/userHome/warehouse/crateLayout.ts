// Mặt trước thùng: rộng / cao
export const CRATE_RATIO = 1.3
// Chiều sâu thùng so với chiều rộng
export const CRATE_DEPTH = 0.5

export interface CrateFit {
  // Chiều rộng mặt trước, cùng đơn vị với width/height truyền vào (px ở bản CSS, mét ở bản 3D)
  size: number
  cols: number
  rows: number
}

interface FitOptions {
  gap: number
  maxSize: number
  // Mặt trước rộng / cao; mặc định CRATE_RATIO
  ratio?: number
}

/*
 * Chọn số lớp xếp chồng sao cho thùng to nhất mà vẫn nằm gọn trong ô kệ.
 * Các lớp chồng sát nhau (không có khe dọc) như hàng thật trên kệ.
 */
export function fitCrates(count: number, width: number, height: number, { gap, maxSize, ratio = CRATE_RATIO }: FitOptions): CrateFit {
  let best: CrateFit = { size: 0, cols: Math.max(count, 1), rows: 1 }
  if (count === 0 || width <= 0 || height <= 0) return best

  for (let rows = 1; rows <= count; rows++) {
    const cols = Math.ceil(count / rows)
    const byWidth = (width - gap * (cols - 1)) / cols
    const byHeight = (height / rows) * ratio
    const size = Math.min(maxSize, byWidth, byHeight)
    if (size > best.size) best = { size, cols, rows }
  }

  return best
}

// Vị trí trong lưới: lớp dưới cùng xếp đầy trước, lớp trên chồng lên từ trái
export function crateCell(index: number, fit: CrateFit) {
  return {
    gridRow: fit.rows - Math.floor(index / fit.cols),
    gridColumn: (index % fit.cols) + 1,
  }
}
