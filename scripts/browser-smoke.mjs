import {createRequire} from 'node:module';
import {resolve} from 'node:path';
import assert from 'node:assert/strict';
const {chromium}=createRequire(resolve(process.env.PLAYWRIGHT_PACKAGE_JSON||'.qa/package.json'))('playwright');
const browser=await chromium.launch({headless:true});
const page=await browser.newPage({viewport:{width:1500,height:960}});const errors=[];
page.on('pageerror',e=>errors.push(e.message));
try{
 await page.goto('http://127.0.0.1:5173');
 await page.getByRole('button',{name:'New blank deck',exact:true}).click();
 await page.getByRole('navigation',{name:'Creation tools'}).waitFor();
 await page.getByRole('button',{name:'Add Heart',exact:true}).click();
 assert.equal(await page.evaluate(async()=>{const {useEditor}=await import('/src/store/editor.ts');return useEditor.getState().deck.slides[0].elements.filter(e=>e.name==='Heart').length;}),1);
 await page.getByRole('button',{name:'Text',exact:true}).click();
 await page.getByLabel('Search fonts').fill('DejaVu');
 assert.equal(await page.locator('.studio-fonts button').count(),3);
 await page.getByRole('button',{name:'Themes',exact:true}).click();
 assert.equal(await page.locator('.studio-theme').count(),20);
 await page.locator('.studio-theme').nth(9).click();
 await page.getByRole('button',{name:'Apply to deck',exact:true}).click();
 await page.getByRole('button',{name:'Agents',exact:true}).click();
 await page.getByRole('button',{name:'New agent',exact:true}).click();
 await page.getByLabel('Agent name').fill('Hackathon helper');
 await page.getByLabel('Agent instructions').fill('Create simple blue graphics for our presentation.');
 await page.getByRole('button',{name:'Save agent',exact:true}).click();
 assert.equal(await page.getByText('Hackathon helper',{exact:true}).count(),1);
 await page.getByRole('button',{name:'Claude AI',exact:true}).click();
 await page.getByRole('button',{name:'AI settings',exact:true}).click();
 await page.getByLabel('Anthropic API key').fill('mock-key-for-ui-test');
 await page.getByRole('button',{name:'Save settings',exact:true}).click();
 await page.route('https://api.anthropic.com/v1/messages',async route=>{
  const data=route.request().postDataJSON();assert.equal(data.model,'claude-opus-5-5');assert.equal(route.request().headers()['anthropic-version'],'2026-10-21');
  await route.fulfill({status:200,contentType:'application/json',body:JSON.stringify({model:data.model,stop_reason:'end_turn',usage:{input_tokens:100,output_tokens:60},content:[{type:'text',text:JSON.stringify({summary:'A violet circle',operations:[{tool:'element',name:'Violet circle',svg:'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><circle cx="50" cy="50" r="45" fill="#7054d7"/></svg>'}]})}]})});
 });
 await page.getByLabel('Describe your idea').fill('A violet circle');
 await page.getByRole('button',{name:'Generate with Claude',exact:true}).click();
 await page.getByRole('button',{name:'Apply changes',exact:true}).waitFor();
 await page.getByRole('button',{name:'Save graphics for reuse',exact:true}).click();
 await page.getByRole('button',{name:'Apply changes',exact:true}).click();
 const applied=await page.evaluate(async()=>{
  const {useEditor,undo,redo}=await import('/src/store/editor.ts');
  const count=()=>useEditor.getState().deck.slides[0].elements.filter(e=>e.name==='Violet circle').length;
  const after=count();undo();const undone=count();redo();return {after,undone,redone:count(),storage:JSON.stringify({...localStorage})};
 });
 assert.deepEqual([applied.after,applied.undone,applied.redone],[1,0,1]);assert.ok(!applied.storage.includes('mock-key-for-ui-test'));
 const checks=await page.evaluate(async()=>{
  const {safeSvg}=await import('/src/studio/svg.ts');
  const bad=['<svg viewBox="0 0 100 100"><script>alert(1)</script></svg>','<svg viewBox="0 0 100 100" onload="alert(1)"/>','<svg viewBox="0 0 100 100"><image href="https://example.com/a"/></svg>','<svg viewBox="0 0 100 100"><rect style="fill:red"/></svg>','<!DOCTYPE svg><svg viewBox="0 0 100 100"/>'];
  const blocked=bad.map(svg=>{try{safeSvg(svg);return false;}catch{return true;}});
  const {useEditor,mutate}=await import('/src/store/editor.ts');const {preparePlan,applyPreparedPlan}=await import('/src/ai/apply.ts');
  const source=useEditor.getState().deck,next=preparePlan({summary:'Notes',operations:[{tool:'notes',text:'Example notes'}]},source,source.slides[0].id);
  mutate(d=>{d.title='Edited after proposal';});let stale=false;try{applyPreparedPlan(source,next);}catch{stale=true;}
  const {TEMPLATES,createFromTemplate}=await import('/src/model/templates.ts');
  return {blocked,stale,templates:TEMPLATES.map(t=>createFromTemplate(t.id).slides.length)};
 });
 assert.ok(checks.blocked.every(Boolean));assert.ok(checks.stale);assert.ok(checks.templates.every(n=>n>0));
 await page.getByRole('button',{name:'Elements',exact:true}).click();
 await page.getByText('Your generated elements',{exact:true}).waitFor();
 await page.screenshot({path:'studio-smoke.png',fullPage:true});
 assert.deepEqual(errors,[]);console.log('Browser smoke passed: galleries, themes, agents, mocked Claude request, saved elements, atomic undo, stale proposal guard, SVG rejection, every template.');
}finally{await browser.close();}
