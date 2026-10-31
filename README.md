# TÀN TRO MÙA GẶT — Ashen Harvest (v2)

Roguelite đi cảnh nhìn ngang, đồ hoạ pixel, lấy cảm hứng từ Dead Cells và Celeste. Bối cảnh là một thế giới trung cổ fantasy. Điểm khác biệt của game là **xúc xắc định mệnh**: nó quyết định cả đòn chí mạng lẫn kho báu.

> Bản v2 được viết lại từ đầu. Bản v1 (góc nhìn từ trên xuống, kiểu sinh tồn) vẫn nằm trong lịch sử commit.

## Chơi thử

### 🎮 [Chơi ngay trên trình duyệt](https://tranngochuyc-cyber.github.io/tan-tro-mua-gat/)

Mở link là chơi được, không cần cài đặt: https://tranngochuyc-cyber.github.io/tan-tro-mua-gat/ (dùng bàn phím hoặc tay cầm).

Chạy trên máy:

```bash
npm install
npm run dev        # mở http://localhost:3000
npm test           # kiểm thử dữ liệu (phòng, vũ khí, xác suất xúc xắc, phúc lành)
npm run build      # đóng gói vào dist/
```

## Điều khiển

| Phím | Hành động |
|---|---|
| A / D | Di chuyển |
| Space / W | Nhảy. Nhấn thêm lần nữa trên không để **nhảy kép**. Nhả phím sớm thì nhảy thấp. S + Space để rơi xuống khỏi bục |
| Shift / L | **Lướt né**: miễn sát thương, lướt xuyên qua kẻ địch, huỷ được nhịp hồi đòn |
| J / K (chuột trái / phải) | Đánh bằng vũ khí ô 1 / ô 2. Bấm liên tiếp để ra combo |
| W / S + bắn | Bắn chéo lên / xuống với vũ khí tầm xa |
| Q | Tung **xúc xắc Vận Mệnh** khi thanh đã đầy |
| E / R | Tương tác. Khi nhặt vũ khí: E bỏ vào ô 1, R bỏ vào ô 2 |
| F | Uống bình máu |
| Esc | Tạm dừng, chỉnh âm lượng |

Game chơi được bằng tay cầm (gamepad chuẩn).

## Hệ thống chính

### Combat
- Chuyển động có các kỹ thuật giúp điều khiển "ăn tay": coyote time, đệm phím nhảy, nhảy kép, độ cao nhảy thay đổi theo thời gian giữ phím, lướt có khung bất tử.
- Mỗi đòn đánh chia 3 nhịp: chuẩn bị → ra đòn → hồi. Đòn có lực lao tới, đẩy lùi, khựng hình khi trúng (hitstop), rung màn hình và vệt chém pixel.
- Kẻ địch luôn báo hiệu trước khi ra đòn: nhấp nháy, dấu "!", tia ngắm đỏ của cung thủ, vùng cảnh báo của boss.
- Lướt qua đòn đánh vào đúng khoảnh khắc sẽ kích hoạt **Né hoàn hảo**: nạp thêm Vận Mệnh và làm chậm thời gian một nhịp.

### Xúc xắc Vận Mệnh
- **Trong combat:** đánh trúng sẽ nạp thanh Vận Mệnh. Khi thanh đầy, bấm Q để tung một viên d6 ngay giữa trận, game không dừng lại. Kết quả áp dụng cho đòn trúng kế tiếp:
  - mặt 6: **chí mạng định mệnh x3**, phá được khiên
  - mặt 4–5: đòn mạnh x2
  - mặt 2–3: đòn thường, được hoàn lại 35% thanh
  - mặt 1: **hụt**
- **Rương và Cửa Vận Mệnh:** phải tung ra đúng mặt theo yêu cầu, ví dụ số chẵn; 1, 2 hoặc 5; tổng 2 xúc xắc ≥ 9; ra đôi. Tung trượt thì rương trống, còn với cửa thì kho báu bên trong hoá thành tro. Điều kiện càng khó, phần thưởng càng quý.

### Vũ khí
Có 13 vũ khí, chia làm 3 bậc: **Thường**, **Tinh Xảo** (x1.55 sát thương), **Huyền Thoại** (x2.3 sát thương, kèm một nét đặc biệt). Lò rèn nâng cấp vũ khí thêm từ +1 đến +5.

- **Cận chiến (8):** Kiếm Hiệp Sĩ, Song Dao Gió (đâm lưng gây x1.5), Đại Kiếm Tro (phá khiên), Giáo Kỵ Sĩ (đâm xa, xuyên nhiều địch), Rìu Chiến Bắc (gây chảy máu), Búa Sấm Thép (tạo sóng chấn động), Roi Gai Hồng, Lưỡi Hái Mùa Gặt (quét cả hai phía).
- **Tầm xa / phép (5):** Cung Săn, Nỏ Lặp, Trượng Hỏa Ngục (gây nổ, đốt cháy), Sách Lôi Thần (sét chuyền), Trượng Băng Sương (làm chậm, đóng băng).

Quái mạnh lên theo độ sâu, nên càng xuống sâu càng phải nhặt và rèn vũ khí tốt hơn.

### Chương I: Đồng Cỏ Tro
Chương gồm 10 phòng: mở đầu → 2 phòng chiến đấu → Hầm Xúc Xắc → 2 phòng chiến đấu (có quái tinh anh) → Lò rèn và thương nhân → 2 phòng chiến đấu → **Boss: Hiệp Sĩ Bù Nhìn**.

- Qua mỗi phòng chiến đấu, người chơi chọn 1 trong 3 **phúc lành** (có 22 loại, chia 3 độ hiếm) và mở một **mảnh ký ức** trong câu chuyện về Kael đi tìm em gái Lyra.
- Có 5 loại quái: Bù Nhìn Tro, Chó Tro, Cung Thủ Xương, Tà Đồ (biết dịch chuyển), Khiên Binh (đỡ đòn từ phía trước). Quái tinh anh có thêm một trong 3 đặc tính: Cuồng Nộ, Thiết Giáp hoặc Dễ Nổ.
- Boss có 2 pha và 5 đòn: combo lưỡi hái, lao húc (va vào tường thì tự choáng), nhảy nện tạo sóng chấn động, gọi bầy quạ, và sóng lửa ở pha 2.

## Kỹ thuật
- Viết bằng Vite + JavaScript thuần, vẽ lên Canvas 2D ở độ phân giải gốc 384×216 rồi phóng to theo kiểu pixel.
- **Mọi hình ảnh đều vẽ bằng code**, không dùng file ảnh ngoài. Âm thanh và nhạc nền được tổng hợp bằng Web Audio, nên game không phụ thuộc tài nguyên có bản quyền.
- Vòng lặp chạy bước cố định 60 Hz. Giao diện (HUD, menu, xúc xắc 3D) dựng bằng DOM để hiển thị tiếng Việt rõ nét.

```
src/
  core/      vòng lặp phụ trợ: input, âm thanh, camera, tiện ích
  data/      vũ khí, phúc lành, điều kiện xúc xắc, mẫu phòng, cốt truyện
  world/     lưới ô và va chạm
  entities/  người chơi, quái, boss
  game/      lượt chơi (run) và cảnh chơi (combat, tương tác, chuyển phòng)
  render/    đồ hoạ pixel, nền parallax, hiệu ứng
  ui/        HUD và các màn hình menu
test/        kiểm thử dữ liệu (Node) + kịch bản chơi tự động (Playwright)
```

## Lộ trình
- Chương II: Tháp Chuông Tro, kèm quái và boss mới
- Bảng mở khoá vĩnh viễn bằng Hạt Tro giữa các lượt chơi
- Thêm loại xúc xắc (d4, d8, d20) và vũ khí có cơ chế xúc xắc riêng
- Hỗ trợ điều khiển cảm ứng trên điện thoại
