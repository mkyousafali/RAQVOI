// Build a double-clickable static entry point without changing the Vite bundle.
import fs from 'node:fs/promises';
import path from 'node:path';
const root=path.resolve('dist');
let html=await fs.readFile(path.join(root,'index.html'),'utf8');
const scripts=[...html.matchAll(/<script\b[^>]*src="([^"]+)"[^>]*><\/script>/g)];
for(const match of scripts){const code=await fs.readFile(path.join(root,match[1]),'utf8');html=html.replace(match[0],`<script type="module">${code.replace(/<\/script/gi,'<\\/script')}</script>`);}
const styles=[...html.matchAll(/<link\b[^>]*rel="stylesheet"[^>]*href="([^"]+)"[^>]*>/g)];
for(const match of styles){const css=await fs.readFile(path.join(root,match[1]),'utf8');html=html.replace(match[0],`<style>${css}</style>`);}
await fs.writeFile(path.join(root,'index.html'),html);
console.log('Portable index.html prepared. Product images remain in assets/.');
