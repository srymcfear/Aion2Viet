/**
 * AION 2 - PACKAGE SHAREABLE PURPLE TRANSLATE MOD
 * Prepares the release folder and generates a clean ZIP package for sharing with users.
 */
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const rootDir = __dirname;
const templateDir = 'H:\\AION2_Code\\aion2wwpurple-translate\\Aion2';
const releaseDir = path.join(rootDir, 'release', 'AION2_VietHoa_Purple_Mod');
const zipFile = path.join(rootDir, 'AION2_VietHoa_Purple_Mod.zip');

console.log('=== AION 2 VIETNAMESE MOD PACKAGING ENGINE ===\n');

// 1. Clean & recreate release directory
if (fs.existsSync(releaseDir)) {
  fs.rmSync(releaseDir, { recursive: true, force: true });
}
fs.mkdirSync(releaseDir, { recursive: true });

// 2. Copy Aion2 directory from purple-translate template
console.log('[1/4] Copying template files...');
const destAion2 = path.join(releaseDir, 'Aion2');
fs.cpSync(templateDir, destAion2, { recursive: true });

// 3. Create 1-click automatic installer scripts
console.log('[2/4] Generating 1-click installer...');

// 3a. Robust PowerShell script (full UTF-8, color HUD, safe Registry & Copy)
const psScript = `[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
$Host.UI.RawUI.WindowTitle = "AION 2 - CÀI ĐẶT BẢN VIỆT HÓA (PURPLE MOD)"

Write-Host "================================================================" -ForegroundColor Cyan
Write-Host "       AION 2 - CÀI ĐẶT BẢN DỊCH VIỆT HÓA (PURPLE MOD)         " -ForegroundColor Cyan
Write-Host "                 Thực hiện bởi: Team FEΔR / SrymC               " -ForegroundColor DarkCyan
Write-Host "================================================================" -ForegroundColor Cyan
Write-Host ""

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$srcAion2 = Join-Path $scriptDir "Aion2"

if (-not (Test-Path $srcAion2)) {
    Write-Host "[LỖI] Không tìm thấy thư mục 'Aion2' trong bộ cài đặt!" -ForegroundColor Red
    Write-Host "Vui lòng giải nén toàn bộ file ZIP trước khi chạy." -ForegroundColor Red
    Write-Host ""
    Read-Host "Nhấn phím Enter để thoát..."
    exit 1
}

$found = $false
$regKeys = @(
    "HKLM:\\SOFTWARE\\WOW6432Node\\plaync\\A2_WW_L_GA_PURPLE",
    "HKLM:\\SOFTWARE\\WOW6432Node\\plaync\\A2_TW_L_GA_PURPLE"
)

foreach ($key in $regKeys) {
    if (Test-Path $key) {
        $baseDir = Get-ItemPropertyValue -Path $key -Name "BaseDir" -ErrorAction SilentlyContinue
        if ($baseDir -and (Test-Path $baseDir)) {
            $clientName = if ($key -like "*A2_WW*") { "AION 2 Global" } else { "AION 2 TW" }
            Write-Host "[+] Tìm thấy $clientName tại: $baseDir" -ForegroundColor Green
            Write-Host "    Đang sao chép file Việt hóa..." -ForegroundColor Yellow
            
            $destDir = Join-Path $baseDir "Aion2"
            Copy-Item -Path "$srcAion2\\*" -Destination $destDir -Recurse -Force
            
            Write-Host "[✓] Cài đặt thành công cho $clientName!" -ForegroundColor Green
            Write-Host ""
            $found = $true
        }
    }
}

if (-not $found) {
    Write-Host "[!] Không tìm thấy đường dẫn trong Registry. Đang quét các ổ đĩa..." -ForegroundColor Yellow
    $drives = Get-PSDrive -PSProvider FileSystem | Select-Object -ExpandProperty Root
    $candidates = @()
    foreach ($d in $drives) {
        $candidates += Join-Path $d "NCSoft\\AION 2"
        $candidates += Join-Path $d "NCSoft\\AION2_TW"
        $candidates += Join-Path $d "Games\\AION 2"
        $candidates += Join-Path $d "Program Files\\NCSoft\\AION 2"
    }

    foreach ($cand in $candidates) {
        if (Test-Path "$cand\\Aion2") {
            Write-Host "[+] Tìm thấy game tại: $cand" -ForegroundColor Green
            Write-Host "    Đang sao chép file Việt hóa..." -ForegroundColor Yellow
            $destDir = Join-Path $cand "Aion2"
            Copy-Item -Path "$srcAion2\\*" -Destination $destDir -Recurse -Force
            Write-Host "[✓] Cài đặt thành công!" -ForegroundColor Green
            Write-Host ""
            $found = $true
            break
        }
    }
}

if ($found) {
    Write-Host "================================================================" -ForegroundColor Cyan
    Write-Host "  HOÀN TẤT CÀI ĐẶT VIỆT HÓA! BẠN CÓ THỂ MỞ PURPLE VÀ VÀO GAME.  " -ForegroundColor Green
    Write-Host "================================================================" -ForegroundColor Cyan
} else {
    Write-Host "[LƯU Ý] Không tự động phát hiện được thư mục game." -ForegroundColor Yellow
    Write-Host "Bạn chỉ cần COPY thư mục 'Aion2' này và DÁN ĐÈ vào thư mục cài game." -ForegroundColor Yellow
    Write-Host "(Ví dụ: F:\\NCSoft\\AION 2\\)" -ForegroundColor DarkGray
}

Write-Host ""
Write-Host "Nhấn phím Enter để hoàn tất..." -ForegroundColor Gray
Read-Host | Out-Null
`;
// Write with UTF-8 BOM so Windows PowerShell 5.1 parses UTF-8 correctly
fs.writeFileSync(path.join(releaseDir, 'install.ps1'), '\uFEFF' + psScript, 'utf8');

// 3b. Bulletproof ANSI launcher batch script (no unicode corruption, 1-click execution)
const batScript = `@echo off
setlocal
cd /d "%~dp0"
title AION 2 - CAI DAT VIET HOA (PURPLE MOD)

powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0install.ps1"
if %errorlevel% equ 0 goto :DONE

echo.
echo [!] PowerShell gap su co, chuyen sang che do cai dat truc tiep...
set "SRC=%~dp0Aion2"
set "FOUND=0"

for /f "tokens=2* skip=2" %%a in ('reg query "HKLM\\SOFTWARE\\WOW6432Node\\plaync\\A2_WW_L_GA_PURPLE" /v "BaseDir" 2^>nul') do (
    if exist "%%b" (
        echo [*] Tim thay AION 2 Global tai: %%b
        xcopy /E /I /Y /Q "%SRC%" "%%b\\Aion2" >nul
        set "FOUND=1"
    )
)

for /f "tokens=2* skip=2" %%a in ('reg query "HKLM\\SOFTWARE\\WOW6432Node\\plaync\\A2_TW_L_GA_PURPLE" /v "BaseDir" 2^>nul') do (
    if exist "%%b" (
        echo [*] Tim thay AION 2 TW tai: %%b
        xcopy /E /I /Y /Q "%SRC%" "%%b\\Aion2" >nul
        set "FOUND=1"
    )
)

if "%FOUND%"=="1" (
    echo.
    echo [OK] Cai dat Viet hoa thanh cong!
) else (
    echo.
    echo [!] Khong the tu dong tim duong dan game.
    echo Vui long copy thu muc "Aion2" vao thu muc game cua ban.
)

:DONE
echo.
pause
`;
fs.writeFileSync(path.join(releaseDir, 'CAI_DAT_TU_DONG.bat'), batScript, 'ascii');

// 4. Create README / Instructions (HUONG_DAN_SU_DUNG.txt)
console.log('[3/4] Generating user documentation...');
const readmeContent = `========================================================================
     AION 2 - BẢN DỊCH VIỆT HÓA CHUẨN PURPLE (ĐẦY ĐỦ 8 NGÔN NGỮ)
                   Phát triển bởi: Team FEΔR / SrymC
========================================================================

ĐẶC ĐIỂM NỔI BẬT:
- Dịch hoàn chỉnh hơn 152.000 key giao diện, nhiệm vụ, kỹ năng, vật phẩm, hướng dẫn.
- Áp dụng cơ chế Purple Translate Mod mới nhất, không bao giờ bị Purple Launcher quét hash hay rollback file khi khởi động.
- Hỗ trợ toàn bộ các ngôn ngữ trong game: Tiếng Anh (en-US), Hàn (ko-KR), Nhật (ja-JP), Đức, Pháp, Tây Ban Nha, Bồ Đào Nha, Nga. Bạn chọn ngôn ngữ nào trong game cũng hiển thị tiếng Việt mượt mà!

------------------------------------------------------------------------
CÁCH 1: CÀI ĐẶT TỰ ĐỘNG 1-CLICK (KHUYÊN DÙNG)
------------------------------------------------------------------------
1. Giải nén toàn bộ file ZIP này ra một thư mục.
2. Nhấp đúp chuột vào file: "CAI_DAT_TU_DONG.bat"
3. Chương trình sẽ tự động tìm thư mục game AION 2 (Global & TW) và chép file vào đúng chỗ.
4. Mở Purple và vào game tận hưởng tiếng Việt!

------------------------------------------------------------------------
CÁCH 2: CÀI ĐẶT THỦ CÔNG (BẰNG TAY)
------------------------------------------------------------------------
1. Giải nén file ZIP.
2. Bạn sẽ thấy thư mục tên "Aion2".
3. Copy thư mục "Aion2" đó và Paste (dán đè) vào thư mục cài đặt game của bạn:
   - Thường là: F:\\NCSoft\\AION 2\\ (hoặc C:\\NCSoft\\AION 2\\, D:\\NCSoft\\AION 2\\...)
   - Khi Windows hỏi có ghi đè (Replace/Merge) thư mục không, hãy chọn "Yes" (hoặc "Replace files in destination").
4. Khởi động game qua Purple.

------------------------------------------------------------------------
LƯU Ý:
- Khi game có bản cập nhật mới lớn từ nhà phát hành NCSoft, chỉ cần cập nhật lại bản mod mới nhất là xong.
- Chúc bạn có trải nghiệm tuyệt vời cùng thế giới AION 2!
========================================================================
`;
fs.writeFileSync(path.join(releaseDir, 'HUONG_DAN_SU_DUNG.txt'), readmeContent, 'utf8');

// 5. Compress to ZIP
console.log('[4/4] Creating ZIP package...');
if (fs.existsSync(zipFile)) {
  fs.unlinkSync(zipFile);
}

// Use PowerShell Compress-Archive
const psCommand = `powershell -NoProfile -Command "Compress-Archive -Path '${releaseDir}\\*' -DestinationPath '${zipFile}' -CompressionLevel Optimal"`;
execSync(psCommand, { stdio: 'inherit' });

const stats = fs.statSync(zipFile);
console.log(`\nPACKAGE CREATED SUCCESSFULLY!`);
console.log(`File: ${zipFile}`);
console.log(`Size: ${(stats.size / (1024 * 1024)).toFixed(2)} MB`);
