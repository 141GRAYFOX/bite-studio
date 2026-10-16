'use strict';
const fs = require('node:fs');
const path = require('node:path');
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

const downloadDir=path.join(pagesDir,'download');
fs.mkdirSync(downloadDir,{recursive:true});
fs.writeFileSync(path.join(downloadDir,'BiteStudio.html'),html);
fs.copyFileSync(path.join(dir,'src/_headers'),path.join(pagesDir,'_headers'));
console.log('Built BiteStudio.html, docs/index.html and single-file offline download ('+Buffer.byteLength(html)+' bytes each)');
