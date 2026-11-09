// 對外測試用的靜態伺服器：node scripts/serve.mjs [port]，遊戲在 /it24hr/。
// 只開放遊戲本身的檔案（index.html、根目錄的 js／css／html／xml、assets/、LICENSES/、vendor/、classroom/、csie/），文件與劇本一律 404。
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { extname, join, normalize, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = fileURLToPath(new URL('..', import.meta.url));
const PREFIX = '/it24hr/';
const PORT = Number(process.argv[2]) || 8765;
const TYPES = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8',
  '.txt': 'text/plain; charset=utf-8', '.xml': 'application/xml; charset=utf-8', '.svg': 'image/svg+xml', '.png': 'image/png', '.webp': 'image/webp',
};

function allowed(path) {
  if (path.includes('..')) return false;
  if (/^[a-z0-9-]+\.(js|css|html|xml)$/.test(path)) return true;
  return /^(assets|LICENSES|vendor|classroom|csie)\/[\w./-]+$/.test(path);
}

createServer(async (request, response) => {
  const url = new URL(request.url, 'http://localhost');
  if (url.pathname === '/it24hr') { response.writeHead(301, { Location: PREFIX }); response.end(); return; }
  let path;
  try { path = decodeURIComponent(url.pathname.slice(PREFIX.length)) || 'index.html'; } catch { path = ''; }
  const type = TYPES[extname(path)];
  // 改了程式重新整理就要拿到新版，所以叫 Cloudflare 和瀏覽器都不要快取——404 也是，不然新加的圖會被舊的 404 擋住幾分鐘
  const notFound = () => { response.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8', 'Cache-Control': 'no-store' }); response.end('not found'); };
  if (!['GET', 'HEAD'].includes(request.method) || !url.pathname.startsWith(PREFIX) || !allowed(path) || !type) { notFound(); return; }
  const file = normalize(join(ROOT, path));
  if (!file.startsWith(ROOT.endsWith(sep) ? ROOT : ROOT + sep)) { notFound(); return; }
  try {
    const body = await readFile(file);
    response.writeHead(200, { 'Content-Type': type, 'Cache-Control': 'no-store' });
    response.end(request.method === 'HEAD' ? undefined : body);
  } catch { notFound(); }
}).listen(PORT, '127.0.0.1', () => console.log(`IT24hr: http://127.0.0.1:${PORT}${PREFIX}`));
