import puppeteer from 'puppeteer-core';
import path from 'path';

async function main() {
  const browser = await puppeteer.launch({
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    headless: 'new',
    defaultViewport: { width: 1920, height: 1080 }
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1920, height: 1080 });
  await page.goto('http://localhost:4173/?mute=1', { waitUntil: 'networkidle0' });

  // Wait 1s for any assets/loading screen
  await new Promise(r => setTimeout(r, 1000));
  await page.screenshot({ path: 'screen_initial_1920.png' });
  console.log('Saved screen_initial_1920.png');

  await browser.close();
}

main().catch(console.error);
