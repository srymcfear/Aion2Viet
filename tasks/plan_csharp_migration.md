# 📋 KẾ HOẠCH CHUYỂN ĐỔI GIAO DIỆN F-AION 2 TOOLS SANG C# (.NET 8/10 WPF)
**Dự án:** F-Aion 2 Tools & Mod Manager  
**Tác giả:** Team FEΔR / SrymC (BER)  
**Mục tiêu:** Tái cấu trúc toàn bộ giao diện từ Python/PyWebView sang C# Native (WPF .NET 8 LTS / .NET 10), tăng tốc khởi động (< 200ms), tối ưu RAM (< 35MB), giữ nguyên 100% bố cục và logic hiện tại.

---

## 📌 1. BỐI CẢNH & LÝ DO CHUYỂN ĐỔI (WHY C#?)

| Tiêu chí | Bản Hiện Tại (Python + PyWebView + Vue 3) | Bản Mới (C# .NET 8/10 Native WPF) |
| :--- | :--- | :--- |
| **Thời gian khởi động** | ~2.0s - 3.5s (Khởi động Python + WebView2 runtime) | **< 200ms** (Native DirectX / Milcore rendering) |
| **Bộ nhớ RAM tiêu thụ** | ~180MB - 280MB (Edge WebView2 + Python runtime) | **~25MB - 45MB** (Thuần C# Native, không runtime browser) |
| **Dung lượng đóng gói** | ~45MB - 65MB (PyInstaller bundle) | **~15MB - 25MB** (Self-Contained Single-File + Trimming) |
| **Độ ổn định & Luồng** | Phụ thuộc cầu nối JS-Python Bridge qua WebView2, thỉnh thoảng trễ API | **C# async/await native**, Multi-threading an toàn, Event-driven |
| **Thao tác Hệ thống & File** | Gọi ctypes / winreg qua Python | **Direct Windows API / P-Invoke / Registry / WMI** siêu tốc |

---

## 🎨 2. GIỮ NGUYÊN 100% BỐ CỤC & LOGIC (UI/UX PARITY SPECIFICATION)

### 2.1. Cấu Trúc Khung Cửa Sổ (Frameless Window Chrome)
- **Kích thước chuẩn:** `860 x 580 px` (Centered, Fixed size, DWM Drop Shadow).
- **Màu nền chủ đạo:** Dark Obsidian (`#07090e`), Surface (`#0d121f`), Card (`rgba(18, 24, 38, 0.75)`).
- **Màu điểm nhấn (FEΔR Palette):** Cyan/Sky Blue (`#38bdf8`), Purple/Violet (`#a855f7`), Red Accent (`#f43f5e`).
- **Thanh tiêu đề (Header Bar):**
  - Logo `FEΔR` tròn viền phát sáng (`fear_logo.png`).
  - Tên công cụ: `F-Aion 2 Tools` (Bold, slate-200).
  - Huy hiệu Cập nhật: `YÊU CẦU CẬP NHẬT vX.X.X` (Chớp nháy màu Cyan, nhấn để nhảy sang tab About).
  - Huy hiệu Trạng thái (Status Pill): `● ĐÃ BẬT VIỆT HÓA` (Xanh Cyan neon chớp nháy) / `● BẢN GỐC` (Xám Slate).
  - Nút điều khiển: Minimize `_` và Close `✕` phong cách Cyberpunk Frameless.

### 2.2. Thanh Điều Hướng (Tab Navigation & Sub-Navbar)
- **3 Tab chính:**
  1. `Quản lý Việt Hóa` (Locale Manager)
  2. `Tools Mở Rộng` (Extended Tools & Plugins)
  3. `About & Update` (Phiên bản & Tự động cập nhật)
- **Version Pill:** `v1.1.4` (Border Cyan neon).
- **Sub-Navbar Strip:**
  - Trái: `VERSION: v1.1.4 • FEΔR ENGINE` (Monospace).
  - Phải: `● BẢN MỚI NHẤT` (Emerald) hoặc `🚀 CÓ BẢN MỚI vX.X.X` (Cyan).

### 2.3. Bố Cục Chi Tiết Các Tab:
- **Tab 1: Quản lý Việt Hóa:**
  - *Banner Bảo mật/Bảo trì:* Hiển thị nếu server trả về trạng thái Lock/Bảo trì.
  - *Thư mục Game:* Input hiển thị đường dẫn + 2 nút `Chọn thư mục` (FolderBrowserDialog) và `Quét lại` (Registry/Running Process Scan).
  - *Thanh tiến độ:* Dòng trạng thái (`Sẵn sàng`, `Đang sao lưu...`, `Đang ghi đè...`) + Phần trăm số + Thanh Progress Bar hiệu ứng Neon Glow.
  - *2 Nút Hành động:*
    - `CÀI ĐẶT VIỆT HÓA` (Cyan/Sky-400 Gradient Glow, Disabled khi đã cài hoặc đang bận).
    - `GỠ VIỆT HÓA` (Red-500 Outline/Glow, Disabled khi chưa cài hoặc đang bận).
  - *Log Console (Terminal Mini):* Khung nền đen sâu `#05070c`, font JetBrains Mono / Consolas, tự cuộn xuống dòng mới nhất, màu sắc phân loại: Cyan (Info), Xanh lá (Success), Đỏ (Error), Xám (Debug).
- **Tab 2: Tools Mở Rộng:**
  - Lưới 2 cột các Card chức năng:
    - Card 1: `AION 2 DPS Meter` (Badge `PLUGIN`, Action: `Khởi chạy DPS Meter` hoặc khóa `🟢 ĐANG MỞ`).
    - Card 2: `Twitch Drops Miner` (Badge `FEΔR PLUGIN`, Action: `Mở Cửa Sổ Riêng` hoặc khóa `🟢 ĐANG MỞ`).
    - Card 3: `TCP/UDP Optimizer` (Badge `PHÁT TRIỂN`).
    - Card 4: `Góc nhìn FOV Extender` (Badge `PHÁT TRIỂN`).
  - Card Banner Truy cập Web: `AION 2 Hub` (`https://aion2-hub-bice.vercel.app/`).
- **Tab 3: About & Update:**
  - Card Thương hiệu: Logo, tên app, phiên bản, Tác giả: `SrymC (FEΔR Team)`.
  - Card Cập nhật phần mềm:
    - Phiên bản hiện tại vs Phiên bản mới nhất trên GitHub Releases.
    - Nút `Kiểm tra cập nhật` (Check update async).
    - Khung Changelog và nút `Tự động tải cập nhật` (OTA/In-place binary replacement).
- **Thanh chân trang (Footer Bar):**
  - Trái: `cre by srymc` • `🌐 aion2-hub` (Click mở trình duyệt).
  - Phải: `@FEAR Github` (Click mở repository).

---

## 🏗 3. KIẾN TRÚC KỸ THUẬT C# (.NET 8/10 WPF MVVM)

```
src-csharp/
├── Aion2Tools.sln
└── Aion2Tools/
    ├── Aion2Tools.csproj                  # .NET 8.0-windows (LTS), PublishSingleFile, Trimmed
    ├── App.xaml / App.xaml.cs             # Khởi tạo single-instance mutex, unhandled exceptions
    ├── MainWindow.xaml / .cs              # Giao diện chính frameless, DWM shadow, drag header
    ├── Assets/
    │   ├── fear_logo.ico / fear_logo.png
    │   └── Fonts/
    ├── Styles/
    │   ├── Colors.xaml                    # FEΔR Dark Palette (Obsidian, Cyan neon, Purple, Red)
    │   ├── Buttons.xaml                   # Custom Cyberpunk Button Styles
    │   ├── ScrollBar.xaml                 # Custom Minimal Dark Scrollbar
    │   └── Controls.xaml                  # Custom TextBoxes, ProgressBars, Tabs
    ├── Models/
    │   ├── GameInstallInfo.cs             # Thông tin đường dẫn game & phiên bản L10N
    │   ├── ToolItem.cs                    # Model danh sách plugin
    │   ├── UpdateInfo.cs                  # GitHub Release & Security Key info
    │   └── LogMessage.cs                  # Time, Text, LogType (Info, Success, Error)
    ├── ViewModels/
    │   ├── BaseViewModel.cs               # INotifyPropertyChanged
    │   ├── MainViewModel.cs               # State tổng: Version, Tab, InstallStatus, Progress
    │   └── LogViewModel.cs                # ObservableCollection<LogMessage>
    └── Services/
        ├── GameScannerService.cs          # Quét Registry Purple & Process "Aion2"
        ├── ModEngineService.cs            # Ghi đè Loose-file, SHA-256 Hash check, Backup/Restore
        ├── ProcessDispatcherService.cs    # Quản lý tiến trình plugin con (TwitchDropsMiner, DPS)
        └── AutoUpdaterService.cs          # Check GitHub API, Download OTA, In-place replace
```

---

## 🚀 4. LỘ TRÌNH THỰC THI CHI TIẾT (TASK BREAKDOWN)

### Giai Đoạn 1: Thiết Lập Solution & Hệ Thống Giao Diện (Design System)
- [ ] **Task 1.1:** Khởi tạo project `Aion2Tools` (.NET 8 WPF) với cấu trúc MVVM sạch.
- [ ] **Task 1.2:** Xây dựng hệ thống ResourceDictionary (Colors, Cyberpunk Button, Glowing Progress Bar, Custom Scrollbar, Tabs).
- [ ] **Task 1.3:** Tạo cửa sổ Frameless Window `MainWindow.xaml` có hỗ trợ kéo thả tự do, bóng đổ DWM và nút điều khiển Window (Minimize, Close).

### Giai Đoạn 2: Xây Dựng Core Services (Backend Logic)
- [ ] **Task 2.1:** Viết `GameScannerService`: Tự động tìm thư mục game từ Registry NCSoft / Purple và quét process đang chạy.
- [ ] **Task 2.2:** Viết `ModEngineService`:
  - Kiểm tra trạng thái cài đặt qua checksum hash SHA-256 của file `L10NString.dat`.
  - Cài đặt: Sao lưu file gốc vào `C:\ProgramData\FEAR\Aion2_Tools\Backup`, ghi đè bản dịch Loose-file.
  - Gỡ bỏ: Khôi phục file gốc từ Backup.
- [ ] **Task 2.3:** Viết `ProcessDispatcherService`: Khởi chạy & theo dõi trạng thái các plugin con độc lập, tự động cập nhật trạng thái `🟢 ĐANG MỞ`.
- [ ] **Task 2.4:** Viết `AutoUpdaterService`: Tích hợp GitHub Releases API và worker script cập nhật tự động.

### Giai Đoạn 3: Hoàn Thiện Giao Diện Người Dùng (3 Tabs)
- [ ] **Task 3.1:** Triển khai **Tab 1: Quản lý Việt Hóa** (Input game dir, browse dialog, scan, progress bar neon glow, 2 action buttons, Terminal Console).
- [ ] **Task 3.2:** Triển khai **Tab 2: Tools Mở Rộng** (Lưới 4 Card Tools, trạng thái khóa khi cửa sổ đang mở, Card Web Hub).
- [ ] **Task 3.3:** Triển khai **Tab 3: About & Update** (Card thông tin tác giả, kiểm tra cập nhật, hiển thị changelog, nút update).
- [ ] **Task 3.4:** Hoàn thiện Footer Bar và các liên kết mở trình duyệt ngoài (`Process.Start`).

### Giai Đoạn 4: Kiểm Thử & Tối Ưu Đóng Gói
- [ ] **Task 4.1:** Test toàn bộ luồng Cài đặt / Gỡ bỏ Việt hóa thực tế với thư mục game.
- [ ] **Task 4.2:** Test khởi chạy plugin Twitch Drops Miner và khóa trùng lặp.
- [ ] **Task 4.3:** Cấu hình xuất file `.exe` độc lập siêu nhẹ (`PublishSingleFile=true`, ReadyToRun, Trimmed).
- [ ] **Task 4.4:** Commit Git và đẩy lên cả 2 remote `origin` và `public`.
