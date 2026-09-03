import type { TrainingSystem } from '../../types/pcTraining'

export const pcTrainingSystems: TrainingSystem[] = [
  {
    id: 'mr-refine', name: 'Mr.ReFINE!', category: 'Order system',
    purpose: 'Tiếp nhận đơn hàng và kiểm tra thông tin đơn sau khi vào hệ thống.',
    uses: ['Upload đơn hàng', 'Preview dữ liệu trước khi ghi nhận', 'Tìm và kiểm tra đơn hàng đã upload'],
    functions: [
      { id: 'upload-order', name: 'Upload Order', purpose: 'Đưa dữ liệu đơn hàng vào hệ thống.', inputs: ['File đơn hàng theo đúng format'], outputs: ['Kết quả Preview và trạng thái upload'], warnings: ['Phải xử lý lỗi hiển thị trước khi kết thúc quy trình.'] },
      { id: 'order-search', name: 'Order Search', purpose: 'Kiểm tra đơn hàng sau khi upload.', inputs: ['Thông tin nhận diện đơn hàng'], outputs: ['Thông tin đơn đã vào hệ thống'] },
    ],
    notes: ['Không hiển thị URL hệ thống trong tài liệu web.'], sourceSlides: '7, 37',
  },
  {
    id: 'sap', name: 'SAP', category: 'ERP',
    purpose: 'Tích hợp dữ liệu và nghiệp vụ kế hoạch, sản xuất, tồn kho cùng các hoạt động doanh nghiệp.',
    uses: ['Tạo và xem Sales Order', 'Tạo, thay đổi và xem Production Order', 'Xem vật tư', 'Lấy dữ liệu Export List'],
    functions: [
      { id: 'zsgt10760-72', name: 'ZSGT10760-72 — Export List', purpose: 'Xem danh sách dữ liệu xuất hàng.' },
      { id: 'va01-03', name: 'VA01–03 — Create Sales Order', purpose: 'Tạo đơn hàng tiêu chuẩn.' },
      { id: 'zsgt00040-01', name: 'ZSGT00040-01 — Display Materials', purpose: 'Xem mã, mô tả, tồn kho và đơn vị tính của vật tư/hàng hóa.' },
      { id: 'va05-08', name: 'VA05–08 — Display Sales Order List', purpose: 'Xem danh sách và thông tin đơn hàng.' },
      { id: 'co01-05', name: 'CO01–05 — Create Production Order', purpose: 'Tạo lệnh sản xuất yêu cầu nhà máy gia công hoặc sản xuất.' },
      { id: 'co02', name: 'CO02 — Change Production Order', purpose: 'Thay đổi số lượng, thời gian hoặc BOM của lệnh đã tạo.' },
      { id: 'co03', name: 'CO03 — Display Production Order', purpose: 'Xem chi tiết lệnh sản xuất ở chế độ không chỉnh sửa.' },
    ],
    relatedTools: ['MALSY_CO01_Create_ProductionOrder', 'Malsy_CO08_受注紐付指図登録'], sourceSlides: '8',
  },
  {
    id: 'manufa', name: 'Manufa', category: 'Manufacturing system',
    purpose: 'Theo dõi đơn hàng từ khi nhận đến khi hoàn thành, kiểm soát quy trình và số lượng OK/NG.',
    uses: ['Kiểm tra và in order sheet', 'Tách/gộp đơn', 'Kiểm tra Process/BOM', 'Cập nhật tên Master', 'Theo dõi kết quả từng công đoạn'],
    functions: [
      { id: 'orders-list', name: 'Orders List', purpose: 'Kiểm tra thông tin đơn hàng.' },
      { id: 'print-permission', name: 'Print Permissions Manually Grant', purpose: 'Phân quyền các đơn hàng sẽ in.' },
      { id: 'instruction-print', name: 'Manufacturing instructions / stock shipping instructions Print', purpose: 'In phiếu gia công hoặc phiếu xuất kho.', inputs: ['LOT SPC', 'PIER 101* hoặc MNF 52*/72*', 'Máy in', 'PO và quantity được chọn'], outputs: ['Order sheet được in'] },
      { id: 'reprint', name: 'Re-Print', purpose: 'In lại phiếu đã in.', warnings: ['Không cần phân quyền lại.'] },
      { id: 'repair-list', name: 'Repair List', purpose: 'Xưởng in đơn hàng cần sửa chữa hoặc chạy bù.' },
      { id: 'split-merge', name: 'Split/Merge Instructions', purpose: 'Tách hoặc gộp số lượng đơn hàng.', inputs: ['PIER/MNF', 'PO được chọn', 'Số pcs muốn tách'], outputs: ['Tổng số lượng, số đã tách và số còn lại'] },
      { id: 'process-bom-edit', name: 'Process BOM Edit', purpose: 'Kiểm tra hoặc chỉnh Process và BOM theo MNF.', inputs: ['MNF 52*/72*', 'Tên hàng', 'Process', 'BOM', 'Quantity'], outputs: ['Read Only, Edit, Change Complete hoặc Error happen'], warnings: ['Phải chọn đúng công đoạn đầu tại Leave Process.'] },
      { id: 'print-comment', name: 'PrintCommentInput', purpose: 'Cập nhật dữ liệu comment trước khi in.', inputs: ['MNF 52*/72*', 'Order Model', 'Quantity', 'Print comment 1–6'], outputs: ['Kết quả cập nhật hoặc Error message'], warnings: ['Mỗi lần tối đa 150 MNF.', 'Ngày dùng format yyyymmdd.', 'Comment PC không có dấu.'] },
      { id: 'master-name', name: 'Master Change Name', purpose: 'Cập nhật Order Name và SPC Name cho MTS/MTO.', inputs: ['MTS hoặc MTO', 'Plant', 'Order Name', 'SPC Name', 'File Excel đúng format'], outputs: ['Thông tin tổng hợp và kết quả upload'], warnings: ['MTS chưa có Master dùng Export Data Filter Excel; MTO lấy file từ app Change Name.'] },
      { id: 'convert-name', name: 'Convert Order Name to SPC Name', purpose: 'Chuyển tên khách hàng thành tên SPC gia công.', inputs: ['Customer SRG hoặc FCN', 'Goods/format', 'File name'], outputs: ['Kết quả convert và file tải bằng Keep'], warnings: ['Chỉ bảy format được nêu cần convert.'] },
      { id: 'daily-report', name: 'Daily Report', purpose: 'Xem số lượng thực tế và thời gian gia công sau từng công đoạn.', inputs: ['MNF 52*/72*'], outputs: ['Process/Process ID', 'Result Qty', 'Bad Qty', 'Work start/end date time'] },
    ],
    sourceSlides: '9–16',
  },
  {
    id: 'check-data', name: 'Check Data', category: 'PC data tool',
    purpose: 'Truy vấn dữ liệu tổng hợp từ SAP và Manufa để kiểm soát trạng thái đơn hàng, BOM và xuất khẩu.',
    uses: ['Kiểm tra PO và tiến độ', 'Kiểm tra stock/material', 'Kiểm tra Sale', 'Tra cứu Master, BOM và Process', 'Check Send Order trước khi in'],
    functions: [{ id: 'datasets', name: '23 data extracts', purpose: 'Cung cấp 23 nhóm dữ liệu PO, Master và Daily Report.' }],
    notes: ['Chi tiết từng dataset được lưu trong Check Data Reference.'], sourceSlides: '20–25',
  },
  {
    id: 'sql-access', name: 'SQL / Access', category: 'Data tools',
    purpose: 'Truy vấn, phân tích, cập nhật và tổ chức dữ liệu từ các hệ thống liên quan.',
    uses: ['SQL lấy và phân tích dữ liệu qua kết nối gián tiếp', 'Access hỗ trợ query SQL, form và báo cáo đơn giản'],
    functions: [], sourceSlides: '17',
  },
  {
    id: 'excel', name: 'Excel', category: 'Productivity tool',
    purpose: 'Xử lý dữ liệu, báo cáo, biểu đồ và dashboard; có thể kết nối SAP, SQL và Access.',
    uses: ['Vận hành tool PC', 'Chuẩn bị format upload', 'PO Planning', 'Export List', 'Chuẩn bị Master template'],
    functions: [], relatedTools: ['PO Planning – Manufa', 'Check Data'], sourceSlides: '18–20',
  },
]
