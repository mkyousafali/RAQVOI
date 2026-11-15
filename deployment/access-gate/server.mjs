import http from 'node:http';
import { createHash, createHmac, timingSafeEqual } from 'node:crypto';
import { readFile, stat } from 'node:fs/promises';
import path from 'node:path';

const root = '/srv/site';
const secret = process.env.SESSION_SECRET;
const codeHash = process.env.ACCESS_CODE_SHA256;
if (!secret || secret.length < 32 || !/^[a-f0-9]{64}$/.test(codeHash || '')) throw new Error('Access gate secrets are missing');
const cookieName = '__Host-raqvoi_preview';
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
const page = error => `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>RAQVOI — Private preview</title><style>html{color-scheme:light}*{box-sizing:border-box}body{margin:0;min-height:100svh;display:grid;place-items:center;background:#f6f2ed;color:#292d29;font:16px system-ui,sans-serif;padding:24px}main{width:100%;max-width:430px;text-align:center;padding:48px 30px;background:#fff;border:1px solid #e4dfd7;border-radius:12px}h1{font:32px Georgia,serif;letter-spacing:7px;margin:0 0 32px}h2{font:25px Georgia,serif;margin:0 0 12px}p{color:#6d706a;line-height:1.6}label{display:block;margin:28px 0 10px;font-size:14px}input{width:100%;padding:15px;border:1px solid #b9bfb4;border-radius:6px;font:24px system-ui;text-align:center;letter-spacing:10px}button{width:100%;margin-top:16px;padding:15px;background:#3d4d40;color:white;border:0;border-radius:6px;font:inherit;cursor:pointer}.error{color:#a33232;font-size:14px}</style></head><body><main><h1>RAQVOI</h1><h2>A little more time.</h2><p>Our store is taking shape.<br>Enter your access code for a private preview.</p><form method="post" action="/__access/unlock"><label for="code">Six-digit access code</label><input id="code" name="code" type="password" inputmode="numeric" pattern="[0-9]{6}" minlength="6" maxlength="6" autocomplete="off" required aria-describedby="message"><button type="submit">Enter preview</button><p class="error" id="message" role="status">${error || ''}</p></form></main></body></html>`;
function gate(res, status = 200, error = '') {
  res.writeHead(status, {'Content-Type': 'text/html; charset=utf-8', 'Content-Security-Policy': "default-src 'none'; style-src 'unsafe-inline'; form-action 'self'; frame-ancestors 'none'; base-uri 'none'"});
  res.end(page(error));
}
const types = {'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.png':'image/png','.jpg':'image/jpeg','.jpeg':'image/jpeg','.webp':'image/webp','.svg':'image/svg+xml','.woff2':'font/woff2','.ico':'image/x-icon','.json':'application/json'};
http.createServer(async (req, res) => {
  res.setHeader('Cache-Control', 'private, no-store');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Robots-Tag', 'noindex, nofollow, noarchive');
  try {
    if (req.url === '/__access/unlock' && req.method === 'POST') {
      const ip = String(req.headers['x-forwarded-for'] || req.socket.remoteAddress).split(',')[0].trim();
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
      res.writeHead(303, {'Location':'/', 'Set-Cookie': `${cookieName}=${expires}.${sign(expires)}; Path=/; Secure; HttpOnly; SameSite=Strict; Max-Age=${sessionSeconds}`});
      return res.end();
    }
    if (!authenticated(req)) { req.resume(); return gate(res, req.url === '/' && req.method === 'GET' ? 200 : 401); }
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
}).listen(8080, '0.0.0.0');
setInterval(() => { for (const [ip, value] of attempts) if (value.until < Date.now()) attempts.delete(ip); }, 60000).unref();
