// Màu ngữ nghĩa của bản vẽ (giữ như bản demo):
// vàng = máy đang chọn, xanh = đang chỉnh sửa
export const mapColors = {
  paper: '#ffffff',
  mark: '#ffb800',
  hit: 'rgba(255,184,0,.26)',
  markInk: '#1f2933',
  markInkMuted: '#4a3500',
  edit: '#0b62c4',
  editHit: 'rgba(11,98,196,.12)',
  ghost: 'rgba(11,98,196,.08)',
  ghostLine: 'rgba(11,98,196,.5)',
  // tag "cần soát" trong danh sách
  review: '#ea580c',
} as const

// Đỉnh đường bao khi sửa (MapCanvas)
export const vertexColors = {
  // đỉnh thường: nền trắng, viền cam
  fill: '#ffffff',
  stroke: '#F57C00',
  // đỉnh được chọn: nền cam, viền trắng
  selFill: '#F57C00',
  selStroke: '#ffffff',
  // đỉnh đang kéo / đang hút + đường gióng
  drag: '#2E7D32',
  // viền ngoài 1 px: trắng mờ + bóng tối mờ để nổi trên nền tối lẫn nét bản vẽ
  halo: 'rgba(255,255,255,.85)',
  shadow: 'rgba(0,0,0,.55)',
} as const

// Kích thước đỉnh (px màn hình, không đổi khi zoom)
export const vertexSize = {
  // cạnh hình vuông
  px: 8,
  // khi rê chuột
  hoverPx: 10,
  // viền
  strokePx: 2,
} as const

export const codeFontFamily =
  "ui-monospace, Consolas, 'Courier New', monospace"
