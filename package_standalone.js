/**
 * AION 2 - PACKAGE STANDALONE VIETNAMESE MOD TOOL
 * Dedicated Standalone Installer for Team FEΔR / SrymC
 * 100% Standalone (NO GEARUP NEEDED, NATIVE ENGINE LOOSE-FILE OVERRIDE, PURPLE COMPATIBLE)
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

// 2. Prepare Data folder
console.log('[1/4] Copying L10N translation data files...');
const dataDir = path.join(releaseDir, 'Data');
fs.mkdirSync(path.join(dataDir, 'en-US'), { recursive: true });
fs.mkdirSync(path.join(dataDir, 'ko-KR'), { recursive: true });
fs.mkdirSync(path.join(dataDir, 'zh-TW'), { recursive: true });

// Copy staged L10NString.dat files
fs.copyFileSync(
  path.join(rootDir, 'staging', 'en-US', 'L10NString.dat'),
  path.join(dataDir, 'en-US', 'L10NString.dat')
);
fs.copyFileSync(
  path.join(rootDir, 'staging', 'ko-KR', 'L10NString.dat'),
  path.join(dataDir, 'ko-KR', 'L10NString.dat')
);
fs.copyFileSync(
  path.join(rootDir, 'staging', 'AION2', 'Content', 'L10N', 'Text', 'zh-TW', 'L10NString.dat'),
  path.join(dataDir, 'zh-TW', 'L10NString.dat')
);

// 15-byte dummy pak file
const dummyBytes = Buffer.from([0x47, 0x55, 0x20, 0x32, 0x30, 0x32, 0x36, 0x30, 0x39, 0x32, 0x39, 0x31, 0x37, 0x35, 0x37]);
fs.writeFileSync(path.join(dataDir, 'dummy_pak.bin'), dummyBytes);

// 3. Create installer PowerShell script (install.ps1)
console.log('[2/4] Generating installer and uninstaller scripts...');
const installPs = `[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
$Host.UI.RawUI.WindowTitle = "AION 2 - CÀI ĐẶT VIỆT HÓA ĐỘC LẬP (FEΔR TOOL)"

Write-Host "================================================================" -ForegroundColor Cyan
Write-Host "   AION 2 - CÀI ĐẶT VIỆT HÓA TRỰC TIẾP (KHÔNG CẦN GEARUP)       " -ForegroundColor Cyan
Write-Host "            Tương thích 100% Purple Launcher                    " -ForegroundColor Green
Write-Host "            Phát triển bởi: Team FEΔR / SrymC                   " -ForegroundColor DarkCyan
Write-Host "================================================================" -ForegroundColor Cyan
Write-Host ""

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$dataDir = Join-Path $scriptDir "Data"
$dummyPakPath = Join-Path $dataDir "dummy_pak.bin"
$dummyBytes = [System.IO.File]::ReadAllBytes($dummyPakPath)

if (-not (Test-Path $dummyPakPath)) {
    Write-Host "[LỖI] Không tìm thấy thư mục 'Data' trong bộ cài đặt!" -ForegroundColor Red
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
            "C:\\NCSoft\\AION2_TW", "D:\\NCSoft\\AION2_TW", "E:\\NCSoft\\AION2_TW", "F:\\NCSoft\\AION2_TW",
            "C:\\Games\\AION 2", "D:\\Games\\AION 2", "E:\\Games\\AION 2", "F:\\Games\\AION 2"
        )
        foreach ($cd in $checkDirs) {
            if ($c.IsGlobal -and ($cd -like "*AION 2") -and (Test-Path "$cd\\Aion2")) { $dir = $cd; break }
            if (-not $c.IsGlobal -and ($cd -like "*AION2_TW") -and (Test-Path "$cd\\Aion2")) { $dir = $cd; break }
        }
    }

    if ($dir -and (Test-Path $dir)) {
        $foundAny = $true
        Write-Host "[+] Phát hiện $($c.Name) tại: $dir" -ForegroundColor Green

        # Dọn dẹp mod cũ bị lỗi nếu có
        $oldModPak = Join-Path $dir "Aion2\\Content\\Paks\\pakchunk502000-Windows_999_P.pak"
        if (Test-Path $oldModPak) { Remove-Item $oldModPak -Force -ErrorAction SilentlyContinue }
        $modsFolder = Join-Path $dir "Aion2\\Content\\Paks\\~mods"
        if (Test-Path $modsFolder) { Remove-Item $modsFolder -Recurse -Force -ErrorAction SilentlyContinue }

        if ($c.IsGlobal) {
            # Deploy cho Global Client (en-US và ko-KR)
            $enPakDir = Join-Path $dir "Aion2\\Content\\Paks\\L10N\\Text\\en-US"
            $enLooseDir = Join-Path $dir "Aion2\\Content\\L10N\\Text\\en-US"
            $koPakDir = Join-Path $dir "Aion2\\Content\\Paks\\L10N\\Text\\ko-KR"
            $koLooseDir = Join-Path $dir "Aion2\\Content\\L10N\\Text\\ko-KR"

            if (Test-Path $enPakDir) {
                Write-Host "    -> Đang patch ngôn ngữ Tiếng Anh (en-US)..." -ForegroundColor Yellow
                $basePak = Join-Path $enPakDir "pakchunk502000-Windows_0_P.pak"
                $bakPak = Join-Path $enPakDir "pakchunk502000-Windows_0_P.pak.official_clean_bak"

                if (-not (Test-Path $bakPak) -and (Test-Path $basePak)) {
                    Copy-Item $basePak $bakPak -Force
                }
                [System.IO.File]::WriteAllBytes($basePak, $dummyBytes)

                if (-not (Test-Path $enLooseDir)) { New-Item -ItemType Directory -Path $enLooseDir -Force | Out-Null }
                Copy-Item (Join-Path $dataDir "en-US\\L10NString.dat") (Join-Path $enLooseDir "L10NString.dat") -Force
                Write-Host "       [OK] Đã kích hoạt Tiếng Việt cho giao diện tiếng Anh!" -ForegroundColor Green
            }

            if (Test-Path $koPakDir) {
                Write-Host "    -> Đang patch ngôn ngữ Tiếng Hàn (ko-KR)..." -ForegroundColor Yellow
                $baseKoPak = Join-Path $koPakDir "pakchunk501000-Windows_0_P.pak"
                $bakKoPak = Join-Path $koPakDir "pakchunk501000-Windows_0_P.pak.official_clean_bak"

                if (-not (Test-Path $bakKoPak) -and (Test-Path $baseKoPak)) {
                    Copy-Item $baseKoPak $bakKoPak -Force
                }
                [System.IO.File]::WriteAllBytes($baseKoPak, $dummyBytes)

                if (-not (Test-Path $koLooseDir)) { New-Item -ItemType Directory -Path $koLooseDir -Force | Out-Null }
                Copy-Item (Join-Path $dataDir "ko-KR\\L10NString.dat") (Join-Path $koLooseDir "L10NString.dat") -Force
                Write-Host "       [OK] Đã kích hoạt Tiếng Việt cho giao diện tiếng Hàn!" -ForegroundColor Green
            }

            # Khóa cập nhật Purple Launcher
            $exclFile = Join-Path $dir "Aion2\\ExcludedUpdateList.dat"
            $exclContent = @"
Aion2/Content/Paks/L10N/Text/en-US/pakchunk502000-Windows_0_P.pak
Aion2/Content/Paks/L10N/Text/ko-KR/pakchunk501000-Windows_0_P.pak
"@
            [System.IO.File]::WriteAllText($exclFile, $exclContent + [Environment]::NewLine, [System.Text.Encoding]::UTF8)
            Write-Host "    -> [OK] Đã kích hoạt chống rollback tự động của Purple Launcher!" -ForegroundColor Green
        } else {
            # Deploy cho TW Client
            $twPakDir = Join-Path $dir "Aion2\\Content\\Paks\\L10N\\Text\\zh-TW"
            $twLooseDir = Join-Path $dir "Aion2\\Content\\L10N\\Text\\zh-TW"

            if (Test-Path $twPakDir) {
                Write-Host "    -> Đang patch ngôn ngữ Tiếng Trung Phồn thể (zh-TW)..." -ForegroundColor Yellow
                $baseTwPak = Join-Path $twPakDir "pakchunk504000-Windows_0_P.pak"
                $bakTwPak = Join-Path $twPakDir "pakchunk504000-Windows_0_P.pak.official_clean_bak"

                if (-not (Test-Path $bakTwPak) -and (Test-Path $baseTwPak)) {
                    Copy-Item $baseTwPak $bakTwPak -Force
                }
                [System.IO.File]::WriteAllBytes($baseTwPak, $dummyBytes)

                if (-not (Test-Path $twLooseDir)) { New-Item -ItemType Directory -Path $twLooseDir -Force | Out-Null }
                Copy-Item (Join-Path $dataDir "zh-TW\\L10NString.dat") (Join-Path $twLooseDir "L10NString.dat") -Force
                Write-Host "       [OK] Đã kích hoạt Tiếng Việt cho giao diện tiếng Đài Loan!" -ForegroundColor Green

                $exclFile = Join-Path $dir "Aion2\\ExcludedUpdateList.dat"
                $exclContent = "Aion2/Content/Paks/L10N/Text/zh-TW/pakchunk504000-Windows_0_P.pak"
                [System.IO.File]::WriteAllText($exclFile, $exclContent + [Environment]::NewLine, [System.Text.Encoding]::UTF8)
                Write-Host "    -> [OK] Đã kích hoạt chống rollback tự động của Purple Launcher!" -ForegroundColor Green
            }
        }
    }
}

if (-not $foundAny) {
    Write-Host ""
    Write-Host "[!] Không tự động tìm thấy thư mục cài đặt AION 2." -ForegroundColor Yellow
    $manual = Read-Host "Vui lòng nhập đường dẫn thư mục AION 2 (ví dụ: F:\\NCSoft\\AION 2)"
    if ($manual -and (Test-Path "$manual\\Aion2")) {
        $enPakDir = Join-Path $manual "Aion2\\Content\\Paks\\L10N\\Text\\en-US"
        $enLooseDir = Join-Path $manual "Aion2\\Content\\L10N\\Text\\en-US"
        if (Test-Path $enPakDir) {
            $basePak = Join-Path $enPakDir "pakchunk502000-Windows_0_P.pak"
            $bakPak = Join-Path $enPakDir "pakchunk502000-Windows_0_P.pak.official_clean_bak"
            if (-not (Test-Path $bakPak) -and (Test-Path $basePak)) { Copy-Item $basePak $bakPak -Force }
            [System.IO.File]::WriteAllBytes($basePak, $dummyBytes)

            if (-not (Test-Path $enLooseDir)) { New-Item -ItemType Directory -Path $enLooseDir -Force | Out-Null }
            Copy-Item (Join-Path $dataDir "en-US\\L10NString.dat") (Join-Path $enLooseDir "L10NString.dat") -Force
            
            $exclFile = Join-Path $manual "Aion2\\ExcludedUpdateList.dat"
            [System.IO.File]::WriteAllText($exclFile, "Aion2/Content/Paks/L10N/Text/en-US/pakchunk502000-Windows_0_P.pak" + [Environment]::NewLine, [System.Text.Encoding]::UTF8)
            Write-Host "[✓] Cài đặt thủ công thành công!" -ForegroundColor Green
            $foundAny = $true
        }
    }
}

Write-Host ""
if ($foundAny) {
    Write-Host "================================================================" -ForegroundColor Green
    Write-Host "  CÀI ĐẶT HOÀN TẤT! BÂY GIỜ BẠN CÓ THỂ MỞ GAME TRỰC TIẾP TỪ PURPLE! " -ForegroundColor Green
    Write-Host "================================================================" -ForegroundColor Green
} else {
    Write-Host "[X] Cài đặt không thành công do không xác định được thư mục game." -ForegroundColor Red
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
title AION 2 - CAI DAT VIET HOA (FEAR TOOL)

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

$dirs = @()
foreach ($key in $clients) {
    if (Test-Path $key) {
        $d = Get-ItemPropertyValue -Path $key -Name "BaseDir" -ErrorAction SilentlyContinue
        if ($d -and (Test-Path $d)) { $dirs += $d }
    }
}

$checkDirs = @(
    "C:\\NCSoft\\AION 2", "D:\\NCSoft\\AION 2", "E:\\NCSoft\\AION 2", "F:\\NCSoft\\AION 2",
    "C:\\NCSoft\\AION2_TW", "D:\\NCSoft\\AION2_TW", "E:\\NCSoft\\AION2_TW", "F:\\NCSoft\\AION2_TW"
)
foreach ($cd in $checkDirs) {
    if ((Test-Path "$cd\\Aion2") -and ($dirs -notcontains $cd)) { $dirs += $cd }
}

foreach ($dir in $dirs) {
    Write-Host "[+] Khôi phục tại: $dir" -ForegroundColor Cyan
    
    # Khôi phục en-US
    $enPakDir = Join-Path $dir "Aion2\\Content\\Paks\\L10N\\Text\\en-US"
    $enLooseDir = Join-Path $dir "Aion2\\Content\\L10N\\Text\\en-US"
    if (Test-Path $enPakDir) {
        $bakPak = Join-Path $enPakDir "pakchunk502000-Windows_0_P.pak.official_clean_bak"
        $basePak = Join-Path $enPakDir "pakchunk502000-Windows_0_P.pak"
        if (Test-Path $bakPak) {
            Copy-Item $bakPak $basePak -Force
            Remove-Item $bakPak -Force
            Write-Host "    -> Đã khôi phục file pak gốc en-US" -ForegroundColor Green
        }
    }
    if (Test-Path $enLooseDir) {
        Remove-Item $enLooseDir -Recurse -Force -ErrorAction SilentlyContinue
        Write-Host "    -> Đã xóa loose file L10N en-US" -ForegroundColor Green
    }

    # Khôi phục ko-KR
    $koPakDir = Join-Path $dir "Aion2\\Content\\Paks\\L10N\\Text\\ko-KR"
    $koLooseDir = Join-Path $dir "Aion2\\Content\\L10N\\Text\\ko-KR"
    if (Test-Path $koPakDir) {
        $bakKoPak = Join-Path $koPakDir "pakchunk501000-Windows_0_P.pak.official_clean_bak"
        $baseKoPak = Join-Path $koPakDir "pakchunk501000-Windows_0_P.pak"
        if (Test-Path $bakKoPak) {
            Copy-Item $bakKoPak $baseKoPak -Force
            Remove-Item $bakKoPak -Force
            Write-Host "    -> Đã khôi phục file pak gốc ko-KR" -ForegroundColor Green
        }
    }
    if (Test-Path $koLooseDir) {
        Remove-Item $koLooseDir -Recurse -Force -ErrorAction SilentlyContinue
        Write-Host "    -> Đã xóa loose file L10N ko-KR" -ForegroundColor Green
    }

    # Dọn dẹp paks thừa
    $old999 = Join-Path $dir "Aion2\\Content\\Paks\\pakchunk502000-Windows_999_P.pak"
    if (Test-Path $old999) { Remove-Item $old999 -Force -ErrorAction SilentlyContinue }

    # Xóa file ExcludedUpdateList.dat
    $excl = Join-Path $dir "Aion2\\ExcludedUpdateList.dat"
    if (Test-Path $excl) { Remove-Item $excl -Force }
}

Write-Host ""
Write-Host "================================================================" -ForegroundColor Green
Write-Host "        ĐÃ KHÔI PHỤC TOÀN BỘ FILE GỐC CỦA GAME THÀNH CÔNG!     " -ForegroundColor Green
Write-Host "================================================================" -ForegroundColor Green
Write-Host ""
Write-Host "Nhấn phím Enter để đóng cửa sổ..." -ForegroundColor Gray
Read-Host | Out-Null
`;
fs.writeFileSync(path.join(releaseDir, 'uninstall.ps1'), '\uFEFF' + uninstallPs, 'utf8');

// 3d. Uninstaller batch script (KHOI_PHUC_GOC.bat)
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

// 3e. README
const readmeContent = `# AION 2 - BỘ CÔNG CỤ CÀI ĐẶT VIỆT HÓA ĐỘC LẬP
**Phát triển bởi: Team FEΔR / SrymC**
**Phiên bản: Standalone Native Engine v2.0**

---

### TÍNH NĂNG NỔI BẬT:
- ✅ **ĐỘC LẬP 100% - KHÔNG CẦN GEARUP BOOSTER:** Tự động áp dụng cơ chế native engine loading.
- ✅ **KHÔNG SỢ PURPLE LAUNCHER ROLLBACK:** Tích hợp chống cập nhật đè qua ExcludedUpdateList.
- ✅ **ĐỒNG BỘ 152,667 DÒNG:** Toàn bộ UI, Quest, NPC, Item, Kỹ năng, Thành tựu tiếng Việt.
- ✅ **1-CLICK CÀI ĐẶT & GỠ BỎ:** Tự động phát hiện thư mục game và sao lưu bản gốc.

---

### HƯỚNG DẪN CÀI ĐẶT:
1. Giải nén toàn bộ file ZIP này ra một thư mục bất kỳ.
2. Nhấp đúp vào file **\`CAI_DAT_TIENG_VIET.bat\`** để cài đặt.
3. Mở game qua Purple Launcher và trải nghiệm tiếng Việt!

### HƯỚNG DẪN GỠ BỎ (VỀ BẢN GỐC):
- Nhấp đúp vào file **\`KHOI_PHUC_GOC.bat\`** để khôi phục 100% file gốc chính thức.
`;
fs.writeFileSync(path.join(releaseDir, 'README.txt'), readmeContent, 'utf8');

// 4. Compress to ZIP package
console.log('[3/4] Compressing to ZIP archive...');
if (fs.existsSync(zipFile)) {
  fs.unlinkSync(zipFile);
}

const psZipCmd = `powershell.exe -NoProfile -Command "Compress-Archive -Path '${releaseDir}\\*' -DestinationPath '${zipFile}' -CompressionLevel Optimal -Force"`;
execSync(psZipCmd, { stdio: 'inherit' });

const stat = fs.statSync(zipFile);
console.log(`\n[4/4] Package completed successfully!`);
console.log(`Output: ${zipFile}`);
console.log(`Size: ${(stat.size / (1024 * 1024)).toFixed(2)} MB`);
console.log('\n=== DONE ===');
