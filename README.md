# TÀN TRO MÙA GẶT — Ashen Harvest

Web game Action Roguelite 2D trên nền HTML5 Canvas và JavaScript hiện đại (ES Modules + Vite).

**Chơi trực tuyến:** [GitHub Pages](https://tranngochuyc-cyber.github.io/tan-tro-mua-gat/) · [Mã nguồn](https://github.com/tranngochuyc-cyber/tan-tro-mua-gat)

---

## 1. Giới thiệu tổng quan

**Tàn Tro Mùa Gặt** đưa người chơi vào vai một vệ binh dũng cảm vượt qua ngôi làng cổ bị nguyền rủa. Sau mùa thu hoạch, hạt giống hắc ám thức tỉnh dưới rễ cây phong, biến gia súc và quái vật thành tay sai tàn bạo. Người chơi phải thu thập kinh nghiệm (XP), dung hợp các di vật cổ đại, nâng cấp kỹ năng và đánh bại 3 Chúa Tể Bóng Đêm qua 12 màn thử thách để phá bỏ lời nguyền.

---

## 2. Hướng dẫn cài đặt và khởi chạy

### Yêu cầu môi trường
- **Node.js**: Phiên bản 18+ (hoặc mới hơn)
- **Trình duyệt**: Chrome, Firefox, Edge hoặc Safari hỗ trợ HTML5 Canvas và Web Audio API.

### Các lệnh chạy chính

```bash
# 1. Cài đặt các gói phụ thuộc (nếu chưa có)
npm install

# 2. Khởi chạy dev server (mở game tại http://localhost:3000)
npm run dev

# 3. Chạy bộ kiểm thử tự động (75/75 tiêu chí đạt chuẩn)
npm test

# 4. Đóng gói sản phẩm (Production build)
npm run build

# 5. Xem trước bản đóng gói
npm run preview
```

---

## 3. Hệ thống điều khiển (Controls)

| Thao tác | Phím mặc định | Chức năng |
|---|---|---|
| **Di chuyển** | `W, A, S, D` hoặc `Phím mũi tên` | Di chuyển 8 hướng mượt mà, chuẩn hóa tốc độ đường chéo |
| **Ngắm & Chém** | `Chuột trái` (giữ hoặc click) | Kiếm chém theo hướng trỏ chuột, tự lặp nhịp hoặc tự đánh qua Cài đặt |
| **Lướt né đòn** | `Phím Space` | Lướt tốc độ cao 0.18s, có 0.45s i-frame miễn sát thương, hồi 2s |
| **Kỹ năng chủ động** | `Phím Q` | Kích hoạt chiêu nổ theo Di vật chính (Bão Lửa, Bão Tuyết, Sấm Sét, Hút Máu...) |
| **Tương tác** | `Phím E` | Mở rương kho báu, phá ấn phong, bước qua cổng chuyển màn |
| **Chọn nâng cấp** | `1, 2, 3` hoặc `Click chuột` | Chọn 1 trong 3 nâng cấp khi lên cấp |
| **Đổi nâng cấp** | `Phím R` | Đổi thẻ nâng cấp (Reroll) nếu còn lượt |
| **Tạm dừng** | `Phím Escape` | Tạm dừng trận chiến, truy cập Cài đặt hoặc về Menu |

---

## 4. Cấu trúc 12 màn & 3 Chương (Stages & Chapters)

Mỗi chương gồm 3 màn thử thách ngẫu nhiên có kiểm soát và 1 trận Boss quyết định:

### Chương I: Đồng Cỏ Thất Thủ (Màn 1 — 4)
- **Màn 1**: Dọn 3 đợt quái Orc và Gà Nhiễm Nguyền.
- **Màn 2**: Sống sót 75 giây trước áp lực tăng dần của thời gian.
- **Màn 3**: Phá 2 ấn phong tà thuật đang phong tỏa lối đi.
- **Màn 4 — Boss I**: **Thủ Lĩnh Orc** (HP 900) — Đòn chém quạt quét rộng, lao húc cực mạnh và triệu hồi lính Orc viện trợ. Khi HP dưới 50% chuyển pha tung combo chém đôi.

### Chương II: Sân Trại Cuồng Nộ (Màn 5 — 8)
- **Màn 5**: Dọn đợt hỗn hợp Orc và Bò Cuồng.
- **Màn 6**: Giữ 2 khu vực tế đàn (15 giây mỗi khu).
- **Màn 7**: Săn 3 quái Orc Chiến Binh Tinh Anh (có bùa Giáp hoặc Cuồng Nộ).
- **Màn 8 — Boss II**: **Bò Sừng Tro** (HP 1.300) — Cào đất báo đường húc, lao húc tốc độ cao gây choáng khi va chướng ngại vật; dưới 50% HP húc đôi và dậm chân tạo chấn động.

### Chương III: Vườn Phong Tàn Úa (Màn 9 — 12)
- **Màn 9**: Phá 3 ấn phong dưới sự truy đuổi của Hộ Vệ Nghi Lễ.
- **Màn 10**: Sinh tồn 90 giây trước đội hình quái tổng lực.
- **Màn 11**: Tiêu diệt toàn bộ hộ vệ phong ấn cấp cao.
- **Màn 12 — Boss Cuối**: **Kẻ Gặt Hồn** (HP 1.700) — 3 pha giao tranh biến ảo: vòng đạn ma thuật có khe thoát hiểm, chém quạt diện rộng, dịch chuyển tức thời và gọi quái tinh anh.

---

## 5. Di vật, Bùa chú & Hệ thống Tiến Hóa (Evolutions)

### 6 Di vật tấn công nền
1. **Hỏa Trượng (Fire Staff)**: Bắn cầu lửa gây cháy mục tiêu trong 3 giây.
2. **Băng Trượng (Frost Staff)**: Bắn đạn băng làm chậm quái từ 20% đến 40%.
3. **Lôi Trượng (Thunder Scepter)**: Phóng tia sét giật chuyền qua 3–6 mục tiêu gần nhau.
4. **Huyết Thương (Blood Spear)**: Phóng ngọn giáo xuyên thấu, hút máu theo phần trăm sát thương.
5. **Cung Hồn (Composite Bow)**: Bắn mũi tên ma thuật tự tìm mục tiêu trong góc ngắm.
6. **Hư Vô Trượng (Void Wand)**: Mở hố đen lực trường hút quái thường gom cụm.

### 5 Bùa thụ động hỗ trợ
- **Bình Mana (Mana Flask)**: Giảm thời gian hồi chiêu di vật và lướt.
- **Ngọc Sức Mạnh (Power Surge Gem)**: Tăng phần trăm sát thương phép.
- **Bùa Cuồng Nộ (Berserk Rune)**: Tăng tốc độ đánh nhưng giảm HP tối đa.
- **Sách Ma Thuật (Arcane Tome)**: Tăng bán kính tác dụng và số lượng đạn.
- **Chất Xúc Tác Máu (Blood Catalyst)**: Tăng hiệu quả hút máu từ sát thương.

### 6 Công thức Tiến Hóa Thần Binh
> **Điều kiện tiến hóa**: Di vật đạt **Cấp 5** + Bùa chú tương ứng đạt **Cấp 3 trở lên** + Đã vượt qua ít nhất **1 Boss**.

| Di vật gốc (Lv5) | Bùa tương ứng (Lv3+) | Thần Binh Tiến Hóa | Hiệu ứng đặc biệt sau tiến hóa |
|---|---|---|---|
| **Hỏa Trượng** | Bình Mana | **Hỏa Ngục Trượng (Inferno Staff)** | Kẻ địch cháy khi chết phát nổ lan sang xung quanh |
| **Băng Trượng** | Sách Ma Thuật | **Bão Tuyết Trượng (Blizzard Staff)** | Tạo vùng bão tuyết diện rộng duy trì làm chậm & sát thương liên tục |
| **Lôi Trượng** | Ngọc Sức Mạnh | **Vương Trượng Sấm (Thunder Scepter Evo)** | Tăng mạnh số nhánh sét phân tách và tầm phóng chuyền |
| **Huyết Thương** | Chất Xúc Tác Máu | **Huyết Vực Thương (Blood Spear Evo)** | Để lại vệt máu gây sát thương liên hoàn dọc đường đi |
| **Cung Hồn** | Bùa Cuồng Nộ | **Linh Hồn Cung (Soul Bow)** | Tên linh hồn xuyên qua nhiều kẻ địch kèm khả năng tự bám mục tiêu |
| **Hư Vô Trượng** | Sách Ma Thuật | **Hư Không Trượng (Void Wand Evo)** | Hố đen phát nổ cực lớn khi kết thúc thời gian hút |

---

## 6. Cơ chế đặc trưng: Gặt Tham (Greed Harvest)

Sau mỗi màn thường (màn 1-3, 5-7, 9-11), người chơi có thể:
1. **Đi tiếp**: An toàn bước qua cổng tới màn kế tiếp.
2. **Gặt Tham**: Kích hoạt thử thách sinh tồn 20 giây trước đợt quái tinh anh hung hãn. Vượt qua thử thách sẽ nhận **Rương Báu Vàng (Enhanced Chest)** chứa gấp đôi XP, vàng dồi dào và lượng Hạt Tro quý giá.

---

## 7. Kinh tế & Tiến triển dài hạn (Meta-Progression)

- **Vàng (Gold)**: Thu thập trong lượt chơi để mua hồi máu, nâng cấp chỉ số hoặc đổi thẻ tại Cửa Hàng giữa các chương.
- **Hạt Tro (Ash Seeds)**: Tiền tệ vĩnh viễn nhận được khi hoàn thành màn (+1), hạ Boss (+5) và thắng trọn vẹn (+10). Được lưu giữ ngay cả khi hiệp sĩ ngã xuống.
- **Mở khóa tại Làng (Hub)**:
  - Mở khóa các Di vật khởi đầu mới (Băng Trượng, Lôi Trượng, Huyết Thương, Cung Hồn, Hư Vô Trượng).
  - Mở **Túi Dự Phòng**: Tặng thêm 1 lần đổi thẻ mỗi lượt.
  - Mở **Sức Bền I / II**: Tăng vĩnh viễn +5 / +10 HP khởi điểm.
  - Mở **Nam Châm I / II**: Tăng vĩnh viễn +10% / +20% bán kính gom ngọc XP.

---

## 8. Quyết định kỹ thuật & Kiến trúc mã nguồn

1. **Hiển thị Pixel Art Chuẩn Mực**:
   - Sử dụng độ phân giải nội bộ chuẩn `640×360` với lọc `nearest-neighbor` (`image-rendering: pixelated`).
   - Sprite Soldier và Orc dùng khung `100×100` nhưng hitbox và chân nhân vật được cắt tỉa và căn pivot chính xác (`hitboxW: 14, hitboxH: 18`), giải quyết triệt để lỗi va chạm thừa.
   - Nhân vật quay mặt trái/phải thông qua thuộc tính lật (`flip`) của Animator thay vì ép buộc sprite sheet 8 hướng.

2. **Cơ chế chiến đấu không lỗi double-hit**:
   - Mỗi nhát chém có cờ `hitThisSwing` cho từng kẻ địch trong phạm vi hình quạt (`Math.atan2`). Kẻ địch chỉ chịu sát thương một lần duy nhất mỗi nhát kiếm.
   - Cung cấp `i-frame` (0.45s bảo vệ) cho người chơi để loại bỏ hoàn toàn hiện tượng chết tức tưởi do nhiều hitbox chạm cùng frame.

3. **Âm thanh kết hợp Procedural Web Audio & CC0 Music**:
   - Toàn bộ SFX (chém kiếm, trúng đòn, lướt, nhặt ngọc XP, level up, mở rương, cảnh báo Boss, tử trận) được tổng hợp trực tiếp bằng Web Audio API oscillators, đảm bảo nhẹ và không phụ thuộc file ngoài.
   - Nhạc nền OGG chất lượng cao khởi động sau tương tác đầu tiên của người dùng để tuân thủ chính sách Autoplay của trình duyệt hiện đại.

4. **Lưu trữ cục bộ an toàn (LocalStorage Safe Storage)**:
   - Lưu trữ tiến trình Meta, cài đặt âm lượng, tùy chọn hiển thị và checkpoint lượt chơi.
   - Trang bị cơ chế phục hồi và giá trị mặc định khi `localStorage` bị hỏng hoặc chạy trong môi trường ẩn danh.

---

## 9. Cấu trúc thư mục dự án

```
game_rpg/
├── assets/                  # Tài nguyên gốc (PNG nhân vật, quái vật, tileset, vũ khí, OGG nhạc)
├── docs/                    # Tài liệu đặc tả THIET_KE_GAME.md và BAN_GIAO_ANTIGRAVITY.md
├── src/
│   ├── data/
│   │   └── GameData.js      # Định nghĩa chỉ số 12 màn, 6 di vật, tiến hóa, quái, boss, bùa
│   ├── engine/
│   │   ├── AssetLoader.js   # Bộ tải hình ảnh và âm thanh với fallback an toàn
│   │   ├── AudioManager.js  # Bộ quản lý nhạc nền và tổng hợp SFX Web Audio
│   │   ├── Camera.js        # Camera 2D mượt mà bám theo người chơi kèm rung lắc chấn động
│   │   ├── Constants.js     # Toàn bộ hằng số cân bằng game
│   │   ├── Game.js          # Điều phối vòng lặp chính (Game Loop) và vòng đời lượt chơi
│   │   ├── HUD.js           # Giao diện HP, XP, vàng, thời gian lời nguyền, kỹ năng Q/Space
│   │   ├── Input.js         # Xử lý bàn phím và tọa độ trỏ chuột
│   │   ├── MapRenderer.js   # Render sàn cỏ/trại/vườn, vật cản, kiểm tra va chạm
│   │   ├── Particles.js     # Hiệu ứng số sát thương, tia lửa, tia chớp, nháy sáng
│   │   ├── SaveManager.js   # Quản lý lưu cục bộ, checkpoint và thống kê
│   │   └── SpriteSheet.js   # Cắt frame và phát animation sprite sheet
│   ├── entities/
│   │   ├── Boss.js          # Logic 3 Boss đa pha, cảnh báo đường đòn (telegraph), chiêu thức
│   │   ├── Enemy.js         # Máy trạng thái quái thường và quái tinh anh (Orc, Gà, Bò, Caster)
│   │   ├── Player.js        # Hiệp sĩ: di chuyển, lướt né đòn, chém kiếm, thăng cấp, lưu checkpoint
│   │   └── Projectile.js    # Hệ thống đạn ma thuật, tia sét, mũi tên bám mục tiêu, vùng hố đen
│   ├── scenes/
│   │   ├── CombatScene.js   # Đấu trường chiến đấu chính, quản lý mục tiêu màn và Gặt Tham
│   │   ├── MenuScene.js     # Màn hình chính, hỗ trợ tiếp tục lượt chơi từ checkpoint
│   │   ├── ShopScene.js     # Cửa hàng nghỉ ngơi giữa các chương
│   │   ├── UIScenes.js      # Màn hình Thắng, Thua, Làng mở khóa, Cài đặt và Tạm dừng
│   │   └── UpgradeScene.js  # Màn hình chọn 1 trong 3 nâng cấp & tiến hóa thần binh
│   └── main.js              # Khởi tạo game
├── test/
│   └── game-audit.test.js   # Bộ 75 kiểm thử tự động toàn diện
├── index.html               # Trang HTML chính với thanh nạp tài nguyên mượt mà
├── package.json
└── vite.config.js
```
