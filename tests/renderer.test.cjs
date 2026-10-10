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
  console.log(passed+' renderer checks passed (outline, alpha fringe, faint artwork, empty image, cancellation, reframe under rotation/flip).');
}
main().catch(e=>{console.error(e);process.exitCode=1;});
