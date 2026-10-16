import puppeteer from 'puppeteer-core';
import fs from 'node:fs';
fs.mkdirSync('docs/preview',{recursive:true});
const b=await puppeteer.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true,args:['--mute-audio']});
const p=await b.newPage(); const errors=[];p.on('pageerror',e=>errors.push(e.message));
await p.setViewport({width:1366,height:768,deviceScaleFactor:1});
await p.goto('http://127.0.0.1:4174/?mute=1',{waitUntil:'networkidle0'});
await p.waitForFunction(()=>window.game?.running);
await p.screenshot({path:'docs/preview/menu-1366.png'});
for (const [id,file] of [['gameCanvas','world'],['uiCanvas','interface']]) {
 const data=await p.$eval('#'+id,c=>c.toDataURL().split(',')[1]);
 fs.writeFileSync('docs/preview/'+file+'.png',Buffer.from(data,'base64'));
}
const click=async(x,y)=>{const r=await p.$eval('#gameCanvas',e=>{const r=e.getBoundingClientRect();return {x:r.x,y:r.y,w:r.width,h:r.height}});await p.mouse.click(r.x+x*r.w/640,r.y+y*r.h/360);await new Promise(r=>setTimeout(r,300));};
await click(490,155);await p.screenshot({path:'docs/preview/classes.png'});
await p.keyboard.press('Enter');await new Promise(r=>setTimeout(r,800));
await p.screenshot({path:'docs/preview/tutorial.png'});
await p.keyboard.press('Escape');await new Promise(r=>setTimeout(r,800));
await p.screenshot({path:'docs/preview/combat.png'});
console.log(JSON.stringify({errors,state:await p.evaluate(()=>({scene:game.currentScene,classes:game.showingClassSelect,tutorial:game.showingTutorial,world:[game.canvas.width,game.canvas.height],ui:[game.uiCanvas.width,game.uiCanvas.height]}))}));
await p.setViewport({width:1920,height:1080,deviceScaleFactor:2});await new Promise(r=>setTimeout(r,300));await p.screenshot({path:'docs/preview/combat-1920.png'});
await b.close();

