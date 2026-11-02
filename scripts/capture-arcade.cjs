'use strict';
const {chromium}=require('playwright');const {mkdir,readFile,writeFile}=require('node:fs/promises');const {createHash}=require('node:crypto');const path=require('node:path');
(async()=>{const output=process.env.CAPTURE_OUTPUT||'/tmp/westward-captures',site=process.env.CAPTURE_SITE||'capture-site';await mkdir(output,{recursive:true});const inputs={};for(const f of ['index.html','styles.css','game.js'])inputs[f]=createHash('sha256').update(await readFile(path.join(site,f))).digest('hex');const browser=await chromium.launch({headless:true});try{
 const page=await browser.newPage({viewport:{width:1280,height:1000},deviceScaleFactor:1,locale:'en-US',reducedMotion:'reduce'});await page.route('**/*',route=>route.request().url().startsWith('http://127.0.0.1:4203/')?route.continue():route.abort());await page.goto('http://127.0.0.1:4203/',{waitUntil:'domcontentloaded'});await page.locator('#leader-name').fill('Clara Bennett');await page.locator('#start-form button[type="submit"]').click();
 await page.locator('[data-action="travel"]').click();await page.waitForTimeout(500);
 await page.locator('#game-view').screenshot({path:path.join(output,'westward-01.png'),animations:'disabled'});
 if(await page.locator('#event-panel').isVisible()){const close=page.locator('#event-panel button').first();if(await close.count())await close.click()}
 await page.locator('[data-action="travel"]').click();await page.waitForTimeout(500);
 await page.locator('#game-view').screenshot({path:path.join(output,'westward-02.png'),animations:'disabled'});
 await writeFile(path.join(output,'capture.json'),JSON.stringify({schemaVersion:1,workflowCommit:process.env.GITHUB_SHA||null,sourceCommit:process.env.GAME_SOURCE_COMMIT||null,runId:process.env.GITHUB_RUN_ID||null,url:'http://127.0.0.1:4203/',inputs,browser:browser.version(),viewport:{width:1280,height:1000},externalFonts:'blocked; system fallback',screenshots:['westward-01.png','westward-02.png']},null,2)+'\n');
 }finally{await browser.close()}})().catch(e=>{console.error(e);process.exitCode=1});
