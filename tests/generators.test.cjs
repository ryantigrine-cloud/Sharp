const test=require('node:test');
const assert=require('node:assert/strict');
const {setup}=require('./harness.cjs');
const h=setup();
test('28,000 generator samples have a valid answer and unique choices across levels 1–10',()=>{
  const failures=h.read(`(()=>{const failures=[];for(const id of IDS.filter(id=>!['reflex','words','sustained','dual'].includes(id)))for(let l=1;l<=10;l++)for(let i=0;i<200;i++){const q=gen(id,l);if(!q||!correct(q,q.answer)||q.options&&(!q.options.some(o=>String(o)===String(q.answer))||new Set(q.options.map(String)).size!==q.options.length))failures.push({id,l,q});}return failures;})()`);
  assert.deepEqual(failures,[]);
});
test('10,000 percentage, compound change, ratio and arithmetic answers agree with displayed maths',()=>{
  for(let l=1;l<=10;l++)for(let i=0;i<1000;i++){
    const q=h.read(`genArithmetic(${l})`),p=q.prompt;let m,expected;
    if(m=p.match(/^(\d+) \+(\d+)% then −(\d+)%$/))expected=+m[1]*(100 + +m[2])*(100 - +m[3])/10000;
    else if(m=p.match(/^(\d+) (increased|reduced) by (\d+)%$/))expected=+m[1]*(100+(m[2]==='increased'?1:-1)*m[3])/100;
    else if(m=p.match(/^([\d.]+)% of (\d+)$/))expected=m[1]*m[2]/100;
    else if(m=p.match(/^(\d+) : (\d+) = (\d+) : \?$/))expected=m[2]*m[3]/m[1];
    else if(m=p.match(/^(\d+) ([+×]) (\d+)$/))expected=m[2]==='+'?+m[1]+ +m[3]:m[1]*m[3];
    else assert.fail('Unparsed '+p);
    assert.ok(Math.abs(q.answer-expected)<1e-8,p);
  }
});
function matrixOp(op,a,b){let result='';for(let i=0;i<9;i++){const x=+a[i],y=+b[i];result+=op==='union'?x|y:op==='subtract'?x&&!y?1:0:x^y;}if(op!=='xorRotate')return result;return [6,3,0,7,4,1,8,5,2].map(i=>result[i]).join('');}
test('4,000 matrix grids have one answer under every supported row rule',()=>{
  for(let i=0;i<4000;i++){const q=h.read(`genMatrixGrid(${8+i%3})`),c=q.cells,fits=['xor','union','subtract','xorRotate'].filter(op=>matrixOp(op,c[0],c[1])===c[2]&&matrixOp(op,c[3],c[4])===c[5]),answers=new Set(fits.map(op=>matrixOp(op,c[6],c[7])));assert.equal(answers.size,1);assert.ok(answers.has(q.answer));}
});
function shortest(q){const d=Array(q.n*q.n).fill(Infinity),walls=new Set(q.walls);d[q.start]=0;for(let pass=0;pass<q.n*q.n;pass++)for(let p=0;p<d.length;p++){if(walls.has(p))continue;const r=Math.floor(p/q.n),c=p%q.n;for(const [rr,cc]of [[r-1,c],[r+1,c],[r,c-1],[r,c+1]])if(rr>=0&&rr<q.n&&cc>=0&&cc<q.n&&!walls.has(rr*q.n+cc))d[rr*q.n+cc]=Math.min(d[rr*q.n+cc],d[p]+1);}return d[q.goal];}
test('2,000 planning boards require real detours, have correct distances and varied answer ranks',()=>{
  const ranks=new Set(),distances=new Set();for(let i=0;i<2000;i++){const q=h.read(`genPlanning(${1+i%10})`),min=Math.abs(Math.floor(q.start/q.n)-Math.floor(q.goal/q.n))+Math.abs(q.start%q.n-q.goal%q.n);assert.equal(q.answer,shortest(q));assert.ok(q.answer>min);assert.ok(q.options.every(o=>o%2===q.answer%2));ranks.add([...q.options].sort((a,b)=>a-b).indexOf(q.answer));distances.add(q.answer);}assert.ok(ranks.size>=3);assert.ok(distances.size>=6);
});
test('10,000 Strategy answers uniquely maximise the values stated in the prompt',()=>{
  for(let i=0;i<10000;i++){
    const q=h.read(`genStrategy(${1+i%10})`),values={};let m;
    if(q.prompt.startsWith('Prior')){
      m=q.prompt.match(/Prior success chance: ([\d.]+)%\nGood outcome: \+£(\d+); bad outcome: −£(\d+).\nTest cost: £(\d+); sensitivity ([\d.]+)%; false-positive rate ([\d.]+)%/);assert.ok(m,q.prompt);
      let [p,g,l,c,s,f]=m.slice(1).map(Number);p/=100;s/=100;f/=100;
      const pos=p*s+(1-p)*f,neg=1-pos;
      const ev=prob=>prob*g-(1-prob)*l;
      values['ACT NOW']=ev(p);values['DO NOTHING']=0;values['BUY INFORMATION']=-c+pos*Math.max(0,ev(p*s/pos))+neg*Math.max(0,ev(p*(1-s)/neg));
    }else{
      const cap=Number(q.prompt.match(/Maximum acceptable loss: £(\d+)/)?.[1]||Infinity);
      for(const name of ['A','B']){m=q.prompt.match(new RegExp(name+': (\\d+)% \\+£(\\d+) / (\\d+)% (−)?£(\\d+)'));assert.ok(m,q.prompt);const p=+m[1]/100,g=+m[2],l=+m[5];values['OPTION '+name]=l>cap?-Infinity:p*g-(1-p)*l;}
      if(q.options.includes('DO NOTHING'))values['DO NOTHING']=0;
    }
    const best=Math.max(...Object.values(values)),winners=Object.keys(values).filter(k=>Math.abs(values[k]-best)<1e-8);assert.equal(winners.length,1,q.prompt);assert.equal(q.answer,winners[0],q.prompt);
  }
});
test('spatial patterns are asymmetric and all transformations are substantive',()=>{
  for(let i=0;i<2000;i++){const q=h.read(`genSpatial(${1+i%10})`);assert.notEqual(q.answer,q.baseKey);assert.equal(h.run(`dihedralKeys('${q.baseKey}',${q.n}).length`),8);}
});
test('Flexibility includes repeated rules and switched rules; verbal directions do not disclose the relation',()=>{
  const result=h.read(`(()=>{let repeated=0,switched=0,prev='parity';for(let i=0;i<1000;i++){const q=genFlex(10,prev);q.meta.switched?switched++:repeated++;prev=q.meta.rule;}return {repeated,switched};})()`);assert.ok(result.repeated>350&&result.switched>350);
  for(let i=0;i<100;i++)assert.ok(!h.run('genVerbal(10).sub').includes('relation:'));
});
test('bundled vocabulary is unique; all 769 racks have at least 12 legal words',()=>{
  assert.equal(h.run('DICTIONARY_WORDS.length'),5127);assert.equal(h.run('DICTIONARY_SET.size'),5127);
  const failures=h.read(`DICTIONARY_RACKS.filter(r=>{const ws=wordsForRack(r);return ws.length<12||ws.some(w=>{const letters=r.split('');return [...w].some(ch=>{const i=letters.indexOf(ch);if(i<0)return true;letters.splice(i,1);return false;});});})`);assert.deepEqual(failures,[]);
});
