// All combat entities use a world-space rectangle centered on (x, y).
export function circleHitsEntity(x, y, radius, entity) {
  const halfW = (entity.hitboxW || 14) / 2;
  const halfH = (entity.hitboxH || entity.hitboxW || 14) / 2;
  const dx = Math.max(Math.abs(x - entity.x) - halfW, 0);
  const dy = Math.max(Math.abs(y - entity.y) - halfH, 0);
  return dx * dx + dy * dy <= radius * radius;
}

// Swept projectile collision prevents fast shots crossing a small target in one frame.
export function segmentHitsEntity(x0, y0, x1, y1, radius, entity) {
  const halfW = (entity.hitboxW || 14) / 2 + radius;
  const halfH = (entity.hitboxH || entity.hitboxW || 14) / 2 + radius;
  const dx = x1 - x0;
  const dy = y1 - y0;
  let enter = 0;
  let exit = 1;
  for (const [start, velocity, min, max] of [
    [x0, dx, entity.x - halfW, entity.x + halfW],
    [y0, dy, entity.y - halfH, entity.y + halfH],
  ]) {
    if (Math.abs(velocity) < 1e-9) {
      if (start < min || start > max) return false;
      continue;
    }
    const near = (min - start) / velocity;
    const far = (max - start) / velocity;
    enter = Math.max(enter, Math.min(near, far));
    exit = Math.min(exit, Math.max(near, far));
    if (enter > exit) return false;
  }
  return true;
}
