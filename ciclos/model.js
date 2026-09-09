/* DATAPREV Ciclos: independent learner workspace; no writes to the legacy platform. */
(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.CiclosModel=api;})(typeof globalThis!=='undefined'?globalThis:this,function(){
'use strict';
const KEY='dataprev_ciclos_v1',APP='dataprev-ciclos',SCHEMA=1;
const clone=x=>JSON.parse(JSON.stringify(x));
const iso=()=>new Date().toISOString();
function fresh(){return {app:APP,schemaVersion:SCHEMA,contentVersion:'1.0.0',revision:0,updatedAt:iso(),lastCycle:'ciclo-01',cycles:{},reviewDraft:null,backupAt:null};}
function ensure(s,c){if(!s.cycles[c.id])s.cycles[c.id]={position:0,startedAt:iso(),completedAt:null,activeMs:0,records:{}};return s.cycles[c.id];}
function record(s,c,q){const cs=ensure(s,c);if(!cs.records[q.id])cs.records[q.id]={selected:null,confidence:null,reason:'',note:'',noteHistory:[],bookmarked:false,helpOpenedAt:null,firstAttempt:null,reviews:[],cause:'',updatedAt:iso()};return cs.records[q.id];}
function answer(q,r,now=iso()){
 if(r.firstAttempt)return r.firstAttempt;
 if(!q.options.some(o=>o.id===r.selected))throw Error('Escolha uma alternativa.');
 if(!['baixa','media','alta'].includes(r.confidence))throw Error('Indique sua confiança para registrar a resposta.');
 r.firstAttempt={id:q.id+'@'+now,selected:r.selected,confidence:r.confidence,reason:r.reason||'',assisted:!!r.helpOpenedAt,at:now};
 r.updatedAt=now;return r.firstAttempt;
}
const correct=(q,a)=>!!a&&a.selected===q.answerId;
function stats(c,cs){const rows=c.questions.map(q=>({q,r:cs?.records[q.id]||{},a:cs?.records[q.id]?.firstAttempt}));const answered=rows.filter(x=>x.a),right=answered.filter(x=>correct(x.q,x.a)),alone=right.filter(x=>!x.a.assisted);return {total:rows.length,answered:answered.length,correct:right.length,independent:alone.length,assisted:right.length-alone.length,errors:answered.length-right.length,pending:rows.length-answered.length,points:right.reduce((n,x)=>n+x.q.weight,0),independentPoints:alone.reduce((n,x)=>n+x.q.weight,0),maxPoints:rows.reduce((n,x)=>n+x.q.weight,0),byDiscipline:Object.fromEntries([...new Set(c.questions.map(q=>q.discipline))].map(d=>{let rr=rows.filter(x=>x.q.discipline===d),aa=rr.filter(x=>x.a),good=aa.filter(x=>correct(x.q,x.a));return [d,{total:rr.length,answered:aa.length,correct:good.length,independent:good.filter(x=>!x.a.assisted).length,points:good.reduce((n,x)=>n+x.q.weight,0)}];}))};}
function reasons(q,r){let a=r?.firstAttempt,out=[];if(a&&!correct(q,a))out.push('Erro na primeira resposta');if(a&&a.confidence!=='alta')out.push('Confiança '+(a.confidence==='media'?'média':'baixa'));if(a?.assisted)out.push('Consultou antes de responder');if(r?.bookmarked)out.push('Marcada por você');return out;}
function notebook(bank,s){return bank.cycles.flatMap(c=>c.questions.map(q=>{let r=s.cycles[c.id]?.records[q.id];if(!r)return null;let why=reasons(q,r);if(!why.length&&!r.note)return null;let latest=r.reviews?.at(-1),due=latest?new Date(new Date(latest.at).getTime()+(correct(q,latest)&&!latest.assisted?3:1)*86400000).toISOString():r.firstAttempt?.at;return {cycle:c,q,r,reasons:why,due,priority:(r.firstAttempt&&!correct(q,r.firstAttempt)?4:0)+(r.firstAttempt?.confidence==='alta'&&!correct(q,r.firstAttempt)?2:0)+(r.firstAttempt?.assisted?1:0)};}).filter(Boolean)).sort((a,b)=>b.priority-a.priority||a.q.number-b.q.number);}
function validate(input,bank){
 const fail=()=>{throw Error('Backup incompatível ou inválido. Nenhum registro foi substituído.');};
 if(!input||input.app!==APP||input.schemaVersion!==SCHEMA||input.contentVersion!==bank.contentVersion||!input.cycles||typeof input.cycles!=='object'||Array.isArray(input.cycles))fail();
 const out=fresh();const str=(v,max=30000)=>{if(v==null)return '';if(typeof v!=='string'||v.length>max)fail();return v;};
 const date=v=>{if(v==null)return null;if(typeof v!=='string'||!Number.isFinite(Date.parse(v)))fail();return v;};
 const selection=(q,v)=>{if(v==null)return null;if(!q.options.some(o=>o.id===v))fail();return v;};
 const confidence=v=>{if(v==null)return null;if(!['baixa','media','alta'].includes(v))fail();return v;};
 const attempt=(q,a)=>{if(!a||typeof a!=='object')fail();let selected=selection(q,a.selected),conf=confidence(a.confidence),at=date(a.at);if(!selected||!conf||!at||typeof a.assisted!=='boolean')fail();return {id:str(a.id,300)||q.id+'@'+at,selected,confidence:conf,reason:str(a.reason),assisted:a.assisted,at};};
 for(const [id,cs] of Object.entries(input.cycles)){
  const c=bank.cycles.find(c=>c.id===id);if(!c||!cs||!cs.records||typeof cs.records!=='object'||Array.isArray(cs.records))fail();
  if(!Number.isInteger(cs.position)||cs.position<0||cs.position>=c.questions.length||!Number.isFinite(cs.activeMs)||cs.activeMs<0||cs.activeMs>1e12)fail();
  const target=ensure(out,c);target.position=cs.position;target.activeMs=cs.activeMs;target.startedAt=date(cs.startedAt);target.completedAt=date(cs.completedAt);
  for(const [qid,r] of Object.entries(cs.records)){
   const q=c.questions.find(q=>q.id===qid);if(!q||!r||typeof r!=='object')fail();let t=record(out,c,q);
   t.selected=selection(q,r.selected);t.confidence=confidence(r.confidence);t.reason=str(r.reason);t.note=str(r.note);t.helpOpenedAt=date(r.helpOpenedAt);t.updatedAt=date(r.updatedAt)||iso();t.bookmarked=!!r.bookmarked;t.cause=str(r.cause,100);
   if(r.noteHistory!=null&&(!Array.isArray(r.noteHistory)||r.noteHistory.length>1000))fail();t.noteHistory=(r.noteHistory||[]).map(v=>str(v));
   t.firstAttempt=r.firstAttempt?attempt(q,r.firstAttempt):null;
   if(!Array.isArray(r.reviews)||r.reviews.length>10000)fail();t.reviews=r.reviews.map(a=>attempt(q,a));
   if(r.importedAttempts!=null&&(!Array.isArray(r.importedAttempts)||r.importedAttempts.length>1000))fail();if(r.importedAttempts)t.importedAttempts=r.importedAttempts.map(a=>attempt(q,a));
  }
  if(target.completedAt&&stats(c,target).pending)fail();
 }
 out.lastCycle=bank.cycles.some(c=>c.id===input.lastCycle)?input.lastCycle:'ciclo-01';out.updatedAt=date(input.updatedAt)||iso();out.revision=Number.isSafeInteger(input.revision)&&input.revision>=0?input.revision:0;out.backupAt=date(input.backupAt);
 if(input.reviewDraft){let d=input.reviewDraft,c=bank.cycles.find(c=>c.id===d.cycleId),q=c?.questions.find(q=>q.id===d.qid);if(!q)fail();out.reviewDraft={cycleId:c.id,qid:q.id,selected:selection(q,d.selected),confidence:confidence(d.confidence),reason:str(d.reason),helpOpenedAt:date(d.helpOpenedAt),startedAt:date(d.startedAt)||iso(),firstAttempt:d.firstAttempt?attempt(q,d.firstAttempt):null};}
 return out;
}
function merge(local,incoming,bank){
 const out=validate(local,bank),other=validate(incoming,bank);if(!Object.keys(local.cycles).length)out.lastCycle=other.lastCycle;
 for(const c of bank.cycles){let inc=other.cycles[c.id];if(!inc)continue;if(!out.cycles[c.id]){out.cycles[c.id]=clone(inc);continue;}let dst=out.cycles[c.id];dst.activeMs=Math.max(dst.activeMs,inc.activeMs);
  for(const q of c.questions){let b=inc.records[q.id];if(!b)continue;if(!dst.records[q.id]){dst.records[q.id]=clone(b);continue;}let a=dst.records[q.id];
   if(!a.firstAttempt&&b.firstAttempt)a.firstAttempt=clone(b.firstAttempt);
   else if(a.firstAttempt&&b.firstAttempt&&a.firstAttempt.id!==b.firstAttempt.id){a.importedAttempts=[...(a.importedAttempts||[]),b.firstAttempt];}
   a.importedAttempts=[...new Map([...(a.importedAttempts||[]),...(b.importedAttempts||[])].map(x=>[x.id,x])).values()];
   if(!a.note)a.note=b.note;else if(b.note&&a.note!==b.note)a.noteHistory=[...new Set([...a.noteHistory,b.note])];
   a.noteHistory=[...new Set([...a.noteHistory,...b.noteHistory])];
   a.reviews=[...new Map([...a.reviews,...b.reviews].map(x=>[x.id,x])).values()].sort((x,y)=>Date.parse(x.at)-Date.parse(y.at));a.bookmarked=a.bookmarked||b.bookmarked;a.helpOpenedAt=a.helpOpenedAt||b.helpOpenedAt;
   if(!a.selected&&!a.firstAttempt){a.selected=b.selected;a.confidence=b.confidence;a.reason=b.reason;}
  }
  if(!stats(c,dst).pending)dst.completedAt=dst.completedAt||inc.completedAt;
 }
 if(!out.reviewDraft&&other.reviewDraft)out.reviewDraft=other.reviewDraft;
 out.revision++;out.updatedAt=iso();return out;
}
function report(bank,s){let lines=['# DATAPREV · Ciclos — meu estudo','Exportado em '+iso(),'','Acertos com consulta e revisões não equivalem a desempenho independente em prova.',''];for(const c of bank.cycles){let cs=s.cycles[c.id];if(!cs)continue;let st=stats(c,cs);lines.push('## '+c.title,`${st.answered}/${st.total} respondidas · ${st.independent} acertos sem consulta · ${st.assisted} acertos com consulta · ${st.errors} erros`,`${st.points}/${st.maxPoints} pontos de treino; ${st.independentPoints} obtidos sem consulta.`, '');for(const q of c.questions){let r=cs.records[q.id];if(!r)continue;lines.push(`### ${q.number}. ${q.discipline} — ${q.topic}`,q.prompt);if(r.firstAttempt){let a=r.firstAttempt,o=q.options.find(o=>o.id===a.selected),right=q.options.find(o=>o.id===q.answerId);lines.push('Primeira resposta: '+o.text,'Resultado: '+(correct(q,a)?'correta':'incorreta')+' · confiança '+a.confidence+' · consulta '+(a.assisted?'sim':'não'),'Correta: '+right.text,'Explicação: '+q.explanation);if(a.reason)lines.push('Meu raciocínio: '+a.reason);}else lines.push('Pendente — gabarito não incluído.');if(r.note)lines.push('Minha nota: '+r.note);for(const n of r.noteHistory)lines.push('Nota adicional preservada: '+n);if(r.cause)lines.push('Causa indicada por mim: '+r.cause);if(r.reviews.length)lines.push('Revisões: '+r.reviews.map(a=>(correct(q,a)?'acerto':'erro')+' em '+a.at+(a.assisted?' com consulta':' sem consulta')).join('; '));lines.push('');}}return lines.join('\n');}
return {KEY,APP,SCHEMA,clone,fresh,ensure,record,answer,correct,stats,reasons,notebook,validate,merge,report};
});
