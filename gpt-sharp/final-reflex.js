'use strict';
// Reflex override: press and hold, then release on the stimulus.
// Loaded after the core/quality layers so the rest of SHARP remains unchanged.

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
  root.innerHTML=`<div class="app"><main class="session"><div class="shead"><button class="x" data-exit>×</button><div class="prog"><i style="width:${active.reflexTrial/5*100}%"></i></div><div class="timer">${active.reflexTrial+1}/5</div></div><div class="reflexWrap"><button class="reflexPad ${go?'go':bad?'bad':''}" data-reflex-hold style="touch-action:none;-webkit-touch-callout:none"><div class="bolt">${icon}</div><h2>${title}</h2><p>${text}</p></button></div></main></div>`;
};

function reflexHoldStart(e){
  if(!active||active.screen!=='reflex'||active.reflexState!=='ready')return;
  e.preventDefault();
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
