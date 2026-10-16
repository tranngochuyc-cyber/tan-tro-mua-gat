// ============================================================
// AssetLoader — sprite sheets, icons, audio
// ============================================================
export class AssetLoader {
  constructor() {
    this.images = {};
    this.audio = {};
    this.totalAssets = 0;
    this.loadedAssets = 0;
    this.onProgress = null;
  }

  /** Register all game assets and return a promise that resolves when done. */
  async loadAll(onProgress) {
    this.onProgress = onProgress;

    // ---- IMAGES ----
    const imgs = {
      // Player sprite sheets
      'soldier_idle':   'assets/player/soldier_idle.png',
      'soldier_walk':   'assets/player/soldier_walk.png',
      'soldier_attack': 'assets/player/soldier_attack.png',
      'soldier_hurt':   'assets/player/soldier_hurt.png',
      'soldier_death':  'assets/player/soldier_death.png',
      // Orc sprite sheets
      'orc_idle':      'assets/enemies/orc_idle.png',
      'orc_walk':      'assets/enemies/orc_walk.png',
      'orc_attack01':  'assets/enemies/orc_attack01.png',
      'orc_attack02':  'assets/enemies/orc_attack02.png',
      'orc_hurt':      'assets/enemies/orc_hurt.png',
      'orc_death':     'assets/enemies/orc_death.png',
      'orc_attack':    'assets/enemies/orc_attack.png',
      // Farm animals (chicken=shadow_imp, cow=void_beast)
      'shadow_imp':    'assets/enemies/shadow_imp.png',
      'void_beast':    'assets/enemies/void_beast.png',
      // Dark cultist (Farm RPG character)
      'dark_cultist_idle': 'assets/enemies/dark_cultist_idle.png',
      'dark_cultist_walk': 'assets/enemies/dark_cultist_walk.png',
      // Tiles
      'tileset_spring': 'assets/tiles/tileset_spring.png',
      'chest':         'assets/tiles/chest.png',
      'house':         'assets/tiles/house.png',
      'maple_tree':    'assets/tiles/maple_tree.png',
      'crops':         'assets/tiles/crops.png',
      'fence':         'assets/tiles/fence.png',
      'road':          'assets/tiles/road.png',
      // Weapon/item icons
      'fire_staff':     'assets/weapons/fire_staff.png',
      'inferno_staff':  'assets/weapons/inferno_staff.png',
      'frost_staff':    'assets/weapons/frost_staff.png',
      'blizzard_staff': 'assets/weapons/blizzard_staff.png',
      'thunder_scepter':'assets/weapons/thunder_scepter.png',
      'power_surge_gem':'assets/weapons/power_surge_gem.png',
      'blood_spear':    'assets/weapons/blood_spear.png',
      'blood_catalyst': 'assets/weapons/blood_catalyst.png',
      'composite_bow':  'assets/weapons/composite_bow.png',
      'soul_bow':       'assets/weapons/soul_bow.png',
      'void_wand':      'assets/weapons/void_wand.png',
      'arcane_tome':    'assets/weapons/arcane_tome.png',
      'mana_flask':     'assets/weapons/mana_flask.png',
      'berserk_rune':   'assets/weapons/berserk_rune.png',
      'katana':         'assets/weapons/katana.png',
      'arrow':          'assets/weapons/arrow.png',
      'scythe':         'assets/weapons/scythe.png',
      'battle_axe':     'assets/weapons/battle_axe.png',
    };

    // ---- AUDIO ----
    const sounds = {
      'bgm_title':   'assets/music/bgm_title.ogg',
      'bgm_combat':  'assets/music/bgm_combat.ogg',
      'bgm_shop':    'assets/music/bgm_shop.ogg',
      'bgm_boss':    'assets/music/bgm_boss.ogg',
    };

    this.totalAssets = Object.keys(imgs).length + Object.keys(sounds).length;
    this.loadedAssets = 0;

    const imgPromises = Object.entries(imgs).map(([key, path]) =>
      this._loadImage(key, path)
    );
    const audioPromises = Object.entries(sounds).map(([key, path]) =>
      this._loadAudio(key, path)
    );

    await Promise.all([...imgPromises, ...audioPromises]);
    return { images: this.images, audio: this.audio };
  }

  _loadImage(key, path) {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        this.images[key] = img;
        this._tick(key);
        resolve();
      };
      img.onerror = () => {
        console.warn(`[AssetLoader] Failed to load image: ${path}, creating fallback`);
        this.images[key] = this._createFallbackImage(key);
        this._tick(key);
        resolve();
      };
      img.src = path;
    });
  }

  _loadAudio(key, path) {
    return new Promise((resolve) => {
      let settled = false;
      const audio = new Audio();
      audio.preload = 'auto';

      const finish = (aud) => {
        if (settled) return;
        settled = true;
        clearTimeout(timer);
        this.audio[key] = aud;
        this._tick(key);
        resolve();
      };

      const timer = setTimeout(() => {
        console.warn(`[AssetLoader] Audio load timed out (${path}), continuing with silent fallback`);
        finish(null);
      }, 3000);

      audio.oncanplaythrough = () => finish(audio);
      audio.onerror = () => {
        console.warn(`[AssetLoader] Failed to load audio: ${path}`);
        finish(null);
      };
      audio.src = path;
    });
  }

  _tick(key) {
    this.loadedAssets++;
    if (this.onProgress) {
      this.onProgress(this.loadedAssets, this.totalAssets, key);
    }
  }

  _createFallbackImage(key) {
    const c = document.createElement('canvas');
    // Default to 64x64 for icons, larger for spritesheets
    const isSheet = key.includes('soldier_') || key.includes('orc_') || key.includes('dark_cultist') || key.includes('tileset') || key.includes('shadow_imp') || key.includes('void_beast');
    if (isSheet) {
      c.width = 800; c.height = 100;
    } else {
      c.width = 64; c.height = 64;
    }
    const ctx = c.getContext('2d');
    ctx.fillStyle = '#ff00ff';
    ctx.fillRect(0, 0, c.width, c.height);
    ctx.fillStyle = '#000';
    ctx.font = '10px monospace';
    ctx.fillText(key, 2, 12);
    return c;
  }

  getImage(key) {
    return this.images[key] || null;
  }
  getAudio(key) {
    return this.audio[key] || null;
  }
}
