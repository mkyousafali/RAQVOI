import { chromium } from '@playwright/test';
import assert from 'node:assert/strict';

const base = process.env.RAQVOI_URL || 'http://127.0.0.1:5174';
const browser = await chromium.launch({ executablePath: process.env.RAQVOI_CHROME || 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: true });
const profile = { name: 'Store Owner', whatsapp: '+919876543210', dateOfBirth: '1990-01-01' };
const json = (route, data) => route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(data) });

async function pageFor(state, width = 1440, adminAuthenticated = false) {
 const page = await browser.newPage({ viewport: { width, height: 900 } });
 const errors = [];
 page.on('pageerror', e => errors.push(e.message));
 await page.route('**/api/customer/session', route => json(route, { email: state ? 'owner@example.test' : null, profile: state ? profile : null, adminState: state }));
 await page.route('**/api/customer/options', route => json(route, { google: false }));
 await page.route('**/api/admin/session', route => json(route, { authenticated: adminAuthenticated, email: adminAuthenticated ? 'owner@example.test' : undefined, isOwner:true, permissions:{admins:true,customers:true} }));
 return { page, errors };
}

async function assertAdminShell(page, desktop) {
 const shell = page.getByTestId('admin-shell');
 await shell.waitFor();
 const workspace = page.getByTestId('admin-workspace');
 await workspace.waitFor();
 assert.equal((await workspace.innerText()).trim(), '', 'Admin workspace should remain visually empty until tools are built');
 assert.equal(await page.locator('.site-header, .raqvoi-footer, .raqvoi-footer-bottom, .demo-pill').count(), 0, 'Admin must not include the storefront chrome');
 assert.equal(await page.getByRole('navigation', { name: 'Main navigation' }).count(), 0, 'store navigation must be absent');
 assert.equal(await page.getByTestId('admin-sidebar').isVisible(), desktop, 'sidebar visibility should match viewport');
 const taskbar = page.getByTestId('admin-taskbar');
 assert(await taskbar.isVisible(), 'Admin taskbar should be visible');
 assert.equal(await taskbar.evaluate(element => getComputedStyle(element).position), 'fixed', 'Admin taskbar should stay at the viewport bottom');
 assert.equal(await page.locator('.admin-success').count(), 0, 'old welcome card should be removed');
 assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), 'Admin should fit the viewport width');
}

try {
 const anon = await pageFor(null);
 await anon.page.goto(base + '/#/account');
 await anon.page.getByRole('button', { name: 'Email me a code' }).waitFor();
 assert.equal(await anon.page.getByRole('link', { name: /Admin panel|Set up Admin access/ }).count(), 0);
 assert.deepEqual(anon.errors, []);
 await anon.page.close();

 const active = await pageFor('active', 390);
 await active.page.route('**/api/admin/login', route => json(route, { stage: 'mfa' }));
 await active.page.route('**/api/admin/verify', route => json(route, { authenticated: true, email: 'owner@example.test', isOwner:true, permissions:{admins:true,customers:true} }));
 await active.page.route('**/api/admin/logout', route => json(route, { authenticated: false }));
 await active.page.goto(base + '/#/account');
 await active.page.getByRole('link', { name: 'Admin panel' }).click();
 await active.page.getByRole('heading', { name: 'Admin sign in' }).waitFor();
 assert.equal(await active.page.locator('.admin-card').getByLabel('Email address').inputValue(), 'owner@example.test');
 await active.page.getByLabel('Password', { exact: true }).fill('test-password-only');
 await active.page.getByRole('button', { name: 'Continue securely' }).click();
 await active.page.getByRole('heading', { name: 'Authenticator code' }).waitFor();
 await active.page.getByLabel('Six-digit code, digit 1 of 6', { exact:true }).fill('123456');
 await active.page.getByRole('button', { name: 'Open Admin workspace' }).click();
 await assertAdminShell(active.page, false);
 await active.page.getByRole('button', { name: 'Sign out of Admin' }).click();
 await active.page.getByRole('heading', { name: 'Admin sign in' }).waitFor();
 assert.deepEqual(active.errors, []);
 await active.page.close();

 const desktop = await pageFor('active', 1440, true);
 await desktop.page.goto(base + '/#/admin');
 await assertAdminShell(desktop.page, true);
 await desktop.page.route('**/api/admin/members', route => json(route, {isOwner:true,members:[{id:'self',kind:'member',email:'owner@example.test',status:'active',self:true,isOwner:true,createdAt:'2026-11-16T00:00:00Z',lastLoginAt:null}]}));
 await desktop.page.getByRole('button', {name:'Users',exact:true}).click();
 await desktop.page.getByRole('button', {name:'Admins',exact:true}).click();
 await desktop.page.getByRole('button', {name:'Manage Admins',exact:true}).click();
 await desktop.page.getByRole('columnheader', {name:'Admin enabled'}).waitFor();
 assert.equal(await desktop.page.getByRole('switch').count(),0,'Owner must be protected');
 await desktop.page.getByRole('button', {name:'Minimize Admins',exact:true}).click();
 await desktop.page.getByRole('button', {name:'Restore Admins window',exact:true}).click();
 await desktop.page.getByRole('columnheader', {name:'Admin enabled'}).waitFor();
 await desktop.page.getByRole('button', {name:'Maximize Admins',exact:true}).click();
 await desktop.page.getByRole('button', {name:'Refresh Admins',exact:true}).click();
 await desktop.page.getByRole('button', {name:'Invite Admin',exact:true}).waitFor();
 await desktop.page.getByRole('button', {name:'Close Admins',exact:true}).click();
 assert.deepEqual(desktop.errors, []);
 await desktop.page.close();

 const pending = await pageFor('pending');
 await pending.page.route('**/api/admin/setup/status', route => json(route, { eligible: true, stage: 'password' }));
 await pending.page.route('**/api/admin/setup/password', route => json(route, { stage: 'totp' }));
 await pending.page.route('**/api/admin/setup/enroll', route => json(route, { uri: 'otpauth://totp/RAQVOI:test', secret: 'TEST-SETUP-KEY' }));
 await pending.page.route('**/api/admin/setup/verify', route => json(route, { verified: true }));
 await pending.page.goto(base + '/#/account');
 await pending.page.getByRole('link', { name: 'Set up Admin access' }).click();
 await pending.page.getByRole('heading', { name: 'Create your Admin password' }).waitFor();
 await pending.page.getByLabel('New password').fill('test-password-only');
 await pending.page.getByLabel('Confirm password').fill('test-password-only');
 await pending.page.getByRole('button', { name: 'Save password' }).click();
 await pending.page.getByRole('button', { name: 'Show my setup key' }).click();
 await pending.page.getByText('TEST-SETUP-KEY').waitFor();
 await pending.page.getByLabel('Six-digit code from the app, digit 1 of 6', { exact:true }).fill('123456');
 await pending.page.getByRole('button', { name: 'Finish setup' }).click();
 await pending.page.getByRole('heading', { name: 'Admin sign in' }).waitFor();
 assert.equal(await pending.page.getByText('TEST-SETUP-KEY').count(), 0);
 assert.deepEqual(pending.errors, []);
 await pending.page.close();

 const returning = await pageFor('pending');
 await returning.page.route('**/api/admin/setup/status', route => json(route, { eligible: true, stage: 'totp' }));
 await returning.page.route('**/api/admin/setup/enroll', route => json(route, { alreadyEnrolled: true }));
 await returning.page.route('**/api/admin/setup/verify', route => json(route, { verified: true }));
 await returning.page.goto(base + '/#/admin');
 await returning.page.getByRole('button', { name: 'Show my setup key' }).click();
 await returning.page.getByText('Google Authenticator is already connected.').waitFor();
 await returning.page.getByLabel('Six-digit code from the app, digit 1 of 6', { exact:true }).fill('123456');
 await returning.page.getByRole('button', { name: 'Finish setup' }).click();
 await returning.page.getByRole('heading', { name: 'Admin sign in' }).waitFor();
 assert.deepEqual(returning.errors, []);
 await returning.page.close();

 console.log('Admin UI checks passed: customer link protection, MFA login, both setup paths, separate desktop/mobile Admin shell, no JS errors.');
} finally { await browser.close(); }
