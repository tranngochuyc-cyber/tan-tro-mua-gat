// ============================================================
// SaveManager — localStorage persistence with migration
// ============================================================
const SAVE_KEY = 'ashen_harvest_save';
const SAVE_VERSION = 2;

export class SaveManager {
  constructor() {
    this.available = this._checkStorage();
  }

  _checkStorage() {
    try {
      localStorage.setItem('__test__', '1');
      localStorage.removeItem('__test__');
      return true;
    } catch {
      console.warn('[Save] localStorage not available');
      return false;
    }
  }

  /** Get the default meta-progression state */
  getDefaultMeta() {
    return {
      version: SAVE_VERSION,
      ashSeeds: 0,
      unlocks: {
        artifacts: ['fire_staff'], // start with fire staff unlocked
        bagSlot: false,            // extra reroll
        vigor1: false,             // +5 HP
        vigor2: false,             // +10 HP
        magnet1: false,            // +10% pickup
        magnet2: false,            // +20% pickup
        bossLog: [],               // boss IDs defeated
      },
      settings: {
        musicVolume: 0,
        sfxVolume: 0,
        autoAttack: false,
        showDamageNumbers: true,
        screenShake: true,
        reducedFlash: false,
      },
      stats: {
        totalRuns: 0,
        totalKills: 0,
        bestStage: 0,   // highest stageIndex completed (0-based)
        totalDeaths: 0,
        wins: 0,
      },
      checkpoint: null, // in-run checkpoint
      seenTutorial: false,
    };
  }

  /** Migrate old save data to current version */
  _migrate(data) {
    if (!data || typeof data !== 'object') return this.getDefaultMeta();

    const defaults = this.getDefaultMeta();

    // Ensure all top-level keys exist
    data.unlocks = data.unlocks || {};
    data.settings = data.settings || {};
    data.stats = data.stats || {};

    // Migrate from v1 to v2
    if (!data.version || data.version < 2) {
      // Remove curseLevel (was placeholder data)
      delete data.unlocks.curseLevel;

      // Ensure artifacts array exists
      if (!Array.isArray(data.unlocks.artifacts)) {
        data.unlocks.artifacts = ['fire_staff'];
      }

      // Ensure bossLog array exists
      if (!Array.isArray(data.unlocks.bossLog)) {
        data.unlocks.bossLog = [];
      }

      // Add new settings
      if (data.settings.reducedFlash === undefined) {
        data.settings.reducedFlash = false;
      }
    }

    // Fill missing keys from defaults
    for (const key of Object.keys(defaults.unlocks)) {
      if (data.unlocks[key] === undefined) data.unlocks[key] = defaults.unlocks[key];
    }
    for (const key of Object.keys(defaults.settings)) {
      if (data.settings[key] === undefined) data.settings[key] = defaults.settings[key];
    }
    for (const key of Object.keys(defaults.stats)) {
      if (data.stats[key] === undefined) data.stats[key] = defaults.stats[key];
    }
    if (data.ashSeeds === undefined) data.ashSeeds = 0;
    if (data.seenTutorial === undefined) data.seenTutorial = false;

    data.version = SAVE_VERSION;
    return data;
  }

  /** Load saved data or return defaults */
  load() {
    if (!this.available) return this.getDefaultMeta();
    try {
      const raw = localStorage.getItem(SAVE_KEY);
      if (!raw) return this.getDefaultMeta();
      const data = JSON.parse(raw);
      // Always migrate — never wipe save on version bump
      return this._migrate(data);
    } catch {
      console.warn('[Save] Corrupted save, resetting');
      return this.getDefaultMeta();
    }
  }

  /** Save meta-progression data */
  save(data) {
    if (!this.available) return false;
    try {
      data.version = SAVE_VERSION;
      localStorage.setItem(SAVE_KEY, JSON.stringify(data));
      return true;
    } catch {
      console.warn('[Save] Failed to save');
      return false;
    }
  }

  /** Save a run checkpoint */
  saveCheckpoint(meta, runState) {
    meta.checkpoint = runState;
    return this.save(meta);
  }

  /** Clear the run checkpoint (on death or win) */
  clearCheckpoint(meta) {
    meta.checkpoint = null;
    return this.save(meta);
  }

  /** Check if a run checkpoint currently exists */
  hasCheckpoint() {
    if (!this.available) return false;
    try {
      const raw = localStorage.getItem(SAVE_KEY);
      if (!raw) return false;
      const data = JSON.parse(raw);
      return !!data.checkpoint;
    } catch {
      return false;
    }
  }

  /** Delete all save data */
  reset() {
    if (this.available) {
      localStorage.removeItem(SAVE_KEY);
    }
    return this.getDefaultMeta();
  }
}
