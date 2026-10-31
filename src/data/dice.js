// Điều kiện xúc xắc cho rương và cửa vận mệnh.
// p = xác suất thành công (để quyết định độ quý của phần thưởng)
export const CONDITIONS = [
  { id: 'even', label: 'Ra số CHẴN', short: 'Chẵn', dice: 1, test: (f) => f[0] % 2 === 0, p: 1 / 2 },
  { id: 'odd', label: 'Ra số LẺ', short: 'Lẻ', dice: 1, test: (f) => f[0] % 2 === 1, p: 1 / 2 },
  { id: 'high', label: 'Ra từ 4 trở lên', short: '≥ 4', dice: 1, test: (f) => f[0] >= 4, p: 1 / 2 },
  { id: 'set125', label: 'Ra 1, 2 hoặc 5', short: '1·2·5', dice: 1, test: (f) => [1, 2, 5].includes(f[0]), p: 1 / 2 },
  { id: 'prime', label: 'Ra số nguyên tố (2, 3, 5)', short: '2·3·5', dice: 1, test: (f) => [2, 3, 5].includes(f[0]), p: 1 / 2 },
  { id: 'big', label: 'Ra 5 hoặc 6', short: '5·6', dice: 1, test: (f) => f[0] >= 5, p: 1 / 3 },
  { id: 'sum9', label: 'Tổng 2 xúc xắc từ 9 trở lên', short: 'Σ ≥ 9', dice: 2, test: (f) => f[0] + f[1] >= 9, p: 10 / 36 },
  { id: 'low5', label: 'Tổng 2 xúc xắc từ 5 trở xuống', short: 'Σ ≤ 5', dice: 2, test: (f) => f[0] + f[1] <= 5, p: 10 / 36 },
  { id: 'six', label: 'Ra đúng mặt 6', short: '6', dice: 1, test: (f) => f[0] === 6, p: 1 / 6 },
  { id: 'double', label: 'Hai xúc xắc ra cùng một mặt', short: 'Đôi', dice: 2, test: (f) => f[0] === f[1], p: 1 / 6 },
];

export const COND = Object.fromEntries(CONDITIONS.map((c) => [c.id, c]));

// Độ quý phần thưởng: càng khó càng quý
export function lootQuality(cond) {
  if (cond.p >= 0.45) return 1;
  if (cond.p >= 0.25) return 2;
  return 3;
}

export function rollDie(min = 1) {
  return min + Math.floor(Math.random() * (7 - min));
}
