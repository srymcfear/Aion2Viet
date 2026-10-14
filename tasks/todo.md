# 📝 TODO: C# WPF MIGRATION TASK TRACKER

- [ ] **Giai Đoạn 1: Solution & Design System C# WPF**
  - [ ] Khởi tạo thư mục `src-csharp` và project `Aion2Tools.csproj` (.NET 8 WPF)
  - [ ] Thiết lập Style XAML: Bảng màu FEΔR Dark Mode, Buttons neon glow, Custom scrollbar
  - [ ] Xây dựng Frameless Window với DWM Drop Shadow và Controls bar (Minimize, Close)

- [ ] **Giai Đoạn 2: Core Services (Logic Engine)**
  - [ ] `GameScannerService.cs`: Quét Registry & tiến trình game
  - [ ] `ModEngineService.cs`: Backup, Verify SHA-256, Ghi đè Loose-file L10N
  - [ ] `ProcessDispatcherService.cs`: Điều phối các plugin Twitch Drops & DPS Meter
  - [ ] `AutoUpdaterService.cs`: Kiểm tra GitHub Releases & cập nhật In-place

- [ ] **Giai Đoạn 3: Hoàn Thiện Các Tab Giao Diện (UI Parity)**
  - [ ] Tab 1: Quản lý Việt Hóa (Path picker, Progress glow, Install/Uninstall, Mini Console)
  - [ ] Tab 2: Tools Mở Rộng (Lưới 4 Card công cụ, Khóa khi mở, Web Hub Card)
  - [ ] Tab 3: About & Update (Tác giả, Check update, Changelog, Direct update)
  - [ ] Header & Footer: Status Pill, Version badge, External links

- [ ] **Giai Đoạn 4: Kiểm Thử & Xuất Bản**
  - [ ] Build kiểm thử logic trên Windows
  - [ ] Xuất bản Single-File Standalone EXE (< 25MB)
  - [ ] Commit Git & Push đồng bộ 2 repository (`origin` & `public`)
