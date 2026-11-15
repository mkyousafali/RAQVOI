import { writable } from 'svelte/store';
export const route = writable(location.hash.slice(1) || '/');
window.addEventListener('hashchange', () => { route.set(location.hash.slice(1) || '/'); window.scrollTo({ top: 0, behavior: 'instant' }); });
export const href = (path: string) => `#${path}`;
export function navigate(path: string) { if ((location.hash.slice(1) || '/') === path) window.scrollTo(0, 0); else location.hash = path; }
