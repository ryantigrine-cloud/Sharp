const {test,expect}=require('playwright/test');
const app='/gpt-sharp/releases/20260912/index.html';
async function open(page){await page.goto(app);await expect(page.getByRole('button',{name:'Start Focused Daily',exact:true})).toBeVisible();}
async function practice(page,name){await page.getByRole('button',{name:'Games',exact:true}).click();await page.getByRole('button',{name:new RegExp('^'+name)}).click();}
test('home selection, navigation and large text stay usable',async({page})=>{
  const errors=[];page.on('pageerror',e=>errors.push(e.message));await open(page);await page.getByRole('heading',{name:'Make time to think.'}).dblclick();await page.getByRole('button',{name:'Performance',exact:true}).click();await expect(page.getByText('Your progress',{exact:true})).toBeVisible();await page.getByRole('button',{name:'Games',exact:true}).click();await expect(page.getByRole('button',{name:/^IQ Matrix/})).toBeVisible();expect(errors).toEqual([]);
});
test('numeric forms, visual selectors, pause and landscape navigation work',async({page})=>{
  await open(page);await practice(page,'Arithmetic');await expect(page.getByLabel('Answer',{exact:true})).toHaveAttribute('inputmode','decimal');await expect(page.getByRole('button',{name:'Toggle positive or negative answer'})).toBeVisible();await page.getByRole('button',{name:'Pause',exact:true}).click();await page.setViewportSize({width:844,height:390});await page.getByRole('button',{name:'Continue session'}).click();await expect(page.getByRole('button',{name:'Submit answer'})).toBeInViewport();await page.getByRole('button',{name:'Save and exit session'}).click();await practice(page,'IQ Matrix');await expect(page.locator('input')).toHaveCount(0);await expect(page.getByRole('button',{name:/^Option 1/})).toBeVisible();
});
test('Reflex keyboard hold/release reaches five trials and preserves the pad',async({page})=>{
  await open(page);await practice(page,'Reflex');const pad=page.locator('[data-reflex-hold]'),handle=await pad.elementHandle();
  for(let i=0;i<5;i++){await expect(pad.getByRole('heading')).toHaveText('PRESS AND HOLD');await pad.focus();await page.keyboard.down('Space');await expect(pad).toHaveClass(/go/);expect(await handle.evaluate(node=>node.isConnected)).toBe(true);await page.keyboard.up('Space');}
  await expect(page.getByRole('button',{name:'Back to Games'})).toBeVisible();await expect(page.getByText('100%',{exact:true})).toBeVisible();
});
test('Reflex holds pointer capture when released outside the pad',async({page})=>{
  await open(page);await practice(page,'Reflex');const pad=page.locator('[data-reflex-hold]'),box=await pad.boundingBox();await page.mouse.move(box.x+box.width/2,box.y+box.height/2);await page.mouse.down();await expect(pad).toHaveClass(/go/);await page.mouse.move(2,2);await page.mouse.up();await expect(page.locator('#reflexCount')).toHaveText('2/5');
});
test('bundled Word Fluency starts with network unavailable',async({page,context})=>{
  await open(page);await context.setOffline(true);await practice(page,'Word Fluency');await expect(page.getByRole('heading',{name:'Anagram Sprint'})).toBeVisible();await expect(page.locator('[data-letter]')).toHaveCount(6);await page.getByRole('button',{name:'Save and exit session'}).click();await expect(page.getByRole('button',{name:'Start Focused Daily',exact:true})).toBeVisible();
});
test('complete Full Daily timeout path, recall encoding and saved reload',async({page})=>{
  test.setTimeout(240000);const errors=[];page.on('pageerror',e=>errors.push(e.message));await page.clock.install();await open(page);await page.getByRole('button',{name:'Full Daily',exact:true}).click();await page.getByRole('button',{name:'I’ve encoded them'}).click();
  let loops=0;
  while(!await page.getByRole('button',{name:'Return to Today',exact:true}).count()&&++loops<350){
    await page.clock.runFor(40);
    const next=page.locator('[data-next]');if(await next.count()){await next.click();continue;}
    const pad=page.locator('[data-reflex-hold]');if(await pad.count()){
      const heading=await pad.getByRole('heading').textContent();
      if(heading==='PRESS AND HOLD'){await pad.focus();await page.keyboard.down('Space');await page.clock.runFor(2500);await page.keyboard.up('Space');await page.clock.runFor(500);}else await page.clock.runFor(500);
    }else await page.clock.fastForward(40000);
  }
  expect(loops).toBeLessThan(350);await expect(page.getByRole('button',{name:'Return to Today',exact:true})).toBeVisible();expect(errors).toEqual([]);await page.getByRole('button',{name:'Return to Today',exact:true}).click();await page.reload();await page.getByRole('button',{name:'Performance',exact:true}).click();await expect(page.getByText(/19 blocks/)).toBeVisible();await expect(page.getByText('current series',{exact:false}).last()).toBeVisible();
});
