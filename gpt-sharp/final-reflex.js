'use strict';
// Reflex override: press and hold, then release on the stimulus.
// Loaded after the core/quality layers so the rest of SHARP remains unchanged.

// iOS/Safari: make the reflex surface behave like a control, not selectable text.
const reflexStyle=document.createElement('style');
reflexStyle.textContent=`
.reflexPad[data-reflex-hold],
.reflexPad[data-reflex-hold] *{
  -webkit-user-select:none !important;
  user-select:none !important;
  -webkit-touch-callout:none !important;
  -webkit-user-drag:none !important;
}
.reflexPad[data-reflex-hold]{
  touch-action:none !important;
  cursor:default;
}
`;
document.head.appendChild(reflexStyle);

startReflex=function(){
  clearTimeout(active?.reflexWait);
  Object.assign(active,{
    screen:'reflex',reflexTrial:0,reflexTimes:[],reflexFalse:0,
    reflexState:'ready',reflexHolding:false,reflexPointer:null
  });
  render();
};

scheduleReflex=function(){
  if(!active||active.screen!=='reflex')return;
  if(active.reflexTrial>=5)return finishReflex();
  active.reflexState='ready';
  active.reflexHolding=false;
  active.reflexPointer=null;
  render();
};

reflexScreen=function(){
  let state=active.reflexState;
  let ready=state==='ready',wait=state==='wait',go=state==='go',bad=state==='bad';
  let title=ready?'PRESS & HOLD':wait?'KEEP HOLDING':go?'RELEASE NOW':'TOO EARLY';
  let text=ready?'Press the pad and keep your finger down.':wait?'Wait for the green signal. Do not release.':go?'Lift your finger as fast as possible.':'You released before the signal. Trial repeats.';
  let icon=go?'⚡':bad?'×':wait?'●':'↓';
  root.innerHTML=`<div class="app"><main class="session"><div class="shead"><button class="x" data-exit>×</button><div class="prog"><i style="width:${active.reflexTrial/5*100}%"></i></div><div class="timer">${active.reflexTrial+1}/5</div></div><div class="reflexWrap"><button class="reflexPad ${go?'go':bad?'bad':''}" data-reflex-hold aria-label="Reflex hold pad"><div class="bolt">${icon}</div><h2>${title}</h2><p>${text}</p></button></div></main></div>`;
};

function reflexHoldStart(e){
  if(!active||active.screen!=='reflex'||active.reflexState!=='ready')return;
  e.preventDefault();
  e.stopPropagation();
  const pad=e.target.closest('[data-reflex-hold]');
  try{pad?.setPointerCapture?.(e.pointerId)}catch{}
  active.reflexHolding=true;
  active.reflexPointer=e.pointerId;
  active.reflexState='wait';
  render();
  let delay=ri(900,2400);
  active.reflexWait=setTimeout(()=>{
    if(!active||active.screen!=='reflex'||active.reflexState!=='wait'||!active.reflexHolding)return;
    active.reflexState='go';
    active.reflexGo=performance.now();
    render();
  },delay);
}

function reflexHoldEnd(e){
  if(!active||active.screen!=='reflex'||!active.reflexHolding)return;
  if(active.reflexPointer!=null&&e.pointerId!=null&&active.reflexPointer!==e.pointerId)return;
  e.preventDefault();
  e.stopPropagation();
  active.reflexHolding=false;
  active.reflexPointer=null;
  if(active.reflexState==='wait'){
    clearTimeout(active.reflexWait);
    active.reflexFalse++;
    active.reflexState='bad';
    render();
    setTimeout(()=>{if(active?.screen==='reflex')scheduleReflex()},650);
    return;
  }
  if(active.reflexState==='go'){
    let rt=Math.max(1,performance.now()-active.reflexGo);
    active.reflexTimes.push(rt);
    active.reflexTrial++;
    active.reflexState='ready';
    render();
    setTimeout(()=>{if(active?.screen==='reflex')scheduleReflex()},400);
  }
}

// Disable the old tap handler. Pointer events below own the reflex interaction.
reflexTap=function(){};

document.addEventListener('pointerdown',e=>{
  if(e.target.closest('[data-reflex-hold]'))reflexHoldStart(e);
},{passive:false,capture:true});

document.addEventListener('pointerup',e=>{
  if(active?.screen==='reflex'&&active.reflexHolding)reflexHoldEnd(e);
},{passive:false,capture:true});

document.addEventListener('pointercancel',e=>{
  if(active?.screen==='reflex'&&active.reflexHolding)reflexHoldEnd(e);
},{passive:false,capture:true});

// Prevent Safari's long-press selection/copy UI inside the reflex surface only.
document.addEventListener('contextmenu',e=>{
  if(e.target.closest('[data-reflex-hold]')){
    e.preventDefault();
    e.stopPropagation();
  }
},{capture:true});

document.addEventListener('selectstart',e=>{
  if(e.target.closest('[data-reflex-hold]')){
    e.preventDefault();
    e.stopPropagation();
  }
},{capture:true});

document.addEventListener('dragstart',e=>{
  if(e.target.closest('[data-reflex-hold]'))e.preventDefault();
},{capture:true});

// Load the final transition-recovery guard after the parser has loaded
// final-stability.js. This keeps the recovery layer last in the override chain.
setTimeout(()=>{
  if(document.querySelector('script[data-sharp-recovery]'))return;
  const s=document.createElement('script');
  s.src='final-recovery.js?v=20260902r1';
  s.dataset.sharpRecovery='1';
  document.head.appendChild(s);
},0);
