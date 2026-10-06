import http from 'node:http';
import type { AddressInfo } from 'node:net';
import fs from 'node:fs/promises';
import path from 'node:path';

const types: Record<string, string> = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.json': 'application/json', '.css': 'text/css', '.xml': 'application/xml', '.properties': 'text/plain; charset=utf-8', '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg', '.woff': 'font/woff', '.woff2': 'font/woff2', '.ttf': 'font/ttf' };

export async function startServer(root: string, port = 0) {
  root = await fs.realpath(root);
  await fs.access(path.join(root, 'index.html'));
  const server = http.createServer(async (req, res) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('Cache-Control', 'no-cache');
    if (req.headers.host !== `127.0.0.1:${(server.address() as AddressInfo).port}`) {
      res.writeHead(403).end(); return;
    }
    if (!['GET', 'HEAD'].includes(req.method ?? '')) {
      res.writeHead(405, { Allow: 'GET, HEAD' }).end(); return;
    }
    try {
      const pathname = decodeURIComponent(new URL(req.url ?? '/', 'http://localhost').pathname);
      if (pathname.includes('\\') || pathname.includes('\0') || pathname.includes(':')) {
        res.writeHead(403).end(); return;
      }
      const file = await fs.realpath(path.resolve(root, '.' + (pathname === '/' ? '/index.html' : pathname)));
      const relative = path.relative(root, file);
      if (relative.startsWith('..') || path.isAbsolute(relative)) {
        res.writeHead(403).end(); return;
      }
      if (!(await fs.stat(file)).isFile()) { res.writeHead(404).end(); return; }
      const data = await fs.readFile(file);
      res.writeHead(200, { 'Content-Type': types[path.extname(file)] || 'application/octet-stream' });
      res.end(req.method === 'HEAD' ? undefined : data);
    } catch (error) {
      res.writeHead(error instanceof URIError ? 400 : 404).end();
    }
  });
  await new Promise<void>((resolve, reject) => {
    server.once('error', reject);
    server.listen(port, '127.0.0.1', resolve);
  });
  return { server, url: `http://127.0.0.1:${(server.address() as AddressInfo).port}` };
}

