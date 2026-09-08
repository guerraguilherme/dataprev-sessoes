'use strict';

// Navegação direta e sempre acessível entre uma sessão e a trilha.
// Evita depender do bloco recolhível "Controles e checkpoint" para sair do estudo.
(function(){
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

  // O botão global também usa a mesma rota para evitar divergência de comportamento.
  const topHome=document.getElementById('homeBtn');
  if(topHome){topHome.textContent='Trilha';topHome.onclick=goTrail;}

  // A entrega mobile é allowlist-only; nenhuma preparação de conteúdo é iniciada pelo shell.
})();
