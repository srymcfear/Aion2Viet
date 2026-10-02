"""
AION 2 STANDALONE MOD MANAGER GUI
Developed by Team FEΔR / SrymC
Python Backend + Modern TypeScript/HTML/CSS Frontend (pywebview + WebView2)
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

    def set_window(self, window):
        self.window = window

    def log(self, message, msg_type=""):
        if self.window:
            self.window.evaluate_js(f"window.frontendApp && window.frontendApp.log({json.dumps(message)}, {json.dumps(msg_type)});")

    def update_progress(self, percent, step_text):
        if self.window:
            self.window.evaluate_js(f"window.frontendApp && window.frontendApp.setProgress({percent}, {json.dumps(step_text)});")

    def update_state(self, is_installed):
        if self.window:
            self.window.evaluate_js(f"window.frontendApp && window.frontendApp.setState({json.dumps(is_installed)});")

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
                        return val
            except Exception:
                pass

        # 2. Check drives
        candidate_drives = [f"{d}:\\" for d in "CDEFGHIJKLMNOPQRSTUVWXYZ" if os.path.exists(f"{d}:\\")]
        for drive in candidate_drives:
            for sub in ["NCSoft\\AION 2", "NCSoft\\AION2_TW", "Games\\AION 2", "Program Files\\NCSoft\\AION 2"]:
                full = os.path.join(drive, sub)
                if os.path.isdir(full) and os.path.isdir(os.path.join(full, "Aion2")):
                    return full

        return "F:\\NCSoft\\AION 2" if os.path.isdir("F:\\NCSoft\\AION 2") else ""

    def check_is_installed(self, game_dir):
        if not game_dir or not os.path.isdir(game_dir):
            return False

        # Check en-US
        loose_dat = os.path.join(game_dir, "Aion2", "Content", "L10N", "Text", "en-US", "L10NString.dat")
        pak_file = os.path.join(game_dir, "Aion2", "Content", "Paks", "L10N", "Text", "en-US", "pakchunk502000-Windows_0_P.pak")

        if os.path.isfile(loose_dat) and os.path.isfile(pak_file):
            try:
                # If pak is 15 bytes dummy, it is installed!
                if os.path.getsize(pak_file) == 15 and os.path.getsize(loose_dat) > 1024 * 1024:
                    return True
            except Exception:
                pass
        return False

    def get_initial_state(self):
        detected = self.detect_game_dir()
        installed = self.check_is_installed(detected)
        return {
            "gameDir": detected,
            "isInstalled": installed
        }

    def browse_folder(self):
        result = self.window.create_file_dialog(webview.FOLDER_DIALOG)
        if result and len(result) > 0:
            chosen = result[0]
            if os.path.isdir(chosen):
                installed = self.check_is_installed(chosen)
                self.log(f"Đã chọn đường dẫn: {chosen}", "cyan")
                return {"gameDir": chosen, "isInstalled": installed}
        return None

    def scan_game(self):
        def _scan_thread():
            self.log("Bắt đầu quét sâu Registry và các ổ đĩa...", "cyan")
            self.update_progress(30, "Đang quét HKLM Registry...")
            time.sleep(0.3)
            self.update_progress(70, "Kiểm tra cấu trúc thư mục game...")
            detected = self.detect_game_dir()
            time.sleep(0.3)
            self.update_progress(100, "Quét hoàn tất!")
            installed = self.check_is_installed(detected)

            if detected:
                self.log(f"Tìm thấy AION 2 tại: {detected}", "white")
            else:
                self.log("Không tự động phát hiện được thư mục game. Vui lòng bấm 'CHỌN THƯ MỤC'.", "magenta")

            self.window.evaluate_js(f"window.frontendApp && window.frontendApp.applyScanResult({json.dumps(detected)}, {json.dumps(installed)});")
            time.sleep(0.6)
            self.update_progress(0, "Sẵn sàng thực thi")

        threading.Thread(target=_scan_thread, daemon=True).start()
        return True

    def install_mod(self, game_dir):
        def _install_thread():
            if not game_dir or not os.path.isdir(game_dir):
                self.log("LỖI: Đường dẫn game không tồn tại!", "magenta")
                self.update_progress(0, "Lỗi đường dẫn")
                return

            self.log(f">>> BẮT ĐẦU CÀI ĐẶT VIỆT HÓA TẠI: {game_dir}", "cyan")
            self.update_progress(15, "[1/4] Sao lưu file pak gốc (.official_clean_bak)...")

            # Dọn dẹp mod cũ
            old_mod_pak = os.path.join(game_dir, "Aion2", "Content", "Paks", "pakchunk502000-Windows_999_P.pak")
            if os.path.isfile(old_mod_pak):
                try: os.remove(old_mod_pak)
                except Exception: pass

            mods_folder = os.path.join(game_dir, "Aion2", "Content", "Paks", "~mods")
            if os.path.isdir(mods_folder):
                try: shutil.rmtree(mods_folder, ignore_errors=True)
                except Exception: pass

            # 1. en-US
            en_pak_dir = os.path.join(game_dir, "Aion2", "Content", "Paks", "L10N", "Text", "en-US")
            en_loose_dir = os.path.join(game_dir, "Aion2", "Content", "L10N", "Text", "en-US")
            if os.path.isdir(en_pak_dir):
                base_pak = os.path.join(en_pak_dir, "pakchunk502000-Windows_0_P.pak")
                bak_pak = os.path.join(en_pak_dir, "pakchunk502000-Windows_0_P.pak.official_clean_bak")
                if os.path.isfile(base_pak) and not os.path.isfile(bak_pak) and os.path.getsize(base_pak) > 1024 * 1024:
                    shutil.copy2(base_pak, bak_pak)
                    self.log("Sao lưu file pak gốc en-US thành công", "white")

                time.sleep(0.3)
                self.update_progress(45, "[2/4] Tạo dummy pak 15 byte mồi fallback...")
                with open(base_pak, "wb") as f:
                    f.write(DUMMY_PAK_BYTES)

                time.sleep(0.3)
                self.update_progress(75, "[3/4] Triển khai 152,667 dòng tiếng Việt vào Loose File...")
                os.makedirs(en_loose_dir, exist_ok=True)
                src_dat = os.path.join(DATA_DIR, "en-US", "L10NString.dat")
                shutil.copy2(src_dat, os.path.join(en_loose_dir, "L10NString.dat"))
                self.log("✔ Đã nạp bảng dịch en-US (152,667 keys)", "cyan")

            # 2. ko-KR
            ko_pak_dir = os.path.join(game_dir, "Aion2", "Content", "Paks", "L10N", "Text", "ko-KR")
            ko_loose_dir = os.path.join(game_dir, "Aion2", "Content", "L10N", "Text", "ko-KR")
            if os.path.isdir(ko_pak_dir):
                base_ko_pak = os.path.join(ko_pak_dir, "pakchunk501000-Windows_0_P.pak")
                bak_ko_pak = os.path.join(ko_pak_dir, "pakchunk501000-Windows_0_P.pak.official_clean_bak")
                if os.path.isfile(base_ko_pak) and not os.path.isfile(bak_ko_pak) and os.path.getsize(base_ko_pak) > 1024 * 1024:
                    shutil.copy2(base_ko_pak, bak_ko_pak)

                with open(base_ko_pak, "wb") as f:
                    f.write(DUMMY_PAK_BYTES)

                os.makedirs(ko_loose_dir, exist_ok=True)
                src_ko_dat = os.path.join(DATA_DIR, "ko-KR", "L10NString.dat")
                shutil.copy2(src_ko_dat, os.path.join(ko_loose_dir, "L10NString.dat"))
                self.log("✔ Đã nạp bảng dịch ko-KR", "cyan")

            # 3. ExcludedUpdateList.dat
            time.sleep(0.3)
            self.update_progress(90, "[4/4] Khóa cập nhật đè của Purple Launcher...")
            excl_file = os.path.join(game_dir, "Aion2", "ExcludedUpdateList.dat")
            excl_content = "Aion2/Content/Paks/L10N/Text/en-US/pakchunk502000-Windows_0_P.pak\nAion2/Content/Paks/L10N/Text/ko-KR/pakchunk501000-Windows_0_P.pak\n"
            with open(excl_file, "w", encoding="utf-8") as f:
                f.write(excl_content)

            time.sleep(0.4)
            self.update_progress(100, "CÀI ĐẶT HOÀN TẤT!")
            self.log("🎉 KÍCH HOẠT VIỆT HÓA THÀNH CÔNG! Hãy khởi động game qua Purple.", "cyan")
            self.update_state(True)

        threading.Thread(target=_install_thread, daemon=True).start()
        return True

    def uninstall_mod(self, game_dir):
        def _uninstall_thread():
            if not game_dir or not os.path.isdir(game_dir):
                return

            self.log(f">>> BẮT ĐẦU KHÔI PHỤC BẢN GỐC TẠI: {game_dir}", "magenta")
            self.update_progress(30, "[1/3] Khôi phục file pak gốc từ bản sao lưu...")

            # Restore en-US
            en_pak_dir = os.path.join(game_dir, "Aion2", "Content", "Paks", "L10N", "Text", "en-US")
            en_loose_dir = os.path.join(game_dir, "Aion2", "Content", "L10N", "Text", "en-US")
            if os.path.isdir(en_pak_dir):
                base_pak = os.path.join(en_pak_dir, "pakchunk502000-Windows_0_P.pak")
                bak_pak = os.path.join(en_pak_dir, "pakchunk502000-Windows_0_P.pak.official_clean_bak")
                if os.path.isfile(bak_pak):
                    shutil.copy2(bak_pak, base_pak)
                    try: os.remove(bak_pak)
                    except Exception: pass
                    self.log("Đã khôi phục file pak gốc en-US", "white")

            if os.path.isdir(en_loose_dir):
                shutil.rmtree(en_loose_dir, ignore_errors=True)

            # Restore ko-KR
            time.sleep(0.3)
            self.update_progress(65, "[2/3] Dọn dẹp loose file L10N...")
            ko_pak_dir = os.path.join(game_dir, "Aion2", "Content", "Paks", "L10N", "Text", "ko-KR")
            ko_loose_dir = os.path.join(game_dir, "Aion2", "Content", "L10N", "Text", "ko-KR")
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
            excl_file = os.path.join(game_dir, "Aion2", "ExcludedUpdateList.dat")
            if os.path.isfile(excl_file):
                try: os.remove(excl_file)
                except Exception: pass

            time.sleep(0.4)
            self.update_progress(100, "ĐÃ VỀ BẢN GỐC!")
            self.log("✔ Đã trả về 100% nguyên bản của nhà phát hành NCSoft.", "white")
            self.update_state(False)

        threading.Thread(target=_uninstall_thread, daemon=True).start()
        return True


def main():
    api = ModApi()
    # Choose HTML file (Default: Cyberpunk HUD demo)
    html_path = os.path.join(ROOT_DIR, "prototypes", "demo1_cyberpunk_hud.html")
    if not os.path.exists(html_path):
        print(f"Error: {html_path} not found!")
        return

    # Read and inject the JS binding connector
    with open(html_path, "r", encoding="utf-8") as f:
        html_content = f.read()

    # Inject pywebview bridge glue
    bridge_script = """
    <script>
      window.frontendApp = {
        log: function(msg, type) { if (typeof log === 'function') log(msg, type); },
        setProgress: function(pct, text) { if (typeof setProgress === 'function') setProgress(pct, text); },
        setState: function(val) { if (typeof updateState === 'function') updateState(val); },
        applyScanResult: function(dir, installed) {
          if (dir) document.getElementById('gamePath').value = dir;
          if (typeof updateState === 'function') updateState(installed);
        }
      };

      window.addEventListener('pywebviewready', function() {
        window.pywebview.api.get_initial_state().then(function(res) {
          if (res) {
            if (res.gameDir) document.getElementById('gamePath').value = res.gameDir;
            if (typeof updateState === 'function') updateState(res.isInstalled);
          }
        });
      });

      // Override frontend functions to route through Python API
      window.browseFolder = function() {
        window.pywebview.api.browse_folder().then(function(res) {
          if (res && res.gameDir) {
            document.getElementById('gamePath').value = res.gameDir;
            updateState(res.isInstalled);
          }
        });
      };

      window.scanGame = function() {
        window.pywebview.api.scan_game();
      };

      window.runInstall = function() {
        var dir = document.getElementById('gamePath').value;
        window.pywebview.api.install_mod(dir);
      };

      window.runUninstall = function() {
        var dir = document.getElementById('gamePath').value;
        window.pywebview.api.uninstall_mod(dir);
      };
    </script>
    """
    html_content = html_content.replace("</body>", bridge_script + "\n</body>")

    window = webview.create_window(
        title="FEΔR - AION 2 STANDALONE MOD LAUNCHER",
        html=html_content,
        js_api=api,
        width=920,
        height=680,
        resizable=True,
        background_color="#060913"
    )
    api.set_window(window)
    webview.start(debug=False)

if __name__ == "__main__":
    main()
