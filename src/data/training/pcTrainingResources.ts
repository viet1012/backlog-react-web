import type { TrainingResource } from '../../types/pcTraining'

export const pcTrainingResources: TrainingResource[] = [
  { id: 'systems', category: 'Systems', title: 'Hệ thống nghiệp vụ PC', description: 'Mr.ReFINE!, SAP, Manufa, Check Data và các nguồn dữ liệu hỗ trợ.', status: 'reference', slideSources: 'Slides 7–20' },
  { id: 'pc-tools', category: 'PC tools', title: 'Bộ tool hỗ trợ công việc PC', description: 'Tool tạo PO, đổi ngày, ShipBy, BOM, Process và PO Planning được giới thiệu trong tài liệu.', status: 'reference', slideSources: 'Slides 18–31, 39–41' },
  { id: 'upload-formats', category: 'Upload formats', title: '18 format upload Daily / Weekly', description: 'Các file format theo customer được nhắc trong tài liệu; chưa có file tải trong repository.', status: 'coming-soon', slideSources: 'Slides 34–36' },
  { id: 'agreement-materials', category: 'Agreement', title: 'Agreement và Certificate templates', description: 'Mẫu được lưu trong thư mục Agreement hoặc email PC theo hướng dẫn; chưa có file trong repository.', status: 'coming-soon', slideSources: 'Slides 59–62' },
  { id: 'master-templates', category: 'Master', title: 'Master registration templates', description: 'Format 8 worksheet do IT cung cấp; chưa có file trong repository.', status: 'coming-soon', slideSources: 'Slides 65–69' },
]
