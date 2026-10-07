# Những điều cần lưu ý (Project & Dev Guidelines)

- **Tiến độ & Lộ trình Dự án:** Đọc chi tiết tại [PROJECT_ROADMAP.md](file:///h:/AION2_Code/trans/PROJECT_ROADMAP.md). File này lưu trữ toàn bộ kiến trúc, tiến độ đã hoàn thành qua các phiên bản (hiện tại v1.1.1), các đầu việc tiếp theo và hướng dẫn build/release.
- Sau khi hoàn thành mỗi thay đổi, đều bắt buộc phải tạo một Git commit tương ứng để tiện cho việc theo dõi và khôi phục (rollback) sau này.
- Sau mỗi thay đổi, đều bắt buộc phải viết mới hoặc cập nhật các kiểm thử (test) liên quan, đồng thời đảm bảo toàn bộ kiểm thử và xác thực đều vượt qua trước khi bàn giao cho người dùng.
- **Quy tắc dịch thuật AION 2:**
  - **TUYỆT ĐỐI KHÔNG DỊCH TÊN KỸ NĂNG, NỘI TẠI VÀ STIGMA** (Giữ nguyên 100% tiếng Anh gốc, ví dụ: *Aerial Bind*, *Heart Gore*, *Illusive Clone*, *Shadowstrike*, *Tenacity*, v.v.).
  - Chỉ dịch phần mô tả hiệu ứng, cơ chế, chỉ số (tooltip, effect description). Bất kỳ tham chiếu tên skill/passive/stigma trong ngoặc vuông `[...]` hoặc tiêu đề hiển thị đều giữ nguyên tên gốc EN.
  - **TUYỆT ĐỐI KHÔNG DỊCH TIÊU ĐỀ CÁC CHẾ ĐỘ CHƠI VÀ HỆ THỐNG ĐẶC TRƯNG (GAME MODES & SYSTEMS):**
    - Giữ nguyên 100% tiếng Anh gốc: *Season*, *Transcendence*, *Nightmare*, *Ascension Trial*, *Abyss*, *Arena*, *Arcana*.
    - Không dịch thành các từ như: Mùa, Siêu việt, Ác mộng, Vực thẳm, Đấu trường, Phép thuật.
- **Quy trình Đóng gói & Phát hành:**
  - Đóng gói bằng PyInstaller (`F-Aion_2_Tools.spec` và `plugins/twitch_drops/TwitchDropsMiner.spec`).
  - Đóng gói Standalone zip: `node package_standalone.js`.
  - Push commit lên cả 2 remote git: `origin` (`srymcfear/DEV-Aion2Viet`) và `public` (`srymcfear/Aion2Viet`).
  - Tự động release đồng bộ lên 2 kho GitHub bằng script `python scratch/publish_to_github.py`.
