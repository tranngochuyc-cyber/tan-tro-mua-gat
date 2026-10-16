import puppeteer from 'puppeteer-core';
import assert from 'node:assert/strict';
import fs from 'node:fs';
const b=await puppeteer.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true,args:['--mute-audio']});
try {
 const p=await b.newPage(),errors=[]; p.on('pageerror',e=>errors.push(e.message));
 await p.goto('http://127.0.0.1:4174/?mute=1',{waitUntil:'networkidle0'});await p.waitForFunction(()=>window.game?.running);
 for(const id of ['warrior','mage','ranger','assassin','paladin','necromancer','alice','wukong','dracula','piper']) {
  await p.evaluate(id=>{game.meta.seenTutorial=true;game.startNewRun(undefined,id)},id);
  await p.keyboard.press('KeyQ');await p.mouse.move(420,300);await p.mouse.down();await new Promise(r=>setTimeout(r,350));await p.mouse.up();
  assert.equal(await p.evaluate(()=>game.runState.player.classId),id);
 }
 for(const [width,height,dpr] of [[1366,768,1],[1920,1080,2],[568,320,1]]){
  await p.setViewport({width,height,deviceScaleFactor:dpr});await new Promise(r=>setTimeout(r,150));
  const r=await p.evaluate(()=>{const a=game.canvas.getBoundingClientRect(),b=game.uiCanvas.getBoundingClientRect();return {world:game.canvas.width,ui:game.uiCanvas.width,w:a.width,h:a.height,aligned:Math.abs(a.x-b.x)<1&&Math.abs(a.y-b.y)<1}});
  assert.equal(r.world,640);assert.ok(r.aligned);assert.ok(r.w<=width&&r.h<=height);assert.ok(Math.abs(r.ui-r.w*dpr)<=1);
 }
 await p.setViewport({width:1366,height:768,deviceScaleFactor:1});
 await p.evaluate(()=>{game.showPause()});await p.screenshot({path:'docs/preview/pause.png'});
 await p.evaluate(()=>game.openSettings('pause'));await p.screenshot({path:'docs/preview/settings.png'});
 assert.deepEqual(errors,[]);console.log('PASS: 10 class runtime smoke checks; 3 viewport/DPR layer alignment checks; pause/settings; no JavaScript errors.');
}finally{await b.close()}
