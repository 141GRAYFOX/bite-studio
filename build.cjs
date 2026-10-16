'use strict';
const fs = require('node:fs');
const path = require('node:path');
const { deflateRawSync } = require('node:zlib');
const dir = __dirname;
const readText = name => fs.readFileSync(path.join(dir,name),'utf8').replace(/\r\n/g,'\n');
let html = readText('src/index.html');
html = html.replace('<link rel="stylesheet" href="style.css">', () => '<style>' + readText('src/style.css') + '</style>');
for (const name of ['renderer.js','mockup.js','app.js']) html = html.replace('<script src="'+name+'"></script>', () => '<script>\n'+readText('src/'+name).replace(/<\/script/gi,'<\\/script')+'\n</script>');
fs.writeFileSync(path.join(dir,'BiteStudio.html'),html);
const pagesDir=path.join(dir,'docs');
fs.mkdirSync(pagesDir,{recursive:true});
fs.writeFileSync(path.join(pagesDir,'index.html'),html);
fs.writeFileSync(path.join(pagesDir,'.nojekyll'),'');

// A small standard ZIP writer keeps builds dependency-free on Windows and Pages.
// Fixed timestamps and normalized line endings make the download reproducible.
function makeZip(files) {
  const local=[], central=[];
  let offset=0;
  for(const [name,data] of files) {
    const filename=Buffer.from(name), body=Buffer.isBuffer(data)?data:Buffer.from(data);
    const compressed=deflateRawSync(body,{level:9});
    let crc=0xffffffff;
    for(const byte of body){crc^=byte;for(let i=0;i<8;i++)crc=(crc>>>1)^((crc&1)?0xedb88320:0);}
    crc=(crc^0xffffffff)>>>0;
    const header=Buffer.alloc(30);
    header.writeUInt32LE(0x04034b50,0);header.writeUInt16LE(20,4);
    header.writeUInt16LE(0x0800,6);header.writeUInt16LE(8,8);header.writeUInt16LE(0x2821,12);
    header.writeUInt32LE(crc,14);header.writeUInt32LE(compressed.length,18);
    header.writeUInt32LE(body.length,22);header.writeUInt16LE(filename.length,26);
    const entry=Buffer.alloc(46);
    entry.writeUInt32LE(0x02014b50,0);entry.writeUInt16LE(20,4);entry.writeUInt16LE(20,6);
    header.copy(entry,8,6,30);entry.writeUInt32LE(offset,42);
    local.push(header,filename,compressed);central.push(entry,filename);
    offset+=header.length+filename.length+compressed.length;
  }
  const directory=Buffer.concat(central), end=Buffer.alloc(22);
  end.writeUInt32LE(0x06054b50,0);end.writeUInt16LE(files.length,8);end.writeUInt16LE(files.length,10);
  end.writeUInt32LE(directory.length,12);end.writeUInt32LE(offset,16);
  return Buffer.concat([...local,directory,end]);
}
const offlineHelp=`Bite Studio · 离线版

1. 先完整解压此 ZIP，再用 Chrome 或 Edge 打开 BiteStudio.html。
2. 无需安装 Node.js，无需联网；素材、编辑和导出在当前设备内完成。
3. 若直接打开文件时无法暂存，请使用“保存工程”保存 .bite 文件。
4. Windows 已有 Node.js 时，也可双击“启动工坊.cmd”使用本地服务。
   其他系统可运行 node server.cjs，再访问 http://127.0.0.1:43971/。
5. 在线站点和离线文件不共享暂存。切换前先保存工程，再在另一入口打开工程。
6. 手机需使用支持打开本地 HTML 的浏览器；文件管理器预览可能无法运行程序。
   不同手机的文件打开、下载和分享行为不同，手机通常建议使用在线版。

完整操作说明：使用说明.md
在线版：https://bite-studio.pages.dev/
源代码：https://github.com/141GRAYFOX/bite-studio
`;
const offlineFiles=[['BiteStudio.html',html],['离线使用说明.txt',offlineHelp],['使用说明.md',readText('使用说明.md')],['server.cjs',readText('server.cjs')]];
for(const name of ['启动工坊.cmd','启动工坊.ps1'])offlineFiles.push([name,readText(name).replace(/\n/g,'\r\n')]);
const archive=makeZip(offlineFiles);
fs.writeFileSync(path.join(pagesDir,'BiteStudio-offline.zip'),archive);
console.log('Built BiteStudio.html and docs/index.html ('+Buffer.byteLength(html)+' bytes each), offline ZIP ('+archive.length+' bytes)');
