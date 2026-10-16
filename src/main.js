// ============================================================
// Tàn Tro Mùa Gặt — Ashen Harvest
// Main entry point
// ============================================================
import { Game } from './engine/Game.js';

const game = new Game();
if (typeof window !== 'undefined') {
  window.game = game;
}

game.init().then(() => {
  console.log('[AshenHarvest] Game initialized successfully');
  if (typeof window !== 'undefined') {
    const params = new URLSearchParams(window.location.search);
    if (params.get('mute') === '1' || params.has('mute')) {
      game.audio.setMusicVolume(0);
      game.audio.setSfxVolume(0);
      if (game.audio.musicGain) game.audio.musicGain.gain.value = 0;
      if (game.audio.sfxGain) game.audio.sfxGain.gain.value = 0;
    }
    if (params.get('skipTutorial') === '1' || params.has('skipTutorial')) {
      game.meta.seenTutorial = true;
    }
    if (params.get('autostart') === '1' || params.has('autostart')) {
      setTimeout(() => {
        game.startNewRun('fire_staff', 'mage');
      }, 100);
    }
  }
}).catch(err => {
  console.error('[AshenHarvest] Init failed:', err);
});
