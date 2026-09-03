// Minimal static file server used by the screenshot, prerender and video scripts.
//   serveStatic(root, port, { spa, base })
//   spa:  serve root/index.html for paths that have no file (single-page app routing)
//   base: URL prefix the build was made for (Vite base), e.g. '/DFTG/'
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';

const TYPES = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.css': 'text/css', '.png': 'image/png', '.jpg': 'image/jpeg', '.mp4': 'video/mp4', '.svg': 'image/svg+xml', '.xml': 'application/xml', '.txt': 'text/plain; charset=utf-8', '.webmanifest': 'application/manifest+json', '.json': 'application/json' };

export function serveStatic(root, port = 0, { spa = false, base = '/' } = {}) {
  const prefix = base.replace(/\/$/, '');
  const absRoot = path.resolve(root);
  const server = http.createServer((req, res) => {
    const url = new URL(req.url, 'http://localhost');
    let pathname = decodeURIComponent(url.pathname);
    if (prefix && pathname.startsWith(prefix)) pathname = pathname.slice(prefix.length) || '/';
    let file = path.resolve(absRoot, '.' + path.posix.normalize(pathname));
    if (!file.startsWith(absRoot)) { res.writeHead(403); res.end('forbidden'); return; }
    if (fs.existsSync(file) && fs.statSync(file).isDirectory()) file = path.join(file, 'index.html');
    if (!fs.existsSync(file) && spa && !path.extname(pathname)) file = path.join(absRoot, 'index.html');
    fs.readFile(file, (err, data) => {
      if (err) { res.writeHead(404); res.end('not found'); return; }
      res.writeHead(200, { 'content-type': TYPES[path.extname(file)] || 'application/octet-stream' });
      res.end(data);
    });
  });
  return new Promise((resolve) => {
    server.listen(port, '127.0.0.1', () => resolve({ server, port: server.address().port, url: `http://127.0.0.1:${server.address().port}` }));
  });
}
