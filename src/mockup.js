/* Composite the current sticker onto a local photo for placement testing. */
(function (root) {
  'use strict';
  root.BiteMockup = function ({createSticker, download}) {
    const $ = id => document.getElementById(id), R = root.BiteRenderer;
    const dialog = $('mockupDialog'), art = $('mockupArt'), controls = $('mockupControls');
    let background, sticker, transform = {x:.5,y:.5,scale:.35,angle:0};
    let backgroundTransform = {x:.5,y:.5,scale:1,angle:0}, selected = 'sticker';
    let busy = false, serial = 0, gesture, frame = 0;
    const pointers = new Map();
    const clamp = (v,a,b) => Math.min(b,Math.max(a,v));
    const normalize = a => ((a+180)%360+360)%360-180;
    const distance = (a,b) => Math.hypot(a.x-b.x,a.y-b.y);
    const angle = (a,b) => Math.atan2(b.y-a.y,b.x-a.x);
    function message(text) { $('mockupStatus').textContent = text; }
    function ready() { return !!(background && sticker && !busy); }
    function activeTransform() { return selected==='background'?backgroundTransform:transform; }
    function sync() {
      const t=activeTransform(),name=selected==='background'?'背景':'贴纸';
      $('mockupScale').value = t.scale*100;
      $('mockupScaleNumber').value = +(t.scale*100).toFixed(1);
      $('mockupAngle').value = t.angle;
      $('mockupAngleNumber').value = +t.angle.toFixed(1);
      $('mockupScaleLabel').textContent=name+'大小';
      $('mockupReset').textContent='重置'+name+'位置';
      $('mockupScaleNumber').setAttribute('aria-label','效果测试'+name+'大小百分比');
      $('mockupAngleNumber').setAttribute('aria-label','效果测试'+name+'旋转角度');
      controls.setAttribute('aria-label','效果测试画布：正在调整'+name+'，拖动移动，四角缩放，金色手柄旋转，双指缩放旋转，方向键微调');
      $('mockupStickerLayer').setAttribute('aria-pressed',String(selected==='sticker'));
      $('mockupBackgroundLayer').setAttribute('aria-pressed',String(selected==='background'));
      for (const id of ['mockupScale','mockupScaleNumber','mockupAngle','mockupAngleNumber','mockupReset','mockupSave','mockupStickerLayer','mockupBackgroundLayer']) $(id).disabled = !ready();
      $('mockupUpload').disabled = busy;
      $('mockupEmptyUpload').disabled = busy;
      $('mockupEmpty').hidden = !!background;
      $('mockupStage').hidden = !background;
      $('mockupSize').textContent = background ? background.width+' × '+background.height+' px' : '';
    }
    function composite(ctx,w,h) {
      ctx.clearRect(0,0,w,h);
      if (!background) return;
      // Both layers use the fixed output canvas, so photo edits never move the sticker.
      for (const [image,t] of [[background,backgroundTransform],[sticker,transform]]) {
        if (!image) continue;
        const sw=t.scale*w,sh=sw*image.height/image.width;
        ctx.save();ctx.translate(t.x*w,t.y*h);ctx.rotate(t.angle*Math.PI/180);
        ctx.drawImage(image,-sw/2,-sh/2,sw,sh);ctx.restore();
      }
    }
    function geometry() {
      const t=activeTransform(),image=selected==='background'?background:sticker;
      const b = controls.getBoundingClientRect(), w = b.width*t.scale, h = w*image.height/image.width;
      const cx = t.x*b.width, cy = t.y*b.height, a = t.angle*Math.PI/180;
      const point = (x,y) => ({x:cx+x*Math.cos(a)-y*Math.sin(a),y:cy+x*Math.sin(a)+y*Math.cos(a)});
      const anchor = point(0,-h/2), rotation = point(0,-h/2-30);
      return {cx,cy,corners:[point(-w/2,-h/2),point(w/2,-h/2),point(w/2,h/2),point(-w/2,h/2)],anchor,
        rotation:{x:clamp(rotation.x,14,b.width-14),y:clamp(rotation.y,14,b.height-14)}};
    }
    function draw() {
      frame = 0;
      if (!dialog.open || !background) return;
      composite(art.getContext('2d'),art.width,art.height);
      const ctx = controls.getContext('2d'), b = controls.getBoundingClientRect();
      ctx.clearRect(0,0,controls.width,controls.height);
      if (!ready() || !b.width || !b.height) return;
      const g = geometry();ctx.save();ctx.scale(controls.width/b.width,controls.height/b.height);
      ctx.strokeStyle = '#276453';ctx.lineWidth = 1.5;ctx.setLineDash([5,4]);
      ctx.beginPath();g.corners.forEach((p,i)=>i?ctx.lineTo(p.x,p.y):ctx.moveTo(p.x,p.y));ctx.closePath();ctx.stroke();ctx.setLineDash([]);
      for (const p of g.corners) {ctx.fillStyle='#fffdf9';ctx.beginPath();ctx.arc(p.x,p.y,6,0,Math.PI*2);ctx.fill();ctx.stroke();}
      ctx.strokeStyle='#ab742a';ctx.beginPath();ctx.moveTo(g.anchor.x,g.anchor.y);ctx.lineTo(g.rotation.x,g.rotation.y);ctx.stroke();
      ctx.fillStyle='#fff4dc';ctx.beginPath();ctx.arc(g.rotation.x,g.rotation.y,12,0,Math.PI*2);ctx.fill();ctx.stroke();
      ctx.fillStyle='#80561f';ctx.font='17px sans-serif';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText('↻',g.rotation.x,g.rotation.y);
      ctx.restore();
    }
    function schedule() { if (!frame) frame=requestAnimationFrame(draw); }
    function size() {
      if (!dialog.open || !background) return;
      const box = $('mockupView').getBoundingClientRect(), k = Math.min((box.width-16)/background.width,(box.height-16)/background.height);
      const w = Math.max(1,Math.floor(background.width*k)), h = Math.max(1,Math.floor(background.height*k));
      $('mockupStage').style.width=w+'px';$('mockupStage').style.height=h+'px';
      const density=Math.min(devicePixelRatio||1,2,1600/Math.max(w,h));
      for (const c of [art,controls]) {c.width=Math.max(1,Math.round(w*density));c.height=Math.max(1,Math.round(h*density));}
      schedule();
    }
    function reset() {
      if (selected==='background') {backgroundTransform={x:.5,y:.5,scale:1,angle:0};sync();schedule();return;}
      // Fit to both photo dimensions, including narrow portrait backgrounds.
      transform={x:.5,y:.5,scale:sticker&&background?Math.min(.4,.55*background.height/background.width*sticker.width/sticker.height):.35,angle:0};
      transform.scale=clamp(transform.scale,.01,5);sync();schedule();
    }
    function select(layer) {
      pointers.clear();gesture=null;selected=layer;sync();schedule();
      message('正在调整'+(layer==='background'?'背景':'贴纸')+'：拖动移动，四角缩放，金色手柄旋转。');
    }
    $('mockupStickerLayer').onclick=()=>select('sticker');
    $('mockupBackgroundLayer').onclick=()=>select('background');
    async function refreshSticker() {
      if (busy) return;
      const request=++serial;busy=true;sync();message('正在合成当前贴纸…');
      if (sticker) {sticker.width=sticker.height=1;sticker=undefined;schedule();}
      let next;
      try {
        next=await createSticker();
        if (request!==serial) {next.width=next.height=1;return;}
        sticker=next;
        message(background?'可切换「调整贴纸 / 调整背景」，分别移动、缩放和旋转。':'贴纸已合成，请上传一张背景图开始测试。');
      } catch(e) {if(request===serial)message('贴纸合成失败：'+e.message);}
      finally {if(request===serial){busy=false;sync();size();}}
    }
    async function upload(file) {
      if (!file || busy) return;
      if (!['image/png','image/jpeg','image/webp'].includes(file.type)) {message('请选择 PNG、JPEG 或 WebP 背景图。');return;}
      if (file.size>30*1024*1024) {message('背景图请控制在 30 MB 以内。');return;}
      const request=++serial,url=URL.createObjectURL(file);let decoded,next;
      busy=true;sync();message('正在读取背景图…');
      try {
        decoded=await R.decode(url);
        if (decoded.width>16384||decoded.height>16384||decoded.width*decoded.height>50000000) throw new Error('图片过大，请缩小至 5000 万像素以内。');
        const k=Math.min(1,4096/Math.max(decoded.width,decoded.height),Math.sqrt(12000000/(decoded.width*decoded.height)));
        next=R.canvas(Math.max(1,Math.round(decoded.width*k)),Math.max(1,Math.round(decoded.height*k)));
        next.getContext('2d').drawImage(decoded,0,0,next.width,next.height);
        if (request!==serial) {next.width=next.height=1;return;}
        if (background) background.width=background.height=1;
        background=next;backgroundTransform={x:.5,y:.5,scale:1,angle:0};selected='sticker';reset();
        message('背景已载入，可切换调整背景或贴纸。'+(k<1?'大图已缩小，效果图按下方显示的尺寸保存。':''));
      } catch(e) {if(next&&next!==background)next.width=next.height=1;if(request===serial)message('背景图读取失败：'+e.message);}
      finally {if(decoded&&decoded.close)decoded.close();URL.revokeObjectURL(url);if(request===serial){busy=false;sync();size();}}
    }
    function update() {sync();schedule();}
    for (const id of ['mockupScale','mockupScaleNumber','mockupAngle','mockupAngleNumber']) {
      $(id).oninput=()=>{
        if (!ready()||$(id).value==='') return;
        const value=Number($(id).value);if(!Number.isFinite(value))return;
        const t=activeTransform();
        if(id.includes('Scale'))t.scale=clamp(value/100,.01,5);else t.angle=clamp(value,-180,180);
        // Leave the active number field intact while typing a decimal or minus sign.
        const active=document.activeElement,raw=active.value;update();if(active===$(id)&&active.type==='number')active.value=raw;
      };
      $(id).onchange=update;$(id).onblur=update;
    }
    function coords(e) {const b=controls.getBoundingClientRect();return{x:e.clientX-b.left,y:e.clientY-b.top};}
    function begin() {
      const points=[...pointers.values()],original={...activeTransform()},g=geometry();
      if(points.length===2){const[a,b]=points;gesture={mode:'pinch',original,distance:Math.max(1,distance(a,b)),angle:angle(a,b),mid:{x:(a.x+b.x)/2,y:(a.y+b.y)/2}};}
      else if(points.length===1){const p=points[0];gesture={mode:distance(p,g.rotation)<22?'rotate':g.corners.some(c=>distance(p,c)<20)?'scale':'move',original,start:p,center:{x:g.cx,y:g.cy},distance:Math.max(1,distance(p,{x:g.cx,y:g.cy})),angle:angle({x:g.cx,y:g.cy},p)};}
      else gesture=null;
    }
    controls.onpointerdown=e=>{
      if(!ready()||pointers.size>=2)return;e.preventDefault();controls.focus({preventScroll:true});controls.setPointerCapture(e.pointerId);
      pointers.set(e.pointerId,coords(e));begin();if(e.altKey&&pointers.size===1)gesture.mode='rotate';
    };
    controls.onpointermove=e=>{
      if(!pointers.has(e.pointerId)||!gesture||!ready())return;
      const p=coords(e);pointers.set(e.pointerId,p);const o=gesture.original,b=controls.getBoundingClientRect(),t=activeTransform();
      if(gesture.mode==='pinch'&&pointers.size===2){const[a,z]=[...pointers.values()];t.scale=clamp(o.scale*distance(a,z)/gesture.distance,.01,5);t.angle=normalize(o.angle+(angle(a,z)-gesture.angle)*180/Math.PI);t.x=clamp(o.x+((a.x+z.x)/2-gesture.mid.x)/b.width,0,1);t.y=clamp(o.y+((a.y+z.y)/2-gesture.mid.y)/b.height,0,1);}
      else if(gesture.mode==='move'){t.x=clamp(o.x+(p.x-gesture.start.x)/b.width,0,1);t.y=clamp(o.y+(p.y-gesture.start.y)/b.height,0,1);}
      else if(gesture.mode==='scale')t.scale=clamp(o.scale*distance(p,gesture.center)/gesture.distance,.01,5);
      else if(gesture.mode==='rotate')t.angle=normalize(o.angle+(angle(gesture.center,p)-gesture.angle)*180/Math.PI);
      update();
    };
    function end(e) {if(pointers.delete(e.pointerId))begin();}
    controls.onpointerup=end;controls.onpointercancel=end;controls.onlostpointercapture=end;
    controls.addEventListener('wheel',e=>{if(!ready())return;e.preventDefault();const t=activeTransform();if(e.altKey)t.angle=normalize(t.angle+e.deltaY*.1);else t.scale=clamp(t.scale*Math.exp(-e.deltaY*.001),.01,5);update();},{passive:false});
    controls.onkeydown=e=>{
      if(!ready())return;const delta=e.shiftKey?10:1,t=activeTransform();
      if(e.key==='ArrowLeft')t.x=clamp(t.x-delta/background.width,0,1);
      else if(e.key==='ArrowRight')t.x=clamp(t.x+delta/background.width,0,1);
      else if(e.key==='ArrowUp')t.y=clamp(t.y-delta/background.height,0,1);
      else if(e.key==='ArrowDown')t.y=clamp(t.y+delta/background.height,0,1);
      else return;e.preventDefault();update();
    };
    dialog.addEventListener('keydown',e=>e.stopPropagation());
    for(const name of ['dragenter','dragleave','dragover'])dialog.addEventListener(name,e=>{e.preventDefault();e.stopPropagation();});
    dialog.addEventListener('drop',e=>{e.preventDefault();e.stopPropagation();upload(e.dataTransfer.files[0]);});
    $('mockupUpload').onclick=()=>$('mockupFile').click();
    $('mockupEmptyUpload').onclick=()=>$('mockupFile').click();
    $('mockupFile').onchange=e=>{upload(e.target.files[0]);e.target.value='';};
    $('mockupReset').onclick=reset;
    $('mockupClose').onclick=()=>dialog.close();
    dialog.addEventListener('close',()=>{serial++;busy=false;pointers.clear();gesture=null;});
    $('mockupSave').onclick=async()=>{
      if(!ready())return;const request=++serial;busy=true;sync();message('正在保存效果图…');let c;
      try{c=R.canvas(background.width,background.height);composite(c.getContext('2d'),c.width,c.height);const blob=await R.blob(c);if(request!==serial)return;await download(blob,'贴纸效果测试.png');if(request===serial)message('效果图已生成。');}
      catch(e){if(request===serial)message('保存失败：'+e.message);}finally{if(c)c.width=c.height=1;if(request===serial){busy=false;sync();schedule();}}
    };
    new ResizeObserver(size).observe($('mockupView'));
    return {
      open(){if(dialog.open)return;dialog.showModal();sync();size();refreshSticker();},
      getState:()=>({transform:{...transform},backgroundTransform:{...backgroundTransform},selected,hasBackground:!!background,hasSticker:!!sticker,busy})
    };
  };
})(globalThis);
