import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import fs from 'node:fs';
import http from 'node:http';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';
import { validateStagedRelease } from '../../foundation-v2/validate-staged-release.mjs';

const here=path.dirname(fileURLToPath(import.meta.url));
const root=path.resolve(here,'../../..');
const read=relative=>fs.readFileSync(path.join(root,relative),'utf8');
const json=relative=>JSON.parse(read(relative));
const checks=[];
const check=(name,fn)=>{fn();checks.push({name,status:'PASS'})};

const app=read('app.js');
const loader=read('prepared-sessions-loader.js');
const planner=read('planner.js');
const sw=read('service-worker.js');
const index=read('index.html');
const manifest=json('manifest.webmanifest');
const session=json('EST-VA-001.json');
const staged=json('architecture/foundation-v2/pilot/staged/EST-VA-001.staged.json');
const bridge=json('architecture/runtime/content-factory-v3-pwa-bridge-v1.json');
const release=json('architecture/runtime/mobile-trail-release-0.7.15.json');

const sourcesLiteral=loader.match(/const SOURCES=(\[[\s\S]*?\n  \]);/)?.[1];
assert.ok(sourcesLiteral,'SOURCES não encontrado');
const sources=vm.runInNewContext(`(${sourcesLiteral})`);
const coreLiteral=sw.match(/const CORE=(\[[^;]+\]);/)?.[1];
assert.ok(coreLiteral,'CORE não encontrado');
const core=vm.runInNewContext(coreLiteral);

check('VERSIONS_ALIGNED',()=>{
  assert.match(app,/const APP_VERSION='0\.7\.15'/);
  assert.match(app,/const CONTENT_VERSION='2026\.08\.21-sessoes-17'/);
  assert.match(loader,/contentVersion:'2026\.08\.21-sessoes-17'/);
  assert.match(index,/PWA 0\.7\.15/);
  assert.equal(release.runtime_version,'0.7.15');
  assert.equal(release.content_version,'2026.08.21-sessoes-17');
  for(const [relative,expected] of Object.entries(release.artifact_sha256||{})){
    assert.equal(crypto.createHash('sha256').update(fs.readFileSync(path.join(root,relative))).digest('hex'),expected,`hash divergente: ${relative}`);
  }
});

check('STATE_CONTRACT_PRESERVED',()=>{
  assert.match(app,/STATE_MAP_KEY='dataprev_sessoes_states_v2'/);
  assert.match(app,/LEGACY_STATE_KEY='dataprev_sessoes_state_v1'/);
  assert.match(app,/SESSIONS_CFG_KEY='dataprev_sessoes_sync_config_v1'/);
  assert.match(read('sync-v2.js'),/DP_SYNC_QUEUE_KEY='dataprev_sessoes_sync_queue_v2'/);
  assert.equal(release.learner_state.schema_or_key_changed,false);
  assert.equal(release.learner_state.migration_performed,false);
  assert.equal(release.learner_state.official_state_write_performed,false);
});

check('ROADMAP_MAPPING_DELIVERY_SEPARATED',()=>{
  assert.equal((planner.match(/\['EST-PROB-002'/g)||[]).length,1);
  assert.equal((planner.match(/\['EST-VA-001'/g)||[]).length,1);
  assert.equal(sources.filter(x=>x.file==='EST-PROB-002.json').length,0);
  assert.equal(sources.filter(x=>x.file==='EST-VA-001.json').length,1);
  assert.equal(core.filter(x=>x==='./EST-PROB-002.json').length,0);
  assert.equal(bridge.phase_2_7_decisions['EST-PROB-002'].learner_delivery,'unchanged_not_published');
  assert.equal(bridge.phase_2_7_decisions['EST-VA-001'].learner_delivery,'ready');
});

check('EST_VA_RUNTIME_SCHEMA',()=>{
  assert.equal(session.id,'EST-VA-001');
  assert.equal(session.status,'published');
  assert.equal(session.concepts.length,6);
  assert.equal(session.finalQuestions.length,8);
  const ids=[];
  for(const concept of session.concepts){
    ids.push(concept.id);
    for(const item of concept.immediate||[]){
      ids.push(item.id);
      assert.ok(Number.isInteger(item.answer)&&item.answer>=0&&item.answer<item.options.length,item.id);
    }
  }
  for(const item of session.finalQuestions){
    ids.push(item.id);
    assert.ok(Number.isInteger(item.answer)&&item.answer>=0&&item.answer<item.options.length,item.id);
  }
  assert.equal(new Set(ids).size,ids.length,'IDs duplicados em EST-VA-001');
});

check('EST_VA_EXISTING_GATE_EVIDENCE',()=>{
  const result=validateStagedRelease(staged,{require_extended_stage_readback:true});
  assert.equal(result.ok,true,JSON.stringify(result.errors));
  assert.deepEqual(staged.state_mutations_allowed,[]);
  assert.equal(staged.mastery_mutation,null);
});

check('PWA_INSTALL_CONTRACT',()=>{
  assert.equal(manifest.start_url,'./');
  assert.equal(manifest.scope,'./');
  assert.equal(manifest.display,'standalone');
  assert.match(index,/<link rel="icon" href="\.\/icons\/icon-192\.png" type="image\/png">/);
  assert.match(sw,/CACHE_NAME='dataprev-sessoes-standalone-v30'/);
  assert.equal(core.filter(x=>x==='./EST-VA-001.json').length,1);
  assert.match(sw,/cache\.match\(request,\{ignoreSearch:true\}\)/);
  for(const asset of core){
    const relative=asset==='./'?'index.html':asset.replace(/^\.\//,'');
    assert.ok(fs.existsSync(path.join(root,relative)),`CORE ausente: ${asset}`);
  }
});

check('GATED_DELIVERY_ONLY',()=>{
  const lifecycle=read('session-lifecycle.js');
  const feedback=read('session-generation-feedback.js');
  const homeNav=read('session-home-nav.js');
  assert.match(planner,/const DP_GATED_DELIVERY_ONLY=true/);
  assert.match(planner,/if\(DP_GATED_DELIVERY_ONLY\)return'bloqueada'/);
  assert.match(planner,/Aguardando liberação/);
  assert.match(planner,/Entrega validada/);
  assert.match(planner,/liberação pelos gates da Content Factory/);
  assert.doesNotMatch(index,/antecipadas manualmente/);
  assert.match(read('sync-v2.js'),/aguardando liberação/);
  assert.match(lifecycle,/if\(gatedDeliveryOnly\)return/);
  assert.match(feedback,/DP_GATED_DELIVERY_ONLY/);
  assert.match(feedback,/const UI_VERSION='0\.7\.15'/);
  assert.doesNotMatch(homeNav,/session-generation-relay-hotfix\.js/);
  assert.equal(bridge.invariants.no_mobile_content_generation,true);
  assert.equal(bridge.invariants.automatic_next_session_generation,false);
  assert.equal(bridge.invariants.manual_mobile_generation_request,false);
});

check('INDEX_ASSETS_RESOLVE',()=>{
  const refs=[...index.matchAll(/(?:src|href)="(\.\/[^"#?]+)(?:\?[^"#]*)?"/g)].map(m=>m[1]);
  assert.ok(refs.length>0);
  for(const ref of refs)assert.ok(fs.existsSync(path.join(root,ref.slice(2))),`Referência quebrada: ${ref}`);
});

check('CONCEPT_DISCLOSURES_INTERACTIVE',()=>{
  const py=json('PY-COLL-001.json');
  const concept=py.concepts.find(x=>x.id==='PY-COLL-C01');
  assert.ok(concept?.supportDetails?.connection);
  assert.ok(concept?.supportDetails?.trap);
  assert.match(app,/function conceptDisclosureText\(concept,kind\)/);
  assert.match(app,/concept\?\.supportDetails\|\|\{\}/);
  assert.match(app,/<details class="info \$\{kind\} concept-disclosure">/);
  assert.match(index,/\.concept-disclosure>summary/);
  assert.match(index,/\.concept-disclosure\[open\]>summary::after/);
  const start=app.indexOf('function conceptDisclosureText');
  const end=app.indexOf('function renderConcept(){',start);
  const context={Set,String};
  vm.runInNewContext(`const esc=value=>String(value??'');${app.slice(start,end)};this.connection=renderConceptDisclosure(${JSON.stringify(concept)},'connection','Conexão com o que você já estudou');this.trap=renderConceptDisclosure(${JSON.stringify(concept)},'trap','Pegadinha e erro comum');this.empty=renderConceptDisclosure({},'trap','Pegadinha e erro comum');`,context);
  assert.match(context.connection,/A mesma regra de início incluído\/fim excluído/);
  assert.match(context.trap,/s\[1:4\] não inclui s\[4\]/);
  assert.match(context.connection,/^<details class="info connection concept-disclosure">/);
  assert.equal(context.empty,'');
});

async function exerciseLoader(){
  const roadmapIds=sources.map(source=>source.canonicalId||json(source.file).id);
  const warnings=[];
  const context={
    ROADMAP:{Todos:roadmapIds.map(id=>[id,id,'teste'])},
    catalog:{contentVersion:'base',sessions:[]},
    applyCatalog(next){context.catalog=next;return next},
    render(){context.rendered=(context.rendered||0)+1},
    console:{warn:(...args)=>warnings.push(args.join(' '))},
    fetch:async url=>{
      const file=String(url).replace(/^\.\//,'').split('?')[0];
      const target=path.join(root,file);
      if(!fs.existsSync(target))return{ok:false,status:404,json:async()=>null};
      return{ok:true,status:200,json:async()=>JSON.parse(fs.readFileSync(target,'utf8'))};
    },
    Map,Set,Promise
  };
  vm.runInNewContext(loader,context,{filename:'prepared-sessions-loader.js'});
  await new Promise(resolve=>setImmediate(resolve));
  await new Promise(resolve=>setImmediate(resolve));
  assert.deepEqual(warnings,[]);
  const loaded=context.catalog.sessions.filter(x=>x.id==='EST-VA-001');
  assert.equal(loaded.length,1);
  assert.equal(context.catalog.sessions.filter(x=>x.id==='PY-LOOP-001').length,1);
  assert.equal(context.catalog.sessions.filter(x=>x.id==='PY-FUNC-001').length,1);
  assert.equal(context.catalog.sessions.filter(x=>x.id==='NP-001').length,1);
  assert.equal(context.catalog.contentVersion,'2026.08.21-sessoes-17');
  assert.equal(context.catalog.sessions.some(x=>x.id==='EST-PROB-002'),false);
}

await exerciseLoader();
checks.push({name:'PREPARED_LOADER_RUNTIME',status:'PASS'});

async function exerciseOfflineCache(){
  const origin='https://example.test/dataprev-sessoes/';
  const cacheData=new Map();
  const key=(input,ignoreSearch=false)=>{
    const raw=typeof input==='string'?input:input.url;
    const url=new URL(raw,origin);
    if(ignoreSearch)url.search='';
    return url.href;
  };
  const cache={
    async addAll(entries){
      for(const entry of entries){
        const relative=entry==='./'?'index.html':entry.replace(/^\.\//,'');
        const target=path.join(root,relative);
        assert.ok(fs.existsSync(target),`Precache 404: ${entry}`);
        cacheData.set(key(entry),new Response(fs.readFileSync(target),{status:200}));
      }
    },
    async put(request,response){cacheData.set(key(request),response)},
    async match(request,options={}){
      const wanted=key(request,options.ignoreSearch===true);
      if(!options.ignoreSearch)return cacheData.get(wanted);
      for(const [stored,response] of cacheData){
        if(key(stored,true)===wanted)return response.clone();
      }
      return undefined;
    }
  };
  const listeners={};
  const context={
    self:{
      location:{origin:'https://example.test'},
      clients:{claim:async()=>{}},
      skipWaiting(){},
      addEventListener(type,handler){listeners[type]=handler}
    },
    caches:{open:async()=>cache,keys:async()=>['dataprev-sessoes-standalone-v29','dataprev-sessoes-standalone-v30'],delete:async()=>true},
    fetch:async()=>{throw new Error('offline')},
    URL,Response,Request,Promise,Error
  };
  vm.runInNewContext(`${sw}\nthis.__sw={CACHE_NAME,CORE,networkFirst};`,context,{filename:'service-worker.js'});
  let installPromise;
  listeners.install({waitUntil(value){installPromise=value}});
  await installPromise;
  assert.equal(cacheData.size,core.length);
  for(const requestUrl of [
    `${origin}app.js?v=0715`,
    `${origin}planner.js?v=0713-2`,
    `${origin}prepared-sessions-loader.js?v=0715`,
    `${origin}sync-v2.js?v=0713-2`,
    `${origin}EST-VA-001.json?v=20260821-17`,
    `${origin}PY-LOOP-001.json?v=20260821-17`,
    `${origin}PY-FUNC-001.json?v=20260821-17`
  ]){
    const response=await context.__sw.networkFirst(new Request(requestUrl));
    assert.equal(response.status,200,`Offline indisponível: ${requestUrl}`);
  }
}

await exerciseOfflineCache();
checks.push({name:'OFFLINE_AFTER_FIRST_LOAD',status:'PASS'});

async function exerciseHttp(){
  const requests=[];
  const server=http.createServer((req,res)=>{
    const url=new URL(req.url,'http://127.0.0.1');
    let relative=decodeURIComponent(url.pathname).replace(/^\/+/, '')||'index.html';
    const target=path.resolve(root,relative);
    if(!target.startsWith(root+path.sep)||!fs.existsSync(target)||fs.statSync(target).isDirectory()){
      requests.push({url:req.url,status:404});res.writeHead(404);res.end('not found');return;
    }
    requests.push({url:req.url,status:200});res.writeHead(200);fs.createReadStream(target).pipe(res);
  });
  await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
  try{
    const {port}=server.address();
    const refs=[...new Set([
      '/',
      '/EST-VA-001.json?v=20260821-17',
      '/PY-LOOP-001.json?v=20260821-17',
      '/PY-FUNC-001.json?v=20260821-17',
      ...[...index.matchAll(/(?:src|href)="(\.\/[^"#]+)"/g)].map(m=>'/'+m[1].slice(2))
    ])];
    for(const ref of refs){
      const response=await fetch(`http://127.0.0.1:${port}${ref}`);
      assert.equal(response.status,200,ref);
      await response.arrayBuffer();
    }
    assert.equal(requests.some(x=>x.status===404),false,JSON.stringify(requests));
  }finally{
    await new Promise(resolve=>server.close(resolve));
  }
}

await exerciseHttp();
checks.push({name:'CLEAN_HTTP_ZERO_404',status:'PASS'});

console.log(JSON.stringify({ok:true,total:checks.length,checks},null,2));
