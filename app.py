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

# Security & Update Configuration
CURRENT_VERSION = "1.0.2"
SECURITY_KEY = "fearAion2Tran-key"
SECURITY_KEY_HASH = "4eb733f752b4f4e3f25fcde3424c38f92435721355b8c981e1e773164126da90"
GITHUB_REPO = "srymcfear/Aion2Viet"
RELEASE_URL = f"https://github.com/{GITHUB_REPO}/releases"
API_RELEASE_URL = f"https://api.github.com/repos/{GITHUB_REPO}/releases/latest"

def parse_semver(s):
    nums = [int(x) for x in re.findall(r'\d+', str(s))]
    while len(nums) < 3:
        nums.append(0)
    return tuple(nums[:3])

def is_newer_version(remote_v, local_v):
    return parse_semver(remote_v) > parse_semver(local_v)

def parse_release_security(body_text):
    status = "active"
    message = "Hệ thống hoạt động bình thường"
    if not body_text:
        return status, message
    
    # 1. JSON block check
    json_match = re.search(r'\{[^{}]*"key"\s*:\s*"fearAion2Tran-key"[^{}]*\}', body_text)
    if json_match:
        try:
            d = json.loads(json_match.group(0))
            if d.get("status") in ["active", "baotri", "lock"]:
                return d["status"], d.get("message", message)
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
        return st, msg

    return status, message

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

ROOT_DIR = os.path.dirname(os.path.abspath(__file__))
DUMMY_PAK_BYTES = bytes([0x47, 0x55, 0x20, 0x32, 0x30, 0x32, 0x36, 0x30, 0x39, 0x32, 0x39, 0x31, 0x37, 0x35, 0x37])

class ModApi:
    def __init__(self):
        self.window = None
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

        # Initial detection
        detected = self.detect_game_dir()
        installed = self.check_is_installed(detected)
        self.state["gameDir"] = detected
        self.state["isInstalled"] = installed
        if detected:
            self.log(f"Đã nhận diện thư mục AION 2: {detected}", "blue")
        self.log("Hệ thống sẵn sàng.", "success")

        # Initial background update check
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
                    
                    sec_status, sec_msg = parse_release_security(body)
                    
                    download_url = None
                    for asset in data.get("assets", []):
                        if asset.get("name", "").lower().endswith(".exe"):
                            download_url = asset.get("browser_download_url")
                            break
                    
                    remote_ver = tag.lstrip("v")
                    has_upd = is_newer_version(remote_ver, CURRENT_VERSION)
                    
                    with self._lock:
                        self.security_info["status"] = sec_status
                        self.security_info["message"] = sec_msg
                        self.security_info["latestVersion"] = remote_ver or CURRENT_VERSION
                        self.security_info["hasUpdate"] = has_upd
                        self.security_info["releaseUrl"] = html_url
                        self.security_info["downloadUrl"] = download_url
                        self.security_info["changelog"] = body
                        self.security_info["lastChecked"] = time.strftime("%H:%M:%S")
                        self.security_info["isChecking"] = False

                    if has_upd:
                        self.log(f"🔔 Đã có phiên bản mới: v{remote_ver}!", "blue")
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
                    temp_dir = tempfile.gettempdir()
                    new_file_name = f"F-Aion_2_Tools_v{self.security_info['latestVersion']}.exe"
                    dest_path = os.path.join(temp_dir, new_file_name)

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

                self.update_progress(100, "Tải bản mới thành công!")
                self.log(f"✔ Đã tải bản mới: {dest_path}", "success")
                self.log("Khởi chạy bản cập nhật...", "blue")
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

    def set_window(self, window):
        self.window = window

    def show_window(self):
        if self.window:
            try:
                self.window.show()
            except Exception:
                pass
        return True

    def minimize_window(self):
        def _min():
            time.sleep(0.05)
            if self.window:
                try:
                    self.window.minimize()
                except Exception:
                    pass
        threading.Thread(target=_min, daemon=True).start()
        return True

    def close_window(self):
        def _close():
            time.sleep(0.05)
            if self.window:
                try:
                    self.window.destroy()
                except Exception:
                    pass
            os._exit(0)
        threading.Thread(target=_close, daemon=True).start()
        return True

    def open_github(self):
        try:
            webbrowser.open("https://github.com/srymcfear")
        except Exception as e:
            self.log(f"Lỗi mở link: {e}", "red")
        return True

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
        try:
            import tkinter as tk
            from tkinter import filedialog
            root = tk.Tk()
            root.withdraw()
            root.attributes('-topmost', True)
            initial = self.state["gameDir"] if (self.state["gameDir"] and os.path.isdir(self.state["gameDir"])) else "C:\\"
            chosen = filedialog.askdirectory(title="Chọn thư mục cài đặt game AION 2", initialdir=initial)
            root.destroy()
            if chosen and os.path.isdir(chosen):
                chosen = os.path.normpath(chosen)
                installed = self.check_is_installed(chosen)
                with self._lock:
                    self.state["gameDir"] = chosen
                    self.state["isInstalled"] = installed
                self.log(f"Đã chọn đường dẫn: {chosen}", "blue")
                return {"gameDir": chosen, "isInstalled": installed}
        except Exception as e:
            self.log(f"Lỗi chọn thư mục: {e}", "red")
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
            target_dir = game_dir or self.state["gameDir"]
            if not target_dir or not os.path.isdir(target_dir):
                self.log("LỖI: Đường dẫn game không tồn tại!", "red")
                self.update_progress(0, "Lỗi đường dẫn")
                with self._lock: self.state["isBusy"] = False
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
                if os.path.isfile(base_pak) and not os.path.isfile(bak_pak) and os.path.getsize(base_pak) > 1024 * 1024:
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
                if os.path.isfile(base_ko_pak) and not os.path.isfile(bak_ko_pak) and os.path.getsize(base_ko_pak) > 1024 * 1024:
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
                if os.path.isfile(base_zh_pak) and not os.path.isfile(bak_zh_pak) and os.path.getsize(base_zh_pak) > 1024 * 1024:
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
            excl_content = "Aion2/Content/Paks/L10N/Text/en-US/pakchunk502000-Windows_0_P.pak\nAion2/Content/Paks/L10N/Text/ko-KR/pakchunk501000-Windows_0_P.pak\nAion2/Content/Paks/L10N/Text/zh-TW/pakchunk500000-Windows_0_P.pak\n"
            with open(excl_file, "w", encoding="utf-8") as f:
                f.write(excl_content)

            time.sleep(0.4)
            self.update_progress(100, "CÀI ĐẶT HOÀN TẤT!")
            self.log("🎉 KÍCH HOẠT VIỆT HÓA THÀNH CÔNG! Hãy khởi động game qua Purple.", "success")
            self.update_state(True)

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
            target_dir = game_dir or self.state["gameDir"]
            if not target_dir or not os.path.isdir(target_dir):
                with self._lock: self.state["isBusy"] = False
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

        threading.Thread(target=_uninstall_thread, daemon=True).start()
        return True


def main():
    if sys.platform == "win32" and not is_admin():
        ensure_admin()
        return

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
        background_color="#07090e",
        hidden=True
    )
    api.set_window(window)

    def _safety_show():
        time.sleep(1.2)
        if window:
            try:
                window.show()
            except Exception:
                pass
    threading.Thread(target=_safety_show, daemon=True).start()

    webview.start(debug=False)

if __name__ == "__main__":
    main()
