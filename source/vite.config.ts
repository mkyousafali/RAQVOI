import { defineConfig } from 'vite';
import { svelte } from '@sveltejs/vite-plugin-svelte';
export default defineConfig({ plugins: [svelte()], base: './', server: { proxy: { '/api/customer': { target: 'http://127.0.0.1:5180', changeOrigin: false }, '/api/admin': { target: 'http://127.0.0.1:5180', changeOrigin: false } } }, build: { assetsInlineLimit: 0 } });
