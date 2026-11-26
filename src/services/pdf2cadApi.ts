import type {
  DxfPreview,
  Pdf2cadBotReply,
  Pdf2cadBotRequest,
  Pdf2cadHealth,
  Pdf2cadJob,
  Pdf2cadLearnResult,
  Pdf2cadOptions,
  Pdf2cadTemplate,
} from '../types/pdf2cad'

/** Lỗi từ server pdf2cad (detail tiếng Việt như server trả về; UI tự dịch) */
export class Pdf2cadError extends Error {
  readonly status?: number

  constructor(message: string, status?: number) {
    super(message)
    this.name = 'Pdf2cadError'
    this.status = status
  }
}

/** Hợp đồng chung cho bản HTTP (server pdf2cad / proxy BE) và bản dữ liệu mẫu */
export interface Pdf2cadApi {
  health(): Promise<Pdf2cadHealth>
  /** tải file lên + tạo job; trả mã job */
  createJob(files: File[], options: Pdf2cadOptions, onUpload?: (loaded: number, total: number) => void): Promise<string>
  /** null = job không còn trên server (hết hạn / đã xoá) */
  getJob(id: string): Promise<Pdf2cadJob | null>
  cancelJob(id: string): Promise<void>
  downloadFile(jobId: string, name: string): Promise<void>
  downloadZip(jobId: string): Promise<void>
  preview(jobId: string, name: string): Promise<DxfPreview>
  /** ảnh trang gốc (PDF / scan) */
  pageImageUrl(jobId: string, fileIdx: number, page: number): Promise<string>
  learn(jobId: string, name: string): Promise<Pdf2cadLearnResult>
  templates(): Promise<Pdf2cadTemplate[]>
  bot(request: Pdf2cadBotRequest): Promise<Pdf2cadBotReply>
}
