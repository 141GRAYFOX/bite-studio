'use strict';
const fs = require('node:fs');
const path = require('node:path');
const dir = __dirname;
let html = fs.readFileSync(path.join(dir, 'src/index.html'), 'utf8');
html = html.replace('<link rel="stylesheet" href="style.css">', () => '<style>' + fs.readFileSync(path.join(dir,'src/style.css'),'utf8') + '</style>');
for (const name of ['renderer.js','app.js']) html = html.replace('<script src="'+name+'"></script>', () => '<script>\n'+fs.readFileSync(path.join(dir,'src',name),'utf8').replace(/<\/script/gi,'<\\/script')+'\n</script>');
fs.writeFileSync(path.join(dir,'BiteStudio.html'),html);
console.log('Built BiteStudio.html ('+Buffer.byteLength(html)+' bytes)');
