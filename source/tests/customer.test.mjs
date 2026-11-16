import { chromium } from '@playwright/test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
const browser=await chromium.launch({executablePath:process.env.RAQVOI_CHROME||'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true});
const page=await browser.newPage({viewport:{width:1440,height:1000}});const errors=[];page.on('pageerror',e=>errors.push(e.message));
try {
 await fs.mkdir('tests/artifacts',{recursive:true});
 await page.goto('http://localhost:5173/#/account');
 await page.getByRole('button',{name:'Email me a code',exact:true}).waitFor();
 assert.equal(await page.locator('.customer-account').getByLabel('Email address',{exact:true}).count(),1);
 assert.equal(await page.getByLabel('Date of birth').count(),0);
 const denied=await page.request.put('http://localhost:5173/api/customer/profile',{headers:{Origin:'http://localhost:5173','X-RAQVOI-Request':'1'},data:{name:'forged'}});
 assert.equal(denied.status(),401);
 await page.screenshot({path:'tests/artifacts/customer-account-desktop.png',fullPage:true});
 await page.setViewportSize({width:390,height:844});
 assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
 await page.screenshot({path:'tests/artifacts/customer-account-mobile.png',fullPage:true});
 await page.goto('http://localhost:5173/#/checkout');
 await page.getByRole('heading',{name:'Sign in to continue.'}).waitFor();
 await page.getByRole('link',{name:'Go to your account'}).click();
 await page.getByRole('button',{name:'Email me a code',exact:true}).waitFor();
 assert(page.url().includes('next=checkout'));
 assert.deepEqual(errors,[]);
 console.log('Local browser checks passed: account form, API denial, checkout guard, mobile overflow, no JS errors.');
}finally{await browser.close();}
