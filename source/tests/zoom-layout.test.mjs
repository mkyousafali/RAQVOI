import { chromium } from '@playwright/test';
import assert from 'node:assert/strict';

const base=process.env.RAQVOI_URL || 'http://127.0.0.1:5174';
const browser=await chromium.launch({executablePath:process.env.RAQVOI_CHROME || 'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true});
try {
 const context=await browser.newContext({viewport:{width:1920,height:1080},hasTouch:true});
 if(process.env.RAQVOI_PREVIEW_CODE) {
  const response=await context.request.post(base+'/__access/unlock',{form:{code:process.env.RAQVOI_PREVIEW_CODE},maxRedirects:0});
  assert.equal(response.status(),303,'Preview unlock failed');
 }
 const page=await context.newPage();
 const errors=[];page.on('pageerror',error=>errors.push(error.message));
 const zoom=()=>page.locator('.main-product-image').evaluate(el=>({scale:Number(el.style.getPropertyValue('--zoom-level')),x:parseFloat(el.style.getPropertyValue('--zoom-x')),y:parseFloat(el.style.getPropertyValue('--zoom-y'))}));
 for(const viewport of [{width:1920,height:1080},{width:1366,height:768}]) {
  await page.setViewportSize(viewport);
  await page.goto(base+'/#/product/emerald-noor');
  const image=page.locator('.main-product-image');await image.waitFor();
  const frame=await image.boundingBox();
  const controls=await page.locator('.image-zoom-controls').boundingBox();
  const purchase=await page.locator('.product-purchase').boundingBox();
  assert(frame.y+frame.height<viewport.height,'Full product image should fit on desktop');
  assert(controls.y+controls.height<viewport.height,'Zoom controls should fit on desktop');
  assert(purchase.y+purchase.height<viewport.height,'Buying controls should fit on desktop');
 }
 await page.getByRole('button',{name:'Zoom in',exact:true}).click();
 await page.getByRole('button',{name:'Zoom in',exact:true}).click();
 const image=page.locator('.main-product-image');
 const frame=await image.boundingBox();const x=frame.x+frame.width/2,y=frame.y+frame.height/2;
 const before=await zoom();
 await page.mouse.move(x,y);await page.mouse.down();await page.mouse.move(x-55,y-30,{steps:8});await page.mouse.up();
 const left=await zoom();
 assert.equal(left.scale,before.scale,'Dragging must keep the same zoom');
 assert(left.x>before.x && left.y>before.y,'Image should follow a left/up drag');
 await page.mouse.move(x,y);await page.mouse.down();await page.mouse.move(x+55,y+30,{steps:8});await page.mouse.up();
 const right=await zoom();
 assert.equal(right.scale,before.scale,'Second drag must keep the same zoom');
 assert(right.x<left.x && right.y<left.y,'Image should follow a right/down drag');
 assert.equal(await image.locator('img').getAttribute('draggable'),'false');
 const ctrlWheelAllowed=await image.evaluate(el=>el.dispatchEvent(new WheelEvent('wheel',{deltaY:100,ctrlKey:true,bubbles:true,cancelable:true})));
 assert(ctrlWheelAllowed,'Browser zoom must not be cancelled by product zoom');
 assert.equal((await zoom()).scale,before.scale,'Browser zoom gesture must not change image zoom');
 await page.setViewportSize({width:390,height:844});
 const mobile=await image.boundingBox();
 const touchX=mobile.x+mobile.width/2,touchY=mobile.y+mobile.height/2;
 const cdp=await context.newCDPSession(page);
 const beforeTouch=await zoom();
 await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:touchX,y:touchY,id:1}]});
 await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:touchX-35,y:touchY-20,id:1}]});
 await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
 const afterTouch=await zoom();
 assert.equal(afterTouch.scale,beforeTouch.scale,'Touch panning must retain zoom');
 assert(afterTouch.x>beforeTouch.x,'Touch image should follow a left drag');
 assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'Mobile page overflow');
 await page.setViewportSize({width:3840,height:1600});
 await page.goto(base+'/#/');
 assert((await page.locator('.hero').boundingBox()).width<=1441,'Zooming out must not expand the hero indefinitely');
 await page.goto(base+'/#/shop');
 assert((await page.locator('.shop-layout').boundingBox()).width<=1441,'Zooming out must not expand the catalogue indefinitely');
 assert((await page.locator('.product-photo').first().boundingBox()).height<500,'Catalogue cards should stay compact');
 assert.deepEqual(errors,[]);
 console.log('Zoom/layout checks passed: desktop fit, mouse and touch pan direction, retained zoom, browser zoom isolation, mobile overflow and bounded wide-screen content.');
 await context.close();
} finally { await browser.close(); }
