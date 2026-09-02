'use strict';
// SHARP recovery layer: protects the generic question pipeline from stale
// asynchronous callbacks crossing into special-purpose game screens.
// Loaded last so it can guard the complete app stack without changing scoring/data.

const SHARP_SPECIAL_IDS=new Set(['reflex','sustained','dual','words']);

// The generic next() function is only valid for generator-backed domains.
// A delayed callback from the previous domain must never enter a special domain.
const sharpRecoveryBaseNext=next;
next=function(){
  if(!active)return;

  if(SHARP_SPECIAL_IDS.has(active.id)){
    console.warn('SHARP ignored stale generic next() in special domain:',active.id);
    return;
  }

  if(active.screen==='blockResult'||active.screen==='sessionResult')return;

  // If a fresh question/memory item is already live and has not been settled,
  // this is a stale duplicate callback. This also protects memory/visual-memory
  // presentation periods, not just normal question screens.
  if(active.q&&!active._questionSettled)return;

  return sharpRecoveryBaseNext();
};

// Defensive renderer recovery. A generator-backed screen should never receive
// a null question; if state is momentarily inconsistent, regenerate rather than
// replacing the whole app with a runtime-error screen.
const sharpRecoveryBaseQuestion=question;
question=function(){
  if(!active)return;
  const q=active.q;
  if(!q||typeof q!=='object'||!q.kind){
    console.warn('SHARP recovered null question state:',active.id,active.screen);
    clearInterval(timerHandle);
    timerHandle=null;

    if(SHARP_SPECIAL_IDS.has(active.id)){
      // Special domains own their own state/rendering pipeline. Restart only
      // the current block rather than crashing or touching stored progress.
      return begin();
    }

    active.q=null;
    active.qStart=null;
    active.deadline=null;
    active._questionSettled=false;
    return next();
  }
  return sharpRecoveryBaseQuestion();
};

// Never let a stale form/click response evaluate correct() against a null q.
const sharpRecoveryBaseAnswer=answer;
answer=function(r){
  if(!active||!active.q||typeof active.q!=='object'||!active.q.kind){
    console.warn('SHARP ignored stale answer without live question');
    return;
  }
  return sharpRecoveryBaseAnswer(r);
};
