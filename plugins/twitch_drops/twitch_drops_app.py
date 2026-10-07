"""
FEΔR - AION 2 Twitch Drops Miner Standalone Plugin
Developed by Team FEΔR / SrymC
Decoupled Native GUI Architecture with Security Lock
"""
import os
import sys
import json
import time
import ctypes
import webbrowser
from ctypes import wintypes
import webview
from twitch_drops_service import TwitchDropsService

SECURITY_KEY_HASH = "4eb733f752b4f4e3f25fcde3424c38f92435721355b8c981e1e773164126da90"

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
        "Plugin AION 2 Twitch Drops Miner được bảo vệ bản quyền.\n"
        "Plugin chỉ có thể khởi chạy trực tiếp từ F-Aion 2 Tools chính!\n\n"
        "Vui lòng mở F-Aion 2 Tools và kích hoạt từ tab Tools Mở Rộng."
    )
    title = "FEΔR - Quyền Truy Cập Bị Từ Chối"
    if sys.platform == "win32":
        try:
            ctypes.windll.user32.MessageBoxW(0, msg, title, 0x00000010 | 0x00000000) # MB_ICONERROR
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

def get_cache_dir():
    cache_dir = os.path.join(get_app_storage_dir(), "Cache")
    os.makedirs(cache_dir, exist_ok=True)
    return cache_dir

def get_html_path():
    b_dir = get_bundle_dir()
    candidates = [
        os.path.join(b_dir, "twitch_drops_window.html"),
        os.path.join(os.path.dirname(os.path.abspath(__file__)), "twitch_drops_window.html"),
        os.path.join(os.path.dirname(sys.executable), "twitch_drops_window.html")
    ]
    for c in candidates:
        if os.path.isfile(c):
            return c
    return None

def apply_dark_titlebar(win):
    if sys.platform != "win32":
        return
    def _worker():
        for _ in range(50):
            try:
                hwnd = None
                if hasattr(win, 'native') and win.native:
                    hwnd = int(win.native.Handle.ToInt64())
                elif hasattr(win, 'gui') and hasattr(win.gui, 'BrowserView'):
                    uid = getattr(win, 'uid', 'master')
                    inst = win.gui.BrowserView.instances.get(uid)
                    if inst:
                        hwnd = int(inst.Handle.ToInt64())
                else:
                    import webview.platforms.winforms as wf
                    uid = getattr(win, 'uid', 'master')
                    inst = wf.BrowserView.instances.get(uid)
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
            time.sleep(0.05)
    import threading
    threading.Thread(target=_worker, daemon=True).start()

_window = None

class TwitchPluginApi:
    def __init__(self):
        storage_dir = get_app_storage_dir()
        self.service = TwitchDropsService(
            storage_dir=storage_dir,
            log_callback=self._log
        )

    def _log(self, msg, msg_type=""):
        print(f"[TwitchDrops] {msg}")

    def get_twitch_drops_status(self):
        try:
            return self.service.get_status()
        except Exception as e:
            return {
                "isRunning": False,
                "hasToken": False,
                "autoClaim": True,
                "accountName": None,
                "userId": "",
                "currentChannel": None,
                "minutesMined": 0,
                "campaigns": [],
                "claimHistory": [],
                "oauthState": {"status": "error", "error_message": str(e)}
            }

    def start_twitch_miner(self):
        try:
            return self.service.start()
        except Exception as e:
            print(f"[Error] start_twitch_miner: {e}")
            return False

    def stop_twitch_miner(self):
        try:
            return self.service.stop()
        except Exception as e:
            print(f"[Error] stop_twitch_miner: {e}")
            return False

    def start_twitch_oauth(self):
        try:
            return self.service.start_oauth_login(auto_open_browser=True)
        except Exception as e:
            return {"success": False, "error": str(e)}

    def set_twitch_auth_token(self, token):
        try:
            with self.service._lock:
                self.service.auth_token = str(token).strip()
                self.service._save_config()
            self.service.validate_token()
            return True
        except Exception as e:
            print(f"[Error] set_twitch_auth_token: {e}")
            return False

    def open_twitch_web_login(self):
        try:
            exe_path = sys.executable
            if getattr(sys, 'frozen', False):
                args = [exe_path, "--fear-launcher", SECURITY_KEY_HASH, "--login"]
            else:
                script_path = os.path.abspath(__file__)
                args = [sys.executable, script_path, "--fear-launcher", SECURITY_KEY_HASH, "--login"]
            
            import subprocess
            subprocess.Popen(args, close_fds=True if sys.platform != "win32" else False)
            return {"success": True}
        except Exception as e:
            print(f"[Error] open_twitch_web_login: {e}")
            return {"success": False, "error": str(e)}

    def sync_twitch_session(self):
        """Forces reloading config and re-validating Twitch token immediately."""
        try:
            self.service._load_config()
            self.service.validate_token()
            return {"success": bool(self.service.auth_token), "accountName": self.service.account_name}
        except Exception as e:
            return {"success": False, "error": str(e)}

    def open_twitch_inventory(self):
        try:
            webbrowser.open("https://www.twitch.tv/drops/inventory")
            return True
        except Exception:
            return False

    def minimize_twitch_window(self):
        global _window
        if _window:
            try:
                _window.minimize()
            except Exception:
                pass
        return True

    def close_twitch_window(self):
        global _window
        if _window:
            try:
                _window.destroy()
            except Exception:
                pass
            _window = None
        sys.exit(0)

    def hide_twitch_window(self):
        return self.close_twitch_window()

    def set_twitch_always_on_top(self, is_on_top):
        global _window
        if _window:
            try:
                _window.on_top = bool(is_on_top)
            except Exception:
                pass
        return True

    def resize_twitch_window(self, width, height):
        global _window
        if _window:
            try:
                _window.resize(int(width), int(height))
            except Exception:
                pass
        return True

    def move_twitch_window(self, x, y):
        global _window
        if _window:
            try:
                _window.move(int(x), int(y))
            except Exception:
                pass
        return True

def run_twitch_login_window():
    """Opens a standalone WebView window for Twitch login, intercepts auth-token cookie, saves it, and exits."""
    storage_dir = get_app_storage_dir()
    cache_dir = get_cache_dir()
    service = TwitchDropsService(storage_dir=storage_dir)

    def _login_listener(win):
        print("[TwitchLogin] Cửa sổ đăng nhập Twitch đã mở, đang đợi hoàn tất...")
        for i in range(360):  # Đợi tối đa 6 phút
            time.sleep(1.5)
            try:
                curr_url = ""
                try:
                    curr_url = win.get_current_url() or ""
                except Exception:
                    pass

                # Khi người dùng đã đăng nhập, URL sẽ chuyển về trang chủ hoặc channel (không còn login)
                is_logged_in_url = "twitch.tv" in curr_url and "/login" not in curr_url and "passport.twitch.tv" not in curr_url

                if is_logged_in_url or i % 3 == 0:
                    cookies = win.get_cookies()
                    token = None
                    for c in cookies:
                        s = str(c)
                        if "auth-token=" in s:
                            for part in s.split(";"):
                                part = part.strip()
                                if "auth-token=" in part:
                                    token = part.split("auth-token=")[-1].strip()
                                    break
                        if token:
                            break

                    if token and len(token) > 10:
                        print(f"[TwitchLogin] Nhận diện thành công auth-token! Độ dài: {len(token)}")
                        with service._lock:
                            service.auth_token = token
                            service.client_id = "kimne78kx3ncx6brgo4mv6wki5h1ko"
                            service.oauth_state["status"] = "idle"
                            service.oauth_state["user_code"] = ""
                            service.oauth_state["error_message"] = ""
                            service._save_config()
                        try:
                            service.validate_token()
                        except Exception:
                            pass
                        time.sleep(0.5)
                        try:
                            win.destroy()
                        except Exception:
                            pass
                        return
            except Exception as e:
                pass
        # Timeout
        try:
            win.destroy()
        except Exception:
            pass

    login_win = webview.create_window(
        title="FEΔR - Đăng Nhập Twitch Trực Tiếp",
        url="https://www.twitch.tv/login",
        width=460,
        height=720,
        resizable=True,
        shadow=True,
        background_color="#0e0e10"
    )
    apply_dark_titlebar(login_win)
    webview.start(_login_listener, login_win, private_mode=False, storage_path=cache_dir)
    sys.exit(0)

def main():
    if not verify_signature():
        show_access_denied_and_exit()
        return

    if "--login" in sys.argv:
        run_twitch_login_window()
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

    target_url = f"file:///{os.path.abspath(html_file).replace(os.sep, '/')}"
    api = TwitchPluginApi()

    global _window
    _window = webview.create_window(
        title="FEΔR - AION 2 Twitch Drops Miner",
        url=target_url,
        js_api=api,
        width=500,
        height=680,
        resizable=False,
        frameless=False,
        easy_drag=True,
        shadow=True,
        background_color="#04060a"
    )

    apply_dark_titlebar(_window)
    cache_dir = get_cache_dir()
    webview.start(debug=False, private_mode=False, storage_path=cache_dir)

if __name__ == "__main__":
    main()
