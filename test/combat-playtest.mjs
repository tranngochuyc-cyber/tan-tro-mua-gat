import puppeteer from 'puppeteer-core';
const browser=await puppeteer.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true,args:['--mute-audio']});
const page=await browser.newPage(); const errors=[]; page.on('pageerror',e=>errors.push(e.message));
await page.goto('http://127.0.0.1:4175/?mute=1',{waitUntil:'networkidle0'});await page.waitForFunction(()=>window.game?.running);
const results=[];
for(const id of ['warrior','mage','ranger','assassin','paladin','necromancer','alice','wukong','dracula','piper']){
 await page.evaluate(id=>{game.meta.seenTutorial=true;game.startNewRun(undefined,id);const s=game.combatScene,p=s.player;e=s.enemies[0];e.x=p.x+80;e.y=p.y;e.hp=500;e.maxHp=500;e.speed=0;e.state='idle';e.update=()=>{};s.enemies=[e];s.introBannerTimer=0;s.controlsGuideExpanded=false;s.player.spawnProtection=0;s.player.attackTimer=0;s.camera.follow(p.x,p.y,10000,10000);s.camera.update(0.016)},id);
 const pos=await page.evaluate(()=>{const s=game.combatScene,p=s.player,r=game.canvas.getBoundingClientRect();return {x:r.x+(p.x+80-s.camera.x)*r.width/640,y:r.y+(p.y-s.camera.y)*r.height/360}});
 await page.mouse.move(pos.x,pos.y);await page.mouse.down();await new Promise(r=>setTimeout(r,100));await page.mouse.up();
 const early=await page.evaluate(()=>{const s=game.combatScene;return {enemyHp:s.enemies[0]?.hp,projectiles:s.projectiles.length,tempo:s.player.wukongTempo}});
 await new Promise(r=>setTimeout(r,450));
 const data=await page.evaluate(()=>{const s=game.combatScene;return {id:s.player.classId,enemyHp:s.enemies[0]?.hp,projectiles:s.projectiles.length,tempo:s.player.wukongTempo,playerHp:s.player.hp}});results.push({...data,early});
}
console.log(JSON.stringify({results,errors},null,2));await browser.close();

