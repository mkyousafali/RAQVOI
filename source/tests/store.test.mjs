import { chromium } from '@playwright/test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
const browser = await chromium.launch({executablePath:process.env.RAQVOI_CHROME || 'C:/Users/mkyou/AppData/Local/ms-playwright/chromium-1217/chrome-win64/chrome.exe',headless:true});
const page = await browser.newPage({viewport:{width:1440,height:1000}});
const errors=[];page.on('pageerror',e=>errors.push(e.message));
const base=process.env.RAQVOI_URL||'http://127.0.0.1:5174/';
await fs.mkdir('tests/artifacts',{recursive:true});
try {
 await page.goto(base);await page.getByRole('heading',{name:/Beautifully told/}).waitFor();
 await page.locator('img').evaluateAll(imgs=>imgs.forEach(i=>i.loading='eager')); await page.waitForFunction(()=>Array.from(document.images).every(i=>i.complete && i.naturalWidth>0)); await page.screenshot({path:'tests/artifacts/home-desktop.png',fullPage:true}); await page.screenshot({path:'tests/artifacts/home-desktop-viewport.png'});
 await page.getByRole('link',{name:'Shop all',exact:true}).click();
 assert.equal(await page.locator('.product-card').count(),12);
 assert.match(await page.locator('.price').first().innerText(),/₹/);
 await page.getByRole('radio',{name:'Everyday',exact:true}).check();
 assert.equal(await page.locator('.product-card').count(),3);
 await page.getByRole('button',{name:'Reset',exact:true}).click();
 await page.getByRole('textbox',{name:'Search collection'}).fill('Inaya Sapphire');
 assert.equal(await page.locator('.product-card').count(),1);
 await page.getByRole('button',{name:'Reset',exact:true}).click();
 await page.getByRole('combobox',{name:'Sort products'}).selectOption('low');
 assert.match(await page.locator('.product-card h3').first().innerText(),/Isha/);
 await page.goto(base+'#/product/emerald-noor');
 await page.getByRole('button',{name:'Add to bag',exact:true}).click();
 await page.getByRole('alert').filter({hasText:'choose your size'}).waitFor();
 await page.getByRole('button',{name:'Size guide'}).click();
 await page.getByRole('dialog').waitFor();
 await page.getByRole('button',{name:'Close size guide'}).click();
 await page.getByRole('button',{name:'M',exact:true}).click();
 await page.getByRole('button',{name:'Add to bag',exact:true}).click();
 await page.getByRole('link',{name:'Shopping bag, 1 items'}).waitFor();
 await page.getByRole('button',{name:'Save product to wishlist'}).click();
 await page.reload();await page.getByRole('link',{name:'Wishlist, 1 items'}).waitFor();
 await page.getByRole('link',{name:'Shopping bag, 1 items'}).click();
 await page.getByLabel('Have a little something extra?').fill('WRONG');await page.getByRole('button',{name:'Apply',exact:true}).click();
 await page.getByRole('alert').filter({hasText:'Try WELCOME15'}).waitFor();
 await page.getByLabel('Have a little something extra?').fill('welcome15');await page.getByRole('button',{name:'Apply',exact:true}).click();
 await page.waitForFunction(()=>JSON.parse(localStorage.getItem('raqvoi-coupon-v1'))==='WELCOME15');
 assert.match(await page.locator('.summary-total').innerText(),/2,896/);
 await page.getByRole('button',{name:'Increase Noor Embroidered Anarkali quantity'}).click();
 assert.match(await page.locator('.summary-total').innerText(),/5,593/);
 await page.reload();assert.equal(await page.locator('.quantity-control span').innerText(),'2');
 await page.getByRole('link',{name:'Continue to demo checkout'}).click();
 await page.getByLabel('Name',{exact:true}).fill('Demo Shopper');await page.getByLabel('Email',{exact:true}).fill('demo@example.com');await page.getByLabel('City',{exact:true}).fill('Mumbai');
 await page.getByRole('checkbox').check();await page.getByRole('button',{name:'Place demo order'}).click();
 await page.getByRole('heading',{name:'A beautiful choice, Demo.'}).waitFor();
 assert.match(await page.locator('.summary-total').innerText(),/5,593/);
 await page.getByRole('link',{name:'Shopping bag, 0 items'}).waitFor();
 await page.getByRole('link',{name:'View demo orders',exact:true}).click();
 assert.equal(await page.locator('.order-list-item').count(),1);
 await page.getByRole('button',{name:'Clear demo data',exact:true}).click();await page.getByRole('button',{name:'Yes, clear data'}).click();
 assert.equal(await page.locator('.order-list-item').count(),0);
 for(const route of ['/','/shop','/offers','/story','/wishlist','/bag','/checkout','/account','/help','/help?topic=sizing','/help?topic=privacy','/missing']){await page.goto(base+'#'+route);await page.locator('main').waitFor();await page.waitForTimeout(150);assert.equal(await page.locator('img').evaluateAll(imgs=>imgs.filter(i=>i.complete&&i.naturalWidth===0).length),0,`broken images ${route}`);}
 await page.goto(base);await page.setViewportSize({width:390,height:844});await page.screenshot({path:'tests/artifacts/home-mobile.png',fullPage:true});
 for(const route of ['/','/shop','/product/emerald-noor','/bag','/checkout','/offers','/story','/account','/help']){await page.goto(base+'#'+route);await page.waitForTimeout(200);assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>window.innerWidth+1),false,`overflow ${route}`);}
 await page.goto(base+'#/shop');await page.getByRole('button',{name:'Filters',exact:true}).click();await page.getByRole('radio',{name:'Everyday',exact:true}).check();await page.getByRole('button',{name:'Show 3 pieces'}).click();assert.equal(await page.locator('.product-card').count(),3);
 await page.getByRole('button',{name:'Open menu'}).click();await page.getByRole('link',{name:'Our story',exact:true}).first().click();await page.getByRole('heading',{name:/Her own way/}).waitFor();
 assert.deepEqual(errors,[]);console.log('PASS: catalogue, filters, search, sort, size validation, wishlist persistence, bag persistence, offers, totals, checkout, confirmation, history, data clearing, routes, images and mobile layouts.');
}finally{await browser.close();}


