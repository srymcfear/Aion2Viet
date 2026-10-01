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

// 3. Create 1-click automatic installer batch script (CAI_DAT_TU_DONG.bat)
console.log('[2/4] Generating 1-click installer...');
const batScript = `@echo off
chcp 65001 >nul
title AION 2 - CÀI ĐẶT BẢN VIỆT HÓA (PURPLE MOD)
color 0b

echo ================================================================
echo        AION 2 - CÀI ĐẶT BẢN DỊCH VIỆT HÓA (PURPLE MOD)
echo                  Thực hiện bởi: Team FEΔR / SrymC
echo ================================================================
echo.

setlocal enabledelayedexpansion
set "FOUND=0"
set "SRC_DIR=%~dp0Aion2"

if not exist "!SRC_DIR!" (
    color 0c
    echo [LỖI] Không tìm thấy thư mục "Aion2" trong bộ cài đặt!
    echo Vui lòng giải nén toàn bộ file zip trước khi chạy file này.
    goto :FAIL
)

:: 1. Kiểm tra Global Client (A2_WW)
for /f "tokens=2* skip=2" %%a in ('reg query "HKLM\\SOFTWARE\\WOW6432Node\\plaync\\A2_WW_L_GA_PURPLE" /v "BaseDir" 2^>nul') do (
    set "GAME_GLOBAL=%%b"
)

:: 2. Kiểm tra TW Client (A2_TW)
for /f "tokens=2* skip=2" %%a in ('reg query "HKLM\\SOFTWARE\\WOW6432Node\\plaync\\A2_TW_L_GA_PURPLE" /v "BaseDir" 2^>nul') do (
    set "GAME_TW=%%b"
)

:: Cài đặt cho Global Client nếu tìm thấy
if defined GAME_GLOBAL (
    if exist "!GAME_GLOBAL!" (
        echo [OK] Tìm thấy AION 2 Global tại: !GAME_GLOBAL!
        echo Đang sao chép file Việt hóa vào game...
        xcopy /E /I /Y /Q "!SRC_DIR!" "!GAME_GLOBAL!\\Aion2" >nul
        echo [THÀNH CÔNG] Đã cài đặt Việt hóa cho AION 2 Global!
        echo.
        set "FOUND=1"
    )
)

:: Cài đặt cho TW Client nếu tìm thấy
if defined GAME_TW (
    if exist "!GAME_TW!" (
        echo [OK] Tìm thấy AION 2 Đài Loan (TW) tại: !GAME_TW!
        echo Đang sao chép file Việt hóa vào game...
        xcopy /E /I /Y /Q "!SRC_DIR!" "!GAME_TW!\\Aion2" >nul
        echo [THÀNH CÔNG] Đã cài đặt Việt hóa cho AION 2 TW!
        echo.
        set "FOUND=1"
    )
)

:: Nếu không tìm thấy qua Registry, tìm qua các ổ đĩa mặc định
if "!FOUND!"=="0" (
    echo [THÔNG BÁO] Không tự động quét được đường dẫn qua Registry.
    echo Đang kiểm tra các thư mục mặc định thông dụng...

    set "FALLBACK_DIRS=C:\\NCSoft\\AION 2;D:\\NCSoft\\AION 2;E:\\NCSoft\\AION 2;F:\\NCSoft\\AION 2;G:\\NCSoft\\AION 2;H:\\NCSoft\\AION 2;C:\\Program Files\\NCSoft\\AION 2;D:\\Games\\AION 2;E:\\Games\\AION 2;F:\\Games\\AION 2"
    
    for %%d in (!FALLBACK_DIRS!) do (
        if exist "%%~d\\Aion2" (
            echo [OK] Tìm thấy game tại: %%~d
            echo Đang sao chép file Việt hóa...
            xcopy /E /I /Y /Q "!SRC_DIR!" "%%~d\\Aion2" >nul
            echo [THÀNH CÔNG] Đã cài đặt Việt hóa thành công!
            echo.
            set "FOUND=1"
        )
    )
)

if "!FOUND!"=="0" (
    color 0e
    echo [LƯU Ý] Không tìm thấy thư mục cài đặt AION 2 tự động.
    echo Bạn chỉ cần COPY thư mục "Aion2" trong này và PASTE (GHI ĐÈ) vào thư mục cài đặt game của bạn.
    echo (Ví dụ: F:\\NCSoft\\AION 2\\)
    echo.
) else (
    color 0a
    echo ================================================================
    echo    HOÀN TẤT CÀI ĐẶT VIỆT HÓA! BẠN CÓ THỂ MỞ PURPLE VÀ VÀO GAME.
    echo ================================================================
)

goto :END

:FAIL
pause
exit /b 1

:END
echo.
pause
exit /b 0
`;
fs.writeFileSync(path.join(releaseDir, 'CAI_DAT_TU_DONG.bat'), batScript, 'utf8');

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

const parentDir = path.dirname(releaseDir);
const folderName = path.basename(releaseDir);

// Use PowerShell Compress-Archive
const psCommand = `powershell -NoProfile -Command "Compress-Archive -Path '${releaseDir}\\*' -DestinationPath '${zipFile}' -CompressionLevel Optimal"`;
execSync(psCommand, { stdio: 'inherit' });

const stats = fs.statSync(zipFile);
console.log(`\nPACKAGE CREATED SUCCESSFULLY!`);
console.log(`File: ${zipFile}`);
console.log(`Size: ${(stats.size / (1024 * 1024)).toFixed(2)} MB`);
