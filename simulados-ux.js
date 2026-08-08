'use strict';

// UX complementar dos simulados: navegador compacto + revisão em duas camadas.
(function(){
  let qNavKeepOpen=false;
  const style=document.createElement('style');
  style.textContent=`
  .sim-qnav{margin:10px 0 12px;border:1px solid var(--line);border-radius:13px;background:#f8fafc;overflow:hidden}
  .sim-qnav>summary{list-style:none;padding:10px 12px;display:flex;align-items:center;justify-content:space-between;gap:8px;cursor:pointer;font-weight:850}
  .sim-qnav>summary::-webkit-details-marker{display:none}.sim-qnav>summary:after{content:'⌄';color:var(--muted)}.sim-qnav[open]>summary:after{content:'⌃'}
  .sim-qnav-grid{display:grid;grid-template-columns:repeat(10,1fr);gap:5px;padding:0 10px 10px;max-height:148px;overflow:auto}
  .sim-qnav-grid button{min-width:0;padding:7px 2px;border-radius:9px;font-size:.75rem}.sim-qnav-grid button.current{background:var(--accent);border-color:var(--accent);color:#fff}.sim-qnav-grid button.done{background:var(--okbg);border-color:#9bd7b8;color:#075c34}.sim-qnav-grid button.pending{background:#fff}
  .sim-support-compact{margin-top:9px}.sim-support-compact .support-box{margin-top:0}.sim-support-compact p{margin:.55em 0}.sim-detail-btn{width:100%;margin-top:8px}
  .sim-detail-overlay{position:fixed;inset:0;z-index:9999;background:rgba(10,20,35,.48);display:flex;align-items:center;justify-content:center;padding:18px}
  .sim-detail-dialog{width:min(680px,100%);max-height:min(72vh,620px);display:flex;flex-direction:column;background:#fff;border:1px solid var(--line);border-radius:18px;box-shadow:0 18px 55px rgba(0,0,0,.22);overflow:hidden}
  .sim-detail-head{display:flex;align-items:center;justify-content:space-between;gap:10px;padding:13px 14px;border-bottom:1px solid var(--line)}.sim-detail-head h2{margin:0;font-size:1.05rem}.sim-detail-head button{padding:7px 10px}
  .sim-detail-body{padding:14px;overflow:auto;-webkit-overflow-scrolling:touch;line-height:1.58}.sim-detail-body h3{margin:14px 0 6px}.sim-detail-body p{margin:7px 0}.sim-detail-body ul{padding-left:20px}.sim-detail-body .detail-trap{background:var(--warnbg);border:1px solid #e6cd80;border-radius:11px;padding:10px}.sim-detail-body .detail-example{background:#f5f7fb;border:1px solid var(--line);border-radius:11px;padding:10px}
  body.sim-modal-open{overflow:hidden}
  @media(max-width:580px){.sim-qnav-grid{grid-template-columns:repeat(7,1fr)}.sim-detail-overlay{padding:10px}.sim-detail-dialog{max-height:76vh}}
  `;
  document.head.appendChild(style);

  function escLocal(v){return typeof esc==='function'?esc(String(v??'')):String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}
  function supportData(){
    if(!simCurrent||!simState)return null;
    const q=simCurrent.questions?.[simState.currentIndex];if(!q)return null;
    return {q,rec:simState.answers?.[q.id]||{},s:q.support||{}};
  }
  function compactSupportHtml(q,rec,s){
    let note='';if(rec.supported)note='Respondida com apoio: este conteúdo foi aberto antes da confirmação.';else if(rec.confirmed)note='Revisão pós-resposta: não altera o indicador de apoio.';else note='Abrir antes de confirmar registra uso de apoio.';
    const lead=s.summary||s.concept||'Veja a ideia central necessária para resolver este tipo de questão.';
    const trap=s.trap?`<p><b>Atenção:</b> ${escLocal(s.trap)}</p>`:'';
    return `<div class="sim-support sim-support-compact ${rec.supportOpen?'':'hidden'}"><div class="support-box"><h3>${rec.confirmed?'Revisar assunto':'Explorar assunto'}</h3>${s.concept?`<p><b>${escLocal(s.concept)}</b></p>`:''}<p>${escLocal(lead)}</p>${trap}<button type="button" class="ghost sim-detail-btn" data-sim-detail>Ver explicação detalhada</button><p class="small">${escLocal(note)}</p></div></div>`;
  }
  function detailedHtml(q,s){
    const concept=s.concept||q.topic||'Conceito da questão';
    const summary=s.summary||'A questão exige reconhecer o conceito, identificar quais dados do enunciado são relevantes e evitar conclusões que extrapolem as condições apresentadas.';
    const example=s.example?`<div class="detail-example"><b>Exemplo guiado</b><p>${escLocal(s.example)}</p></div>`:'';
    const trap=s.trap?`<div class="detail-trap"><b>Pegadinha típica</b><p>${escLocal(s.trap)}</p></div>`:'';
    const terms=s.terms?`<h3>Vocabulário e equivalências</h3><p>${escLocal(s.terms)}</p>`:'';
    return `<h3>${escLocal(concept)}</h3><p>${escLocal(summary)}</p><h3>Como raciocinar</h3><ul><li>Identifique exatamente o que o enunciado pede antes de operar ou escolher uma regra.</li><li>Separe os dados indispensáveis dos elementos usados apenas para contextualizar ou distrair.</li><li>Teste a alternativa escolhida contra todas as condições do enunciado, não apenas contra uma palavra-chave.</li></ul>${example}${trap}${terms}<h3>Na prova</h3><p>Procure alterações pequenas de condição, quantificadores, negações, exceções e alternativas que reproduzem um erro de raciocínio plausível. Se duas opções parecerem próximas, volte à condição exata que as diferencia.</p>`;
  }
  function openDetail(){
    const data=supportData();if(!data)return;
    const overlay=document.createElement('div');overlay.className='sim-detail-overlay';overlay.innerHTML=`<section class="sim-detail-dialog" role="dialog" aria-modal="true" aria-label="Explicação detalhada"><div class="sim-detail-head"><h2>Explicação detalhada</h2><button type="button" data-close-detail>Fechar</button></div><div class="sim-detail-body">${detailedHtml(data.q,data.s)}</div></section>`;
    document.body.appendChild(overlay);document.body.classList.add('sim-modal-open');
    const close=()=>{overlay.remove();document.body.classList.remove('sim-modal-open')};overlay.querySelector('[data-close-detail]').onclick=close;overlay.addEventListener('click',e=>{if(e.target===overlay)close()});
  }
  function navHtml(){
    if(!simCurrent||!simState)return'';
    const answered=Object.values(simState.answers||{}).filter(r=>r?.confirmed).length;
    const buttons=simCurrent.questions.map((q,i)=>{const r=simState.answers?.[q.id]||{};const cls=i===simState.currentIndex?'current':r.confirmed?'done':'pending';return `<button type="button" class="${cls}" data-sim-jump="${i}" aria-label="Ir para questão ${i+1}">${i+1}</button>`}).join('');
    return `<details class="sim-qnav"${qNavKeepOpen?' open':''}><summary><span>Questões · ${simState.currentIndex+1}/70</span><span class="small">${answered} respondidas</span></summary><div class="sim-qnav-grid">${buttons}</div></details>`;
  }
  function enhance(){
    const panel=document.getElementById('simuladoPanel');if(!panel||panel.classList.contains('hidden')||!simCurrent||!simState||simState.completedAt)return;
    if(!panel.querySelector('.sim-qnav')){const head=panel.querySelector('.sim-head');if(head)head.insertAdjacentHTML('afterend',navHtml())}
    const nav=panel.querySelector('.sim-qnav');if(nav){nav.addEventListener('toggle',()=>{qNavKeepOpen=nav.open})}
    const data=supportData();const old=panel.querySelector('.sim-support');if(old&&data){old.outerHTML=compactSupportHtml(data.q,data.rec,data.s)}
    panel.querySelectorAll('[data-sim-jump]').forEach(btn=>btn.onclick=()=>{const i=Number(btn.dataset.simJump);if(!Number.isInteger(i))return;qNavKeepOpen=true;simUpdateClock();simState.currentIndex=i;simSaveState();simRender()});
    panel.querySelector('[data-sim-detail]')?.addEventListener('click',openDetail);
  }

  // Qualquer interação de resposta/navegação sequencial fecha o navegador.
  document.addEventListener('click',event=>{
    const el=event.target.closest?.('#simNext,#simPrev,#simConfirm,[data-sim-choice],[data-sim-confidence],#simSupportBtn,#simExit,[data-reset-simulado]');
    if(el)qNavKeepOpen=false;
  },true);

  const base=simRender;
  simRender=function(){base();enhance()};
  enhance();
})();
