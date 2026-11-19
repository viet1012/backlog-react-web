import { getMessages } from '../../../i18n/i18nContext'
import type { DownloadProgress } from '../../../utils/download'
import { errorDetail, notify } from './notifyStore'

/**
 * Runs an export with the shared progress toast:
 * "Đang xuất… 45%" → "Đã xuất <file>" or "Xuất file thất bại" + reason.
 *
 * `task` gets a progress callback and may return the saved file name.
 * Resolves true on success; never throws (the toast reports the failure).
 */
export async function notifyExport(
  task: (onProgress: DownloadProgress) => Promise<string | void>,
): Promise<boolean> {
  const t = getMessages()
  const progress = notify.progress(t.common.exportProgress)

  try {
    const fileName = await task((fraction) => progress.update(fraction))

    progress.success(t.common.exportDone(fileName || undefined))

    return true
  } catch (error) {
    console.error('Export failed:', error)
    progress.error(t.common.exportFailed, { detail: errorDetail(error) })

    return false
  }
}
