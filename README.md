# KVH Production Control (backlog-react-web)

Web nội bộ quản lý sản xuất / kế hoạch của KVH: backlog đơn hàng, xác nhận công đoạn (Fac Confirm), tổng hợp ODBF, lịch xuất hàng, giám sát an toàn máy (HSE) và công cụ dựng bản đồ vị trí máy (Machine Locator).

Frontend thuần (SPA). Dữ liệu và đăng nhập đi qua backend `backlog-be` (repo riêng).

## Mục lục

- [Tổng quan chức năng](#tổng-quan-chức-năng)
- [Chi tiết từng chức năng](#chi-tiết-từng-chức-năng)
- [Công nghệ](#công-nghệ) · [Bắt đầu](#bắt-đầu) · [Cấu hình môi trường](#cấu-hình-môi-trường)
- [Đăng nhập & phân quyền](#đăng-nhập--phân-quyền) · [Cấu trúc thư mục](#cấu-trúc-thư-mục)
- [Script Machine Locator](#script-machine-locator) · [Build & triển khai](#build--triển-khai)
- [Lịch sử thay đổi](#lịch-sử-thay-đổi)

---

## Tổng quan chức năng

| Route | Chức năng | Role | Trạng thái |
| --- | --- | --- | --- |
| `/login` | [Đăng nhập / đăng ký](#1-đăng-nhập--đăng-ký) | — | Hoạt động |
| `/backlog` | [Backlog Details](#2-backlog-details) | PC | Hoạt động |
| `/fac-confirm` | [Delivery Confirm (Fac Confirm)](#3-delivery-confirm-fac-confirm) | PC, PRO | Hoạt động |
| `/odbf` | [ODBF Summary](#4-odbf-summary) | PC, PRO | Hoạt động |
| `/shipping-schedule` | [Shipment Fulfillment](#5-shipment-fulfillment) | PC, PRO | Chạy được, menu đang khoá |
| `/remain-po-control` | [Remain PO Control](#6-remain-po-control) | PC | Hoạt động (iframe) |
| `/monitoring/machine` | [Machine Monitoring – Safety (HSE)](#7-machine-monitoring--safety-hse) | Mọi user | Hoạt động |
| `/settings/machine-locator` | [Machine Locator](#8-machine-locator) | Xem: mọi user · Sửa: ADMIN | Hoạt động |
| `/user-home` | [User Home](#9-user-home) | Mọi user (trang mặc định sau đăng nhập) | Hoạt động |
| `/pc-training` | [PC Training](#10-pc-training) | Mọi user | Chạy được, ẩn khỏi menu |
| `/cost-monitoring` | [Cost Monitoring](#11-cost-monitoring) | Mọi user | Hoạt động |
| `/settings/ai-logs` | [AI Logs](#12-ai-logs) | ADMIN | Hoạt động |
| `/utility-evn-compare` | [Utility · EVN Compare](#13-utility--evn-compare) | ADMIN | Hoạt động |
| `/sph`, `/asakai`, `/bosb`, `/deadstock`, `/pl`, `/kpi`, `/ot`, `/packing-list`, `/export-list`, `/sales-status` | Trang giữ chỗ | — | Chưa làm |

`ADMIN` vào được mọi màn hình. Route cũ `/machine-locator` và `/machine-monitor` tự chuyển sang route mới (giữ nguyên query và `#hash`).

### Giao diện chung

- **Sidebar trái** chia nhóm PRODUCTION / PLANNING / MANAGEMENT / MONITORING / SETTING.
  - Menu tự lọc theo role của người đăng nhập.
  - Mục đang phát triển gắn nhãn *Developing*, mục chưa làm gắn nhãn *Chưa làm*; cả hai không bấm được.
  - Biểu tượng cạnh từng mục cho biết màn hình chỉ để xem (*View*) hay có nhập liệu (*Input*).
  - Sidebar thu gọn được thành dạng chỉ còn icon.
- **Chế độ sáng / tối** đổi bằng nút ở đầu mỗi trang và được ghi nhớ.
- **Đăng xuất** ở chân sidebar, có hộp thoại xác nhận.
- **Trạng thái tải / trống / lỗi** giống nhau ở mọi trang:
  - Tải dưới 300 ms thì không hiện gì.
  - Tải lần đầu hiện **skeleton** theo hình dạng nội dung (bảng, heatmap, lưới chart, thẻ KPI, bản đồ).
  - Tải lại khi đã có dữ liệu thì chỉ quay icon ⟳ trên header, dữ liệu cũ vẫn hiện.
  - Lỗi khi chưa có dữ liệu: cảnh lỗi kèm nút *Thử lại*. Lỗi khi còn dữ liệu cũ: thanh báo lỗi phía trên nội dung.
  - Không có dữ liệu: luôn có nút hành động, là *Xóa bộ lọc* khi đang lọc, còn lại là *Làm mới*.
- **Thanh bộ lọc** giống nhau ở Backlog, Fac Confirm, Shipment, AI Logs:
  - Bên phải có nhãn *"Đang lọc: N"* và nút *Xóa bộ lọc*.
  - Riêng **Fac Confirm** dùng kiểu gọn để giữ bố cục cũ (thanh này đã chật vì dải thẻ công đoạn):
    - Không lọc gì thì không hiện nút nào.
    - Đang lọc thì chỉ hiện 1 nút icon nhỏ có kèm số bộ lọc. Rê chuột vào hiện *"Xóa bộ lọc (N)"*.
  - "Đang lọc" chỉ đếm bộ lọc thu hẹp dữ liệu (ô tìm, loại hàng, trạng thái, lọc cột…). Phạm vi xem như Division, ngày xuất, công đoạn không tính và được giữ nguyên khi xóa.
  - Ô tìm chỉ lọc sau khi ngừng gõ 300–400 ms. Ô tìm tự co lại khi thanh chật.
- **Bộ lọc nằm trên URL** (Backlog, Fac Confirm, Shipment, AI Logs, EVN), ví dụ `/fac-confirm?div=PR&expD=2026-11-19&procGrp=Rough&heat=DC53`:
  - Copy link gửi đồng nghiệp là mở đúng màn hình đang xem. Bấm F5 không mất bộ lọc.
  - Giá trị mặc định không ghi lên link cho gọn (vd Heat Type = All). Riêng Division / ngày / công đoạn (Fac Confirm) và tháng / phạm vi (EVN) luôn có trên link.
  - Lọc theo cột kiểu Excel và ô Summary của Backlog chưa đưa lên URL.
  - **Link cũ, dữ liệu không còn** (vd PO đã xoá):
    - Bảng hiện *"Không tìm thấy kết quả phù hợp"*, ghi rõ bộ lọc không khớp, kèm nút *Xóa bộ lọc*.
    - Fac Confirm có thêm nút *Về hôm nay* khi Export Date khác hôm nay.
  - **Bộ lọc sai trong link** (vd `?expD=2026-13-45`, `?div=XX`): bỏ qua giá trị đó, dùng mặc định, và hiện toast cảnh báo kèm tham số bị bỏ.
    - Khoảng ngày ngược hoặc quá dài (AI Logs, Shipment) thì lặng lẽ về khoảng mặc định.
    - Giá trị ô chọn không còn trong danh sách (vd Status cũ) vẫn hiện trong ô chọn để người dùng thấy và bỏ được.
- **Thông báo (toast)** sau khi lưu / nhập file / xuất file hiện ở giữa đáy màn hình, cùng một kiểu trên mọi trang:
  - Thành công tự đóng sau 4 giây, cảnh báo sau 6 giây, lỗi sau 8 giây. Rê chuột vào toast thì tạm dừng đếm giờ.
  - Lỗi có thêm dòng lý do từ server.
  - Xuất file hiện tiến trình *"Đang xuất… 45%"*, xong thì đổi thành *"Đã xuất <tên file>"* hoặc *"Xuất file thất bại"*.

### Lưới dữ liệu kiểu Excel (dùng ở Backlog, Fac Confirm, Shipment)

- **Menu tiêu đề cột** có *Sort A→Z / Z→A* và *Filter…*.
- **Lọc theo danh sách giá trị:** lấy từ server, có ô tìm, *(Select All)* và *(Blanks)*. Cột ngày lọc theo dạng cây năm → tháng → ngày.
- **Lọc theo điều kiện**, tuỳ kiểu cột:
  - Text: Equals, Contains, Begins With, Is Empty…
  - Number: =, ≠, >, ≥, <, ≤
  - Date: Equals / Before / After
- **Ghi nhớ cấu hình** riêng cho từng bảng trên trình duyệt: thứ tự cột, cột ẩn/hiện, độ rộng cột, số dòng mỗi trang.
- **Mật độ dòng** *gọn / vừa / thoáng* (nút *Mật độ* trên thanh công cụ của bảng). Nhớ theo **từng người đăng nhập**, nên máy dùng chung ở xưởng mỗi người giữ lựa chọn riêng.
- **Ghim cột** khi cuộn ngang (Backlog, Fac Confirm): **chỉ khi người dùng chọn**, bằng mục *Ghim cột* ở menu tiêu đề cột (vd ghim Aufnr). Mặc định không ghim gì nên thứ tự cột giữ như cũ. Cột ghim được đưa lên đầu bảng.
- **Tô màu theo hạn**, cùng một quy tắc cho mọi bảng và Backlog Summary:
  - Chưa xong mà ngày xuất là hôm nay hoặc đã qua: **đỏ**.
  - Ngày xuất trong 2 ngày tới: **cam**.
- **Số và ngày** dùng chữ số cùng độ rộng (tabular-nums). Cột số canh phải.

---

## Chi tiết từng chức năng

### 1. Đăng nhập / đăng ký

Đăng nhập bằng **mã nhân viên (MSNV) + mật khẩu**, dùng chung tài khoản S-Patrol.

- Có nút hiện/ẩn mật khẩu và cảnh báo khi đang bật **Caps Lock**.
- **Remember me**: khi bật, phiên được giữ cả sau khi đóng trình duyệt. Khi tắt, phiên mất khi đóng tab.
- Đăng nhập xong vào **Trang chủ** (`/user-home`) với mọi role. Nếu đã đăng nhập sẵn thì trang tự chuyển luôn.
- **Mở link khi chưa đăng nhập** (vd `/backlog?q=4200002732`): trang chuyển sang đăng nhập; đăng nhập xong thì quay lại đúng link đó, giữ nguyên bộ lọc và `#hash`. Nếu tài khoản không có quyền với trang đó thì về trang chủ. Chỉ nhận đường dẫn nội bộ, không chuyển hướng ra site ngoài.
- **Đăng ký**: nhập MSNV và mật khẩu hai lần. Đăng ký xong, trang quay về form đăng nhập với MSNV đã điền sẵn.
- Ảnh nền tự đổi **ngày / đêm** theo giờ máy (6h–17h là ban ngày).

API: `POST /api/production-control/auth/login`, `POST /api/production-control/auth/register`

### 2. Backlog Details

Theo dõi **trạng thái sản xuất, công đoạn hiện tại và tiến độ giao hàng** của từng PO. Màn hình chỉ để xem.

- **Bảng Backlog Summary** (đầu trang): mỗi dòng là một Status, mỗi cột là một ngày xuất. Mỗi ô ghi số PO và số Pcs.
  - Ô **tô đỏ**: PO chưa FINISHED mà ngày xuất đã tới hoặc đã qua. Quy tắc này dùng chung với bảng chi tiết (`theme/statusTones.ts`).
  - Cột **hôm nay** được làm nổi và bảng tự cuộn tới cột đó.
  - Bấm **tên Status** để lọc bảng chi tiết theo Status đó. Bấm **một ô** để lọc theo Status + ngày xuất của ô.
  - Bảng summary thu gọn được.
- **Thanh lọc** (thanh lọc dùng chung):
  - Ô tìm theo sales order / global code / product. Chỉ lọc sau khi ngừng gõ 300 ms.
  - Các dropdown Status, Division, Process, Ship By (có lựa chọn *(Blank)*) và Production Date.
  - Lựa chọn trong dropdown tự thu hẹp theo các bộ lọc khác đang áp dụng.
  - Bên phải có *"Đang lọc: N"* và nút *Xóa bộ lọc*. Nút này xóa cả ô lọc, lọc theo cột và ô Summary đang chọn.
  - Bộ lọc đang bật hiện thành **chip** ở hàng dưới; bấm × để bỏ từng chip.
- **Link chia sẻ**: `/backlog?q=…&status=…&div=…&process=…&shipBy=…&prodD=YYYY-MM-DD`. Ô trống không ghi lên link. Lọc theo cột và ô Summary chưa lên link.
- **Bảng chi tiết**: 43 cột, lọc kiểu Excel từng cột. Phân trang và sắp xếp chạy phía server (20 / 50 / 100 dòng mỗi trang).
  - Thanh công cụ có nút *Mật độ* (gọn / vừa / thoáng) và *Columns* (ẩn / hiện cột).
  - Ghim cột bằng menu tiêu đề cột → *Ghim cột*.
  - Cột **Export Date**: đỏ khi trễ hạn (hôm nay hoặc đã qua), cam khi còn ≤ 2 ngày, áp cho PO chưa FINISHED.
  - Tải lần đầu hiện skeleton. Bảng trống vì bộ lọc thì hiện *"Không tìm thấy kết quả phù hợp"*, kèm mô tả bộ lọc và nút *Xóa bộ lọc*.
- **Export Excel**: xuất đúng các cột đang hiện, theo thứ tự cột, bộ lọc và sắp xếp hiện tại. Có toast tiến trình *"Đang xuất… N%"*, xong thì báo tên file; lỗi thì hiện toast kèm lý do.
- **Refresh**: tải lại bảng và summary. Đầu trang hiện thời điểm cập nhật gần nhất.

API: `POST /api/backlogs/search`, `/summary/status`, `/filter-options`, `/export/excel`

### 3. Delivery Confirm (Fac Confirm)

Xác nhận **thời gian hoàn thành công đoạn Rough / Heat / Fine** của các PO theo ngày xuất hàng.

**Chọn dữ liệu**

- **Division**: PRESS, PRESS Retainer, MOLD, GUIDE.
- **Export Date**: mặc định là hôm nay.
- **Loại hàng**: Tất cả / Sale / Stock.
- **Heat Type**, thay đổi theo Division:
  - PRESS / PRESS Retainer: All / Normal / DC53 / TD
  - GUIDE: All / Normal / Molypden
  - MOLD: chỉ All
- **Ô tìm kiếm**: chỉ lọc sau khi ngừng gõ 300 ms.
- Division và công đoạn đang chọn được ghi nhớ cho lần sau.
- **Xóa bộ lọc** (nút icon nhỏ, chỉ hiện khi đang lọc): xóa ô tìm, loại hàng, Heat Type và lọc theo cột. Division, ngày xuất và công đoạn giữ nguyên.
- **Link chia sẻ**: `/fac-confirm?div=PR&expD=2026-11-19&procGrp=Rough[&classify=Sale][&heat=DC53][&q=…]`.
  - `div`, `expD`, `procGrp` luôn có trên link, nên người nhận mở đúng màn hình, không phụ thuộc Division họ chọn lần trước.
  - Mở link thì Division / công đoạn của link cũng được ghi nhớ như khi chọn tay.

**Thẻ công đoạn Rough / Heat / Fine**: mỗi thẻ cho thấy số PO và Pcs cần xác nhận, số đã xác nhận, % tiến độ và dấu hoàn thành. Bấm vào thẻ để chuyển công đoạn.

**Thống kê N ngày** (panel thu gọn được):

- Chọn công đoạn, đơn vị PO hoặc Pcs, khoảng 7 / 14 / 30 ngày.
- Tính theo Export Date hoặc theo ngày xác nhận.
- Hiện số tổng và ngày còn tồn nhiều nhất. Xem được dạng biểu đồ hoặc bảng.
- Bấm vào một ngày để đặt Export Date của trang về ngày đó.

**Nhập liệu trực tiếp trên bảng**

Mỗi công đoạn chỉ sửa được cột của mình:

| Công đoạn | Cột được nhập |
| --- | --- |
| Rough | To Drill, To Heat |
| Rough (hàng không qua nhiệt luyện) | To Drill, To CLG (To Heat bị khoá) |
| Heat | To CLG |
| Fine | To PK |

- **Nhấp đúp** vào ô để mở bộ chọn ngày giờ (`DD/MM/YYYY HH:mm`). **Delete / Backspace** xoá giá trị.
- **Kéo góc ô** (fill handle) để chép giá trị sang các ô liền kề, theo chiều dọc hoặc ngang.
- Màu ô:
  - Ô nhập được mang màu của công đoạn.
  - Ô chưa lưu có viền đánh dấu.
  - Ô bị khoá có nền sọc. Ô bị khoá khi dữ liệu đã có sẵn từ Backlog.
- **Kiểm tra khi nhập**:
  - Không được chọn thời điểm đã qua.
  - Hàng **DC53**: To CLG phải ≥ Heat Start + 5 ngày.
  - Hàng **TD**: To CLG phải ≥ Heat Start + 2 ngày.
- **Lưu**:
  - *Confirm Changes (n)* lưu toàn bộ, kèm MSNV người xác nhận. *Cancel Changes* huỷ toàn bộ.
  - Lưu xong hiện toast *"Đã lưu N ô"*. Lỗi nhập hoặc lỗi lưu hiện toast cảnh báo / lỗi, các thay đổi chưa lưu vẫn được giữ.
  - **Đã xác nhận thì không hoàn tác.** Muốn bỏ thay đổi thì dùng *Cancel Changes* trước khi lưu. Backend cũng không nhận giá trị rỗng và không có API xoá xác nhận.
  - Nếu đổi công đoạn khi còn thay đổi chưa lưu, trang hỏi: *Lưu ngay / Bỏ thay đổi / Ở lại*.

**Khác**

- Bảng có 18 cột lọc kiểu Excel. Thanh công cụ có nút *Mật độ* (gọn / vừa / thoáng, nhớ theo người dùng) và *Cột*. Ghim cột bằng menu tiêu đề cột.
- **Export Excel** xuất toàn bộ dữ liệu theo bộ lọc, có toast tiến trình / xong / lỗi. **Refresh** tải lại bảng và thống kê.
- Khi tải lỗi, trang có nút *Thử lại* và dữ liệu cũ vẫn giữ trên bảng.
- **Bảng trống**:
  - Đang có bộ lọc: hiện *"Không tìm thấy kết quả phù hợp"*, kèm mô tả bộ lọc và nút *Xóa bộ lọc*.
  - Không có bộ lọc: hiện *"Không có dữ liệu cần xác nhận"*.
  - Cả hai trường hợp có thêm nút **Về hôm nay** khi Export Date khác hôm nay (vd mở link cũ).
- **Hướng dẫn 12 bước** tự mở ở lần đầu vào trang. Mở lại bằng nút `?`.

API: `GET /api/fac-confirm`, `POST /api/fac-confirm/search`, `/process-groups`, `/filter-options`, `/confirmed-processes`, `GET /daily-summary`, `PATCH /process-times`, `POST /export/excel`

### 4. ODBF Summary

Theo dõi **tỷ lệ PO giao đúng hạn / trễ hạn theo nhóm sản phẩm (ProductGrp)** qua từng ngày xuất.

- Có hai ma trận cạnh nhau: **PO COUNT** (đếm theo số PO) và **QUANTITY** (tính theo số lượng).
- Mỗi ProductGrp có 3 dòng: **OK**, **Late**, **Ratio %**. Cột là ngày xuất.
- Hôm nay và 2 ngày tới được làm nổi. Giá trị 0 hiển thị là `-`.
- Cột tên nhóm được cố định khi cuộn ngang.
- Có nút Refresh và thời điểm cập nhật.
- Tải lần đầu hiện skeleton dạng bảng (thay cho spinner). Không có dữ liệu thì hiện cảnh trống kèm nút *Làm mới*; lỗi khi chưa có dữ liệu thì hiện cảnh lỗi kèm *Thử lại*.

API: `GET /api/odbf/summary`

### 5. Shipment Fulfillment

**Heatmap tỷ lệ hoàn thành giao hàng** theo khách hàng, phương thức vận chuyển và ngày xuất.

- **Khoảng ngày** (thanh lọc dùng chung): mặc định từ 6 ngày trước đến 7 ngày tới.
  - Đổi From / To rồi bấm *Apply*. Chọn ngày tự giữ From ≤ To.
  - *Xóa bộ lọc* đưa về 2 tuần mặc định (thay cho nút *14 Days* cũ). "Đang lọc: 1" khi khoảng đang áp dụng khác mặc định.
- **Link chia sẻ**: `/shipping-schedule?from=YYYY-MM-DD&to=YYYY-MM-DD` (khoảng đang áp dụng).
- **Tải / trống**: tải lần đầu hiện skeleton dạng heatmap. Không có dữ liệu thì hiện cảnh trống: đang chọn khoảng khác mặc định thì có *Xóa bộ lọc*, còn lại có *Làm mới*.
- **Mỗi dòng** là một cặp khách hàng + Ship By (badge AIR / SEA / EXPRESS / N/A).
- **Mỗi ô** ghi `%` và `Final / PO`. Rê chuột vào ô để xem PO Qty, Final Qty và Ratio.
- **Màu ô** theo tỷ lệ: từ xanh (≥ 100%) đến đỏ (< 30%).
  - Ô gạch chéo là ngày không có lô xuất.
  - Cuối tuần và hôm nay có nền riêng.
- **Xem chi tiết**: bấm tên khách hàng để xem mọi ngày, bấm một ô để xem đúng ngày đó. Chi tiết mở ra bảng toàn màn hình, cùng bộ cột với Backlog: có nút *Mật độ* và tô màu Export Date theo hạn như Backlog.

API: `GET /api/shipment-fulfillment`, `GET /api/shipment-fulfillment/detail`

### 6. Remain PO Control

Nhúng ứng dụng Remain PO Control (chạy riêng) vào khung trang bằng iframe. Theme sáng/tối hiện tại được truyền sang qua `?theme=light|dark`. Mọi tính năng bên trong do ứng dụng đó quyết định.

### 7. Machine Monitoring – Safety (HSE)

Bản đồ layout xưởng hiện **các máy còn lỗi an toàn (HSE) chưa đóng** và chi tiết từng lỗi. Màn hình chỉ để xem. Hiện chỉ có tab **Safety**; *Downtime* và *Machine Load* đang ghi *Coming soon*.

**Màu trạng thái máy**

| Màu | Ý nghĩa |
| --- | --- |
| Đỏ đậm, viền nhấp nháy | Quá hạn xử lý (chip ghi "Quá hạn N ngày") |
| Đỏ cam | Chưa xử lý |
| Đỏ cam, viền nét đứt | HSE yêu cầu làm lại |
| Vàng | Chờ HSE duyệt |
| Không tô | An toàn |

Nút `?` trên trang mở bảng chú giải màu.

**Bản đồ**

- Chọn tầng / xưởng.
- Kéo để di chuyển. Lăn chuột hoặc chụm 2 ngón để zoom. Có nút *Xem toàn bộ* và *Định vị lại*.
- Nền bản vẽ chỉnh được *Rõ / Mờ / Ẩn*. Có công tắc *Hiện máy đã an toàn*.
- Chọn máy thì bản đồ zoom tới máy và có hiệu ứng định vị.

**Panel bên phải**

- **Ô số Quá hạn / Chưa xử lý / Chờ HSE duyệt / Không gắn máy**: bấm vào ô để lọc theo nhóm đó.
- **Tìm kiếm** theo mã máy hoặc tên nhóm.
- **Danh sách máy** chia theo trạng thái. Mỗi dòng có số lỗi và mức rủi ro I–V. Danh sách và bản đồ liên động hai chiều.
- **Chi tiết lỗi**: rủi ro, ngày phát hiện, người tuần tra, PIC, hạn xử lý, nội dung, đối sách, phần khắc phục của PIC và phần xác nhận của HSE.
- **Ảnh hiện trường**: bấm vào ảnh để phóng to, dùng ← → để chuyển ảnh.
- **Lịch sử đã an toàn**: chọn khoảng *Tháng này / Tháng trước / 3 tháng / Năm nay / Tất cả / tuỳ chọn*.

**Khác**

- Dữ liệu **tự làm mới mỗi 5 phút**; có nút làm mới tay.
- **Chia sẻ link**: link có dạng `?tab=hse&layout=<floor>`, người nhận mở ra đúng tab và đúng tầng.
- **Esc** đóng panel chi tiết.
- **Tải / lỗi**: chưa có bản đồ thì hiện skeleton dạng bản đồ + danh sách (thay cho dòng chữ "Đang tải…"). Lỗi thì hiện cảnh lỗi chung kèm *Thử lại*. Không có tầng nào thì hiện cảnh trống kèm *Làm mới*.

API: `GET /api/machine-locator/floors`, `GET /api/machine-locator/floors/{id}`, `GET /api/machine-monitor/hse`

### 8. Machine Locator

**Tra vị trí máy trên bản vẽ layout nhà máy.** ADMIN dùng thêm được bộ công cụ dựng và chỉnh khung / đường bao từng máy rồi lưu lên server. Dữ liệu ở đây cũng là nền cho bản đồ của Machine Monitoring.

**Mọi người dùng (chỉ xem)**

- Chuyển tab layout.
- **Tìm mã máy**, Enter để chọn. Nếu máy nằm ở layout khác, trang gợi ý mở layout đó.
- **Link trực tiếp tới máy**: `/settings/machine-locator#A-1443` mở trang và chọn sẵn máy. Khi chọn máy, link trên thanh địa chỉ đổi theo để copy chia sẻ.
- **Bật/tắt hiển thị nhóm**: *Từ CAD / Đã sửa / Cần soát*.
- **Tuỳ chọn hiển thị**: *Làm mờ nền*, *Khung theo hình CAD*, *Zoom tới máy khi chọn*.

**ADMIN (chỉnh sửa)**

- **Thêm và vẽ khung**:
  - Thêm máy mới; mã máy dạng `A-1234` hoặc `L-123`.
  - Vẽ / vẽ lại khung. Một máy có thể có nhiều vị trí.
  - Kéo hoặc đổi cỡ khung.
  - Sửa đỉnh đường bao; đỉnh tự hút vào nét bản vẽ.
- **Ôm tự động**: khung tự co sát theo hình máy trên bản vẽ.
  - Kiểu ôm: theo viền kín / sát / gọn / chữ nhật.
  - Chỉnh được độ sát, bịt khe hở, nắn vuông góc, giới hạn trong khung.
  - Phần tính toán chạy nền nên không làm đơ trang.
- **Làm gọn đường bao**: có xem trước trước khi nhận.
- **Ôm hàng loạt** cho các khung chưa có đường bao:
  - Kết quả là bảng *độ tin cậy / độ dời / trạng thái*.
  - Soát lần lượt từng máy: Enter để nhận, S để bỏ qua. Cuối cùng chọn *Lưu kết quả* hoặc *Bỏ kết quả*.
- **Quản lý máy**: *Lưu / Huỷ / Đổi mã / Xoá máy / Về khung tự động / Đúng rồi* (*Đúng rồi* gỡ cờ cần soát). Có lọc *Chỉ hiện máy cần soát*.
- **Xuất / nhập dữ liệu**:
  - Xuất **CSV** (mở được bằng Excel), xuất **JSON**, tải **ảnh layout**.
  - **Nhập JSON** chỉ nhận file do trang này xuất ra. Máy không có trong file sẽ bị xoá; trang hỏi xác nhận trước khi xoá.
- **Chống mất dữ liệu**:
  - Khi đang có thay đổi chưa lưu, trang chặn các thao tác làm mất thay đổi và hỏi lại.
  - Nếu người khác đã sửa cùng layout, trang báo *"Dữ liệu đã bị người khác sửa"*, tải bản mới nhất và giữ phần đang sửa để lưu lại.

**Phím tắt chính** (bấm `?` trong trang để xem đầy đủ)

| Phím | Tác dụng |
| --- | --- |
| `?` | Mở hướng dẫn |
| `Esc` | Huỷ / thoát dần: vẽ → xem trước → chế độ fit → bỏ chọn máy |
| `F` / `Shift+F` | Ôm theo máy / ôm với "giới hạn trong khung" đảo lại |
| `G` | Làm gọn đường bao |
| `Enter` / `Esc` | Nhận / huỷ kết quả ôm hoặc làm gọn |
| Mũi tên / `Shift`+Mũi tên | Dịch khung 0,5 pt / 3 pt |
| Nhấp đúp | Thêm đỉnh |
| `Delete`, `Alt+Click`, chuột phải | Xoá đỉnh |
| `Ctrl` khi kéo đỉnh | Tắt hút / bắt dính |
| `Alt+Click` vào nét nối | Cắt hai máy dính nhau |
| `Alt` / `Shift` khi kéo | Bút loại trừ / bút bổ sung |
| `Alt` khi thả chuột | Không tự ôm lần này |
| `Ctrl+Z` / `Ctrl+Y` | Hoàn tác / làm lại |

API: `GET /api/machine-locator/floors[/{id}]`, `PUT|DELETE …/machines/{code}`, `POST …/machines/{code}/rename|confirm|revert`, `POST …/floors/{id}/bulk`

### 9. User Home

Trang chủ, là trang mặc định của **mọi tài khoản** sau khi đăng nhập.

**Việc của tôi hôm nay**: bảng LED treo giữa bảng lời chào và thẻ nhân viên (màn ≥ 1200px, không lấy thêm chiều cao nên kệ hàng giữ nguyên). Màn hẹp hơn thì thành dải ngang bên dưới. Bấm vào thẻ nào là mở thẳng trang đã lọc sẵn bằng link URL:

| Thẻ | Số liệu | Mở |
| --- | --- | --- |
| Fac Confirm chưa xác nhận (chỉ PC / PRO / ADMIN) | PO cần xác nhận hôm nay chưa xác nhận, theo Division đang dùng ở Fac Confirm, chia theo công đoạn | `/fac-confirm?div=…&expD=hôm nay&procGrp=<công đoạn còn nhiều nhất>` |
| Khung Cost đang vượt | Số khung tháng này có `forecast.status = OVER`, kèm số khung dự báo vượt. Tháng này chưa có số thì lấy tháng mới nhất | `/cost-monitoring` |
| Máy đang cảnh báo an toàn | Máy / nhóm lỗi HSE chưa đóng trên mọi tầng, kèm số quá hạn | `/monitoring/machine?tab=hse&layout=<tầng nhiều nhất>` |

- Số > 0 sáng đỏ, = 0 sáng xanh. Lỗi tải thì hiện `--`, bấm vẫn mở trang.
- Số liệu được cache theo phiên và tải lại ngầm sau 2 phút.

**Phần còn lại**

- Lời chào kèm 4 thẻ thông tin: Employee ID, Department, Section, Role.
- **Hoạt cảnh nhà máy** gồm 4 cảnh: Production Line, Dev Team, Inspection, Packing.
  - Cảnh tự đổi sau mỗi 15 giây. Rê chuột vào để dừng; bấm các chấm để chọn cảnh.
  - Màu đổi theo chế độ sáng/tối. Hoạt cảnh đứng yên nếu máy bật chế độ giảm chuyển động.

### 10. PC Training

Tài liệu **đào tạo nhập môn cho nhân viên PC**. Trang đang ẩn khỏi menu nhưng vẫn mở được bằng URL.

- Thanh điều hướng theo mục: Overview, Flow, Systems, Roadmap, Modules, Terms, Notes.
- Tra cứu thuật ngữ.
- 8 module:
  1. Thuật ngữ & hệ thống
  2. Tool hỗ trợ PC
  3. Upload đơn hàng
  4. Issue đơn sản xuất
  5. Export List
  6. Tách/bù đơn & xử lý kho
  7. Agreement
  8. Đăng ký / revise Master
- Nội dung nằm sẵn trong `src/data/training/`, không gọi API.

### 11. Cost Monitoring

Theo dõi chi phí theo khung (xưởng × hạng mục OT / T&SL / RM) trong tháng: thực tế so với mục tiêu, kèm dự báo cuối tháng. Mục này chỉ ghi phần liên quan tới các đợt cải thiện UI; chi tiết chức năng xem hướng dẫn trong trang (nút `?`).

- **Nạp Actual OT** (ADMIN): nạp xong hiện toast *"Đã nạp N dòng OT"*, thay cho Snackbar riêng trước đây.
- **Xuất CSV giao dịch** trong drawer chi tiết khung: toast tiến trình theo số trang đã tải, xong / lỗi đều báo bằng toast.
- Trang chủ có thẻ **"Khung Cost đang vượt"** đếm số khung `OVER` của tháng này. Bấm thẻ mở trang này.
- Chưa có bộ lọc trên URL.

API: `GET /api/cost-monitoring/months`, `/chart`, `/pl-weeks`, `/detail`, `/ot/…`

### 12. AI Logs

Nhật ký các câu hỏi gửi trợ lý AI (chỉ ADMIN): thống kê, bảng log, chi tiết từng request, bộ test, phòng thay đồ của mascot, sơ đồ luồng AI.

- **Thanh lọc** (thanh lọc dùng chung, nằm trong header): Từ ngày → Đến ngày (tối đa 92 ngày), User, Tìm kiếm, Trạng thái, Nguồn, Chậm hơn (giây).
  - Ô ngày đã đổi từ DatePicker sang ô ngày chung như các trang khác.
  - *Xóa bộ lọc* thay cho *Đặt lại* và vẫn giữ tab màn hình đang chọn.
- **Link chia sẻ**: `/settings/ai-logs?from=…&to=…[&user=…][&q=…][&ok=true|false][&source=all|eval][&slower=N][&screen=…]`.
  - Nguồn mặc định là `chat` nên không ghi lên link. "Tất cả nguồn" ghi là `source=all`.
  - Khoảng ngày sai trên link thì về 7 ngày gần nhất.
- **Export Excel**: toast tiến trình / xong / lỗi (thay cho Snackbar lỗi riêng).
- Bảng trống vì bộ lọc thì hiện *"Không tìm thấy kết quả phù hợp"* kèm *Xóa bộ lọc*.
- Mở tab Bộ test / Phòng thay đồ / Luồng AI lần đầu thì hiện skeleton thay cho spinner. Thông báo trong 2 tab này dùng toast chung.

API: `GET /api/admin/assistant-logs`, `/stats`, `/{rid}`, `/export`

### 13. Utility · EVN Compare

So sánh số GM (đồng hồ tổng EVN) với số đồng hồ thực tế theo ngày, gồm điện năng (MWh / kWh) và tiền (kUSD), theo tháng (chỉ ADMIN). Có tab *Import Excel* để nạp số GM. Mục này chỉ ghi phần liên quan tới các đợt cải thiện UI.

- **Link chia sẻ**: `/utility-evn-compare?month=YYYY-MM&scope=KVH&unit=MWh&view=overview[&tab=import]`. Tháng, phạm vi, đơn vị và chế độ xem luôn có trên link.
- Đổi sang tab *Import Excel* (`tab=import`) không còn xóa các tham số khác trên link.
- Phạm vi / đơn vị / chế độ xem vẫn được ghi nhớ trên máy như trước. Link mở từ ngoài sẽ ghi đè các giá trị này.

---

## Công nghệ

| Thành phần | Phiên bản |
| --- | --- |
| React + React Compiler | 19 |
| TypeScript | 6 |
| Vite (Rolldown) | 8 |
| MUI Material / X Data Grid / X Date Pickers | 9 |
| React Router | 7 |
| dayjs | 1.11 |
| Lint | oxlint |

Yêu cầu: Node.js 22+ (đang dùng 22.20), npm 10+.

## Bắt đầu

```bash
npm install
cp .env.example .env.development.local   # sửa URL backend nếu cần
npm run dev                              # http://localhost:5173
```

| Lệnh | Mô tả |
| --- | --- |
| `npm run dev` | Dev server có HMR |
| `npm run build` | Type-check (`tsc -b`) rồi build ra `dist/` |
| `npm run preview` | Chạy thử bản build |
| `npm run lint` | oxlint |

## Cấu hình môi trường

Biến được đọc tại [src/config/api.ts](src/config/api.ts) và khai báo kiểu ở [src/vite-env.d.ts](src/vite-env.d.ts).

| Biến | Ý nghĩa | Mặc định khi không đặt |
| --- | --- | --- |
| `VITE_API_BASE_URL` | URL gốc của backend `backlog-be` | IP nội bộ trong `src/config/api.ts` |
| `VITE_HSE_IMAGE_BASE_URL` | Thư mục ảnh HSE (url = base + tên file) | IP nội bộ trong `src/config/api.ts` |

- `.env` được commit, dùng chung cho mọi môi trường.
- `.env.*.local` không commit, dùng để ghi đè trên máy cá nhân.
- Biến `VITE_*` được nhúng vào bundle phía trình duyệt, **không đặt secret vào đây**.

URL của Remain PO Control đang hard-code trong [src/pages/RemainPoControlPage.tsx](src/pages/RemainPoControlPage.tsx).

## Đăng nhập & phân quyền

- **Phiên đăng nhập** lưu ở `localStorage` khi chọn "ghi nhớ", ngược lại lưu ở `sessionStorage`. Key là `production_control_auth`. Xem [src/services/authService.ts](src/services/authService.ts).
- **Quay lại link sau khi đăng nhập**: `ProtectedRoute` gửi kèm link đầy đủ (`pathname + search + hash`) sang `/login`. `LoginPage` chỉ nhận đường dẫn nội bộ bắt đầu bằng `/` (chặn `//…`, URL ngoài và chính `/login`). Không có link thì về `/user-home`.
- **Role**: `ADMIN` (toàn quyền), `PC`, `PRO`, `USER`. Backend tính lại role từ dữ liệu HR mỗi lần đăng nhập.
- **Chặn route** ở frontend bằng [ProtectedRoute](src/components/auth/ProtectedRoute.tsx) và [RoleRoute](src/components/auth/RoleRoute.tsx).
- **Ẩn/hiện menu** theo `roles` khai báo trong [sidebarConfig.tsx](src/components/layout/sidebarConfig.tsx).

> Phân quyền ở frontend chỉ để điều hướng giao diện. Mọi kiểm tra quyền thật phải nằm ở backend.

## Cấu trúc thư mục

```
src/
  pages/            Mỗi route một file *Page.tsx
  components/       UI theo tính năng (backlog, facConfirm, machineLocator, machineMonitor, shipment, odbf, training, userHome...)
    common/         Thành phần dùng chung: PageShell, PageHeader,
                    dataGrid/ (Data Grid có lọc kiểu Excel, ghim cột: gridPinContext),
                    headerActions/ (nút header), loadState/ (skeleton, tải/trống/lỗi, "không tìm thấy"),
                    notify/ (toast + notifyExport), filterBar/ (thanh bộ lọc + ô lọc)
    userHome/       Trang chủ; todayTasks/ = bảng "Việc của tôi hôm nay"
    layout/         MainLayout, LeftSidebar, cấu hình menu
    auth/           Form đăng nhập/đăng ký, guard route
  services/         Gọi API (fetch), mỗi tính năng một file
  hooks/            Hook tải dữ liệu & trạng thái (useBacklogData, useFacConfirmData, useMachineLocator...)
                    + dùng chung: useUrlFilters (bộ lọc ⇄ URL), useGridPreferences (cấu hình bảng,
                    mật độ, ghim cột), useDelayedFlag (trễ 300 ms), useDebouncedField (debounce ô nhập)
  config/           URL API, cấu hình bộ lọc, quy tắc sửa ô Fac Confirm
  types/            Kiểu dữ liệu theo tính năng
  utils/            Hàm thuần: map API, lọc, hình học & fit khung máy (chạy trong Web Worker),
                    download.ts (tải file kèm tiến trình), uiPreferences.ts (lưu cài đặt trên máy)
  theme/            Theme MUI sáng/tối, token UI, statusTones.ts (màu theo hạn dùng chung)
  data/             Dữ liệu tĩnh: nội dung đào tạo, dữ liệu gốc Machine Locator (dùng cho script)
public/assets/machine-locator/   Ảnh layout nhà máy
scripts/machine-locator/         Script Python/Node xử lý bản vẽ layout
docs/                            Tài liệu, bản mẫu HTML, slide đào tạo
```

Quy ước:

- Gọi API đặt trong `services/`; component không gọi `fetch` trực tiếp.
- Bảng dữ liệu dùng [ReusableDataGrid](src/components/common/dataGrid/ReusableDataGrid.tsx) để có lọc cột kiểu Excel và lưu cấu hình cột.
- Chế độ sáng/tối giữ ở `App.tsx`, truyền xuống từng trang qua prop `mode` / `onToggleMode`.
- Nút trên header dùng `<HeaderAction kind="…" />` ([headerActionRegistry.tsx](src/components/common/headerActions/headerActionRegistry.tsx)). Trang chỉ chọn `kind`, không tự chọn icon hay chữ.
- **Tải / trống / lỗi** dùng [loadState/](src/components/common/loadState/), không tự viết spinner hay dòng "Đang tải…":
  - `<AsyncContent loading error hasData onRetry onClearFilters skeleton="table|heatmap|charts|kpi|map|block">` tự chọn giữa nội dung, skeleton, cảnh lỗi và cảnh trống.
  - Cần skeleton riêng lẻ thì dùng `<PageSkeleton variant="…" />`. Đã có sẵn độ trễ 300 ms (`useDelayedFlag`, `LOADING_DELAY_MS`).
  - Cảnh trống / lỗi vẽ bằng `FactoryNoRowsOverlay`. Nút mặc định của cảnh trống là `EmptyStateAction`.
  - Trống **vì bộ lọc** dùng `FilteredEmptyState` (nhận `summary`, `onClearFilters`, `extraAction`). Với `AsyncContent`, chỉ truyền `onClearFilters` / `filterSummary` khi đang có bộ lọc.
- **Phản hồi sau thao tác** dùng [notify/](src/components/common/notify/), không tự đặt `Snackbar` / `Alert` riêng trong trang:
  - `notify.success | error | warning | info(message, { detail?, action?, undo?, duration?, key? })` gọi được từ mọi nơi, cả ngoài component.
  - `key` giống nhau thì toast mới thay toast cũ thay vì chồng lên (vd lỗi nhập liên tiếp).
  - Xuất file: bọc bằng `notifyExport((onProgress) => exportXxx(..., onProgress))`. Hàm này tự hiện tiến trình / xong / lỗi và không bao giờ throw.
  - `<NotifyHost />` đã gắn một lần trong `App.tsx`.
- **Thanh bộ lọc** dùng [filterBar/](src/components/common/filterBar/), không tự dựng TextField / Select riêng:
  - `<FilterBar activeCount onClear trailing? footer? variant="panel|plain" compact?>` bọc các ô lọc. Nhóm bên phải được đẩy bằng `margin-left: auto`; không dùng khoảng trống co giãn vì nó chiếm chỗ của ô lọc co giãn.
  - `compact` dành cho thanh đã chật (Fac Confirm): giữ 1 hàng, không lọc thì không hiện gì, có lọc thì chỉ hiện 1 nút icon kèm số bộ lọc.
  - Ô lọc: `FilterSearch` / `FilterText` (có `debounceMs`), `FilterSelect` (`allOption` thêm mục *Tất cả*), `FilterDate`, `FilterDateRange` (tự giữ from ≤ to, `maxDays`). Truyền `tour` để gắn `data-tour` cho hướng dẫn.
- **Bảng DataGrid**: `useGridPreferences(key, pageSize, { defaultPinned? })` trả về cả `density` / `setDensity` (nhớ theo người dùng) và `pinnedColumns` / `togglePinnedColumn`. Truyền vào `ReusableDataGrid` qua `density`, `onDensityChange`, `pinnedColumns`, `onTogglePinnedColumn`.
  - Hiện chưa bảng nào ghim sẵn (giữ giao diện cũ). Nếu dùng `defaultPinned` thì phải là hằng số ngoài component.
  - Bảng muốn có mục *Ghim cột* phải dùng `ExcelColumnMenu`, vì mục này đọc `GridPinContext`.
  - Ghim cột tự làm bằng `position: sticky`, vì bản Community không có. Khi có cột ghim, bảng đặt `columnBufferPx` lớn để cột ghim luôn được vẽ.
  - Tô màu hạn: `deadlineCellClass(date, done)` / `deadlineTone(...)` trong [theme/statusTones.ts](src/theme/statusTones.ts). Không tự chọn màu đỏ / cam riêng.
- **Bộ lọc ⇄ URL** dùng [useUrlFilters](src/hooks/useUrlFilters.ts):
  - Khai báo tham số bằng `urlParam.text | oneOf | date | month | list | positiveNumber`. Có `empty` thì bằng giá trị đó sẽ không ghi lên URL; không có `empty` thì luôn ghi.
  - Khởi tạo state bằng `readUrlParams(path, params)`, rồi gọi `useUrlFilters({ path, params, values, onUrlChange })`.
  - State của trang vẫn là nguồn chính (trang được giữ sống khi chuyển trang). URL chỉ phản chiếu state (replace, không thêm lịch sử).
  - Link từ ngoài có tham số thì `onUrlChange` áp bộ lọc của link. Quay lại trang bằng sidebar (URL trống) thì giữ bộ lọc đang có và ghi lại lên URL.
  - Tham số không khai báo trên URL được giữ nguyên. Code khác muốn đổi URL của trang thì phải giữ các tham số đang có (xem `changeSection` ở trang EVN).
- **Tải file từ server** dùng [utils/download.ts](src/utils/download.ts): `readBlobWithProgress` (đọc kèm tiến trình theo `Content-Length`), `fileNameFromDisposition`, `saveBlob`. Service export nhận tham số `onProgress` và trả về tên file.
- **Giữ giao diện hiện tại**: thay đổi UI mặc định phải trông như cũ; tính năng mới chỉ thêm vào hoặc để người dùng tự bật (vd ghim cột, thanh lọc gọn ở Fac Confirm).
- Comment viết tiếng Việt.

## Script Machine Locator

Các script này chuẩn bị layout từ bản vẽ PDF. Chạy từ thư mục gốc repo:

```bash
pip install pymupdf numpy opencv-python scipy

# Render PDF thành PNG + JSON {crop, page, ppp, m}
python scripts/machine-locator/prepare_layout.py --pdf <file.pdf> --image public/assets/machine-locator/<id>.png --json src/data/machineLocator/<id>.json

# Dựng lại khung máy từ bản vẽ (mode label | snap)
python scripts/machine-locator/generate_machine_boxes.py --mode snap --pdf <file.pdf> --current src/data/machineLocator/<id>.json

# Ôm khung sát hình máy theo ảnh layout
python scripts/machine-locator/fit_frames.py <layout.png> <in.json> <out.json> [--all]

# Gộp kết quả soát khung (CSV) vào JSON
node scripts/machine-locator/merge-review.mjs [json] [csv]
```

Đặt file PDF đầu vào ở `scripts/machine-locator/input/` (thư mục này đã được gitignore). Giải thích từng tham số nằm ở docstring đầu mỗi script.

## Build & triển khai

```bash
npm run build      # kết quả ở dist/
```

`dist/` là site tĩnh. App dùng `BrowserRouter`, nên web server phải trả `index.html` cho mọi đường dẫn không phải file tĩnh (SPA fallback). Nếu không, bấm F5 ở route con sẽ ra lỗi 404.

## Lịch sử thay đổi

### Tổng quan kế hoạch cải thiện UI

| Đợt | Commit | Đề xuất | Nội dung chính |
| --- | --- | --- | --- |
| 1 | `4712d8e` | 1 + 3 | Trạng thái tải / trống / lỗi dùng chung (skeleton, cảnh lỗi + Thử lại, cảnh trống luôn có nút). Toast dùng chung, xuất file có tiến trình. Fac Confirm báo "Đã lưu N ô", không hoàn tác. |
| 2 | `72f167f` | 2 | Thanh bộ lọc dùng chung ("Đang lọc: N", Xóa bộ lọc). Bộ lọc trên URL ở 5 trang. Đăng nhập xong quay lại đúng link. Xử lý link cũ / link sai. |
| 3 | `f15b72c` | 4 + 5 | Mật độ dòng nhớ theo người dùng, ghim cột (tự bật), tô màu hạn thống nhất, chữ số đều. Trang chủ "Việc của tôi hôm nay". Sửa thanh lọc Fac Confirm về bố cục cũ. |
| — | — | 6 – 10 | Chưa làm: dark mode / độ tương phản, phím tắt, design token, đo hiệu năng (web-vitals), việc tồn (API "tháng mới nhất" của Cost, Machine Monitor tải lại sơ đồ). |

Nguyên tắc chung của cả 3 đợt: **mặc định giao diện như cũ**, phần mới chỉ thêm vào hoặc để người dùng tự bật.

### 2026-11-19 — Nâng cấp bảng dữ liệu và "Việc của tôi hôm nay"

Đợt 3 trong kế hoạch cải thiện UI (đề xuất 4 và 5).

#### Bảng dữ liệu (đề xuất 4)

| Nội dung | File |
| --- | --- |
| Mật độ dòng gọn / vừa / thoáng, nhớ theo người đăng nhập (`grid-density:<MSNV>:<bảng>`) | `uiPreferences.ts`, `useGridPreferences.ts`, toolbar của Backlog / Fac Confirm / Shipment |
| Ghim cột bằng CSS sticky, chỉ khi người dùng chọn ở menu cột (mặc định không ghim, giữ nguyên giao diện cũ) | `ReusableDataGrid.tsx`, `gridPinContext.ts`, `ExcelColumnMenu.tsx`, `dataGridHeaderStyles.ts` |
| Tô màu hạn thống nhất (đỏ trễ hạn, cam ≤ 2 ngày): cột Export Date của Backlog / Shipment, Backlog Summary dùng cùng hàm | [theme/statusTones.ts](src/theme/statusTones.ts), `backlogColumns.tsx`, `BacklogSummaryCell.tsx` |
| Chữ số cùng độ rộng cho mọi ô của bảng | `dataGridHeaderStyles.ts` |

#### Trang chủ (đề xuất 5)

- Thêm bảng **Việc của tôi hôm nay** (`components/userHome/todayTasks/`) với 3 thẻ: Fac Confirm, Cost, Máy cảnh báo. Bấm vào là mở trang đã lọc sẵn (dùng link URL của Đợt 2).
- Vị trí: màn ≥ 1200px treo giữa bảng LED và thẻ nhân viên, không lấy chiều cao của kệ hàng. Màn hẹp hơn thành dải ngang bên dưới.
- Số liệu lấy từ API có sẵn: `/fac-confirm/process-groups`, `/cost-monitoring/chart` (`/months` khi tháng này chưa có số), `/machine-locator/floors` + `/machine-monitor/hse` từng tầng.

#### Sửa giao diện sau khi kiểm tra

- **Thanh lọc Fac Confirm bị chật**, dải thẻ Rough / Heat / Fine bị cắt (lỗi từ Đợt 2):
  - Bỏ khoảng trống co giãn trong `FilterBar`, nhóm bên phải đẩy bằng `margin-left: auto`.
  - Thêm chế độ `compact` cho Fac Confirm: giữ 1 hàng, không lọc thì không hiện nút, có lọc thì chỉ 1 nút icon kèm số.
  - Ô tìm được co lại như trước (tối thiểu 140px).
- **Ghim cột đổi sang tự bật**: lúc đầu ghim sẵn Aufnr và đưa lên đầu bảng, làm đổi thứ tự cột quen thuộc. Giờ mặc định không ghim gì.

#### Chưa làm / còn lại

- Ghim cột chưa áp cho các bảng không dùng `ReusableDataGrid` (EVN, ODBF, AI Logs) và bảng chi tiết Shipment (dùng menu cột mặc định).
- Cost Monitoring chưa có bộ lọc trên URL, nên thẻ Cost chỉ mở trang (tháng mặc định).
- Đề xuất 6–10: dark mode / độ tương phản, phím tắt, design token, đo hiệu năng, việc tồn (API "tháng mới nhất" của Cost, Machine Monitor tải lại sơ đồ).

### 2026-11-19 — Thanh bộ lọc dùng chung và bộ lọc trên URL

Đợt 2 trong kế hoạch cải thiện UI (đề xuất 2). Cách dùng xem ở mục [Quy ước](#cấu-trúc-thư-mục).

#### Thêm mới

| File | Nội dung |
| --- | --- |
| [components/common/filterBar/](src/components/common/filterBar/) | `FilterBar` (khung + "Đang lọc: N" + *Xóa bộ lọc*), `FilterSearch`, `FilterText`, `FilterSelect`, `FilterDate`, `FilterDateRange` |
| [hooks/useUrlFilters.ts](src/hooks/useUrlFilters.ts) | Đồng bộ bộ lọc ⇄ URL (`readUrlParams`, `useUrlFilters`, `urlParam.*`) |
| [hooks/useDebouncedField.ts](src/hooks/useDebouncedField.ts) | Ô nhập chỉ đẩy giá trị lên sau khi ngừng gõ (tách từ AI Logs) |
| [facConfirm/facConfirmFilters.ts](src/components/facConfirm/facConfirmFilters.ts) | Division, Heat Type theo Division, tham số URL của Fac Confirm |

#### Thay đổi theo trang

| Trang | Tham số URL | Thay đổi khác |
| --- | --- | --- |
| Fac Confirm | `div`, `expD`, `procGrp`, `classify`, `heat`, `q` | Thêm "Đang lọc" + *Xóa bộ lọc* (xóa tìm, loại hàng, Heat Type, lọc cột; giữ Division / ngày / công đoạn). Đợt 3 đổi sang kiểu gọn (nút icon) để giữ bố cục cũ |
| Backlog | `q`, `status`, `div`, `process`, `shipBy`, `prodD` | Ô tìm có debounce 300 ms (trước đây mỗi phím gõ gọi API một lần); bỏ nút *Clear all* trùng ở hàng chip |
| Shipment | `from`, `to` (khoảng đang áp dụng) | Nút *14 Days* thay bằng *Xóa bộ lọc* (về 2 tuần mặc định); chọn ngày tự giữ from ≤ to |
| AI Logs | `from`, `to`, `user`, `q`, `ok`, `source`, `slower`, `screen` | Ô ngày đổi từ DatePicker sang ô ngày chung; *Đặt lại* thành *Xóa bộ lọc* (vẫn giữ tab màn hình) |
| EVN | `month`, `scope`, `unit`, `view` (cùng `tab` đã có) | Đổi tab Import không còn xóa các tham số khác |
| Đăng nhập | — | Mở link khi chưa đăng nhập: đăng nhập xong quay lại đúng link (trước đây chỉ giữ pathname và luôn về trang chủ) — `ProtectedRoute`, `LoginPage` |
| Backlog, Fac Confirm, Shipment, AI Logs | — | Link cũ không còn dữ liệu: cảnh *"Không tìm thấy kết quả phù hợp"* + mô tả bộ lọc + *Xóa bộ lọc* (Fac Confirm thêm *Về hôm nay*). Tham số sai trên link: bỏ qua + toast cảnh báo. Thêm `FilteredEmptyState`, `EmptyStateAction` tách file riêng |

#### Chưa làm / còn lại

- Lọc theo cột kiểu Excel và ô Summary (Backlog) chưa lên URL vì dữ liệu dài và phức tạp.
- Đợt tiếp theo: đề xuất 4 (DataGrid: mật độ dòng, ghim cột mã, tô màu thống nhất) và đề xuất 5 (Trang chủ "Việc của tôi hôm nay", thẻ bấm vào đi thẳng tới trang đã lọc sẵn bằng link URL ở trên).

### 2026-11-19 — Thống nhất trạng thái tải / trống / lỗi và thông báo

Đợt 1 trong kế hoạch cải thiện UI (đề xuất 1 + 3). Cách dùng xem ở mục [Quy ước](#cấu-trúc-thư-mục).

#### Thêm mới

| File | Nội dung |
| --- | --- |
| [components/common/loadState/](src/components/common/loadState/) | `PageSkeleton` (skeleton theo hình nội dung), `AsyncContent` (chọn nội dung / skeleton / lỗi / trống), `EmptyStateAction` (nút *Xóa bộ lọc* / *Làm mới*) |
| [components/common/notify/](src/components/common/notify/) | `notify.*` (store toast), `NotifyHost` (hiển thị toast), `notifyExport` (toast tiến trình xuất file) |
| [hooks/useDelayedFlag.ts](src/hooks/useDelayedFlag.ts) | Chỉ bật cờ khi trạng thái kéo dài quá 300 ms |
| [utils/download.ts](src/utils/download.ts) | Đọc file tải về kèm tiến trình, lấy tên file từ `Content-Disposition`, lưu file |

#### Thay đổi theo trang

| Trang | Trước | Sau |
| --- | --- | --- |
| Shipment | Spinner; không có trạng thái trống | Skeleton heatmap; cảnh trống có *Xóa bộ lọc* (về 2 tuần mặc định) / *Làm mới* |
| ODBF | Spinner trong từng ma trận | Skeleton bảng; cảnh trống có *Làm mới* |
| Machine Monitor | Dòng chữ "Đang tải…" | Skeleton bản đồ + danh sách; cảnh lỗi chung kèm *Thử lại* |
| AI Logs | Spinner khi mở tab; Snackbar lỗi xuất file | Skeleton; toast tiến trình xuất Excel |
| Backlog, Fac Confirm | Lỗi xuất Excel chỉ ghi ra console | Toast tiến trình / xong / lỗi |
| Fac Confirm | `FacConfirmEditErrorSnackbar` riêng (đã xoá) | Toast cảnh báo / lỗi; lưu xong báo *"Đã lưu N ô"*, **không có Hoàn tác** |
| Cost Monitoring | Snackbar nạp OT; Alert lỗi xuất CSV giao dịch | Toast; xuất CSV có tiến trình theo số trang đã tải |
| AI Logs › Phòng thay đồ, Bộ test | Snackbar riêng | Toast |

#### Service

- `exportBacklogExcel`, `exportFacConfirmExcel`, `exportAiLogsExcel` và `exportCostTransactionsExcel` nhận thêm `onProgress` và trả về tên file. Phần tải file trùng lặp được gom về `utils/download.ts`.
- Sửa kiểu `FacConfirmProcessTimeResponse` cho khớp response thật của backend: `{ updated, clientIp, machineName }`.

#### Chưa làm / còn lại

- Skeleton có sẵn ở Cost Monitoring và EVN chưa áp độ trễ 300 ms.
- Giữ nguyên Snackbar gợi ý chất lượng đồ hoạ (User Home) và thanh thông báo của Machine Locator, vì đó không phải phản hồi lưu / nhập / xuất.
- Đợt tiếp theo: `FilterBar` dùng chung và lưu bộ lọc lên URL (đề xuất 2).
