import { writable } from 'svelte/store';

export interface Window {
  id: string;
  title: string;
  component: string; // 'admin-users', 'employees', 'customers'
  x: number;
  y: number;
  width: number;
  height: number;
  isMinimized: boolean;
  isMaximized: boolean;
  zIndex: number;
}

let nextZIndex = 100;

export const windows = writable<Window[]>([]);
export const focusedWindowId = writable<string | null>(null);

export function openWindow(id: string, title: string, component: string) {
  windows.update(w => {
    const existing = w.find(win => win.id === id);
    if (existing) {
      // Window already open, just focus it
      focusedWindowId.set(id);
      return w;
    }

    const newWindow: Window = {
      id,
      title,
      component,
      x: Math.random() * 200 + 50,
      y: Math.random() * 200 + 50,
      width: 800,
      height: 600,
      isMinimized: false,
      isMaximized: false,
      zIndex: nextZIndex++,
    };

    focusedWindowId.set(id);
    return [...w, newWindow];
  });
}

export function closeWindow(id: string) {
  windows.update(w => w.filter(win => win.id !== id));
}

export function minimizeWindow(id: string) {
  windows.update(w =>
    w.map(win =>
      win.id === id ? { ...win, isMinimized: !win.isMinimized } : win
    )
  );
}

export function maximizeWindow(id: string) {
  windows.update(w =>
    w.map(win =>
      win.id === id
        ? {
            ...win,
            isMaximized: !win.isMaximized,
            x: win.isMaximized ? 50 : 150,
            y: win.isMaximized ? 50 : 0,
            width: win.isMaximized ? 800 : window.innerWidth - 150,
            height: win.isMaximized ? 600 : window.innerHeight - 50,
          }
        : win
    )
  );
}

export function focusWindow(id: string) {
  windows.update(w =>
    w.map(win =>
      win.id === id ? { ...win, zIndex: nextZIndex++ } : win
    )
  );
  focusedWindowId.set(id);
}

export function moveWindow(id: string, x: number, y: number) {
  windows.update(w =>
    w.map(win =>
      win.id === id && !win.isMaximized ? { ...win, x, y } : win
    )
  );
}

export function resizeWindow(id: string, width: number, height: number) {
  windows.update(w =>
    w.map(win =>
      win.id === id && !win.isMaximized
        ? {
            ...win,
            width: Math.max(300, width),
            height: Math.max(200, height),
          }
        : win
    )
  );
}
