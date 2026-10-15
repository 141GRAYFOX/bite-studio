'use strict';
const {chromium}=require(process.env.BITE_PLAYWRIGHT_PATH||'playwright');
const fs=require('node:fs'),path=require('node:path'),http=require('node:http'),assert=require('node:assert/strict');
const server=http.createServer((req,res)=>{res.setHeader('Content-Type','text/html; charset=utf-8');res.end(fs.readFileSync(path.join(__dirname,'../BiteStudio.html')));});
async function run(){
  await new Promise(r=>server.listen(0,'127.0.0.1',r));
  const browser=await chromium.launch({headless:true,...(process.env.BITE_CHROME_PATH?{executablePath:process.env.BITE_CHROME_PATH}:{})});
  try{
    const page=await browser.newPage({viewport:{width:1440,height:1100}}),errors=[];page.on('pageerror',e=>errors.push(e.message));
    await page.goto('http://127.0.0.1:'+server.address().port);await page.waitForFunction(()=>window.BiteStudio?.ready);
    const edit=async(id,value)=>{await page.locator('#'+id).fill(String(value));await page.locator('#'+id).dispatchEvent('change');};
    const open=async s=>{await page.locator('#projectFile').setInputFiles({name:'test.bite',mimeType:'application/json',buffer:Buffer.from(JSON.stringify({format:'bite-studio',version:1,state:s}))});await page.waitForFunction(w=>BiteStudio.getState().width===w,s.width);};
    const calculate=async()=>{await page.locator('#calculatePrintSize').click();await page.waitForFunction(()=>!document.getElementById('printResult').hidden&&document.getElementById('calculatePrintSize').textContent==='推算打印尺寸');};
    const values=()=>page.evaluate(()=>['printWidth','printHeight'].map(id=>Number(document.getElementById(id).textContent.replaceAll(',',''))));
    const s=await page.evaluate(()=>{const s=BiteStudio.defaultState();s.width=800;s.height=752;s.outline=14*800/4003;return s;});
    await open(s);assert.ok(await page.locator('#calculatePrintSize').isDisabled());
    await edit('mouthDistanceCm',0);assert.ok(await page.locator('#calculatePrintSize').isDisabled());
    await edit('mouthDistanceCm',-4);assert.ok(await page.locator('#calculatePrintSize').isDisabled());
    await edit('mouthDistanceCm',6);await calculate();const first=await values();
    // Independent alpha scan of an actual exported PNG, excluding every transparent margin.
    const expected=await page.evaluate(async()=>{
      const s=BiteStudio.getState(),source=await BiteRenderer.decode(s.src),factor=4003/Math.max(s.width,s.height),w=Math.round(s.width*factor),h=Math.round(s.height*factor),normalized={...s,width:w,height:h,outline:s.outline*w/s.width},canvas=await BiteRenderer.render(normalized,source),blob=await BiteRenderer.blob(canvas),im=await createImageBitmap(blob),c=new OffscreenCanvas(im.width,im.height),ctx=c.getContext('2d');ctx.drawImage(im,0,0);
      const d=ctx.getImageData(0,0,c.width,c.height).data;let left=c.width,right=-1,top=c.height,bottom=-1;
      for(let y=0;y<c.height;y++)for(let x=0;x<c.width;x++)if(d[(y*c.width+x)*4+3]>0){left=Math.min(left,x);right=Math.max(right,x);top=Math.min(top,y);bottom=Math.max(bottom,y);}
      im.close();if(source.close)source.close();canvas.width=canvas.height=1;const k=6/(s.mouth.scale*w*Math.sqrt(1+.085*.085));return {width:(right-left+1)*k,height:(bottom-top+1)*k,canvasWidth:w*k};
    });
    assert.ok(Math.abs(first[0]-expected.width)<=.0051&&Math.abs(first[1]-expected.height)<=.0051,'cm dimensions match final nonzero alpha pixels including outline');
    assert.ok(first[0]<expected.canvasWidth-.1,'transparent canvas margins do not count');
    await edit('mouthDistanceCm',12);const doubled=await values();assert.ok(Math.abs(doubled[0]-first[0]*2)<=.011,'distance change updates cached measurement immediately');
    await edit('mouthDistanceCm',6);
    await edit('width',1600);assert.ok(await page.locator('#printResult').isHidden());await calculate();const large=await values();
    assert.deepEqual(large,first,'higher export resolution preserves physical size');
    assert.ok(Math.abs((await page.evaluate(()=>BiteStudio.getState().outline))-s.outline*2)<1e-10,'resolution change keeps outline in proportion');
    await page.locator('#mouthLayer').click();await edit('scale',75);assert.ok(await page.locator('#printResult').isHidden(),'mouth adjustment invalidates old dimensions');await calculate();
    await page.locator('#objectLayer').click();await edit('angleNumber',35);assert.ok(await page.locator('#printResult').isHidden());await calculate();
    // A pending render cannot publish results for an edited canvas.
    await page.evaluate(()=>{document.getElementById('calculatePrintSize').click();const el=document.getElementById('outline');el.value=20;el.dispatchEvent(new Event('input'));el.dispatchEvent(new Event('change'));});
    await page.waitForFunction(()=>document.getElementById('calculatePrintSize').textContent==='推算打印尺寸');assert.ok(await page.locator('#printResult').isHidden());await calculate();
    const restored=await page.evaluate(()=>{const s=BiteStudio.getState(),valid=x=>BiteStudio.validateProject({format:'bite-studio',version:1,state:x});const roundTrip=valid(s);delete s.mouthDistanceCm;const legacy=valid(s);let rejected=0;for(const v of [0,-1,'6',null]){try{valid({...s,mouthDistanceCm:v});}catch(_){rejected++;}}return {saved:roundTrip.mouthDistanceCm,legacy:legacy.mouthDistanceCm,rejected};});
    assert.deepEqual(restored,{saved:6,legacy:null,rejected:3});
    await page.waitForFunction(()=>document.getElementById('saveStatus').textContent==='已自动暂存');await page.reload();await page.waitForFunction(()=>window.BiteStudio?.ready);assert.equal(await page.locator('#mouthDistanceCm').inputValue(),'6');await calculate();
    if(process.env.BITE_SCREENSHOT_DIR){fs.mkdirSync(process.env.BITE_SCREENSHOT_DIR,{recursive:true});await page.locator('.print-settings').screenshot({path:path.join(process.env.BITE_SCREENSHOT_DIR,'print-size-desktop.png')});}
    await page.setViewportSize({width:390,height:844});await page.locator('.print-settings').scrollIntoViewIfNeeded();assert.ok(await page.locator('#printResult').isVisible());
    assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'mobile has no horizontal overflow');
    if(process.env.BITE_SCREENSHOT_DIR)await page.screenshot({path:path.join(process.env.BITE_SCREENSHOT_DIR,'print-size-mobile.png')});
    // Alpha=1 still counts, even when it is far from an opaque pixel.
    const faint=await page.evaluate(async()=>{const c=BiteRenderer.canvas(100,80),x=c.getContext('2d');x.fillStyle='#000';x.fillRect(30,20,10,10);x.fillStyle='rgba(0,0,0,0.004)';x.fillRect(80,70,1,1);return BiteRenderer.visibleBounds(c,{alphaThreshold:0});});
    assert.deepEqual(faint,{x:30,y:20,width:51,height:51});
    await page.locator('label.switch').click();await page.locator('#objectLayer').click();await edit('posX',200);await page.locator('#calculatePrintSize').click();await page.waitForFunction(()=>document.getElementById('printStatus').textContent.includes('没有非透明图案'));assert.ok(await page.locator('#printResult').isHidden());
    await edit('mouthDistanceCm','');assert.ok(await page.locator('#calculatePrintSize').isDisabled());
    assert.deepEqual(errors,[]);console.log('Print size browser checks passed: pixel bounds, chord calibration, resolution, transforms, stale results, persistence, legacy projects, mobile, faint and empty artwork.');
  }finally{await browser.close();server.close();}
}
run().catch(e=>{console.error(e);server.close();process.exitCode=1;});
