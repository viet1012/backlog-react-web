import { useCallback, useEffect, useRef, useState } from 'react'
import { pdf2cadApi } from '../services/pdf2cadService'
import type { Pdf2cadJob, Pdf2cadOptions } from '../types/pdf2cad'

const POLL_MS = 1000

export interface Pdf2cadJobTiming {
  /** giây đã chạy (tính từ lúc job bắt đầu running) */
  elapsed: number
  /** giây còn lại ước tính; null khi chưa đủ dữ liệu */
  eta: number | null
}

/**
 * 1 job chuyển đổi: tải lên (có tiến độ) → hỏi tiến độ mỗi giây tới khi xong / dừng / lỗi.
 * Thông báo lỗi giữ nguyên chữ server (tiếng Việt) – UI tự dịch.
 */
export function usePdf2cadJob() {
  const [job, setJob] = useState<Pdf2cadJob | null>(null)
  const [jobId, setJobId] = useState<string | null>(null)
  const [upload, setUpload] = useState<{ loaded: number; total: number } | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [gone, setGone] = useState(false)
  const [stopped, setStopped] = useState(false)
  const [percent, setPercent] = useState(0)
  const [timing, setTiming] = useState<Pdf2cadJobTiming | null>(null)
  const runningSince = useRef<number | null>(null)

  useEffect(() => {
    if (!jobId) return
    let alive = true
    let timer: number | undefined

    const tick = async () => {
      let next: Pdf2cadJob | null
      try {
        next = await pdf2cadApi.getJob(jobId)
      } catch (e) {
        if (!alive) return
        setError(e instanceof Error ? e.message : String(e))
        timer = window.setTimeout(tick, POLL_MS * 3)
        return
      }
      if (!alive) return
      if (!next) {
        setGone(true)
        setJobId(null)
        return
      }

      setError(null)
      setJob(next)
      const pct = next.status === 'done' ? 100 : (next.percent ?? (100 * next.done_pages) / Math.max(next.total_pages, 1))
      // không cho thanh tiến độ chạy lùi
      setPercent((prev) => (next.status === 'running' ? Math.max(prev, pct) : pct))

      if (next.status === 'running') {
        runningSince.current ??= Date.now()
        const elapsed = (Date.now() - runningSince.current) / 1000
        setTiming({ elapsed, eta: pct > 3 ? (elapsed * (100 - pct)) / pct : null })
      } else {
        setTiming(null)
      }

      if (next.status === 'queued' || next.status === 'running') timer = window.setTimeout(tick, POLL_MS)
    }

    tick()
    return () => {
      alive = false
      window.clearTimeout(timer)
    }
  }, [jobId])

  const start = useCallback(async (files: File[], options: Pdf2cadOptions) => {
    setError(null)
    setGone(false)
    setStopped(false)
    setJob(null)
    setJobId(null)
    setPercent(0)
    setTiming(null)
    runningSince.current = null
    setUpload({ loaded: 0, total: files.reduce((sum, f) => sum + f.size, 0) })
    try {
      const id = await pdf2cadApi.createJob(files, options, (loaded, total) => {
        setUpload({ loaded, total })
        setPercent((100 * loaded) / Math.max(total, 1))
      })
      setPercent(0)
      setJobId(id)
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e))
    } finally {
      setUpload(null)
    }
  }, [])

  const cancel = useCallback(async () => {
    const id = jobId ?? job?.id
    if (!id) return
    setJobId(null)
    setStopped(true)
    try {
      await pdf2cadApi.cancelJob(id)
    } catch {
      // job có thể đã xong / hết hạn – vẫn coi như đã dừng
    }
  }, [jobId, job])

  const active = upload != null
    || (!stopped && !gone && (job?.status === 'queued' || job?.status === 'running'))

  return { job, upload, error, gone, stopped, percent, timing, active, start, cancel }
}
