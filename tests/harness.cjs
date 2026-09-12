const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const source=path.join(__dirname,'../gpt-sharp/releases/20260912');
const files=['dictionary','data','games','quality','controller','reflex','ui','app'];
function setup(options={}){
  let wall=Date.parse(options.date||'2026-09-12T12:00:00Z'),now=0,seq=0,seed=options.seed||42,unique=0;
  const timers=new Map(),listeners={},winListeners={},errors=[],storage=options.storage||new Map();
  let locks=Promise.resolve();
  class Clock extends Date{constructor(...args){super(...(args.length?args:[wall]));}static now(){return wall;}}
  class El{
    constructor(){this.nodeType=1;this.isConnected=true;this.innerHTML='';this.dataset={};this.hidden=false;this.textContent='';this.disabled=false;this.style={setProperty(){}};this.classList={add(){},remove(){},toggle(){}};this.attrs={};}
    setAttribute(k,v){this.attrs[k]=v;}hasAttribute(k){return k in this.attrs;}getAttribute(k){return this.attrs[k];}
    appendChild(){}querySelector(){return null;}querySelectorAll(){return [];}closest(){return null;}focus(){}remove(){}click(){}
    setPointerCapture(id){this.capture=id;}hasPointerCapture(id){return this.capture===id;}releasePointerCapture(){this.capture=null;}
  }
  const root=new El(),notice=new El(),announcement=new El(),pad=new El();
  const document={head:new El(),body:new El(),documentElement:new El(),activeElement:null,hidden:false,
    createElement:()=>new El(),getElementById:id=>({root,storageNotice:notice,announcement}[id]||null),
    querySelector:selector=>selector==='[data-reflex-hold]'&&root.innerHTML.includes('data-reflex-hold')?pad:null,
    addEventListener:(type,fn)=>(listeners[type]??=[]).push(fn),dispatchEvent:event=>{for(const fn of listeners[event.type]||[])fn(event);}};
  const set=(fn,delay=0,interval=0)=>{const id=++seq;timers.set(id,{fn,at:now+delay,interval});return id;};
  const context={console,Date:Clock,document,Uint32Array,Blob,URL,CustomEvent:class{constructor(type,init={}){this.type=type;Object.assign(this,init);}},
    crypto:{randomUUID:()=>`test-${++unique}`,getRandomValues:a=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;a[0]=seed;return a;}},
    performance:{now:()=>now},innerHeight:844,visualViewport:null,
    navigator:options.noLocks?{}:{locks:{request:(_name,fn)=>{const task=locks.then(fn);locks=task.catch(()=>{});return task;}}},
    localStorage:{getItem:k=>storage.get(k)??null,setItem:(k,v)=>{if(options.quota?.()||options.failKey===k)throw new Error('QuotaExceededError');storage.set(k,String(v));}},
    setTimeout:(fn,d)=>set(fn,d),setInterval:(fn,d)=>set(fn,d,d),clearTimeout:id=>timers.delete(id),clearInterval:id=>timers.delete(id),
    requestAnimationFrame:fn=>set(fn,16),cancelAnimationFrame:id=>timers.delete(id),confirm:()=>true,
    addEventListener:(type,fn)=>(winListeners[type]??=[]).push(fn)};
  context.window=context;vm.createContext(context);
  const run=code=>vm.runInContext(code,context,{timeout:120000});
  for(const file of files)vm.runInContext(fs.readFileSync(path.join(source,file+'.js'),'utf8'),context,{filename:file+'.js',timeout:120000});
  function tick(ms){const end=now+ms;let count=0;while(true){const due=[...timers].filter(([,t])=>t.at<=end).sort((a,b)=>a[1].at-b[1].at||a[0]-b[0])[0];if(!due)break;if(++count>100000)throw new Error('Timer loop');const[id,t]=due;wall+=t.at-now;now=t.at;timers.delete(id);if(t.interval)timers.set(id,{...t,at:now+t.interval});try{t.fn();}catch(e){errors.push(e);}}wall+=end-now;now=end;}
  function dispatch(type,target={},extra={},windowEvent=false){const e={type,target,preventDefault(){},...extra};for(const fn of (windowEvent?winListeners:listeners)[type]||[]){try{const r=fn(e);r?.catch?.(e=>errors.push(e));}catch(e){errors.push(e);}}}
  return {run,tick,dispatch,errors,storage,root,notice,announcement,pad,timers,context,jumpWall:ms=>wall+=ms,read:code=>JSON.parse(JSON.stringify(run(code)))};
}
async function flush(h){await h.run('persistence.queue');for(let i=0;i<6;i++)await Promise.resolve();}
function answerCurrent(h,wait=500){h.tick(wait);h.run('answer(active.q.answer)');if(h.run("active?.phase==='confidence'"))h.run('commitConfidence(80)');h.tick(400);}
function complete(h,limit=2000){let i=0;while(h.run("active?.phase!=='sessionResult'&&active!=null")&&i++<limit){const phase=h.run('active.phase');if(phase==='blockResult'){if(h.run('active.practice'))return;h.run('nextBlock()');}else if(phase==='question')answerCurrent(h);else if(phase==='encoding'||phase==='dualEncoding')h.tick(3000);else if(phase==='dualMath'||phase==='dualRecall'){h.tick(500);h.run('dualAnswer(active.q.answer)');h.tick(400);}else if(phase==='sustained'){h.tick(50);h.run("if(active.q.meta.go)sustainedTap()");h.tick(h.run('active.susInterval'));}else if(phase==='words'){h.tick(h.run('active.limit||70')*1000+100);}else if(phase==='reflexReady'){h.run("reflexBegin('keyboard',' ',document.querySelector('[data-reflex-hold]'))");h.tick(2450);h.run("reflexEnd('keyboard',' ')");h.tick(500);}else if(phase==='qualityEncoding')h.run('finishEncoding()');else if(phase==='recall')h.run('submitRecall(String(active.recallItem.code))');else if(phase==='feedback')h.tick(500);else throw new Error('Unexpected phase '+phase);if(h.errors.length)throw h.errors[0];}if(i>=limit)throw new Error('Session did not finish');}
module.exports={setup,flush,complete,answerCurrent,source,files};
