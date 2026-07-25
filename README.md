# Báo Cáo Tổng Quan Dự Án: Multi-Format Workspace & Smart Debt Notepad

---

## 🎯 1. TỔNG QUAN DỰ ÁN & MỤC TIÊU CỐT LÕI

**Tên dự án:** Multi-Format Workspace & Auto-Clear Debt Notepad  
*(Ứng dụng Sổ Tay Đa Định Dạng & Sổ Nợ Thông Minh Tự Động Gạch Tên)*

### Mục tiêu chính:
1. **Ứng dụng Ghi Chú Đa Định Dạng (6-in-1 Workspace):** Đáp ứng mọi nhu cầu làm việc, soạn thảo tài liệu, quản lý bảng tính, lên lịch trình chuyến đi, quản lý công việc dạng thẻ Kanban và danh sách tích chọn.
2. **Sổ Nợ Thông Minh Tự Động Gạch Tên (Smart Debt Ledger):** Giải quyết triệt để nỗi đau chia tiền đi chơi nhóm, tự động tạo mã VietQR động, gửi 1 link duy nhất vào Zalo nhóm và **tự động đọc thông báo/tin nhắn ngân hàng để xóa nợ tức thì**.
3. **0 ĐỒNG CHI PHÍ VẬN HÀNH (Zero Server Cost):** Toàn bộ ứng dụng hoạt động 100% Client-side, không tốn bất kỳ chi phí thuê Server, Database hay Hosting nào vĩnh viễn.

---

## 🛠️ 2. BÀI TOÁN CHI PHÍ 0 ĐỒNG (ZERO-COST ARCHITECTURE)

| Hạng mục kỹ thuật | Giải pháp truyền thống (Tốn phí) | Giải pháp Kiến trúc của Dự án này | Chi phí |
| :--- | :--- | :--- | :--- |
| **Server Backend & DB** | VPS / AWS / Cloud DB (*200k - 500k/tháng*) | **Local-First (IndexedDB / LocalStorage):** Dữ liệu lưu 100% trên thiết bị cá nhân, tốc độ 0ms, bảo mật tuyệt đối. | **0đ** |
| **Cổng Thanh Toán QR** | VNPay / Momo (*Phí ĐK + 1-2% hoa hồng*) | **VietQR Open Link API (Napas247):** Sinh ảnh QR tự động điền sẵn STK, Số tiền & Nội dung mã nợ. | **0đ** |
| **Đọc Tin Nhắn Tự Xóa Nợ** | Thuê Webhook ngân hàng (*100k - 200k/tháng*) | **Local Notification Engine:** Đọc thông báo ứng dụng ngân hàng trực tiếp trên chip điện thoại Android. | **0đ** |
| **Đường Link Trả Nợ Nhóm** | Thuê Database Cloud lưu thông tin | **URL-Hash Data Encoding:** Nén danh sách nợ trực tiếp vào đường link URL, không cần Database Server. | **0đ** |
| **Hosting & Tên Miền** | Hosting / Domain (*500k - 1tr/năm*) | **Vercel / GitHub Pages:** Hosting web miễn phí vĩnh viễn kèm HTTPS SSL. | **0đ** |
| **Tải & Cài Đặt App** | Phí chợ App Store ($99/năm) & Google Play ($25) | **PWA (Progressive Web App):** Nhấp *"Thêm vào màn hình chính"* là sử dụng như App Native thật. | **0đ** |
| **TỔNG CHI PHÍ DUY TRÌ** | **~ 5.000.000đ - 8.000.000đ / NĂM** | **DÙNG VĨNH VIỄN KHÔNG TỐN CHI PHÍ** | **0Đ** |

---

## 🎨 3. 6 ĐỊNH DẠNG GHI CHÚ (6-IN-1 NOTE FORMATS)

```
┌────────────────────────────────────────────────────────────────────────┐
│                   MULTI-FORMAT WORKSPACE ENGINE                        │
├──────────────┬──────────────┬──────────────┬─────────────┬─────────────┤
│ 💸 Debt      │ 📄 Document  │ 📊 Table     │ 📅 Schedule │ 📋 Kanban   │
│    Ledger    │    Editor    │    Grid      │    Timeline │    Board    │
└──────────────┴──────────────┴──────────────┴─────────────┴─────────────┘
```

1. **💸 Debt Ledger & Auto-Clear VietQR (Sổ Nợ Thông Minh):** Quản lý người nợ, tạo mã VietQR động, giả lập/đọc SMS ngân hàng tự động gạch tên, tạo link trả nợ nhóm.
2. **📄 Document View (Tài liệu / Rich Text):** Trình soạn thảo văn bản phong phú (Headings, Bold/Italic, Màu sắc, Highlight, Code blocks, Callouts, Chèn ảnh).
3. **📊 Table / Grid View (Bảng tính):** Quản lý dữ liệu dạng hàng x cột, thêm/xóa cột, tính tổng số liệu (như Excel/Notion Table).
4. **📅 Schedule & Timeline View (Lịch trình / Thời khóa biểu):** Quản lý mốc thời gian sự kiện theo giờ hoặc ngày (dành cho chuyến đi chơi, lịch học).
5. **📋 Kanban Board View (Bảng thẻ công việc):** Quản lý công việc trực quan 3 cột *(To-Do / In Progress / Done)* với khả năng kéo thả.
6. **☑️ Checklist & Progress View (Danh sách tích chọn):** Danh sách việc cần làm tự động tính thanh **% Tiến độ hoàn thành**.

---

## 🔄 4. QUY TRÌNH NGUYÊN LÝ TRẢ NỢ VÀ TỰ ĐỘNG XÓA NỢ

### Kịch bản Chuyến đi chơi Nhóm (Ví dụ: An, Bình, Cúc nợ 50k tiền lẩu):

```
[Chủ nợ ấn "Tạo Link Nhóm"] ──> [Gửi 1 Link duy nhất vào Zalo Group]
                                           │
                                           ▼ (Bình ở nhà nhấp vào Link)
                                 [Trang Web hiện danh sách Tên]
                                           │
                                           ▼ (Bình bấm chọn "Bạn Bình")
                                 [Web tạo VietQR cá nhân cho Bình]
                                 (STK: your_stk | Tiền: 50k | ND: TRANO NO102)
                                           │
                                           ▼ (Bình quét QR trả tiền)
                                 [Ngân hàng gửi Notification tới máy Chủ nợ]
                                 ("MBBank: +50,000VND. ND: TRANO NO102")
                                           │
                                           ▼ (App trên máy Chủ nợ bắt thông báo)
                                 [TỰ ĐỘNG CHUYỂN TRẠNG THÁI BÌNH ➔ ĐÃ THANH TOÁN!]
                                           │
                                           ▼ (Nổ thông báo Push Notification)
                                 ["🎉 Bạn Bình vừa trả 50.000đ!"]
```

---

## 🔔 5. HỆ THỐNG THÔNG BÁO (NOTIFICATION ENGINE)

1. **Push Notification trên màn hình khóa:** Khi nhận được tin nhắn trả nợ, điện thoại nổ banner + âm thanh *"🎉 Bạn Bình vừa thanh toán 50.000đ!"*.
2. **Banner & Hiệu ứng In-App:** Pháo hoa chúc mừng + Âm thanh Ting Ting vui tai khi đang mở ứng dụng.
3. **Bot Thông Báo Nhóm (Tùy chọn):** Tự động gửi tin nhắn báo tiến độ vào nhóm Telegram/Zalo chung khi có người hoàn tất trả nợ.

---

## 🚀 6. KẾ HOẠCH TRIỂN KHAI MÃ NGUỒN (TECHNICAL ROADMAP)

- **Vị trí thư mục dự án:** `C:\Users\ASUS\.gemini\antigravity\scratch\rich-notepad-app`
- **Các tệp cốt lõi:**
  - `index.html`: Cấu trúc khung giao diện, Sidebar 6 Formats, Toolbar, Workspace & Modals.
  - `styles.css`: Design System cao cấp (Dark/Light mode, HSL Palette, Glassmorphism, VietQR Badges, Responsive Grid).
  - `app.js`: 
    - Engine xử lý 6 Formats.
    - Trình sinh VietQR động & Mã hóa Link URL Hash.
    - Bộ phân tích tin nhắn ngân hàng (Bank SMS/Notification Regex Parser).
    - Bộ nhớ lưu trữ offline LocalStorage / IndexedDB.
