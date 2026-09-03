import type { PcOrderMode, PcUploadOrderTraining } from '../../types/pcTraining'

const markedModes: Record<string, PcOrderMode[]> = {
  DP_ALB: ['mts-manual'], DPC: ['mts-manual'], DPF: ['mts-manual', 'mto-manual'],
  DPM: ['mts-manual'], DPP: ['mts-manual', 'mto-manual'], DPU: ['mts-manual', 'mto-manual'],
  FNK: ['mts-manual'], JDR: ['mts-manual'], PCS: ['mts-manual'],
  '55C-Z': ['mts-auto', 'mto-auto'], KOR: ['mts-auto', 'mto-auto'],
  MYS: ['mts-auto', 'mto-auto'], SH2: ['mts-auto', 'mto-auto'],
  VNM: ['mts-auto', 'mto-auto'], HCM: ['mts-auto', 'mto-auto'], KJS: ['mto-auto'],
  FJS: ['mts-manual'], FCN: ['mts-manual'], SSH: ['mts-manual'], STL: ['mts-manual'],
}

const customers: Array<[string, string]> = [
  ['DP_ALB', 'Dayton Anchor Lamina'], ['DPC', 'Dayton Canada'], ['DPF', 'Dayton France'],
  ['DPM', 'Dayton Mexico'], ['DPP', 'Dayton Potugal'], ['DPU', 'Dayton Ohio'],
  ['FNK', 'Finko'], ['JDR', 'Jouder'], ['PCS', 'PCS'], ['IND', 'MSM India'],
  ['BLR', 'MSM India'], ['PUNE', 'MSM India'], ['JKT', 'MSM Indonesia'],
  ['53E', 'MSM Japan'], ['55C', 'MSM Japan'], ['52W', 'MSM Japan'],
  ['53E-Z', 'MSM Japan'], ['52W-Z', 'MSM Japan'], ['55C-Z', 'MSM Japan'],
  ['KOR', 'MSM Korea'], ['MYS', 'MSM Malaysia'], ['SH2', 'MSM Shanghai'],
  ['GGZ', 'MSM Shanghai'], ['SGP', 'MSM Singapore'], ['TIW', 'MSM Taiwan'],
  ['THA', 'MSM Thailand'], ['USA', 'MSM USA'], ['USIL', 'MSM USA'],
  ['USCA', 'MSM USA'], ['USOH', 'MSM USA'], ['GRM', 'MSM Germany'],
  ['VNM', 'MSM Vietnam'], ['HCM', 'MSM Vietnam'], ['KID', 'SRG India'],
  ['KJS', 'SRG Japan'], ['ERC', 'SRG Japan'], ['WRC', 'SRG Japan'],
  ['CRC', 'SRG Japan'], ['KJK', 'SRG Japan'], ['KJS_TK', 'SRG Japan'],
  ['FJS', 'SRG Japan'], ['FCN', 'SRG Nantong'], ['SSH', 'SRG Shanghai'],
  ['STL', 'SRG Thailand'],
]

export const pcUploadOrderTraining: PcUploadOrderTraining = {
  overview: 'Upload Order là quy trình đưa thông tin đơn hàng vào hệ thống và kiểm tra lại dữ liệu sau khi upload. Đơn Auto tự vào hệ thống; PC xử lý khi đơn bị treo. Đơn Manual được PC chuẩn bị và upload theo đúng format.',
  whenToUse: ['Khi PC nhận đơn hàng Manual qua email.', 'Khi cần xử lý một đơn Auto bị treo trong hệ thống.'],
  customerClassification: customers.map(([customerId, group]) => ({ customerId, group, modes: markedModes[customerId] ?? [] })),
  formats: [
    '01_Weekly-Daily_KJS', '02.F_KJS_52_53_55', '03. Format Order_Daily Kamu',
    '04. Format Order_Bush_FS', '05.Daily_FJS', '06_Daily_ERC',
    '07_Daily_KCS', '08_Weekly_KCS', '09_Daily_KTL', '10_Weekly_KTL',
    '11_Weekly_KID', '12_Weekly_PCS', '13_Weekly_Dayton',
    '14. DP_ALB Order Format', '15. Daily_STRL_RC', '16. Daily_STRL_FJS',
    '17. Daily_FCN', '18_Weekly_Dayton_MTO',
  ],
  nameConversionFormats: [
    '01_Weekly-Daily_KJS', '03. Format Order_Daily Kamu', '06_Daily_ERC',
    '09_Daily_KTL', '12_Weekly_PCS', '13_Weekly_Dayton', '14. DP_ALB Order Format',
  ],
  prerequisites: ['Email chứa thông tin đơn hàng.', 'Customer và yêu cầu Daily/Weekly.', 'File theo đúng một trong 18 format.', 'File đã convert Order Name nếu thuộc một trong bảy format bắt buộc.'],
  workflow: [
    { step: 1, title: 'Nhận thông tin đơn hàng', description: 'PC nhận thông tin đơn Manual qua email.', actions: ['Xác định customer.', 'Xác định yêu cầu Daily hoặc Weekly.'] },
    { step: 2, title: 'Chọn format và cập nhật dữ liệu', description: 'Chọn đúng format dựa trên hai tiêu chí Customer và Daily/Weekly.', system: 'Excel', actions: ['Chọn một trong 18 format.', 'Cập nhật thông tin đơn hàng vào file.'], checks: ['Đúng customer.', 'Đúng loại Daily/Weekly.'] },
    { step: 3, title: 'Convert Order Name To SPC Name', description: 'Chỉ thực hiện với bảy format được quy định.', system: 'Manufa', actions: ['Đăng nhập Manufa.', 'Chọn Convert Order Name To SPC Name.', 'Chọn thông tin đúng với format.', 'Chọn Convert.', 'Chọn Keep để lưu file.'], warnings: ['Nếu format không thuộc danh sách bảy format, bỏ qua bước này và chuyển sang Upload.'] },
    { step: 4, title: 'Mở Upload Order', description: 'Truy cập chức năng upload đơn hàng.', system: 'Mr.ReFINE!', actions: ['Đăng nhập hệ thống.', 'Chọn non-M-order(P).', 'Chọn Upload Order.', 'Chọn thông tin đúng với format cần upload.'] },
    { step: 5, title: 'Preview và kiểm tra', description: 'Kiểm tra kết quả file trước khi upload.', system: 'Mr.ReFINE!', actions: ['Chọn Preview.', 'Đọc kết quả hiển thị.'], checks: ['Nếu có lỗi, hệ thống hiển thị cảnh báo màu vàng.'] },
    { step: 6, title: 'Fix và Upload', description: 'Sửa dữ liệu khi Preview báo lỗi rồi đưa đơn vào hệ thống.', system: 'Mr.ReFINE!', actions: ['Chọn Fix khi cần sửa.', 'Upload đơn hàng vào hệ thống.'], checks: ['Không bỏ qua lỗi được phát hiện ở Preview.'] },
    { step: 7, title: 'Order Search và xác nhận', description: 'Kiểm tra đơn hàng sau khi đã vào hệ thống.', system: 'Mr.ReFINE!', actions: ['Mở Order Search.', 'Chọn Search.', 'Kiểm tra thông tin đơn hàng.'], checks: ['Nếu không có lỗi, kết thúc quy trình.', 'Nếu có lỗi, tiếp tục xử lý lỗi.'] },
  ],
  successStates: ['Sau Order Search, nếu không có lỗi thì kết thúc quy trình.'],
  warningStates: ['Preview hiển thị màu vàng khi file có lỗi.'],
  errorStates: ['Lỗi phát hiện ở Preview phải được Fix trước khi hoàn tất.', 'Lỗi phát hiện khi Order Search phải tiếp tục được xử lý.'],
  importantRules: ['Đơn Auto tự vào hệ thống; PC chỉ xử lý khi đơn bị treo.', 'Chọn format theo Customer và Daily/Weekly.', 'Chỉ bảy trong 18 format cần Convert Order Name To SPC Name.', 'Luôn kiểm tra lại đơn bằng Order Search sau upload.'],
  essentialVisualContent: ['Sơ đồ chi tiết Auto/Manual trên slide 33 là hình ảnh; các nhánh và điểm quyết định chưa thể xác nhận đầy đủ từ text.'],
  todoSourceConfirmation: ['Xác nhận chi tiết các nhánh trong sơ đồ Auto/Manual.', 'Xác nhận tiêu chí thành công trực quan ngoài việc kiểm tra bằng Order Search.', 'Xác nhận phân loại cho các customer có ô MTS/MTO không được đánh dấu.'],
  sourceSlides: '32–37',
}
