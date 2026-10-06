"""
AION 2 STANDALONE MOD MANAGER GUI
Developed by Team FEΔR / SrymC
Python Backend + Modern Vue 3 / Naive UI Frontend (pywebview + WebView2)
Robust, High-Performance, Zero-Hang Architecture.
"""
import os
import sys
import json
import time
import shutil
import threading
import re
import hashlib
import tempfile
import urllib.request
import urllib.error
import winreg
import webbrowser
import webview
from twitch_drops_service import TwitchDropsService

# Security & Update Configuration
CURRENT_VERSION = "1.1.0"
SECURITY_KEY = "fearAion2Tran-key"
SECURITY_KEY_HASH = "4eb733f752b4f4e3f25fcde3424c38f92435721355b8c981e1e773164126da90"
GITHUB_REPO = "srymcfear/Aion2Viet"
RELEASE_URL = f"https://github.com/{GITHUB_REPO}/releases"
API_RELEASE_URL = f"https://api.github.com/repos/{GITHUB_REPO}/releases/latest"

def is_webview2_installed():
    if sys.platform != "win32":
        return True
    subkeys = [
        r"SOFTWARE\WOW6432Node\Microsoft\EdgeUpdate\Clients\{F3017226-FE2A-4295-8BDF-00C3A9A7E4C5}",
        r"SOFTWARE\Microsoft\EdgeUpdate\Clients\{F3017226-FE2A-4295-8BDF-00C3A9A7E4C5}",
        r"Software\Microsoft\EdgeUpdate\Clients\{F3017226-FE2A-4295-8BDF-00C3A9A7E4C5}"
    ]
    for root in [winreg.HKEY_LOCAL_MACHINE, winreg.HKEY_CURRENT_USER]:
        for subkey in subkeys:
            try:
                with winreg.OpenKey(root, subkey) as key:
                    pv, _ = winreg.QueryValueEx(key, "pv")
                    if pv and str(pv).strip() not in ["", "0", "0.0.0.0"]:
                        return True
            except Exception:
                pass
    return False

def get_app_storage_dir():
    # ProgramData (C:\ProgramData\FEAR\Aion2_Tools) is the primary root for all data, cache, and plugins
    pdata = os.environ.get("ProgramData", r"C:\ProgramData")
    base_dir = os.path.join(pdata, "FEAR", "Aion2_Tools")
    try:
        os.makedirs(base_dir, exist_ok=True)
    except Exception:
        local_app_data = os.environ.get("LOCALAPPDATA")
        if local_app_data and os.path.isdir(local_app_data):
            base_dir = os.path.join(local_app_data, "FEAR", "Aion2_Tools")
        else:
            base_dir = os.path.join(os.path.expanduser("~"), ".fear_aion2")
        os.makedirs(base_dir, exist_ok=True)
    return base_dir

def get_cache_dir():
    cache_dir = os.path.join(get_app_storage_dir(), "Cache")
    os.makedirs(cache_dir, exist_ok=True)
    return cache_dir

def get_updates_dir():
    updates_dir = os.path.join(get_app_storage_dir(), "Updates")
    os.makedirs(updates_dir, exist_ok=True)
    return updates_dir

def get_plugins_dir():
    plugins_dir = os.path.join(get_app_storage_dir(), "plugins")
    os.makedirs(plugins_dir, exist_ok=True)
    return plugins_dir

def get_dps_plugin_dir():
    dps_dir = os.path.join(get_plugins_dir(), "dps_meter")
    os.makedirs(dps_dir, exist_ok=True)
    return dps_dir

def is_game_running():
    try:
        import subprocess
        out = subprocess.check_output(
            ["tasklist", "/FI", "IMAGENAME eq Aion2*", "/FO", "CSV", "/NH"],
            creationflags=0x08000000,
            text=True,
            timeout=3
        )
        return "Aion2" in out
    except Exception:
        return False

def parse_semver(s):
    nums = [int(x) for x in re.findall(r'\d+', str(s))]
    while len(nums) < 3:
        nums.append(0)
    return tuple(nums[:3])

def is_newer_version(remote_v, local_v):
    return parse_semver(remote_v) > parse_semver(local_v)

SECURITY_VER_KEY = "fearAion2Tran-ver"

def parse_release_security(body_text):
    status = "active"
    message = "Hệ thống hoạt động bình thường"
    req_ver = None
    if not body_text:
        return status, message, req_ver
    
    # 1. JSON block check
    json_match = re.search(r'\{[^{}]*(?:"key"\s*:\s*"fearAion2Tran-key"|"ver"\s*:|"fearAion2Tran-ver"\s*:)[^{}]*\}', body_text)
    if json_match:
        try:
            d = json.loads(json_match.group(0))
            if d.get("status") in ["active", "baotri", "lock"]:
                status = d["status"]
                message = d.get("message", message)
            v = d.get("ver") or d.get("fearAion2Tran-ver")
            if v:
                req_ver = str(v).strip().lstrip("v")
            return status, message, req_ver
        except Exception:
            pass

    # 2. Tag check: fearAion2Tran-key:(active|baotri|lock)
    m = re.search(r'fearAion2Tran-key\s*:\s*(active|baotri|lock)(?::([^\r\n]+))?', body_text, re.IGNORECASE)
    if m:
        st = m.group(1).lower()
        msg = m.group(2).strip() if m.group(2) else ""
        if st == "baotri":
            msg = msg or "Hệ thống đang bảo trì, vui lòng quay lại sau."
        elif st == "lock":
            msg = msg or "Công cụ đã bị khóa bởi tác giả."
        status, message = st, msg

    # 3. Version tag check: fearAion2Tran-ver:([0-9\.]+)
    mv = re.search(r'fearAion2Tran-ver\s*:\s*v?([0-9\.]+)', body_text, re.IGNORECASE)
    if mv:
        req_ver = mv.group(1).strip()

    return status, message, req_ver

# Force UTF-8 encoding on Windows to prevent Unicode charmap encoding freezes
if sys.platform == "win32":
    try:
        sys.stdout.reconfigure(encoding="utf-8", errors="replace")
        sys.stderr.reconfigure(encoding="utf-8", errors="replace")
    except Exception:
        pass

def is_admin():
    if sys.platform != "win32":
        return True
    try:
        import ctypes
        return ctypes.windll.shell32.IsUserAnAdmin() != 0
    except Exception:
        return False

def ensure_admin():
    if sys.platform != "win32" or is_admin():
        return True
    import ctypes
    try:
        if getattr(sys, 'frozen', False):
            executable = sys.executable
            params = " ".join([f'"{arg}"' for arg in sys.argv[1:]])
        else:
            executable = sys.executable
            params = " ".join([f'"{arg}"' for arg in sys.argv])
        ret = ctypes.windll.shell32.ShellExecuteW(None, "runas", executable, params, None, 1)
        if int(ret) > 32:
            sys.exit(0)
    except Exception as e:
        print(f"Failed to elevate privileges: {e}")
    return False

def get_bundle_dir():
    if getattr(sys, 'frozen', False) and hasattr(sys, '_MEIPASS'):
        return sys._MEIPASS
    return ROOT_DIR

def get_data_dir():
    b_dir = get_bundle_dir()
    d1 = os.path.join(b_dir, "Data")
    if os.path.isdir(d1):
        return d1
    d2 = os.path.join(ROOT_DIR, "release", "AION2_VietHoa_Standalone", "Data")
    if os.path.isdir(d2):
        return d2
    return os.path.join(ROOT_DIR, "Data")

def get_gui_html_path():
    b_dir = get_bundle_dir()
    p1 = os.path.join(b_dir, "gui", "dist", "index.html")
    if os.path.isfile(p1):
        return p1
    p2 = os.path.join(ROOT_DIR, "gui", "dist", "index.html")
    if os.path.isfile(p2):
        return p2
    p3 = os.path.join(ROOT_DIR, "prototypes", "demo2_modern_obsidian.html")
    if os.path.isfile(p3):
        return p3
    return None

def get_twitch_window_html_path():
    b_dir = get_bundle_dir()
    p1 = os.path.join(b_dir, "twitch_drops_window.html")
    if os.path.isfile(p1):
        return p1
    p2 = os.path.join(ROOT_DIR, "twitch_drops_window.html")
    if os.path.isfile(p2):
        return p2
    p3 = os.path.join(ROOT_DIR, "prototypes", "twitch_drops_demo3_game_hud.html")
    if os.path.isfile(p3):
        return p3
    return None

ROOT_DIR = os.path.dirname(os.path.abspath(__file__))
DUMMY_PAK_BYTES = bytes([0x47, 0x55, 0x20, 0x32, 0x30, 0x32, 0x36, 0x30, 0x39, 0x32, 0x39, 0x31, 0x37, 0x35, 0x37])

_main_window = None
_dps_window = None
_twitch_window = None
_dps_process = None
_dps_meter_process = None

def is_npcap_installed():
    sys32 = os.path.join(os.environ.get("SystemRoot", r"C:\Windows"), "System32")
    return (os.path.isfile(os.path.join(sys32, "wpcap.dll")) or 
            os.path.isfile(os.path.join(sys32, "Npcap", "wpcap.dll")))

def sync_dps_meter_plugin():
    """
    Deploys and synchronizes the DPS Meter plugin into C:\\ProgramData\\FEAR\\Aion2_Tools\\plugins\\dps_meter.
    Returns the absolute path to AionDpsMeter.UI.exe inside the plugin folder.
    """
    target_plugin_dir = get_dps_plugin_dir()
    target_exe = os.path.join(target_plugin_dir, "AionDpsMeter.UI.exe")
    
    # 1. Search for source publish files to sync
    b_dir = get_bundle_dir()
    candidates = [
        os.path.join(b_dir, "dps_meter"),
        os.path.join(ROOT_DIR, "dps_meter"),
        os.path.join(ROOT_DIR, "dps_core_src", "publish")
    ]
    source_dir = None
    for c in candidates:
        if os.path.isdir(c) and os.path.isfile(os.path.join(c, "AionDpsMeter.UI.exe")):
            source_dir = c
            break

    if source_dir:
        src_exe = os.path.join(source_dir, "AionDpsMeter.UI.exe")
        should_sync = False
        if not os.path.isfile(target_exe):
            should_sync = True
        else:
            try:
                if os.path.getmtime(src_exe) > os.path.getmtime(target_exe):
                    should_sync = True
            except Exception:
                pass

        if should_sync:
            try:
                for item in os.listdir(source_dir):
                    s = os.path.join(source_dir, item)
                    d = os.path.join(target_plugin_dir, item)
                    if os.path.isdir(s):
                        os.makedirs(d, exist_ok=True)
                        for sub_root, _, sub_files in os.walk(s):
                            rel_path = os.path.relpath(sub_root, s)
                            dest_sub = os.path.join(d, rel_path) if rel_path != "." else d
                            os.makedirs(dest_sub, exist_ok=True)
                            for f in sub_files:
                                sf = os.path.join(sub_root, f)
                                df = os.path.join(dest_sub, f)
                                if not os.path.isfile(df) or os.path.getmtime(sf) > os.path.getmtime(df):
                                    shutil.copy2(sf, df)
                    else:
                        # Avoid overwriting user database or custom config if already present
                        if item in ["combat-history.db", "appsettings.user.json"] and os.path.isfile(d):
                            continue
                        if not os.path.isfile(d) or os.path.getmtime(s) > os.path.getmtime(d):
                            shutil.copy2(s, d)
            except Exception as e:
                print(f"[WARN] Error deploying DPS meter plugin: {e}")

    # 2. Ensure plugin manifest plugin.json is present
    manifest_path = os.path.join(target_plugin_dir, "plugin.json")
    if not os.path.isfile(manifest_path):
        try:
            manifest_info = {
                "id": "aion2_dps_meter",
                "name": "AION 2 DPS Meter",
                "version": "1.0.0",
                "type": "plugin",
                "author": "FEΔR",
                "entry": "AionDpsMeter.UI.exe",
                "description": "Plugin đo lường DPS, Party Tracking, Combat History và phân tích kỹ năng chuẩn gốc cho AION 2.",
                "storage": target_plugin_dir
            }
            with open(manifest_path, "w", encoding="utf-8") as mf:
                json.dump(manifest_info, mf, ensure_ascii=False, indent=2)
        except Exception:
            pass

    if os.path.isfile(target_exe):
        return target_exe

    # Fallback to local dev path if somehow target_exe is missing
    local_path = os.path.join(ROOT_DIR, "dps_meter", "AionDpsMeter.UI.exe")
    if os.path.isfile(local_path):
        return local_path

    return None

def get_dps_meter_executable():
    return sync_dps_meter_plugin()

class ModApi:
    def __init__(self):
        self._lock = threading.Lock()
        self.state = {
            "gameDir": "",
            "isInstalled": False,
            "isBusy": False,
            "progressPct": 0,
            "progressStep": "Sẵn sàng",
            "newLogs": []
        }
        self.security_info = {
            "key": SECURITY_KEY,
            "status": "active",
            "message": "Đã xác thực bản quyền FEAR (Active)",
            "currentVersion": CURRENT_VERSION,
            "latestVersion": CURRENT_VERSION,
            "hasUpdate": False,
            "releaseUrl": RELEASE_URL,
            "downloadUrl": None,
            "changelog": "",
            "lastChecked": None,
            "isChecking": False
        }
        self.verify_code_integrity()
        self.twitch_service = TwitchDropsService(
            storage_dir=get_app_storage_dir(),
            log_callback=self.log
        )

        # Initial detection in background thread so window opens instantly
        def _bg_scan():
            detected = self.detect_game_dir()
            installed = self.check_is_installed(detected)
            with self._lock:
                self.state["gameDir"] = detected
                self.state["isInstalled"] = installed
            if detected:
                self.log(f"Đã nhận diện thư mục AION 2: {detected}", "blue")
            else:
                self.log("Vui lòng chọn thư mục cài đặt AION 2 nếu chưa tự động nhận diện.", "gray")
            self.log("Hệ thống sẵn sàng.", "success")

        threading.Thread(target=_bg_scan, daemon=True).start()
        threading.Thread(target=self._check_update_task, daemon=True).start()

    def verify_code_integrity(self):
        calculated_hash = hashlib.sha256(SECURITY_KEY.encode()).hexdigest()
        if calculated_hash != SECURITY_KEY_HASH:
            self.security_info["status"] = "lock"
            self.security_info["message"] = "CẢNH BÁO: Chữ ký bảo mật mã nguồn không hợp lệ!"
            self.log("❌ LỖI BẢO MẬT: Chữ ký phần mềm bị can thiệp trái phép.", "red")
            return False
        return True

    def _check_update_task(self):
        with self._lock:
            if self.security_info["isChecking"]:
                return
            self.security_info["isChecking"] = True

        try:
            req = urllib.request.Request(
                API_RELEASE_URL,
                headers={"User-Agent": f"F-Aion-2-Tools/{CURRENT_VERSION}"}
            )
            with urllib.request.urlopen(req, timeout=5) as resp:
                if resp.status == 200:
                    data = json.loads(resp.read().decode("utf-8"))
                    tag = str(data.get("tag_name", "")).strip()
                    body = str(data.get("body", ""))
                    html_url = data.get("html_url", RELEASE_URL)
                    
                    sec_status, sec_msg, req_ver = parse_release_security(body)
                    
                    download_url = None
                    for asset in data.get("assets", []):
                        if asset.get("name", "").lower().endswith(".exe"):
                            download_url = asset.get("browser_download_url")
                            break
                    
                    # Prioritize fearAion2Tran-ver if present in release notes, otherwise tag name
                    remote_ver = req_ver or tag.lstrip("v")
                    has_upd = is_newer_version(remote_ver, CURRENT_VERSION)
                    
                    with self._lock:
                        self.security_info["status"] = sec_status
                        self.security_info["message"] = sec_msg
                        self.security_info["latestVersion"] = remote_ver or CURRENT_VERSION
                        self.security_info["hasUpdate"] = has_upd
                        self.security_info["requiredVer"] = req_ver
                        self.security_info["releaseUrl"] = html_url
                        self.security_info["downloadUrl"] = download_url
                        self.security_info["changelog"] = body
                        self.security_info["lastChecked"] = time.strftime("%H:%M:%S")
                        self.security_info["isChecking"] = False

                    if has_upd:
                        self.log(f"🔔 YÊU CẦU CẬP NHẬT: Đã có phiên bản v{remote_ver} (Hiện tại: v{CURRENT_VERSION}). Vui lòng cập nhật phần mềm!", "blue")
                    else:
                        self.log("✔ Đang sử dụng phiên bản mới nhất.", "success")
                    return
        except urllib.error.HTTPError as e:
            with self._lock:
                if e.code == 404:
                    self.security_info["message"] = "Trạng thái: Hoạt động (Chưa phát hành bản mới trên GitHub)"
                else:
                    self.security_info["message"] = f"Phản hồi từ máy chủ: HTTP {e.code}"
                self.security_info["lastChecked"] = time.strftime("%H:%M:%S")
                self.security_info["isChecking"] = False
        except Exception:
            with self._lock:
                self.security_info["message"] = "Trạng thái: Hoạt động (Chế độ ngoại tuyến)"
                self.security_info["lastChecked"] = time.strftime("%H:%M:%S")
                self.security_info["isChecking"] = False

    def check_update(self):
        threading.Thread(target=self._check_update_task, daemon=True).start()
        with self._lock:
            return dict(self.security_info)

    def get_security_info(self):
        with self._lock:
            return dict(self.security_info)

    def open_release_url(self, url=None):
        target = url or self.security_info.get("releaseUrl") or RELEASE_URL
        try:
            webbrowser.open(target)
        except Exception as e:
            self.log(f"Lỗi mở link: {e}", "red")
        return True

    def download_update(self):
        download_url = self.security_info.get("downloadUrl")
        if not download_url:
            return self.open_release_url()

        with self._lock:
            if self.state["isBusy"]:
                return False
            self.state["isBusy"] = True

        def _down():
            try:
                self.log("Bắt đầu tải bản cập nhật...", "blue")
                self.update_progress(5, "Đang kết nối máy chủ tải về...")
                req = urllib.request.Request(
                    download_url,
                    headers={"User-Agent": f"F-Aion-2-Tools/{CURRENT_VERSION}"}
                )
                with urllib.request.urlopen(req, timeout=30) as resp:
                    total_size = int(resp.headers.get("content-length", 0))
                    downloaded = 0
                    updates_dir = get_updates_dir()
                    new_file_name = f"F-Aion_2_Tools_v{self.security_info['latestVersion']}.exe"
                    dest_path = os.path.join(updates_dir, new_file_name)

                    with open(dest_path, "wb") as f:
                        while True:
                            chunk = resp.read(64 * 1024)
                            if not chunk:
                                break
                            f.write(chunk)
                            downloaded += len(chunk)
                            if total_size > 0:
                                pct = int((downloaded / total_size) * 90) + 5
                                self.update_progress(pct, f"Đang tải: {downloaded // 1024} KB / {total_size // 1024} KB ({pct}%)")

                self.update_progress(98, "Đang chuẩn bị tự động cài đặt...")
                self.log(f"✔ Đã tải xong bản mới: v{self.security_info['latestVersion']}", "success")

                # In-place auto update: Replace current running .exe at user's location
                if getattr(sys, "frozen", False):
                    target_exe = os.path.abspath(sys.executable)
                    self.log(f"Tự động cập nhật vào vị trí hiện tại: {target_exe}", "blue")

                    old_bak = target_exe + ".bak"
                    try:
                        if os.path.isfile(old_bak):
                            os.remove(old_bak)
                        os.rename(target_exe, old_bak)
                        shutil.copy2(dest_path, target_exe)
                    except Exception:
                        pass

                    updater_bat = os.path.join(tempfile.gettempdir(), f"fear_updater_{os.getpid()}.bat")
                    bat_content = f"""@echo off
chcp 65001 >nul
setlocal
set "TARGET={target_exe}"
set "SOURCE={dest_path}"
set "BAK={old_bak}"

timeout /t 1 /nobreak >nul
for /l %%i in (1,1,20) do (
    if exist "%BAK%" del /f /q "%BAK%" >nul 2>&1
    del /f /q "%TARGET%" >nul 2>&1
    if not exist "%TARGET%" goto :copy_new
    timeout /t 1 /nobreak >nul
)

:copy_new
copy /y "%SOURCE%" "%TARGET%" >nul 2>&1
if exist "%TARGET%" (
    start "" "%TARGET%"
)
if exist "%BAK%" del /f /q "%BAK%" >nul 2>&1
del "%~f0" >nul 2>&1
exit
"""
                    try:
                        with open(updater_bat, "w", encoding="utf-8", errors="ignore") as bf:
                            bf.write(bat_content)
                    except Exception:
                        pass

                    self.update_progress(100, "Cập nhật thành công! Đang khởi động lại...")
                    self.log("Khởi động lại phần mềm phiên bản mới...", "success")
                    time.sleep(1)

                    import subprocess
                    subprocess.Popen(
                        ["cmd.exe", "/c", updater_bat],
                        creationflags=0x08000000 | 0x00000200,
                        close_fds=True
                    )
                else:
                    self.update_progress(100, "Tải bản mới thành công!")
                    self.log(f"Môi trường Dev: Khởi chạy file vừa tải tại {dest_path}", "blue")
                    time.sleep(1)
                    os.startfile(dest_path)

                with self._lock:
                    self.state["isBusy"] = False
                self.close_window()
            except Exception as e:
                self.log(f"Lỗi tải cập nhật: {e}", "red")
                self.update_progress(0, "Lỗi tải cập nhật")
                with self._lock:
                    self.state["isBusy"] = False

        threading.Thread(target=_down, daemon=True).start()
        return True

    def show_window(self):
        return True

    def minimize_window(self):
        global _main_window
        def _min():
            time.sleep(0.02)
            if _main_window:
                try:
                    _main_window.minimize()
                except Exception:
                    pass
        threading.Thread(target=_min, daemon=True).start()
        return True

    def close_window(self):
        global _main_window
        def _close():
            time.sleep(0.02)
            self.stop_dps_daemon()
            self.close_dps_window()
            self.close_twitch_window()
            try:
                if hasattr(self, 'twitch_service'):
                    self.twitch_service.stop()
            except Exception:
                pass
            if _main_window:
                try:
                    _main_window.destroy()
                except Exception:
                    pass
            os._exit(0)
        threading.Thread(target=_close, daemon=True).start()
        return True

    def launch_dps_meter(self):
        global _dps_meter_process
        if _dps_meter_process and _dps_meter_process.poll() is None:
            self.log("AION 2 DPS Meter đang hoạt động.", "blue")
            return True

        if not is_npcap_installed():
            self.log("⚠️ Lưu ý: Chưa phát hiện Npcap trên hệ thống. Cần cài Npcap (WinPcap mode) để bắt gói tin mạng.", "gray")

        dps_exe = get_dps_meter_executable()
        if not dps_exe or not os.path.isfile(dps_exe):
            self.log(f"❌ Không tìm thấy plugin AionDpsMeter.UI.exe tại {get_dps_plugin_dir()}.", "red")
            return False

        try:
            import subprocess
            dps_dir = os.path.dirname(dps_exe)
            _dps_meter_process = subprocess.Popen(
                [dps_exe, "--fear-launcher", SECURITY_KEY_HASH],
                cwd=dps_dir
            )
            self.log(f"✔ Đã kích hoạt Plugin AION 2 DPS Meter (Vị trí: {dps_dir}).", "success")
            return True
        except Exception as e:
            self.log(f"Lỗi khởi chạy Plugin AION 2 DPS Meter: {e}", "red")
            return False

    def stop_dps_meter(self):
        global _dps_meter_process
        if _dps_meter_process and _dps_meter_process.poll() is None:
            try:
                _dps_meter_process.terminate()
            except Exception:
                pass
            _dps_meter_process = None
        return True

    def launch_dps_overlay(self):
        return self.launch_dps_meter()

    def set_dps_always_on_top(self, is_on_top):
        global _dps_window
        if _dps_window:
            try:
                _dps_window.on_top = bool(is_on_top)
            except Exception:
                pass
        return True

    def minimize_dps_window(self):
        global _dps_window
        if _dps_window:
            try:
                _dps_window.minimize()
            except Exception:
                pass
        return True

    def close_dps_window(self):
        global _dps_window
        if _dps_window:
            try:
                _dps_window.destroy()
            except Exception:
                pass
            _dps_window = None
        return True

    # ------------------------------------------------------------------
    # Twitch Drops Miner Plugin APIs (Team FEΔR)
    # ------------------------------------------------------------------
    def get_twitch_drops_status(self):
        return self.twitch_service.get_status()

    def set_twitch_auth_token(self, token):
        return self.twitch_service.set_auth_token(token)

    def set_twitch_auto_claim(self, enabled):
        return self.twitch_service.set_auto_claim(enabled)

    def start_twitch_miner(self):
        return self.twitch_service.start()

    def stop_twitch_miner(self):
        return self.twitch_service.stop()

    def claim_twitch_drop(self, drop_instance_id, drop_name="Item"):
        return self.twitch_service.claim_drop_manual(drop_instance_id, drop_name)

    def start_twitch_oauth(self):
        return self.twitch_service.start_oauth_login(auto_open_browser=True)

    def get_twitch_oauth_status(self):
        return self.twitch_service.get_oauth_status()

    def open_twitch_inventory(self):
        import webbrowser
        try:
            webbrowser.open("https://www.twitch.tv/drops/inventory")
            return True
        except Exception:
            return False

    def launch_twitch_window(self):
        global _twitch_window
        if _twitch_window:
            try:
                _twitch_window.restore()
                _twitch_window.show()
                return True
            except Exception:
                _twitch_window = None

        html_path = get_twitch_window_html_path()
        if not html_path or not os.path.isfile(html_path):
            self.log("Không tìm thấy file giao diện twitch_drops_window.html", "red")
            return False

        target_url = f"file:///{os.path.abspath(html_path).replace(os.sep, '/')}"
        try:
            _twitch_window = webview.create_window(
                title="FEΔR - AION 2 Twitch Drops Miner",
                url=target_url,
                js_api=self,
                width=500,
                height=640,
                resizable=False,
                frameless=True,
                easy_drag=False,
                shadow=True,
                background_color="#04060a"
            )
            return True
        except Exception as e:
            self.log(f"Lỗi khởi chạy cửa sổ Twitch Drops: {e}", "red")
            return False

    def close_twitch_window(self):
        global _twitch_window
        if _twitch_window:
            try:
                _twitch_window.destroy()
            except Exception:
                pass
            _twitch_window = None
        return True

    def minimize_twitch_window(self):
        global _twitch_window
        if _twitch_window:
            try:
                _twitch_window.minimize()
            except Exception:
                pass
        return True

    def set_twitch_always_on_top(self, is_on_top):
        global _twitch_window
        if _twitch_window:
            try:
                _twitch_window.on_top = bool(is_on_top)
            except Exception:
                pass
        return True

    def resize_twitch_window(self, width, height):
        global _twitch_window
        if _twitch_window:
            try:
                _twitch_window.resize(int(width), int(height))
            except Exception:
                pass
        return True

    def move_twitch_window(self, x, y):
        global _twitch_window
        if _twitch_window:
            try:
                _twitch_window.move(int(x), int(y))
            except Exception:
                pass
        return True

    def start_dps_daemon(self):
        global _dps_process
        if _dps_process and _dps_process.poll() is None:
            return True

        b_dir = get_bundle_dir()
        daemon_paths = [
            os.path.join(b_dir, "dps_daemon", "publish", "Aion2DpsDaemon.exe"),
            os.path.join(b_dir, "Aion2DpsDaemon.exe"),
            os.path.join(ROOT_DIR, "dps_daemon", "publish", "Aion2DpsDaemon.exe"),
            os.path.join(ROOT_DIR, "dps_daemon", "bin", "Release", "net10.0", "win-x64", "Aion2DpsDaemon.exe"),
            os.path.join(ROOT_DIR, "dps_daemon", "bin", "Release", "net10.0", "Aion2DpsDaemon.exe"),
            os.path.join(ROOT_DIR, "dps_daemon", "bin", "Debug", "net10.0", "Aion2DpsDaemon.exe"),
            os.path.join(ROOT_DIR, "Aion2DpsDaemon.exe")
        ]
        daemon_exe = None
        for p in daemon_paths:
            if os.path.isfile(p):
                daemon_exe = p
                break

        if not daemon_exe:
            self.log("Chưa tìm thấy file Aion2DpsDaemon.exe. Sử dụng chế độ mô phỏng.", "gray")
            return False

        try:
            import subprocess
            _dps_process = subprocess.Popen(
                [daemon_exe],
                cwd=os.path.dirname(daemon_exe),
                creationflags=0x08000000 | 0x00000200
            )
            self.log("Daemon bắt gói tin AION 2 (Npcap C#) đã kích hoạt ngầm.", "success")
            return True
        except Exception as e:
            self.log(f"Lỗi khởi động DPS Daemon: {e}", "red")
            return False

    def stop_dps_daemon(self):
        global _dps_process
        if _dps_process:
            try:
                _dps_process.terminate()
            except Exception:
                pass
            _dps_process = None
        return True

    def open_github(self):
        try:
            webbrowser.open("https://github.com/srymcfear")
        except Exception as e:
            self.log(f"Lỗi mở link: {e}", "red")
        return True

    def open_url(self, url):
        try:
            target = str(url).strip()
            if target.startswith("http://") or target.startswith("https://"):
                webbrowser.open(target)
                return True
        except Exception as e:
            self.log(f"Lỗi mở link: {e}", "red")
        return False

    def open_hub_web(self):
        return self.open_url("https://aion2-hub-bice.vercel.app/")

    def log(self, message, msg_type=""):
        with self._lock:
            self.state["newLogs"].append({
                "time": time.strftime("%H:%M:%S"),
                "text": str(message),
                "type": msg_type
            })

    def update_progress(self, percent, step_text):
        with self._lock:
            self.state["progressPct"] = percent
            self.state["progressStep"] = step_text

    def update_state(self, is_installed):
        with self._lock:
            self.state["isInstalled"] = is_installed
            self.state["isBusy"] = False

    def detect_game_dir(self):
        # 1. Fast check known path
        if os.path.isdir(r"F:\NCSoft\AION 2\Aion2"):
            return r"F:\NCSoft\AION 2"

        # 2. Check Registry
        reg_keys = [
            (winreg.HKEY_LOCAL_MACHINE, r"SOFTWARE\WOW6432Node\plaync\A2_WW_L_GA_PURPLE"),
            (winreg.HKEY_LOCAL_MACHINE, r"SOFTWARE\WOW6432Node\plaync\A2_TW_L_GA_PURPLE"),
            (winreg.HKEY_CURRENT_USER, r"Software\plaync\A2_WW_L_GA_PURPLE"),
            (winreg.HKEY_CURRENT_USER, r"Software\plaync\A2_TW_L_GA_PURPLE")
        ]
        for root_key, subkey in reg_keys:
            try:
                with winreg.OpenKey(root_key, subkey) as key:
                    val, _ = winreg.QueryValueEx(key, "BaseDir")
                    if val and os.path.isdir(val) and os.path.isdir(os.path.join(val, "Aion2")):
                        return os.path.normpath(val)
            except Exception:
                pass

        # 3. Check popular local paths only (avoid scanning offline network drives)
        for drive in ["C:\\", "D:\\", "E:\\", "F:\\", "G:\\"]:
            if os.path.exists(drive):
                for sub in ["NCSoft\\AION 2", "NCSoft\\AION2_TW", "Games\\AION 2", "Program Files\\NCSoft\\AION 2"]:
                    full = os.path.join(drive, sub)
                    if os.path.isdir(full) and os.path.isdir(os.path.join(full, "Aion2")):
                        return os.path.normpath(full)

        return ""

    def check_is_installed(self, game_dir):
        if not game_dir or not os.path.isdir(game_dir):
            return False

        loose_dat = os.path.join(game_dir, "Aion2", "Content", "L10N", "Text", "en-US", "L10NString.dat")
        pak_file = os.path.join(game_dir, "Aion2", "Content", "Paks", "L10N", "Text", "en-US", "pakchunk502000-Windows_0_P.pak")

        if os.path.isfile(loose_dat) and os.path.isfile(pak_file):
            try:
                if os.path.getsize(pak_file) == 15 and os.path.getsize(loose_dat) > 1024 * 1024:
                    return True
            except Exception:
                pass
        return False

    def get_status(self):
        with self._lock:
            logs = list(self.state["newLogs"])
            self.state["newLogs"].clear()
            return {
                "gameDir": self.state["gameDir"],
                "isInstalled": self.state["isInstalled"],
                "isBusy": self.state["isBusy"],
                "progressPct": self.state["progressPct"],
                "progressStep": self.state["progressStep"],
                "logs": logs,
                "securityInfo": dict(self.security_info)
            }

    def browse_folder(self):
        global _main_window
        chosen_dir = None
        try:
            if _main_window:
                initial = self.state["gameDir"] if (self.state["gameDir"] and os.path.isdir(self.state["gameDir"])) else ""
                res = _main_window.create_file_dialog(webview.FileDialog.FOLDER, directory=initial)
                if res and len(res) > 0:
                    chosen_dir = res[0]
        except Exception as e:
            self.log(f"Lỗi mở hộp thoại: {e}", "red")

        if chosen_dir and os.path.isdir(chosen_dir):
            chosen = os.path.normpath(chosen_dir)
            installed = self.check_is_installed(chosen)
            with self._lock:
                self.state["gameDir"] = chosen
                self.state["isInstalled"] = installed
            self.log(f"Đã chọn đường dẫn: {chosen}", "blue")
            return {"gameDir": chosen, "isInstalled": installed}

        return {"gameDir": self.state["gameDir"], "isInstalled": self.state["isInstalled"]}

    def scan_game(self):
        self.log("Bắt đầu quét tự động Registry và ổ đĩa...", "blue")
        detected = self.detect_game_dir()
        installed = self.check_is_installed(detected)
        with self._lock:
            self.state["gameDir"] = detected
            self.state["isInstalled"] = installed
        if detected:
            self.log(f"Đã tìm thấy game AION 2 tại: {detected}", "success")
        else:
            self.log("Không tìm thấy game AION 2. Vui lòng bấm 'Chọn thư mục'.", "red")
        return {"gameDir": detected, "isInstalled": installed}

    def install_mod(self, game_dir):
        if self.security_info.get("status") == "lock":
            self.log("❌ LỖI BẢO MẬT: Công cụ đã bị KHÓA bởi nhà phát triển!", "red")
            return False
        if self.security_info.get("status") == "baotri":
            self.log("⚠ BẢO TRÌ: Hệ thống đang tạm dừng để bảo trì!", "red")
            return False

        with self._lock:
            if self.state["isBusy"]:
                return False
            self.state["isBusy"] = True

        def _install_thread():
            try:
                target_dir = game_dir or self.state["gameDir"]
                if not target_dir or not os.path.isdir(target_dir):
                    self.log("LỖI: Đường dẫn game không tồn tại!", "red")
                    self.update_progress(0, "Lỗi đường dẫn")
                    return

                if is_game_running():
                    self.log("❌ Game AION 2 đang chạy! Vui lòng thoát game trước khi tiếp tục.", "red")
                    self.update_progress(0, "Game đang chạy")
                    return

                self.log(f">>> BẮT ĐẦU CÀI ĐẶT VIỆT HÓA TẠI: {target_dir}", "blue")
                self.update_progress(15, "[1/4] Sao lưu file pak gốc (.official_clean_bak)...")

                # Clean old mods
                old_mod_pak = os.path.join(target_dir, "Aion2", "Content", "Paks", "pakchunk502000-Windows_999_P.pak")
                if os.path.isfile(old_mod_pak):
                    try: os.remove(old_mod_pak)
                    except Exception: pass

                mods_folder = os.path.join(target_dir, "Aion2", "Content", "Paks", "~mods")
                if os.path.isdir(mods_folder):
                    try: shutil.rmtree(mods_folder, ignore_errors=True)
                    except Exception: pass

                data_dir = get_data_dir()

                # 1. en-US
                en_pak_dir = os.path.join(target_dir, "Aion2", "Content", "Paks", "L10N", "Text", "en-US")
                en_loose_dir = os.path.join(target_dir, "Aion2", "Content", "L10N", "Text", "en-US")
                if os.path.isdir(en_pak_dir):
                    base_pak = os.path.join(en_pak_dir, "pakchunk502000-Windows_0_P.pak")
                    bak_pak = os.path.join(en_pak_dir, "pakchunk502000-Windows_0_P.pak.official_clean_bak")
                    bak_valid = os.path.isfile(bak_pak) and os.path.getsize(bak_pak) > 1024 * 1024
                    if os.path.isfile(base_pak) and not bak_valid and os.path.getsize(base_pak) > 1024 * 1024:
                        shutil.copy2(base_pak, bak_pak)
                        self.log("Sao lưu file pak gốc en-US thành công.", "success")

                    time.sleep(0.3)
                    self.update_progress(45, "[2/4] Tạo dummy pak 15 byte mồi fallback...")
                    with open(base_pak, "wb") as f:
                        f.write(DUMMY_PAK_BYTES)

                    time.sleep(0.3)
                    self.update_progress(75, "[3/4] Triển khai 152,667 dòng tiếng Việt vào Loose File...")
                    os.makedirs(en_loose_dir, exist_ok=True)
                    src_dat = os.path.join(data_dir, "en-US", "L10NString.dat")
                    if os.path.isfile(src_dat):
                        shutil.copy2(src_dat, os.path.join(en_loose_dir, "L10NString.dat"))
                        self.log("✔ Đã nạp bảng dịch tiếng Việt en-US", "success")

                # 2. ko-KR
                ko_pak_dir = os.path.join(target_dir, "Aion2", "Content", "Paks", "L10N", "Text", "ko-KR")
                ko_loose_dir = os.path.join(target_dir, "Aion2", "Content", "L10N", "Text", "ko-KR")
                if os.path.isdir(ko_pak_dir):
                    base_ko_pak = os.path.join(ko_pak_dir, "pakchunk501000-Windows_0_P.pak")
                    bak_ko_pak = os.path.join(ko_pak_dir, "pakchunk501000-Windows_0_P.pak.official_clean_bak")
                    bak_ko_valid = os.path.isfile(bak_ko_pak) and os.path.getsize(bak_ko_pak) > 1024 * 1024
                    if os.path.isfile(base_ko_pak) and not bak_ko_valid and os.path.getsize(base_ko_pak) > 1024 * 1024:
                        shutil.copy2(base_ko_pak, bak_ko_pak)

                    with open(base_ko_pak, "wb") as f:
                        f.write(DUMMY_PAK_BYTES)

                    os.makedirs(ko_loose_dir, exist_ok=True)
                    src_ko_dat = os.path.join(data_dir, "ko-KR", "L10NString.dat")
                    if os.path.isfile(src_ko_dat):
                        shutil.copy2(src_ko_dat, os.path.join(ko_loose_dir, "L10NString.dat"))
                        self.log("✔ Đã nạp bảng dịch tiếng Việt ko-KR", "success")

                # 3. zh-TW
                zh_pak_dir = os.path.join(target_dir, "Aion2", "Content", "Paks", "L10N", "Text", "zh-TW")
                zh_loose_dir = os.path.join(target_dir, "Aion2", "Content", "L10N", "Text", "zh-TW")
                if os.path.isdir(zh_pak_dir):
                    base_zh_pak = os.path.join(zh_pak_dir, "pakchunk500000-Windows_0_P.pak")
                    bak_zh_pak = os.path.join(zh_pak_dir, "pakchunk500000-Windows_0_P.pak.official_clean_bak")
                    bak_zh_valid = os.path.isfile(bak_zh_pak) and os.path.getsize(bak_zh_pak) > 1024 * 1024
                    if os.path.isfile(base_zh_pak) and not bak_zh_valid and os.path.getsize(base_zh_pak) > 1024 * 1024:
                        shutil.copy2(base_zh_pak, bak_zh_pak)

                    with open(base_zh_pak, "wb") as f:
                        f.write(DUMMY_PAK_BYTES)

                    os.makedirs(zh_loose_dir, exist_ok=True)
                    src_zh_dat = os.path.join(data_dir, "zh-TW", "L10NString.dat")
                    if os.path.isfile(src_zh_dat):
                        shutil.copy2(src_zh_dat, os.path.join(zh_loose_dir, "L10NString.dat"))
                        self.log("✔ Đã nạp bảng dịch tiếng Việt zh-TW", "success")

                # 4. ExcludedUpdateList.dat
                time.sleep(0.3)
                self.update_progress(90, "[4/4] Khóa cập nhật đè của Purple Launcher...")
                excl_file = os.path.join(target_dir, "Aion2", "ExcludedUpdateList.dat")
                excl_content = "Aion2/Content/Paks/L10N/Text/en-US/pakchunk502000-Windows_0_P.pak\r\nAion2/Content/Paks/L10N/Text/ko-KR/pakchunk501000-Windows_0_P.pak\r\nAion2/Content/Paks/L10N/Text/zh-TW/pakchunk500000-Windows_0_P.pak\r\n"
                with open(excl_file, "w", encoding="utf-8") as f:
                    f.write(excl_content)

                time.sleep(0.4)
                self.update_progress(100, "CÀI ĐẶT HOÀN TẤT!")
                self.log("🎉 KÍCH HOẠT VIỆT HÓA THÀNH CÔNG! Hãy khởi động game qua Purple.", "success")
                self.update_state(True)
            except Exception as e:
                self.log(f"Lỗi trong quá trình cài đặt: {e}", "red")
                self.update_progress(0, "Lỗi cài đặt")
            finally:
                with self._lock:
                    self.state["isBusy"] = False

        threading.Thread(target=_install_thread, daemon=True).start()
        return True

    def uninstall_mod(self, game_dir):
        if self.security_info.get("status") == "lock":
            self.log("❌ LỖI BẢO MẬT: Công cụ đã bị KHÓA bởi nhà phát triển!", "red")
            return False
        if self.security_info.get("status") == "baotri":
            self.log("⚠ BẢO TRÌ: Hệ thống đang tạm dừng để bảo trì!", "red")
            return False

        with self._lock:
            if self.state["isBusy"]:
                return False
            self.state["isBusy"] = True

        def _uninstall_thread():
            try:
                target_dir = game_dir or self.state["gameDir"]
                if not target_dir or not os.path.isdir(target_dir):
                    self.log("LỖI: Đường dẫn game không tồn tại!", "red")
                    self.update_progress(0, "Lỗi đường dẫn")
                    return

                if is_game_running():
                    self.log("❌ Game AION 2 đang chạy! Vui lòng thoát game trước khi tiếp tục.", "red")
                    self.update_progress(0, "Game đang chạy")
                    return

                self.log(f">>> BẮT ĐẦU KHÔI PHỤC BẢN GỐC TẠI: {target_dir}", "blue")
                self.update_progress(30, "[1/3] Khôi phục file pak gốc từ bản sao lưu...")

                # Restore en-US
                en_pak_dir = os.path.join(target_dir, "Aion2", "Content", "Paks", "L10N", "Text", "en-US")
                en_loose_dir = os.path.join(target_dir, "Aion2", "Content", "L10N", "Text", "en-US")
                if os.path.isdir(en_pak_dir):
                    base_pak = os.path.join(en_pak_dir, "pakchunk502000-Windows_0_P.pak")
                    bak_pak = os.path.join(en_pak_dir, "pakchunk502000-Windows_0_P.pak.official_clean_bak")
                    if os.path.isfile(bak_pak):
                        shutil.copy2(bak_pak, base_pak)
                        try: os.remove(bak_pak)
                        except Exception: pass
                        self.log("Đã khôi phục file pak gốc en-US.", "success")

                if os.path.isdir(en_loose_dir):
                    shutil.rmtree(en_loose_dir, ignore_errors=True)

                # Restore ko-KR
                time.sleep(0.3)
                self.update_progress(65, "[2/3] Dọn dẹp loose file L10N...")
                ko_pak_dir = os.path.join(target_dir, "Aion2", "Content", "Paks", "L10N", "Text", "ko-KR")
                ko_loose_dir = os.path.join(target_dir, "Aion2", "Content", "L10N", "Text", "ko-KR")
                if os.path.isdir(ko_pak_dir):
                    base_ko_pak = os.path.join(ko_pak_dir, "pakchunk501000-Windows_0_P.pak")
                    bak_ko_pak = os.path.join(ko_pak_dir, "pakchunk501000-Windows_0_P.pak.official_clean_bak")
                    if os.path.isfile(bak_ko_pak):
                        shutil.copy2(bak_ko_pak, base_ko_pak)
                        try: os.remove(bak_ko_pak)
                        except Exception: pass

                if os.path.isdir(ko_loose_dir):
                    shutil.rmtree(ko_loose_dir, ignore_errors=True)

                # Restore zh-TW
                zh_pak_dir = os.path.join(target_dir, "Aion2", "Content", "Paks", "L10N", "Text", "zh-TW")
                zh_loose_dir = os.path.join(target_dir, "Aion2", "Content", "L10N", "Text", "zh-TW")
                if os.path.isdir(zh_pak_dir):
                    base_zh_pak = os.path.join(zh_pak_dir, "pakchunk500000-Windows_0_P.pak")
                    bak_zh_pak = os.path.join(zh_pak_dir, "pakchunk500000-Windows_0_P.pak.official_clean_bak")
                    if os.path.isfile(bak_zh_pak):
                        shutil.copy2(bak_zh_pak, base_zh_pak)
                        try: os.remove(bak_zh_pak)
                        except Exception: pass

                if os.path.isdir(zh_loose_dir):
                    shutil.rmtree(zh_loose_dir, ignore_errors=True)

                # Remove ExcludedUpdateList.dat
                time.sleep(0.3)
                self.update_progress(90, "[3/3] Xóa cấu hình ExcludedUpdateList...")
                excl_file = os.path.join(target_dir, "Aion2", "ExcludedUpdateList.dat")
                if os.path.isfile(excl_file):
                    try: os.remove(excl_file)
                    except Exception: pass

                time.sleep(0.4)
                self.update_progress(100, "ĐÃ VỀ BẢN GỐC!")
                self.log("✔ Đã trả về 100% nguyên bản của nhà phát hành NCSoft.", "success")
                self.update_state(False)
            except Exception as e:
                self.log(f"Lỗi trong quá trình gỡ cài đặt: {e}", "red")
                self.update_progress(0, "Lỗi gỡ cài đặt")
            finally:
                with self._lock:
                    self.state["isBusy"] = False

        threading.Thread(target=_uninstall_thread, daemon=True).start()
        return True


def main():
    if sys.platform == "win32" and not is_admin():
        ensure_admin()
        return

    # 1. Check WebView2 Runtime availability on Windows
    if sys.platform == "win32" and not is_webview2_installed():
        import ctypes
        MB_YESNO = 0x00000004
        MB_ICONWARNING = 0x00000030
        IDYES = 6
        res = ctypes.windll.user32.MessageBoxW(
            0,
            "Máy tính của bạn chưa cài đặt Microsoft Edge WebView2 Runtime.\n\n"
            "Ứng dụng cần thành phần này để hiển thị giao diện. "
            "Bạn có muốn mở trang tải chính thức từ Microsoft ngay bây giờ không?",
            "FEΔR - Yêu cầu WebView2 Runtime",
            MB_YESNO | MB_ICONWARNING
        )
        if res == IDYES:
            webbrowser.open("https://go.microsoft.com/fwlink/p/?LinkId=2124703")
        sys.exit(0)

    # 2. Disable problematic GPU compositing on buggy drivers to eliminate black screen
    os.environ["WEBVIEW2_ADDITIONAL_BROWSER_ARGUMENTS"] = (
        "--disable-gpu-compositing --disable-features=msWebOOUI,msPdfOOUI"
    )

    api = ModApi()
    gui_path = get_gui_html_path()

    if not gui_path or not os.path.isfile(gui_path):
        print(f"Error: GUI bundle not found!")
        return

    target_url = f"file:///{os.path.abspath(gui_path).replace(os.sep, '/')}"

    window = webview.create_window(
        title="F-Aion 2 Tools",
        url=target_url,
        js_api=api,
        width=680,
        height=475,
        resizable=False,
        frameless=True,
        easy_drag=False,
        shadow=True,
        background_color="#07090e"
    )
    global _main_window
    _main_window = window
    cache_dir = get_cache_dir()
    webview.start(debug=False, private_mode=False, storage_path=cache_dir)

if __name__ == "__main__":
    main()
