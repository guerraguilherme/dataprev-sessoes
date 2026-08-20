'use strict';

const PLANNER_QUEUE_KEY='dataprev_sessoes_manual_prepare_v1';
const PLANNER_OPEN_KEY='dataprev_sessoes_open_discipline_v1';
const MANUAL_LIMIT=2;
const DP_GATED_DELIVERY_ONLY=true;
const DISCIPLINE_ORDER=['Matemática','Estatística','Ciência de Dados/ML','Python e Ferramentas','Banco de Dados','Português','Inglês','Raciocínio Lógico','Atualidades e IA','Legislação'];

const ROADMAP={
  'Matemática':[
    ['MAT-FUNC-001','Funções: relação, domínio, contradomínio, imagem, raízes e gráficos','Funções'],
    ['MAT-CALC-001','Limites e continuidade','Cálculo'],
    ['MAT-CALC-002','Derivadas','Cálculo'],
    ['MAT-CALC-003','Máximos e mínimos','Cálculo'],
    ['MAT-CALC-004','Derivadas parciais','Cálculo'],
    ['MAT-CALC-005','Integrais','Cálculo'],
    ['MAT-ALG-001','Notação de vetores e matrizes','Álgebra linear'],
    ['MAT-ALG-003','Operações com vetores e matrizes','Álgebra linear'],
    ['MAT-ALG-002','Produto escalar, produto vetorial, identidade e transposta','Álgebra linear'],
    ['MAT-ALG-004A','Matriz inversa','Álgebra linear'],
    ['MAT-ALG-004B','Transformações lineares','Álgebra linear'],
    ['MAT-ALG-005','Normas L1 e L2','Álgebra linear'],
    ['MAT-ALG-006','Autovalores e autovetores','Álgebra linear']
  ],
  'Estatística':[
    ['EST-PROB-001','Probabilidade: conceitos e modelo','Probabilidade'],
    ['EST-PROB-002','Probabilidade condicional e independência','Probabilidade'],
    ['EST-PROB-003','Probabilidade total e Bayes','Probabilidade'],
    ['EST-VA-001','Variáveis aleatórias','Probabilidade'],
    ['EST-VA-002A','Esperança','Probabilidade'],
    ['EST-VA-002B','Variância e desvio-padrão','Probabilidade'],
    ['EST-VA-002C','Covariância','Probabilidade'],
    ['EST-DESC-001','Estatísticas descritivas','Estatística aplicada'],
    ['EST-DIST-001A','Distribuições discretas','Distribuições'],
    ['EST-DIST-001B','Distribuições contínuas','Distribuições'],
    ['EST-DIST-002','Distribuições multidimensionais e matriz de covariância','Distribuições'],
    ['EST-INF-001','Amostragem e Teorema Central do Limite','Inferência'],
    ['EST-INF-002A','Testes de hipótese','Inferência'],
    ['EST-INF-002B','Intervalos de confiança','Inferência'],
    ['EST-INF-003','Máxima verossimilhança','Inferência'],
    ['EST-INF-004','Inferência bayesiana','Inferência'],
    ['EST-DESC-002','Correlação de Pearson','Estatística aplicada'],
    ['EST-DESC-003','Boxplot e avaliação de outliers','Estatística aplicada']
  ],
  'Ciência de Dados/ML':[
    ['ML-BASE-001','Fundamentos, treino/validação/teste e overfitting/underfitting','Fundamentos'],
    ['ML-MET-001','Métricas de classificação','Modelagem'],
    ['ML-MET-002','Métricas de regressão','Modelagem'],
    ['ML-VAL-001','Validação cruzada e seleção de modelos','Modelagem'],
    ['ML-VAL-002','Viés-variância e regularização','Modelagem'],
    ['ML-REG-001','Regressão linear','Supervisionado'],
    ['ML-REG-002','Regressão logística','Supervisionado'],
    ['ML-TREE-001','Árvores de decisão e random forests','Supervisionado'],
    ['ML-SVM-001','SVM','Supervisionado'],
    ['ML-KNN-001','K-NN','Supervisionado'],
    ['ML-PCA-001','PCA','Não supervisionado'],
    ['ML-CLUST-001','K-Means','Não supervisionado'],
    ['ML-CLUST-002','Mistura de Gaussianas','Não supervisionado'],
    ['ML-ASSOC-001','Regras de associação','Não supervisionado'],
    ['ML-NN-001','Redes neurais: arquitetura e funções de ativação','Redes neurais'],
    ['ML-NN-002','Gradiente e SGD','Redes neurais'],
    ['ML-NN-003','Backpropagation','Redes neurais'],
    ['ML-NN-004','Regularização L1/L2 em redes e modelos','Redes neurais'],
    ['ML-CV-001','CNN','Visão computacional'],
    ['ML-CV-002','Visão computacional, classificação e detecção de objetos','Visão computacional'],
    ['ML-NLP-001','Processamento de Linguagem Natural: fundamentos','PLN'],
    ['ML-NLP-002','Processamento de Linguagem Natural: aplicações','PLN'],
    ['ML-ETL-001','ETL','Engenharia de dados'],
    ['ML-DATA-001','Manipulação, tratamento e visualização de dados','Preparação de dados'],
    ['ML-REC-001','Sistemas de recomendação','Aplicações'],
    ['ML-MIN-001','Mineração de dados','Mineração'],
    ['ML-SAS-001','SAS: conceitos e leitura de questões','Ferramentas']
  ],
  'Python e Ferramentas':[
    ['PY-BASE-001','Python: variáveis, tipos, operadores, listas e índices','Python'],
    ['PY-COND-001','Fluxo condicional: if, elif, else e lógica booleana','Python'],
    ['PY-COND-R01','Revisão adaptativa: índices, intervalos e expressões booleanas','Revisão extraordinária'],
    ['PY-COLL-001','Strings, tuplas, dicionários, conjuntos e compreensão de listas','Python'],
    ['PY-LOOP-001','Laços for e while','Python'],
    ['PY-FUNC-001','Funções','Python'],
    ['NP-001','Jupyter e NumPy: fundamentos','NumPy'],
    ['NP-002','NumPy: operações e vetorização','NumPy'],
    ['PD-001','Pandas: Series, DataFrame e seleção','Pandas'],
    ['PD-002','Pandas: limpeza, valores ausentes e tipos','Pandas'],
    ['PD-003','Pandas: groupby, merge e join','Pandas'],
    ['VIS-001','Matplotlib e Seaborn','Visualização'],
    ['STREAMLIT-001','Streamlit','Visualização e apps'],
    ['SCIPY-001','SciPy','Computação científica'],
    ['TF-001','TensorFlow, Keras e PyTorch','Frameworks'],
    ['R-001','R: fundamentos e leitura de código','R'],
    ['R-002','R: manipulação de dados e bibliotecas','R'],
    ['HADOOP-001','Hadoop, HDFS e MapReduce','Big Data'],
    ['SPARK-001','Spark: arquitetura e RDD','Big Data'],
    ['SPARK-002','Spark DataFrames e Spark SQL','Big Data']
  ],
  'Banco de Dados':[
    ['BD-MOD-001','Modelagem conceitual','Modelagem de dados'],
    ['BD-MOD-002','Modelagem lógica e física','Modelagem de dados'],
    ['BD-REL-001','Modelo relacional e chaves','Modelo relacional'],
    ['BD-NORM-001','1FN e fundamentos de normalização','Normalização'],
    ['BD-NORM-002','2FN, 3FN e dependências parcial e transitiva','Normalização'],
    ['BD-INT-001','Integridade referencial e ações de FK','Integridade'],
    ['BD-META-001','Metadados, catálogo e governança','Metadados'],
    ['BD-DIM-001','Modelagem dimensional: fatos, dimensões e granularidade','Modelagem dimensional'],
    ['BD-SQL-001','SQL: SELECT, filtros e ordenação','SQL'],
    ['BD-JOIN-001','JOINs e anti-join','SQL'],
    ['BD-SQL-002','Agregações, GROUP BY e HAVING','SQL'],
    ['BD-SQL-003','Subconsultas','SQL'],
    ['BD-DDL-001','DDL, DML e DQL','SQL'],
    ['BD-SGBD-001','SGBD: arquitetura, componentes e funções','SGBD'],
    ['BD-ACID-001','Transações e propriedades ACID','SGBD'],
    ['BD-NOSQL-001','NoSQL: modelos e critérios de uso','NoSQL'],
    ['BD-MEM-001','Banco de dados em memória','Banco em memória'],
    ['BD-DL-001','Data lakes e soluções de Big Data','Data lakes']
  ],
  'Português':[
    ['PT-INT-001','Compreensão e interpretação de textos','Interpretação'],
    ['PT-GEN-001','Tipos e gêneros textuais','Texto'],
    ['PT-ORT-001','Ortografia oficial','Gramática'],
    ['PT-COE-001','Coesão, referenciação, substituição, repetição, sequenciação e conectores','Coesão'],
    ['PT-VERB-001','Tempos e modos verbais','Gramática'],
    ['PT-CLAS-001','Classes de palavras','Gramática'],
    ['PT-SINT-001','Coordenação e subordinação','Sintaxe'],
    ['PT-PONT-001','Pontuação','Sintaxe'],
    ['PT-CONC-001','Concordância verbal e nominal','Sintaxe'],
    ['PT-REG-001','Regência e crase','Sintaxe'],
    ['PT-COL-001','Colocação pronominal','Sintaxe'],
    ['PT-SEM-001','Significação, substituição, reorganização e reescrita com gênero e formalidade','Semântica']
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
    ['RL-PROB-001','Problemas aritméticos','Problemas'],
    ['RL-PROB-002','Problemas geométricos e matriciais','Problemas']
  ],
  'Atualidades e IA':[
    ['AT-NEWS-001','Atualidades — ciclo semanal W01','Atualidades'],
    ['AT-NEWS-W02','Atualidades — ciclo semanal W02','Atualidades'],
    ['AT-NEWS-W03','Atualidades — ciclo semanal W03','Atualidades'],
    ['AT-NEWS-W04','Atualidades — ciclo semanal W04','Atualidades'],
    ['AT-NEWS-W05','Atualidades — ciclo semanal W05','Atualidades'],
    ['AT-NEWS-W06','Atualidades — ciclo semanal W06','Atualidades'],
    ['AT-NEWS-W07','Atualidades — ciclo semanal W07','Atualidades'],
    ['IA-CONC-001','Conceitos de IA e aprendizado de máquina','IA'],
    ['IA-GEN-001','Modelos generativos e modelos de linguagem','IA generativa'],
    ['IA-GOV-001','Ética, governança e privacidade em IA','Governança'],
    ['AT-NEWS-R1','Atualidades — revisão final R1','Atualidades · revisão'],
    ['AT-NEWS-R2','Atualidades — revisão final R2','Atualidades · revisão'],
    ['AT-NEWS-R3','Atualidades — revisão final R3','Atualidades · revisão']
  ],
  'Legislação':[
    ['LEG-LAI-001','LAI: fundamentos, transparência, pedido, prazo e acesso parcial','LAI'],
    ['LEG-LAI-002','LAI: restrições, recursos, responsabilidades e sanções','LAI'],
    ['LEG-D7724-001','Decreto 7.724: acesso, transparência e pedidos','LAI'],
    ['LEG-D7724-002','Decreto 7.724: recursos, competências e prazos','LAI'],
    ['LEG-D7845-001','Decreto 7.845/2012','Segurança da informação'],
    ['LEG-DEL-001','Lei 12.737/2012, art. 2º — delitos informáticos','Delitos informáticos'],
    ['LEG-MCI-001','Marco Civil: direitos, guarda e fornecimento de registros','Marco Civil'],
    ['LEG-LGPD-001','LGPD: conceitos, princípios, bases legais e tratamento','LGPD'],
    ['LEG-LGPD-002','LGPD: agentes, direitos e tratamento pelo poder público','LGPD'],
    ['LEG-LGPD-003','LGPD: segurança, fiscalização, sanções e ANPD','LGPD']
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
  if(DP_GATED_DELIVERY_ONLY)return'bloqueada';
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
  else if(DP_GATED_DELIVERY_ONLY)actions='<button class="grow" disabled>Aguardando liberação</button>';
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
  const deliveryText=DP_GATED_DELIVERY_ONLY?'Cada disciplina mantém sua própria sequência. Novas sessões aparecem somente depois da liberação pelos gates da Content Factory.':'Cada disciplina mantém sua própria sequência. A próxima pode ficar pronta enquanto você estuda, e sessões futuras podem ser antecipadas manualmente.';
  const deliveryBadge=DP_GATED_DELIVERY_ONLY?'Entrega validada':`Antecipações: ${used}/${MANUAL_LIMIT}`;
  $('catalogCard').innerHTML=`<div class="catalog-shell"><div class="catalog-head"><div><div class="kicker">Trilha por disciplina</div><h1>Sessões</h1><p class="small">${deliveryText}</p></div><span class="pill manual-counter">${deliveryBadge}</span></div><div class="discipline-list">${blocks}</div><div class="small">Mapa pedagógico auditado: ${meta.done}/${meta.total} sessões planejadas concluídas. A quantidade continua variável e pode crescer com sessões extras e ajustes pedagógicos.</div></div>`;
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
  if(DP_GATED_DELIVERY_ONLY){setStatus('Esta sessão será liberada somente após os gates da Content Factory.','');return}
  const row=Object.values(ROADMAP).flat().find(x=>x[0]===id),used=manualUsed();
  if(used>=MANUAL_LIMIT)return alert('Você já tem duas sessões antecipadas aguardando início. Inicie uma delas para liberar uma vaga.');
  const title=row?.[1]||id;
  const modal=showPlannerModal(`<h2>Preparar esta sessão agora?</h2><p><b>${esc(title)}</b></p><p class="small">O material será preparado por completo considerando a trilha, seu histórico, revisões pertinentes, desempenho, segurança, erros, notas e pré-requisitos. Essa antecipação ocupa 1 das 2 vagas manuais.</p><p class="small">A sessão seguinte <b>não</b> será gerada em cascata agora. O buffer automático volta a funcionar quando você iniciar esta sessão.</p><div class="modal-actions"><button id="cancelPrepare">Cancelar</button><button id="confirmPrepareBtn" class="primary">Confirmar preparação</button></div>`);
  modal.querySelector('#cancelPrepare').onclick=closePlannerModal;
  modal.querySelector('#confirmPrepareBtn').onclick=()=>requestPreparation(id,title);
}
async function requestPreparation(id,title){
  if(DP_GATED_DELIVERY_ONLY){setStatus('Geração pelo aplicativo desativada: aguarde a liberação do material validado.','');return}
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
