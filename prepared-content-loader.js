'use strict';

// Injeta no catálogo local as sessões já preparadas no repositório, preservando
// a sincronização remota e o estado salvo do usuário.
(function(){
  const PREPARED_FILES=[
    'MAT-FUNC-001.json','EST-PROB-001.json','ML-BASE-001.json','PY-BASE-001.json',
    'BD-MOD-001.json','PT-INT-001.json','EN-TEXT-001.json','RL-PROP-001.json',
    'AT-NEWS-001.json','LEG-LAI-001.json'
  ];
  let prepared=[];
  const baseApplyPrepared=applyCatalog;

  applyCatalog=function(nextCatalog,opts={}){
    if(!prepared.length)return baseApplyPrepared(nextCatalog,opts);
    const byId=new Map((nextCatalog?.sessions||[]).map(s=>[s.id,s]));
    prepared.forEach(s=>s?.id&&byId.set(s.id,s));
    return baseApplyPrepared({...nextCatalog,sessions:[...byId.values()]},opts);
  };

  Promise.all(PREPARED_FILES.map(async file=>{
    try{
      const r=await fetch('./'+file+'?v=2026.08.08-prepared-01',{cache:'no-store'});
      return r.ok?await r.json():null;
    }catch{return null}
  })).then(items=>{
    prepared=items.filter(Boolean);
    if(!prepared.length)return;
    applyCatalog(catalog,{preferCurrent:true});
    if(typeof render==='function')render();
  });
})();