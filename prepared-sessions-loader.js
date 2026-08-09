'use strict';

// Buffer pedagógico local: contém apenas sessões cujo material já foi efetivamente preparado.
(function(){
  const FILES=['MAT-FUNC-001.json','MAT-ALG-004A.json','EST-PROB-001.json','ML-BASE-001.json','PY-BASE-001.json','PY-COLL-001.json','BD-MOD-001.json','PT-INT-001.json','PT-GEN-001.json','PT-ORT-001.json','PT-COE-001.json','EN-TEXT-001.json','RL-PROP-001.json','RL-TV-001.json','AT-NEWS-001.json','AT-NEWS-W02.json','LEG-LAI-001.json','LEG-LAI-002.json','LEG-D7724-001.json'];
  const ready=new Map();
  function mergeInto(cat){
    if(!cat?.sessions)return cat;
    const map=new Map(cat.sessions.map(s=>[s.id,s]));
    ready.forEach((s,id)=>map.set(id,s));
    return {...cat,sessions:[...map.values()],contentVersion:'2026.08.08-sessoes-12'};
  }
  const baseApply=typeof applyCatalog==='function'?applyCatalog:null;
  if(baseApply){applyCatalog=function(nextCatalog,opts={}){return baseApply(mergeInto(nextCatalog),opts)}}
  Promise.all(FILES.map(async file=>{const r=await fetch(`./${file}?v=20260808-10`,{cache:'no-store'});if(!r.ok)throw new Error(`${file}: HTTP ${r.status}`);return r.json()})).then(items=>{
    items.forEach(s=>ready.set(s.id,s));
    if(typeof catalog!=='undefined'&&catalog?.sessions){catalog=mergeInto(catalog);if(typeof render==='function')render()}
  }).catch(err=>console.warn('Buffer de sessões preparadas não carregado:',err));
})();
