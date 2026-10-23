import type { FitView } from '../types/machineLocator'
import type {
  FitJob,
  FitWorkerRequest,
  FitWorkerResponse,
  FitWorkerTask,
  SnapJob,
} from './machineLocatorFit.worker'

// =========================================================
// CLIENT CỦA WORKER ÔM KHUNG
// - 1 worker / 1 ảnh layout: ảnh xám chỉ tạo 1 lần khi mở tab xưởng
// - mỗi lúc chỉ gửi 1 yêu cầu; yêu cầu mới cùng key thay yêu cầu cũ đang chờ
//   (và bỏ kết quả của yêu cầu cũ đang chạy) -> kéo tiếp thì huỷ lần ôm trước
// =========================================================

export type FitterState = 'loading' | 'ready' | 'error'

// cancelled: bị yêu cầu mới / cancel() thay thế
export type FitOutcome =
  | { cancelled: false, view: FitView }
  | { cancelled: true }

export type { FitJob, SnapJob }

type Done = Extract<FitWorkerResponse, { t: 'done' }>

interface Job {
  id: number
  key: string
  task: FitWorkerTask
  stale: boolean
  // null = bị huỷ
  resolve: (m: Done | null) => void
  reject: (e: Error) => void
}

export class MachineFitter {
  private readonly worker: Worker
  private seq = 0
  private queue: Job[] = []
  private inFlight: Job | null = null
  private state: FitterState = 'loading'
  private disposed = false

  readonly ready: Promise<void>
  private settleReady: (err?: Error) => void = () => undefined

  constructor(imageUrl: string) {
    this.ready = new Promise<void>((resolve, reject) => {
      this.settleReady = (err) => (err ? reject(err) : resolve())
    })
    // tránh unhandled rejection; nơi dùng tự bắt lỗi qua ready / fit()
    this.ready.catch(() => undefined)

    this.worker = new Worker(new URL('./machineLocatorFit.worker.ts', import.meta.url), { type: 'module' })

    this.worker.onmessage = (e: MessageEvent<FitWorkerResponse>) => {
      const m = e.data

      if (m.t === 'ready') {
        this.state = 'ready'
        this.settleReady()
        this.pump()
      } else if (m.t === 'error') {
        this.fail(new Error(m.message))
      } else {
        this.onResult(m)
      }
    }

    this.worker.onerror = (e) => {
      this.fail(new Error(e.message || 'Worker ôm khung bị lỗi.'))
    }

    void this.load(imageUrl)
  }

  get status(): FitterState {
    return this.state
  }

  // Giải mã ảnh ngoài luồng chính rồi chuyển hẳn (transfer) sang worker
  private async load(imageUrl: string) {
    try {
      const res = await fetch(imageUrl)

      if (!res.ok) throw new Error(`Không tải được ảnh layout (HTTP ${res.status}).`)

      const bitmap = await createImageBitmap(await res.blob())

      if (this.disposed) {
        bitmap.close()
        return
      }

      this.post({ t: 'init', bitmap }, [bitmap])
    } catch (e) {
      this.fail(e instanceof Error ? e : new Error(String(e)))
    }
  }

  private post(m: FitWorkerRequest, transfer: Transferable[] = []) {
    this.worker.postMessage(m, transfer)
  }

  private fail(err: Error) {
    if (this.state === 'error' || this.disposed) return

    this.state = 'error'
    this.settleReady(err)

    for (const j of this.queue) j.reject(err)
    this.queue = []
    this.inFlight?.reject(err)
    this.inFlight = null
  }

  private pump() {
    if (this.inFlight || this.state !== 'ready') return

    const job = this.queue.shift()

    if (!job) return

    this.inFlight = job
    this.post({ ...job.task, id: job.id })
  }

  private onResult(m: Done) {
    const job = this.inFlight

    if (!job || job.id !== m.id) return

    this.inFlight = null

    if (job.stale) job.resolve(null)
    else if (m.error) job.reject(new Error(m.error))
    else job.resolve(m)

    this.pump()
  }

  private enqueue(key: string, task: FitWorkerTask): Promise<Done | null> {
    if (this.state === 'error') return Promise.reject(new Error('Chưa tải được ảnh layout.'))

    this.cancel(key)

    return new Promise<Done | null>((resolve, reject) => {
      this.queue.push({ id: ++this.seq, key, task, stale: false, resolve, reject })
      this.pump()
    })
  }

  async fit(key: string, job: FitJob): Promise<FitOutcome> {
    const m = await this.enqueue(key, { t: 'fit', ...job })

    if (!m) return { cancelled: true }
    if (!m.view) throw new Error('Worker không trả kết quả.')

    return { cancelled: false, view: m.view }
  }

  // Bắt dính điểm vào nét mực gần nhất; null khi không có nét gần / bị huỷ
  async snap(job: SnapJob): Promise<[number, number] | null> {
    const m = await this.enqueue('snap', { t: 'snap', ...job })

    return m?.pt ?? null
  }

  // Huỷ mọi yêu cầu của key (đang chờ: bỏ luôn; đang chạy: bỏ kết quả)
  cancel(key: string) {
    this.queue = this.queue.filter((j) => {
      if (j.key !== key) return true

      j.resolve(null)
      return false
    })

    if (this.inFlight?.key === key) this.inFlight.stale = true
  }

  dispose() {
    this.disposed = true

    for (const j of this.queue) j.resolve(null)
    this.inFlight?.resolve(null)
    this.queue = []
    this.inFlight = null
    this.worker.terminate()
  }
}
