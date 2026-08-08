'use strict';

// Ajustes de qualidade do planejador sem alterar estados já salvos.
(function(){
  // A sequência de RL fica mais pedagógica: proposições -> tabelas -> equivalências -> argumentação.
  if (typeof ROADMAP !== 'undefined' && Array.isArray(ROADMAP['Raciocínio Lógico'])) {
    const byId = new Map(ROADMAP['Raciocínio Lógico'].map(x => [x[0], x]));
    const preferred = ['RL-PROP-001','RL-TV-001','RL-EQ-001','RL-ARG-001','RL-DIAG-001','RL-FO-001','RL-PROB-001','RL-PROB-002'];
    ROADMAP['Raciocínio Lógico'] = preferred.map(id => byId.get(id)).filter(Boolean);
  }

  function fixAvailabilityGrammar(){
    document.querySelectorAll('.discipline-summary').forEach(el=>{
      // Corrige formas geradas anteriormente como "disponíveleis" sem depender do contador.
      el.innerHTML = el.innerHTML
        .replace(/disponíveleis/g,'disponíveis')
        .replace(/\b([02-9]|\d{2,}) disponível\b/g,'$1 disponíveis');
    });
  }

  if(typeof renderHome === 'function'){
    const baseRenderHomeQuality=renderHome;
    renderHome=function(){baseRenderHomeQuality();fixAvailabilityGrammar()};
  }
  fixAvailabilityGrammar();
})();
