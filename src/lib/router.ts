/**
 * Simple routing utilities for RAQVOI application
 */

export function goToAdmin(): void {
  window.location.href = '/admin';
}

export function goToHome(): void {
  window.location.href = '/';
}

export function getCurrentPage(): string {
  const path = window.location.pathname;
  if (path.includes('/admin')) {
    return 'admin';
  }
  return 'home';
}
