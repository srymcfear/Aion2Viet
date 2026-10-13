# FEΔR - AION 2 Tactical Map & Timers Overlay Plugin

> **Module mở rộng (Plugin) cho F-Aion 2 Tools**
> Được phát triển dựa trên ý tưởng bản đồ và tọa độ lộ trình từ dự án [problem-xyz/aion2-map-overlay](https://github.com/problem-xyz/aion2-map-overlay).

---

## 🚀 Điểm Cải Tiến Cốt Lõi (Zero-Lag Architecture)
- **Vấn đề của repo gốc:** Phiên bản gốc `problem-xyz/aion2-map-overlay` quét màn hình và khớp mẫu hình ảnh bằng OpenCV liên tục ở 30-60 FPS, dẫn đến tiêu tốn 15% - 35% CPU/GPU, gây giật lag khi chơi game.
- **Giải pháp của FEΔR Tools:** Chuyển đổi toàn diện sang kiến trúc **Zero-Lag Passive Canvas 2D & Lightweight Plaque HUD**:
  - Tiêu thụ CPU < 0.2% khi thao tác, **0% CPU** khi idle.
  - Không hook vào DirectX/Vulkan của game, không vi phạm Anti-Cheat.
  - Chuyển mốc tiến trình linh hoạt qua phím nóng toàn cục (`F8` Next, `F7` Prev).

---

## 🗺️ Hai Chế Độ Hiển Thị (Dual Mode)
1. **Demo 1: Tactical Map Planner (Toàn Cảnh - 980x660)**
   - Bản đồ 2D Cyberpunk radar 3 vùng đất (*Verteron, Altgard, Abyss Core*).
   - Bộ lọc điểm dịch chuyển, Boss, Vết tích Thần.
   - Hệ thống đếm ngược Spacetime Rift, Abyss Siege, Daily Reset, World Bosses.
2. **Demo 2: In-Game Plaque Overlay (Ghim Trong Game - 380x520)**
   - Bảng nổi bán trong suốt góc màn hình đè trực tiếp lên game mà không che tầm nhìn.
   - La bàn định hướng, khoảng cách tới mục tiêu và lộ trình thu gọn.
   - Thanh trượt chỉnh độ mờ (Opacity 30% - 100%) và tùy chọn ghim Always-on-top.

---

## ⌨️ Phím Nóng Điều Khiển
- **`[F9]`**: Chuyển đổi qua lại giữa Demo 1 và Demo 2 ngay lập tức trong trận đấu.
- **`[F8]`**: Đánh dấu hoàn thành mốc hiện tại, chuyển sang mốc tiếp theo.
- **`[F7]`**: Lùi lại mốc trước đó.
