'use strict';
const IDS=['arithmetic','estimation','logic','patterns','matrix','spatial','planning','attention','processing','flexibility','memory','visualmem','words','verbal','strategy','reflex'];
const META={
arithmetic:['Arithmetic','∑','Mental maths, percentages, ratios and compound changes.'],estimation:['Estimation','≈','Fast approximate calculation without over-solving.'],logic:['Logic','◇','Deduction, syllogisms and information sufficiency.'],patterns:['Patterns','⌁','Numerical sequences and interacting rules.'],matrix:['IQ Matrix','◫','3×3 abstract matrix reasoning with interacting visual rules.'],spatial:['Spatial Rotation','⌑','Mentally rotate and transform asymmetric patterns.'],planning:['Planning','⌘','Find efficient routes through constrained spaces.'],attention:['Attention','◎','Stroop interference and response inhibition.'],processing:['Processing Speed','≋','Rapid same/different discrimination under pressure.'],flexibility:['Flexibility','⇄','Switch rules without carrying the old rule forward.'],memory:['Working Memory','▦','Hold and manipulate short sequences.'],visualmem:['Visual Memory','▥','Encode and recover briefly presented spatial patterns.'],words:['Word Fluency','ABC','Timed anagrams and verbal retrieval.'],verbal:['Verbal Reasoning','Aa','Analogies, semantic relationships and classification.'],strategy:['Strategy','↗','Expected value, downside and decision quality.'],reflex:['Reflex','⚡','Standardized reaction time with false-start control.']};
const WORD_BANK=[
{l:'MASTER',w:['arm','art','ate','ear','east','eat','era','mare','mart','mate','meat','rate','rest','same','seam','seat','star','steam','stream','team','term']},
{l:'PLANET',w:['ant','ape','ate','eat','lap','late','lean','leap','net','pale','pane','pant','pea','pen','pet','plane','plate','pleat','tan','tape']},
{l:'STREAM',w:['arm','art','ate','ear','east','eat','era','mare','mart','mate','meat','rate','rest','same','seam','seat','star','steam','team','term']},
{l:'SEARCH',w:['ace','arc','are','ash','car','case','cash','char','chase','ear','race','reach','scar','sea','share']},
{l:'CHANGE',w:['age','can','cane','change','each','gain','hang','hen','nag','ache','chain']},
{l:'MARKET',w:['arm','ark','art','ate','ear','make','maker','mare','mark','market','mate','rate','take','team','term']},
{l:'REASON',w:['are','ear','era','near','one','ore','reason','rose','sea','soar','son','sore']},
{l:'SILVER',w:['ire','lie','live','rise','rile','river','sir','sire','sliver','veil','vile']},
{l:'BRIDGE',w:['bed','bid','big','bird','bridge','die','dig','dire','ride','rig']},
{l:'SPRING',w:['gin','grin','nip','pig','pin','ring','rip','sin','sing','spin','spring']},
{l:'STRONG',w:['nor','not','rot','song','sort','strong','ton','torn']},
{l:'COURSE',w:['core','course','cure','ore','our','rose','sour','source','sure','use']},
{l:'FRIEND',w:['den','die','din','dire','end','fed','fern','find','fine','fire','friend','red','ride']},
{l:'SQUARE',w:['are','ear','era','qua','race','square','sure','use']},
{l:'GARDEN',w:['age','and','anger','danger','dear','drag','garden','gear','near','range','read']},
{l:'MOBILE',w:['bio','boil','lime','limb','mile','mob','mobile','oil']},
{l:'PLAYER',w:['ale','lay','layer','leap','pale','play','player','relay','year']},
{l:'ENERGY',w:['energy','green','grey','rye']},
{l:'TARGET',w:['age','art','ate','ear','gear','great','rate','tag','target','tear']},
{l:'DETAIL',w:['aid','ale','date','deal','detail','dial','diet','late','lead','tile']}
];
const K='sharp-final-continuous-v1';
const ri=(a,b)=>Math.floor(Math.random()*(b-a+1))+a,pk=a=>a[Math.floor(Math.random()*a.length)],sh=a=>[...a].sort(()=>Math.random()-.5),cl=(n,a,b)=>Math.max(a,Math.min(b,n));
const med=a=>{if(!a.length)return 0;let b=[...a].sort((x,y)=>x-y),m=Math.floor(b.length/2);return b.length%2?b[m]:(b[m-1]+b[m])/2};
const esc=v=>String(v).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const dayKey=()=>new Date().toISOString().slice(0,10),days=a=>a?Math.floor((Date.now()-new Date(a).getTime())/86400000):99;
function defaultDomain(){return{level:2,score:50,attempts:0,last:null,best:0}}
function fresh(){return{stats:{streak:0,sessions:0,minutes:0,last:null},domains:Object.fromEntries(IDS.map(id=>[id,defaultDomain()])),history:[]}}
function normalize(x){let y=fresh();if(!x||typeof x!=='object')return y;y.stats={...y.stats,...(x.stats||{})};y.history=Array.isArray(x.history)?x.history.slice(-60):[];for(const id of IDS)if(x.domains?.[id])y.domains[id]={...defaultDomain(),...x.domains[id]};return y}
function loadState(){try{let x=localStorage.getItem(K);return x?normalize(JSON.parse(x)):fresh()}catch{return fresh()}}
let S=loadState();
function saveState(){try{localStorage.setItem(K,JSON.stringify(S))}catch{}}
