import { useEffect, useRef, useState } from 'react'

import type { HomeMenuEntry } from '../userHomeMenu'

/*
 * Chuyển icon MUI (SVG trong DOM) thành ảnh để vẽ lên texture canvas.
 * Render ẩn các icon, đọc SVG, thêm xmlns + kích thước + màu đen (texture tự tô màu lại).
 */
const ICON_PX = '128'

async function svgToImage(svg: SVGSVGElement) {
  const clone = svg.cloneNode(true) as SVGSVGElement
  clone.removeAttribute('class')
  clone.setAttribute('xmlns', 'http://www.w3.org/2000/svg')
  clone.setAttribute('width', ICON_PX)
  clone.setAttribute('height', ICON_PX)
  clone.setAttribute('fill', '#000')

  const img = new Image()
  img.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(clone.outerHTML)}`
  await img.decode()
  return img
}

export function useIconImages(entries: HomeMenuEntry[]) {
  const hostRef = useRef<HTMLDivElement>(null)
  const [images, setImages] = useState<ReadonlyMap<string, HTMLImageElement>>(() => new Map())

  useEffect(() => {
    const host = hostRef.current
    if (!host) return
    let cancelled = false

    const jobs = Array.from(host.querySelectorAll<HTMLElement>('[data-icon-path]')).map(async (el) => {
      const svg = el.querySelector('svg')
      const path = el.dataset.iconPath
      if (!svg || !path) return null
      try {
        return [path, await svgToImage(svg)] as const
      } catch {
        // Icon lỗi thì thùng không có hình in, vẫn hiện bình thường
        return null
      }
    })

    void Promise.all(jobs).then((results) => {
      if (cancelled) return
      setImages(new Map(results.filter((result): result is readonly [string, HTMLImageElement] => result !== null)))
    })

    return () => {
      cancelled = true
    }
  }, [entries])

  const host = (
    <div ref={hostRef} aria-hidden style={{ position: 'absolute', width: 0, height: 0, overflow: 'hidden', visibility: 'hidden' }}>
      {entries.map((entry) => (
        <span key={entry.item.path} data-icon-path={entry.item.path}>
          {entry.item.icon}
        </span>
      ))}
    </div>
  )

  return { images, host }
}
