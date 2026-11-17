// troika-three-text có types trong dist/types nhưng package.json không trỏ tới;
// chỉ khai báo phần đang dùng (warmTextFonts)
declare module 'troika-three-text' {
  export function preloadFont(
    options: { font?: string; characters?: string | string[]; sdfGlyphSize?: number },
    callback: () => void,
  ): void
}
