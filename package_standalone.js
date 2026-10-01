/**
 * AION 2 - PACKAGE STANDALONE VIETNAMESE MOD TOOL
 * Independent mod installer (NO GEARUP NEEDED, DIRECT GAME PATCHING, PURPLE COMPATIBLE)
 */
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const rootDir = __dirname;
const releaseDir = path.join(rootDir, 'release', 'AION2_VietHoa_Standalone');
const zipFile = path.join(rootDir, 'AION2_VietHoa_Standalone_Tool.zip');

console.log('=== AION 2 STANDALONE TOOL PACKAGING ENGINE ===\n');

// 1. Clean & recreate release directory
if (fs.existsSync(releaseDir)) {
  fs.rmSync(releaseDir, { recursive: true, force: true });
}
fs.mkdirSync(releaseDir, { recursive: true });

// 2. Copy mod pak files into Paks folder
console.log('[1/4] Copying mod pak files...');
const paksDir = path.join(releaseDir, 'Paks');
fs.mkdirSync(paksDir, { recursive: true });

fs.copyFileSync(
  path.join(rootDir, 'pakchunk502000-Windows_999_P.pak'),
  path.join(paksDir, 'pakchunk502000-Windows_999_P.pak')
);
fs.copyFileSync(
  path.join(rootDir, 'pakchunk501000-Windows_999_P.pak'),
  path.join(paksDir, 'pakchunk501000-Windows_999_P.pak')
);
fs.copyFileSync(
  path.join(rootDir, 'pakchunk502000-Windows_999_P_universal.pak'),
  path.join(paksDir, 'pakchunk502000-Windows_999_P_universal.pak')
);

// 3. Create installer PowerShell script (install.ps1)
console.log('[2/4] Generating installer and uninstaller scripts...');
const installPs = `[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
$Host.UI.RawUI.WindowTitle = "AION 2 - CÀI ĐẶT VIỆT HÓA ĐỘC LẬP (KHÔNG CẦN GEARUP)"

Write-Host "================================================================" -ForegroundColor Cyan
Write-Host "   AION 2 - CÀI ĐẶT VIỆT HÓA TRỰC TIẾP (KHÔNG CẦN GEARUP)       " -ForegroundColor Cyan
Write-Host "            Tương thích 100% Purple Launcher                    " -ForegroundColor Green
Write-Host "            Phát triển bởi: Team FEΔR / SrymC                   " -ForegroundColor DarkCyan
Write-Host "================================================================" -ForegroundColor Cyan
Write-Host ""

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$paksSource = Join-Path $scriptDir "Paks"

$pakEn = Join-Path $paksSource "pakchunk502000-Windows_999_P.pak"
$pakKo = Join-Path $paksSource "pakchunk501000-Windows_999_P.pak"
$pakTw = Join-Path $paksSource "pakchunk502000-Windows_999_P_universal.pak"

if (-not (Test-Path $pakEn)) {
    Write-Host "[LỖI] Không tìm thấy file mod trong thư mục Paks!" -ForegroundColor Red
    Write-Host "Vui lòng giải nén toàn bộ file ZIP trước khi chạy." -ForegroundColor Red
    Read-Host "Nhấn Enter để thoát..."
    exit 1
}

$foundAny = $false

# 1. Quét tìm game Global và TW qua Registry
$clients = @(
    @{ Name = "AION 2 Global"; Key = "HKLM:\\SOFTWARE\\WOW6432Node\\plaync\\A2_WW_L_GA_PURPLE"; IsGlobal = $true },
    @{ Name = "AION 2 TW"; Key = "HKLM:\\SOFTWARE\\WOW6432Node\\plaync\\A2_TW_L_GA_PURPLE"; IsGlobal = $false }
)

foreach ($c in $clients) {
    $dir = $null
    if (Test-Path $c.Key) {
        $dir = Get-ItemPropertyValue -Path $c.Key -Name "BaseDir" -ErrorAction SilentlyContinue
    }

    # Fallback kiểm tra các ổ đĩa
    if (-not $dir -or -not (Test-Path $dir)) {
        $checkDirs = @(
            "C:\\NCSoft\\AION 2", "D:\\NCSoft\\AION 2", "E:\\NCSoft\\AION 2", "F:\\NCSoft\\AION 2",
            "C:\\NCSoft\\AION2_TW", "D:\\NCSoft\\AION2_TW", "E:\\NCSoft\\AION2_TW", "F:\\NCSoft\\AION2_TW"
        )
        foreach ($cd in $checkDirs) {
            if ($c.IsGlobal -and ($cd -like "*AION 2") -and (Test-Path "$cd\\Aion2")) { $dir = $cd; break }
            if (-not $c.IsGlobal -and ($cd -like "*AION2_TW") -and (Test-Path "$cd\\Aion2")) { $dir = $cd; break }
        }
    }

    if ($dir -and (Test-Path $dir)) {
        $foundAny = $true
        Write-Host "[+] Phát hiện $($c.Name) tại: $dir" -ForegroundColor Green

        if ($c.IsGlobal) {
            # Deploy cho Global Client (en-US và ko-KR)
            $enDir = Join-Path $dir "Aion2\\Content\\Paks\\L10N\\Text\\en-US"
            $koDir = Join-Path $dir "Aion2\\Content\\Paks\\L10N\\Text\\ko-KR"
            $modsDir = Join-Path $dir "Aion2\\Content\\Paks\\~mods"

            if (Test-Path $enDir) {
                Write-Host "    -> Đang patch ngôn ngữ Tiếng Anh (en-US)..." -ForegroundColor Yellow
                $basePak = Join-Path $enDir "pakchunk502000-Windows_0_P.pak"
                $bakPak = Join-Path $enDir "pakchunk502000-Windows_0_P.pak.official_bak"
                $baseSig = Join-Path $enDir "pakchunk502000-Windows_0_P.sig"
                $baseUtoc = Join-Path $enDir "pakchunk502000-Windows_0_P.utoc"
                $baseUcas = Join-Path $enDir "pakchunk502000-Windows_0_P.ucas"

                if (-not (Test-Path $bakPak) -and (Test-Path $basePak)) {
                    Copy-Item $basePak $bakPak -Force
                }
                if (Test-Path $baseSig) { Rename-Item $baseSig "pakchunk502000-Windows_0_P.sig.bak" -Force -ErrorAction SilentlyContinue }
                if (Test-Path $baseUtoc) { Rename-Item $baseUtoc "pakchunk502000-Windows_0_P.utoc.bak" -Force -ErrorAction SilentlyContinue }
                if (Test-Path $baseUcas) { Rename-Item $baseUcas "pakchunk502000-Windows_0_P.ucas.bak" -Force -ErrorAction SilentlyContinue }

                Copy-Item $pakEn $basePak -Force
                Copy-Item $pakEn (Join-Path $enDir "pakchunk502000-Windows_999_P.pak") -Force

                if (-not (Test-Path $modsDir)) { New-Item -ItemType Directory -Path $modsDir -Force | Out-Null }
                Copy-Item $pakEn (Join-Path $modsDir "pakchunk502000-Windows_999_P.pak") -Force
                Write-Host "       [OK] Đã kích hoạt Tiếng Việt cho giao diện tiếng Anh!" -ForegroundColor Green
            }

            if (Test-Path $koDir) {
                Write-Host "    -> Đang patch ngôn ngữ Tiếng Hàn (ko-KR)..." -ForegroundColor Yellow
                $baseKoPak = Join-Path $koDir "pakchunk501000-Windows_0_P.pak"
                $bakKoPak = Join-Path $koDir "pakchunk501000-Windows_0_P.pak.official_bak"
                $baseKoSig = Join-Path $koDir "pakchunk501000-Windows_0_P.sig"
                $baseKoUtoc = Join-Path $koDir "pakchunk501000-Windows_0_P.utoc"
                $baseKoUcas = Join-Path $koDir "pakchunk501000-Windows_0_P.ucas"

                if (-not (Test-Path $bakKoPak) -and (Test-Path $baseKoPak)) {
                    Copy-Item $baseKoPak $bakKoPak -Force
                }
                if (Test-Path $baseKoSig) { Rename-Item $baseKoSig "pakchunk501000-Windows_0_P.sig.bak" -Force -ErrorAction SilentlyContinue }
                if (Test-Path $baseKoUtoc) { Rename-Item $baseKoUtoc "pakchunk501000-Windows_0_P.utoc.bak" -Force -ErrorAction SilentlyContinue }
                if (Test-Path $baseKoUcas) { Rename-Item $baseKoUcas "pakchunk501000-Windows_0_P.ucas.bak" -Force -ErrorAction SilentlyContinue }

                Copy-Item $pakKo $baseKoPak -Force
                Copy-Item $pakKo (Join-Path $koDir "pakchunk501000-Windows_999_P.pak") -Force
                Write-Host "       [OK] Đã kích hoạt Tiếng Việt cho giao diện tiếng Hàn!" -ForegroundColor Green
            }

            # Khóa cập nhật Purple Launcher
            $exclFile = Join-Path $dir "ExcludedUpdateList.dat"
            $exclContent = @"
Aion2/Content/Paks/L10N/Text/en-US/pakchunk502000-Windows_0_P.pak
Aion2/Content/Paks/L10N/Text/en-US/pakchunk502000-Windows_0_P.sig
Aion2/Content/Paks/L10N/Text/en-US/pakchunk502000-Windows_0_P.utoc
Aion2/Content/Paks/L10N/Text/en-US/pakchunk502000-Windows_0_P.ucas
Aion2/Content/Paks/L10N/Text/ko-KR/pakchunk501000-Windows_0_P.pak
Aion2/Content/Paks/L10N/Text/ko-KR/pakchunk501000-Windows_0_P.sig
Aion2/Content/Paks/L10N/Text/ko-KR/pakchunk501000-Windows_0_P.utoc
Aion2/Content/Paks/L10N/Text/ko-KR/pakchunk501000-Windows_0_P.ucas
"@
            [System.IO.File]::WriteAllText($exclFile, $exclContent + [Environment]::NewLine, [System.Text.Encoding]::UTF8)
            Write-Host "    -> [OK] Đã kích hoạt chống rollback tự động của Purple Launcher!" -ForegroundColor Green
        } else {
            # Deploy cho TW Client
            $twModsDir = Join-Path $dir "Aion2\\Content\\Paks\\~mods"
            if (-not (Test-Path $twModsDir)) { New-Item -ItemType Directory -Path $twModsDir -Force | Out-Null }
            Copy-Item $pakTw (Join-Path $twModsDir "pakchunk502000-Windows_999_P.pak") -Force
            Write-Host "    -> [OK] Đã cài đặt Tiếng Việt cho AION 2 TW!" -ForegroundColor Green
        }
        Write-Host ""
    }
}

if (-not $foundAny) {
    Write-Host "[!] Không tự động tìm thấy thư mục AION 2 trên máy." -ForegroundColor Yellow
    Write-Host "Vui lòng copy thủ công file trong thư mục Paks vào thư mục cài game của bạn." -ForegroundColor Yellow
} else {
    Write-Host "================================================================" -ForegroundColor Cyan
    Write-Host "  CÀI ĐẶT HOÀN TẤT! BẠN CHỈ CẦN MỞ PURPLE VÀ VÀO GAME NGAY.     " -ForegroundColor Green
    Write-Host "  KHÔNG CẦN BẬT GEARUP BOOSTER, GAME TỰ ĐỘNG HIỆN TIẾNG VIỆT!   " -ForegroundColor Green
    Write-Host "================================================================" -ForegroundColor Cyan
}

Write-Host ""
Write-Host "Nhấn phím Enter để đóng cửa sổ..." -ForegroundColor Gray
Read-Host | Out-Null
`;
fs.writeFileSync(path.join(releaseDir, 'install.ps1'), '\uFEFF' + installPs, 'utf8');

// 3b. Launcher batch script (CAI_DAT_TIENG_VIET.bat)
const installBat = `@echo off
setlocal
cd /d "%~dp0"
title AION 2 - CAI DAT VIET HOA (DOC LAP - KHONG CAN GEARUP)

powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0install.ps1"
if %errorlevel% neq 0 (
    echo.
    pause
)
`;
fs.writeFileSync(path.join(releaseDir, 'CAI_DAT_TIENG_VIET.bat'), installBat, 'ascii');

// 3c. Uninstaller script (restore original official files)
const uninstallPs = `[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
$Host.UI.RawUI.WindowTitle = "AION 2 - KHÔI PHỤC BẢN GỐC"

Write-Host "================================================================" -ForegroundColor Yellow
Write-Host "        AION 2 - KHÔI PHỤC BẢN GỐC CHÍNH THỨC CỦA GAME          " -ForegroundColor Yellow
Write-Host "================================================================" -ForegroundColor Yellow
Write-Host ""

$clients = @(
    "HKLM:\\SOFTWARE\\WOW6432Node\\plaync\\A2_WW_L_GA_PURPLE",
    "HKLM:\\SOFTWARE\\WOW6432Node\\plaync\\A2_TW_L_GA_PURPLE"
)

foreach ($key in $clients) {
    if (Test-Path $key) {
        $dir = Get-ItemPropertyValue -Path $key -Name "BaseDir" -ErrorAction SilentlyContinue
        if ($dir -and (Test-Path $dir)) {
            Write-Host "[+] Khôi phục tại: $dir" -ForegroundColor Cyan
            
            # Khôi phục en-US
            $enDir = Join-Path $dir "Aion2\\Content\\Paks\\L10N\\Text\\en-US"
            if (Test-Path $enDir) {
                $bakPak = Join-Path $enDir "pakchunk502000-Windows_0_P.pak.official_bak"
                $basePak = Join-Path $enDir "pakchunk502000-Windows_0_P.pak"
                if (Test-Path $bakPak) {
                    Move-Item $bakPak $basePak -Force
                    Write-Host "    -> Đã khôi phục file pak gốc en-US" -ForegroundColor Green
                }
                Get-ChildItem -Path $enDir -Filter "*.bak" | ForEach-Object {
                    $orig = $_.FullName.Substring(0, $_.FullName.Length - 4)
                    Move-Item $_.FullName $orig -Force
                }
                $mod999 = Join-Path $enDir "pakchunk502000-Windows_999_P.pak"
                if (Test-Path $mod999) { Remove-Item $mod999 -Force }
            }

            # Khôi phục ko-KR
            $koDir = Join-Path $dir "Aion2\\Content\\Paks\\L10N\\Text\\ko-KR"
            if (Test-Path $koDir) {
                $bakKoPak = Join-Path $koDir "pakchunk501000-Windows_0_P.pak.official_bak"
                $baseKoPak = Join-Path $koDir "pakchunk501000-Windows_0_P.pak"
                if (Test-Path $bakKoPak) {
                    Move-Item $bakKoPak $baseKoPak -Force
                    Write-Host "    -> Đã khôi phục file pak gốc ko-KR" -ForegroundColor Green
                }
                Get-ChildItem -Path $koDir -Filter "*.bak" | ForEach-Object {
                    $orig = $_.FullName.Substring(0, $_.FullName.Length - 4)
                    Move-Item $_.FullName $orig -Force
                }
                $modKo999 = Join-Path $koDir "pakchunk501000-Windows_999_P.pak"
                if (Test-Path $modKo999) { Remove-Item $modKo999 -Force }
            }

            # Xóa ~mods
            $modsDir = Join-Path $dir "Aion2\\Content\\Paks\\~mods"
            if (Test-Path $modsDir) { Remove-Item $modsDir -Recurse -Force -ErrorAction SilentlyContinue }

            # Xóa ExcludedUpdateList.dat
            $exclFile = Join-Path $dir "ExcludedUpdateList.dat"
            if (Test-Path $exclFile) { Remove-Item $exclFile -Force -ErrorAction SilentlyContinue }

            Write-Host "[✓] Đã khôi phục trạng thái nguyên bản thành công!" -ForegroundColor Green
            Write-Host ""
        }
    }
}

Write-Host "Nhấn phím Enter để đóng..." -ForegroundColor Gray
Read-Host | Out-Null
`;
fs.writeFileSync(path.join(releaseDir, 'uninstall.ps1'), '\uFEFF' + uninstallPs, 'utf8');

const uninstallBat = `@echo off
setlocal
cd /d "%~dp0"
title AION 2 - KHOI PHUC BAN GOC

powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0uninstall.ps1"
if %errorlevel% neq 0 (
    echo.
    pause
)
`;
fs.writeFileSync(path.join(releaseDir, 'KHOI_PHUC_GOC.bat'), uninstallBat, 'ascii');

// 4. Instructions
console.log('[3/4] Generating user documentation...');
const readmeContent = `========================================================================
     AION 2 - BỘ CÀI ĐẶT VIỆT HÓA ĐỘC LẬP (KHÔNG CẦN GEARUP BOOSTER)
                  Phát triển bởi: Team FEΔR / SrymC
========================================================================

ƯU ĐIỂM VƯỢT TRỘI:
✓ 100% Hoạt động độc lập, KHÔNG CẦN cài đặt hay bật GearUP Booster.
✓ Tương thích tuyệt đối với Purple Launcher (tự động khóa cập nhật đè).
✓ Dịch trọn vẹn hơn 152.000 key: giao diện, nhiệm vụ, kỹ năng, vật phẩm.
✓ Hỗ trợ cả AION 2 Global (Tiếng Anh + Tiếng Hàn) và AION 2 Đài Loan (TW).
✓ An toàn tuyệt đối: tự động sao lưu file gốc, có sẵn nút khôi phục 1-click.

------------------------------------------------------------------------
HƯỚNG DẪN CÀI ĐẶT (1-CLICK):
------------------------------------------------------------------------
1. Giải nén toàn bộ file ZIP này ra máy tính.
2. Nhấp đúp chuột vào file: "CAI_DAT_TIENG_VIET.bat"
3. Công cụ sẽ tự động tìm game, cài đặt mod và chống rollback.
4. Mở Purple và bấm CHƠI (Play) vào game thưởng thức Tiếng Việt ngay!

------------------------------------------------------------------------
HƯỚNG DẪN GỠ BỎ (VỀ LẠI TIẾNG GỐC NẾU MUỐN):
------------------------------------------------------------------------
- Nhấp đúp chuột vào file: "KHOI_PHUC_GOC.bat"
- Game sẽ ngay lập tức trở về trạng thái nguyên bản như mới tải.

------------------------------------------------------------------------
Chúc bạn có trải nghiệm thăng hoa cùng AION 2!
========================================================================
`;
fs.writeFileSync(path.join(releaseDir, 'HUONG_DAN_SU_DUNG.txt'), readmeContent, 'utf8');

// 5. Compress to ZIP
console.log('[4/4] Creating Standalone ZIP package...');
if (fs.existsSync(zipFile)) {
  fs.unlinkSync(zipFile);
}

const psCommand = `powershell -NoProfile -Command "Compress-Archive -Path '${releaseDir}\\*' -DestinationPath '${zipFile}' -CompressionLevel Optimal"`;
execSync(psCommand, { stdio: 'inherit' });

const stats = fs.statSync(zipFile);
console.log(`\nPACKAGE CREATED SUCCESSFULLY!`);
console.log(`File: ${zipFile}`);
console.log(`Size: ${(stats.size / (1024 * 1024)).toFixed(2)} MB`);
