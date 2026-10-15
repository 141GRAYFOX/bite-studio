const {chromium}=require(process.env.BITE_PLAYWRIGHT_PATH || 'playwright');
const fs=require('node:fs');
const path=require('node:path');
const http=require('node:http');
const assert=require('node:assert/strict');
const repo=path.resolve(__dirname,'..');
const server=http.createServer((req,res)=>{res.setHeader('Content-Type','text/html; charset=utf-8');res.end(fs.readFileSync(path.join(repo,'BiteStudio.html')));});
async function readDownload(d){const stream=await d.createReadStream(),chunks=[];for await(const c of stream)chunks.push(c);return Buffer.concat(chunks);}
async function run(){
  await new Promise(r=>server.listen(0,'127.0.0.1',r));
  const browser=await chromium.launch({headless:true,...(process.env.BITE_CHROME_PATH?{executablePath:process.env.BITE_CHROME_PATH}:{})});
  try{
    const page=await browser.newPage({viewport:{width:1440,height:1100},hasTouch:true}),errors=[];
    page.on('pageerror',e=>errors.push(e.message));
    await page.goto(process.env.BITE_QA_URL||'http://127.0.0.1:'+server.address().port);
    await page.waitForFunction(()=>window.BiteStudio?.ready);
    const state=()=>page.evaluate(()=>BiteStudio.mockup.getState());
    const waitReady=()=>page.waitForFunction(()=>!BiteStudio.mockup.getState().busy&&BiteStudio.mockup.getState().hasSticker);
    const edit=async(id,value)=>{await page.locator('#'+id).fill(String(value));await page.locator('#'+id).dispatchEvent('change');};
    const initial=await page.evaluate(()=>JSON.stringify(BiteStudio.getState()));
    await page.locator('#testSticker').click();await waitReady();
    assert.equal(await page.locator('#mockupEmpty').isVisible(),true);
    assert.equal(await page.locator('#mockupSave').isDisabled(),true);
    const photo=Buffer.from(await page.evaluate(()=>{const c=document.createElement('canvas');c.width=1200;c.height=800;const x=c.getContext('2d');x.fillStyle='#607080';x.fillRect(0,0,1200,800);return c.toDataURL('image/png').split(',')[1];}),'base64');
    const upload=async buffer=>{await page.locator('#mockupFile').setInputFiles({name:'background.png',mimeType:'image/png',buffer});await page.waitForFunction(()=>BiteStudio.mockup.getState().hasBackground&&!BiteStudio.mockup.getState().busy);};
    await upload(photo);assert.equal(await page.locator('#mockupStage').isVisible(),true);
    assert.equal(await page.locator('#mockupSize').textContent(),'1200 × 800 px');
    await edit('mockupScaleNumber',42);await edit('mockupAngleNumber',31);
    assert.equal((await state()).transform.scale,.42);assert.equal((await state()).transform.angle,31);
    let box=await page.locator('#mockupControls').boundingBox();
    await page.mouse.move(box.x+box.width/2,box.y+box.height/2);await page.mouse.down();await page.mouse.move(box.x+box.width*.65,box.y+box.height*.6,{steps:5});await page.mouse.up();
    let t=(await state()).transform;assert.ok(Math.abs(t.x-.65)<.01&&Math.abs(t.y-.6)<.01,'mouse drag moves merged sticker');
    const oldScale=t.scale;await page.mouse.wheel(0,-160);await page.waitForTimeout(100);assert.ok((await state()).transform.scale>oldScale);
    await page.locator('#mockupReset').click();await page.evaluate(()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r))));assert.equal((await state()).transform.angle,0);
    // Locate a scale corner from the selection drawing's green line bounds.
    const handles=await page.evaluate(()=>{const c=document.getElementById('mockupControls'),d=c.getContext('2d').getImageData(0,0,c.width,c.height).data,b=c.getBoundingClientRect();let x0=c.width,y0=c.height,x1=0,y1=0;for(let y=0;y<c.height;y++)for(let x=0;x<c.width;x++){let i=(y*c.width+x)*4;if(d[i]===39&&d[i+1]===100&&d[i+2]===83&&d[i+3]>240){x0=Math.min(x0,x);x1=Math.max(x1,x);y0=Math.min(y0,y);y1=Math.max(y1,y);}}return {left:b.left,top:b.top,x:(x1-6)*b.width/c.width,y:(y1-6)*b.height/c.height};});
    const beforeCorner=(await state()).transform.scale;
    await page.mouse.move(handles.left+handles.x,handles.top+handles.y);await page.mouse.down();await page.mouse.move(handles.left+handles.x+45,handles.top+handles.y+25,{steps:6});await page.mouse.up();
    assert.ok((await state()).transform.scale>beforeCorner,'corner scales merged sticker');
    await page.locator('#mockupReset').click();await page.evaluate(()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r))));
    // Gold rotation handle is centered above the unrotated selection.
    const rotation=await page.evaluate(()=>{const c=document.getElementById('mockupControls'),d=c.getContext('2d').getImageData(0,0,c.width,c.height).data,b=c.getBoundingClientRect();let x0=c.width,y0=c.height,x1=0,y1=0;for(let y=0;y<c.height;y++)for(let x=0;x<c.width;x++){const i=(y*c.width+x)*4;if(d[i]===255&&d[i+1]===244&&d[i+2]===220&&d[i+3]>240){x0=Math.min(x0,x);x1=Math.max(x1,x);y0=Math.min(y0,y);y1=Math.max(y1,y);}}return {x:b.left+(x0+x1)/2*b.width/c.width,y:b.top+(y0+y1)/2*b.height/c.height};});
    box=await page.locator('#mockupControls').boundingBox();
    await page.mouse.move(rotation.x,rotation.y);await page.mouse.down();await page.mouse.move(box.x+box.width*.8,box.y+box.height*.5,{steps:7});await page.mouse.up();
    assert.ok(Math.abs((await state()).transform.angle)>30,'handle rotates merged sticker');
    // Two real touch pointers exercise pinch scale, rotate, pan and pointer transitions.
    await page.locator('#mockupReset').click();await page.evaluate(()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r))));
    const cdp=await page.context().newCDPSession(page);
    const touch=async(type,points)=>cdp.send('Input.dispatchTouchEvent',{type,touchPoints:points.map(([id,x,y])=>({id,x,y,radiusX:2,radiusY:2,force:1}))});
    const cx=box.x+box.width/2,cy=box.y+box.height/2,prior=(await state()).transform.scale;
    await touch('touchStart',[[1,cx-35,cy],[2,cx+35,cy]]);
    await touch('touchMove',[[1,cx-60,cy-25],[2,cx+80,cy+35]]);
    await touch('touchEnd',[]);
    t=(await state()).transform;assert.ok(t.scale>prior*1.5);assert.ok(t.angle>10);assert.ok(t.x>.5);
    await edit('mockupScaleNumber',45);await edit('mockupAngleNumber',27);
    const [saved]=await Promise.all([page.waitForEvent('download'),page.locator('#mockupSave').click()]);const png=await readDownload(saved);
    const pixels=await page.evaluate(async base64=>{const im=await createImageBitmap(await(await fetch('data:image/png;base64,'+base64)).blob()),c=new OffscreenCanvas(im.width,im.height),x=c.getContext('2d');x.drawImage(im,0,0);const d=x.getImageData(0,0,c.width,c.height).data;let changed=0,handles=0,white=0;for(let i=0;i<d.length;i+=4){if(d[i]!==96||d[i+1]!==112||d[i+2]!==128)changed++;if(d[i]===39&&d[i+1]===100&&d[i+2]===83)handles++;if(d[i]===255&&d[i+1]===255&&d[i+2]===255)white++;}return {w:im.width,h:im.height,changed,handles,white,corner:[...d.slice(0,4)]};},png.toString('base64'));
    assert.equal(pixels.w,1200);assert.equal(pixels.h,800);assert.ok(pixels.changed>1000);assert.ok(pixels.white>100);assert.equal(pixels.handles,0);assert.deepEqual(pixels.corner,[96,112,128,255]);
    assert.equal(await page.evaluate(()=>JSON.stringify(BiteStudio.getState())),initial,'mockup leaves source workspace unchanged');
    // Invalid images preserve the previous usable background.
    await page.locator('#mockupFile').setInputFiles({name:'bad.txt',mimeType:'text/plain',buffer:Buffer.from('bad')});
    assert.ok((await page.locator('#mockupStatus').textContent()).includes('请选择'));
    await page.locator('#mockupFile').setInputFiles({name:'broken.png',mimeType:'image/png',buffer:Buffer.from('bad image')});
    await page.waitForFunction(()=>!BiteStudio.mockup.getState().busy);assert.equal((await state()).hasBackground,true);assert.equal(await page.locator('#mockupSave').isEnabled(),true);
    await page.locator('#mockupClose').click();
    await page.locator('#outlineColor').evaluate(el=>{el.value='#ff00ff';el.dispatchEvent(new Event('input'));el.dispatchEvent(new Event('change'));});
    await page.locator('#testSticker').click();await waitReady();
    assert.equal((await state()).hasBackground,true,'background persists when reopening');
    const magenta=await page.evaluate(()=>{const c=document.getElementById('mockupArt'),d=c.getContext('2d').getImageData(0,0,c.width,c.height).data;let n=0;for(let i=0;i<d.length;i+=4)if(d[i]>230&&d[i+1]<30&&d[i+2]>230)n++;return n;});assert.ok(magenta>10,'reopen renders updated outline');
    if(process.env.BITE_SCREENSHOT_DIR)await page.screenshot({path:path.join(process.env.BITE_SCREENSHOT_DIR,'mockup-desktop.png')});
    await page.setViewportSize({width:390,height:844});await page.waitForTimeout(150);
    assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);
    assert.equal(await page.locator('#mockupDialog').evaluate(el=>el.scrollWidth<=el.clientWidth),true);
    if(process.env.BITE_SCREENSHOT_DIR)await page.screenshot({path:path.join(process.env.BITE_SCREENSHOT_DIR,'mockup-mobile.png')});
    await page.locator('#mockupClose').click();await page.locator('#testSticker').click();await waitReady();
    // Escape closes modal and leaves editor interactive.
    await page.keyboard.press('Escape');assert.equal(await page.locator('#mockupDialog').isVisible(),false);
    // A new empty workspace must never reuse the previous merged sticker.
    const good=await page.evaluate(()=>({format:'bite-studio',version:1,state:BiteStudio.getState()}));
    const empty=JSON.parse(JSON.stringify(good));empty.state.object.x=3;empty.state.object.y=3;empty.state.mouth.visible=false;
    await page.locator('#projectFile').setInputFiles({name:'empty.bite',mimeType:'application/json',buffer:Buffer.from(JSON.stringify(empty))});
    await page.waitForFunction(()=>BiteStudio.getState().object.x===3);
    await page.locator('#testSticker').click();await page.waitForFunction(()=>!BiteStudio.mockup.getState().busy);
    assert.equal((await state()).hasSticker,false);assert.equal(await page.locator('#mockupSave').isDisabled(),true);
    assert.ok((await page.locator('#mockupStatus').textContent()).includes('没有可见贴纸'));
    await page.locator('#mockupClose').click();
    await page.locator('#projectFile').setInputFiles({name:'good.bite',mimeType:'application/json',buffer:Buffer.from(JSON.stringify(good))});
    await page.waitForFunction(()=>BiteStudio.getState().object.x!==3);
    // Closing during a slow snapshot invalidates it, including after reopening.
    await page.evaluate(()=>{window.originalDecode=BiteRenderer.decode;BiteRenderer.decode=async(...args)=>{await new Promise(r=>setTimeout(r,300));return originalDecode(...args);};});
    await page.locator('#testSticker').click();await page.locator('#mockupClose').click();await page.locator('#testSticker').click();await waitReady();
    await page.evaluate(()=>BiteRenderer.decode=originalDecode);
    assert.equal(await page.locator('#mockupSave').isEnabled(),true);
    await page.locator('#mockupClose').click();
    assert.deepEqual(errors,[]);console.log(JSON.stringify({passed:true,checks:'merged snapshot, upload, number controls, drag, wheel, corner scale, rotation handle, two-finger pinch, reset, export pixels, no controls in PNG, source isolation, invalid file recovery, refreshed snapshot, background reuse, mobile overflow, Escape, empty snapshot rejection, close/reopen cancellation, no browser errors',pixels}));
  }finally{await browser.close();server.close();}
}
run().catch(e=>{console.error(e);server.close();process.exitCode=1;});
