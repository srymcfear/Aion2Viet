"""
FEΔR Cyberpunk Combat Meter - Plugin App Controller
Author: FEΔR
Description: Khởi chạy và điều khiển cửa sổ overlay Cyberpunk HUD (Always-on-top, Click-through, PyWebView/Webview).
Có thể chạy độc lập (Standalone) hoặc import vào bất kỳ tool Python nào khác.
"""

import os
import sys
import json
import time
import ctypes
import threading
from typing import Optional, List, Dict, Any

# Windows Constants for Click-Through / Extended Styles
GWL_EXSTYLE = -20
WS_EX_LAYERED = 0x00080000
WS_EX_TRANSPARENT = 0x00000020

# Global Window Handle Reference
_window_instance = None
_window_hwnd = None
_is_click_through = False


class MeterJsApi:
    """API Cầu nối giữa JavaScript trong Overlay và Python Backend."""

    def __init__(self, controller):
        self.controller = controller

    def reset_combat(self):
        print("[FEΔR METER] Reset combat stats requested from UI.")
        return True

    def toggle_click_through(self, enable: bool):
        global _is_click_through
        _is_click_through = bool(enable)
        set_window_click_through(_window_hwnd, _is_click_through)
        return _is_click_through

    def minimize_window(self):
        if _window_instance:
            try:
                _window_instance.minimize()
            except Exception:
                pass
        return True

    def close_window(self):
        if _window_instance:
            try:
                _window_instance.destroy()
            except Exception:
                pass
        return True


def get_html_path() -> str:
    """Trả về đường dẫn tuyệt đối đến file overlay.html trong plugin."""
    base_dir = os.path.dirname(os.path.abspath(__file__))
    return os.path.join(base_dir, "overlay.html")


def set_window_click_through(hwnd, enable: bool):
    """Bật/Tắt tính năng Click-through (xuyên chuột) trên Windows."""
    if not hwnd or sys.platform != "win32":
        return
    try:
        user32 = ctypes.windll.user32
        ex_style = user32.GetWindowLongW(hwnd, GWL_EXSTYLE)
        if enable:
            user32.SetWindowLongW(hwnd, GWL_EXSTYLE, ex_style | WS_EX_TRANSPARENT | WS_EX_LAYERED)
            print("[FEΔR METER] Click-through: ENABLED (Pass-through active).")
        else:
            user32.SetWindowLongW(hwnd, GWL_EXSTYLE, ex_style & ~WS_EX_TRANSPARENT)
            print("[FEΔR METER] Click-through: DISABLED.")
    except Exception as e:
        print(f"[WARN] Error setting click-through: {e}")


def find_overlay_hwnd() -> Optional[int]:
    """Tìm HWND của cửa sổ Overlay."""
    if sys.platform != "win32":
        return None
    try:
        user32 = ctypes.windll.user32
        title = "FEΔR Cyberpunk Combat Meter"
        hwnd = user32.FindWindowW(None, title)
        return hwnd if hwnd != 0 else None
    except Exception:
        return None


# ================= CÁC HÀM XUẤT KHẨU CHO TOOL KHÁC GỌI =================

def push_combat_data(party_members: List[Dict[str, Any]]):
    """Đẩy danh sách thành viên và DPS mới vào UI."""
    if _window_instance:
        try:
            payload = json.dumps(party_members)
            _window_instance.evaluate_js(f"window.updateCombatData({payload});")
        except Exception:
            pass


def push_boss_data(name: str, percent: float, current_hp: int = 0, max_hp: int = 0):
    """Cập nhật thanh máu Boss và Phase."""
    if _window_instance:
        try:
            boss_info = json.dumps({
                "name": name,
                "percent": percent,
                "currentHp": current_hp,
                "maxHp": max_hp
            })
            _window_instance.evaluate_js(f"window.updateBossData({boss_info});")
        except Exception:
            pass


def push_aggro_alert(player_name: str, is_self: bool):
    """Cảnh báo mục tiêu Boss đổi sang người chơi khác hoặc chính mình."""
    if _window_instance:
        try:
            name_json = json.dumps(player_name)
            is_self_str = "true" if is_self else "false"
            _window_instance.evaluate_js(f"window.setAggroTarget({name_json}, {is_self_str});")
        except Exception:
            pass


def push_telemetry(ping: int, fps: int, timer: str):
    """Cập nhật Ping, FPS và thời gian giao tranh."""
    if _window_instance:
        try:
            _window_instance.evaluate_js(f"window.updateTelemetry({ping}, {fps}, '{timer}');")
        except Exception:
            pass


def launch_dps_meter(
    width: int = 680,
    height: int = 760,
    x: Optional[int] = None,
    y: Optional[int] = None,
    on_top: bool = True,
    transparent: bool = True,
    click_through: bool = False
):
    """
    Hàm chính để mở cửa sổ Overlay FEΔR Cyberpunk Combat Meter.
    Tool khác chỉ cần gọi:
        from plugins.dps_meter_cyberpunk import launch_dps_meter
        launch_dps_meter()
    """
    global _window_instance, _window_hwnd

    try:
        import webview
    except ImportError:
        print("[ERROR] Thư viện 'pywebview' chưa được cài đặt. Vui lòng chạy: pip install pywebview")
        return False

    html_file = get_html_path()
    if not os.path.isfile(html_file):
        print(f"[ERROR] Không tìm thấy file giao diện overlay tại: {html_file}")
        return False

    api = MeterJsApi(None)

    # Tính toán tọa độ mặc định nếu không truyền
    if x is None or y is None:
        x = 50
        y = 80

    _window_instance = webview.create_window(
        title="FEΔR Cyberpunk Combat Meter",
        url=f"file:///{os.path.abspath(html_file).replace(os.sep, '/')}",
        width=width,
        height=height,
        x=x,
        y=y,
        frameless=True,
        easy_drag=True,
        on_top=on_top,
        transparent=transparent,
        js_api=api
    )

    def _on_loaded():
        global _window_hwnd
        time.sleep(0.5)
        _window_hwnd = find_overlay_hwnd()
        if click_through and _window_hwnd:
            set_window_click_through(_window_hwnd, True)

    threading.Thread(target=_on_loaded, daemon=True).start()
    webview.start(debug=False)
    return True


def stop_dps_meter():
    """Đóng cửa sổ Overlay."""
    global _window_instance
    if _window_instance:
        try:
            _window_instance.destroy()
        except Exception:
            pass
        _window_instance = None
    return True


# ================= ENTRYPOINT KHI CHẠY TRỰC TIẾP =================
if __name__ == "__main__":
    print("==================================================")
    print("   FEΔR Cyberpunk Combat Meter - Standalone Host  ")
    print("==================================================")
    print("Đang khởi động giao diện Cyberpunk HUD Overlay...")
    launch_dps_meter()
