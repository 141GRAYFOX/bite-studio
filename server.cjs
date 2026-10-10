'use strict';
const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const { spawn } = require('node:child_process');
const port = 43971, url = 'http://127.0.0.1:'+port;
const open = () => { if(process.argv.includes('--open')) spawn('powershell.exe',['-NoProfile','-Command',"Start-Process '"+url+"'"],{windowsHide:true,stdio:'ignore',detached:true}).unref(); };
const server = http.createServer((req,res)=>{
  const route = new URL(req.url,url).pathname;
  if(route==='/health'){res.writeHead(200,{'Content-Type':'text/plain'});res.end('BiteStudio');return;}
  if(route!=='/'&&route!=='/BiteStudio.html'){res.writeHead(404);res.end('Not found');return;}
  res.writeHead(200,{'Content-Type':'text/html; charset=utf-8','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'});
  fs.createReadStream(path.join(__dirname,'BiteStudio.html')).pipe(res);
});
server.on('error',error=>{
  if(error.code!=='EADDRINUSE'){console.error(error.message);process.exit(1);}
  http.get(url+'/health',res=>{let text='';res.on('data',chunk=>text+=chunk);res.on('end',()=>{if(text==='BiteStudio'){open();process.exit(0);}console.error('端口 '+port+' 被其他程序使用。请直接打开 BiteStudio.html。');process.exit(1);});}).on('error',()=>process.exit(1));
});
server.listen(port,'127.0.0.1',()=>{console.log('Bite Studio: '+url);open();});
