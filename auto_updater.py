"""
AION 2 TOOLS - AUTO UPDATER ENGINE
Architecture: Hybrid OTA Data Patcher & In-Place Binary Updater
Team FEΔR / SrymC
"""

import os
import sys
import time
import json
import shutil
import zipfile
import tempfile
import urllib.request
import urllib.error
import subprocess
from typing import Callable, Optional, Dict, Any, Tuple

DEFAULT_GITHUB_REPO = "srymcfear/Aion2Viet"
API_LATEST_RELEASE = f"https://api.github.com/repos/{DEFAULT_GITHUB_REPO}/releases/latest"


class AutoUpdater:
    def __init__(self, current_version: str, repo: str = DEFAULT_GITHUB_REPO):
        self.current_version = current_version.strip().lstrip("v")
        self.repo = repo
        self.api_url = f"https://api.github.com/repos/{self.repo}/releases/latest"

    def fetch_release_info(self) -> Dict[str, Any]:
        """
        Queries GitHub API for the latest release metadata and assets.
        Returns a structured dictionary with version, notes, and downloadable assets.
        """
        result = {
            "has_update": False,
            "latest_version": self.current_version,
            "release_tag": f"v{self.current_version}",
            "release_url": f"https://github.com/{self.repo}/releases",
            "release_notes": "",
            "exe_asset": None,       # {"name": ..., "url": ..., "size": ...}
            "zip_asset": None,       # {"name": ..., "url": ..., "size": ...}
            "security_status": "active",
            "security_message": "Hệ thống hoạt động bình thường",
            "error": None
        }

        try:
            req = urllib.request.Request(
                self.api_url,
                headers={
                    "User-Agent": f"F-Aion-2-Tools-Updater/{self.current_version}",
                    "Accept": "application/vnd.github.v3+json"
                }
            )
            with urllib.request.urlopen(req, timeout=8) as resp:
                if resp.status == 200:
                    data = json.loads(resp.read().decode("utf-8"))
                    tag = str(data.get("tag_name", "")).strip()
                    remote_ver = tag.lstrip("v")
                    body = str(data.get("body", ""))
                    html_url = data.get("html_url", result["release_url"])

                    result["latest_version"] = remote_ver or self.current_version
                    result["release_tag"] = tag
                    result["release_url"] = html_url
                    result["release_notes"] = body

                    # Parse security tag if present
                    if "fearAion2Tran-key:lock" in body:
                        result["security_status"] = "lock"
                        result["security_message"] = "Công cụ đã bị khóa bởi tác giả."
                    elif "fearAion2Tran-key:baotri" in body:
                        result["security_status"] = "baotri"
                        result["security_message"] = "Hệ thống đang bảo trì, vui lòng quay lại sau."

                    # Parse assets
                    for asset in data.get("assets", []):
                        asset_name = asset.get("name", "")
                        download_url = asset.get("browser_download_url")
                        size = asset.get("size", 0)

                        if asset_name.lower().endswith(".exe") and not result["exe_asset"]:
                            result["exe_asset"] = {
                                "name": asset_name,
                                "url": download_url,
                                "size": size
                            }
                        elif asset_name.lower().endswith(".zip") and not result["zip_asset"]:
                            result["zip_asset"] = {
                                "name": asset_name,
                                "url": download_url,
                                "size": size
                            }

                    # Version comparison
                    result["has_update"] = self._is_newer(remote_ver, self.current_version)
        except Exception as e:
            result["error"] = str(e)

        return result

    @staticmethod
    def _is_newer(remote_str: str, current_str: str) -> bool:
        """Compares two semver version strings."""
        try:
            r_parts = [int(p) for p in remote_str.split(".") if p.isdigit()]
            c_parts = [int(p) for p in current_str.split(".") if p.isdigit()]
            while len(r_parts) < 3: r_parts.append(0)
            while len(c_parts) < 3: c_parts.append(0)
            return r_parts > c_parts
        except Exception:
            return False

    def download_asset(
        self,
        url: str,
        dest_path: str,
        progress_cb: Optional[Callable[[int, str], None]] = None
    ) -> bool:
        """
        Downloads an asset file in chunks with real-time percentage and speed tracking.
        """
        os.makedirs(os.path.dirname(os.path.abspath(dest_path)), exist_ok=True)
        temp_dest = dest_path + f".part_{int(time.time())}"

        req = urllib.request.Request(
            url,
            headers={"User-Agent": f"F-Aion-2-Tools-Updater/{self.current_version}"}
        )

        try:
            with urllib.request.urlopen(req, timeout=30) as resp:
                total_size = int(resp.headers.get("content-length", 0))
                downloaded = 0
                start_time = time.time()
                last_update = 0

                with open(temp_dest, "wb") as f:
                    while True:
                        chunk = resp.read(128 * 1024)
                        if not chunk:
                            break
                        f.write(chunk)
                        downloaded += len(chunk)

                        now = time.time()
                        if progress_cb and (now - last_update >= 0.15 or downloaded == total_size):
                            last_update = now
                            elapsed = max(now - start_time, 0.001)
                            speed_kb = (downloaded / 1024) / elapsed

                            if total_size > 0:
                                pct = min(int((downloaded / total_size) * 100), 100)
                                msg = f"{downloaded / (1024*1024):.1f} MB / {total_size / (1024*1024):.1f} MB ({pct}%) • {speed_kb / 1024:.1f} MB/s"
                            else:
                                pct = 50
                                msg = f"{downloaded / (1024*1024):.1f} MB • {speed_kb / 1024:.1f} MB/s"

                            progress_cb(pct, msg)

            if os.path.isfile(dest_path):
                try: os.remove(dest_path)
                except Exception: pass

            os.rename(temp_dest, dest_path)
            return True
        except Exception:
            if os.path.isfile(temp_dest):
                try: os.remove(temp_dest)
                except Exception: pass
            raise

    def apply_data_update(
        self,
        zip_path: str,
        target_game_dir: Optional[str] = None,
        local_data_dir: Optional[str] = None,
        log_cb: Optional[Callable[[str, str], None]] = None
    ) -> bool:
        """
        Extracts L10N data files from the Standalone Zip and deploys them to:
        1. Local tool data folder (C:\\ProgramData\\FEAR\\Aion2_Tools\\Data)
        2. Game directory (if specified and valid)
        """
        def _log(msg, t=""):
            if log_cb: log_cb(msg, t)

        _log("Đang giải nén bộ dữ liệu Việt hóa mới...", "blue")
        temp_extract = os.path.join(tempfile.gettempdir(), f"fear_l10n_{int(time.time())}")

        try:
            with zipfile.ZipFile(zip_path, 'r') as zf:
                zf.extractall(temp_extract)

            # Locate Data folder inside zip
            source_data = None
            for root, dirs, files in os.walk(temp_extract):
                if "en-US" in dirs and "L10NString.dat" in os.listdir(os.path.join(root, "en-US")):
                    source_data = root
                    break

            if not source_data:
                _log("Không tìm thấy cấu trúc dữ liệu L10N hợp lệ trong gói cập nhật.", "red")
                return False

            # 1. Update local cache (so subsequent tool installs use new translation)
            if local_data_dir:
                os.makedirs(local_data_dir, exist_ok=True)
                for loc in ["en-US", "ko-KR", "zh-TW"]:
                    src_dat = os.path.join(source_data, loc, "L10NString.dat")
                    if os.path.isfile(src_dat):
                        dst_loc = os.path.join(local_data_dir, loc)
                        os.makedirs(dst_loc, exist_ok=True)
                        shutil.copy2(src_dat, os.path.join(dst_loc, "L10NString.dat"))
                _log("✔ Đã cập nhật bộ dữ liệu Việt hóa cục bộ của Tool.", "success")

            # 2. Update directly into game folder if provided
            if target_game_dir and os.path.isdir(target_game_dir):
                for loc in ["en-US", "ko-KR", "zh-TW"]:
                    src_dat = os.path.join(source_data, loc, "L10NString.dat")
                    dst_game = os.path.join(target_game_dir, "Aion2", "Content", "L10N", "Text", loc, "L10NString.dat")
                    if os.path.isfile(src_dat) and os.path.isdir(os.path.dirname(dst_game)):
                        shutil.copy2(src_dat, dst_game)
                        _log(f"✔ Đã cập nhật bản dịch {loc} vào game.", "success")

            return True
        finally:
            if os.path.isdir(temp_extract):
                shutil.rmtree(temp_extract, ignore_errors=True)

    def apply_exe_update_and_restart(
        self,
        new_exe_path: str,
        target_exe_path: Optional[str] = None,
        log_cb: Optional[Callable[[str, str], None]] = None
    ) -> None:
        """
        Replaces the current running .exe on Windows using a self-deleting batch script.
        Bypasses Windows Exclusive File-Lock by:
        1. Renaming the current running .exe to .exe.old
        2. Spawning detached updater.bat
        3. Exiting current process immediately so .bat can replace the file and start new exe.
        """
        def _log(msg, t=""):
            if log_cb: log_cb(msg, t)

        current_exe = target_exe_path or os.path.abspath(sys.executable)
        old_bak = current_exe + f".old_{int(time.time())}"
        updater_bat = os.path.join(tempfile.gettempdir(), f"fear_updater_{os.getpid()}.bat")

        _log(f"Chuẩn bị thay thế file chạy: {os.path.basename(current_exe)}...", "blue")

        # 1. Attempt NTFS rename-in-use
        try:
            if os.path.isfile(current_exe):
                os.rename(current_exe, old_bak)
        except Exception:
            pass

        # 2. Write detached update script
        bat_content = f"""@echo off
chcp 65001 >nul
setlocal
set "TARGET={current_exe}"
set "SOURCE={new_exe_path}"
set "OLD={old_bak}"

rem Cho tien trinh cu dong han va nha file lock
timeout /t 1 /nobreak >nul

rem Thu xoa va copy de toi da 20 lan
for /l %%i in (1,1,20) do (
    if exist "%OLD%" del /f /q "%OLD%" >nul 2>&1
    del /f /q "%TARGET%" >nul 2>&1
    if not exist "%TARGET%" goto :do_copy
    timeout /t 1 /nobreak >nul
)

:do_copy
copy /y "%SOURCE%" "%TARGET%" >nul 2>&1
if exist "%TARGET%" (
    start "" "%TARGET%"
)
if exist "%OLD%" del /f /q "%OLD%" >nul 2>&1
if exist "%SOURCE%" del /f /q "%SOURCE%" >nul 2>&1
del "%~f0" >nul 2>&1
exit
"""
        with open(updater_bat, "w", encoding="utf-8", errors="ignore") as f:
            f.write(bat_content)

        _log("Khởi động lại Tool với phiên bản mới...", "success")
        time.sleep(0.5)

        # Launch detached updater script
        subprocess.Popen(
            ["cmd.exe", "/c", updater_bat],
            creationflags=0x08000000 | 0x00000200,
            close_fds=True
        )

        # Exit current process immediately so file lock is released
        os._exit(0)
