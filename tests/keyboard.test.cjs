const test=require('node:test'),assert=require('node:assert/strict');
const{setup}=require('./harness.cjs');
function touchFixture(){
  const h=setup();h.run("start('practice','arithmetic')");h.tick(30);
  let clicks=0;const input={},panel={querySelector:()=>input};
  const button={nodeType:1,isConnected:true,disabled:false,dataset:{},hasAttribute:()=>false,
    closest:s=>s==='.input-session'?panel:['.input-session button','button'].includes(s)?button:null,
    getBoundingClientRect:()=>({left:0,top:0,right:100,bottom:60}),click:()=>clicks++};
  h.context.document.activeElement=input;
  const send=(type,extra={})=>h.dispatch(type,button,{button:0,isPrimary:true,pointerId:1,pointerType:'touch',clientX:50,clientY:30,...extra});
  return{h,button,send,clicks:()=>clicks};
}
test('touch activation waits for release and ignores cancelled, dragged, multiple-finger and stale taps',()=>{
  for(const cause of ['tap','cancel','drag','multi','stale','removed','disabled','outside']){
    const f=touchFixture();f.send('pointerdown');assert.equal(f.clicks(),0);
    if(cause==='cancel')f.send('pointercancel');
    if(cause==='drag'){f.send('pointermove',{clientX:80});f.send('pointermove',{clientX:50});}
    if(cause==='multi')f.send('pointerdown',{isPrimary:false,pointerId:2});
    if(cause==='stale')f.h.run("interruptCurrent('paused')");
    if(cause==='removed')f.button.isConnected=false;
    if(cause==='disabled')f.button.disabled=true;
    f.send('pointerup',cause==='outside'?{clientX:120}:{});
    f.send('pointerup'); // A duplicate release must never activate twice.
    assert.equal(f.clicks(),cause==='tap'?1:0,cause);assert.deepEqual(f.h.errors,[]);
  }
});
test('touch compatibility click is cancelled while keyboard and synthetic activation remain available',()=>{
  const f=touchFixture();f.send('pointerdown');f.send('pointerup');
  for(const [isTrusted,detail,expected]of [[true,1,true],[true,0,false],[false,0,false]]){
    let cancelled=false;
    f.h.dispatch('click',f.button,{isTrusted,detail,preventDefault(){cancelled=true;},stopImmediatePropagation(){}});
    assert.equal(cancelled,expected);
  }
  assert.deepEqual(f.h.errors,[]);
});
