const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict'),crypto=require('node:crypto');
const{source,files}=require('./harness.cjs'),html=fs.readFileSync(path.join(source,'index.html'),'utf8');
const scripts=[...html.matchAll(/<script defer src="([^"?]+)\?v=([a-f0-9]+)"/g)];
assert.deepEqual(scripts.map(s=>s[1]),files.map(f=>f+'.js'));
assert.ok(!html.includes('user-scalable=no'));
const manifest=JSON.parse(fs.readFileSync(path.join(source,'release.json')));
for(const [file,sha]of Object.entries(manifest.assets)){
  const content=fs.readFileSync(path.join(source,file));assert.equal(crypto.createHash('sha256').update(content).digest('hex'),sha,file);
  if(file.endsWith('.js'))new vm.Script(content.toString(),{filename:file});
  assert.ok(html.includes(file+'?v='+sha.slice(0,12)),file+' cache version');
}
const names=[];for(const f of files){const src=fs.readFileSync(path.join(source,f+'.js'),'utf8');for(const m of src.matchAll(/^function (\w+)\(/gm))names.push(m[1]);}
assert.equal(new Set(names).size,names.length,'Global functions must have a single definition');
for(const key of ['sharp-final-continuous-v1','sharp-final-quality-v1','sharp-word-dict-v2'])assert.ok(fs.readFileSync(path.join(source,'data.js'),'utf8').includes(key));
console.log('Syntax, script order, unique definitions, storage keys and release asset hashes passed.');
const production=path.join(source,'../../final.html');
if(fs.existsSync(production)){
  const entry=fs.readFileSync(production,'utf8');
  if(entry.includes('releases/20260912/')){
    const selected=[...entry.matchAll(/<script defer src="([^"?]+)\?v=([a-f0-9]+)"/g)];
    assert.deepEqual(selected.map(m=>[m[1],m[2]]),scripts.map(m=>['releases/20260912/'+m[1],m[2]]));
    for(const m of [...entry.matchAll(/(?:src|href)="(releases\/[^"?]+)\?v=([a-f0-9]+)"/g)])assert.ok(fs.existsSync(path.resolve(path.dirname(production),m[1])),m[1]);
    console.log('Production entry selects the verified release and every local asset exists.');
  }
}
