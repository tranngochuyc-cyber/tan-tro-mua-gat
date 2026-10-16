import puppeteer from 'puppeteer-core';
import path from 'path';
import fs from 'fs';

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const ARTIFACT_DIR = 'C:\\Users\\HP-VT\\.gemini\\antigravity-ide\\brain\\34d29450-7ce0-4565-a2d7-3855225a7c61';
const WORKSPACE_DIR = 'd:\\folder lv\\folder IT\\Code\\game_rpg';

function getOutputPath(filename) {
  return path.join(ARTIFACT_DIR, filename);
}

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function main() {
  console.log('=== LAUNCHING HEADLESS CHROME PLAYTEST & CAPTURE ===');
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: 'new',
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-gpu',
      '--mute-audio',
      '--window-size=1920,1080',
    ],
  });

  const page = await browser.newPage();

  // Helper for screenshot
  async function snap(filename, fullPage = false) {
    const p1 = getOutputPath(filename);
    const p2 = path.join(WORKSPACE_DIR, filename);
    await page.screenshot({ path: p1, fullPage });
    await page.screenshot({ path: p2, fullPage });
    console.log(`Saved screenshot: ${filename}`);
  }

  // 1. Verify build at port 4173 with audio muted
  console.log('Navigating to http://localhost:4173/?mute=1...');
  await page.goto('http://localhost:4173/?mute=1', { waitUntil: 'networkidle2' });
  await page.waitForFunction(() => !!window.game && window.game.running);
  console.log('Game initialized and loaded successfully.');

  // Mute audio strictly
  await page.evaluate(() => {
    if (window.game?.audio) {
      window.game.audio.setMusicVolume(0);
      window.game.audio.setSfxVolume(0);
    }
  });

  // ----------------------------------------------------
  // TEST 1: Class Selection at 1366x768 and 1920x1080
  // ----------------------------------------------------
  console.log('\n--- 1. Testing Class Select Scene ---');
  await page.evaluate(() => {
    window.game.showClassSelect();
  });
  await sleep(400);

  // 1366x768
  await page.setViewport({ width: 1366, height: 768 });
  await sleep(300);
  await snap('class_select_1366.png');

  // Hover over Alice
  await page.evaluate(() => {
    window.game.classSelectScene.selected = 6; // Alice
  });
  await sleep(200);
  await snap('class_select_alice_detail.png');

  // Hover over Wukong
  await page.evaluate(() => {
    window.game.classSelectScene.selected = 7; // Wukong
  });
  await sleep(200);
  await snap('class_select_wukong_detail.png');

  // Hover over Dracula
  await page.evaluate(() => {
    window.game.classSelectScene.selected = 8; // Dracula
  });
  await sleep(200);
  await snap('class_select_dracula_detail.png');

  // Hover over Piper
  await page.evaluate(() => {
    window.game.classSelectScene.selected = 9; // Piper
  });
  await sleep(200);
  await snap('class_select_piper_detail.png');

  // 1920x1080 Full Screen
  await page.setViewport({ width: 1920, height: 1080 });
  await sleep(300);
  await snap('class_select_1920.png');

  // ----------------------------------------------------
  // TEST 2: Stage 1 Combat, Intro Banner, and HUD Readability
  // ----------------------------------------------------
  console.log('\n--- 2. Testing Stage 1 Combat & Intro Banner ---');
  await page.evaluate(() => {
    window.game.startRun('alice');
    window.game.meta.seenTutorial = true; // start right in stage 1
    window.game._startStage(0);
    window.game.combatScene.introBannerTimer = 3.0;
  });
  await sleep(300);
  await page.setViewport({ width: 1366, height: 768 });
  await snap('stage1_combat_intro_1366.png');
  await page.setViewport({ width: 1920, height: 1080 });
  await snap('stage1_combat_intro_1920.png');

  // ----------------------------------------------------
  // TEST 3: Wave 1 Clear -> Wave 2 Countdown Banner & Spawn Telegraphs
  // ----------------------------------------------------
  console.log('\n--- 3. Testing Wave Clear Transition & Telegraphs ---');
  await page.evaluate(() => {
    const cs = window.game.combatScene;
    // Kill all wave 1 enemies
    for (const e of cs.enemies) {
      e.takeDamage(9999);
      cs._onEnemyKilled(e);
    }
    // Update objective to trigger countdown transition
    cs._checkObjective();
  });
  await sleep(300);
  await snap('wave_transition_countdown_telegraphs.png');

  // ----------------------------------------------------
  // TEST 4: Stage Completion Modal & Unified Next Stage Flow
  // ----------------------------------------------------
  console.log('\n--- 4. Testing Stage Complete Flow & Unified Next Action ---');
  await page.evaluate(() => {
    const cs = window.game.combatScene;
    cs.wavesRemaining = 1;
    for (const e of cs.enemies) {
      e.takeDamage(9999);
      cs._onEnemyKilled(e);
    }
    cs.waveTransitionTimer = 0;
    cs._checkObjective();
  });
  await sleep(500);
  await snap('stage_complete_modal_1366.png');

  // ----------------------------------------------------
  // TEST 5: Level Up Upgrade Modal with Tailored Class Branches & Trade-offs
  // ----------------------------------------------------
  console.log('\n--- 5. Testing Level Up Upgrade Modal ---');
  await page.evaluate(() => {
    // Player levels up to Lv2 with full heal
    window.game.combatScene.player.hp = 25; // simulate low HP
    const lvs = window.game.combatScene.player.addXp(20);
    window.game.showUpgrade(window.game.combatScene.player);
  });
  await sleep(400);
  await snap('upgrade_modal_alice_branches.png');

  // Level up Warrior to demonstrate warrior branches (Đỡ đòn vs Cuồng chiến)
  await page.evaluate(() => {
    window.game.startRun('warrior');
    window.game._startStage(0);
    window.game.combatScene.player.addXp(20);
    window.game.showUpgrade(window.game.combatScene.player);
  });
  await sleep(400);
  await snap('upgrade_modal_warrior_branches.png');

  // ----------------------------------------------------
  // TEST 6: Demonstrating 4 World Classic Classes Mechanics
  // ----------------------------------------------------
  console.log('\n--- 6. Demonstrating 4 World Classic Classes Mechanics ---');

  // 6A. Alice Form Shifting
  console.log('Testing Alice form shifting...');
  await page.evaluate(() => {
    window.game.startRun('alice');
    window.game._startStage(0);
    window.game.combatScene.player.aliceForm = 'small';
    window.game.combatScene.player.x = 240;
    window.game.combatScene.player.y = 180;
  });
  await sleep(200);
  await snap('alice_small_form.png');

  await page.evaluate(() => {
    // Trigger Q to switch to Giant form and stomp!
    window.game.combatScene._useSkill();
  });
  await sleep(250);
  await snap('alice_giant_form_stomp.png');

  // 6B. Wukong Tempo Meter & Shadow Clones
  console.log('Testing Wukong tempo combo & clones...');
  await page.evaluate(() => {
    window.game.startRun('wukong');
    window.game._startStage(0);
    const cs = window.game.combatScene;
    cs.player.x = 240;
    cs.player.y = 180;
    // Trigger Q: activates max tempo 5 and spawns 2 clones!
    cs._useSkill();
  });
  await sleep(300);
  await snap('wukong_max_tempo_and_clones.png');

  // 6C. Dracula Bat Swarm & Low HP Frenzy
  console.log('Testing Dracula bat swarm & low HP frenzy...');
  await page.evaluate(() => {
    window.game.startRun('dracula');
    window.game._startStage(0);
    const cs = window.game.combatScene;
    cs.player.x = 240;
    cs.player.y = 180;
    // Trigger Q: costs HP, enters bat swarm invulnerability
    cs._useSkill();
  });
  await sleep(300);
  await snap('dracula_bat_swarm_form.png');

  // 6D. Piper Flute Melody & Hypnosis
  console.log('Testing Piper hypnosis & notes...');
  await page.evaluate(() => {
    window.game.startRun('piper');
    window.game._startStage(0);
    const cs = window.game.combatScene;
    cs.player.x = 240;
    cs.player.y = 180;
    // Trigger Q: hypnosis waves
    cs._useSkill();
  });
  await sleep(300);
  await snap('piper_hypnosis_melody.png');

  // ----------------------------------------------------
  // TEST 7: Off-screen Compass Pointers to Objectives
  // ----------------------------------------------------
  console.log('\n--- 7. Testing Off-Screen Compass Pointers ---');
  await page.evaluate(() => {
    // Start destroy seals stage
    window.game.startRun('ranger');
    window.game._startStage(2); // destroy stage
    const cs = window.game.combatScene;
    // Move player far from seal
    cs.player.x = 50;
    cs.player.y = 50;
    cs.camera.x = 0;
    cs.camera.y = 0;
  });
  await sleep(300);
  await snap('compass_pointer_to_seal.png');

  // Pointing to exit gate when completed
  await page.evaluate(() => {
    const cs = window.game.combatScene;
    cs.objectiveComplete = true;
    cs.gateOpen = true;
    // Place gate far from player
    cs.gate.x = 800;
    cs.gate.y = 700;
  });
  await sleep(300);
  await snap('compass_pointer_to_gate.png');

  await browser.close();
  console.log('\n=== ALL BROWSER CHECKS & FULL-WINDOW SCREENSHOTS CAPTURED ===');
}

main().catch(err => {
  console.error('Test error:', err);
  process.exit(1);
});
