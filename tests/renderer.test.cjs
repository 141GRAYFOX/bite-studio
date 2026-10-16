'use strict';
const assert=require('node:assert/strict');
require('../src/renderer.js');
const R=globalThis.BiteRenderer;
function fakeCanvas(w,h,seeds){
  const data=new Uint8ClampedArray(w*h*4);
  for(const [x,y,a=255] of seeds){const i=(y*w+x)*4;data[i]=235;data[i+1]=90;data[i+2]=30;data[i+3]=a;}
  return {width:w,height:h,data,getContext:()=>({getImageData:()=>({data}),putImageData:p=>data.set(p.data)})};
}
async function main(){
  let passed=0;
  for(const radius of [.5,1,2.2,4]){
    const seeds=[[5,4],[2,7]],c=fakeCanvas(13,11,seeds);
    await R.outline(c,radius);
    for(let y=0;y<11;y++)for(let x=0;x<13;x++){
      const distance=Math.min(...seeds.map(([sx,sy])=>Math.hypot(x-sx,y-sy)));
      const expected=Math.round(Math.max(0,Math.min(1,radius+.5-distance))*255);
      assert.equal(c.data[(y*13+x)*4+3],expected,'round contour at '+x+','+y+' radius '+radius);
    }
    assert.deepEqual([...c.data.slice((4*13+5)*4,(4*13+5)*4+3)],[235,90,30],'source color retained');passed++;
  }
  const empty=fakeCanvas(11,9,[]);await R.outline(empty,3);assert.ok(empty.data.every(v=>v===0));passed++;
  for(const [color,rgb] of [[undefined,[255,255,255]],['#ffffff',[255,255,255]],['#27A4e1',[39,164,225]],['#000000',[0,0,0]]]){
    const c=fakeCanvas(9,9,[[4,4,128]]),source=[235,90,30];
    await R.outline(c,2,null,false,null,color);
    const center=(4*9+4)*4,edge=(4*9+6)*4;
    assert.deepEqual([...c.data.slice(center,center+3)],source.map((channel,i)=>Math.round((channel*128+rgb[i]*127)/255)),'translucent source blends over outline '+color);
    assert.equal(c.data[center+3],255);
    assert.deepEqual([...c.data.slice(edge,edge+3)],rgb,'outline edge uses selected color '+color);
    assert.ok(c.data[edge+3]>0&&c.data[edge+3]<255,'colored edge remains antialiased');
    assert.deepEqual([...c.data.slice(0,4)],[0,0,0,0],'background remains transparent');passed++;
  }
  const untouched=fakeCanvas(5,5,[[2,2,160]]),before=untouched.data.slice();await R.outline(untouched,0);assert.deepEqual(untouched.data,before);passed++;
  await assert.rejects(()=>R.outline(fakeCanvas(10,10,[[5,5]]),2,null,true,()=>true),/已取消/);passed++;
  // A bounded Canvas adapter tests alpha scanning across strip boundaries in Node.
  globalThis.OffscreenCanvas=class {
    constructor(w,h){this.width=w;this.height=h;this.data=new Uint8ClampedArray(w*h*4);}
    getContext(){const self=this;return {clearRect:()=>self.data.fill(0),drawImage:(im,sx,sy,sw,sh)=>{for(let y=0;y<sh;y++)self.data.set(im.data.subarray(((sy+y)*im.width+sx)*4,((sy+y)*im.width+sx+sw)*4),y*self.width*4);},getImageData:(x,y,w,h)=>({data:self.data.slice(0,w*h*4)})};}
  };
  const padded=fakeCanvas(500,300,[[250,160],[499,299,1]]);
  assert.deepEqual(await R.visibleBounds(padded,{alphaThreshold:0}),{x:250,y:160,width:250,height:140});passed++;
  const fringe=fakeCanvas(1000,600,[[420,270],[779,349,180],[0,0,1],[999,599,8]]);
  assert.deepEqual(await R.visibleBounds(fringe),{x:420,y:270,width:360,height:80});passed++;
  assert.deepEqual(await R.visibleBounds(fakeCanvas(100,80,[[10,20,2],[30,40,7]])),{x:10,y:20,width:21,height:21});passed++;
  await assert.rejects(()=>R.visibleBounds(fakeCanvas(60,50,[])),/完全透明/);passed++;
  assert.deepEqual(R.objectSize({width:1000,height:1000,bounds:{x:530,y:405,width:100,height:190},object:{scale:.4}},padded),{w:.4,h:.76});passed++;
  function locate(s,p){const b=R.crop(s,{width:1200,height:1000}),t=s.object,k=t.scale*s.width/b.width,a=t.angle*Math.PI/180;
    const x=(p.x-b.x-b.width/2)*k*(t.flip?-1:1),y=(p.y-b.y-b.height/2)*k;
    return{x:t.x*s.width+x*Math.cos(a)-y*Math.sin(a),y:t.y*s.height+x*Math.sin(a)+y*Math.cos(a)};
  }
  for(const angle of [0,37,-90])for(const flip of [false,true]){
    const s={width:4003,height:3764,bounds:{x:0,y:0,width:1200,height:1000},object:{x:.494,y:.475,scale:.86,angle,flip},mouth:{x:.5,y:.3}},before=JSON.parse(JSON.stringify(s));
    R.reframeBounds(s,{width:1200,height:1000},{x:530,y:405,width:100,height:190});
    for(const p of [{x:530,y:405},{x:600,y:530},{x:629,y:594}]){const a=locate(before,p),b=locate(s,p);assert.ok(Math.abs(a.x-b.x)<1e-8&&Math.abs(a.y-b.y)<1e-8,'tighten keeps pixel positions with rotation/flip');}
    assert.deepEqual(s.mouth,before.mouth);assert.equal(s.object.angle,angle);assert.equal(s.object.flip,flip);passed++;
  }
  delete globalThis.OffscreenCanvas;
  const calibration={width:1000,height:700,mouth:{scale:.5,angle:0}},box={x:190,y:100,width:600,height:300};
  assert.ok(Math.abs(R.mouthSpan(calibration)-Math.hypot(500,42.5))<1e-10,'measure endpoint chord including vertical separation');passed++;
  const cm=R.printSize(calibration,box,6);
  assert.ok(Math.abs(cm.width-600*6/Math.hypot(500,42.5))<1e-10);
  assert.equal(cm.height,cm.width/2);
  for(const angle of [-180,-27,90,180])assert.deepEqual(R.printSize({...calibration,mouth:{...calibration.mouth,angle}},box,6),cm,'mouth rotation does not change the calibration length');passed++;
  assert.deepEqual(R.printSize({...calibration,width:2000,height:1400},{width:1200,height:600},6),cm,'export resolution is not a physical size');
  assert.deepEqual(R.printSize(calibration,box,12),{width:cm.width*2,height:cm.height*2});
  assert.deepEqual(R.printSize({...calibration,mouth:{scale:1}},box,6),{width:cm.width/2,height:cm.height/2});
  for(const invalid of [null,0,-1,NaN,Infinity,'6'])assert.throws(()=>R.printSize(calibration,box,invalid),/大于 0/);passed++;
  const labelSize={width:6.123,height:3.456},layout=R.printLabelLayout(1000,940,labelSize);
  assert.deepEqual(layout,{width:1000,height:1000,headerHeight:60,fontSize:22,text:'宽 6.12 cm  ×  高 3.46 cm'});passed++;
  assert.equal(R.printLabelLayout(4003,3764,labelSize).height,4005);
  assert.equal(R.printLabelLayout(64,64,labelSize).headerHeight,24);
  assert.match(R.printLabelLayout(800,752,{width:.001,height:100.5}).text,/< 0.01 cm.*100.50 cm/);passed++;
  for(const size of [null,{width:0,height:1},{width:1,height:NaN},{width:-1,height:1},{width:1,height:Infinity}])assert.throws(()=>R.printLabelLayout(1000,940,size),/重新推算/);passed++;
  for(const [w,h] of [[1000,8190],[6000,4000],[8193,100]])assert.throws(()=>R.printLabelLayout(w,h,labelSize),/降低导出分辨率/);passed++;
  // Independent pixel copy check: the annotation strip cannot resize or paint over the sticker.
  const textCalls=[];
  globalThis.OffscreenCanvas=class {
    constructor(w,h){this.width=w;this.height=h;this.data=new Uint8ClampedArray(w*h*4);}
    getContext(){const target=this;return {drawImage(source,dx,dy){for(let y=0;y<source.height;y++)target.data.set(source.data.subarray(y*source.width*4,(y+1)*source.width*4),((y+dy)*target.width+dx)*4);},strokeText(...args){textCalls.push(args);},fillText(...args){textCalls.push(args);}};}
  };
  const original=fakeCanvas(80,60,[[1,1],[40,20,120],[79,59]]),labeled=R.addPrintLabel(original,labelSize),head=labeled.height-original.height;
  assert.equal(labeled.width,original.width);assert.ok(head>0);
  assert.deepEqual(labeled.data.slice(head*80*4),original.data,'all sticker RGBA bytes preserved after header translation');
  assert.ok(labeled.data.slice(0,head*80*4).every(v=>v===0),'header background is never filled');
  assert.equal(textCalls.length,2);assert.ok(textCalls.every(args=>args[0]===layout.text&&args[2]>0&&args[2]<head),'label stays above the sticker');
  delete globalThis.OffscreenCanvas;passed++;
  console.log(passed+' renderer checks passed (outlines, alpha, transforms, print calibration and annotated export layout/pixels).');
}
main().catch(e=>{console.error(e);process.exitCode=1;});
