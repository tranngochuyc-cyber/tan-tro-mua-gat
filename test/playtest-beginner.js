import puppeteer from 'puppeteer-core';

async function main() {
  const browser = await puppeteer.launch({
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    headless: 'new',
    defaultViewport: { width: 1920, height: 1080 }
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1920, height: 1080 });
  await page.goto('http://localhost:4173/?mute=1', { waitUntil: 'networkidle0' });

  await new Promise(r => setTimeout(r, 800));

  // Helper to click canvas at virtual (x,y) in 640x360 coordinates
  const clickVirtual = async (vx, vy) => {
    const canvas = await page.$('#gameCanvas');
    const box = await canvas.boundingBox();
    const scaleX = box.width / 640;
    const scaleY = box.height / 360;
    const px = box.x + vx * scaleX;
    const py = box.y + vy * scaleY;
    await page.mouse.click(px, py);
  };

  // Step 1: Click "Chơi mới" (Center right: x=493, y=160 in 640x360)
  // Let's check menu items: Chơi mới is at virtual coordinates
  await clickVirtual(493, 160);
  await new Promise(r => setTimeout(r, 600));
  await page.screenshot({ path: 'screen_step1_class_select.png' });
  console.log('Step 1: Class select screen captured.');

  // Step 2: Press Enter to confirm class selection and start game
  await page.keyboard.press('Enter');
  await new Promise(r => setTimeout(r, 1200));
  await page.screenshot({ path: 'screen_step2_game_start.png' });
  console.log('Step 2: Game started / tutorial screen captured.');

  // Check state inside window.game
  const gameState = await page.evaluate(() => {
    const g = window.game;
    return {
      scene: g.currentScene,
      showingTutorial: g.showingTutorial,
      tutorialStep: g.tutorialStep,
      stage: g.combatScene?.stageNum,
      enemiesCount: g.combatScene?.enemies?.length,
      currentWave: g.combatScene?.currentWave,
      totalWaves: g.combatScene?.totalWaves,
      objectiveType: g.combatScene?.objectiveType,
      objectiveProgress: g.combatScene?.objectiveProgress,
      objectiveTarget: g.combatScene?.objectiveTarget,
      isWaveCleared: g.combatScene?.isWaveCleared,
      isStageComplete: g.combatScene?.isStageComplete,
    };
  });
  console.log('Initial Game state:', gameState);

  // If showing tutorial, let's step through it
  if (gameState.showingTutorial) {
    console.log('Simulating tutorial completion...');
    // Tutorial step 0: Move (WASD)
    await page.keyboard.press('KeyD');
    await new Promise(r => setTimeout(r, 300));
    await page.keyboard.press('KeyW');
    await new Promise(r => setTimeout(r, 300));

    // Attack dummy
    await page.mouse.click(960, 540); // Attack
    await new Promise(r => setTimeout(r, 300));
    // Dash (Space / Shift)
    await page.keyboard.press('Space');
    await new Promise(r => setTimeout(r, 600));

    // Or complete tutorial directly if still in tutorial
    await page.evaluate(() => {
      if (window.game.showingTutorial) {
        window.game.completeTutorial();
      }
    });
  }

  await new Promise(r => setTimeout(r, 800));
  await page.screenshot({ path: 'screen_step3_stage1_combat.png' });

  // Check state after tutorial
  const stateInCombat = await page.evaluate(() => {
    const cs = window.game.combatScene;
    return {
      stage: cs?.stageNum,
      objectiveType: cs?.objectiveType,
      currentWave: cs?.currentWave,
      totalWaves: cs?.totalWaves,
      waveTimer: cs?.waveTimer,
      enemiesCount: cs?.enemies?.length,
      enemies: cs?.enemies?.map(e => ({ name: e.name, hp: e.hp, maxHp: e.maxHp, x: e.x, y: e.y })),
      playerHp: cs?.player?.hp,
      playerLevel: cs?.player?.level,
      isStageComplete: cs?.isStageComplete,
      isWaveCleared: cs?.isWaveCleared,
      gateActive: cs?.gateActive,
    };
  });
  console.log('Combat Scene Stage 1:', stateInCombat);

  // Let's kill wave 1 enemies to observe wave transition behavior!
  console.log('Simulating killing wave 1 enemies...');
  await page.evaluate(() => {
    const cs = window.game.combatScene;
    if (cs && cs.enemies) {
      // Kill all current enemies
      for (const enemy of cs.enemies) {
        enemy.hp = 0;
        enemy.isDead = true;
      }
    }
  });

  // Let a few frames run
  await new Promise(r => setTimeout(r, 500));
  await page.screenshot({ path: 'screen_step4_wave1_killed.png' });

  const stateAfterKill = await page.evaluate(() => {
    const cs = window.game.combatScene;
    return {
      enemiesCount: cs?.enemies?.length,
      currentWave: cs?.currentWave,
      totalWaves: cs?.totalWaves,
      waveClearTimer: cs?.waveClearTimer,
      waveAnnouncementTimer: cs?.waveAnnouncementTimer,
      waveTransitionTimer: cs?.waveTransitionTimer,
      isWaveCleared: cs?.isWaveCleared,
      isStageComplete: cs?.isStageComplete,
      gateActive: cs?.gateActive,
      showingStageComplete: window.game.showingStageComplete,
    };
  });
  console.log('State right after killing wave 1:', stateAfterKill);

  // Wait 3 seconds to see if wave 2 spawns or what happens
  await new Promise(r => setTimeout(r, 3000));
  await page.screenshot({ path: 'screen_step5_after_wait.png' });

  const stateAfterWait = await page.evaluate(() => {
    const cs = window.game.combatScene;
    return {
      enemiesCount: cs?.enemies?.length,
      currentWave: cs?.currentWave,
      totalWaves: cs?.totalWaves,
      isWaveCleared: cs?.isWaveCleared,
      isStageComplete: cs?.isStageComplete,
      gateActive: cs?.gateActive,
      showingStageComplete: window.game.showingStageComplete,
    };
  });
  console.log('State after 3s wait:', stateAfterWait);

  // If there are wave 2 enemies, kill them too to reach stage complete
  await page.evaluate(() => {
    const cs = window.game.combatScene;
    if (cs && cs.enemies) {
      for (const enemy of cs.enemies) {
        enemy.hp = 0;
        enemy.isDead = true;
      }
    }
  });

  await new Promise(r => setTimeout(r, 3500));
  // If wave 3, kill them too
  await page.evaluate(() => {
    const cs = window.game.combatScene;
    if (cs && cs.enemies) {
      for (const enemy of cs.enemies) {
        enemy.hp = 0;
        enemy.isDead = true;
      }
    }
  });

  await new Promise(r => setTimeout(r, 2000));
  await page.screenshot({ path: 'screen_step6_stage_cleared.png' });

  const stateCleared = await page.evaluate(() => {
    const cs = window.game.combatScene;
    return {
      isStageComplete: cs?.isStageComplete,
      gateActive: cs?.gateActive,
      gate: cs?.gate,
      showingStageComplete: window.game.showingStageComplete,
      playerLevel: cs?.player?.level,
    };
  });
  console.log('State after all waves killed:', stateCleared);

  // Level up the player to trigger upgrade screen
  await page.evaluate(() => {
    const cs = window.game.combatScene;
    if (cs?.player) {
      cs.player.gainXp(100);
    }
  });

  await new Promise(r => setTimeout(r, 800));
  await page.screenshot({ path: 'screen_step7_upgrade_screen.png' });

  const stateUpgrade = await page.evaluate(() => {
    return {
      showingUpgrade: window.game.showingUpgrade,
      upgradeChoices: window.game.upgradeScene?.choices?.map(c => ({ id: c.id, name: c.name, type: c.type, desc: c.desc }))
    };
  });
  console.log('Upgrade scene state:', stateUpgrade);

  await browser.close();
}

main().catch(console.error);
