const { chromium } = require('playwright');
(async()=>{const b=await chromium.launch();const p=await b.newPage({viewport:{width:1280,height:720}});
const errs=[];p.on('pageerror',e=>errs.push('PAGE '+e.message+' | '+(e.stack||'').split('\n').slice(1,3).join(' ')));p.on('console',m=>{if(m.type()==='error')errs.push(m.text())});
await p.goto(process.env.URL||'http://localhost:3000/');await p.waitForTimeout(800);
await p.keyboard.press('Enter');await p.waitForTimeout(300);await p.keyboard.press('Enter');await p.waitForTimeout(500);
const keys=['KeyD','KeyA','Space','KeyJ','KeyK','ShiftLeft','KeyQ','KeyF'];
async function chaos(ms){const end=Date.now()+ms;let dir='KeyD';await p.keyboard.down(dir);
 while(Date.now()<end){const k=keys[Math.floor(Math.random()*keys.length)];
  if(k==='KeyD'||k==='KeyA'){await p.keyboard.up(dir);dir=k;await p.keyboard.down(dir);} else {await p.keyboard.press(k);}
  await p.waitForTimeout(60+Math.random()*80);}
 await p.keyboard.up(dir);}
const shots=[];
for(let room=0;room<10;room++){
  const info=await p.evaluate(()=>{const g=window.__game;return {mode:g.mode,kind:g.run.room.kind,tpl:g.run.room.tpl,idx:g.run.roomIndex}});
  console.log('room',JSON.stringify(info));
  if(info.mode!=='play'){console.log('not play mode');break;}
  // giữ người chơi sống để thử hết luồng
  await p.evaluate(()=>{window.__game.run.hp=9999;window.__game.run.stats.maxHp=9999;});
  if(info.kind==='combat'||info.kind==='boss'){ if(info.kind==='boss'){await p.evaluate(()=>{const g=window.__game;g.play.player.x=g.play.level.pw*0.4;});}
    await chaos(info.kind==='boss'?9000:5000);
    await p.screenshot({path:`/tmp/sim-${room}.png`});shots.push(room);
    await p.evaluate(()=>{const g=window.__game, pl=g.play; for(const e of pl.enemies){ if(!e.dead) pl.damageEnemy(e, 99999,{});} });
    await p.waitForTimeout(600);
    await p.evaluate(()=>{const g=window.__game, pl=g.play; for(const e of pl.enemies){ if(!e.dead) pl.damageEnemy(e, 99999,{});} });
    await p.waitForTimeout(info.kind==='boss'?2500:600);
  }
  if(info.kind==='dice'){
    // mở tất cả rương qua lớp giao diện
    const n=await p.evaluate(()=>window.__game.play.objects.filter(o=>o.kind==='chest'||o.kind==='door').length);
    for(let i=0;i<n;i++){
      await p.evaluate((i)=>{const g=window.__game;const o=g.play.objects.filter(o=>o.kind==='chest'||o.kind==='door')[i];g.openDice(g.play,o);},i);
      await p.waitForTimeout(200);await p.keyboard.press('Enter');await p.waitForTimeout(1500);
      if(i===0) await p.screenshot({path:'/tmp/sim-dice.png'});
      await p.keyboard.press('Enter');await p.waitForTimeout(1500);
      // nếu vẫn mở (tung lại) thì chọn chấp nhận
      for(let k=0;k<3;k++){const open=await p.evaluate(()=>window.__game.ui.isOpen); if(!open)break; await p.evaluate(()=>{const b=[...document.querySelectorAll('.overlay .btn')].pop(); b&&b.click();}); await p.waitForTimeout(1400);}
    }
    await p.waitForTimeout(800);
    await p.screenshot({path:'/tmp/sim-diceroom.png'});
  }
  if(info.kind==='forge'){
    await p.evaluate(()=>{const g=window.__game;g.run.gold=500;g.openForge(g.play);});await p.waitForTimeout(300);
    await p.screenshot({path:'/tmp/sim-forge.png'});
    await p.evaluate(()=>{document.querySelector('[data-up="0"]').click();});await p.waitForTimeout(200);
    await p.evaluate(()=>{document.querySelector('[data-a=close]').click();});await p.waitForTimeout(200);
    const m=await p.evaluate(()=>{const g=window.__game;const o=g.play.objects.find(o=>o.kind==='merchant');g.openShop(g.play,o);return !!o});
    await p.waitForTimeout(300);await p.screenshot({path:'/tmp/sim-shop.png'});
    await p.evaluate(()=>{document.querySelector('[data-b="0"]').click();document.querySelector('[data-b="1"]').click();document.querySelector('[data-a=close]').click();});
    await p.waitForTimeout(500);
  }
  // ra cổng
  await p.evaluate(()=>{const g=window.__game;const gate=g.play.objects.find(o=>o.kind==='gate'); if(gate) gate.open=true; g.play.exitRoom();});
  await p.waitForTimeout(900);
  for(let k=0;k<4;k++){
    const open=await p.evaluate(()=>window.__game.ui.isOpen);
    if(!open)break;
    if(k===0) await p.screenshot({path:`/tmp/sim-ov-${room}.png`});
    await p.keyboard.press('Enter');await p.waitForTimeout(500);
  }
  await p.waitForTimeout(700);
}
const fin=await p.evaluate(()=>({mode:window.__game.mode,open:window.__game.ui.isOpen,txt:document.querySelector('.overlay')?.innerText.slice(0,120)}));
console.log('FINAL',JSON.stringify(fin));
await p.screenshot({path:'/tmp/sim-end.png'});
console.log('ERRORS:\n'+[...new Set(errs)].slice(0,15).join('\n'));
await b.close();})();
