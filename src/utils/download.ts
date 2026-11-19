/** fraction 0..1, or null when the server did not send Content-Length */
export type DownloadProgress = (fraction: number | null) => void

/**
 * Reads a fetch Response into a Blob, reporting progress from the body
 * stream. Falls back to response.blob() when streaming is not available.
 */
export async function readBlobWithProgress(response: Response, onProgress?: DownloadProgress): Promise<Blob> {
  const type = response.headers.get('Content-Type') ?? ''

  if (!onProgress || !response.body) return response.blob()

  const total = Number(response.headers.get('Content-Length')) || 0
  const reader = response.body.getReader()
  const chunks: Uint8Array<ArrayBuffer>[] = []
  let received = 0

  onProgress(total ? 0 : null)

  for (;;) {
    const { done, value } = await reader.read()
    if (done) break

    chunks.push(value as Uint8Array<ArrayBuffer>)
    received += value.byteLength
    if (total) onProgress(received / total)
  }

  onProgress(1)

  return new Blob(chunks, { type })
}

/** File name from Content-Disposition (RFC 5987 filename* first), else `fallback` */
export function fileNameFromDisposition(disposition: string | null, fallback: string): string {
  if (!disposition) return fallback

  const utf8 = /filename\*=UTF-8''([^;]+)/i.exec(disposition)
  if (utf8?.[1]) {
    try {
      return decodeURIComponent(utf8[1].trim())
    } catch {
      // fall through to the plain filename
    }
  }

  const plain = /filename="?([^";]+)"?/i.exec(disposition)

  return plain?.[1]?.trim() || fallback
}

/** Triggers the browser download of a Blob */
export function saveBlob(blob: Blob, fileName: string) {
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')

  anchor.href = url
  anchor.download = fileName
  document.body.appendChild(anchor)
  anchor.click()
  anchor.remove()
  // revoke after the click has been handled (some browsers read it async)
  window.setTimeout(() => URL.revokeObjectURL(url), 0)
}
