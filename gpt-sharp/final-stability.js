'use strict';
// SHARP stability layer: transition guards, iOS keyboard viewport handling,
// safe block progression, and next-domain previews. Loaded last.

// ---------- Mobile keyboard / visual viewport ----------
const sharpStabilityStyle=document.createElement('style');
sharpStabilityStyle.textContent=`
:root{--sharp-vvh:100dvh}
@media(max-width:768px){
  body.sharp-keyboard{overflow:hidden}
  body.sharp-keyboard .app{
    min-height:var(--sharp-vvh);
    height:var(--sharp-vvh);
    overflow:hidden;
    padding-top:max(6px,env(safe-area-inset-top));
    padding-bottom:6px;
  }
  body.sharp-keyboard .session{
    min-height:0;
    height:100%;
    overflow:hidden;
  }
  body.sharp-keyboard .shead{flex:0 0 auto}
  body.sharp-keyboard .qwrap{
    min-height:0;
    padding:8px 4px 10px;
    justify-content:center;
    overflow:hidden;
  }
  body.sharp-keyboard .q{font-size:clamp(30px,10vw,54px)}
  body.sharp-keyboard .q.compact{font-size:clamp(22px,6.6vw,36px)}
  body.sharp-keyboard .form{
    flex:0 0 auto;
    position:relative;
    z-index:5;
    background:var(--bg);
    padding:6px 0 max(6px,env(safe-area-inset-bottom));
  }
  body.sharp-keyboard .input{height:58px}
}
.nextPreview{
  margin:12px 0 2px;
  border:1px solid var(--line);
  background:var(--p);
  border-radius:15px;
  padding:13px 15px;
  display:flex;
  align-items:center;
  justify-content:space-between;
  gap:12px;
}
.nextPreview small{display:block;color:var(--mut);font-size:10px;letter-spacing:.12em;text-transform:uppercase;font-weight:800}
.nextPreview strong{display:block;margin-top:4px;font-size:16px}
.nextPreview .ico{flex:0 0 42px;width:42px;height:42px}
`;
document.head.appendChild(sharpStabilityStyle);

function sharpSyncViewport(){
  const vv=window.visualViewport;
  const h=Math.max(280,Math.round(vv?.height||window.innerHeight));
  document.documentElement.style.setProperty('--sharp-vvh',h+'px');
}
sharpSyncViewport();
window.visualViewport?.addEventListener('resize',sharpSyncViewport,{passive:true});
window.visualViewport?.addEventListener('scroll',sharpSyncViewport,{passive:true});
window.addEventListener('orientationchange',()=>setTimeout(sharpSyncViewport,150),{passive:true});

document.addEventListener('focusin',e=>{
  if(e.target.matches?.('.input')){
    document.body.classList.add('sharp-keyboard');
    sharpSyncViewport();
    requestAnimationFrame(()=>window.scrollTo(0,0));
  }
});
document.addEventListener('focusout',e=>{
  if(e.target.matches?.('.input'))setTimeout(()=>{
    if(!document.activeElement?.matches?.('.input'))document.body.classList.remove('sharp-keyboard');
    sharpSyncViewport();
  },120);
});

// Core auto-focus should not make Safari pan the entire document.
const sharpNativeInputFocus=HTMLInputElement.prototype.focus;
HTMLInputElement.prototype.focus=function(options){
  if(this.classList?.contains('input')&&document.getElementById('root')?.contains(this)){
    try{return sharpNativeInputFocus.call(this,{...(options||{}),preventScroll:true})}catch{}
  }
  return sharpNativeInputFocus.call(this,options);
};

// ---------- Single-settlement guards ----------
// A response and the countdown can otherwise land in the same event window.
const sharpBaseBegin=begin;
begin=function(){
  if(active){
    active._questionSettled=false;
    active._blockCommitted=false;
    active._dualSettled=false;
    active._nextBusy=false;
  }
  return sharpBaseBegin();
};

const sharpBaseNext=next;
next=function(){
  if(!active)return;
  active._questionSettled=false;
  return sharpBaseNext();
};

const sharpBaseAnswer=answer;
answer=function(r){
  if(!active||active._questionSettled)return;
  active._questionSettled=true;
  return sharpBaseAnswer(r);
};

const sharpBaseTimeoutQuestion=timeoutQuestion;
timeoutQuestion=function(){
  if(!active||active._questionSettled)return;
  active._questionSettled=true;
  return sharpBaseTimeoutQuestion();
};

const sharpBaseFinishBlock=finishBlock;
finishBlock=function(o={}){
  if(!active||active._blockCommitted)return;
  active._blockCommitted=true;
  return sharpBaseFinishBlock(o);
};

// Dual-task response/timeout race protection.
const sharpBaseNextDualMath=nextDualMath;
nextDualMath=function(){
  if(active)active._dualSettled=false;
  return sharpBaseNextDualMath();
};
const sharpBaseDualMathAnswer=dualMathAnswer;
dualMathAnswer=function(v){
  if(!active||active._dualSettled)return;
  active._dualSettled=true;
  return sharpBaseDualMathAnswer(v);
};
const sharpBaseDualRecallAnswer=dualRecallAnswer;
dualRecallAnswer=function(v){
  if(!active||active._dualSettled)return;
  active._dualSettled=true;
  return sharpBaseDualRecallAnswer(v);
};
const sharpBaseDualTimeout=dualTimeout;
dualTimeout=function(){
  if(!active||active._dualSettled)return;
  active._dualSettled=true;
  return sharpBaseDualTimeout();
};

// Quality-flow controls: protect against rapid double taps.
if(typeof finishEncoding==='function'){
  const sharpBaseFinishEncoding=finishEncoding;
  let sharpEncodingBusy=false;
  finishEncoding=function(){
    if(sharpEncodingBusy||!qualityFlow)return;
    sharpEncodingBusy=true;
    try{return sharpBaseFinishEncoding()}finally{setTimeout(()=>{sharpEncodingBusy=false},500)}
  };
}
if(typeof submitRecall==='function'){
  const sharpBaseSubmitRecall=submitRecall;
  let sharpRecallBusy=false;
  submitRecall=function(v){
    if(sharpRecallBusy||!qualityFlow)return;
    sharpRecallBusy=true;
    try{return sharpBaseSubmitRecall(v)}finally{setTimeout(()=>{sharpRecallBusy=false},500)}
  };
}

// ---------- Next-domain heads-up ----------
const sharpBaseBlockResult=blockResult;
blockResult=function(){
  sharpBaseBlockResult();
  if(!active||active.practice)return;
  const nextIndex=active.bi+1;
  const btn=root.querySelector('[data-next]');
  if(!btn)return;
  if(nextIndex>=active.ids.length){
    btn.textContent='Finish Session';
    return;
  }
  const nextId=active.ids[nextIndex];
  const m=META[nextId];
  if(!m)return;
  btn.insertAdjacentHTML('beforebegin',`<div class="nextPreview"><div><small>Up next</small><strong>${esc(m[0])} · Level ${S.domains[nextId].level}</strong></div><div class="ico">${m[1]}</div></div>`);
  btn.textContent='Start '+m[0];
};

// One navigation action per block-result tap.
document.addEventListener('click',e=>{
  const b=e.target.closest('[data-next]');
  if(!b)return;
  if(b.dataset.sharpBusy==='1'){
    e.preventDefault();
    e.stopImmediatePropagation();
    return;
  }
  b.dataset.sharpBusy='1';
  b.disabled=true;
},true);

// Prevent repeated answer taps before the first response transition has completed.
document.addEventListener('click',e=>{
  const b=e.target.closest('[data-answer]');
  if(!b||!active)return;
  if(active._questionSettled){
    e.preventDefault();
    e.stopImmediatePropagation();
  }
},true);

// ---------- Defensive diagnostics ----------
window.addEventListener('unhandledrejection',e=>{
  console.error('SHARP unhandled rejection',e.reason);
});
