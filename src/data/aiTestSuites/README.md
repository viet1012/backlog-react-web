# Bộ test trợ lý AI (tab AI Logs → Bộ test)

Mỗi file JSON trong thư mục này = 1 **bộ test**, hiện thành 1 tab con trong tab màn hình tương ứng.

```
src/data/aiTestSuites/
  cost-monitoring/          ← tên thư mục = screenKey (khớp ASSISTANT_SCREENS)
    ai-test-cases-extra.json
    <bộ khác>.json
  <screenKey khác>/
    ....json
```

## Thêm bộ test mới

1. Chép file JSON (định dạng "Xuất JSON" của tab Bộ test) vào thư mục của màn hình.
2. Chạy lại / build lại web. Lần mở tab Bộ test kế tiếp, các câu **chưa từng nạp** (theo `id`)
   được tự thêm vào và có tab riêng; câu người dùng đã xóa không bị thêm lại
   (dùng menu "Thêm câu mặc định còn thiếu" nếu muốn lấy lại).

## Định dạng

```json
{
  "version": 1,
  "title": "Mở rộng (lượt 4)",   // tùy chọn – tên tab; thiếu thì dùng tên file
  "order": 20,                    // tùy chọn – thứ tự tab (nhỏ trước); thiếu thì theo tên file
  "cases": [
    {
      "id": "ext-01",             // BẮT BUỘC, duy nhất trên toàn bộ các file
      "group": "11. Một ngày cụ thể",
      "question": "Hôm kia MOLD RM chi bao nhiêu?",
      "expected": "…",
      "drawer": null,             // { "div": "PR" | "MO" | "Guide", "cost": "T&SL" | "RM" | "OT" } – chỉ Cost Monitoring
      "maxSec": 3                 // null = không giới hạn
    }
  ]
}
```

- `screenKey` của từng câu lấy theo tên thư mục (câu có `screenKey` riêng thì giữ).
- Trường `exportedAt`, `runs` (nếu có) bị bỏ qua.
- `id` trùng với file khác → câu sau bị bỏ (có cảnh báo trong console).
- Bộ "Cơ bản" (seed-01 … seed-52) nằm trong `src/components/aiLogs/aiTestDefaults.ts`.
