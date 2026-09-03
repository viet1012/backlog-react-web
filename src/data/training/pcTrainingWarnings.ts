import type { TrainingWarning } from '../../types/pcTraining'

export const pcTrainingWarnings: TrainingWarning[] = [
  { id: 'delay-authority', severity: 'critical', title: 'Không tự quyết định delay', message: 'Quyết định chuyển ngày xuất do delay phải đến từ SM của bộ phận sản xuất; PC tuyệt đối không tự quyết định.', slideSources: 'Slide 28' },
  { id: 'export-dates', severity: 'critical', title: 'Kiểm soát ngày xuất', message: 'ExportD không được trễ hơn PromiseD (nếu có), ORG_Date và MSM_Ship theo các điều kiện trong tài liệu.', slideSources: 'Slide 21' },
  { id: 'bom-scope', severity: 'warning', title: 'Phạm vi thay đổi BOM', message: 'Input 101* sẽ đổi tất cả 52* liên quan. Muốn đổi riêng từng 52*/72* phải dùng Process BOM Edit trên Manufa.', slideSources: 'Slide 30' },
  { id: 'nocom-air', severity: 'critical', title: 'Vận chuyển hàng bù Nocom', message: 'Hàng Nocom bắt buộc change AIR; Logistics sau đó chọn phương thức phù hợp với ngày xuất và nhận hàng yêu cầu.', slideSources: 'Slide 57' },
  { id: 'stock-control', severity: 'critical', title: 'Không tự ý nhập kho blank', message: 'PC không được tự ý nhập kho blank vì ảnh hưởng đến deadstock; tài liệu chỉ nêu ngoại lệ khi có yêu cầu của cấp trên.', slideSources: 'Slide 51' },
  { id: 'agreement-time', severity: 'warning', title: 'Thời hạn Agreement', message: 'Gửi hợp đồng cho khách trước ít nhất 4 ngày xuất hàng; hợp đồng cần chữ ký và mộc đỏ của công ty khách hàng.', slideSources: 'Slide 62' },
  { id: 'comment-limit', severity: 'note', title: 'Giới hạn PrintCommentInput', message: 'Mỗi lần nhập tối đa 150 số MNF 52*/72*.', slideSources: 'Slide 13' },
  { id: 'convert-formats', severity: 'note', title: 'Convert Order Name', message: 'Chỉ 7 trong 18 format upload cần convert Order Name sang SPC Name.', slideSources: 'Slide 36' },
]
