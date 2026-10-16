// ============================================================
// ClassData — 10 unique character classes
// 6 phổ biến (RPG kinh điển) + 4 danh tác thế giới (Alice, Ngộ Không, Dracula, Người Thổi Sáo)
// Mỗi class có: stats cơ bản, tăng trưởng/level, vũ khí khởi đầu,
// đòn đánh thường riêng, kỹ năng Q thật, nội tại riêng, thế mạnh, điểm yếu,
// cây kỹ năng mốc (Lv 3, 5, 8) và kho nâng cấp theo class với đánh đổi rõ ràng.
// ============================================================

export const CLASSES = {
  // ==========================================
  // 6 CLASS PHỔ BIẾN (RPG KINH ĐIỂN)
  // ==========================================
  warrior: {
    id: 'warrior',
    name: 'Chiến Binh',
    title: 'Warrior — Thiết Giáp Kiếm Sĩ',
    desc: 'Cận chiến càn quét, máu dày, giáp cao. Chém đại kiếm hất văng quái vật và giơ khiên phản đòn chớp nhoáng.',
    strength: 'Càn quét đám đông cận chiến, chống chịu cao, phản đòn mạnh.',
    weakness: 'Tầm đánh ngắn, tốc đánh chậm, di chuyển kém cơ động.',
    playstyle: 'Thích lối chơi đấm trực diện, phản đòn nghẹt thở, không ngại va chạm.',
    icon: 'sword',
    color: '#ef4444',
    category: 'common',
    startWeapon: 'blood_spear',
    baseStats: {
      hp: 130, dmg: 16, speed: 80, attackCd: 0.62,
      critChance: 0.06, critMult: 1.5, armor: 3, dashCd: 2.0,
    },
    growth: {
      hp: 5, dmg: 0.7, armor: 0.2, critChance: 0.002,
    },
    attackStyle: {
      type: 'heavy_cleave',
      name: 'Đại Kiếm Trảm',
      range: 56,
      arc: Math.PI * 0.75,
      knockback: 70,
      color: '#ef4444',
      desc: 'Vung đại kiếm quét góc rộng 135°, hất văng quái vật và tăng 25% sát thương khi dưới 50% HP.',
    },
    activeSkill: {
      id: 'warrior_charge',
      name: 'Khiên Trảm Phản Đòn',
      type: 'warrior_charge',
      cd: 6.5,
      dmg: 35,
      desc: 'Giơ khiên cản 80% sát thương nhận trong 0.8s, sau đó lập tức vung khiên phản kích gây 35 sát thương và làm choáng diện rộng 1.5s.',
    },
    passive: {
      name: 'Ý Chí Sắt Đá',
      desc: 'Khi HP < 50%, nhận thêm +3 Giáp và tăng 30% sát thương đòn đánh. Hồi 2 HP mỗi 4 giây.',
      effect: { lowHpDmgReduction: 0.15, lowHpThreshold: 0.5, lowHpDmgBuff: 0.3, lowHpArmor: 3, regen: 2, regenInterval: 4 },
    },
    skillChoices: [
      { level: 3, options: [
        { id: 'iron_bastion', branch: 'Đỡ Đòn & Phản Công', name: 'Thành Trì Sắt', desc: '+4 Giáp, +30 HP tối đa, phản 35% sát thương khi bị đánh', effect: { armor: 4, maxHp: 30, counterReflect: 0.35 }, cost: '-5% Tốc chạy' },
        { id: 'blood_rage', branch: 'Cuồng Chiến Sĩ', name: 'Cuồng Nộ Huyết Tế', desc: '+8 Sát thương đòn đánh, +20% tốc đánh khi mất máu', effect: { baseDmg: 8, berserkSpeedMult: 0.2 }, cost: '-1 Giáp cơ bản' },
      ]},
      { level: 5, options: [
        { id: 'second_wind', branch: 'Đỡ Đòn & Phản Công', name: 'Hơi Thở Thứ Hai', desc: 'Tự động hồi 35% HP khi HP tụt dưới 25% (1 lần/màn)', effect: { secondWind: true, secondWindPct: 0.35 }, cost: 'Không có' },
        { id: 'berserker_whirl', branch: 'Cuồng Chiến Sĩ', name: 'Cuồng Phong Trảm', desc: 'Đại kiếm quét 360°, tăng gấp đôi lực hất văng quái', effect: { fullCleave: true, knockbackMult: 2.0 }, cost: '+10% Hồi chiêu lướt' },
      ]},
      { level: 8, options: [
        { id: 'unbreakable_titan', branch: 'Đỡ Đòn & Phản Công', name: 'Cự Thần Bất Hoại', desc: '+6 Giáp, +60 HP, miễn nhiễm hoàn toàn hiệu ứng làm chậm và đẩy lùi', effect: { armor: 6, maxHp: 60, unyielding: true }, cost: '-10% Tốc chạy' },
        { id: 'blood_warlord', branch: 'Cuồng Chiến Sĩ', name: 'Chiến Tướng Đồ Tễ', desc: '+15 Sát thương đòn đánh; giết quái hồi 5% HP tối đa', effect: { baseDmg: 15, healOnKillPercent: 0.05 }, cost: '-2 Giáp' },
      ]},
    ],
  },

  mage: {
    id: 'mage',
    name: 'Pháp Sư',
    title: 'Mage — Bậc Thầy Ma Pháp',
    desc: 'Tung chùm đạn phép truy lùng từ tầm xa, khống chế và gom quái vào hố đen hư vô huỷ diệt.',
    strength: 'Dọn quái tầm xa thần tốc, nhiều tia đạn tự tìm địch, gom quái diện rộng.',
    weakness: 'Lượng máu rất mỏng (80 HP), giáp 0, dễ bốc hơi nếu bị áp sát bất ngờ.',
    playstyle: 'Thích thả diều an toàn, hủy diệt bãi quái bằng chuỗi phép thuật bùng nổ.',
    icon: 'flame',
    color: '#3b82f6',
    category: 'common',
    startWeapon: 'fire_staff',
    baseStats: {
      hp: 80, dmg: 10, speed: 85, attackCd: 0.48,
      critChance: 0.08, critMult: 1.6, armor: 0, dashCd: 1.8,
    },
    growth: {
      hp: 2, dmg: 0.45, spellDmg: 1.0, critChance: 0.003,
    },
    attackStyle: {
      type: 'magic_missiles',
      name: 'Ma Pháp Tinh Cầu',
      range: 165,
      count: 3,
      speed: 195,
      knockback: 16,
      color: '#60a5fa',
      desc: 'Phóng chùm 3 tinh cầu ma pháp tự uốn lượn truy tìm mục tiêu từ khoảng cách an toàn.',
    },
    activeSkill: {
      id: 'mage_vortex',
      name: 'Hố Đen Hư Vô',
      type: 'mage_vortex',
      cd: 7.5,
      dmg: 40,
      desc: 'Tạo hố đen hút toàn bộ quái vật trong bán kính 110px vào tâm trong 2s, sau đó kích nổ ma pháp gây 40 sát thương diện rộng.',
    },
    passive: {
      name: 'Dòng Chảy Ma Thuật',
      desc: 'Giảm 15% hồi chiêu mọi kỹ năng. Đòn đánh thứ 4 tích tụ khiên ma pháp hấp thụ 12 sát thương.',
      effect: { cdReduction: 0.15, shieldOnFourthHit: 12 },
    },
    skillChoices: [
      { level: 3, options: [
        { id: 'arcane_chain', branch: 'Chuỗi Nguyên Tố', name: 'Lôi Ma Liên Hoàn', desc: 'Đạn phép phóng tia sét giật lan sang 2 mục tiêu lân cận', effect: { chains: 2, chainDmgMult: 0.7 }, cost: 'Không có' },
        { id: 'super_nova', branch: 'Phép Diện Rộng', name: 'Đại Hỏa Bộc', desc: '+40% Sát thương kỹ năng Hố Đen, bán kính hút +30px', effect: { vortexDmgMult: 1.4, vortexRadiusBonus: 30 }, cost: '+1.5s Hồi chiêu Q' },
      ]},
      { level: 5, options: [
        { id: 'frost_shatter', branch: 'Chuỗi Nguyên Tố', name: 'Băng Giáp Tê Liệt', desc: 'Đạn làm chậm địch 50% trong 2s; quái bị chậm nhận thêm 25% sát thương', effect: { frostSlow: 0.5, shatterDmgBonus: 0.25 }, cost: 'Không có' },
        { id: 'apocalypse_flare', branch: 'Phép Diện Rộng', name: 'Thiên Hỏa Tận Diệt', desc: '+2 Đạn ma pháp, đạn nổ diện rộng bán kính 28px khi chạm đích', effect: { extraProjectiles: 2, explodeRadius: 28 }, cost: '-10% Tốc đánh' },
      ]},
      { level: 8, options: [
        { id: 'elemental_mastery', branch: 'Chuỗi Nguyên Tố', name: 'Nguyên Tố Tối Thượng', desc: 'Giảm 30% hồi chiêu, mỗi tia sét giật hồi 2 HP', effect: { cdReduction: 0.3, chainHeal: 2 }, cost: 'Không có' },
        { id: 'archmage_calamity', branch: 'Phép Diện Rộng', name: 'Đại Pháp Sư Hủy Diệt', desc: '+50% Sát thương phép toàn phần, Hố Đen gom toàn bộ quái trên màn hình', effect: { spellDmgMult: 0.5, screenVortex: true }, cost: '-15 HP tối đa' },
      ]},
    ],
  },

  ranger: {
    id: 'ranger',
    name: 'Cung Thủ',
    title: 'Ranger — Thiện Xạ Rừng Sâu',
    desc: 'Xạ thủ siêu tốc độ, bắn tên xuyên thấu nhiều kẻ địch từ cự ly xa nhất và né đòn bằng mưa tiễn bão lốc.',
    strength: 'Tốc độ di chuyển cao nhất, tầm bắn xa nhất, tên xuyên thấu nhiều địch.',
    weakness: 'Máu thấp, bất lợi lớn khi bị quái áp sát từ bốn phía trong không gian hẹp.',
    playstyle: 'Thích lối chơi cơ động "hit-and-run", bắn tỉa chuẩn xác, né đòn linh hoạt.',
    icon: 'bow',
    color: '#22c55e',
    category: 'common',
    startWeapon: 'composite_bow',
    baseStats: {
      hp: 90, dmg: 10, speed: 100, attackCd: 0.36,
      critChance: 0.12, critMult: 1.8, armor: 0, dashCd: 1.6,
    },
    growth: {
      hp: 2, dmg: 0.35, speed: 1.2, critChance: 0.005,
    },
    attackStyle: {
      type: 'pierce_arrows',
      name: 'Phong Tiễn Xuyên Phá',
      range: 220,
      count: 2,
      speed: 260,
      pierce: true,
      knockback: 22,
      color: '#4ade80',
      desc: 'Bắn liên hoàn 2 mũi tên gió siêu tốc độ xuyên thấu toàn bộ hàng ngũ quái vật.',
    },
    activeSkill: {
      id: 'ranger_storm',
      name: 'Mưa Bão Tiễn',
      type: 'ranger_storm',
      cd: 6.5,
      dmg: 32,
      desc: 'Bật nhảy lùi 60px né đòn với i-frames, đồng thời trút cơn mưa 16 mũi tên gió xuống khu vực chỉ định gây 32 sát thương diện rộng.',
    },
    passive: {
      name: 'Mắt Ưng & Bộ Pháp Gió',
      desc: '+25% bán kính hút XP. Khi không nhận sát thương trong 3s, tăng 20% tốc chạy và +15% tỉ lệ chí mạng.',
      effect: { pickupRangeBonus: 0.25, safeSpeedBonus: 0.20, safeCritBonus: 0.15, safeTime: 3 },
    },
    skillChoices: [
      { level: 3, options: [
        { id: 'deadeye_sniper', branch: 'Bắn Tỉa Chuẩn Xác', name: 'Phát Bắn Thần Sầu', desc: '+50% Sát thương chí mạng, kẻ địch ở càng xa nhận sát thương càng lớn (lên tới +40%)', effect: { critMult: 0.5, distanceDmgBonus: 0.4 }, cost: 'Không có' },
        { id: 'arrow_fan', branch: 'Mưa Tên Dọn Đám Đông', name: 'Ngũ Tiễn Tề Phát', desc: '+2 Đạn xòe hình quạt, tăng 20% diện tích phủ tên', effect: { extraProjectiles: 2, spreadFan: true }, cost: '-10% Sát thương mỗi mũi tên' },
      ]},
      { level: 5, options: [
        { id: 'armor_pierce', branch: 'Bắn Tỉa Chuẩn Xác', name: 'Xuyên Giáp Liệt Tâm', desc: 'Bỏ qua 100% giáp của địch, đòn đánh vào Boss gây thêm 35% sát thương', effect: { ignoreArmor: true, bossDmgBonus: 0.35 }, cost: 'Không có' },
        { id: 'ricochet_storm', branch: 'Mưa Tên Dọn Đám Đông', name: 'Tiễn Lạc Nảy Bật', desc: 'Mũi tên khi chạm tường hoặc quái nảy sang 2 mục tiêu khác, gây 75% sát thương', effect: { ricochetCount: 2, ricochetDmgMult: 0.75 }, cost: 'Không có' },
      ]},
      { level: 8, options: [
        { id: 'assassin_mark', branch: 'Bắn Tỉa Chuẩn Xác', name: 'Tử Thần Định Mệnh', desc: 'Chí mạng gây x3.0 sát thương; đòn bắn trúng Boss tạo dấu ấn làm tăng 30% sát thương nhận', effect: { critMultBonus: 1.2, bossMarkBonus: 0.3 }, cost: '-15 HP tối đa' },
        { id: 'endless_tempest', branch: 'Mưa Tên Dọn Đám Đông', name: 'Vạn Tiễn Quy Tông', desc: '+3 Đạn, tốc đánh tăng 30%, kỹ năng Mưa Bão Tiễn hồi lại tức thì nếu tiêu diệt >= 3 quái', effect: { extraProjectiles: 3, attackSpeedBonus: 0.3, stormResetOnKills: 3 }, cost: 'Không có' },
      ]},
    ],
  },

  assassin: {
    id: 'assassin',
    name: 'Sát Thủ',
    title: 'Assassin — U Hồn Đao Khách',
    desc: 'Bậc thầy lướt chém chớp nhoáng, tỉ lệ chí mạng cực cao. Lướt liên hoàn để lại ảo ảnh kết liễu mục tiêu.',
    strength: 'Sát thương dồn cực nhanh, tỉ lệ chí mạng cao nhất (20%+), lướt liên tục.',
    weakness: 'Tầm đánh cực ngắn (36px), lượng máu thấp nhất (70 HP), mắc sai lầm là bốc hơi.',
    playstyle: 'Thích phản xạ nhanh, lướt chớp nhoáng ám sát mục tiêu và tinh anh.',
    icon: 'dash',
    color: '#a855f7',
    category: 'common',
    startWeapon: 'void_wand',
    baseStats: {
      hp: 75, dmg: 14, speed: 110, attackCd: 0.32,
      critChance: 0.20, critMult: 2.0, armor: 0, dashCd: 1.2,
    },
    growth: {
      hp: 1.5, dmg: 0.55, critChance: 0.006, speed: 1.4,
    },
    attackStyle: {
      type: 'shadow_daggers',
      name: 'Song Đoản Kiếm U Hồn',
      range: 38,
      arc: Math.PI * 0.48,
      knockback: 18,
      dualHit: true,
      color: '#c084fc',
      desc: 'Chém đôi chữ X chớp nhoáng; trong 2s sau khi lướt tăng thêm 40% sát thương và gây chảy máu.',
    },
    activeSkill: {
      id: 'assassin_dance',
      name: 'Ảo Ảnh Trảm',
      type: 'assassin_dance',
      cd: 5.5,
      dmg: 45,
      desc: 'Hóa thành bóng đen bất tử lướt chém xuyên qua tối đa 5 kẻ địch trong chớp mắt, gây 45 sát thương chí mạng 100% kèm hiệu ứng chảy máu.',
    },
    passive: {
      name: 'Bóng Tối Phục Kích',
      desc: '+40% sát thương trong 2s sau khi lướt. Lướt xa hơn 25% và thời gian bất tử tăng thêm 0.1s.',
      effect: { postDashDmgBonus: 0.40, postDashDuration: 2.0, dashDistMult: 1.25, iframeBonus: 0.1 },
    },
    skillChoices: [
      { level: 3, options: [
        { id: 'lethal_backstab', branch: 'Ám Sát Đơn Mục Tiêu', name: 'Nhát Đâm Tử Huyệt', desc: '+60% Sát thương chí mạng, đòn đánh sau lướt luôn chí mạng', effect: { critMult: 0.6, guaranteedCritPostDash: true }, cost: 'Không có' },
        { id: 'chain_phantom_dash', branch: 'Lướt Liên Hoàn', name: 'Lướt Bóng Ma', desc: 'Hồi lướt giảm còn 0.8s, lướt để lại bom khói làm chậm địch 50%', effect: { dashCdOverride: 0.8, smokeSlow: 0.5 }, cost: 'Không có' },
      ]},
      { level: 5, options: [
        { id: 'execution_strike', branch: 'Ám Sát Đơn Mục Tiêu', name: 'Đao Phủ Huyết Lệnh', desc: 'Kẻ địch dưới 35% HP nhận gấp đôi sát thương; Boss nhận thêm 40% sát thương', effect: { executeThreshold: 0.35, executeMult: 2.0, bossDmgBonus: 0.4 }, cost: 'Không có' },
        { id: 'shadow_mirror', branch: 'Lướt Liên Hoàn', name: 'Song Trùng Ảo Ảnh', desc: 'Sau khi lướt, một bóng ma mô phỏng lại đòn tấn công của bạn gây 70% sát thương', effect: { shadowEcho: true, echoDmgMult: 0.7 }, cost: 'Không có' },
      ]},
      { level: 8, options: [
        { id: 'one_hit_reaper', branch: 'Ám Sát Đơn Mục Tiêu', name: 'Nhất Kích Trảm Đoạt', desc: '+18 Sát thương, đòn đánh chí mạng kết liễu tức thì quái thường dưới 20% HP', effect: { baseDmg: 18, instantKillThreshold: 0.2 }, cost: '-10 HP tối đa' },
        { id: 'perpetual_motion', branch: 'Lướt Liên Hoàn', name: 'Vũ Điệu Bất Tận', desc: 'Mỗi lần tiêu diệt quái hồi lại 100% chiêu lướt; lướt trúng quái hồi 3 HP', effect: { dashResetOnKill: true, dashHeal: 3 }, cost: 'Không có' },
      ]},
    ],
  },

  paladin: {
    id: 'paladin',
    name: 'Thánh Kỵ Sĩ',
    title: 'Paladin — Hiệp Sĩ Thánh Quang',
    desc: 'Trụ vững kiên cường, tự hồi máu liên tục và giáng búa triệu hồi thánh địa thiêng liêng.',
    strength: 'Khả năng tự hồi máu mạnh nhất game, giáp cao, cân bằng công thủ tuyệt hảo.',
    weakness: 'Tốc độ đánh và tốc độ di chuyển trung bình, không có khả năng dồn sát thương tức thời.',
    playstyle: 'Thích lối chơi chắc chắn, trụ đường vô địch, khó bị đánh bại.',
    icon: 'shield',
    color: '#eab308',
    category: 'common',
    startWeapon: 'thunder_scepter',
    baseStats: {
      hp: 115, dmg: 13, speed: 85, attackCd: 0.52,
      critChance: 0.06, critMult: 1.5, armor: 2, dashCd: 2.0,
    },
    growth: {
      hp: 4, dmg: 0.5, armor: 0.15, regen: 0.2,
    },
    attackStyle: {
      type: 'holy_smite',
      name: 'Búa Thánh Quang',
      range: 50,
      arc: Math.PI * 0.65,
      knockback: 45,
      healOnHit: 2,
      color: '#fde047',
      desc: 'Giáng búa thần tỏa sóng thánh quang đẩy lùi quái và hồi 2 HP mỗi khi đánh trúng.',
    },
    activeSkill: {
      id: 'paladin_consecrate',
      name: 'Thánh Quang Trừng Phạt',
      type: 'paladin_consecrate',
      cd: 7.5,
      dmg: 28,
      desc: 'Tạo thánh địa bán kính 85px tồn tại 6s: hồi 6 HP/s cho bản thân khi đứng trong vòng và thiêu đốt quái vật 8 sát thương thánh mỗi giây.',
    },
    passive: {
      name: 'Áo Choàng Ban Phước',
      desc: 'Hồi 3 HP mỗi 4 giây. Mỗi lần giết quái vật hồi thêm 2 HP.',
      effect: { regen: 3, regenInterval: 4, healOnKill: 2 },
    },
    skillChoices: [
      { level: 3, options: [
        { id: 'divine_protection', branch: 'Bảo Hộ & Hồi Phục', name: 'Thánh Thuẫn Hộ Thể', desc: '+4 Giáp, +35 HP, tăng lượng máu hồi từ mọi nguồn thêm 40%', effect: { armor: 4, maxHp: 35, healMult: 1.4 }, cost: '-5% Tốc chạy' },
        { id: 'righteous_hammer', branch: 'Trừng Phạt Thần Thánh', name: 'Lôi Thánh Trừng Giới', desc: '+6 Sát thương, đòn đánh giáng sấm thánh giật 3 mục tiêu xung quanh', effect: { baseDmg: 6, holySmiteChains: 3 }, cost: '-1 Giáp' },
      ]},
      { level: 5, options: [
        { id: 'sanctuary_field', branch: 'Bảo Hộ & Hồi Phục', name: 'Đất Thánh Bất Xâm', desc: 'Thánh địa hồi 10 HP/s, giảm 35% sát thương nhận khi đứng trong thánh địa', effect: { consecrateHealBonus: 4, consecrateDmgRed: 0.35 }, cost: 'Không có' },
        { id: 'crusader_zeal', branch: 'Trừng Phạt Thần Thánh', name: 'Nhiệt Huyết Thập Tự', desc: '+25% Sát thương, +25% tốc đánh, mỗi đòn đánh phóng tia thánh quang', effect: { baseDmgMult: 0.25, attackSpeedBonus: 0.25, holyRay: true }, cost: '-10% HP tối đa' },
      ]},
      { level: 8, options: [
        { id: 'divine_shield_invuln', branch: 'Bảo Hộ & Hồi Phục', name: 'Khiên Thần Bất Tử', desc: 'Miễn nhiễm mọi sát thương trong 3.5s khi HP < 20% (1 lần/màn) và hồi đầy 50% HP', effect: { divineShield: true, divineShieldDuration: 3.5, divineShieldHeal: 0.5 }, cost: 'Không có' },
        { id: 'wrath_of_heavens', branch: 'Trừng Phạt Thần Thánh', name: 'Thiên Nộ Trừng Phạt', desc: '+15 Sát thương thánh, thánh địa kích nổ khi kết thúc gây 60 sát thương toàn màn hình', effect: { baseDmg: 15, consecrateDetonateDmg: 60 }, cost: '-2 Giáp' },
      ]},
    ],
  },

  necromancer: {
    id: 'necromancer',
    name: 'Tử Thuật Sĩ',
    title: 'Necromancer — U Linh Vu Sư',
    desc: 'Hút sinh lực từ xa bằng roi máu và triệu hồi linh hồn kích nổ xác quái vật.',
    strength: 'Hút máu duy trì liên tục, càng đông quái càng bất tử, nổ xác quét bãi mạnh.',
    weakness: 'Lượng máu cơ bản thấp, không có kỹ năng lướt xa, yếu khi đánh boss đơn độc.',
    playstyle: 'Thích lối chơi ma thuật hắc ám, hút sinh lực và kích nổ xác quái vật.',
    icon: 'skull',
    color: '#6366f1',
    category: 'common',
    startWeapon: 'blood_spear',
    baseStats: {
      hp: 85, dmg: 12, speed: 82, attackCd: 0.48,
      critChance: 0.08, critMult: 1.6, armor: 0, dashCd: 2.0,
    },
    growth: {
      hp: 2.5, dmg: 0.45, lifesteal: 0.006, spellDmg: 0.8,
    },
    attackStyle: {
      type: 'soul_siphon',
      name: 'Huyết Thần Trảo',
      range: 88,
      arc: Math.PI * 0.42,
      knockback: -18, // pulls enemies closer
      lifestealPercent: 0.20,
      color: '#f43f5e',
      desc: 'Quất roi máu tầm trung kéo quái lại gần và hút 20% sát thương chuyển thành máu.',
    },
    activeSkill: {
      id: 'necro_nova',
      name: 'Bộc Phá Tử Linh',
      type: 'necro_nova',
      cd: 7.5,
      dmg: 35,
      desc: 'Phóng thích 16 lưỡi hái linh hồn tỏa tròn 360°, hút máu toàn bộ kẻ địch trúng đòn và ngay lập tức hồi 20% HP tối đa.',
    },
    passive: {
      name: 'Huyết Thệ Tử Linh',
      desc: 'Cơ bản có 12% hút máu. Mỗi khi tiêu diệt 1 quái vật hồi 3% HP tối đa.',
      effect: { lifestealBase: 0.12, healOnKillPercent: 0.03 },
    },
    skillChoices: [
      { level: 3, options: [
        { id: 'vampiric_tendrils', branch: 'Hấp Tinh Hút Máu', name: 'Roi Máu Huyết Hải', desc: '+10% Hút máu, tầm roi máu +25px, kéo địch mạnh hơn', effect: { lifestealBonus: 0.10, whipRangeBonus: 25 }, cost: 'Không có' },
        { id: 'corpse_detonation', branch: 'Triệu Hồi & Nổ Xác', name: 'Kích Nổ Tàn Hài', desc: 'Xác quái chết phát nổ gây 25 sát thương diện rộng cho quái xung quanh', effect: { deathExplosion: true, explosionDmg: 25, explosionRadius: 40 }, cost: 'Không có' },
      ]},
      { level: 5, options: [
        { id: 'blood_barrier', branch: 'Hấp Tinh Hút Máu', name: 'Màn Chắn Máu', desc: 'Lượng máu hút vượt ngưỡng 100% HP chuyển thành khiên giáp (tối đa 40 HP)', effect: { overshieldFromDrain: 40 }, cost: 'Không có' },
        { id: 'summon_ghost_army', branch: 'Triệu Hồi & Nổ Xác', name: 'Triệu Hồi Âm Hồn', desc: 'Giết mỗi 3 quái gọi 1 âm hồn tự đuổi cắn địch trong 6s (tối đa 4 con)', effect: { ghostMinions: true, maxGhosts: 4 }, cost: '-10% Tốc chạy' },
      ]},
      { level: 8, options: [
        { id: 'immortal_lich', branch: 'Hấp Tinh Hút Máu', name: 'Tử Thần Bất Hoại', desc: '+25% Hút máu toàn diện; hồi sinh 1 lần/màn với 50% HP khi nhận đòn chí tử', effect: { lifestealBonus: 0.25, revive: true, reviveHpPercent: 0.5 }, cost: 'Không có' },
        { id: 'soul_reaper_apocalypse', branch: 'Triệu Hồi & Nổ Xác', name: 'Đại Họa Tử Linh', desc: 'Kỹ năng Bộc Phá Tử Linh gây gấp đôi sát thương; âm hồn phát nổ khi hết thời gian', effect: { necroNovaDmgMult: 2.0, minionDetonate: true }, cost: '-15 HP tối đa' },
      ]},
    ],
  },

  // ==========================================
  // 4 CLASS DANH TÁC THẾ GIỚI
  // ==========================================
  alice: {
    id: 'alice',
    name: 'Alice Lạc Bước',
    title: 'Alice — Wonderland Wanderer',
    desc: 'Lấy cảm hứng từ Alice ở Xứ Sở Thần Tiên. Chuyển đổi linh hoạt giữa Dạng Tí Hon né tránh siêu tốc và Dạng Khổng Lồ dậm quét chấn động.',
    strength: 'Thích ứng hoàn hảo — né tránh siêu hạng khi hóa nhỏ, quét sạch chiến trường khi hóa to.',
    weakness: 'Chọn sai dạng sai thời điểm sẽ trả giá đắt (hóa lớn dễ ăn đạn, hóa nhỏ tầm đánh hạn chế).',
    playstyle: 'Thích kiểm soát nhịp độ, biến hóa linh hoạt giữa cơ động né chiêu và hủy diệt càn quét.',
    icon: 'alice_ribbon',
    color: '#38bdf8',
    category: 'classic',
    lore: 'Kiệt tác Alice ở Xứ Sở Thần Tiên (Lewis Carroll): Bình thuốc "Drink Me" và chiếc bánh "Eat Me" kỳ diệu.',
    startWeapon: 'void_wand',
    baseStats: {
      hp: 95, dmg: 12, speed: 95, attackCd: 0.44,
      critChance: 0.08, critMult: 1.6, armor: 1, dashCd: 1.7,
    },
    growth: {
      hp: 3, dmg: 0.5, speed: 0.8, critChance: 0.003,
    },
    attackStyle: {
      type: 'wonderland_shift',
      name: 'Kim Châm / Dậm Đất Khổng Lồ',
      range: 42,
      arc: Math.PI * 0.5,
      knockback: 25,
      color: '#38bdf8',
      desc: 'Tí Hon đâm kim chớp nhoáng tầm gần; Khổng Lồ dậm đất bán kính 75px hất văng quái cực xa.',
    },
    activeSkill: {
      id: 'alice_shift',
      name: 'Bình Thuốc Thần & Bánh Nấm',
      type: 'alice_shift',
      cd: 4.0,
      dmg: 25,
      desc: 'Chuyển đổi tức thì giữa Dạng Tí Hon và Dạng Khổng Lồ. Hóa nhỏ cho 1.5s tàng hình né đòn; Hóa lớn tạo sóng xung kích đẩy lùi mọi kẻ địch.',
    },
    passive: {
      name: 'Ảo Diệu Xứ Thần Tiên',
      desc: 'Chuyển sang Dạng Tí Hon nhận 3s tăng 50% tốc đánh; Chuyển sang Dạng Khổng Lồ nhận khiên chắn hấp thụ 25 sát thương.',
      effect: { formShiftBonus: true, smallAttackSpeedBonus: 0.5, giantShield: 25 },
    },
    skillChoices: [
      { level: 3, options: [
        { id: 'white_rabbit_haste', branch: 'Tí Hon Xuất Quỷ', name: 'Bộ Pháp Thỏ Trắng', desc: 'Dạng Tí Hon né đòn +25%, lướt để lại đồng hồ làm chậm quái 50%', effect: { smallDodgeChance: 0.25, clockSlow: 0.5 }, cost: 'Không có' },
        { id: 'queen_hammer', branch: 'Khổng Lồ Trấn Áp', name: 'Búa Tạ Hoàng Hậu', desc: 'Dạng Khổng Lồ tăng +40% sát thương đòn đánh và dậm đất gây choáng 1s', effect: { giantDmgBonus: 0.4, stompStun: 1.0 }, cost: '-10% Tốc chạy Dạng Khổng Lồ' },
      ]},
      { level: 5, options: [
        { id: 'wonderland_harmony', branch: 'Biến Ảo Nhịp Nhàng', name: 'Nhịp Điệu Đổi Dạng', desc: 'Mỗi lần chuyển dạng hồi 8 HP và phát nổ ma thuật 25 sát thương diện rộng', effect: { shiftHeal: 8, shiftNovaDmg: 25 }, cost: 'Không có' },
        { id: 'giant_fortitude', branch: 'Khổng Lồ Trấn Áp', name: 'Thần Thể Bất Bại', desc: 'Dạng Khổng Lồ nhận +6 Giáp và miễn nhiễm hoàn toàn đẩy lùi', effect: { giantArmor: 6, giantUnstoppable: true }, cost: 'Không có' },
      ]},
      { level: 8, options: [
        { id: 'mad_tea_party', branch: 'Tí Hon Xuất Quỷ', name: 'Tiệc Trà Điên Cuồng', desc: 'Dạng Tí Hon bắn thêm chùm 4 tách trà ma thuật truy tìm mục tiêu; lướt hồi lại tức thì khi né thành công', effect: { teaProjectiles: 4, perfectDodgeReset: true }, cost: 'Không có' },
        { id: 'perfect_balance', branch: 'Biến Ảo Nhịp Nhàng', name: 'Cân Bằng Hoàn Hảo', desc: 'Dạng Tí Hon giữ nguyên 100% sát thương Dạng Khổng Lồ; Dạng Khổng Lồ không còn bị trừ tốc chạy', effect: { perfectFormBonus: true }, cost: 'Không có' },
      ]},
    ],
  },

  wukong: {
    id: 'wukong',
    name: 'Tôn Ngộ Không',
    title: 'Wukong — Tề Thiên Đại Thánh',
    desc: 'Lấy cảm hứng từ Tây Du Ký. Gậy Như Ý dài ra theo chuỗi đòn đánh, tích nhịp điệu giáng đòn sấm sét và nhổ lông gọi phân thân thu hút hỏa lực.',
    strength: 'Tầm gậy vươn cực xa khi duy trì nhịp liên kích, phân thân kéo toàn bộ quái vật.',
    weakness: 'Đánh trượt hoặc bị đánh trúng sẽ mất nhịp, uy lực đòn đánh giảm sút.',
    playstyle: 'Thích kỹ năng điều khiển nhịp độ cao, giữ chuỗi liên hoàn chính xác, võ thuật cận chiến mãn nhãn.',
    icon: 'wukong_staff',
    color: '#eab308',
    category: 'classic',
    lore: 'Tây Du Ký (Ngô Thừa Ân): Như Ý Kim Cô Bổng một vạn ba ngàn năm trăm cân và thuật phân thân thần thông biến hóa.',
    startWeapon: 'thunder_scepter',
    baseStats: {
      hp: 105, dmg: 14, speed: 90, attackCd: 0.48,
      critChance: 0.10, critMult: 1.7, armor: 2, dashCd: 1.8,
    },
    growth: {
      hp: 3.5, dmg: 0.6, speed: 0.7, critChance: 0.004,
    },
    attackStyle: {
      type: 'wukong_staff_combo',
      name: 'Như Ý Kim Cô Bổng',
      range: 52,
      arc: Math.PI * 0.65,
      knockback: 40,
      color: '#eab308',
      desc: 'Gậy dài ra theo từng đòn đánh trúng (tối đa 5 tầng nhịp, tầm vươn tới 112px). Đạt tầng 5 giáng đòn Thiên Lôi x3.5 sát thương!',
    },
    activeSkill: {
      id: 'wukong_clone',
      name: 'Phân Thân Cứu Mạng',
      type: 'wukong_clone',
      cd: 8.0,
      dmg: 30,
      desc: 'Bứt túm lông khỉ thổi bay, tạo 2 phân thân Hoàng Kim lao vào quái vật, thu hút toàn bộ hỏa lực trong 4s trước khi nổ tung sấm sét.',
    },
    passive: {
      name: 'Kim Cô Nhịp Điệu',
      desc: 'Đánh trúng liên tục tích tầng nhịp (tối đa 5 tầng, mỗi tầng +15% tầm gậy và +12% sát thương). Bị đánh hoặc đánh hụt mất 1 tầng.',
      effect: { comboMeterMax: 5, rangePerStack: 12, dmgPerStack: 0.12, slamMult: 3.5 },
    },
    skillChoices: [
      { level: 3, options: [
        { id: 'sky_pillar_reach', branch: 'Thiết Bổng Định Hải', name: 'Kình Thiên Trụ', desc: 'Tầm gậy cơ bản +25px, góc quét mở rộng 180°, gậy hất văng quái xa gấp đôi', effect: { baseRangeBonus: 25, arc180: true, knockbackMult: 1.8 }, cost: 'Không có' },
        { id: 'somersault_cloud', branch: 'Cân Đẩu Vân Cơ Động', name: 'Cân Đẩu Vân', desc: 'Lướt bay trên mây thần: không bị mất tầng nhịp khi bị đánh trong lúc lướt, tốc chạy +15', effect: { cloudDash: true, moveSpeed: 15 }, cost: 'Không có' },
      ]},
      { level: 5, options: [
        { id: 'clones_explosion', branch: 'Vạn Năng Phân Thân', name: 'Hoàng Kim Hộ Thể', desc: 'Phân thân tồn tại 6s, khi biến mất phát nổ gây 50 sát thương lôi điện cho quái xung quanh', effect: { cloneDurationBonus: 2.0, cloneDetonateDmg: 50 }, cost: 'Không có' },
        { id: 'furious_tempo', branch: 'Thiết Bổng Định Hải', name: 'Cuồng Nhịp Tề Thiên', desc: 'Tối đa 7 tầng nhịp; mỗi tầng tăng thêm 15% sát thương chí mạng', effect: { maxStacksBonus: 2, critMultPerStack: 0.15 }, cost: 'Không có' },
      ]},
      { level: 8, options: [
        { id: 'heaven_splitter_slam', branch: 'Thiết Bổng Định Hải', name: 'Thiên Địa Khai Tịch', desc: 'Đòn giáng gậy tầng tối đa phóng ra 3 luồng sóng kình phong quét ngang toàn bộ sàn đấu', effect: { staffShockwaves: 3, shockwaveDmgMult: 0.8 }, cost: 'Không có' },
        { id: 'diamond_body', branch: 'Cân Đẩu Vân Cơ Động', name: 'Kim Cương Bất Hoại', desc: 'Nhận +8 Giáp khi có từ 3 tầng nhịp trở lên; đòn đánh chí mạng hồi 4 HP', effect: { tempoArmor: 8, tempoArmorReq: 3, critHeal: 4 }, cost: '-10% Tốc đánh' },
      ]},
    ],
  },

  dracula: {
    id: 'dracula',
    name: 'Bá Tước Dracula',
    title: 'Dracula — Chúa Tể Bóng Đêm',
    desc: 'Lấy cảm hứng từ kiệt tác Dracula của Bram Stoker. Dùng máu bản thân làm tài nguyên phóng thích đàn dơi bóng tối bất tử và hút lại sinh lực tột bực.',
    strength: 'Sát thương bùng nổ cực cao, hút máu mạnh nhất game, khả năng miễn nhiễm sát thương dạng dơi.',
    weakness: 'Kỹ năng đốt máu trực tiếp — nếu dùng chiêu hụt không hút lại được sẽ tự sát thương chính mình.',
    playstyle: 'Thích lối chơi rủi ro cao lợi nhuận lớn (high-risk high-reward), làm chủ ranh giới sinh tử.',
    icon: 'dracula_bat',
    color: '#dc2626',
    category: 'classic',
    lore: 'Kiệt tác Dracula (Bram Stoker): Lâu đài Transylvania cổ kính, tiếng dơi đêm vỗ cánh và khát khao máu bất tử.',
    startWeapon: 'blood_spear',
    baseStats: {
      hp: 110, dmg: 15, speed: 85, attackCd: 0.5,
      critChance: 0.12, critMult: 1.8, armor: 1, dashCd: 1.9,
    },
    growth: {
      hp: 3, dmg: 0.7, lifesteal: 0.008, critChance: 0.004,
    },
    attackStyle: {
      type: 'vampire_claws',
      name: 'Vuốt Huyết Dạ',
      range: 46,
      arc: Math.PI * 0.55,
      knockback: 22,
      color: '#dc2626',
      desc: 'Cặp vuốt máu quỷ xé toạc kẻ địch, gây chảy máu 4 sát thương/giây trong 3s.',
    },
    activeSkill: {
      id: 'dracula_bat_swarm',
      name: 'Hóa Đàn Dơi Đêm',
      type: 'dracula_bat_swarm',
      cd: 6.5,
      dmg: 42,
      desc: 'Tiêu tốn 10% HP hiện tại hóa thành đàn dơi quỷ bay xuyên qua mọi kẻ địch trong 1.5s (hoàn toàn bất tử), gây 42 sát thương xé xác và hút lại 25% sát thương chuyển thành HP!',
    },
    passive: {
      name: 'Khát Máu Bá Tước',
      desc: 'Hút máu cơ bản 15%. Khi HP < 50% tăng lên 30% hút máu; Khi HP < 25% tăng lên 45% hút máu. Đánh trúng kẻ địch chảy máu hồi 2 HP.',
      effect: { lifestealBase: 0.15, lowHpThreshold: 0.5, lowHpLifesteal: 0.30, criticalThreshold: 0.25, criticalLifesteal: 0.45, bleedHitHeal: 2 },
    },
    skillChoices: [
      { level: 3, options: [
        { id: 'blood_pact_efficiency', branch: 'Huyết Thần Tối Thượng', name: 'Hiến Tế Giảm Chi Phí', desc: 'Kỹ năng Hóa Đàn Dơi chỉ tốn 5% HP (thay vì 10%), tăng tầm bay +30%', effect: { batCostReduction: 0.5, batDistanceBonus: 0.3 }, cost: 'Không có' },
        { id: 'deep_rend_bleed', branch: 'Vuốt Xé Động Mạch', name: 'Xé Toạc Động Mạch', desc: 'Sát thương chảy máu tăng gấp đôi, quái vật đang chảy máu chịu thêm 30% sát thương từ mọi đòn đánh', effect: { bleedDmgMult: 2.0, bleedTargetDmgBonus: 0.3 }, cost: 'Không có' },
      ]},
      { level: 5, options: [
        { id: 'screeching_bat_fury', branch: 'Hắc Dạ Biên Bức', name: 'Tiếng Hú Siêu Âm', desc: 'Đàn dơi phóng ra sóng âm làm mù và làm chậm quái 60% trong 3s', effect: { batBlindSlow: 0.6, batBlindDur: 3.0 }, cost: 'Không có' },
        { id: 'crimson_overshield', branch: 'Huyết Thần Tối Thượng', name: 'Huyết Giáp Bá Tước', desc: 'Lượng máu hút vượt 100% HP chuyển thành khiên máu tối đa 50 HP', effect: { crimsonShieldMax: 50 }, cost: 'Không có' },
      ]},
      { level: 8, options: [
        { id: 'vampiric_immortality', branch: 'Huyết Thần Tối Thượng', name: 'Chúa Tể Bất Tử', desc: 'Khi HP tụt dưới 20%, tự động kích hoạt Đàn Dơi Đêm không tốn máu và hồi phục tức thì 40% HP (1 lần/màn)', effect: { autoBatEmergency: true, emergencyHealPct: 0.4 }, cost: 'Không có' },
        { id: 'blood_cataclysm', branch: 'Vuốt Xé Động Mạch', name: 'Huyết Vực Bộc Phát', desc: '+18 Sát thương, tiêu diệt quái đang chảy máu kích nổ máu đỏ gây sát thương lan tỏa toàn màn hình', effect: { baseDmg: 18, bleedCorpseExplosion: true }, cost: '-15 HP tối đa' },
      ]},
    ],
  },

  piper: {
    id: 'piper',
    name: 'Người Thổi Sáo Hamelin',
    title: 'Pied Piper — Khúc Ca Mê Hoặc',
    desc: 'Lấy cảm hứng từ truyền thuyết Người Thổi Sáo Thành Hamelin. Bắn nốt nhạc mê hoặc dẫn dụ quái vật tự diệt lẫn nhau và kích nổ âm vang cộng hưởng.',
    strength: 'Bậc thầy kiểm soát vị trí và gom quái diện rộng, kích hoạt phản ứng nổ dây chuyền quét sạch đàn quái đông.',
    weakness: 'Sát thương đơn lẻ trực diện không cao, dễ bị động nếu bị quái đơn lẻ đuổi sát mà không gom được đàn.',
    playstyle: 'Thích tư duy chiến thuật, điều phối vị trí kẻ địch, tạo phản ứng dây chuyền ngoạn mục.',
    icon: 'piper_flute',
    color: '#10b981',
    category: 'classic',
    lore: 'Truyền thuyết nước Đức ghi chép bởi Anh em Grimm: Tiếng sáo ma thuật dẫn dụ bầy chuột rời khỏi thành Hamelin.',
    startWeapon: 'composite_bow',
    baseStats: {
      hp: 90, dmg: 11, speed: 92, attackCd: 0.42,
      critChance: 0.08, critMult: 1.5, armor: 1, dashCd: 1.7,
    },
    growth: {
      hp: 2.5, dmg: 0.45, speed: 0.8, pickupRange: 1.5,
    },
    attackStyle: {
      type: 'resonant_notes',
      name: 'Tiếng Sáo Âm Vang',
      range: 170,
      count: 2,
      speed: 210,
      pierce: true,
      color: '#10b981',
      desc: 'Thổi ra các nốt nhạc ma thuật xuyên thấu kẻ địch và gắn "Dấu Ấn Mê Hoặc" trong 5s.',
    },
    activeSkill: {
      id: 'piper_hypnosis',
      name: 'Vũ Điệu Mê Hoặc',
      type: 'piper_hypnosis',
      cd: 7.5,
      dmg: 25,
      desc: 'Thổi khúc nhạc ma mị: Kéo toàn bộ quái vật bị đánh dấu trong phạm vi 300px quy tụ vào tâm, ép chúng tấn công lẫn nhau trong 4s và triệu hồi bầy chuột trợ thủ ùa ra cắn xé!',
    },
    passive: {
      id: 'piper_echo',
      name: 'Cộng Hưởng Âm Vang',
      desc: 'Kẻ địch có Dấu Ấn Mê Hoặc khi chết sẽ phát ra sóng âm lan tỏa, gây 30% máu tối đa của chúng cho quái xung quanh!',
      effect: { resonanceEcho: true, echoDmgPercent: 0.30, echoRadius: 70 },
    },
    skillChoices: [
      { level: 3, options: [
        { id: 'harmonic_echo_expand', branch: 'Âm Vang Lan Tỏa', name: 'Đại Hợp Xướng', desc: 'Bán kính nổ âm vang tăng lên 110px, sát thương nổ tăng lên 45% máu tối đa', effect: { echoRadiusBonus: 40, echoDmgBonus: 0.15 }, cost: 'Không có' },
        { id: 'rat_scouts', branch: 'Bầy Chuột Trợ Thủ', name: 'Bầy Chuột Tiên Phong', desc: 'Triệu hồi 3 chú chuột trợ thủ vĩnh viễn bám theo người chơi, cắn quái gây 12 sát thương/đòn', effect: { ratMinions: 3, ratDmg: 12 }, cost: 'Không có' },
      ]},
      { level: 5, options: [
        { id: 'mass_frenzy_melody', branch: 'Thao Túng Bầy Đàn', name: 'Khúc Ca Hỗn Loạn', desc: 'Quái vật bị mê hoặc đánh nhau nhận thêm 200% sát thương và tăng 50% tốc đánh', effect: { mobFightDmgMult: 2.0, mobFightSpeed: 0.5 }, cost: 'Không có' },
        { id: 'rat_infestation', branch: 'Bầy Chuột Trợ Thủ', name: 'Đại Đàn Chuột Bão Táp', desc: 'Số lượng chuột tăng lên 6 con; chuột cắn truyền độc làm chậm quái 40%', effect: { ratMinionsBonus: 3, ratPoisonSlow: 0.4 }, cost: '-10% Tốc đánh bản thân' },
      ]},
      { level: 8, options: [
        { id: 'cataclysm_cadence', branch: 'Âm Vang Lan Tỏa', name: 'Tiết Tấu Tận Diệt', desc: 'Âm vang nổ dây chuyền kích hoạt thêm hiệu ứng làm choáng 2s; mỗi quái chết hồi 3 HP', effect: { echoStun: 2.0, echoHealOnDeath: 3 }, cost: 'Không có' },
        { id: 'rat_king_summon', branch: 'Bầy Chuột Trợ Thủ', name: 'Chuột Chúa Khổng Lồ', desc: 'Triệu hồi Chuột Chúa khổng lồ có 250 HP, dậm đất gây chấn động 35 sát thương và cản đạn', effect: { ratKing: true, ratKingHp: 250, ratKingDmg: 35 }, cost: '-15 HP tối đa bản thân' },
      ]},
    ],
  },
};

// ============================================================
// REGULAR LEVEL UPGRADE POOLS (TAILORED PER CLASS)
// Offers distinct build paths for each class on non-milestone levels!
// ============================================================
export const CLASS_UPGRADES = {
  warrior: [
    { id: 'w_heavy_armor', name: 'Giáp Nặng Rèn Kỹ', branch: 'Đỡ Đòn & Phản Công', desc: '+3 Giáp, +20 HP', statChanges: { armor: 3, maxHp: 20 }, condition: 'Luôn kích hoạt', cost: '-5 Tốc độ di chuyển', tradeOff: { moveSpeed: -5 }, icon: 'shield', nextMilestone: 'Cấp 3: Thành Trì Sắt' },
    { id: 'w_thorns_guard', name: 'Phản Đòn Thiết Gai', branch: 'Đỡ Đòn & Phản Công', desc: '+2 Giáp, phản lại 25% sát thương khi bị đánh', statChanges: { armor: 2, counterReflect: 0.25 }, condition: 'Khi bị tấn công', cost: 'Không có', icon: 'shield', nextMilestone: 'Cấp 5: Hơi Thở Thứ Hai' },
    { id: 'w_berserk_strike', name: 'Trảm Kích Cuồng Bạo', branch: 'Cuồng Chiến Sĩ', desc: '+4 Sát thương đại kiếm, +5% chí mạng', statChanges: { baseDmg: 4, critChance: 0.05 }, condition: 'Khi HP < 50% tăng gấp rưỡi', cost: '-1 Giáp', tradeOff: { armor: -1 }, icon: 'sword', nextMilestone: 'Cấp 3: Cuồng Nộ Huyết Tế' },
    { id: 'w_blood_ferocity', name: 'Huyết Chiến Tốc Trảm', branch: 'Cuồng Chiến Sĩ', desc: '+15% Tốc đánh, -0.06s hồi đòn', statChanges: { attackCd: -0.06, attackSpeedBonus: 0.15 }, condition: 'Luôn kích hoạt', cost: '-10 HP tối đa', tradeOff: { maxHp: -10 }, icon: 'dash', nextMilestone: 'Cấp 5: Cuồng Phong Trảm' },
  ],
  mage: [
    { id: 'm_arcane_surge', name: 'Dòng Xung Ma Năng', branch: 'Chuỗi Nguyên Tố', desc: '+3 Sát thương phép, -10% hồi chiêu kỹ năng', statChanges: { baseDmg: 3, cdReduction: 0.10 }, condition: 'Luôn kích hoạt', cost: 'Không có', icon: 'lightning', nextMilestone: 'Cấp 3: Lôi Ma Liên Hoàn' },
    { id: 'm_frost_chill', name: 'Hàn Băng Thấu Xương', branch: 'Chuỗi Nguyên Tố', desc: 'Đạn phép làm chậm địch thêm 20%, +15 HP tối đa', statChanges: { frostSlow: 0.20, maxHp: 15 }, condition: 'Đánh trúng mục tiêu', cost: 'Không có', icon: 'shield', nextMilestone: 'Cấp 5: Băng Giáp Tê Liệt' },
    { id: 'm_vortex_expand', name: 'Bán Kính Hư Vô', branch: 'Phép Diện Rộng', desc: '+20px Bán kính hút Hố Đen, +6 sát thương nổ', statChanges: { vortexRadiusBonus: 20, baseDmg: 6 }, condition: 'Kỹ năng Q', cost: '+0.5s Hồi chiêu Q', tradeOff: { skillCdPenalty: 0.5 }, icon: 'flame', nextMilestone: 'Cấp 3: Đại Hỏa Bộc' },
    { id: 'm_extra_missile', name: 'Đa Tinh Cầu', branch: 'Phép Diện Rộng', desc: '+1 Đạn ma pháp tự tìm địch', statChanges: { extraProjectiles: 1 }, condition: 'Mọi đòn đánh', cost: '-5% Tốc chạy', tradeOff: { moveSpeed: -5 }, icon: 'flame', nextMilestone: 'Cấp 5: Thiên Hỏa Tận Diệt' },
  ],
  ranger: [
    { id: 'r_sniper_focus', name: 'Kính Ngắm Thiện Xạ', branch: 'Bắn Tỉa Chuẩn Xác', desc: '+4 Sát thương, +8% tỉ lệ chí mạng', statChanges: { baseDmg: 4, critChance: 0.08 }, condition: 'Bắn từ xa', cost: 'Không có', icon: 'sword', nextMilestone: 'Cấp 3: Phát Bắn Thần Sầu' },
    { id: 'r_pierce_mastery', name: 'Mũi Tên Xuyên Thấu', branch: 'Bắn Tỉa Chuẩn Xác', desc: '+0.3 Hệ số sát thương chí mạng, tên bay nhanh +20%', statChanges: { critMult: 0.3, projSpeedMult: 0.2 }, condition: 'Đòn chí mạng', cost: 'Không có', icon: 'bow', nextMilestone: 'Cấp 5: Xuyên Giáp Liệt Tâm' },
    { id: 'r_fan_arrows', name: 'Bão Tên Liên Hoàn', branch: 'Mưa Tên Dọn Đám Đông', desc: '+1 Đạn bắn ra, +10 Tốc độ di chuyển', statChanges: { extraProjectiles: 1, moveSpeed: 10 }, condition: 'Mọi đòn đánh', cost: 'Không có', icon: 'boots', nextMilestone: 'Cấp 3: Ngũ Tiễn Tề Phát' },
    { id: 'r_wind_leap', name: 'Bước Nhảy Của Gió', branch: 'Mưa Tên Dọn Đám Đông', desc: '-0.3s Hồi lướt, tăng tầm nhặt XP +20px', statChanges: { dashCd: -0.3, pickupRange: 20 }, condition: 'Khi lướt né đòn', cost: 'Không có', icon: 'lightning', nextMilestone: 'Cấp 5: Tiễn Lạc Nảy Bật' },
  ],
  assassin: [
    { id: 'a_shadow_edge', name: 'Lưỡi Dao Bóng Đêm', branch: 'Ám Sát Đơn Mục Tiêu', desc: '+5 Sát thương đao, +10% tỉ lệ chí mạng', statChanges: { baseDmg: 5, critChance: 0.10 }, condition: 'Áp sát cận chiến', cost: '-5 HP tối đa', tradeOff: { maxHp: -5 }, icon: 'sword', nextMilestone: 'Cấp 3: Nhát Đâm Tử Huyệt' },
    { id: 'a_arterial_cut', name: 'Vết Cắt Tử Thần', branch: 'Ám Sát Đơn Mục Tiêu', desc: '+0.4 Sát thương chí mạng, đòn đánh gây chảy máu', statChanges: { critMult: 0.4, bleedDmgBonus: 2 }, condition: 'Sau khi lướt', cost: 'Không có', icon: 'flame', nextMilestone: 'Cấp 5: Đao Phủ Huyết Lệnh' },
    { id: 'a_phantom_step', name: 'Bộ Pháp Ảo Ảnh', branch: 'Lướt Liên Hoàn', desc: '-0.25s Hồi chiêu lướt, lướt xa hơn 15%', statChanges: { dashCd: -0.25, dashDistMult: 0.15 }, condition: 'Kích hoạt liên tục', cost: 'Không có', icon: 'dash', nextMilestone: 'Cấp 3: Lướt Bóng Ma' },
    { id: 'a_smoke_burst', name: 'Màn Khói Che Mắt', branch: 'Lướt Liên Hoàn', desc: '+0.15s Thời gian bất tử khi lướt, +12 Tốc độ di chuyển', statChanges: { iframeBonus: 0.15, moveSpeed: 12 }, condition: 'Khi lướt', cost: 'Không có', icon: 'boots', nextMilestone: 'Cấp 5: Song Trùng Ảo Ảnh' },
  ],
  paladin: [
    { id: 'p_holy_armor', name: 'Giáp Trụ Thần Thánh', branch: 'Bảo Hộ & Hồi Phục', desc: '+2 Giáp, +25 HP, hồi 1 HP mỗi 3s', statChanges: { armor: 2, maxHp: 25, regen: 1 }, condition: 'Luôn kích hoạt', cost: '-5% Tốc chạy', tradeOff: { moveSpeed: -4 }, icon: 'shield', nextMilestone: 'Cấp 3: Thánh Thuẫn Hộ Thể' },
    { id: 'p_consecrate_power', name: 'Thánh Hóa Rộng Mở', branch: 'Bảo Hộ & Hồi Phục', desc: '+15px Bán kính thánh địa, hồi máu thánh địa +2 HP/s', statChanges: { consecrateRadiusBonus: 15, consecrateHealBonus: 2 }, condition: 'Kỹ năng Q', cost: 'Không có', icon: 'heart', nextMilestone: 'Cấp 5: Đất Thánh Bất Xâm' },
    { id: 'p_smite_blade', name: 'Lôi Thánh Phán Quyết', branch: 'Trừng Phạt Thần Thánh', desc: '+4 Sát thương búa, đòn đánh giật sét lan 1 quái', statChanges: { baseDmg: 4, holySmiteChains: 1 }, condition: 'Đánh trúng mục tiêu', cost: 'Không có', icon: 'lightning', nextMilestone: 'Cấp 3: Lôi Thánh Trừng Giới' },
    { id: 'p_righteous_wrath', name: 'Thánh Hỏa Thiêu Đốt', branch: 'Trừng Phạt Thần Thánh', desc: '+15% Tốc đánh, gây cháy thánh 3 sát thương/s', statChanges: { attackSpeedBonus: 0.15, holyBurn: 3 }, condition: 'Mọi đòn đánh', cost: '-1 Giáp', tradeOff: { armor: -1 }, icon: 'flame', nextMilestone: 'Cấp 5: Nhiệt Huyết Thập Tự' },
  ],
  necromancer: [
    { id: 'n_blood_whip', name: 'Roi Máu Huyết Đằng', branch: 'Hấp Tinh Hút Máu', desc: '+5% Hút máu, +3 Sát thương roi', statChanges: { lifestealBonus: 0.05, baseDmg: 3 }, condition: 'Mọi đòn đánh', cost: 'Không có', icon: 'heart', nextMilestone: 'Cấp 3: Roi Máu Huyết Hải' },
    { id: 'n_vitality_drain', name: 'Tước Đoạt Sinh Mệnh', branch: 'Hấp Tinh Hút Máu', desc: 'Giết mỗi quái hồi thêm 2% HP tối đa, +15 HP', statChanges: { healOnKillPercent: 0.02, maxHp: 15 }, condition: 'Khi tiêu diệt địch', cost: 'Không có', icon: 'skull', nextMilestone: 'Cấp 5: Màn Chắn Máu' },
    { id: 'n_soul_spark', name: 'Mầm Mống U Linh', branch: 'Triệu Hồi & Nổ Xác', desc: 'Xác quái phát nổ gây 15 sát thương; phạm vi nổ +10px', statChanges: { deathExplosion: true, explosionDmg: 15, explosionRadiusBonus: 10 }, condition: 'Quái chết', cost: 'Không có', icon: 'flame', nextMilestone: 'Cấp 3: Kích Nổ Tàn Hài' },
    { id: 'n_grave_chill', name: 'Hàn Khí Cõi Âm', branch: 'Triệu Hồi & Nổ Xác', desc: 'Lưỡi hái làm chậm quái 40% trong 2s, +1 Đạn hắc ám', statChanges: { frostSlow: 0.4, extraProjectiles: 1 }, condition: 'Đòn đánh và Q', cost: '-5% Tốc chạy', tradeOff: { moveSpeed: -4 }, icon: 'shield', nextMilestone: 'Cấp 5: Triệu Hồi Âm Hồn' },
  ],
  alice: [
    { id: 'al_needle_swift', name: 'Kim Châm Tốc Biến', branch: 'Tí Hon Xuất Quỷ', desc: '+15% Tốc chạy, -0.06s hồi đòn dạng Tí Hon', statChanges: { moveSpeed: 15, attackCd: -0.06 }, condition: 'Dạng Tí Hon', cost: 'Không có', icon: 'boots', nextMilestone: 'Cấp 3: Bộ Pháp Thỏ Trắng' },
    { id: 'al_dodge_tea', name: 'Hương Trà Ảo Ảnh', branch: 'Tí Hon Xuất Quỷ', desc: '+15% Né đòn, lướt để lại làn sương che mắt quái', effect: { smallDodgeChance: 0.15 }, condition: 'Dạng Tí Hon', cost: 'Không có', icon: 'dash', nextMilestone: 'Cấp 5: Nhịp Điệu Đổi Dạng' },
    { id: 'al_stomp_crush', name: 'Chấn Động Hoàng Tộc', branch: 'Khổng Lồ Trấn Áp', desc: '+5 Sát thương dậm, lực đẩy văng quái +40px', statChanges: { baseDmg: 5, knockbackBonus: 40 }, condition: 'Dạng Khổng Lồ', cost: '-5% Tốc chạy', tradeOff: { moveSpeed: -5 }, icon: 'sword', nextMilestone: 'Cấp 3: Búa Tạ Hoàng Hậu' },
    { id: 'al_giant_shield', name: 'Lá Chắn Bánh Nấm', branch: 'Khổng Lồ Trấn Áp', desc: '+3 Giáp, +30 HP tối đa', statChanges: { armor: 3, maxHp: 30 }, condition: 'Dạng Khổng Lồ', cost: 'Không có', icon: 'shield', nextMilestone: 'Cấp 5: Thần Thể Bất Bại' },
  ],
  wukong: [
    { id: 'wk_staff_extension', name: 'Gậy Dài Vạn Trượng', branch: 'Thiết Bổng Định Hải', desc: '+15px Tầm gậy cơ bản, +3 sát thương', statChanges: { baseRangeBonus: 15, baseDmg: 3 }, condition: 'Mọi đòn đánh', cost: 'Không có', icon: 'wukong_staff', nextMilestone: 'Cấp 3: Kình Thiên Trụ' },
    { id: 'wk_heavy_slam', name: 'Càn Khôn Giáng Thế', branch: 'Thiết Bổng Định Hải', desc: '+50% Sát thương đòn Thiên Lôi tầng 5', effect: { slamBonusMult: 0.5 }, condition: 'Tầng nhịp 5', cost: 'Không có', icon: 'lightning', nextMilestone: 'Cấp 5: Cuồng Nhịp Tề Thiên' },
    { id: 'wk_clone_fury', name: 'Lông Vàng Trợ Chiến', branch: 'Vạn Năng Phân Thân', desc: 'Phân thân gây thêm 10 sát thương mỗi đòn, tồn tại lâu hơn 1.5s', effect: { cloneDmgBonus: 10, cloneDurationBonus: 1.5 }, condition: 'Kỹ năng Q', cost: 'Không có', icon: 'flame', nextMilestone: 'Cấp 5: Hoàng Kim Hộ Thể' },
    { id: 'wk_cloud_nimble', name: 'Khí Tức Cân Đẩu', branch: 'Cân Đẩu Vân Cơ Động', desc: '+12 Tốc độ di chuyển, -0.3s hồi lướt', statChanges: { moveSpeed: 12, dashCd: -0.3 }, condition: 'Luôn kích hoạt', cost: 'Không có', icon: 'boots', nextMilestone: 'Cấp 3: Cân Đẩu Vân' },
  ],
  dracula: [
    { id: 'dr_blood_craving', name: 'Khát Máu Huyết Đao', branch: 'Huyết Thần Tối Thượng', desc: '+8% Hút máu, đòn vuốt hồi thêm 1 HP khi trúng đích', statChanges: { lifestealBonus: 0.08, healOnHit: 1 }, condition: 'Mọi đòn đánh', cost: 'Không có', icon: 'heart', nextMilestone: 'Cấp 3: Hiến Tế Giảm Chi Phí' },
    { id: 'dr_crimson_power', name: 'Huyết Lực Bùng Nổ', branch: 'Huyết Thần Tối Thượng', desc: '+5 Sát thương, khi dưới 50% HP tăng thêm 20% sát thương', statChanges: { baseDmg: 5 }, condition: 'Khi HP < 50%', cost: '-5 HP tối đa', tradeOff: { maxHp: -5 }, icon: 'sword', nextMilestone: 'Cấp 5: Huyết Giáp Bá Tước' },
    { id: 'dr_bat_rend', name: 'Biên Bức Xé Thịt', branch: 'Vuốt Xé Động Mạch', desc: 'Kỹ năng Đàn Dơi tăng +10 sát thương và tăng thời gian bất tử +0.3s', effect: { batDmgBonus: 10, batDurationBonus: 0.3 }, condition: 'Kỹ năng Q', cost: '+0.5s Hồi chiêu Q', tradeOff: { skillCdPenalty: 0.5 }, icon: 'dracula_bat', nextMilestone: 'Cấp 3: Xé Toạc Động Mạch' },
    { id: 'dr_night_shadow', name: 'Hóa Thân Dạ Quỷ', branch: 'Vuốt Xé Động Mạch', desc: '+15 Tốc độ di chuyển khi HP dưới 50%, đòn chí mạng gây chảy máu', statChanges: { moveSpeed: 15, critChance: 0.05 }, condition: 'Khi mất máu', cost: 'Không có', icon: 'dash', nextMilestone: 'Cấp 5: Tiếng Hú Siêu Âm' },
  ],
  piper: [
    { id: 'pi_resonant_freq', name: 'Tần Số Cộng Hưởng', branch: 'Âm Vang Lan Tỏa', desc: '+25px Phạm vi nổ âm vang, +15% sát thương nổ', statChanges: { echoRadiusBonus: 25, echoDmgBonus: 0.15 }, condition: 'Quái có dấu ấn chết', cost: 'Không có', icon: 'flame', nextMilestone: 'Cấp 3: Đại Hợp Xướng' },
    { id: 'pi_charming_tempo', name: 'Giai Điệu Mê Hồn', branch: 'Thao Túng Bầy Đàn', desc: 'Dấu Ấn Mê Hoặc tồn tại lâu hơn 3s, quái bị mê hoặc nhận thêm 25% sát thương', effect: { charmDurationBonus: 3.0, charmDmgBonus: 0.25 }, condition: 'Mọi mục tiêu trúng đạn', cost: 'Không có', icon: 'piper_flute', nextMilestone: 'Cấp 5: Khúc Ca Hỗn Loạn' },
    { id: 'pi_rat_bite', name: 'Nanh Chuột Sắc Nhọn', branch: 'Bầy Chuột Trợ Thủ', desc: 'Chuột trợ thủ cắn đau hơn +5 sát thương, tốc độ chạy của chuột +30%', effect: { ratDmgBonus: 5, ratSpeedBonus: 0.3 }, condition: 'Chuột trợ thủ', cost: 'Không có', icon: 'skull', nextMilestone: 'Cấp 3: Bầy Chuột Tiên Phong' },
    { id: 'pi_melodic_cadence', name: 'Tiết Tấu Mau Lẹ', branch: 'Âm Vang Lan Tỏa', desc: '-0.06s Hồi đòn bắn sáo, +10 Tốc độ di chuyển', statChanges: { attackCd: -0.06, moveSpeed: 10 }, condition: 'Luôn kích hoạt', cost: 'Không có', icon: 'boots', nextMilestone: 'Cấp 8: Tiết Tấu Tận Diệt' },
  ],
};

// Helper: get class list for UI
export function getClassList() {
  return Object.values(CLASSES);
}

// Helper: get classes by category
export function getClassesByCategory(category) {
  return Object.values(CLASSES).filter(c => c.category === category);
}

// Helper: get tailored upgrades for a class
export function getClassUpgrades(classId) {
  return CLASS_UPGRADES[classId] || CLASS_UPGRADES.warrior;
}
