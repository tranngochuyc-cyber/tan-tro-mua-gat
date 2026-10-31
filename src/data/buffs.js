// Phúc lành (buff) nhận sau mỗi màn. rarity: 1 thường, 2 hiếm, 3 huyền thoại
export const BUFFS = [
  { id: 'ashblood', name: 'Máu Tro', rarity: 1, icon: '❤', desc: '+25 máu tối đa và hồi 25 máu.', apply: (s, run) => { s.maxHp += 25; run.heal(25); } },
  { id: 'edge', name: 'Lưỡi Mài Sắc', rarity: 1, icon: '⚔', desc: '+15% sát thương cận chiến.', apply: (s) => { s.meleeMul += 0.15; } },
  { id: 'hawk', name: 'Mắt Chim Ưng', rarity: 1, icon: '◎', desc: '+20% sát thương tầm xa và phép.', apply: (s) => { s.rangedMul += 0.2; } },
  { id: 'keen', name: 'Nhắm Vào Khe Giáp', rarity: 1, icon: '✦', desc: '+8% tỉ lệ chí mạng thường.', apply: (s) => { s.critChance += 0.08; } },
  { id: 'fatehand', name: 'Bàn Tay Vận Mệnh', rarity: 1, icon: '⚄', desc: 'Thanh Vận Mệnh nạp nhanh hơn 35%.', apply: (s) => { s.fateGain += 0.35; } },
  { id: 'shadowstep', name: 'Bước Chân Bóng', rarity: 1, icon: '»', desc: 'Lướt hồi nhanh hơn 35%.', apply: (s) => { s.rollCd *= 0.65; } },
  { id: 'gold', name: 'Túi Vàng Của Kẻ Lữ Hành', rarity: 1, icon: '◉', desc: '+60% vàng nhặt được.', apply: (s) => { s.goldMul += 0.6; } },
  { id: 'soulsip', name: 'Hớp Hồn', rarity: 1, icon: '☽', desc: 'Hồi 3 máu mỗi khi hạ một kẻ địch.', apply: (s) => { s.lifeOnKill += 3; } },
  { id: 'loaded', name: 'Xúc Xắc Đổ Chì', rarity: 2, icon: '⚀', desc: 'Xúc xắc của bạn không bao giờ ra mặt 1.', apply: (s) => { s.diceMin = Math.max(s.diceMin, 2); } },
  { id: 'twinsix', name: 'Hai Mặt Sáu', rarity: 2, icon: '⚅', desc: 'Trong chiến đấu, mặt 5 cũng tính là chí mạng định mệnh.', apply: (s) => { s.sixOn5 = true; } },
  { id: 'reroll', name: 'Lời Khẩn Cầu Thứ Hai', rarity: 2, icon: '↺', desc: 'Mỗi rương/cửa xúc xắc được tung lại 1 lần nếu trượt.', apply: (s) => { s.chestRerolls += 1; } },
  { id: 'longfate', name: 'Định Mệnh Kéo Dài', rarity: 2, icon: '∞', desc: 'Kết quả xúc xắc chiến đấu áp dụng cho 2 đòn thay vì 1.', apply: (s) => { s.fateHits += 1; } },
  { id: 'emberedge', name: 'Lưỡi Than Hồng', rarity: 2, icon: '♨', desc: 'Đòn cận chiến đốt cháy kẻ địch.', apply: (s) => { s.burnOnHit = true; } },
  { id: 'frostbite', name: 'Hơi Thở Mùa Đông', rarity: 2, icon: '❄', desc: '12% cơ hội đóng băng kẻ địch 1 giây.', apply: (s) => { s.freezeChance += 0.12; } },
  { id: 'thorns', name: 'Giáp Gai Bù Nhìn', rarity: 2, icon: '✶', desc: 'Kẻ địch đánh trúng bạn nhận lại 20 sát thương.', apply: (s) => { s.thorns += 20; } },
  { id: 'triplejump', name: 'Cánh Quạ Đen', rarity: 2, icon: '⌃', desc: 'Nhảy được 3 lần trên không.', apply: (s) => { s.jumps = Math.max(s.jumps, 3); } },
  { id: 'momentum', name: 'Nhịp Chiến Không Dứt', rarity: 2, icon: '≫', desc: 'Mỗi đòn trúng liên tiếp +4% sát thương (tối đa +40%).', apply: (s) => { s.comboStack = true; } },
  { id: 'rollblade', name: 'Lướt Lưỡi Dao', rarity: 2, icon: '⟿', desc: 'Lướt xuyên qua kẻ địch gây 15 sát thương.', apply: (s) => { s.rollDamage += 15; } },
  { id: 'stormcrit', name: 'Sấm Gọi Định Mệnh', rarity: 3, icon: 'ϟ', desc: 'Mọi đòn chí mạng phóng sét chuyền sang 3 kẻ địch.', apply: (s) => { s.chainOnCrit = true; } },
  { id: 'berserk', name: 'Cơn Thịnh Nộ Cuối Mùa', rarity: 3, icon: '☠', desc: 'Dưới 50% máu: +35% sát thương và đánh nhanh hơn 25%.', apply: (s) => { s.berserk = true; } },
  { id: 'phoenix', name: 'Tro Tàn Tái Sinh', rarity: 3, icon: '✹', desc: 'Khi gục ngã, sống lại với 50% máu (1 lần).', apply: (s) => { s.revives += 1; } },
  { id: 'gambler', name: 'Kẻ Đánh Bạc Với Thần', rarity: 3, icon: '⚂', desc: 'Chí mạng định mệnh gây x4 thay vì x3, nhưng mặt 1 làm bạn mất 5 máu.', apply: (s) => { s.fateCritMul = 4; s.gambler = true; } },
];

export const RARITY = [
  null,
  { name: 'Thường', color: '#d8d2c4' },
  { name: 'Hiếm', color: '#5fb8ff' },
  { name: 'Huyền thoại', color: '#ffb340' },
];

export function defaultStats() {
  return {
    maxHp: 100, meleeMul: 1, rangedMul: 1, critChance: 0.05, critMul: 1.8,
    fateGain: 1, diceMin: 1, sixOn5: false, fateHits: 1, fateCritMul: 3, gambler: false,
    rollCd: 0.5, rollDamage: 0, jumps: 2, lifeOnKill: 0, thorns: 0, burnOnHit: false,
    freezeChance: 0, chainOnCrit: false, goldMul: 1, chestRerolls: 0, revives: 0,
    berserk: false, comboStack: false,
  };
}
