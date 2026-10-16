import puppeteer from 'puppeteer-core';
const browser = await puppeteer.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: true, args: ['--mute-audio'] });
try {
  const page = await browser.newPage();
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto('http://127.0.0.1:4175/?mute=1', { waitUntil: 'networkidle0' });
  await page.waitForFunction(() => window.game?.running);
  const results = [];
  for (const id of ['warrior','mage','ranger','assassin','paladin','necromancer','alice','wukong','dracula','piper']) {
    const result = await page.evaluate(id => {
      game.meta.seenTutorial = true;
      game.startNewRun(undefined, id);
      const scene = game.combatScene;
      const player = scene.player;
      const enemy = scene.enemies[0];
      enemy.x = player.x + 35;
      enemy.y = player.y;
      enemy.hp = enemy.maxHp = 500;
      enemy.update = () => {};
      scene.enemies = [enemy];
      player.skillCd = 0;
      scene._useSkill();
      return { id, hp: player.hp, enemyHp: enemy.hp, skillCd: player.skillCd, x: player.x, y: player.y };
    }, id);
    results.push(result);
  }
  if (errors.length || results.some(r => !Object.values(r).every(v => typeof v === 'string' || Number.isFinite(v)))) {
    throw new Error(JSON.stringify({ errors, results }));
  }
  console.log(JSON.stringify({ results, errors }, null, 2));
} finally {
  await browser.close();
}
