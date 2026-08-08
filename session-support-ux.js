'use strict';

// Ajuda das Sessões no mesmo padrão visual/funcional dos simulados:
// resumo compacto + explicação detalhada em modal rolável.
(function(){
  const style=document.createElement('style');
  style.textContent=`
    .adaptive.session-help{margin:14px 0;border:1px solid #b7c8f7;border-radius:14px;background:#f5f8ff;overflow:hidden}
    .adaptive.session-help>button{width:100%;border:0;border-radius:0;background:#eaf0ff;color:#173f91;text-align:left;padding:12px 14px}
    .session-help-panel{padding:12px}.session-help-panel p{margin:.55em 0;line-height:1.5}
    .session-help-card{background:#fff;border:1px solid var(--line);border-radius:12px;padding:11px 12px}
    .session-help-actions{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:10px}
    .session-help-detail{width:100%;margin-top:9px}
    .session-detail-overlay{position:fixed;inset:0;z-index:10020;background:rgba(10,20,35,.48);display:flex;align-items:center;justify-content:center;padding:18px}
    .session-detail-dialog{width:min(680px,100%);max-height:min(74vh,640px);display:flex;flex-direction:column;background:#fff;border:1px solid var(--line);border-radius:18px;box-shadow:0 18px 55px rgba(0,0,0,.22);overflow:hidden}
    .session-detail-head{display:flex;align-items:center;justify-content:space-between;gap:10px;padding:13px 14px;border-bottom:1px solid var(--line)}
    .session-detail-head h2{margin:0;font-size:1.05rem}.session-detail-head button{padding:7px 10px}
    .session-detail-body{padding:14px;overflow:auto;-webkit-overflow-scrolling:touch;line-height:1.58}
    .session-detail-body h3{margin:15px 0 6px}.session-detail-body p{margin:7px 0}.session-detail-body ul,.session-detail-body ol{padding-left:22px}
    .session-detail-example,.session-detail-link,.session-detail-trap{border-radius:11px;padding:10px 11px;margin:10px 0}
    .session-detail-example{background:#f5f7fb;border:1px solid var(--line)}
    .session-detail-link{background:#f5f1ff;border:1px solid #d8c8ff}
    .session-detail-trap{background:var(--warnbg);border:1px solid #e6cd80;color:#4a3500}
    body.session-modal-open{overflow:hidden}
    @media(max-width:580px){.session-detail-overlay{padding:10px}.session-detail-dialog{max-height:78vh}.session-help-actions{grid-template-columns:1fr}}
  `;
  document.head.appendChild(style);

  const e=v=>typeof esc==='function'?esc(v):String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  function currentConcept(){return session?.concepts?.[state?.conceptIndex]||null}
  function isReferenceOnly(text){return /^\s*(referência real|questão real|fgv\b)/i.test(String(text||''))}
  function usefulConnection(c){return c?.connection&&!isReferenceOnly(c.connection)?c.connection:''}
  function quickLead(c){
    if(c?.support?.summary)return c.support.summary;
    if(c?.what&&c?.explanation)return `${c.what} ${c.explanation}`;
    return c?.explanation||c?.what||'Veja o conceito por outro ângulo antes de voltar à questão.';
  }
  function contextSteps(c){
    const t=((c?.topic||'')+' '+(c?.title||'')).toLowerCase();
    if(/interpreta|texto|semânt|paradoxo|portugu/.test(t))return ['Identifique o sentido global antes de classificar uma palavra ou expressão.','Compare o que está literalmente escrito com o efeito de sentido produzido no contexto.','Desconfie de alternativas que transformem uma nuance em afirmação absoluta.'];
    if(/probab|estat/.test(t))return ['Traduza o enunciado para o evento pedido.','Cheque se o problema pede união, interseção, complemento ou condição.','Só depois escolha a operação ou fórmula; confirme o evento que ela realmente calcula.'];
    if(/funç|limite|deriv|matem|álgebra|vetor|matriz/.test(t))return ['Nomeie as grandezas e o que a questão pede.','Use um exemplo pequeno ou leitura gráfica para validar a ideia.','Cheque sinal, domínio, eixo, ordem ou condição antes de concluir.'];
    if(/python|código|program|numpy|pandas/.test(t))return ['Leia o código na ordem em que ele executa.','Acompanhe o valor e o tipo de cada variável a cada etapa.','Teste mentalmente uma entrada simples antes de escolher a alternativa.'];
    if(/banco|sql|model|normal|chave|relacion/.test(t))return ['Identifique primeiro entidades, atributos, chaves ou tabelas envolvidas.','Separe regra conceitual de implementação física/SQL.','Valide cardinalidade, dependência ou efeito da operação antes de concluir.'];
    if(/lógica|propos|argument/.test(t))return ['Traduza a frase para a estrutura lógica.','Separe condição suficiente de necessária e observe negações.','Teste a conclusão contra todas as premissas, não apenas contra palavras parecidas.'];
    if(/lei|lgpd|lai|decreto|marco civil/.test(t))return ['Localize sujeito, dever/poder, prazo e exceção.','Diferencie a regra geral da hipótese excepcional.','Cheque palavras absolutas e trocas de competência ou prazo.'];
    return ['Identifique exatamente o conceito que está sendo cobrado.','Separe dados essenciais de contexto e distrações.','Teste sua conclusão contra a condição central e a pegadinha indicada.'];
  }
  function exampleHtml(c){
    if(c?.support?.example)return `<div class="session-detail-example"><b>Exemplo guiado</b><p>${e(c.support.example)}</p></div>`;
    const first=c?.immediate?.[0];
    if(!first)return '';
    return `<div class="session-detail-example"><b>Teste mental antes de voltar</b><p>${e(first.prompt)}</p><p class="small">Não é para responder aqui: use o enunciado apenas para identificar qual propriedade do conceito decide a questão. Depois feche esta janela e resolva a fixação normalmente.</p></div>`;
  }
  function detailedHtml(c){
    const connection=usefulConnection(c);
    const steps=contextSteps(c).map(x=>`<li>${e(x)}</li>`).join('');
    return `<h3>${e(c?.title||'Explicação do conceito')}</h3><p><b>Em linguagem direta:</b> ${e(c?.what||'')}</p><p>${e(c?.explanation||'')}</p><h3>Como raciocinar</h3><ol>${steps}</ol>${exampleHtml(c)}${c?.trap?`<div class="session-detail-trap"><b>Pegadinha típica</b><p>${e(c.trap)}</p></div>`:''}${connection?`<div class="session-detail-link"><b>Ligação com o que você já sabe</b><p>${e(connection)}</p></div>`:''}<h3>Como isso aparece na prova</h3><p>Procure a pequena condição que separa alternativas parecidas. A resposta errada costuma corresponder a uma leitura plausível, mas que troca uma relação, amplia demais uma afirmação ou aplica corretamente uma regra ao evento/objeto errado.</p>`;
  }
  function openDetail(){
    const c=currentConcept();if(!c)return;
    const rec=supportRecord(c.id);rec.opened=true;rec.openedAt=rec.openedAt||new Date().toISOString();rec.viewed=Array.from(new Set([...(rec.viewed||[]),'detailed']));saveState();
    const overlay=document.createElement('div');overlay.className='session-detail-overlay';overlay.innerHTML=`<section class="session-detail-dialog" role="dialog" aria-modal="true" aria-label="Explicação detalhada"><div class="session-detail-head"><h2>Explicação detalhada</h2><button type="button" data-session-detail-close>Fechar</button></div><div class="session-detail-body">${detailedHtml(c)}</div></section>`;
    document.body.appendChild(overlay);document.body.classList.add('session-modal-open');
    const close=()=>{overlay.remove();document.body.classList.remove('session-modal-open')};overlay.querySelector('[data-session-detail-close]').onclick=close;overlay.addEventListener('click',ev=>{if(ev.target===overlay)close()});
  }

  renderAdaptive=function(concept){
    const rec=supportRecord(concept.id);const open=!!rec.opened;
    const label=rec.resolved?'✓ Explicação usada — abrir novamente':rec.autoOpened?'⚠ Ver outra explicação':'▸ Não entendi / quero outra explicação';
    return `<section class="adaptive session-help"><button id="adaptiveToggle">${label}</button><div id="adaptivePanel" class="session-help-panel ${open?'':'hidden'}"><div class="session-help-card"><h3>${rec.resolved?'Revisar por outro ângulo':'Explicação alternativa'}</h3><p>${e(quickLead(concept))}</p>${concept.trap?`<p><b>Atenção:</b> ${e(concept.trap)}</p>`:''}<button type="button" class="ghost session-help-detail" data-session-detail>Ver explicação detalhada</button><p class="small">Abrir esta ajuda fica registrado para adaptar revisões futuras, mas não conta como erro.</p></div><div class="session-help-actions"><button id="supportResolved" class="primary">Entendi agora</button><button id="supportClose">Fechar ajuda</button></div></div></section>`;
  };

  wireAdaptive=function(concept){
    const rec=supportRecord(concept.id);
    const toggle=document.getElementById('adaptiveToggle');if(toggle)toggle.onclick=()=>{rec.opened=!rec.opened;if(rec.opened&&!rec.openedAt)rec.openedAt=new Date().toISOString();saveState();renderConcept()};
    document.querySelector('[data-session-detail]')?.addEventListener('click',openDetail);
    const resolved=document.getElementById('supportResolved');if(resolved)resolved.onclick=()=>{rec.resolved=true;rec.resolvedAt=new Date().toISOString();rec.opened=false;saveState();renderConcept()};
    const close=document.getElementById('supportClose');if(close)close.onclick=()=>{rec.opened=false;saveState();renderConcept()};
  };

  // Remove duplicação visual: quando 'connection' é apenas citação de uma prova,
  // a referência continua no bloco específico de questão real, não na caixa roxa.
  const baseRenderConcept=renderConcept;
  renderConcept=function(){
    baseRenderConcept();
    const c=currentConcept();if(!c||!isReferenceOnly(c.connection))return;
    document.querySelector('#studyBody .info.connection')?.remove();
  };
})();
