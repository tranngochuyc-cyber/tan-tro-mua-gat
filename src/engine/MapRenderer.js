// ============================================================
// MapRenderer — draw tilemap backgrounds and obstacles
// Ashen cataclysm art direction: scorched earth, charcoal/purple-gray ground,
// withered crops, broken fences, runic cursed stones.
// Pre-renders map to an offscreen canvas for blazing 60 FPS performance.
// ============================================================
import { TILE_SIZE } from './Constants.js';

// Arena template definitions
const ARENA_TEMPLATES = {
  fields_1: { // Open field with scattered fences & maple trees
    w: 40, h: 23, // tiles
    obstacles: [ // {x,y,w,h} in tile coords
      {x:5,y:4,w:2,h:1}, {x:15,y:8,w:1,h:3}, {x:30,y:5,w:2,h:1},
      {x:8,y:15,w:3,h:1}, {x:25,y:12,w:1,h:2}, {x:35,y:17,w:2,h:1},
      {x:12,y:5,w:1,h:1}, {x:22,y:16,w:1,h:1}, // maple trees
    ],
    // Spawn zones positioned away from Top-Left (Status) and Top-Right (Objective) HUD
    spawnZones: [{x:17,y:6,w:6,h:5},{x:3,y:13,w:5,h:5},{x:32,y:13,w:5,h:5}],
    playerStart: {x:20,y:11},
    gate: {x:38,y:11},
    sealPositions: [{x:10,y:6},{x:30,y:16}],
    holdZones: [{x:8,y:5,w:8,h:8},{x:24,y:10,w:8,h:8}],
    cropPlots: [{x:4,y:17,w:4,h:2},{x:28,y:4,w:4,h:2}],
  },
  fields_2: {
    w: 40, h: 23,
    obstacles: [
      {x:10,y:5,w:1,h:4}, {x:20,y:4,w:3,h:1}, {x:28,y:10,w:1,h:5},
      {x:5,y:17,w:4,h:1}, {x:33,y:8,w:1,h:3}, {x:18,y:16,w:2,h:1},
      {x:6,y:5,w:1,h:1}, {x:24,y:16,w:1,h:1},
    ],
    spawnZones: [{x:17,y:6,w:6,h:5},{x:3,y:13,w:5,h:5},{x:32,y:13,w:5,h:5}],
    playerStart: {x:20,y:11},
    gate: {x:38,y:11},
    sealPositions: [{x:8,y:8},{x:32,y:15},{x:20,y:6}],
    holdZones: [{x:5,y:5,w:8,h:8},{x:27,y:12,w:8,h:8}],
    cropPlots: [{x:12,y:4,w:5,h:2},{x:30,y:17,w:4,h:2}],
  },
  farm_1: {
    w: 40, h: 23,
    obstacles: [
      {x:4,y:4,w:4,h:3}, // ruined farmhouse
      {x:15,y:6,w:1,h:6}, // wooden fence line
      {x:26,y:4,w:4,h:3}, // burnt barn
      {x:8,y:16,w:6,h:1}, // fence pen
      {x:30,y:14,w:1,h:4}, // fence line
      {x:12,y:4,w:1,h:1}, // maple tree
      {x:22,y:4,w:1,h:1}, // maple tree
      {x:18,y:16,w:1,h:1}, // maple tree
    ],
    spawnZones: [{x:17,y:6,w:6,h:5},{x:3,y:13,w:5,h:5},{x:32,y:13,w:5,h:5}],
    playerStart: {x:20,y:11},
    gate: {x:38,y:11},
    sealPositions: [{x:10,y:6},{x:30,y:17}],
    holdZones: [{x:5,y:8,w:8,h:8},{x:27,y:8,w:8,h:8}],
    cropPlots: [{x:9,y:11,w:5,h:2},{x:21,y:16,w:5,h:2}],
  },
  farm_2: {
    w: 40, h: 23,
    obstacles: [
      {x:6,y:4,w:4,h:3}, // farmhouse
      {x:20,y:5,w:1,h:7}, // fence line
      {x:28,y:4,w:4,h:3}, // granary
      {x:12,y:17,w:5,h:1}, // pen fence
      {x:5,y:11,w:1,h:4}, // fence
      {x:14,y:4,w:1,h:1}, // maple tree
      {x:24,y:15,w:1,h:1}, // maple tree
      {x:35,y:15,w:1,h:1}, // maple tree
    ],
    spawnZones: [{x:17,y:6,w:6,h:5},{x:3,y:13,w:5,h:5},{x:32,y:13,w:5,h:5}],
    playerStart: {x:20,y:11},
    gate: {x:38,y:11},
    sealPositions: [{x:12,y:8},{x:30,y:11},{x:7,y:17}],
    holdZones: [{x:7,y:5,w:8,h:8},{x:26,y:12,w:8,h:8}],
    cropPlots: [{x:15,y:14,w:5,h:2},{x:5,y:5,w:3,h:2}],
  },
  garden_1: {
    w: 40, h: 23,
    obstacles: [
      {x:6,y:5,w:1,h:1}, {x:12,y:5,w:1,h:1}, {x:18,y:6,w:1,h:1}, // cursed twilight trees
      {x:26,y:5,w:1,h:1}, {x:34,y:7,w:1,h:1},
      {x:8,y:14,w:1,h:1}, {x:22,y:17,w:1,h:1}, {x:30,y:15,w:1,h:1},
      {x:15,y:10,w:3,h:1}, // necrotic root barrier
    ],
    spawnZones: [{x:17,y:6,w:6,h:5},{x:3,y:13,w:5,h:5},{x:32,y:13,w:5,h:5}],
    playerStart: {x:20,y:11},
    gate: {x:38,y:11},
    sealPositions: [{x:8,y:7},{x:30,y:8},{x:18,y:17}],
    holdZones: [{x:5,y:5,w:8,h:8},{x:27,y:12,w:8,h:8}],
    cropPlots: [],
  },
  garden_2: {
    w: 40, h: 23,
    obstacles: [
      {x:5,y:5,w:1,h:1}, {x:11,y:6,w:1,h:1}, {x:24,y:5,w:1,h:1},
      {x:35,y:6,w:1,h:1}, {x:7,y:16,w:1,h:1}, {x:28,y:17,w:1,h:1},
      {x:16,y:8,w:5,h:1}, {x:20,y:14,w:1,h:4},
    ],
    spawnZones: [{x:17,y:6,w:6,h:5},{x:3,y:13,w:5,h:5},{x:32,y:13,w:5,h:5}],
    playerStart: {x:20,y:11},
    gate: {x:38,y:11},
    sealPositions: [{x:7,y:8},{x:26,y:7},{x:14,y:16}],
    holdZones: [{x:8,y:5,w:8,h:8},{x:24,y:12,w:8,h:8}],
    cropPlots: [],
  },
  // Boss arenas — more open for dynamic combat
  boss_1: {
    w: 40, h: 23,
    obstacles: [
      {x:4,y:4,w:1,h:1}, {x:35,y:4,w:1,h:1},
      {x:4,y:18,w:1,h:1}, {x:35,y:18,w:1,h:1},
      {x:20,y:3,w:1,h:1}, {x:20,y:19,w:1,h:1},
    ],
    spawnZones: [{x:30,y:8,w:8,h:8}],
    playerStart: {x:6,y:11},
    gate: {x:38,y:11},
    sealPositions: [],
    holdZones: [],
    cropPlots: [],
  },
  boss_2: {
    w: 40, h: 23,
    obstacles: [
      {x:12,y:6,w:1,h:1}, {x:28,y:6,w:1,h:1},
      {x:12,y:16,w:1,h:1}, {x:28,y:16,w:1,h:1},
    ],
    spawnZones: [{x:30,y:8,w:8,h:8}],
    playerStart: {x:6,y:11},
    gate: {x:38,y:11},
    sealPositions: [],
    holdZones: [],
    cropPlots: [],
  },
  boss_3: {
    w: 40, h: 23,
    obstacles: [
      {x:8,y:5,w:1,h:1}, {x:32,y:5,w:1,h:1},
      {x:8,y:17,w:1,h:1}, {x:32,y:17,w:1,h:1},
      {x:20,y:6,w:1,h:1}, {x:20,y:16,w:1,h:1},
    ],
    spawnZones: [{x:30,y:8,w:8,h:8}],
    playerStart: {x:6,y:11},
    gate: {x:38,y:11},
    sealPositions: [],
    holdZones: [],
    cropPlots: [],
  },
  empty: {
    w: 40, h: 23, obstacles: [],
    spawnZones: [{x:2,y:2,w:36,h:19}],
    playerStart: {x:20,y:11},
    gate: {x:38,y:11},
    sealPositions: [],
    holdZones: [],
    cropPlots: [],
  },
};

const TEMPLATE_POOLS = {
  fields: ['fields_1', 'fields_2'],
  farm: ['farm_1', 'farm_2'],
  garden: ['garden_1', 'garden_2'],
  boss: ['boss_1', 'boss_2', 'boss_3'],
};

export class MapRenderer {
  constructor(assets) {
    this.assets = assets;
    this.currentTemplate = null;
    this.collisionMap = []; // 2D boolean array
    this.tilesetImg = null;
    this.houseImg = null;
    this.treeImg = null;
    this.cropsImg = null;
    this.decorations = []; // pre-computed decoration positions
    this.pathMap = []; // 2D boolean array for dirt roads
    this.burntMap = []; // 2D number array for scorched heat/ash
    this.cropMap = []; // 2D boolean array for crop furrows
    this.cachedMapCanvas = null;
  }

  /** Pick a template and set up the arena */
  setupArena(background, stageType, seed = 0) {
    const pool = stageType === 'boss'
      ? TEMPLATE_POOLS.boss
      : (TEMPLATE_POOLS[background] || TEMPLATE_POOLS.fields);

    const idx = Math.abs(seed) % pool.length;
    const templateKey = pool[idx];
    const template = ARENA_TEMPLATES[templateKey] || ARENA_TEMPLATES.empty;
    this.currentTemplate = { ...template };

    // Cache image assets
    this.tilesetImg = this.assets?.getImage ? this.assets.getImage('tileset_spring') : null;
    this.houseImg = this.assets?.getImage ? this.assets.getImage('house') : null;
    this.treeImg = this.assets?.getImage ? this.assets.getImage('maple_tree') : null;
    this.cropsImg = this.assets?.getImage ? this.assets.getImage('crops') : null;

    // Build collision map
    this.collisionMap = [];
    this.pathMap = [];
    this.burntMap = [];
    this.cropMap = [];

    for (let y = 0; y < template.h; y++) {
      this.collisionMap[y] = [];
      this.pathMap[y] = [];
      this.burntMap[y] = [];
      this.cropMap[y] = [];
      for (let x = 0; x < template.w; x++) {
        this.collisionMap[y][x] = false;
        this.pathMap[y][x] = false;
        this.burntMap[y][x] = 0;
        this.cropMap[y][x] = false;
      }
    }

    // Mark obstacles
    for (const obs of template.obstacles) {
      for (let oy = 0; oy < obs.h; oy++) {
        for (let ox = 0; ox < obs.w; ox++) {
          const ty = obs.y + oy;
          const tx = obs.x + ox;
          if (ty >= 0 && ty < template.h && tx >= 0 && tx < template.w) {
            this.collisionMap[ty][tx] = true;
          }
        }
      }
    }

    // Edges are walls
    for (let x = 0; x < template.w; x++) {
      this.collisionMap[0][x] = true;
      this.collisionMap[template.h - 1][x] = true;
    }
    for (let y = 0; y < template.h; y++) {
      this.collisionMap[y][0] = true;
      this.collisionMap[y][template.w - 1] = true;
    }

    // Generate road / dirt path network
    this._generatePaths(template);

    // Generate scorched / burnt cataclysm zones
    this._generateBurntZones(template, background, seed);

    // Generate structured crop furrows
    this._generateCropPlots(template);

    // Generate atmospheric decorations
    this._generateDecorations(background, seed);

    // Pre-render static background to offscreen canvas for 60 FPS performance
    if (typeof document !== 'undefined' && document.createElement) {
      try {
        const offCanvas = document.createElement('canvas');
        offCanvas.width = template.w * TILE_SIZE;
        offCanvas.height = template.h * TILE_SIZE;
        const offCtx = offCanvas.getContext('2d');
        if (offCtx) {
          offCtx.imageSmoothingEnabled = false;
          this._renderFullMapToContext(offCtx, background);
          this.cachedMapCanvas = offCanvas;
        }
      } catch (e) {
        this.cachedMapCanvas = null;
      }
    } else {
      this.cachedMapCanvas = null;
    }

    return template;
  }

  /** Carve dirt road network connecting player start, gate, seals, and hold zones */
  _generatePaths(template) {
    const pStart = template.playerStart || { x: 20, y: 11 };
    const pGate = template.gate || { x: 38, y: 11 };

    // Main road from west to east
    this._carvePath(2, pStart.y, pGate.x - 1, pGate.y);

    // Branches to seals
    if (template.sealPositions) {
      for (const seal of template.sealPositions) {
        this._carvePath(pStart.x, pStart.y, seal.x, seal.y);
      }
    }

    // Branches to hold zones
    if (template.holdZones) {
      for (const zone of template.holdZones) {
        const zcx = Math.floor(zone.x + zone.w / 2);
        const zcy = Math.floor(zone.y + zone.h / 2);
        this._carvePath(pStart.x, pStart.y, zcx, zcy);
      }
    }
  }

  _carvePath(x1, y1, x2, y2) {
    let curX = x1;
    let curY = y1;
    const t = this.currentTemplate;

    while (curX !== x2 || curY !== y2) {
      if (curX >= 1 && curX < t.w - 1 && curY >= 1 && curY < t.h - 1) {
        if (!this.collisionMap[curY][curX]) {
          this.pathMap[curY][curX] = true;
        }
      }
      if (Math.random() < 0.6 && curX !== x2) {
        curX += curX < x2 ? 1 : -1;
      } else if (curY !== y2) {
        curY += curY < y2 ? 1 : -1;
      } else if (curX !== x2) {
        curX += curX < x2 ? 1 : -1;
      }
    }
    if (curX >= 1 && curX < t.w - 1 && curY >= 1 && curY < t.h - 1) {
      if (!this.collisionMap[curY][curX]) this.pathMap[curY][curX] = true;
    }
  }

  /** Generate scorched earth patches with charcoal fissures */
  _generateBurntZones(template, bg, seed) {
    const rng = this._seedRng((seed * 31) ^ 777);
    const count = bg === 'farm' ? 4 : (bg === 'garden' ? 2 : 3);

    for (let i = 0; i < count; i++) {
      const cx = 5 + Math.floor(rng() * (template.w - 10));
      const cy = 4 + Math.floor(rng() * (template.h - 8));
      const radius = 2 + Math.floor(rng() * 2);

      for (let dy = -radius; dy <= radius; dy++) {
        for (let dx = -radius; dx <= radius; dx++) {
          const tx = cx + dx;
          const ty = cy + dy;
          const distSq = dx * dx + dy * dy;
          if (tx >= 1 && tx < template.w - 1 && ty >= 1 && ty < template.h - 1) {
            if (distSq <= radius * radius) {
              const intensity = 1.0 - (distSq / (radius * radius + 1));
              this.burntMap[ty][tx] = Math.max(this.burntMap[ty][tx], intensity);
            }
          }
        }
      }
    }
  }

  /** Mark structured crop plots in fields and farm */
  _generateCropPlots(template) {
    if (!template.cropPlots) return;
    for (const plot of template.cropPlots) {
      for (let py = 0; py < plot.h; py++) {
        for (let px = 0; px < plot.w; px++) {
          const tx = plot.x + px;
          const ty = plot.y + py;
          if (tx >= 1 && tx < template.w - 1 && ty >= 1 && ty < template.h - 1) {
            if (!this.collisionMap[ty][tx] && !this.pathMap[ty][tx]) {
              this.cropMap[ty][tx] = true;
            }
          }
        }
      }
    }
  }

  _generateDecorations(bg, seed) {
    this.decorations = [];
    const rng = this._seedRng(seed);
    const t = this.currentTemplate;
    const decorCount = 40 + Math.floor(rng() * 16);

    const typePools = {
      fields: ['crop', 'grass', 'fence_h', 'fence_v', 'hay', 'stone', 'ash_pile'],
      farm: ['crop', 'grass', 'fence_h', 'fence_v', 'hay', 'broken_pot', 'stone', 'ash_pile'],
      garden: ['flower', 'grass', 'rune_mark', 'stone', 'tombstone', 'crystal', 'root'],
    };
    const pool = typePools[bg] || typePools.fields;

    for (let i = 0; i < decorCount; i++) {
      const tx = 2 + Math.floor(rng() * (t.w - 4));
      const ty = 2 + Math.floor(rng() * (t.h - 4));
      if (!this.collisionMap[ty][tx] && !this.pathMap[ty][tx] && !this.cropMap[ty][tx]) {
        const type = pool[Math.floor(rng() * pool.length)];
        this.decorations.push({ x: tx * TILE_SIZE, y: ty * TILE_SIZE, type, variant: Math.floor(rng() * 3) });
      }
    }
  }

  _seedRng(seed) {
    let s = seed || 12345;
    return () => {
      s = (s * 1103515245 + 12345) & 0x7fffffff;
      return s / 0x7fffffff;
    };
  }

  getArenaPixelSize() {
    if (!this.currentTemplate) return { w: 640, h: 368 };
    return {
      w: this.currentTemplate.w * TILE_SIZE,
      h: this.currentTemplate.h * TILE_SIZE,
    };
  }

  getPlayerStart() {
    if (!this.currentTemplate) return { x: 320, y: 180 };
    return {
      x: this.currentTemplate.playerStart.x * TILE_SIZE + TILE_SIZE / 2,
      y: this.currentTemplate.playerStart.y * TILE_SIZE + TILE_SIZE / 2,
    };
  }

  getGatePosition() {
    if (!this.currentTemplate) return { x: 600, y: 180 };
    return {
      x: this.currentTemplate.gate.x * TILE_SIZE + TILE_SIZE / 2,
      y: this.currentTemplate.gate.y * TILE_SIZE + TILE_SIZE / 2,
    };
  }

  getSpawnZones() {
    if (!this.currentTemplate) return [{ x: 400, y: 100, w: 200, h: 200 }];
    return this.currentTemplate.spawnZones.map(z => ({
      x: z.x * TILE_SIZE, y: z.y * TILE_SIZE,
      w: z.w * TILE_SIZE, h: z.h * TILE_SIZE,
    }));
  }

  getSealPositions() {
    if (!this.currentTemplate) return [];
    return this.currentTemplate.sealPositions.map(p => ({
      x: p.x * TILE_SIZE + TILE_SIZE / 2,
      y: p.y * TILE_SIZE + TILE_SIZE / 2,
    }));
  }

  getHoldZones() {
    if (!this.currentTemplate) return [];
    return this.currentTemplate.holdZones.map(z => ({
      x: z.x * TILE_SIZE, y: z.y * TILE_SIZE,
      w: z.w * TILE_SIZE, h: z.h * TILE_SIZE,
    }));
  }

  /** Check collision with obstacles at world pixel position */
  isBlocked(px, py) {
    const tx = Math.floor(px / TILE_SIZE);
    const ty = Math.floor(py / TILE_SIZE);
    if (!this.currentTemplate) return false;
    if (tx < 0 || tx >= this.currentTemplate.w || ty < 0 || ty >= this.currentTemplate.h) return true;
    return this.collisionMap[ty][tx];
  }

  /** Check if a rect collides with obstacles */
  isRectBlocked(x, y, w, h) {
    return this.isBlocked(x, y) || this.isBlocked(x + w, y) ||
           this.isBlocked(x, y + h) || this.isBlocked(x + w, y + h) ||
           this.isBlocked(x + w / 2, y + h / 2);
  }

  /** Internal helper to render the full map with high-fidelity scenery */
  _renderFullMapToContext(ctx, background) {
    const t = this.currentTemplate;

    // 1. Draw ground tiles (dirt paths, scorched earth, crop furrows, and base terrain)
    for (let y = 0; y < t.h; y++) {
      for (let x = 0; x < t.w; x++) {
        const px = x * TILE_SIZE;
        const py = y * TILE_SIZE;

        if (y === 0 || y === t.h - 1 || x === 0 || x === t.w - 1) {
          this._drawWallTile(ctx, px, py, x, y, background);
        } else if (this.collisionMap[y][x]) {
          // Obstacle ground footprint (shadow base)
          this._drawGroundTile(ctx, px, py, x, y, background);
        } else {
          this._drawGroundTile(ctx, px, py, x, y, background);
        }
      }
    }

    // 2. Draw ceremonial seal & hold zone circles on ground before obstacles/decorations
    this._drawCeremonialZones(ctx, background);

    // 3. Draw structured crop beds
    this._drawCropBeds(ctx, background);

    // 4. Draw decorations (withered weeds, stones, ash piles, cracked pots)
    for (const d of this.decorations) {
      this._drawDecoration(ctx, d, background);
    }

    // 5. Draw prominent obstacle structures (Houses, Maple Trees, Wooden Fence lines)
    this._drawObstacleStructures(ctx, background);
  }

  /** Draw the map background and obstacles */
  draw(ctx, background = 'fields') {
    if (!this.currentTemplate) return;

    if (this.cachedMapCanvas) {
      // High-performance single drawcall
      ctx.drawImage(this.cachedMapCanvas, 0, 0);
      return;
    }

    // Direct fallback
    this._renderFullMapToContext(ctx, background);
  }

  _drawGroundTile(ctx, px, py, x, y, background) {
    const isPath = this.pathMap[y] && this.pathMap[y][x];
    const burnt = this.burntMap[y] ? this.burntMap[y][x] : 0;
    const isCrop = this.cropMap[y] && this.cropMap[y][x];

    // Rich, cohesive, low-contrast terrain palettes (loại bỏ tương phản caro bàn cờ)
    let baseColor = '#2d2b22';   // Meadow loam
    if (background === 'farm') {
      baseColor = '#32251e';     // Rich farm soil
    } else if (background === 'garden') {
      baseColor = '#2b2334';     // Ancient slate loam
    }

    // Ground base fill (đồng nhất, êm mắt, giữ nền trầm để nhân vật và chiêu thức nổi bật)
    ctx.fillStyle = baseColor;
    ctx.fillRect(px, py, TILE_SIZE, TILE_SIZE);

    // Subtle macro organic variation (không nhảy độ sáng theo từng ô vuông riêng lẻ)
    const macroX = Math.floor(x / 4);
    const macroY = Math.floor(y / 4);
    if ((macroX + macroY) % 2 === 0) {
      ctx.fillStyle = 'rgba(255, 255, 255, 0.025)';
      ctx.fillRect(px, py, TILE_SIZE, TILE_SIZE);
    }

    // Central village courtyard landmark (Sân làng lát đá cổ trung tâm)
    const inCourtyard = (x >= 15 && x <= 25 && y >= 8 && y <= 14);
    if (inCourtyard && !isPath && !isCrop) {
      ctx.fillStyle = background === 'garden' ? '#352d42' : (background === 'farm' ? '#3c2f27' : '#37342b');
      ctx.fillRect(px + 1, py + 1, TILE_SIZE - 2, TILE_SIZE - 2);
      // Mortar seam line
      ctx.fillStyle = 'rgba(0, 0, 0, 0.25)';
      ctx.fillRect(px, py + TILE_SIZE - 1, TILE_SIZE, 1);
      ctx.fillRect(px + TILE_SIZE - 1, py, 1, TILE_SIZE);
    }

    // Ground fill: Dirt roads & paths with soft edge blending
    if (isPath) {
      // Natural trodden dirt farm road
      ctx.fillStyle = background === 'garden' ? '#443a54' : (background === 'farm' ? '#524032' : '#4d4539');
      ctx.fillRect(px, py, TILE_SIZE, TILE_SIZE);

      // Cart wheel ruts & gravel tracks
      ctx.fillStyle = 'rgba(0, 0, 0, 0.16)';
      ctx.fillRect(px, py + 4, TILE_SIZE, 1);
      ctx.fillRect(px, py + 11, TILE_SIZE, 1);

      // Soft edge blending with adjacent non-path earth
      const topNonPath = y > 0 && !this.pathMap[y - 1]?.[x];
      const botNonPath = y < this.currentTemplate.h - 1 && !this.pathMap[y + 1]?.[x];
      const leftNonPath = x > 0 && !this.pathMap[y]?.[x - 1];
      const rightNonPath = x < this.currentTemplate.w - 1 && !this.pathMap[y]?.[x + 1];

      ctx.fillStyle = baseColor;
      if (topNonPath) {
        ctx.fillRect(px + 2, py, 3, 1);
        ctx.fillRect(px + 9, py, 4, 1);
      }
      if (botNonPath) {
        ctx.fillRect(px + 4, py + TILE_SIZE - 1, 4, 1);
        ctx.fillRect(px + 11, py + TILE_SIZE - 1, 3, 1);
      }
      if (leftNonPath) {
        ctx.fillRect(px, py + 3, 1, 4);
        ctx.fillRect(px, py + 10, 1, 3);
      }
      if (rightNonPath) {
        ctx.fillRect(px + TILE_SIZE - 1, py + 2, 1, 3);
        ctx.fillRect(px + TILE_SIZE - 1, py + 9, 1, 4);
      }
    } else if (isCrop) {
      // Agricultural furrow base (luống cày bỏ hoang sau vụ mùa)
      ctx.fillStyle = background === 'farm' ? '#2c1e16' : '#261f1c';
      ctx.fillRect(px, py, TILE_SIZE, TILE_SIZE);
      ctx.fillStyle = '#170f0a';
      ctx.fillRect(px, py + 3, TILE_SIZE, 2);
      ctx.fillRect(px, py + 10, TILE_SIZE, 2);
    }

    // Scorched cataclysm overlay (giữ độ mờ thấp để quái và đòn đánh luôn nổi bật)
    if (burnt > 0.25) {
      ctx.fillStyle = `rgba(14, 10, 12, ${Math.min(0.25, burnt * 0.28)})`;
      ctx.fillRect(px, py, TILE_SIZE, TILE_SIZE);

      if (burnt > 0.55 && (x + y) % 6 === 0) {
        // Subtle ember fissure
        ctx.fillStyle = background === 'garden' ? 'rgba(168, 85, 247, 0.25)' : 'rgba(249, 115, 22, 0.25)';
        ctx.fillRect(px + 5, py + 7, 3, 1);
      }
    }
  }

  _drawWallTile(ctx, px, py, x, y, background) {
    const isTop = y === 0;

    // Dark weathered palisade / perimeter stone wall
    const stoneBase = background === 'garden' ? '#251f30' : (background === 'farm' ? '#2c2220' : '#28242e');
    const stoneHighlight = background === 'garden' ? '#3e344e' : (background === 'farm' ? '#443431' : '#3f3948');
    const stoneShadow = background === 'garden' ? '#14101a' : (background === 'farm' ? '#181211' : '#151218');

    ctx.fillStyle = stoneBase;
    ctx.fillRect(px, py, TILE_SIZE, TILE_SIZE);

    // Bevel edges
    ctx.fillStyle = stoneHighlight;
    ctx.fillRect(px, py, TILE_SIZE, 2);
    ctx.fillRect(px, py, 2, TILE_SIZE);

    ctx.fillStyle = stoneShadow;
    ctx.fillRect(px, py + TILE_SIZE - 2, TILE_SIZE, 2);
    ctx.fillRect(px + TILE_SIZE - 2, py, 2, TILE_SIZE);

    // Mortar groove in middle
    ctx.fillStyle = stoneShadow;
    ctx.fillRect(px, py + 8, TILE_SIZE, 1);
    if ((x + y) % 2 === 0) {
      ctx.fillRect(px + 8, py, 1, 8);
    } else {
      ctx.fillRect(px + 8, py + 8, 1, 8);
    }

    // Outer edge depth shadow
    if (isTop) {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
      ctx.fillRect(px, py + TILE_SIZE, TILE_SIZE, 3);
    }
  }

  /** Ceremonial zones are handled dynamically by CombatScene when active */
  _drawCeremonialZones(ctx, background) {
    // Keep terrain clean and organic without stray static circles baked into the ground.
  }

  /** Render structured agricultural crop patches (Luống cây) */
  _drawCropBeds(ctx, background) {
    const t = this.currentTemplate;
    if (!t || !t.cropPlots) return;

    for (const plot of t.cropPlots) {
      for (let py = 0; py < plot.h; py++) {
        for (let px = 0; px < plot.w; px++) {
          const tx = plot.x + px;
          const ty = plot.y + py;
          const dx = tx * TILE_SIZE;
          const dy = ty * TILE_SIZE;

          if (this.cropsImg && this.cropsImg.complete) {
            // Draw sprite from crops sheet
            const frameX = (px % 4) * 16;
            const frameY = (background === 'farm' ? 32 : 16);
            ctx.drawImage(this.cropsImg, frameX, frameY, 16, 16, dx, dy, 16, 16);
          } else {
            // High-detail pixel art fallback
            ctx.fillStyle = '#4a3826';
            ctx.fillRect(dx + 2, dy + 6, 12, 4);
            ctx.fillStyle = background === 'farm' ? '#5a4632' : '#6b5438';
            ctx.fillRect(dx + 4, dy + 2, 3, 8);
            ctx.fillRect(dx + 9, dy + 3, 3, 7);
          }
        }
      }
    }
  }

  /** Render obstacle structures: ruined farmhouse, maple trees, and wooden fences */
  _drawObstacleStructures(ctx, background) {
    const t = this.currentTemplate;
    if (!t || !t.obstacles) return;

    for (const obs of t.obstacles) {
      const px = obs.x * TILE_SIZE;
      const py = obs.y * TILE_SIZE;
      const pw = obs.w * TILE_SIZE;
      const ph = obs.h * TILE_SIZE;

      // 1. Drop shadow beneath the obstacle structure
      ctx.fillStyle = 'rgba(0, 0, 0, 0.45)';
      ctx.fillRect(px, py + ph, pw, 4);

      // Branch by obstacle geometry
      if (obs.w >= 3 && obs.h >= 2) {
        // Ruined Farmhouse / Barn Cottage (Nhà)
        this._drawHouseObstacle(ctx, px, py, pw, ph, background);
      } else if (obs.w === 1 && obs.h === 1) {
        // Maple Tree or Cursed Runic Monolith (Cây)
        this._drawTreeObstacle(ctx, px, py, background);
      } else if (obs.w > 1 && obs.h === 1) {
        // Horizontal Wooden Fence Line (Hàng rào ngang)
        this._drawFenceHorizontal(ctx, px, py, obs.w, background);
      } else if (obs.w === 1 && obs.h > 1) {
        // Vertical Wooden Fence Line (Hàng rào dọc)
        this._drawFenceVertical(ctx, px, py, obs.h, background);
      } else {
        // 2x2 or block obstacle: Runic Monument / Stone Granary
        this._drawBlockObstacle(ctx, px, py, pw, ph, background);
      }
    }
  }

  _drawHouseObstacle(ctx, px, py, pw, ph, background) {
    if (this.houseImg && this.houseImg.complete && this.houseImg.width > 0) {
      // Cottage from Farm RPG sheet has exact 80x80 frame bounds
      ctx.drawImage(this.houseImg, 0, 0, 80, 80, px - 4, py - 12, pw + 8, ph + 16);
      return;
    }

    // High quality procedural pixel-art ruined farmhouse
    const isFarm = background === 'farm';
    const roofColor = isFarm ? '#3a2522' : '#332d3d';
    const roofShingle = isFarm ? '#4a322e' : '#453d52';
    const wallColor = isFarm ? '#4a3b32' : '#3d3947';
    const timberColor = isFarm ? '#2e221b' : '#221e28';

    // Roof
    ctx.fillStyle = roofColor;
    ctx.fillRect(px, py, pw, ph * 0.45);
    ctx.fillStyle = roofShingle;
    for (let r = 0; r < ph * 0.4; r += 4) {
      ctx.fillRect(px, py + r, pw, 1);
    }

    // Walls
    ctx.fillStyle = wallColor;
    ctx.fillRect(px + 2, py + ph * 0.45, pw - 4, ph * 0.55);

    // Burnt timber frames & door
    ctx.fillStyle = timberColor;
    ctx.fillRect(px, py + ph * 0.45, 3, ph * 0.55);
    ctx.fillRect(px + pw - 3, py + ph * 0.45, 3, ph * 0.55);
    // Dark doorway
    ctx.fillStyle = '#140f12';
    ctx.fillRect(px + pw / 2 - 4, py + ph * 0.6, 8, ph * 0.4);
    // Stone chimney
    ctx.fillStyle = '#2b2730';
    ctx.fillRect(px + 4, py - 4, 6, 8);
  }

  _drawTreeObstacle(ctx, px, py, background) {
    if (this.treeImg && this.treeImg.complete && this.treeImg.width > 0) {
      // Maple tree sheet has 5 variations (32x48 each)
      const frameIdx = Math.abs((px + py * 7)) % 5;
      const sx = frameIdx * 32;
      // Draw centered on tile, foliage extends upwards
      ctx.drawImage(this.treeImg, sx, 0, 32, 48, px - 8, py - 30, 32, 48);
      return;
    }

    // High detail pixel maple tree fallback
    const isGarden = background === 'garden';
    const trunkColor = '#3a281c';
    const foliageColor = isGarden ? '#4c1d95' : (background === 'farm' ? '#7c2d12' : '#9a3412');
    const foliageHighlight = isGarden ? '#6d28d9' : (background === 'farm' ? '#9a3412' : '#c2410c');

    // Trunk
    ctx.fillStyle = trunkColor;
    ctx.fillRect(px + 6, py + 6, 4, 10);
    // Roots
    ctx.fillRect(px + 4, py + 14, 8, 2);

    // Foliage canopy
    ctx.fillStyle = foliageColor;
    ctx.fillRect(px + 1, py - 10, 14, 16);
    ctx.fillRect(px + 3, py - 14, 10, 22);

    ctx.fillStyle = foliageHighlight;
    ctx.fillRect(px + 3, py - 12, 6, 6);
    ctx.fillRect(px + 5, py - 6, 4, 4);
  }

  _drawFenceHorizontal(ctx, px, py, tileCount, background) {
    const isFarm = background === 'farm';
    const woodColor = isFarm ? '#3f2e22' : '#38323f';
    const railColor = isFarm ? '#4f3a2c' : '#484052';
    const postShadow = '#1a1410';

    const totalW = tileCount * TILE_SIZE;

    // Top & Bottom rails
    ctx.fillStyle = railColor;
    ctx.fillRect(px, py + 4, totalW, 2);
    ctx.fillRect(px, py + 10, totalW, 2);

    // Fence posts at every tile
    for (let i = 0; i <= tileCount; i++) {
      const postX = px + i * TILE_SIZE - (i === tileCount ? 3 : 0);
      ctx.fillStyle = woodColor;
      ctx.fillRect(postX, py + 1, 3, 14);
      // Nail heads
      ctx.fillStyle = postShadow;
      ctx.fillRect(postX + 1, py + 4, 1, 1);
      ctx.fillRect(postX + 1, py + 10, 1, 1);
    }
  }

  _drawFenceVertical(ctx, px, py, tileCount, background) {
    const isFarm = background === 'farm';
    const woodColor = isFarm ? '#3f2e22' : '#38323f';
    const railColor = isFarm ? '#4f3a2c' : '#484052';
    const postShadow = '#1a1410';

    const totalH = tileCount * TILE_SIZE;

    // Vertical rail
    ctx.fillStyle = woodColor;
    ctx.fillRect(px + 6, py, 4, totalH);

    // Cross-struts at each tile
    for (let i = 0; i < tileCount; i++) {
      const strutY = py + i * TILE_SIZE + 4;
      ctx.fillStyle = railColor;
      ctx.fillRect(px + 2, strutY, 12, 2);
      ctx.fillRect(px + 2, strutY + 6, 12, 2);
      ctx.fillStyle = postShadow;
      ctx.fillRect(px + 7, strutY, 2, 2);
    }
  }

  _drawBlockObstacle(ctx, px, py, pw, ph, background) {
    const isGarden = background === 'garden';
    const stoneBase = isGarden ? '#2d2538' : (background === 'farm' ? '#382b24' : '#332f3b');
    const stoneHighlight = isGarden ? '#493d59' : (background === 'farm' ? '#523f35' : '#4b4554');
    const shadowColor = '#15121a';

    ctx.fillStyle = stoneBase;
    ctx.fillRect(px, py, pw, ph);

    // Bevel highlights
    ctx.fillStyle = stoneHighlight;
    ctx.fillRect(px + 1, py + 1, pw - 2, 2);
    ctx.fillRect(px + 1, py + 1, 2, ph - 2);

    ctx.fillStyle = shadowColor;
    ctx.fillRect(px + 1, py + ph - 2, pw - 2, 2);
    ctx.fillRect(px + pw - 2, py + 1, 2, ph - 2);

    if (isGarden) {
      // Inscribed amethyst runes
      ctx.fillStyle = '#a855f7';
      ctx.fillRect(px + pw / 2 - 1, py + 4, 2, ph - 8);
      ctx.fillRect(px + 4, py + ph / 2 - 1, pw - 8, 2);
    } else {
      // Weathered cracks
      ctx.fillStyle = shadowColor;
      ctx.fillRect(px + 4, py + 6, 6, 2);
      ctx.fillRect(px + pw - 8, py + 10, 5, 2);
    }
  }

  _drawDecoration(ctx, dec, background) {
    // Note: NEVER use bright yellow/gold for decorations so they don't look like gold loot!
    switch (dec.type) {
      case 'crop': {
        // Withered, dried ashen harvest crop stalks
        ctx.fillStyle = '#3a2e22'; // parched soil furrow
        ctx.fillRect(dec.x + 2, dec.y + 11, 12, 3);
        ctx.fillStyle = '#574533'; // dried stalk
        ctx.fillRect(dec.x + 4, dec.y + 4, 2, 7);
        ctx.fillRect(dec.x + 9, dec.y + 3, 2, 8);
        ctx.fillStyle = '#7a6042'; // withered ear
        ctx.fillRect(dec.x + 4, dec.y + 2, 2, 3);
        ctx.fillRect(dec.x + 9, dec.y + 1, 2, 3);
        break;
      }
      case 'flower': {
        // Muted ashen lavender / shadow bell (distinct from gold loot!)
        ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
        ctx.fillRect(dec.x + 4, dec.y + 11, 7, 3);
        ctx.fillStyle = '#3f3844'; // dark stems
        ctx.fillRect(dec.x + 5, dec.y + 6, 2, 6);
        ctx.fillRect(dec.x + 9, dec.y + 7, 2, 5);
        // Muted violet petals (NOT gold!)
        const petalColor = background === 'garden' ? '#8b5cf6' : '#6b5575';
        ctx.fillStyle = petalColor;
        ctx.fillRect(dec.x + 4, dec.y + 4, 4, 4);
        ctx.fillRect(dec.x + 8, dec.y + 5, 4, 4);
        ctx.fillStyle = '#c4b5fd'; // pale center
        ctx.fillRect(dec.x + 5, dec.y + 5, 2, 2);
        break;
      }
      case 'grass': {
        // Scorched bramble / tufts of dead dark grass
        ctx.fillStyle = '#2f2c25';
        ctx.fillRect(dec.x + 3, dec.y + 6, 2, 8);
        ctx.fillRect(dec.x + 7, dec.y + 3, 2, 11);
        ctx.fillRect(dec.x + 11, dec.y + 5, 2, 9);
        ctx.fillStyle = '#484035'; // dried tips
        ctx.fillRect(dec.x + 3, dec.y + 6, 2, 2);
        ctx.fillRect(dec.x + 7, dec.y + 3, 2, 2);
        ctx.fillRect(dec.x + 11, dec.y + 5, 2, 2);
        break;
      }
      case 'fence_h': {
        // Broken horizontal fence
        ctx.fillStyle = '#3d2e1e';
        ctx.fillRect(dec.x + 1, dec.y + 5, 14, 2);
        ctx.fillRect(dec.x + 1, dec.y + 9, 10, 2);
        // Posts
        ctx.fillStyle = '#4d3e2e';
        ctx.fillRect(dec.x + 2, dec.y + 2, 2, 12);
        ctx.fillRect(dec.x + 10, dec.y + 3, 2, 10);
        // Broken end
        ctx.fillStyle = '#2a1f14';
        ctx.fillRect(dec.x + 12, dec.y + 9, 3, 1);
        break;
      }
      case 'fence_v': {
        // Broken vertical fence post
        ctx.fillStyle = '#4d3e2e';
        ctx.fillRect(dec.x + 6, dec.y + 1, 3, 14);
        ctx.fillStyle = '#3d2e1e';
        ctx.fillRect(dec.x + 3, dec.y + 4, 10, 2);
        ctx.fillRect(dec.x + 4, dec.y + 10, 8, 2);
        ctx.fillStyle = '#2a1f14';
        ctx.fillRect(dec.x + 6, dec.y + 13, 3, 2);
        break;
      }
      case 'hay': {
        // Hay bale / straw pile
        ctx.fillStyle = '#4a3b20';
        ctx.fillRect(dec.x + 2, dec.y + 6, 12, 8);
        ctx.fillStyle = '#5e4c2a';
        ctx.fillRect(dec.x + 3, dec.y + 4, 10, 3);
        ctx.fillStyle = '#3a2c18';
        ctx.fillRect(dec.x + 4, dec.y + 8, 2, 1);
        ctx.fillRect(dec.x + 9, dec.y + 10, 3, 1);
        // Straw wisps
        ctx.fillStyle = '#6e5a34';
        ctx.fillRect(dec.x + 1, dec.y + 5, 2, 1);
        ctx.fillRect(dec.x + 12, dec.y + 4, 3, 1);
        break;
      }
      case 'stone': {
        // Small stone / pebble
        ctx.fillStyle = '#3a3540';
        ctx.fillRect(dec.x + 5, dec.y + 9, 6, 4);
        ctx.fillStyle = '#4a4550';
        ctx.fillRect(dec.x + 6, dec.y + 8, 4, 2);
        ctx.fillStyle = '#2a252e';
        ctx.fillRect(dec.x + 6, dec.y + 12, 4, 1);
        break;
      }
      case 'ash_pile': {
        // Small ash pile with ember glow
        ctx.fillStyle = '#2a2428';
        ctx.fillRect(dec.x + 3, dec.y + 9, 10, 4);
        ctx.fillRect(dec.x + 5, dec.y + 7, 6, 3);
        // Ember glow
        ctx.fillStyle = 'rgba(234, 88, 12, 0.2)';
        ctx.fillRect(dec.x + 6, dec.y + 8, 3, 3);
        ctx.fillStyle = 'rgba(255, 120, 40, 0.12)';
        ctx.fillRect(dec.x + 7, dec.y + 9, 1, 1);
        break;
      }
      case 'rune_mark': {
        // Cursed rune carved into ground
        ctx.fillStyle = 'rgba(147, 51, 234, 0.15)';
        ctx.fillRect(dec.x + 3, dec.y + 3, 10, 10);
        ctx.fillStyle = 'rgba(168, 85, 247, 0.25)';
        ctx.fillRect(dec.x + 7, dec.y + 4, 2, 8);
        ctx.fillRect(dec.x + 4, dec.y + 7, 8, 2);
        ctx.fillStyle = 'rgba(192, 132, 252, 0.12)';
        ctx.fillRect(dec.x + 5, dec.y + 5, 1, 1);
        ctx.fillRect(dec.x + 10, dec.y + 10, 1, 1);
        break;
      }
      case 'broken_pot': {
        // Broken clay pot
        ctx.fillStyle = '#5a3a28';
        ctx.fillRect(dec.x + 5, dec.y + 6, 6, 6);
        ctx.fillRect(dec.x + 4, dec.y + 8, 8, 4);
        ctx.fillStyle = '#6e4a34';
        ctx.fillRect(dec.x + 5, dec.y + 6, 6, 2);
        // Broken shard
        ctx.fillStyle = '#4a2e1e';
        ctx.fillRect(dec.x + 2, dec.y + 10, 3, 2);
        ctx.fillRect(dec.x + 11, dec.y + 9, 2, 3);
        break;
      }
      case 'tombstone': {
        // Small tombstone
        ctx.fillStyle = '#3a3846';
        ctx.fillRect(dec.x + 5, dec.y + 3, 6, 10);
        ctx.fillStyle = '#4a485a';
        ctx.fillRect(dec.x + 6, dec.y + 2, 4, 2);
        ctx.fillStyle = '#2a2830';
        ctx.fillRect(dec.x + 5, dec.y + 12, 6, 2);
        // Cross mark
        ctx.fillStyle = '#5a586a';
        ctx.fillRect(dec.x + 7, dec.y + 4, 2, 4);
        ctx.fillRect(dec.x + 6, dec.y + 5, 4, 2);
        break;
      }
      case 'crystal': {
        // Cursed crystal shard
        ctx.fillStyle = '#5b3d8a';
        ctx.fillRect(dec.x + 6, dec.y + 3, 3, 8);
        ctx.fillStyle = '#7c5ab8';
        ctx.fillRect(dec.x + 7, dec.y + 2, 2, 4);
        ctx.fillStyle = '#9b7dcf';
        ctx.fillRect(dec.x + 7, dec.y + 3, 1, 2);
        // Glow
        ctx.fillStyle = 'rgba(139, 92, 246, 0.15)';
        ctx.fillRect(dec.x + 4, dec.y + 5, 8, 6);
        break;
      }
      case 'root': {
        // Exposed cursed root
        ctx.fillStyle = '#3a2840';
        ctx.fillRect(dec.x + 2, dec.y + 8, 12, 3);
        ctx.fillRect(dec.x + 1, dec.y + 10, 3, 4);
        ctx.fillRect(dec.x + 11, dec.y + 9, 4, 3);
        ctx.fillStyle = '#4a3854';
        ctx.fillRect(dec.x + 4, dec.y + 7, 6, 2);
        break;
      }
    }
  }
}
