# Bàn giao triển khai web game cho Antigravity

## Yêu cầu của người dùng

Triển khai game **Tàn Tro Mùa Gặt** thành web game chơi được trên trình duyệt, dựa trên toàn bộ bản thiết kế `docs/THIET_KE_GAME.md` và asset trong thư mục `assets` của workspace này.

Đọc bản thiết kế trước khi triển khai. Xem `docs/asset-audit.png` và `docs/character-audit.png` để hiểu hình thực tế. Không lấy các tên minh họa hoặc tuyên bố có sẵn game trong `assets/HUONG_DAN_ASSET.md` làm hiện trạng mã nguồn.

## Đầu ra

- Làm việc ngay trong workspace game_rpg hiện tại. Kiểm tra mã hiện có trước khi tạo hoặc sửa file, giữ nguyên asset gốc và tài liệu.
- Xây dựng game canvas/WebGL chạy trong trình duyệt desktop, chọn công nghệ phù hợp sau khi kiểm tra môi trường; giao diện và hướng dẫn bằng tiếng Việt.
- Bắt đầu bằng MVP hoàn chỉnh: 3 màn thường + 1 boss Orc, Soldier điều khiển WASD, chém theo chuột, lướt Space, quái có báo đòn, XP/level chọn 1 trong 3 nâng cấp, 3 di vật, rương, thắng/thua và chơi lại.
- Hoàn thiện save tiến triển bằng cơ chế lưu cục bộ của trình duyệt, menu, pause, âm lượng, HUD và nhạc bắt đầu sau tương tác người chơi.
- Sau khi MVP chạy và được kiểm thử, tiếp tục mở rộng theo thứ tự ưu tiên trong bản thiết kế tới mục tiêu 12 màn/3 chương, 3 boss, 6 di vật, tiến hóa, cửa hàng, meta và Gặt Tham. Nếu không hoàn tất trong một phiên, ghi chính xác phần đã làm, phần còn thiếu và bước kế tiếp.
- Tạo hướng dẫn chạy/build, chạy kiểm tra phù hợp và thực sự mở thử game. Báo địa chỉ preview, các thao tác và giới hạn còn lại; không chỉ tạo tài liệu hoặc mockup.

## Điều kiện kỹ thuật và asset

- Soldier/Orc dùng frame 100×100 nhưng hình nhân vật nhỏ bên trong: cắt frame/pivot/hitbox chính xác, không co cả sheet vào một sprite.
- shadow_imp là gà, void_beast là bò, dark_cultist là nhân vật Farm RPG. Các biến thể phép/lời nguyền cần hiệu ứng và hành vi bằng mã.
- Nền Farm RPG là góc nhìn trên xuống; không trộn block isometric vào bản đầu.
- Vũ khí trong weapons chủ yếu là icon: triển khai di vật/phép độc lập thay vì giả định đã có animation đổi đồ cầm tay.
- Dùng đúng file hiện có, manifest chỉ gồm asset dùng trong game; không đóng gói toàn bộ hàng nghìn icon không dùng.
- Đồng hồ độ khó chỉ chạy lúc giao tranh, dừng ở pause/shop/chọn nâng cấp. Vượt màn phải có mục tiêu hữu hạn và cổng tới được.
- Chặn double-hit, nâng cấp trùng/vượt cấp, spawn đè người chơi và ghi thưởng hai lần. Có fallback khi lưu cục bộ không khả dụng và thông báo thiếu asset.
- Giữ tác vụ ở môi trường phát triển cục bộ; việc xuất bản/hosting công khai chưa nằm trong lần bàn giao này.

## Tiêu chí báo hoàn thành

Chơi được từ menu tới thắng hoặc chết rồi chơi lại; animation đúng; không lỗi tải asset/console nghiêm trọng; level, build, boss, chuyển màn và save hoạt động. Nêu rõ các kiểm tra đã chạy thực tế, không ghi “đã kiểm thử” nếu chưa thực hiện.
