// ============================================================
// Constants — all game-wide magic numbers live here
// ============================================================
export const INTERNAL_W = 640;
export const INTERNAL_H = 360;
export const TILE_SIZE = 16;
export const PIXEL_SCALE = 2; // nearest-neighbor upscale factor

// Player defaults
export const PLAYER_BASE_HP = 100;
export const PLAYER_BASE_DMG = 12;
export const PLAYER_ATTACK_CD = 0.55; // seconds
export const PLAYER_CRIT_CHANCE = 0.05;
export const PLAYER_CRIT_MULT = 1.5;
export const PLAYER_SPEED = 90; // px/s at internal res
export const PLAYER_DASH_CD = 2.0;
export const PLAYER_DASH_DURATION = 0.18;
export const PLAYER_DASH_SPEED = 300;
export const PLAYER_IFRAME = 0.45;
export const PLAYER_HIT_KNOCKBACK = 40;

// XP
export const XP_BASE = 12;
export const XP_PER_LEVEL = 4;
export const LEVEL_CAP = 30;
export const HP_PER_LEVEL = 2;
export const HEAL_PER_LEVEL = 2;

// Enemy XP values
export const XP_NORMAL = 2;
export const XP_HEAVY = 4;
export const XP_ELITE = 12;
export const XP_BOSS = 30;
export const XP_OBJECTIVE = 8;

// Curse clock scaling
export const CURSE_HP_STAGE = 0.08;
export const CURSE_HP_TIME = 0.012;
export const CURSE_DMG_STAGE = 0.045;
export const CURSE_DMG_TIME = 0.006;
export const CURSE_SPAWN_TIME = 0.04;
export const CURSE_SPAWN_CAP = 1.7;

// Economy
export const GOLD_PER_STAGE_NORMAL = 25;
export const GOLD_PER_STAGE_BOSS = 60;
export const HEAL_COST = 40;
export const UPGRADE_COST = 70;
export const REROLL_COST = 20;
export const ASH_PER_STAGE = 1;
export const ASH_PER_BOSS = 5;
export const ASH_WIN_BONUS = 10;

// Arena
export const ARENA_W = 640;
export const ARENA_H = 360;
export const SPAWN_SAFE_RADIUS = 60;
export const SPAWN_WARN_TIME = 0.7;
export const MAX_ENEMIES = 80;
export const MAX_PROJECTILES = 150;

// Chapter/stage structure
export const STAGES_PER_CHAPTER = 4; // 3 normal + 1 boss
export const TOTAL_CHAPTERS = 3;
export const TOTAL_STAGES = STAGES_PER_CHAPTER * TOTAL_CHAPTERS; // 12

// Colors
export const COLOR_HP_BAR = '#e03030';
export const COLOR_HP_BG = '#401010';
export const COLOR_XP_BAR = '#40c0ff';
export const COLOR_XP_BG = '#102040';
export const COLOR_GOLD = '#ffd700';
export const COLOR_CURSE = '#a040c0';
export const COLOR_HEAL = '#40e070';
export const COLOR_CRIT = '#ffcc00';
export const COLOR_DAMAGE = '#ff4444';
export const COLOR_UI_BG = 'rgba(10,10,20,0.85)';
export const COLOR_UI_BORDER = 'rgba(255,200,100,0.3)';
export const COLOR_TEXT = '#e8d8c8';
export const COLOR_TEXT_DIM = '#8a7a6a';
