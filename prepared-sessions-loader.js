'use strict';

// Buffer pedagógico local: contém apenas sessões cujo material já foi efetivamente preparado.
// O filename gerado pode ser legado, mas o session_id exposto ao runtime deve ser o canônico do ROADMAP.
(function(){
  const SOURCES=[
    {file:'MAT-FUNC-001.json'},
    {file:'MAT-LIM-001.json',canonicalId:'MAT-CALC-001'},
    {file:'MAT-ALG-004A.json'},
    {file:'EST-PROB-001.json'},
    {file:'EST-VA-001.json'},
    {file:'ML-BASE-001.json'},
    {file:'ML-MET-001.json'},
    {file:'PY-BASE-001.json'},
    {file:'PY-COLL-001.json'},
    {file:'PY-LOOP-001.json'},
    {file:'PY-FUNC-001.json'},
    {file:'PY-NP-001.json',canonicalId:'NP-001'},
    {file:'BD-MOD-001.json'},
    {file:'PT-INT-001.json'},
    {file:'PT-GEN-001.json'},
    {file:'PT-ORT-001.json'},
    {file:'PT-COE-001.json'},
    {file:'EN-TEXT-001.json'},
    {file:'RL-PROP-001.json'},
    {file:'RL-TV-001.json'},
    {file:'AT-NEWS-001.json'},
    {file:'AT-NEWS-W02.json'},
    {file:'LEG-LAI-001.json'},
    {file:'LEG-LAI-002.json'},
    {file:'LEG-D7724-001.json'}
  ];
  const ready=new Map();
  const legacyIds=new Set();

  function canonicalize(session,source){
    if(!session?.id)throw new Error(`${source.file}: sessão sem id`);
    if(!source.canonicalId)return session;
    legacyIds.add(session.id);
    return {...session,id:source.canonicalId,legacyGeneratedSessionId:session.id,sourceFile:source.file};
  }

  function assertRoadmapIdentity(session,source){
    if(typeof ROADMAP==='undefined')return;
    const roadmapIds=new Set(Object.values(ROADMAP).flat().map(x=>x[0]));
    if(!roadmapIds.has(session.id))throw new Error(`${source.file}: id ${session.id} não existe no ROADMAP canônico`);
  }

  function mergeInto(cat){
    if(!cat?.sessions)return cat;
    const map=new Map(cat.sessions.map(s=>[s.id,s]));
    legacyIds.forEach(id=>map.delete(id));
    ready.forEach((s,id)=>map.set(id,s));
    return {...cat,sessions:[...map.values()],contentVersion:'2026.08.21-sessoes-17'};
  }

  const baseApply=typeof applyCatalog==='function'?applyCatalog:null;
  if(baseApply){applyCatalog=function(nextCatalog,opts={}){return baseApply(mergeInto(nextCatalog),opts)}}

  Promise.all(SOURCES.map(async source=>{
    const r=await fetch(`./${source.file}?v=20260821-17`,{cache:'no-store'});
    if(!r.ok)throw new Error(`${source.file}: HTTP ${r.status}`);
    const raw=await r.json();
    const session=canonicalize(raw,source);
    assertRoadmapIdentity(session,source);
    return session;
  })).then(items=>{
    items.forEach(s=>ready.set(s.id,s));
    if(typeof catalog!=='undefined'&&catalog?.sessions){catalog=mergeInto(catalog);if(typeof render==='function')render()}
  }).catch(err=>console.warn('Buffer de sessões preparadas não carregado:',err));
})();
