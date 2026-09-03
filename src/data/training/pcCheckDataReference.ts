import type { PcCheckDataDataset, PcCheckDataField } from '../../types/pcTraining'

const poWipFields: PcCheckDataField[] = [
  { name: 'VBELN', meaning: 'Số SAP 41* hoặc 42*.', note: '41*: đơn gia công; 42*: đơn bù Nocom.' },
  { name: 'ZGLOBAL_CODE', meaning: 'Số LOT SPC.' },
  { name: 'PIER_AUFNR', meaning: 'Số PIER 101*.' },
  { name: 'AUFNR', meaning: 'Số Manufa 52*, 72*, 62* hoặc 82*.' },
  { name: 'IssueD', meaning: 'Ngày PC ban hành lệnh sản xuất; nếu chưa in là ngày khách đặt hàng.', note: 'Tương đồng CMT3.' },
  { name: 'ProductionD', meaning: 'Ngày sản xuất hoàn thành theo lead time kể từ IssueD.', note: 'Nguồn nêu chuẩn 7 ngày và có ngoại lệ theo dòng hàng.' },
  { name: 'PromiseD', meaning: 'Ngày PC hứa trực tiếp với khách hàng.', note: 'Tương đồng CMT5.' },
  { name: 'ExportD', meaning: 'Ngày xuất hàng.', note: 'Không trễ hơn PromiseD (nếu có), ORG_Date.' },
  { name: 'ORG_Date', meaning: 'Kỳ hẹn ban đầu của PC với khách hàng.' },
  { name: 'MSM_Ship', meaning: 'Ngày xuất hàng của khách hàng.', note: 'ExportD không trễ hơn MSM_Ship.' },
  { name: 'PNAME', meaning: 'Tên hàng.' },
  { name: 'RRONYU1', meaning: 'Khách hàng.' },
  { name: 'ShipBy', meaning: 'Phương thức SEA/OCEAN, AIR hoặc EXPRESS.' },
  { name: 'GAMNG', meaning: 'Số pcs của một PO/order sheet.' },
  { name: 'PHCD', meaning: 'Mã P* hoặc PS*.' },
  { name: 'KWMENG', meaning: 'Tổng pcs của một LOT.', note: 'KWMENG bằng tổng GAMNG của các sheet.' },
]

const datasets: Array<[string, string, 'PO' | 'Master' | 'DailyRP']> = [
  ['PO_WIP', 'Trạng thái và tình trạng đơn hàng trong quá trình gia công.', 'PO'],
  ['PO_PROCESS', 'Quy trình, thời gian bắt đầu/kết thúc và số lượng NG/OK sau từng công đoạn.', 'PO'],
  ['PO_BOM', 'BOM của từng PO.', 'PO'],
  ['PO_INFO', 'Toàn bộ thông tin đơn hàng, gồm cả đơn đã cancel không hiển thị trong PO_WIP.', 'PO'],
  ['STOCK', 'Số lượng hiện có ở kho có thể sử dụng (dữ liệu kho 2).', 'PO'],
  ['MATERIAL', 'Nguyên vật liệu của PO.', 'PO'],
  ['SALE', 'Thông tin xuất khẩu.', 'PO'],
  ['W_ORDER', 'Thông tin cơ bản khi đơn được upload vào hệ thống.', 'PO'],
  ['ORDER_DTL', 'Thông tin cơ bản sau khi đơn được tạo qua SAP.', 'PO'],
  ['SEND_ORDER', 'Kiểm tra tên, số lượng, BOM và Process trước khi in đơn cho xưởng.', 'PO'],
  ['PRODUCT', 'Thông tin Master cơ bản: nhóm, MinLot, MaxLot và weight.', 'Master'],
  ['PART/MAT', 'Bộ phận, linh kiện hoặc nguyên vật liệu của sản phẩm.', 'Master'],
  ['PRODUCT(PC)', 'Thông tin Master chi tiết như line sản xuất và vật liệu.', 'Master'],
  ['MATERIAL(PC)', 'Nguyên vật liệu của sản phẩm.', 'Master'],
  ['BOM FG', 'Vật liệu, tên vật liệu, Lcut để sản xuất một pcs FG.', 'Master'],
  ['BOM HF', 'Vật liệu, tên vật liệu, Lcut để sản xuất một pcs HF.', 'Master'],
  ['PROCESS', 'Quy trình của sản phẩm.', 'Master'],
  ['PRICE', 'Giá bán của sản phẩm.', 'Master'],
  ['PACKING', 'Số lượng Packing thực nhận của PO cần kiểm tra.', 'DailyRP'],
  ['DRAWING', 'Bản vẽ gia công chi tiết.', 'Master'],
  ['DTM_PURCHASE', 'Thông tin mua nguyên vật liệu.', 'PO'],
  ['DTM_RECEIVE', 'Thời gian nguyên vật liệu giao về SPC.', 'PO'],
  ['DTM_ISSUE', 'Thông tin đơn đã sử dụng vật liệu cần kiểm tra để Issue.', 'PO'],
]

const detailedData: Record<string, Partial<PcCheckDataDataset>> = {
  PO_WIP: {
    inputs: ['LOT SPC/khách hàng', 'Lot System', 'MNF ID', 'MTO ID', 'PIER No 101*', 'VBELN 41*/42*', 'Export Date'],
    outputs: ['Quan hệ số đơn', 'Các ngày Issue/Production/Promise/Export', 'Customer, ShipBy và quantity'], fields: poWipFields,
  },
  SALE: {
    inputs: ['LOT', 'Lot System', 'MNF ID', 'Product ID/Name', 'Invoice', 'Date'],
    outputs: ['Thông tin invoice, quantity, price, amount, customer và ShipD'],
    fields: [
      { name: 'Purchaseordernumber', meaning: 'Số LOT SPC.' }, { name: 'Material', meaning: 'Mã P* hoặc PS*.' },
      { name: 'Description', meaning: 'Tên sản phẩm của khách hàng.' }, { name: 'DIV', meaning: 'Nhóm.' },
      { name: 'Deliveryquantity', meaning: 'Số lượng xuất khẩu thực tế.' }, { name: 'Netprice', meaning: 'Giá mỗi pcs.' },
      { name: 'Amount', meaning: 'Tổng tiền của LOT.', note: 'Amount = Netprice × Deliveryquantity.' },
      { name: 'ExternalID', meaning: 'Số invoice.' }, { name: 'ShipD', meaning: 'Ngày lên hóa đơn.' },
      { name: 'ItCa', meaning: 'Loại đơn.', note: 'ZLN: Nocom; ZAN: bình thường.' },
      { name: 'YourRef', meaning: 'Khách hàng.' }, { name: 'namespc', meaning: 'Tên sản phẩm SPC gia công.' },
    ],
  },
  'BOM FG': {
    inputs: ['Product Name', 'Product ID', 'Part/Material Name', 'Part/Material ID'], outputs: ['Chi tiết BOM thành phẩm'],
    fields: [
      { name: 'INNER_CODE', meaning: 'Tên sản phẩm.' }, { name: 'BOM_ID_YES', meaning: 'Tên BOM sản phẩm.' },
      { name: 'MATNR_YES', meaning: 'Mã vật liệu/linh kiện cấu thành một pcs.' }, { name: 'MAKTX_YES', meaning: 'Tên vật liệu/linh kiện.' },
      { name: 'AMOUNT_YES', meaning: 'Số lượng cần để gia công hoặc lắp ráp.' }, { name: 'UNITQTY_YES', meaning: 'Đơn vị đo lường.' },
    ],
  },
  SEND_ORDER: {
    inputs: ['MNF ID', 'Issue Date'], outputs: ['Thông tin PO và các cột kiểm tra trước khi in'],
    fields: [
      { name: 'LCUT', meaning: 'Tổng vật liệu/linh kiện cần để gia công PO.' }, { name: 'BOM-Process', meaning: 'Công đoạn đầu của quá trình gia công.' },
      { name: 'CheckPName', meaning: 'Kiểm tra tên sản phẩm.' }, { name: 'Check_MatType', meaning: 'So vật liệu PO với Master.' },
      { name: 'Check_LCUT', meaning: 'Kiểm tra Lcut.' }, { name: 'ChecK_Main', meaning: 'Kiểm tra BOM bắt đầu đúng công đoạn.' },
      { name: 'Check_Dup', meaning: 'Kiểm tra BOM trùng.', note: 'Một PO chỉ có một mã M* để gia công.' },
      { name: 'Check_AssyPart', meaning: 'Kiểm tra linh kiện.' }, { name: 'Check_BOM-Process', meaning: 'Kiểm tra quy trình.' },
      { name: 'Check_Final', meaning: 'Tổng hợp lỗi cần kiểm tra lại.' },
    ],
  },
  PRODUCT: {
    inputs: ['Product Name', 'Product ID', 'Product Name & Convert', 'Product Type', 'DIV'], outputs: ['Thông tin Master cơ bản'],
    fields: [
      { name: 'MATNR', meaning: 'Mã P* hoặc PS*.' }, { name: 'MAKTX', meaning: 'Tên sản phẩm.' }, { name: 'NORMT', meaning: 'Inner.' },
      { name: 'FERTH', meaning: 'Nhóm sản phẩm.' }, { name: 'PRODH', meaning: 'Code mặc định của dòng sản phẩm.' },
      { name: 'MATKL', meaning: 'Code mặc định của dòng sản phẩm.' }, { name: 'MinLot', meaning: 'Số pcs tối thiểu trên order sheet.', note: 'Mặc định được nêu là 1 pcs.' },
      { name: 'MaxLot', meaning: 'Số pcs tối đa trên order sheet.' }, { name: 'WEIGHT', meaning: 'Cân nặng.' },
      { name: 'TEXT_CA', meaning: 'Điều kiện gia công số lượng chẵn.' }, { name: 'TEXT_CS', meaning: 'Điều kiện test nhiệt.' },
    ],
  },
}

export const pcCheckDataDatasets: PcCheckDataDataset[] = datasets.map(([name, purpose, category]) => ({
  id: name.toLowerCase().replace(/[^a-z0-9]+/g, '-'), name, purpose, category,
  fields: [], sourceSlides: name === 'PO_WIP' ? '21' : name === 'SALE' ? '22' : name === 'BOM FG' ? '23' : name === 'SEND_ORDER' ? '24' : name === 'PRODUCT' ? '25' : '20',
  ...detailedData[name],
}))

export const TODO_SOURCE_CONFIRMATION = [
  'Ý nghĩa nghiệp vụ riêng của MNF 62* và 82* chưa được nguồn định nghĩa.',
  'Quan hệ Start Date/End Date của MALSY_CO01 trên nguồn chưa đủ rõ.',
  'Thông báo thành công cho EXP trong tool đổi ShipBy cần xác nhận vì nguồn hiển thị “D column is not correct!”.',
] as const
