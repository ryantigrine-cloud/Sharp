const fs=require('node:fs');const path=require('node:path');const crypto=require('node:crypto');
const dir=path.join(__dirname,'../gpt-sharp/releases/20260912');
const assets=fs.readdirSync(dir).filter(f=>/\.(js|css)$/.test(f));
const hashes=Object.fromEntries(assets.map(f=>[f,crypto.createHash('sha256').update(fs.readFileSync(path.join(dir,f))).digest('hex')]));
let html=fs.readFileSync(path.join(dir,'index.html'),'utf8');
for(const [name,hash] of Object.entries(hashes))html=html.replace(new RegExp(`((?:src|href)=")${name.replaceAll('.','\\.')}(?:\\?v=[a-f0-9]+)?"`,'g'),`$1${name}?v=${hash.slice(0,12)}"`);
fs.writeFileSync(path.join(dir,'index.html'),html);
fs.writeFileSync(path.join(dir,'release.json'),JSON.stringify({build:'20260912.1',scoringVersion:2,generatorVersion:2,dictionary:'common-checked-20260912',assets:hashes},null,2)+'\n');
