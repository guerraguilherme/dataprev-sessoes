'use strict';

async function simLoadMultipartExam(item){
  const r=await fetch('./simulados/'+item.file+'?v=066',{cache:'no-store'});
  if(!r.ok)throw new Error('arquivo/manifesto indisponível');
  const data=await r.json();
  if(Array.isArray(data.questions))return data;
  if(!Array.isArray(data.parts)||!data.parts.length)throw new Error('manifesto sem questões ou partes');
  const chunks=[];
  for(const part of data.parts){
    const pr=await fetch('./simulados/'+part+'?v=066',{cache:'no-store'});
    if(!pr.ok)throw new Error('parte indisponível: '+part);
    const pj=await pr.json();
    if(!Array.isArray(pj.questions))throw new Error('parte sem questões: '+part);
    chunks.push(...pj.questions);
  }
  return {...data,questions:chunks};
}

simOpen=async function(id){
  const item=(simCatalog.simulados||[]).find(x=>x.id===id);if(!item)return;
  const st=simStatus(item);
  if(!['ready','in_progress','completed'].includes(st))return setStatus('Este simulado ainda não está pronto.','bad');
  if(!item.file)return setStatus('Arquivo do simulado ainda não foi publicado.','bad');
  try{
    const data=await simLoadMultipartExam(item);
    if(!Array.isArray(data.questions)||data.questions.length!==70)throw new Error('o simulado publicado não contém exatamente 70 questões');
    const ids=new Set();
    data.questions.forEach((q,i)=>{simValidateQuestion(q,i);if(ids.has(q.id))throw new Error('ID de questão repetido: '+q.id);ids.add(q.id)});
    simCurrent=data;simState=simGetState(id);
    if(!simState.startedAt){simState.startedAt=new Date().toISOString();simState.timerRunning=true;simState.lastTick=Date.now();simSaveState();simMaybeTriggerNext(item)}
    simRender();window.scrollTo({top:0,behavior:'smooth'});
  }catch(error){setStatus('Não foi possível abrir o simulado: '+error.message,'bad')}
};
