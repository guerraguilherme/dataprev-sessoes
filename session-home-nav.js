'use strict';

// Navegação direta e sempre acessível entre uma sessão e a trilha.
// Evita depender do bloco recolhível "Controles e checkpoint" para sair do estudo.
(function(){
  const style=document.createElement('style');
  style.textContent=`
    .session-page-nav{justify-content:space-between!important;align-items:center!important}
    .session-page-nav .session-trail-btn{display:inline-flex;align-items:center;gap:5px;min-width:auto!important;padding:7px 10px!important;background:#f7f9fc!important;color:var(--muted)!important;border-color:var(--line)!important;font-weight:800}
    .session-page-nav .session-arrow-group{display:flex;gap:6px;margin-left:auto}
  `;
  document.head.appendChild(style);

  function goTrail(){
    if(typeof state!=='undefined'&&state){
      try{
        if(state.timerRunning&&typeof pauseTimer==='function')pauseTimer();
        else if(typeof updateClock==='function')updateClock();
      }catch{}
      state.phase='home';
      try{saveState()}catch{}
    }
    try{renderHome()}catch{}
    try{renderStats()}catch{}
    window.scrollTo({top:0,behavior:'auto'});
  }
  window.dpGoTrail=goTrail;

  function enhanceNav(){
    const panel=document.getElementById('studyPanel');
    if(!panel||panel.classList.contains('hidden'))return;
    const nav=panel.querySelector('.session-page-nav');
    if(!nav||nav.querySelector('.session-trail-btn'))return;

    const existing=[...nav.querySelectorAll('button')];
    const group=document.createElement('span');
    group.className='session-arrow-group';
    existing.forEach(btn=>group.appendChild(btn));

    const home=document.createElement('button');
    home.type='button';
    home.className='session-trail-btn';
    home.innerHTML='<span aria-hidden="true">‹</span><span>Trilha</span>';
    home.setAttribute('aria-label','Voltar para a trilha de sessões');
    home.onclick=goTrail;
    nav.prepend(home);
    nav.appendChild(group);
  }

  const observer=new MutationObserver(()=>requestAnimationFrame(enhanceNav));
  observer.observe(document.body,{childList:true,subtree:true});
  document.addEventListener('click',()=>setTimeout(enhanceNav,0));
  setTimeout(enhanceNav,250);

  // O botão global também usa a mesma rota para evitar divergência de comportamento.
  const topHome=document.getElementById('homeBtn');
  if(topHome){topHome.textContent='Trilha';topHome.onclick=goTrail;}

  // Carrega o hotfix do relay de preparação sem depender de alterar o HTML-base.
  // Cache-bust explícito para iPhone/PWA receber a correção imediatamente após reload online.
  if(!document.querySelector('script[data-dp-generation-relay-hotfix]')){
    const hotfix=document.createElement('script');
    hotfix.src='./session-generation-relay-hotfix.js?v=083';
    hotfix.async=false;
    hotfix.dataset.dpGenerationRelayHotfix='1';
    document.head.appendChild(hotfix);
  }
})();
