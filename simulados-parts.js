'use strict';

const simOpenSingleFile=simOpen;
simOpen=async function(id){
  const item=(simCatalog.simulados||[]).find(x=>x.id===id);if(!item)return;
  if(!Array.isArray(item.parts)||!item.parts.length)return simOpenSingleFile(id);
  const st=simStatus(item);
  if(!['ready','in_progress','completed'].includes(st))return setStatus('Este simulado ainda não está pronto.','bad');
  try{
    const payloads=[];
    for(const filename of item.parts){
      const r=await fetch('./simulados/'+filename+'?v='+(item.contentVersion||'1'),{cache:'no-store'});
      if(!r.ok)throw new Error('parte indisponível: '+filename);
      payloads.push(await r.json());
    }
    const questions=payloads.flatMap(p=>Array.isArray(p.questions)?p.questions:[]);
    if(questions.length!==70)throw new Error('o simulado publicado não contém exatamente 70 questões');
    const ids=new Set();
    questions.forEach((q,i)=>{simValidateQuestion(q,i);if(ids.has(q.id))throw new Error('ID de questão repetido: '+q.id);ids.add(q.id)});
    simCurrent={
      schemaVersion:2,
      id:item.id,
      title:item.title,
      contentVersion:item.contentVersion||'',
      generatedAt:item.generatedAt||'',
      examModel:simCatalog.examModel||null,
      questions
    };
    simState=simGetState(id);
    if(!simState.startedAt){
      simState.startedAt=new Date().toISOString();
      simState.timerRunning=true;
      simState.lastTick=Date.now();
      simSaveState();
      simMaybeTriggerNext(item);
    }
    simRender();window.scrollTo({top:0,behavior:'smooth'});
  }catch(error){setStatus('Não foi possível abrir o simulado: '+error.message,'bad')}
};