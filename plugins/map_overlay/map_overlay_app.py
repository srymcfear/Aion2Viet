"""
FEΔR - AION 2 Tactical Map & Timers Overlay Standalone Plugin
Developed by Team FEΔR / SrymC
Decoupled Native GUI Architecture with Security Lock
Provides dual-mode display: Full Tactical Map Planner & In-Game Compact Plaque Overlay
"""
import os
import sys
import json
import time
import ctypes
from ctypes import wintypes
import webview

# Ensure stdout/stderr handles UTF-8 on Windows
if sys.platform == "win32":
    try:
        if sys.stdout and hasattr(sys.stdout, "reconfigure"):
            sys.stdout.reconfigure(encoding="utf-8", errors="replace")
        if sys.stderr and hasattr(sys.stderr, "reconfigure"):
            sys.stderr.reconfigure(encoding="utf-8", errors="replace")
    except Exception:
        pass

try:
    from map_overlay_service import MapOverlayService
except ImportError:
    from plugins.map_overlay.map_overlay_service import MapOverlayService

SECURITY_KEY_HASH = "4eb733f752b4f4e3f25fcde3424c38f92435721355b8c981e1e773164126da90"
_window = None
user32 = ctypes.windll.user32 if sys.platform == "win32" else None

def verify_signature() -> bool:
    """Verifies that this plugin was launched by F-Aion 2 Tools with the authentic signature."""
    for i, arg in enumerate(sys.argv):
        if arg in ("--fear-launcher", "--signature", "-s") and i + 1 < len(sys.argv):
            token = sys.argv[i + 1].strip()
            if token == SECURITY_KEY_HASH:
                return True
    return False

def show_access_denied_and_exit():
    """Displays a native security lock dialog if launched unauthorized."""
    msg = (
        "FEΔR Security Lock:\n\n"
        "Plugin AION 2 Tactical Map & Timers Overlay được bảo vệ bản quyền.\n"
        "Plugin chỉ có thể khởi chạy trực tiếp từ F-Aion 2 Tools chính!\n\n"
        "Vui lòng mở F-Aion 2 Tools và kích hoạt từ tab Tools Mở Rộng."
    )
    title = "FEΔR - Quyền Truy Cập Bị Từ Chối"
    if sys.platform == "win32":
        try:
            ctypes.windll.user32.MessageBoxW(0, msg, title, 0x00000010 | 0x00000000)
        except Exception:
            pass
    print("[FEAR-SECURITY] Unauthorized launch attempt blocked.")
    sys.exit(1)

def get_bundle_dir():
    if getattr(sys, 'frozen', False) and hasattr(sys, '_MEIPASS'):
        return sys._MEIPASS
    return os.path.dirname(os.path.abspath(__file__))

def get_app_storage_dir():
    pdata = os.environ.get("ProgramData", r"C:\ProgramData")
    base_dir = os.path.join(pdata, "FEAR", "Aion2_Tools")
    os.makedirs(base_dir, exist_ok=True)
    return base_dir

def get_html_path():
    b_dir = get_bundle_dir()
    candidates = [
        os.path.join(b_dir, "plugins", "map_overlay", "map_overlay_window.html"),
        os.path.join(b_dir, "map_overlay_window.html"),
        os.path.join(os.path.dirname(os.path.abspath(__file__)), "map_overlay_window.html"),
        os.path.join(os.path.dirname(sys.executable), "plugins", "map_overlay", "map_overlay_window.html"),
        os.path.join(os.path.dirname(sys.executable), "map_overlay_window.html"),
        os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "..", "plugins", "map_overlay", "map_overlay_window.html"),
    ]
    for c in candidates:
        if os.path.isfile(c):
            return c
    return None

def apply_dark_titlebar(win):
    if sys.platform != "win32":
        return
    import threading
    def _worker():
        for _ in range(30):
            try:
                hwnd = None
                if hasattr(win, 'native') and win.native:
                    hwnd = int(win.native.Handle.ToInt64())
                elif hasattr(win, 'gui') and hasattr(win.gui, 'BrowserView'):
                    uid = getattr(win, 'uid', 'master')
                    inst = win.gui.BrowserView.instances.get(uid)
                    if inst:
                        hwnd = int(inst.Handle.ToInt64())
                if hwnd:
                    dwmapi = ctypes.windll.dwmapi
                    dark_mode = ctypes.c_int(1)
                    dwmapi.DwmSetWindowAttribute(
                        wintypes.HWND(hwnd),
                        20,
                        ctypes.byref(dark_mode),
                        ctypes.sizeof(dark_mode)
                    )
                    break
            except Exception:
                pass
            time.sleep(0.08)
    threading.Thread(target=_worker, daemon=True).start()

class MapOverlayPluginApi:
    def __init__(self):
        self.service = MapOverlayService()

    def get_status(self):
        return self.service.get_status()

    def set_progress(self, route_id, step_index):
        return self.service.set_progress(route_id, step_index)

    def save_settings(self, settings):
        if isinstance(settings, dict):
            if "opacity" in settings:
                self.service.opacity = int(settings["opacity"])
            if "always_on_top" in settings:
                self.service.always_on_top = bool(settings["always_on_top"])
            if "compact_mode" in settings:
                self.service.compact_mode = bool(settings["compact_mode"])
            if "region" in settings:
                self.service.region = str(settings["region"])
            return self.service.save_config()
        return False

    def set_always_on_top(self, is_on_top):
        global _window
        if _window:
            try:
                _window.on_top = bool(is_on_top)
            except Exception:
                pass
        self.service.always_on_top = bool(is_on_top)
        self.service.save_config()
        return True

    def set_mode(self, mode):
        is_compact = (str(mode).lower() == "compact")
        self.service.set_mode("compact" if is_compact else "full")
        self.resize_window(380 if is_compact else 980, 520 if is_compact else 660)
        return True

    def resize_window(self, width, height):
        global _window
        if _window:
            try:
                _window.resize(int(width), int(height))
            except Exception:
                pass
        return True

    def move_window(self, x, y):
        global _window
        if not _window:
            return True
        if sys.platform == "win32" and user32:
            try:
                import webview.platforms.winforms as wf
                uid = getattr(_window, 'uid', 'master')
                inst = wf.BrowserView.instances.get(uid)
                if inst:
                    hwnd = int(inst.Handle.ToInt64())
                    scale = getattr(inst, '_scale', 1.0) or 1.0
                    x_phys = int(round(float(x) * scale))
                    y_phys = int(round(float(y) * scale))
                    user32.SetWindowPos(
                        wintypes.HWND(hwnd),
                        wintypes.HWND(0),
                        x_phys,
                        y_phys,
                        0,
                        0,
                        0x0001 | 0x0004 | 0x0010
                    )
                    return True
            except Exception:
                pass
        try:
            _window.move(int(x), int(y))
        except Exception:
            pass
        return True

    def start_drag(self):
        global _window
        if not _window or sys.platform != "win32" or not user32:
            return False
        try:
            import webview.platforms.winforms as wf
            uid = getattr(_window, 'uid', 'master')
            inst = wf.BrowserView.instances.get(uid)
            if inst:
                hwnd = int(inst.Handle.ToInt64())
                user32.ReleaseCapture()
                user32.PostMessageW(hwnd, 0x00A1, 2, 0)
                return True
        except Exception:
            pass
        return False

    def minimize_window(self):
        global _window
        if _window:
            try:
                _window.minimize()
            except Exception:
                pass
        return True

    def close_window(self):
        global _window
        if _window:
            try:
                _window.destroy()
            except Exception:
                pass
        return True

def main():
    if not verify_signature():
        show_access_denied_and_exit()
        return

    if sys.platform == "win32":
        try:
            ctypes.windll.shcore.SetProcessDpiAwareness(1)
        except Exception:
            pass

    html_file = get_html_path()
    if not html_file or not os.path.isfile(html_file):
        print(f"[Error] Missing HTML file: {html_file}")
        sys.exit(1)

    api = MapOverlayPluginApi()

    requested_mode = None
    for i, arg in enumerate(sys.argv):
        if arg in ("--mode", "-m") and i + 1 < len(sys.argv):
            requested_mode = sys.argv[i + 1].strip().lower()

    if requested_mode == "compact":
        is_compact = True
        api.service.compact_mode = True
    elif requested_mode == "full":
        is_compact = False
        api.service.compact_mode = False
    else:
        is_compact = bool(api.service.compact_mode)

    target_mode = "compact" if is_compact else "full"
    init_w = 380 if is_compact else 980
    init_h = 520 if is_compact else 660
    init_on_top = bool(api.service.always_on_top if is_compact else False)

    target_url = f"file:///{os.path.abspath(html_file).replace(os.sep, '/')}?mode={target_mode}"

    global _window
    _window = webview.create_window(
        title="FEΔR - AION 2 Tactical Map & Timers Overlay",
        url=target_url,
        js_api=api,
        width=init_w,
        height=init_h,
        on_top=init_on_top,
        resizable=True,
        frameless=False,
        easy_drag=True,
        shadow=True,
        background_color="#060911"
    )

    apply_dark_titlebar(_window)
    storage_path = os.path.join(get_app_storage_dir(), "Cache")
    os.makedirs(storage_path, exist_ok=True)
    webview.start(debug=False, private_mode=False, storage_path=storage_path)

if __name__ == "__main__":
    main()
