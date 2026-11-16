import http from 'node:http';
import {readFile} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const root=fileURLToPath(new URL('../',import.meta.url));
const types={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.webmanifest':'application/manifest+json','.png':'image/png','.gif':'image/gif','.svg':'image/svg+xml'};
const server=http.createServer(async(req,res)=>{
 try{
  const url=new URL(req.url,'http://localhost');
  const relative=decodeURIComponent(url.pathname).replace(/^\/Flappy(?=\/|$)/,'').replace(/^\//,'')||'index.html';
  const target=path.resolve(root,relative);
  if(!target.startsWith(root)||relative.split(/[\\/]/).some(p=>p.startsWith('.')&&p!=='.nojekyll')){res.writeHead(403);res.end();return}
  const body=await readFile(target);res.writeHead(200,{'Content-Type':types[path.extname(target)]||'application/octet-stream','Cache-Control':'no-store'});res.end(body);
 }catch{res.writeHead(404);res.end('Not found')}
});
server.listen(4173,'127.0.0.1',()=>console.log('Flappy: http://127.0.0.1:4173/Flappy/'));
