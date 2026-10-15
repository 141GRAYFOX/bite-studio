/* Bite Studio: no network service, no runtime dependencies. */
(async function () {
  'use strict';
  const $ = id => document.getElementById(id), R = window.BiteRenderer;
  document.querySelector('.workspace').inert=true;document.querySelector('.top-actions').inert=true;
  const icons = {
    upload:'M12 16V3m-5 5 5-5 5 5M3 15v5a1 1 0 0 0 1 1h16a1 1 0 0 0 1-1v-5',
    download:'M12 3v13m-5-5 5 5 5-5M3 17v4h18v-4', folder:'M3 7V4h7l2 3h9v13H3z',
    save:'M4 3h13l4 4v14H3V3h1m3 0v7h10V3M7 21v-7h10v7',
    undo:'M9 4 3 10l6 6M3 10h10a7 7 0 0 1 7 7v3', redo:'m15 4 6 6-6 6m6-6H11a7 7 0 0 0-7 7v3',
    flip:'M12 3v18M3 17 8 7v10zm18 0L16 7v10z', plus:'M12 5v14M5 12h14',
    spark:'m12 3 2.5 6.5L21 12l-6.5 2.5L12 21l-2.5-6.5L3 12l6.5-2.5z',
    move:'M12 2v20M2 12h20m-7-7-3-3-3 3m6 14-3 3-3-3M5 9l-3 3 3 3m14-6 3 3-3 3',check:'m5 12 4 4 10-10'
  };
  document.querySelectorAll('[data-icon]').forEach(e => { e.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="'+icons[e.dataset.icon]+'"/></svg>'; });
  const svgData = s => 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(s)));
  const samples = [
    { name:'奶油吐司', svg:'<svg xmlns="http://www.w3.org/2000/svg" width="900" height="880" viewBox="0 0 900 880"><defs><linearGradient id="b" x2="0" y2="1"><stop stop-color="#ffdf64"/><stop offset="1" stop-color="#ffb521"/></linearGradient></defs><path d="M150 55 Q450 5 725 85 Q845 120 835 250 L854 700 Q855 826 735 842 L184 850 Q65 850 65 709 L55 260 Q55 123 150 55Z" fill="url(#b)" stroke="#6b210f" stroke-width="18"/><path d="M160 52 Q444 5 714 79 Q813 108 817 220 L822 674 Q833 769 728 777 L219 792 Q137 790 134 681 L124 283 Q67 259 83 180 Q106 84 160 52Z" fill="#fff0d5" stroke="#762414" stroke-width="13"/><path d="M223 386 Q229 300 305 291 Q412 245 530 290 Q609 307 665 353 Q738 415 735 558 Q708 658 484 652 Q269 662 216 572 Q186 500 223 386Z" fill="#ffd432"/><path d="M264 354 Q243 280 303 285 L348 312 Q485 245 628 321 Q714 269 739 392 Q756 436 709 454 Q744 578 598 604 Q376 638 276 557 Q232 520 253 447 Q204 418 264 354Z" fill="#ffe260" stroke="#ee9000" stroke-width="11"/><path d="M465 321 Q541 293 553 350 Q518 443 589 462 Q668 466 710 451 Q746 577 598 604 Q376 638 276 557 Q232 520 253 447 Q307 493 411 468 Q492 439 465 321Z" fill="#ffd000"/><ellipse cx="413" cy="427" rx="13" ry="27" fill="#e68900" transform="rotate(8 413 427)"/><ellipse cx="563" cy="431" rx="12" ry="27" fill="#e68900"/><path d="m477 450 12 6m17 0 12-9m-18 27 3 37" stroke="#e68900" stroke-width="10" stroke-linecap="round"/><path d="M270 336q-26 22-17 37m37 114q-5 46 24 51m347 10-27 17" fill="none" stroke="#fffefa" stroke-width="15" stroke-linecap="round"/><g fill="#f4c48a"><ellipse cx="247" cy="192" rx="6" ry="12" transform="rotate(20 247 192)"/><ellipse cx="686" cy="214" rx="5" ry="10"/><ellipse cx="738" cy="697" rx="8" ry="15" transform="rotate(30 738 697)"/><ellipse cx="221" cy="723" rx="12" ry="5"/></g></svg>' },
    { name:'小鱼饼', svg:'<svg xmlns="http://www.w3.org/2000/svg" width="850" height="600" viewBox="0 0 850 600"><defs><linearGradient id="f" x2="0" y2="1"><stop stop-color="#ffc765"/><stop offset="1" stop-color="#e79a3f"/></linearGradient></defs><path d="M206 214Q327 71 527 192L752 107 704 301 764 486 533 406Q332 536 188 390L87 306Z" fill="url(#f)" stroke="#74401f" stroke-width="16" stroke-linejoin="round"/><path d="m460 196-99-72-23 89m100 212-78 62-26-62" fill="#edaf55" stroke="#74401f" stroke-width="12" stroke-linejoin="round"/><path d="M491 210q-44 86 0 183m-99-146 17 19-17 18m51 24 18 19-18 19m-60 17 17 19-17 18m234-150 61 77-61 71" fill="none" stroke="#cb8635" stroke-width="9" stroke-linecap="round"/><circle cx="261" cy="270" r="18" fill="#573824"/><circle cx="266" cy="263" r="6" fill="#fff4dd"/><path d="m204 327q26 22 44 0" fill="none" stroke="#74401f" stroke-width="8" stroke-linecap="round"/><ellipse cx="268" cy="319" rx="22" ry="10" fill="#ef9870"/></svg>' },
    { name:'星星糖', svg:'<svg xmlns="http://www.w3.org/2000/svg" width="620" height="950" viewBox="0 0 620 950"><path d="M314 490v402" stroke="#695344" stroke-width="40" stroke-linecap="round"/><path d="M314 490v402" stroke="#fff0cb" stroke-width="26" stroke-linecap="round"/><path d="m310 51 78 155 172 22-125 125 32 175-157-80-157 80 32-175L60 228l172-22Z" fill="#efaabb" stroke="#663e47" stroke-width="14" stroke-linejoin="round"/><path d="m310 94 58 140 142 17-106 88 32 139-126-70-126 70 32-139-106-88 142-17Z" fill="#f8c2c5"/><path d="m252 265 24-63" stroke="#fff7e4" stroke-width="20" stroke-linecap="round"/><circle cx="272" cy="329" r="10" fill="#694451"/><circle cx="352" cy="329" r="10" fill="#694451"/><path d="m297 360q15 19 30 0" fill="none" stroke="#694451" stroke-width="6" stroke-linecap="round"/></svg>' }
  ].map(x => ({name:x.name, src:svgData(x.svg)}));
  const defaults = () => ({ width:4003, height:3764, outline:14, outlineColor:'#ffffff', name:'奶油吐司', src:samples[0].src,bounds:null,
    object:{x:.5,y:.545,scale:.86,angle:0,flip:false}, mouth:{x:.5,y:.30,scale:.55,angle:0,weight:.023,color:'#5b140c',visible:true,bite:true,tooth:true} });
  let state = defaults(), image, selected = 'object', undo = [], redo = [], savedSignature = '', toastTimer, saveTimer, previewTimer;
  let db, autosaveChain = Promise.resolve(), renderSerial = 0, worker, exporting = false, exportToken = 0;
  let framePending = false, busyPreview = false, pendingPreview = false;
  let initialized=false,moveTogether=false;
  const individualHint=$('gestureHint').innerHTML;
  let thumbnailSource='',thumbnailBounds='';
  let boundsCacheSource='',boundsCache;
  let ratio = state.width / state.height;
  const clone = s => ({...s,bounds:s.bounds?{...s.bounds}:null,object:{...s.object},mouth:{...s.mouth}});
  const clamp = (v,a,b) => Math.min(b,Math.max(a,v));
  const snapshot = () => JSON.stringify(state);
  function toast(message) { $('toast').textContent=message; $('toast').classList.add('show'); clearTimeout(toastTimer); toastTimer=setTimeout(()=>$('toast').classList.remove('show'),4800); }
  function ask({title,description,value,confirmText='暂存'}) {return new Promise(resolve=>{const dialog=$('studioDialog');$('dialogTitle').textContent=title;$('dialogDescription').textContent=description;$('dialogName').hidden=value===undefined;$('dialogName').value=value||'';$('dialogConfirm').textContent=confirmText;let done=false;const finish=result=>{if(done)return;done=true;dialog.close();resolve(result);};$('dialogCancel').onclick=()=>finish(null);dialog.oncancel=e=>{e.preventDefault();finish(null);};$('dialogForm').onsubmit=e=>{e.preventDefault();const name=$('dialogName').value.trim();if(value!==undefined&&!name){$('dialogName').focus();return;}finish(value===undefined?true:name);};dialog.showModal();if(value!==undefined){$('dialogName').focus();$('dialogName').select();}});}
  function remember() { const s=snapshot(); if (undo[undo.length-1]!==s) undo.push(s); if(undo.length>40) undo.shift(); redo=[]; historyButtons(); }
  function historyButtons() { $('undo').disabled=!undo.length; $('redo').disabled=!redo.length; }
  function sync() {
    const t = state[selected]; $('settingsTitle').textContent = selected==='object'?'物品调整':'嘴部调整';
    $('settingsHelp').textContent = selected==='object'?'在画布上直接拖拽，也可以精确输入。':'拖拽嘴线位置，调节嘴的大小和角度。';
    $('objectLayer').classList.toggle('active',selected==='object'); $('mouthLayer').classList.toggle('active',selected==='mouth');
    $('selectionLabel').textContent=moveTogether?'整体移动：物品 + 嘴部':'正在调整：'+(selected==='object'?'物品':'嘴部');
    $('moveTogether').setAttribute('aria-pressed',String(moveTogether));
    if(moveTogether)$('settingsHelp').textContent='画布拖拽同时移动物品与嘴部；右侧参数仍单独调整当前图层。';
    $('gestureHint').innerHTML=moveTogether?'整体移动已开启 · 拖动画布或双指平移 · 方向键微调 · 关闭后单独调整':individualHint;
    $('gestureHint').title=moveTogether?'嘴部与物品保持相对位置，整张贴纸一起平移':'按住 Alt 在画布任意位置拖动旋转；Alt + 滚轮缩放';
    $('controls').setAttribute('aria-label',moveTogether?'整体移动画布，拖拽同时移动嘴部和物品':'编辑画布，拖拽物品，四角缩放，四个金色手柄旋转，旋转手柄始终位于画布内');
    $('scale').min=Math.min(5,t.scale*100);$('scale').max=Math.max(180,t.scale*100);$('scale').step=.1;$('scale').value=t.scale*100; $('scaleValue').value=(t.scale*100).toFixed(1)+'%'; $('angle').value=t.angle;
    if(document.activeElement!==$('angleNumber'))$('angleNumber').value=t.angle.toFixed(1); $('angleValue').value=t.angle.toFixed(1)+'°';
    if(document.activeElement!==$('posX'))$('posX').value=(t.x*100).toFixed(1); if(document.activeElement!==$('posY'))$('posY').value=(t.y*100).toFixed(1);
    $('outline').value=state.outline; $('outlineValue').value=state.outline+' px'; $('outlineColor').value=state.outlineColor;
    $('width').value=state.width; $('height').value=state.height; $('resolutionLabel').textContent=state.width+' × '+state.height+' px';
    $('mouthVisible').checked=state.mouth.visible; $('bite').checked=state.mouth.bite; $('tooth').checked=state.mouth.tooth;
    $('mouthColor').value=state.mouth.color; $('mouthWeight').value=state.mouth.weight; $('flip').disabled=selected!=='object';
    $('sourceName').textContent=state.name; const cropKey=JSON.stringify(state.bounds);
    $('upload').title=state.bounds?'原图 '+image.width+' × '+image.height+'，有效物品 '+state.bounds.width+' × '+state.bounds.height:'';
    $('boundsInfo').textContent=state.bounds?'物品范围 '+state.bounds.width+' × '+state.bounds.height+' px':'内置矢量素材';
    $('tightenBounds').disabled=state.src.startsWith('data:image/svg+xml');
    if(thumbnailSource!==state.src||thumbnailBounds!==cropKey){thumbnailSource=state.src;thumbnailBounds=cropKey;const thumb=document.createElement('canvas');thumb.width=thumb.height=76;thumb.style.width=thumb.style.height='100%';thumb.setAttribute('aria-label',state.name);const b=R.crop(state,image),fit=Math.min(70/b.width,70/b.height);thumb.getContext('2d').drawImage(image,b.x,b.y,b.width,b.height,(76-b.width*fit)/2,(76-b.height*fit)/2,b.width*fit,b.height*fit);$('sourceThumb').replaceChildren(thumb);}
    document.querySelectorAll('.sample').forEach((e,i)=>e.classList.toggle('selected',state.src===samples[i].src)); historyButtons();
  }
  function changed() { sync(); schedule(); queueSave(); }
  function select(layer) { selected=layer; sync(); drawControls(); }
  function sizeStage() {
    $('stageWrap').style.setProperty('--canvas-ratio',state.width+'/'+state.height);
    const box=$('stageWrap').getBoundingClientRect(); const fit=Math.min(box.width/state.width,box.height/state.height);
    const w=Math.max(1,Math.floor(state.width*fit)),h=Math.max(1,Math.floor(state.height*fit));
    $('stage').style.width=w+'px';$('stage').style.height=h+'px';
    const density=Math.min(window.devicePixelRatio||1,1.5,850/Math.max(w,h));
    for(const id of ['art','controls']) { $(id).width=Math.round(w*density);$(id).height=Math.round(h*density); }
    schedule();
  }
  function schedule() {
    renderSerial++;
    if(!framePending) { framePending=true;requestAnimationFrame(()=>{framePending=false;if(!image)return;R.paint($('art').getContext('2d'),state,image,$('art').width,$('art').height);drawControls();}); }
    clearTimeout(previewTimer);previewTimer=setTimeout(refinePreview,110);
  }
  async function refinePreview() {
    if(!image)return;if(busyPreview){pendingPreview=true;return;}busyPreview=true;
    const serial=renderSerial,s=clone(state);
    try { const c=await R.render(s,image,{width:$('art').width,height:$('art').height,preview:true});
      if(serial===renderSerial){const ctx=$('art').getContext('2d');ctx.clearRect(0,0,$('art').width,$('art').height);ctx.drawImage(c,0,0);} c.width=c.height=1;
    }catch(e){console.error('Preview render failed',e);}finally{busyPreview=false;if(pendingPreview){pendingPreview=false;refinePreview();}}
  }
  function geometry(layer=selected) {
    const t=state[layer],b=$('stage').getBoundingClientRect(),mw=t.scale*b.width;
    const visible=R.crop(state,image),w=mw,h=layer==='object'?mw*visible.height/visible.width:mw*.35;
    const cx=t.x*b.width,cy=t.y*b.height,a=t.angle*Math.PI/180;
    const point=(x,y)=>({x:cx+x*Math.cos(a)-y*Math.sin(a),y:cy+x*Math.sin(a)+y*Math.cos(a)});
    const corners=[point(-w/2,-h/2),point(w/2,-h/2),point(w/2,h/2),point(-w/2,h/2)];
    const anchors=[point(0,-h/2),point(w/2,0),point(0,h/2),point(-w/2,0)];
    const raw=[point(0,-h/2-27),point(w/2+27,0),point(0,h/2+27),point(-w/2-27,0)];
    const rotations=raw.map((p,i)=>{let x=clamp(p.x,13,b.width-13),y=clamp(p.y,13,b.height-13);
      // Keep rotation targets away from the small scale handles at the corners.
      if(corners.some(c=>dist({x,y},c)<23)){if(i%2===0)x=clamp(x+27,13,b.width-13);else y=clamp(y+27,13,b.height-13);}
      return{x,y,anchor:anchors[i]};});
    return{cx,cy,w,h,point,corners,rotations};
  }
  function drawControls() {
    if(!image)return;const c=$('controls'),ctx=c.getContext('2d'),b=c.getBoundingClientRect(),g=geometry();ctx.clearRect(0,0,c.width,c.height);ctx.save();ctx.scale(c.width/b.width,c.height/b.height);
    if(moveTogether){
      const points=[...geometry('object').corners,...(state.mouth.visible?geometry('mouth').corners:[])];
      const left=Math.min(...points.map(p=>p.x)),top=Math.min(...points.map(p=>p.y)),right=Math.max(...points.map(p=>p.x)),bottom=Math.max(...points.map(p=>p.y));
      ctx.strokeStyle='#488871';ctx.lineWidth=1.5;ctx.setLineDash([6,4]);ctx.strokeRect(left,top,right-left,bottom-top);ctx.setLineDash([]);
      ctx.fillStyle='#488871';ctx.beginPath();ctx.arc((left+right)/2,(top+bottom)/2,3,0,Math.PI*2);ctx.fill();ctx.restore();return;
    }
    ctx.strokeStyle='#488871';ctx.lineWidth=1;ctx.setLineDash([5,4]);ctx.beginPath();g.corners.forEach((p,i)=>i?ctx.lineTo(p.x,p.y):ctx.moveTo(p.x,p.y));ctx.closePath();ctx.stroke();ctx.setLineDash([]);
    for(const p of g.corners) {ctx.beginPath();ctx.arc(p.x,p.y,5.5,0,Math.PI*2);ctx.fillStyle='#fffdf8';ctx.fill();ctx.lineWidth=1.5;ctx.stroke();}
    for(const p of g.rotations){ctx.strokeStyle='#b38b4e';ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(p.anchor.x,p.anchor.y);ctx.lineTo(p.x,p.y);ctx.stroke();ctx.beginPath();ctx.arc(p.x,p.y,10,0,Math.PI*2);ctx.fillStyle='#fff4dc';ctx.fill();ctx.stroke();ctx.lineWidth=1.3;ctx.beginPath();ctx.arc(p.x,p.y,4.3,.3,5.5);ctx.stroke();ctx.beginPath();ctx.moveTo(p.x+4,p.y-4);ctx.lineTo(p.x+4,p.y-.5);ctx.lineTo(p.x+.5,p.y-1.5);ctx.stroke();}
    ctx.fillStyle='#488871';ctx.beginPath();ctx.arc(g.cx,g.cy,2.5,0,Math.PI*2);ctx.fill();ctx.restore();
  }
  $('objectLayer').onclick=()=>select('object');$('mouthLayer').onclick=()=>select('mouth');$('fit').onclick=sizeStage;
  $('moveTogether').onclick=()=>{moveTogether=!moveTogether;sync();drawControls();};
  function moveSticker(original,dx,dy){
    // Clamp one shared translation so both layers retain their relative position.
    dx=clamp(dx,Math.max(-1-original.object.x,-1-original.mouth.x),Math.min(2-original.object.x,2-original.mouth.x));
    dy=clamp(dy,Math.max(-1-original.object.y,-1-original.mouth.y),Math.min(2-original.object.y,2-original.mouth.y));
    for(const layer of ['object','mouth']){state[layer].x=original[layer].x+dx;state[layer].y=original[layer].y+dy;}
  }
  const pointers=new Map();let gesture;
  function coords(e) {const b=$('controls').getBoundingClientRect();return{x:e.clientX-b.left,y:e.clientY-b.top};}
  const dist=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y),ang=(a,b)=>Math.atan2(b.y-a.y,b.x-a.x);
  function startGesture(p,forceRotate=false) {
    if(moveTogether){gesture={mode:'group',start:p,original:clone(state)};return;}
    const g=geometry(),t=clone(state)[selected];let mode='move';
    if(forceRotate||g.rotations.some(r=>dist(p,r)<19))mode='rotate';else if(g.corners.some(c=>dist(p,c)<20))mode='scale';
    gesture={mode,start:p,original:t,cx:g.cx,cy:g.cy,angle:ang({x:g.cx,y:g.cy},p),distance:Math.max(10,dist(p,{x:g.cx,y:g.cy}))};
  }
  function beginPinch() {const[a,b]=[...pointers.values()];gesture={mode:moveTogether?'groupPinch':'pinch',original:moveTogether?clone(state):{...state[selected]},distance:Math.max(10,dist(a,b)),angle:ang(a,b),mid:{x:(a.x+b.x)/2,y:(a.y+b.y)/2}};}
  const controls=$('controls');
  controls.onpointerdown=e=>{if(exporting||pointers.size>=2)return;e.preventDefault();controls.focus({preventScroll:true});controls.setPointerCapture(e.pointerId);if(!pointers.size)remember();pointers.set(e.pointerId,coords(e));if(pointers.size===1)startGesture(coords(e),e.altKey);else if(pointers.size===2)beginPinch();};
  controls.onpointermove=e=>{if(!pointers.has(e.pointerId)||!gesture)return;pointers.set(e.pointerId,coords(e));const p=coords(e),t=state[selected],o=gesture.original,b=controls.getBoundingClientRect();
    if(gesture.mode==='group')moveSticker(o,(p.x-gesture.start.x)/b.width,(p.y-gesture.start.y)/b.height);
    else if(gesture.mode==='groupPinch'&&pointers.size>=2){const[a,z]=[...pointers.values()];moveSticker(o,((a.x+z.x)/2-gesture.mid.x)/b.width,((a.y+z.y)/2-gesture.mid.y)/b.height);}
    else if(gesture.mode==='pinch'&&pointers.size>=2){const[a,z]=[...pointers.values()];t.scale=clamp(o.scale*dist(a,z)/gesture.distance,.05,1.8);t.angle=normalizeAngle(o.angle+(ang(a,z)-gesture.angle)*180/Math.PI);t.x=clamp(o.x+((a.x+z.x)/2-gesture.mid.x)/b.width,-1,2);t.y=clamp(o.y+((a.y+z.y)/2-gesture.mid.y)/b.height,-1,2);}
    else if(gesture.mode==='move'){t.x=clamp(o.x+(p.x-gesture.start.x)/b.width,-1,2);t.y=clamp(o.y+(p.y-gesture.start.y)/b.height,-1,2);}
    else if(gesture.mode==='scale')t.scale=clamp(o.scale*dist(p,{x:gesture.cx,y:gesture.cy})/gesture.distance,.05,1.8);
    else if(gesture.mode==='rotate')t.angle=normalizeAngle(o.angle+(ang({x:gesture.cx,y:gesture.cy},p)-gesture.angle)*180/Math.PI);
    sync();schedule();};
  function endPointer(e) {pointers.delete(e.pointerId);if(pointers.size===1)startGesture([...pointers.values()][0]);else if(!pointers.size){gesture=null;queueSave();}}
  controls.onpointerup=endPointer;controls.onpointercancel=endPointer;controls.onlostpointercapture=e=>{if(pointers.has(e.pointerId))endPointer(e);};
  function normalizeAngle(a){return ((a+180)%360+360)%360-180;}
  let wheelActive=false,wheelTimer;
  controls.addEventListener('wheel',e=>{if(!e.altKey||moveTogether)return;e.preventDefault();if(!wheelActive){remember();wheelActive=true;}state[selected].scale=clamp(state[selected].scale*Math.exp(-e.deltaY*.001),.05,1.8);changed();clearTimeout(wheelTimer);wheelTimer=setTimeout(()=>wheelActive=false,220);},{passive:false});
  function bindRange(id,apply) {let active=false;$(id).addEventListener('input',()=>{if(!active){remember();active=true;}apply(Number($(id).value));changed();});$(id).addEventListener('change',()=>active=false);$(id).addEventListener('blur',()=>active=false);}
  bindRange('scale',v=>state[selected].scale=v/100);bindRange('angle',v=>state[selected].angle=v);bindRange('outline',v=>state.outline=v);bindRange('mouthWeight',v=>state.mouth.weight=v);
  for(const[id,key]of[['posX','x'],['posY','y'],['angleNumber','angle']]){
    let editing=false;const commit=()=>{if($(id).value==='')return;const v=Number($(id).value);if(!Number.isFinite(v))return;const next=key==='angle'?clamp(v,-180,180):clamp(v/100,-1,2);if(next===state[selected][key])return;if(!editing){remember();editing=true;}state[selected][key]=next;changed();};
    $(id).oninput=commit;$(id).onchange=commit;$(id).onblur=()=>{commit();editing=false;sync();};
  }
  for(const[id,key]of[['mouthVisible','visible'],['bite','bite'],['tooth','tooth']])$(id).onchange=()=>{remember();state.mouth[key]=$(id).checked;changed();};
  $('mouthColor').onchange=()=>{remember();state.mouth.color=$('mouthColor').value;changed();};
  let editingOutlineColor=false;
  $('outlineColor').oninput=()=>{if(!editingOutlineColor){remember();editingOutlineColor=true;}state.outlineColor=$('outlineColor').value;changed();};
  $('outlineColor').onchange=()=>{if(state.outlineColor!==$('outlineColor').value)$('outlineColor').oninput();editingOutlineColor=false;};
  $('outlineColor').onblur=()=>editingOutlineColor=false;
  $('flip').onclick=()=>{remember();state.object.flip=!state.object.flip;changed();};
  $('resetTransform').onclick=()=>{remember();state[selected]={...state[selected],...defaults()[selected]};changed();};
  function validSize(w,h) {return Number.isInteger(w)&&Number.isInteger(h)&&w>=64&&h>=64&&w<=8192&&h<=8192&&w*h<=24000000;}
  function resize(w,h) {if(!validSize(w,h)){toast('尺寸需要在 64–8192 像素之间，总像素不能超过 2400 万。');sync();return;}if(w===state.width&&h===state.height)return;remember();state.width=w;state.height=h;ratio=w/h;changed();sizeStage();}
  $('width').onchange=()=>{const w=Math.round(Number($('width').value));resize(w,$('lockRatio').checked?Math.round(w/ratio):state.height);};
  $('height').onchange=()=>{const h=Math.round(Number($('height').value));resize($('lockRatio').checked?Math.round(h*ratio):state.width,h);};
  $('width').onblur=$('width').onchange;$('height').onblur=$('height').onchange;
  $('lockRatio').onchange=()=>ratio=state.width/state.height;
  $('originalSize').onclick=()=>resize(4003,3764);
  $('sizePreset').onchange=()=>{const v=$('sizePreset').value;if(v==='original')resize(4003,3764);else if(v==='square')resize(2048,2048);else if(v)resize(Number(v),Math.round(Number(v)/ratio));};
  document.querySelectorAll('[data-bg]').forEach(b=>b.onclick=()=>{document.querySelectorAll('[data-bg]').forEach(e=>e.classList.toggle('selected',e===b));$('stage').className='stage '+b.dataset.bg;});
  let loadSerial=0;
  async function load(s,{track=true,decoded,fitObject=false}={}) {
    const serial=++loadSerial,next=decoded||await R.decode(s.src);
    if(serial!==loadSerial){if(next.close)next.close();return;}
    if(next.width*next.height>50000000||next.width>16384||next.height>16384){if(next.close)next.close();throw new Error('素材分辨率过大，请先缩小图片。');}
    const prepared=clone(s);if(prepared.outlineColor===undefined)prepared.outlineColor=defaults().outlineColor;
    try{
      const before=R.crop(prepared,next);
      if(before.x<0||before.y<0||before.width<1||before.height<1||before.x+before.width>next.width||before.y+before.height>next.height)throw new Error('工程中的素材边界无效。');
      if(!prepared.src.startsWith('data:image/svg+xml')){
        if(boundsCacheSource!==prepared.src){const detected=await R.visibleBounds(next);boundsCacheSource=prepared.src;boundsCache=detected;}
        if(fitObject)prepared.bounds={...boundsCache};else R.reframeBounds(prepared,next,boundsCache);
      }
      const b=R.crop(prepared,next);
      if(b.x<0||b.y<0||b.width<1||b.height<1||b.x+b.width>next.width||b.y+b.height>next.height)throw new Error('工程中的素材边界无效。');
      if(fitObject)prepared.object.scale=clamp(Math.min(.86,.84*prepared.height/prepared.width*b.width/b.height),.05,1.8);
    }catch(e){if(next.close)next.close();throw e;}
    if(serial!==loadSerial){if(next.close)next.close();return;}
    if(track)remember();if(image&&image.close)image.close();image=next;state=prepared;ratio=state.width/state.height;selected='object';changed();sizeStage();
  }
  for(const sample of samples){const b=document.createElement('button');b.className='sample';b.title='使用'+sample.name;const img=Object.assign(document.createElement('img'),{src:sample.src,alt:sample.name});b.append(img,document.createTextNode(sample.name));b.onclick=()=>load({...clone(state),name:sample.name,src:sample.src,bounds:null,object:{...defaults().object}}).catch(e=>toast(e.message));$('samples').append(b);}
  $('upload').onclick=()=>$('imageFile').click();
  $('tightenBounds').onclick=async()=>{
    if(exporting||!image)return;const source=state.src,current=image;
    $('tightenBounds').disabled=true;
    try{const bounds=await R.visibleBounds(current);if(state.src!==source||image!==current)return;
      const next=clone(state);R.reframeBounds(next,image,bounds);remember();state=next;boundsCacheSource=source;boundsCache=bounds;moveTogether=false;selected='object';changed();
      toast('物品选框已收紧到可见像素范围，原素材完整保留。');
    }catch(e){toast(e.message);}finally{sync();}
  };
  const readData=file=>new Promise((resolve,reject)=>{const r=new FileReader();r.onload=()=>resolve(r.result);r.onerror=()=>reject(new Error('文件读取失败'));r.readAsDataURL(file);});
  async function upload(file) {
    if(!file)return;if(!['image/png','image/webp','image/jpeg'].includes(file.type))throw new Error('请选择 PNG、WebP 或 JPEG 图片；透明素材推荐 PNG。');
    if(file.size>30*1024*1024)throw new Error('素材请控制在 30 MB 以内。');
    const src=await readData(file),test=await R.decode(src);
    if(test.width*test.height>50000000||test.width>16384||test.height>16384){if(test.close)test.close();throw new Error('素材分辨率过大，请先缩小至 5000 万像素以内。');}
    const c=R.canvas(80,80),ctx=c.getContext('2d',{willReadFrequently:true});ctx.drawImage(test,0,0,80,80);const p=ctx.getImageData(0,0,80,80).data;let transparent=false;for(let i=3;i<p.length;i+=4)if(p[i]<250){transparent=true;break;}
    await load({...clone(state),src,bounds:null,name:file.name.replace(/\.[^.]+$/,''),object:{...defaults().object}},{decoded:test,fitObject:true});
    toast(transparent?'素材已添加，已自动收紧到非透明物品边界。':'这张图片没有检测到透明背景，导出时会保留它的背景。建议使用已抠图的 PNG。');
  }
  $('imageFile').onchange=async e=>{try{await upload(e.target.files[0]);}catch(e){toast(e.message);}finally{$('imageFile').value='';}};
  let dragCount=0;
  document.addEventListener('dragenter',e=>{if(e.dataTransfer.types.includes('Files')){e.preventDefault();dragCount++;$('dropOverlay').classList.add('show');}});
  document.addEventListener('dragleave',()=>{if(--dragCount<=0){dragCount=0;$('dropOverlay').classList.remove('show');}});
  document.addEventListener('dragover',e=>{if(e.dataTransfer.types.includes('Files'))e.preventDefault();});
  document.addEventListener('drop',async e=>{e.preventDefault();dragCount=0;$('dropOverlay').classList.remove('show');try{const f=e.dataTransfer.files[0];if(f&&/\.(bite|json)$/i.test(f.name))await openProject(f);else await upload(f);}catch(e){toast(e.message);}});
  async function restoreHistory(from,to) {if(!from.length)return;const raw=from.pop();to.push(snapshot());try{await load(JSON.parse(raw),{track:false});}catch(e){from.push(raw);to.pop();toast(e.message);}historyButtons();}
  $('undo').onclick=()=>restoreHistory(undo,redo);$('redo').onclick=()=>restoreHistory(redo,undo);
  document.addEventListener('keydown',e=>{if(/INPUT|TEXTAREA|SELECT/.test(e.target.tagName)||exporting)return;if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==='z'){e.preventDefault();e.shiftKey?$('redo').click():$('undo').click();}
    else if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==='s'){e.preventDefault();$('saveProject').click();}
    else if(['ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].includes(e.key)){e.preventDefault();if(!e.repeat)remember();const v=(e.shiftKey?10:1),dx=(e.key==='ArrowLeft'?-v:e.key==='ArrowRight'?v:0)/state.width,dy=(e.key==='ArrowUp'?-v:e.key==='ArrowDown'?v:0)/state.height;if(moveTogether)moveSticker(clone(state),dx,dy);else{state[selected].x=clamp(state[selected].x+dx,-1,2);state[selected].y=clamp(state[selected].y+dy,-1,2);}changed();}});
  const dbPromise=new Promise((resolve,reject)=>{if(!window.indexedDB){reject(new Error('当前浏览器不支持暂存'));return;}const req=indexedDB.open('BiteStudio',1);req.onupgradeneeded=()=>{req.result.createObjectStore('projects',{keyPath:'id'});};req.onsuccess=()=>{db=req.result;resolve(db);};req.onerror=()=>reject(req.error);});
  function transaction(mode,operation) {return dbPromise.then(db=>new Promise((resolve,reject)=>{const tx=db.transaction('projects',mode),store=tx.objectStore('projects');let result;const req=operation(store);if(req)req.onsuccess=()=>result=req.result;tx.oncomplete=()=>resolve(result);tx.onerror=()=>reject(tx.error);tx.onabort=()=>reject(tx.error||new Error('暂存未完成'));}));}
  function queueSave() {if(!initialized)return;clearTimeout(saveTimer);$('saveStatus').textContent='等待自动暂存…';saveTimer=setTimeout(()=>{const s=clone(state),signature=JSON.stringify(s);if(signature===savedSignature){$('saveStatus').textContent='已自动暂存';return;}
    autosaveChain=autosaveChain.catch(()=>{}).then(()=>transaction('readwrite',st=>st.put({id:'autosave',state:s,updated:Date.now()}))).then(()=>{savedSignature=signature;$('saveStatus').textContent='已自动暂存';}).catch(()=>{$('saveStatus').textContent='暂存不可用，请保存工程文件';});},650);}
  async function refreshDrafts(){try{const list=(await transaction('readonly',st=>st.getAll())).filter(x=>x.id!=='autosave').sort((a,b)=>b.updated-a.updated);$('drafts').replaceChildren();
    if(!list.length){const p=document.createElement('p');p.className='empty';p.textContent='留住每一个好点子。暂存后可继续编辑。';$('drafts').append(p);}
    for(const d of list){const card=document.createElement('div');card.className='draft-card';const button=document.createElement('button'),img=Object.assign(document.createElement('img'),{src:d.thumbnail,alt:d.name}),title=document.createElement('strong'),time=document.createElement('small');title.textContent=d.name;time.textContent=new Date(d.updated).toLocaleDateString('zh-CN');button.append(img,title,time);button.onclick=()=>load(d.state).then(()=>toast('已打开暂存：'+d.name)).catch(e=>toast(e.message));const del=document.createElement('button');del.className='draft-delete';del.textContent='×';del.title='删除这份暂存';del.setAttribute('aria-label','删除暂存 '+d.name);del.onclick=async()=>{if(!await ask({title:'删除这份暂存？',description:'「'+d.name+'」将从暂存列表移除，当前画布仍会保留。',confirmText:'删除暂存'}))return;try{await transaction('readwrite',st=>st.delete(d.id));refreshDrafts();}catch(e){toast('删除失败：'+e.message);}};card.append(button,del);$('drafts').append(card);}
  }catch(_){$('saveStatus').textContent='暂存不可用，请保存工程文件';}}
  $('saveDraft').onclick=async()=>{const name=await ask({title:'留住这个好点子',description:'保留原素材和所有参数，随时继续编辑。',value:state.name+' · '+new Date().toLocaleTimeString('zh-CN',{hour:'2-digit',minute:'2-digit'})});if(!name)return;const s=clone(state);try{const c=await R.render(s,image,{width:220,height:Math.round(220*s.height/s.width),preview:true});const thumb=await readData(await R.blob(c));c.width=c.height=1;await transaction('readwrite',st=>st.put({id:'draft-'+Date.now()+'-'+Math.random().toString(36).slice(2),name:name.slice(0,80),state:s,thumbnail:thumb,updated:Date.now()}));await refreshDrafts();toast('已暂存，可随时点击缩略图继续编辑。');}catch(e){toast('暂存失败，请通过「保存工程」保存到文件。');}};
  function filename(suffix) {return (state.name||'贴纸').replace(/[\\/:*?"<>|]/g,'_').slice(0,80)+suffix;}
  async function download(blob,name) {
    if(/Android|iPhone|iPad/.test(navigator.userAgent)&&navigator.canShare&&navigator.share){const f=new File([blob],name,{type:blob.type});if(navigator.canShare({files:[f]})){try{await navigator.share({files:[f],title:name});return;}catch(e){if(e.name==='AbortError')return;}}}
    const a=document.createElement('a'),url=URL.createObjectURL(blob);a.href=url;a.download=name;document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),60000);
  }
  $('saveProject').onclick=()=>download(new Blob([JSON.stringify({format:'bite-studio',version:1,state},null,2)],{type:'application/json'}),filename('.bite')).catch(e=>toast(e.message));
  function validateProject(value) {
    if(!value||value.format!=='bite-studio'||value.version!==1)throw new Error('这不是支持的 Bite Studio 工程文件（版本 1）。');
    const s=value.state;if(!s||!validSize(s.width,s.height))throw new Error('工程尺寸无效。');
    if(typeof s.src!=='string'||s.src.length>45000000||!/^data:image\/(png|webp|jpeg|svg\+xml);base64,/.test(s.src))throw new Error('工程中的图片无效。');
    // Reject user SVG from project files: only the exact built-in vectors are trusted.
    if(s.src.startsWith('data:image/svg+xml')&&!samples.some(x=>x.src===s.src))throw new Error('外部工程中的 SVG 不受支持，请改用透明 PNG。');
    const d=defaults();for(const layer of ['object','mouth']){const t=s[layer];if(!t)throw new Error('工程缺少图层参数。');for(const key of ['x','y','scale','angle'])if(!Number.isFinite(t[key]))throw new Error('工程含无效变换。');const isObject=layer==='object';if(t.x < (isObject?-2:-1)||t.x>(isObject?3:2)||t.y < (isObject?-2:-1)||t.y>(isObject?3:2)||t.scale<(isObject?.000001:.05)||t.scale>(isObject?4:1.8)||t.angle < -180||t.angle>180)throw new Error('工程变换超出支持范围。');d[layer]={...d[layer],x:t.x,y:t.y,scale:t.scale,angle:t.angle};}
    if(!Number.isFinite(s.outline)||s.outline<0||s.outline>80)throw new Error('描边参数无效。');
    if(s.outlineColor!==undefined&&(typeof s.outlineColor!=='string'||!/^#[0-9a-f]{6}$/i.test(s.outlineColor)))throw new Error('描边颜色无效。');
    if(!/^#[0-9a-f]{6}$/i.test(s.mouth.color)||!Number.isFinite(s.mouth.weight)||s.mouth.weight<.005||s.mouth.weight>.06)throw new Error('嘴部参数无效。');
    for(const key of ['visible','bite','tooth'])d.mouth[key]=!!s.mouth[key];d.mouth.color=s.mouth.color;d.mouth.weight=s.mouth.weight;d.object.flip=!!s.object.flip;
    let bounds=null;if(s.bounds){const b=s.bounds;for(const key of ['x','y','width','height'])if(!Number.isInteger(b[key]))throw new Error('工程素材边界无效。');if(b.x<0||b.y<0||b.width<1||b.height<1||b.x+b.width>16384||b.y+b.height>16384)throw new Error('工程素材边界超出范围。');bounds={x:b.x,y:b.y,width:b.width,height:b.height};}
    return {...d,width:s.width,height:s.height,outline:s.outline,outlineColor:s.outlineColor===undefined?d.outlineColor:s.outlineColor,name:String(s.name||'导入作品').slice(0,160),src:s.src,bounds};
  }
  async function openProject(file){if(!file)return;if(file.size>48*1024*1024)throw new Error('工程文件过大。');let json;try{json=JSON.parse(await file.text());}catch(_){throw new Error('工程文件无法解析。');}await load(validateProject(json));toast('工程已恢复，原素材与全部参数均可继续调整。');}
  $('openProject').onclick=()=>$('projectFile').click();$('projectFile').onchange=async e=>{try{await openProject(e.target.files[0]);}catch(e){toast(e.message);}finally{$('projectFile').value='';}};
  $('newProject').onclick=()=>load(defaults()).then(()=>toast('已新建作品，之前的画布可通过撤销找回。'));
  function makeWorker() {
    const source='self.R=('+window.BiteRendererFactory.toString()+')();self.onmessage=async function(e){try{const image=e.data.image;const c=await R.render(e.data.state,image,{progress:function(p){self.postMessage({progress:p});}});const b=await R.blob(c);image.close();c.width=c.height=1;self.postMessage({blob:b});}catch(e){self.postMessage({error:e.message});}}';
    const url=URL.createObjectURL(new Blob([source],{type:'text/javascript'}));try{return new Worker(url);}finally{URL.revokeObjectURL(url);}
  }
  function progress(p){$('progressText').textContent=p<90?'渲染透明轮廓与平滑描边… '+p+'%':'正在编码 PNG…';}
  async function exportImage() {
    if(exporting||!image)return;exporting=true;const token=++exportToken,s=clone(state);$('exportProgress').hidden=false;$('export').disabled=true;progress(0);
    try{
      let blob;
      if(typeof Worker!=='undefined'&&typeof OffscreenCanvas!=='undefined'&&typeof createImageBitmap==='function'){
        try{const bitmap=await createImageBitmap(image);worker=makeWorker();blob=await new Promise((resolve,reject)=>{worker.onmessage=e=>{if(e.data.blob)resolve(e.data.blob);else if(e.data.error)reject(new Error(e.data.error));else progress(e.data.progress);};worker.onerror=()=>reject(new Error('后台渲染不可用'));worker.postMessage({state:s,image:bitmap},[bitmap]);});}
        catch(e){if(token!==exportToken)return;if(worker)worker.terminate();worker=null;const c=await R.render(s,image,{cooperative:true,progress,cancelled:()=>token!==exportToken});blob=await R.blob(c);c.width=c.height=1;}
      }else{const c=await R.render(s,image,{cooperative:true,progress,cancelled:()=>token!==exportToken});blob=await R.blob(c);c.width=c.height=1;}
      if(token!==exportToken)return;progress(95);await download(blob,filename('-'+s.width+'x'+s.height+'.png'));toast('PNG 已生成：'+s.width+' × '+s.height+'，透明背景，已应用当前描边设置。');
    }catch(e){if(token===exportToken)toast('导出失败：'+e.message+'。可以降低分辨率重试。');}
    finally{if(token===exportToken){if(worker)worker.terminate();worker=null;exporting=false;$('exportProgress').hidden=true;$('export').disabled=false;}}
  }
  $('export').onclick=exportImage;$('cancelExport').onclick=()=>{exportToken++;if(worker)worker.terminate();worker=null;exporting=false;$('exportProgress').hidden=true;$('export').disabled=false;toast('已取消导出，画布保留。');};
  window.addEventListener('resize',()=>{clearTimeout(window.biteResizeTimer);window.biteResizeTimer=setTimeout(sizeStage,80);});
  window.addEventListener('pagehide',()=>{clearTimeout(saveTimer);const s=clone(state);transaction('readwrite',st=>st.put({id:'autosave',state:s,updated:Date.now()})).catch(()=>{});});
  await load(state,{track:false});
  try{const previous=await transaction('readonly',st=>st.get('autosave'));if(previous){const s=validateProject({format:'bite-studio',version:1,state:previous.state});await load(s,{track:false});toast('已恢复上次自动暂存的画布。');}}catch(_){/* User can always save portable files. */}
  undo=[];redo=[];historyButtons();await refreshDrafts();initialized=true;queueSave();document.querySelector('.workspace').inert=false;document.querySelector('.top-actions').inert=false;
  // Small inspection surface for repeatable integration tests; no file or network access.
  window.BiteStudio={getState:()=>clone(state),ready:true,validateProject,render:async(w,h)=>R.blob(await R.render({...clone(state),width:w,height:h},image)),defaultState:defaults};
})();
