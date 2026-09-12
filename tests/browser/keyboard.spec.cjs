const {test,expect}=require('playwright/test');

// Browser emulation does not open the iOS system keyboard. Model its independent
// visual viewport (including focus scrolling), then exercise real DOM/tap events.
async function keyboardPage(page){
  await page.addInitScript(()=>{
    const viewport=new EventTarget();
    const state={height:window.innerHeight,offsetTop:0,scale:1};
    for(const key of Object.keys(state))Object.defineProperty(viewport,key,{get:()=>state[key]});
    Object.defineProperty(window,'visualViewport',{value:viewport,configurable:true});
    window.keyboardFixture={state,submits:[],set(values,type='resize'){
      Object.assign(state,values);viewport.dispatchEvent(new Event(type));
    }};
    document.addEventListener('submit',e=>{
      if(e.target.matches('#answerForm,#dualForm,#recallForm'))window.keyboardFixture.submits.push({form:e.target.id,focused:document.activeElement?.id});
    },true);
    document.addEventListener('focusout',e=>{
      if(e.target.id==='ans')window.keyboardFixture.set({height:window.innerHeight,offsetTop:0});
    });
  });
  await page.goto('/gpt-sharp/final.html');
  await page.getByRole('button',{name:'Games',exact:true}).click();
  await page.getByRole('button',{name:/^Arithmetic/}).click();
  await page.getByLabel('Answer',{exact:true}).focus();
  await page.evaluate(()=>window.keyboardFixture.set({height:430,offsetTop:180}));
}
async function bounds(page){return page.evaluate(()=>{
  const box=selector=>{const r=document.querySelector(selector).getBoundingClientRect();return{top:r.top,bottom:r.bottom,left:r.left,right:r.right,height:r.height};};
  return{pane:box('.input-session'),prompt:box('.q'),form:box('.form'),header:box('.shead'),height:visualViewport.height,top:visualViewport.offsetTop};
});}

test('keyboard resize and Safari pan keep the question and answer in view',async({page})=>{
  await keyboardPage(page);
  for(const values of [{height:430,offsetTop:180},{height:350,offsetTop:260}]){
    await page.evaluate(v=>window.keyboardFixture.set(v,'scroll'),values);
    const b=await bounds(page);
    expect(b.pane.top).toBe(b.top);expect(b.pane.height).toBe(b.height);
    expect(b.header.top).toBeGreaterThanOrEqual(b.top);
    expect(b.prompt.top).toBeGreaterThanOrEqual(b.header.bottom);
    expect(b.prompt.bottom).toBeLessThanOrEqual(b.form.top);
    expect(b.form.bottom).toBeLessThanOrEqual(b.top+b.height);
  }
  // A longer higher-level prompt must remain scrollable without moving the form.
  await page.evaluate(()=>document.querySelector('.q').textContent=('A long arithmetic prompt with several steps. ').repeat(30));
  const overflow=await page.locator('.qwrap').evaluate(el=>({height:el.clientHeight,scroll:el.scrollHeight,overflow:getComputedStyle(el).overflowY}));
  expect(overflow.scroll).toBeGreaterThan(overflow.height);expect(overflow.overflow).toBe('auto');
  const b=await bounds(page);expect(b.form.bottom).toBeLessThanOrEqual(b.top+b.height);
  await page.getByRole('button',{name:'Pause',exact:true}).click();
  await expect(page.getByRole('button',{name:'Continue session'})).toBeVisible();
  await page.getByRole('button',{name:'Continue session'}).click();
  await page.getByRole('button',{name:'Save and exit session'}).click();
  await expect(page.locator('.input-session')).toHaveCount(0);
  await expect(page.getByRole('button',{name:'Start Focused Daily',exact:true})).toBeVisible();
});

for(const method of ['tap','click'])test(`one ${method} submits once without first dismissing the keyboard`,async({page})=>{
  await keyboardPage(page);
  const input=page.getByLabel('Answer',{exact:true}),submit=page.getByRole('button',{name:'Submit answer'});
  await submit[method](); // Required-field validation still runs.
  expect(await page.evaluate(()=>window.keyboardFixture.submits.length)).toBe(0);
  await input.fill('18');
  await page.getByRole('button',{name:'Toggle positive or negative answer'})[method]();
  await expect(input).toHaveValue('-18');await expect(input).toBeFocused();
  await page.getByRole('button',{name:'Toggle positive or negative answer'})[method]();
  await submit[method]();
  await expect(page.locator('.eye')).toHaveText(/2\/5/);
  expect(await page.evaluate(()=>window.keyboardFixture.submits)).toEqual([{form:'answerForm',focused:'ans'}]);
  // Native keyboard Enter keeps the same submission path.
  await page.getByLabel('Answer',{exact:true}).fill('18');
  await page.getByLabel('Answer',{exact:true}).press('Enter');
  await expect(page.locator('.eye')).toHaveText(/3\/5/);
  expect(await page.evaluate(()=>window.keyboardFixture.submits.length)).toBe(2);
});

test('dragging away from submit does not commit an answer; zoom can pan naturally',async({page})=>{
  await keyboardPage(page);await page.getByLabel('Answer',{exact:true}).fill('18');
  const button=await page.getByRole('button',{name:'Submit answer'}).boundingBox();
  await page.mouse.move(button.x+button.width/2,button.y+button.height/2);await page.mouse.down();
  await page.mouse.move(2,2);await page.mouse.up();
  expect(await page.evaluate(()=>window.keyboardFixture.submits.length)).toBe(0);
  const before=await bounds(page);
  await page.evaluate(()=>window.keyboardFixture.set({scale:2,height:215,offsetTop:300}));
  const after=await bounds(page);expect(after.pane).toEqual(before.pane);
  await page.evaluate(()=>window.keyboardFixture.set({scale:1,height:844,offsetTop:0}));
  const restored=await bounds(page);expect(restored.pane.top).toBe(0);expect(restored.pane.height).toBe(844);
});
