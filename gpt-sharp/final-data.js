'use strict';
const IDS=['arithmetic','estimation','logic','patterns','matrix','spatial','planning','attention','sustained','processing','flexibility','memory','visualmem','dual','words','verbal','strategy','reflex'];
const META={
arithmetic:['Arithmetic','∑','Mental maths, percentages, ratios and compound changes.'],
estimation:['Estimation','≈','Fast approximate calculation without over-solving.'],
logic:['Logic','◇','Deduction, syllogisms and information sufficiency.'],
patterns:['Patterns','⌁','Numerical sequences and interacting rules.'],
matrix:['IQ Matrix','◫','Abstract 3×3 matrix reasoning with multi-rule transformations.'],
spatial:['Spatial Rotation','⌑','Mentally rotate, mirror and transform asymmetric patterns.'],
planning:['Planning','⌘','Find efficient routes through constrained spaces.'],
attention:['Attention','◎','Stroop interference and response inhibition.'],
sustained:['Sustained Attention','◉','Maintain vigilance and suppress no-go responses over time.'],
processing:['Processing Speed','≋','Rapid same/different discrimination under pressure.'],
flexibility:['Flexibility','⇄','Switch rules without carrying the old rule forward.'],
memory:['Working Memory','▦','Hold and manipulate short sequences.'],
visualmem:['Visual Memory','▥','Encode and recover briefly presented spatial patterns.'],
dual:['Dual Task','⊕','Hold information while solving a second task under interference.'],
words:['Word Fluency','ABC','Timed anagrams and verbal retrieval.'],
verbal:['Verbal Reasoning','Aa','Analogies, semantic relationships and classification.'],
strategy:['Strategy','↗','Expected value, downside and decision quality.'],
reflex:['Reflex','⚡','Standardized reaction time with false-start control.']};
const WORD_BANK=[
{l:'MASTER',w:['arm','art','ate','ear','east','eat','era','mare','mart','mate','meat','rate','rest','same','seam','seat','star','steam','stream','team','term']},
{l:'PLANET',w:['ant','ape','ate','eat','lap','late','lean','leap','net','pale','pane','pant','pea','pen','pet','plane','plate','pleat','tan','tape']},
{l:'STREAM',w:['arm','art','ate','ear','east','eat','era','mare','mart','mate','meat','rate','rest','same','seam','seat','star','steam','team','term']},
{l:'SEARCH',w:['ace','arc','are','ash','car','case','cash','char','chase','ear','race','reach','scar','sea','share']},
{l:'CHANGE',w:['age','can','cane','change','each','hang','hen','nag','ache','chain']},
{l:'MARKET',w:['arm','ark','art','ate','ear','make','maker','mare','mark','market','mate','rate','take','team','term']},
{l:'REASON',w:['are','ear','era','near','one','ore','reason','rose','sea','soar','son','sore']},
{l:'SILVER',w:['ire','lie','live','rise','rile','river','sir','sire','sliver','veil','vile']},
{l:'BRIDGE',w:['bed','bid','big','bird','bridge','die','dig','dire','ride','rig']},
{l:'SPRING',w:['gin','grin','nip','pig','pin','ring','rip','sin','sing','spin','spring']},
{l:'STRONG',w:['nor','not','rot','song','sort','strong','ton','torn']},
{l:'COURSE',w:['core','course','cure','ore','our','rose','sour','source','sure','use']},
{l:'FRIEND',w:['den','die','din','dire','end','fed','fern','find','fine','fire','friend','red','ride']},
{l:'SQUARE',w:['are','ear','era','qua','square','sure','use']},
{l:'GARDEN',w:['age','and','anger','danger','dear','drag','garden','gear','near','range','read']},
{l:'MOBILE',w:['bio','boil','lime','limb','mile','mob','mobile','oil']},
{l:'PLAYER',w:['ale','lay','layer','leap','pale','play','player','relay','year']},
{l:'ENERGY',w:['energy','green','grey','rye']},
{l:'TARGET',w:['age','art','ate','ear','gear','great','rate','tag','target','tear']},
{l:'DETAIL',w:['aid','ale','date','deal','detail','dial','diet','late','lead','tile']},
{l:'CREDIT',w:['credit','edit','ice','red','rid','ride','tie','tire','tired']},
{l:'CANDLE',w:['ace','and','candle','can','cane','deal','lace','land','lead','lean']},
{l:'POCKET',w:['cope','cop','cot','pet','pocket','pot','toe','top']},
{l:'GROWTH',w:['got','how','row','tow','two','who','worth','growth']},
{l:'SYSTEM',w:['set','stem','system','yes','mess','met','my','sty']},
{l:'VISION',w:['ion','sin','son','vision','vin','visit']},
{l:'SIGNAL',w:['gain','gas','lag','nail','sign','signal','sing','slain']},
{l:'FOCUS',w:['focus','sou','use','cos']},
{l:'IMPACT',w:['act','aim','camp','cap','map','mat','impact','pit','tap']},
{l:'RISKER',w:['ire','risk','rise','sir','sire','ski']},
{l:'ACTION',w:['act','action','ant','can','cat','coin','icon','into','tan','tin']},
{l:'MEMORY',w:['memo','memory','more','ore','rye']},
{l:'PUZZLE',w:['puzzle','pull','use','zulu']},
{l:'BRAINY',w:['air','ban','bar','brain','brainy','rain','ray','rib']},
{l:'MENTAL',w:['ale','ant','ate','late','lean','male','meal','meant','metal','mental','team']},
{l:'LOGICS',w:['log','logic','logics','oil','silo','soil']},
{l:'NUMBER',w:['bun','bum','number','rub','rum','run']},
{l:'RECALL',w:['all','call','care','ear','race','recall']},
{l:'CHOICE',w:['choice','ice','echo','hoe']},
{l:'VECTOR',w:['core','cover','ore','over','vector','vote']},
{l:'ROTATE',w:['ate','ear','rate','rotate','tear','toe']},
{l:'SHAPES',w:['ape','ash','has','shape','shapes','she','spa']},
{l:'OBJECT',w:['bet','object','toe','jet']},
{l:'TIMING',w:['gin','timing','tin','mint']},
{l:'FILTER',w:['file','filter','fire','life','lift','tile']},
{l:'FASTER',w:['after','fast','faster','rate','rest','safe','star']},
{l:'BRIGHT',w:['big','bright','right','rib','rig']},
{l:'CALMER',w:['calm','came','care','cream','mare','race']},
{l:'REWARD',w:['draw','raw','read','rear','reward','ward']},
{l:'DECODE',w:['code','decode','doe','odd']},
{l:'SWITCH',w:['sit','switch','wit','wish']},
{l:'MOTION',w:['into','motion','not','tin','ton']},
{l:'RANDOM',w:['and','arm','dam','mad','man','random','road']},
{l:'SELECT',w:['elect','let','see','select','set']},
{l:'SOLVER',w:['love','over','role','rose','solve','solver']},
{l:'PROBE',w:['ore','probe','rob','rope']},
{l:'CHARTS',w:['art','cat','chart','charts','scar','star']},
{l:'TRAINS',w:['air','ant','rain','train','trains','star','strain']},
{l:'ROBUST',w:['bus','rob','rub','rust','robust','sort']},
{l:'RAPIDS',w:['aid','air','rapid','rapids','rid','sip']}
];
const K='sharp-final-continuous-v1';
const ri=(a,b)=>Math.floor(Math.random()*(b-a+1))+a,pk=a=>a[Math.floor(Math.random()*a.length)],sh=a=>[...a].sort(()=>Math.random()-.5),cl=(n,a,b)=>Math.max(a,Math.min(b,n));
const med=a=>{if(!a.length)return 0;let b=[...a].sort((x,y)=>x-y),m=Math.floor(b.length/2);return b.length%2?b[m]:(b[m-1]+b[m])/2};
const avg=a=>a.length?a.reduce((x,y)=>x+y,0)/a.length:0;
const esc=v=>String(v).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const dayKey=()=>new Date().toISOString().slice(0,10),days=a=>a?Math.floor((Date.now()-new Date(a).getTime())/86400000):99;
function defaultDomain(){return{level:2,score:50,attempts:0,last:null,best:0,baseline:null,recent:[]}}
function fresh(){return{stats:{streak:0,sessions:0,minutes:0,last:null},domains:Object.fromEntries(IDS.map(id=>[id,defaultDomain()])),history:[]}}
function normalize(x){let y=fresh();if(!x||typeof x!=='object')return y;y.stats={...y.stats,...(x.stats||{})};y.history=Array.isArray(x.history)?x.history.slice(-60):[];for(const id of IDS){if(x.domains?.[id]){y.domains[id]={...defaultDomain(),...x.domains[id]};if(y.domains[id].baseline==null&&y.domains[id].attempts>0)y.domains[id].baseline=y.domains[id].score;if(!Array.isArray(y.domains[id].recent))y.domains[id].recent=[]}}return y}
function loadState(){try{let x=localStorage.getItem(K);return x?normalize(JSON.parse(x)):fresh()}catch{return fresh()}}
let S=loadState();
function saveState(){try{localStorage.setItem(K,JSON.stringify(S))}catch{}}
function normalizedDomain(id){let d=S.domains[id];if(!d.attempts)return null;let base=d.baseline??d.score;return cl(Math.round(50+(d.score-base)*1.15+(d.level-2)*3.5),0,100)}