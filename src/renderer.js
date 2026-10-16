(function (root) {
  'use strict';
  function createRenderer() {
    const lip = 'M -.5 -.035 C -.48 .035 -.43 .07 -.39 .075 C -.29 .105 -.24 .01 -.12 .02 C .07 .05 .26 .065 .39 -.01 C .445 -.035 .475 -.08 .5 -.12';
    const tooth = 'M .25 .046 Q .27 .16 .303 .157 Q .33 .15 .353 .008 Q .303 .03 .25 .046 Z';
    // Lip centreline endpoints: calibrate against the chord, not the curve length.
    function mouthSpan(s) { return s.mouth.scale * s.width * Math.hypot(1, .085); }
    function printSize(s, bounds, distanceCm) {
      if (!Number.isFinite(distanceCm) || distanceCm <= 0) throw new Error('请输入大于 0 的嘴型端点距离。');
      const span = mouthSpan(s), cmPerPixel = distanceCm / span;
      if (!Number.isFinite(span) || span <= 0 || !bounds || bounds.width <= 0 || bounds.height <= 0) throw new Error('无法测量当前图案。');
      const width = bounds.width * cmPerPixel, height = bounds.height * cmPerPixel;
      if (!Number.isFinite(width) || !Number.isFinite(height)) throw new Error('输入距离过大，请减小数值。');
      return {width, height};
    }
    function formatCm(value) { return value<.01?'< 0.01':value.toLocaleString('zh-CN',{minimumFractionDigits:2,maximumFractionDigits:2}); }
    function printLabelLayout(width,height,size) {
      if(!size||![size.width,size.height].every(v=>Number.isFinite(v)&&v>0))throw new Error('打印尺寸无效，请重新推算。');
      const headerHeight=Math.max(24,Math.ceil(width*.06)),outputHeight=height+headerHeight;
      if(width>8192||outputHeight>8192||width*outputHeight>24000000)throw new Error('附加标注后超过 8192 边长或 2400 万像素，请降低导出分辨率。');
      return {width,height:outputHeight,headerHeight,fontSize:Math.max(8,Math.round(width*.022)),text:'宽 '+formatCm(size.width)+' cm  ×  高 '+formatCm(size.height)+' cm'};
    }
    function addPrintLabel(sticker,size) {
      const layout=printLabelLayout(sticker.width,sticker.height,size),out=canvas(layout.width,layout.height),ctx=out.getContext('2d');
      // Only text occupies the added transparent strip; the sticker pixels are untouched.
      ctx.drawImage(sticker,0,layout.headerHeight);
      ctx.font='600 '+layout.fontSize+'px "Microsoft YaHei", "Noto Sans CJK SC", sans-serif';
      ctx.textAlign='center';ctx.textBaseline='middle';ctx.lineJoin='round';
      const x=layout.width/2,y=layout.headerHeight/2,maxWidth=Math.max(1,layout.width-Math.max(8,layout.width*.04));
      ctx.lineWidth=Math.max(1,layout.fontSize*.09);ctx.strokeStyle='#ffffff';ctx.fillStyle='#17251f';
      ctx.strokeText(layout.text,x,y,maxWidth);ctx.fillText(layout.text,x,y,maxWidth);
      return out;
    }
    async function printBounds(s, image, {cancelled}={}) {
      // A fixed measurement precision avoids tying cm values to export raster rounding.
      // The longest side stays bounded even for very tall or wide canvases.
      const factor=4003/Math.max(s.width,s.height),width=Math.max(1,Math.round(s.width*factor)),height=Math.max(1,Math.round(s.height*factor));
      const measured={...s,width,height,outline:s.outline*width/s.width};let c;
      try{
        c=await render(measured,image,{cooperative:true,cancelled});
        if(cancelled&&cancelled())throw new Error('已取消渲染');
        const b=await visibleBounds(c,{alphaThreshold:0}),k=s.width/width;
        return {x:b.x*k,y:b.y*k,width:b.width*k,height:b.height*k};
      }finally{if(c)c.width=c.height=1;}
    }
    function canvas(w, h) {
      if (typeof OffscreenCanvas !== 'undefined') return new OffscreenCanvas(w, h);
      const c = document.createElement('canvas'); c.width = w; c.height = h; return c;
    }
    async function decode(src) {
      if (typeof createImageBitmap === 'function') {
        try { return await createImageBitmap(await (await fetch(src)).blob()); } catch (_) { /* SVG fallback in browsers */ }
      }
      if (typeof Image === 'undefined') throw new Error('当前浏览器无法解码素材，请使用新版 Chrome 或 Edge。');
      return new Promise((resolve, reject) => { const i = new Image(); i.onload = () => resolve(i); i.onerror = () => reject(new Error('图片无法读取')); i.src = src; });
    }
    async function visibleBounds(image, {alphaThreshold=8}={}) {
      const w=image.width,h=image.height,rows=Math.min(128,h),c=canvas(w,rows),ctx=c.getContext('2d',{willReadFrequently:true});
      let left=w,top=h,right=-1,bottom=-1,allLeft=w,allTop=h,allRight=-1,allBottom=-1;
      // Inspect bounded strips instead of allocating another full-resolution image.
      for(let y=0;y<h;y+=rows){
        const count=Math.min(rows,h-y);ctx.clearRect(0,0,w,rows);ctx.drawImage(image,0,y,w,count,0,0,w,count);
        const data=ctx.getImageData(0,0,w,count).data;
        for(let row=0;row<count;row++)for(let x=0;x<w;x++){
          const alpha=data[(row*w+x)*4+3];if(!alpha)continue;
          if(x<allLeft)allLeft=x;if(x>allRight)allRight=x;if(y+row<allTop)allTop=y+row;if(y+row>allBottom)allBottom=y+row;
          if(alpha<=alphaThreshold)continue;
          if(x<left)left=x;if(x>right)right=x;if(y+row<top)top=y+row;if(y+row>bottom)bottom=y+row;
        }
        await new Promise(resolve=>setTimeout(resolve,0));
      }
      c.width=c.height=1;
      if(allRight<allLeft)throw new Error('这张图片完全透明，没有可以编辑的物品。');
      // Invisible fringe must not enlarge handles; retain deliberately faint artwork.
      if(right<left){left=allLeft;top=allTop;right=allRight;bottom=allBottom;}
      return {x:left,y:top,width:right-left+1,height:bottom-top+1};
    }
    function crop(s,image){return s.bounds||{x:0,y:0,width:image.width,height:image.height};}
    function reframeBounds(s,image,bounds){
      const before=crop(s,image),t=s.object,pixelsPerSource=t.scale*s.width/before.width;
      const dx=(bounds.x+bounds.width/2-before.x-before.width/2)*pixelsPerSource*(t.flip?-1:1);
      const dy=(bounds.y+bounds.height/2-before.y-before.height/2)*pixelsPerSource,a=t.angle*Math.PI/180;
      s.object={...t,x:t.x+(dx*Math.cos(a)-dy*Math.sin(a))/s.width,y:t.y+(dx*Math.sin(a)+dy*Math.cos(a))/s.height,scale:t.scale*bounds.width/before.width};
      s.bounds={...bounds};
    }
    function objectSize(s, image) { const b=crop(s,image);return { w: s.object.scale, h: s.object.scale * (b.height / b.width) * s.width / s.height }; }
    function paint(ctx, s, image, w, h) {
      ctx.clearRect(0, 0, w, h); ctx.imageSmoothingEnabled = true; ctx.imageSmoothingQuality = 'high';
      ctx.save(); ctx.scale(w / s.width, h / s.height);
      if (s.mouth.bite && s.mouth.visible) {
        ctx.save(); ctx.translate(s.mouth.x * s.width, s.mouth.y * s.height); ctx.rotate(s.mouth.angle * Math.PI / 180);
        ctx.scale(s.mouth.scale * s.width, s.mouth.scale * s.width);
        // Continue the curve to both sides, retaining only the object below the lips.
        ctx.clip(new Path2D('M -100 -.035 L -.5 -.035 ' + lip.slice(lip.indexOf('C')) + ' L 100 -.12 L 100 100 L -100 100 Z'));
        ctx.setTransform(w / s.width, 0, 0, h / s.height, 0, 0);
      }
      ctx.save(); ctx.translate(s.object.x * s.width, s.object.y * s.height); ctx.rotate(s.object.angle * Math.PI / 180);
      ctx.scale(s.object.flip ? -1 : 1, 1);
      const b=crop(s,image),ow = s.object.scale * s.width, oh = ow * b.height / b.width;
      ctx.drawImage(image,b.x,b.y,b.width,b.height, -ow / 2, -oh / 2, ow, oh); ctx.restore();
      if (s.mouth.bite && s.mouth.visible) ctx.restore();
      if (s.mouth.visible) {
        ctx.save(); ctx.translate(s.mouth.x * s.width, s.mouth.y * s.height); ctx.rotate(s.mouth.angle * Math.PI / 180);
        const mw = s.mouth.scale * s.width; ctx.scale(mw, mw);
        ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.strokeStyle = s.mouth.color; ctx.fillStyle = '#fffdfa';
        ctx.lineWidth = s.mouth.weight; ctx.stroke(new Path2D(lip));
        if (s.mouth.tooth) { ctx.fill(new Path2D(tooth)); ctx.stroke(new Path2D(tooth)); }
        ctx.restore();
      }
      ctx.restore();
    }
    // Exact separable Euclidean distance transform (linear time), for a round alpha outline.
    function edt1d(f, d, n, v, z) {
      let k = 0; v[0] = 0; z[0] = -Infinity; z[1] = Infinity;
      for (let q = 1; q < n; q++) {
        let a;
        do { const p = v[k]; a = ((f[q] + q * q) - (f[p] + p * p)) / (2 * (q - p)); if (a <= z[k]) k--; else break; } while (k >= 0);
        k++; v[k] = q; z[k] = a; z[k + 1] = Infinity;
      }
      k = 0;
      for (let q = 0; q < n; q++) { while (z[k + 1] < q) k++; const p = v[k]; d[q] = (q - p) * (q - p) + f[p]; }
    }
    async function outline(c, radius, progress, cooperative, cancelled, color = '#ffffff') {
      if (radius <= 0) return c;
      const rgb = [1, 3, 5].map(start => parseInt(color.slice(start, start + 2), 16));
      const ctx = c.getContext('2d', { willReadFrequently: true }); const w = c.width, h = c.height;
      const pixels = ctx.getImageData(0, 0, w, h), data = pixels.data, field = new Float32Array(w * h);
      const n = Math.max(w, h), f = new Float64Array(n), d = new Float64Array(n), v = new Int32Array(n), z = new Float64Array(n + 1);
      const yieldUI = () => new Promise(r => setTimeout(r, 0));
      for (let y = 0; y < h; y++) {
        if (cancelled && cancelled()) throw new Error('已取消渲染');
        for (let x = 0; x < w; x++) { const a = data[(y * w + x) * 4 + 3] / 255; f[x] = a > .06 ? (1 - a) * (1 - a) : 1e12; }
        edt1d(f, d, w, v, z); field.set(d.subarray(0, w), y * w);
        if (y % 128 === 0 && cooperative) await yieldUI();
      }
      if (progress) progress(45);
      for (let x = 0; x < w; x++) {
        if (cancelled && cancelled()) throw new Error('已取消渲染');
        for (let y = 0; y < h; y++) f[y] = field[y * w + x];
        edt1d(f, d, h, v, z);
        for (let y = 0; y < h; y++) {
          const i = (y * w + x) * 4, a = data[i + 3] / 255;
          const edge = Math.max(0, Math.min(1, radius + .5 - Math.sqrt(d[y])));
          const alpha = a + edge * (1 - a);
          if (alpha > 0) {
            const ratio = a / alpha, border = edge * (1 - a) / alpha;
            for (let channel = 0; channel < 3; channel++) data[i + channel] = data[i + channel] * ratio + rgb[channel] * border;
            data[i + 3] = Math.round(alpha * 255);
          }
        }
        if (x % 128 === 0 && cooperative) await yieldUI();
      }
      ctx.putImageData(pixels, 0, 0); return c;
    }
    async function render(s, image, options = {}) {
      const w = options.width || s.width, h = options.height || s.height;
      if(options.printSize)printLabelLayout(w,h,options.printSize);
      // Supersample smaller exports, cap working area to keep mobile memory bounded.
      const factor = options.preview ? 1 : Math.min(2, Math.max(1, Math.sqrt(18000000 / (w * h))));
      const rw = Math.round(w * factor), rh = Math.round(h * factor), c = canvas(rw, rh);
      paint(c.getContext('2d'), s, image, rw, rh);
      if (options.progress) options.progress(15);
      await outline(c, s.outline * rw / s.width, options.progress, options.cooperative, options.cancelled, s.outlineColor);
      let out=c;
      if(rw!==w||rh!==h){out=canvas(w,h);const ctx=out.getContext('2d');ctx.imageSmoothingEnabled=true;ctx.imageSmoothingQuality='high';ctx.drawImage(c,0,0,w,h);c.width=c.height=1;}
      if(options.printSize){const annotated=addPrintLabel(out,options.printSize);out.width=out.height=1;return annotated;}
      return out;
    }
    async function blob(c) {
      if (c.convertToBlob) return c.convertToBlob({ type: 'image/png' });
      return new Promise((resolve, reject) => c.toBlob(b => b ? resolve(b) : reject(new Error('PNG 编码失败，请降低分辨率重试。')), 'image/png'));
    }
    return { canvas, decode, paint, render, blob, outline, objectSize, visibleBounds, crop, reframeBounds, mouthSpan, printSize, printBounds, formatCm, printLabelLayout, addPrintLabel };
  }
  root.BiteRendererFactory = createRenderer; root.BiteRenderer = createRenderer();
})(globalThis);
