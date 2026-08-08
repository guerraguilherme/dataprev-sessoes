'use strict';

const PLANNER_QUEUE_KEY='dataprev_sessoes_manual_prepare_v1';
const PLANNER_OPEN_KEY='dataprev_sessoes_open_discipline_v1';
const MANUAL_LIMIT=2;
const DISCIPLINE_ORDER=['Matemática','Estatística','Ciência de Dados/ML','Python e Ferramentas','Banco de Dados','Português','Inglês','Raciocínio Lógico','Atualidades e IA','Legislação'];

const ROADMAP={
  'Matemática':[
    ['MAT-ALG-002','Produto escalar, produto vetorial, transposta e identidade','Álgebra linear'],
    ['MAT-FUNC-001','Funções: domínio, imagem, raízes e leitura de gráficos','Funções'],
    ['MAT-CALC-001','Limites e continuidade','Cálculo'],
    ['MAT-CALC-002','Derivadas e aplicações','Cálculo'],
    ['MAT-ALG-003','Operações com vetores e matrizes','Álgebra linear'],
    ['MAT-ALG-004','Matriz inversa e transformações lineares','Álgebra linear'],
    ['MAT-ALG-005','Normas L1 e L2','Álgebra linear'],
    ['MAT-ALG-006','Autovalores e autovetores','Álgebra linear']
  ],
  'Estatística':[
    ['EST-PROB-001','Probabilidade: conceitos e modelo','Probabilidade'],
    ['EST-PROB-002','Probabilidade condicional e independência','Probabilidade'],
    ['EST-PROB-003','Probabilidade total e Bayes','Probabilidade'],
    ['EST-VA-001','Variáveis aleatórias','Probabilidade'],
    ['EST-VA-002','Esperança, variância e covariância','Probabilidade'],
    ['EST-DIST-001','Distribuições discretas e contínuas','Distribuições'],
    ['EST-DIST-002','Distribuições multidimensionais e matriz de covariância','Distribuições'],
    ['EST-INF-001','Amostragem e Teorema Central do Limite','Inferência'],
    ['EST-INF-002','Teste de hipótese e intervalo de confiança','Inferência'],
    ['EST-INF-003','Máxima verossimilhança','Inferência'],
    ['EST-INF-004','Inferência bayesiana','Inferência'],
    ['EST-DESC-001','Correlação de Pearson, boxplot e outliers','Estatística aplicada']
  ],
  'Ciência de Dados/ML':[
    ['ML-BASE-001','Fundamentos de Ciência de Dados e aprendizado','Fundamentos'],
    ['ML-MET-001','Métricas de classificação e regressão','Modelagem'],
    ['ML-VAL-001','Regularização, seleção, validação cruzada e viés-variância','Modelagem'],
    ['ML-REG-001','Regressão linear','Supervisionado'],
    ['ML-REG-002','Regressão logística','Supervisionado'],
    ['ML-TREE-001','Árvores de decisão e random forests','Supervisionado'],
    ['ML-SVM-001','SVM','Supervisionado'],
    ['ML-KNN-001','K-NN','Supervisionado'],
    ['ML-PCA-001','PCA','Não supervisionado'],
    ['ML-CLUST-001','K-Means e mistura de Gaussianas','Não supervisionado'],
    ['ML-ASSOC-001','Regras de associação','Não supervisionado'],
    ['ML-NN-001','Redes neurais: arquitetura e ativações','Redes neurais'],
    ['ML-NN-002','Gradiente, SGD e backpropagation','Redes neurais'],
    ['ML-NN-003','Regularização L1/L2 em redes e modelos','Redes neurais'],
    ['ML-CV-001','CNN, visão computacional e detecção de objetos','Visão computacional'],
    ['ML-NLP-001','Processamento de Linguagem Natural','PLN'],
    ['ML-ETL-001','ETL','Engenharia de dados'],
    ['ML-DATA-001','Manipulação, tratamento e visualização de dados','Preparação de dados'],
    ['ML-REC-001','Sistemas de recomendação','Aplicações'],
    ['ML-MIN-001','Mineração de dados','Mineração'],
    ['ML-SAS-001','SAS: conceitos e leitura de questões','Ferramentas']
  ],
  'Python e Ferramentas':[
    ['PY-BASE-001','Python: variáveis, tipos, operadores, listas e índices','Python'],
    ['PY-COND-001','Fluxo condicional: if, elif, else e lógica booleana','Python'],
    ['PY-COND-R01','Revisão adaptativa: índices, intervalos e expressões booleanas','Revisão extra'],
    ['PY-COLL-001','Strings, tuplas, dicionários, conjuntos e compreensão de listas','Python'],
    ['PY-FUNC-001','Repetição e funções','Python'],
    ['NP-001','NumPy','NumPy'],
    ['PD-001','Pandas','Pandas'],
    ['R-001','R: fundamentos e leitura de código','R'],
    ['TF-001','TensorFlow, Keras e PyTorch','Frameworks'],
    ['HADOOP-001','Hadoop e ecossistema','Big Data'],
    ['SPARK-001','Spark e processamento distribuído','Big Data']
  ],
  'Banco de Dados':[
    ['BD-REL-001','Modelo relacional, chaves e integridade','Modelo relacional'],
    ['BD-SQL-001','SQL: SELECT, filtros, agregações e ordenação','SQL'],
    ['BD-JOIN-001','JOINs e anti-join','SQL'],
    ['BD-DDL-001','DDL, DML e DQL','SQL'],
    ['BD-NORM-001','1FN e fundamentos de normalização','Normalização'],
    ['BD-NORM-002','2FN, 3FN e dependências parcial e transitiva','Normalização'],
    ['BD-INT-001','Integridade referencial e ações de FK','Integridade'],
    ['BD-DIM-001','Modelagem dimensional: fatos, dimensões e granularidade','Modelagem dimensional'],
    ['BD-META-001','Metadados, catálogo e governança','Metadados'],
    ['BD-NOSQL-001','NoSQL: modelos e critérios de uso','NoSQL'],
    ['BD-DL-001','Data lakes e organização de dados','Data lakes'],
    ['BD-SGBD-001','SGBD, transações e propriedades ACID','SGBD']
  ],
  'Português':[
    ['PT-INT-001','Compreensão e interpretação de textos','Interpretação'],
    ['PT-GEN-001','Tipos e gêneros textuais','Texto'],
    ['PT-ORT-001','Ortografia oficial','Gramática'],
    ['PT-COE-001','Coesão, referenciação, substituição e conectores','Coesão'],
    ['PT-VERB-001','Tempos e modos verbais','Gramática'],
    ['PT-CLAS-001','Classes de palavras','Gramática'],
    ['PT-SINT-001','Coordenação e subordinação','Sintaxe'],
    ['PT-PONT-001','Pontuação','Sintaxe'],
    ['PT-CONC-001','Concordância verbal e nominal','Sintaxe'],
    ['PT-REG-001','Regência e crase','Sintaxe'],
    ['PT-COL-001','Colocação pronominal','Sintaxe'],
    ['PT-SEM-001','Significação, substituição, reorganização e reescrita','Semântica']
  ],
  'Inglês':[
    ['EN-TEXT-001','Compreensão textual e gramática contextual','Reading'],
    ['EN-FGV-001','Leitura FGV: inferência, referência e vocabulário em contexto','Reading']
  ],
  'Raciocínio Lógico':[
    ['RL-PROP-001','Estruturas lógicas, proposições e valor lógico','Lógica proposicional'],
    ['RL-ARG-001','Argumentação: inferências, deduções e conclusões','Argumentação'],
    ['RL-TV-001','Tabelas-verdade','Lógica proposicional'],
    ['RL-EQ-001','Equivalências lógicas e negações','Lógica proposicional'],
    ['RL-DIAG-001','Diagramas lógicos','Diagramas'],
    ['RL-FO-001','Lógica de primeira ordem e quantificadores','Lógica de primeira ordem'],
    ['RL-PROB-001','Problemas aritméticos, geométricos e matriciais','Problemas']
  ],
  'Atualidades e IA':[
    ['AT-NEWS-001','Atualidades nacionais e internacionais relevantes ao edital','Atualidades'],
    ['IA-CONC-001','Conceitos de IA e aprendizado de máquina','IA'],
    ['IA-GEN-001','Modelos generativos e modelos de linguagem','IA generativa'],
    ['IA-GOV-001','Ética, governança e privacidade em IA','Governança']
  ],
  'Legislação':[
    ['LEG-LAI-001','LAI: fundamentos, transparência, pedido, prazo e acesso parcial','LAI'],
    ['LEG-LAI-002','LAI: restrições, recursos, responsabilidades e sanções','LAI'],
    ['LEG-D7724-001','Decreto 7.724/2012','LAI'],
    ['LEG-D7845-001','Decreto 7.845/2012','Segurança da informação'],
    ['LEG-DEL-001','Lei 12.737/2012, art. 2º — delitos informáticos','Delitos informáticos'],
    ['LEG-MCI-001','Marco Civil: direitos, guarda e fornecimento de registros','Marco Civil'],
    ['LEG-LGPD-001','LGPD: conceitos, princípios, bases legais e tratamento','LGPD'],
    ['LEG-LGPD-002','LGPD: agentes, direitos, segurança e responsabilização','LGPD']
  ]
};

const disciplineAlias=name=>{
  const s=String(name||'').toLowerCase();
  if(s.includes('banco'))return'Banco de Dados';
  if(s.includes('estat'))return'Estatística';
  if(s.includes('matem'))return'Matemática';
  if(s.includes('ciência')||s.includes('machine')||s==='ml')return'Ciência de Dados/ML';
  if(s.includes('python')||s.includes('programa')||s.includes('numpy')||s.includes('pandas'))return'Python e Ferramentas';
  if(s.includes('portugu'))return'Português';
  if(s.includes('ingl'))return'Inglês';
  if(s.includes('lógico')||s.includes('logico'))return'Raciocínio Lógico';
  if(s.includes('atual')||s.includes('inteligência artificial')||s.includes('inteligencia artificial'))return'Atualidades e IA';
  if(s.includes('legis')||s.includes('lgpd')||s.includes('lai'))return'Legislação';
  return name||'Outros';
};

function plannerQueue(){return readJson(PLANNER_QUEUE_KEY,[]).filter(x=>x&&x.sessionId)}
function savePlannerQueue(q){localStorage.setItem(PLANNER_QUEUE_KEY,JSON.stringify(q))}
function catalogById(){return new Map((catalog.sessions||[]).map(x=>[x.id,x]))}
function sessionLocalStatus(id){
  const item=catalogById().get(id),q=plannerQueue().find(x=>x.sessionId===id),s=readMap()[id];
  if(s?.completedAt||s?.phase==='complete')return'concluida';
  if(s?.startedAt&&!s?.completedAt)return'em_curso';
  if(item)return'pronta';
  if(q)return q.status||'pendente_geracao';
  return'bloqueada';
}
function chip(status){
  const map={concluida:['Concluída','done'],em_curso:['Em curso','course'],pronta:['Pronta','ready'],pendente_geracao:['Pendente de geração','pending'],erro_geracao:['Falha na geração','pending'],bloqueada:['Bloqueada','locked']};
  const [label,cls]=map[status]||[status,'locked'];return `<span class="status-chip ${cls}">${label}</span>`;
}
function manualUsed(){return plannerQueue().filter(x=>['pendente_geracao','pronta'].includes(x.status)).length}
function plannerMeta(){const total=Object.values(ROADMAP).reduce((a,b)=>a+b.length,0),done=Object.values(ROADMAP).flat().filter(x=>sessionLocalStatus(x[0])==='concluida').length;return{total,done}}

function roadmapRows(discipline){
  const live=catalogById();
  const base=ROADMAP[discipline]||[];
  const extra=(catalog.sessions||[]).filter(s=>disciplineAlias(s.discipline)===discipline&&!base.some(x=>x[0]===s.id)).map(s=>[s.id,s.title,s.topic||'Sessão extra']);
  return [...base,...extra].map(([id,title,topic],index)=>({id,title:live.get(id)?.title||title,topic:live.get(id)?.topic||topic,index}));
}

function renderPlannerSession(row){
  const st=sessionLocalStatus(row.id),live=catalogById().get(row.id),used=manualUsed();
  let actions='';
  if(st==='concluida')actions=`<button class="ghost grow" data-open-session="${esc(row.id)}">Ver resultado</button>`;
  else if(st==='em_curso')actions=`<button class="primary grow" data-open-session="${esc(row.id)}">Retomar sessão</button>`;
  else if(st==='pronta')actions=`<button class="primary grow" data-open-session="${esc(row.id)}">Iniciar sessão</button>`;
  else if(st==='pendente_geracao')actions=`<button class="grow" disabled>Preparação solicitada</button>`;
  else if(st==='erro_geracao')actions=`<button class="ghost grow" data-prepare-session="${esc(row.id)}">Tentar novamente</button>`;
  else actions=`<button class="ghost grow" data-prepare-session="${esc(row.id)}" ${used>=MANUAL_LIMIT?'disabled':''}>Solicitar preparação</button>`;
  const current=['em_curso','pronta'].includes(st)?' current':'';
  return `<article class="road-session ${st==='bloqueada'?'locked':''}${current}" data-road-id="${esc(row.id)}"><div class="road-top"><div><div class="road-code">${esc(row.id)}</div><div class="road-title">${esc(row.title)}</div><div class="road-topic">${esc(row.topic)}</div></div>${chip(st)}</div><div class="road-actions">${actions}</div>${st==='bloqueada'&&used>=MANUAL_LIMIT?'<div class="prepare-note">Limite de 2 sessões antecipadas atingido.</div>':''}</article>`;
}

function renderHome(){
  show('homePanel');
  const meta=plannerMeta(),openSaved=localStorage.getItem(PLANNER_OPEN_KEY)||'';
  const blocks=DISCIPLINE_ORDER.map(d=>{
    const rows=roadmapRows(d),counts=rows.reduce((a,r)=>{const s=sessionLocalStatus(r.id);a[s]=(a[s]||0)+1;return a},{}) ,open=openSaved===d;
    const done=counts.concluida||0,available=(counts.pronta||0)+(counts.em_curso||0),blocked=(counts.bloqueada||0),pending=counts.pendente_geracao||0;
    return `<section class="discipline-block ${open?'open':''}" data-discipline="${esc(d)}"><button class="discipline-toggle" data-toggle-discipline="${esc(d)}"><div class="discipline-main"><div class="discipline-name">${esc(d)}</div><div class="discipline-summary">${done} concluída${done===1?'':'s'} · ${available} disponível${available===1?'':'eis'}${pending?` · ${pending} em preparação`:''} · ${blocked} bloqueada${blocked===1?'':'s'}</div><div class="mini-progress"><span style="width:${rows.length?100*done/rows.length:0}%"></span></div></div><div class="discipline-right"><span class="pill">${done}/${rows.length}</span><span class="discipline-chevron">⌄</span></div></button><div class="discipline-body"><div class="discipline-scroll">${rows.length?rows.map(renderPlannerSession).join(''):'<div class="road-empty">Nenhuma sessão planejada.</div>'}</div></div></section>`;
  }).join('');
  const used=manualUsed();
  $('catalogCard').innerHTML=`<div class="catalog-shell"><div class="catalog-head"><div><div class="kicker">Trilha por disciplina</div><h1>Sessões</h1><p class="small">Cada disciplina mantém sua própria sequência. A próxima pode ficar pronta enquanto você estuda, e sessões futuras podem ser antecipadas manualmente.</p></div><span class="pill manual-counter">Antecipações: ${used}/${MANUAL_LIMIT}</span></div><div class="discipline-list">${blocks}</div><div class="small">Mapa atual: ${meta.done}/${meta.total} sessões concluídas. A quantidade pode crescer com sessões extras e ajustes pedagógicos.</div></div>`;
  document.querySelectorAll('[data-toggle-discipline]').forEach(btn=>btn.onclick=()=>toggleDiscipline(btn.dataset.toggleDiscipline));
  document.querySelectorAll('[data-open-session]').forEach(btn=>btn.onclick=()=>openSession(btn.dataset.openSession));
  document.querySelectorAll('[data-prepare-session]').forEach(btn=>btn.onclick=()=>confirmPrepare(btn.dataset.prepareSession));
}

function toggleDiscipline(name){
  const mobile=matchMedia('(max-width:580px)').matches;
  const target=document.querySelector(`[data-discipline="${CSS.escape(name)}"]`);if(!target)return;
  const willOpen=!target.classList.contains('open');
  if(mobile)document.querySelectorAll('.discipline-block.open').forEach(x=>x.classList.remove('open'));
  target.classList.toggle('open',willOpen);
  localStorage.setItem(PLANNER_OPEN_KEY,willOpen?name:'');
  if(willOpen){setTimeout(()=>{const current=target.querySelector('.road-session.current');if(current)current.scrollIntoView({block:'nearest',behavior:'smooth'})},80)}
}

function showPlannerModal(html){
  document.getElementById('plannerModal')?.remove();
  const wrap=document.createElement('div');wrap.id='plannerModal';wrap.className='modal-backdrop';wrap.innerHTML=`<div class="modal-card">${html}</div>`;document.body.appendChild(wrap);return wrap;
}
function closePlannerModal(){document.getElementById('plannerModal')?.remove()}
function confirmPrepare(id){
  const row=Object.values(ROADMAP).flat().find(x=>x[0]===id),used=manualUsed();
  if(used>=MANUAL_LIMIT)return alert('Você já tem duas sessões antecipadas aguardando início. Inicie uma delas para liberar uma vaga.');
  const title=row?.[1]||id;
  const modal=showPlannerModal(`<h2>Preparar esta sessão agora?</h2><p><b>${esc(title)}</b></p><p class="small">O material será preparado por completo considerando a trilha, seu histórico, revisões pertinentes, desempenho, segurança, erros, notas e pré-requisitos. Essa antecipação ocupa 1 das 2 vagas manuais.</p><p class="small">A sessão seguinte <b>não</b> será gerada em cascata agora. O buffer automático volta a funcionar quando você iniciar esta sessão.</p><div class="modal-actions"><button id="cancelPrepare">Cancelar</button><button id="confirmPrepareBtn" class="primary">Confirmar preparação</button></div>`);
  modal.querySelector('#cancelPrepare').onclick=closePlannerModal;
  modal.querySelector('#confirmPrepareBtn').onclick=()=>requestPreparation(id,title);
}
async function requestPreparation(id,title){
  const cfg=readConfig();
  if(!cfg.endpoint||!cfg.token||!cfg.deviceId){closePlannerModal();setStatus('Configure a sincronização antes de solicitar uma sessão.','bad');return}
  const btn=document.getElementById('confirmPrepareBtn');if(btn){btn.disabled=true;btn.textContent='Solicitando…'}
  try{
    const response=await jsonp(cfg.endpoint,{action:'request_session_generation',token:cfg.token,device_id:cfg.deviceId,session_id:id,title,trigger_type:'manual_prepare',requested_sessions:1,content_version:catalog.contentVersion},20000);
    const q=plannerQueue().filter(x=>x.sessionId!==id);q.push({sessionId:id,status:'pendente_geracao',requestedAt:new Date().toISOString(),requestId:response?.request_id||''});savePlannerQueue(q);
    closePlannerModal();setStatus('Preparação solicitada. A sessão aparecerá como pronta quando o conteúdo for publicado.','ok');renderHome();
  }catch(error){if(btn){btn.disabled=false;btn.textContent='Confirmar preparação'}setStatus('Não foi possível solicitar a preparação: '+error.message,'bad')}
}

const baseOpenSession=openSession;
openSession=function(id){
  const st=sessionLocalStatus(id);
  if(!catalogById().has(id)){setStatus('Esta sessão ainda não tem conteúdo publicado.','bad');return}
  if(st==='pronta'){
    const q=plannerQueue();const found=q.find(x=>x.sessionId===id);if(found){savePlannerQueue(q.filter(x=>x.sessionId!==id));}
  }
  baseOpenSession(id);
};

const baseApplyCatalog=applyCatalog;
applyCatalog=function(nextCatalog,opts={}){
  baseApplyCatalog(nextCatalog,opts);
  const live=new Set((catalog.sessions||[]).map(x=>x.id));
  const q=plannerQueue();let changed=false;
  q.forEach(x=>{if(live.has(x.sessionId)&&x.status!=='pronta'){x.status='pronta';changed=true}});
  if(changed)savePlannerQueue(q);
};
