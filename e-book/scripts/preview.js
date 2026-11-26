// Local preview only. No leads are sent or stored. Do not use this server in production.
const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../dist');
const types = {'.html':'text/html; charset=utf-8','.css':'text/css; charset=utf-8','.js':'text/javascript; charset=utf-8','.webp':'image/webp','.png':'image/png','.jpg':'image/jpeg','.svg':'image/svg+xml','.pdf':'application/pdf','.webmanifest':'application/manifest+json','.xml':'application/xml','.txt':'text/plain'};
http.createServer((req,res)=>{
  let pathname;try{pathname=decodeURIComponent(new URL(req.url,'http://localhost').pathname);}catch{return res.writeHead(400).end();}
  if(pathname==='/api/lead'&&req.method==='POST'){
    let bytes=0;req.on('data',chunk=>{bytes+=chunk.length;if(bytes>16384)req.destroy();});req.on('end',()=>res.writeHead(200,{'Content-Type':'application/json','Cache-Control':'no-store'}).end('{"ok":true,"preview":true}'));return;
  }
  if(req.method!=='GET'&&req.method!=='HEAD')return res.writeHead(405).end();
  if(pathname==='/')return res.writeHead(302,{Location:'/e-book'}).end();
  const routes={'/e-book':'/e-book.html','/e-book/a-b':'/e-book/a-b.html','/e-book/obrigado':'/e-book/obrigado.html','/e-book/politica-de-privacidade':'/e-book/politica-de-privacidade.html'};
  const target=path.resolve(root,'.'+(routes[pathname.replace(/\/$/,'')]||pathname));
  if(!target.startsWith(root+path.sep)||!fs.existsSync(target)||!fs.statSync(target).isFile())return res.writeHead(404,{'Content-Type':'text/html; charset=utf-8'}).end(fs.readFileSync(path.join(root,'404.html')));
  const ext=path.extname(target);const headers={'Content-Type':types[ext]||'application/octet-stream','Content-Length':fs.statSync(target).size,'X-Content-Type-Options':'nosniff'};
  if(ext==='.pdf')headers['Content-Disposition']='attachment; filename="Guia-e-BEF-BPO-Paralegal.pdf"';
  res.writeHead(200,headers);if(req.method==='HEAD')return res.end();fs.createReadStream(target).pipe(res);
}).listen(4173,'127.0.0.1',()=>console.log('PRÉVIA LOCAL — formulários simulados, sem envio de dados: http://localhost:4173/e-book'));
