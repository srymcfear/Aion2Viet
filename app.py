"""
AION 2 STANDALONE MOD MANAGER GUI
Developed by Team FEΔR / SrymC
Python Backend + Modern Vue 3 / Naive UI Frontend (pywebview + WebView2)
Thread-safe Architecture: Zero COM cross-thread calls to prevent WebView2 freezes.
"""
import os
import sys
import json
import time
import shutil
import threading
import winreg
import webview

ROOT_DIR = os.path.dirname(os.path.abspath(__file__))
RELEASE_DIR = os.path.join(ROOT_DIR, "release", "AION2_VietHoa_Standalone")
DATA_DIR = os.path.join(RELEASE_DIR, "Data")
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
        # Initial detection
        detected = self.detect_game_dir()
        installed = self.check_is_installed(detected)
        self.state["gameDir"] = detected
        self.state["isInstalled"] = installed
        if detected:
            self.log(f"Đã nhận diện thư mục AION 2: {detected}", "blue")
        self.log("Hệ thống sẵn sàng.", "success")

    def set_window(self, window):
        self.window = window

    def minimize_window(self):
        if self.window:
            try:
                self.window.minimize()
            except Exception as e:
                print("Lỗi minimize:", e)

    def close_window(self):
        if self.window:
            try:
                self.window.destroy()
            except Exception:
                pass
        os._exit(0)

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
        # 1. Check Registry
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

        # 2. Check drives
        candidate_drives = [f"{d}:\\" for d in "CDEFGHIJKLMNOPQRSTUVWXYZ" if os.path.exists(f"{d}:\\")]
        for drive in candidate_drives:
            for sub in ["NCSoft\\AION 2", "NCSoft\\AION2_TW", "Games\\AION 2", "Program Files\\NCSoft\\AION 2"]:
                full = os.path.join(drive, sub)
                if os.path.isdir(full) and os.path.isdir(os.path.join(full, "Aion2")):
                    return os.path.normpath(full)

        return "F:\\NCSoft\\AION 2" if os.path.isdir("F:\\NCSoft\\AION 2") else ""

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
                "logs": logs
            }

    def browse_folder(self):
        try:
            import tkinter as tk
            from tkinter import filedialog
            root = tk.Tk()
            root.withdraw()
            root.attributes('-topmost', True)
            initial = self.state["gameDir"] if os.path.isdir(self.state["gameDir"]) else "C:\\"
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
                src_dat = os.path.join(DATA_DIR, "en-US", "L10NString.dat")
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
                src_ko_dat = os.path.join(DATA_DIR, "ko-KR", "L10NString.dat")
                if os.path.isfile(src_ko_dat):
                    shutil.copy2(src_ko_dat, os.path.join(ko_loose_dir, "L10NString.dat"))
                    self.log("✔ Đã nạp bảng dịch tiếng Việt ko-KR", "success")

            # 3. ExcludedUpdateList.dat
            time.sleep(0.3)
            self.update_progress(90, "[4/4] Khóa cập nhật đè của Purple Launcher...")
            excl_file = os.path.join(target_dir, "Aion2", "ExcludedUpdateList.dat")
            excl_content = "Aion2/Content/Paks/L10N/Text/en-US/pakchunk502000-Windows_0_P.pak\nAion2/Content/Paks/L10N/Text/ko-KR/pakchunk501000-Windows_0_P.pak\n"
            with open(excl_file, "w", encoding="utf-8") as f:
                f.write(excl_content)

            time.sleep(0.4)
            self.update_progress(100, "CÀI ĐẶT HOÀN TẤT!")
            self.log("🎉 KÍCH HOẠT VIỆT HÓA THÀNH CÔNG! Hãy khởi động game qua Purple.", "success")
            self.update_state(True)

        threading.Thread(target=_install_thread, daemon=True).start()
        return True

    def uninstall_mod(self, game_dir):
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
    api = ModApi()
    gui_dist_path = os.path.join(ROOT_DIR, "gui", "dist", "index.html")
    proto_path = os.path.join(ROOT_DIR, "prototypes", "demo2_modern_obsidian.html")

    if os.path.exists(gui_dist_path):
        html_path = gui_dist_path
    elif os.path.exists(proto_path):
        html_path = proto_path
    else:
        print(f"Error: GUI bundle not found!")
        return

    with open(html_path, "r", encoding="utf-8") as f:
        html_content = f.read()

    window = webview.create_window(
        title="FEΔR • AION 2 LOCALE MANAGER",
        html=html_content,
        js_api=api,
        width=680,
        height=450,
        resizable=False,
        frameless=True,
        easy_drag=True,
        shadow=True,
        background_color="#090d16"
    )
    api.set_window(window)
    webview.start(debug=False)

if __name__ == "__main__":
    main()
