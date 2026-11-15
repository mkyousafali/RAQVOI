import http from 'node:http';
import { createHash, createHmac, timingSafeEqual } from 'node:crypto';
import { readFile, stat } from 'node:fs/promises';
import path from 'node:path';
import { renderComingSoon, comingSoonScriptHash } from './coming-soon.mjs';

const root = '/srv/site';
// Local preview may proxy Vite; production always uses secure cookies/static files.
const upstream = process.env.PREVIEW_UPSTREAM ? new URL(process.env.PREVIEW_UPSTREAM) : null;
const localPreview = process.env.LOCAL_PREVIEW === 'true';
if (upstream && (!localPreview || upstream.protocol !== 'http:' || upstream.hostname !== '127.0.0.1')) throw new Error('Preview upstream must be local');
const secret = process.env.SESSION_SECRET;
const codeHash = process.env.ACCESS_CODE_SHA256;
if (!secret || secret.length < 32 || !/^[a-f0-9]{64}$/.test(codeHash || '')) throw new Error('Access gate secrets are missing');
// New name invalidates previously issued persistent preview cookies.
const cookieName = localPreview ? 'raqvoi_local_preview_session' : '__Host-raqvoi_preview_session';
const sessionSeconds = 12 * 60 * 60;
const attempts = new Map();
const equal = (a, b) => a.length === b.length && timingSafeEqual(Buffer.from(a), Buffer.from(b));
const sign = value => createHmac('sha256', secret).update(value).digest('hex');
function authenticated(req) {
  const value = (req.headers.cookie || '').split(';').map(x => x.trim()).find(x => x.startsWith(cookieName + '='))?.slice(cookieName.length + 1);
  if (!value) return false;
  const [expires, signature] = value.split('.');
  return /^\d+$/.test(expires) && Number(expires) > Date.now() && equal(signature || '', sign(expires));
}
function gate(res, status = 200, error = '') {
  res.writeHead(status, {'Content-Type': 'text/html; charset=utf-8', 'Content-Security-Policy': `default-src 'none'; img-src 'self'; script-src 'sha256-${comingSoonScriptHash}'; style-src 'unsafe-inline'; form-action 'self'; frame-ancestors 'none'; base-uri 'none'`});
  res.end(renderComingSoon(error));
}
const types = {'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.png':'image/png','.jpg':'image/jpeg','.jpeg':'image/jpeg','.webp':'image/webp','.svg':'image/svg+xml','.woff2':'font/woff2','.ico':'image/x-icon','.json':'application/json','.webmanifest':'application/manifest+json'};
const server = http.createServer(async (req, res) => {
  res.setHeader('Cache-Control', 'private, no-store');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Robots-Tag', 'noindex, nofollow, noarchive');
  try {
    if (req.url === '/__access/unlock' && req.method === 'POST') {
      const ip = String((localPreview ? null : req.headers['x-forwarded-for']) || req.socket.remoteAddress).split(',')[0].trim();
      const now = Date.now();
      const attempt = attempts.get(ip);
      if (attempt && attempt.until > now && attempt.count >= 5) {
        res.setHeader('Retry-After', Math.ceil((attempt.until - now) / 1000));
        req.resume();
        return gate(res, 429, 'Too many attempts. Please try again in 15 minutes.');
      }
      let body = '';
      for await (const chunk of req) {
        body += chunk;
        if (body.length > 1024) { res.writeHead(413); return res.end(); }
      }
      const code = new URLSearchParams(body).get('code') || '';
      const valid = /^\d{6}$/.test(code) && equal(createHash('sha256').update(code).digest('hex'), codeHash);
      if (!valid) {
        const next = attempt && attempt.until > now ? attempt : {count: 0, until: now + 15 * 60 * 1000};
        next.count++;
        attempts.set(ip, next);
        return gate(res, 401, 'Incorrect code. Please try again.');
      }
      attempts.delete(ip);
      const expires = String(now + sessionSeconds * 1000);
      res.writeHead(303, {'Location':'/', 'Set-Cookie': `${cookieName}=${expires}.${sign(expires)}; Path=/;${localPreview ? '' : ' Secure;'} HttpOnly; SameSite=Strict`});
      return res.end();
    }
    const publicPreviewAsset = req.method === 'GET' && ['/assets/brand/coming-soon-florals.webp', '/assets/brand/logo.png', '/assets/brand/icon.png', '/manifest.webmanifest', '/sw.js', '/icons/icon-32-transparent.png', '/icons/icon-180-transparent.png', '/icons/icon-192-transparent.png', '/icons/icon-512-transparent.png', '/icons/icon-maskable-512.png'].includes(req.url);
    if (!authenticated(req) && !publicPreviewAsset) { req.resume(); return gate(res, req.url === '/' && req.method === 'GET' ? 200 : 401); }
    if (upstream) {
      const proxy = http.request(upstream, {path:req.url, method:req.method, headers:{...req.headers, host:upstream.host}}, response => {
        res.writeHead(response.statusCode, {...response.headers, 'cache-control':'private, no-store'});
        response.pipe(res);
      });
      proxy.on('error', () => { if (!res.headersSent) res.writeHead(502); res.end('Local development server is unavailable'); });
      req.pipe(proxy);
      return;
    }
    if (!['GET', 'HEAD'].includes(req.method)) { res.writeHead(405, {'Allow':'GET, HEAD'}); return res.end(); }
    const pathname = decodeURIComponent(new URL(req.url, 'http://localhost').pathname);
    if (pathname.includes('\0') || pathname.split('/').some(part => part.startsWith('.'))) { res.writeHead(404); return res.end(); }
    const file = path.resolve(root, '.' + pathname, pathname.endsWith('/') ? 'index.html' : '');
    if (!file.startsWith(root + path.sep)) { res.writeHead(404); return res.end(); }
    const info = await stat(file);
    if (!info.isFile()) { res.writeHead(404); return res.end(); }
    res.writeHead(200, {'Content-Type':types[path.extname(file)] || 'application/octet-stream', 'Content-Length':info.size});
    res.end(req.method === 'HEAD' ? undefined : await readFile(file));
  } catch (error) {
    if (!res.headersSent) res.writeHead(error.code === 'ENOENT' ? 404 : 400);
    res.end();
  }
});
// Pass authenticated Vite hot-reload connections through the local gate.
server.on('upgrade', (req, socket, head) => {
  if (!upstream || !authenticated(req)) { socket.end('HTTP/1.1 401 Unauthorized\r\nConnection: close\r\n\r\n'); return; }
  const proxy = http.request(upstream, {path:req.url, headers:{...req.headers, host:upstream.host}});
  proxy.on('upgrade', (response, upstreamSocket, upstreamHead) => {
    socket.write(`HTTP/1.1 ${response.statusCode} Switching Protocols\r\n`);
    for (const [name,value] of Object.entries(response.headers)) socket.write(`${name}: ${value}\r\n`);
    socket.write('\r\n');
    if (upstreamHead.length) socket.write(upstreamHead);
    if (head.length) upstreamSocket.write(head);
    upstreamSocket.pipe(socket); socket.pipe(upstreamSocket);
    socket.on('error', () => upstreamSocket.destroy());
    upstreamSocket.on('error', () => socket.destroy());
  });
  proxy.on('error', () => socket.destroy());
  proxy.end();
});
server.listen(localPreview ? 5173 : 8080, localPreview ? '127.0.0.1' : '0.0.0.0');
setInterval(() => { for (const [ip, value] of attempts) if (value.until < Date.now()) attempts.delete(ip); }, 60000).unref();
