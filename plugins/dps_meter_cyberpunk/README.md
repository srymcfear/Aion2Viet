# 🚀 FEΔR Cyberpunk Combat Meter - Plugin Integration Guide

Plugin giao diện **Cyberpunk Neon HUD** (Mẫu 1) được thiết kế theo chuẩn độc lập, cho phép nhúng trực tiếp vào bất kỳ tool game nào (Python, Electron, hoặc C# .NET).

---

## 1. Cấu Trúc Plugin
```
dps_meter_cyberpunk/
├── plugin.json         # Manifest thông tin plugin
├── overlay.html        # Giao diện Cyberpunk Neon HUD (Mẫu 1)
├── plugin_app.py       # Controller Python (pywebview, click-through, IPC bridge)
├── __init__.py         # Package module export
└── README.md           # Hướng dẫn tích hợp
```

---

## 2. Cách Tích Hợp Vào Tool Python (Ví dụ: F-Aion 2 Tools / app.py)

### Cách 1: Gọi Khởi Chạy Nhanh (1 dòng code)
```python
from plugins.dps_meter_cyberpunk import launch_dps_meter, stop_dps_meter

# Khởi chạy cửa sổ overlay nổi trên game (trong suốt, always on top)
launch_dps_meter(width=680, height=760, on_top=True, transparent=True)
```

### Cách 2: Đẩy Dữ Liệu Thời Gian Thực (Live Combat Telemetry)
```python
from plugins.dps_meter_cyberpunk import (
    push_combat_data,
    push_boss_data,
    push_aggro_alert,
    push_telemetry
)

# 1. Cập nhật số liệu Party DPS
push_combat_data([
    {"id": 1, "name": "月蝕の黒羽", "job": "Sorcerer", "isSelf": True, "damage": 24500000, "dps": 95400, "share": 45.2, "crit": 68.0},
    {"id": 2, "name": "SrymC_FEΔR", "job": "Gladiator", "isSelf": False, "damage": 15200000, "dps": 59200, "share": 28.0, "crit": 51.5},
])

# 2. Cập nhật thanh máu Boss
push_boss_data(name="Awakened Kromede", percent=54.2, current_hp=20750000, max_hp=38350000)

# 3. Cảnh báo Boss đổi mục tiêu (Aggro)
push_aggro_alert(player_name="月蝕の黒羽", is_self=True)  # Sẽ nhấp nháy 'LOCKED ON YOU!'

# 4. Cập nhật Ping/FPS
push_telemetry(ping=26, fps=144, timer="04:20")
```

---

## 3. Cách Tích Hợp Vào Tool Electron / Web
Nếu tool của bạn được viết bằng **Electron**:
1. Copy file `overlay.html` vào thư mục view của Electron.
2. Tạo `BrowserWindow` với cấu hình:
```javascript
const win = new BrowserWindow({
  width: 680,
  height: 760,
  frame: false,
  transparent: true,
  alwaysOnTop: true,
  webPreferences: {
    preload: path.join(__dirname, 'preload.js')
  }
});
win.loadFile('overlay.html');
```
3. Truyền số liệu vào giao diện bằng `win.webContents.executeJavaScript()` hoặc IPC:
```javascript
win.webContents.executeJavaScript(`window.updateBossData({ name: "Kromede", percent: 45.0 });`);
```

---

## 4. Cách Tích Hợp Vào Tool C# .NET (WebView2)
Nếu tool của bạn được viết bằng **WPF / WinForms**:
1. Thêm control `Microsoft.Web.WebView2` vào Form/Window (đặt `AllowsTransparency="True"` và `WindowStyle="None"`).
2. Trỏ Source đến file `overlay.html`.
3. Gửi dữ liệu vào UI qua:
```csharp
await webView.ExecuteScriptAsync($"window.updateCombatData({jsonParty});");
```
