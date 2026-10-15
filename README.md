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

### 6.1 Tech Stack

| Thành phần | Công nghệ | Vai trò |
| :--- | :--- | :--- |
| **Framework** | Flutter (Dart) | App Android chính |
| **Rich Text Editor** | `flutter_quill` | Soạn thảo văn bản đa định dạng (Delta JSON) |
| **Database** | `drift` (SQLite ORM) | Lưu trữ local, type-safe, auto-migration |
| **VietQR** | `vietqr_gen` + `qr_flutter` | Sinh mã QR cục bộ (không cần API/server) |
| **State Management** | `provider` | Quản lý state đơn giản, official |
| **UI/Animation** | `flutter_animate` + `google_fonts` | Micro-animation, typography (Be Vietnam Pro) |
| **Trang trả nợ nhóm** | Vanilla HTML/CSS/JS (1 file) | Trang web nhẹ để người nợ mở link, host GitHub Pages |

### 6.2 Cấu trúc thư mục dự án

```
MultiPad/
├── README.md
│
├── app/                                        # ══ Flutter Mobile App ══
│   ├── lib/
│   │   ├── main.dart                           # Entry point, theme, routing
│   │   ├── app.dart                            # MaterialApp config
│   │   │
│   │   ├── core/                               # ── Shared utilities ──
│   │   │   ├── theme/
│   │   │   │   ├── app_theme.dart              # Material 3 Dark/Light theme
│   │   │   │   └── app_colors.dart             # HSL color palette
│   │   │   ├── database/
│   │   │   │   └── app_database.dart           # Drift tables & singleton
│   │   │   ├── widgets/                        # Common reusable widgets
│   │   │   │   ├── sidebar.dart                # Navigation sidebar
│   │   │   │   └── empty_state.dart            # Placeholder khi chưa có data
│   │   │   ├── l10n/                           # 🌐 Đa ngôn ngữ (i18n)
│   │   │   │   ├── app_vi.arb                  # Tiếng Việt (mặc định)
│   │   │   │   └── app_en.arb                  # English
│   │   │   └── utils/
│   │   │       ├── bank_sms_parser.dart        # Regex parser SMS ngân hàng
│   │   │       └── url_hash_encoder.dart       # Nén/giải nén data vào URL
│   │   │
│   │   └── features/                           # ── Feature-First modules ──
│   │       ├── home/                           # 🏠 Màn hình chính
│   │       │   └── presentation/
│   │       │       ├── home_screen.dart        # Danh sách notes, FAB, search
│   │       │       └── note_card.dart          # Card widget cho mỗi note
│   │       │
│   │       ├── document/                       # 📄 Rich Text Document Editor
│   │       │   ├── data/
│   │       │   │   ├── document_dao.dart       # Drift DAO queries
│   │       │   │   └── document_repository.dart
│   │       │   ├── domain/
│   │       │   │   └── document_model.dart     # id, title, deltaJson, timestamps
│   │       │   └── presentation/
│   │       │       ├── document_screen.dart    # QuillEditor + toolbar
│   │       │       └── document_toolbar.dart   # Custom toolbar buttons
│   │       │
│   │       └── debt/                           # 💸 Debt Ledger & VietQR
│   │           ├── data/
│   │           │   ├── debt_dao.dart           # Drift DAO queries
│   │           │   └── debt_repository.dart
│   │           ├── domain/
│   │           │   ├── debt_ledger_model.dart  # id, title, bankInfo, totalAmount
│   │           │   └── debtor_model.dart       # id, name, amount, status, debtCode
│   │           └── presentation/
│   │               ├── debt_ledger_screen.dart  # Danh sách sổ nợ
│   │               ├── debt_detail_screen.dart  # Chi tiết + danh sách người nợ
│   │               ├── qr_payment_screen.dart   # Hiển thị VietQR cá nhân
│   │               ├── group_link_screen.dart   # Tạo & preview link nhóm
│   │               └── sms_paste_dialog.dart    # Dialog dán SMS auto-clear
│   │
│   ├── pubspec.yaml                            # Dependencies & project config
│   └── android/                                # Android native config
│
└── web/                                        # ══ Trang Trả Nợ Nhóm (Web) ══
    ├── index.html                              # Trang chính
    ├── style.css                               # Giao diện (dark theme, responsive)
    └── app.js                                  # Logic:
                                                # - Decode URL hash → hiện danh sách tên
                                                # - Chọn tên → sinh VietQR (EMVCo)
                                                # - Bấm "Đã chuyển" → cache vào localStorage
                                                # - Mở lại link → hiện badge "✅ Đã thanh toán"
```

### 6.3 Cache trạng thái thanh toán trên Web (localStorage)

Khi người nợ mở link trả nợ nhóm trên trình duyệt, trang `pay.html` sẽ **cache trạng thái** đã chuyển khoản vào `localStorage` của trình duyệt:

```
[Bình mở link] → [Chọn tên "Bình"] → [Quét VietQR & chuyển tiền]
       │
       ▼
[Bấm nút "✅ Tôi đã chuyển khoản"]
       │
       ▼
[localStorage lưu: { ledgerId, debtorName, amount, confirmedAt, expiresAt }]
       │
       ▼
[Bình mở lại link lần sau] → [Trang hiện: "✅ Bạn đã thanh toán 50.000đ lúc 14:30"]
```

| Thuộc tính | Giá trị |
| :--- | :--- |
| **Key** | `multipad_payment_{ledgerId}_{debtorName}` |
| **Thời hạn cache** | 7 ngày (tự xóa sau khi hết hạn) |
| **Dung lượng** | ~200 bytes/người (localStorage hỗ trợ ~5MB) |
| **Lưu ý** | Đây là self-confirmation từ phía người nợ. Chủ nợ vẫn xác nhận chính thức trên app Flutter. |

### 6.4 Dependencies chính (pubspec.yaml)

```yaml
dependencies:
  # Rich Text Editor
  flutter_quill: ^11.5.1
  # Database (SQLite ORM)
  drift: ^2.22.0
  sqlite3_flutter_libs: ^0.5.0
  # QR Code
  vietqr_gen: latest
  qr_flutter: ^4.1.0
  # State Management
  provider: ^6.1.0
  # UI & Animation
  google_fonts: ^6.2.0
  flutter_animate: ^4.5.0
  # Utilities
  uuid: ^4.5.0
  intl: ^0.19.0
  share_plus: ^10.0.0
  url_launcher: ^6.3.0
```

### 6.5 Lộ trình phân pha

| Phase | Nội dung | Trạng thái |
| :--- | :--- | :--- |
| **1a** | Init project, Drift DB, Theme, Home Screen, Document Editor (flutter_quill), Debt Ledger CRUD | 🔜 Đang chuẩn bị |
| **1b** | VietQR generation, Bank SMS paste & parse, URL hash group link, Confetti animation | ⏳ Sau 1a |
| **2** | 4 Formats còn lại: Table, Schedule, Kanban, Checklist | 📋 Backlog |
| **3** | Android NotificationListenerService (auto-read bank notification), Export/Import backup | 📋 Backlog |
